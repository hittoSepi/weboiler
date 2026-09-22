'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const sharp=require('sharp'),createVariants=require('../lib/image-variants'),presentation=require('../lib/image-presentation');
sharp.cache(false);
async function run(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'weboiler-images-'));
 try{
  const source=path.join(root,'test.png');await sharp({create:{width:1600,height:900,channels:3,background:'#dd5511'}}).png().toFile(source);
  const original=fs.readFileSync(source),variants=createVariants(root);
  const [first,second]=await Promise.all([variants.variant('test.png',640),variants.variant('test.png',640)]);assert.equal(first,second);
  const metadata=await sharp(first).metadata();assert.equal(metadata.format,'webp');assert.equal(metadata.width,640);assert.equal(metadata.height,360);
  const all=await Promise.all([320,640,960,1280,1920].map(w=>variants.variant('test.png',w)));assert.equal(all.length,5);
  assert.equal((await sharp(all[4]).metadata()).width,1600,'Do not upscale');
  assert.deepEqual(fs.readFileSync(source),original,'Original stays unchanged');
  const modified=fs.statSync(first).mtimeMs;assert.equal(await variants.variant('test.png',640),first);assert.equal(fs.statSync(first).mtimeMs,modified);
  await assert.rejects(()=>variants.variant('../test.png',640));await assert.rejects(()=>variants.variant('test.png',777));await assert.rejects(()=>variants.variant('missing.png',640),{status:404});
  fs.writeFileSync(path.join(root,'broken.png'),'not an image');await assert.rejects(()=>variants.variant('broken.png',640));assert.ok(!fs.readdirSync(path.join(root,'.variants')).some(name=>name.endsWith('.tmp')));
  assert.equal(presentation.optimized('/uploads/test.png',640),'/media/test.png/640');assert.equal(presentation.optimized('https://example.test/a.jpg'),'https://example.test/a.jpg');assert.equal(presentation.optimized('/uploads/animated.gif'),'/uploads/animated.gif');
  assert.equal(presentation.srcset(''),'');assert.match(presentation.srcset('/uploads/test.png'),/1920w/);
  assert.equal(presentation.position('0% 100%'),'0% 100%');assert.throws(()=>presentation.position('101% 50%'));assert.throws(()=>presentation.position('0;position:fixed'));
  console.log('Image tests OK (resize, WebP, cache, bounds, originals, focal points)');
 }finally{fs.rmSync(root,{recursive:true,force:true});}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
