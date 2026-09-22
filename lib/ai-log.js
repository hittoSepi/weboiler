'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
module.exports=function createAILog(directory){
  const pattern=/^ai-\d{13}-[a-f0-9-]{36}\.json$/;
  function safe(action){try{return action();}catch{console.warn('AI-lokin kirjoitus epäonnistui. Tarkista lokihakemiston oikeudet ja levytila.');}}
  return function start(entry){
    const started=Date.now(),filename=`ai-${started}-${crypto.randomUUID()}.json`,target=path.join(directory,filename);
    const record={...entry,id:filename.slice(0,-5),startedAt:new Date(started).toISOString(),status:'running'};
    const created=safe(()=>{
      fs.mkdirSync(directory,{recursive:true,mode:0o700});
      // Only our own regular log files; never touch other files or subdirectories.
      const files=fs.readdirSync(directory,{withFileTypes:true}).filter(f=>f.isFile()&&pattern.test(f.name)).map(f=>f.name).sort();
      for(const name of files.slice(0,Math.max(0,files.length-99)))fs.unlinkSync(path.join(directory,name));
      fs.writeFileSync(target,JSON.stringify(record,null,2),{flag:'wx',mode:0o600});return true;
    });
    return details=>{if(created)safe(()=>fs.writeFileSync(target,JSON.stringify({...record,...details,finishedAt:new Date().toISOString(),durationMs:Date.now()-started},null,2),{mode:0o600}));};
  };
};
