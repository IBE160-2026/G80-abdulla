# Digest: konkurrent-teardown, runde 1, assistent 2

Dimensjon: tilbud/funksjoner, pris, posisjonering, retning (FiksGataMi, Molde kommune, FixMyStreet, SeeClickFix).
Format: påstand | kilde | utgiver | pub_date | accessed 2026-10-29 | confidence | klasse
Kildemerknad fra assistenten: WebFetch gir korte oppsummeringer, og noen sider returnerte bare navigasjon. «Ikke nevnt» betyr at siden vi hentet ikke sa noe, ikke at funksjonen mangler.

## 1. FiksGataMi / Fiks Gata (Norge)

- Den opprinnelige FiksGataMi (lansert 2011, bygget på FixMyStreet, NUUG x mySociety) ble lagt ned i 2024. En ny tjeneste, «Fiks Gata», er lansert og er ifølge initiativtakeren en helt ny løsning, ikke en gjenoppliving. | https://www.fiksgatami.no/content/about | fiksgatami.no | ca. 2025 | med | trajectory
- Digi-artikkel (kun søkesammendrag, 404 ved fetch): initiativtaker Christer Gundersen sier at Fiks Gata ikke er en revival. Bruker åpne data fra Kartverket, Statens vegvesen og Yr. Kort tid etter lansering kom meldinger fra Lillehammer, Hamar, Eidsvoll, Bremanger, Bergen og Oslo. | https://www.digi.no/nyhetsstudio/ny-tjeneste-vil-fikse-gata-i-naermiljoeet/75044 | Digi.no (nyhetsstudio, kan være pressemelding) | ukjent | low-med | trajectory
- fiksgata.no gir 308-redirect til fiksgatami.no. | https://www.fiksgata.no | ukjent | high | trajectory
- Meldingen rutes automatisk til riktig kommune, fylkeskommune eller Statens vegvesen. | https://www.fiksgatami.no/ og /content/about | fiksgatami.no | ukjent | high (samme utgiver) | feature
- Meldeflyt i tre steg: ta bilde, beskriv, send inn. Nye kategorier «Oljesøl» og «Park». | https://www.fiksgatami.no/ | ukjent | med | feature
- Offentlig kart finnes (/map, /kommune/). Siden sier ikke om andre kan bekrefte, kommentere eller oppdatere. Innlogging finnes (/auth/signin). Anonymitet, statusflyt og apper er ikke omtalt i det som ble hentet. | https://www.fiksgatami.no/ | ukjent | med | feature
- Utviklet av frivillige i en «digital dugnad». Ingen juridisk driftsorganisasjon eller finansiering oppgitt. | https://www.fiksgatami.no/ | ukjent | high | positioning
- En side sier brukere kan «følge opp status» på egne meldinger. Hvem som oppdaterer status er ikke oppgitt. | https://www.fiksgatami.no/about | ukjent | low-med | feature
- Gammel versjon (2011-12): videresendte meldinger skriftlig til kommune/fylke/Vegvesen, lagret kopi og plasserte på kart, drevet av NUUG. | https://www.tu.no/artikler/fix-my-street-pa-norsk/248356 (søkesammendrag) | Teknisk Ukeblad | 2011-12 | med | feature
- Pris: ingen pris funnet (fravær av bevis, ikke bevis for gratis). | low | pricing

## 2. Molde kommune og kommunale «Meld feil»-portaler

- Molde kommune har siden «Meld ifra» (også «Meld feil») på molde.kommune.no/meld-ifra/. Hentet innhold viste bare kontaktkanaler: telefon 71 11 10 00 (man-fre 10-14), sikker digital post, postmottak@molde.kommune.no. Ikke bekreftet om det finnes skjema, app eller lenke til Fiks Gata. | https://www.molde.kommune.no/meld-ifra/ | Molde kommune | ukjent | med at siden finnes, low på hvordan den fungerer | feature
- Bærums «Meld en feil»-app: marker feil på kart, velg type, legg ved bilde, se status i appen eller på kommunens nettside. | https://www.tu.no/artikler/baerum-lanserer-feilmeldingsapp-for-darlige-veger/277412 (søkesammendrag), https://www.baerum.kommune.no/tjenester/vei-trafikk-og-parkering/sykkel/meld-feil-og-mangler | TU / Bærum kommune | ukjent | med | feature
- Lørenskogs app dekker veg, stier, vann/avløp, renovasjon, gatelys, parker og idrettsanlegg. | Lørenskog kommune (PDF, søkesammendrag) | ukjent | low-med | feature
- Flere kommuner (Bærum, Melhus, Drammen, Lørenskog) har egne «Meld en feil»-apper i App Store, altså et fragmentert kommune-for-kommune-landskap. | App Store-treff (ikke lest) | ukjent | med | feature

## 3. FixMyStreet (mySociety / SocietyWorks)

