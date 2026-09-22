'use strict';
const dictionaries={
  fi:{menu:'Valikko',admin:'Hallinta',name:'Nimi',email:'Sähköposti',phone:'Puhelin',message:'Viesti',send:'Lähetä',previous:'Edellinen kuva',next:'Seuraava kuva',pause:'Pysäytä',more:'Lue lisää'},
  en:{menu:'Menu',admin:'Admin',name:'Name',email:'Email',phone:'Phone',message:'Message',send:'Send',previous:'Previous image',next:'Next image',pause:'Pause',more:'Read more'},
  sv:{menu:'Meny',admin:'Administration',name:'Namn',email:'E-post',phone:'Telefon',message:'Meddelande',send:'Skicka',previous:'Föregående bild',next:'Nästa bild',pause:'Pausa',more:'Läs mer'}
};
const extra={
  fi:{resume:'Jatka',carousel:'Kuvakaruselli',externalNotice:'Ulkoinen sisältö: lataaminen yhdistää palveluun, joka voi käyttää evästeitä.',loadExternal:'Lataa ulkoinen sisältö',openExternal:'Avaa palvelussa',embedPreview:'Esikatselu: ulkoista palvelua ei ladata.',embedFallback:'Jos upotus ei näy, avaa palvelu yllä olevasta linkistä.'},
  en:{resume:'Resume',carousel:'Image carousel',externalNotice:'External content: loading connects to a service that may use cookies.',loadExternal:'Load external content',openExternal:'Open in service',embedPreview:'Preview: external content is not loaded.',embedFallback:'If the embed does not appear, open the service using the link above.'},
  sv:{resume:'Fortsätt',carousel:'Bildkarusell',externalNotice:'Externt innehåll: laddning ansluter till en tjänst som kan använda kakor.',loadExternal:'Ladda externt innehåll',openExternal:'Öppna i tjänsten',embedPreview:'Förhandsvisning: externt innehåll laddas inte.',embedFallback:'Om inbäddningen inte visas, öppna tjänsten via länken ovan.'}
};
module.exports=locale=>{const key=String(locale||'fi').split('-')[0],language=dictionaries[key]?key:'en';return {...dictionaries[language],...extra[language]};};
