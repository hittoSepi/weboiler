'use strict';

// Reusable elements are independent copies. Editing a library element does not
// silently change sections already placed on a page.
function renderElements() {
  const elements = site.elements || [];
  app.innerHTML = `<p><strong>Lisäyskohde: ${esc(activePage()?.title||'Etusivu')}</strong> — voit vaihtaa kohdesivua Sivueditorissa.</p><p class="muted">Tallenna sivueditorin osio omaksi elementiksi. Voit muokata mallia täällä ja lisätä siitä uusia kopioita sivulle.</p><div class="sections">${elements.map((element,index) => {
    const p = `elements.${index}`;
    const s = element.section;
    let fields = field(`${p}.name`,'Elementin nimi',element.name,{wide:true});
    fields += field(`${p}.section.title`,'Otsikko',s.title,{wide:true});
    fields += field(`${p}.section.eyebrow`,'Pieni otsikko',s.eyebrow,{wide:true});
    fields += iconFields(`${p}.section`,s);
    fields += pluginSectionFields(s,`${p}.section`);
    if(s.type==='text') fields += richEditor(`${p}.section.html`,s.html||esc(s.text||''));
    else if(['hero','cta','contact'].includes(s.type)) fields += field(`${p}.section.text`,'Teksti',s.text,{textarea:true,wide:true});
    if(['hero','cta'].includes(s.type)) fields += field(`${p}.section.buttonLabel`,'Painikkeen teksti',s.buttonLabel)+field(`${p}.section.buttonUrl`,'Painikkeen linkki',s.buttonUrl);
    if(s.type==='hero') fields += field(`${p}.section.image`,'Taustakuvan polku',s.image,{wide:true});
    if(s.type==='contact') fields += field(`${p}.section.email`,'Sähköposti',s.email)+field(`${p}.section.phone`,'Puhelin',s.phone);
    if(s.type==='carousel') fields += field(`${p}.section.interval`,'Kuvan vaihtoväli (sekuntia)',s.interval||5,{type:'number',min:3,max:20});
    if(s.type==='features') fields += `<div class="wide">${(s.items||[]).map((item,i)=>`<div class="subpanel field-grid">${field(`${p}.section.items.${i}.title`,'Kortin otsikko',item.title)}${field(`${p}.section.items.${i}.text`,'Kortin teksti',item.text,{textarea:true})}${field(`${p}.section.items.${i}.image`,'Kuva',item.image,{wide:true})}${field(`${p}.section.items.${i}.imageAlt`,'Kuvan kuvaus',item.imageAlt)}${field(`${p}.section.items.${i}.url`,'Linkki',item.url)}${field(`${p}.section.items.${i}.linkLabel`,'Linkin teksti',item.linkLabel)}${iconFields(`${p}.section.items.${i}`,item)}<button class="small-button" data-template="${index}" data-remove-item="${i}">Poista kortti</button></div>`).join('')}<button class="small-button" data-template="${index}" data-add-item>Lisää kortti</button></div>`;
    if(['gallery','carousel'].includes(s.type)) fields += `<div class="wide">${(s.images||[]).map((image,i)=>`<div class="subpanel field-grid">${field(`${p}.section.images.${i}.src`,'Kuvan polku',image.src,{wide:true})}${field(`${p}.section.images.${i}.alt`,'Kuvaus',image.alt)}${field(`${p}.section.images.${i}.url`,'Linkki',image.url)}<button class="small-button" data-template="${index}" data-remove-image="${i}">Poista kuva</button></div>`).join('')}<button class="small-button" data-template="${index}" data-add-image>Lisää kuva</button></div>`;
    return `<article class="section-card"><div class="section-head"><div><span class="section-type">${TYPES[s.type]}</span><h2>${esc(element.name)}</h2></div><div class="actions"><button data-insert-element="${index}">Lisää sivulle</button><button class="danger" data-delete-element="${index}">Poista malli</button></div></div><div class="field-grid">${fields}</div></article>`;
  }).join('') || '<section class="panel"><h2>Ensimmäinen oma elementti</h2><p>Avaa Sivueditori ja valitse haluamasi osion kohdalta ”Tallenna elementiksi”.</p><a href="/admin/editori">Avaa sivueditori →</a></section>'}</div>`;
}

function focusSection(index) {
  const card = document.querySelector(`[data-section-card="${index}"]`);
  card?.scrollIntoView({behavior:'smooth',block:'center'});
  card?.focus({preventScroll:true});
}
function insertElement(index, after = editorSections().length - 1) {
  const section = structuredClone(site.elements[index].section);
  section.id = `osio-${crypto.randomUUID().slice(0,8)}`;
  editorSections().splice(after+1,0,section);
  dirty();
  if(location.pathname==='/admin/editori') { renderEditor(); focusSection(after+1); }
  notice('Elementin kopio lisättiin sivun työversioon.');
}