- Rapporter publiseres på nettsiden «slik at andre i lokalsamfunnet kan se hva som allerede er meldt». | https://www.fixmystreet.com/about/faq | mySociety | ukjent | high | feature
- Andre brukere kan legge inn oppdateringer/kommentarer på en rapportside, men disse sendes IKKE til kommunen. Stedet for «residents to discuss local problems and offer advice or support». | samme FAQ | high (enkeltkilde) | feature
- Ingen «me too»/upvote nevnt i FAQ. Funksjonen er ikke bekreftet, kan ikke avkreftes. | samme FAQ | med | feature
- Innlogging valgfri. Navn kan skjules offentlig, men sendes likevel til kommunen. | samme FAQ | high | feature
- Moderering: «Unsuitable?»-knapp på hver rapport. Ulovlig eller regelbrytende innhold tas ned. Ingen automatisk duplikatdeteksjon omtalt; offentlig liste nevnes som duplikatforebygging. | samme FAQ | high | feature
- Status styres vanligvis av kommunen/entreprenører. Melder kan som regel sette en rapport tilbake til «ikke fikset». Svar fra kommunen er ikke garantert eller tidsfestet. | samme FAQ | high | feature
- iOS- og Android-apper (offline-utkast) og mobilnettleser. SocietyWorks lister også «Progressive web app» og «Case management». | FAQ + https://www.societyworks.org/services/fixmystreet/ | med (PWA kun navigasjonstittel) | feature
- Pris, FixMyStreet Pro (betalt av kommuner): Essential £5 000/år for distriktsråd under 100 000 innbyggere, £7 000 over; +£18 750/år per integrasjon mot fagsystem. Unitary/county: £15 000 / £30 000 / £46 000 / £56 000 per år (Essential/Advanced/Premium/Premium Plus), 15 % rabatt på fornyelser fra år 5. Boligforeninger: Advanced £23 750, Premium £30 000. | UK G-Cloud 14/15 prisdokumenter (PDF, kun søkesammendrag lest), https://www.societyworks.org/how-to-buy/ | UK G-Cloud / SocietyWorks | 2026-01 og 2026-04 | med-high | pricing
- Posisjonering: «FixMyStreet is a classic for a reason», Newspeak House Political Technology Awards 2024-25. Åpen kildekode, veldedigheten mySociety, kommersiell Pro via SocietyWorks. | https://www.societyworks.org/2025/12/15/... | SocietyWorks | 2025-12 | med | trajectory
- Responsrate (kun UK): Northumberland 88 % (12 747 av 14 329) mai-sep 2023. SmartSurvey (via søkesammendrag): Lewisham 98,45 % fikset, Bath 97,77 %, Glasgow 2 372 av 9 780. SocietyWorks: rapporter med bilde ca. 15 % mer sannsynlig å bli markert fikset. «Fikset» settes av kommunen selv. | Northumberland CC / SmartSurvey / SocietyWorks | 2020-2023 | low-med (sekundær) | response-rate
- Ingen funn om AI-kategorisering.

## 4. SeeClickFix (CivicPlus)

- Produktside «SeeClickFix 311 CRM»: innbyggere melder via mobilapp, nettportal, chatbot eller telefon. Alt i én innboks. «Automated status updates», «progress tracking», «duplicate detection», 20+ API-integrasjoner, over 1 million forespørsler løst årlig (påstand). Offentlig kart ikke eksplisitt listet. Ingen upvote eller kommentarfunksjon på dagens side. Ingen AI i selve produktet. | https://www.civicplus.com/seeclickfix/ | CivicPlus | ukjent | med (markedsføring) | feature
- Posisjonering skiftet fra civic-engagement-plattform til kommunalt 311-CRM/saksbehandlingsverktøy. | samme side | med | positioning
- Historisk: innbyggere kunne se, kommentere og stemme («vote to fix») på naboers rapporter; «watch areas» ga varsler; rapporter var offentlige. Fra bysider/lokalaviser 2011-2017, ikke verifisert mot dagens produkt. | localwiki.org, cityofsusanville.gov (søkesammendrag) | 2011-2017 | low | feature
- Pris: ingen offentlig listepris. Kommunene betaler, ikke innbyggerne. | civicplus.com, capterra.com | 2026 | med (ingen pris) | pricing
- Eier: CivicPlus. Ingen changelog/nyheter siste 12 måneder funnet.

## Assistentens konklusjoner (bevisnivå flagget)

- «Andre kan se rapporter på offentlig kart»: bekreftet for FixMyStreet (primær FAQ), antydet for Fiks Gata. Ingen produkt har to uavhengige kilder, så enkeltkilde.
- «Naboer kan bekrefte/upvote»: IKKE bekreftet hos noen av dagens produkter. FMS har kommentarer, men ikke «me too». SeeClickFix hadde det historisk (low). Mulig gap, men fravær av bevis.
- Alle fire er bygget for innbygger-til-myndighet. FMS-kommentarer sendes eksplisitt ikke til kommunen (nabo-diskusjonsflate).
- Status hører til myndigheten i FMS og SeeClickFix. Fiks Gata sier «følg status», men ikke hvem som oppdaterer.

## Leads

1. fiksgatami.no /content/steps, /content/terms, /blogg, /kommune/, /map. Digi-lanseringsartikkelen.
2. Hvorfor og hvordan gamle FiksGataMi ble lagt ned i 2024 (NUUG), og om meldinger ble migrert.
3. Molde kommunes faktiske «Meld ifra»-skjema (siden lastet bare kontaktinfo, trolig dynamisk). Tas Fiks Gata imot?
4. G-Cloud 14/15 pris-PDF-er og SocietyWorks PWA-sider.
5. SeeClickFix changelog og dagens offentlige app/anmeldelser (finnes kommentarer/vote/watch areas fortsatt?).
6. Norske kommuners faktiske svartid (KS, innbyggerundersøkelser).
7. Campus-/universitetsanaloger.

## Ikke funnet

- Molde kommunes meldeløsning i detalj. Changelog for noen av de fire siste 12 mnd. Dokumentasjon på bekreft/kommenter i Fiks Gata og hvem som setter status. AI-funksjoner hos alle fire. Responsrate for norske kommuner og Fiks Gata. Pris for SeeClickFix og Fiks Gata. mySociety/SocietyWorks-nyheter fra 2026.
- «FiksGataMi nedlagt 2024» har to kilder (fiksgatami.no/about og Digi-søkesammendrag); egen NUUG-søkerunde ga ingen bekreftelse.
