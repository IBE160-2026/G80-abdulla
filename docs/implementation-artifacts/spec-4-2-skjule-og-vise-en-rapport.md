---
title: 'Story 4.2: Skjule og vise en rapport'
type: 'feature'
created: '2026-11-20'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'b5a6eb084de7f4ccd6668f6b8810aa5adf84f536'
context:
  - '{project-root}/docs/implementation-artifacts/epic-4-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Moderatoren kan ikke fjerne en rapport med for eksempel et lesbart bilskilt. Regelen i databasen finnes fra Story 4.1, men det finnes ingen handling, knapp eller merking (FR-9).

**Approach:** `setReportHidden(reportId, hidden)` og en skjul/vis-knapp i moderatorpanelet (`features/moderering/`). «Skjul rapport» bekreftes i en shadcn-`AlertDialog`. Lista og detaljsiden merker en skjult rapport med «Skjult» for moderatoren. RLS avgjør hvem som ser den.

## Boundaries & Constraints

**Always:**
- Eksplisitt målverdi, aldri en veksling.
- Handlingen bruker brukerens egen sesjon, sjekker både `error` og antall rader, og kaller `revalidatePath` for `/` og `/rapporter/[id]`.
- Skjuling sletter ingenting og flytter ikke `status_changed_at`.
- Fokus går til «Vis rapport» etter skjuling og til «Skjul rapport» etter visning, aldri til `body`.
- Merkingen «Skjult» bruker de eksisterende tokenene `bg-status-hidden` og `text-status-hidden-foreground` og står som tekst, ikke bare farge.
- **Dialogteksten** (beslutning, prosjekteier 2026-11-21):
  - tittel: «Skjule rapporten?»
  - tekst: «Rapporten blir borte for alle andre, også for den som sendte den inn. Ingenting slettes, og du kan vise den igjen.»
  - knapper: «Avbryt» og «Skjul rapport»

**Never:**
- Ingen migrering. Regelen finnes fra 4.1.
- Appen filtrerer aldri på `hidden`.
- Ingen melding til rapportøren.
- Ingen import mellom slices. «Skjult»-merket ligger i `rapporter`, eller i `shared/report/` hvis mer enn én slice trenger det.
- Ingen `test.skip` eller `fixme`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Skjule | moderator, `hidden=true`, bekreftet i dialogen | ok, rapporten er borte for alle andre | – |
| Avbryte | dialogen lukkes med «Avbryt» eller Escape | ingen endring, fokus tilbake på «Skjul rapport» | – |
| Vise | moderator, `hidden=false` | ok uten dialog | – |
| Skjule på nytt | allerede skjult, `hidden=true` | ok, ingenting endres | – |
| Ikke moderator | bruker, også på egen rapport | DB `42501`, REST 403 | `forbidden` |
| Finnes ikke | gyldig uuid uten rad | 0 rader | `report_not_found` |
| Ugyldig input | id ikke uuid, eller `hidden` ikke boolean | ingen spørring | `validation_failed` |
| Andre etter skjuling | rapportøren, en annen bruker, en besøkende | borte fra lista og «Mine rapporter», lenken gir «Fant ikke rapporten.» | – |

</frozen-after-approval>

## Code Map

- `features/moderering/actions.ts` -- `setReportStatus` er mønsteret: `parseReportId`, `requireUser`, Zod, `.select(...)`, 0 rader gir et nytt oppslag, `revalidate()`, logger bare koden. Ved 0 rader gir det her alltid `report_not_found`, siden det ikke finnes noen utdatert tilstand.
- `features/moderering/components/status-panel.tsx` -- tar `{ reportId, status }`, synker props under render, har `focusRequest` og en ref. Skjul/vis-knappen legges på egen rad under statusknappene i samme `<section>`.
- `app/rapporter/[id]/page.tsx:58-60` -- `StatusPanel` får også `hidden={result.report.hidden}`. `page.test.ts` oppdateres.
- `shared/ui/` -- har ingen alert-dialog. `components.json` (new-york, aliaser til `@/shared/ui`). `dropdown-menu.tsx` bruker `forwardRef` og `@radix-ui/react-*`, og alle avhengighetene er pinnet.
- `app/globals.css:46-47` og `tailwind.config.ts:62-64` -- `bg-status-hidden` og `text-status-hidden-foreground` (DESIGN.md hidden-bg og hidden-fg).
- `features/rapporter/components/report-card.tsx` og `report-detail.tsx` -- får `Report` med `hidden`, men viser ingen merking i dag.
- `supabase/tests/status.sql` -- dekker allerede skjuling, idempotent skjuling, 42501 og at `status_changed_at` står stille. Mangler visning alene.
- `features/moderering/status.db.test.ts` -- bruker får 403 ved skjuling. Mangler moderatoren som skjuler og viser.
- Disse finnes og må fortsatt bestå: `e2e/les/detalj.spec.ts:171` og `detalj-innlogget.spec.ts:13` (404 på seed-rapport 7), `bekreft-tilstander.spec.ts:86`, `mine.spec.ts`, `features/registrering/storage.db.test.ts:96-145` (bildet kan ikke signeres) og `shared/supabase/images.ts:7` (60 s).
- `e2e/core-flow.spec.ts:374-438` -- moderatorsteget fra 4.1, med `reportPath`, `summary`, `moderatorPanel` og `narrow`.
- `e2e/endrer/status.spec.ts` og `e2e/api.ts` -- mønsteret med egne rapporter per test (`createReportAs`).

