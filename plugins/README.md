# Luotettujen lisäosien rajapinta v1

Lisäosa on ylläpitäjän projektiin asentama Node.js-moduuli, joka lisätään `plugins/index.js`-rekisteriin. Käynnistä palvelin uudelleen asennuksen jälkeen. Älä asenna tuntematonta koodia: lisäosa toimii palvelimen oikeuksilla, ei hiekkalaatikossa. Hallinta ei vastaanota tai suorita koodipaketteja.

Moduuli vie objektin, jonka kentät ovat `id` (uniikki a-z-tunniste), `name`, `description`, `version: 1`, `sections` ja `collections`. Asennettu Referenssit-moduuli on toimiva esimerkki.

- `sections`: lista `{type, label, fields}`. Tyypin tulee olla uniikki myös suhteessa ytimen osiotyyppeihin. `fields` määrittelee osion `pluginData`-kentät.
- `collections`: lista `{key, label, fields}`. Hallinta rakentaa näistä lisäosan sisältölomakkeet. Kohteilla on pysyvä `id`; järjestys säilyy tallennuksessa.
- Kenttämääritelmä: `{key, label, type, required?, max?}`. Tuetut tyypit ovat `text`, `textarea`, `image`, `url` ja `slug`. Maksimipituus on oletuksena 500 merkkiä. Kuva- ja linkkiosoite validoidaan; slug-kentät ovat kokoelmassa yksilöllisiä.
- `renderSection(section, data, {detailUrl})` palauttaa ytimen tukeman osio-objektin, ei HTML:ää. Tekstit escapetaan ytimen rendererissä. Poissa käytöstä olevan lisäosan osiot ohitetaan.
- Valinnaiset `routePrefix` (esim. `/referenssit/`) ja `detail(slug, data)` muodostavat esittelysivut. `detail` palauttaa `{title, description, sections}` tai `null`, jos kohdetta ei löydy. Käytä `detailUrl`-apuria korttien linkeissä, jotta luonnos- ja historiaesikatselu säilyvät suojattuina.

Sisältö tallentuu `site.plugins[id]`-objektiin, jossa `enabled` on käyttöönoton tila ja kokoelmat ovat omissa listoissaan. Poiskytkentä säilyttää datan. Luonnos, julkaisu ja historia kattavat myös lisäosat. Puuttuvan lisäosan sisältöä ei hiljaisesti poisteta tallennuksessa: asenna puuttuva moduuli takaisin ensin.

Lisäksi kenttätyypit `select` (`options: [{value,label}]`, `default`) ja `datetime` ovat tuettuja. Datetime tallennetaan kelvollisena UTC ISO -aikaleimana tai tyhjänä; hallinta muuntaa paikallisen aikavyöhykkeen. `renderSection`-konteksti ja `detail`-funktion kolmas argumentti sisältävät `preview`-lipun. Ajankohtaista-lisäosa käyttää sitä luonnosten suojattuun esikatseluun; julkisella reitillä lippua ei anneta. Testit voivat antaa `now`-millisekuntiarvon ajastuksen rajahetkien tarkistamiseen.

Rajapinta ei anna lisäosalle hallinnan kautta mielivaltaisia API-reittejä tai selaimessa suoritettavia skriptejä. Lisäosan omat sisältönäkymät rakennetaan yhteiselle Lisäosat-sivulle skeemasta. Ajankohtaista tarkistaa julkaisukelpoisuuden jokaisella listaus- ja yksittäissivupyynnöllä; taustaprosessia ei tarvita. Ulkoiset integraatiot ja monimutkaiset lomakkeet lisätään erikseen tarkoituksenmukaisilla palvelinrajapinnoilla.
