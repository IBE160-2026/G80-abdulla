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

## 2026-11-16 kl. 17:44 — Ali Yousef Abdulla

### Oppgave
Finne ut hva som gjenstår for Story 2.5 (`/bmad-help`), sjekke Cloudflare-401-en, og kjøre code review av PR #57 før den flettes. Etterpå sjekke at alt i PR-en stemmer, og committe og pushe review-rettelsene.

### Plan
- `bmad-help`: lese sprintstatus, PR og logger, og anbefale neste steg.
- Cloudflare-401: lese koden (`lib/ai/openai.ts`, `vitest.config.ts`, `evals/sm5/`) og sjekke token og konto-ID uten å vise nøkkelen.
- `bmad-code-review` av PR #57 med fire underagenter (Blind Hunter, Edge Case Hunter, Verification Gap, Acceptance Auditor), triage mot koden, funnene i spec-en (`### Review Findings`) og utsatte punkter i `docs/implementation-artifacts/deferred-work.md`.
- Rette patchene, kontrollere PR #57 (CI, konflikter, hemmeligheter, påstandene i PR-teksten), committe og pushe.

### Resultat
- **Cloudflare-401:** koden er riktig (`POST {AI_BASE_URL}/chat/completions` med `Bearer`, riktig adresseform). 401-en kommer fra tokenet eller kontoen. Auto-modus stoppet forsøket på å inspisere selve nøkkelen, og jeg lot det ligge. To `curl`-kommandoer (`/user/tokens/verify` og et kall mot chat-endepunktet, med nøkkelen lest fra `.env.groq`) ble gitt til Ali. De er ikke kjørt ennå, så årsaken er ikke bekreftet.
- **Code review:** 38 funn fra fire reviewere, verifisert mot koden: 1 manglende test, 4 patcher, 1 utsatt (AC 4 og «Ferdig»-definisjonen, sporet i `issues.md`) og 25 avvist. Fire påstander ble motbevist (NFD-testen bruker faktisk dekomponert å, `vite` er deklarert, `.env.groq` er gitignorert, exit 0 er valgt i spec-en). Blind Hunter og Verification Gap var uenige om NFC-testen; bytene ga Verification Gap rett.
- **Test av `vitest.config.ts`:** Ali svarte først «la det stå» (utsatt i `deferred-work.md`), ba så om at testen ble laget. Ny `vitest.config.test.ts` (6 tester). Kontrollert ved å bryte config tre ganger: hver gang feilet nøyaktig én test.
- **Patcher:** (1) `score.ts` gir «kjøringen er ugyldig, ikke målt» ved minst ett kall med `http_401` eller `http_403`, med tre tester (valgt «minst ett» i stedet for «alle feilrader», siden Cloudflare-kjøring 2 hadde et tidsavbrudd blant 401-ene), (2) README og kommentaren i `vitest.config.ts` nevner `.env.local` og de andre `loadEnv`-filene, (3) innrykket i `vitest.config.ts`, (4) styretegnfilteret i `report.ts` (C1, U+2028/2029, dobbeltrettingstegn) med test. Underveis skrev Edit-verktøyet escape-sekvensene som rå linjeskilletegn og ødela regexen; rettet med `sed`.
- **Kontroll av PR #57 (på PR-grenen uten endringene mine, via `git stash`):** `MERGEABLE`/`CLEAN`, ingen konflikt mot `main` (to nye dokumentcommits der), ingen hemmeligheter i diffen eller sporede filer, lint 0 funn, 814 av 814 enhetstester, `npm run build` ok, `eval:sm5` mot mock 17 av 20 med advarselen først og sist. Ingen CI-sjekker rapportert på grenen.
- **Etter rettelsene:** lint 0 funn, `tsc --noEmit` rent, 828 av 828 enhetstester (72 filer).
- **Commit og push:** `3d8d1db` «Story 2.5: rettelser etter code review av PR #57» (ni filer), pushet til `story/2-5-velge-ki-leverandor`. Loggcommiten `b11ccb4` (økten 2026-11-10, Cloudflare-401) fulgte med i pushen. PR-beskrivelsen er oppdatert: to review-runder, 828 bestått, Cloudflare-prøvene, `Refs #33` beholdt. Spec-status `in-review` og sprintstatus `review` er uendret, siden AC 4 ikke er oppfylt.
- Spec og `deferred-work.md` har Review Findings og det utsatte AC 4-punktet.

