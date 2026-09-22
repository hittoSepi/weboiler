'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'weboiler-test-'));
process.env.NODE_ENV = 'test';
process.env.ADMIN_USER = 'test-admin';
process.env.ADMIN_PASSWORD = 'test-password-123';
process.env.SESSION_SECRET = 'test-secret-that-is-definitely-over-32-characters';
process.env.MESSAGES_FILE = path.join(temp, 'messages.json');
process.env.ANALYTICS_FILE = path.join(temp, 'analytics.json');
process.env.ADMIN_AUTH_FILE = path.join(temp, 'auth.json');
process.env.MAIL_SETTINGS_FILE = path.join(temp, 'mail.json');
process.env.AI_SETTINGS_FILE = path.join(temp, 'ai.json');
process.env.EDITOR_SITE_FILE = path.join(temp, 'site-editor.json');
process.env.LIVE_SITE_FILE = path.join(temp, 'site-live.json');
process.env.UPLOADS_DIR = path.join(temp, 'uploads');
const fixture = {
  meta:{siteName:'Weboiler test',title:'Julkaistu lähtötilanne',description:'Testi',siteUrl:''},
  theme:{background:'#07101c',surface:'#101b2a',text:'#ffffff',muted:'#aaaaaa',accent:'#f29a2e',font:'Arial, sans-serif',headingFont:'Arial, sans-serif',maxWidth:1280,radius:6},
  navigation:[],sections:[{id:'testi',type:'text',title:'Testi',text:'Sisältö'}],footer:{text:'Testi'}
};
fs.writeFileSync(process.env.EDITOR_SITE_FILE, JSON.stringify(fixture));
fs.writeFileSync(process.env.LIVE_SITE_FILE, JSON.stringify(fixture));

const app = require('../server');

