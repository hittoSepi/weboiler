# Laajennuskokonaisuuden loppuauditointi

ROADMAP.md-vaiheet 1–9 on toteutettu ja alla kuvattu tarkistus suoritettu 22.9.2026. Ei avoimia toteutus- tai testausesteitä sovitussa kokonaisuudessa.

## Ajettu tämän auditointikierroksen aikana

- `npm test`: kaikki 15 testitiedostoa läpi. HTTP-testi laajennettu sisältöosioiden luonnos/esikatselu/julkaisuun sekä sivustopaketin uusien kenttien säilymiseen (sisältöosiot, kieliversiot, lomakkeen vastaanottaja).
- `git diff --check`: ei whitespace-virheitä; Git ilmoittaa Windowsin CRLF-normalisoinnista.
- `npm run check`: 60 JavaScript-tiedostoa. Tarkistus ei korvaa selaintestejä.

## Vaatimusten näyttö ja puutteet

Upotusten selaimen käyttöliittymätesti: eristetty `--embed-audit` näyttää kaikki kolme latauspainiketta ja varalinkkiä ilman iframea (määrä 0). Painallusten jälkeen kolme iframea: odotetut src-osoitteet, korkeus 400, no-referrer ja rajattu sandbox. Kirjautuneen esikatselussa painallus näytti estoviestin eikä luonut iframea. Lisäksi käyttäjän antamilla osoitteilla tarkistettu todelliset palvelut: Google Mapsin kartta-alue ja kontrollit näkyivät; Calendlyn 30 Minute Meeting -kalenteri latautui ja iframe sisälsi seitsemän Times available -päiväpainiketta; Buttondownin Subscribe-lomake ja Email-kenttä näkyivät. Konsolin virhelista tyhjä. Kokosivukuvakaappaus aikakatkaistiin; palvelujen näkyminen todennettiin selaimen iframe-DOMista. Ei tehty ajanvarauksia tai tilauksia. Testipalvelin pysäytetty.

Lisäosien kieliparien selaintesti läpi eristetyssä ympäristössä: blogiin ja referensseihin lisätty fi/en-kohteet hallinnasta, sama käännösryhmä ja omat osoitteet, julkaistu ja vaihdettu julkiselta sivulta English-linkillä. Englanninkielinen uutisotsikko, `html lang=en`, referenssin Test project / About the project näkyivät oikein. Uudelleenlataus säilytti kieli- ja ryhmäkentät. Referenssin esikatselun kielilinkki pysyi `/admin/esikatselu?plugin=references&item=...`-reitillä ja kohdesivun `data-preview=true` säilyi. Julkisen sivun konsolivirheitä ei ollut. Oma testipalvelin pysäytetty; oikeaa sivustodataa ei muutettu.

Lisäosien kieliparit toteutettu blogiin ja referensseihin: skeemakentät hallintaan, yksilöllinen kieli/käännösryhmä, sivun kielen listat, kohdesivujen kielivalikko ja hreflang, kielikohtainen etusivu/valikko/alatunniste sekä suojatut esikatselu- ja historialinkit. `test/languages.js` todentaa molemmat lisäosat ja luonnos-/ajastusvastineiden piilottamisen. Kaikki 15 testitiedostoa ja 60 tiedoston syntaksitarkistus läpi. Uusien kenttien selaintesti on kuvattu yllä.

