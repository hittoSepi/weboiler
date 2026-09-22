# AI-pohjat

## Koko sivuston velho

Dashboardissa ja sivueditorissa **Luo sivusto AI:lla** avaa velhon:

1. Kuvaile yritys, kohderyhmä, sisältö, halutut sivut ja tyyli. Vain kuvaus lähetetään palvelulle.
   **Paranna kuvausta** täydentää lyhyen tekstin suunnitteluohjeeksi valitulla AI-palvelulla. Tämä on erillinen mahdollisesti maksullinen tekstipyyntö, ei sivuston generointi. Tarkista ja muokkaa ehdotus, sitten valitse **Käytä kuvausta** tai **Hylkää ehdotus**. Alkuperäinen teksti säilyy hyväksymiseen asti. **Palauta edellinen kuvaus** peruu hyväksymisen, jos et ole sen jälkeen muokannut tekstiä. AI:ta ohjeistetaan säilyttämään annetut faktat ja erottamaan suunnitteluehdotukset niistä; tarkista silti lisäykset itse.
2. Paina **Suunnittele sivusto**. Tarkista ja muokkaa sivujen otsikoita, elementtien ja osioiden ohjeita sekä visuaalista tyyliä. Hyväksy suunnitelma erikseen. Rakentaminen luo ensin teeman, sitten elementit yksitellen ja sen jälkeen osiot yksitellen. Sivut ja valikko kootaan lopuksi ohjelmallisesti. Edistyminen näkyy vaiheina; jokainen vaihe on erillinen AI-kutsu lukuun ottamatta lopun kokoamista.
3. Tarkista etusivu ja alasivut esikatseluvalitsimella. Ehdotus sisältää teeman, valikon, sivut ja tarvittavat muokattavat elementti- ja osiopohjat. Rajat: etusivu + 5 alasivua, enintään 8 osiota sivulla ja 12 kuvapaikkaa.
3. Kuvat ovat oletuksena [placehold.co](https://placehold.co/)-paikkakuvia. Halutessasi muokkaa kuvan kuvausta ja paina kyseisen kuvan **Generoi kuva**. Jokainen painallus on erillinen mahdollisesti maksullinen kuvakutsu nykyisen palvelun kuvamallilla. Yhteisen pohjan kuva jaetaan sen käyttökohteisiin. Generoidut kuvat jäävät mediakirjastoon myös silloin, kun ehdotus hylätään. Paikkakuvat ladataan ulkoisesta palvelusta myös julkisella sivulla.
4. Vahvista nykyisen luonnoksen korvaaminen. Palvelin tallentaa vanhan luonnoksen historiaan (ennen tuontia / before-import) ja vasta sitten vaihtaa uuden. Domain, logo, lisäosadata, hallintatunnukset ja sähköposti-/AI-asetukset säilyvät. Vanha sivurakenne ja pohjat korvataan, niitä ei yhdistetä automaattisesti.

Julkaise erikseen tarkistuksen jälkeen. AI voi tehdä virheitä: tarkista väitteet, yhteystiedot, linkit, kuvat ja mobiilinäkymä. AI-kuvia ei pidä esittää oikeina referensseinä tai henkilöstökuvina. Kaikkea voi muokata tavallisilla editoreilla. Plugin-koodia ei generoida.

**Tallennetut AI-työt** -listasta voi jatkaa keskeytynyttä työtä tai avata valmiin ehdotuksen. Sulkeminen tai pysäyttäminen lopettaa etenemisen nykyisen pyynnön valmistuttua. Onnistuneet vaiheet tallentuvat `data/ai-workflows/`-hakemistoon (editoritiedoston viereen), eivät sivuston luonnokseen. Tiedot säilyvät palvelimen uudelleenkäynnistyksessä. Epäonnistuneen vaiheen voi uusia painikkeella; aiempia onnistuneita vaiheita ei tehdä uudelleen. Maksullisia epäonnistuneita kutsuja ei toisteta automaattisesti. Luonnoksen muuttuminen toisessa ikkunassa estää vanhentuneen työn jatkamisen tai käyttöönoton.

Tallennetut työt sisältävät kuvauksen, suunnitelman, välitulokset ja vaiheiden yrityshistorian. Ne ovat vain hallinnan käytössä. Enintään 50 työtä säilytetään; vanhoja JSON-työtiedostoja voi poistaa palvelimelta. Kaikki kirjautuneet ylläpitäjät näkevät samat työt. Valmis esikatselu avataan uudelleen listasta, jos sen istuntokohtainen kuvankäsittely-/hyväksyntävaraus vanhenee (30 min).

Vaiheen AI-lokiin tallentuu `generationId` ja `stage`; myös kuvakutsut yhdistetään samaan työhön. Tämä valmistaa myöhempää kustannusarviota, mutta eurolaskuria ei vielä ole. Lokien 100 kutsun säilytysraja koskee edelleen kaikkia kutsuja yhteensä.

## Teeman generointi

Teema-näkymän **Luo tai muokkaa teemaa AI:lla** ehdottaa värit, järjestelmäfontit, sisältöleveyden ja kulmien pyöristyksen kuvauksesi perusteella. Tarkista oman etusivun esikatselu ja hyväksy luonnokseen. Sulkeminen hylkää ehdotuksen; julkaisu on erillinen. Sisällöt, osiorakenne ja osioiden omat tyylit eivät muutu. Palvelulle lähetetään vain kuvaus ja nykyiset teema-arvot. Voit jatkaa hienosäätöä tavallisissa teemakentissä. Uusi generointi perustuu nykyiseen luonnokseen, ei aiempaan hyväksymättömään ehdotukseen.

## Elementit ja osiot

Omat elementit- ja Omat osiot -näkymissä on **Luo pohja AI:lla** ja **Muokkaa pohjaa AI:lla**. Ota ensin AI käyttöön asetuksissa ja määritä OpenAI- tai Gemini-avain sekä tekstimalli.

1. Kuvaile haluttu rakenne, värit ja sisältökentät.
2. Generoi ehdotus. Tämä voi olla maksullinen API-kutsu.
3. Tarkista esikatselu. Sulkeminen hylkää ehdotuksen.
4. Hyväksy luonnokseen. Pohjaa voi tämän jälkeen muokata tavallisilla editorin työkaluilla.
5. Valitse osiopohja sivueditorissa ja täytä sisältö. Julkaise erikseen.

Muokkaus kohdistuu valittuun pohjaan. Se vaikuttaa kaikkiin sitä käyttäviin osioihin julkaisun jälkeen. AI-muokkauksen täytyy säilyttää olemassa olevat solmut ja niiden sisältösidokset. Kenttien poistaminen tehdään tarvittaessa käsin. Uusi generointi perustuu tallennettuun pohjaan, ei edelliseen hyväksymättömään ehdotukseen.

Palvelulle lähetetään kuvaus, valittu pohja oletussisältöineen ja olemassa olevien elementtien nimet/tunnisteet. Sivuston muita sisältöjä, yhteydenottoja tai palvelinasetuksia ei lähetetä. Älä kirjoita salaisuuksia kuvaukseen tai pohjan oletussisältöön. Generointi käyttää nykyistä tekstimallia, ei kuvamallia; kuvat valitaan myöhemmin mediakirjastosta.

Palvelin tarkistaa JSON-rakenteen, sallitut elementtityypit, kokorajat, viittaukset ja syklit. Esikatselu on skriptittömässä sandbox-kehyksessä. Generointi ei kirjoita luonnos- tai live-tiedostoa. Luonnoksen muuttuminen kesken pyynnön estää vanhentuneen tuloksen käyttämisen. Pluginien koodigenerointi tai uusien plugin-solmujen luonti ei kuulu tähän versioon.

OpenAI käyttää Responses API:n JSON-tilaa ja paikallista rakennevalidointia ([virallinen ohje](https://developers.openai.com/api/docs/guides/structured-outputs)). Gemini käyttää JSON-vastaustilaa ilman rekursiivista API-skeemaa: syvä sivurakenne tarkistetaan paikallisesti. Näin providerin skeemarajoitukset eivät estä koko sivuston pyyntöä. Virheellinen tai katkennut vastaus hylätään. Maksullista kutsua ei toisteta automaattisesti.

HTTP-virheiden lokissa on myös `providerError`: palvelun viesti, virhekoodi ja mahdollinen virheellinen parametri. Tunnettu API-avain ja avainmuotoiset merkkijonot peitetään ennen tallennusta. Virheen lisätietorakenteita tai otsakkeita ei tallenneta. HTTP 400 ilmoitetaan pyyntövirheenä, ei automaattisesti avain- tai laskutusongelmana.

Koko sivuston vastaukselle varataan enintään 24 000 tokenia ja viiden minuutin aikaraja (muille rakenteisille pyynnöille 12 000 tokenia ja kolme minuuttia). Pidempi vastaus voi maksaa enemmän. Gemini 2.5 Flash -sarjan sivustopyyntöjen ajattelubudjetti on 1024 tokenia. Aikakatkaisu ja vastausrajan täyttyminen ilmoitetaan erillisinä virheinä. Mallia ei vaihdeta automaattisesti.

### AI-kutsuloki

Kutsut tallentuvat palvelimella AI-asetustiedoston viereiseen `ai-logs`-hakemistoon (oletus `data/ai-logs`). Yksi JSON-tiedosto per pyyntö: ohje, palvelu, malli, kesto, HTTP-tila, lopetussyy, saatavilla olevat tokenmäärät sekä tekstivastaus (enintään 200 000 merkkiä). Kuvasta tallennetaan vain paikallinen tiedostopolku, ei base64-dataa. API-avaimia tai HTTP-otsakkeita ei tallenneta. Lokissa completed tarkoittaa palvelun vastauksen valmistumista, ei sitä että sivustoehdotus olisi läpäissyt validoinnin tai hyväksytty. Myös virheelliseksi osoittautuva JSON-tekstivastaus säilyy vianmääritykseen.

Hakemisto ei ole julkisesti jaettu. Enintään 100 viimeisintä lokia säilytetään; vanhimmat poistetaan uusien kutsujen yhteydessä. Lokit sisältävät kuvauksiin kirjoitetut tiedot, joten suojaa myös palvelimen varmuuskopiot. Lokit voi poistaa käsin. Lokituksen epäonnistuminen ei estä generointia vaan tuottaa palvelimen konsoliin varoituksen. Keskeytynyt palvelin voi jättää lokin running-tilaan.

### Esikatselusta valitun osion AI-muokkaus

Sivueditorin esikatselun yläpuolella on **Valitse osio AI-muokkaukseen**. Valintatilassa klikkaa osiota tai siirry siihen näppäimistöllä ja paina Enter. Kerro muutos, generoi ehdotus ja hyväksy se työversioon. Sulkeminen hylkää ehdotuksen. Julkaisu on edelleen erillinen; hyväksytyn muutoksen voi kumota editorin Kumoa-toiminnolla.

Hero-, teksti-, CTA- ja yhteydenotto-osioissa muokataan tekstejä. Linkkikohteet, kuvat ja lomakeasetukset säilyvät. Omassa osiossa myös asettelua voi muuttaa: yhteisestä pohjasta ja sen elementeistä tehdään itsenäinen osiopohja, jossa nykyiset sisältöylikirjoitukset ovat mukana. Muut käyttökohteet eivät muutu. Uusi pohja kuluttaa yhden paikan 40 osiopohjan rajasta; vanhaa pohjaa ei poisteta automaattisesti. Plugin-osioita ja plugin-solmuja sisältäviä omia osioita ei tueta tässä versiossa.

`POST /api/admin/ai/section` vaatii kirjautumisen, CSRF-tunnisteen ja nykyisen luonnosversion. Se palauttaa tarkistetun ehdotuksen eikä tallenna mitään. Selain tarkistaa myös paikalliset muutokset ja valitun sivun ennen hyväksyntää. Tallennus käyttää tavallista versiontarkistettua luonnostallennusta. AI:lle lähetetään vain valitun osion muokattavat tiedot, omasta osiosta lisäksi avattu rakenne ja teema, ei muiden sivujen sisältöjä tai lomakkeen vastaanottaja-asetuksia. AI-kutsu kirjautuu normaaliin kutsulokiin.

### Tuettujen tyyppien ohje

`lib/ai-capabilities.js` jakaa saman tyyppiluettelon velhon ohjeille ja validoinnille. Elementtityypit johdetaan layout-editorin rekisteristä, josta velholle rajataan pois HTML ja plugin-solmut. Valmiit velhon osiot ovat hero, text, cta ja contact; custom kokoaa sallittuja elementtejä. Käsieditorin muut osiot erotetaan velhon tuesta. Käytössä olevista lisäosista lähetetään vain rekisterin nimet ja osiotyypit, ei asetuksia tai sisältöä; niiden automaattista generointia ei luvata.

Jokainen vaihe saa kyvykkyysohjeen: käytä valmista osiota, kokoa tarvittaessa peruselementeistä, ilmoita puuttuva toiminnallisuus. Suunnitelman `unsupported`-lista näkyy ennen hyväksymistä. Hyväksyntä käynnistää tuettujen osien rakentamisen, ei listattujen puuttuvien toimintojen toteutusta. Vanhat suunnitelmat ilman listaa toimivat edelleen. Listaus on mallin arvio, ei takuu kaikkien puutteiden tunnistamisesta; rakenteiden validointi pysyy erillisenä.

Testit: `npm run check` ja `npm test`. Provider-vastaukset simuloidaan, eikä testeissä tehdä maksullisia AI-kutsuja.
