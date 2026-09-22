'use strict';
const assert=require('node:assert/strict');
const plugins=require('../lib/plugins');
const render=require('../views/site');
const createStore=require('../lib/site-store');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'weboiler-plugins-'));
try{
 const data=plugins.clean({references:{enabled:true,projects:[{id:'project-1',slug:'keittio',title:'Keittiö',summary:'Yhteenveto',text:'Koko projektikuvaus',image:'/uploads/project.png',imageAlt:'Keittiö',category:'Remontti'}]}});
 const site={meta:{title:'Sivu',siteName:'Testi',siteUrl:'https://example.test'},theme:{},navigation:[],footer:{},plugins:data,sections:[{id:'refs',type:'references-grid',title:'Referenssit',pluginData:{}}]};
 assert.match(render(site),/href="\/referenssit\/keittio"/);
 assert.match(render(site,{preview:true}),/\/admin\/esikatselu\?plugin=references&amp;item=keittio/);
 assert.match(render(plugins.publicDetail(site,'/referenssit/keittio')),/Koko projektikuvaus/);
 assert.equal(plugins.publicDetail(site,'/referenssit/missing'),null);
 assert.equal(plugins.publicDetail(site,'/referenssit/keittio/other'),null);
 const disabled={...site,plugins:plugins.clean({references:{...data.references,enabled:false}})};
 assert.doesNotMatch(render(disabled),/Keittiö/);assert.equal(plugins.detail(disabled,'references','keittio'),null);
 assert.equal(disabled.plugins.references.projects.length,1);
 const filtered={...site,sections:[{...site.sections[0],pluginData:{category:'Rakennus'}}]};assert.doesNotMatch(render(filtered),/Keittiö/);
 const bad=structuredClone(data);bad.references.projects.push({...bad.references.projects[0],id:'other'});assert.throws(()=>plugins.clean(bad),/jo käytössä/);
 assert.throws(()=>plugins.clean({missing:{enabled:true}}),/ei ole asennettu/);
 const injection=structuredClone(data);injection.references.projects[0].image='javascript:alert(1)';assert.throws(()=>plugins.clean(injection));
 const file=path.join(root,'draft.json'),liveFile=path.join(root,'live.json');fs.writeFileSync(file,JSON.stringify(site));fs.writeFileSync(liveFile,JSON.stringify(site));
 const store=createStore({editorFile:file,liveFile,clean:s=>({...s,plugins:plugins.clean(s.plugins)})});
 const saved=store.save(disabled,store.snapshot().version);assert.ok(store.live().plugins.references.enabled);store.publish(saved.version);assert.equal(store.live().plugins.references.enabled,false);
 const old=store.history().find(x=>x.kind==='previous-live');store.restore(old.id,store.snapshot().version);assert.equal(store.draft().plugins.references.projects[0].title,'Keittiö');assert.ok(store.draft().plugins.references.enabled);assert.equal(store.live().plugins.references.enabled,false);
 assert.equal(plugins.catalog()[0].sections[0].type,'references-grid');
 console.log('Plugins tests OK (render, routes, disabled, validation, history)');
}finally{fs.rmSync(root,{recursive:true,force:true});}
