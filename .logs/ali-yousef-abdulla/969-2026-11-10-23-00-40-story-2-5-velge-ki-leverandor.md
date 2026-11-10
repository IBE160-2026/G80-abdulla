# Story 2.5: velge KI-leverandør med SM-5-testen

## 2026-11-10 kl. 23:00 — Ali Yousef Abdulla

### Oppgave
Starte `bmad-build` for Story 2.5 (issue #33): et fast testsett på 20 norske beskrivelser og et skript som kjører det mot leverandørene på kortlista (Cloudflare, Groq, Mistral), så KI-leverandøren velges ut fra målinger og PRD §11 spørsmål 1 kan lukkes.

### Plan
- Spec: [spec-2-5-velge-ki-leverandor-med-sm-5-testen.md](../../docs/implementation-artifacts/spec-2-5-velge-ki-leverandor-med-sm-5-testen.md). Omfang A valgt av Ali: jeg bygger testsett, skript, tester og dokumentasjon, og Ali kjører selve leverandørtesten med egne nøkler og gjør avklaringene i konsollene.
- Skriptet er et eget Vitest-prosjekt `sm5` (`npm run eval:sm5`, `-- --mode <leverandør>` leser `.env.<leverandør>`), uten ny pakke.
- Implementert direkte i hovedsesjonen. Gjennomgang med tre underagenter (blind-hunter, edge-case-hunter, verification-gap), triage i spec-ens Review Triage Log.

### Resultat
- Branch `story/2-5-velge-ki-leverandor`, commit 5628ed2 (lokalt, ikke pushet).
- `lib/ai`: `suggestWithOutcome` (status ok/none/timeout/invalid/error, kort feilkode, svartid), `suggest` er et omslag uten endret oppførsel, `AI_TIMEOUT_MS` i `lib/ai/timeout.ts`.
- `evals/sm5/`: testsett (20, fire per kategori, to tvetydige med begrunnelse), formsjekk, poengsum og avgjørelse (16 av 20, alle gyldige, alle under 5000 ms), språkhint (nynorsk og dansk, bare som merknad), utskrift (mock-advarsel først og sist, bare vert og modell, aldri nøkkel), `run-helpers`, `run.eval.ts` med 2 s pause mot leverandør.
- `vitest.config.ts`: prosjektet `sm5` er bare med når `sm5` står i kommandoen, leser bare `AI_*` og `NEXT_PUBLIC_*`, og stopper hvis `.env.<mode>` mangler eller `--mode` gir mock.
- README (avsnitt «Velge KI-leverandør (SM-5)» og status) og to linjer i arkitekturens beslutningslogg.
- Verifisert: `npm run lint` 0 funn, `npm run test:unit` 814 bestått uten typefeil, `npm run build` ok. `npm run eval:sm5` mot mock (17 av 20 med mock-nøkkelord, advarselen står først og sist), og mot en lokal falsk OpenAI-server (vert og modell vises, nøkkelen ikke). `--mode` med manglende fil og med fil uten leverandør stopper tydelig.
- Gjennomgang: 11 funn rettet (testing av kjøringen, miljølasting, `--mode`, 429-pause, styretegn, språkord, to ikke-bokmål-tekster), 9 avvist (nye funksjoner eller i strid med spec-en). Ingenting utsatt til `deferred-work.md`.
- `bmad-walkthrough` kjørt og endringen godkjent av Ali (2026-11-10), uten flere rettelser. Godkjenningen gjelder verktøyet, ikke valget av leverandør.
- Sprint-status: 2-5 satt til `review`. Spec står som `in-review`, ikke `done`, siden resultat og valg mangler.

### Åpne punkter
- Kjør `npm run eval:sm5 -- --mode <leverandør>` mot hver leverandør du har nøkkel til (Cloudflare, Groq, Mistral), les oppsummeringene for språk, og gi utskriftene til Claude. Før det: avklar i konsollene om Cloudflare krever betalingskort og hvor inferensen kjøres, gratisgrensene hos Groq og Mistral, og at trening er slått av hos Mistral hvis den velges.
- Etter kjøringen: føre resultat og valg i beslutningsloggen, lukke PRD §11 spørsmål 1 (`docs/prd.md` og planleggingskopien), oppdatere Deferred-raden i arkitekturen og `.env.example` (uten nøkkel). Består ingen, står det i loggen at mock er standard.
- Følg README steg for steg på en ny klone i en tom mappe (siste story i Epic 2, SM-7), rett det som ikke virket og skriv resultatet i PR-beskrivelsen. Krever at Docker Desktop virker.
- Full `npm test` (Vitest, pgTAP og Playwright) er ikke kjørt for denne storyen: kjør den én gang før PR og skriv kjøretiden i PR-beskrivelsen (retro-punkt 5).
- Avgjør om du skaffer nøkler og kjører leverandørtesten, eller avslutter storyen med reserven fra planen (alternativ B i spec-en): mock forblir standard, beslutningsloggen sier at testsettet er klart men ikke kjørt, og PRD §11 spørsmål 1 blir stående åpent (FR-4 bare oppfylt med mock). Forklart for Ali etter walkthrough: «leverandørresultatet» er utskriften fra `npm run eval:sm5 -- --mode <leverandør>`, som krever egne kontoer og nøkler.

## 2026-11-10 kl. 23:45 — Ali Yousef Abdulla

### Oppgave
Få Story 2.5 ut som PR og begynne på selve leverandørtesten (SM-5) mot en KI-leverandør.

### Plan
- Pushe grenen og lage PR for Story 2.5 uten å vente på leverandørtesten.
- Anbefale leverandør (Groq først, Cloudflare ved siden av, Mistral bare hvis begge feiler), forklare gratisnivå og oppsett ut fra researchen av 2026-10-28 (`docs/planning-artifacts/research/technical-ki-leverandor-gratisniva-norsk-klassifis-2026-10-28/research.md`).
- Kjøre `npm run eval:sm5 -- --mode groq` når Ali hadde lagt `.env.groq`.

### Resultat
- Grenen `story/2-5-velge-ki-leverandor` var allerede pushet. PR #57 opprettet: https://github.com/IBE160-2026/G80-abdulla/pull/57. Den bruker `Refs #33` (ikke `Closes`) siden leverandørtesten ikke er kjørt, og sier åpent at leverandørtest, README-sjekk på ny klone og full `npm test` ikke er gjort.
- `.env.groq` er dekket av `.gitignore` (`.env.*`, linje 43), og `git status` var ren. Nøkkelen ble ikke lest eller skrevet ut.
- Ali valgte Cloudflare Workers AI i stedet for Groq (filen heter fortsatt `.env.groq`). Modellen er `@cf/openai/gpt-oss-120b`, ikke Gemma 4 26B A4B som PRD §11 nevner.
- To kjøringer av `npm run eval:sm5 -- --mode groq`: 0 av 20, nesten alle kall `http_401` (autentisering), 81–558 ms. Andre kjøring hadde i tillegg én timeout (sm5-10, 5027 ms). Resultatet sier ingenting om modellkvalitet. Ingen kode endret, ingenting nytt å committe utenom loggen.
- Ali avsluttet økten før feilen var rettet.

### Åpne punkter
- Rett `http_401`: lag/rett Cloudflare API-token (tillatelse Workers AI), sjekk kontoens ID i `AI_BASE_URL`, kjør testen på nytt og gi utskriften til Claude.
- Etter vellykket kjøring: føre resultat og valg i beslutningsloggen, lukke PRD §11 spørsmål 1, oppdatere Deferred-raden i arkitekturen og `.env.example` (uten nøkkel). Noter at modellen er `@cf/openai/gpt-oss-120b`, og skriv hvis Groq og Mistral ble utelatt.
- PR #57: full `npm test` med kjøretid og README-sjekk på ny klone er ikke gjort.
