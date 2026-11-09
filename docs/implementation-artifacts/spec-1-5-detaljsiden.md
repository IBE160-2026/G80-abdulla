---
title: 'Story 1.5: Detaljsiden'
type: 'feature'
created: '2026-11-09'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '2cfd75ff127ecbda8c433b31ae72eeba742ae53f'
context:
  - '{project-root}/docs/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Kortene i lista lenker til `/rapporter/<id>`, men siden finnes ikke og gir Nexts engelske 404. En besøkende kan ikke se hele rapporten eller når den sist ble oppdatert (issue #26, FR-5, FR-8, UX-DR13).

**Approach:** En Server Component på `app/rapporter/[id]/page.tsx` validerer id-en med Zod, leser én rad fra `reports_with_counts` med `REPORT_COLUMNS` og viser alle feltene etter EXPERIENCE.md og mockupen `docs/ux/mockups/detalj.html`. En ugyldig id, en id som ikke finnes, og en skjult rapport gir `notFound()` og en norsk 404-side. «←» i topplinja gjør det samme som nettleserens tilbakeknapp.

## Boundaries & Constraints

**Always:**
- Siden er `force-dynamic` og leser bare med brukerens sesjon (`lib/supabase/server.ts`). Det er RLS som skjuler rapporter, så appen filtrerer aldri på `hidden`.
- Id-en valideres med Zod (`z.uuid()`) før noe kall til databasen. En ugyldig id gir `notFound()` uten databasekall.
- Komponentene får typen `Report` og importerer verken `lib/supabase/` eller `lib/ai/` (`import type` er unntatt).
- Rapporttekst vises som ren tekst, aldri med `dangerouslySetInnerHTML`. Beskrivelsen bevarer linjeskift (`white-space: pre-line`), og lange ord brytes (`overflow-wrap: anywhere`).
- Tidspunkt formateres bare i `lib/format.ts`, med `timeZone: "Europe/Oslo"`. Norske navn kommer bare fra `lib/labels.ts`.
- `e2e/core-flow.spec.ts` bruker bare tastaturet etter første `goto`, uten `skip` og `fixme`.

**Never:**
- Ingen bekreftknapp (Story 3.3), ingen moderatorpanel eller merkelappen «Skjult» (Story 4.1 og 4.2), ingen bilder eller bildeoppslag (Story 1.6 og 1.7) og ingen meny i topplinja (Story 2.1).
- Ingen endring i migreringene, RLS, `supabase/seed.sql` eller `supabase/config.toml`.
- Ingen `'use cache'`, `unstable_cache` eller `fetch`-cache, og ingen nye npm-avhengigheter.

**Beslutning (2026-11-09): topplinja.** Spesifikasjonen går foran mockupen («← Rapport»). Topplinja beholder «LocalFix · Campus Molde». På detaljsiden (og 404-siden under `/rapporter/`) står en «←»-lenke foran, med `aria-label="Tilbake til lista"`. Kommer brukeren fra en side i appen, går lenken ett steg tilbake i historikken (`router.back()`). Ellers, for eksempel ved en delt lenke, går den til `/`. Uten JavaScript er den en vanlig lenke til `/`.

**Beslutning (2026-11-09): «Sist oppdatert».** Formatet er «Sist oppdatert 4. november kl. 14:20», fra `status_changed_at`, uten årstall, som i akseptansekriteriet.

**Beslutning (2026-11-09): telleren.** «N har sett dette», som i EXPERIENCE.md. Mockupens «Har sett dette: N» brukes ikke.

**Beslutning (2026-11-09): overskriften.** `h1` er oppsummeringen. Mangler den, er `h1` kategorinavnet fra `lib/labels.ts`, for eksempel «Skadeverk». Beskrivelsen står alltid som eget avsnitt under.

**Beslutning (2026-11-09): registreringstidspunktet.** «Registrert 20. oktober kl. 10:15», fra `created_at`, i samme format som «Sist oppdatert».

**Beslutning (2026-11-09): norsk feilside.** `app/error.tsx` tas med og gjelder alle sider. Den viser «Noe gikk galt. Prøv igjen.», knappen «Prøv igjen» (`reset`) og en lenke til lista. Den logger ingenting selv, fordi serveren allerede har logget feilkoden.