| Vaatimus | Automaattinen näyttö | Käyttöliittymän näyttö / jäljellä |
|---|---|---|
| Julkaisuhistoria | history.js, smoke.js, pages.js: palautus, live-erottelu, eheys, versioristiriita | Aiemmin ajettu julkaisu → historia → palautus; ROADMAP |
| Monisivuisuus | pages.js: reitit, validointi, julkaisu, poisto, historia | Aiemmin ajettu sivun lisäys, muokkaus ja julkaisu |
| Plugin-rajapinta ja referenssit | plugins.js, pages.js: rekisteri, deaktivointi, renderöinti, reitit | Aiemmin ajettu referenssin lisääminen ja julkaisu |
| Kuvien optimointi | images.js, pages.js: Sharpin oikeat tuloskuvat, cache ja HTTP | Aiemmin ajettu rajauspiste ja säilyminen |
| Undo/redo ja raahaus | undo.js: ryhmittely, haarat ja järjestely | Aiemmin ajettu hiiriraahaus, kumous ja näppäinsiirto |
| SEO | seo.js, pages.js: metatiedot, oletukset, canonical, noindex | Aiemmin ajettu otsikko/kuvaus → julkaisu → DOM |
| Vienti/tuonti | transfer.js, pages.js: paketointi, media, rajat, palautuspiste, auth/CSRF ja konfliktit | Tiedoston valinta → tarkistus → tuontivahvistus onnistui selaimessa. Uusi sisältö näkyi luonnosesikatselussa, julkisen sivun sisältö säilyi vertailussa ennallaan ja historiassa näkyi Työversio ennen tuontia. |
| Blogi | blog.js, pages.js: ajastusraja, luonnokset, kategoriat, suorat reitit | Aiemmin ajettu artikkelin ajastus, julkaisu, reload, preview/public-ero |
| Lomake-editori | forms.js, services.js, pages.js: kentät, vastaanottaja, validointi, tallennus, molemmat mail-mockit | Korjauksen jälkeen selaimessa: muokkaus käyttöön → valintakenttä → kaksi vaihtoehtoa/pakollisuus → julkaisu → julkisen lomakkeen lähetys → onnistumisviesti → kaikki vastaukset hallinnassa. Synteettinen testiviesti, ei ulkoista sähköpostia |
| Kieliversiot | languages.js, pages.js: kieliryhmät, linkit, hreflang, sivuvalikko, julkaisu | Selaimessa englanninkielinen sivu, home-ryhmä, oma valikko ja alatunniste julkaistu; kielivalikon vaihto toimi. Valikon kopioinnin vanhat paljaat ankkurit korjattu ja regressiotestattu. Blogin ja referenssien kieliparit, julkaisu, uudelleenlataus ja esikatselun kielivaihto tarkistettu yllä. |
| Upotukset | embeds.js, pages.js: osoitteet, CSP, opt-in ja preview-esto simuloidussa DOMissa | Selaimen latauspainikkeet, iframe-attribuutit ja esikatseluesto tarkistettu. Todellinen Google Maps -kartta, Calendlyn kalenteri saatavuuksineen ja Buttondownin Email/Subscribe-lomake tarkistettu selaimen iframe-DOMista; ei oikeita tilauksia/ajanvarauksia. |
| Hinnasto/FAQ/palautteet/tiimi | content-sections.js, pages.js: skeema, semantiikka, renderöinti, julkaisu, paketointi | Selaimessa hinnan muokkaus ja korttien järjestely, FAQ-kohteen lisäys, palautteen ja tiimiroolin muokkaus sekä julkaisu/reload tarkistettu. FAQ avattu. Desktop-kuva ja 390 px mobiili tarkistettu: ei vaakaylivuotoa (scrollWidth=clientWidth=375). Konsolin virhelista tyhjä |

## Viimeistely

Tiedostolupa korjattu käyttäjän toimesta ja tuontitesti läpi. Selainyhteyden aiemmat esteet eivät ole enää aktiivisia. Viimeinen ajo: `npm run check` 60 tiedostoa, `npm test` kaikki 15 testitiedostoa läpi.

Testipalvelin pysäytetty. Oikeaa sivustodataa ei muutettu. Ulkoisia varauksia, uutiskirjetilauksia, maksullista AI-generointia tai sähköpostilähetyksiä ei tehty. Palveluntarjoajien lomakkeiden näkyminen on tarkistettu, ei lopullisia lähetyksiä. Käyttöönotossa määritellään omat osoitteet ja avaimet.
