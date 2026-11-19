# Flytteplan: vertical slices med felles `shared/`

Status: gjennomført på branchen `refactor/vertical-slices` etter godkjenning 2026-11-19. Avvikene fra planen står sist.
Dato: 2026-11-19. Planen under er slik den ble godkjent. Baseline på `main` (55eb89c): `npm run test:unit` gir 78 testfiler og 983 tester, ingen typefeil.

## 1. Mål og regler

Koden ligger i dag lagdelt: `components/` (29 filer) og `lib/` (61 filer) er flate, og `app/` har rutene. Målet er at hver funksjon (slice) har sin egen mappe med alt den trenger, og at det som flere slices bruker, ligger i `shared/`.

Tre regler, som håndheves av ESLint og ikke bare står i et dokument:

1. **Isolasjon.** En slice i `features/<slice>/` importerer bare fra `shared/` og fra seg selv, aldri fra en annen slice.
2. **DRY.** Det to eller flere slices bruker, ligger i `shared/`. Det én slice bruker, ligger i sliceen, også om en annen slice kan få bruk for det senere. Flyttes til `shared/` den dagen den andre faktisk trenger det.
3. **Komposisjon i `app/`.** `app/` (ruter, layout, `loading`, `error`, `manifest`) er det eneste laget som kan importere fra flere slices. Der settes slicene sammen.

Lagdelingen i AD-3 gjelder videre inne i hver slice: komponentfilene (`*.tsx`) importerer ikke `shared/supabase/server`, `shared/supabase/images` eller `ai/`. Datatilgang går via `actions.ts` og `queries.ts`. Unntaket er fortsatt nettleserklienten, som bare `features/auth` får bruke.

## 2. Målstruktur

```
app/                      ruter og komposisjon (tynne filer, ingen ny logikk)
features/
  rapporter/              se og finne rapporter: liste, kort, detalj, filter, «Mine rapporter»
  registrering/           melde et problem: skjema, KI-forslag, bildeopplasting
  auth/                   konto og innlogging
  bekreftelser/           «Jeg har også sett dette»
  moderering/             opprettes i Story 4.1 (ikke en tom mappe nå)
shared/
  ui/                     shadcn-komponentene (button, card, select ...)
  report/                 det alle slices vet om en rapport: labels, status-badge, report-id
  supabase/               klienter, auth, proxy, genererte typer, signerte bildelenker
  lib/                    env, errors, format, limits, utils
  layout/                 site-header og back-link (uten kunnskap om slicene)
e2e/  evals/  supabase/   blir liggende (se punkt 6)
```

Inni en slice: `components/` for `*.tsx`, og `actions.ts`, `queries.ts` og rene logikkfiler i sliceroten. Tester ligger ved siden av filen de tester, slik de gjør i dag.

### Epic til slice

Epicene er ikke rene kodegrenser. Epic 3 bygger på lista fra Epic 1 og på detaljsiden, og strengt epic for epic ville gitt slices som importerer hverandre.

| Epic | Slice |
|---|---|
| Epic 1: se rapportene | `rapporter` |
| Epic 2: melde et problem | `registrering` (2.2 til 2.5) og `auth` (2.1) |
| Epic 3: finne og bekrefte | `rapporter` (3.1 filter og 3.2 «Mine», fordi de er selve lista) og `bekreftelser` (3.3) |
| Epic 4: moderator | `moderering` (bygges slik fra Story 4.1) |

## 3. Hvor hver fil havner

### `shared/ui/`
`components/ui/*` (badge, button, card, dropdown-menu, input, label, select, skeleton, sonner, textarea). `lib/utils.ts` og testen flyttes til `shared/lib/utils.ts`, og `components.json` får nye aliaser slik at `npx shadcn add` fortsatt legger filene riktig.

### `shared/report/`
`lib/labels.ts` (bare `CATEGORY_LABELS` og `STATUS_LABELS`), `components/status-badge.tsx` og `lib/report-id.ts` med test. Her bor det flere slices trenger: `report-card` og `report-detail` bruker statusmerket i dag, og moderatorpanelet i Epic 4 trenger det også.

### `shared/supabase/`
Alt i `lib/supabase/` som er felles: `client.ts`, `server.ts`, `auth.ts`, `proxy.ts`, `types.ts`, `database.types.ts`, `images.ts` og `test-admin.ts`, med testene sine. `images.ts` er felles fordi opplasting (registrering) og signerte lenker (rapporter) deler `IMAGE_BUCKET`. `scripts/db-types.mjs` får ny sti til `database.types.ts`.

### `shared/lib/`
`env.ts`, `errors.ts`, `format.ts`, `limits.ts` og `utils.ts` med testene sine. `limits.ts` er felles fordi registreringsskjemaet, kontoskjemaet og KI-valideringen alle bruker den.

### `shared/layout/`
`components/site-header.tsx` og `components/back-link.tsx`. Se endring A under.

