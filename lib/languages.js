'use strict';
const names={fi:'Suomi',en:'English',sv:'Svenska'};
function locale(value,fallback='fi'){
  if(!value)return fallback;
  if(typeof value!=='string'||! /^[a-z]{2}(?:-[A-Z]{2})?$/.test(value))throw new Error('Kielitunnus: käytä esimerkiksi fi, en tai sv.');
  return value;
}
function group(value,fallback){
  if(!value)return fallback;
  if(typeof value!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(value))throw new Error('Käännösryhmän tunniste ei kelpaa.');
  return value;
}
function entries(site){return [{slug:'',id:'home',title:site.meta.title,locale:locale(site.meta.locale),translationGroup:'home'},...(site.pages||[]).map(page=>({...page,locale:locale(page.locale,locale(site.meta.locale)),translationGroup:group(page.translationGroup,page.id)}))];}
function validate(site){
  const seen=new Set();for(const page of entries(site)){const key=page.translationGroup+':'+page.locale;if(seen.has(key))throw new Error('Käännösryhmässä voi olla vain yksi sivu samalla kielellä.');seen.add(key);}
}
function context(site,slug=''){
  const pages=entries(site),current=pages.find(page=>page.slug===slug)||pages[0];
  const translated=page=>pages.find(other=>other.translationGroup===page.translationGroup&&other.locale===current.locale);
  const links=pages.filter(page=>page.translationGroup===current.translationGroup).map(page=>({locale:page.locale,label:names[page.locale]||page.locale,url:page.slug?'/'+page.slug:'/',current:page.locale===current.locale}));
  const navigation=current.navigation??site.navigation.map(item=>{
    let target=String(item.target||'');if(target&&!target.startsWith('/')&&!target.startsWith('#')&&!/^[a-z]+:/i.test(target))target='/#'+target;
    if(!target.startsWith('/')||target.startsWith('//'))return item;
    const [pathname,hash]=target.split('#'),page=pages.find(page=>(page.slug?'/'+page.slug:'/')===pathname),other=page&&translated(page);
    return other?{label:other===page||hash?item.label:other.title,target:(other.slug?'/'+other.slug:'/')+(hash?'#'+hash:'')}:item;
  });
  return {locale:current.locale,links,navigation,homeUrl:translated(pages[0])?.slug?'/'+translated(pages[0]).slug:'/',baseUrl:site.meta.siteUrl||''};
}
function navigation(input){
  if(input==null)return null;
  if(!Array.isArray(input)||input.length>50)throw new Error('Sivun valikossa voi olla enintään 50 linkkiä.');
  return input.map(item=>{if(!item||typeof item.label!=='string'||!item.label.trim()||item.label.length>60)throw new Error('Valikkolinkin nimi puuttuu tai on liian pitkä.');return {label:item.label.trim(),target:require('./validation').url(item.target)};});
}
module.exports={locale,group,validate,context,navigation,label:code=>names[code]||code};
