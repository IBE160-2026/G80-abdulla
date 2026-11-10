---
title: 'Story 2.2: Registrere en rapport'
type: 'feature'
created: '2026-11-10'
status: 'in-review'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'cf201e72c55e48c11e10fc719c1fff741b3098e3'
context:
  - '{project-root}/docs/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Ingen kan registrere en rapport. Databasen har bare lesegrants, og appen har verken skjema, «Registrer problem»-knapp eller Server Action (issue #30, FR-3, UX-DR4, UX-DR9, UX-DR10, UX-DR12).

**Approach:** En migrering gir `authenticated` INSERT på `reports` som kolonnegrant, med `WITH CHECK (author_id = auth.uid())`. `/rapporter/ny` er en innloggingsbeskyttet side med skjema (beskrivelse, kategori, lokasjon) og en Server Action `createReport` som validerer, setter inn med brukerens sesjon og svarer `{ ok, data }`. Lista får den flytende «+»-knappen (under 640 px), topplinja «Registrer problem» (fra 640 px) og knappen i tomtilstanden. Etter innsending kommer brukeren til detaljsiden med toasten «Rapporten er sendt inn».

## Boundaries & Constraints

**Always:**
- Databasen er den egentlige kontrollen (AD-1). INSERT gis bare på kolonnene `description, location, category, summary, image_path`. `author_id` (`DEFAULT auth.uid()`), `status`, `hidden`, `created_at` og `status_changed_at` kan ikke settes av brukeren. Policyen navngir `TO authenticated`. `anon` får ingen INSERT. Ingen DELETE eller TRUNCATE.
- Beskrivelse (maks 1000), lokasjon (maks 200) og kategori (en av fem) er påkrevd. Grensene gjelder trimmet tekst, telles med `charCount` fra `lib/limits.ts` (kodepunkter) og er like i skjemaet, i `createReport` og i `CHECK`. Bare mellomrom regnes som tom. Tom tekst lagres aldri som tom streng.
- Én definisjon av validering (`lib/report-input.ts`, Zod 4.6.7) brukes av både skjemaet og Server Action, med de samme norske feilmeldingene.
- `createReport` kaller `requireUser("/rapporter/ny")` først, trimmer, validerer, setter inn `{ description, location, category }` og leser `id` tilbake, sjekker både `error` og at en rad kom tilbake, og kaller `revalidatePath("/")` og `revalidatePath("/rapporter/<id>")`. Svaret er `{ ok: true, data: { id } }` eller `{ ok: false, error: { code, message } }`. Feil oversettes i `lib/errors.ts` (lukket vokabular fra arkitekturen), og tekst fra databasen vises eller logges aldri. Bare feilkoden logges, aldri rapporttekst eller e-post.
- «Send inn» er deaktivert til de tre feltene er fylt (bare mellomrom er tomt) og mens innsendingen pågår («Sender …»). Tekst over grensen holder knappen aktiv, så et forsøk viser feilen under feltet (`aria-describedby`, `aria-invalid`) og flytter fokus til første feil. Telleren «N/1000» er ikke `aria-live`. Alt brukeren har skrevet, beholdes ved feil.
- Etter vellykket innsending: `toast.success("Rapporten er sendt inn")`, så `router.replace` til `/rapporter/<id>`, slik at «←» går til lista. Ved feil: destructive-toast «Kunne ikke sende inn. Prøv igjen.»
- Skjemaet bruker 16 px tekst i feltene, trykkflater på minst 44 px og samme `main`-bredde som de andre sidene (maks 640 px, 16 px marg). Fokus står i beskrivelsen ved åpning.
- Nye npm-pakker er bare `sonner` og `@radix-ui/react-select`, eksakte versjoner funnet med `npm view`, og begge føres i Stack-tabellen. shadcn-CLI-en kjøres som `npx shadcn@4.23.0`, og utskriften sjekkes for Tailwind v4-syntaks.