### `features/rapporter/`
- `components/`: `report-list.tsx`, `report-card.tsx` (+ test), `report-detail.tsx`, `list-filters.tsx`
- `queries.ts` (+ test), fra `lib/supabase/reports.ts`
- `list-params.ts` (+ test)
- `labels.ts` med `SORT_LABELS`, som i dag står i `lib/labels.ts` og trekker en felles fil mot en sliceregel

### `features/registrering/`
- `components/`: `report-form.tsx` (+ test), `image-field.tsx`, `ai-tag.tsx`, `new-report-fab.tsx`, `new-report-link.tsx`
- `actions.ts` (+ test), fra `app/rapporter/ny/actions.ts`
- `ai/`: hele `lib/ai/` (index, mock, openai, timeout, validate, med tester)
- `report-input.ts`, `image-input.ts`, `image-process.ts`, `suggest-trigger.ts`, med tester
- `reports-insert.db.test.ts` og `storage.db.test.ts`

### `features/auth/`
- `components/`: `auth-form.tsx`, `login-form.tsx`, `sign-up-form.tsx`, `user-menu.tsx`
- `auth-errors.ts` og `safe-next.ts`, med tester
- `seed-login.db.test.ts` og `signup-role.db.test.ts`

### `features/bekreftelser/`
- `components/confirm-section.tsx`
- `actions.ts` (+ test), fra `app/rapporter/[id]/actions.ts`
- `confirm-state.ts` (+ test)
- `bekreftelser.db.test.ts`

### Blir i `app/`
Alle `page.tsx`, `layout.tsx`, `loading.tsx` (+ test), `error.tsx` (+ test), `not-found.tsx`, `manifest.ts`, `globals.css`. Bare importene endres.

### Andre flyttinger
- `lib/test-images.ts` → `e2e/test-images.ts` (bare e2e bruker den)
- `lib/no-cache.test.ts` → `shared/lib/no-cache.test.ts`. Den, `client.test.ts` og `images.test.ts` er arkitekturtester som leser kildefilene. De beholder oppgaven, men leser nye mapper (se punkt 5).
- `components/` og `lib/` finnes ikke etterpå.

## 4. De to endringene som ikke bare er flytting

Resten er ren flytting med oppdaterte importer.

**A. `SiteHeader` tar innholdet til høyre som en slot.** I dag importerer headeren `NewReportLink` (registrering) og `UserMenu` (auth). Det ville brutt regel 1 fra `shared/`. I stedet tar `SiteHeader` en prop `actions: ReactNode`, og `app/layout.tsx` setter inn `<NewReportLink />` og `<UserMenu />`. Utseende og tilgjengelighet er uendret.

**B. `ReportDetail` tar bekreftelsen som `children`.** I dag importerer `report-detail` `ConfirmSection` (bekreftelser). I stedet rendrer `app/rapporter/[id]/page.tsx` `<ReportDetail …><ConfirmSection …/></ReportDetail>`. `page.test.ts` oppdateres. Det gjør også at moderatorpanelet i Epic 4 kan settes inn på samme måte uten at `rapporter` må kjenne `moderering`.

Begge følger regel 3. Ingen andre filer endrer atferd.

## 5. Det som må justeres utenom importene

Stiene står hardkodet disse stedene. Glemmes noe, feiler det enten høylytt (tester) eller stille (Tailwind).

| Sted | Hva |
|---|---|
| `tailwind.config.ts` | `content` får `./features/**` og `./shared/**`. **Stille feil om det glemmes:** klasser forsvinner fra CSS-en uten at noen test sier fra, så jeg sjekker i nettleser |
| `vitest.config.ts` | `include`, `exclude` og `typecheck.include` for `unit` og `db` får `features/**` og `shared/**` |
| `eslint.config.mjs` | nytt: `no-restricted-imports` per slice og per lag (punkt 1) |
| `components.json` | aliaser for `ui`, `utils` og `components` |
| `scripts/db-types.mjs` | sti og meldinger for `database.types.ts` |
| Arkitekturtester | `no-cache.test.ts`, `client.test.ts`, `images.test.ts` (glob over kildefilene), `report-form.test.ts` (leser filer), `env.test.ts`, `image-input.test.ts`, `limits.test.ts` (relative stier til `supabase/config.toml`), `bekreftelser.db.test.ts` (`ROOT`) |
| Regelen «Supabase-klient bare i `lib/supabase/`» | blir «bare i `shared/supabase/`», og testen oppdateres tilsvarende |

## 6. Hva som bevisst blir stående

- **`e2e/`** beholder sin plassering og inndeling (`les`, `endrer`, `reset`). Playwright-testene går gjennom flere slices og har en fast rekkefølge (AD-15).
- **`evals/sm5/`** blir liggende. Den importerer `features/registrering/ai`, som er lov: evals er testkode utenfor appen.
- **`supabase/`** (migrasjoner, seed, pgTAP) blir liggende. Databasen er ett skjema, og migrasjoner kan ikke deles per slice uten å endre historikken.
- **`docs/implementation-artifacts/spec-*.md`** og `.logs/` rettes ikke. De er historikk og viser stiene slik de var da storyene ble bygget.
- **`features/moderering/`** opprettes først i Story 4.1.

