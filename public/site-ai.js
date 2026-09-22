'use strict';
function enhanceSiteAI(){
  if(!['/admin/editori','/admin'].includes(location.pathname)||!site||app.textContent==='Ladataan…'||app.querySelector('[data-site-ai]'))return;
  const button=document.createElement('button');button.type='button';button.className='button';button.dataset.siteAi='';button.textContent='Luo sivusto AI:lla';button.addEventListener('click',openSiteAI);app.prepend(button);
}
new MutationObserver(enhanceSiteAI).observe(app,{childList:true,subtree:true});
enhanceSiteAI();
async function openSiteAI(){
  if(!await saveSite())return;
  const baseRevision=revision,baseVersion=serverVersion;
  const dialog=pickerDialog('Sivustovelho'),content=dialog.querySelector('.asset-content'),status=dialog.querySelector('.asset-status');
  dialog.style.width='min(1200px, 96vw)';
  const stale=()=>revision!==baseRevision||serverVersion!==baseVersion;
  try{
    const {settings}=await api('/api/admin/ai-settings');if(!dialog.isConnected)return;
    if(!settings.enabled){content.textContent='Ota AI käyttöön ja lisää API-avain asetuksissa.';return;}
    content.innerHTML='<section class="site-ai-brief"><h3>1. Kuvaile sivusto</h3><p>Kerro toimiala, kohderyhmä, tarvittavat sivut, sisältö ja tyyli. Etusivu ja enintään viisi alasivua. Kuvauksesi sekä työn suunnitelma ja aiemmat välitulokset lähetetään AI-palvelulle. Nykyistä sivustoa ei lähetetä. Generointi voi maksaa. Kuvissa käytetään ensin placehold.co-paikkakuvia; AI-kuvat valitaan seuraavassa vaiheessa kuvakohtaisesti. Älä sisällytä salaisuuksia tai henkilötietoja.</p><label>Palvelu<select class="site-ai-provider"><option value="openai">OpenAI</option><option value="gemini">Gemini</option></select></label><label>Sivuston kuvaus<textarea class="site-ai-prompt" rows="8" maxlength="10000" placeholder="Luo sivusto pienelle rakennusyritykselle. Sivut: etusivu, palvelut, yritys ja yhteydenotto. Kolme palvelukorttia, uudelleenkäytettävä korttielementti. Tumma sininen teema ja oranssit korostukset. Selkeä, asiallinen suomenkielinen teksti. Yrityksen nimi…"></textarea></label><button type="button" class="button site-ai-generate">Generoi sivustoehdotus</button></section><section class="site-ai-review" hidden><h3>4. Tarkista sivusto</h3><p class="site-ai-summary"></p><p>Esikatselu ei suorita skriptejä. Vaihda sivua valitsimesta. Tarkista erityisesti väitteet, linkit, yhteystiedot ja mobiiliasettelu myöhemmin editorissa.</p><label>Esikatseltava sivu<select class="site-ai-page"></select></label><iframe title="AI-sivuston esikatselu" sandbox="allow-same-origin" referrerpolicy="no-referrer" style="width:100%;height:550px;border:1px solid #aaa"></iframe><button type="button" class="small-button site-ai-back">Muuta kuvausta ja generoi uudelleen</button><h3>5. Kuvat (valinnainen)</h3><p>Generoi vain haluamasi kuvat, muut jäävät placehold.co-paikkakuviksi. Jokainen painallus tekee yhden maksullisen kuvapyynnön valitun palvelun kuvamallilla. AI-kuvat tallentuvat mediakirjastoon, vaikka hylkäisit sivustoehdotuksen. Paikkakuvat ladataan ulkoisesta placehold.co-palvelusta myös julkisella sivulla.</p><div class="site-ai-images"></div><h3>6. Ota käyttöön luonnoksena</h3><p>Nykyiset sivut, pohjat, valikko ja teema korvataan. Domain, logo, lisäosadata ja palvelinasetukset säilyvät. Nykyinen luonnos kopioidaan historiaan ennen korvaamista. Julkinen sivusto ei muutu.</p><label><input type="checkbox" class="site-ai-confirm"> Ymmärrän, että nykyinen sivurakenne korvataan luonnoksessa.</label><button type="button" class="button site-ai-apply" disabled>Korvaa luonnos ehdotuksella</button></section>';
    content.querySelector('.site-ai-provider').value=settings.provider;
    attachPromptEnhancer(dialog,{endpoint:'/api/admin/ai/site/enhance',kind:'site'});
    let proposal=null,applying=false,imageBusy=false;
    dialog.addEventListener('cancel',event=>{if(applying)event.preventDefault();});
    const review=content.querySelector('.site-ai-review'),brief=content.querySelector('.site-ai-brief'),accept=content.querySelector('.site-ai-apply');
    const showPage=()=>{if(proposal)content.querySelector('iframe').srcdoc=proposal.previews[Number(content.querySelector('.site-ai-page').value)].html;};
    content.querySelector('iframe').addEventListener('load',()=>{
      content.querySelector('iframe').contentDocument?.addEventListener('click',event=>{
        const link=event.target.closest('a[href]');if(!link)return;event.preventDefault();
        if(!proposal)return;const url=new URL(link.href),slug=url.searchParams.get('page')||'';
        const index=proposal.previews.findIndex(p=>p.slug===slug);
        if(url.pathname==='/admin/esikatselu'&&index>=0){content.querySelector('.site-ai-page').value=String(index);showPage();}
      });
    });
    content.querySelector('.site-ai-page').addEventListener('change',showPage);
    content.querySelector('.site-ai-confirm').addEventListener('change',event=>{accept.disabled=!event.target.checked||applying||imageBusy;});
    function drawImages(){content.querySelector('.site-ai-images').innerHTML=proposal.images.map((slot,index)=>`<fieldset><legend>${esc(slot.label)}</legend><img src="${esc(slot.src)}" alt="Kuvapaikan esikatselu" style="max-width:240px;max-height:160px" referrerpolicy="no-referrer"><label>Kuvan kuvaus<textarea data-image-prompt="${index}" maxlength="12000">${esc(slot.prompt)}</textarea></label><button type="button" class="small-button" data-generate-image="${index}">${slot.src.startsWith('/uploads/')?'Generoi uusi kuva':'Generoi kuva'}</button><p>${slot.src.startsWith('/uploads/')?'AI-kuva lisätty ehdotukseen.':'Paikkakuva käytössä – voit ohittaa generoinnin.'}</p></fieldset>`).join('')||'<p>Tähän ehdotukseen ei suunniteltu kuvia.</p>';}
    content.querySelector('.site-ai-images').addEventListener('click',async event=>{
      const button=event.target.closest('[data-generate-image]');if(!button||imageBusy||applying||!proposal)return;
      if(stale()){status.textContent='Luonnos muuttui. Avaa velho uudelleen.';return;}
      const index=Number(button.dataset.generateImage),slot=proposal.images[index];
      imageBusy=true;accept.disabled=true;content.querySelector('.site-ai-back').disabled=true;
      content.querySelectorAll('[data-generate-image]').forEach(b=>b.disabled=true);status.textContent='Generoidaan kuvaa: '+slot.label;
      try{
        const prompts=Array.from(content.querySelectorAll('[data-image-prompt]')).map(el=>el.value);
        const result=await api('/api/admin/ai/site/image',{method:'POST',headers:{'x-site-version':baseVersion},body:JSON.stringify({token:proposal.token,imageId:slot.id,provider:content.querySelector('.site-ai-provider').value,prompt:prompts[index]})});
        if(!dialog.isConnected)return;
        proposal=result;drawImages();content.querySelectorAll('[data-image-prompt]').forEach((el,i)=>el.value=prompts[i]);showPage();status.textContent='Kuva lisättiin ehdotukseen ja mediakirjastoon. Sivustoa ei vielä muutettu.';
      }catch(error){status.textContent=error.message;}finally{imageBusy=false;accept.disabled=!content.querySelector('.site-ai-confirm').checked;content.querySelector('.site-ai-back').disabled=false;content.querySelectorAll('[data-generate-image]').forEach(b=>b.disabled=false);}
    });
    content.querySelector('.site-ai-back').addEventListener('click',()=>{proposal=null;review.hidden=true;brief.hidden=false;status.textContent='Tarkenna alkuperäistä kuvausta. Uusi generointi on uusi maksullinen pyyntö.';});
    attachSiteWorkflow({dialog,content,status,baseVersion,stale,onReady:result=>{
      proposal=result;drawImages();const s=result.summary;
      content.querySelector('.site-ai-summary').textContent=`${s.pages} sivua · ${s.sections} osiota · ${s.templates} osiopohjaa · ${s.elements} elementtipohjaa`;
      content.querySelector('.site-ai-page').innerHTML=result.previews.map((p,i)=>`<option value="${i}">${esc(p.title)} /${esc(p.slug)}</option>`).join('');
      content.querySelector('.site-ai-confirm').checked=false;accept.disabled=true;showPage();brief.hidden=true;review.hidden=false;status.textContent='Sivusto valmis tarkistettavaksi. Välitulokset on tallennettu. Luonnosta ei vielä muutettu.';
    }});
    accept.addEventListener('click',async()=>{
      if(!proposal||applying||imageBusy||!content.querySelector('.site-ai-confirm').checked)return;
      if(stale()){status.textContent='Luonnos muuttui. Avaa velho uudelleen.';return;}
      applying=true;accept.disabled=true;dialog.querySelector('[data-close]').disabled=true;content.querySelector('.site-ai-back').disabled=true;status.textContent='Tallennetaan historiakopio ja uusi luonnos…';
      try{
        const result=await api('/api/admin/ai/site/apply',{method:'POST',headers:{'x-site-version':baseVersion},body:JSON.stringify({token:proposal.token,confirm:true})});
        site=result.site;serverVersion=result.version;unpublished=result.unpublished;revision++;savedRevision=revision;activePageId='home';resetEditorUndo();updatePublishState();saveState.textContent='AI-sivusto tallennettu luonnokseksi';dialog.close();render();notice('Sivusto tallennettiin luonnokseksi. Vanha luonnos löytyy historiasta. Tarkista ja julkaise erikseen.');
      }catch(error){status.textContent=error.message;}finally{applying=false;accept.disabled=!content.querySelector('.site-ai-confirm').checked;dialog.querySelector('[data-close]').disabled=false;content.querySelector('.site-ai-back').disabled=false;}
    });
  }catch(error){status.textContent=error.message;}
}
