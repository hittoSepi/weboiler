# Luotettujen lisäosien rajapinta v1

## Omat hallintasivut ja integraatiot

Lisäosa voi määritellä `adminPage: {slug: 'tuotteet', label: 'Tuotteet', icon: 'fa-box'}`. Ydin rekisteröi suojatun `/admin/tuotteet`-sivun ja valikkolinkin automaattisesti. Näkymän kentät rakennetaan edelleen kokoelmien skeemasta; tämä ei ole mielivaltaisten selainkomponenttien latausrajapinta.

`integrations: [{id, label, collection, async run()}]` määrittelee palvelimella ajettavan haun. Ydin suojaa POST-reitin `/api/admin/plugins/:id/integrations/:action` kirjautumisella ja CSRF:llä. `run` palauttaa kokoelman kohdelistan, joka validoidaan skeemalla ennen palauttamista hallintaan. Suoritettava koodi ja avaimet eivät kuulu selaimelle annettavaan katalogiin. Hallinta näyttää tuonnin esikatselun ja pyytää vahvistuksen: sama `id` korvataan, muut lisätään, puuttuvia ei poisteta. Sisältö tallentuu luonnokseen tavallisella versiotarkistetulla tallennuksella. Käyttöönotto ja julkaisu ovat erillisiä toimintoja. Integraation tulee olla lukutoiminto; yhteinen vahvistus tapahtuu vasta haun jälkeen.

Osion `reference`-kenttä `{key:'productId', label:'Tuote', type:'reference', plugin:'products', collection:'items'}` näyttää kokoelman kohteet valintalistana ja säilyttää kohteen id:n. Poistettu kohde näkyy editorissa puuttuvana eikä rendererin pidä korvata sitä toisella tuotteella.

### Tuotteiden API-sopimus

Palvelimen `.env`: `PRODUCTS_API_URL=https://oma-palvelu.example/products` ja tarvittaessa `PRODUCTS_API_TOKEN=...` (Bearer). Käynnistä palvelin uudelleen. Avaimet eivät tallennu sivuston JSONiin tai vientipakettiin. Nykyinen verkkohaku sallii julkisen IPv4-osoitteeseen ratkaistuvan HTTPS-domainin portissa 443; paikalliset verkot ja uudelleenohjaukset estetään. Kokoraja 2 Mt, aikaraja 10 sekuntia. API-avain lähetetään vain määritellylle palvelulle. Valitse luotettu lähde.

Vastaus on lista tai `{ "products": [...] }`. Tuote esimerkiksi:

```json
{"id":"sku-123","slug":"esimerkkituote","title":"Esimerkkituote","price":"29,90 €","category":"Tarvikkeet","text":"Tuotekuvaus","image":"https://oma-palvelu.example/tuote.jpg","imageAlt":"Tuote"}
```

Enintään 100 tuotetta. `id`, `slug` ja `title` ovat pakollisia; id pysyy samana päivityksissä. Samat id:t tai osoitetunnisteet hylätään. Muun API:n kenttien muunnos tehdään lisäosan `run`-funktiossa, ei yleiseen ytimeen. Tämä on tuotekatalogi, ei verkkokaupan maksaminen tai varastonhallinta.

Testit: `npm test` sisältää tuote- ja integraatiotestit. `node test/preview-server.js --mock-products` käynnistää eristetyn selaintestin simuloidulla API-vastauksella.

Lisäosa on ylläpitäjän projektiin asentama Node.js-moduuli, joka lisätään `plugins/index.js`-rekisteriin. Käynnistä palvelin uudelleen asennuksen jälkeen. Älä asenna tuntematonta koodia: lisäosa toimii palvelimen oikeuksilla, ei hiekkalaatikossa. Hallinta ei vastaanota tai suorita koodipaketteja.

Moduuli vie objektin, jonka kentät ovat `id` (uniikki a-z-tunniste), `name`, `description`, `version: 1`, `sections` ja `collections`. Asennettu Referenssit-moduuli on toimiva esimerkki.

- `sections`: lista `{type, label, fields}`. Tyypin tulee olla uniikki myös suhteessa ytimen osiotyyppeihin. `fields` määrittelee osion `pluginData`-kentät.
- `collections`: lista `{key, label, fields}`. Hallinta rakentaa näistä lisäosan sisältölomakkeet. Kohteilla on pysyvä `id`; järjestys säilyy tallennuksessa.
- Kenttämääritelmä: `{key, label, type, required?, max?}`. Tuetut tyypit ovat `text`, `textarea`, `image`, `url` ja `slug`. Maksimipituus on oletuksena 500 merkkiä. Kuva- ja linkkiosoite validoidaan; slug-kentät ovat kokoelmassa yksilöllisiä.
- `renderSection(section, data, {detailUrl})` palauttaa ytimen tukeman osio-objektin, ei HTML:ää. Tekstit escapetaan ytimen rendererissä. Poissa käytöstä olevan lisäosan osiot ohitetaan.
- Valinnaiset `routePrefix` (esim. `/referenssit/`) ja `detail(slug, data)` muodostavat esittelysivut. `detail` palauttaa `{title, description, sections}` tai `null`, jos kohdetta ei löydy. Käytä `detailUrl`-apuria korttien linkeissä, jotta luonnos- ja historiaesikatselu säilyvät suojattuina.

Sisältö tallentuu `site.plugins[id]`-objektiin, jossa `enabled` on käyttöönoton tila ja kokoelmat ovat omissa listoissaan. Poiskytkentä säilyttää datan. Luonnos, julkaisu ja historia kattavat myös lisäosat. Puuttuvan lisäosan sisältöä ei hiljaisesti poisteta tallennuksessa: asenna puuttuva moduuli takaisin ensin.

Lisäksi kenttätyypit `select` (`options: [{value,label}]`, `default`) ja `datetime` ovat tuettuja. Datetime tallennetaan kelvollisena UTC ISO -aikaleimana tai tyhjänä; hallinta muuntaa paikallisen aikavyöhykkeen. `renderSection`-konteksti ja `detail`-funktion kolmas argumentti sisältävät `preview`-lipun. Ajankohtaista-lisäosa käyttää sitä luonnosten suojattuun esikatseluun; julkisella reitillä lippua ei anneta. Testit voivat antaa `now`-millisekuntiarvon ajastuksen rajahetkien tarkistamiseen.

Lisäosa ei saa hallinnan kautta asentaa mielivaltaisia API-reittejä tai selaimessa suoritettavia skriptejä. Omat hallintasivut ja integraatiohaut rekisteröidään yllä kuvatulla luotetun moduulin rajapinnalla. Ajankohtaista tarkistaa julkaisukelpoisuuden jokaisella listaus- ja yksittäissivupyynnöllä; taustaprosessia ei tarvita.
