'use strict';
const validation=require('./validation');
const keys=['background','surface','text','muted','accent','font','headingFont','maxWidth','radius'];
function prepare(theme,input){
  const prompt=String(input.prompt||'').trim();
  if(!prompt||prompt.length>6000)throw new Error('Kuvauksen pituus on 1–6000 merkkiä.');
  const current=Object.fromEntries(keys.map(key=>[key,theme?.[key]]));
  return `Create a Weboiler theme JSON object with exactly these keys: background,surface,text,muted,accent,font,headingFont,maxWidth,radius. No markdown, HTML, CSS code or extra keys. Colors must be #RRGGBB HEX. Use readable contrasting text and muted text against both background and surface. font and headingFont must use system font stacks such as Arial, sans-serif or Georgia, serif; no downloaded fonts. maxWidth is a number 800..1800 pixels; radius a number 0..40 pixels. Keep current values unless the requested design calls for a change. Current theme: ${JSON.stringify(current)}\nUser request: ${prompt}`;
}
function validate(text){
  let value;try{value=JSON.parse(text);}catch{throw new Error('AI ei palauttanut kelvollista JSON-teemaa. Yritä uudelleen.');}
  if(!value||Array.isArray(value)||typeof value!=='object'||Object.keys(value).length!==keys.length||keys.some(key=>!Object.hasOwn(value,key)))throw new Error('AI-teeman kentät eivät vastaa sivuston rakennetta.');
  const theme={};
  for(const key of keys.slice(0,5)){if(typeof value[key]!=='string'||!value[key])throw new Error('Teemasta puuttuu väri.');theme[key]=validation.color(value[key]);}
  for(const key of ['font','headingFont']){if(typeof value[key]!=='string'||!value[key].trim())throw new Error('Teemasta puuttuu fontti.');theme[key]=validation.font(value[key]);}
  for(const [key,min,max]of [['maxWidth',800,1800],['radius',0,40]]){if(typeof value[key]!=='number'||!Number.isFinite(value[key])||value[key]<min||value[key]>max)throw new Error('Teeman mitoitus ei kelpaa.');theme[key]=value[key];}
  return theme;
}
module.exports={prepare,validate};
