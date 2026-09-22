# Omat elementit ja omat osiot

## Käyttö

1. Avaa **Omat elementit** (`/admin/elementit`) ja luo pohja. Paletissa on div, flex, grid, otsikko, alaotsikko, teksti, kuva, lista, ikoni ja HTML. Lisää palikka klikkaamalla valittuun ryhmään tai raahaamalla ryhmän päälle.
2. Valitse palikka rakennepuusta. Oikealla määritellään kentän nimi, oletussisältö, muokattavuus, värit, välit, fonttikoko ja mitoitus. Flex-suunta, suhteellinen leveys ja grid-sarakkeet määrittävät layoutin. Mobiilipinoutuminen on oletuksena käytössä. Nuolilla vaihdetaan järjestystä, ryhmävalitsimella ylätasoa.
3. Avaa **Omat osiot** (`/admin/osiot`). Kokoa osio peruspalikoista ja elementtipohjien viittauksista. Paletissa näkyvät myös tuote-, referenssi-, blogi- ja sisältöosiolisäosien elementit. Lisäosa pitää ottaa käyttöön erikseen. Tuotenoston sisältö valitaan tuotteista; muiden tuettujen plugin-elementtien sisältökenttä rajaa kategorian.
4. Sivueditorissa lisää **Oma osio**, valitse osiopohja ja täytä sisältökentät. Kuville on mediakirjaston lataus/valinta. Saman elementin eri esiintymien tekstit eivät ole yhteisiä.
5. Tallennus on automaattinen. Esikatselu päivittyy tallennuksen jälkeen; voit myös painaa **Päivitä tallennettu esikatselu**. Julkaise erikseen: pohjan ulkoasumuutos vaikuttaa kaikkiin sitä käyttäviin osioihin, mutta niiden sisältö säilyy.

**Lisää kuvan esimerkkipohja** tekee Palvelukortti-elementin sekä Kolme korttia ja teksti -osiopohjan. Se ei lisää mitään julkiselle sivulle automaattisesti. Valitse pohja sivueditorissa. Näin asetuksia tai olemassa olevaa sisältöä ei tarvitse nollata kokeilua varten.

## HTML ja rajat

HTML-palikka tukee turvallista sisältö-HTML:ää: div/span, otsikot, kappaleet, listat, linkit, kuvat ja tekstimuotoilut. Skriptit, tapahtuma-attribuutit, iframe ja vapaa CSS eivät ole sallittuja. Ulkoasu määritellään rakennetyökaluilla; tämä ei suorita mielivaltaista sivukoodia. Palveluupotukset lisätään edelleen sivueditorin omilla upotusosioilla.

Pohjassa enintään 100 palikkaa ja 8 sisäkkäistä tasoa. Elementtiviittaukset eivät saa muodostaa silmukkaa, ja laajennettu rakenne on rajattu 500 palikkaan. Käytössä olevan pohjan poistaminen estetään käyttöliittymässä. Solmun poistaminen poistaa sen esityksen; kumoa-toiminto palauttaa työversion. Osiopohjan vaihtaminen nollaa kyseisen osion sisältövalinnat.

## Data ja testaus

`site.builder.elements` ja `site.builder.sections` sisältävät pohjat. Sivun `type: custom` -osio sisältää `templateId`-viittauksen sekä oman `content`-objektin. Sisältöavaimet perustuvat palikoiden pysyviin tunnisteisiin ja elementtiesiintymiin, eivät layout-ryhmien sijaintiin. Siksi tavallinen ryhmästä toiseen siirtäminen ei nollaa sisältöä. Pohjat ja sisällöt kuuluvat luonnokseen, julkaisuun, historiaan sekä vientipakettiin; avaimet ja tunnukset eivät muutu.

`npm test`: HTML-suodatus, viittaussilmukat, kokorajat, itsenäiset sisällöt, pohjan ulkoasun periytyminen, ryhmäsiirron sisältösäilyvyys, plugin-renderöinti sekä HTTP:n luonnos/julkaisu/esikatselu/vienti. Selaimessa tarkistettu esimerkin luonti, kolme erillistä korttikenttää, julkaisu, ulkoasumuutoksen periytyminen kolmeen esiintymään, palettiraahaus sekä 390 px mobiili (pinoutuu, ei vaakaylivuotoa).
