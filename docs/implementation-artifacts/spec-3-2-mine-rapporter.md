---
title: 'Story 3.2: «Mine rapporter»'
type: 'feature'
created: '2026-11-18'
status: 'done'
route: 'dispatch'
baseline_commit: '50e67a9cfcd32d3861cec311f6e1063db0f4e292'
review_loop_iteration: 0
context:
  - '{project-root}/docs/implementation-artifacts/epic-3-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** En innlogget bruker kan ikke begrense lista til rapportene hen selv har registrert, så hen finner dem ikke igjen og ser ikke om de er fulgt opp (FR-6, issue #35, SM-4).

**Approach:** Brikken «Mine rapporter» først i brikkeraden, bare for innloggede, med `mine=true` i URL-en. `parseListParams(searchParams, isSignedIn)` gir `mine`, og spørringen filtrerer med `authored_by_me` fra `reports_with_counts`. Tomtilstandene og «Nullstill filter» får en `mine`-gren.

## Boundaries & Constraints

**Always:**
- `ListParams` får `mine: boolean`. `mine` er `true` bare for `mine=true` (nøyaktig én verdi) og innlogget bruker, ellers `false` (besøkende, gjentatt nøkkel, `mine=`, `mine=True`, `mine=1`). `buildListHref` skriver `?category=…&status=…&mine=true&sort=…` i den rekkefølgen og utelater `mine` når den er `false`. `parseListParams` er fortsatt eneste tolkning av URL-en.
- Filteret er `.eq("authored_by_me", true)` mot visningen. Aldri sammenligning av `author_id` i TypeScript, ingen filtrering på `hidden`, ingen ny migrering eller seed. RLS skjuler skjulte rapporter.
- «Mine rapporter» er en brikke med `aria-pressed`, minst 44 px, først i raden foran «Alle», og vises bare når brukeren er innlogget (`getViewer().user`). Trykk setter og slår av. «Alle» fjerner kategori og status men beholder `mine`, og «Alle» er trykket når verken kategori eller status er valgt (som i 3.1). Kategori, status og sortering beholder `mine`, og omvendt.
- Tomtilstand: bare `mine` aktiv og ingen treff gir «Du har ikke registrert noen rapporter ennå.» med knappen «Registrer problem» (`/rapporter/ny`). Er kategori eller status også aktiv, gir den «Ingen rapporter matcher filteret.» og «Nullstill filter». «Nullstill filter» fjerner kategori, status og `mine` og beholder sorteringen. Antallet gjelder den filtrerte lista.
- Du-form, ingen utropstegn. Kjør Vitest (`unit`), Playwright (`les` og `endrer`), `npm run lint` og `npm run build`. Ferdig som i Epic 2: egen branch, PR med `Closes #35`, testsammendrag med kjøretid.

**Never:**
- Ingen bekreftelse eller bekreftelsesknapp (Story 3.3). Ikke endre migreringer, seed, `proxy.ts` eller `lib/env.ts`. Ingen mellomlagring av lista.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Bruker1 | Innlogget `bruker1`, `?mine=true` | Rapport 5, 3, 1 (nyeste først). Den skjulte 7 er ikke med | N/A |
| Bruker2 | Innlogget `bruker2`, `?mine=true&sort=confirmations` | Rapport 2, 6, 9, 8, 4 | N/A |
| Kombinert | `bruker2`, `?category=waste&status=resolved&mine=true` | Bare rapport 6, brikkene «Mine rapporter», «Søppel» og «Løst» trykket | N/A |
| Skjult | `bruker1`, `?category=lighting&mine=true` | Ingen kort (rapport 7 er skjult), «Ingen rapporter matcher filteret.» | N/A |
| Ingen egne | Moderator (ingen rapporter), `?mine=true` | «Du har ikke registrert noen rapporter ennå.» og «Registrer problem» | N/A |
| Besøkende | `/?mine=true` uten innlogging | Som `/`: åtte kort, ingen «Mine rapporter»-brikke | `mine` blir `false` |
| Alle | `?category=waste&mine=true`, trykk «Alle» | `?mine=true`, «Mine rapporter» fortsatt trykket | N/A |
| Nullstill | `?category=vandalism&status=resolved&mine=true&sort=confirmations` | Lenken er `/?sort=confirmations` | N/A |

</frozen-after-approval>

## Code Map

