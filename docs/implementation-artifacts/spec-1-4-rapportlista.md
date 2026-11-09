---
title: 'Story 1.4: Rapportlista'
type: 'feature'
created: '2026-11-09'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '48439ebd66469805912fcb0ac590626bd2301267'
context:
  - '{project-root}/docs/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Forsiden er en plassholder («Lista over rapportene kommer snart»). En besøkende ser ingen rapporter, og appen har fortsatt shadcn-standardtemaet (issue #25, FR-5, NFR-6).

**Approach:** Forsiden blir rapportlista: en Server Component leser opptil 500 rader fra `reports_with_counts` med `REPORT_COLUMNS`, nyeste først, og viser dem som rapportkort etter DESIGN.md og mockupen `docs/ux/mockups/liste.html`. Temaet får fargene, typografien og radiusene fra DESIGN.md. Relativ tid lages i `lib/format.ts`. Playwright-prosjektet `reset` får ytelsestesten og testene for tom og avkortet liste.

## Boundaries & Constraints

**Always:**
- Siden er `force-dynamic`, leser bare med brukerens sesjon (`lib/supabase/server.ts`), og sorterer `created_at DESC, id DESC` med `.limit(500)`. Appen filtrerer aldri på `hidden`, det gjør RLS.
- Komponentene får typen `Report`, aldri `ReportRow`, og importerer verken `lib/supabase/` eller `lib/ai/` (selve typen er unntatt, `import type`).
- Rapporttekst vises som ren tekst i React, aldri med `dangerouslySetInnerHTML`. Lange ord brytes (`overflow-wrap: anywhere`), og teksten kuttes etter to linjer (`line-clamp-2`).
- Relativ tid og flertall lages bare i `lib/format.ts`, med `now` som parameter. Norske navn bare fra `lib/labels.ts`.
- `e2e/core-flow.spec.ts` bruker bare tastaturet etter første `goto`, uten `skip` og `fixme`.

**Never:**
- Ingen filter, sortering eller `lib/list-params.ts` (Story 3.1), ingen meny eller innlogging i topplinja (Story 2.1), ingen «Registrer problem» eller FAB (Story 2.2), ingen bildeikon (Story 1.7), ingen merkelapp «Skjult» (Story 4.2) og ingen detaljside (Story 1.5, lenkene går til `/rapporter/<id>` og gir 404 til da).
- Ingen endring i migreringene, RLS eller `supabase/config.toml`. Fixturene endrer aldri `supabase/seed.sql`.
- Ingen `'use cache'`, `unstable_cache` eller `fetch`-cache, og ingen nye npm-avhengigheter utenom shadcn-komponenten `skeleton`.

**Beslutning (2026-11-09): relativ tid** (fra mockupen og epics, ikke presisert i UX):
- Under 60 sekunder, eller fram i tid: «nå».
- Under 60 minutter: «1 minutt siden» / «N minutter siden».
- Under 24 timer: «1 time siden» / «N timer siden».
- Under 7 døgn: «1 dag siden» / «N dager siden».
- Under 30 døgn: «1 uke siden» / «N uker siden».
- Under 365 døgn: «1 måned siden» / «N måneder siden» (30 døgn per måned).
- Ellers: «1 år siden» / «N år siden» (365 døgn per år).
- Alle tall rundes ned.

**Beslutning (2026-11-09): seed-rapport 5.** `summary` settes til `NULL` for rapport 5 i `supabase/seed.sql`, så lista viser beskrivelsen med linjeskift, det lange ordet og HTML-teksten. Ingen andre endringer i seed.

**Beslutning (2026-11-09):** Spec-en beholdes samlet (≈ 3 100 tokens), fordi Story 1.4 er én issue, én branch og én PR.