**Never:**
- Ingen KI-forslag, oppsummering eller bilde (Story 2.3 og 2.4). `summary` og `image_path` sendes ikke fra skjemaet. Påminnelsen under beskrivelsen er bare «Ikke skriv navn eller andre personopplysninger.», uten setningen om KI-tjenesten, siden den ikke er sann før 2.3.
- Ingen endring i `proxy.ts`, `supabase/config.toml` eller `lib/safe-next.ts`. `profiles` skrives ikke. Ingen `process.env` utenfor `lib/env.ts`.
- «←» (`BackLink`) endres ikke. Den utsatte rettingen for andre forrige sider hører til Story 3.3.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Gyldig innsending | Innlogget, tekst med mellomrom foran og bak, kategori valgt | Lagret trimmet, status **Ny**, detaljsiden viser «1 har sett dette», toast, rapporten øverst i lista | N/A |
| Nøyaktig grense | 1000 tegn og 200 tegn, også med emoji og æøå | Godtatt | N/A |
| Ett tegn for mye | 1001 eller 201 tegn | Feil under feltet og fokus dit; ingenting sendes | `validation_failed` i action, `23514` i databasen |
| Bare mellomrom | Beskrivelse eller lokasjon er «   » | Knappen er deaktivert | `validation_failed`, `23514` |
| Besøkende | Åpner `/rapporter/ny` eller trykker «+» | Sendes til `/auth/login?next=%2Frapporter%2Fny` og er tilbake etter innlogging | `requireUser` |
| Innsending feiler | Databasefeil eller nettverk | Destructive-toast, feltene er beholdt, ingen databasetekst | `unknown`, `forbidden` for `42501` |
| Forfalsket felt | `author_id`, `status`, `hidden`, `created_at` eller `status_changed_at` i INSERT | Avvist | `42501` |
| `anon` setter inn | Uten innlogging | Avvist | `42501` |
| Ugyldig kategori | En annen verdi enn de fem kodene | Avvist før databasen | `validation_failed` |
| Dobbeltklikk | To trykk på «Send inn» | Én rapport | Skjemaet ignorerer trykk mens `pending` |

</frozen-after-approval>

## Code Map

- `supabase/migrations/20261108190211_datamodell.sql` -- `reports` har `author_id DEFAULT auth.uid()`, `CHECK`-reglene og bare SELECT-grants. Skriveregler er lovet til denne storyen (linje 5–7). Ikke endre; ny migrering ved siden av.
- `supabase/tests/skriving.sql` -- uttømmende grantmatrise (linje 12–40) og `42501` på INSERT for alle roller. Må oppdateres til at `authenticated` har INSERT på fem kolonner. `begrensninger.sql` har allerede grensetester med emoji, og `hjelpere.psql` har `tests.as_user/as_anon/bruker1()`.
- `lib/limits.ts` -- `DESCRIPTION_MAX`, `LOCATION_MAX`, `charCount`. `lib/labels.ts` -- `CATEGORY_LABELS`. `lib/supabase/database.types.ts` -- `Constants` (enum-rekkefølgen er visningsrekkefølgen).
- `lib/supabase/auth.ts` (`requireUser`), `lib/supabase/server.ts` (`createClient`, async, ny per kall). `lib/supabase/reports.ts` -- leser fra `reports_with_counts`; ingen INSERT finnes. `lib/supabase/reports.test.ts:15-37` -- mock-mønsteret for `./server`.
- `lib/errors.ts` og `lib/report-input.ts` -- finnes ikke. Ingen Server Action finnes ennå (`app/**/actions.ts` er konvensjonen).
- `components/auth-form.tsx` -- mønsteret for `noValidate`, `aria-describedby`/`aria-invalid`, `flushSync` og fokus til første feil, `FieldError` (privat, kopier mønsteret), `role="alert"`, `h-11`-felt og `pending`. `components/ui/` har `button`, `input`, `label`, `badge`, `card`, `dropdown-menu`, `skeleton`; `textarea`, `select` og `sonner` mangler.
- `app/layout.tsx` -- ingen Toaster; legges til her. `components/site-header.tsx` og `components/user-menu.tsx` -- ☰-knappen har `ml-auto -mr-2 size-11`, headeren er `bg-primary`.
- `app/(liste)/page.tsx` -- `main` har `pb-8`. `components/report-list.tsx:42-48` -- tomtilstanden er bare en tekst. `lib/no-cache.test.ts` -- `PAGES`-lista av sider som må være `force-dynamic`.
- `components/back-link.tsx` -- vises for alle stier under `/rapporter/`, også `/rapporter/ny`, og går tilbake i historikken når det finnes en forrige side i appen.
- `e2e/core-flow.spec.ts` -- teller nøyaktig 8 kort og åpner seed-kort etter plassering. `e2e/auth.ts` (`logIn`), `e2e/keyboard.ts` (`tabTo`), `e2e/layout.ts`, `e2e/a11y.ts`. `e2e/endrer/registrering.spec.ts` -- mønsteret for data-endrende tester. `playwright.config.ts` -- `endrer-360` og `endrer-1280` deler databasen og kjører etter `les-*`. `e2e/reset/liste.spec.ts` og `e2e/fixtures/tom.sql` -- tomtilstanden.

