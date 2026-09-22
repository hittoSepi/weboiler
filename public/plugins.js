'use strict';
let pluginCatalog=[];
document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-integration]');if(!button)return;
  button.disabled=true;
  try{
    const result=await api('/api/admin/plugins/'+encodeURIComponent(button.dataset.plugin)+'/integrations/'+encodeURIComponent(button.dataset.integration),{method:'POST',body:'{}'});
    const dialog=pickerDialog('API-tuonnin tarkistus'),content=dialog.querySelector('.asset-content');
    content.innerHTML=`<p>${result.items.length} tuotetta. Samalla tunnisteella olevat päivitetään, muut lisätään. Puuttuvia ei poisteta. Vain työversio muuttuu.</p><ul>${result.items.map(item=>`<li>${esc(item.title)} — ${esc(item.price||'')}</li>`).join('')}</ul><button class="button" type="button">Tuo työversioon</button>`;
    content.querySelector('button').addEventListener('click',()=>{
      const data=pluginData(button.dataset.plugin),current=data[result.collection]||[];
      const merged=new Map(current.map(item=>[item.id,item]));for(const item of result.items)merged.set(item.id,item);
      const values=[...merged.values()];
      if(values.length>100||new Set(values.map(item=>item.slug)).size!==values.length){notice('Tuonti ylittäisi 100 tuotetta tai aiheuttaisi päällekkäisen osoitetunnisteen.','error');return;}
      data[result.collection]=values;dirty();dialog.close();renderPlugins();notice('Tuotteet tuotu työversioon. Tarkista ja julkaise erikseen.');
    });
  }catch(error){notice(error.message,'error');}finally{button.disabled=false;}
});
function pluginField(path,definition,value=''){
  if(definition.type==='select')return `<label>${esc(definition.label)}<select data-path="${esc(path)}">${definition.options.map(option=>`<option value="${esc(option.value)}"${(value||definition.default)===option.value?' selected':''}>${esc(option.label)}</option>`).join('')}</select></label>`;
  if(definition.type==='datetime'){
    const date=value?new Date(value):null;
    const local=date&&Number.isFinite(date.getTime())?new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16):'';
    return `<label>${esc(definition.label)}<input type="datetime-local" data-plugin-datetime="${esc(path)}" value="${esc(local)}"></label>`;
  }
  return field(path,definition.label,value,{textarea:definition.type==='textarea',wide:['textarea','image'].includes(definition.type)});
}
document.addEventListener('change',event=>{
  const path=event.target.dataset.pluginDatetime;if(!path)return;
  const value=event.target.value,date=value?new Date(value):null;
  if(date&&!Number.isFinite(date.getTime())){notice('Valitse kelvollinen ajankohta.','error');return;}
  setPath(site,path,date?date.toISOString():'');dirty();
});
async function loadPlugins(){pluginCatalog=(await api('/api/admin/plugins')).plugins;for(const plugin of pluginCatalog)if(plugin.adminPage)PAGES['/admin/'+plugin.adminPage.slug]=[plugin.adminPage.label,plugin.adminPage.icon];for(const plugin of pluginCatalog)for(const section of plugin.sections||[])TYPES[section.type]=section.label;}
function pluginReferenceField(path,definition,value){const items=site.plugins?.[definition.plugin]?.[definition.collection]||[];return `<label>${esc(definition.label)}<select data-path="${esc(path)}"><option value="">Valitse tuote</option>${value&&!items.some(item=>item.id===value)?`<option value="${esc(value)}" selected>Poistettu tuote</option>`:''}${items.map(item=>`<option value="${esc(item.id)}"${item.id===value?' selected':''}>${esc(item.title)}</option>`).join('')}</select></label>`;}
function pluginSectionFields(section,path){
  const definition=pluginCatalog.flatMap(plugin=>plugin.sections||[]).find(item=>item.type===section.type);
  if(!definition)return '';
  section.pluginData??={};
  return `<p class="wide muted">Tämän osion sisältöä hallitaan Lisäosat-sivulla. Osio näkyy julkisesti vain, jos lisäosa on käytössä julkaistussa versiossa.</p>`+(definition.fields||[]).map(item=>item.type==='reference'?pluginReferenceField(`${path}.pluginData.${item.key}`,item,section.pluginData[item.key]||''):field(`${path}.pluginData.${item.key}`,item.label,section.pluginData[item.key]||'',{textarea:item.type==='textarea',wide:true})).join('');
}
function renderPlugins(){
  site.plugins??={};
  app.innerHTML='<p>Lisäosat ovat projektin mukana asennettua luotettua koodia. Käyttöönotto ja sisältö tallentuvat luonnokseen; julkaise muutokset erikseen. Käytöstä poistaminen säilyttää sisällön.</p>'+pluginCatalog.filter(plugin=>{const current=pluginCatalog.find(item=>item.adminPage&&location.pathname==='/admin/'+item.adminPage.slug);return !current||plugin.id===current.id;}).map(plugin=>{
    const data=site.plugins[plugin.id]||{enabled:false};
    return `<section class="panel"><h2>${esc(plugin.name)}</h2><p>${esc(plugin.description)}</p><label><input type="checkbox" data-plugin-toggle="${esc(plugin.id)}"${data.enabled?' checked':''}> Käytössä</label>${plugin.adminPage&&location.pathname==='/admin/plugins'?`<p><a href="/admin/${esc(plugin.adminPage.slug)}">Avaa ${esc(plugin.adminPage.label)} →</a></p>`:''}${(plugin.integrations||[]).map(item=>`<button class="small-button" type="button" data-integration="${esc(item.id)}" data-plugin="${esc(plugin.id)}">${esc(item.label)}</button>`).join('')}${(plugin.collections||[]).map(collection=>`<h3>${esc(collection.label)}</h3>${(data[collection.key]||[]).map((item,index)=>`<article class="subpanel"><div class="section-head"><h3>${esc(item.title||'Uusi kohde')}</h3><button type="button" class="small-button" data-plugin-move="${esc(plugin.id)}" data-collection="${esc(collection.key)}" data-index="${index}" data-direction="-1" aria-label="Siirrä kohde ylös"${index===0?' disabled':''}>↑</button><button type="button" class="small-button" data-plugin-move="${esc(plugin.id)}" data-collection="${esc(collection.key)}" data-index="${index}" data-direction="1" aria-label="Siirrä kohde alas"${index===(data[collection.key]||[]).length-1?' disabled':''}>↓</button><button type="button" class="small-button danger" data-plugin-remove="${esc(plugin.id)}" data-collection="${esc(collection.key)}" data-id="${esc(item.id)}">Poista kohde</button></div><div class="field-grid">${collection.fields.map(def=>pluginField(`plugins.${plugin.id}.${collection.key}.${index}.${def.key}`,def,item[def.key]||'')).join('')}</div>${plugin.routePrefix&&item.slug?`<a target="_blank" href="/admin/esikatselu?plugin=${esc(plugin.id)}&amp;item=${encodeURIComponent(item.slug)}">Esikatsele tallennettua työversiota ↗</a>`:''}</article>`).join('')}<button type="button" class="small-button" data-plugin-add="${esc(plugin.id)}" data-collection="${esc(collection.key)}">Lisää ${esc(collection.label.toLowerCase())}-kohde</button>`).join('')}</section>`;
  }).join('');
}
function pluginData(id){site.plugins??={};if(!site.plugins[id]){site.plugins[id]={enabled:false};for(const collection of pluginCatalog.find(p=>p.id===id).collections||[])site.plugins[id][collection.key]=[];}return site.plugins[id];}
document.addEventListener('change',event=>{const id=event.target.dataset.pluginToggle;if(!id)return;pluginData(id).enabled=event.target.checked;dirty();});
document.addEventListener('input',event=>{const path=event.target.dataset.path||'';if(!/^plugins\.[^.]+\.[^.]+\.\d+\.slug$/.test(path))return;const link=event.target.closest('article')?.querySelector('a');if(link)link.href='/admin/esikatselu?plugin='+encodeURIComponent(path.split('.')[1])+'&item='+encodeURIComponent(event.target.value);});
document.addEventListener('click',event=>{
  const move=event.target.closest('[data-plugin-move]');
  if(move){const list=pluginData(move.dataset.pluginMove)[move.dataset.collection],index=Number(move.dataset.index),to=index+Number(move.dataset.direction);if(index>=0&&index<list.length&&to>=0&&to<list.length){[list[index],list[to]]=[list[to],list[index]];dirty();renderPlugins();}return;}
  const button=event.target.closest('[data-plugin-add],[data-plugin-remove]');if(!button)return;
  const id=button.dataset.pluginAdd||button.dataset.pluginRemove,key=button.dataset.collection,list=pluginData(id)[key];
  if(button.dataset.pluginAdd){
    if(list.length>=100){notice('Enintään 100 kohdetta.','error');return;}
    const token=crypto.randomUUID().slice(0,8),collection=pluginCatalog.find(p=>p.id===id).collections.find(c=>c.key===key);
    const item={id:'item-'+crypto.randomUUID()};for(const def of collection.fields)item[def.key]=def.default??(def.type==='slug'?'kohde-'+token:def.required?'Uusi kohde':'');
    list.push(item);dirty();renderPlugins();return;
  }
  const dialog=pickerDialog('Poista kohde');dialog.querySelector('.asset-content').innerHTML='<p>Kohde poistetaan työversiosta. Julkinen sisältö muuttuu vasta julkaisemisen jälkeen.</p><button class="button" type="button">Poista työversiosta</button>';
  dialog.querySelector('.asset-content button').addEventListener('click',()=>{const current=pluginData(id)[key],index=current.findIndex(item=>item.id===button.dataset.id);if(index>=0)current.splice(index,1);dirty();dialog.close();renderPlugins();});
});
