# Tilbakemelding på product brief

| | |
|---|---|
| **Gruppe** | G80 – G80-abdulla |
| **Product brief** | `product-brief.md` (commit `f38a9fa`) |
| **Tilbakemelding fra** | Faglærer i IBE160 (utarbeidet med KI-støtte) |
| **Dato** | 2026-10-06 |

## Samlet vurdering

- **Godt utgangspunkt med justeringer.** Gruppen kan gå videre og innarbeide punktene under.

**Det som er bra:**

1. Kjerneflyten i LocalFix er tydelig og passe stor: registrere en rapport med bilde, kategori, beskrivelse og adresse, se listen, markere «jeg har også sett dette» og følge statusen Ny → Under behandling → Løst. Den kan beskrives i fire–fem steg og egner seg godt for stories.
2. «Ikke i omfang» er konkret (ingen betaling, ingen kommuneintegrasjon, ingen avansert kartvisning, ingen chat, ingen native apper), og vinklingen nabo-til-nabo i stedet for borger-til-kommune er en tydelig avgrensning.

**De viktigste endringene:**

1. Avklar brukere og roller. Hvem kan endre status fra «Ny» til «Under behandling» og «Løst»: den som rapporterte, alle, eller en egen moderator? Og må man logge inn for å bekrefte en rapport? Uten innlogging kan én person bekrefte samme rapport mange ganger. Dette påvirker datamodell, design og tester.
2. Gjør KI-kriteriet testbart. «KI foreslår kategori korrekt i de fleste tilfeller» kan ikke sjekkes slik det står. Definer kategoriene, lag for eksempel 20 testbeskrivelser med riktig kategori, og sett et mål (for eksempel minst 16 av 20). Beskriv også hva som skjer når KI-en ikke svarer.
3. Planlegg hvordan sensor kan kjøre appen uten deres Supabase-prosjekt og KI-nøkkel. Vurder lokal database og bildelagring, og en mock-modus for kategoriforslaget.

## Vanskelighetsgrad og gjennomførbarhet

### Vurdert vanskelighetsgrad

- **Enkel**

**Sammenlignbart med:** 6) To-do-liste med smarte etiketter (enkel). LocalFix er CRUD på rapporter med én avgrenset KI-funksjon (kategori og oppsummering), som tilsvarer smarte etiketter. Bilder og bekreftelser fra flere brukere gjør prosjektet litt mer omfattende.

**Begrunnelse:**

| Faktor | Nivå (lav / middels / høy) | Kommentar |
|---|---|---|
| Domenelogikk – hvor mange og hvor kompliserte regler og beregninger må stemme? | Lav | Statusflyt med tre trinn og telling av bekreftelser. Få regler. |
| Datamodell – antall entiteter og relasjoner mellom dem | Lav | Rapport, kategori, bekreftelse og eventuelt bruker. |
| Brukere, roller og innlogging | Middels | Ikke beskrevet, men nødvendig for å hindre dobbel bekreftelse og styre hvem som endrer status. |
| KI-funksjonalitet i appen, f.eks. kall til språkmodell, prompts i koden og håndtering av usikre svar | Middels | Kategoriforslag og oppsummering via språkmodell. Krever faste kategorier, validering av svaret og fallback. |
| Integrasjoner og eksterne tjenester, f.eks. API-er, betaling og e-post | Middels | Supabase og et språkmodell-API. |
| Sanntid, samtidighet eller flere brukere som påvirker hverandre | Lav | Flere brukere bekrefter samme rapport, men sanntid er ikke nødvendig. |
| Filhåndtering, f.eks. opplasting, PDF-lesing og eksport | Middels | Bildeopplasting med størrelsesgrense og visning på mobil. |
| Sikkerhet og personvern | Middels | Bilder kan vise personer eller bilskilt, og adresser kan være personopplysninger. Beskriv kort hvordan dette håndteres. |

**Hva vanskelighetsgraden betyr for dere:**

- _Enkel:_ Et enkelt prosjekt gir stor sjanse for å bli ferdig. Vanskelighetsgraden inngår likevel i vurderingen, så for å nå helt opp må dere vise mer i gjennomføringen. Det betyr særlig et gjennomarbeidet design, grundig testing, en tydelig dokumentert prosess og en README som virker.

