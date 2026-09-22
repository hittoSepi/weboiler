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
if(process.argv.includes('--content-audit')){
  const fixture=JSON.parse(fs.readFileSync(process.env.EDITOR_SITE_FILE,'utf8'));
  fixture.meta={siteName:'Osioiden testisivu',title:'Osioiden testi',locale:'fi'};fixture.pages=[];fixture.navigation=[];fixture.elements=[];
  fixture.sections=[['pricing-list','Hinnasto'],['faq-list','Usein kysytyt kysymykset'],['testimonials-list','Asiakaspalautteet'],['team-list','Tiimi']].map(([type,title],index)=>({id:'audit-'+index,type,title,pluginData:{}}));
  fixture.plugins=require('../lib/plugins').clean({content:{enabled:true,plans:[{id:'basic',title:'Peruspaketti',price:'99 € / kk',text:'Esimerkkipaketti testikäyttöön.',linkLabel:'Kysy lisää',url:'#audit-3'},{id:'plus',title:'Laaja paketti',price:'199 € / kk',text:'Toinen testipaketti.'}],questions:[{id:'q1',title:'Miten palvelu toimii?',text:'Tämä on testivastaus.'}],reviews:[{id:'r1',title:'Testiasiakas',text:'Tämä on selvästi merkitty testipalaute.',role:'Testiyritys'}],people:[{id:'p1',title:'Testihenkilö',role:'Testirooli',text:'Synteettinen henkilö testausta varten.',email:'test@example.test',phone:'+358 40 0000000'}]}});
  for(const file of [process.env.EDITOR_SITE_FILE,process.env.LIVE_SITE_FILE])fs.writeFileSync(file,JSON.stringify(fixture));
}
if(process.argv.includes('--embed-audit')){
  const fixture=JSON.parse(fs.readFileSync(process.env.EDITOR_SITE_FILE,'utf8'));
  fixture.meta={siteName:'Upotusten testisivu',title:'Upotusten testi',locale:'fi'};fixture.pages=[];fixture.navigation=[];fixture.elements=[];
  // Synthetic addresses exercise loading controls, not real provider accounts.
  fixture.sections=[['map-embed','Karttatesti','https://www.google.com/maps/embed?pb=test'],['booking-embed','Ajanvaraustesti','https://calendly.com/weboiler-test-fixture/30min'],['newsletter-embed','Uutiskirjetesti','https://buttondown.com/weboiler-test-fixture?as_embed=true']].map(([type,title,url],index)=>({id:'embed-'+index,type,title,pluginData:{url,height:'400'}}));
  fixture.plugins={embeds:{enabled:true}};
  for(const [index,key] of ['AUDIT_MAP_URL','AUDIT_BOOKING_URL','AUDIT_NEWSLETTER_URL'].entries()){
    if(process.env[key])fixture.sections[index].pluginData.url=require('../lib/embeds').url(process.env[key],['map','booking','newsletter'][index]);
  }
  for(const file of [process.env.EDITOR_SITE_FILE,process.env.LIVE_SITE_FILE])fs.writeFileSync(file,JSON.stringify(fixture));
}
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
