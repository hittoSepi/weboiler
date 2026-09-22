'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),sharp=require('sharp');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'weboiler-transfer-'));
async function run(){
 try{
  const uploadsDir=path.join(root,'uploads'),publicDir=path.join(root,'public');fs.mkdirSync(uploadsDir);fs.mkdirSync(publicDir);
  const image=await sharp({create:{width:20,height:20,channels:3,background:'#ff8800'}}).png().toBuffer();fs.writeFileSync(path.join(uploadsDir,'test.png'),image);
  const original={meta:{title:'Siirtotesti'},sections:[{image:'/uploads/test.png',external:'https://example.test/uploads/external.png'}],pages:[],theme:{accent:'#123456'}};
  const editorFile=path.join(root,'draft.json'),liveFile=path.join(root,'live.json');for(const file of [editorFile,liveFile])fs.writeFileSync(file,JSON.stringify(original));
  const clean=input=>{assert.ok(Array.isArray(input.sections));const {meta,sections,pages,theme}=input;return {meta,sections,pages,theme};};
  const store=require('../lib/site-store')({editorFile,liveFile,clean});
  const transfer=require('../lib/site-transfer')({uploadsDir,publicDir,store,clean});
  const bundle=await transfer.exportBundle();assert.equal(bundle.assets.length,1);assert.equal((await transfer.inspect(bundle)).summary.images,1);
  bundle.site.secret='excluded';bundle.site.meta.title='Tuotu';const snapshot=store.snapshot();
  const imported=await transfer.importBundle(bundle,snapshot.version);assert.equal(imported.site.meta.title,'Tuotu');assert.equal(imported.site.secret,undefined);assert.equal(imported.site.sections[0].external,original.sections[0].external);
  assert.notEqual(imported.site.sections[0].image,original.sections[0].image);assert.deepEqual(fs.readFileSync(path.join(uploadsDir,path.basename(imported.site.sections[0].image))),image);
  assert.deepEqual(store.live(),original);assert.equal(store.history()[0].kind,'before-import');assert.deepEqual(store.historyEntry(store.history()[0].id).site,original);
  const count=fs.readdirSync(uploadsDir).length;await assert.rejects(()=>transfer.importBundle(bundle,snapshot.version),{status:409});assert.equal(fs.readdirSync(uploadsDir).length,count);
  await assert.rejects(()=>transfer.inspect({...bundle,assets:[]}),/puuttuu/);
  await assert.rejects(()=>transfer.inspect({...bundle,assets:[bundle.assets[0],bundle.assets[0]]}),/kahteen/);
  await assert.rejects(()=>transfer.inspect({...bundle,assets:[{path:'/uploads/../secret.png',data:'AAAA'}]}),/polku/);
  await assert.rejects(()=>transfer.inspect({...bundle,assets:[{...bundle.assets[0],data:'invalid!'}]}),/base64/);
  await assert.rejects(()=>transfer.inspect({...bundle,assets:[{...bundle.assets[0],data:Buffer.from('not an image').toString('base64')}]}));
  const failing=require('../lib/site-transfer')({uploadsDir,publicDir,clean,store:{snapshot:()=>imported,importDraft(){throw new Error('write failed');}}});
  await assert.rejects(()=>failing.importBundle(bundle,imported.version),/write failed/);assert.equal(fs.readdirSync(uploadsDir).length,count);
  assert.equal((await transfer.exportBundle('live')).site.meta.title,original.meta.title);
  console.log('Transfer tests OK (portable images, validation, secrets, live isolation, checkpoint, conflict, rollback)');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
