'use strict';
module.exports=function(section,{esc,paragraphs,safeUrl,imageAttrs,phoneHref}){
  const picture=item=>item.image?`<img class="card-image" ${imageAttrs(item.image,item.imagePosition)} alt="${esc(item.imageAlt)}" loading="lazy">`:'';
  const items=section.items.map(item=>{
    if(section.contentKind==='questions')return `<details class="faq-item"><summary>${esc(item.title)}</summary><div>${paragraphs(item.text)}</div></details>`;
    if(section.contentKind==='plans')return `<article><h3>${esc(item.title)}</h3><p class="plan-price">${esc(item.price)}</p><p>${paragraphs(item.text)}</p>${item.url?`<a class="button" href="${safeUrl(item.url)}">${esc(item.linkLabel||item.title)}</a>`:''}</article>`;
    if(section.contentKind==='reviews')return `<figure class="review-card">${picture(item)}<blockquote>${paragraphs(item.text)}</blockquote><figcaption><strong>${esc(item.title)}</strong>${item.role?`<span>${esc(item.role)}</span>`:''}</figcaption></figure>`;
    return `<article>${picture(item)}<h3>${esc(item.title)}</h3><p class="team-role">${esc(item.role)}</p><p>${paragraphs(item.text)}</p><address>${item.email?`<a href="${safeUrl('mailto:'+item.email)}">${esc(item.email)}</a>`:''}${item.phone?`<a href="${phoneHref(item.phone)}">${esc(item.phone)}</a>`:''}</address></article>`;
  }).join('');
  return `<section id="${esc(section.id)}" class="block content-${esc(section.contentKind)}"><div class="wrap"><p class="eyebrow">${esc(section.eyebrow)}</p><h2>${esc(section.title)}</h2><div class="${section.contentKind==='questions'?'faq-list':'features'}">${items}</div></div></section>`;
};
