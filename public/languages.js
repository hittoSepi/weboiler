'use strict';
function languageFields(page,index){
  if(!page)return `<div class="field-grid">${field('meta.locale','Etusivun ja sivuston oletuskieli (fi, en, sv…)',site.meta.locale||'fi')}</div><p class="muted">Etusivun käännösryhmä on home. Lisää käännökseksi uusi sivu ja anna sille eri kieli sekä ryhmä home.</p>`;
  return `<div class="field-grid">${field(`pages.${index}.locale`,'Sivun kieli (tyhjä = sivuston oletus)',page.locale)}${field(`pages.${index}.translationGroup`,'Käännösryhmä',page.translationGroup||page.id)}${field(`pages.${index}.footerText`,'Sivun alatunniste (tyhjä = oletus)',page.footerText,{wide:true})}</div><p class="muted">Sama käännösryhmä yhdistää eri kielten sivut kielivalikkoon. Kussakin ryhmässä voi olla yksi sivu per kieli. Sisältö ja osoite ovat erikseen muokattavia.</p>${languageNavigation(page,index)}`;
}
function languageNavigation(page,index){
  if(!Array.isArray(page.navigation))return `<button class="small-button" type="button" data-page-nav="enable">Omat valikkotekstit tälle sivulle</button>`;
  return `<div class="subpanel"><h3>Sivun oma valikko</h3><p>Linkit ja tekstit korvaavat tällä sivulla yhteisen valikon. Kielivalikko muodostuu edelleen käännösryhmästä.</p>${page.navigation.map((item,i)=>`<div class="navigation-row">${field(`pages.${index}.navigation.${i}.label`,'Linkin teksti',item.label)}${field(`pages.${index}.navigation.${i}.target`,'Linkin osoite',item.target)}<button type="button" data-page-nav="up" data-index="${i}" aria-label="Siirrä linkki ylös">↑</button><button type="button" data-page-nav="remove" data-index="${i}">Poista linkki</button></div>`).join('')}<button type="button" class="small-button" data-page-nav="add">Lisää valikkolinkki</button> <button type="button" class="small-button" data-page-nav="reset">Palauta yhteinen valikko</button></div>`;
}
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-page-nav]');if(!button)return;
  const page=activePage();if(!page)return;
  const action=button.dataset.pageNav,index=Number(button.dataset.index);
  if(action==='enable')page.navigation=site.navigation.map(item=>({...item,target:/^(\/|#|[a-z]+:)/i.test(item.target)?item.target:'/#'+item.target}));
  else if(action==='reset')page.navigation=null;
  else if(action==='add'){if(page.navigation.length>=50){notice('Enintään 50 linkkiä.','error');return;}page.navigation.push({label:'Uusi linkki',target:'/'});}
  else if(action==='remove')page.navigation.splice(index,1);
  else if(action==='up'&&index>0)[page.navigation[index-1],page.navigation[index]]=[page.navigation[index],page.navigation[index-1]];
  dirty();renderEditor();
});
