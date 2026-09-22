'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

module.exports=function resolveSecret({provided,production,file}) {
  if(provided){if(production&&provided.length<32)throw new Error('SESSION_SECRET vaatii vähintään 32 merkkiä.');return provided;}
  if(production)throw new Error('Aseta SESSION_SECRET tuotantoympäristöön.');
  if(fs.existsSync(file))return fs.readFileSync(file,'utf8').trim();
  fs.mkdirSync(path.dirname(file),{recursive:true});
  const secret=crypto.randomBytes(32).toString('hex');
  try{fs.writeFileSync(file,secret,{flag:'wx',mode:0o600});}catch(error){if(error.code==='EEXIST')return fs.readFileSync(file,'utf8').trim();throw error;}
  return secret;
};
