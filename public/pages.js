'use strict';
let activePageId=new URLSearchParams(location.search).get('page')||sessionStorage.getItem('weboiler-editor-page')||'home';
function activePage(){return (site.pages||[]).find(page=>page.id===activePageId);}
function editorSections(){return activePage()?.sections||site.sections;}
function resolveEditorPath(object,path){
  if(object!==site||!path.startsWith('sections.')||!activePage())return path;
  return `pages.${site.pages.findIndex(page=>page.id===activePageId)}.${path}`;
}
function pagePreviewUrl(){const page=activePage();return '/admin/esikatselu'+(page?'?page='+encodeURIComponent(page.slug):'');}
function rewritePageLinks(oldSlug,newSlug){
  const rewrite=list=>list.flatMap(item=>{
    const [pathname,hash]=String(item.target).split('#');if(pathname!=='/'+oldSlug)return [item];
    return newSlug?[{...item,target:'/'+newSlug+(hash?'#'+hash:'')}]:[];
  });
  site.navigation=rewrite(site.navigation);
  for(const page of site.pages||[])if(Array.isArray(page.navigation))page.navigation=rewrite(page.navigation);
}
function pageToolbar(){
  site.pages??=[];
  if(activePageId!=='home'&&!activePage())activePageId='home';
  const page=activePage(),index=site.pages.indexOf(page);
  return `<section class="panel"><label>Muokattava sivu<select id="editor-page"><option value="home">Etusivu /</option>${site.pages.map(p=>`<option value="${esc(p.id)}"${p.id===activePageId?' selected':''}>${esc(p.title)} /${esc(p.slug)}</option>`).join('')}</select></label><div class="actions"><button type="button" class="small-button" data-page-action="add">+ Lisää sivu</button>${page?`<button type="button" class="small-button" data-page-action="up"${index===0?' disabled':''}>Siirrä sivu ylös</button><button type="button" class="small-button" data-page-action="down"${index===site.pages.length-1?' disabled':''}>Siirrä sivu alas</button><button type="button" class="small-button" data-page-action="nav">Lisää valikkoon</button><button type="button" class="small-button danger" data-page-action="delete">Poista sivu</button>`:''}</div>${page?`<p class="muted">Osoite: /${esc(page.slug)}. Nimen ja kuvauksen voi muuttaa tässä; osoitteen vaihto omalla painikkeellaan päivittää myös navigaation.</p><div class="field-grid">${field(`pages.${index}.title`,'Sivun nimi',page.title)}${field(`pages.${index}.seoTitle`,'Selain- ja jako-otsikko (tyhjä = sivun nimi)',page.seoTitle)}${field(`pages.${index}.shareImage`,'Sivun jakokuva (tyhjä = sivuston oletus)',page.shareImage,{wide:true})}${field(`pages.${index}.shareImageAlt`,'Jakokuvan vaihtoehtoinen teksti',page.shareImageAlt)}${field(`pages.${index}.description`,'Sivun kuvaus',page.description,{textarea:true})}</div><button type="button" class="small-button" data-page-action="slug">Vaihda osoite</button>`:'<p class="muted">Etusivun otsikkoa ja kuvausta muokataan Asetukset-sivulla. Kaikki sivut julkaistaan yhdessä.</p>'}${languageFields(page,index)}</section>`;
}
function setActivePage(id){activePageId=id;sessionStorage.setItem('weboiler-editor-page',id);const url=new URL(location.href);if(id==='home')url.searchParams.delete('page');else url.searchParams.set('page',id);history.replaceState(null,'',url);renderEditor();}
document.addEventListener('change',async event=>{
  if(event.target.id!=='editor-page')return;
  const id=event.target.value;event.target.disabled=true;
  if(await saveSite())setActivePage(id);else{event.target.value=activePageId;event.target.disabled=false;}
});
document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-page-action]');if(!button)return;
  const action=button.dataset.pageAction,page=activePage(),index=site.pages?.indexOf(page);
  if(action==='up'||action==='down'){
    const other=index+(action==='up'?-1:1);if(index<0||other<0||other>=site.pages.length)return;
    [site.pages[index],site.pages[other]]=[site.pages[other],site.pages[index]];dirty();renderEditor();return;
  }
  if(action==='nav'){
    if(!site.navigation.some(item=>item.target==='/'+page.slug)){site.navigation.push({label:page.title,target:'/'+page.slug});dirty();notice('Sivu lisättiin valikkoon. Järjestä valikkoa asetuksissa.');}return;
  }
  const dialog=pickerDialog(action==='add'?'Lisää sivu':action==='slug'?'Vaihda sivun osoite':'Poista sivu');
  const content=dialog.querySelector('.asset-content'),status=dialog.querySelector('.asset-status');
  if(action==='delete'){
    content.innerHTML=`<p>Poistetaanko ${esc(page.title)} työversiosta? Sivun sisältö ja sen valikkolinkit poistetaan. Live-sivu muuttuu vasta julkaisussa. Julkaistun version voi palauttaa historiasta.</p><button type="button" class="button">Poista työversiosta</button>`;
    content.querySelector('button').addEventListener('click',()=>{site.pages.splice(index,1);rewritePageLinks(page.slug,null);dirty();dialog.close();setActivePage('home');});return;
  }
  content.innerHTML=`<form>${action==='add'?'<label>Sivun nimi<input name="title" maxlength="140" required></label>':''}<label>Osoite (esim. palvelut)<input name="slug" maxlength="100" pattern="[a-z0-9]+(-[a-z0-9]+)*" required value="${esc(page?.slug||'')}"></label><p>Osoitteessa pienet a–z-kirjaimet, numerot ja yhdysmerkit. Osoitteen vaihtaminen ei luo uudelleenohjausta vanhasta osoitteesta.</p><button class="button">${action==='add'?'Lisää sivu':'Vaihda osoite'}</button></form>`;
  content.querySelector('form').addEventListener('submit',async event=>{
    event.preventDefault();const form=event.target,slug=form.elements.slug.value.trim();
    if(action==='add'&&!form.elements.title.value.trim()){status.textContent='Anna sivulle nimi.';return;}
    if(['admin','api','assets','uploads','vendor'].includes(slug)||(site.pages||[]).some(p=>p.id!==page?.id&&p.slug===slug)){status.textContent='Osoite on varattu tai jo käytössä.';return;}
    if(action==='add'&&site.pages.length>=50){status.textContent='Enintään 50 alasivua.';return;}
    if(action==='add'){
      const id='page-'+crypto.randomUUID();site.pages.push({id,slug,title:form.elements.title.value.trim(),description:'',sections:[]});dirty();dialog.close();setActivePage(id);
    }else{
      rewritePageLinks(page.slug,slug);
      activePage().slug=slug;dirty();dialog.close();renderEditor();
    }
  });
});
document.addEventListener('load',event=>{
  if(event.target.id!=='preview-frame')return;
  const documentInFrame=event.target.contentDocument;if(!documentInFrame)return;
  documentInFrame.addEventListener('click',async event=>{
    const link=event.target.closest('a[href]');if(!link)return;
    const url=new URL(link.href);if(url.origin!==location.origin||url.pathname!=='/admin/esikatselu')return;
    const slug=url.searchParams.get('page')||'',page=site.pages?.find(page=>page.slug===slug);
    const id=page?.id||'home';if(id===activePageId)return;
    event.preventDefault();if(await saveSite())setActivePage(id);
  });
},true);
