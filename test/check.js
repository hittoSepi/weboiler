'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.join(__dirname,'..');
const files=['server.js',...['lib','public','views','test','plugins'].flatMap(folder=>fs.readdirSync(path.join(root,folder)).filter(name=>name.endsWith('.js')).map(name=>`${folder}/${name}`))];
for(const file of files){const result=spawnSync(process.execPath,['--check',path.join(root,file)],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
console.log(`${files.length} JavaScript files checked`);
