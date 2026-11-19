---
title: 'Story 3.3: Bekrefte en rapport'
type: 'feature'
created: '2026-11-19'
status: 'done'
route: 'dispatch'
baseline_commit: 'cbdc1174f2bfedf7711df9d2d891d084e4de69ed'
review_loop_iteration: 0
context:
  - '{project-root}/docs/implementation-artifacts/epic-3-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** En innlogget bruker kan ikke si «jeg har også sett dette» på en annens rapport, så moderatoren ser ikke hvor mange problemet gjelder, og rapporten klatrer ikke i «Flest har sett» (FR-7, UJ-2, issue #36, SM-2).

**Approach:** En migrering gir `authenticated` INSERT på `confirmations(report_id)` med en policy som håndhever reglene i databasen. Server Action `confirmReport(reportId)` leser raden fra `reports_with_counts` for riktig feilmelding og setter inn. Detaljsiden får en bekreftknapp med fire tilstander og telleren «N har sett dette» som øker med én med en gang og erstattes av serverens verdi.

## Boundaries & Constraints

**Always:**
- Migrering `supabase/migrations/20261119130000_bekreftelser.sql`: `grant insert (report_id) on public.confirmations to authenticated` og én INSERT-policy `TO authenticated` med `WITH CHECK`: `user_id = (select auth.uid())`, og rapporten finnes med `hidden = false` og `author_id <> (select auth.uid())`. `hidden = false` står uttrykkelig, siden moderatoren også ser skjulte rapporter. `user_id` og `created_at` kan ikke settes (42501). Ingen UPDATE, DELETE eller TRUNCATE. Ingen endring i visningen, `seed.sql` eller `database.types.ts`.
- `confirmReport(reportId)` i `app/rapporter/[id]/actions.ts`, `"use server"`, svar `ActionResult<{ seen_count: number; confirmed_by_me: boolean }>`. Rekkefølge: `requireUser` først (returnTo `/rapporter/<id>`, `/` når id-en ikke er en uuid), så `parseReportId` (Zod uuid), ellers `validation_failed`. Så les `id, hidden, authored_by_me, confirmed_by_me` fra `reports_with_counts` med brukerens sesjon: ingen rad gir `report_not_found`, `hidden` gir `forbidden`, `authored_by_me` gir `own_report`, `confirmed_by_me` gir `already_confirmed`. Innsetting bare med `{ report_id }`. `42501` gir `forbidden`, `23505` gir `already_confirmed`. Både `error` og antall rader sjekkes. Svaret leses fra visningen etterpå. `revalidatePath("/")` og `revalidatePath("/rapporter/<id>")` ved suksess og ved `already_confirmed`. Bare feilkoden logges, med «confirmReport» foran.
- Bekreftknappen (klientkomponent) og telleren erstatter linja «N har sett dette» i `components/report-detail.tsx`. Tilstand i denne rekkefølgen: besøkende («Jeg har også sett dette», aktiv, `router.push` til `/auth/login?next=/rapporter/<id>`), `hidden` («Skjult rapport»), `authored_by_me` («Din rapport»), `confirmed_by_me` («Du har sett dette ✓»), ellers «Jeg har også sett dette». De tre deaktiverte bruker `aria-disabled`, så knappen beholder fokus etter trykk, og klikk gjør ingenting. Stilene følger `button-confirm` og `button-confirm-done` i `DESIGN.md`, minst 44 px. Tilstanden kommer fra `authored_by_me`, `confirmed_by_me` og `hidden` i visningen og fra `getViewer()`.
- Trykk: telleren går opp med én og knappen blir «Du har sett dette ✓» med en gang (`useOptimistic`). Tallet erstattes av serverens `seen_count`. Telleren står i en `aria-live="polite"`-region. Feil: telleren går tilbake og en toast viser meldingen fra `lib/errors.ts`. `already_confirmed` gir «Du har sett dette ✓» uten toast. Du-form, ingen utropstegn.
- SM-7: README følges på en ny klone i en tom mappe, uten `.env` og `node_modules`, så langt maskinen tillater det. `supabase.exe` er blokkert lokalt, så stegene som trenger Supabase-CLI dekkes av CI-kjøringen på en ny utsjekk. Resultatet, også det som ikke ble kjørt lokalt, står i PR-beskrivelsen, og det som ikke virket, rettes i README.
- Arkitekturloggen får ett punkt om at INSERT-policyen i tillegg krever `hidden = false` (AD-7), og README-statusen nevner bekreftelse (Story 3.3).

