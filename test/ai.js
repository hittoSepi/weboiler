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
    for(const provider of ['openai','gemini']){
      const text='{"name":"Test","root":{}}';
      reply=provider==='openai'?{output:[{content:[{type:'output_text',text}]}]}:{candidates:[{content:{parts:[{text}]}}]};
      assert.equal((await ai.generate('text',{provider,prompt:'Return JSON'},true)).text,text);
      if(provider==='openai'){assert.equal(request.body.text.format.type,'json_object');assert.equal(request.body.max_output_tokens,12000);}
      else {assert.equal(request.body.contents[0].parts[0].text,'Return JSON');assert.equal(request.body.generationConfig.responseMimeType,'application/json');}
    }
    reply={candidates:[{finishReason:'STOP',content:{parts:[{text:'{}'}]}}]};
    await ai.generate('text',{provider:'gemini',prompt:'Site JSON'},true,{purpose:'site'});
    assert.equal(request.body.generationConfig.responseJsonSchema,undefined);assert.equal(request.body.generationConfig.maxOutputTokens,24000);assert.equal(request.body.generationConfig.thinkingConfig.thinkingBudget,1024);
    ai.saveSettings({...ai.publicSettings(),geminiTextModel:'gemini-3.8-flash'});
    await ai.generate('text',{provider:'gemini',prompt:'Site JSON'},true,{purpose:'site'});
    assert.equal(request.body.generationConfig.thinkingConfig,undefined);assert.equal(request.body.generationConfig.responseJsonSchema,undefined);assert.equal(request.body.generationConfig.responseMimeType,'application/json');
    reply={output:[{content:[{type:'output_text',text:'{}'}]}]};
    await ai.generate('text',{provider:'openai',prompt:'Site JSON'},true,{purpose:'site'});assert.equal(request.body.max_output_tokens,24000);
    reply={candidates:[{finishReason:'MAX_TOKENS',content:{parts:[]}}]};
    await assert.rejects(()=>ai.generate('text',{provider:'gemini',prompt:'Site JSON'},true),/pituusraja.*ei aikakatkaisu/);
    reply={status:'incomplete',incomplete_details:{reason:'max_output_tokens'},output:[]};
    await assert.rejects(()=>ai.generate('text',{provider:'openai',prompt:'Site JSON'},true),/pituusraja/);
    reply={status:'incomplete',output:[{content:[{type:'output_text',text:'{"root":'}]}]};
    await assert.rejects(()=>ai.generate('text',{provider:'openai',prompt:'JSON'},true),/keskeytti/);
    const timeoutAI=createAI({...options,fetchImpl:async()=>{throw new DOMException('test','TimeoutError');}});
    await assert.rejects(()=>timeoutAI.generate('text',{provider:'openai',prompt:'JSON'},true,{purpose:'site'}),/aikakatkaisu \(5 min\)/);
    const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=';
    for(const provider of ['openai','gemini']){
      reply=provider==='openai'?{data:[{b64_json:png}]}:{candidates:[{content:{parts:[{inlineData:{mimeType:'image/png',data:png}}]}}]};
      const image=await ai.generate('image',{provider,prompt:'Kuva'});
      assert.ok(fs.existsSync(path.join(options.uploadsDir,path.basename(image.src))));
    }
    reply={data:[{b64_json:Buffer.from('<html>bad</html>').toString('base64')}]};
    await assert.rejects(()=>ai.generate('image',{provider:'openai',prompt:'Kuva'}),/kuvatyyppiä/);
    assert.equal(fs.readdirSync(options.uploadsDir).length,2);
    status=400;reply={error:{message:'Invalid responseJsonSchema; test-openai-key Bearer abc123',status:'INVALID_ARGUMENT',details:[{secret:'not-logged'}]}};
    await assert.rejects(()=>ai.generate('text',{prompt:'test'}),/hylkäsi pyynnön \(400\)/);
    status=401;await assert.rejects(()=>ai.generate('text',{prompt:'test'}),/401/);
    ai.saveSettings({...ai.publicSettings(),clearopenaiKey:true});
    await assert.rejects(()=>ai.generate('text',{prompt:'test'}),/puuttuu/);
    assert.equal(ai.publicSettings().hasOpenaiKey,false);
    const logs=fs.readdirSync(path.join(root,'ai-logs')).map(name=>JSON.parse(fs.readFileSync(path.join(root,'ai-logs',name),'utf8')));
    assert.ok(logs.some(log=>log.outputText==='Uusi teksti'&&log.status==='completed'));
    assert.ok(logs.some(log=>log.finishReason==='MAX_TOKENS'&&log.status==='failed'));
    assert.ok(logs.some(log=>log.errorType==='TimeoutError'));
    assert.ok(logs.some(log=>log.imagePath?.startsWith('/uploads/')));
    assert.ok(logs.some(log=>log.httpStatus===400&&log.providerError?.message.includes('responseJsonSchema')));
    assert.ok(!JSON.stringify(logs).includes('Bearer abc123'));assert.ok(!JSON.stringify(logs).includes('not-logged'));
    assert.ok(!JSON.stringify(logs).includes('test-openai-key'));assert.ok(!JSON.stringify(logs).includes(png));
    const startLog=require('../lib/ai-log')(path.join(root,'rotation'));
    fs.mkdirSync(path.join(root,'rotation'));fs.writeFileSync(path.join(root,'rotation','keep.txt'),'user file');
    for(let i=0;i<103;i++)startLog({prompt:'test'})({status:'completed'});
    assert.equal(fs.readdirSync(path.join(root,'rotation')).filter(n=>n.endsWith('.json')).length,100);assert.equal(fs.readFileSync(path.join(root,'rotation','keep.txt'),'utf8'),'user file');
    console.log('AI tests OK (mock providers; no paid API calls)');
  }finally{fs.rmSync(root,{recursive:true,force:true});}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
