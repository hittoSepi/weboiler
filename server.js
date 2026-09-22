'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ quiet: true });
const express = require('express');
const multer = require('multer');
const sanitizeHtml = require('sanitize-html');
const renderSite = require('./views/site');
const createAnalytics = require('./lib/analytics');
const createAuthStore = require('./lib/auth-store');
const createMailer = require('./lib/mailer');
const createSiteStore = require('./lib/site-store');
const { validateUploads } = require('./lib/media');
const validate = require('./lib/validation');
const {validatePages,selectPage} = require('./lib/pages');
const plugins = require('./lib/plugins');
const imagePresentation = require('./lib/image-presentation');

const app = express();
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const UPLOADS = path.resolve(ROOT, process.env.UPLOADS_DIR || 'public/uploads');
const EDITOR_SITE_FILE = path.resolve(ROOT, process.env.EDITOR_SITE_FILE || 'data/site-editor.json');
const LIVE_SITE_FILE = path.resolve(ROOT, process.env.LIVE_SITE_FILE || 'data/site-live.json');
const MESSAGE_FILE = path.resolve(ROOT, process.env.MESSAGES_FILE || 'data/yhteydenotot.json');
const ANALYTICS_FILE = path.resolve(ROOT, process.env.ANALYTICS_FILE || 'data/analytics.json');
const AUTH_FILE = path.resolve(ROOT, process.env.ADMIN_AUTH_FILE || 'data/admin-auth.json');
const MAIL_FILE = path.resolve(ROOT, process.env.MAIL_SETTINGS_FILE || 'data/mail-settings.json');
const PORT = Number(process.env.PORT || 3100);
const PRODUCTION = process.env.NODE_ENV === 'production';
const SECRET = require('./lib/secret')({provided:process.env.SESSION_SECRET,production:PRODUCTION,file:path.join(ROOT,'data','local-secret')});
const sessions = new Map();
const attempts = new Map();
const analytics = createAnalytics({ filePath: ANALYTICS_FILE });
const auth = createAuthStore({ filePath: AUTH_FILE, fallbackUsername: process.env.ADMIN_USER || 'admin', fallbackPassword: process.env.ADMIN_PASSWORD || (PRODUCTION ? '' : 'admin') });
const mailer = createMailer({ filePath: MAIL_FILE, encryptionSecret: SECRET });
const ai = require('./lib/ai')({filePath:path.resolve(ROOT,process.env.AI_SETTINGS_FILE||'data/ai-settings.json'),encryptionSecret:SECRET,uploadsDir:UPLOADS});

