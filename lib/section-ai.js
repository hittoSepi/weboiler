'use strict';
const crypto=require('node:crypto'),layout=require('./layout-builder'),layoutAI=require('./layout-ai');
function prepare(site,input){
  const prompt=String(input.prompt||'').trim();
  if(!prompt||prompt.length>6000)throw new Error('Kuvauksen pituus on 1–6000 merkkiä.');
  const page=input.pageId==='home'?site:site.pages.find(p=>p.id===input.pageId);
  const section=page?.sections.find(s=>s.id===input.sectionId);
  if(!section)throw new Error('Muokattavaa osiota ei löydy.');
  if(section.type==='custom'){
    const builder=layout.clean(site.builder),template=builder.sections.find(t=>t.id===section.templateId);
    if(!template)throw new Error('Osion pohjaa ei löydy.');
    let count=0;
    function expand(n,prefix='',depth=0){
      if(depth>8||++count>100)throw new Error('Osio on liian suuri tähän AI-muokkaukseen. Muokkaa pohjaa Omat osiot -sivulla.');
      if(n.type==='plugin')throw new Error('Plugin-elementin sisältävän osion AI-muokkausta ei vielä tueta.');
      const key=prefix?prefix+'-'+n.id:n.id;
      const result={...n,id:'node-'+count,defaults:structuredClone(n.editable?(section.content?.[key]||n.defaults):n.defaults)};
      if(n.type==='element'){
        result.type='div';result.ref='';
        const ref=builder.elements.find(t=>t.id===n.ref);if(!ref)throw new Error('Elementin pohja puuttuu.');
        result.children=[expand(ref.root,key,depth+1)];
      }else result.children=n.children.map(child=>expand(child,prefix,depth+1));
      return result;
    }
    const copy={id:crypto.randomUUID(),name:template.name+' – osion kopio',root:expand(template.root)};
    const context=layoutAI.prepare({builder:{elements:[],sections:[copy]}},{kind:'sections',targetId:copy.id,prompt});
    return {section,context,prompt:context.prompt+'\nModify only this isolated section. Preserve existing images, links and facts unless explicitly requested otherwise. Do not claim unsupported interactive functionality. Theme: '+JSON.stringify(site.theme)};
  }
  if(!['hero','text','cta','contact'].includes(section.type))throw new Error('Tämän osiotyypin AI-muokkausta ei vielä tueta. Käytä osion tavallisia muokkauskenttiä.');
  const fields=section.type==='contact'?['eyebrow','title','text']:section.type==='text'?['eyebrow','title','text','html']:['eyebrow','title','text','buttonLabel'];
  const content=Object.fromEntries(fields.map(key=>[key,section[key]||'']));
  return {section,fields,prompt:`Edit the copy of ONE existing ${section.type} section. Return ONLY a JSON object with these string fields: ${fields.join(', ')}. Preserve language, facts and meaning unless requested otherwise. Do not invent claims or contacts. No new functionality, scripts, CSS or layout changes: this native section supports copy editing only. For text sections keep text and sanitized rich HTML consistent. Current copy: ${JSON.stringify(content)}\nRequest: ${prompt}`};
}
function validate(text,context,site,clean){
  let section=structuredClone(context.section),template=null;
  if(context.context){template=layoutAI.validate(text,context.context).template;section.templateId=template.id;section.content={};}
  else{
    let value;try{value=JSON.parse(text);}catch{throw new Error('AI ei palauttanut kelvollista JSON-ehdotusta.');}
    if(!value||Array.isArray(value)||typeof value!=='object')throw new Error('Virheellinen osioehdotus.');
    for(const key of Object.keys(value)){if(!context.fields.includes(key)||typeof value[key]!=='string')throw new Error('AI muutti kenttää, jota tässä osiossa ei sallita.');section[key]=value[key];}
  }
  const builder=template?{...site.builder,sections:[...site.builder.sections,template]}:site.builder;
  const checked=clean({...site,builder,sections:[section],pages:[]});
  return {section:checked.sections[0],template:template?checked.builder.sections.find(t=>t.id===template.id):null};
}
module.exports={prepare,validate};