## Tasks & Acceptance

**Execution:**
- [x] `supabase/migrations/<tidsstempel>_skriving_reports.sql` -- `GRANT INSERT (description, location, category, summary, image_path) ON public.reports TO authenticated` og policy `TO authenticated WITH CHECK (author_id = auth.uid())` -- AD-12, AR-7
- [x] `supabase/tests/skriving.sql` -- ny grantmatrise (fem kolonne-INSERT for `authenticated`), `anon` og forfalskede kolonner gir `42501`, brukeren kan sette inn og `author_id` blir hens id, `status`/`hidden`-standardene gjelder -- NFR-4
- [x] `lib/supabase/reports-insert.db.test.ts` (Vitest `db`) -- innlogget seed-bruker: 1000/200 tegn med emoji og æøå godtas, 1001/201 avvises, og tallene stemmer med `charCount` -- AC om lik telling
- [x] `lib/report-input.ts` (+ test) -- Zod-skjema, trimming, `charCount`-grenser, kategori mot `Constants`, feltmeldinger
- [x] `lib/errors.ts` (+ test) -- hele feilvokabularet fra arkitekturen med norske meldinger, `toActionError` slår opp `23514`→`validation_failed`, `42501`→`forbidden`, ellers `unknown`
- [x] `app/rapporter/ny/actions.ts` (+ test) -- `createReport` etter Boundaries. Tester: trimming, grenser, kategori, tom tekst, feilkoder, `revalidatePath`, at ingen tekst logges
- [x] `app/rapporter/ny/page.tsx` -- `requireUser`, tittel «Ny rapport», `force-dynamic`, legges i `PAGES` i `lib/no-cache.test.ts`
- [x] `components/report-form.tsx`, `components/ui/textarea.tsx`, `components/ui/select.tsx`, `components/ui/sonner.tsx`, `package.json` og låsefil, `app/layout.tsx` -- skjemaet, shadcn-komponentene, `<Toaster />` (bare lys modus, ingen `next-themes`)
- [x] `components/new-report-fab.tsx`, `app/(liste)/page.tsx`, `components/report-list.tsx`, `components/site-header.tsx` (+ ny klientkomponent for lenka) -- flytende «+» (56 px, `fixed bottom-4 right-4`, `aria-label="Registrer problem"`, skjult fra 640 px, nok `pb` så siste kort ikke dekkes), topplinjelenke fra 640 px (skjult på `/auth/*` og `/rapporter/ny`, lyst omriss på `bg-primary`, 44 px), og knappen «Registrer problem» i tomtilstanden
- [x] `e2e/endrer/ny-rapport.spec.ts` -- besøkende → innlogging → tilbake til skjemaet, fokus i beskrivelsen, tegnteller, feil over grensen med fokus på første feil, innsending med toast og «1 har sett dette», `aria-label` og knapper på 360 og 1280 px, axe (tomt og med feil) og ingen horisontal scrolling på 360 og 320 px
- [x] `e2e/core-flow.spec.ts` -- registrere en rapport bare med tastatur etter innloggingen, med unik tekst per kjøring. Gjør de to `toHaveCount(8)` og stegene som åpner seed-kort etter plassering til sjekker som tåler at lista har flere rapporter enn seed når `endrer-1280` kjører etter `endrer-360`
- [x] `e2e/reset/liste.spec.ts` -- tomtilstanden har knappen «Registrer problem» til `/rapporter/ny`
- [x] `docs/ux/EXPERIENCE.md` og BMAD-kopien, `DESIGN.md` i roten og BMAD-kopien, `docs/beslutninger/ux-beslutningslogg.md`, Stack-tabellen i arkitekturen, `README.md` -- avvikene under Design Notes, nye pakker og status for Story 2.2