**Never:**
- Ingen UPDATE, DELETE eller angring av en bekreftelse. Ikke send `user_id`, `created_at` eller `author_id` fra appen. Ikke filtrer på `hidden` i lista eller detaljsiden. Ikke endre filter, sortering, `proxy.ts` eller `lib/env.ts`. Ingen mellomlagring.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Bekrefte | `bruker1` på `bruker2`s rapport 2, aldri bekreftet | Telleren +1 med en gang, så serverens tall. «Du har sett dette ✓», fokus på knappen. Lista «Flest har sett» bruker nytt tall | N/A |
| Besøkende | Rapport 2, ikke innlogget | Aktiv knapp. Trykk gir `/auth/login?next=/rapporter/<id>`, og etter innlogging er hen tilbake på siden | N/A |
| Egen rapport | `bruker2` på rapport 2 | «Din rapport», deaktivert. REST: 403. Action: `own_report` | Toast ved action |
| Allerede bekreftet | `bruker2` på rapport 1 | «Du har sett dette ✓», deaktivert. REST: 409. Action: `already_confirmed` | Ingen toast |
| Skjult | Moderator på rapport 7 | «Skjult rapport», deaktivert. REST og action: `forbidden`/403. En vanlig bruker får 404 på siden | N/A |
| Løst | `bruker1` på løst rapport 6 | Status forblir «Løst», `seen_count` +1 | N/A |
| Moderator | Moderator på en annens synlige rapport | Bekrefter som vanlig bruker | N/A |
| Direkte REST | Besøkende, så innlogget med `user_id` eller `created_at` satt | 401 for besøkende, 403 for forfalsket kolonne | Vitest `db` |
| Feil | Server Action feiler (nettverk eller `unknown`) | Telleren tilbake, knappen aktiv igjen, toast | Toast med melding |
| Ugyldig id | `confirmReport("abc")` | `validation_failed` uten databasekall | N/A |

</frozen-after-approval>

## Code Map

