'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const createAI=require('../lib/ai');
async function run(){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'weboiler-ai-'));
  try{
    let reply,request,calls=0,status=200;
    const options={filePath:path.join(root,'ai.json'),uploadsDir:path.join(root,'uploads'),encryptionSecret:'test-only-secret',fetchImpl:async(url,opts)=>{calls++;request={url,...opts,body:JSON.parse(opts.body)};return new Response(JSON.stringify(reply),{status});}};
    let ai=createAI(options);
    await assert.rejects(()=>ai.generate('text',{prompt:'test'}),/käyttöön/);assert.equal(calls,0);
    const settings={...ai.publicSettings(),enabled:true,openaiKey:'test-openai-key',geminiKey:'test-gemini-key'};
    ai.saveSettings(settings);
    assert.ok(!fs.readFileSync(options.filePath,'utf8').includes('test-openai-key'));
    assert.equal(ai.publicSettings().openaiKey,undefined);
    ai=createAI(options);ai.saveSettings({...ai.publicSettings(),openaiKey:''});
    reply={output:[{content:[{type:'output_text',text:'Uusi teksti'}]}]};
    assert.equal((await ai.generate('text',{provider:'openai',prompt:'Kirjoita'})).text,'Uusi teksti');
    assert.equal(request.headers.Authorization,'Bearer test-openai-key');assert.equal(request.body.store,false);
    reply={candidates:[{content:{parts:[{text:'Ajatus',thought:true},{text:'Gemini teksti'}]}}]};
    assert.equal((await ai.generate('text',{provider:'gemini',prompt:'Kirjoita'})).text,'Gemini teksti');
    assert.equal(request.headers['x-goog-api-key'],'test-gemini-key');assert.ok(request.url.startsWith('https://generativelanguage.googleapis.com/'));
    const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
    for(const provider of ['openai','gemini']){
      reply=provider==='openai'?{data:[{b64_json:png}]}:{candidates:[{content:{parts:[{inlineData:{mimeType:'image/png',data:png}}]}}]};
      const image=await ai.generate('image',{provider,prompt:'Kuva'});
      assert.ok(fs.existsSync(path.join(options.uploadsDir,path.basename(image.src))));
    }
    reply={data:[{b64_json:Buffer.from('<html>bad</html>').toString('base64')}]};
    await assert.rejects(()=>ai.generate('image',{provider:'openai',prompt:'Kuva'}),/kuvatyyppiä/);
    assert.equal(fs.readdirSync(options.uploadsDir).length,2);
    status=401;await assert.rejects(()=>ai.generate('text',{prompt:'test'}),/401/);
    ai.saveSettings({...ai.publicSettings(),clearopenaiKey:true});
    await assert.rejects(()=>ai.generate('text',{prompt:'test'}),/puuttuu/);
    assert.equal(ai.publicSettings().hasOpenaiKey,false);
    console.log('AI tests OK (mock providers; no paid API calls)');
  }finally{fs.rmSync(root,{recursive:true,force:true});}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
