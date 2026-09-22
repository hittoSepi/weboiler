'use strict';
function renderTransfer(){
  app.innerHTML=`<section class="panel"><h2>Vie sivusto</h2><p>Paketti sisältää sisällön, teeman ja käytetyt paikalliset kuvat. Tunnuksia, viestejä, seurantatietoja tai API-avaimia ei viedä. Ulkoiset kuvat säilyvät linkkeinä.</p><label>Vietävä versio<select id="export-source"><option value="draft">Työversio</option><option value="live">Julkaistu sivusto</option></select></label><button type="button" class="button" id="export-site">Lataa siirtopaketti</button></section><section class="panel"><h2>Tuo sivusto työversioon</h2><p>Tuonti korvaa nykyisen työversion, mutta ei julkaistua sivustoa. Nykyisestä työversiosta otetaan palautuspiste julkaisuhistoriaan. Vanhat kuvat säilyvät. Tarkista tuonnin jälkeen sivuston URL ja julkaise erikseen.</p><p>Enintään 200 kuvaa / yhteensä 32 Mt. Paketissa käytettyjen lisäosien on oltava asennettuina.</p><label>Weboilerin JSON-siirtopaketti<input id="import-file" type="file" accept="application/json,.json"></label><button type="button" class="small-button" id="inspect-import">Tarkista paketti</button><div id="import-result" role="status"></div><button type="button" class="button" id="apply-import" hidden>Korvaa työversio tällä paketilla</button></section>`;
  const picker=app.querySelector('#import-file'),result=app.querySelector('#import-result'),apply=app.querySelector('#apply-import'),inspect=app.querySelector('#inspect-import');
  let prepared=null,busy=false;
  picker.addEventListener('change',()=>{prepared=null;apply.hidden=true;result.textContent='';});
  const bodyFor=file=>{const body=new FormData();body.append('bundle',file);return body;};
  app.querySelector('#export-site').addEventListener('click',async event=>{
    if(busy||publishing)return;const button=event.currentTarget;button.disabled=true;
    try{
      if(!await saveSite())return;
      const source=app.querySelector('#export-source').value;
      const bundle=await api('/api/admin/export?source='+source);
      const url=URL.createObjectURL(new Blob([JSON.stringify(bundle)],{type:'application/json'}));
      const link=document.createElement('a');link.href=url;link.download='weboiler-'+source+'.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
      notice('Siirtopaketti ladattu.');
    }catch(error){notice(error.message,'error');}finally{button.disabled=false;}
  });
  inspect.addEventListener('click',async()=>{
    if(busy)return;prepared=null;apply.hidden=true;const file=picker.files[0];
    if(!file){result.textContent='Valitse ensin siirtopaketti.';return;}
    if(file.size>48*1024*1024){result.textContent='Siirtopaketin tiedostoraja on 48 Mt.';return;}
    busy=true;inspect.disabled=true;result.textContent='Tarkistetaan…';
    try{
      const {summary}=await api('/api/admin/import/inspect',{method:'POST',body:bodyFor(file)});
      if(picker.files[0]!==file)return;
      prepared=file;result.textContent=`${summary.title}: ${summary.pages} sivua, ${summary.images} kuvaa (${(summary.bytes/1024/1024).toFixed(1)} Mt). Paketti voidaan tuoda.`;apply.hidden=false;
    }catch(error){if(picker.files[0]===file)result.textContent=error.message;}finally{busy=false;inspect.disabled=false;}
  });
  apply.addEventListener('click',async()=>{
    if(busy||publishing||!prepared||picker.files[0]!==prepared)return;
    busy=true;publishing=true;app.inert=true;updatePublishState();publishButton.textContent='Tuodaan…';
    try{
      if(!await saveSite())throw new Error('Tallenna työversio onnistuneesti ennen tuontia.');
      const imported=await api('/api/admin/import/apply',{method:'POST',headers:{'x-site-version':serverVersion},body:bodyFor(prepared)});
      site=imported.site;serverVersion=imported.version;unpublished=imported.unpublished;savedRevision=revision;resetEditorUndo();
      prepared=null;apply.hidden=true;picker.value='';result.textContent='Tuonti valmis. Tarkista sisältö editorissa ennen julkaisua. Edellinen työversio on julkaisuhistoriassa.';
      saveState.textContent='Julkaisemattomia muutoksia';
      try{media=(await api('/api/admin/media')).files;}catch{notice('Tuonti onnistui. Lataa hallinta uudelleen päivittääksesi mediakirjaston.','error');}
    }catch(error){result.textContent=error.message;}finally{busy=false;publishing=false;app.inert=false;updatePublishState();}
  });
}
