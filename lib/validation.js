'use strict';

function color(value, fallback) {
  if(value===undefined || value==='')return fallback;
  if(typeof value!=='string'||!/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(value))throw new Error('Värin pitää olla HEX-väri, esimerkiksi #07101c.');
  return value;
}
function font(value) {
  if(!value)return 'Arial, sans-serif';
  if(typeof value!=='string'||value.length>100||!/^[a-zA-Z0-9 ,"'-]+$/.test(value))throw new Error('Fonttiperhe sisältää kiellettyjä merkkejä.');
  return value;
}
function url(value, image=false) {
  const result=String(value||'').trim();
  if(!result)return '';
  if(result.length>500 || /[\x00-\x20\x7f\\]/.test(result))throw new Error('Osoite sisältää välilyöntejä tai kiellettyjä merkkejä.');
  if(/^\/(?!\/)/.test(result)||(!image&&result.startsWith('#')))return result;
  if(!image&&/^(mailto:|tel:)[^<>"']+$/i.test(result))return result;
  try {const parsed=new URL(result);if(['http:','https:'].includes(parsed.protocol)&&!parsed.username&&!parsed.password)return result;}catch{}
  throw new Error(image?'Kuvan osoitteen pitää olla paikallinen polku tai http(s)-osoite.':'Linkin pitää olla paikallinen polku, #osion-tunniste, http(s)-, mailto:- tai tel:-osoite.');
}
function list(value,max,label){
  if(value===undefined)return [];
  if(!Array.isArray(value))throw new Error(`${label}: odotettiin listaa.`);
  if(value.length>max)throw new Error(`${label}: enintään ${max} kohdetta.`);
  if(value.some(item=>!item||typeof item!=='object'||Array.isArray(item)))throw new Error(`${label}: virheellinen kohde.`);
  return value;
}
function sections(value) {
  const items=list(value,30,'Sivun osiot');
  const ids=new Set();
  for(const section of items) {
    if(typeof section.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(section.id))throw new Error('Osion tunnisteessa voi käyttää kirjaimia, numeroita, alaviivaa ja yhdysmerkkiä.');
    if(ids.has(section.id))throw new Error(`Osion tunniste on jo käytössä: ${section.id}`);
    ids.add(section.id);
    list(section.items,20,'Palvelukortit');
    list(section.images,40,'Kuvat');
  }
  return items;
}
module.exports={color,font,url,list,sections};
