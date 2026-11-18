---
title: 'Story 3.1: Filtrere og sortere lista'
type: 'feature'
created: '2026-11-18'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'c707ad5a56a775ac46487e11368070255827fe50'
context:
  - '{project-root}/docs/implementation-artifacts/epic-3-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Lista viser alle synlige rapporter nyeste først, så en besøkende kan ikke se om noen allerede har meldt problemet hen ser (FR-6, issue #34, SM-4).

**Approach:** En brikkerad (kategori og status) og en `Select` for sortering over kortene. Valget bor i URL-en (`category`, `status`, `sort`), tolkes bare av `parseListParams` (Zod) og bygges bare av `buildListHref` i `lib/list-params.ts`. Filtrering og sortering skjer i spørringen mot `reports_with_counts`.

## Boundaries & Constraints

**Always:**
- Brikkene er knapper med `aria-pressed`, minst 44 px høye, i en rad som kan rulles sideveis inne i seg selv (siden får ikke horisontal scrolling på 360 px). Rekkefølge: «Alle», de fem kategoriene, de tre statusene (navn fra `lib/labels.ts`). «Alle» er trykket inn når verken kategori eller status er valgt. Sorteringen er en shadcn-`Select` med et tilgjengelig navn, «Nyeste» (standard) og «Flest har sett».
- Ett trykk setter, et annet i samme gruppe bytter ut, et nytt på en aktiv brikke slår av, og «Alle» fjerner kategori og status. Sorteringen og filtrene beholder hverandre. Navigasjon skjer med `router.push(href, { scroll: false })`, og fokus blir på brikken som ble trykket.
- Spørringen filtrerer med `.eq` på `category` og `status` og sorterer `created_at DESC, id DESC` (Nyeste) eller `confirmation_count DESC, created_at DESC, id DESC` (Flest har sett), med `LIST_LIMIT` 500. Ingen filtrering på `hidden` og ingen filtrering eller sortering i TypeScript.
- `buildListHref` gir `/` uten parametre, ellers `?category=…&status=…&sort=…` i den rekkefølgen, og utelater `sort=newest`. Alt i lista (spørring, brikker, `aria-pressed`, tomtilstander, lenker) bygges fra resultatet av parseren. Parseren godtar bare én verdi per nøkkel, og kodeverdiene må være eksakte. Gjentatt nøkkel, tom verdi, feil store og små bokstaver og ukjent sortering gir lista uten den verdien.
- Tomtilstand med aktivt filter: «Ingen rapporter matcher filteret.» og lenken «Nullstill filter», som fjerner kategori og status og beholder sorteringen. Uten filter og uten rapporter beholdes dagens «Ingen rapporter ennå. Har du sett noe som bør fikses?». Antallet («N rapporter») gjelder den filtrerte lista.
- Du-form, ingen utropstegn. Kjør Vitest (`unit`), pgTAP og Playwright, `npm run lint` og `npm run build`. Ferdig som i Epic 2: egen branch, PR med `Closes #34`, testsammendrag med kjøretid.

**Never:**
- Ikke legg til «Mine rapporter» eller `mine` (Story 3.2). Ingen endring av migreringer, seed, `proxy.ts` eller `lib/env.ts`. Ingen mellomlagring av lista (AR-11).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Standard | `/` som besøkende | «Alle» trykket, Nyeste, de åtte synlige seed-rapportene | N/A |
| Filter | `?category=lighting&status=in_progress` | Bare rapport 2, brikkene «Belysning» og «Under behandling» trykket | N/A |
| Flest har sett | `?sort=confirmations` | Rapport 2, 1, 6, 3, 9, 8, 5, 4 (likt antall gir nyeste først) | N/A |
| Ukjent verdi | `?category=Lighting`, `?category=waste&category=lighting`, `?status=`, `?sort=oldest` | Verdien ignoreres, lista som uten den | Ingen feilside |
| Ingen treff | `?category=vandalism&status=resolved` | «Ingen rapporter matcher filteret.» og «Nullstill filter» til `/` (sorteringen beholdes) | N/A |
| Brikkene | Aktiv «Belysning» og trykk den / «Søppel» / «Alle» | Slått av / byttet ut / kategori og status fjernet | N/A |
| Sortering | Filtre aktive, velg «Flest har sett» | Filtrene beholdt, `sort=confirmations` | N/A |

</frozen-after-approval>

## Code Map