async function run() {
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    let response = await fetch(`${base}/`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Weboiler/);

    response = await fetch(`${base}/api/admin/login`, {
      method:'POST', headers:{'content-type':'application/json'},
      body:JSON.stringify({username:'test-admin',password:'test-password-123'})
    });
    assert.equal(response.status, 200);
    const cookie = response.headers.get('set-cookie').split(';')[0];

    response = await fetch(`${base}/api/admin/session`, { headers:{cookie} });
    assert.equal(response.status, 200);
    const session = await response.json();
    assert.ok(session.csrf);
    assert.ok(Array.isArray(session.site.sections));
    assert.equal((await fetch(`${base}/api/admin/ai-settings`)).status,401);
    assert.equal((await fetch(`${base}/api/admin/ai/text`,{method:'POST',headers:{cookie,'content-type':'application/json'},body:'{}'})).status,403);
    response=await fetch(`${base}/api/admin/ai/text`,{method:'POST',headers:{cookie,'content-type':'application/json','x-csrf-token':session.csrf},body:JSON.stringify({prompt:'Testi'})});
    assert.equal(response.status,400);
    assert.match((await response.json()).error,/käyttöön/);
    response = await fetch(`${base}/api/admin/icons`, {headers:{cookie}});
    const iconList = (await response.json()).icons;
    assert.ok(iconList.length > 500);
    assert.ok(iconList.includes('house'));

    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==','base64');
    const upload = new FormData();
    upload.append('images',new Blob([png],{type:'image/png'}),'logo.png');
    response = await fetch(`${base}/api/admin/uploads`, {method:'POST',headers:{cookie,'x-csrf-token':session.csrf},body:upload});
    assert.equal(response.status,201);
    const uploaded = (await response.json()).files[0];
    response = await fetch(`${base}${uploaded.src}`);
    assert.equal(response.status,200);
    assert.equal(response.headers.get('content-type'),'image/png');
    session.site.meta.logo = uploaded.src;
    session.site.meta.logoAlt = 'Testilogo';

    const spoof = new FormData();
    spoof.append('images',new Blob(['<html>not an image</html>'],{type:'image/png'}),'fake.png');
    response = await fetch(`${base}/api/admin/uploads`, {method:'POST',headers:{cookie,'x-csrf-token':session.csrf},body:spoof});
    assert.equal(response.status,400);
    assert.equal(fs.readdirSync(process.env.UPLOADS_DIR).length,1,'Rejected upload must be removed');
    session.site.meta.title = 'Vain työversiossa';
    session.site.sections.push({id:'karuselli',type:'carousel',title:'Testikaruselli',interval:3,images:[{src:'/uploads/first.png',alt:'Ensimmäinen'},{src:'/uploads/second.png',alt:'Toinen'}]});
    session.site.elements = [{id:'oma-malli',name:'Oma karuselli',section:session.site.sections[1]}];
    session.site.sections.push({id:'kortit',type:'features',title:'Kuvakortit',items:[{title:'Kuvallinen palvelu',image:uploaded.src,imageAlt:'Kortin testikuva',url:'https://example.test/palvelu',linkLabel:'Tutustu palveluun'}]});

    response = await fetch(`${base}/api/admin/site`, {
      method:'PUT', headers:{cookie,'content-type':'application/json','x-csrf-token':session.csrf,'x-site-version':session.version},
      body:JSON.stringify(session.site)
    });
    assert.equal(response.status, 200);
    const saved = await response.json();
    assert.equal(saved.unpublished, true);
    assert.notEqual(saved.version, session.version);
    assert.equal(saved.site.sections[1].type,'carousel');
    assert.equal(saved.site.elements[0].section.images.length,2);
    assert.equal(saved.site.meta.logo,uploaded.src);
    for(const change of [
      data=>{data.sections.push({...data.sections[0]});},
      data=>{data.theme.accent='red;position:fixed';},
      data=>{data.sections[0].buttonUrl='javascript:alert(1)';},
      data=>{data.meta.logo='//unexpected.example/image.png';}
    ]) {
      const invalid=structuredClone(saved.site);change(invalid);
      response=await fetch(`${base}/api/admin/site`,{method:'PUT',headers:{cookie,'content-type':'application/json','x-csrf-token':session.csrf,'x-site-version':saved.version},body:JSON.stringify(invalid)});
      assert.equal(response.status,400,'Invalid content must not overwrite the saved draft');
    }

    response = await fetch(`${base}/api/admin/site`, {
      method:'PUT', headers:{cookie,'content-type':'application/json','x-csrf-token':session.csrf,'x-site-version':session.version},
      body:JSON.stringify(fixture)
    });
    assert.equal(response.status, 409, 'A stale tab must not overwrite the current draft');

    response = await fetch(`${base}/api/admin/publish`, {
      method:'POST', headers:{cookie,'content-type':'application/json','x-csrf-token':session.csrf,'x-site-version':session.version}, body:'{}'
    });
    assert.equal(response.status, 409, 'Publishing a stale draft must fail');

    response = await fetch(`${base}/api/admin/publish`, { method:'POST', headers:{cookie,'content-type':'application/json'}, body:'{}' });
    assert.equal(response.status, 403, 'Publishing requires CSRF protection');

    response = await fetch(`${base}/admin/esikatselu`, {redirect:'manual'});
    assert.equal(response.status, 302, 'Anonymous users cannot read a draft');

    response = await fetch(`${base}/`);
    assert.doesNotMatch(await response.text(), /Vain työversiossa/);

    response = await fetch(`${base}/admin/esikatselu`, { headers:{cookie} });
    const preview = await response.text();
    assert.match(preview, /Vain työversiossa/);
    assert.match(preview, /data-preview="true"/);
    assert.match(preview, /alt="Testilogo"/);
    assert.match(preview, /data-interval="3"/);
    assert.match(preview, /data-pause/);
    assert.match(preview, /alt="Kortin testikuva"/);
    assert.match(preview, /href="https:\/\/example.test\/palvelu"/);
    assert.match(preview, /Tutustu palveluun/);
    assert.equal(response.headers.get('cache-control'), 'no-store');

    response = await fetch(`${base}/api/admin/publish`, {
      method:'POST', headers:{cookie,'content-type':'application/json','x-csrf-token':session.csrf,'x-site-version':saved.version}, body:'{}'
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).unpublished, false);
    assert.deepEqual(JSON.parse(fs.readFileSync(process.env.LIVE_SITE_FILE)), JSON.parse(fs.readFileSync(process.env.EDITOR_SITE_FILE)));

    response = await fetch(`${base}/`);
    assert.match(await response.text(), /Vain työversiossa/);

    assert.equal((await fetch(`${base}/api/admin/history`)).status,401);
    response=await fetch(`${base}/api/admin/history`,{headers:{cookie}});
    const history=(await response.json()).entries;
    assert.equal(history.length,2);
    const previous=history.find(entry=>entry.kind==='previous-live');
    assert.equal(previous.site,undefined,'Listing must not send full historical content');
    assert.equal((await fetch(`${base}/admin/historia/${previous.id}`,{redirect:'manual'})).status,302);
    response=await fetch(`${base}/admin/historia/${previous.id}`,{headers:{cookie}});
    assert.equal(response.headers.get('cache-control'),'no-store');
    assert.equal(response.headers.get('x-robots-tag'),'noindex, nofollow');
    assert.match(await response.text(),/Julkaistu lähtötilanne/);
    assert.equal((await fetch(`${base}/api/admin/history/${previous.id}/restore`,{method:'POST',headers:{cookie,'content-type':'application/json'},body:'{}'})).status,403);
    response=await fetch(`${base}/api/admin/history/${previous.id}/restore`,{method:'POST',headers:{cookie,'content-type':'application/json','x-csrf-token':session.csrf,'x-site-version':session.version},body:'{}'});
    assert.equal(response.status,409);
    response=await fetch(`${base}/api/admin/history/${previous.id}/restore`,{method:'POST',headers:{cookie,'content-type':'application/json','x-csrf-token':session.csrf,'x-site-version':saved.version},body:'{}'});
    assert.equal(response.status,200);
    assert.equal((await response.json()).site.meta.title,'Julkaistu lähtötilanne');
    assert.match(await (await fetch(`${base}/`)).text(),/Vain työversiossa/,'Restoration must not publish');

    response = await fetch(`${base}/api/contact`, {
      method:'POST', headers:{'content-type':'application/json'},
      body:JSON.stringify({name:'Testaaja',email:'test@example.com',message:'Testiviesti'})
    });
    assert.equal(response.status, 201);

    response = await fetch(`${base}/api/admin/dashboard`, { headers:{cookie} });
    assert.equal(response.status, 200);
    assert.ok((await response.json()).analytics.last30Days.messages >= 1);

    for (const route of ['/admin','/admin/editori','/admin/elementit','/admin/media','/admin/asetukset','/admin/historia']) {
      response = await fetch(`${base}${route}`, { headers:{cookie} });
      assert.equal(response.status, 200);
    }
    response = await fetch(`${base}/api/admin/session`,{headers:{cookie:'wb_session=%invalid'}});
    assert.equal(response.status,401);
    response = await fetch(`${base}/api/admin/auth-settings`,{
      method:'PUT',headers:{cookie,'content-type':'application/json','x-csrf-token':session.csrf},
      body:JSON.stringify({username:'changed-admin',currentPassword:'test-password-123',newPassword:'changed-password-123'})
    });
    assert.equal(response.status,200);
    response = await fetch(`${base}/api/admin/session`,{headers:{cookie}});
    assert.equal(response.status,401,'Credential change invalidates existing sessions');
    response = await fetch(`${base}/api/admin/login`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:'changed-admin',password:'changed-password-123'})});
    assert.equal(response.status,200);
    console.log('Smoke test OK');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(temp, { recursive:true, force:true });
  }
}

run().catch((error) => { console.error(error); process.exitCode=1; });
