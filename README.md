# Weboiler

Kevyt Node.js-sivusto ja sisällönhallinta. Sivusto rakentuu muokattavista osioista; tietokantaa tai käännösvaihetta ei tarvita. Käyttöliittymä on suomeksi.

## Käynnistys

Tarvitset Node.js 20:n tai uudemman. Projektikansiossa:

```powershell
npm ci
Copy-Item .env.example .env
npm start
```

Jos `.env` on jo olemassa, säilytä se ja ohita kopiointi. Avaa `http://localhost:3100` ja hallinta osoitteessa `http://localhost:3100/admin`. Portin voi vaihtaa `.env`-tiedostossa.

Kirjautumistunnus ja salasana tulevat `.env`-tiedoston `ADMIN_USER`- ja `ADMIN_PASSWORD`-arvoista, kunnes vaihdat ne hallinnan asetuksissa. Ilman ympäristöasetuksia paikallisen kehitystilan aloitustunnus on `admin / admin`. Esimerkkitiedoston salasana on eri: tarkista oma asetuksesi.

## Sisällön muokkaus ja julkaisu

1. Avaa **Sivueditori**. Oikealla näkyy työversion esikatselu.
2. Muokkaa otsikoita, tekstejä, kuvia ja linkkejä. Muutokset tallentuvat automaattisesti lyhyen tauon jälkeen.
3. Lisää uusi osio yläreunan valitsimella tai hiiren oikean painikkeen valikosta. Voit siirtää, kopioida tai poistaa osioita.
4. Odota ilmoitusta **Työversio tallennettu**. Esikatselu päivittyy tallennuksen jälkeen.
5. Valitse **Julkaise muutokset**, kun sisältö on valmis. Julkinen sivu päivittyy vasta tästä.

`data/site-editor.json` on työversio ja `data/site-live.json` julkaistu versio. Julkaisu tarkistaa version ja korvaa live-tiedoston atomisesti. Jos sama sisältö on muuttunut toisessa välilehdessä, tallennus estetään ja siitä näytetään ilmoitus. Ota haluamasi paikalliset muutokset talteen ennen sivun lataamista uudelleen.

Esikatselu vaatii kirjautumisen. Se ei lähetä oikeita yhteydenottoja eikä kerrytä kävijätilastoja. Esikatselussa voit avata osion toiminnot oikealla hiiren painikkeella tai kohdistaa editorin osioon kaksoisklikkauksella.

## Osiot ja omat elementit

Valmiit osiot: hero, muotoiltu teksti, palvelukortit, kuvagalleria, kuvakaruselli, toimintakehote ja yhteydenotto.

Valitse osion kohdalla **Tallenna elementiksi**, nimeä malli ja avaa **Omat elementit**. Mallissa voi muokata sisältöä ja lisätä siitä kopioita sivulle. Mallin myöhempi muokkaus ei muuta jo sivulle lisättyjä kopioita. Myös mallit tallentuvat työversioon.

Karusellin vaihtoväli on 3–20 sekuntia. Käyttäjä voi pysäyttää esityksen ja vaihtaa kuvaa käsin. Automaattinen vaihto huomioi käyttöjärjestelmän vähennetyn liikkeen asetuksen.

## Kuvat, logot, ikonit ja teema

Kuvakentän **Valitse tai lataa kuva** avaa mediakirjaston. Media-sivulla voi ladata useita kuvia kerralla. Tuetut muodot: PNG, JPEG, WebP ja GIF; enintään 8 Mt/tiedosto ja 20 tiedostoa/lataus. SVG-latauksia ei tueta. Kirjoita kuville tarkoitusta kuvaava vaihtoehtoinen teksti.

Logo, sivuston nimi, otsikko, kuvaus, URL, navigaatio ja teema ovat **Asetukset**-sivulla. Logon voi valita samasta mediakirjastosta. Värit määritetään HEX-muodossa. Fonttiperhe voi olla esimerkiksi `Arial, sans-serif` tai `Georgia, serif`; pelkkä fontin nimen kirjoittaminen ei lataa uutta fonttia.

Ikonikentän **Selaa kaikkia ikoneita** avaa haettavan Font Awesome Free Solid -kirjaston. Hae englanninkielisellä nimellä, esimerkiksi `house` tai `phone`. Koko ja väri ovat osion tai kortin omia asetuksia. Kirjasto tarjotaan paikallisesti projektin riippuvuuksista.

## Viestit ja sähköposti

Yhteydenotot tallentuvat `data/yhteydenotot.json`-tiedostoon ja näkyvät hallinnassa. Sähköposti on erillinen ilmoitus; viesti säilyy hallinnassa, vaikka ilmoituksen lähettäminen epäonnistuisi.

Valitse asetuksista SMTP tai Resend ja täytä lähettäjä sekä vastaanottaja. SMTP tarvitsee palvelimen, portin, käyttäjän ja salasanan. Portin 465 yhteydessä käytetään tavallisesti suojatun SMTP-yhteyden valintaa; tarkista oman palveluntarjoajasi ohje. Resend tarvitsee API-avaimen ja palvelussa hyväksytyn lähettäjäosoitteen. Tyhjä salaisuus-kenttä säilyttää aiemmin tallennetun arvon.

Sähköpostiasetuksilla on oma tallennuspainike ja testiviesti. Testiviestin painike lähettää oikean sähköpostin määritettyyn vastaanottajaosoitteeseen.