- `lib/list-params.ts` (+ `list-params.test.ts`) -- `parseListParams(searchParams)` tar ikke `isSignedIn` ennå; `ListParams` har ikke `mine`. `clearFilters` gir `{ sort }` og brukes både til «Alle» og «Nullstill filter», så de må skilles (`clearFilters` beholder `mine`, ny `resetFilters` gir `{ mine: false, sort }`). Legg til `toggleMine`. `hasActiveFilter` skal fortsatt bety kategori eller status.
- `lib/supabase/reports.ts` (+ `reports.test.ts`) -- `listReports(params)` legger `.eq("authored_by_me", true)` først når `params.mine`. Den falske kjeden i testen har allerede `eq`.
- `components/list-filters.tsx` -- får `isSignedIn`, «Mine rapporter»-brikke først i `role="group"` «Filtrer rapportene», `go()` med `useRef` beholdes. `Chip` gjenbrukes.
- `components/report-list.tsx` -- tomtilstandene; «Nullstill filter» bruker `resetFilters`. «Registrer problem»-knappen finnes allerede i tomtilstanden for tom database.
- `app/(liste)/page.tsx` -- henter `getViewer()` (`lib/supabase/auth.ts`, `cache()`), gir `isSignedIn` til parseren og `ListFilters`.
- Seed: `bruker1` (`…0002`) har rapport 1, 3, 5 og 7 (skjult); `bruker2` (`…0003`) har 2, 4, 6, 8, 9; moderator, `kjerneflyt360` og `kjerneflyt1280` har ingen. `e2e/auth.ts` har `logIn`. Kjerneflyttestene oppretter rapporter som `kjerneflyt*`, så «ingen egne» testes med moderatoren.
- `e2e/les/filter.spec.ts` -- tabelldrevet fasit (`SEED`, `expectedOrder`, `href`, `expectPressed`) og `/?mine=true` som besøkende i listen over ukjente verdier. `e2e/core-flow.spec.ts` -- Tab-løkka (ca. linje 43–56) er som besøkende, så «Mine rapporter» kommer ikke inn der; linje 213 (reverse fra lista, innlogget) må sjekkes.

## Tasks & Acceptance

**Execution:**
- [x] `lib/list-params.ts` (+ test) -- `mine` i `ListParams`, `parseListParams(searchParams, isSignedIn)`, `buildListHref`, `toggleMine`, `resetFilters`; `clearFilters` beholder `mine` -- eneste tolkning av URL-en (AR-12)
- [x] `lib/supabase/reports.ts` (+ test) -- `.eq("authored_by_me", true)` ved `mine` -- AR-6
- [x] `components/list-filters.tsx` -- «Mine rapporter» først, bare for innloggede -- UX-DR7
- [x] `components/report-list.tsx` og `app/(liste)/page.tsx` -- `getViewer`, `isSignedIn`, tomtilstandene og «Nullstill filter» -- UX-DR16
- [x] `e2e/les/mine.spec.ts` -- tabelldrevet test med `mine` for `bruker1` og `bruker2` over alle kombinasjoner av kategori, status og sortering mot håndskrevet fasit med forfatter, pluss besøkende, skjult rapport, tomtilstandene, «Alle», «Nullstill filter», axe og 360 px -- SM-4, NFR-8
- [x] `e2e/les/filter.spec.ts` og `e2e/core-flow.spec.ts` -- tilpass ved behov, og la det ene steget som er innlogget velge «Mine rapporter» med tastatur -- NFR-8
- [x] `README.md` -- statusavsnittet nevner «Mine rapporter» -- Story 3.2 er ferdig

**Acceptance Criteria:**
- Given en innlogget bruker og en besøkende, when lista vises, then er «Mine rapporter» første brikke bare for den innloggede
- Given en innlogget bruker uten egne rapporter og bare `mine` aktiv, when lista vises og axe kjøres, then står beskjeden og knappen, og det er ingen funn med alvorlighet «serious» eller «critical»
- Given seed-data, when hver kombinasjon med `mine` kjøres som `bruker1` og `bruker2`, then gir hver forventet antall og rekkefølge

## Implementation Notes

- Implementert direkte i hovedsesjonen (ingen underagent). `parseListParams(searchParams, isSignedIn)` gir `mine`, og `clearFilters` («Alle») beholder `mine`, mens `resetFilters` («Nullstill filter») fjerner den. `toggleMine` er ny. `page.tsx` henter `getViewer()` og gir `isSignedIn` til parseren og `ListFilters`. `report-list.tsx` har en egen gren for bare `mine` uten treff.
- `e2e/les/filter.spec.ts` trengte ingen endring: den har allerede `/?mine=true` som besøkende. «Mine rapporter» med tastatur er dekket både i `e2e/les/mine.spec.ts` og som siste steg i `e2e/core-flow.spec.ts` (brukeren som nettopp registrerte en rapport ser bare den, ikke seed-rapportene).
- Moderatoren ser også den skjulte rapport 7, så hens ufiltrerte liste har ni kort. Testen av «ingen egne rapporter» bruker derfor moderatoren og venter ni.
- Kjørt lokalt uten Supabase-CLI (`supabase.exe` er blokkert): `next start` mot de kjørende containerne og en midlertidig Playwright-konfig i repoet, slettet etterpå. `les-360` og `les-1280`: 142 bestått (20 nye i `mine.spec.ts`). `endrer-360` bestod med det nye steget. `endrer-1280` feilet første gang i bildesteget (`waitForEvent("filechooser")`, før det nye steget) og bestod ved ny kjøring: en ustabil test som ikke har med Story 3.2 å gjøre. Kjerneflyt-rapportene er slettet fra den lokale databasen; bilder ligger igjen i bucketen.
- `npm run lint`: 0 funn. `npm run test:unit`: 900 bestått (74 filer), ingen typefeil. `npm run build`: ok. pgTAP, Vitest `db` og resten av Playwright (`endrer`, `reset`) kjøres i CI.