**Beslutning (2026-11-09):** Spec-en beholdes samlet (≈ 3 300 tokens), fordi Story 1.5 er én issue, én branch og én PR.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Synlig rapport | `anon`, rapport 2 (`in_progress`, statusen endret 23.10. 09:00Z) | Alle feltene, «Sist oppdatert 23. oktober kl. 11:00», «3 har sett dette» | N/A |
| Aldri ny status | Rapport 1 (`new`, 20.10. 08:15Z) | «Sist oppdatert 20. oktober kl. 10:15», det samme som registreringstidspunktet | N/A |
| Vintertid | Rapport 8 (statusen endret 3.11. 12:00Z) | «Sist oppdatert 3. november kl. 13:00» | N/A |
| Skjult rapport | `anon`, rapport 7 | 404 med «Fant ikke rapporten.» og lenke til `/` | `notFound()` |
| Finnes ikke | Gyldig uuid uten rad | 404, som over | `notFound()` |
| Ugyldig id | `abc`, `123`, uuid med ett tegn for mye | 404, som over, uten databasekall | Zod, så `notFound()` |
| Rapport 5 | Linjeskift, lang URL, `<b>`/`<script>` som tekst, ingen oppsummering | Linjeskiftene vises, ren tekst, ingen horisontal scrolling på 360 og 320 px | N/A |
| Databasefeil | Supabase svarer med feil | Den norske feilsiden fra `app/error.tsx`. Bare feilkoden logges | `console.error(code)`, `throw` |
| Rapport 4 | `summary` er `NULL` | `h1` «Skadeverk», beskrivelsen under | N/A |

</frozen-after-approval>

## Code Map

- `app/page.tsx`, `app/loading.tsx`, `app/loading.test.ts` -- lista og Skeleton-kortene. `app/loading.tsx` er en Suspense-grense rundt alle sider. Den må flyttes til gruppen `app/(liste)/` sammen med `page.tsx` og testen. Ellers viser detaljsiden lista sine Skeleton-kort mens den laster, og `notFound()` gir status 200 i stedet for 404, fordi svaret allerede strømmes. Flyttingen løser også det åpne punktet fra Story 1.4 om `/auth/*`. URL-en `/` endres ikke.
- `lib/supabase/reports.ts` `listReports()` -- mønsteret for spørringen og feilhåndteringen (`error.code || "ukjent"`, `console.error(code)`, `throw`). Legg `getReport(id)` ved siden av: `.eq("id", id).maybeSingle()`, som gir `Report | null`.
- `lib/supabase/reports.test.ts` -- falsk klient som husker kjeden. Utvides med `eq` og `maybeSingle`.
- `lib/supabase/types.ts` -- `Report`, `REPORT_COLUMNS`. Endres ikke.
- `lib/format.ts` -- `formatRelativeTime` og `formatReportCount`. Legg til `formatDateTime(iso)` med `Intl.DateTimeFormat("nb-NO", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Oslo" })`, satt sammen fra `formatToParts` som `${day}. ${month} kl. ${hour}:${minute}`, så en annen ICU-versjon ikke endrer teksten. Node 24 ga «4. november kl. 14:20» og «1. juli kl. 09:05».
- `components/site-header.tsx` -- Server Component i `app/layout.tsx`. Får en liten klientkomponent `components/back-link.tsx` (`usePathname`, `useRouter`) som vises når stien starter med `/rapporter/`.
- `components/status-badge.tsx`, `lib/labels.ts` -- gjenbrukes.
- `lib/no-cache.test.ts` -- sjekker `force-dynamic` i `app/page.tsx`. Endres til `app/(liste)/page.tsx` og `app/rapporter/[id]/page.tsx`.
- `e2e/les/forside.spec.ts` -- mønsteret for uuid-sjekken i HTML og RSC (`RSC: 1`, `text/x-component`) og for `no-store`. Seed-forfatterne er `10000000-…-000000000002` og `-000000000003`.
- `e2e/keyboard.ts` `tabTo`, `e2e/a11y.ts`, `e2e/layout.ts` -- gjenbrukes. `e2e/core-flow.spec.ts` slutter med fokus på kort 8 (rapport 1).
- Zod 4.6.7 er installert. `z.uuid()` godtar seed-id-ene og avviser `abc`.
- `docs/ux/EXPERIENCE.md` og kopien i `docs/planning-artifacts/ux-designs/ux-LocalFix-2026-10-11/` -- beslutningene føres inn i begge.

