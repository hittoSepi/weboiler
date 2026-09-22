'use strict';
const definitions=[['map-embed','Karttaupotus','map','Google Maps: kopioi Jaa → Upota kartta -koodista vain src-osoite.'],['booking-embed','Ajanvarausupotus','booking','Calendly: anna oma ajanvaraussivusi HTTPS-osoite.'],['newsletter-embed','Uutiskirjeupotus','newsletter','Buttondown: https://buttondown.com/OMA-TUNNUS?as_embed=true']];
module.exports={id:'embeds',name:'Ulkoiset upotukset',description:'Valinnaiset Google Maps-, Calendly- ja Buttondown-upotukset. Sisältö latautuu vasta kävijän painalluksesta. Osoitteet määritellään sivueditorin osioissa. Ei mielivaltaista HTML- tai JavaScript-koodia.',version:1,collections:[],
  sections:definitions.map(([type,label,provider,help])=>({type,label,fields:[{key:'url',label:help,type:'embedUrl',provider,max:4000},{key:'height',label:'Korkeus pikseleinä (240–1200)',type:'text',max:4}]})),
  renderSection(section){
    const provider=definitions.find(item=>item[0]===section.type)[2],src=require('../lib/embeds').url(section.pluginData?.url,provider);
    if(!src)return null;
    return {...section,type:'external-embed',embedUrl:src,embedProvider:provider,embedHeight:Math.min(1200,Math.max(240,Number(section.pluginData?.height)||600))};
  }
};