### Åpne punkter
- Rett `http_401`: kjør de to `curl`-kommandoene, rett token og konto-ID, og kjør `npm run eval:sm5 -- --mode groq` på nytt (allerede i `issues.md`).
- Etter vellykket kjøring: resultat og valg i beslutningsloggen (også avklaringene i konsollene), PRD §11 spørsmål 1, Deferred-raden og `.env.example` (allerede i `issues.md`).
- Full `npm test` med kjøretid og README-sjekk på ny klone før flett, og `Closes #33` i siste PR-versjon (allerede i `issues.md`).
- `npm run build` og `npm run eval:sm5` mot mock er ikke kjørt etter review-rettelsene (`3d8d1db`); kjør dem før flett.
- Ingen CI på PR-er: `gh pr checks 57` viser ingen sjekker, så ingenting automatisk bekrefter lint og tester; vurder GitHub Actions.

## 2026-11-18 kl. 10:48 — Ali Yousef Abdulla

### Oppgave
Få en gyldig Cloudflare-måling for SM-5, velge KI-leverandør og føre valget i dokumentene (Story 2.5, PR #57). Startet med `/bmad-help` og en sjekk av PR #57 mot Story 2.5-kriteriene.

### Plan
- Sjekke PR #57 mot akseptansekriteriene (docs, testsett, lint, enhetstester, `eval:sm5` mot mock).
- Teste Cloudflare-tilkoblingen uten å vise tokenet (`/user/tokens/verify` og ett chat-kall), rette `.env.groq` (`AI_PROVIDER`, `AI_MODEL`) og kjøre testsettet for Gemma, `gpt-oss-120b` og `gpt-oss-20b`.
- Finne årsaken til ugyldig svar på sm5-08, teste `max_tokens` og `reasoning_effort` med direkte kall, endre adapteren og kjøre alle tre om igjen.
- Føre resultat og valg i beslutningsloggen, lukke PRD §11 spørsmål 1 (begge kopier), oppdatere Deferred-raden, `.env.example`, README og spec-en.

### Resultat
- **PR-sjekk:** AC 1–3 oppfylt i kode, AC 4 og «Ferdig» ikke (som avtalt i omfang A). Lint 0 funn, 828 enhetstester, `eval:sm5` mot mock ok.
- **Cloudflare:** `.env.groq` hadde plassholder som token (årsaken til 401). Nytt token er gyldig (utløper 2027-02-16), men fila manglet `AI_PROVIDER` og `AI_MODEL`; jeg la til `AI_PROVIDER=openai`. Tokenet er aldri skrevet ut.
- **Før adapterendring:** Gemma 4 26B A4B 1 av 20 (19 tidsavbrudd, den resonnerer ca. 384 tokens), `gpt-oss-120b` 16 av 20 gyldige (to `ugyldig_svar`, to tidsavbrudd), `gpt-oss-20b` 19 av 20 gyldige (sm5-08 `ugyldig_svar`).
- **Årsak til sm5-08:** `content: null` med `finish_reason: "length"` (resonneringen bruker hele tokenbudsjettet). `max_tokens` alene ga 3 til 17 s; `reasoning_effort: "low"` + `max_tokens: 1000` ga 1,3 til 3,5 s i 8 av 8 kall.
- **Adapteren endret** (`lib/ai/openai.ts` og `openai.test.ts`): sender `reasoning_effort: "low"` og `max_tokens: 1000`. Alt kjørt om igjen etter endringen: `gpt-oss-20b` 19 av 20, 20 av 20 gyldige, høyst 2187 og 2780 ms (to kjøringer); `gpt-oss-120b` 18 av 20, 20 av 20, høyst 2000 ms; Gemma 7 av 20, 13 over 5 s.
- **Valg:** Cloudflare Workers AI med `@cf/openai/gpt-oss-20b`. `.env.groq` peker på den. `.env.example` beholder `AI_PROVIDER=mock`, med Cloudflare-verdiene som kommentert eksempel.
- **Dokumenter:** beslutningsloggen (fire nye linjer: adapterendring, resultat, valg, åpent punkt), PRD §11 spørsmål 1 lukket i begge kopier (+ «Endringer 2026-11-18»), Deferred-raden i ARCHITECTURE-SPINE, README (status og SM-5-avsnitt), `.env.example` og spec-en (oppgaver og Spec Change Log).
- **Etter endringene:** lint 0 funn, 828 av 828 enhetstester, ingen token i endrede filer.
- **Commit og push:** `c0b1729` «Story 2.5: valg av KI-leverandør etter SM-5-kjøring mot Cloudflare» (ni filer), pushet til `story/2-5-velge-ki-leverandor` (PR #57). Loggcommiten `6799222` fulgte med i pushen.
- Kjøringene mot Cloudflare sendte bare de 20 oppdiktede testtekstene.
- **Build og full `npm test` (senere samme dag):** `npm run build` ok (15,7 s). `npm test` stoppet på `test:db`: Windows' programkontroll blokkerer `node_modules/@supabase/cli-windows-x64/bin/supabase.exe` («En programkontrollpolicy har blokkert denne filen»). `supabase-go.exe` i samme mappe er ikke blokkert, men kan bare `db diff`, så `SUPABASE_CLI_BINARY_OVERRIDE` hjalp ikke. `test:unit` besto (828 av 828, 9,6 s). `db`, pgTAP og Playwright er ikke kjørt, og databasen er ikke nullstilt. Jeg prøvde ikke å omgå policyen. Ingen kjøretid for full `npm test`.
- **PR #57:** beskrivelsen er skrevet om med valget, SM-5-tabellen over alle kjøringer, adapterendringen og en ærlig testtabell (`db`, pgTAP og Playwright «ikke kjørt», med årsaken). `Refs #33` beholdt.

### Åpne punkter
- Avklaringene fra Cloudflare-konsollen (betalingskort, inferenssted), gratisgrensene hos Groq og Mistral og treningsinnstillingen hos Mistral er ikke gjort; de står som åpent punkt i beslutningsloggen.
- `reasoning_effort` i adapteren er bare sjekket mot Cloudflare; test mot Groq/Mistral hvis de blir aktuelle.
- Full `npm test` med kjøretid, `npm run build` etter adapterendringen og README-sjekk på ny klone gjenstår før Story 2.5 er `done`; bytt til `Closes #33` i PR #57 og sett spec og sprintstatus til `done`.
- Oppsummeringene fra `gpt-oss-20b` er lest av Claude, ikke bekreftet av Ali (små stilfeil, ikke feil språk).
- `supabase.exe` er blokkert av programkontrollen, så `db`, pgTAP og Playwright er ikke kjørt og full `npm test` har ingen kjøretid; det står i `issues.md` og i PR #57.
- **Full `npm test` i GitHub Actions** (branch `ci/npm-test`, arbeidsflyt `.github/workflows/npm-test.yml`, kjøring 44295661997): forsøk 1 feilet på én Playwright-test (`innlogging.spec.ts:44`, axe color-contrast), forsøk 2 besto alt (unit 828, pgTAP 180, db 36, Playwright 192) på 5 min 42 s. Kontrollkjøring på `main` (44296780917, branch `ci/main-kontroll`) feilet også på én test i samme fil (`:98`), så testen er ustabil og feilen er eldre enn Story 2.5. PR #57-beskrivelsen er oppdatert med tallene.
- **CI flettet:** `ci/main-kontroll` slettet (lokalt og på GitHub). PR #58 (`chore/ci-npm-test`, bare `.github/workflows/npm-test.yml`) flettet i `main` som `4ddb3d4` etter ber om det. Arbeidsflyten startes ved push til `ci/**` og manuelt, ikke på alle PR-er. Grenen `ci/npm-test` (med storycommits) er beholdt.
- **Story 2.5 satt til `done`** på Alis uttrykkelige ønske: spec og `sprint-status.yaml` er `done` (epic 2 er `done`), PR #57 bruker `Closes #33`. Åpne punkter som ble igjen med vilje: avklaringene fra Cloudflare-konsollen, README-sjekk på ny klone, `reasoning_effort` mot andre leverandører og oppsummeringene fra `gpt-oss-20b` (alle i `issues.md`). Commit `Story 2.5: satt til done` er pushet til PR #57.
