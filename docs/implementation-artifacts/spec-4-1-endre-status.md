---
title: 'Story 4.1: Endre status'
type: 'feature'
created: '2026-11-20'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'af77f86a6b377ddd62752912ee00e27099ebe8d5'
context:
  - '{project-root}/docs/implementation-artifacts/epic-4-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Moderatoren kan ikke følge opp rapporter. Statusen står fast på det den ble registrert med, og ingen ser når saken sist ble fulgt opp (FR-8, UJ-3).

**Approach:** Databasen eier regelen: en migrering med UPDATE-policy, kolonnegrant og triggeren `reports_guard_update`. Over den kommer en Server Action `setReportStatus(reportId, from, to)` og et moderatorpanel i den nye sliceen `features/moderering/`, som ruten i `app/` setter inn på detaljsiden som slot (AD-16).

## Boundaries & Constraints

**Always:**
- Feilkoder kastes med `ERRCODE 'P0001'` og koden i `MESSAGE`.
- `status_changed_at` flyttes bare når statusen endres.
- Handlingen bruker brukerens egen sesjon, sjekker både `error` og antall rader, og kaller `revalidatePath` for `/` og `/rapporter/[id]`.
- Teksten for `forbidden` er «Du har ikke tilgang til dette.» (story og UX). Testene som leser den gamle teksten, oppdateres.
- Panelet viser bare knapper til nabostatusene. Knappene er deaktivert mens endringen lagres, og fokus ender aldri på `body`.

**Never:**
- Ingen tjenestenøkkel.
- Ingen import fra andre slices eller fra `app/` i `features/moderering`.
- Appen filtrerer aldri på `hidden`.
- Ingen skjul- eller vis-knapp (det er 4.2), og ingen sanntid.
- Ingen `test.skip` eller `fixme`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Ett steg | moderator, `new → in_progress` | ok, `status_changed_at = now()` | – |
| Hopp | moderator, `new → resolved` | DB kaster `invalid_status_step` | toast med teksten |
| Ikke moderator | bruker, også på egen rapport | DB `42501`, REST 403 | `forbidden` |
| Besøkende | REST uten sesjon | 401 | – |
| Utdatert | `from` ≠ statusen i databasen | 0 rader | `stale_state`, toast, siden viser statusen som gjelder nå |
| Rapport finnes ikke | gyldig uuid uten rad | 0 rader | `report_not_found` |
| Ugyldig id | ikke uuid | ingen spørring | `validation_failed` |
| Andre kolonner | `description` endres | DB kaster `invalid_column_change` | – |
| Uten ny status | `hidden` endres eller tom oppdatering | lov, `status_changed_at` står stille | – |

</frozen-after-approval>

## Code Map

- `supabase/migrations/20261108190211_datamodell.sql` -- `report_status`-enumen (:31, rekkefølgen er kontrakt), `private.is_moderator()` (:82, security invoker) og `handle_new_user` (:106, mal for trigger-stil). Endres ikke.
- `supabase/tests/hjelpere.psql` -- `tests.as_user`, `tests.as_anon`, `tests.as_postgres`, `tests.moderator()`, `tests.bruker1()`. `throws_ok(sql, 'P0001', '<kode>', …)`.
- `supabase/tests/begrensninger.sql:37-42` -- oppdaterer `status_changed_at` som `postgres` og venter `23514`. Brytes hvis triggeren vokter alle roller.
- `supabase/tests/skriving.sql:36-51` -- uttømmende grant-matrise. Får `reports.status` og `reports.hidden authenticated UPDATE`.
- `supabase/tests/vakter.sql` -- bare `handle_new_user` er security definer (:103), EXECUTE i `private` bare `is_moderator` (:78), ingen policy `TO public` (:98).
- `features/bekreftelser/actions.ts` -- mønsteret: `parseReportId` (`shared/report/report-id.ts`), `requireUser`, `actionError`, try/catch, logger bare koden, revalidate-hjelper (:39).
- `features/bekreftelser/components/confirm-section.tsx` -- mønsteret for klient: synker props under render, `toast.error` fra sonner.
- `features/bekreftelser/bekreftelser.db.test.ts:25-38` -- `client()` og `signedIn(email)` for REST-testen (401/403).
- `shared/lib/errors.ts:5-51` -- `ERROR_MESSAGES` har `stale_state`, `invalid_status_step` og `invalid_column_change`. `toActionError` leser ikke `P0001`.
- `app/rapporter/[id]/page.tsx:41-54` -- `getViewer()` gir `isModerator`. Panelet settes inn etter `ConfirmSection` i `children`.
- `features/rapporter/components/report-detail.tsx:40-44` -- `StatusBadge` og «Sist oppdatert» (`formatDateTime`).
- `shared/report/labels.ts:15` (`STATUS_LABELS`) og `shared/ui/card.tsx` / `button.tsx`.
- `shared/lib/slices.test.ts:45` -- liste over slices.
- `e2e/core-flow.spec.ts:343-367` -- 3.3-steget, slutten av testen.
- `e2e/auth.ts` (`logIn`), `e2e/keyboard.ts` (`tabTo`), `e2e/api.ts` (`createReportAs`), `e2e/a11y.ts`.
- `e2e/endrer/bekreft.spec.ts` -- mal for tester som endrer data (toast, annen fane).