## Tasks & Acceptance

**Execution:**
- [x] `shared/ui/alert-dialog.tsx` + `package.json` -- legg til shadcn-`AlertDialog` (new-york, `forwardRef`) med `@radix-ui/react-alert-dialog` pinnet til eksakt versjon -- UX-DR15.
- [x] `features/moderering/actions.ts` (+ test) -- `setReportHidden(reportId, hidden)`. `hidden` valideres som boolean med Zod. Svaret er `{ hidden }`, og 0 rader gir `report_not_found`.
- [x] `features/moderering/components/hide-control.tsx` (eller i panelet) -- «Skjul rapport» (`outline`) åpner dialogen, og bekreftelsen kaller handlingen. «Vis rapport» kaller den direkte. Knappene er `disabled` mens den lagrer. Fokus etter svaret går til motsatt knapp. Feil gir `toast.error`. Avbryt gir fokus tilbake.
- [x] `status-panel.tsx` og `app/rapporter/[id]/page.tsx` (+ `page.test.ts`) -- panelet får `hidden` og viser kontrollen.
- [x] `features/rapporter/components/report-card.tsx` og `report-detail.tsx` -- når `hidden`: merkelapp «Skjult» og grå bakgrunn (kortet) eller merking ved statusmerket (detaljsiden).
- [x] `supabase/tests/status.sql` -- moderatoren viser en skjult rapport (`hidden=false`), og `status_changed_at` står stille. Ingen rad er slettet.
- [x] `features/moderering/status.db.test.ts` -- moderatoren skjuler og viser via REST (200), og `status_changed_at` er uendret.
- [x] `e2e/endrer/skjul.spec.ts` -- dialog, avbryt, bekreft, fokus, «Skjult» i lista og på detaljsiden for moderatoren, rapportøren og en besøkende får 404 og ser den ikke i lista og «Mine rapporter», vis igjen, toast ved nettverksfeil, og axe på den åpne dialogen, lista med skjult rapport og detaljsiden.
- [x] `e2e/core-flow.spec.ts` -- etter statussteget: skjul med tastatur, også bekreftelsen i dialogen. Fokus på «Vis rapport». axe.

**Acceptance Criteria:**
- Gitt en skjult rapport, når moderatoren ser lista eller detaljsiden, så står den blandet inn med «Skjult» og grå bakgrunn.
- Gitt hele testpakken, når `npm test` og `npm run lint` kjøres, så er alt grønt, axe gir null serious eller critical, og ingen eksisterende test er svekket.
- Gitt kjerneflyttesten, når den kjøres, så går hele AD-15-flyten gjennom: logge inn, filtrere, åpne, bekrefte, registrere, og som moderator endre status og skjule (NFR-8).

## Implementation Notes

- `@radix-ui/react-alert-dialog` er pinnet til `1.2.1`, med de samme Radix-versjonene som `react-dropdown-menu@2.2.1` bruker (`primitive 1.2.0`, `react-primitive 2.2.0`, `react-context 1.3.0`).
- «Skjult»-merket er `features/rapporter/components/hidden-badge.tsx`, siden bare `rapporter` bruker det. Det har en tynn kant i `status-hidden-foreground`, så merket synes også på det grå kortet.
- `HideControl` setter bare det som vises etter et vellykket svar, ikke `server`. Svaret kan komme før de revaliderte propsene. Hadde `server` blitt satt, ville de gamle propsene sett ut som en endring fra serveren og satt knappen tilbake, og fokus havnet på en knapp som ble byttet ut rett etterpå (funnet i e2e). Konsekvensen er at hvis en annen moderator snur skjulingen tilbake mellom svaret og revalideringen, viser panelet det gamle valget til neste innlasting.
- Panelet har nå også «Skjul rapport», så forventningene til `panel.getByRole("button")` i `status.spec.ts` og `core-flow.spec.ts` lister den sist. Ingen sjekk er fjernet.
- Etter review: knappene bruker `aria-disabled` (ikke `disabled`) mens de lagrer, så fokus aldri havner på `body`, og utløseren åpner ikke dialogen da. Knappene i dialogen står i DOM-rekkefølge også på mobil (`flex-col`). Detaljsiden har grå bakgrunn på `<article>` når rapporten er skjult, som kortet i lista. Beslutningene står i EXPERIENCE.md (begge kopiene).
- Kjerneflyttesten fikk `test.setTimeout(90_000)`. I endrer-360 brukte den allerede over 30 s (36 s ved første kjøring) før skjulesteget, med axe ved 320 px.

