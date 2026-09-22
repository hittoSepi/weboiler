'use strict';
const origins=['https://www.google.com','https://calendly.com','https://buttondown.com'];
function url(value,provider){
  if(!value)return '';
  if(typeof value!=='string'||value.length>4000||/[\x00-\x20\\]/.test(value))throw new Error('Upotuksen osoite ei kelpaa.');
  let parsed;try{parsed=new URL(value);}catch{throw new Error('Anna upotuksen HTTPS-osoite, ei HTML-koodia.');}
  if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.port||!origins.includes(parsed.origin))throw new Error('Upotuksen palvelua ei tueta.');
  const valid=provider==='map'?parsed.origin===origins[0]&&/^\/maps\/embed(?:\/|$)/.test(parsed.pathname):provider==='booking'?parsed.origin===origins[1]&&/^\/[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)?\/?$/.test(parsed.pathname):provider==='newsletter'?parsed.origin===origins[2]&&/^\/[a-zA-Z0-9_-]+\/?$/.test(parsed.pathname)&&parsed.searchParams.get('as_embed')==='true':false;
  if(!valid)throw new Error('Osoite ei vastaa valitun upotuksen palvelua tai upotuspolkua.');
  return parsed.href;
}
module.exports={origins,url};
