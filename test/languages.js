'use strict';
const assert=require('node:assert/strict'),languages=require('../lib/languages'),{selectPage}=require('../lib/pages'),render=require('../views/site');
const site={meta:{siteName:'Test',title:'Etusivu',locale:'fi',siteUrl:'https://example.test'},theme:{},footer:{text:'Alatunniste'},navigation:[{label:'Koti',target:'/'},{label:'Palvelut',target:'/palvelut'},{label:'Yhteys',target:'yhteys'}],sections:[],pages:[{id:'en-home',slug:'en',title:'Home',locale:'en',translationGroup:'home',footerText:'English footer',sections:[{id:'contact',type:'contact',title:'Contact'}]},{id:'services-fi',slug:'palvelut',title:'Palvelut',locale:'fi',translationGroup:'services',sections:[]},{id:'services-en',slug:'services',title:'Services',locale:'en',translationGroup:'services',sections:[]}]};
languages.validate(site);
const english=selectPage(site,'en');assert.equal(english.meta.locale,'en');assert.equal(english.footer.text,'English footer');assert.deepEqual(english.navigation.map(x=>x.target),['/en','/services','/en#yhteys']);
const plugins=require('../lib/plugins');
for(const [plugin,key,type,prefix] of [['blog','posts','blog-list','ajankohtaista'],['references','projects','references-grid','referenssit']]){
  const items=[{id:'fi-item',slug:'suomi',title:'Suomeksi',locale:'fi',translationGroup:'pair',status:'published'}, {id:'en-item',slug:'english',title:'In English',locale:'en',translationGroup:'pair',status:'published'}];
  const translated={...site,plugins:plugins.clean({[plugin]:{enabled:true,[key]:items}}),sections:[{id:'listing',type}]};
  assert.deepEqual(plugins.renderSection(translated.sections[0],translated).items.map(x=>x.title),['Suomeksi']);
  assert.deepEqual(plugins.renderSection(translated.sections[0],{...translated,meta:{...translated.meta,locale:'en'}}).items.map(x=>x.title),['In English']);
  const detail=plugins.detail(translated,plugin,'english');
  assert.equal(detail.meta.locale,'en');assert.equal(detail.language.homeUrl,'/en');assert.equal(detail.footer.text,'English footer');
  assert.deepEqual(detail.language.links.map(x=>x.url),[`/${prefix}/suomi`,`/${prefix}/english`]);
  assert.match(render(detail),/<html lang="en"/);
  assert.ok(render(detail).includes(`href="https://example.test/${prefix}/suomi"`));
  assert.ok(render(detail,{preview:true}).includes(`/admin/esikatselu?plugin=${plugin}&amp;item=suomi`));
  assert.ok(render(detail,{preview:true,previewBase:'/admin/historia/test'}).includes(`/admin/historia/test?plugin=${plugin}&amp;item=suomi`));
  assert.throws(()=>plugins.clean({[plugin]:{[key]:[...items,{...items[0],id:'duplicate',slug:'duplicate'}]}}),/yksi kohde/);
  assert.throws(()=>plugins.clean({[plugin]:{[key]:[{...items[0],locale:'invalid'}]}}));
  if(plugin==='blog')for(const change of [{status:'draft'},{publishAt:'2099-01-01T00:00:00.000Z'}]){
    translated.plugins.blog.posts[1]={...translated.plugins.blog.posts[1],status:'published',publishAt:'',...change};
    assert.equal(plugins.detail(translated,plugin,'suomi').language.links.length,1);
    assert.equal(plugins.detail(translated,plugin,'suomi',{preview:true}).language.links.length,2);
    assert.equal(plugins.detail(translated,plugin,'english'),null);
  }
}
const html=render(english);assert.match(html,/<html lang="en"/);assert.match(html,/hreflang="fi"/);assert.match(html,/href="https:\/\/example.test\/en"/);assert.match(html,/>Email<input/);assert.match(html,/>Send<\/button>/);assert.match(html,/English footer/);
const preview=render(english,{preview:true});assert.match(preview,/href="\/admin\/esikatselu\?page=en" lang="en"/);assert.doesNotMatch(preview,/<link rel="alternate"/);
const service=selectPage(site,'services');assert.deepEqual(service.language.links.map(x=>x.url),['/palvelut','/services']);
assert.throws(()=>languages.validate({...site,pages:[...site.pages,{...site.pages[0],id:'duplicate',slug:'duplicate'}]}),/yksi sivu/);
assert.throws(()=>languages.locale('en" onload="evil'));assert.throws(()=>languages.group('../bad','id'));
assert.equal(languages.locale(undefined),'fi');
const custom=structuredClone(site);custom.pages[0].navigation=languages.navigation([{label:'Contact us',target:'#contact'}]);
assert.deepEqual(selectPage(custom,'en').navigation,[{label:'Contact us',target:'#contact'}]);
assert.match(render(selectPage(custom,'en')),/>Contact us<\/a>/);
custom.pages[0].navigation=[];assert.deepEqual(selectPage(custom,'en').navigation,[]);
custom.pages[0].navigation=null;assert.equal(selectPage(custom,'en').navigation.length,3);
assert.throws(()=>languages.navigation([{label:'Bad',target:'javascript:alert(1)'}]));
assert.throws(()=>languages.navigation([{label:'',target:'/'}]));
console.log('Language tests OK (groups, localized navigation, forms, footer, hreflang, preview, validation)');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');let click;
const editable={};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/languages.js'),'utf8'),{document:{addEventListener:(_,handler)=>click=handler},site:{navigation:[{label:'Palvelut',target:'palvelut'},{label:'Koti',target:'/'}]},activePage:()=>editable,dirty(){},renderEditor(){}});
click({target:{closest:()=>({dataset:{pageNav:'enable'}})}});
assert.equal(editable.navigation[0].target,'/#palvelut');assert.doesNotThrow(()=>languages.navigation(editable.navigation));
// Every language must reach the public controls, including messages used after a click.
for(const [locale,previous,pause,resume,load] of [['en','Previous image','Pause','Resume','Load external content'],['sv','Föregående bild','Pausa','Fortsätt','Ladda externt innehåll']]){
  const controls=render({...site,meta:{...site.meta,locale},pages:[],plugins:{embeds:{enabled:true}},sections:[
    {id:'slides',type:'carousel',title:'Photos',images:[{src:'/uploads/a.png'},{src:'/uploads/b.png'}]},
    {id:'external',type:'booking-embed',title:'Booking',pluginData:{url:'https://calendly.com/test/30min'}}
  ]});
  assert.ok(controls.includes(`aria-label="${previous}"`));
  assert.ok(controls.includes(`data-pause-label="${pause}"`));
  assert.ok(controls.includes(`data-resume-label="${resume}"`));
  assert.ok(controls.includes(`>${load}</button>`));
  assert.doesNotMatch(controls,/Edellinen kuva|Pysäytä|Lataa ulkoinen sisältö/);
}
