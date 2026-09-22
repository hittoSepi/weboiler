'use strict';
const layoutAIObserver=new MutationObserver(()=>{
  if(!['/admin/elementit','/admin/osiot'].includes(location.pathname))return;
  const actions=app.querySelector('.actions');if(!actions||actions.querySelector('[data-layout-ai]'))return;
  for(const [mode,label]of [['new','Luo pohja AI:lla'],['edit','Muokkaa pohjaa AI:lla']]){
    if(mode==='edit'&&!layoutTemplate())continue;
    const button=document.createElement('button');button.type='button';button.dataset.layoutAi=mode;button.textContent=label;
    button.addEventListener('click',()=>openLayoutAI(mode));actions.append(button);
  }
});
layoutAIObserver.observe(app,{childList:true,subtree:true});
async function openLayoutAI(mode){
  if(!await saveSite())return;
  const kind=layoutLibrary(),targetId=mode==='edit'?layoutTemplate()?.id:'';
  if(mode==='edit'&&!targetId)return;
  const baseRevision=revision,baseVersion=serverVersion;
  const dialog=pickerDialog(mode==='edit'?'Muokkaa pohjaa AI:lla':'Luo pohja AI:lla');
  const content=dialog.querySelector('.asset-content'),status=dialog.querySelector('.asset-status');
  try{
    const {settings}=await api('/api/admin/ai-settings');if(!dialog.isConnected)return;
    if(!settings.enabled){content.textContent='Ota AI käyttöön ja lisää API-avain asetuksissa.';return;}
    content.innerHTML='<p>Generointi voi maksaa. Kuvaus, muokattava pohja oletussisältöineen sekä elementtien nimet ja tunnisteet lähetetään valitulle palvelulle. Älä sisällytä salaisuuksia tai henkilötietoja. Muita sivusisältöjä tai asetuksia ei lähetetä.</p><label>Palvelu<select class="layout-ai-provider"><option value="openai">OpenAI</option><option value="gemini">Gemini</option></select></label><label>Kuvaile haluamasi pohja tai muutokset<textarea class="layout-ai-prompt" rows="6" maxlength="6000" placeholder="Kolme palvelukorttia vierekkäin, kuvake, otsikko ja kuvaus. Tumma tausta ja oranssit otsikot."></textarea></label><button type="button" class="button layout-ai-generate">Generoi ehdotus</button><div class="layout-ai-result" hidden><h3 class="layout-ai-name"></h3><p>Tarkista ulkoasu ja sisältö. Hyväksyminen muuttaa vain luonnosta. Yhteisen pohjan muutos koskee sen kaikkia käyttökohteita. Esikatselussa ei ajeta skriptejä.</p><iframe title="AI-pohjan esikatselu" sandbox="" referrerpolicy="no-referrer" style="width:100%;height:480px;border:1px solid #aaa"></iframe><button type="button" class="button layout-ai-accept">Hyväksy luonnokseen</button></div>';
    content.querySelector('.layout-ai-provider').value=settings.provider;
    attachPromptEnhancer(dialog,{kind:'layout',promptSelector:'.layout-ai-prompt',generateSelector:'.layout-ai-generate',providerSelector:'.layout-ai-provider'});
    let proposal=null;
    const stale=()=>revision!==baseRevision||serverVersion!==baseVersion||layoutLibrary()!==kind;
    content.querySelector('.layout-ai-generate').addEventListener('click',async event=>{
      if(stale()){status.textContent='Luonnos muuttui. Sulje ikkuna ja avaa AI uudelleen.';return;}
      const button=event.target;button.disabled=true;proposal=null;content.querySelector('.layout-ai-result').hidden=true;status.textContent='Generoidaan ja tarkistetaan rakennetta…';
      try{
        const result=await api('/api/admin/ai/layout',{method:'POST',headers:{'x-site-version':baseVersion},body:JSON.stringify({kind,targetId,provider:content.querySelector('.layout-ai-provider').value,prompt:content.querySelector('.layout-ai-prompt').value})});
        if(!dialog.isConnected)return;if(stale())throw new Error('Luonnos muuttui. Sulje ikkuna ja avaa AI uudelleen.');
        proposal=result.template;content.querySelector('.layout-ai-name').textContent=proposal.name;
        content.querySelector('iframe').srcdoc=result.preview;content.querySelector('.layout-ai-result').hidden=false;status.textContent='Ehdotus on tarkistettu. Mitään ei ole vielä muutettu.';
      }catch(error){status.textContent=error.message;}finally{button.disabled=false;}
    });
    content.querySelector('.layout-ai-accept').addEventListener('click',()=>{
      if(!proposal)return;if(stale()){status.textContent='Luonnos muuttui. Sulje ikkuna ja avaa AI uudelleen.';return;}
      const list=site.builder[kind],index=list.findIndex(t=>t.id===targetId);
      if(targetId&&index<0){status.textContent='Pohjaa ei enää löydy.';return;}
      if(index>=0)list[index]=proposal;else list.push(proposal);
      layoutTemplateId=proposal.id;layoutSelected=proposal.root.id;dirty();dialog.close();dialog.remove();renderLayoutBuilder();notice('AI-pohja lisättiin luonnokseen. Tarkista ja julkaise erikseen.');
    });
  }catch(error){status.textContent=error.message;}
}
