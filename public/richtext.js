'use strict';

function askLink(initial = '') {
  return new Promise(resolve=>{
    const dialog=document.createElement('dialog');
    dialog.className='element-dialog';
    dialog.innerHTML=`<form><h2>Lisää linkki</h2><label>Linkin osoite<input name="url" value="${esc(initial)}" placeholder="https://… tai #osion-tunniste" required></label><p role="status"></p><div class="actions"><button type="button" data-cancel>Peruuta</button><button type="submit">Lisää linkki</button></div></form>`;
    let result=null;
    dialog.querySelector('[data-cancel]').addEventListener('click',()=>dialog.close());
    dialog.querySelector('form').addEventListener('submit',event=>{
      event.preventDefault();
      const url=dialog.querySelector('input').value.trim();
      if(!/^(https?:\/\/|mailto:|tel:|#|\/(?!\/))/i.test(url)||/[\x00-\x20\\]/.test(url)) {dialog.querySelector('[role=status]').textContent='Anna http(s)-osoite, paikallinen polku, #tunniste, mailto:- tai tel:-linkki.';return;}
      result=url;dialog.close();
    });
    dialog.addEventListener('close',()=>{dialog.remove();resolve(result);},{once:true});
    document.body.append(dialog);dialog.showModal();
  });
}

// Toolbar pointerdown must not collapse the text selection before formatting.
document.addEventListener('pointerdown',event=>{
  if(event.target.closest('.rich-toolbar button'))event.preventDefault();
},true);
document.addEventListener('click',async event=>{
  const button=event.target.closest('.rich-toolbar [data-command]');
  if(!button)return;
  event.preventDefault();event.stopImmediatePropagation();
  const editor=document.querySelector(`[data-rich-path="${button.closest('.rich-toolbar').dataset.editor}"]`);
  const selection=getSelection();
  const range=selection.rangeCount?selection.getRangeAt(0).cloneRange():null;
  const hasSelection=range&&editor.contains(range.commonAncestorContainer)&&!range.collapsed;
  if(button.dataset.command==='createLink') {
    if(!hasSelection){notice('Valitse ensin teksti, johon haluat linkin.','error');return;}
    const url=await askLink();
    if(!url)return;
    editor.focus();selection.removeAllRanges();selection.addRange(range);
    document.execCommand('createLink',false,url);
  } else {
    editor.focus();
    if(range&&editor.contains(range.commonAncestorContainer)){selection.removeAllRanges();selection.addRange(range);}
    document.execCommand(button.dataset.command,false);
  }
  editor.dispatchEvent(new Event('input',{bubbles:true}));
},true);
document.addEventListener('paste',event=>{
  const editor=event.target.closest('.rich-editor');
  if(!editor)return;
  event.preventDefault();
  document.execCommand('insertText',false,event.clipboardData.getData('text/plain'));
},true);
