'use strict';

// Isolated browser test environment. Never writes the user's site or mail data.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'weboiler-browser-'));
process.env.NODE_ENV = 'test';
process.env.ADMIN_USER = 'test-admin';
process.env.ADMIN_PASSWORD = 'browser-test-only';
process.env.SESSION_SECRET = 'isolated-browser-test-secret-32-characters';
process.env.UPLOADS_DIR = path.join(root,'uploads');
process.env.AI_SETTINGS_FILE = path.join(root,'ai.json');
for (const [key,file] of Object.entries({EDITOR_SITE_FILE:'site-editor.json',LIVE_SITE_FILE:'site-live.json',MESSAGES_FILE:'messages.json',ANALYTICS_FILE:'analytics.json',ADMIN_AUTH_FILE:'auth.json',MAIL_SETTINGS_FILE:'mail.json'})) process.env[key] = path.join(root,file);
for (const name of ['site-editor.json','site-live.json']) fs.copyFileSync(path.join(__dirname,'..','data',name),path.join(root,name));
// Browser-only opt-in fixture: no network calls or real credentials.
if(process.argv.includes('--mock-ai')) {
  const createAI=require('../lib/ai');
  require.cache[require.resolve('../lib/ai')].exports=options=>{
    const ai=createAI({...options,fetchImpl:async()=>new Response(JSON.stringify({output:[{content:[{type:'output_text',text:'Testattu AI-luonnos selaimessa'}]}]}))});
    ai.saveSettings({...ai.publicSettings(),enabled:true,openaiKey:'fake-local-test-key'});
    return ai;
  };
}
const server = require('../server').listen(3191,'127.0.0.1',()=>console.log('Isolated browser test: http://127.0.0.1:3191'));
function close() {server.close(()=>{fs.rmSync(root,{recursive:true,force:true});process.exit(0);});}
process.on('SIGINT',close);
process.on('SIGTERM',close);
