'use strict';
const seo=require('./seo');
const languages=require('./languages');
const reserved=new Set(['admin','api','assets','uploads','vendor','robots.txt','sitemap.xml']);
function validatePages(pages,cleanSections) {
  if(pages===undefined)return [];
  if(!Array.isArray(pages)||pages.length>50)throw new Error('Sivustolla voi olla enintään 50 alasivua.');
  const ids=new Set(),slugs=new Set();
  return pages.map(page=>{
    if(!page||typeof page!=='object'||!/^[a-zA-Z0-9_-]{1,80}$/.test(page.id||'')||page.id==='home'||ids.has(page.id))throw new Error('Sivun tunniste on virheellinen tai jo käytössä.');
    if(typeof page.slug!=='string'||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.slug)||page.slug.length>100||reserved.has(page.slug)||slugs.has(page.slug))throw new Error('Sivun osoitteen pitää olla yksilöllinen: pienet kirjaimet, numerot ja yhdysmerkit. Hallinnan osoitteet on varattu.');
    ids.add(page.id);slugs.add(page.slug);
    const title=String(page.title||'').trim().slice(0,140);
    if(!title)throw new Error('Sivun nimi puuttuu.');
    return {navigation:languages.navigation(page.navigation),id:page.id,slug:page.slug,title,locale:page.locale?languages.locale(page.locale):'',translationGroup:languages.group(page.translationGroup,page.id),footerText:String(page.footerText||'').trim().slice(0,500),description:String(page.description||'').trim().slice(0,300),...seo.fields(page),sections:cleanSections(page.sections)};
  });
}
function selectPage(site,slug='') {
  if(!slug)return site;
  const page=(site.pages||[]).find(page=>page.slug===slug);
  if(!page)return null;
  const language=languages.context(site,slug);
  return {...site,language,navigation:language.navigation,footer:page.footerText?{text:page.footerText}:site.footer,sections:page.sections,meta:{...site.meta,locale:language.locale,title:page.title,seoTitle:page.seoTitle||'',description:page.description,shareImage:page.shareImage||site.meta.shareImage||'',shareImageAlt:page.shareImage? page.shareImageAlt||page.title:site.meta.shareImageAlt||'',siteUrl:site.meta.siteUrl?site.meta.siteUrl.replace(/\/+$/,'')+'/'+page.slug:''}};
}
module.exports={validatePages,selectPage};