if (PRODUCTION && ((!process.env.ADMIN_PASSWORD && !fs.existsSync(AUTH_FILE)) || !process.env.SESSION_SECRET || SECRET.length < 32)) throw new Error('Tuotanto vaatii admin-salasanan ja vähintään 32-merkkisen SESSION_SECRET-arvon.');
fs.mkdirSync(UPLOADS, { recursive: true });
const imageVariants = require('./lib/image-variants')(UPLOADS);
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));
app.use((req, res, next) => { res.setHeader('X-Content-Type-Options','nosniff'); res.setHeader('X-Frame-Options','SAMEORIGIN'); res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data: https: http:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-src 'self' https://www.google.com https://calendly.com https://buttondown.com; frame-ancestors 'self'; form-action 'self'"); next(); });
app.use('/assets', express.static(PUBLIC, { index:false, maxAge:PRODUCTION?'1d':0 }));
app.use('/uploads', express.static(UPLOADS, { index:false, maxAge:'7d' }));
app.get('/media/:file/:width',async(req,res)=>{try{const file=await imageVariants.variant(req.params.file,req.params.width);res.set('Cache-Control','public, max-age=604800').type('webp').sendFile(file,{dotfiles:'allow'});}catch(error){res.status(error.status||422).type('text').send(error.status?error.message:'Kuvaversiota ei voitu muodostaa.');}});
app.use('/vendor/fontawesome', express.static(path.join(ROOT, 'node_modules', '@fortawesome', 'fontawesome-free'), { index:false, maxAge:'30d' }));

const readJson = (file, fallback) => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file,'utf8')) : fallback;
function writeJson(file, value) { const temp=`${file}.${process.pid}.tmp`; fs.mkdirSync(path.dirname(file),{recursive:true}); fs.writeFileSync(temp,`${JSON.stringify(value,null,2)}\n`); fs.renameSync(temp,file); }
const siteStore = createSiteStore({ editorFile: EDITOR_SITE_FILE, liveFile: LIVE_SITE_FILE, clean: cleanSite });
const siteTransfer = require('./lib/site-transfer')({uploadsDir:UPLOADS,publicDir:PUBLIC,store:siteStore,clean:cleanSite});
const readEditorSite = () => siteStore.draft();
const readLiveSite = () => siteStore.live();
const text = (value, max=4000) => String(value || '').trim().slice(0,max);
const iconName = (value) => text(value, 80).replace(/[^a-z0-9-]/gi, '');
const richText = (value) => sanitizeHtml(String(value || '').slice(0,30000), {
  allowedTags:['p','br','strong','em','u','s','a','ul','ol','li','h3','h4','blockquote'],
  allowedAttributes:{a:['href','target','rel']}, allowedSchemes:['http','https','mailto','tel'],
  transformTags:{a:sanitizeHtml.simpleTransform('a',{rel:'noopener noreferrer'},true)}
});
function cleanSite(input) {
  if (!input || !Array.isArray(input.sections)) throw new Error('Virheellinen sivustodata.');
  validate.sections(input.sections);
  validate.list(input.navigation,50,'Navigaatio');
  validate.list(input.elements,40,'Omat elementit');
  require('./lib/languages').validate({...input,meta:input.meta||{},pages:input.pages||[]});
  const allowed = new Set(['hero','text','features','gallery','carousel','cta','contact',...plugins.types()]);
  return {
    pages:validatePages(input.pages,sections=>cleanSite({sections}).sections),
    plugins:plugins.clean(input.plugins,require('./lib/languages').locale(input.meta?.locale)),
    meta: { locale:require('./lib/languages').locale(input.meta?.locale), ...require('./lib/seo').fields(input.meta), siteName:text(input.meta?.siteName,80), title:text(input.meta?.title,140), description:text(input.meta?.description,300), siteUrl:text(input.meta?.siteUrl,500), logo:validate.url(input.meta?.logo,true), logoAlt:text(input.meta?.logoAlt,120) },
    theme: { background:validate.color(input.theme?.background,'#07101c'), surface:validate.color(input.theme?.surface,'#101b2a'), text:validate.color(input.theme?.text,'#f6f3eb'), muted:validate.color(input.theme?.muted,'#aab4c1'), accent:validate.color(input.theme?.accent,'#f29a2e'), font:validate.font(input.theme?.font), headingFont:validate.font(input.theme?.headingFont), maxWidth:Math.min(1800,Math.max(800,Number(input.theme?.maxWidth)||1280)), radius:Math.min(40,Math.max(0,Number(input.theme?.radius)||0)) },
    navigation:(input.navigation||[]).slice(0,50).map((x)=>({label:text(x.label,60),target:text(x.target,200)})),
    sections: input.sections.slice(0, 30).map((section) => ({
      id: text(section.id, 80).replace(/[^a-zA-Z0-9_-]/g, '-'),
      pluginData:plugins.cleanSection(section),
      type: allowed.has(section.type) ? section.type : (()=>{throw new Error('Tuntematon osiotyyppi.');})(),
      eyebrow: text(section.eyebrow, 100),
      title: text(section.title, 180),
      text: text(section.text, 5000),
      html: richText(section.html),
      buttonLabel: text(section.buttonLabel, 80),
      buttonUrl: validate.url(section.buttonUrl),
      image: validate.url(section.image,true),
      imagePosition: imagePresentation.position(section.imagePosition),
      email: text(section.email, 200),
      phone: text(section.phone, 60),
      form: section.type==='contact'?require('./lib/forms').clean(section.form):null,
      icon: iconName(section.icon),
      iconColor: validate.color(section.iconColor,''),
      iconSize: Math.min(160, Math.max(12, Number(section.iconSize) || 40)),
      interval: Math.min(20, Math.max(3, Number(section.interval) || 5)),
      items: Array.isArray(section.items) ? section.items.slice(0, 20).map((item) => ({
        title: text(item.title, 140),
        text: text(item.text, 1000),
        image: validate.url(item.image,true),
        imagePosition: imagePresentation.position(item.imagePosition),
        imageAlt: text(item.imageAlt,200),
        url: validate.url(item.url),
        linkLabel: text(item.linkLabel,80),
        icon: iconName(item.icon),
        iconColor: validate.color(item.iconColor,''),
        iconSize: Math.min(120, Math.max(12, Number(item.iconSize) || 32))
      })) : [],
      images: Array.isArray(section.images) ? section.images.slice(0, 40).map((image) => ({
        src: validate.url(image.src,true),
        imagePosition: imagePresentation.position(image.imagePosition),
        alt: text(image.alt, 300),
        url: validate.url(image.url)
      })) : []
    })),
    elements: Array.isArray(input.elements) ? input.elements.slice(0,40).map(element => ({
      id: text(element.id,80).replace(/[^a-zA-Z0-9_-]/g,'-'),
      name: text(element.name,100),
      section: cleanSite({sections:[element.section],elements:[]}).sections[0]
    })) : [],
    footer:{text:text(input.footer?.text,120)}
  };
}

