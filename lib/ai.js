'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { validateUploads } = require('./media');

module.exports = function createAI({filePath, encryptionSecret, uploadsDir, fetchImpl = fetch}) {
  const key = crypto.createHash('sha256').update(encryptionSecret).digest();
  const defaults = {enabled:false, provider:'openai', openaiTextModel:'gpt-4.1-mini', openaiImageModel:'gpt-image-1', geminiTextModel:'gemini-2.5-flash', geminiImageModel:'gemini-2.5-flash-image'};
  let busy = false;
  const read = () => fs.existsSync(filePath) ? {...defaults,...JSON.parse(fs.readFileSync(filePath,'utf8'))} : {...defaults};
  function seal(value) {
    const iv=crypto.randomBytes(12), cipher=crypto.createCipheriv('aes-256-gcm',key,iv);
    const data=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);
    return [iv,cipher.getAuthTag(),data].map(x=>x.toString('base64')).join('.');
  }
  function unseal(value) {
    const [iv,tag,data]=value.split('.').map(x=>Buffer.from(x,'base64'));
    const cipher=crypto.createDecipheriv('aes-256-gcm',key,iv);cipher.setAuthTag(tag);
    return Buffer.concat([cipher.update(data),cipher.final()]).toString('utf8');
  }
  function publicSettings() {
    const value=read();
    const {openaiKey,geminiKey,...safe}=value;
    return {...safe,hasOpenaiKey:!!openaiKey,hasGeminiKey:!!geminiKey};
  }
  function saveSettings(input) {
    const next=read();
    if(!['openai','gemini'].includes(input.provider))throw new Error('Valitse OpenAI tai Gemini.');
    next.provider=input.provider;next.enabled=input.enabled===true;
    for(const provider of ['openai','gemini']) {
      for(const kind of ['Text','Image']) {
        const name=provider+kind+'Model', value=String(input[name]||'').trim();
        if(!/^[a-zA-Z0-9._-]{1,100}$/.test(value))throw new Error('Virheellinen mallin nimi.');
        next[name]=value;
      }
      const name=provider+'Key';
      if(input['clear'+provider+'Key'])next[name]='';
      else if(typeof input[name]==='string'&&input[name].trim()) {
        if(input[name].length>1000)throw new Error('API-avain on liian pitkä.');
        next[name]=seal(input[name].trim());
      }
    }
    fs.mkdirSync(path.dirname(filePath),{recursive:true});
    const temp=filePath+'.tmp';fs.writeFileSync(temp,JSON.stringify(next,null,2),{mode:0o600});fs.renameSync(temp,filePath);
    return publicSettings();
  }
  async function generate(kind,input) {
    if(!['text','image'].includes(kind))throw new Error('Tuntematon generointityyppi.');
    const settings=read(), provider=input.provider||settings.provider;
    if(!settings.enabled)throw new Error('Ota AI käyttöön asetuksissa.');
    if(!['openai','gemini'].includes(provider)||!settings[provider+'Key'])throw new Error('Palvelun API-avain puuttuu.');
    const prompt=String(input.prompt||'').trim();
    if(!prompt||prompt.length>12000)throw new Error('Ohjeen pituuden tulee olla 1–12000 merkkiä.');
    if(busy)throw new Error('Toinen generointi on kesken. Odota sen valmistumista.');
    busy=true;
    try {
      const secret=unseal(settings[provider+'Key']);
      const model=settings[provider+(kind==='text'?'Text':'Image')+'Model'];
      let url, body, headers={'Content-Type':'application/json'};
      if(provider==='openai') {
        headers.Authorization='Bearer '+secret;
        url='https://api.openai.com/v1/'+(kind==='text'?'responses':'images/generations');
        body=kind==='text'?{model,input:prompt,instructions:'Kirjoita verkkosivun sisältöä käyttäjän ohjeella. Palauta vain ehdotettu teksti, ei HTML:ää eikä Markdownia. Älä keksi yritystä koskevia tosiasioita.',max_output_tokens:3000,store:false}:{model,prompt,n:1,size:'1024x1024'};
      } else {
        headers['x-goog-api-key']=secret;
        url=`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        body={contents:[{parts:[{text:kind==='text'?'Kirjoita verkkosivun sisältöä, vain tavallista tekstiä ilman HTML:ää tai Markdownia. Älä keksi yritystietoja.\n'+prompt:prompt}]}],generationConfig:kind==='image'?{responseModalities:['TEXT','IMAGE']}:{maxOutputTokens:4000}};
      }
      const response=await fetchImpl(url,{method:'POST',headers,body:JSON.stringify(body),signal:AbortSignal.timeout(180000)});
      if(!response.ok)throw new Error(`AI-palvelu vastasi virheellä ${response.status}. Tarkista avain, mallin käyttöoikeus ja palvelun laskutus.`);
      // Bound provider responses before parsing large base64 images.
      const reader=response.body.getReader();let size=0;const chunks=[];
      try {while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>24*1024*1024){await reader.cancel();throw new Error('AI-vastaus on liian suuri.');}chunks.push(Buffer.from(value));}}finally{reader.releaseLock();}
      const result=JSON.parse(Buffer.concat(chunks).toString('utf8'));
      const parts=result.candidates?.[0]?.content?.parts||[];
      if(kind==='text') {
        const text=provider==='openai'?(result.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('\n'):parts.filter(x=>x.text&&!x.thought).map(x=>x.text).join('\n');
        if(!text.trim())throw new Error('Palvelu ei palauttanut tekstiä. Kokeile tarkentaa ohjetta.');
        return {text:text.slice(0,30000)};
      }
      const data=provider==='openai'?{data:result.data?.[0]?.b64_json,mimeType:'image/png'}:parts.find(x=>x.inlineData)?.inlineData;
      const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[data?.mimeType];
      if(!ext||!data?.data)throw new Error('Palvelu ei palauttanut tuettua kuvaa.');
      const bytes=Buffer.from(data.data,'base64');
      if(!bytes.length||bytes.length>16*1024*1024)throw new Error('Kuvan koko ei kelpaa.');
      fs.mkdirSync(uploadsDir,{recursive:true});
      const filename=`ai-${crypto.randomUUID()}.${ext}`, file=path.join(uploadsDir,filename);
      fs.writeFileSync(file,bytes,{flag:'wx'});
      validateUploads([{path:file,filename,originalname:filename,mimetype:data.mimeType}]);
      return {src:'/uploads/'+filename};
    } catch(error) {
      if(error.name==='TimeoutError'||error.name==='AbortError')throw new Error('AI-palvelun aikakatkaisu. Tarkista palvelun käyttö ennen uutta yritystä; pyyntö saatettiin laskuttaa.');
      // Never include upstream response bodies, which can echo credentials or prompts.
      if(error instanceof SyntaxError||error instanceof TypeError)throw new Error('AI-palvelun vastausta ei voitu lukea tai yhteys katkesi.');
      throw error;
    } finally {busy=false;}
  }
  return {publicSettings,saveSettings,generate};
};
