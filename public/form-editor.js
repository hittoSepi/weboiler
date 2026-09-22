'use strict';
function formEditor(section,index){
  if(!section.form)return `<div class="wide"><p>Oletuslomake: nimi, sähköposti, puhelin ja viesti.</p><button class="small-button" type="button" data-form-enable="${index}">Muokkaa lomakekenttiä</button></div>`;
  const path=`sections.${index}.form`;
  return `<div class="subpanel wide"><h3>Lomakekentät</h3><p>Tyhjä vastaanottaja käyttää sähköpostiasetusten osoitetta. Viestit tallennetaan aina hallintaan.</p>${field(path+'.recipient','Lomakkeen vastaanottaja',section.form.recipient,{type:'email'})}${section.form.fields.map((item,i)=>`<div class="item-row"><div class="field-grid">${field(`${path}.fields.${i}.id`,'Kentän tunniste',item.id)}${field(`${path}.fields.${i}.label`,'Kentän nimi',item.label)}<label>Tyyppi<select data-path="${path}.fields.${i}.type">${Object.entries({text:'Teksti',textarea:'Pitkä teksti',email:'Sähköposti',tel:'Puhelin',select:'Valintalista',checkbox:'Valintaruutu'}).map(([value,label])=>`<option value="${value}"${item.type===value?' selected':''}>${label}</option>`).join('')}</select></label><label><input type="checkbox" data-form-required="${index}:${i}"${item.required?' checked':''}> Pakollinen</label><label class="wide">Valintalistan vaihtoehdot (yksi per rivi)<textarea data-form-options="${index}:${i}">${esc((item.options||[]).join('\n'))}</textarea></label></div><div class="actions"><button type="button" data-form-move="${index}:${i}:-1">↑</button><button type="button" data-form-move="${index}:${i}:1">↓</button><button type="button" data-form-remove="${index}:${i}">Poista kenttä</button></div></div>`).join('')}<button type="button" class="small-button" data-form-add="${index}">Lisää kenttä</button></div>`;
}
document.addEventListener('input',event=>{
  const target=event.target,key=target.dataset.formRequired||target.dataset.formOptions;if(!key)return;
  const [section,index]=key.split(':').map(Number),item=editorSections()[section].form.fields[index];
  if(target.dataset.formRequired)item.required=target.checked;else item.options=target.value.split('\n').map(x=>x.trim()).filter(Boolean);
  dirty();
});
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-form-enable],[data-form-add],[data-form-remove],[data-form-move]');if(!button)return;
  const key=button.dataset.formEnable??button.dataset.formAdd??button.dataset.formRemove??button.dataset.formMove;
  const [index,item,direction]=key.split(':').map(Number),section=editorSections()[index];
  if(button.dataset.formEnable!==undefined)section.form={recipient:'',fields:[{id:'name',label:'Nimi',type:'text',required:true,options:[]},{id:'email',label:'Sähköposti',type:'email',required:true,options:[]},{id:'message',label:'Viesti',type:'textarea',required:true,options:[]}]};
  else if(button.dataset.formAdd!==undefined){if(section.form.fields.length>=20){notice('Enintään 20 kenttää.','error');return;}section.form.fields.push({id:'field-'+crypto.randomUUID().slice(0,8),label:'Uusi kenttä',type:'text',required:false,options:[]});}
  else if(button.dataset.formRemove){if(section.form.fields.length===1){notice('Lomakkeeseen tarvitaan vähintään yksi kenttä.','error');return;}section.form.fields.splice(item,1);}
  else {const list=section.form.fields,to=item+direction;if(to<0||to>=list.length)return;[list[item],list[to]]=[list[to],list[item]];}
  dirty();renderEditor();
});