function cookie(req) {
  try { return Object.fromEntries((req.headers.cookie||'').split(';').filter(Boolean).map(value=>{const index=value.indexOf('=');return [value.slice(0,index).trim(),decodeURIComponent(value.slice(index+1))];})); }
  catch { return {}; }
}
function sign(token) { return `${token}.${crypto.createHmac('sha256',SECRET).update(token).digest('base64url')}`; }
function session(req) {
  const value=cookie(req).wb_session||'';
  const index=value.lastIndexOf('.');
  if(index<1)return null;
  const token=value.slice(0,index);
  const signature=Buffer.from(value.slice(index+1));
  const expected=Buffer.from(crypto.createHmac('sha256',SECRET).update(token).digest('base64url'));
  if(signature.length!==expected.length||!crypto.timingSafeEqual(signature,expected))return null;
  const found=sessions.get(token);
  if(!found)return null;
  if(found.expires<Date.now()){sessions.delete(token);return null;}
  return {token,...found};
}
function requireAuth(req,res,next){const found=session(req);if(!found)return res.status(401).json({error:'Kirjautuminen vaaditaan.'});req.session=found;next();}
function csrf(req,res,next){if((req.get('x-csrf-token')||req.body?._csrf)!==req.session.csrf)return res.status(403).json({error:'Turvatunniste ei täsmää.'});next();}

const upload = multer({ storage:multer.diskStorage({destination:(_r,_f,cb)=>cb(null,UPLOADS),filename:(_r,file,cb)=>{const ext={"image/jpeg":".jpg","image/png":".png","image/webp":".webp","image/gif":".gif"}[file.mimetype];cb(null,`${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext||''}`)}}), limits:{fileSize:8*1024*1024,files:20}, fileFilter:(_r,file,cb)=>cb(null,['image/jpeg','image/png','image/webp','image/gif'].includes(file.mimetype)) });

