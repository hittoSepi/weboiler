'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const siteAI=require('./site-ai'),layoutAI=require('./layout-ai'),layout=require('./layout-builder'),theme=require('./theme-ai');
const parse=text=>{try{return JSON.parse(text.trim().replace(/^```(?:json)?\s*\n([\s\S]*?)\n```$/i,'$1'));}catch{throw new Error('Vaiheen AI-vastaus ei ollut kelvollista JSON-dataa. Voit uusia vain tämän vaiheen.');}};
const capabilities=require('./ai-capabilities');
function contactElements(plan){return plan.elements.filter(e=>/contact[\s_-]*form|yhteydenottolomake|yhteydenotto[\s_-]+lomake/i.test(e.id+' '+e.name));}
function normalizeContacts(plan,retainTasks=false){
  const ids=new Set(contactElements(plan).map(e=>e.id));
  for(const page of plan.pages)for(const section of page.sections){
    if(section.type==='custom'&&section.elementIds.some(id=>ids.has(id))){
      if(section.elementIds.some(id=>!ids.has(id)))throw new Error('Yhteydenottolomake tarvitsee oman contact-osion. Erota muut elementit omaan osioonsa suunnitelmassa.');
      section.type='contact';section.elementIds=[];
    }
  }
  // Existing jobs keep their task slots so completed stages are never repeated.
  if(!retainTasks)plan.elements=plan.elements.filter(e=>!ids.has(e.id));
  return plan;
}
function checkTemplate(template){function visit(n){if(!capabilities.nodeTypes.includes(n.type))throw new Error('Vaihe tuotti kielletyn elementtityypin. Pyydä uusi yritys.');n.defaults.image='';n.children.forEach(visit);}visit(template.root);return template;}
function planClean(value){
  const str=(v,max=2000)=>{if(typeof v!=='string'||v.length>max)throw new Error('Suunnitelman tekstikenttä ei kelpaa.');return v.trim();};
  const id=v=>{if(!/^[a-z][a-z0-9-]{0,39}$/.test(v||''))throw new Error('Suunnitelman tunnisteessa käytetään pieniä kirjaimia ja yhdysmerkkejä (enintään 40).');return v;};
  const list=(v,max,min=0)=>{if(!Array.isArray(v)||v.length>max||v.length<min)throw new Error('Suunnitelman listan koko ei kelpaa.');return v;};
  const unique=items=>{if(new Set(items.map(x=>x.id)).size!==items.length)throw new Error('Suunnitelmassa on päällekkäisiä tunnisteita.');return items;};
  const elements=unique(list(value.elements,12).map(e=>({id:id(e.id),name:str(e.name,100),brief:str(e.brief)})));
  const pages=unique(list(value.pages,6,1).map((p,i)=>{
    const pageId=id(p.id),slug=str(p.slug,100);
    if(i===0&&(pageId!=='home'||slug!==''))throw new Error('Ensimmäisen sivun tunnisteen tulee olla home ja osoitteen tyhjä.');
    if(i>0&&(pageId==='home'||! /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||['admin','api','assets','uploads','vendor','media'].includes(slug)))throw new Error('Alasivun osoite ei kelpaa.');
    return {id:pageId,slug,title:str(p.title,140),description:str(p.description||'',300),sections:unique(list(p.sections,8,1).map(s=>{
      if(!Object.hasOwn(capabilities.sections,s.type))throw new Error('Suunnitelman osiotyyppi ei kelpaa.');
      const refs=list(s.elementIds||[],12).map(id);if(refs.some(ref=>!elements.some(e=>e.id===ref)))throw new Error('Suunnitelmassa viitataan puuttuvaan elementtiin.');
      return {id:id(s.id),type:s.type,title:str(s.title,180),brief:str(s.brief),elementIds:refs};
    }))};
  }));
  if(new Set(pages.map(p=>p.slug)).size!==pages.length)throw new Error('Sivun osoite on jo käytössä.');
  if(pages.flatMap(p=>p.sections).filter(s=>s.type==='custom').length>16)throw new Error('Enintään 16 omaa osiopohjaa.');
  return normalizeContacts({siteName:str(value.siteName,80),title:str(value.title,140),description:str(value.description||'',300),style:str(value.style),elements,pages,unsupported:list(value.unsupported??[],20).map(item=>str(item,1000)).filter(Boolean)});
}
module.exports=function createWorkflow({directory,ai,store,clean}){
  const locks=new Set();
  const file=id=>{if(!/^[a-f0-9-]{36}$/.test(id))throw new Error('Virheellinen työn tunniste.');return path.join(directory,id+'.json');};
  function write(job){fs.mkdirSync(directory,{recursive:true,mode:0o700});job.updatedAt=new Date().toISOString();const target=file(job.id),temp=target+'.tmp';fs.writeFileSync(temp,JSON.stringify(job),{mode:0o600});fs.renameSync(temp,target);}
  function read(id){return JSON.parse(fs.readFileSync(file(id),'utf8'));}
  function current(job){if(store.snapshot().version!==job.version){const e=new Error('Sivuston luonnos on muuttunut. Aloita uusi suunnitelma nykyisestä luonnoksesta.');e.status=409;throw e;}}
  function tasks(job){if(!job.plan)return [{kind:'plan',label:'Suunnitelma'}];return [{kind:'theme',label:'Teema'},...job.plan.elements.map(e=>({kind:'element',id:e.id,label:'Elementti: '+e.name})),...job.plan.pages.flatMap(p=>p.sections.map(s=>({kind:'section',page:p.id,id:s.id,label:p.title+' / '+s.title}))),{kind:'assemble',label:'Sivujen kokoaminen ja tarkistus'}];}
  function view(job){return {id:job.id,version:job.version,provider:job.provider,brief:job.brief,status:job.status,plan:job.plan,error:job.error||'',completed:job.completed,total:tasks(job).length,next:tasks(job)[job.completed]?.label||'',updatedAt:job.updatedAt};}
  function list(){if(!fs.existsSync(directory))return [];return fs.readdirSync(directory).filter(n=>/^[a-f0-9-]{36}\.json$/.test(n)).map(n=>view(read(n.slice(0,-5)))).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));}
  function create(input,version){siteAI.prepare(input);if(store.snapshot().version!==version)throw new Error('Luonnos muuttui. Avaa velho uudelleen.');if(list().length>=50)throw new Error('Tallessa on 50 AI-työtä. Poista vanhoja töitä palvelimen ai-workflows-hakemistosta.');const job={id:crypto.randomUUID(),version,brief:input.prompt,provider:input.provider||ai.publicSettings().provider,status:'planning',completed:0,plan:null,builder:{elements:[],sections:[]},pageSections:{},attempts:[]};write(job);return view(job);}
  async function step(id,expected){
    if(locks.has(id))throw new Error('Tämän työn vaihe on jo käynnissä.');locks.add(id);
    let job;
    try{
      job=read(id);current(job);
      if(job.status==='review'||job.status==='ready'||job.status==='applied'||job.completed!==expected)return view(job);
      if(job.plan)normalizeContacts(job.plan,true);
      const task=tasks(job)[job.completed];if(!task)throw new Error('Vaihetta ei löydy.');
      const attempt={step:job.completed,kind:task.kind,label:task.label,startedAt:new Date().toISOString(),status:'running'};job.attempts.push(attempt);job.error='';write(job);
      const ask=async prompt=>(await ai.generate('text',{provider:job.provider,prompt:prompt+'\n'+capabilities.instructions(store.snapshot().site)},true,{purpose:'site-step',generationId:job.id,stage:task.label})).text;
      if(task.kind==='plan'){
        job.plan=planClean(parse(await ask(`Plan a Weboiler website, NOT its code or full layout. Return JSON {siteName,title,description,style,elements:[{id,name,brief}],pages:[{id,slug,title,description,sections:[{id,type,title,brief,elementIds:[]}]}]}. Finnish unless requested otherwise. First page id home, slug empty. At most5 additional pages,8 sections/page,12 elements,16 custom sections. IDs lowercase letters/digits/hyphens <=40. Types hero,text,cta,contact,custom. Prefer native sections for simple text, use custom for cards/layouts. Elements are independent reusable leaf templates: no cross-element dependencies. elementIds must refer to planned elements. Describe only what is needed. No invented business facts, contact details, claims or testimonials. Include image ideas in brief, maximum12 image slots overall. style describes colors, fonts, mood. Preserve user constraints.\nUser brief: ${job.brief}`)));
        job.status='review';
      }else if(task.kind==='theme')job.theme=theme.validate(await ask(theme.prepare({}, {prompt:job.plan.style})));
      else if(task.kind==='element'){
        const descriptor=job.plan.elements.find(e=>e.id===task.id);
        if(!contactElements(job.plan).some(e=>e.id===descriptor.id)){
        const context=layoutAI.prepare({builder:{elements:[],sections:[]}},{kind:'elements',prompt:JSON.stringify(descriptor)+'\nTheme: '+JSON.stringify(job.theme)+'\nUse only native nodes; no element references. Do not invent facts.'});context.id=descriptor.id;
        const result=layoutAI.validate(await ask(context.prompt),context).template;
        job.builder.elements.push(checkTemplate(result));
        }
      }else if(task.kind==='section'){
        const p=job.plan.pages.find(p=>p.id===task.page),s=p.sections.find(s=>s.id===task.id);
        let section;
        if(s.type==='custom'){
          const context=layoutAI.prepare({builder:job.builder},{kind:'sections',prompt:JSON.stringify(s)+'\nPage: '+p.title+'\nTheme: '+JSON.stringify(job.theme)+'\nSet meaningful defaults for this section; image URL empty and descriptive alt. Never invent facts.'});
          context.prompt+='\nOriginal brief: '+job.brief+'\nAvailable element definitions: '+JSON.stringify(job.builder.elements.filter(e=>s.elementIds.includes(e.id)));
          // Template identifiers stay within the existing 80-character layout limit.
          context.id='s-'+crypto.createHash('sha256').update(p.id+'/'+s.id).digest('hex').slice(0,24);
          const result=layoutAI.validate(await ask(context.prompt),context).template;job.builder.sections.push(checkTemplate(result));
          section={id:s.id,type:'custom',templateId:result.id,content:{}};
        }else{
          const value=parse(await ask(`Create ONE Weboiler section JSON {id,type,title,text,buttonLabel,buttonUrl,email,phone}. Fixed type ${s.type}. Contact uses the built-in form, no HTML needed. Links only to these pages: ${job.plan.pages.map(p=>'/'+p.slug).join(', ')}. No images or HTML. Omit unknown contact facts. Do not invent claims. Write concise publishable copy based only on brief.\nOriginal brief: ${job.brief}\nSection: ${JSON.stringify(s)}`));
          section=clean({sections:[{...value,id:s.id,type:s.type}]}).sections[0];
        }
        (job.pageSections[p.id]??=[]).push(section);
      }else{
        const p=job.plan;
        const raw={meta:{siteName:p.siteName,title:p.title,description:p.description},theme:job.theme,builder:job.builder,sections:job.pageSections.home,pages:p.pages.slice(1).map(page=>({...page,sections:job.pageSections[page.id]})),footer:{text:p.siteName}};
        job.site=siteAI.validate(JSON.stringify(raw),store.snapshot().site,clean);job.status='ready';
      }
      siteAI.images({builder:job.builder,sections:Object.values(job.pageSections).flat(),pages:[]});
      current(job);attempt.status='completed';attempt.finishedAt=new Date().toISOString();
      if(task.kind!=='plan')job.completed++;
      write(job);return view(job);
    }catch(error){if(job){const persisted=read(id);persisted.error=error.message;const a=persisted.attempts.at(-1);if(a?.status==='running'){a.status='failed';a.error=error.message;}write(persisted);}throw error;}
    finally{locks.delete(id);}
  }
  function approve(id,value){if(locks.has(id))throw new Error('Vaihe on käynnissä.');const job=read(id);current(job);if(job.status!=='review')throw new Error('Suunnitelmaa ei voi enää muuttaa tässä työssä.');job.plan=planClean(value);job.status='building';job.completed=0;write(job);return view(job);}
  function updateReady(id,site,applied=false){const job=read(id);if(job.status!=='ready')throw new Error('Työ ei ole valmis.');job.site=site;if(applied)job.status='applied';write(job);}
  return {create,list,read,view,step,approve,updateReady};
};
module.exports.planClean=planClean;
