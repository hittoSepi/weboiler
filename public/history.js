'use strict';
async function renderHistory(){
  app.innerHTML='<section class="panel"><h2>Julkaisuhistoria</h2><p>Palautus korvaa vain työversion. Tarkista palautettu sisältö editorissa ja julkaise se erikseen. Nykyinen työversio otetaan talteen ennen palautusta.</p><p>Historia sisältää sivuston sisällön ja teeman, ei tunnuksia, viestejä tai mediatiedostojen kopioita.</p><div id="history-list">Ladataan…</div></section>';
  const list=app.querySelector('#history-list');
  try{
    const {entries}=await api('/api/admin/history');
    if(!list.isConnected)return;
    const labels={'published':'Julkaisu','previous-live':'Julkaisua edeltävä live','before-restore':'Työversio ennen palautusta','before-import':'Työversio ennen tuontia'};
    list.innerHTML=entries.length?entries.map(entry=>`<article class="message"><h3>${esc(entry.title)}</h3><p>${esc(labels[entry.kind]||entry.kind)} · <time>${esc(new Date(entry.createdAt).toLocaleString('fi-FI'))}</time></p><a class="small-button" target="_blank" rel="noopener" href="/admin/historia/${esc(entry.id)}">Esikatsele</a> <button type="button" class="small-button" data-restore="${esc(entry.id)}">Palauta työversioon</button>${entry.pages?.length?`<details><summary>Alasivujen esikatselut</summary>${entry.pages.map(page=>`<p><a target="_blank" rel="noopener" href="/admin/historia/${esc(entry.id)}?page=${encodeURIComponent(page.slug)}">${esc(page.title)}</a></p>`).join('')}</details>`:''}</article>`).join(''):'<p>Historiaa syntyy, kun julkaiset muutoksia. Ensimmäinen julkaisu tallentaa myös sitä edeltävän live-version.</p>';
    list.addEventListener('click',async event=>{
      const button=event.target.closest('[data-restore]');if(!button)return;
      const dialog=pickerDialog('Palauta työversio');
      dialog.querySelector('.asset-content').innerHTML='<p>Valittu versio korvaa nykyisen työversion. Nykyisestä työversiosta tallennetaan palautuspiste. Julkinen sivu ei muutu.</p><button type="button" class="button" data-confirm-restore>Palauta työversioon</button>';
      dialog.querySelector('[data-confirm-restore]').addEventListener('click',async event=>{
        event.target.disabled=true;
        try{
          if(!await saveSite())throw new Error('Nykyistä työversiota ei voitu tallentaa.');
          const result=await api(`/api/admin/history/${button.dataset.restore}/restore`,{method:'POST',headers:{'x-site-version':serverVersion},body:'{}'});
          site=result.site;resetEditorUndo();serverVersion=result.version;unpublished=result.unpublished;updatePublishState();saveState.textContent='Työversio palautettu';
          dialog.close();await renderHistory();notice('Työversio palautettu. Tarkista sisältö editorissa ennen julkaisua.');
        }catch(error){dialog.querySelector('.asset-status').textContent=error.message;event.target.disabled=false;}
      });
    });
  }catch(error){list.textContent=error.message;}
}