- `supabase/migrations/20261109141557_bilder.sql`, `20261110120000_skriving_reports.sql` -- mønster for kolonnegrant og policy `TO authenticated`. `datamodell.sql` har `confirmations` (PK `report_id, user_id`, `user_id default auth.uid()`) og visningen. Ny migrering legger til INSERT bare på `report_id`.
- `supabase/tests/skriving.sql` -- grantmatrisen (`plan(60)`) og skrivesetningene mot `confirmations` (`default values`, `update`, `delete`, `truncate` som 42501 for anon, bruker og moderator) må tilpasses: `confirmations.report_id authenticated INSERT` kommer til, og `insert … default values` som innlogget gir ikke lenger 42501 på samme måte. Planen må telles på nytt. `begrensninger.sql` har allerede «samme bekreftelse to ganger» som postgres (23505).
- `supabase/tests/bekreftelser.sql` (ny) -- policyen som bruker1, bruker2 og moderator: kolonner, egen rapport, skjult (også moderator), dobbel, `user_id`/`created_at`, løst, `seen_count`, ingen UPDATE/DELETE. Bruker `hjelpere.psql` (`tests.as_user`, `tests.skjult_rapport()`).
- `app/rapporter/ny/actions.ts` (+ `actions.test.ts`) -- mønster for `"use server"`, `requireUser`, `actionError`, `toActionError`, `revalidatePath` og logging bare av kode; test med mocka `@/lib/supabase/auth` og `server`. `lib/errors.ts` har alle koder fra før (`own_report`, `already_confirmed`, `forbidden`, `report_not_found`, `validation_failed`). `lib/report-id.ts` har `parseReportId`.
- `app/rapporter/[id]/page.tsx` (+ `page.test.ts`) -- får `getViewer()` og gir `isSignedIn` til `ReportDetail`. `components/report-detail.tsx` bytter ut linja «N har sett dette». `getReport` leser alt som trengs.
- `components/confirm-button.tsx` (ny, `"use client"`) og `lib/confirm-state.ts` (ny, ren funksjon med tilstand og tekst, enhetstestet) -- `components/report-form.tsx` viser `toast` fra `sonner`. `components/ui/button.tsx` er ikke egnet uten egne klasser (`disabled:pointer-events-none`), så knappen får egne klasser etter `DESIGN.md`.
- `e2e/les/` (les, rører ikke data): `bekreft-tilstander.spec.ts` (ny) med tilstandene for besøkende, `bruker1` på 1, `bruker2` på 1 og 2, moderator på 7, axe og 360 px. `e2e/endrer/bekreft.spec.ts` (ny, kjøres i begge bredder uten reset mellom): oppretter en egen rapport som forfatter (REST med `supabase-js`, ikke seed), så bekrefter en annen bruker i nettleseren: besøkende → innlogging → tilbake, tastatur, `aria-live`, fokus, «Flest har sett», feil med `page.route` som avbryter POST, axe. `e2e/core-flow.spec.ts` -- på rapporten som nettopp er registrert, er knappen «Din rapport», deaktivert og fokuserbar, og bekreftelse med tastatur dekkes i `bekreft.spec.ts` (SM-2).
- `lib/supabase/bekreftelser.db.test.ts` (ny, Vitest `db`, mønster `reports-insert.db.test.ts`) -- REST mot lokal Supabase: 401, 403 (egen rapport, `user_id`, `created_at`, skjult), 409 og 201.
- `README.md`, `docs/beslutninger/arkitektur-beslutningslogg.md`, `docs/implementation-artifacts/sprint-status.yaml` (`3-3-bekrefte-en-rapport: review` til slutt).

## Tasks & Acceptance

**Execution:**
- [x] `supabase/migrations/20261119130000_bekreftelser.sql` -- kolonnegrant og INSERT-policy -- AR-7, NFR-4
- [x] `supabase/tests/bekreftelser.sql` og `skriving.sql` -- pgTAP for reglene, matrisen og planen oppdatert -- NFR-4
- [x] `lib/supabase/bekreftelser.db.test.ts` -- 401, 403, 409, 201 mot REST -- FR-7
- [x] `app/rapporter/[id]/actions.ts` (+ `actions.test.ts`) -- `confirmReport` med alle feilgrenene, ingen rapporttekst i logg -- AR-12, AR-13
- [x] `lib/confirm-state.ts` (+ test), `components/confirm-button.tsx`, `components/report-detail.tsx`, `app/rapporter/[id]/page.tsx` (+ `page.test.ts`) -- fire tilstander, optimistisk +1, `aria-live`, fokus, toast -- UX-DR14, UX-DR16
- [x] `e2e/les/bekreft-tilstander.spec.ts`, `e2e/endrer/bekreft.spec.ts`, `e2e/core-flow.spec.ts` -- tilstander, hele flyten med tastatur, besøkende via innlogging, feil, sortering, axe og 360/320 px -- SM-2, NFR-8
- [x] `README.md`, `docs/beslutninger/arkitektur-beslutningslogg.md` -- status, policyen, SM-7-resultatet -- SM-7

**Acceptance Criteria:**
- Given migreringen, when pgTAP og Vitest `db` kjøres, then avviser databasen egen rapport, skjult rapport, dobbel bekreftelse og satt `user_id`/`created_at`, og `seen_count` øker med én uten å endre status
- Given detaljsiden for besøkende og innlogget, før og etter bekreftelse, when axe kjøres, then er det ingen funn med «serious» eller «critical», og ingen horisontal scrolling på 360 og 320 px
- Given kjerneflyten, when brukeren bekrefter bare med tastatur, then øker telleren, knappen beholder fokus, og lista «Flest har sett» bruker det nye tallet

## Implementation Notes

