'use strict';

// Enhance fields after editor re-renders without changing its draft/save pipeline.
const aiObserver=new MutationObserver(enhanceAI);
aiObserver.observe(app,{childList:true,subtree:true});
enhanceAI();
function enhanceAI() {
  for(const control of app.querySelectorAll('[data-path], [data-rich-path]')) {
    const path=control.dataset.path||control.dataset.richPath;
    if(path.startsWith('theme.'))continue;
    const image=/\.(image|src|logo|shareImage)$/.test(path);
    if(control.dataset.aiReady||(!image&&!/\.(title|seoTitle|text|description|eyebrow|buttonLabel|html|alt|imageAlt|shareImageAlt)$/.test(path)))continue;
    control.dataset.aiReady='true';
    const button=document.createElement('button');button.type='button';button.className='small-button';
    button.textContent=image?'Luo kuva AI:lla':'Kirjoita AI:lla';
    button.addEventListener('click',()=>openAIEditor(control,path,image));
    (control.closest('label')||control).insertAdjacentElement('afterend',button);
  }
  if(location.pathname==='/admin/asetukset'&&!app.querySelector('#ai-settings-panel')) {
    const panel=document.createElement('section');panel.className='panel';panel.id='ai-settings-panel';
    panel.innerHTML='<h2>AI-sisällöntuotanto</h2><p>Ladataan asetuksia…</p>';app.append(panel);
    api('/api/admin/ai-settings').then(({settings})=>drawAISettings(panel,settings)).catch(error=>{panel.querySelector('p').textContent=error.message;});
  }
}
function drawAISettings(panel,settings) {
  panel.innerHTML=`<h2>AI-sisällöntuotanto</h2><p>Generointi käyttää omaa API-tiliäsi ja voi maksaa. Ohje lähetetään valitulle palvelulle. Älä syötä salaisuuksia tai asiakkaiden henkilötietoja. Avaimet tallennetaan salattuina palvelimelle, ei sivuston JSON-tiedostoihin.</p><form id="ai-settings-form"><label><input name="enabled" type="checkbox"${settings.enabled?' checked':''}> Salli AI-generointi</label><label>Oletuspalvelu<select name="provider"><option value="openai">OpenAI</option><option value="gemini"${settings.provider==='gemini'?' selected':''}>Gemini</option></select></label>${['openai','gemini'].map(p=>`<fieldset><legend>${p==='openai'?'OpenAI':'Gemini'}</legend><label>API-avain ${settings[p==='openai'?'hasOpenaiKey':'hasGeminiKey']?'(tallennettu; tyhjä säilyttää)':''}<input type="password" name="${p}Key" autocomplete="new-password"></label><label><input type="checkbox" name="clear${p}Key"> Poista tallennettu avain</label><label>Tekstimalli<input name="${p}TextModel" value="${esc(settings[p+'TextModel'])}" required></label><label>Kuvamalli<input name="${p}ImageModel" value="${esc(settings[p+'ImageModel'])}" required></label></fieldset>`).join('')}<button class="button">Tallenna AI-asetukset</button><p role="status"></p></form>`;
  panel.querySelector('form').addEventListener('submit',async event=>{
    event.preventDefault();const form=event.target,button=form.querySelector('button');button.disabled=true;
    const values=Object.fromEntries(new FormData(form));
    for(const name of ['enabled','clearopenaiKey','cleargeminiKey'])values[name]=form.elements[name].checked;
    try{const result=await api('/api/admin/ai-settings',{method:'PUT',body:JSON.stringify(values)});drawAISettings(panel,result.settings);panel.querySelector('[role=status]').textContent='AI-asetukset tallennettu.';}
    catch(error){form.querySelector('[role=status]').textContent=error.message;button.disabled=false;}
  });
}
async function openAIEditor(control,path,isImage) {
  const dialog=pickerDialog(isImage?'Luo kuva AI:lla':'Kirjoita AI:lla');
  const content=dialog.querySelector('.asset-content'),status=dialog.querySelector('.asset-status');
  try {
    const {settings}=await api('/api/admin/ai-settings');
    if(!dialog.isConnected)return;
    if(!settings.enabled){content.innerHTML='<p>Ota AI käyttöön ja lisää API-avain hallinnan asetuksissa.</p>';return;}
    content.innerHTML=`<p>Ohje lähetetään valitulle AI-palvelulle. Generointi voi maksaa. Tulos ei tule julkiselle sivulle ennen julkaisemista.</p><label>Palvelu<select class="ai-provider"><option value="openai">OpenAI</option><option value="gemini">Gemini</option></select></label><label>Ohje<textarea class="ai-prompt" rows="6" maxlength="12000" placeholder="Kuvaile haluamasi sisältö, tyyli ja kohderyhmä"></textarea></label><button type="button" class="button ai-generate">Generoi ${isImage?'kuva':'teksti'}</button><div class="ai-result" hidden>${isImage?'<img alt="AI:n luoma kuva" style="max-width:100%;max-height:400px"><p>Kuva tallentuu myös mediakirjastoon. Tarkista kuvan sopivuus ja lisää vaihtoehtoinen teksti editorissa.</p>':'<label>Tarkista ja muokkaa teksti<textarea class="ai-output" rows="9"></textarea></label>'}<button type="button" class="button ai-apply">Käytä luonnoksessa</button></div>`;
    content.querySelector('.ai-provider').value=settings.provider;
    if(!isImage)content.querySelector('.ai-prompt').value=`Muokkaa seuraavaa tekstiä selkeäksi verkkosivutekstiksi suomeksi:\n\n${control.value??control.textContent}`;
    let generated;
    content.querySelector('.ai-generate').addEventListener('click',async event=>{
      const button=event.target;button.disabled=true;generated=null;content.querySelector('.ai-result').hidden=true;status.textContent='Generoidaan… Tämä voi kestää muutaman minuutin.';
      try {
        generated=await api('/api/admin/ai/'+(isImage?'image':'text'),{method:'POST',body:JSON.stringify({provider:content.querySelector('.ai-provider').value,prompt:content.querySelector('.ai-prompt').value})});
        if(!dialog.isConnected)return;
        if(isImage)content.querySelector('.ai-result img').src=generated.src;
        else content.querySelector('.ai-output').value=generated.text;
        content.querySelector('.ai-result').hidden=false;status.textContent='Tarkista tulos ennen käyttöönottoa.';
      } catch(error){status.textContent=error.message;}finally{button.disabled=false;}
    });
    content.querySelector('.ai-apply').addEventListener('click',()=>{
      if(!generated)return;
      if(!control.isConnected){status.textContent='Kenttä on muuttunut. Sulje ikkuna ja avaa generointi uudelleen.';return;}
      let value=isImage?generated.src:content.querySelector('.ai-output').value;
      if(control.dataset.richPath)value=value.split(/\n\s*\n/).map(p=>`<p>${esc(p).replace(/\n/g,'<br>')}</p>`).join('');
      applyAsset(path,value,dialog);
      notice('AI-sisältö lisättiin luonnokseen. Julkaise vasta tarkistuksen jälkeen.');
    });
  }catch(error){status.textContent=error.message;}
}