**Acceptance Criteria:**
- Given en besøkende, when hen trykker «+» eller åpner `/rapporter/ny`, then sendes hen til innlogging og er tilbake på skjemaet etterpå.
- Given skjemaet, when det åpnes, then står fokus i beskrivelsen, og «Send inn» er deaktivert til alle tre feltene er fylt.
- Given en gyldig innsending, when svaret kommer, then står rapporten øverst i lista med status **Ny**, og «←» på detaljsiden går til lista.
- Given tekst over grensen, when brukeren prøver å sende, then ligger fokus på første feil, og databasen avviser den samme teksten med `23514`.
- Given skjemaet bare med tastatur, when det fylles og sendes, then virker alt, og axe gir ingen `serious`/`critical` på 360, 320 og 1280 px.

## Implementation Notes

- Implementert av en underagent (migrering `20261110120000_skriving_reports.sql`, `createReport`, skjema, inngangene, tester og dokumenter). `next-themes`, som shadcn-CLI-en la til, ble fjernet igjen.
- Matrise-revisjonen fant at raden «Dobbeltklikk» manglet test. Testen «dobbeltklikk på «Send inn» gir én rapport» er lagt til i `e2e/endrer/ny-rapport.spec.ts` (ett POST og ett kort, bestått i endrer-360 og endrer-1280).
- `registrer.html` er ikke oppdatert og viser fortsatt påminnelsen med to setninger (notert i beslutningsloggen).

## Spec Change Log

## Review Triage Log

Gjennomgang 1 (blind-hunter, edge-case-hunter og verification-gap; verification-gap fant ingenting). Kjørt mot diff fra `baseline_commit`.

