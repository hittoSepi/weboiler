'use strict';
const fields=[
  {key:'title',label:'Tuotteen nimi',type:'text',required:true,max:140},
  {key:'slug',label:'Osoitetunniste',type:'slug',required:true},
  {key:'price',label:'Hinta (esim. 29,90 €)',type:'text',max:80},
  {key:'category',label:'Kategoria',type:'text'},
  {key:'text',label:'Tuotekuvaus',type:'textarea',max:5000},
  {key:'image',label:'Tuotekuva',type:'image'},
  {key:'imageAlt',label:'Kuvan vaihtoehtoinen teksti',type:'text'}
];
module.exports={id:'products',name:'Tuotteet',description:'Tuotekatalogi, ei ostoskoria tai maksamista. Sisältö julkaistaan erikseen.',version:1,
  adminPage:{slug:'tuotteet',label:'Tuotteet',icon:'fa-box'},
  collections:[{key:'items',label:'Tuotteet',fields}],
  sections:[{type:'product-list',label:'Tuotelista',fields:[{key:'category',label:'Kategoria (tyhjä = kaikki)',type:'text'}]},
    {type:'product-feature',label:'Tuotenosto',fields:[{key:'productId',label:'Tuote',type:'reference',plugin:'products',collection:'items'}]}],
  routePrefix:'/tuotteet/',
  renderSection(section,data,{detailUrl,locale}){
    const items=data.items.filter(item=>section.type==='product-feature'?item.id===section.pluginData?.productId:!section.pluginData?.category||item.category===section.pluginData.category);
    return {...section,type:'features',items:items.map(item=>({...item,text:[item.price,item.text].filter(Boolean).join('\n'),url:detailUrl(item.slug),linkLabel:require('../lib/ui-text')(locale).more}))};
  },
  detail(slug,data){const item=data.items.find(item=>item.slug===slug);return item?{title:item.title,description:item.text.slice(0,300),shareImage:item.image,shareImageAlt:item.imageAlt,sections:[{id:'product',type:'hero',title:item.title,eyebrow:item.category,text:item.price,image:item.image,imagePosition:item.imagePosition},{id:'description',type:'text',text:item.text}]}:null;},
  integrations:[{id:'import',label:'Hae tuotteet API:sta',collection:'items',async run(){
    const payload=await require('../lib/integration-http').getJSON(process.env.PRODUCTS_API_URL,process.env.PRODUCTS_API_TOKEN);
    const items=Array.isArray(payload)?payload:payload?.products;
    if(!Array.isArray(items)||items.length>100)throw new Error('API:n tulee palauttaa enintään 100 tuotetta: lista tai {products: [...]}.');
    return items.map(item=>{if(!item||typeof item!=='object'||item.id==null)throw new Error('Tuotteelta puuttuu id.');return {...item,id:String(item.id)};});
  }}]
};
