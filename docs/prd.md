---
title: LocalFix PRD
status: final
created: 2026-09-18
updated: 2026-10-11
---

# PRD: LocalFix

## 0. Dokumentets formål

Dette dokumentet er skrevet for prosjektdeltakeren selv, som er PM, designer og utvikler i én person, og for sensor i IBE160 Programmering med KI. Det bygger på product brief (`product-brief.md`, oppdatert 2026-10-11 etter faglærers tilbakemelding) og gjentar ikke research og resonnement derfra. Konkurrentresearch står i brief-addendumet.

Funksjonene er gruppert, med globalt nummererte funksjonelle krav (FR-N) under hver gruppe. Brukerreiser heter UJ-N og suksessmetrikker SM-N. Tekniske valg, altså *hvordan* noe bygges, står i `prd-addendum.md`, ikke her. Gjenværende antagelser er samlet i §12.

**Endringer 2026-10-11:** Moderatorrolle styrer status og kan skjule rapporter. Filtrering og sortering er med i v1. KI-målet er gjort testbart med et testsett. Persona og lokalmiljø er konkretisert til campus Molde. Det er lagt til krav om at sensor kan kjøre appen lokalt uten gruppens nøkler.

## 1. Visjon

LocalFix er en responsiv nettapplikasjon (PWA) der folk i et lokalmiljø har ett felles, synlig sted for å rapportere og følge opp problemer de ser rundt seg, som søppel, ødelagte gatelys, hull i veien og farlige fortau. Rapportene samles på ett sted, så alle kan se dem, bekrefte hverandres observasjoner og følge statusen til problemet er løst. Da blir ikke informasjonen sittende hos hver enkelt.

Første versjon er rettet mot campus ved Høgskolen i Molde. Sammenlignbare løsninger (FixMyStreet, SeeClickFix, FiksGataMi og kommunale «Meld feil»-portaler) går fra borger til kommune. LocalFix går fra nabo til nabo og har ingen kommuneintegrasjon i v1.

Over tid kan løsningen tas i bruk i andre lokalmiljøer, som boligområder og borettslag, og eventuelt få valgfri videresending av saker til kommunen.

## 2. Målgruppe

### 2.1 Behov produktet dekker (Jobs To Be Done)

- **Funksjonelt:** Som student eller ansatt vil jeg raskt kunne melde fra om et problem jeg ser, så flere enn jeg får vite om det.
- **Informasjonelt:** Jeg vil vite om noen allerede har meldt det samme problemet, og hva som skjer med det.
- **Sosialt og emosjonelt:** Jeg vil slippe følelsen av å «rope i tomrommet». Jeg vil se at noen faktisk følger opp.
- **For moderatoren:** Jeg vil ha én oversikt over hva som er meldt, hva flest har sett, og hva som er løst.

### 2.2 Roller

| Rolle | Hvem | Kan |
|---|---|---|
| Besøkende (ikke innlogget) | Hvem som helst | Se lista og detaljsidene for synlige rapporter |
| Bruker (innlogget) | Studenter og ansatte | Registrere rapporter og bekrefte andres rapporter, én gang per rapport |
| Moderator | En utpekt person, for eksempel fra studentorganisasjonen eller driftsavdelingen | Alt en bruker kan, pluss endre status og skjule eller vise rapporter |

### 2.3 Ikke-brukere (v1)

- **Kommunen og offentlige saksbehandlere.** LocalFix er bevisst ikke en saksbehandlingsløsning.
- **Folk uten tilknytning til lokalmiljøet.** Appen er ikke et generelt diskusjonsforum.

### 2.4 Sentrale brukerreiser

**UJ-1. Ida rapporterer et ødelagt gatelys.**
- **Person og kontekst:** Ida er andreårsstudent. Hun går gangveien opp til campus hver kveld etter trening, med telefonen i hånda.
- **Inngangstilstand:** Hun er innlogget fra en tidligere økt og bruker mobilen.
- **Forløp:**
  1. Ida legger merke til at et gatelys er mørkt, igjen.
  2. Hun åpner LocalFix og filtrerer på kategorien «Belysning» for å se om noen har meldt det. Det har ingen gjort.
  3. Hun trykker «Registrer problem» og skriver «Gatelyset ved gangveien mot campus har vært mørkt i flere dager».
  4. KI foreslår kategorien «Belysning» og en kort oppsummering.
  5. Hun tar et bilde, skriver inn lokasjonen og sender inn.