## Tasks & Acceptance

**Execution:**
- [x] `app/(liste)/page.tsx`, `app/(liste)/loading.tsx`, `app/(liste)/loading.test.ts` -- flyttes med `git mv`, uten andre endringer -- Code Map
- [x] `lib/report-id.ts` + `lib/report-id.test.ts` -- `parseReportId(value): string | null` med `z.uuid()`. Testen dekker gyldig, `abc`, tom streng, for lang og store bokstaver -- AR, Server Actions i Story 3.3 bruker den også
- [x] `lib/format.ts` + `lib/format.test.ts` -- `formatDateTime(iso)`. Testen dekker vintertid (3.11. 12:00Z gir 13:00), sommertid (23.10. 09:00Z gir 11:00), døgnskifte i norsk tid (31.12. 23:30Z gir «1. januar kl. 00:30») og eksemplet «4. november kl. 14:20»
- [x] `lib/supabase/reports.ts` + test -- `getReport(id)`: spørringen, `null` når raden mangler, og bare feilkoden logges ved feil
- [x] `components/back-link.tsx`, `components/site-header.tsx` -- «←» etter beslutningen om topplinja. Trykkflaten er minst 44 px, med synlig fokus
- [x] `components/report-detail.tsx` -- overskriften, kategori og statusmerke, «Sist oppdatert», beskrivelsen, «Hvor», «Registrert» og «N har sett dette», etter beslutningene
- [x] `app/error.tsx` + `app/error.test.ts` -- klientkomponenten etter beslutningen om feilsiden. Testen sjekker teksten, knappen og lenken med `renderToStaticMarkup`
- [x] `app/rapporter/[id]/page.tsx` -- `force-dynamic`, `parseReportId`, `getReport`, `notFound()`, `metadata.title` «Rapport · LocalFix»
- [x] `app/rapporter/[id]/not-found.tsx` -- `h1` «Fant ikke rapporten.» og lenken «Tilbake til lista» til `/`
- [x] `lib/no-cache.test.ts` -- de nye stiene, og `force-dynamic` på begge sidene
- [x] `e2e/les/detalj.spec.ts` -- radene i matrisen, med status 404 for de tre 404-radene. Rapport 5: ingen `b`- eller `script`-element, beskrivelsen har `white-space: pre-line` og er høyere enn tre linjer, og på 360 og 320 px er `scrollWidth <= clientWidth` både på avsnittet og på siden (det åpne punktet fra Story 1.2). HTML og RSC har verken `author_id`, `user_id`, `image_path` eller forfatter-uuid-ene. `Cache-Control` har `no-store`. axe på detaljsiden og 404-siden. «←» etter trykk på et kort gir `/`, og `goForward()` gir detaljsiden igjen. «←» etter direkte `goto` gir `/`
- [x] `e2e/core-flow.spec.ts` -- Enter på kort 8 åpner rapport 1. Sjekk `h1`, axe og bredden. Så `tabTo` «Tilbake til lista» og Enter, og lista vises igjen
- [x] `README.md` -- status for Story 1.5
- [x] `docs/ux/EXPERIENCE.md` + kopien -- beslutningene om topplinja og detaljsiden

**Acceptance Criteria:**
- Given seed-dataene og Supabase i gang, when `npm test` kjøres, then består Vitest, pgTAP og alle Playwright-prosjektene, og axe gir 0 funn med `serious`/`critical`.
- Given detaljsiden på 360 og 1280 px, when den vises, then har den maks 640 px bredde, 16 px marg, statusmerket med tekst og «Sist oppdatert» rett under statusmerket.
- Given lista, when brukeren åpner et kort og laster siden, then vises ikke lista sine Skeleton-kort på detaljsiden.

## Implementation Notes

