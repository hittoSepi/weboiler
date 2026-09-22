'use strict';
function enhanceThemeAI(){
  if(location.pathname!=='/admin/teema'||!app.querySelector('[data-path="theme.background"]')||app.querySelector('[data-theme-ai]'))return;
  const button=document.createElement('button');button.type='button';button.className='button';button.dataset.themeAi='';button.textContent='Luo tai muokkaa teemaa AI:lla';button.addEventListener('click',openThemeAI);app.prepend(button);
}
new MutationObserver(enhanceThemeAI).observe(app,{childList:true,subtree:true});
enhanceThemeAI();
async function openThemeAI(){
  if(!await saveSite())return;
  const baseRevision=revision,baseVersion=serverVersion;
  const dialog=pickerDialog('Teema AI:lla'),content=dialog.querySelector('.asset-content'),status=dialog.querySelector('.asset-status');
  const stale=()=>revision!==baseRevision||serverVersion!==baseVersion||location.pathname!=='/admin/teema';
  try{
    const {settings}=await api('/api/admin/ai-settings');if(!dialog.isConnected)return;
    if(!settings.enabled){content.textContent='Ota AI käyttöön ja lisää API-avain asetuksissa.';return;}
    content.innerHTML='<p>Kuvaus ja nykyiset teema-arvot lähetetään valitulle palvelulle. Sivusisältöjä ei lähetetä. Generointi voi maksaa. Älä kirjoita salaisuuksia tai henkilötietoja.</p><label>Palvelu<select class="theme-ai-provider"><option value="openai">OpenAI</option><option value="gemini">Gemini</option></select></label><label>Millaisen ilmeen haluat?<textarea class="theme-ai-prompt" rows="5" maxlength="6000" placeholder="Lähes musta sininen tausta, oranssit korostukset, selkeä moderni fontti ja hieman pyöristetyt kulmat."></textarea></label><button type="button" class="button theme-ai-generate">Generoi ehdotus</button><div class="theme-ai-result" hidden><h3>Teemaehdotus</h3><p class="theme-ai-values"></p><p>Esikatselu näyttää etusivun uudella teemalla ilman skriptejä. Tarkista luettavuus. Osioiden omat värit ja fonttikoot voivat ohittaa teeman. Sisältö ja osioiden rakenne eivät muutu.</p><iframe title="AI-teeman esikatselu" sandbox="allow-same-origin" referrerpolicy="no-referrer" style="width:100%;height:520px;border:1px solid #aaa"></iframe><button type="button" class="button theme-ai-accept">Hyväksy luonnokseen</button></div>';
    content.querySelector('.theme-ai-provider').value=settings.provider;
    attachPromptEnhancer(dialog,{kind:'theme',promptSelector:'.theme-ai-prompt',generateSelector:'.theme-ai-generate',providerSelector:'.theme-ai-provider'});
    let proposal=null;
    content.querySelector('.theme-ai-generate').addEventListener('click',async event=>{
      if(stale()){status.textContent='Luonnos muuttui. Sulje ikkuna ja avaa AI uudelleen.';return;}
      const button=event.target;button.disabled=true;proposal=null;content.querySelector('.theme-ai-result').hidden=true;status.textContent='Generoidaan teemaa…';
      try{
        const result=await api('/api/admin/ai/theme',{method:'POST',headers:{'x-site-version':baseVersion},body:JSON.stringify({provider:content.querySelector('.theme-ai-provider').value,prompt:content.querySelector('.theme-ai-prompt').value})});
        if(!dialog.isConnected)return;if(stale())throw new Error('Luonnos muuttui. Sulje ikkuna ja avaa AI uudelleen.');
        proposal=result.theme;content.querySelector('iframe').srcdoc=result.preview;
        const labels={background:'Tausta',surface:'Pinta',text:'Teksti',muted:'Himmeä teksti',accent:'Korostus',font:'Leipäteksti',headingFont:'Otsikot',maxWidth:'Leveys',radius:'Pyöristys'};
        content.querySelector('.theme-ai-values').textContent=Object.entries(proposal).map(([key,value])=>labels[key]+': '+value).join(' · ');
        content.querySelector('.theme-ai-result').hidden=false;status.textContent='Tarkista ehdotus. Teemaa ei ole vielä muutettu.';
      }catch(error){status.textContent=error.message;}finally{button.disabled=false;}
    });
    content.querySelector('.theme-ai-accept').addEventListener('click',()=>{
      if(!proposal)return;if(stale()){status.textContent='Luonnos muuttui. Sulje ikkuna ja avaa AI uudelleen.';return;}
      site.theme=proposal;dirty();dialog.close();renderTheme();notice('Teema lisättiin luonnokseen. Voit hienosäätää sitä ja julkaista erikseen.');
    });
  }catch(error){status.textContent=error.message;}
}
