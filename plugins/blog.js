'use strict';
function visible(post,{preview=false,now=Date.now()}={}){
  return preview||(post.status==='published'&&(!post.publishAt||Date.parse(post.publishAt)<=now));
}
function posts(data,options){return data.posts.filter(post=>visible(post,options)).sort((a,b)=>(Date.parse(b.publishAt)||0)-(Date.parse(a.publishAt)||0));}
module.exports={
  id:'blog',name:'Ajankohtaista',description:'Artikkelit, kategoriat ja ajastus. Valitse artikkelille Julkaistava ja julkaise sivuston muutokset. Tuleva ajankohta avaa artikkelin automaattisesti; tyhjä aika tarkoittaa heti. Esikatselu näyttää myös luonnokset.',version:1,
  sections:[{type:'blog-list',label:'Ajankohtaista / artikkelit',fields:[{key:'category',label:'Kategoria (tyhjä = kaikki)',type:'text'}]}],
  collections:[{key:'posts',label:'Artikkelit',translatable:true,fields:[
    {key:'locale',label:'Kieli (esim. fi, en, sv; tyhjä = sivuston kieli)',type:'text',max:5},
    {key:'translationGroup',label:'Käännösryhmä (sama tunniste eri kieliversioille)',type:'text',max:80},
    {key:'title',label:'Artikkelin otsikko',type:'text',required:true,max:140},
    {key:'slug',label:'Osoitetunniste',type:'slug',required:true},
    {key:'status',label:'Näkyvyys',type:'select',default:'draft',options:[{value:'draft',label:'Luonnos (ei julkiselle sivulle)'},{value:'published',label:'Julkaistava'}]},
    {key:'publishAt',label:'Julkaisuajankohta (oma aikavyöhykkeesi, tyhjä = heti)',type:'datetime'},
    {key:'category',label:'Kategoria',type:'text'},
    {key:'summary',label:'Ingressi / lyhyt kuvaus',type:'textarea',max:500},
    {key:'text',label:'Artikkelin sisältö',type:'textarea',max:20000},
    {key:'image',label:'Artikkelin kuva',type:'image'},
    {key:'imageAlt',label:'Kuvan vaihtoehtoinen teksti',type:'text'}
  ]}],
  routePrefix:'/ajankohtaista/',
  renderSection(section,data,options){
    const items=posts(data,options).filter(post=>!section.pluginData?.category||post.category===section.pluginData.category);
    return {...section,type:'features',items:items.map(post=>({title:post.title,text:post.summary,image:post.image,imageAlt:post.imageAlt,imagePosition:post.imagePosition,url:options.detailUrl(post.slug),linkLabel:require('../lib/ui-text')(options.locale).more}))};
  },
  detail(slug,data,options){
    const post=data.posts.find(post=>post.slug===slug&&visible(post,options));if(!post)return null;
    return {title:post.title,description:post.summary,shareImage:post.image,shareImageAlt:post.imageAlt,sections:[{id:'article',type:'hero',eyebrow:post.category,title:post.title,text:post.summary,image:post.image,imagePosition:post.imagePosition},{id:'article-text',type:'text',text:post.text}]};
  }
};
