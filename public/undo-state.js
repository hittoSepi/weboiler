'use strict';
// Shared pure state machine, exercised by Node tests and used by the browser.
class UndoState {
  constructor(limit=40,maxBytes=8*1024*1024){this.limit=limit;this.maxBytes=maxBytes;this.entries=[];this.index=-1;this.group='';this.time=0;}
  reset(value){this.entries=[JSON.stringify(value)];this.index=0;this.group='';this.time=0;}
  record(value,group='',now=Date.now()){
    const encoded=JSON.stringify(value);if(encoded===this.entries[this.index])return;
    const coalesce=group&&group===this.group&&now-this.time<750&&this.index>0&&this.index===this.entries.length-1;
    this.entries=this.entries.slice(0,this.index+1);
    if(coalesce)this.entries[this.index]=encoded;else{this.entries.push(encoded);this.index++;}
    this.group=group;this.time=now;
    while(this.entries.length>2&&(this.entries.length>this.limit||this.entries.reduce((n,s)=>n+s.length*2,0)>this.maxBytes)){this.entries.shift();this.index--;}
  }
  replace(value){if(this.index>=0)this.entries[this.index]=JSON.stringify(value);}
  undo(){if(this.index<=0)return null;this.group='';return JSON.parse(this.entries[--this.index]);}
  redo(){if(this.index>=this.entries.length-1)return null;this.group='';return JSON.parse(this.entries[++this.index]);}
  get canUndo(){return this.index>0;}
  get canRedo(){return this.index<this.entries.length-1;}
}
function moveSection(list,id,targetId,after=false){
  const source=list.findIndex(item=>item.id===id),target=list.findIndex(item=>item.id===targetId);
  if(source<0||target<0||source===target)return false;
  let destination=target+(after?1:0);if(source<destination)destination--;
  if(destination===source)return false;
  const [section]=list.splice(source,1);list.splice(destination,0,section);return true;
}
if(typeof module!=='undefined')module.exports={UndoState,moveSection};