## Tasks & Acceptance

**Execution:**
- [x] `supabase/migrations/20261120120000_statusendring.sql` -- `private.reports_guard_update()` (plpgsql, security invoker, `search_path = ''`, `revoke all`) og `BEFORE UPDATE`-trigger. Policy «reports: authenticated oppdaterer synlige, moderator» (`USING` som SELECT-policyen, `WITH CHECK (private.is_moderator())`) og `grant update (status, hidden) … to authenticated` -- AR-7.
- [x] `supabase/tests/status.sql` -- ny pgTAP: steg fram og tilbake, hopp, `42501` for bruker1 (også på egen rapport) og anon, `status_changed_at` flyttes og står stille, `invalid_column_change`, skjult rapport, uendret status. Oppdater `skriving.sql` (grant-matrisen) og sjekk at `begrensninger.sql` og `vakter.sql` består.
- [x] `shared/lib/errors.ts` (+ `errors.test.ts`) -- `P0001` med en kjent kode i `message` gir den koden. Ny tekst for `forbidden`. Oppdater `features/bekreftelser/actions.test.ts:225`.
- [x] `features/moderering/status-steps.ts` (+ test) -- `neighbourStatuses(status)` gir `[{to, label}]` med «← Ny», «Under behandling →» osv.
- [x] `features/moderering/actions.ts` (+ `actions.test.ts`) -- `setReportStatus`. Ved 0 rader leses raden: finnes den ikke, gir det `report_not_found`, ellers `stale_state`. Kaller revalidate også ved `stale_state`.
- [x] `features/moderering/status.db.test.ts` -- REST: besøkende 401, bruker 403, moderator ok, utdatert `from` gir 0 rader.
- [x] `features/moderering/components/status-panel.tsx` -- `Card` «Moderator» med nåværende status (tekst) og naboknapper. `disabled` mens den lagrer. Etter svaret får første statusknapp fokus via ref. `toast.error` ved feil. Ny status kommer fra `revalidatePath` i handlingen og synkes inn fra props, som i `confirm-section.tsx`.
- [x] `app/rapporter/[id]/page.tsx` -- `{viewer.isModerator && <StatusPanel …/>}` etter `ConfirmSection`.
- [x] `shared/lib/slices.test.ts` -- legg til `moderering`.
- [x] `e2e/endrer/status.spec.ts` -- panelet for moderatoren og ikke for bruker eller besøkende, knapper per status, statusmerket og «Sist oppdatert» endres, fokus, toast ved `stale_state` (annen fane), axe, UJ-3 (bruker registrerer, moderator flytter til Løst i to steg, rapportøren ser **Løst** i «Mine rapporter» og tidspunktet på detaljsiden).
- [x] `e2e/core-flow.spec.ts` -- etter 3.3, bare tastatur: logg ut, logg inn som moderator, sorter på «Flest har sett», åpne rapporten testen registrerte, og flytt statusen ett steg.