Salaisuudet salataan levylle. Säilytä sama `SESSION_SECRET` uudelleenkäynnistysten ja siirtojen yli. Kehitystilassa ilman ympäristömuuttujaa avain luodaan tiedostoon `data/local-secret`; myös tämä on varmuuskopioitava. Avaimen vaihtamisen jälkeen sähköpostipalvelun salaisuudet pitää syöttää uudelleen.

## Varmuuskopiointi ja palautus

Pysäytä sovellus ja kopioi turvalliseen paikkaan koko `data`-hakemisto, `public/uploads` sekä `.env`. Näin työversio, julkaistu sivu, kuvat, viestit, kirjautumisasetukset ja sähköpostin salausavain pysyvät yhdessä. Varmuuskopiot sisältävät yksityisiä tietoja ja tunnuksia.

Palauta samat tiedostot pysäytettyyn sovellukseen. Asenna riippuvuudet `npm ci` -komennolla ja käynnistä. Käynnistäminen päättää vanhat hallintaistunnot. Jos haluat palauttaa vain sivusisällön, palauta molemmat site-tiedostot ja niiden tarvitsemat kuvat.

## Palvelinkäyttö

Suorita yksi Node-prosessi ja käytä pysyvää levyä. JSON-tallennus on tarkoitettu pienen sivuston käyttöön; usean rinnakkaisen palvelinprosessin tallennuksia ei koordinoida.

Aseta `NODE_ENV=production`, vahva hallintasalasana ja pysyvä vähintään 32-merkkinen `SESSION_SECRET`. Tarjoa sivusto HTTPS-yhteydellä käänteisen välityspalvelimen kautta. Tuotantotilan istuntoeväste on Secure. Julkisesti tarjotaan vain sovelluksen reitit, `/assets`, `/uploads` ja paikalliset ikonit, ei koko projektihakemistoa. Sovelluksen käyttäjä tarvitsee kirjoitusoikeudet `data`- ja `public/uploads`-hakemistoihin.

## AI-tekstit ja -kuvat

Hallinnan **Asetukset → AI-sisällöntuotanto** tukee OpenAI- ja Gemini-API-avaimia. Lisää haluamasi palvelun avain, tarkista mallinimet, salli generointi ja tallenna AI-asetukset. API-tilillä täytyy olla valitun mallin käyttöoikeus ja tarvittava laskutus. ChatGPT-tilaus ei korvaa API-laskutusta. Mallinimet voi vaihtaa palveluiden valikoiman muuttuessa.

Editorin tekstikenttien vieressä on **Kirjoita AI:lla**, kuvakenttien vieressä **Luo kuva AI:lla**. Kirjoita ohje, valitse palvelu ja paina Generoi. Tarkista teksti (sitä voi muokata ennen hyväksyntää) tai kuva ja paina **Käytä luonnoksessa**. Julkaistu sivusto muuttuu vasta **Julkaise muutokset** -painikkeella. Kuvagalleriaan/karuselliin lisää ensin kuvarivi ja generoi sen kuvakenttään.

Generointi lähettää kirjoittamasi ohjeen valitulle ulkoiselle palvelulle ja voi maksaa. Tekstityökalun ohjeessa on oletuksena valitun kentän nykyinen teksti. Älä lähetä salaisuuksia tai henkilötietoja. Tarkista faktojen paikkansapitävyys, kuvien soveltuvuus ja käyttöoikeudet; AI ei takaa niitä. Lisää kuvalle kuvaava vaihtoehtoinen teksti. Generoidut kuvat tallentuvat mediakirjastoon myös silloin, kun et käytä niitä luonnoksessa.

Avaimet säilyvät salattuina `data/ai-settings.json`-tiedostossa. Tyhjä avainkenttä säilyttää vanhan avaimen, erillinen Poista-valinta poistaa sen. Pidä `SESSION_SECRET` (tai kehityksen `data/local-secret`) pysyvänä ja varmuuskopioi se turvallisesti asetusten kanssa. Älä lisää niitä versionhallintaan. Asetukset eivät kuulu julkaistavaan sivustodataan. Yksi generointi kerrallaan on sallittu; automaattisia maksullisia uudelleenyrityksiä ei tehdä. Sulkeminen ei peruuta jo lähetetyn pyynnön mahdollista laskutusta.

Rajapinnat: [OpenAI Responses](https://developers.openai.com/api/docs/guides/text), [OpenAI Images](https://developers.openai.com/api/docs/guides/image-generation), [Gemini GenerateContent](https://ai.google.dev/api/generate-content). Palvelut ja käytettävissä olevat mallit voivat muuttua.

## Testien ajaminen

```powershell
npm run check
npm test
```

Syntaksitarkistus kattaa kaikki projektin JavaScript-tiedostot. HTTP-testit suoritetaan väliaikaisilla tiedostoilla ja satunnaisella paikallisportilla. Ne testaavat kirjautumisen, luonnos/live-erottelun, julkaisun, ristiriidat, CSRF-suojan, esikatselun, karusellin, elementit, kuvalatauksen, logon ja yhteydenoton. Testeistä ei lähetetä ulkoisia sähköposteja.

Käyttöliittymän eristettyä kokeilua varten `node test/preview-server.js` käynnistää testikopion porttiin 3191. Sen tunnukset ovat vain testipalvelimen lähdekoodissa. Sulje testipalvelin Ctrl+C:llä.
