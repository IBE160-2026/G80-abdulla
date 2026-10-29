---
title: LocalFix Product Brief
status: final
created: 2026-09-18
updated: 2026-10-29
---

# Product Brief: LocalFix

## Sammendrag

LocalFix er en nettbasert løsning der folk i et lokalmiljø kan registrere og dele problemer de ser rundt seg, som søppel, ødelagte gatelys, hull i veien eller farlige fortau. Andre brukere kan se rapportene, bekrefte at de har sett det samme problemet og følge statusen fram til det er løst. Første versjon er rettet mot campus ved Høgskolen i Molde. Appen er ikke teknisk låst til campus og kan tas i bruk andre steder senere.

LocalFix gir nærmiljøet et felles, synlig sted for denne typen rapportering, uten å være avhengig av at kommunen er involvert.

## Problemet

Det finnes ingen enkel, samlet måte å dele informasjon om lokale problemer med andre i nærmiljøet. Folk vet ikke om andre allerede har meldt fra, eller om noe blir gjort. Kunnskapen blir værende hos enkeltpersoner.

Et typisk eksempel: Et gatelys på gangveien opp til campus har vært ødelagt i flere uker. Mange studenter går forbi hver kveld og legger merke til det, men ingen vet om noen har meldt fra, eller til hvem. Alle antar at noen andre har gjort det, og lyset forblir mørkt.

## Løsningen

LocalFix gir brukerne én delt kjerneopplevelse: registrere et problem, se hva andre allerede har rapportert, bekrefte at man har sett det samme og følge saken gjennom en enkel status fram til den er løst. KI foreslår kategori og en kort oppsummering ut fra beskrivelsen brukeren skriver, slik at rapportering tar sekunder. Brukeren kan alltid overstyre forslaget. Lista kan filtreres og sorteres, så det som flest har sett, kommer øverst. Full funksjonsliste: se Omfang.

## Hva gjør dette annerledes

Sammenlignbare løsninger som FixMyStreet, SeeClickFix, FiksGataMi og kommunale «Meld feil»-portaler er bygget for kommunikasjon fra borger til kommune (se `addendum.md`). LocalFix retter seg i stedet mot kommunikasjon mellom naboer, og har ingen kommuneintegrasjon i v1. Verdien ligger i at folk ser og bekrefter hverandres observasjoner, ikke i en saksbehandlingskø hos en offentlig etat.

Nabobekreftelse er likevel ikke et tomt felt. FiksGataMi lar innloggede brukere kommentere og «bekrefte at de har sett problemet», som fritekst (funnet på én side, ikke prøvd i praksis). Forskjellen i LocalFix er en enkel én-trykks «jeg har også sett dette» som teller og sorterer lista, i en lokal og moderert flyt.

Tidligere research på disse løsningene (`addendum.md`) peker på tre kjente fallgruver: rapporter der statusen aldri oppdateres, duplikater og spam, og brukere som opplever å «rope i tomrommet». LocalFix møter dette med en eksplisitt statusflyt styrt av en moderator, én bekreftelse per innlogget bruker og sortering etter antall bekreftelser. Ny research på brukerstemmer (`docs/planning-artifacts/research/user-voice-brukerstemmer-og-konkurrenter-for-lokal-2026-10-29/research.md`) støtter bare den første fallgruven, manglende tilbakemelding, og bygger i hovedsak på utenlandske kilder. Den fant ingen data på duplikater og spam, og nesten ingen norske brukerstemmer.

## Hvem dette er for

**Primærbrukere:** studenter og ansatte ved campus Molde som ferdes i området daglig og ser problemer underveis.

**Typisk bruker:** Ida, andreårsstudent, går til campus hver dag med telefonen i hånda. Hun ser et ødelagt gatelys og vil på under ett minutt finne ut om det allerede er meldt. Hvis det er meldt, trykker hun «jeg har også sett dette». Hvis ikke, tar hun et bilde og registrerer det.

**Moderator:** en utpekt person, for eksempel fra studentorganisasjonen eller driftsavdelingen, som følger opp rapportene og oppdaterer status.

**Åpent punkt:** Hvem moderator er, og hva som skjer med en sak moderator ikke kan fikse selv, er ikke avklart. Research fant ingen kanal ved Høgskolen i Molde for hverdagsfeil utendørs, og eierskapet til belysning, gangveier og fortau rundt campus (kommune, fylke, HiM eller Statsbygg) er ikke funnet. Uten en som kan handle, kan «Løst» bli en påstand uten dekning. Dette må avklares med HiM, Statsbygg eller kommunen før moderatorrollen låses.

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
- Registrere en rapport med kort beskrivelse, lokasjon som tekst eller adresse, kategori og valgfritt bilde
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
- Flere lokalmiljø med egen liste og egen moderator (v1 gjelder campus Molde)
- Automatisk duplikatsjekk (parkert, se `addendum.md`)

## Personvern

Bilder kan vise personer eller bilskilt, og adresser kan være personopplysninger. Brukeren får beskjed om å unngå ansikter og bilskilt ved opplasting, og moderator kan skjule rapporter som bryter med dette. Bildestørrelsen er begrenset ved opplasting. [ASSUMPTION]

Når KI-forslaget bruker en ekte språkmodell, sendes beskrivelsen brukeren skriver til leverandøren av modellen. Påminnelsen om å unngå personopplysninger gjelder derfor også beskrivelsesfeltet. Gratisnivået hos Gemini brukes ikke med ekte brukerdata, fordi Googles vilkår krever betalt nivå for brukere i EØS. I mock-modus sendes ingenting ut. Se PRD §8.

## Suksesskriterier

- En innlogget bruker kan registrere en rapport, med eller uten bilde, og se den i lista.
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

Appen er ikke teknisk låst til campus. Hvis LocalFix fungerer på campus, kan løsningen tas i bruk i andre lokalmiljøer, som boligområder og borettslag, med egen liste og moderator per miljø, og senere tilby valgfri videresending av saker til kommunen.
