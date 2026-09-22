'use strict';
function attachPromptEnhancer(dialog,options={}){
  const content=dialog.querySelector('.asset-content'),status=dialog.querySelector('.asset-status');
  const prompt=content.querySelector(options.promptSelector||'.site-ai-prompt'),generate=content.querySelector(options.generateSelector||'.site-ai-generate');
  if(!prompt||!generate||content.querySelector('[data-prompt-enhancer]'))return;
  const provider=()=>content.querySelector(options.providerSelector||'.site-ai-provider')?.value;
  const endpoint=options.endpoint||'/api/admin/ai/prompt/enhance',kind=options.kind||'site',limit=Number(prompt.maxLength)||12000;
  const panel=document.createElement('div');
  panel.className='prompt-enhancer';panel.dataset.promptEnhancer='';
  panel.innerHTML=`<button type="button" class="small-button prompt-enhance">Paranna kuvausta</button><p class="muted">AI tarkentaa nykyistä ohjetta. Erillinen AI-pyyntö voi maksaa; tulosta ei vielä generoida.</p><section class="prompt-suggestion" hidden><h3>Paranneltu kuvaus</h3><label>Tarkista ja muokkaa ehdotusta<textarea class="prompt-enhanced" rows="10" maxlength="${limit}"></textarea></label><div class="prompt-actions"><button type="button" class="small-button prompt-use">Käytä kuvausta</button> <button type="button" class="small-button prompt-discard">Hylkää ehdotus</button></div></section><div class="prompt-restore-row"><button type="button" class="small-button prompt-restore" hidden>Palauta edellinen kuvaus</button></div>`;
  generate.before(panel);
  const enhance=panel.querySelector('.prompt-enhance'),suggestion=panel.querySelector('.prompt-suggestion'),output=panel.querySelector('.prompt-enhanced'),restore=panel.querySelector('.prompt-restore');
  let source='',previous=null,accepted='',busy=false;
  enhance.addEventListener('click',async()=>{
    if(busy||generate.disabled)return;
    if(!prompt.value.trim()){status.textContent='Kirjoita ensin lyhyt kuvaus sivustosta.';prompt.focus();return;}
    source=prompt.value;busy=true;enhance.disabled=true;generate.disabled=true;suggestion.hidden=true;status.textContent='Täydennetään kuvausta…';
    try{
      const result=await api(endpoint,{method:'POST',body:JSON.stringify({prompt:source,provider:provider(),kind})});
      if(!dialog.isConnected)return;
      output.value=result.prompt;suggestion.hidden=false;status.textContent='Tarkista ehdotetut lisäykset. Alkuperäistä kuvausta ei ole muutettu.';
    }catch(error){status.textContent=error.message;}finally{busy=false;enhance.disabled=false;generate.disabled=false;}
  });
  panel.querySelector('.prompt-use').addEventListener('click',()=>{
    if(prompt.value!==source){status.textContent='Muokkasit alkuperäistä kuvausta. Paranna se uudelleen, jotta muutoksesi säilyvät.';return;}
    if(!output.value.trim()||output.value.length>limit){status.textContent=`Kuvauksen pituus on 1–${limit} merkkiä.`;return;}
    previous=source;accepted=output.value.trim();prompt.value=accepted;suggestion.hidden=true;restore.hidden=false;status.textContent='Paranneltu kuvaus käytössä. Voit muokata sitä tai generoida sivustoehdotuksen.';
  });
  panel.querySelector('.prompt-discard').addEventListener('click',()=>{suggestion.hidden=true;status.textContent='Ehdotus hylätty. Kuvaus säilyi ennallaan.';});
  restore.addEventListener('click',()=>{
    if(previous===null)return;
    if(prompt.value!==accepted){status.textContent='Olet muokannut kuvausta hyväksymisen jälkeen. Automaattinen palautus ei korvaa muutoksiasi.';return;}
    prompt.value=previous;previous=null;restore.hidden=true;status.textContent='Edellinen kuvaus palautettu.';
  });
}