- `app/error.tsx` bruker `retry`, ikke `reset`. I Next 16.3 og nyere henter `retry()` siden på nytt fra serveren, mens `reset()` bare tegner den feilede siden på nytt uten å hente den (`node_modules/next/dist/docs/.../error.md`). En databasefeil i en Server Component ville da kommet tilbake med en gang. Knappen og teksten er som i beslutningen.
- `formatDateTime` har `hourCycle: "h23"` i tillegg til valgene i Code Map, så midnatt alltid blir «00» og aldri «24», uansett ICU-versjon.
- `parseReportId` gir id-en med små bokstaver. `z.uuid()` godtar store bokstaver, og Postgres finner samme rad, så store bokstaver gir detaljsiden. Story 3.3 kan sammenligne id-ene direkte.
- Rapport 5 ble sjekket på 360 px etter et bygg: siden følger `detalj.html`, med unntakene i beslutningene og uten bilde og bekreftknapp.
- **Lagt til av koordinatoren etter matrisesjekken:** `app/rapporter/[id]/page.test.ts` dekker «uten databasekall» i raden «Ugyldig id». Den mocker `getReport` og `notFound` og sjekker at en ugyldig id aldri slår opp, at en id uten rad gir `notFound()` etter ett oppslag, og at store bokstaver slås opp med små. Raden «Databasefeil» er dekket av `reports.test.ts` (bare feilkoden logges, feilen kastes) og `app/error.test.ts` (den norske feilsiden). En e2e-test med en database som feiler er ikke laget.
- **Verifisert av koordinatoren:** `test:unit` 149/149 uten typefeil, `tsc` og lint er rene. I agentens `npm test` besto alt unntatt ytelsestesten i `reset`, der `db reset` hang i Docker. Den besto ved ny kjøring av prosjektet `reset`.
- **Verifisert etter rettelsene (2026-11-09):** lint og `tsc` er rene. `npm test` ga Vitest `unit` 151/151 uten typefeil, pgTAP 114/114, Vitest `db` 7/7 og Playwright 68 av 69. Den ene som feilet, var «tom database» i `reset`, der `npx supabase db reset` fikk `ETIMEDOUT` i Docker (kjøringen tok 22,7 min mot vanlig ca. 5). Ny kjøring av prosjektet `reset` ga 3/3, og ytelsestesten målte 505 ms for 108 rapporter.

## Spec Change Log

## Review Triage Log

Gjennomgang 1 (2026-11-09). Kilder: B = blind-hunter, E = edge-case-hunter, V = verification-gap.

