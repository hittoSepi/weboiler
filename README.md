# Weboiler

Kevyt Node.js-sivusto ja sisällönhallinta. Sivusto rakentuu muokattavista osioista; tietokantaa tai käännösvaihetta ei tarvita. Käyttöliittymä on suomeksi.

## Hinnasto, FAQ, asiakaspalautteet ja tiimi

Ota **Sisältöosiot** käyttöön Lisäosat-sivulla. Lisää siellä hinnastopaketit, kysymys–vastausparit, asiakaspalautteet ja tiimin jäsenet. Sivueditorissa lisää vastaava osiotyyppi ja määritä otsikko. Sisältöryhmällä voit rajata esimerkiksi eri kielten tai palvelujen kortit eri osioihin: sama ryhmän nimi kohteeseen ja osion ryhmäkenttään. Tyhjä osion ryhmä näyttää kaikki kyseisen tyypin kohteet.

Hinnastossa hinta on vapaamuotoinen teksti (esimerkiksi `99 € / kk`), mukana ovat kuvaus/ehdot ja valinnainen toimintapainike. FAQ:n kysymykset avautuvat ilman JavaScriptiä. Asiakaspalautteissa ovat lainaus, nimi, lisätieto ja valinnainen kuva. Tiimissä ovat nimi, rooli, esittely, sähköposti, puhelin ja kuva. Käytä vain palautteita ja henkilökuvia, joiden julkaisemiseen sinulla on lupa.

Kuvien valinta, lataus, rajauspiste ja AI-kuvat käyttävät olemassa olevaa mediakirjastoa. Lisäosakohteita voi järjestellä nuolilla. Sisältö ja järjestys tallentuvat luonnokseen ja tulevat julkisiksi vasta julkaisemalla. Poiskytkentä piilottaa osiot, mutta säilyttää tiedot. Esikatseluun ei lisätä mallipalautteita tai keksittyjä henkilöitä automaattisesti.

## Ulkoiset upotukset

Ota Lisäosat-sivulla **Ulkoiset upotukset** käyttöön. Sivueditoriin tulee kolme osiota: Karttaupotus (Google Maps), Ajanvarausupotus (Calendly) ja Uutiskirjeupotus (Buttondown). Anna osion kenttään palvelun osoite, ei HTML-koodia. Korkeus on säädettävissä 240–1200 pikseliin; ajanvaraukselle esimerkiksi 700 px.

- Google Maps: valitse Jaa → Upota kartta ja kopioi iframe-koodista vain `src`-osoite, joka alkaa `https://www.google.com/maps/embed`.
- Calendly: oma `https://calendly.com/tunnus/tapaaminen`-ajanvarausosoite.
- Buttondown: `https://buttondown.com/oma-tunnus?as_embed=true`.

Julkaistulla sivulla näkyy ensin latauspainike ja linkki palveluun. Vasta painallus luo ulkoisen iframe-upotuksen; esikatselu ei lataa sitä. Palvelu voi käyttää omia evästeitään ja käsitellä lomakkeelle annettuja tietoja. Upotus ei siirrä ajanvarauksia tai tilaajia Weboilerin yhteydenottoihin. Käytä oikeaa palvelutiliä ja testaa julkaistulta verkkotunnukselta. Selain- ja palvelukohtaiset rajoitukset voivat estää upotuksen; suora linkki säilyy vaihtoehtona. Muiden palvelujen lisääminen edellyttää koodissa osoitevalidoinnin ja CSP-sallitun lähteen laajentamista.

