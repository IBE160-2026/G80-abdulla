---
title: LocalFix Product Brief
status: final
created: 2026-09-18
updated: 2026-10-11
---

# Product Brief: LocalFix

## Sammendrag

LocalFix er en nettbasert løsning der folk i et lokalmiljø kan registrere og dele problemer de ser rundt seg, som søppel, ødelagte gatelys, hull i veien eller farlige fortau. Andre brukere kan se rapportene, bekrefte at de har sett det samme problemet og følge statusen fram til det er løst. Første versjon er rettet mot campus ved Høgskolen i Molde.

LocalFix gir nærmiljøet et felles, synlig sted for denne typen rapportering, uten å være avhengig av at kommunen er involvert.

## Problemet

Det finnes ingen enkel, samlet måte å dele informasjon om lokale problemer med andre i nærmiljøet. Folk vet ikke om andre allerede har meldt fra, eller om noe blir gjort. Kunnskapen blir værende hos enkeltpersoner.

Et typisk eksempel: Et gatelys på gangveien opp til campus har vært ødelagt i flere uker. Mange studenter går forbi hver kveld og legger merke til det, men ingen vet om noen har meldt fra, eller til hvem. Alle antar at noen andre har gjort det, og lyset forblir mørkt.

## Løsningen

LocalFix gir brukerne én delt kjerneopplevelse: registrere et problem, se hva andre allerede har rapportert, bekrefte at man har sett det samme og følge saken gjennom en enkel status fram til den er løst. KI foreslår kategori og en kort oppsummering ut fra beskrivelsen brukeren skriver, slik at rapportering tar sekunder. Brukeren kan alltid overstyre forslaget. Lista kan filtreres og sorteres, så det som flest har sett, kommer øverst. Full funksjonsliste: se Omfang.

## Hva gjør dette annerledes

Sammenlignbare løsninger som FixMyStreet, SeeClickFix, FiksGataMi og kommunale «Meld feil»-portaler er bygget for kommunikasjon fra borger til kommune (se `addendum.md`). LocalFix retter seg i stedet mot kommunikasjon mellom naboer, og har ingen kommuneintegrasjon i v1. Verdien ligger i at folk ser og bekrefter hverandres observasjoner, ikke i en saksbehandlingskø hos en offentlig etat.

Research på disse løsningene viser tre kjente fallgruver: rapporter der statusen aldri oppdateres, duplikater og spam, og brukere som opplever å «rope i tomrommet». LocalFix møter dette med en eksplisitt statusflyt styrt av en moderator, én bekreftelse per innlogget bruker og sortering etter antall bekreftelser.

## Hvem dette er for

**Primærbrukere:** studenter og ansatte ved campus Molde som ferdes i området daglig og ser problemer underveis.

**Typisk bruker:** Ida, andreårsstudent, går til campus hver dag med telefonen i hånda. Hun ser et ødelagt gatelys og vil på under ett minutt finne ut om det allerede er meldt. Hvis det er meldt, trykker hun «jeg har også sett dette». Hvis ikke, tar hun et bilde og registrerer det.

**Moderator:** en utpekt person, for eksempel fra studentorganisasjonen eller driftsavdelingen, som følger opp rapportene og oppdaterer status.

Løsningen retter seg ikke mot kommunen i denne versjonen.

## Brukere og roller

| Rolle | Kan |
|---|---|
| Ikke innlogget | Se lista og detaljene i rapportene |
| Innlogget bruker | Registrere rapporter og bekrefte andres rapporter, én gang per rapport |
| Moderator | Alt over, pluss endre status (Ny → Under behandling → Løst) og skjule upassende rapporter |

Det kreves innlogging for å registrere og bekrefte. Det hindrer at én person bekrefter samme rapport flere ganger.

## Omfang

**I omfang (v1 / MVP):**
- Innlogging med to roller: bruker og moderator
- Registrere en rapport med bilde, kategori, kort beskrivelse og lokasjon som tekst eller adresse
- Se liste over alle rapporter og en detaljside per rapport
- Markere «jeg har også sett dette» (én bekreftelse per bruker)
- Statusflyt Ny → Under behandling → Løst, som bare moderator kan endre
- Filtrering på kategori og status, og sortering etter antall bekreftelser og dato
- KI-funksjon som foreslår kategori og lager en kort oppsummering ut fra beskrivelsen
- Faste kategorier: Søppel, Belysning, Vei og fortau, Skadeverk, Annet [ASSUMPTION]
- Fallback når KI ikke svarer eller ikke er konfigurert: brukeren velger kategori manuelt, og rapporten lagres uten oppsummering

**Ikke i omfang (v1):**
- Betalingsløsning
- Integrasjon mot kommunesystemer
- Avansert kartvisning (enkel liste er nok)
- Chat eller meldinger mellom brukere
- Native mobil- og desktop-apper (kun responsiv webapp/PWA)
- Automatisk duplikatsjekk (parkert, se `addendum.md`)

## Personvern

Bilder kan vise personer eller bilskilt, og adresser kan være personopplysninger. Brukeren får beskjed om å unngå ansikter og bilskilt ved opplasting, og moderator kan skjule rapporter som bryter med dette. Bildestørrelsen er begrenset ved opplasting. [ASSUMPTION]

## Suksesskriterier

- En innlogget bruker kan registrere en rapport med bilde og se den i lista.
- En annen bruker kan bekrefte rapporten. Telleren øker med én, og samme bruker kan ikke bekrefte to ganger.
- Bare moderator kan endre status, og endringen vises for alle brukere.
- Filtrering og sortering gir riktig resultat på et kjent testdatasett.
- KI-kategorisering: av et testsett på 20 beskrivelser med fasit får minst 16 riktig kategori.
- Når KI er utilgjengelig, kan rapporten fortsatt registreres med manuelt valgt kategori.
- Kjerneflyten (registrere, se, bekrefte, endre status) fungerer uten horisontal scrolling på mobil (360 px), nettbrett og desktop.
- Sensor kan kjøre appen lokalt ved å følge README, uten gruppens nøkler eller betalte kontoer.

## Teknisk retning

Fullstack, responsiv webapp (PWA) bygget med Next.js (React) for frontend og API routes for backend. Supabase brukes til database, innlogging og bildelagring. Én kodebase og mobile-first design som fungerer i nettleseren på desktop, nettbrett og mobil. Mot slutten legges det til et PWA-manifest, slik at appen kan installeres på hjemskjermen.

**Kjørbar uten gruppens nøkler:** Supabase kjøres lokalt med Supabase CLI og Docker, med seed-data og testbilder. KI-funksjonen har en mock-modus som slår seg på automatisk når det ikke finnes noen API-nøkkel. Det velges en språkmodell med gratisnivå. Hemmeligheter ligger i `.env`, og repoet har en `.env.example`. Testdata og planleggingsdokumenter får egne mapper.

Prosjektet er realistisk å bygge alene med KI-assistert utvikling i løpet av ett semester.

## Visjon

Hvis LocalFix fungerer på campus, kan løsningen tas i bruk i andre lokalmiljøer, som boligområder og borettslag, og senere tilby valgfri videresending av saker til kommunen.