| # | Funn | Vurdering | Begrunnelse | Rute |
|---|------|-----------|-------------|------|
| V3, B1, E1, E2, E9 | Telleren i `back-link.tsx` teller også tilbake og fram i nettleseren. Følger du en delt lenke, så logoen og så nettleserens tilbakeknapp, sender «←» deg ut av appen | medium | Bekreftet: effekten øker `pages` for hver `pathname`-endring, også ved `popstate`. Resultatet er 3 > 1, så `router.back()` går til siden før den direkte lenken. Det strider mot beslutningen om topplinja (direkte lenke gir `/`). Årsaken er telleren i Design Notes. Rettingen ligger i én fil uten nytt API: dybden lagres i `history.state`. Next tar vare på egne felt (`app-router.js` kopierer `__NA` og treet), så den ble rutet som patch og ikke som full tilbakeføring | patch |
| V1, B4 | Ingen test sjekker at «Prøv igjen» kaller `retry` | medium | Fra V (forhåndsverifisert): `error.test.ts` lager statisk markup med en stub som aldri sjekkes. En manglende `onClick` eller `reset` ville bestått. B sitt delpunkt om «Next 16.3» i kommentaren er feil, for `retry` kom i 16.3 og 16.4.5 har den | patch |
| V2 | Ctrl-, Cmd- og midtklikk på «←» er ikke testet | low | Fra V (forhåndsverifisert): ingen test bruker modifikatortaster. Rettingen er én Playwright-test | patch |
| B14 | Hodekommentaren i `lib/format.ts` har en linje over 80 tegn og en setning om `now` som ikke gjelder `formatDateTime`. `lib/report-id.ts` har også en lang linje | low | Bekreftet. Direkte retting | patch |
| E3 | «←» går tilbake også når forrige side i appen ikke er lista, for eksempel innloggingen | low | Kan ikke skje i dag, for bare kortene i lista lenker til `/rapporter/<id>`. Det kan skje når Story 2.2 (detaljsiden etter innsending) og Story 3.3 (innlogging og tilbake) kommer | defer |
| B2, E8 | `/foo`, `/rapporter` og `/rapporter/<id>/x` gir fortsatt Nexts engelske 404, og på `/rapporter/…` står «←» i topplinja | low | Bekreftet, men problemet fantes før storyen for alle ukjente URL-er. Intensjonen gjelder rapportlenkene, og de gir den norske 404-siden. Rettingen er en ny `app/not-found.tsx` | defer |
| B3, E7 | Ingen `app/global-error.tsx`, så en feil i `app/layout.tsx` gir Nexts engelske side | low | Layouten og topplinja leser ingen data og kaster ikke i dag. Lite sannsynlig, og rettingen er en ny fil. Avvist | avvist |
| B5 | Den frosne beslutningen sier `reset`, mens koden bruker `retry`, og Spec Change Log er tom | low | Bekreftet avvik. `retry` er det som oppfyller «Prøv igjen» (henter siden på nytt, `error-boundary.js:43`). Begrunnelsen står i Implementation Notes. Rettingen ville vært å endre spec-en, og den frosne teksten kan bare mennesket endre. Legges fram ved presentasjonen | avvist |
| B6 | `sprint-status.yaml` sier `in-progress` mens spec-en sier `in-review`, og spec-en er ikke med i diffen | false | Steg 5 setter storyen til `review`. Spec-en er utelatt med vilje, fordi den er påstandsfila til edge-case-laget | avvist |
| B7, E5 | Datoene har ikke årstall | false | Den frosne beslutningen om «Sist oppdatert» sier uten årstall, som i akseptansekriteriet | avvist |
| B8 | Tidspunktene står ikke i `<time dateTime>` | low | Ikke krav i UX eller spec, og ny markup. Det samme ble avvist i Story 1.4 (B11). Avvist | avvist |
| B9 | En id med store bokstaver gir en ny URL til samme rapport | low | Siden virker, og appen lager bare lenker med små bokstaver. En omdirigering er en ny gren. Avvist | avvist |
| B10 | Vakttesten for `force-dynamic` har en fast liste over sider | low | En ny side som leser visningen, legges i lista i samme story. Å utlede lista er mer kode. Avvist | avvist |
| B11 | E2e-testen venter med `networkidle` | low | Testen kjører mot `next start` og besto. Next gir ikke noe tydelig signal for hydrering, så alternativet er mer kode. Avvist | avvist |
| B12 | 404-fanen får tittelen «Rapport · LocalFix» | maybe-false | Avhenger av om Next bruker sidens statiske `metadata` når `notFound()` kastes. Det ville vært low uansett, så avvist | avvist |
| B13 | De to kopiene av EXPERIENCE.md synkroniseres for hånd | false | Fantes før storyen, og valget av én kilde er et åpent punkt i `issues.md` | avvist |
| E4 | Moderatoren ser en skjult rapport uten merkelappen «Skjult» | false | Never-lista (frosset) legger merkelappen i Story 4.2. RLS virker | avvist |
| E6 | `z.uuid()` avviser uuid-er som Postgres godtar, men som ikke følger RFC | false | `reports.id` har `default gen_random_uuid()` (v4), og seed og fixturer bruker v4-id-er. Ingen rad kan få en id som ikke følger RFC | avvist |

## Design Notes

Routegruppen `(liste)` er valgt framfor en egen `loading.tsx` for detaljsiden. Next sender status 200 når `notFound()` kalles inne i en Suspense-grense som allerede strømmer, og akseptansekriteriet tester 404. Detaljsiden har derfor ingen lastegrense. Ved klientnavigasjon står lista til detaljsiden er klar, noe som går raskt mot lokal database. E2e-testen for status 404 bekrefter valget.

`router.back()` brukes bare når forrige side er i appen. Det avgjøres av en teller i `back-link.tsx` som øker når `usePathname()` endres. Den er 1 etter en direkte innlasting og større etter klientnavigasjon. Da gjør «←» det samme som tilbakeknappen også når Story 3.1 legger filtre i URL-en, og rulleposisjonen blir bevart.

## Verification

**Commands:**
- `npm run lint && npx tsc --noEmit` -- 0 feil
- `npm run test:unit` -- `format`, `report-id`, `reports` og vakttesten består uten Supabase
- `npm test` -- alt består, og PR-en får sammendraget (bestått og axe-funn)

**Manual checks:**
- `npm run dev`, åpne en rapport på 360 px i Chrome: siden ser ut som mockupen `detalj.html`, med unntakene i beslutningene.