- **Klimaks:** Rapporten dukker opp i lista med status **Ny**.
- **Oppløsning:** Ida går videre, trygg på at problemet nå er synlig for andre.
- **Kantcase:** Foreslår KI feil kategori eller svarer ikke, velger Ida kategorien selv.

**UJ-2. Jonas bekrefter Idas rapport.**
- **Person og kontekst:** Jonas er en annen student som går samme vei. Han åpner LocalFix samme kveld.
- **Forløp:**
  1. Jonas sorterer lista etter nyeste og kjenner igjen gatelyset.
  2. Han åpner rapporten og trykker «Jeg har også sett dette».
  3. Telleren øker fra 1 til 2. Knappen viser nå at han allerede har bekreftet.
- **Klimaks:** Jonas ser at han ikke er alene. Rapporten klatrer når lista sorteres etter antall bekreftelser.

**UJ-3. Moderator følger opp.**
- **Person og kontekst:** Sara er moderator for studentorganisasjonen. En gang i uka sorterer hun lista etter flest bekreftelser.
- **Forløp:**
  1. Sara ser at gatelysrapporten har fem bekreftelser.
  2. Hun melder fra til driften og setter status til **Under behandling**.
  3. Da lyset er fikset, setter hun status til **Løst**.
  4. Sara skjuler også en rapport med et bilde der et bilskilt er lesbart.
- **Klimaks:** Alle som fulgte rapporten, ser at problemet ble løst.
- **Kantcase:** Har Sara satt **Løst** for tidlig, kan hun flytte statusen tilbake til **Under behandling**.

## 3. Ordliste

- **Rapport:** En registrert observasjon med beskrivelse, lokasjon, kategori, valgfritt bilde, KI-oppsummering (om den finnes), status og antall bekreftelser.
- **Bekreftelse:** En markering («Jeg har også sett dette») fra en innlogget bruker som ikke er rapportøren. Hver bruker kan gi én per rapport.
- **Status:** **Ny**, **Under behandling** eller **Løst**. Bare moderator kan endre den.
- **Kategori:** En av de faste verdiene Søppel, Belysning, Vei og fortau, Skadeverk og Annet.
- **Skjult rapport:** En rapport som moderator har fjernet fra den offentlige lista. Den slettes ikke.
- **Mock-modus:** En KI-funksjon som gir et forutsigbart forslag uten ekte språkmodell. Den brukes når ingen API-nøkkel er satt.

## 4. Funksjoner

### 4.1 Konto og roller

#### FR-1: Registrering og innlogging
En besøkende kan opprette en konto og logge inn. Uten innlogging kan man bare lese.

**Konsekvenser (testbare):**
- Prøver en som ikke er innlogget å registrere eller bekrefte, blir hen sendt til innlogging.
- Nye kontoer får rollen «bruker».

#### FR-2: Moderatorrolle
Systemet skiller mellom bruker og moderator. Moderatorrettigheter blir kontrollert på serveren, ikke bare skjult i grensesnittet.

**Konsekvenser (testbare):**
- En bruker som sender en statusendring direkte til API-et, får avvisning (403).
- Testdataene inneholder minst én moderatorkonto.

### 4.2 Rapportering

#### FR-3: Registrere rapport
En innlogget bruker kan registrere en rapport med beskrivelse, lokasjon (tekst eller adresse), kategori og et valgfritt bilde. Realiserer UJ-1.

**Konsekvenser (testbare):**
- En rapport uten beskrivelse eller lokasjon blir avvist med en tydelig feilmelding.
- En rapport uten bilde blir lagret.
- Bilder over en fast grense, eller i andre filformater enn de tillatte, blir avvist [ANTAGELSE: 5 MB, JPEG/PNG/WebP].
- Brukeren får en kort påminnelse om å unngå ansikter og bilskilt før opplasting.
- Etter innsending vises rapporten i lista med status **Ny**.

#### FR-4: KI-forslag for kategori og oppsummering
Systemet foreslår kategori og en kort oppsummering ut fra beskrivelsen. Forslaget vises før innsending. Realiserer UJ-1.

