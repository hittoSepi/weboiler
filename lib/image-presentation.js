'use strict';
function position(value){
  if(value===undefined||value==='')return '50% 50%';
  if(typeof value!=='string'||!/^\d{1,3}% \d{1,3}%$/.test(value)||value.split(' ').some(v=>Number(v.slice(0,-1))>100))throw new Error('Kuvan rajauspisteen pitää olla välillä 0–100 %.');
  return value;
}
function optimized(src,width=1280){
  // Animated GIFs retain their original animation; remote files are never fetched by the server.
  return /^\/uploads\/[a-zA-Z0-9_-]+\.(png|jpe?g|webp)$/i.test(src||'')?`/media/${src.slice(9)}/${width}`:src||'';
}
function srcset(src){return src&&optimized(src)!==src?[320,640,960,1280,1920].map(width=>`${optimized(src,width)} ${width}w`).join(', '):'';}
module.exports={position,optimized,srcset};
