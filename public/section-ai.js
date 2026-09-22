'use strict';
let sectionAISelecting=false;
function sectionAIFrame(frame){
  try{
    const doc=frame.contentDocument,url=new URL(frame.contentWindow.location.href);
    if(!doc||url.pathname!=='/admin/esikatselu'||url.searchParams.has('plugin')||(url.searchParams.get('page')||'')!==(activePage()?.slug||''))return;
    if(doc.documentElement.dataset.sectionAiBound)return;doc.documentElement.dataset.sectionAiBound='true';
    const style=doc.createElement('style');style.textContent='body.ai-select main>section{cursor:pointer}body.ai-select main>section:hover,body.ai-select main>section:focus{outline:3px solid #ff9900;outline-offset:-3px}';doc.head.append(style);
    const update=()=>{doc.body.classList.toggle('ai-select',sectionAISelecting);doc.querySelectorAll('main>section').forEach(s=>{if(sectionAISelecting)s.setAttribute('tabindex','0');else s.removeAttribute('tabindex');});};
    frame.sectionAIUpdate=update;update();
    const pick=event=>{
      if(!sectionAISelecting)return;
      if(event.type==='keydown'&&!['Enter',' '].includes(event.key))return;
      const section=event.target.closest('main>section');if(!section)return;
      event.preventDefault();event.stopImmediatePropagation();
      openSectionAI(section.id);
    };
    doc.addEventListener('click',pick,true);doc.addEventListener('keydown',pick,true);
  }catch{/* A navigated cross-origin frame cannot be selected. */}
}
const sectionAIObserver=new MutationObserver(()=>{
  if(location.pathname!=='/admin/editori')return;
  const frame=document.querySelector('#preview-frame');if(!frame||frame.dataset.sectionAi)return;
  frame.dataset.sectionAi='true';
  const button=document.createElement('button');button.type='button';button.className='small-button';
  const label=()=>{button.textContent=sectionAISelecting?'Lopeta osion valinta':'Valitse osio AI-muokkaukseen';button.setAttribute('aria-pressed',String(sectionAISelecting));};label();
  button.addEventListener('click',()=>{sectionAISelecting=!sectionAISelecting;label();frame.sectionAIUpdate?.();});
  frame.before(button);frame.addEventListener('load',()=>sectionAIFrame(frame));sectionAIFrame(frame);
});
sectionAIObserver.observe(app,{childList:true,subtree:true});
async function openSectionAI(sectionId){
  if(document.querySelector('[data-section-ai-dialog]'))return;
  const pageId=activePageId;
  if(!await saveSite()||pageId!==activePageId)return;
  const section=editorSections().find(s=>s.id===sectionId);if(!section)return;
  const baseRevision=revision,baseVersion=serverVersion;
  const dialog=pickerDialog('Muokkaa osiota AI:lla');dialog.dataset.sectionAiDialog='true';
  const content=dialog.querySelector('.asset-content'),status=dialog.querySelector('.asset-status');
  if(!['custom','hero','text','cta','contact'].includes(section.type)){content.textContent='Tämän osiotyypin AI-muokkausta ei vielä tueta. Käytä osion tavallisia muokkauskenttiä.';return;}
  const stale=()=>revision!==baseRevision||serverVersion!==baseVersion||activePageId!==pageId;
  try{
    const {settings}=await api('/api/admin/ai-settings');if(!dialog.isConnected)return;
    if(!settings.enabled){content.textContent='Ota AI käyttöön ja lisää API-avain asetuksissa.';return;}
    content.innerHTML=`<p><strong>${esc(section.title||'Oma osio')}</strong></p><p>${section.type==='custom'?'Voit muuttaa tekstejä ja asettelua. Muutos tehdään vain tähän osioon, ei yhteiseen pohjaan.':'Voit muuttaa osion tekstejä. Valmiin osion asettelu, linkkikohteet ja lomakkeen toiminta säilyvät.'}</p><p>Valitun osion sisältö ja omassa osiossa myös sen rakenne sekä teema lähetetään AI-palvelulle. Älä sisällytä salaisuuksia tai henkilötietoja. Generointi voi maksaa.</p><label>Palvelu<select data-provider><option value="openai">OpenAI</option><option value="gemini">Gemini</option></select></label><label>Haluttu muutos<textarea data-prompt rows="5" maxlength="6000" placeholder="Tiivistä tekstit${section.type==='custom'?' ja tee asettelusta ilmavampi':''}."></textarea></label><button type="button" class="button" data-generate>Generoi ehdotus</button><section data-result hidden><h3>Ehdotus</h3><p>Mitään ei ole vielä muutettu. Sulkeminen hylkää ehdotuksen.</p><iframe title="Osion AI-ehdotuksen esikatselu" sandbox="" referrerpolicy="no-referrer" style="width:100%;height:480px;border:1px solid #aaa"></iframe><button type="button" class="button" data-accept>Hyväksy tähän osioon</button></section>`;
    content.querySelector('[data-provider]').value=settings.provider;
    attachPromptEnhancer(dialog,{kind:'section',promptSelector:'[data-prompt]',generateSelector:'[data-generate]',providerSelector:'[data-provider]'});
    let proposal=null;
    content.querySelector('[data-generate]').addEventListener('click',async event=>{
      const button=event.target;button.disabled=true;proposal=null;content.querySelector('[data-result]').hidden=true;
      try{
        if(stale())throw new Error('Luonnos muuttui. Sulje ikkuna ja avaa muokkaus uudelleen.');
        status.textContent='Generoidaan osion muutosta…';
        const result=await api('/api/admin/ai/section',{method:'POST',headers:{'x-site-version':baseVersion},body:JSON.stringify({pageId,sectionId,provider:content.querySelector('[data-provider]').value,prompt:content.querySelector('[data-prompt]').value})});
        if(!dialog.isConnected)return;if(stale())throw new Error('Luonnos muuttui. Avaa muokkaus uudelleen.');
        proposal=result;content.querySelector('iframe').srcdoc=result.preview;content.querySelector('[data-result]').hidden=false;status.textContent='Tarkista ehdotus ennen hyväksymistä.';
      }catch(error){status.textContent=error.message;}finally{button.disabled=false;}
    });
    content.querySelector('[data-accept]').addEventListener('click',()=>{
      if(!proposal)return;if(stale()){status.textContent='Luonnos muuttui. Avaa muokkaus uudelleen.';return;}
      const index=editorSections().findIndex(s=>s.id===sectionId);if(index<0)return;
      if(proposal.template)site.builder.sections.push(proposal.template);
      editorSections()[index]=proposal.section;dirty();dialog.close();dialog.remove();renderEditor();notice('Osion muutos lisättiin työversioon. Julkaise erikseen.');
    });
  }catch(error){status.textContent=error.message;}
}