## Spec Change Log

## Review Triage Log

Gjennomgang 1 (Blind Hunter 11 funn, Edge Case Hunter 5, Verification Gap 0 hull), tre uavhengige underagenter mot diff fra `baseline_commit`. Ingen intent_gap eller bad_spec. Dommene er satt av triagen mot koden, ikke av reviewerne.

| Id | Funn | Dom | Bevis | Rute |
|----|------|-----|-------|------|
| E5 | Kommentaren over `listReports` og toppkommentaren i `list-params.ts` nevner ikke `mine` | low | Sant: bare koden ble endret, kommentarene sa fortsatt «kategori og status» og «Story 3.1». | patch: begge kommentarene oppdatert |
| B1 | Status er ulik i `sprint-status.yaml` (`in-progress`), spec (`in-review`) og README | false | Sprintstatusen settes til `review` i steg 5, og README følger samme mønster som i hver story (3.1). | avvist |
| B2 | En bruker med bare en skjult rapport får «Du har ikke registrert noen rapporter ennå.» | low | Sant, men spec-en sier at en skjult rapport ikke vises i «Mine rapporter» (FR-9), og RLS gir ikke appen noen måte å skille «ingen» fra «skjult» på. Teksten står i den frosne blokka. | avvist |
| B3 | En besøkende med `mine=true` får ingen beskjed | false | Spec-en krever at lista vises som uten filteret. | avvist |
| B4 | «Alle» og «Mine rapporter» kan være trykket samtidig | false | Den frosne blokka sier at «Alle» er trykket når kategori og status er fri (som i 3.1) og at «Alle» ikke endrer «Mine rapporter». Rettelsen er å endre spec-en. | avvist |
| B5 | Spec-en sier at `core-flow.spec.ts` linje 213 «må sjekkes», og det står ikke at det er gjort | false | Sjekket ved å kjøre: `endrer-360` og `endrer-1280` bestod, og linje 213 er uendret. | avvist |
| B6 | Lite dekning utenfor e2e (komponent, `page.tsx`, pgTAP for `authored_by_me`) | false | Vitest kjører i node uten DOM (som B8 i 3.1), e2e dekker koblingen, og `supabase/tests/lesing.sql` og `vakter.sql` dekker `authored_by_me`. | avvist |
| B7 | `SEED`-tabellen står både i `filter.spec.ts` og `mine.spec.ts` | low | Sant, men en felles fixture er en omskriving av 3.1-testen, og fasiten skal skrives for hånd (SM-4). | avvist |
| B8 | Den uttømmende testen er treg, og 44 px bare sjekkes for én kombinasjon | false | Hver bruker tok 7 sekunder. 44 px-sjekken gjelder alle brikkene, inkludert «Mine rapporter», i begge prosjektene. | avvist |
| B9 | Den ustabile filvelger-testen er ikke logget | false | Loggen skrives ved slutten av økten og er ikke del av koden som gjennomgås. | avvist |
| B10 | `mine` tolkes utenfor Zod-skjemaet, og `isSignedIn` er et løst argument | false | Tolkingen ligger i `parseListParams`, og signaturen er den spec-en og arkitekturen nevner. | avvist |
| B11 | README-avsnittet vokser | false | Samme mønster i hver story (B-ek i 3.1). | avvist |
| E1 | Sesjonen kan bli ugyldig mellom `getViewer()` og `listReports()` | low | Begge leser samme forespørsel og samme informasjonskapsler, så en sesjonsendring midt i forespørselen er ikke vist. En vakt er ekstra grener. | avvist |
| E2 | `mine=true` blir stående i URL-en etter utlogging | false | `go()` bygger lenken fra `params`, og `mine` er `false` for en besøkende, så den droppes ved neste trykk. | avvist |
| E3 | Tab-steget i `core-flow` kan starte etter brikkene | false | Samme mønster som «Belysning»-steget (`max: 20` etter «Tilbake til lista»), og begge prosjektene bestod. | avvist |
| E4 | Tomtilstanden kan vises ved en lesefeil | false | `listReports` kaster ved feil (`fail`), så en lesefeil gir feilsiden, ikke tom liste. | avvist |

## Design Notes

«Alle» er trykket når kategori og status er fri, uavhengig av `mine` (som i 3.1). `clearFilters` brukes av «Alle» og beholder `mine`, mens «Nullstill filter» bruker `resetFilters` og fjerner alt unntatt sorteringen.

```
?mine=true                       (innlogget) -> { mine: true, sort: "newest" }
?mine=true                       (besøkende) -> { mine: false, sort: "newest" }
buildListHref({ category: "waste", mine: true, sort: "confirmations" }) -> "/?category=waste&mine=true&sort=confirmations"
```

## Verification

**Commands:**
- `npm run lint` -- expected: 0 feil
- `npm run test:unit` -- expected: alle bestått, ingen typefeil
- `npm run build` -- expected: bygger
- `npm test` -- expected: kjøres i CI (`supabase.exe` er blokkert lokalt); skriv kjøretiden i PR-beskrivelsen
