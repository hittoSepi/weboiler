'use strict';
const TYPES=new Set(['text','textarea','email','tel','select','checkbox']);
const email=value=>/^[^\s@<>;,]+@[^\s@<>;,]+\.[^\s@<>;,]+$/.test(value)&&!/[\r\n]/.test(value);
function clean(input){
  if(input==null)return null;
  if(typeof input!=='object'||!Array.isArray(input.fields)||!input.fields.length||input.fields.length>20)throw new Error('Lomakkeella pitää olla 1–20 kenttää.');
  const recipient=String(input.recipient||'').trim();if(recipient&&(recipient.length>200||!email(recipient)))throw new Error('Lomakkeen vastaanottajan sähköposti ei kelpaa.');
  const ids=new Set();
  return {recipient,fields:input.fields.map(field=>{
    if(!field||!/^[a-z][a-z0-9_-]{0,39}$/.test(field.id)||ids.has(field.id)||['website','formId','page','__proto__','constructor','prototype'].includes(field.id))throw new Error('Lomakekentän tunniste ei kelpaa tai on jo käytössä.');ids.add(field.id);
    const label=String(field.label||'').trim();if(!label||label.length>120||!TYPES.has(field.type))throw new Error('Tarkista lomakekentän nimi ja tyyppi.');
    const options=field.type==='select'?(Array.isArray(field.options)?field.options:[]):[];
    if(field.type==='select'&&(!options.length||options.length>30||options.some(x=>typeof x!=='string'||!x.trim()||x.length>120)||new Set(options).size!==options.length))throw new Error('Valintakentällä pitää olla 1–30 erilaista vaihtoehtoa.');
    return {id:field.id,label,type:field.type,required:field.required===true,options};
  })};
}
function submission(site,input){
  const sections=input.page?(site.pages||[]).find(page=>page.slug===input.page)?.sections:site.sections;
  const section=sections?.find(section=>section.id===input.formId&&section.type==='contact');
  if(!section?.form)throw new Error('Lomaketta ei ole julkaistu tai se on poistettu.');
  const form=clean(section.form),answers=[];
  for(const field of form.fields){
    const raw=input.values?.[field.id];
    if(raw!==undefined&&typeof raw!=='string')throw new Error(`${field.label}: virheellinen arvo.`);
    const value=String(raw||'').trim(),max=field.type==='textarea'?5000:500;
    if(value.length>max)throw new Error(`${field.label}: vastaus on liian pitkä.`);
    if(field.required&&!value)throw new Error(`Täytä ${field.label}.`);
    if(value&&field.type==='email'&&!email(value))throw new Error(`${field.label}: tarkista sähköpostiosoite.`);
    if(value&&field.type==='select'&&!field.options.includes(value))throw new Error(`${field.label}: valitse sallittu vaihtoehto.`);
    if(field.type==='checkbox'&&value&&!['on','yes'].includes(value))throw new Error(`${field.label}: virheellinen valinta.`);
    answers.push({id:field.id,label:field.label,type:field.type,value:field.type==='checkbox'?(value?'Kyllä':'Ei'):value});
  }
  return {recipient:form.recipient,message:{formTitle:section.title||'Lomake',formId:section.id,page:String(input.page||''),name:answers.find(x=>x.id==='name')?.value||section.title||'Lomakevastaus',email:answers.find(x=>x.type==='email')?.value||'',phone:answers.find(x=>x.type==='tel')?.value||'',message:answers.map(x=>`${x.label}: ${x.value||'-'}`).join('\n'),answers}};
}
function fieldsHtml(form,esc){
  return form.fields.map(field=>{
    const attrs=`name="${esc(field.id)}"${field.required?' required':''}`,label=esc(field.label)+(field.required?' *':'');
    if(field.type==='textarea')return `<label>${label}<textarea ${attrs} maxlength="5000"></textarea></label>`;
    if(field.type==='select')return `<label>${label}<select ${attrs}><option value="">Valitse</option>${field.options.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select></label>`;
    if(field.type==='checkbox')return `<label><input type="checkbox" ${attrs}> ${label}</label>`;
    return `<label>${label}<input type="${field.type}" ${attrs} maxlength="500"></label>`;
  }).join('');
}
module.exports={clean,submission,fieldsHtml};
