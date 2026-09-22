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

const app = express();
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const UPLOADS = path.join(PUBLIC, 'uploads');
const SITE_FILE = path.join(ROOT, 'data', 'site.json');
const MESSAGE_FILE = path.resolve(ROOT, process.env.MESSAGES_FILE || 'data/yhteydenotot.json');
const ANALYTICS_FILE = path.resolve(ROOT, process.env.ANALYTICS_FILE || 'data/analytics.json');
const AUTH_FILE = path.resolve(ROOT, process.env.ADMIN_AUTH_FILE || 'data/admin-auth.json');
const MAIL_FILE = path.resolve(ROOT, process.env.MAIL_SETTINGS_FILE || 'data/mail-settings.json');
const PORT = Number(process.env.PORT || 3100);
const PRODUCTION = process.env.NODE_ENV === 'production';
const SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const sessions = new Map();
const attempts = new Map();
const analytics = createAnalytics({ filePath: ANALYTICS_FILE });
const auth = createAuthStore({ filePath: AUTH_FILE, fallbackUsername: process.env.ADMIN_USER || 'admin', fallbackPassword: process.env.ADMIN_PASSWORD || '' });
const mailer = createMailer({ filePath: MAIL_FILE, encryptionSecret: SECRET });

if (PRODUCTION && ((!process.env.ADMIN_PASSWORD && !fs.existsSync(AUTH_FILE)) || SECRET.length < 32)) throw new Error('Tuotanto vaatii admin-salasanan ja vähintään 32-merkkisen SESSION_SECRET-arvon.');
fs.mkdirSync(UPLOADS, { recursive: true });
app.disable('x-powered-by');
app.use(express.json({ limit: '2mb' }));
app.use((req, res, next) => { res.setHeader('X-Content-Type-Options','nosniff'); res.setHeader('X-Frame-Options','SAMEORIGIN'); res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-src 'self'; frame-ancestors 'self'; form-action 'self'"); next(); });
app.use('/assets', express.static(PUBLIC, { index:false, maxAge:PRODUCTION?'1d':0 }));
app.use('/uploads', express.static(UPLOADS, { index:false, maxAge:'7d' }));
app.use('/vendor/fontawesome', express.static(path.join(ROOT, 'node_modules', '@fortawesome', 'fontawesome-free'), { index:false, maxAge:'30d' }));

const readJson = (file, fallback) => fs.existsSync(file) ? JSON.parse(fs.readFileSync(file,'utf8')) : fallback;
function writeJson(file, value) { const temp=`${file}.${process.pid}.tmp`; fs.mkdirSync(path.dirname(file),{recursive:true}); fs.writeFileSync(temp,`${JSON.stringify(value,null,2)}\n`); fs.renameSync(temp,file); }
const readSite = () => readJson(SITE_FILE, {});
const text = (value, max=4000) => String(value || '').trim().slice(0,max);
const iconName = (value) => text(value, 80).replace(/[^a-z0-9-]/gi, '');
const richText = (value) => sanitizeHtml(String(value || '').slice(0,30000), {
  allowedTags:['p','br','strong','em','u','s','a','ul','ol','li','h3','h4','blockquote'],
  allowedAttributes:{a:['href','target','rel']}, allowedSchemes:['http','https','mailto','tel'],
  transformTags:{a:sanitizeHtml.simpleTransform('a',{rel:'noopener noreferrer'},true)}
});
function cleanSite(input) {
  if (!input || !Array.isArray(input.sections)) throw new Error('Virheellinen sivustodata.');
  const allowed = new Set(['hero','text','features','gallery','cta','contact']);
  return {
    meta: { siteName:text(input.meta?.siteName,80), title:text(input.meta?.title,140), description:text(input.meta?.description,300), siteUrl:text(input.meta?.siteUrl,500) },
    theme: { background:text(input.theme?.background,20), surface:text(input.theme?.surface,20), text:text(input.theme?.text,20), muted:text(input.theme?.muted,20), accent:text(input.theme?.accent,20), font:text(input.theme?.font,100), headingFont:text(input.theme?.headingFont,100), maxWidth:Math.min(1800,Math.max(800,Number(input.theme?.maxWidth)||1280)), radius:Math.min(40,Math.max(0,Number(input.theme?.radius)||0)) },
    navigation:(input.navigation||[]).slice(0,12).map((x)=>({label:text(x.label,60),target:text(x.target,80)})),
    sections: input.sections.slice(0, 30).map((section) => ({
      id: text(section.id, 80).replace(/[^a-zA-Z0-9_-]/g, '-'),
      type: allowed.has(section.type) ? section.type : 'text',
      eyebrow: text(section.eyebrow, 100),
      title: text(section.title, 180),
      text: text(section.text, 5000),
      html: richText(section.html),
      buttonLabel: text(section.buttonLabel, 80),
      buttonUrl: text(section.buttonUrl, 500),
      image: text(section.image, 500),
      email: text(section.email, 200),
      phone: text(section.phone, 60),
      icon: iconName(section.icon),
      iconColor: text(section.iconColor, 20),
      iconSize: Math.min(160, Math.max(12, Number(section.iconSize) || 40)),
      items: Array.isArray(section.items) ? section.items.slice(0, 20).map((item) => ({
        title: text(item.title, 140),
        text: text(item.text, 1000),
        icon: iconName(item.icon),
        iconColor: text(item.iconColor, 20),
        iconSize: Math.min(120, Math.max(12, Number(item.iconSize) || 32))
      })) : [],
      images: Array.isArray(section.images) ? section.images.slice(0, 40).map((image) => ({
        src: text(image.src, 500),
        alt: text(image.alt, 300),
        url: text(image.url, 500)
      })) : []
    })),
    footer:{text:text(input.footer?.text,120)}
  };
}

function cookie(req) { return Object.fromEntries((req.headers.cookie||'').split(';').filter(Boolean).map(x=>{const i=x.indexOf('=');return[x.slice(0,i).trim(),decodeURIComponent(x.slice(i+1))]})); }
function sign(token) { return `${token}.${crypto.createHmac('sha256',SECRET).update(token).digest('base64url')}`; }
function session(req) { const value=cookie(req).wb_session||''; const i=value.lastIndexOf('.'); if(i<1)return null; const token=value.slice(0,i); const signature=value.slice(i+1); const expected=crypto.createHmac('sha256',SECRET).update(token).digest('base64url'); if(signature.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return null; const found=sessions.get(token); if(!found||found.expires<Date.now())return null; found.expires=Date.now()+28800000; return {token,...found}; }
function requireAuth(req,res,next){const found=session(req);if(!found)return res.status(401).json({error:'Kirjautuminen vaaditaan.'});req.session=found;next();}
function csrf(req,res,next){if((req.get('x-csrf-token')||req.body?._csrf)!==req.session.csrf)return res.status(403).json({error:'Turvatunniste ei täsmää.'});next();}

const upload = multer({ storage:multer.diskStorage({destination:(_r,_f,cb)=>cb(null,UPLOADS),filename:(_r,file,cb)=>{const ext={"image/jpeg":".jpg","image/png":".png","image/webp":".webp","image/gif":".gif"}[file.mimetype];cb(null,`${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext||''}`)}}), limits:{fileSize:8*1024*1024,files:20}, fileFilter:(_r,file,cb)=>cb(null,['image/jpeg','image/png','image/webp','image/gif'].includes(file.mimetype)) });

app.get('/',(_req,res)=>res.type('html').send(renderSite(readSite())));
app.get('/admin/login',(_req,res)=>res.sendFile(path.join(PUBLIC,'login.html')));
app.get(['/admin','/admin/yhteydenotot','/admin/editori','/admin/media','/admin/asetukset'],(req,res)=>session(req)?res.sendFile(path.join(PUBLIC,'admin.html')):res.redirect('/admin/login'));
app.post('/api/analytics/visit',(req,res)=>{analytics.record(req.body||{});res.status(204).end();});
app.post('/api/contact',async(req,res)=>{try{if(text(req.body.website,100))return res.status(201).json({ok:true});const message={id:crypto.randomUUID(),createdAt:new Date().toISOString(),name:text(req.body.name,120),email:text(req.body.email,200),phone:text(req.body.phone,60),message:text(req.body.message,3000)};if(!message.name||!message.message||(!message.email&&!message.phone))throw new Error('Täytä nimi, viesti ja yhteystieto.');const list=readJson(MESSAGE_FILE,[]);list.unshift(message);writeJson(MESSAGE_FILE,list);res.status(201).json({ok:true});setImmediate(()=>mailer.sendContact(message).catch(console.error));}catch(error){res.status(400).json({error:error.message});}});
app.post('/api/admin/login',(req,res)=>{const key=req.ip;const count=attempts.get(key)||0;if(count>=10)return res.status(429).json({error:'Liian monta yritystä.'});if(!auth.authenticate(req.body.username,req.body.password)){attempts.set(key,count+1);return res.status(401).json({error:'Väärä käyttäjätunnus tai salasana.'});}attempts.delete(key);const token=crypto.randomBytes(32).toString('base64url');sessions.set(token,{csrf:crypto.randomBytes(24).toString('base64url'),expires:Date.now()+28800000});res.setHeader('Set-Cookie',`wb_session=${sign(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=28800${PRODUCTION?'; Secure':''}`);res.json({ok:true});});
app.get('/api/admin/session',requireAuth,(req,res)=>res.json({csrf:req.session.csrf,site:readSite()}));
app.put('/api/admin/site',requireAuth,csrf,(req,res)=>{try{const site=cleanSite(req.body);writeJson(SITE_FILE,site);res.json({ok:true,site});}catch(error){res.status(400).json({error:error.message});}});
app.get('/api/admin/messages',requireAuth,(_req,res)=>res.json({messages:readJson(MESSAGE_FILE,[])}));
app.get('/api/admin/dashboard',requireAuth,(_req,res)=>{const messages=readJson(MESSAGE_FILE,[]);res.json({analytics:analytics.summary(messages),recentMessages:messages.slice(0,5)});});
app.get('/api/admin/media',requireAuth,(_req,res)=>res.json({files:fs.readdirSync(UPLOADS,{withFileTypes:true}).filter(x=>x.isFile()&&x.name!=='.gitkeep').map(x=>({name:x.name,src:`/uploads/${x.name}`}))}));
app.post('/api/admin/uploads',requireAuth,csrf,upload.array('images',20),(req,res)=>req.files?.length?res.status(201).json({files:req.files.map(f=>({name:f.originalname,src:`/uploads/${f.filename}`}))}):res.status(400).json({error:'Valitse kuvia.'}));
app.get('/api/admin/mail-settings',requireAuth,(_req,res)=>res.json({settings:mailer.publicSettings()}));
app.put('/api/admin/mail-settings',requireAuth,csrf,(req,res)=>{try{res.json({settings:mailer.saveSettings(req.body)});}catch(error){res.status(400).json({error:error.message});}});
app.post('/api/admin/mail-settings/test',requireAuth,csrf,async(_req,res)=>{try{const result=await mailer.sendTest();if(result.skipped)throw new Error('Sähköpostipalvelu ei ole käytössä.');res.json({ok:true});}catch(error){res.status(400).json({error:error.message});}});
app.get('/api/admin/auth-settings',requireAuth,(_req,res)=>res.json({settings:auth.publicSettings()}));
app.put('/api/admin/auth-settings',requireAuth,csrf,(req,res)=>{try{auth.update(req.body);sessions.clear();res.setHeader('Set-Cookie','wb_session=; Path=/; Max-Age=0');res.json({relogin:true});}catch(error){res.status(400).json({error:error.message});}});
app.post('/api/admin/logout',requireAuth,csrf,(req,res)=>{sessions.delete(req.session.token);res.setHeader('Set-Cookie','wb_session=; Path=/; Max-Age=0');res.json({ok:true});});
app.use((error,_req,res,_next)=>res.status(400).json({error:error instanceof multer.MulterError?'Kuvan lataus epäonnistui.':'Palvelimella tapahtui virhe.'}));
if(require.main===module)app.listen(PORT,()=>console.log(`Weboiler: http://localhost:${PORT}`));
module.exports=app;
