'use strict';
const editorUndo=new UndoState();
let applyingUndo=false;
function undoSnapshot(){return {site,pageId:activePageId};}
function resetEditorUndo(){editorUndo.reset(undoSnapshot());updateUndoControls();}
function recordEditorUndo(){
  if(applyingUndo)return;
  const focused=document.activeElement;
  const key=focused?.dataset.path||focused?.dataset.richPath||focused?.dataset.colorPath;
  editorUndo.record(undoSnapshot(),key?activePageId+':'+key:'');updateUndoControls();
}
function normalizeEditorUndo(){if(editorUndo.index>=0){const previous=JSON.parse(editorUndo.entries[editorUndo.index]);editorUndo.replace({...previous,site});}updateUndoControls();}
function updateUndoControls(){
  const toolbar=document.querySelector('#undo-controls');if(!toolbar)return;
  toolbar.hidden=!['/admin/editori','/admin/elementit','/admin/plugins','/admin/teema','/admin/asetukset'].includes(location.pathname);
  toolbar.querySelector('[data-undo]').disabled=publishing||!editorUndo.canUndo;
  toolbar.querySelector('[data-redo]').disabled=publishing||!editorUndo.canRedo;
}
function applyUndo(direction){
  if(publishing||document.querySelector('dialog[open]'))return;
  const value=direction==='undo'?editorUndo.undo():editorUndo.redo();if(!value)return;
  site=value.site;activePageId=value.pageId;
  sessionStorage.setItem('weboiler-editor-page',activePageId);
  applyingUndo=true;try{dirty();if(location.pathname==='/admin/editori')setActivePage(activePageId);else render();}finally{applyingUndo=false;}
  updateUndoControls();notice(direction==='undo'?'Muutos kumottu työversiossa.':'Muutos tehty uudelleen työversiossa.');
}
document.addEventListener('click',event=>{if(event.target.closest('[data-undo]'))applyUndo('undo');if(event.target.closest('[data-redo]'))applyUndo('redo');});
document.addEventListener('keydown',event=>{
  if(!(event.ctrlKey||event.metaKey)||event.altKey||document.querySelector('dialog[open]'))return;
  // Preserve the native text-field undo; global controls undo complete CMS operations.
  if(event.target.closest('input,textarea,[contenteditable]'))return;
  const key=event.key.toLowerCase();if(key==='z'||key==='y'){event.preventDefault();applyUndo(key==='y'||event.shiftKey?'redo':'undo');}
});

function sectionOrderControls(){const open=document.querySelector('.section-order')?.open;return `<details class="section-order"${open?' open':''}><summary>Osioiden järjestys — raahaa tai käytä Alt + nuolinäppäimiä</summary><ol>${editorSections().map((section,index)=>`<li data-drop-section="${index}"><button type="button" class="small-button" draggable="false" data-drag-section="${index}">${index+1}. ${esc(section.title||'Nimetön osio')}</button></li>`).join('')}</ol></details>`;}
function clearDrop(){document.querySelectorAll('.drop-before,.drop-after').forEach(card=>card.classList.remove('drop-before','drop-after'));}
// Pointer capture handles mouse/touch consistently, including long editor cards.
let pointerDrag;
document.addEventListener('pointerdown',event=>{
  const handle=event.target.closest('[data-drag-section]');if(!handle||publishing||event.button!==0)return;
  const section=editorSections()[Number(handle.dataset.dragSection)];if(!section)return;
  pointerDrag={id:section.id,pageId:activePageId,x:event.clientX,y:event.clientY,handle,pointerId:event.pointerId,moved:false};
  handle.setPointerCapture(event.pointerId);
});
document.addEventListener('pointermove',event=>{
  const drag=pointerDrag;if(!drag||drag.pointerId!==event.pointerId)return;
  if(!drag.moved&&Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<6)return;
  drag.moved=true;event.preventDefault();
  clearDrop();const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('[data-section-card],[data-drop-section]');
  drag.target=target;
  if(target){const rect=target.getBoundingClientRect();drag.after=event.clientY>rect.top+rect.height/2;target.classList.add(drag.after?'drop-after':'drop-before');}
  if(event.clientY<70)window.scrollBy(0,-18);else if(event.clientY>innerHeight-70)window.scrollBy(0,18);
});
document.addEventListener('pointerup',event=>{
  const drag=pointerDrag;if(!drag||drag.pointerId!==event.pointerId)return;pointerDrag=null;
  if(drag.handle.hasPointerCapture(event.pointerId))drag.handle.releasePointerCapture(event.pointerId);
  if(drag.moved&&drag.target&&drag.pageId===activePageId){const target=editorSections()[Number(drag.target.dataset.sectionCard??drag.target.dataset.dropSection)];if(target&&moveSection(editorSections(),drag.id,target.id,drag.after)){rerenderEditor();notice('Osio siirretty.');}}
  clearDrop();
});
document.addEventListener('pointercancel',()=>{pointerDrag=null;clearDrop();});
document.addEventListener('keydown',event=>{
  const handle=event.target.closest('[data-drag-section]');if(!handle||!event.altKey||!['ArrowUp','ArrowDown'].includes(event.key))return;
  event.preventDefault();const index=Number(handle.dataset.dragSection),next=index+(event.key==='ArrowUp'?-1:1),sections=editorSections();if(next<0||next>=sections.length)return;
  if(moveSection(sections,sections[index].id,sections[next].id,next>index)){rerenderEditor();document.querySelector(`[${handle.closest('[data-drop-section]')?'data-drop-section':'data-section-card'}="${next}"] [data-drag-section]`)?.focus();notice('Osio siirretty.');}
});