Palvelujen ohjeet: [Google Maps](https://support.google.com/maps/answer/11471036), [Calendlyn iframe](https://calendly.com/help/how-to-embed-calendly-with-an-iframe), [Buttondownin iframe](https://docs.buttondown.com/building-your-subscriber-base). Toteutus ei tarvitse palvelujen JavaScript-widgettejä tai API-avaimia.

## Kieliversiot

Etusivun kieli asetetaan sivueditorin yläreunassa (oletus `fi`). Luo käännös tavallisena alasivuna, esimerkiksi osoitteeseen `en`, valitse kieleksi `en` ja anna käännösryhmäksi `home`. Etusivu kuuluu aina ryhmään `home`. Muut käännösparit yhdistetään samalla vapaavalintaisella ryhmätunnisteella, esimerkiksi `services`. Samassa ryhmässä voi olla yksi sivu per kieli. Sisältö kirjoitetaan erikseen; tämä ei tee automaattisia käännöksiä.

Kielivalikko näyttää nykyisen sivun käännökset. Julkisen sivun HTML-kieli ja hakukoneiden hreflang-linkit muodostuvat automaattisesti (absoluuttiset linkit vaativat sivuston URL-asetuksen). Esikatselun kielilinkit pysyvät suojatussa esikatselussa. Etusivulinkki sekä yhteisen valikon sivulinkit ohjataan saman kielen vastineeseen, jos sellainen on olemassa; muuten alkuperäinen linkki säilyy.

Painikkeella **Omat valikkotekstit tälle sivulle** voit muokata sivun valikkoa erikseen, esimerkiksi vaihtaa ankkurilinkin tekstiksi Contact us ja osoitteeksi `#contact`. Linkkejä voi lisätä, poistaa ja siirtää ylös. **Palauta yhteinen valikko** palauttaa automaattisesti muodostuvan valikon. Sivulla voi olla myös oma alatunniste. Kaikki kieliversiot julkaistaan yhdessä.

Tuetut kielitunnisteet ovat kaksikirjaimisia, haluttaessa alueella, kuten `fi`, `en`, `sv` tai `en-US`. Sisäänrakennetun oletuslomakkeen ja päävalikkopainikkeen tekstit ovat suomeksi, englanniksi ja ruotsiksi; muille kielille käytetään englantia. Omat lomakekentät nimetään itse. Hallinta ja palvelimen validointivirheet ovat suomeksi. Kieliryhmät koskevat tavallisia sivuja; lisäosien artikkeleille ja referensseille ei vielä ole käännösparieditoria.

## Muokattavat yhteydenottolomakkeet

Valitse sivueditorin Yhteydenotto-osiosta **Muokkaa lomakekenttiä**. Voit lisätä, nimetä, poistaa ja järjestää 1–20 kenttää. Tyypit: teksti, pitkä teksti, sähköposti, puhelin, valintalista ja valintaruutu. Valitse kentän pakollisuus; anna valintalistan vaihtoehdot yksi per rivi. Kenttätunnisteen on oltava yksilöllinen (pienet kirjaimet, numerot, yhdysmerkit ja alaviivat). Tunniste `name` toimii viestin lähettäjän nimenä, ensimmäinen sähköpostikenttä vastausosoitteena ja ensimmäinen puhelinkenttä puhelinnumerona.

Lomakkeen vastaanottaja ohittaa sähköpostiasetusten oletusvastaanottajan. Tyhjä arvo käyttää oletusta. Lähetys edellyttää toimivaa SMTP- tai Resend-asetusta; viesti tallennetaan hallinnan Yhteydenotot-osioon ennen sähköpostiyritystä myös lähetyksen epäonnistuessa. Kaikki vastaukset näkyvät viestin tekstissä kenttänimineen. Vastaanottajaa ei upoteta julkiseen lomakkeeseen, eikä kävijän lähettämä vastaanottaja-arvo vaikuta toimitukseen.

Muista **Julkaise muutokset**. Palvelin hyväksyy vastaukset vain julkaistun lomakkeen kenttien mukaan. Esikatselu ei lähetä viestejä. Vanhat oletuslomakkeet säilyvät ennallaan, kunnes otat kenttien muokkauksen käyttöön. Mukauttaminen aloittaa nimi-, sähköposti- ja viestikentillä; lisää puhelin tarvittaessa erikseen.

## Ajankohtaista-lisäosa

Ota **Ajankohtaista** käyttöön hallinnan Lisäosat-sivulla. Lisää artikkeli, otsikko, osoitetunniste, kategoria, ingressi, teksti ja kuva. Lisää sivueditorissa **Ajankohtaista / artikkelit** -osio; voit rajata sen yhteen kategoriaan (täsmällinen nimi). Artikkelit saavat omat `/ajankohtaista/osoitetunniste`-sivut.

Artikkelin **Luonnos**-tila pitää sen poissa julkiselta sivulta myös sivuston julkaisun jälkeen. **Julkaistava** sallii näyttämisen: tyhjä ajankohta tarkoittaa heti, tuleva aika ajastaa näkyviin tulon. Julkaise myös sivuston muutokset; editoriin tallentaminen ei siirrä artikkelia liveen. Ajankohta syötetään selaimesi aikavyöhykkeessä ja tallennetaan UTC-aikana. Palvelimen kellon pitää olla oikeassa. Näkyvyys tarkistetaan jokaisella sivupyynnöllä ilman tausta-ajastinta; jo avattu sivu päivittyy uudelleenlataamalla. Ulkoisen HTML-välimuistin käyttö voi viivästyttää näkyvyyttä.

Kirjautuneen esikatselu näyttää myös luonnokset ja tulevat artikkelit. Julkisella sivulla sekä artikkelilista että suorat artikkeliosoitteet noudattavat näkyvyyttä. Julkaisuajankohdan sisältävät artikkelit järjestetään uusimmasta vanhimpaan; ilman päivämäärää olevat näytetään niiden jälkeen tallennusjärjestyksessä.

## Sivuston vienti ja tuonti

Hallinnan **Vienti ja tuonti** (`/admin/siirto`) lataa työversion tai julkaistun sivuston yhteen JSON-siirtopakettiin. Paketti sisältää sivut, teeman, elementit, lisäosien sisällön ja käytetyt paikalliset PNG/JPEG/WebP/GIF-kuvat. Ulkoiset kuvat säilyvät linkkeinä. Tunnukset, API-avaimet, sähköpostiasetukset, yhteydenotot ja analytiikka eivät kuulu pakettiin. Sisältöön itse kirjoitettu teksti viedään sellaisenaan: tarkista sisältö ennen paketin jakamista.

Valitse paketti, paina **Tarkista paketti** ja vahvista erikseen työversion korvaaminen. Tuonti ei julkaise. Nykyinen työversio tallennetaan julkaisuhistoriaan ennen korvaamista. Kuvat saavat uudet tiedostonimet; vanhoja kuvia ei poisteta, jotta historiapalautus säilyy toimivana. Tarkista tuonnin jälkeen sivuston URL, linkit ja sisältö editorissa ennen julkaisua.

Rajat: 200 kuvaa, yhteensä 32 Mt kuvia, yksittäinen kuva 16 Mt, sivustodata 2 Mt ja pakettitiedosto 48 Mt. Puuttuva paikallinen kuva estää viennin. Paketti ei sisällä ajettavaa lisäosakoodia: sen käyttämät lisäosat on asennettava kohdeprojektiin ensin. Tämä on sisällön siirtotyökalu, ei koko palvelimen varmuuskopio.

## Käynnistys

Tarvitset Node.js 20.9:n tai uudemman. Projektikansiossa:

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

## Kumoa, tee uudelleen ja osioiden järjestys

Hallinnan **Kumoa** ja **Tee uudelleen** palauttavat tämän näkymän sisältömuutoksia. Muutokset tallennetaan normaaliin tapaan työversioon; kumoaminen ei julkaise. Peräkkäinen kirjoittaminen samaan kenttään ryhmitellään yhdeksi muutokseksi. Muistissa säilytetään enintään 40 tilaa, suuren sisällön kohdalla vähemmän. Sivueditorin sivuvalinnan vaihtaminen säilyttää historian, mutta sivun uudelleenlataus tai siirtyminen toiseen hallintanäkymään aloittaa uuden historian. Julkaisujen pitkäaikaiseen palauttamiseen käytä Julkaisuhistoriaa.

Kenttien ulkopuolella Ctrl/Cmd+Z kumoaa; Ctrl/Cmd+Shift+Z tai Ctrl+Y tekee uudelleen. Tekstikentän sisällä näppäinyhdistelmät säilyttävät selaimen oman tekstikumoamisen. API-avainten, sähköpostiasetusten ja tunnusten muutokset eivät kuulu sisältöhistoriaan.

Avaa **Osioiden järjestys** ja raahaa osio uuteen kohtaan. Voit myös käyttää osiokortin **Raahaa**-kahvaa tai vanhoja nuolipainikkeita. Kohdistetulla raahauskahvalla Alt+ylös/alas siirtää osiota näppäimistöllä. Siirron voi kumota. Mobiilissa nuolipainikkeet ovat aina käytettävissä.

## Useita sivuja

Sivueditorin **Muokattava sivu** -valikosta vaihdat etusivun ja alasivujen välillä. **Lisää sivu** pyytää nimen ja osoitteen, esimerkiksi `palvelut` → `/palvelut`. Lisää sivulle osiot kuten etusivullekin. Sivunvaihto odottaa keskeneräisen tallennuksen valmistumista. Sivusto voi sisältää etusivun ja enintään 50 alasivua; vanha yksisivuinen sisältö säilyy etusivuna ilman erillistä migraatiota.

Alasivun nimen, selainotsikon ja kuvauksen voi muuttaa editorissa. **Lisää valikkoon** tekee sivulle linkin yhteiseen navigaatioon. Asetuksissa navigaation kohde voi olla `/palvelut`, `/` tai etusivun osiotunniste. Pelkkä osiotunniste johtaa etusivun osioon, `#tunniste` nykyisen sivun osioon. Sivujen järjestyspainikkeet muuttavat editorin sivulistan järjestystä, eivät navigaatiota.

**Vaihda osoite** päivittää myös kyseisen sivun suorat navigaatiolinkit. Sisältöteksteihin lisätyt linkit on päivitettävä itse; vanhasta osoitteesta ei tehdä automaattista uudelleenohjausta. **Poista sivu** poistaa sivun ja sen suorat valikkolinkit työversiosta. Julkaistu sivu muuttuu vasta julkaisussa. Kaikki sivut ja yhteinen teema julkaistaan yhtenä kokonaisuutena, ja historiapalautus palauttaa koko sivuston.

Omat elementit lisätään viimeksi editorissa valitulle sivulle. Esikatselu, kontekstivalikko, kuvanvalinta ja AI-työkalut käyttävät valittua sivua. Sivujen HTML-otsikko, kuvaus ja jakokuva ovat sivukohtaiset.

## Hakukone- ja somejakotiedot

**Asetukset**-sivulla määritetään etusivun selainotsikko ja kuvaus sekä sivuston oletusjakokuva ja sen vaihtoehtoinen teksti. Valinnainen haku- ja jako-otsikko ohittaa selainotsikon; tyhjänä käytetään aiempaa otsikkoa. **Sivueditorissa** alasivulla on oma nimi, valinnainen selain-/jako-otsikko, kuvaus ja jakokuva. Sivun nimi voi siten olla lyhyt navigaatiossa, vaikka hakutuloksia varten käytetään kuvaavampaa otsikkoa.

Tyhjä alasivun jakokuva käyttää sivuston oletusta. Referenssisivu käyttää projektin kuvaa ja kuvausta. Jakokuvan voi valita mediakirjastosta tai generoida AI:lla. Näitä tietoja käytetään HTML-otsikossa, kuvauksessa sekä [Open Graph](https://ogp.me/)- ja Twitter Card -metatiedoissa. Hakukoneet ja jakopalvelut päättävät lopullisen esitystavan itse.

Aseta **Sivuston URL** oikeaksi julkiseksi http(s)-osoitteeksi ennen julkaisua: sitä käytetään canonical-osoitteeseen ja paikallisen jakokuvan absoluuttiseen osoitteeseen. Ilman kelvollista sivuston URL:ia paikallista jakokuvaa ei lisätä metatietoihin. Pelkkä localhost-esikatselu ei ole ulkoisten jakopalvelujen saatavilla. Muutokset julkaistaan normaalisti; kirjautumisen takainen luonnos-/historiaesikatselu sisältää lisäksi noindex-ohjeen.

## Julkaisuhistoria ja palauttaminen

Hallinnan **Julkaisuhistoria** näyttää julkaisujen yhteydessä tallennetut versiot. Ensimmäinen uusi julkaisu ottaa talteen myös sitä edeltävän live-version. Aikaisempia, ennen ominaisuuden käyttöönottoa korvattuja versioita ei voi palauttaa jälkikäteen.

Valitse **Esikatsele** ja tarkista sisältö. **Palauta työversioon** pyytää vahvistuksen, ottaa nykyisestä työversiosta palautuspisteen ja korvaa työversion valitulla historiaversiolla. Julkinen sivu ei muutu. Avaa editori, tarkista palautettu sisältö ja julkaise halutessasi. Väärän palautuksen voi perua palauttamalla historian kohdan **Työversio ennen palautusta**.

Historia tallentuu `data/history`-hakemistoon. Se sisältää sivustodatan ja teeman, mutta ei kopioita kuvista, yhteydenotoista tai palveluasetuksista. Säilytä siis myös mediatiedostot ja normaali varmuuskopio. Historiaversioita ei poisteta automaattisesti.

## Osiot ja omat elementit

Valmiit osiot: hero, muotoiltu teksti, palvelukortit, kuvagalleria, kuvakaruselli, toimintakehote ja yhteydenotto.

Valitse osion kohdalla **Tallenna elementiksi**, nimeä malli ja avaa **Omat elementit**. Mallissa voi muokata sisältöä ja lisätä siitä kopioita sivulle. Mallin myöhempi muokkaus ei muuta jo sivulle lisättyjä kopioita. Myös mallit tallentuvat työversioon.

Karusellin vaihtoväli on 3–20 sekuntia. Käyttäjä voi pysäyttää esityksen ja vaihtaa kuvaa käsin. Automaattinen vaihto huomioi käyttöjärjestelmän vähennetyn liikkeen asetuksen.

## Lisäosat ja referenssit

**Lisäosat**-sivulla voit ottaa asennetun moduulin käyttöön. Referenssit-moduulissa lisää projektit, yksilölliset osoitetunnisteet, kuvaukset ja kuvat. Projektin osoite on `/referenssit/osoitetunniste`. Sivueditorissa lisää **Referenssikortit**-osio haluamallesi sivulle; halutessasi rajaa kortit kategoriaan. Kortit linkittävät projektien esittelysivuille.

Lisäosan käyttöönotto, poistaminen käytöstä ja sisältömuutokset tallentuvat luonnokseen. Ne näkyvät julkisesti vasta julkaisun jälkeen. Poistaminen käytöstä piilottaa projektisivut ja korttiosiot mutta säilyttää sisällön. Historia palauttaa myös lisäosien datan. Projektit voi esikatsella hallinnasta ilman julkaisemista.

Koodilisäosat asennetaan luotetusta lähteestä projektin kautta, ei lataamalla ZIP-tiedostoja hallintaan. Kehittäjän ohje: [plugins/README.md](plugins/README.md).

## Kuvat, logot, ikonit ja teema

Kuvakentän **Valitse tai lataa kuva** avaa mediakirjaston. Media-sivulla voi ladata useita kuvia kerralla. Tuetut muodot: PNG, JPEG, WebP ja GIF; enintään 8 Mt/tiedosto ja 20 tiedostoa/lataus. SVG-latauksia ei tueta. Kirjoita kuville tarkoitusta kuvaava vaihtoehtoinen teksti.

Logo, sivuston nimi, otsikko, kuvaus, URL, navigaatio ja teema ovat **Asetukset**-sivulla. Logon voi valita samasta mediakirjastosta. Värit määritetään HEX-muodossa. Fonttiperhe voi olla esimerkiksi `Arial, sans-serif` tai `Georgia, serif`; pelkkä fontin nimen kirjoittaminen ei lataa uutta fonttia.

Ikonikentän **Selaa kaikkia ikoneita** avaa haettavan Font Awesome Free Solid -kirjaston. Hae englanninkielisellä nimellä, esimerkiksi `house` tai `phone`. Koko ja väri ovat osion tai kortin omia asetuksia. Kirjasto tarjotaan paikallisesti projektin riippuvuuksista.

## Kuvaversiot ja rajauspiste

Paikallisista PNG-, JPEG- ja WebP-kuvista tarjotaan tarvittaessa pakattuja WebP-versioita (320, 640, 960, 1280 ja 1920 px). Selain valitsee sisältökuvalle sopivan koon; herossa pienillä näytöillä käytetään 640 px versiota. Pieniä kuvia ei suurenneta. Alkuperäinen tiedosto säilyy muuttumattomana ja GIF-kuvat säilyvät alkuperäisinä animaatioiden säilyttämiseksi. Animoitujen WebP-kuvien optimoitu versio on staattinen; käytä GIF-muotoa, jos animaation pitää säilyä.

Kuvaversiot luodaan ensimmäisellä käyttökerralla ja tallennetaan `public/uploads/.variants`-välimuistiin. Välimuistin voi jättää varmuuskopiosta pois; versiot luodaan uudelleen alkuperäisistä. Ulkoisten osoitteiden kuvia ei haeta palvelimelle eikä optimoida. Kuvatiedoston enimmäiskoko optimoinnissa on 16 Mt ja pikselimäärä 40 miljoonaa. Kuvien käsittely käyttää [Sharpia](https://sharp.pixelplumbing.com/api-resize/).

Kuvakentän **Kuvan rajauspiste** avaa valinnan: klikkaa kuvan tärkeintä kohtaa tai syötä sijainti prosentteina. Tarkista esimerkkirajaus ja valitse **Käytä rajauspistettä**. Asetus tallentuu luonnokseen kyseiseen kuvapaikkaan, ei alkuperäistiedostoon. Se toimii heroissa, korteissa, gallerioissa, karuselleissa ja referensseissä. Varsinainen rajaus riippuu kuvapaikan kuvasuhteesta.

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
# Blogin ja referenssien kieliversiot

Lisäosien artikkeleilla ja projekteilla on **Kieli** ja **Käännösryhmä**. Luo jokaiselle käännökselle oma kohde ja yksilöllinen osoitetunniste. Anna saman sisällön kieliversioille sama käännösryhmä, esimerkiksi `yritysuutinen`, sekä eri kielet, esimerkiksi `fi` ja `en`. Tyhjä kieli saa tallennuksessa sivuston oletuskielen; tyhjä ryhmä muodostetaan kohteen tunnisteesta.

Listaosiot näyttävät sivun kielen kohteet. Kohdesivujen kielivalikko ja hakukoneiden hreflang-linkit yhdistävät käännökset. Luonnoksia ja tulevaisuuteen ajastettuja artikkeleita ei linkitetä julkiselta sivulta. Kirjautuneen esikatselussa myös niiden käännökset ovat käytettävissä. Saman kielen home-ryhmän sivulta käytetään valikkoa ja alatunnistetta, jos sellainen on määritelty.
