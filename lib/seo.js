'use strict';
const validate=require('./validation');
const esc=value=>String(value||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function fields(input={}){return {seoTitle:String(input.seoTitle||'').trim().slice(0,140),shareImage:validate.url(input.shareImage,true),shareImageAlt:String(input.shareImageAlt||'').trim().slice(0,300)};}
function httpUrl(value,stripQuery=true){try{const url=new URL(value);if(!['https:','http:'].includes(url.protocol)||url.username||url.password)return '';url.hash='';if(stripQuery)url.search='';return url.href;}catch{return '';}}
function absoluteImage(value,canonical){
  if(!value)return '';
  if(value.startsWith('/')&&!value.startsWith('//')){if(!canonical)return '';return new URL(value,canonical).href;}
  return httpUrl(value,false);
}
function head(meta,{preview=false}={}){
  const title=meta.seoTitle||meta.title||meta.siteName||'',description=meta.description||'',canonical=httpUrl(meta.siteUrl),image=absoluteImage(meta.shareImage,canonical);
  const tag=(name,value,property=false)=>`<meta ${property?'property':'name'}="${name}" content="${esc(value)}">`;
  return `<title>${esc(title)}</title>${tag('description',description)}${preview?tag('robots','noindex, nofollow'):''}${canonical?`<link rel="canonical" href="${esc(canonical)}">`:''}${tag('og:type','website',true)}${tag('og:title',title,true)}${tag('og:description',description,true)}${tag('og:site_name',meta.siteName,true)}${canonical?tag('og:url',canonical,true):''}${image?tag('og:image',image,true)+tag('og:image:alt',meta.shareImageAlt||title,true):''}${tag('twitter:card',image?'summary_large_image':'summary')}${tag('twitter:title',title)}${tag('twitter:description',description)}${image?tag('twitter:image',image)+tag('twitter:image:alt',meta.shareImageAlt||title):''}`;
}
module.exports={fields,head,httpUrl};