- Implementert direkte i hovedsesjonen (ingen implementeringsunderagent). Klientkomponenten heter `components/confirm-section.tsx` (ikke `confirm-button.tsx`), fordi den eier både telleren og knappen. Tilstanden er vanlig `useState` med tall fra serveren (props) som tar over under rendering når en revalidering gir nye tall, ikke `useOptimistic`: da erstattes visningen av `seen_count` fra svaret, og komponenten monteres ikke på nytt, så fokus består.
- `confirmReport` leser skjult før egen rapport og allerede bekreftet (`forbidden` vinner), og revaliderer ved suksess og ved `already_confirmed`, også når selve innsettingen gir `23505`. Lesing av tallene etter en lagret bekreftelse som feiler, gir `unknown`, men siden er revalidert, så den viser da tilstanden som den er.
- Migreringen er lagt på den kjørende lokale databasen med `docker exec … psql`, og pgTAP er kjørt som psql-filer (pgtap installert midlertidig). `bekreftelser.sql` har 20 tester, `skriving.sql` fikk bare en rad til i grantmatrisen og tekst (resten av matrisen står uendret: `insert … default values` som innlogget gir fortsatt 42501, nå fra policyen). `bilder.sql` feiler lokalt på grunn av bilder som ligger igjen i bucketen etter tidligere kjerneflyt-kjøringer (kjent åpent punkt), ikke på dette.
- Vitest `db`: `bekreftelser.db.test.ts` 8 bestått mot REST (401, 403 for egen rapport, skjult rapport (også moderator), `user_id` og `created_at`, 201, 409, UPDATE og DELETE 403). Vitest `unit`: 965 bestått, ingen typefeil. `npm run lint`: 0 funn. `npm run build`: ok.
- Playwright lokalt uten Supabase-CLI (`next start` mot containerne og en midlertidig konfig, slettet etterpå): `les-360`, `les-1280`, `endrer-360` og `endrer-1280` 247 bestått, 1 med vilje utelatt (`reset` kjører `supabase db reset` og tas i CI). `bekreft-tilstander.spec.ts` er nytt i `les` (7 tester per bredde) og `bekreft.spec.ts` i `endrer` (4 tester per bredde). Playwright venter for alltid på klikk på `aria-disabled`-knapper, så testene bruker `click({ force: true })` der de sjekker at et trykk ikke gjør noe. Playwright-oppsettet forbyr `test.skip`, så 320 px-testen kjører i begge prosjektene.
- Kjerneflyten: etter innsendingen fortsetter Tab fra stedet der «Send inn» sto, og bekreftknappen står der foran toasten. «Tilbake til lista» nås derfor med Shift+Tab (`reverse: true`, slik `keyboard.ts` beskriver det). Nytt siste steg: «Mine rapporter» av, Tab til rapport 2, bekreft med Enter, telleren går opp med én, knappen beholder fokus. Kjerneflytbrukerne bekrefter rapport 2 én gang hver, så telleren leses først.
- `e2e/api.ts` (ny) lager rapporter som en seed-bruker med REST og `.env`, så bekreftelsestestene ikke avhenger av seed-tallene.
- Full `npm test` kjørt lokalt i en ny klone i `Temp` (supabase.exe er blokkert bare i prosjektmappen) med endringene kopiert inn: Vitest `unit` 965 og `db` 44 bestått, pgTAP bestått. Første Playwright-kjøring: ett funn, den kjente ustabile `innlogging.spec.ts:98` (Epic 2 retro F1), og da kjørte ikke prosjektene som avhenger av `les`. Andre kjøring: `mine.spec.ts:179` leste kortene før lista var strømmet inn bak lasteskjermen («Laster rapportene …»), og fikk en tom liste. Det er en race i testen fra Story 3.2 (og samme hjelper i `filter.spec.ts` fra 3.1), ikke i koden: `shownReports` venter nå til lasteskjermen er borte, i begge filene.
- Matriserad «Løst» i den frosne blokka nevner `bruker1` på rapport 6, men seed har allerede en bekreftelse fra `bruker1` på rapport 6 (en ny bekreftelse ville gitt `already_confirmed`). Atferden i raden (status forblir «Løst», `seen_count` +1) er testet i `bekreftelser.sql` med moderatoren som bekrefter rapport 6. Raden er ikke endret.
- SM-7: se PR-beskrivelsen for resultatet fra den nye klonen (kommandoene som kjørte lokalt, og det som bare kjører i CI).