**Beslutning (2026-11-09): sidens oppbygning** (fra mockupen): topplinja «LocalFix · Campus Molde» er en lenke til `/`, ikke en overskrift. Sidetittelen er `h1` «Rapporter». Under den står antallet («1 rapport» / «N rapporter»). Ved 500 rader står også «Lista viser bare de 500 første rapportene.».

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Besøkende, seed | `anon`, 8 synlige og 1 skjult | 8 kort, nyeste først, rapport 7 vises ikke, «8 rapporter» | N/A |
| Ingen oppsummering | `summary` er `NULL` | Kortet viser `description` | N/A |
| Tom database | 0 rader | «Ingen rapporter ennå. Har du sett noe som bør fikses?», ingen antall | N/A |
| Over grensen | 508 synlige | 500 kort og teksten om avkortet liste | N/A |
| Ytelse | Fixture med 100 ekstra synlige rapporter | Lista er lastet på under 2000 ms mot `next start` | Testen oppgir tiden |
| Tid | `created_at` 30 s fram i tid / 59 s / 61 s / 6 døgn 23 t / 7 døgn siden | «nå» / «nå» / «1 minutt siden» / «6 dager siden» / «1 uke siden» | N/A |
| Databasefeil | Supabase svarer med feil | Next sin feilside. Bare feilkoden logges, aldri rapporttekst | `console.error(code)`, `throw` |

</frozen-after-approval>

## Code Map

- `app/page.tsx` -- plassholderen. Blir lista. `app/layout.tsx` -- `lang="nb"`, bare `children`. Topplinja legges her, så alle sider får den.
- `lib/supabase/server.ts` `createClient()` -- serverklienten med cookie-sesjon. Gjenbrukes.
- `lib/supabase/types.ts` -- `Report`, `ReportRow` og `REPORT_COLUMNS` (literal, så `.select(REPORT_COLUMNS)` gir riktig radtype). Ingen endring.
- `lib/labels.ts` -- `CATEGORY_LABELS`, `STATUS_LABELS`.
- `app/globals.css`, `tailwind.config.ts` -- shadcn-standardverdier (svart `primary`, `--radius: 0.5rem`). Tokens fra `docs/ux/DESIGN.md` (frontmatter): farger som HSL-variabler, statusfarger som egne Tailwind-farger, `borderRadius` sm 6 / md 8 / lg 12 eksplisitt, og fontstørrelsene `title`, `card-title`, `meta` og `badge`. `card` = `surface` #FFFFFF.
- `components/ui/card.tsx` (`rounded-xl shadow`) og `badge.tsx` finnes. Kortet skal ha kantlinje uten skygge. `skeleton` legges til med `npx shadcn@4.23.0 add skeleton`.
- `e2e/les/forside.spec.ts` og `e2e/core-flow.spec.ts` -- venter `h1` «LocalFix · Campus Molde». Oppdateres til topplinjelenken og `h1` «Rapporter».
- `e2e/keyboard.ts` `tabTo(page, role, name)` -- string gir `exact: true`, regex er lov. `e2e/a11y.ts`, `e2e/layout.ts` -- gjenbrukes.
- `playwright.config.ts` -- prosjektet `reset` (`e2e/reset/**/*.spec.ts`, avhenger av `endrer-*`, 1280 px) er tomt og fylles nå. `webServer` kjører `next start` på port 3100.
- `npx supabase db query --local --file <fil>` (CLI 2.122.1) kjører SQL mot den lokale databasen som `postgres`. Brukes til fixturene, uten nye avhengigheter.
- Seed: forfatterne har uuid `10000000-0000-4000-8000-000000000002` og `-000000000003`. Rapport `20000000-...-000000000007` er skjult. `created_at` er faste datoer i oktober og november 2026, så relativ tid testes ikke mot seed.
- `docs/ux/EXPERIENCE.md` og `docs/planning-artifacts/ux-designs/ux-LocalFix-2026-10-11/EXPERIENCE.md` -- to like kopier. Åpent punkt fra `issues.md`: «nå» skal inn i begge.

## Tasks & Acceptance