app.get('/',(_req,res)=>res.type('html').send(renderSite(readLiveSite())));
app.get('/admin/login',(_req,res)=>res.sendFile(path.join(PUBLIC,'login.html')));
app.use(['/admin', '/api/admin'], (_req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
app.get('/admin/esikatselu',(req,res)=>{if(!session(req))return res.redirect('/admin/login');const draft=readEditorSite();const site=req.query.plugin?plugins.detail(draft,req.query.plugin,req.query.item,{preview:true}):selectPage(draft,req.query.page||'');if(!site)return res.status(404).send('Sivua ei löytynyt.');res.set('X-Robots-Tag','noindex, nofollow').type('html').send(renderSite(site,{preview:true}));});
app.get(['/admin','/admin/yhteydenotot','/admin/editori','/admin/elementit','/admin/media','/admin/teema','/admin/asetukset','/admin/historia','/admin/plugins','/admin/siirto'],(req,res)=>session(req)?res.sendFile(path.join(PUBLIC,'admin.html')):res.redirect('/admin/login'));
app.get('/admin/historia/:id',(req,res)=>{if(!session(req))return res.redirect('/admin/login');try{const snapshot=siteStore.historyEntry(req.params.id).site;const site=req.query.plugin?plugins.detail(snapshot,req.query.plugin,req.query.item,{preview:true}):selectPage(snapshot,req.query.page||'');if(!site)return res.status(404).send('Sivua ei löytynyt.');res.set('X-Robots-Tag','noindex, nofollow').type('html').send(renderSite(site,{preview:true,previewBase:'/admin/historia/'+req.params.id}));}catch(error){res.status(error.status||400).type('text').send(error.message);}});
app.post('/api/analytics/visit',(req,res)=>{analytics.record(req.body||{});res.status(204).end();});
app.post('/api/contact',async(req,res)=>{try{if(text(req.body.website,100))return res.status(201).json({ok:true});const custom=req.body.formId?require('./lib/forms').submission(readLiveSite(),req.body):null;const message={id:crypto.randomUUID(),createdAt:new Date().toISOString(),name:text(req.body.name,120),email:text(req.body.email,200),phone:text(req.body.phone,60),message:text(req.body.message,3000),...(custom?.message||{})};if(!custom&&(!message.name||!message.message||(!message.email&&!message.phone)))throw new Error('Täytä nimi, viesti ja yhteystieto.');const list=readJson(MESSAGE_FILE,[]);list.unshift(message);writeJson(MESSAGE_FILE,list);res.status(201).json({ok:true});setImmediate(()=>mailer.sendContact(message,custom?.recipient||'').catch(console.error));}catch(error){res.status(400).json({error:error.message});}});
app.post('/api/admin/login',(req,res)=>{
  const now=Date.now();
  for(const [key,value] of attempts)if(value.expires<now)attempts.delete(key);
  for(const [token,value] of sessions)if(value.expires<now)sessions.delete(token);
  const key=req.ip;
  const record=attempts.get(key)||{count:0,expires:now+15*60*1000};
  if(record.count>=10)return res.status(429).set('Retry-After',String(Math.ceil((record.expires-now)/1000))).json({error:'Liian monta yritystä. Yritä uudelleen 15 minuutin kuluttua.'});
  if(typeof req.body?.username!=='string'||typeof req.body?.password!=='string'||req.body.username.length>100||req.body.password.length>1000||!auth.authenticate(req.body.username,req.body.password)){
    record.count++;attempts.set(key,record);return res.status(401).json({error:'Väärä käyttäjätunnus tai salasana.'});
  }
  attempts.delete(key);
  const token=crypto.randomBytes(32).toString('base64url');
  sessions.set(token,{csrf:crypto.randomBytes(24).toString('base64url'),expires:now+28800000});
  res.setHeader('Set-Cookie',`wb_session=${sign(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${PRODUCTION?'; Secure':''}`);
  res.json({ok:true});
});
app.get('/api/admin/session',requireAuth,(req,res)=>res.json({csrf:req.session.csrf,...siteStore.snapshot()}));
app.get('/api/admin/plugins',requireAuth,(_req,res)=>res.json({plugins:plugins.catalog()}));
app.get('/api/admin/export',requireAuth,async(req,res)=>{try{const bundle=await siteTransfer.exportBundle(req.query.source||'draft');res.attachment('weboiler-site.json').json(bundle);}catch(error){res.status(400).json({error:error.message});}});
const bundleUpload=multer({storage:multer.memoryStorage(),limits:{fileSize:48*1024*1024,files:1,fields:0}}).single('bundle');
app.post('/api/admin/import/:action',requireAuth,csrf,bundleUpload,async(req,res)=>{try{if(!req.file)throw new Error('Valitse siirtopaketti.');const bundle=JSON.parse(req.file.buffer.toString('utf8'));if(req.params.action==='inspect')return res.json({summary:(await siteTransfer.inspect(bundle)).summary});if(req.params.action!=='apply')return res.status(404).json({error:'Tuntematon tuontitoiminto.'});res.json(await siteTransfer.importBundle(bundle,req.get('x-site-version')));}catch(error){res.status(error.status||400).json({error:error instanceof SyntaxError?'Tiedosto ei ole kelvollista JSON-dataa.':error.message});}});
app.get('/api/admin/history',requireAuth,(_req,res)=>{try{res.json({entries:siteStore.history()});}catch(error){res.status(400).json({error:error.message});}});
app.post('/api/admin/history/:id/restore',requireAuth,csrf,(req,res)=>{try{res.json(siteStore.restore(req.params.id,req.get('x-site-version')));}catch(error){res.status(error.status||400).json({error:error.message});}});
app.put('/api/admin/site',requireAuth,csrf,(req,res)=>{try{res.json({ok:true,...siteStore.save(req.body,req.get('x-site-version'))});}catch(error){res.status(error.status||400).json({error:error.message});}});
app.post('/api/admin/publish',requireAuth,csrf,(req,res)=>{try{res.json({ok:true,...siteStore.publish(req.get('x-site-version'))});}catch(error){res.status(error.status||400).json({error:error.message});}});
app.get('/api/admin/messages',requireAuth,(_req,res)=>res.json({messages:readJson(MESSAGE_FILE,[])}));
app.get('/api/admin/dashboard',requireAuth,(_req,res)=>{const messages=readJson(MESSAGE_FILE,[]);res.json({analytics:analytics.summary(messages),recentMessages:messages.slice(0,5)});});
app.get('/api/admin/media',requireAuth,(_req,res)=>res.json({files:fs.readdirSync(UPLOADS,{withFileTypes:true}).filter(x=>x.isFile()&&x.name!=='.gitkeep').map(x=>({name:x.name,src:`/uploads/${x.name}`}))}));
app.post('/api/admin/uploads',requireAuth,csrf,upload.array('images',20),(req,res)=>{try{if(!req.files?.length)return res.status(400).json({error:'Valitse PNG-, JPEG-, WebP- tai GIF-kuvia.'});res.status(201).json({files:validateUploads(req.files)});}catch(error){res.status(400).json({error:error.message});}});
const iconNames = fs.readdirSync(path.join(ROOT,'node_modules','@fortawesome','fontawesome-free','svgs','solid')).filter(name=>name.endsWith('.svg')).map(name=>name.slice(0,-4));
app.get('/api/admin/icons',requireAuth,(_req,res)=>res.json({icons:iconNames}));
app.get('/api/admin/mail-settings',requireAuth,(_req,res)=>res.json({settings:mailer.publicSettings()}));
app.get('/api/admin/ai-settings',requireAuth,(_req,res)=>res.json({settings:ai.publicSettings()}));
app.put('/api/admin/ai-settings',requireAuth,csrf,(req,res)=>{try{res.json({settings:ai.saveSettings(req.body)});}catch(error){res.status(400).json({error:error.message});}});
app.post('/api/admin/ai/:kind',requireAuth,csrf,async(req,res)=>{try{res.json(await ai.generate(req.params.kind,req.body));}catch(error){res.status(400).json({error:error.message});}});
app.put('/api/admin/mail-settings',requireAuth,csrf,(req,res)=>{try{res.json({settings:mailer.saveSettings(req.body)});}catch(error){res.status(400).json({error:error.message});}});
app.post('/api/admin/mail-settings/test',requireAuth,csrf,async(_req,res)=>{try{const result=await mailer.sendTest();if(result.skipped)throw new Error('Sähköpostipalvelu ei ole käytössä.');res.json({ok:true});}catch(error){res.status(400).json({error:error.message});}});
app.get('/api/admin/auth-settings',requireAuth,(_req,res)=>res.json({settings:auth.publicSettings()}));
app.put('/api/admin/auth-settings',requireAuth,csrf,(req,res)=>{try{auth.update(req.body);sessions.clear();res.setHeader('Set-Cookie','wb_session=; Path=/; Max-Age=0');res.json({relogin:true});}catch(error){res.status(400).json({error:error.message});}});
app.post('/api/admin/logout',requireAuth,csrf,(req,res)=>{sessions.delete(req.session.token);res.setHeader('Set-Cookie','wb_session=; Path=/; Max-Age=0');res.json({ok:true});});
app.get('/:slug',(req,res,next)=>{const site=selectPage(readLiveSite(),req.params.slug);if(!site)return next();res.type('html').send(renderSite(site));});
app.use((req,res,next)=>{if(req.method!=='GET')return next();const site=plugins.publicDetail(readLiveSite(),req.path);if(!site)return next();res.type('html').send(renderSite(site));});
app.use((error,_req,res,_next)=>res.status(400).json({error:error instanceof multer.MulterError?'Kuvan lataus epäonnistui.':'Palvelimella tapahtui virhe.'}));
if(require.main===module)app.listen(PORT,()=>{
  console.log(`Weboiler: http://localhost:${PORT}`);
  if (!PRODUCTION && !process.env.ADMIN_PASSWORD && !fs.existsSync(AUTH_FILE)) console.log('Paikallinen hallinta: admin / admin (vaihda salasana asetuksista)');
});
module.exports=app;
