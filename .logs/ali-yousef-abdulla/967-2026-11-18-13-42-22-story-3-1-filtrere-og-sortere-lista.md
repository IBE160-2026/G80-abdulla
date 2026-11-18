# Story 3.1: filtrere og sortere lista

## 2026-11-18 kl. 13:42 — Ali Yousef Abdulla

### Oppgave
Bygge Story 3.1 («Filtrere og sortere lista», issue #34, FR-6, SM-4) med `bmad-build`: en brikkerad for kategori og status og en sortering («Nyeste», «Flest har sett») over lista, med valget i URL-en.

### Plan
- Epic 3-konteksten (`epic-3-context.md`) manglet og ble kompilert fra `epics.md`, PRD, arkitektur og UX. Spec: `docs/implementation-artifacts/spec-3-1-filtrere-og-sortere-lista.md` (godkjent av Ali, beholdt på ca. 2 300 tokens).
- Bygge `lib/list-params.ts` (Zod), `listReports(params)`, `components/list-filters.tsx`, tomtilstanden, e2e-test over alle kombinasjoner og utvide kjerneflyttesten.
- Gjennomgang med tre uavhengige underagenter (Blind Hunter, Edge Case Hunter, Verification Gap) etter Alis ja, triage mot koden og patcher.

### Resultat
- **Bygget:** `lib/list-params.ts` med `parseListParams`, `buildListHref`, `toggleFilter`, `clearFilters`, `withSort` og `hasActiveFilter`; `SORT_LABELS`; `listReports(params)` med `.eq` og sortering (`confirmation_count` først for «Flest har sett»); `ListFilters` (klientkomponent, `router.push` med `scroll: false`); tomtilstanden «Ingen rapporter matcher filteret.» med «Nullstill filter»; README-status. Ingen migrering, ingen seed-endring.
- **Tester:** `list-params.test.ts` og utvidet `reports.test.ts`; `e2e/les/filter.spec.ts` (tabelldrevet over 48 kombinasjoner mot en håndskrevet seed-tabell, hånd-lister, URL-tolkning, `aria-pressed`, tomtilstand, axe, 360 px, 44 px, to raske trykk); kjerneflyttesten tar med brikkene og filtrerer og sorterer bare med tastatur.
- **Lokalt (uten Supabase-CLI):** `next start` mot de kjørende containerne og et midlertidig Playwright-oppsett utenfor repoet. `les-360` og `les-1280`: 122 av 122 bestått, kjerneflyten bestod i begge prosjekter, lint 0 funn, 876 enhetstester, `npm run build` ok. Ekstra rapporter fra kjerneflyttesten er slettet fra den lokale databasen.
- **Gjennomgang:** 14 rader i triageloggen. Fire verifiserte patcher og to småting: raske trykk mistet det første filteret (påvist med forsinket serversvar, rettet med `useRef`), fokusringen ble klippet (`py-1`), brikkene fikk to navngitte grupper, endringen i lista leses opp (`aria-live`, `role="status"`), e2e-hjelperne tåler rapportnummer over 9, README-overskriften sier Epic 3. Åtte funn ble avvist med begrunnelse (blant annet `router.push`, som spec-en valgte).
- **Commit:** `d4efe64` «Story 3.1: filtrere og sortere lista» på `story/3-1-filtrere-og-sortere-lista`. Ikke pushet. Spec `done`, sprintstatus `review`.

### Åpne punkter
- pgTAP, Vitest `db`, `endrer`- og `reset`-prosjektene i Playwright og full `npm test` med kjøretid er ikke kjørt (`supabase.exe` er blokkert lokalt): kjør dem i GitHub Actions (push til en `ci/…`-gren eller manuell start) og skriv kjøretiden i PR-en.
- Opprett PR med `Closes #34` og testsammendrag; branchen er ikke pushet.
- Ett testbilde fra de lokale kjøringene ligger igjen i bucketen `report-images` (kan bare slettes via Storage-API-et).
