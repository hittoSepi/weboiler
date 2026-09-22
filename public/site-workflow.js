'use strict';
function attachSiteWorkflow({dialog,content,status,baseVersion,stale,onReady}){
  const brief=content.querySelector('.site-ai-brief'),generate=content.querySelector('.site-ai-generate');
  generate.textContent='Suunnittele sivusto';
  const history=document.createElement('section');history.className='workflow-history';brief.append(history);
  const panel=document.createElement('section');panel.className='workflow-panel';panel.hidden=true;brief.after(panel);
  let job=null,running=false,pause=false;
  const request=(suffix,data)=>api('/api/admin/ai/workflows'+suffix,{method:'POST',headers:{'x-site-version':baseVersion},body:JSON.stringify(data)});
  function check(){if(stale()||(job&&job.version!==baseVersion))throw new Error('Luonnos on muuttunut. Aloita uusi suunnitelma nykyisestä luonnoksesta.');}
  function draw(){
    if(!dialog.isConnected)return;
    if(job.status==='ready'){panel.hidden=true;onReady(job.proposal);return;}
    brief.hidden=true;panel.hidden=false;
    if(job.status==='review'){
      panel.innerHTML=`<h3>2. Tarkista suunnitelma</h3><p>Muokkaa tekstejä tarvittaessa. Rakentaminen aloitetaan vasta hyväksymisen jälkeen. Jokainen vaihe käyttää erillistä AI-kutsua.</p><label>Sivuston nimi<input data-plan="siteName" value="${esc(job.plan.siteName)}"></label><label>Etusivun otsikko<input data-plan="title" value="${esc(job.plan.title)}"></label><label>Visuaalinen tyyli<textarea data-plan="style">${esc(job.plan.style)}</textarea></label>${job.plan.elements.map((e,i)=>`<details><summary>Elementti: ${esc(e.name)}</summary><label>Elementin ohje<textarea data-plan="elements.${i}.brief">${esc(e.brief)}</textarea></label></details>`).join('')}${job.plan.pages.map((p,i)=>`<fieldset><legend>${esc(p.title)} /${esc(p.slug)}</legend><label>Sivun otsikko<input data-plan="pages.${i}.title" value="${esc(p.title)}"></label>${p.sections.map((s,j)=>`<label>${esc(s.title)} (${esc(s.type)})<textarea data-plan="pages.${i}.sections.${j}.brief">${esc(s.brief)}</textarea></label>`).join('')}</fieldset>`).join('')}<div class="prompt-actions"><button type="button" class="button" data-workflow-approve>Hyväksy suunnitelma ja rakenna</button><button type="button" class="small-button" data-workflow-new>Takaisin kuvaukseen</button></div>`;
    }else panel.innerHTML=`<h3>3. Rakennetaan sivustoa</h3><p>${job.completed} / ${job.total} vaihetta valmiina</p><progress max="${job.total}" value="${job.completed}" style="width:100%"></progress><p>Seuraava: ${esc(job.next)}</p>${job.error?`<p role="alert">${esc(job.error)}</p>`:''}<p>Onnistuneet vaiheet on tallennettu. Sulkeminen keskeyttää etenemisen nykyisen pyynnön jälkeen.</p><div class="prompt-actions"><button type="button" class="button" data-workflow-continue ${running?'disabled':''}>${job.error?'Yritä epäonnistunutta vaihetta uudelleen':'Jatka rakentamista'}</button><button type="button" class="small-button" data-workflow-pause ${!running?'disabled':''}>Pysäytä tämän vaiheen jälkeen</button><button type="button" class="small-button" data-workflow-new ${running?'disabled':''}>Takaisin kuvaukseen</button></div>`;
    if(job.status==='review'&&job.plan.unsupported?.length){
      const notice=document.createElement('section');notice.setAttribute('role','alert');
      notice.innerHTML='<h4>Erillistä toteutusta tai asetuksia tarvitsevat toiminnot</h4><p>Velho ei toteuta näitä toimintoja. Hyväksymällä jatkat muun sivuston rakentamista.</p><ul>'+job.plan.unsupported.map(item=>'<li>'+esc(item)+'</li>').join('')+'</ul>';
      panel.querySelector('h3').after(notice);
    }
  }
  async function advance(){
    if(running||!job)return;running=true;pause=false;
    try{
      check();job=await api('/api/admin/ai/workflows/'+job.id);check();
      while(dialog.isConnected&&!pause&&!['review','ready','applied'].includes(job.status)){
        draw();status.textContent='Käynnissä: '+job.next;
        job=await request('/'+job.id+'/step',{expectedStep:job.completed});check();
      }
      if(dialog.isConnected){status.textContent=job.status==='review'?'Suunnitelma valmis hyväksyttäväksi.':pause?'Eteneminen pysäytetty. Voit jatkaa myöhemmin.':'Vaiheet tallennettu.';}
    }catch(error){status.textContent=error.message;if(job)try{job=await api('/api/admin/ai/workflows/'+job.id);}catch{}}
    finally{running=false;draw();}
  }
  panel.addEventListener('input',event=>{const key=event.target.dataset.plan;if(!key||job?.status!=='review')return;const parts=key.split('.');let target=job.plan;for(const part of parts.slice(0,-1))target=target[part];target[parts.at(-1)]=event.target.value;});
  panel.addEventListener('click',async event=>{
    if(event.target.closest('[data-workflow-pause]')){pause=true;status.textContent='Nykyinen pyyntö valmistuu ensin. Sen jälkeen eteneminen pysähtyy.';}
    if(event.target.closest('[data-workflow-new]')&&!running){panel.hidden=true;brief.hidden=false;refreshHistory();}
    if(event.target.closest('[data-workflow-continue]'))advance();
    const button=event.target.closest('[data-workflow-approve]');if(button){button.disabled=true;try{check();job=await request('/'+job.id+'/approve',{plan:job.plan});await advance();}catch(error){status.textContent=error.message;button.disabled=false;}}
  });
  generate.addEventListener('click',async()=>{
    if(running)return;generate.disabled=true;
    try{job=null;check();job=await request('',{prompt:content.querySelector('.site-ai-prompt').value,provider:content.querySelector('.site-ai-provider').value});await advance();}catch(error){status.textContent=error.message;}finally{generate.disabled=false;}
  });
  async function refreshHistory(){try{const {jobs}=await api('/api/admin/ai/workflows');if(!dialog.isConnected)return;history.innerHTML='<h3>Tallennetut AI-työt</h3>'+jobs.filter(j=>j.status!=='applied').slice(0,8).map(j=>`<p><button type="button" class="small-button" data-resume-workflow="${j.id}">${esc(j.plan?.siteName||j.brief.slice(0,60))} – ${j.completed}/${j.total} – Avaa</button></p>`).join('');}catch(error){history.textContent=error.message;}}
  history.addEventListener('click',async event=>{const b=event.target.closest('[data-resume-workflow]');if(!b||running)return;b.disabled=true;try{job=await api('/api/admin/ai/workflows/'+b.dataset.resumeWorkflow);check();content.querySelector('.site-ai-provider').value=job.provider;draw();}catch(error){status.textContent=error.message;}finally{b.disabled=false;}});
  refreshHistory();
}
