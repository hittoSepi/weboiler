'use strict';
const assert=require('node:assert/strict'),plugins=require('../lib/plugins'),http=require('../lib/integration-http');
async function run(){
  const product={id:'one',slug:'tuote',title:'Tuote',price:'29 €',text:'Kuvaus',category:'Testi',image:'/uploads/test.png'};
  const data=plugins.clean({products:{enabled:true,items:[product]}});
  const site={meta:{title:'Testi'},theme:{},footer:{},navigation:[],plugins:data};
  const list=plugins.renderSection({type:'product-list',pluginData:{}},site);assert.equal(list.items.length,1);assert.match(list.items[0].text,/29 €/);
  assert.equal(plugins.renderSection({type:'product-list',pluginData:{category:'other'}},site).items.length,0);
  assert.equal(plugins.renderSection({type:'product-feature',pluginData:{productId:'one'}},site).items[0].title,'Tuote');
  assert.equal(plugins.renderSection({type:'product-feature',pluginData:{productId:'deleted'}},site).items.length,0);
  assert.equal(plugins.publicDetail(site,'/tuotteet/tuote').meta.title,'Tuote');
  assert.equal(plugins.publicDetail(site,'/tuotteet/missing'),null);
  data.products.enabled=false;assert.equal(plugins.publicDetail(site,'/tuotteet/tuote'),null);
  const catalog=plugins.catalog().find(p=>p.id==='products');assert.equal(catalog.adminPage.slug,'tuotteet');assert.equal(catalog.integrations[0].run,undefined);
  for(const url of ['http://example.com','https://127.0.0.1','https://user:pass@example.com','https://example.com:444'])assert.throws(()=>http.endpoint(url));
  const original=http.getJSON;
  try{
    http.getJSON=async()=>({products:[{...product,secret:'must not survive'}]});
    const result=await plugins.runIntegration('products','import');assert.equal(result.items[0].title,'Tuote');assert.equal(result.items[0].secret,undefined);
    http.getJSON=async()=>({products:[{...product,image:'javascript:alert(1)'}]});await assert.rejects(()=>plugins.runIntegration('products','import'));
    http.getJSON=async()=>({products:[product,product]});await assert.rejects(()=>plugins.runIntegration('products','import'));
    http.getJSON=async()=>({unexpected:[]});await assert.rejects(()=>plugins.runIntegration('products','import'));
    await assert.rejects(()=>plugins.runIntegration('products','missing'),{status:404});
  }finally{http.getJSON=original;}
  console.log('Product tests OK (catalog, selection, routes, integration validation, secrets)');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
