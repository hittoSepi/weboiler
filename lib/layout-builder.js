'use strict';
const sanitize=require('sanitize-html'),validate=require('./validation');
const types=['div','flex','grid','heading','subtitle','text','image','list','icon','html','element','plugin'];
const ident=value=>{if(!/^[a-zA-Z0-9-]{1,80}$/.test(value||''))throw new Error('Rakenteen tunniste ei kelpaa.');return value;};
const text=value=>String(value??'').slice(0,10000);
const html=value=>sanitize(text(value),{allowedTags:['div','span','p','h2','h3','h4','strong','em','ul','ol','li','br','a','img'],allowedAttributes:{a:['href','title'],img:['src','alt']},allowedSchemes:['https','http','mailto','tel'],allowProtocolRelative:false});
function content(input={}){const out={};for(const [key,value] of Object.entries(input)){if(!/^[a-zA-Z0-9-]{1,600}$/.test(key)||['constructor','prototype','__proto__'].includes(key))throw new Error('Sisältötunniste ei kelpaa.');if(Object.keys(out).length>=300)throw new Error('Liikaa sisältökenttiä.');out[key]={value:text(value?.value),image:validate.url(value?.image,true),alt:text(value?.alt),url:validate.url(value?.url)};}return out;}
function clean(input={}){
  const cleanList=(list)=>validate.list(list,40,'Pohjat').map(template=>{
    let count=0;const ids=new Set();
    function node(n,depth=0){if(depth>8||++count>100)throw new Error('Rakenne on liian suuri (100 solmua / 8 tasoa).');const id=ident(n.id);if(ids.has(id))throw new Error('Rakenteen tunniste on jo käytössä.');ids.add(id);if(!types.includes(n.type))throw new Error('Tuntematon elementtityyppi.');const s=n.style||{},style={};
      for(const key of ['background','color'])if(s[key])style[key]=validate.color(s[key],'');
      for(const [key,max]of [['gap',100],['padding',160],['radius',100],['fontSize',160],['minHeight',1000],['grow',12],['columns',12]])if(s[key]!==undefined&&s[key]!==''){const value=Number(s[key]);if(!Number.isFinite(value)||value<0||value>max)throw new Error('Ulkoasun numeroarvo ei kelpaa.');style[key]=value;}
      style.align=['start','center','end','stretch'].includes(s.align)?s.align:'stretch';style.direction=s.direction==='column'?'column':'row';style.mobileStack=s.mobileStack!==false;
      if(n.type==='plugin'&&!require('./plugins').types().includes(n.pluginType))throw new Error('Lisäosan elementtityyppiä ei löydy.');
      return {id,type:n.type,label:text(n.label).slice(0,100),editable:n.editable!==false,ref:n.ref?ident(n.ref):'',pluginType:text(n.pluginType).slice(0,80),style,defaults:content({default:n.defaults||{}}).default,children:validate.list(n.children,100,'Lapset').map(child=>node(child,depth+1))};
    }
    return {id:ident(template.id),name:text(template.name).slice(0,100)||'Nimetön pohja',root:node(template.root)};
  });
  const result={elements:cleanList(input.elements),sections:cleanList(input.sections)};
  for(const list of [result.elements,result.sections])if(new Set(list.map(x=>x.id)).size!==list.length)throw new Error('Pohjan tunniste on jo käytössä.');
  let expanded=0;
  function walk(n,seen=[],depth=0){if(depth>16||++expanded>500)throw new Error('Liian suuri tai syvä elementtirakenne.');if(n.type==='element'&&n.ref){if(seen.includes(n.ref))throw new Error('Elementti ei voi sisältää itseään.');const ref=result.elements.find(x=>x.id===n.ref);if(!ref)throw new Error('Viitattu elementti puuttuu.');walk(ref.root,[...seen,n.ref],depth+1);}n.children.forEach(c=>walk(c,seen,depth+1));}
  [...result.elements,...result.sections].forEach(t=>{expanded=0;walk(t.root);});return result;
}
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(section,site,renderPlugin){const template=site.builder?.sections?.find(t=>t.id===section.templateId);if(!template)return '';
  let budget=500;
  function node(n,prefix='',seen=[]){if(--budget<0||seen.length>16)return '';const key=prefix?prefix+'-'+n.id:n.id;const v=n.editable?(section.content?.[key]||n.defaults):n.defaults;const s=n.style||{};
    const css=Object.entries(s).filter(([k])=>['background','color'].includes(k)).map(([k,v])=>`${k}:${v}`);
    for(const [key,prop]of [['gap','gap'],['padding','padding'],['radius','border-radius'],['fontSize','font-size'],['minHeight','min-height']])if(s[key]!=null)css.push(`${prop}:${s[key]}px`);
    if(s.grow!=null)css.push(`flex:${s.grow} 1 0`);if(n.type==='grid')css.push(`grid-template-columns:repeat(${Math.max(1,s.columns||3)},minmax(0,1fr))`);if(n.type==='flex')css.push(`flex-direction:${s.direction||'row'}`);css.push(`align-items:${s.align||'stretch'}`);
    const attrs=`class="layout-node layout-${n.type}${s.mobileStack!==false?' layout-stack':''}" style="${esc(css.join(';'))}"`;
    let body='';
    if(n.type==='element'){const ref=site.builder.elements.find(t=>t.id===n.ref);if(ref&&!seen.includes(n.ref))body=node(ref.root,key,[...seen,n.ref]);}
    else if(n.type==='plugin')body=renderPlugin({id:key,type:n.pluginType,title:'',pluginData:{productId:v?.value,category:v?.value}});
    else if(n.type==='html')body=html(v?.value);
    else if(n.type==='image')body=v?.image?`<img src="${esc(validate.url(v.image,true))}" alt="${esc(v.alt)}" loading="lazy">`:'';
    else if(n.type==='icon')body=/^[a-z0-9-]+$/.test(v?.value||'')?`<i class="fa-solid fa-${esc(v.value)}" aria-hidden="true"></i>`:'';
    else if(n.type==='list')body='<ul>'+text(v?.value).split('\n').filter(Boolean).map(t=>`<li>${esc(t)}</li>`).join('')+'</ul>';
    else if(['heading','subtitle','text'].includes(n.type)){const tag=n.type==='heading'?'h2':n.type==='subtitle'?'h3':'p';body=`<${tag}>${esc(v?.value).replace(/\n/g,'<br>')}</${tag}>`;}
    body+=n.children.map(c=>node(c,prefix,seen)).join('');return `<div ${attrs}>${body}</div>`;
  }
  return `<section id="${esc(section.id)}" class="block"><div class="wrap">${node(template.root)}</div></section>`;
}
module.exports={clean,content,render,html,types};
