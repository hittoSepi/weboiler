'use strict';
const https=require('node:https'),dns=require('node:dns'),net=require('node:net');
const blocked=new net.BlockList();
for(const [ip,prefix] of [['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.168.0.0',16],['192.0.0.0',24],['198.18.0.0',15],['224.0.0.0',3]])blocked.addSubnet(ip,prefix);
function endpoint(value){let url;try{url=new URL(value);}catch{throw new Error('Määritä palvelimen PRODUCTS_API_URL (.env).');}if(url.protocol!=='https:'||url.username||url.password||url.port||net.isIP(url.hostname)||url.hash)throw new Error('API-osoitteen tulee olla julkinen HTTPS-domain ilman tunnuksia tai porttia.');return url;}
function getJSON(value,token=''){
  const url=endpoint(value);if(/[\r\n]/.test(token))throw new Error('API-avain ei kelpaa.');
  return new Promise((resolve,reject)=>{
    const fail=()=>reject(new Error('API-haku epäonnistui. Tarkista palvelimen osoite ja tunnukset.'));
    const request=https.get(url,{headers:{Accept:'application/json',...(token?{Authorization:'Bearer '+token}:{})},lookup(host,options,callback){
      dns.lookup(host,{family:4},(error,address)=>{if(error||blocked.check(address||'0.0.0.0'))return callback(new Error('Osoite ei ole julkinen.'));callback(null,options.all?[{address,family:4}]:address,4);});
    }},response=>{
      if(response.statusCode!==200){response.resume();fail();return;}
      const chunks=[];let bytes=0;
      response.on('data',chunk=>{bytes+=chunk.length;if(bytes>2*1024*1024){request.destroy();fail();}else chunks.push(chunk);});
      response.on('error',fail);
      response.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch{reject(new Error('API ei palauttanut kelvollista JSON-dataa.'));}});
    });
    const timer=setTimeout(()=>{request.destroy();fail();},10000);request.on('close',()=>clearTimeout(timer));request.on('error',fail);
  });
}
module.exports={getJSON,endpoint};
