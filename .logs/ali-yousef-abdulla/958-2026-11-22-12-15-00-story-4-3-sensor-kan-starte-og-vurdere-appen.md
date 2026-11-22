# Story 4.3: Sensor kan starte og vurdere appen

## 2026-11-22 kl. 12:15 — Ali Yousef Abdulla

### Oppgave
Kjøre `bmad-build` for Story 4.3, den siste storyen i Epic 4 og v1: gjøre det mulig for en sensor som ikke kjenner prosjektet å starte appen etter README og vurdere den, med bilder, skjermopptak og en oversikt over hvordan hvert krav er testet. Brukeren skrev «story 4,5», som jeg leste som 4.3 (det finnes ingen 4.5).

### Plan
- Flette PR #73 først (brukerens valg), så ny gren `feat/story-4-3` fra `main`.
- `bmad-build` med underagenter: avklare, planlegge, implementere, så tre review-lag (Blind Hunter, Edge Case Hunter, Verification Gap) og triage.
- Beslutninger fra brukeren: opptak med Playwright, fjerne Vercel-linja, beholde Node 24, beholde hele spec-en.
- Etter review: bruke patchene, pushe, kjøre README i en ny klone og kjøre CI, så PR med `Closes #39`.
- Spec: `docs/implementation-artifacts/spec-4-3-sensor-kan-starte-og-vurdere-appen.md`.

### Resultat
- **README:** Vercel-linja fjernet, status «v1 er ferdig», skjermbilder, seksjonene «Bruke appen», «Som moderator» og «Skjermbilder og skjermopptak», Node 24-advarselen med EBADENGINE-melding og nvm-råd, «Klon til en kort sti på Windows», Docker-reserve og «Forventet tid» med målte tall.
- **`docs/testdekning.md`** (ny): testtypene og 24 rader for FR-1–9, NFR-1–8 og SM-1–7, med hull markert som **Hull**.
- **`scripts/skjermbilde.mjs`** og **`scripts/opptak.mjs`** (nye) med `docs/skjermbilder/liste-360.png`, `detalj-moderator-1280.png` og `kjerneflyt.webm` (90 s, 7,8 MB).
- **Review:** 11 patcher brukt (CI beskrevet riktig, «Hull» presisert, `db reset` før opptaket, 401 for besøkende, `BASE_URL` til origin, melding når opptaket ikke lagres m.m.). Falske og avviste funn ligger i Review Triage Log i spec-en.
- **Klonekjøring** (`git clone` til `C:\Users\ALIYOU~1\AppData\Local\Temp\k43`, commit `b6b42fc`): `npm ci` 63 s, `npx supabase start`, `.env`, `npm test` grønn på 13 min 30 s (1108 Vitest, 53 databasetester, 280 Playwright). Nøkkelen i `.env.example` er lik `PUBLISHABLE_KEY`.
- **CI** (Ubuntu): kjøring 1 (45014135628) feilet på én test: `core-flow.spec.ts` på `/?mine=true` med axe-funnet `document-title`. Ingen app-kode var endret. Tittelen kom etter innholdet etter en klientnavigasjon. Rettet i `e2e/a11y.ts` (venter på ikke-tom tittel, commit `2dd702a`). Kjøring 2 (45015101784) grønn: 280 Playwright-tester, 10 min 52 s totalt.
- **Commits på `feat/story-4-3`:** `cdfe317`, `b6b42fc`, `2dd702a`, `52c90e7`.
- **Lukket i `issues.md`:** nøkkelen i `.env.example`, klonekjøring (Epic 1-retro og story 2.5), W3, kort sti og Linux for `npm test`. `epic-1-retro-item-1` er `done`. Story 4.3 står som `review` i sprintstatusen.

### Åpne punkter
- Rettelsen av `document-title`-feilen er en vurdering, ikke bevist: bare én grønn CI-kjøring etterpå. Feiler `core-flow` med samme melding igjen, se på hva som setter tittelen etter klientnavigasjon.
- Første oppstart fra null er ikke målt: Docker-bildene og Chromium lå på maskinen fra før, og `npm run dev` ble ikke startet for hånd i klonen.
- `npm test` er ikke prøvd på macOS.
- Når PR-en for Story 4.3 er flettet: sett `4-3-sensor-kan-starte-og-vurdere-appen` til `done` i `sprint-status.yaml`, og vurder om `epic-4` skal settes til `done` og retrospektivet kjøres (valgfritt).
