'use strict';
module.exports={
  id:'references',name:'Referenssit',description:'Projektikortit ja projektien omat esittelysivut.',version:1,
  sections:[{type:'references-grid',label:'Referenssikortit',fields:[{key:'category',label:'Rajaa kategoriaan (tyhjä = kaikki)',type:'text'}]}],
  collections:[{key:'projects',label:'Projektit',translatable:true,fields:[
    {key:'locale',label:'Kieli (esim. fi, en, sv; tyhjä = sivuston kieli)',type:'text',max:5},
    {key:'translationGroup',label:'Käännösryhmä (sama tunniste eri kieliversioille)',type:'text',max:80},
    {key:'title',label:'Projektin nimi',type:'text',required:true,max:140},
    {key:'slug',label:'Osoitetunniste',type:'slug',required:true},
    {key:'category',label:'Kategoria',type:'text'},
    {key:'summary',label:'Lyhyt kuvaus',type:'textarea',max:500},
    {key:'text',label:'Projektin esittely',type:'textarea',max:10000},
    {key:'image',label:'Kuva',type:'image'},
    {key:'imageAlt',label:'Kuvan vaihtoehtoinen teksti',type:'text'}
  ]}],
  renderSection(section,data,{detailUrl,locale}) {
    const projects=data.projects.filter(project=>!section.pluginData?.category||project.category===section.pluginData.category);
    return {...section,type:'features',items:projects.map(project=>({title:project.title,text:project.summary,image:project.image,imageAlt:project.imageAlt,imagePosition:project.imagePosition,url:detailUrl(project.slug),linkLabel:require('../lib/ui-text')(locale).more}))};
  },
  routePrefix:'/referenssit/',
  detail(slug,data,{locale='fi'}={}){
    const project=data.projects.find(project=>project.slug===slug);if(!project)return null;
    return {title:project.title,description:project.summary,shareImage:project.image,shareImageAlt:project.imageAlt,sections:[{id:'project',type:'hero',title:project.title,text:project.summary,image:project.image,imagePosition:project.imagePosition},{id:'project-story',type:'text',title:({fi:'Projektista',en:'About the project',sv:'Om projektet'})[locale.split('-')[0]]||'About the project',text:project.text}]};
  }
};