let contextMenu;
function closeContextMenu() { contextMenu?.remove(); contextMenu=null; }
function elementNameDialog(initialName) {
  return new Promise(resolve => {
    const dialog = document.createElement('dialog');
    dialog.className = 'element-dialog';
    dialog.innerHTML = `<form method="dialog"><h2>Tallenna oma elementti</h2><p>Osion sisältö ja ulkoasu tallennetaan uudelleenkäytettäväksi malliksi.</p><label>Elementin nimi<input name="elementName" maxlength="100" required value="${esc(initialName)}"></label><div class="actions"><button type="button" data-cancel>Peruuta</button><button class="button" type="submit">Tallenna malli</button></div></form>`;
    document.body.append(dialog);
    let name = null;
    dialog.querySelector('[data-cancel]').addEventListener('click',()=>dialog.close());
    dialog.querySelector('form').addEventListener('submit',event=>{event.preventDefault();name=dialog.querySelector('input').value.trim();if(name)dialog.close();});
    dialog.addEventListener('close',()=>{dialog.remove();resolve(name);},{once:true});
    dialog.showModal();
    dialog.querySelector('input').select();
  });
}
function openContextMenu(index,x,y) {
  closeContextMenu();
  contextMenu = document.createElement('div');
  contextMenu.className='editor-context';
  contextMenu.setAttribute('role','menu');
  contextMenu.innerHTML=`<strong>${esc(editorSections()[index]?.title||'Sivu')}</strong>${index>=0?`<button data-context-edit="${index}">Muokkaa osiota</button><button data-action="duplicate" data-section="${index}">Kopioi osio</button><button data-action="up" data-section="${index}">Siirrä ylös</button><button data-action="down" data-section="${index}">Siirrä alas</button><button data-action="save-element" data-section="${index}">Tallenna omaksi elementiksi</button><button class="danger" data-action="delete" data-section="${index}">Poista osio</button>`:''}<strong>Lisää osio tämän jälkeen</strong>${Object.entries(TYPES).map(([type,label])=>`<button data-context-add="${type}" data-after="${index}">${label}</button>`).join('')}${(site.elements||[]).length?'<strong>Omat elementit</strong>':''}${(site.elements||[]).map((e,i)=>`<button data-insert-element="${i}" data-after="${index}">${esc(e.name)}</button>`).join('')}`;
  document.body.append(contextMenu);
  contextMenu.style.left=`${Math.max(8,Math.min(x,innerWidth-contextMenu.offsetWidth-8))}px`;
  contextMenu.style.top=`${Math.max(8,Math.min(y,innerHeight-contextMenu.offsetHeight-8))}px`;
  contextMenu.querySelector('button')?.focus();
}
document.addEventListener('contextmenu',event=>{
  if(location.pathname!=='/admin/editori'||event.target.closest('input,textarea,[contenteditable]'))return;
  const card=event.target.closest('[data-section-card]');
  if(!card)return;
  event.preventDefault();
  openContextMenu(Number(card.dataset.sectionCard),event.clientX,event.clientY);
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape')closeContextMenu();
  if(contextMenu&&['ArrowDown','ArrowUp'].includes(event.key)) {
    event.preventDefault();
    const buttons=[...contextMenu.querySelectorAll('button')];
    const current=buttons.indexOf(document.activeElement);
    buttons[(current+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus();
  }
});
document.addEventListener('pointerdown',event=>{if(contextMenu&&!contextMenu.contains(event.target))closeContextMenu();});
document.addEventListener('click',async event=>{
  const button=event.target.closest('button');
  if(!button)return;
  if(button.dataset.action==='save-element'){
    const section=editorSections()[Number(button.dataset.section)];
    closeContextMenu();
    const name=await elementNameDialog(section.title||TYPES[section.type]);
    if(name?.trim()) { site.elements??=[];site.elements.push({id:crypto.randomUUID(),name:name.trim(),section:structuredClone(section)});dirty();notice('Oma elementti tallennettu kirjastoon.'); }
  }
  if(button.dataset.contextEdit!==undefined)focusSection(Number(button.dataset.contextEdit));
  if(button.dataset.contextAdd){const after=Number(button.dataset.after);editorSections().splice(after+1,0,defaultSection(button.dataset.contextAdd));rerenderEditor();focusSection(after+1);}
  if(button.dataset.insertElement!==undefined)insertElement(Number(button.dataset.insertElement),button.dataset.after===undefined?undefined:Number(button.dataset.after));
  if(button.dataset.deleteElement!==undefined&&confirm('Poistetaanko malli kirjastosta? Sivulle jo lisätyt osiot säilyvät.')) {site.elements.splice(Number(button.dataset.deleteElement),1);renderElements();dirty();}
  if(button.dataset.template!==undefined) {
    const s=site.elements[Number(button.dataset.template)].section;
    if(button.hasAttribute('data-add-item'))(s.items??=[]).push({title:'Uusi kortti',text:'',icon:'star'});
    if(button.hasAttribute('data-add-image'))(s.images??=[]).push({src:'',alt:'',url:''});
    if(button.dataset.removeItem!==undefined)s.items.splice(Number(button.dataset.removeItem),1);
    if(button.dataset.removeImage!==undefined)s.images.splice(Number(button.dataset.removeImage),1);
    renderElements();dirty();
  }
  closeContextMenu();
});

// Preview uses the same origin; events never accept messages from other windows.
document.addEventListener('load',event=>{
  if(event.target.id!=='preview-frame')return;
  const frame=event.target;
  const doc=frame.contentDocument;
  doc?.addEventListener('contextmenu',e=>{
    const section=e.target.closest('main > section');
    if(!section)return;
    const index=editorSections().findIndex(s=>s.id===section.id);
    e.preventDefault();
    const rect=frame.getBoundingClientRect();
    openContextMenu(index,rect.left+e.clientX,rect.top+e.clientY);
  });
  doc?.addEventListener('dblclick',e=>{
    const section=e.target.closest('main > section');
    if(section)focusSection(editorSections().findIndex(s=>s.id===section.id));
  });
},true);