### Gjennomførbarhet med BMAD og Claude Code

Dere skal planlegge med BMAD (product brief → PRD → arkitektur → epics og stories) og implementere med Claude Code. Vurderingen under tar hensyn til at det må være tid til hele denne flyten, og til testing, retting og README til slutt.

| Spørsmål | Vurdering (OK / risiko / stor risiko) | Kommentar |
|---|---|---|
| **Tid og omfang** – kan v1 realistisk bli ferdig og stabil i løpet av semesteret, med tid til flere iterasjoner? | OK | Fem funksjoner i v1 er realistisk for én person. Det gir rom for grundig testing og design. |
| **BMAD-flyten** – er briefen konkret nok til at PRD, arkitektur og stories kan lages uten store hull, og blir det overkommelig mange stories? | Risiko | Hullet er brukere og roller. Briefen viser også til `addendum.md`, men den fila ligger ikke i repoet. |
| **Egnet for Claude Code** – bruker løsningen en vanlig, godt dokumentert teknologistakk som Claude Code håndterer godt, eller krever den nisjeteknologi, spesialmaskinvare eller mye manuell konfigurasjon? | OK | Next.js med API routes er godt dokumentert og passer Claude Code godt. |
| **Kontroll på KI-ens arbeid** – kan gruppen selv avgjøre om koden gjør det riktige? Krever domenet kunnskap gruppen ikke har, f.eks. avanserte beregninger eller fagregler, så er det vanskelig å kvalitetssikre. | OK | Domenet er hverdagslig, og dere kan selv vurdere om en rapport fikk riktig kategori. |
| **Testbarhet** – finnes det tydelige regler og forventede resultater som tester kan skrives mot? | Risiko | Registrering, liste, bekreftelse og statusflyt er lett å teste. KI-kriteriet trenger et testsett med fasit. |
| **Kjørbar for sensor** – kan appen kjøres lokalt etter README, uten gruppens nøkler, betalte kontoer eller egen infrastruktur? | Risiko | Supabase og språkmodell krever kontoer og nøkler. Planlegg lokal kjøring og mock-modus. |
| **Avhengigheter og kostnader** – krever løsningen betalte API-er, f.eks. språkmodeller, og finnes det en plan for kostnad, testmodus eller mock-data? | Risiko | Det er ikke valgt språkmodell eller beskrevet kostnad. Velg en løsning med gratisnivå, og la appen fungere med manuelt kategorivalg når KI ikke er tilgjengelig. |

**Konklusjon om gjennomførbarhet:**

- **Gjennomførbart som beskrevet.**

**Forslag til justering av omfang eller vanskelighetsgrad:**

1. Legg til én utvidelse som gir mer å vise i funksjonalitet og testing, for eksempel enkel innlogging med én moderatorrolle som kan endre status, eller filtrering og sortering etter kategori, status og antall bekreftelser.
2. Vurder en enkel duplikatsjekk, der appen foreslår eksisterende rapporter med samme kategori og adresse før en ny rapport lagres. Briefen nevner selv duplikater som en kjent fallgruve.

## Hvorfor product brief er viktig for mappen

Product brief er utgangspunktet for PRD, arkitektur, stories og til slutt koden. Del 1 av mappen vurderes blant annet på om sensor kan følge en sporbar vei fra plan til ferdig app. Den vurderes også på om appen gjør det dere har beskrevet, om den er testet, om den er godt designet, og om den kan kjøres etter README. Et uklart, for stort eller for lite brief gjør alt dette vanskeligere senere. Det er mye enklere å rette nå enn sent i semesteret.

## 1. Gjennomgang av briefens deler

