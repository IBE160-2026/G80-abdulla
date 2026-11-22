# Cloudflare-avklaringer

## 2026-11-22 kl. 15:55 — Ali Yousef Abdulla

### Oppgave
Ta `epic-2-retro-item-7`: føre avklaringene om Cloudflare (betalingskort, inferenssted) og gratisgrensene hos Groq og Mistral i beslutningsloggen før appen eventuelt settes i drift. Kildene er egentlig leverandørenes konsoller, som jeg ikke har tilgang til.

### Plan
- Lese det som står i dokumentasjonen: først den eksisterende researchen (`docs/planning-artifacts/research/technical-ki-leverandor-…`), så nettsøk, og Cloudflares endringslogg og prisside via `web-fetch`-agenten.
- Foreslå en logglinje, og føre den inn etter prosjekteierens godkjenning. Skille klart mellom det som er lest i dokumentasjon og det som må bekreftes i kontoene.

### Resultat
- **Nytt funn:** Cloudflare gjorde fra 2026-07-28 noen modeller betalte på gratisplanen (`403`/`5035`). `@cf/openai/gpt-oss-20b`, som dere bruker, står ikke på listen. Listen er gått fra tre modeller i endringsloggen til ni på prissiden, så modellen kan havne på den senere.
- **Ført i `arkitektur-beslutningslogg.md`** som en `(event)` 2026-11-22: gratisgrensen (10 000 Neurons per dag, feil ved overforbruk), prisen for `gpt-oss-20b` (18 182 og 27 273 Neurons per million tokens inn og ut), Groqs grenser for `openai/gpt-oss-20b` (30 per minutt, 1 000 per dag, 8 000 tokens per minutt, 200 000 per dag), og at Mistral ikke har publiserte grenser utenfor konsollen. `updated` er oppdatert.
- **Ikke avklart:** om Cloudflare ba om betalingskort (produktsiden sier nei, men det er ikke bekreftet i kontoen), hvilken region Cloudflare kjører inferensen i (ikke oppgitt i dokumentasjonen), og Mistrals grenser (Mistral er ikke valgt).
- **Kildekvalitet:** Groq-tallene er fra Groqs dokumentasjon. En tredjepartsside oppgir 14 400 forespørsler per dag, så konsollen er fasit. Nettsøket ga ingen Cloudflare-dokumentasjon om region, bare eldre nyhetssaker fra 2023–24, som jeg ikke har brukt.
- `issues.md`: det åpne punktet om konsollavklaringene er oppdatert, ikke lukket. `sprint-status.yaml`: `epic-2-retro-item-7-…` er `in-progress`.

### Åpne punkter
- Om Cloudflare ba om betalingskort ved registrering: bare prosjekteieren vet det (kontoen eller registreringsflyten).
- Hvilken region Cloudflare kjører Workers AI-inferensen i: må bekreftes hos Cloudflare (vilkår for databehandling og innstillinger for datalokalisering) før appen settes i drift, siden rapportteksten sendes dit (PRD §8).
- Mistrals gratisgrenser står i konsollen. De trengs bare hvis Mistral velges.
- Følg med på om `gpt-oss-20b` havner på listen over modeller som krever Workers Paid.

## 2026-11-22 kl. 16:45 — Ali Yousef Abdulla

### Oppgave
Ta betalingskort-spørsmålet fra `epic-2-retro-item-7`.

### Plan
- Søke i repoet etter et eksisterende svar, og spørre prosjekteieren hvis det ikke fantes. Ikke bruke Cloudflare-nøkkelen i `.env` til å sjekke kontoen.

### Resultat
- Ingen logg, spec eller beslutningslogg sa noe om kortet. Prosjekteieren svarte «ingen kort»: Cloudflare ba ikke om betalingskort, og ingen kort er lagt inn.
- **Ført i `arkitektur-beslutningslogg.md`** som en `(event)` med kilden «oppgitt av prosjekteieren og ikke sjekket i kontoen». `updated` er oppdatert. `issues.md`: punktet om konsollavklaringene er oppdatert, ikke lukket.
- `epic-2-retro-item-7` står fortsatt som `in-progress`.

### Åpne punkter
- Hvilken region Cloudflare kjører Workers AI-inferensen i: må bekreftes hos Cloudflare før appen settes i drift (PRD §8).
- Mistrals grenser står bare i konsollen, og trengs bare hvis Mistral velges.

## 2026-11-22 kl. 17:15 — Ali Yousef Abdulla

### Oppgave
Ta region-spørsmålet fra `epic-2-retro-item-7`: hvor kjører Cloudflare Workers AI-inferensen.

### Plan
- Lese Cloudflares dokumentasjon (datasiden, grensesiden, oversikten, bloggen om «Region: Earth» og produktkompatibilitetstabellen for Data Localization Suite) via `web-fetch`-agenten, og foreslå en logglinje.

### Resultat
- **Regionen er ikke oppgitt** i dokumentasjonen, og kunden kan ikke begrense den: Workers AI er ✘ for Regional Services i kompatibilitetstabellen (endret 2026-11-17) og ✅ bare for Customer Metadata Boundary, som gjelder logger og analyse. Datasiden (endret 2026-10-16) sier at Cloudflare ikke beholder inn- og utdata for vanlige forespørsler og ikke trener på dem. Ruting til et annet land ved full kapasitet er ikke omtalt. Tabellverdiene er lest av agenten fra en gjengivelse av siden og ikke sjekket visuelt.
- **Ført i `arkitektur-beslutningslogg.md`** som en `(event)` etter at prosjekteieren godkjente ordlyden. `updated` er oppdatert. `issues.md` er oppdatert.
- `epic-2-retro-item-7` står fortsatt som `in-progress`. Prosjekteieren har ikke svart på om det skal settes til `done`.

### Åpne punkter
- Skal `epic-2-retro-item-7` settes til `done`? Alle punktene er ført med kilde, men Mistrals faktiske grenser er ikke lest fra konsollen (Mistral er ikke valgt).
- Før drift (PRD §8): velg en leverandør med dokumentert region, eller godta at regionen er ukjent og si det til brukerne.

## 2026-11-22 kl. 17:30 — Ali Yousef Abdulla

### Oppgave
Sette `epic-2-retro-item-7` til `done`, etter prosjekteierens ord.

### Resultat
- `sprint-status.yaml`: `epic-2-retro-item-7-…` er `done` (satt med `sprint_status.py`). PR #95 (region for Workers AI) er flettet (`ee24f25`).
- `issues.md`: punktet om konsollavklaringene er lukket med forbehold om at Mistrals faktiske grenser ikke er lest fra konsollen (Mistral er ikke valgt). Det eldre punktet fra 2026-10-28 om Cloudflare, Groq, Mistral og Gemini står åpent med et notat: Gemini-grenser og EuroEval er ikke gjort og ikke nødvendige.
- Alle action items fra Epic 1, 2 og 4 er `done`, unntatt `epic-4-retro-item-12` (README på en annen maskin, `in-progress`).

### Åpne punkter
- Region for Workers AI må vurderes før drift (PRD §8): velg en leverandør med dokumentert region, eller godta at regionen er ukjent og si det til brukerne.
- Følg med på om `gpt-oss-20b` havner på Cloudflares liste over modeller som krever betalt plan.