**Execution:**
- [x] `supabase/seed.sql` -- `summary` `NULL` for rapport 5, og kommentaren oppdateres -- beslutningen
- [x] `app/globals.css`, `tailwind.config.ts` -- temaet fra DESIGN.md, bare lys modus -- UX-DR1, UX-DR2, UX-DR3
- [x] `lib/format.ts` + `lib/format.test.ts` -- `formatRelativeTime(iso, now)` etter beslutningen. Testen dekker alle grensene i matrisen, entall og flertall, og et tidspunkt fram i tid
- [x] `lib/supabase/reports.ts` -- `LIST_LIMIT = 500` og `listReports()`, som returnerer `{ reports: Report[], truncated }` (`truncated` når antallet er lik grensen) -- AR-11, AR-12
- [x] `components/site-header.tsx`, `components/status-badge.tsx`, `components/report-card.tsx`, `components/report-list.tsx` -- topplinja, statusmerket med tekst, kortet som én lenke til `/rapporter/<id>` og lista med antall, avkortingstekst og tomtilstand. Kortene står i en `ul` -- UX-DR4, UX-DR5, UX-DR6, UX-DR16
- [x] `components/ui/skeleton.tsx`, `app/loading.tsx` -- fire Skeleton-kort med samme form som kortene
- [x] `app/layout.tsx`, `app/page.tsx` -- topplinja i layouten. Siden er `force-dynamic` og viser `h1` «Rapporter» og lista
- [x] `lib/no-cache.test.ts` -- vakttest i Vitest som leser kildefilene i `app/` og `lib/` og feiler på `'use cache'` og `unstable_cache`, og hvis `app/page.tsx` mangler `dynamic = "force-dynamic"` -- AR-11
- [x] `e2e/les/forside.spec.ts` -- 8 kort i riktig rekkefølge, ingen skjult rapport, kategori og status med tekst, `seen_count`, lenkene, «8 rapporter», ingen avkortingstekst. Rapport 5 er ren tekst (ingen `b`- eller `script`-element), høyst to linjer høy og uten horisontal scrolling på 360 og 320 px. HTML-en og RSC-nyttelasten (`RSC: 1`) inneholder ingen av forfatter-uuid-ene. `Cache-Control` har `no-store`. axe uten `serious`/`critical`
- [x] `e2e/db.ts`, `e2e/fixtures/*.sql`, `e2e/reset/liste.spec.ts` -- `resetDb()` og `runSqlFile()` med `db query`. Ytelse: reset, 100 rapporter, tiden fra `goto` til alle kortene er synlige er under 2000 ms. Avkortet: 500 ekstra rapporter gir 500 kort og teksten. Tom: bekreftelser og rapporter slettes, og tomtilstanden vises og sjekkes med axe. `afterAll` kjører reset, så databasen har seed-dataene igjen -- NFR-6, AD-15
- [x] `e2e/core-flow.spec.ts` -- med tastaturet: Tab til topplinjelenken og så gjennom alle kortlenkene, og hvert kort har fokus og er synlig. Breddesjekken og axe som før -- AR-14
- [x] `README.md` -- status for Story 1.4, og at `npm run test:e2e` nå også kjører `db reset` i prosjektet `reset`
- [x] `docs/ux/EXPERIENCE.md` + kopien i `planning-artifacts` -- skalaen for relativ tid med «nå», ført inn under rapportkortet

**Acceptance Criteria:**
- Given seed-dataene og Supabase i gang, when `npm test` kjøres, then består Vitest, pgTAP og alle Playwright-prosjektene, også `reset`, og axe gir 0 funn med `serious`/`critical`.
- Given lista på 360 og 1280 px, when den vises, then har den bakgrunnen #F5F7FA, kort med kantlinje, radius 12 px og uten skygge, maks 640 px bredde og 16 px marg, og kortlenkene er minst 44 px høye.
- Given at forsiden laster, when dataene ikke er kommet, then viser `app/loading.tsx` fire Skeleton-kort.

## Implementation Notes

- **Utenfor Code Map, nødvendig for oppgavene:**
  - `lib/supabase/server.ts`: `createServerClient<Database>`, så `.select(REPORT_COLUMNS)` gir radtypen `Report`.
  - `lib/utils.ts` + `lib/utils.test.ts`: `cn()` kjenner fontstørrelsene `title`, `card-title`, `meta` og `badge`. Uten det trodde tailwind-merge at `text-badge` var en farge og fjernet enten størrelsen eller tekstfargen.
  - `eslint.config.mjs`: ignorerer `playwright-report/**` og `test-results/**`. Etter en feilet test ga trace-bundelen 2955 lint-feil. Problemet fantes før denne storyen.
