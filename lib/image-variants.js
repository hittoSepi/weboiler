'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const sharp=require('sharp');
const widths=new Set([320,640,960,1280,1920]);
module.exports=function createVariants(uploads){
  const pending=new Map();
  let queue=Promise.resolve();
  async function variant(name,width){
    width=Number(width);
    if(!/^[a-zA-Z0-9_-]+\.(png|jpe?g|webp|gif)$/i.test(name)||!widths.has(width)){const error=new Error('Virheellinen kuvaversio.');error.status=400;throw error;}
    const source=path.join(uploads,name);
    if(!fs.existsSync(source)||!fs.statSync(source).isFile()){const error=new Error('Kuvaa ei löytynyt.');error.status=404;throw error;}
    const stat=fs.statSync(source);
    if(stat.size>16*1024*1024)throw new Error('Kuvatiedosto on liian suuri.');
    const stamp=crypto.createHash('sha256').update(name+':'+stat.mtimeMs+':'+stat.size).digest('hex').slice(0,24);
    const folder=path.join(uploads,'.variants'),target=path.join(folder,`${stamp}-${width}.webp`);
    if(fs.existsSync(target))return target;
    if(pending.has(target))return pending.get(target);
    if(pending.size>=100){const error=new Error('Kuvankäsittely on varattu. Yritä uudelleen.');error.status=503;throw error;}
    const task=queue.then(async()=>{
      fs.mkdirSync(folder,{recursive:true});
      const temporary=target+'.'+crypto.randomUUID()+'.tmp';
      try{
        await sharp(fs.readFileSync(source),{limitInputPixels:40000000}).rotate().resize({width,withoutEnlargement:true}).webp({quality:80}).toFile(temporary);
        fs.renameSync(temporary,target);return target;
      }finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary);}
    });
    queue=task.catch(()=>{});
    pending.set(target,task);
    try{return await task;}finally{pending.delete(target);}
  }
  return {variant};
};
