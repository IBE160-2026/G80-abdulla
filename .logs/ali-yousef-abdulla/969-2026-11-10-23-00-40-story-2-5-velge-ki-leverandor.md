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