**Acceptance Criteria:**
- Gitt en moderator på detaljsiden, når hen trykker en statusknapp, så viser statusmerket og panelet den nye statusen, og «Sist oppdatert» viser tidspunktet i norsk tid.
- Gitt en bruker eller besøkende, når detaljsiden vises, så finnes ikke panelet.
- Gitt hele testpakken, når `npm test` og `npm run lint` kjøres, så er alt grønt, axe gir null serious eller critical, og ingen eksisterende test er svekket.

## Implementation Notes

- **Statusteksten i panelet har `role="status"`, ikke `aria-live="polite"`.** Den første versjonen brukte `aria-live` og brøt fire tester i `e2e/les/bekreft-tilstander.spec.ts`, som finner telleren med `[aria-live="polite"]` på moderatorsider. Ingen eksisterende test er endret.
- **Kjerneflyttesten fikk to ventinger:** at menyen er lukket (`toBeHidden`) før Tab på innloggingssiden, som `openMenu` i `e2e/auth.ts`, og at «Mine rapporter» er synlig etter innloggingen før Tab til «Sortering». Uten dem tok menyknappen fokuset tilbake.
- **«Annen fane» i `stale_state`-testen** er en endring direkte mot API-et med moderatorens sesjon (`setStatusAs` i `e2e/api.ts`), ikke en ekstra side.
- **`invalid_column_change`** nås bare med en midlertidig grant i `status.sql`, siden kolonnegranten stopper andre kolonner med `42501` først. Triggeren er forsvar i dybden.
- **Ingen suksess-toast:** spec-en ber bare om `toast.error`. Den nye statusen leses opp via `role="status"`.
- Full `npm test` i en klone i Temp: unit 1062, pgTAP 8 filer og 242 tester, db 51, Playwright 268. 630 s.
- Etter review-rettelsene, i en ny klone i Temp (`sm9`): `tsc` og `npm run lint` er rene. Full `npm test` ga exit 0 på 642 s: unit 1062 av 1062 (84 filer), pgTAP PASS, db 51 av 51, Playwright 270 av 270 (9,8 min), med testen for nettverksfeil.

## Spec Change Log

## Review Triage Log

Gjennomgang 1: Blind Hunter (15 funn), Edge Case Hunter (4) og Verification Gap (1).