- `app/(liste)/page.tsx` -- Server-siden; får `searchParams` (Promise) og kaller `listReports`. Bruker `force-dynamic`.
- `lib/supabase/reports.ts` -- `listReports()` bestiller i dag bare `created_at`/`id`; får parametre. `reports.test.ts` har en falsk kjede (`from`, `select`, `order`, `eq`, `limit`) som må dekke de nye kallene.
- `components/report-list.tsx` -- tomtilstanden og antallet. Kortene ligger i `ul > li > a > div` (`forside.spec.ts` leser `main li > a > div`), så brikkene må ligge utenfor `li`.
- `components/ui/select.tsx` -- shadcn `Select` (brukt i `report-form.tsx`). `lib/labels.ts` -- `CATEGORY_LABELS`, `STATUS_LABELS`; legg til sorteringsnavn her. `lib/supabase/database.types.ts` -- `Constants` for kodeverdiene.
- `e2e/core-flow.spec.ts` -- Tab-løkka over kortene (ca. linje 50) antar at kortene er rett etter menyknappen. `e2e/keyboard.ts` har `tabTo`. `e2e/reset/liste.spec.ts` og `forside.spec.ts` leser lista og `h1`; brikkene skal ikke være en `ul`.
- Seed (`supabase/seed.sql`): åtte synlige rapporter. Bekreftelser: rapport 1 og 2 har to, 3 og 6 én, resten null, så ingen ny seed trengs.

## Tasks & Acceptance

**Execution:**
- [x] `lib/list-params.ts` (+ `list-params.test.ts`) -- `parseListParams(searchParams)` med Zod, `buildListHref`, `hasActiveFilter` og kodelistene; test hver rad i matrisen og lenkene -- eneste tolkning av URL-en (AR-12)
- [x] `lib/labels.ts` -- `SORT_LABELS` for `newest` og `confirmations` -- navn bare ett sted
- [x] `lib/supabase/reports.ts` (+ `reports.test.ts`) -- `listReports(params)` med filtre og sortering -- spørringen bygges fra parseren
- [x] `components/list-filters.tsx` -- klientkomponent med brikkerad og `Select`, `router.push(buildListHref(...))` -- UX-DR7, UX-DR8
- [x] `components/report-list.tsx` og `app/(liste)/page.tsx` -- les `searchParams`, vis filteret og tomtilstanden «Ingen rapporter matcher filteret.» -- UX-DR16
- [x] `e2e/les/filter.spec.ts` -- tabelldrevet test over alle kombinasjoner (kategori, status, sortering) mot en håndskrevet tabell over seed-rapportene, pluss URL-tolkning, `aria-pressed`, tomtilstand, axe og 360 px -- SM-4
- [x] `e2e/core-flow.spec.ts` -- Tab-løkka tar med brikkene og sorteringen, og et steg filtrerer bare med tastatur -- NFR-8
- [x] `README.md` -- statusavsnittet nevner filtrering og sortering -- Story 3.1 er ferdig

**Acceptance Criteria:**
- Given lista med seed-data som besøkende, when brikkeraden og sorteringen vises, then har raden ni brikker og sorteringen to valg, og siden har ikke horisontal scrolling på 360 px mens raden kan rulles inne i seg selv
- Given aktive filtre og tilstanden «Ingen treff», when axe kjøres, then er det ingen funn med alvorlighet «serious» eller «critical»
- Given et valg av filter og sortering, when siden lastes på nytt eller URL-en deles, then gir den samme visning

## Implementation Notes

- Implementert direkte i hovedsesjonen (ingen underagent). `parseListParams` tar bare søkeparametrene (ikke `isSignedIn`), og `toggleFilter`, `clearFilters`, `withSort` og `hasActiveFilter` ligger i `lib/list-params.ts` ved siden av parseren, så komponenten bare kaller rene funksjoner som er testet i Vitest.
- `listReports(params)` legger `.order("confirmation_count")` først bare for «Flest har sett», og `.eq` før sorteringen. `report-list.tsx` får `params` og viser «Ingen rapporter matcher filteret.» når et filter er aktivt og lista er tom.
- Brikkene er en `div role="group"` med knapper og ligger utenfor `ul`, så `main li > a > div` og testen av tom database er uendret. Fokus blir på brikken som ble trykket (`router.push` med `scroll: false`, ingen `loading.tsx` ved bytte av søkeparametre).
- Kjørt lokalt uten Supabase-CLI (`supabase.exe` er blokkert): `next start` mot de kjørende containerne og et midlertidig Playwright-oppsett utenfor repoet. `les-360` og `les-1280`: 120 av 120 bestått (16 nye i `e2e/les/filter.spec.ts`), og kjerneflyttesten i `endrer-360` og `endrer-1280` bestod etter at den sist ventet på valglista før piltastene. Ekstra rapporter fra kjerneflyttesten er slettet fra den lokale databasen, men ett bilde ligger igjen i bucketen (Storage-API-et må brukes for å slette det).
- `npm run lint`: 0 funn. `npm run test:unit`: 876 bestått (74 filer), ingen typefeil. `npm run build`: ok. pgTAP, Vitest `db` og resten av Playwright (`endrer`, `reset`) kjøres i CI.