## 7. Gjennomføring

Én branch, `refactor/vertical-slices`, fra `main`. Ingen andre grener er åpne, så det blir ingen flettekonflikter. Commits i denne rekkefølgen, og hver skal kompilere og bestå `npm run test:unit`:

1. **Flytting.** Et skript gjør `git mv` etter tabellen i punkt 3 og skriver om alle importer (`@/…`, relative og `vi.mock`-stier) ut fra importgrafen. Skriptet ligger utenfor repoet. Til slutt: `tsc` uten feil.
2. **Stier utenom importene** (punkt 5), unntatt ESLint-reglene.
3. **Endring A og B** (punkt 4).
4. **ESLint-reglene** for isolasjon og lagdeling, med en bevisst feil som viser at de slår til, og så fjernet.
5. **Dokumenter** (punkt 8).
6. **Logg.**

Én commit per steg gjør at `git log --follow` fortsatt finner historikken til hver fil.

## 8. Dokumenter som oppdateres i samme PR

Etter «Definisjon av ferdig»: endres en regel, oppdateres dokumentet og beslutningsloggen i samme PR.

- `ARCHITECTURE-SPINE.md`: lagtabellen (linje 29 til 32), diagrammet og avhengighetsregelen (38 til 50), mappetreet (260 til 279), kravtabellen (288 til 305), og at klienten bare opprettes i `shared/supabase/`. Ny AD for vertical slices, med regel 1 til 3 og begrunnelsen (nummeret sjekkes mot spinen).
- `docs/beslutninger/arkitektur-beslutningslogg.md`: ny oppføring med valget og avvist alternativ (flate `components/` og `lib/`).
- `docs/planning-artifacts/epics.md`: en setning under Epics om hvor koden ligger, og nye stier i Epic 4-storyene som ikke er bygd.
- `README.md`: de seks stiene.

## 9. Verifisering

- `npx tsc --noEmit` og `npm run lint` uten feil og uten nye advarsler.
- `npm run test:unit`: **samme 78 filer og 983 tester som baseline.** Færre tester betyr at en fil falt ut av en glob.
- `npm run build`.
- Full `npm test` (unit, db med pgTAP, e2e med axe) i en ny klone i Temp, siden Supabase-CLI er blokkert i prosjektmappen.
- Visuell sjekk i nettleser av liste, detalj, skjema og innlogging, for å se at Tailwind fortsatt gir alle klassene.
- CI på PR-en.
- README følges på en ny klone, som etter hver epic.

## 10. Risiko

| Risiko | Tiltak |
|---|---|
| Tailwind mister klasser uten feilmelding | `content`-globen endres i steg 2, og sjekkes i nettleser |
| En arkitekturtest globber den gamle mappen og består uten å teste noe | testantallet må være 983, og hver arkitekturtest kontrolleres på at den finner kildefiler |
| Stor diff | bare flytting og importer, i steg 1. Atferdsendringene er isolert til steg 3 |
| Et dokument peker på gamle stier | `grep` etter `components/` og `lib/` i levende dokumenter før PR |
| Epic 4 starter før PR-en er flettet | Epic 4 startes først etter at denne er flettet |

## 11. Beslutninger jeg trenger fra deg

1. Er du enig i slicene i punkt 2, med `rapporter` som både Epic 1 og filter og «Mine rapporter» fra Epic 3?
2. Er `shared/report/` greit, eller vil du ha `labels`, `status-badge` og `report-id` direkte i `shared/lib` og `shared/ui`?
3. Er du enig i at de to atferdsnære endringene (A og B) hører med, siden isolasjon ellers ikke går opp?

## 12. Avvik fra planen

- **Regelen ble AD-16.** Spinen hadde AD-1 til AD-15, så nummeret etter AD-15 er 16.
- **Steg 1 og 2 ble én commit.** Flytting og stier i konfig og tester kan ikke komme hver for seg og samtidig bestå testene.
- **Ny vakttest:** `shared/lib/slices.test.ts` står ikke i planen. ESLint ser bare aliasimporter, så testen tar også relative stier og dynamiske importer.
- **`SORT_LABELS` ble flyttet i steg 4,** etter at en skanning av importene fant at `shared/report/labels.ts` importerte `ListSort` fra `rapporter`.
- **`deferred-work.md`** fikk også nye stier (to steder), ut over dokumentene i punkt 8.
- **Testtall:** 40 til 41 testfiler i unit-prosjektet (78 til 80 i Vitests telling, siden hver fil kjøres og typesjekkes), og 983 til 991 tester. De 8 nye er `slices.test.ts` og en ny test for bekreftelsen som `children` i `page.test.ts`, begge talt to ganger.