| Del av brief | Status | Kommentar |
|---|---|---|
| Executive Summary – er det klart hva appen er, og hvilket problem den løser? | OK | Klart hva LocalFix er, med konkrete eksempler som søppel, gatelys, hull i veien og farlige fortau. |
| The Problem – er problemet konkret, med reelle situasjoner og brukere? | Juster | Problemet er generelt formulert. Gi ett konkret eksempel, for eksempel et ødelagt gatelys på campus som flere ser, men ingen vet om er meldt. |
| The Solution – beskriver løsningen brukeropplevelsen, ikke bare teknologi? | OK | Beskriver hva brukeren gjør: registrere, se, bekrefte og følge status, med KI-forslag til kategori. |
| What Makes This Different – er vurderingen ærlig og realistisk? | Juster | Vinklingen er tydelig, men henvisningen til `addendum.md` peker til en fil som ikke finnes i repoet. Legg den inn eller ta med de viktigste sammenlignbare løsningene i briefen. |
| Who This Serves – er primærbrukerne tydelige, og vet vi hva de trenger? | Juster | «Innbyggere i et lokalmiljø» er bredt. Velg ett lokalmiljø (for eksempel en campus eller et boligområde) og beskriv én typisk bruker. |
| Success Criteria – kan kriteriene faktisk sjekkes eller testes? | Juster | De to første er gode. «De fleste tilfeller», «fungerer godt» og «stabil nok» må gjøres konkrete. |
| Scope – er det klart hva som er med i første versjon, og hva som ikke er det? | Juster | Tydelig inn/ut-liste, men innlogging og roller er verken inne eller ute. Ta stilling til dem. |
| Vision – henger visjonen sammen med resten uten å blåse opp omfanget? | Juster | Briefen mangler en egen visjonsdel. Én kort setning om hvor LocalFix kan gå etter v1 holder. |

## 2. Utgangspunkt for del 1 av mappen

Punktene følger kriteriene i sensorveiledningen for del 1. Vektene i parentes viser hvor mye hvert kriterium teller i del 1.

| Kriterium i del 1 | Hva briefen bør legge til rette for | Status | Kommentar |
|---|---|---|---|
| **1. Prosess og KI-styring** (30 %) | Brief som er presis nok til at PRD og stories kan bygges direkte på den, slik at krav kan spores fra brief til kode. | Juster | Briefen er kort og tydelig. Avklar roller og legg inn addendumet, slik at PRD-en ikke må gjette. |
| **2. Funksjonalitet og omfang** (20 %) | Realistisk omfang for gruppen og semesteret: en tydelig kjerneflyt som kan bli ferdig og stabil, og nok innhold til å vise reell funksjonalitet. | Juster | Realistisk, men i minste laget. En utvidelse som moderatorrolle eller filtrering gir mer å vise. |
| **3. Kvalitetssikring og testing** (15 %) | Suksesskriterier og funksjoner som er konkrete nok til å bli testtilfeller. | Juster | Flere kriterier er testbare. Lag et testsett for KI-kategoriseringen. |
| **4. Design og brukeropplevelse** (10 %) | Tydelige brukere og brukssituasjoner som designet kan bygges rundt, gjerne med de viktigste skjermbildene eller flytene skissert. | OK | Mobile-first med bilde fra telefonen er en tydelig brukssituasjon. Skisser registreringsskjema, liste og detaljside. |
| **5. Kodekvalitet og arkitektur** (10 %) | Teknologivalg som er begrunnet og ikke mer komplekse enn appen trenger. | OK | Én kodebase med Next.js er et fornuftig og enkelt valg. |
| **6. README og kjørbarhet** (10 %) | Løsning som andre kan kjøre lokalt uten betalte kontoer, og uten tilgang til gruppens egne tjenester og nøkler. | Juster | Supabase og KI-nøkkel gjør lokal kjøring vanskeligere. Planlegg alternativ. |
| **7. Ryddighet i repoet** (5 %) | En plan for hvor hemmeligheter, testdata og dokumentasjon skal ligge. | Juster | Planlegg `.env.example`, en mappe for testbilder og testrapporter, og legg planleggingsdokumentene i en egen mappe. |

## 3. Neste steg for gruppen

1. Avklar brukere og roller (innlogging, hvem endrer status, hvordan dobbel bekreftelse hindres), og skriv det inn i Scope.
2. Definer kategoriene og lag et testsett med fasit for KI-forslaget, og beskriv fallback når KI ikke svarer.
3. Legg inn addendumet som briefen viser til, og gå videre til PRD med en plan for lokal kjøring uten deres nøkler.

Oppdater product brief i repoet når dere har gjort endringene, slik at historikken viser hvordan planen utviklet seg. Det er en del av prosessen sensor ser etter.