## Spec Change Log

## Review Triage Log

Gjennomgang 1 (Blind Hunter 11 funn, Edge Case Hunter 3, Verification Gap 0 hull og 1 annet), tre uavhengige underagenter mot diff fra `baseline_commit`. Ingen intent_gap eller bad_spec. Dommene er satt av triagen mot koden, ikke av reviewerne.

| Id | Funn | Dom | Bevis | Rute |
|----|------|-----|-------|------|
| B1/E1 | Raske trykk før serveren har svart bygger på gammel prop, så det første filteret faller bort | medium | Påvist: med serversvaret forsinket 800 ms ga «Belysning» og så «Under behandling» bare `?status=in_progress`. | patch: `useRef` med siste valg i `list-filters.tsx`, og test («to raske trykk …») |
| B2/E2 | Fokusringen på brikkene klippes oppe fordi raden har `overflow-x-auto` og bare `pb-1` | medium | Sant: `overflow-x: auto` gir `overflow-y: auto`, og ring og avstand (2 + 2 px) trenger luft på alle sider. WCAG 2.4.7. | patch: `py-1` |
| B3 | Kategorier og statuser står i én gruppe uten navn, så «Ny» og «Løst» er tvetydige for skjermleser | medium | Sant: ni knapper i én `role="group"`. | patch: to navngitte undergrupper, «Kategori» og «Status», med test |
| B4 | Endringen i lista leses ikke opp | medium | Sant: tellingen og tomtilstanden endres uten `aria-live` eller `role="status"` (WCAG 4.1.3, NFR-8). | patch: `aria-live="polite"` på tellingen og `role="status"` på tomtilstanden |
| E3 | Trykk på en allerede aktiv «Alle» gir en ekstra historikkoppføring | low | Ikke vist. Å legge til en sjekk er mer enn en direkte rettelse og sjelden i bruk. | avvist |
| B5 | `router.push` gir en historikkoppføring per trykk | false | Valgt i spec-en: «Navigasjon skjer med `router.push`», og det står i den frosne blokka. | avvist |
| B6 | `bg-white` på brikken og ingen hint om at raden ruller | low | DESIGN.md sier «kantlinje på hvit bakgrunn», og appen har ikke mørkt tema. Rullehint er ny funksjon. | avvist |
| B7 | Siden viser ikke hvilket filter som er aktivt (h1 og tittel uendret) | low | Aktive brikker og antallet viser det. Ny funksjon, ikke i kravene. | avvist |
| B8 | Ingen komponent- eller integrasjonstest av koblingen i `page.tsx` | false | Dekket av ni e2e-tester per bredde i `filter.spec.ts` og kjerneflyttesten. Prosjektets Vitest kjører i node uten DOM, og komponentlogikken ligger i rene funksjoner som er testet. | avvist |
| B9 | `shownReports` bruker siste tegn i uuid-en, og `reportId` fyller bare ett siffer | low | Sant, bare for rapportnummer over 9. Rettelsen er en linje hver. | patch: siste uuid-del som tall og `padStart(12, "0")` |
| B10 | `labels.ts` importerer en type fra `list-params.ts` | low | Bare en typeimport, ingen syklus. | avvist |
| B11/VG-1 | README-overskriften sier fortsatt «Epic 2» | low | Sant, og rettelsen er ett ord. | patch: «Epic 3» |
| B-ek | Statusavsnittet i README vokser | false | Samme mønster i hver story (avvist som B10 i Story 2.5). | avvist |
| B-log | Ingen sesjonslogg i diffen | false | Loggen skrives ved slutten av økten og er ikke del av koden som gjennomgås. | avvist |

## Design Notes

`parseListParams(searchParams)` tar bare søkeparametrene. Spec-en for arkitekturen (AD) nevner et andre argument `isSignedIn` for `mine`; det legges til i Story 3.2, siden Story 3.1 ikke har `mine` og et ubrukt argument bare gir støy. Typen `ListParams` er `{ category?, status?, sort }`, så 3.2 kan legge `mine` til uten å skrive om parseren.

```
?category=lighting&status=new&sort=confirmations   -> { category: "lighting", status: "new", sort: "confirmations" }
?category=Lighting&sort=oldest                      -> { sort: "newest" }
buildListHref({ sort: "newest" })                   -> "/"
```

## Verification

**Commands:**
- `npm run lint` -- expected: 0 feil
- `npm run test:unit` -- expected: alle bestått, ingen typefeil
- `npm run build` -- expected: bygger
- `npm test` -- expected: Vitest `unit` og `db`, pgTAP og Playwright består (kjøres i CI, siden `supabase.exe` er blokkert lokalt). Skriv kjøretiden i PR-beskrivelsen.