**Konsekvenser (testbare):**
- Den foreslåtte kategorien er alltid en av de fem faste. Et ugyldig svar fra modellen gir «ingen forslag».
- Brukeren kan overstyre både kategori og oppsummering.
- Svarer ikke KI-en, feiler den eller tar for lang tid [ANTAGELSE: over 5 sekunder], kan rapporten fortsatt sendes inn med manuelt valgt kategori og uten oppsummering.
- Uten API-nøkkel går funksjonen i mock-modus, og registreringen virker likevel.

### 4.3 Visning, filtrering og bekreftelse

#### FR-5: Rapportliste og detaljside
Alle kan se en liste over synlige rapporter, der hver rad viser kategori, oppsummering eller beskrivelse, status og antall bekreftelser. Hver rad lenker til en detaljside.

**Konsekvenser (testbare):**
- Skjulte rapporter vises ikke for andre enn moderator.
- Detaljsiden viser alle feltene i rapporten.

#### FR-6: Filtrering og sortering
Lista kan filtreres på kategori og status og sorteres etter dato eller antall bekreftelser.

**Konsekvenser (testbare):**
- Filtrene kan kombineres, for eksempel «Belysning» og «Ny».
- Standard er sortering etter nyeste først.
- Med et kjent testdatasett gir hver kombinasjon av filter og sortering forventet rekkefølge og antall.
- En tom treffliste gir en melding, ikke en blank side.

#### FR-7: Bekrefte rapport
En innlogget bruker kan markere «Jeg har også sett dette» på en rapport som hen ikke har laget selv. Realiserer UJ-2.

**Konsekvenser (testbare):**
- Telleren øker med én.
- Bekrefter samme bruker samme rapport igjen, avvises det, også når kallet går direkte til API-et.
- Rapportøren kan ikke bekrefte sin egen rapport.

### 4.4 Moderering og statusflyt

#### FR-8: Endre status
Moderator kan flytte status ett steg om gangen, fram eller tilbake: Ny ↔ Under behandling ↔ Løst. Realiserer UJ-3.

**Konsekvenser (testbare):**
- Hopp direkte fra Ny til Løst, eller fra Løst til Ny, blir avvist.
- Andre brukere ser den nye statusen neste gang de laster siden. Sanntid er ikke et krav.
- Alle andre enn moderator blir avvist (se FR-2).

#### FR-9: Skjule og vise rapport
Moderator kan skjule en rapport, for eksempel fordi den viser personer eller bilskilt, eller fordi den er upassende. Moderator kan også vise den igjen. Realiserer UJ-3.

**Konsekvenser (testbare):**
- En skjult rapport forsvinner fra lista og detaljsiden for alle andre enn moderator.
- Moderator ser skjulte rapporter, merket som skjult, og kan vise dem igjen.
- Ingenting blir slettet.

## 5. Eksplisitte ikke-mål

- LocalFix er **ikke** en saksbehandlingsløsning for kommunen.
- LocalFix er **ikke** en chat eller et sosialt nettverk.
- LocalFix har **ingen** betaling.
- LocalFix lages **ikke** som native app, bare som responsiv webapp/PWA.

## 6. MVP-omfang

### 6.1 I omfang (v1)
- Konto, innlogging og roller (FR-1, FR-2)
- Registrere rapport med KI-forslag og fallback (FR-3, FR-4)
- Liste, detaljside, filtrering og sortering (FR-5, FR-6)
- Bekreftelse, én per bruker (FR-7)
- Statusflyt og skjuling for moderator (FR-8, FR-9)

### 6.2 Ute av omfang for v1
- Integrasjon med kommunen, betaling, chat og native apper
- Avansert kartvisning (en enkel liste er nok)
- Automatisk duplikatsjekk. Den er parkert, se brief-addendumet. Bekreftelse og sortering etter antall bekreftelser dekker det viktigste.
- Varsler (e-post eller push) når status endres
- Sanntidsoppdatering

## 7. Tverrgående ikke-funksjonelle krav

- **NFR-1 Responsivitet:** Kjerneflyten (registrere, se, filtrere, bekrefte, endre status) virker uten horisontal scrolling på mobil (360 px bredde), nettbrett og desktop.
- **NFR-2 Kjørbar for sensor:** Appen kan startes lokalt ved å følge README, uten gruppens nøkler, uten betalte kontoer og uten tilgang til gruppens skytjenester. Lokal database og bildelagring har testdata. KI-funksjonen går i mock-modus når nøkkel mangler.
- **NFR-3 Hemmeligheter:** Ingen nøkler ligger i repoet. Repoet har en `.env.example` med alle variablene appen trenger.
- **NFR-4 Tilgangskontroll:** Alle rettighetsregler (innlogging, én bekreftelse, moderatorhandlinger) håndheves på serveren eller i databasen.
- **NFR-5 Installerbarhet:** Et PWA-manifest gjør at appen kan legges til på hjemskjermen.
- **NFR-6 Ytelse:** Lista med 100 rapporter lastes på under 2 sekunder lokalt [ANTAGELSE].
- **NFR-7 Kostnad:** Utvikling og vurdering skal ikke kreve betalte tjenester. Språkmodellen skal ha et gratisnivå.