| Id | Funn | Dom | Bevis | Rute |
|----|------|-----|-------|------|
| B1 | Tidlig INSERT-grant på `summary` og `image_path` (en bruker kan peke på en annens bilde) | false | `reports_image_path_check` krever `image_path like author_id::text || '/%'` og `UNIQUE (image_path)` (`20261109141557_bilder.sql:16-18`), og `bilder.sql:216-248` tester «image_path i en annens mappe avvises». `summary` har CHECK på 300 tegn og ikke tom (`datamodell.sql:53`). AD-12 gir granten på de fem kolonnene. | avvist |
| B2 | Testhull: summary over 300, image_path ikke-null, `id` forfalsket | false | `begrensninger.sql` tester summary på 301, og `bilder.sql` tester image_path. `id` står ikke i grantlista, og den uttømmende matrisen i `skriving.sql` feiler hvis en kolonne til får INSERT. | avvist |
| B3 | pgTAP-testen av policyen sammenligner deparset tekst, og `WITH CHECK` kan ikke feile på grunn av kolonnegranten | low | Sant, men PostgreSQL 17 er låst av CLI-bildet. En atferdstest er umulig så lenge `author_id` ikke kan settes, så policyen er forsvar i dybden. Å bytte testen er mer enn en direkte rettelse. | avvist |
| B4 | e2e-data vokser, `tabTo`-grensen 100, `cards.last()` bryter etter 500 rapporter | low | `playwright.config.ts` kjører `db reset` ved hver oppstart, så veksten er bounded (omtrent ti rader per kjøring), og `LIST_LIMIT` på 500 nås ikke. | avvist |
| B5 | Feilmeldinger fjernes ikke når feltet rettes, og feil over grensen vises ikke mens brukeren skriver | medium | Verifisert i `components/report-form.tsx` og e2e-testen: `errors` settes bare i `handleSubmit`, så `aria-invalid` og teksten blir stående etter retting, og testen må trykke «Send inn» på nytt for å fjerne dem. Epics-kriteriet sier at feilen står under feltet «når brukeren skriver forbi grensen». Teller og fokus ved forsøk holder seg som i den frosne teksten. | patch |
| B6 | Skjemaet kan henge etter vellykket lagring, og ingen idempotensnøkkel | low | Krever at `router.replace` svikter. Rettingen (tidsavbrudd eller idempotensnøkkel med schema-endring) er mer enn en direkte rettelse. | avvist |
| B7 | Klienten forkaster serverens feilkode, og en utløpt økt mister teksten | low | Klienten kjører samme validering først, så `validation_failed` fra serveren kommer bare ved omgåelse. Økten fornyes i `proxy.ts`. Utkast i lagring er ny funksjon. | avvist |
| B8 | «Destructive»-toasten er ikke bygd | medium | Verifisert: `components/ui/sonner.tsx` har ingen `error`-stil eller `richColors`, så `toast.error` ser ut som suksesstoasten. Kriteriet og `EXPERIENCE.md` sier destructive-toast. | patch |
| B9 | Kategorivalget er bare testet med tastatur, og høyden kan klemmes | false | Kjørt midlertidig e2e med klikk på 360 px: lista åpnes, alle fem valg er synlige og minst 40 px høye, og «Belysning» velges med klikk. | avvist |
| B10 | Inngangene: ingen safe-area, bare på lista, `startsWith("/auth/")` mangler `/auth` | false | FAB bare på lista og topplinjeknapp fra 640 px er kriteriet og `DESIGN.md`. `app/layout.tsx` har ikke `viewport-fit=cover`, så safe-area er 0. Ruten `/auth` finnes ikke. | avvist |
| B11 | Fokus i beskrivelsen ved åpning åpner tastaturet på mobil | false | Kriteriet krever «fokus i beskrivelsesfeltet» ved åpning (UX-DR10). | avvist |
| B12 | Bokføringen: spec `in-review` mot sprint `in-progress`, tom triagelogg, verifikasjon uten resultat, FAB-raden i `EXPERIENCE.md` mangler «under 640 px» | low | De tre første er arbeidsflytens tilstand under gjennomgangen. Raden i `EXPERIENCE.md` (begge kopier, linje 70) mangler bredden som `DESIGN.md` har. Direkte rettelse. | patch |
| B13a | `console.error` logger bare koden, uten handlingens navn | low | Sant (`actions.ts`), og i produksjon kan en logglinje ikke føres til `createReport`. Trivial rettelse, testene sjekker verdiene. | patch |
| B13b | `trim()` fjerner ikke nullbredde-tegn (U+200B) | low | Postgres `S` regner U+200B som ikke-mellomrom, så databasen er enig. Å fjerne dem er en ny regel om Unicode som ingen har bestemt. Brukeren får bare en usynlig beskrivelse selv. | avvist |
| E1 | Feil fjernes først ved neste gyldige parsing | medium | Samme årsak som B5. | patch (gruppert med B5) |
| E2 | Insert lykkes, svaret går tapt, og et nytt forsøk lager en duplikat | low | Krever nettverksbrudd etter commit. Idempotens krever ny kolonne og er mer enn en direkte rettelse. Moderator kan skjule en duplikat. | avvist |
| E3 | Skjemaet henger, eller utkastet mistes ved innloggingsomdirigering | low | Samme som B6 og B7. | avvist |
| E4 | U+0085, NUL eller enslige surrogater: klienten godtar, databasen avviser | low | Databasen avviser fortsatt (`23514` eller JSON-feil), og brukeren får feiltoast. Ekstremt sjeldent. | avvist |
| E5 | `PGRST301` (utløpt JWT) og `23505` gir `unknown` | low | `requireUser` stopper utløpt økt før INSERT. `23505` på `reports` kommer med `image_path` i Story 2.4. Utvidelsen hører til den storyen. | avvist |
| E6 | To like «Registrer problem»-lenker på en tom liste | false | Kriteriet krever både knappen i tomtilstanden og «+»/topplinjeknappen. Testene avgrenser til `main`. | avvist |
| E7 | «←» etter innsending forlater appen når skjemaet var første side i fanen | high | Verifisert med midlertidig e2e: ny fane, `/rapporter/ny` direkte, innsending, «←» gir `about:blank`. `router.replace` overskriver `history.state`, så `BackLink` regner dybden som forrige + 1 og kaller `router.back()` ut av appen. Den frosne teksten forbyr å endre `BackLink`, og `epic-2-context.md` setter denne rettingen til Story 2.2. Brukeren valgte 2026-11-10 å godta begrensningen og utsette den til Story 3.3, som må løse «←» generelt. | defer (beslutning fra brukeren) |
| E8 | `toActionError` mangler `23505`/MESSAGE-oppslag fra arkitekturen | low | Ingen sti i denne storyen gir slike feil. Oppslaget kommer med Story 2.4 og 3.3. | avvist |
| E9 | `core-flow` bruker `cards.nth` og `cards.last()` | low | Nye rapporter har `created_at = now()` og står alltid foran seed, så rekkefølgen er stabil. | avvist |