- `npx supabase db query` godtar bare én SQL-setning, så `tom.sql` er én `truncate public.confirmations, public.reports`.
- Next svarer `RSC: 1` med 307 til `/?_rsc`. Playwright følger den, og testen sjekker `text/x-component`, så uuid-sjekken ikke kan bestå på feil svar.
- Tailwinds `shadow-none` gir gjennomsiktige skygger på 0 px i stedet for `none`. Testen godtar begge.
- Ytelsestesten målte 454 ms for 108 rapporter.
- README: forventet tid for `npm test` er nå omtrent fem minutter (4 min 28 s), fordi prosjektet `reset` kjører `db reset` tre ganger til.
- **Lagt til av koordinatoren etter matrisesjekken:**
  - `lib/supabase/reports.test.ts` dekker raden «Databasefeil» (bare feilkoden logges, feilen kastes) og spørringen og `truncated` ved 0, 8, 499 og 500 rader, med en falsk klient.
  - `app/loading.test.ts` dekker AC 3 med `renderToStaticMarkup`: fire kort, `animate-pulse` og `role="status"`. `vitest.config.ts` tar derfor med `app/**/*.test.ts` i prosjektet `unit`.
- **Etter gjennomgangen:** de ni patch-radene er rettet. Nytt: `components/report-card.test.ts` (tiden regnes fra `created_at` og `now`), fargene på statusmerkene i DESIGN-testen, `error.code || "ukjent"`, `timeout` og den opprinnelige feilmeldingen i `e2e/db.ts`, `components/` i vakttesten, at de nyeste beholdes i testen for avkortet liste, og `array_length` i fixturene. `vitest.config.ts` tar med `components/**/*.test.ts`.
- **Verifisert av koordinatoren etter gjennomgangen:** lint og `tsc` er rene. `npm test` (exit 0) ga Vitest `unit` 109/109 uten typefeil, pgTAP 114/114, Vitest `db` 7/7 og Playwright 33/33. Ytelsestesten målte 448 ms for 108 rapporter.
- Kjent: `app/loading.tsx` er lastegrensen for roten og kan blinke kort ved klientnavigasjon til `/auth/*`. Tomtilstanden har bare teksten, og knappen «Registrer problem» kommer i Story 2.2.

## Spec Change Log

## Review Triage Log

Gjennomgang 1 (2026-11-09). Kilder: B = blind-hunter, E = edge-case-hunter, V = verification-gap.