## 8. Personvern og vern

- Bilder kan vise personer eller bilskilt. Derfor får brukeren en påminnelse før opplasting (FR-3), og moderator kan skjule rapporter (FR-9).
- Adressen vises slik brukeren skrev den. Brukeren skal skrive et sted, for eksempel «gangveien ved bygg A», ikke en privatadresse [ANTAGELSE: veiledningstekst i skjemaet].
- Innlogging og én bekreftelse per bruker begrenser spam og oppblåste tellere.

## 9. Overflater

- Rapportliste med filter og sortering (forside)
- Rapportdetalj med bekreftelsesknapp, og statuskontroller og skjul-knapp for moderator
- Skjema for ny rapport med KI-forslag
- Innlogging og registrering

Det er ingen egen profilside eller administrasjonsside i v1. Moderatoren gjør alt fra lista og detaljsiden.

## 10. Suksessmetrikker

**Primære**
- **SM-1:** En innlogget bruker kan registrere en rapport, med eller uten bilde, og se den i lista. Validerer FR-3 og FR-5.
- **SM-2:** En annen bruker kan bekrefte rapporten én gang, og et nytt forsøk blir avvist. Validerer FR-7.
- **SM-3:** Bare moderator kan endre status og skjule rapporter, og endringen vises for andre brukere. Validerer FR-2, FR-8 og FR-9.
- **SM-4:** Filtrering og sortering gir forventet resultat på testdatasettet. Validerer FR-6.

**Sekundære**
- **SM-5:** På et testsett med 20 beskrivelser og fasit (4 per kategori) gir KI-en riktig kategori på minst 16. Testsettet ligger i repoet og kan kjøres på nytt. Validerer FR-4.
- **SM-6:** Når KI er av eller ikke svarer, kan en rapport fortsatt registreres. Validerer FR-4.
- **SM-7:** En person som ikke kjenner prosjektet, kan starte appen etter README på en ren maskin. Validerer NFR-2.

**Mot-metrikker**
- **SM-C1:** Mange rapporter er ikke suksess i seg selv. Duplikater og useriøse rapporter teller ikke.
- **SM-C2:** Andelen rapporter som står som «Ny» uten at noen følger dem opp, skal ikke vokse uten at noen merker det. Det er denne fallgruven, «roper i tomrommet», moderatorrollen skal motvirke.

## 11. Åpne spørsmål

1. **Hvilken språkmodell og hvilken leverandør?** Leverandøren må ha et gratisnivå (NFR-7), slik faglæreren ba om. Gjeldende gratisvilkår sjekkes, og leverandøren velges i arkitekturfasen (`bmad-architecture`). KI-testsettet (SM-5) brukes til å bekrefte at valget når minst 16 av 20.

**Avgjort 2026-10-11:**
- **Hvordan blir noen moderator?** Hver bruker har en rolle, og «bruker» er standard. Testdataene oppretter én ferdig moderatorkonto, som README oppgir innloggingen til, så sensor kan teste moderatorflyten med én gang. En ekte bruker gjøres til moderator direkte i databasen, og README beskriver hvordan. Det er ingen side for å administrere moderatorer i v1, og en bruker kan aldri endre sin egen rolle.

## 12. Antagelsesindeks

- FR-3: Grensen for bilder er 5 MB, og tillatte formater er JPEG, PNG og WebP.
- FR-4: KI-kallet får tidsavbrudd etter 5 sekunder.
- §8: Skjemaet har veiledningstekst om å skrive et sted, ikke en privatadresse.
- NFR-6: Lista med 100 rapporter lastes på under 2 sekunder lokalt.

Antagelsene fra 18. september om rapportørstyrt status, ingen moderering, KI-mål på over 70 % og Supabase gratisnivå er erstattet. Begrunnelsen står i `.memlog.md`.
