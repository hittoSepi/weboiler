'use strict';

let availableIcons;
async function loadIcons() { return availableIcons ||= (await api('/api/admin/icons')).icons; }

function pickerDialog(title) {
  const dialog=document.createElement('dialog');
  dialog.className='asset-dialog';
  dialog.innerHTML=`<div class="section-head"><h2>${esc(title)}</h2><button type="button" class="small-button" data-close>Sulje</button></div><div class="asset-content"></div><p role="status" class="asset-status"></p>`;
  dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  document.body.append(dialog);
  dialog.showModal();
  return dialog;
}

function applyAsset(path,value,dialog) {
  setPath(site,path,value);
  dirty();
  dialog.close();
  if(location.pathname==='/admin/editori')renderEditor();
  else if(location.pathname==='/admin/elementit')renderElements();
  else if(location.pathname==='/admin/plugins')renderPlugins();
  else renderSettings();
}

async function chooseImage(path) {
  const dialog=pickerDialog('Valitse kuva');
  const content=dialog.querySelector('.asset-content');
  const status=dialog.querySelector('.asset-status');
  content.innerHTML='<form class="asset-upload"><label>Lataa uusi kuva<input name="images" type="file" accept="image/png,image/jpeg,image/webp,image/gif" required></label><button class="button">Lataa ja valitse</button></form><label>Hae tiedoston nimellä<input type="search" class="asset-search"></label><div class="asset-grid"></div>';
  let files=[];
  function draw() {
    const search=content.querySelector('.asset-search').value.toLowerCase();
    const grid=content.querySelector('.asset-grid');
    grid.innerHTML=files.filter(file=>file.name.toLowerCase().includes(search)).map(file=>`<button class="asset-image" type="button" data-src="${esc(file.src)}"><img src="${esc(file.src)}" alt=""><span>${esc(file.name)}</span></button>`).join('')||'<p>Ei kuvia. Lataa ensimmäinen kuva yllä.</p>';
  }
  content.querySelector('.asset-search').addEventListener('input',draw);
  content.querySelector('.asset-grid').addEventListener('click',event=>{const button=event.target.closest('[data-src]');if(button)applyAsset(path,button.dataset.src,dialog);});
  content.querySelector('form').addEventListener('submit',async event=>{
    event.preventDefault();
    const button=event.target.querySelector('button');
    button.disabled=true;
    status.textContent='Ladataan…';
    try {
      const result=await api('/api/admin/uploads',{method:'POST',body:new FormData(event.target)});
      applyAsset(path,result.files[0].src,dialog);
    } catch(error){status.textContent=error.message;button.disabled=false;}
  });
  try {files=(await api('/api/admin/media')).files;draw();} catch(error){status.textContent=error.message;}
}

async function chooseIcon(path) {
  const dialog=pickerDialog('Font Awesome -ikonit');
  const content=dialog.querySelector('.asset-content');
  const status=dialog.querySelector('.asset-status');
  content.innerHTML='<label>Hae ikonin nimellä (esim. house, phone, star)<input class="icon-search" type="search"></label><button type="button" class="small-button" data-clear-icon>Poista ikoni</button><div class="icon-library"></div><button class="small-button" type="button" data-more>Näytä lisää</button>';
  try {
    const icons=await loadIcons();
    let limit=100;
    function draw(){
      const query=content.querySelector('.icon-search').value.trim().toLowerCase();
      const matches=icons.filter(name=>name.includes(query));
      content.querySelector('.icon-library').innerHTML=matches.slice(0,limit).map(name=>`<button type="button" class="icon-tile" data-icon-name="${esc(name)}" title="${esc(name)}"><i class="fa-solid fa-${esc(name)}" aria-hidden="true"></i><span>${esc(name)}</span></button>`).join('');
      content.querySelector('[data-more]').hidden=matches.length<=limit;
      status.textContent=`${matches.length} ikonia · näytetään ${Math.min(limit,matches.length)}`;
    }
    content.querySelector('.icon-search').addEventListener('input',()=>{limit=100;draw();});
    content.querySelector('[data-more]').addEventListener('click',()=>{limit+=100;draw();});
    content.addEventListener('click',event=>{
      const button=event.target.closest('[data-icon-name]');
      if(button)applyAsset(path,button.dataset.iconName,dialog);
      if(event.target.closest('[data-clear-icon]'))applyAsset(path,'',dialog);
    });
    draw();
  }catch(error){status.textContent=error.message;}
}

document.addEventListener('click',event=>{
  const imageButton=event.target.closest('[data-media-path]');
  if(imageButton)chooseImage(imageButton.dataset.mediaPath);
  const iconButton=event.target.closest('[data-icon-path]');
  if(iconButton)chooseIcon(iconButton.dataset.iconPath);
});
