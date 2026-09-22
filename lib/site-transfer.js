'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),sharp=require('sharp');
const formats={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif'};
const MAX_BYTES=32*1024*1024;
// Match standalone local URLs, never the path portion of an external URL.
const pattern=/(?<![a-zA-Z0-9_/:.%-])\/(?:uploads|assets)\/[a-zA-Z0-9_./%-]+\.(?:png|jpe?g|webp|gif)(?=$|[\s"'<>?#)])/gi;
function references(value,result=new Set()){
  if(typeof value==='string')for(const match of value.matchAll(pattern))result.add(match[0]);
  else if(Array.isArray(value))value.forEach(item=>references(item,result));
  else if(value&&typeof value==='object')Object.values(value).forEach(item=>references(item,result));
  return result;
}
function assetPath(value){
  if(typeof value!=='string'||!/^\/(uploads|assets)\//.test(value))throw new Error('Paketin kuvapolku ei kelpaa.');
  let decoded;try{decoded=decodeURIComponent(value);}catch{throw new Error('Paketin kuvapolun koodaus ei kelpaa.');}
  if(!/^\/(uploads|assets)\/[a-zA-Z0-9_./ -]+\.(png|jpe?g|webp|gif)$/i.test(decoded)||decoded.split('/').some(part=>part==='.'||part==='..'||part.startsWith('.')))throw new Error('Paketin kuvapolku ei kelpaa.');
  return decoded;
}
function rewrite(value,mapping){
  if(typeof value==='string')return value.replace(pattern,match=>mapping.get(match)||match);
  if(Array.isArray(value))return value.map(item=>rewrite(item,mapping));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,rewrite(item,mapping)]));
  return value;
}
module.exports=function createTransfer({uploadsDir,publicDir,store,clean}){
  async function exportBundle(source='draft'){
    if(!['draft','live'].includes(source))throw new Error('Valitse työversio tai julkaistu sivusto.');
    // Explicit content cleaner excludes config, credentials, analytics and messages.
    const site=clean(source==='draft'?store.draft():store.live()),assets=[];
    if(Buffer.byteLength(JSON.stringify(site))>2*1024*1024)throw new Error('Sivustodatan kokoraja on 2 Mt.');
    const refs=references(site);if(refs.size>200)throw new Error('Siirtopaketti tukee enintään 200 kuvaa.');
    let total=0;
    for(const ref of refs){
      const decoded=assetPath(ref),isUpload=decoded.startsWith('/uploads/'),base=isUpload?uploadsDir:publicDir;
      const relative=decoded.slice(isUpload?9:8),file=path.resolve(base,relative),root=fs.realpathSync(base);
      if(!file.startsWith(path.resolve(base)+path.sep)||!fs.existsSync(file)||!fs.lstatSync(file).isFile()||!fs.realpathSync(file).startsWith(root+path.sep))throw new Error(`Paketin kuva puuttuu tai polku ei kelpaa: ${ref}`);
      const stat=fs.statSync(file);total+=stat.size;if(stat.size>16*1024*1024||total>MAX_BYTES)throw new Error('Siirtopaketin kuvien kokoraja on 32 Mt (yksittäinen kuva 16 Mt).');
      assets.push({path:ref,data:fs.readFileSync(file).toString('base64')});
    }
    return {format:'weboiler-site',version:1,createdAt:new Date().toISOString(),site,assets};
  }
  async function inspect(bundle){
    if(!bundle||bundle.format!=='weboiler-site'||bundle.version!==1||!Array.isArray(bundle.assets)||bundle.assets.length>200)throw new Error('Tuntematon tai virheellinen siirtopaketti.');
    if(Buffer.byteLength(JSON.stringify(bundle.site)||'')>2*1024*1024)throw new Error('Sivustodatan kokoraja on 2 Mt.');
    const site=clean(bundle.site),needed=references(site),seen=new Set(),assets=[];let bytes=0;
    for(const asset of bundle.assets){
      const decoded=assetPath(asset?.path);
      if(seen.has(asset.path)||!needed.has(asset.path))throw new Error('Paketissa on ylimääräinen tai kahteen kertaan määritelty kuva.');seen.add(asset.path);
      if(typeof asset.data!=='string'||asset.data.length>24*1024*1024||asset.data.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(asset.data))throw new Error('Kuvan sisältö ei ole kelvollista base64-dataa.');
      const data=Buffer.from(asset.data,'base64');bytes+=data.length;if(!data.length||data.length>16*1024*1024||bytes>MAX_BYTES)throw new Error('Paketin kuvien kokoraja ylittyy.');
      if(data.toString('base64')!==asset.data)throw new Error('Kuvan base64-data ei ole kelvollista.');
      const extension=path.extname(decoded).slice(1).toLowerCase();
      const decoder=sharp(data,{limitInputPixels:40000000});const metadata=await decoder.metadata();
      const expected=extension==='jpg'?'jpeg':extension;
      if(metadata.format!==expected||!formats[extension])throw new Error('Kuvan tiedostotyyppi ei vastaa sisältöä.');
      await decoder.resize({width:1,height:1,fit:'inside'}).toBuffer();
      assets.push({path:asset.path,data,extension});
    }
    for(const ref of needed)if(!seen.has(ref))throw new Error(`Paketista puuttuu kuva: ${ref}`);
    return {site,assets,summary:{title:site.meta.siteName||site.meta.title,pages:1+(site.pages||[]).length,images:assets.length,bytes,plugins:Object.keys(site.plugins||{})}};
  }
  async function importBundle(bundle,expected){
    if(store.snapshot().version!==expected){const error=new Error('Työversio muuttui. Lataa hallinta uudelleen ennen tuontia.');error.status=409;throw error;}
    const inspected=await inspect(bundle),written=[],mapping=new Map();
    try{
      fs.mkdirSync(uploadsDir,{recursive:true});
      for(const asset of inspected.assets){const name=`import-${crypto.randomUUID()}.${asset.extension}`,file=path.join(uploadsDir,name);fs.writeFileSync(file,asset.data,{flag:'wx'});written.push(file);mapping.set(asset.path,'/uploads/'+name);}
      const site=rewrite(inspected.site,mapping);
      const result=store.importDraft(site,expected);
      return {...result,summary:inspected.summary};
    }catch(error){for(const file of written)if(fs.existsSync(file))fs.unlinkSync(file);throw error;}
  }
  return {exportBundle,inspect,importBundle};
};
