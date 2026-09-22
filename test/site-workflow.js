'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const create=require('../lib/site-ai-workflow'),fixture=require('./site-ai-fixture');
const capabilities=require('../lib/ai-capabilities');
const plan={siteName:'Testi',title:'Etusivu',description:'Testi',style:'Tumma',elements:[{id:'card',name:'Kortti',brief:'Tekstikortti'}],pages:[{id:'home',slug:'',title:'Etusivu',description:'',sections:[{id:'hero',type:'hero',title:'Hero',brief:'Avaus',elementIds:[]},{id:'cards',type:'custom',title:'Kortit',brief:'Kortit',elementIds:['card']}]},{id:'contact',slug:'yhteys',title:'Yhteys',sections:[{id:'contact',type:'contact',title:'Lomake',brief:'Lomake',elementIds:[]}]}]};
async function run(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'wb-workflow-'));
 try{
  let version='v1',calls=[],fail=true;
  const ai={publicSettings:()=>({provider:'gemini'}),generate:async(kind,input,structured,options)=>{
   assert.match(input.prompt,/CAPABILITY CONTRACT/);calls.push(options);let value;
   if(options.stage==='Suunnitelma')value=plan;
   else if(options.stage==='Teema')value=fixture.theme;
   else if(options.stage.startsWith('Elementti:'))value=fixture.builder.elements[0];
   else if(options.stage==='Etusivu / Kortit'){if(fail){fail=false;throw new Error('Simuloitu aikakatkaisu');}value=fixture.builder.sections[0];}
   else value={id:'generated',type:'text',title:'Generated',text:'Testi'};
   return {text:JSON.stringify(value)};
  }};
  const options={directory:root,ai,store:{snapshot:()=>({version,site:fixture})},clean:x=>x};
  let workflow=create(options),job=workflow.create({prompt:'Testisivusto',provider:'gemini'},version);
  job=await workflow.step(job.id,0);assert.equal(job.status,'review');assert.equal(calls.length,1);
  await workflow.step(job.id,0);assert.equal(calls.length,1,'Approval must be explicit');
  job=workflow.approve(job.id,job.plan);assert.equal(job.status,'building');
  for(let i=0;i<3;i++)job=await workflow.step(job.id,job.completed);
  assert.equal(job.completed,3);
  await assert.rejects(()=>workflow.step(job.id,3),/aikakatkaisu/);
  assert.equal(workflow.read(job.id).completed,3);assert.equal(workflow.read(job.id).builder.elements.length,1);
  workflow=create(options);job=workflow.view(workflow.read(job.id));assert.match(job.error,/aikakatkaisu/);
  while(job.status!=='ready')job=await workflow.step(job.id,job.completed);
  const result=workflow.read(job.id);assert.equal(result.site.pages.length,1);assert.equal(result.site.sections.length,2);assert.ok(result.site.sections[1].templateId);assert.match(result.site.sections[0].image,/placehold.co/);
  assert.equal(calls.filter(c=>c.stage==='Elementti: Kortti').length,1);assert.ok(calls.every(c=>c.generationId===job.id));
  const count=calls.length;await workflow.step(job.id,0);assert.equal(calls.length,count);
  const formPlan=structuredClone(plan);
  formPlan.elements.push({id:'contact-form',name:'Yhteydenottolomake',brief:'Nimi, sähköposti, viesti'});
  formPlan.pages[1].sections[0].type='custom';formPlan.pages[1].sections[0].elementIds=['contact-form'];
  const normalized=create.planClean(formPlan);
  assert.equal(normalized.elements.length,1);assert.equal(normalized.pages[1].sections[0].type,'contact');
  // Simulate a persisted job from before this fix, failed after theme and card.
  const resumed=workflow.create({prompt:'WEBoiler markkinointisivusto'},version);
  const saved=workflow.read(resumed.id);
  Object.assign(saved,{plan:formPlan,status:'building',completed:2,theme:result.theme,builder:{elements:result.builder.elements,sections:[]},error:'Vaihe tuotti kielletyn elementtityypin.'});
  fs.writeFileSync(path.join(root,resumed.id+'.json'),JSON.stringify(saved));
  workflow=create(options);
  let recovered=await workflow.step(resumed.id,2);
  assert.equal(recovered.completed,3);assert.equal(calls.length,count,'Form conversion must not make a paid call');
  assert.equal(recovered.error,'');assert.equal(workflow.read(resumed.id).builder.elements.length,1);
  while(recovered.status!=='ready')recovered=await workflow.step(resumed.id,recovered.completed);
  assert.equal(workflow.read(resumed.id).site.pages[0].sections[0].type,'contact');
  assert.equal(calls.filter(c=>c.stage==='Elementti: Kortti').length,1,'Completed elements must survive resume');
  const second=workflow.create({prompt:'Testi'},version);version='changed';await assert.rejects(()=>workflow.step(second.id,0),/muuttunut/);
  assert.throws(()=>workflow.read('../bad'));
  const bad=structuredClone(plan);bad.pages[1].slug='admin';assert.throws(()=>create.planClean(bad));
  assert.deepEqual(create.planClean(plan).unsupported,[],'Old plans remain supported');
  assert.deepEqual(create.planClean({...plan,unsupported:['Verkkokaupan maksaminen tarvitsee erillisen toteutuksen.']}).unsupported,['Verkkokaupan maksaminen tarvitsee erillisen toteutuksen.']);
  assert.throws(()=>create.planClean({...plan,unsupported:[{}]}));
  assert.throws(()=>create.planClean({...plan,unsupported:['x'.repeat(1001)]}));
  assert.ok(capabilities.nodeTypes.every(type=>require('../lib/layout-builder').types.includes(type)));
  assert.ok(!capabilities.nodeTypes.includes('html'));assert.ok(!capabilities.nodeTypes.includes('plugin'));
  const enabled=require('../lib/plugins').catalog()[0];
  const context=capabilities.instructions({plugins:{[enabled.id]:{enabled:true,secret:'DO-NOT-SEND',items:[{private:'PRIVATE-CONTENT'}]}}});
  assert.ok(context.includes('"id":"'+enabled.id+'"'));assert.ok(!context.includes('DO-NOT-SEND'));assert.ok(!context.includes('PRIVATE-CONTENT'));
  assert.ok(!capabilities.instructions({}).includes('"id":"'+enabled.id+'"'),'Disabled plugins are not advertised');
  console.log('Site workflow tests OK (approval, staged construction, retry, restart, version conflicts, call correlation)');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