| # | Funn | Vurdering | Begrunnelse | Rute |
|---|------|-----------|-------------|------|
| V1, B10 | Den relative tiden på kortet er ikke testet gjennom `ReportCard` (feltet `created_at` og `now`) | medium | Fra V (forhåndsverifisert): e2e sjekker bare «N har sett dette · », og `format.test.ts` går ikke gjennom kortet. `status_changed_at` i stedet for `created_at` ville bestått | patch |
| V2 | Fargene på statusmerkene er ikke testet | medium | Fra V (forhåndsverifisert): DESIGN-testen leser bare kortet, og axe fanger ikke byttede farger | patch |
| B5, E2 | Feil uten kode gir tom logglinje og «()» i meldingen | medium | Bekreftet: postgrest-js setter `code: ""` når `fetch` feiler (`index.cjs:490`), så nettopp nede-tilfellet blir umulig å feilsøke | patch |
| B7, E5 | `execSync` i `e2e/db.ts` har ingen timeout, så en hengende `db reset` stopper `npm test` for alltid | low | Bekreftet: den synkrone kallet blokkerer, så `test.setTimeout` slår ikke inn. Rettingen er én opsjon | patch |
| E7 | `run()` i `e2e/db.ts` mister den opprinnelige feilmeldingen når selve starten feiler | low | Bekreftet: ved ENOENT er `stdout`/`stderr` tomme og `error.message` brukes ikke. Direkte retting, sammen med timeouten | patch |
| B3, E4 | EXPERIENCE.md sier «litt fram i tid», men koden og beslutningen gir «nå» for all tid fram i tid | low | Bekreftet. Beslutningen i spec-en (fryst) sier «fram i tid», så teksten i EXPERIENCE.md rettes til å stemme | patch |
| B4 | Vakttesten mot cache skanner ikke `components/` | low | Bekreftet. Direkte retting av mønsteret. `fetch`-cache og `revalidate` avvises: appen bruker ikke `fetch` direkte, og vakten ville blitt mer kode | patch |
| B9 | Testen for avkortet liste sjekker ikke at det er de nyeste som beholdes | low | Bekreftet. To linjer i testen (første kort er rapport 9, `Testrapport nummer 492` med og `493` ute) | patch |
| B16 | Fixturene antar fem kategorier (`n % 5`) | low | Bekreftet. Direkte retting med `array_length` | patch |
| B1 | Spec-en er ikke med i diffen | false | Utelatt med vilje: spec-en er påstandsfila til edge-case-laget, ikke koden som gjennomgås | avvist |
| B2 | Sprintstatus `in-progress` og spec `in-review` er ulike | false | Steg 5 i arbeidsflyten setter storyen til `review` | avvist |
| B6, E3 | Ingen `app/error.tsx`, så en databasefeil gir Nexts engelske feilside | false | Matrisen (fryst) sier «Next sin feilside» for databasefeil. En norsk feilside er ny funksjonalitet utenfor intensjonen | avvist |
| E1 | Moderator ser skjult rapport 7 uten merkelappen «Skjult» | false | Never-lista (fryst) legger merkelappen i Story 4.2 (epics l. 1033). RLS virker som den skal | avvist |
| B8 | Testen for avkortet liste kjører en ekstra `db reset` (≈ 30 s) | low | Hver test i `reset` starter fra seed, så ingen avhenger av rekkefølgen (AD-15). Avvist | avvist |
| B11 | Relativ tid mangler `<time dateTime>` | low | Ikke krav i UX eller spec, og det er ny markup. Avvist | avvist |
| B12 | `main`-wrapperen og `h1` står både i `page.tsx` og `loading.tsx` | low | Rettingen er en ny delt komponent. Avvist | avvist |
| B13 | Skeleton kopierer målene på kortet, og `/<li>/g` er skjør | low | Kosmetisk, og testen dekker AC 3. Avvist | avvist |
| B14 | «500 rapporter» ser ut som totalen når lista er avkortet | low | Teksten følger beslutningen om sidens oppbygning (fryst), og avkortingsteksten står rett under. Avvist | avvist |
| B15 | `--radius` er fjernet, `--status-hidden*` er ubrukt, og `--ring`/`--input` er shadcn-standard | false | Ingen komponent i `components/ui/` bruker `var(--radius)`. DESIGN.md sier at `ring` og `input` arver fra shadcn. `hidden` er DESIGN-token for Story 4.2 | avvist |
| E6 | Fixtur-stien kan ødelegges av `$`, `` ` `` eller `%` i stien til klonen | low | Lite sannsynlig, og rettingen er mer enn en direkte endring. Avvist | avvist |

## Design Notes

`truncated` regnes som «antall = 500» og ikke med en ekstra rad eller `count`, fordi arkitekturen sier at lista ber om høyst 500 rader. Med nøyaktig 500 rapporter vises teksten også. Den er formulert så den er sann også da.

Fixturene kjører som `postgres` via `db query`, ikke med tjenestenøkkelen i appen. Det følger AD-11 (tjenestenøkkelen bare i seed og migrering).

## Verification

**Commands:**
- `npm run lint && npx tsc --noEmit` -- 0 feil
- `npm run test:unit` -- `format.test.ts` og vakttesten består uten Supabase
- `npm test` -- alt består, og PR-en får sammendraget (bestått og axe-funn)

**Manual checks:**
- `npm run dev`, åpne `/` på 360 px i Chrome: kortene ser ut som mockupen `liste.html`.
