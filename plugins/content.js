'use strict';
const text=(key,label,max=500)=>({key,label,type:'text',max});
const category=text('category','Ryhmä / kategoria');
const imageFields=[{key:'image',label:'Kuva',type:'image'},text('imageAlt','Kuvan vaihtoehtoinen teksti')];
const definitions=[
  {type:'pricing-list',label:'Hinnasto',key:'plans',fields:[{...text('title','Palvelun tai paketin nimi',140),required:true},text('price','Hinta (esim. 99 € / kk)',80),{key:'text',label:'Sisältö ja ehdot',type:'textarea',max:3000},text('linkLabel','Painikkeen teksti',80),{key:'url',label:'Painikkeen linkki',type:'url'},category]},
  {type:'faq-list',label:'Usein kysytyt kysymykset',key:'questions',fields:[{...text('title','Kysymys',200),required:true},{key:'text',label:'Vastaus',type:'textarea',max:5000},category]},
  {type:'testimonials-list',label:'Asiakaspalautteet',key:'reviews',fields:[{...text('title','Asiakkaan nimi',140),required:true},text('role','Yritys tai lisätieto',200),{key:'text',label:'Palaute',type:'textarea',max:3000},...imageFields,category]},
  {type:'team-list',label:'Tiimi',key:'people',fields:[{...text('title','Nimi',140),required:true},text('role','Rooli',140),{key:'text',label:'Esittely',type:'textarea',max:3000},text('email','Sähköposti',200),text('phone','Puhelin',60),...imageFields,category]}
];
module.exports={id:'content',name:'Sisältöosiot',description:'Hinnasto, usein kysytyt kysymykset, asiakaspalautteet ja tiimi. Hallitse sisältöjä tässä ja lisää vastaava osio sivueditorissa. Ryhmällä voit rajata eri osioihin eri sisällöt.',version:1,
  sections:definitions.map(item=>({type:item.type,label:item.label,fields:[text('category','Rajaa ryhmään (tyhjä = kaikki)')]})),
  collections:definitions.map(item=>({key:item.key,label:item.label,fields:item.fields})),
  renderSection(section,data){const definition=definitions.find(item=>item.type===section.type);return {...section,type:'content-view',contentKind:definition.key,items:data[definition.key].filter(item=>!section.pluginData?.category||item.category===section.pluginData.category)};}
};
