'use strict';

const fs = require('node:fs');
const path = require('node:path');

function imageType(file) {
  const descriptor = fs.openSync(file,'r');
  const bytes = Buffer.alloc(32);
  let size;
  try { size=fs.readSync(descriptor,bytes,0,bytes.length,0); } finally { fs.closeSync(descriptor); }
  if(size>=24 && bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) && bytes.toString('ascii',12,16)==='IHDR') return 'image/png';
  if(size>=3 && bytes[0]===255 && bytes[1]===216 && bytes[2]===255) return 'image/jpeg';
  if(size>=10 && ['GIF87a','GIF89a'].includes(bytes.toString('ascii',0,6))) return 'image/gif';
  if(size>=16 && bytes.toString('ascii',0,4)==='RIFF' && bytes.toString('ascii',8,12)==='WEBP') return 'image/webp';
  return null;
}

function validateUploads(files) {
  try {
    for(const file of files) if(imageType(file.path)!==file.mimetype) throw new Error('Tiedosto ei vastaa ilmoitettua kuvatyyppiä. Käytä PNG-, JPEG-, WebP- tai GIF-kuvaa.');
  } catch(error) {
    for(const file of files) if(fs.existsSync(file.path))fs.unlinkSync(file.path);
    throw error;
  }
  return files.map(file=>({name:file.originalname,src:`/uploads/${path.basename(file.filename)}`}));
}

module.exports = { validateUploads };
