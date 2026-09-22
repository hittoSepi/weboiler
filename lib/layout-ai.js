'use strict';
const crypto=require('node:crypto');
const layout=require('./layout-builder');
function prepare(site,input){
  const kind=input.kind;
  if(!['elements','sections'].includes(kind))throw new Error('Valitse elementti tai osio.');
  const prompt=String(input.prompt||'').trim();
  if(!prompt||prompt.length>6000)throw new Error('Kuvauksen pituus on 1–6000 merkkiä.');
  const builder=layout.clean(site.builder);
  const original=input.targetId?builder[kind].find(t=>t.id===input.targetId):null;
  if(input.targetId&&!original)throw new Error('Muokattavaa pohjaa ei löydy.');
  const id=original?.id||crypto.randomUUID();
  const instructions=`Create one Weboiler ${kind} template as a JSON object {id,name,root}. No markdown fences. Finnish labels and example content. No scripts, CSS code, invented image URLs, plugins or external services. Use native nodes, not HTML for the whole design.
Node: {id,type,label,editable,style,defaults,children}. IDs unique alphanumeric/hyphen max80. Types: div,flex,grid,heading,subtitle,text,image,list,icon,html,element. Only containers div/flex/grid have children. defaults:{value,image,alt,url} strings. List value is newline-separated; icon value is Font Awesome name without fa-. Images may be empty. element nodes use ref from the available element IDs.
style: background/color HEX; gap 0..100,padding 0..160,radius 0..100,fontSize 0..160,minHeight 0..1000,grow 0..12,columns 1..12; align start/center/end/stretch; direction row/column; mobileStack true. Maximum100 nodes,8 levels. Prefer simple responsive flex/grid. Do not invent company facts.
When editing retain EVERY existing node ID, type, ref and editable flag, and element reference ancestry. You may change style, default content, labels and add nodes. Do not remove existing fields.
Template ID: ${id}
Available element references: ${JSON.stringify(builder.elements.filter(t=>t.id!==id).map(t=>({id:t.id,name:t.name})))}
Current template: ${JSON.stringify(original)}
User request: ${prompt}`;
  return {kind,builder,original,id,prompt:instructions};
}
function validate(text,context){
  let proposal;try{proposal=JSON.parse(text);}catch{throw new Error('AI ei palauttanut kelvollista JSON-pohjaa. Yritä uudelleen.');}
  if(!proposal||Array.isArray(proposal)||typeof proposal!=='object'||!proposal.root)throw new Error('AI-vastauksesta puuttuu pohjan rakenne.');
  proposal.id=context.id;
  const candidate=structuredClone(context.builder);
  candidate[context.kind]=candidate[context.kind].filter(t=>t.id!==context.id).concat(proposal);
  const cleaned=layout.clean(candidate),template=cleaned[context.kind].find(t=>t.id===context.id);
  function fields(root){const map=new Map();function walk(n,prefix=''){map.set(n.id,JSON.stringify([n.type,n.ref,n.editable,prefix]));n.children.forEach(c=>walk(c,n.type==='element'?prefix+'/'+n.id:prefix));}walk(root);return map;}
  function check(n){if(n.type==='plugin')throw new Error('AI-pohjiin ei vielä lisätä plugin-solmuja.');if(!['div','flex','grid'].includes(n.type)&&n.children.length)throw new Error('Vain ryhmät voivat sisältää alielementtejä.');if(n.type==='html')n.defaults.value=layout.html(n.defaults.value);n.children.forEach(check);}check(template.root);
  if(context.original){const next=fields(template.root);for(const [id,binding]of fields(context.original.root))if(next.get(id)!==binding)throw new Error('AI muutti tai poisti olemassa olevan sisältökentän. Pyydä säilyttämään nykyiset kentät.');}
  return {template,builder:cleaned};
}
module.exports={prepare,validate};