- Etter review-rettelsene, i en ny klone i Temp (`sm10`): `tsc` og `npm run lint` er rene. Full `npm test` ga exit 0 på 839 s: unit 1108 av 1108 (84 filer), pgTAP PASS, db 53 av 53, Playwright 280 av 280 (12,5 min).

## Spec Change Log

## Review Triage Log

Gjennomgang 1: Blind Hunter (11 funn), Edge Case Hunter (6) og Verification Gap (2 hull og 1 annet funn).

- **Fokus på `body` under lagring (BH1, EC1, EC2, VG-annet), medium, patch:** `disabled` på knappen som har fokus, eller på utløseren som `onCloseAutoFocus` prøver å fokusere, flytter fokus til `body` til svaret kommer. Det bryter «aldri til `body`» i den frosne delen. Teksten «`disabled`» i oppgaven var for snever. Rettes som i `ConfirmSection`: `aria-disabled` og en vakt.
- **BH4/EC6, medium, patch:** den frosne AC-en krever «Skjult» og grå bakgrunn på både lista og detaljsiden. Detaljsiden fikk bare merkelappen, fordi oppgaveteksten var for snever. Grå bakgrunn legges til.
- **VG1, medium, patch:** synken av `hidden` fra serveren i `HideControl` er ikke testet. Testen får en endring utenfra pluss revalidering, og en omlasting etter skjuling.
- **VG2, utsatt:** grenen der `setReportHidden` svarer `ok: false` og viser toast, er ikke testet i e2e. Den er vanskelig å utløse for en innlogget moderator, og panelet fra 4.1 har samme form.
- **BH2, low, avvist:** panelet har ingen egen live-region for skjult. Fokus går til «Vis rapport», som sier tilstanden, og AC-en krever ikke mer.
- **BH3/EC5, low, avvist:** status og skjuling kan lagres samtidig. Det krever to raske trykk på hver sin knapp, og rettingen trenger delt tilstand.
- **BH5, false:** sprintstatusen settes til `review` i steg 5.
- **BH6, false:** `package-lock.json` ble holdt utenfor review-diffen med vilje. Den ligger i arbeidskopien og committes med endringen.
- **BH7a, low, patch:** under `sm` snur `flex-col-reverse` rekkefølgen, så den visuelle rekkefølgen ikke stemmer med tab-rekkefølgen. Rettes med `flex-col`.
- **BH7b, low, avvist:** bekreftknappen i dialogen har primærstil. Det er shadcn sin standard, og spec-en sier ingenting om stilen.
- **BH8/EC3, low, avvist:** et kappløp med en annen moderator i millisekundene mellom svaret og revalideringen. Det er beskrevet i Implementation Notes, og handlingen tar en eksplisitt målverdi, så et nytt trykk gjør ingen skade. Omlastingen dekkes av VG1.
- **EC4, low, avvist:** at dialogen fjernes mens den er åpen, krever en revalidering mens den er åpen. Det skjer bare via egen handling.
- **BH9, low, delvis patch:** testene for skjuling og visning i `status.db.test.ts` sjekker ikke at nøyaktig én rad kom tilbake. Det rettes. `try/finally` avvises (low). Visning som vanlig bruker er dekket i `status.sql` fra 4.1: 0 rader, siden RLS skjuler raden.
- **BH10, low, patch:** `EXPERIENCE.md` (begge kopiene) får et «Oppdatert … (Story 4.2)»-punkt med dialogteksten, fokusreglene og merkingen.
- **BH11, low, patch:** kommentaren i `hidden-badge.tsx` sier «samme grå», men kanten er den mørkere forgrunnsgrå.
- **BH12, low, avvist:** grensen på 90 s er hevet for kjerneflyttesten. `filter.spec.ts` og `mine.spec.ts` gjør det samme, og rapporten testen lager, blir liggende til `db reset`, som for de andre testene.

## Design Notes

**0 rader gir alltid `report_not_found`.** Skjuling har ingen fra-verdi, så det finnes ingen utdatert tilstand. Treffer ikke `WHERE id = $1` noen rad, finnes rapporten ikke for brukeren. En vanlig bruker får `42501` fra triggeren før det.

**Fokus etter dialogen:** Radix gir fokus tilbake til utløseren når dialogen lukkes. Etter bekreftelse byttes utløseren mot «Vis rapport», så fokus settes eksplisitt etter svaret, som i 4.1.

## Verification

**Commands:**
- `npm run lint` og `npx tsc --noEmit` -- uten feil.
- `npm test` i en klone i Temp (supabase.exe er blokkert i prosjektmappen) -- alt bestått, og kjøretiden står i PR-beskrivelsen.
