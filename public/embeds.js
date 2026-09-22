'use strict';
document.addEventListener('click',event=>{
  const button=event.target.closest('[data-load-embed]');if(!button)return;
  const container=button.closest('.external-embed'),status=container.querySelector('.embed-status');
  if(document.body.dataset.preview==='true'){status.textContent=container.dataset.previewMessage||'Esikatselu: ulkoista palvelua ei ladata.';return;}
  const frame=document.createElement('iframe');frame.title=container.dataset.embedTitle;frame.src=container.dataset.embedUrl;
  frame.height=String(Math.min(1200,Math.max(240,Number(container.dataset.embedHeight)||600)));
  frame.referrerPolicy='no-referrer';frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-forms allow-popups');
  container.append(frame);button.remove();
  // Cross-origin load events cannot prove that the service accepted framing.
  status.textContent=container.dataset.fallbackMessage||'Jos upotus ei näy, avaa palvelu yllä olevasta linkistä.';
});
