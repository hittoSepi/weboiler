'use strict';
const focusObserver=new MutationObserver(addFocusButtons);
focusObserver.observe(app,{childList:true,subtree:true});
function addFocusButtons(){
  for(const input of app.querySelectorAll('[data-path]')){
    const path=input.dataset.path;if(!/\.(image|src)$/.test(path)||input.dataset.focusReady)continue;
    input.dataset.focusReady='true';const button=document.createElement('button');button.type='button';button.className='small-button';button.textContent='Kuvan rajauspiste';
    button.addEventListener('click',()=>chooseFocus(path));(input.closest('label')||input).insertAdjacentElement('afterend',button);
  }
}
function chooseFocus(path){
  const src=getPath(site,path);if(!src){notice('Valitse ensin kuva.','error');return;}
  const positionPath=path.replace(/\.(image|src)$/,'.imagePosition');
  const current=(getPath(site,positionPath)||'50% 50%').split(' ').map(value=>parseInt(value,10));
  const dialog=pickerDialog('Kuvan rajauspiste'),content=dialog.querySelector('.asset-content');
  content.innerHTML=`<p>Klikkaa kuvan tärkeintä kohtaa tai säädä prosentteja. Alkuperäistä kuvaa ei leikata; asetus ohjaa sen sijoittelua rajatussa kuvapaikassa.</p><img class="focus-original" src="${esc(src)}" alt="Valitse rajauspiste" style="display:block;max-width:100%;max-height:300px;cursor:crosshair"><label>Vaakasijainti (%)<input class="focus-x" type="number" min="0" max="100" value="${current[0]}"></label><label>Pystysijainti (%)<input class="focus-y" type="number" min="0" max="100" value="${current[1]}"></label><p>Esimerkkirajaus (16:9)</p><img class="focus-preview" src="${esc(src)}" alt="Rajauksen esikatselu" style="width:100%;aspect-ratio:16/9;object-fit:cover;max-height:260px"><button type="button" class="button">Käytä rajauspistettä</button>`;
  const x=content.querySelector('.focus-x'),y=content.querySelector('.focus-y');
  const value=()=>`${Math.round(Math.max(0,Math.min(100,Number(x.value)||0)))}% ${Math.round(Math.max(0,Math.min(100,Number(y.value)||0)))}%`;
  const preview=()=>{content.querySelector('.focus-preview').style.objectPosition=value();dialog.querySelector('.asset-status').textContent=value();};
  content.querySelector('.focus-original').addEventListener('click',event=>{const rect=event.target.getBoundingClientRect();x.value=Math.round((event.clientX-rect.left)/rect.width*100);y.value=Math.round((event.clientY-rect.top)/rect.height*100);preview();});
  x.addEventListener('input',preview);y.addEventListener('input',preview);preview();
  content.querySelector('button').addEventListener('click',()=>applyAsset(positionPath,value(),dialog));
}