- **VG1, medium, patch:** når handlingen kaster (nettverksfeil), er `catch`-grenen i `status-panel.tsx` ikke testet. Uten den blir knappene stående deaktivert uten melding. Får en e2e-test som avbryter POST-en, etter `bekreft.spec.ts:142-168`.
- **EC1, low, patch:** panelet synker bare når props avviker fra `server`. Setter en annen moderator statusen tilbake før den revaliderte renderen, står panelet fast på feil status, og hvert trykk gir `stale_state`. Rettes direkte med `setServer` ved `ok`.
- **EC2/BH5, low, avvist:** `from === to` gir `ok` uten steg. Panelet sender det aldri, og databasen godtar det som uendret status. Rettingen er en ny gren.
- **EC3, low, avvist:** en ikke-moderator med utdatert `from` eller en skjult rapport får `stale_state` eller `report_not_found`, ikke `forbidden`. Databasen stopper fortsatt alt, og svaret avslører ikke mer enn brukeren kan lese. Panelet vises ikke for dem.
- **EC4/BH13a, low, avvist:** i utloggingssteget i kjerneflyttesten godtar `if (!menuFocused)` begge fokusutfall. Radix gir fokus tilbake til «Meny» når menyen er lukket (sjekket med `toBeHidden` rett før), og ellers står fokus i starten av dokumentet. Det er derfor ikke sannsynlig at testen blir ustabil.
- **BH1, low, avvist:** `postgres` og `service_role` flytter ikke `status_changed_at` ved statusendring. Ingen kode eller seed endrer status med de rollene, og Design Notes sier at andre roller slipper gjennom. Rettingen omstrukturerer triggeren og testene.
- **BH2, low, patch:** kommentaren i migreringen sier at triggeren finnes for å gi 42501 i stedet for en stille oppdatering. Men `WITH CHECK` gir allerede 42501. Den egentlige grunnen er rekkefølgen: en ikke-moderator får 42501 før kolonne- og stegfeilene, så reglene ikke lekker. Kommentaren rettes.
- **BH3, low, patch:** `now()` står fast i transaksjonen, så `status.sql` kan ikke vise at hvert steg setter tidspunktet på nytt. Testen «tilbake» i `status.db.test.ts` får en sjekk på at tidspunktet flyttes fram.
- **BH4, false:** fokus på «← Ny» etter et steg fram er det AC-en ber om («den første statusknappen»). Et nytt steg krever et nytt bevisst trykk, og knappene er deaktivert mens det lagres.
- **BH6, low, avvist:** `StatusPanel` har ingen komponenttest, og retningen regnes inline. Lagring, synk og fokus er dekket av e2e, og kastegrenen dekkes av VG1. Det trengs ikke en ny API-flate.
- **BH7, false:** sprintstatusen settes til `review` eller `done` i steg 5 av bmad-build. `in-progress` stemmer til da.
- **BH8, low, patch:** `epic-4-context.md` sier fortsatt at teksten for `forbidden` må avklares. Linjen skal føre beslutningen.
- **BH9, low, avvist:** walken med `tabTo(…, { max: 300 })` vokser med testdata. Playwright starter med `db reset`, så lista vokser bare innenfor én kjøring, og den besto med god margin.
- **BH10, maybe-false, utsatt:** `signedIn()` i `e2e/api.ts` logger inn ved hvert kall og kan nå grensen `sign_in_sign_ups = 30` per 5 min. Full `npm test` besto med flere innlogginger enn det, så grensen ser ikke ut til å slå inn lokalt. Er påstanden sann, er den medium. Kan avgjøres med en kjøring der innloggingene telles. Det ubrukte `created_at` i `readStatusAs` fjernes (low, patch).
- **BH11, low, patch:** «Sist oppdatert» sammenlignes med `formatDateTime` på begge sider. Testen får én sjekk av formatet med regex.
- **BH12, low, patch:** testene i `status.db.test.ts` avhenger av rekkefølgen. Det skrives i en kommentar. `forbidOnly` hindrer `.only`.
- **BH13b, low, avvist:** passordet er hardkodet som tekst. Kjerneflyttesten gjør det samme fra før (`core-flow.spec.ts:191`).
- **BH14, low, avvist:** `P0001` godtar alle kjente koder. Bare egne triggere kaster `P0001`, og en tillatt-liste ville vært mer kompleksitet uten en navngitt skade.
- **BH15a, low, patch:** `type Element` i `page.test.ts` skygger for DOM-typen. Gis nytt navn.
- **BH15b, low, patch:** `id="moderator-panel-heading"` er hardkodet. Erstattes med `useId()`.
- **BH15c, low, avvist:** `aria-busy` eller en tilstand som viser «Lagrer …». Spec-en ber bare om deaktiverte knapper, og deaktiverte knapper leses opp.

## Design Notes

**Triggeren vokter bare API-rollene.** Den sjekker `current_user in ('anon', 'authenticated')` først og slipper ellers gjennom. `postgres` og `service_role` omgår uansett RLS, og `begrensninger.sql` må kunne teste CHECK-regelen som `postgres`.

For API-rollene er rekkefølgen: ikke moderator gir `42501`. Er `(to_jsonb(NEW) - 'status' - 'hidden')` forskjellig fra det samme for `OLD`, gir det `invalid_column_change`. Er statusen endret og `abs(array_position(enum_range(NULL::report_status), NEW.status) - …OLD…) <> 1`, gir det `invalid_status_step`. Ellers settes `NEW.status_changed_at := now()`.

**Fokus** går til første statusknapp i panelet, som AC-en tillater. Statusmerket ligger i `rapporter`, og panelet kan ikke nå det uten å bryte slicegrensen. Knappesettet byttes etter endringen, så fokus settes eksplisitt etter svaret.

## Verification

**Commands:**
- `npx supabase test db` -- alle pgTAP-filer består, også `begrensninger`, `vakter` og `skriving`. Kjøres i en klone i Temp (supabase.exe er blokkert i prosjektmappen).
- `node scripts/db-types.mjs --check` -- typene er uendret, eller de regenereres.
- `npm run lint` og `npx tsc --noEmit` -- uten feil.
- `npm test` -- alt bestått, og kjøretiden står i PR-beskrivelsen.