## Design Notes

- **`router.replace` etter innsending.** Da ligger lista rett før detaljsiden i historikken, og «←» (som går tilbake i historikken) havner på lista og ikke på skjemaet. Det dekker også innsendingen uten å røre `BackLink`.
- **Topplinjeknappen** skjules på `/auth/*` og `/rapporter/ny`, der den enten er til ingen nytte eller peker på siden man allerede står på. «←» vises på skjemasiden fordi den følger alle stier under `/rapporter/`, og gir en vei ut uten å sende inn.
- **Påminnelsen** i skjermskissene og `EXPERIENCE.md` har en andre setning om KI-tjenesten. Den legges inn i Story 2.3. `EXPERIENCE.md` (begge kopier) får en merknad om at 2.2 bare har første setning.
- **Kategorivalget er shadcn `Select`**, slik `DESIGN.md` sier. Testene bruker tastatur (Tab, Enter eller Space, piler, Enter), og feltet får `aria-invalid` og `aria-describedby` på knappen.
- **Feilmeldingene** i skjemaet og i `lib/report-input.ts`: «Skriv inn en beskrivelse.», «Beskrivelsen kan ha høyst 1000 tegn.», «Skriv inn et sted.», «Stedet kan ha høyst 200 tegn.» og «Velg en kategori.»
- **Telleren** er ren tekst og ikke `aria-live`, og står utenfor `aria-describedby`, så den ikke leses opp for hvert tegn. Grensen kommer via feilmeldingen.
- **`core-flow` og delt database.** `endrer-360` og `endrer-1280` deler databasen, så den andre kjøringen ser rapportene den første laget. Seed-stegene (de åtte kortene) dekkes av `e2e/les/`, som kjører først.

## Verification

**Commands:**
- `npm run lint` -- expected: 0 feil (de 93 advarslene fra `.claude/` er kjent, se retrospektivet)
- `npm run test:unit` -- expected: alle bestått, ingen typefeil
- `npm run build` -- expected: bygger, og `/rapporter/ny` står som dynamisk rute
- `node scripts/db-types.mjs --check` -- expected: ingen avvik i genererte typer
- `npm test` -- expected: Vitest `unit` og `db`, pgTAP og Playwright består, exit 0. Skriv kjøretiden i PR-beskrivelsen.

**Manual checks (if no CLI):**
- Åpne `/` på 360 og 1280 px: «+» finnes bare under 640 px, og topplinjeknappen bare fra 640 px, uten at siste kort dekkes.
- Send en rapport med en beskrivelse på 1000 tegn med emoji, og sjekk at toasten vises og at detaljsiden viser «1 har sett dette».
