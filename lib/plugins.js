'use strict';
const installed=require('../plugins');
const validate=require('./validation');
const byId=new Map(),byType=new Map();
const coreTypes=new Set(['hero','text','features','gallery','carousel','cta','contact']);
const adminSlugs=new Set(['yhteydenotot','editori','elementit','media','teema','asetukset','historia','plugins','siirto','login','esikatselu']);
for(const plugin of installed){
  if(!/^[a-z][a-z0-9-]*$/.test(plugin.id)||byId.has(plugin.id)||plugin.version!==1)throw new Error('Virheellinen tai päällekkäinen plugin.');
  byId.set(plugin.id,plugin);
  if(plugin.adminPage){const {slug,label,icon}=plugin.adminPage;if(!/^[a-z][a-z0-9-]*$/.test(slug)||adminSlugs.has(slug)||typeof label!=='string'||!/^fa-[a-z0-9-]+$/.test(icon))throw new Error('Virheellinen lisäosan hallintasivu.');adminSlugs.add(slug);}
  for(const section of plugin.sections||[]){if(!/^[a-z][a-z0-9-]*$/.test(section.type)||coreTypes.has(section.type)||byType.has(section.type))throw new Error('Virheellinen tai päällekkäinen plugin-osiotyyppi.');byType.set(section.type,{plugin,section});}
}
function fields(input,definitions){
  const result={};
  for(const field of definitions){
    let value=String(input?.[field.key]??field.default??'').trim();
    if(field.required&&!value)throw new Error(`${field.label} puuttuu.`);
    if(value.length>(field.max||500))throw new Error(`${field.label} on liian pitkä.`);
    if(field.type==='slug'&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))throw new Error('Osoitetunnisteessa voi käyttää pieniä kirjaimia, numeroita ja yhdysmerkkejä.');
    if(field.type==='select'&&!field.options.some(option=>option.value===value))throw new Error(`${field.label}: valitse sallittu vaihtoehto.`);
    if(field.type==='datetime'&&value){
      if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)||!Number.isFinite(Date.parse(value)))throw new Error(`${field.label}: virheellinen ajankohta.`);
      const normalized=new Date(value).toISOString();if(normalized.slice(0,19)!==value.slice(0,19))throw new Error(`${field.label}: virheellinen päivämäärä.`);value=normalized;
    }
    result[field.key]=field.type==='embedUrl'?require('./embeds').url(value,field.provider):field.type==='image'?validate.url(value,true):field.type==='url'?validate.url(value):value;
  }
  if(definitions.some(field=>field.type==='image'))result.imagePosition=require('./image-presentation').position(input?.imagePosition);
  return result;
}
function clean(input={},defaultLocale='fi'){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Virheellinen plugin-data.');
  for(const id of Object.keys(input))if(!byId.has(id))throw new Error(`Lisäosa ${id} ei ole asennettu. Asenna se ennen sisällön tallennusta.`);
  const result={};
  for(const plugin of installed){
    if(!input[plugin.id])continue;
    const source=input[plugin.id],data={enabled:source.enabled===true};
    for(const collection of plugin.collections||[]){
      const ids=new Set(),slugs=new Set(),translations=new Set();
      data[collection.key]=validate.list(source[collection.key],100,collection.label).map(item=>{
        if(!/^[a-zA-Z0-9_-]{1,80}$/.test(item.id||'')||ids.has(item.id))throw new Error('Plugin-kohteen tunniste ei kelpaa tai on jo käytössä.');ids.add(item.id);
        const value=fields(item,collection.fields);
        if(value.slug){if(slugs.has(value.slug))throw new Error('Projektin osoitetunniste on jo käytössä.');slugs.add(value.slug);}
        if(collection.translatable){
          const languages=require('./languages');
          value.locale=languages.locale(value.locale,defaultLocale);
          value.translationGroup=languages.group(value.translationGroup,item.id);
          const pair=value.translationGroup+':'+value.locale;
          if(translations.has(pair))throw new Error('Käännösryhmässä voi olla vain yksi kohde samalla kielellä.');
          translations.add(pair);
        }
        return {id:item.id,...value};
      });
    }
    result[plugin.id]=data;
  }
  return result;
}
function cleanSection(section){const entry=byType.get(section.type);return entry?fields(section.pluginData,entry.section.fields||[]):{};}
function renderSection(section,site,options={}){
  const entry=byType.get(section.type);if(!entry)return section;
  const data=site.plugins?.[entry.plugin.id];if(!data?.enabled)return null;
  const detailUrl=slug=>options.preview?`${options.previewBase||'/admin/esikatselu'}?plugin=${entry.plugin.id}&item=${encodeURIComponent(slug)}`:entry.plugin.routePrefix+encodeURIComponent(slug);
  const locale=site.language?.locale||site.meta.locale||'fi';
  const localized={...data};
  for(const collection of entry.plugin.collections||[])if(collection.translatable)localized[collection.key]=data[collection.key].filter(item=>(item.locale||site.meta.locale||'fi')===locale);
  return entry.plugin.renderSection(section,localized,{...options,detailUrl,locale});
}
function detail(site,id,slug,options={}){
  const plugin=byId.get(id),data=site.plugins?.[id];if(!plugin||!data?.enabled)return null;
  const collection=plugin.collections?.find(collection=>collection.translatable);
  const item=collection&&data[collection.key].find(item=>item.slug===slug);
  const locale=item?.locale||site.meta.locale||'fi';
  const page=plugin.detail?.(String(slug||''),data,{...options,locale});if(!page)return null;
  const languages=require('./languages');
  const home=(site.pages||[]).find(page=>page.translationGroup==='home'&&page.locale===locale);
  const language={...languages.context(site,home?.slug||''),locale,links:[]};
  if(item)language.links=data[collection.key].filter(other=>(other.translationGroup||other.id)===(item.translationGroup||item.id)&&plugin.detail(other.slug,data,options)).map(other=>({locale:other.locale||site.meta.locale||'fi',label:languages.label(other.locale||site.meta.locale||'fi'),url:plugin.routePrefix+encodeURIComponent(other.slug),current:other.id===item.id}));
  return {...site,language,navigation:language.navigation,footer:home?.footerText?{text:home.footerText}:site.footer,sections:page.sections,meta:{...site.meta,locale,title:page.title,seoTitle:page.seoTitle||'',description:page.description,shareImage:page.shareImage||site.meta.shareImage||'',shareImageAlt:page.shareImageAlt||site.meta.shareImageAlt||'',siteUrl:site.meta.siteUrl?site.meta.siteUrl.replace(/\/+$/,'')+plugin.routePrefix+encodeURIComponent(slug):''}};
}
function publicDetail(site,pathname){for(const plugin of installed)if(plugin.routePrefix&&pathname.startsWith(plugin.routePrefix)){const slug=pathname.slice(plugin.routePrefix.length);if(!slug.includes('/'))return detail(site,plugin.id,slug);}return null;}
function catalog(){return installed.map(({id,name,description,version,sections,collections,routePrefix,adminPage,integrations=[]})=>({id,name,description,version,sections,collections,routePrefix,adminPage,integrations:integrations.map(({id,label,collection})=>({id,label,collection}))}));}
async function runIntegration(id,action){
  const plugin=byId.get(id),integration=plugin?.integrations?.find(item=>item.id===action);
  if(!integration)throw Object.assign(new Error('Integraatiota ei löydy.'),{status:404});
  const rows=await integration.run();
  const normalized=clean({[id]:{[integration.collection]:rows}})[id][integration.collection];
  return {collection:integration.collection,items:normalized};
}
module.exports={clean,cleanSection,renderSection,detail,publicDetail,catalog,runIntegration,types:()=>[...byType.keys()]};
