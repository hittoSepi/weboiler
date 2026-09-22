'use strict';
const assert=require('node:assert/strict'),embeds=require('../lib/embeds'),plugins=require('../lib/plugins'),render=require('../views/site'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const examples=[['map-embed','map','https://www.google.com/maps/embed?pb=test'],['booking-embed','booking','https://calendly.com/test/30min'],['newsletter-embed','newsletter','https://buttondown.com/test?as_embed=true']];
for(const [type,provider,url] of examples){
  assert.equal(embeds.url(url,provider),url);
  const section={id:'test',type,title:'External',pluginData:plugins.cleanSection({type,pluginData:{url,height:'800'}})};
  const site={meta:{title:'Test'},theme:{},navigation:[],footer:{},plugins:{embeds:{enabled:true}},sections:[section]};
  const html=render(site);assert.match(html,/data-load-embed/);assert.match(html,/data-embed-height="800"/);assert.doesNotMatch(html,/<iframe/);
  site.plugins.embeds.enabled=false;assert.doesNotMatch(render(site),/data-load-embed/);
}
for(const value of ['http://calendly.com/test','https://calendly.com.evil.test/test','https://user:pass@calendly.com/test','https://localhost/test','javascript:alert(1)','<iframe src="https://calendly.com/test">','https://calendly.com:444/test'])assert.throws(()=>embeds.url(value,'booking'));
assert.throws(()=>embeds.url('https://buttondown.com/test','newsletter'));
assert.throws(()=>embeds.url('https://www.google.com/search?q=test','map'));
assert.throws(()=>embeds.url('https://calendly.com/test','map'));
const script=fs.readFileSync(path.join(__dirname,'../public/embeds.js'),'utf8');
for(const preview of [true,false]){
  let handler,appended=0,removed=0,frame;
  const status={},container={dataset:{embedUrl:examples[1][2],embedHeight:'800',embedTitle:'Booking',previewMessage:'Preview message',fallbackMessage:'Fallback message'},querySelector:()=>status,append:f=>{frame=f;appended++;}};
  const button={closest:()=>container,remove:()=>removed++};
  vm.runInNewContext(script,{document:{body:{dataset:{preview:String(preview)}},addEventListener:(_,fn)=>handler=fn,createElement:tag=>{assert.equal(tag,'iframe');return {setAttribute(name,value){this[name]=value;}};}}});
  assert.equal(appended,0);handler({target:{closest:()=>button}});
  assert.equal(appended,preview?0:1);assert.equal(removed,preview?0:1);
  assert.equal(status.textContent,preview?'Preview message':'Fallback message');
  if(!preview){assert.equal(frame.src,examples[1][2]);assert.equal(frame.referrerPolicy,'no-referrer');assert.equal(frame.height,'800');assert.match(frame.sandbox,/allow-forms/);}
}
console.log('Embed tests OK (providers, URL boundaries, opt-in, preview suppression, iframe sandbox)');
