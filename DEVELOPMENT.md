# Weboiler — valmistumisen tarkistus

Tavoite: kevyt, käytännöllinen Node.js-sisällönhallinta. Käyttäjä on valtuuttanut itsenäisen viimeistelyn. Julkiseen verkkoon ei ole pyydetty käyttöönottoa.

## Toteutettu ja palvelintesteillä tarkistettu

- Luonnos `data/site-editor.json`, julkaistu sisältö `data/site-live.json`.
- Atominen tiedostotallennus, versiotunniste ja 409-vastaus vanhentuneen välilehden tallennukseen/julkaisuun.
- Selain tallentaa järjestyksessä ja odottaa tallennusta ennen julkaisua tai sivun vaihtoa.
- Testit käyttävät väliaikaishakemiston sisältöä, eivät käyttäjän sivustotiedostoja.
- Kirjautumisen takana oleva esikatselu, ei seurantaa tai lomakkeen oikeaa lähetystä esikatselussa.
- Karuselliosio, väli 3–20 sekuntia, pysäytys ja käsiohjaus, reduced-motion-tuki.
- Omat elementit tallennetaan sivustomallin `elements`-listaan; mallit ja sivulle lisätyt kopiot ovat itsenäisiä.
- Oikean painikkeen valikko editorikorteissa ja esikatselussa; esikatselun kaksoisklikkaus kohdistaa osion muokkauskorttiin.
- Testit kattavat myös karusellin ja elementtimallien säilymisen tallennuksessa.

## Selaintestauksen tila

`node test/preview-server.js` käynnistää eristetyn testipalvelimen osoitteeseen http://127.0.0.1:3191. Synteettiset testitunnukset ovat testipalvelimen lähdekoodissa. Varsinaiseen palvelimeen tai käyttäjän sisältöön ei tarvitse kirjautua testejä varten.

Tarkistettu Chrome-selaimessa: kirjautuminen, dashboard, editorin lataus ja esikatselu, osiokortin kontekstivalikko, karusellin lisääminen sen kautta, kaksi kuvariviä.

Elementin tallentaminen vaihdettiin omaan dialog-lomakkeeseen. Nimeäminen, mallin muokkaaminen ja kopion lisääminen tarkistettiin selaimessa onnistuneesti.

## Valmistumisauditointi 22.9.2026

- Tarkistettu selaimessa: elementtien nimeäminen, muokkaus ja lisäys; karusellin automaattinen vaihto, pysäytys ja käsivaihto.
- Tarkistettu esikatselun kontekstivalikko, julkaisu, muotoiltu teksti ja tekstivalinnan säilyminen linkin lisäyksessä.
- Media-valitsin, logon valinta ja julkaisu sekä Font Awesome -haku/ikonivalinta tarkistettu selaimessa. Upload-HTTP-testit hyväksyvät PNG:n ja hylkäävät HTML:n, joka väittää olevansa PNG. Tämä on tiedostotyypin tunnistus, ei täydellinen dekoodaus. Selaimen tiedostonvalitsimen automaatiota rajoitti laajennuksen file-URL-lupa; tiedoston vastaanotto ja kirjastosta valinta testattu erikseen.
- Julkisen lomakkeen lähetys ja viestin ilmestyminen hallintaan tarkistettu selaimessa. SMTP/Resend-adapterit, salaus ja virheet testattu paikallisilla testivastauksilla, tunnusten vaihto HTTP-testissä. Oikeita ulkoisia sähköposteja ei lähetetty.
- Syötedatan validointi lisätty: HEX-värit, fonttiperheet, URL:t, uniikit osiotunnisteet ja listojen maksimimäärät. HTTP-testit kattavat päällekkäiset tunnisteet sekä virheelliset värit ja linkit.
- Desktop- ja mobiilinäkymät tarkistettu: 390 px mobiilissa julkinen sivu ja hallinta eivät vuoda vaakasuunnassa.
- README.md sisältää käyttö-, käynnistys-, varmuuskopiointi-, palautus-, tuotanto- ja AI-ohjeet.
- Omat elementit ovat muokattavia osiomalleja (esim. palvelukortit ja karuselli), eivät mielivaltaisen JavaScript-koodin lisäosia.
- AI: OpenAI ja Gemini, teksti- ja kuvagenerointi, salatut palvelinavaimet, vaihdettavat mallit, tuloksen hyväksyntä luonnokseen. Selaimessa testattu asetusten tallennus ja tekstin generointi paikallisella testivastauksella; julkinen sivu pysyi muuttumattomana. Molempien palveluiden teksti- ja kuvavastaukset, avainten säilyttäminen/poistaminen ja virhetilanteet testattu ilman maksullisia API-kutsuja. Tilikohtainen käyttöoikeus ja todellinen API-yhteys on vielä kokeiltava käyttäjän omilla avaimilla.

Viimeisin `npm run check`, `npm test` ja `git diff --check`: läpi. Syntaksitarkistus kattaa 22 JavaScript-tiedostoa. Testit käyttävät eristettyjä tiedostoja. Käyttäjän palvelin on käynnistettävä uudelleen uusien palvelinmuutosten lataamiseksi.

Kehitystilan salausavain säilyy nyt `data/local-secret`-tiedostossa, jos SESSION_SECRET puuttuu. Tuotanto vaatii pysyvän ympäristömuuttujan. Tätä avainta tai .env-sisältöä ei tule tulostaa työkalulokeihin.