## Spec Change Log

## Review Triage Log

Gjennomgang 1 (Blind Hunter 13 funn, Edge Case Hunter 9 uten krav og 3 mot kravene, Verification Gap 1 hull), tre uavhengige underagenter mot diff fra `baseline_commit` (spec-en var ikke med i diffen for Blind Hunter). Ingen intent_gap eller bad_spec. Dommene er satt av triagen mot koden, ikke av reviewerne.

| Id | Funn | Dom | Bevis | Rute |
|----|------|-----|-------|------|
| V1 | Grenen i `ConfirmSection` som håndterer en feil fra serveren (toast og tilbakestilling) kjøres av ingen test | medium | Sant: e2e-testen avbryter POST og treffer `catch`, `actions.test.ts` rendrer ikke komponenten, og Vitest kjører i node. Fjernes `toast.error` eller tilbakestillingen, består alle tester. | patch: avbildningen er flyttet til `confirmOutcome`, `optimisticConfirm` og `confirmThrown` i `lib/confirm-state.ts`, med enhetstester for suksess, `already_confirmed`, alle andre feilkoder og kast |
| E1 | Tilbakestilling og `already_confirmed` bruker props fra trykket, så en revalidering som kom først, kan overskrives med gamle tall (også B1) | medium | Sant: `setView({ seen: seenCount, … })` leste en lukket verdi, og `server`-tilstanden var allerede oppdatert, så det gamle tallet ble stående. | patch: komponenten leser siste props fra en `useRef` (`latest`) og sender den som `base` til `confirmOutcome` |
| E2 | `unknown` etter lagret INSERT (feil ved lesing av tallene) ruller tilbake til «Jeg har også sett dette» med toast | low | Delvis sant: `revalidate()` kjøres før tallene leses, så props blir bekreftet, og med `latest` viser knappen nå «Du har sett dette ✓» sammen med feiltoasten. Tilstanden er riktig, bare meldingen er unødvendig. | dekket av patchen for E1 |
| E3 | `revalidate()` kaster etter lagret INSERT og gir `unknown` | low | `revalidatePath` kaster ikke i vanlig bruk, og en vakt (egen try/catch) legger til grener uten at noen har vist at den kan nås. | avvist |
| E4 | Nye props midt i et kall visker ut den optimistiske +1 (også B2) | low | Krever en revalidering fra en annen handling mens kallet pågår. Telleren blir riktig når svaret kommer, og et nytt Enter er allerede ignorert fordi knappen er bekreftet. | avvist |
| E5 | `aria-live` leser opp tallet to ganger (optimistisk og server) | false | Begge verdiene er normalt like (N+1), så teksten endres én gang. Bare en samtidig bekreftelse fra en annen gir et annet tall, og da er en ny opplesning riktig. | avvist |
| E6 | Kjerneflyten bekrefter seed-rapport 2, og et nytt løp uten `db reset` feiler (også «mutates seed counts») | false | `npm run test:e2e` og `npm test` kjører alltid `supabase db reset` først (`webServer`, `reuseExistingServer: false`), og lesetestene kjører før endrer-testene. Hvert prosjekt har sin egen kjerneflytbruker. | avvist |
| E7 | Rekkefølgetestene i `bekreft.spec.ts` er avhengige av seed-tallene (også B4: `indexOf` gir −1 når en id mangler) | low | Delvis sant: en manglende id ga et misvisende eller trivielt resultat. | patch: hver id sjekkes med `toContain` før sammenligningene |
| E8 | Løste rapporter kan bekreftes (ingen statusvakt i policyen) | false | Kravet i Story 3.3 sier at en bekreftelse på en løst rapport ikke endrer statusen og øker `seen_count`, og pgTAP tester det. | avvist |
| E9 | Besøkende-tilstanden avgjøres ved rendering, og økten kan utløpe før trykket (også B8) | low | `requireUser` redirecter fra Server Action, som Next følger til innlogging med `next`. Bare den optimistiske +1 blir stående mens siden navigeres bort. | avvist |
| E10 | Kravet sier `useOptimistic`, koden bruker `useState` med synk fra props | false | Atferden i kravet er oppfylt: +1 med en gang, serverens `seen_count` erstatter det, fokus består og feil gir toast. `useOptimistic` er et verktøyvalg i en parentes, og grunnen står i Implementation Notes. | avvist |
| E11 | Spec-en sier «fire tilstander», koden har fem verdier | false | Besøkende og åpen har samme tekst, så knappen viser fire tilstander, mens `ConfirmState` har fem verdier. Ordlyden kommer fra epics.md. | avvist |
| E12 | Spec-en nevner `confirm-button.tsx`, filen heter `confirm-section.tsx` | false | Dokumentert i Implementation Notes. Rettelsen er å endre spec-en. | avvist |
| B3 | Ingen komponenttester for `ConfirmSection` | low | Vitest kjører i node (som B6 i 3.2). Logikken som kunne feile, er nå ren funksjon med tester, og Playwright dekker koblingen. | dekket av V1 |
| B5 | `opacity-60` på «Din rapport» og «Skjult rapport» gir lav kontrast | false | Deaktiverte komponenter er unntatt kontrastkravet (WCAG 1.4.3), og mockupen `detalj.html` bruker `.dis{opacity:.5}` for dem. | avvist |
| B6 | Endringen i knappen leses ikke opp, bare telleren | false | UX-kravet er at endringen i telleren leses opp med `aria-live`, og knappen beholder fokus, så skjermleseren leser den nye teksten. | avvist |
| B7 | Skjøre velgere (`[aria-live="polite"]`, `columns.includes("hidden")`) | low | Velgerne er stabile i dag, og å legge til `data-testid` er mer overflate enn nytte. | avvist |
| B9 | `getViewer()` kjøres etter `getReport` og legger til en Auth-runde | false | `getViewer` er pakket i `cache()` og kalles allerede av layouten (topplinja) i samme forespørsel, så det er ingen ekstra runde. | avvist |
| B10 | `confirmReport` gjør tre kall, og det er et gap mellom lesing og innsetting | false | Lesing før innsetting og lesing etter er krevd av Story 3.3. Databasen er den egentlige kontrollen, så gapet gir bare en annen feilkode, aldri en bekreftelse som ikke skulle vært lov. | avvist |
| B11 | Beslutningsloggen og migreringskommentaren mangler valg (løst rapport, optimistisk UI, rate limiting) | low | Det eneste som avviker fra AD-7, er `hidden = false`, og det er ført. De andre valgene står i kravene til Story 3.3. | avvist |
| B12 | Passordet står som literal i `bekreft.spec.ts`, og testdata ryddes ikke | low | Passordet: sant, og rettet. Opprydding: testene avhenger av `db reset`, som alltid kjøres (som i E6). | patch: `PASSWORD` fra `e2e/auth.ts` brukes |
| B13 | Sesjonslogg og `issues.md` mangler i diffen, og statusen hopper over review | false | Loggen skrives ved slutten av økten (CLAUDE.md), og sprintstatus settes til `review` i steg 5. | avvist |

## Design Notes

Optimistisk tilstand med `useOptimistic` over serverens verdier som props: når Server Actionen er ferdig og `revalidatePath` har gitt nye props, er den optimistiske verdien erstattet av `seen_count` fra visningen, og komponenten blir ikke montert på nytt, så fokus består. `aria-disabled` i stedet for `disabled` gir samme fokus uten å miste knappen fra lesere.

```
confirmState({ isSignedIn, hidden, authoredByMe, confirmedByMe })
  -> "visitor" | "hidden" | "own" | "confirmed" | "open"   (i den rekkefølgen)
```

## Verification

**Commands:**
- `npm run lint` -- expected: 0 feil
- `npm run test:unit` -- expected: alle bestått, ingen typefeil
- `npm run build` -- expected: bygger
- `npm test` -- expected: kjøres i CI (`supabase.exe` er blokkert lokalt); skriv kjøretiden i PR-beskrivelsen
