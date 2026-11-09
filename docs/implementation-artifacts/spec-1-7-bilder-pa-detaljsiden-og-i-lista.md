---
title: 'Story 1.7: Bilder på detaljsiden og i lista'
type: 'feature'
created: '2026-11-09'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '67c85871b683911e9c92d9f1ec47431370d4bee3'
context:
  - '{project-root}/docs/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Spiken i Story 1.6 viste at bildereglene holder (AD-6 og AD-9 er `[ADOPTED]`), men appen viser ingen bilder ennå. En besøkende ser ikke bildet som hører til en rapport, og lista sier ikke hvilke rapporter som har bilde (issue #28, FR-5, UX-DR5, UX-DR13).

**Approach:** Serveren leser `image_path` sammen med de andre kolonnene, men gir komponentene bare `has_image`. Detaljsiden får én signert lenke på 60 sekunder fra én serverfunksjon, laget med brukerens sesjon, og viser bildet mellom overskriften og beskrivelsen. Lista viser bildeikonet sist i metadatalinja.

## Boundaries & Constraints

**Always:**
- `image_path` leses bare i `lib/supabase/`. Komponentene får `Report` (med `has_image: boolean`) og på detaljsiden `imageUrl: string | null`, aldri `image_path`. Raden bygges eksplisitt, ikke med spredning av hele raden.
- Lenken lages bare i `signReportImage(path)` i `lib/supabase/images.ts`: `createSignedUrl(path, 60)` i bucketen `report-images` med serverklienten (brukerens sesjon, ingen tjenestenøkkel). Feil gir `null` og en logglinje med bare statuskoden, aldri stien.
- `getReport` signerer bare etter at rapporten er lest under RLS. En skjult rapport gir `null` og 404 før noen lenke lages (AD-6).
- Bildet vises med `<img>` (ikke bildeoptimereren), etter mockupen `detalj.html`: mellom overskriften og beskrivelsen, med `{rounded.lg}`.
- Ikonet er lucide `Image` (16 px) med `role="img"` og `aria-label="Har bilde"`, sist i metadatalinja.
- Svaret for detaljsiden, både HTML og RSC, har `Cache-Control` med `private` og `no-store` (AD-13). Siden er fortsatt `force-dynamic`.

**Never:**
- Ingen migrering, ingen ny kolonne i `reports_with_counts` og ingen endring i policyene.
- Ingen bilde i lista, ingen opplasting og ingen EXIF-fjerning (Story 2.4).
- Ingen nye npm-avhengigheter, og ingen `remotePatterns` eller annen bildeoptimering.

**Beslutning (2026-11-09): alternativ tekst.** Bildet har `alt="Bilde fra rapporten"`. Overskriften rett over sier hva rapporten gjelder, så skjermleseren gjentar den ikke, og teksten lover ikke mer enn vi vet om bildet.

**Beslutning (2026-11-09): visningen.** Bildet har full bredde, og høyden følger bildet, men er høyst 480 px. Høye bilder vises hele med `object-contain` på `bg-muted`, så ingenting av problemet kuttes bort. Hjørnene er `{rounded.lg}` (12 px), og margen er 8 px over og 12 px under, som i mockupen.

**Beslutning (2026-11-09):** Spec-en beholdes samlet (≈ 2 900 tokens), fordi Story 1.7 er én issue, én branch og én PR, og bildet og ikonet deler datalaget.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Synlig rapport med bilde | Besøkende åpner rapport 2 | 200, bildet vises fra en signert lenke (`/storage/v1/object/sign/report-images/…`) med alternativ tekst | N/A |
| Rapport uten bilde | Rapport 1 | Siden som før, uten `<img>`, og `createSignedUrl` kalles ikke | N/A |
| Bildeobjektet mangler | `image_path` peker på et objekt som ikke finnes | 200, siden uten bilde og uten feilside | Storage-feilen gir `null` og logges med statuskode |
| Skjult rapport med bilde | Besøkende åpner rapport 7 | 404, ingen signert lenke | N/A |
| Lista | Seed-dataene | Kortene for rapport 2 og 3 har ikonet «Har bilde», de andre ikke, og HTML/RSC har verken `image_path` eller forfatter-uuid | N/A |

</frozen-after-approval>

## Code Map

- `lib/supabase/types.ts` -- `Report` = `Omit<ReportRow, "author_id" | "image_path">`. Legg til `has_image: boolean`. `REPORT_COLUMNS` er fortsatt kolonnene komponentene får. `types.test.ts` sjekker at `Split<REPORT_COLUMNS>` er `keyof Report` og må få med `has_image`.
- `lib/supabase/reports.ts` -- `listReports` og `getReport` leser `reports_with_counts` med `REPORT_COLUMNS`. Les `` `${REPORT_COLUMNS}, image_path` `` (literal, så supabase-js utleder typen) og bygg `Report` med en `toReport(row)` som fjerner `image_path`. `getReport` returnerer `{ report, imageUrl } | null`. `fail()` logger bare feilkoden. `reports.test.ts` har en falsk klient med kjeden `from → select → …`. Den trenger `storage.from(...).createSignedUrl` eller en mock av `./images`.
- `lib/supabase/server.ts` -- `createClient()` med brukerens cookies, brukes også til signeringen.
- `lib/supabase/storage.db.test.ts` -- viser API-et: `storage.from("report-images").createSignedUrl(path, 60)`, `Object not found` for skjult eller manglende objekt.
- `app/rapporter/[id]/page.tsx` -- `parseReportId` → `getReport` → `notFound()` → `<ReportDetail>`. `page.test.ts` mocker `getReport`.
- `components/report-detail.tsx` -- `h1` (mb-3), så beskrivelsen. Bildet går mellom dem. Mockupen `.photo` har marg 8 px over og 12 px under og radius 12 px.
- `components/report-card.tsx` -- metadatalinja `{seen_count} har sett dette · {relativ tid}`. Ikonet kommer etter teksten (mockupen `liste.html`: `margin-left: 6px`, `vertical-align: -3px`). Importer `Image as ImageIcon` fra `lucide-react` 0.511.0 (navnet kolliderer med `next/image`). Lucide setter `aria-hidden` bare når ingen aria-prop er gitt.
- `lib/no-cache.test.ts` -- vakttest som leser kildefilene. Mønster for en ny vakt: `createSignedUrl` finnes bare i `lib/supabase/images.ts` (utenom testene).
- `e2e/core-flow.spec.ts` -- Enter på kort 8 (rapport 1), «←» tilbake. Utvid med kortet for rapport 2 via `tabTo` (godtar `RegExp`).
- `e2e/les/detalj.spec.ts` -- testen «sender ikke forfatterne eller bildestien» bruker rapport 1 og sjekker `cache-control` for HTML og RSC (`RSC: 1`). Den signerte lenken inneholder `<author_id>/` (godtatt i AD-5, Deferred), så for rapport 2 må lenken fjernes fra teksten før forfatter-uuid sjekkes.
- `e2e/reset/liste.spec.ts` + `e2e/db.ts` + `e2e/fixtures/` -- mønster for tester som endrer data: `resetDb()`, `runSqlFile()`, `afterAll` med reset.
- Seed: rapport 2 (forfatter `…0003`), 3 (`…0002`) og 7 (skjult, `…0002`) har bilde. Rapport 4 har ikke.
- `README.md:9` -- sier «Appen viser bildene i neste story, og da utvides denne guiden».
- UX-kopiene: `docs/ux/EXPERIENCE.md` og `docs/planning-artifacts/ux-designs/ux-LocalFix-2026-10-11/EXPERIENCE.md`, logg i `.memlog.md` der og `docs/beslutninger/ux-beslutningslogg.md`.

## Tasks & Acceptance

**Execution:**
- [x] `lib/supabase/images.ts` + `images.test.ts` -- `signReportImage(path)` etter Always. Enhetstest med falsk klient: riktig bucket, sti og 60 s, feil gir `null` og logger uten sti. Vakt: `createSignedUrl` brukes bare her
- [x] `lib/supabase/types.ts` + `types.test.ts` -- `has_image` i `Report`
- [x] `lib/supabase/reports.ts` + `reports.test.ts` -- `image_path` leses, `has_image` regnes ut, `image_path` er ikke med i resultatet. `getReport` signerer bare når raden finnes og har bilde
- [x] `app/rapporter/[id]/page.tsx` + `page.test.ts` -- sender `imageUrl` til `ReportDetail`
- [x] `components/report-detail.tsx` -- bildet etter Always og beslutningene om alternativ tekst og visning
- [x] `components/report-card.tsx` + `report-card.test.ts` -- ikonet når `has_image`
- [x] `e2e/les/detalj.spec.ts` -- rapport 2 med bilde (lenken gir 200 og `image/jpeg`, `alt`, `Cache-Control` med `private` og `no-store` for HTML og RSC, ingen `image_path` og forfatter-uuid bare inni den signerte lenken), rapport 1 uten `<img>`, rapport 7 uten lenke
- [x] `e2e/les/forside.spec.ts` -- ikonet på kortene for rapport 2 og 3 og ingen andre
- [x] `e2e/reset/bilde-mangler.spec.ts` + fixture -- rapport 4 får `image_path` til et objekt som ikke finnes, og detaljsiden gir 200 uten bilde og uten feilside
- [x] `e2e/core-flow.spec.ts` -- åpne rapport 2 med tastatur, se bildet, axe og bredde
- [x] `docs/ux/EXPERIENCE.md` (begge kopier), `.memlog.md` og `docs/beslutninger/ux-beslutningslogg.md` -- alternativ tekst og visningen av bildet
- [x] `README.md` -- status for Story 1.7 og guiden med bildene

**Acceptance Criteria:**
- Given seed-dataene, when `npm test` kjøres, then består Vitest, pgTAP og alle Playwright-prosjektene, og axe gir 0 funn med `serious`/`critical` på detaljsiden med bilde.
- Given kildekoden, when den søkes gjennom, then kalles `createSignedUrl` bare i `lib/supabase/images.ts`.
- Given 360 og 320 px, when detaljsiden for rapport 2 vises, then er det ingen horisontal scrolling.

## Implementation Notes

- Implementert av en underagent, som stoppet (ingen fremdrift på 600 s) før den rapporterte. Endringene var komplette og er committet i `5b6cf70`. Diffen er gjennomgått mot oppgavene, og testene er kjørt på nytt i hovedsesjonen.
- `getReport` returnerer `{ report, imageUrl } | null` og kaller `signReportImage` bare når raden finnes og `image_path` ikke er `NULL`. `toReport` skriver ut feltene ett og ett, så `image_path` (eller en ny kolonne) ikke blir med.
- `signReportImage` logger `Kunne ikke lage bildelenke (<statusCode>).` (eller `ukjent`) og fanger også kall som kaster. Vakten for `createSignedUrl` ligger i `images.test.ts` og leser alle kildefiler utenom testfilene.
- Next sendte `private` og `no-store` for både HTML og RSC, så ingen egen kode trengtes for `Cache-Control` (Design Notes).
- Verifisert (2026-11-09): lint og `tsc` 0 feil. Hele `npm test` (exit 0) ga Vitest `unit` 181/181, pgTAP 157/157, Vitest `db` 20/20 og Playwright 78/78. axe ga 0 alvorlige funn, og ytelsestesten målte 465 ms for 108 rapporter.
- Etter gjennomgangen: `e2e/les/detalj-innlogget.spec.ts` logger inn med skjemaet fra startpakken (`/auth/login`, engelske etiketter), som Story 2.1 erstatter. Da må `logIn` i den fila oppdateres. Andre kjøring av `npm test` hadde ett tidsavbrudd (30 s) i rapport 1-testen i `les-360`, som ikke kom igjen da `les`-prosjektene ble kjørt på nytt (76/76, 356 ms). Tredje kjøring av hele `npm test` (exit 0) ga Vitest `unit` 183/183, pgTAP 157/157, Vitest `db` 20/20 og Playwright 82/82. axe ga 0 alvorlige funn, og ytelsestesten målte 489 ms for 108 rapporter.

## Spec Change Log

## Review Triage Log

Gjennomgang 1 (2026-11-09). Kilder: B = blind-hunter, E = edge-case-hunter, V = verification-gap.

| # | Funn | Vurdering | Begrunnelse | Rute |
|---|------|-----------|-------------|------|
| V1, B2 | Ingen test viser at `getReport` signerer bildet til en skjult rapport når moderatoren får raden, eller at moderatoren ser bildet og ikonet | medium | Fra V (forhåndsverifisert): `row()` i `reports.test.ts` har alltid `hidden: false`, og e2e logger aldri inn. En «sikring» mot skjulte rader ville tatt bildet fra moderatoren uten at noen test feilet | patch |
| B1 | Akseptansekriteriet «besøkende eller vanlig bruker» er bare testet som besøkende for skjult rapport 7 | medium | Bekreftet: `detalj.spec.ts` bruker `request` uten økt. pgTAP og `storage.db.test.ts` dekker reglene, men ingen test går gjennom siden som innlogget forfatter. Samme rettelse som V1: e2e med innlogging som forfatteren og moderatoren | patch |
| B10 | RSC-svaret for skjult rapport 7 sjekkes ikke for status | low | Delvis riktig. Første rettelse (`rsc.status()` = 404) feilet: Next svarer 200 på RSC-forespørselen, og 404-tilstanden står i nyttelasten. Testen sjekker i stedet at nyttelasten har «Fant ikke rapporten.», både for besøkende og for forfatteren | patch |
| B6 | Kommentaren om prosjektet `reset` i `playwright.config.ts` og README (lista over reset-testene og antall `db reset`) er utdatert | low | Bekreftet: «Tomt til en story trenger det» og «tre ganger». Direkte retting av teksten | patch |
| B7 | `RESET_TIMEOUT` er definert i to filer, og kommentaren i `e2e/db.ts` kjenner bare den ene | low | Bekreftet. Konstanten flyttes til `e2e/db.ts`. Full `db reset` i `afterAll` beholdes, som i `liste.spec.ts` | patch |
| B8 | Utseendet til bildet står i `EXPERIENCE.md`, men `DESIGN.md` (stedet for utseendet) har ingenting, og `detalj.html` viser fast 170 px | low | Bekreftet. `DESIGN.md` (begge kopier) får bildet under Components, og at 170 px i skissen er en plassholder | patch |
| E1, E2, B3 | Lenken kan utløpe før nettleseren henter bildet (treg linje, frem/tilbake fra cache etter 60 s), og da vises nettleserens ødelagte bilde | low | Bildet hentes med en gang siden vises, og objekter kan ikke slettes (AD-9), så det skjer sjelden. Frem/tilbake bruker vanligvis bildet fra nettleserens cache. Rettingen krever en klientkomponent med `onError`. Avvist | avvist |
| E3 | Lista viser «Har bilde» når `image_path` er satt, men objektet mangler | low | Krever en `image_path` uten objekt, som v1 ikke kan lage: bildet lastes opp før rapporten, og ingen kan slette objekter (AD-9). Å sjekke objektene for lista ville kostet ett Storage-kall per rapport. Avvist | avvist |
| E4 | `bilde-mangler.spec.ts` går ut fra seed-tilstand («1 har sett dette») uten `db reset` først | false | Tester som endrer data, bruker egne rapporter og brukere (AD-15), så rapport 4 i seed endres ikke av andre tester. `afterAll` i begge reset-filene setter seed tilbake | avvist |
| E5 | Vakttesten for `createSignedUrl` leser bare noen mapper | false | Den leser `app`, `components`, `lib`, `e2e`, `scripts`, `supabase` og roten, som er all kode i repoet. Resten er `docs`, `public`, `_bmad` og avhengigheter | avvist |
| B4 | Teksten flytter seg nedover når bildet lastes (ingen `width`/`height`) | low | Bekreftet, men størrelsen på bildet er ikke kjent før det er lastet. Å reservere plass krever at størrelsen lagres ved opplasting (Story 2.4) eller en fast høyde, som beslutningen om visningen valgte bort. Avvist | avvist |
| B5 | Regelen for høye bilder (480 px, hele bildet) er bare testet med CSS-verdiene, fordi alle testbildene er liggende | low | CSS-sjekken viser at regelen er satt. En stående fixture krever et nytt testbilde og en reset-test. Avvist | avvist |
| B9 | `toBe(16)` på ikonets størrelse kan feile ved avrunding | false | Ikonet har `width="16"` og `height="16"`, og `boundingBox` gir CSS-piksler. Testen besto i begge bredder | avvist |
| B11 | Loggen sier ikke hvilken rapport som mangler bildet | low | Spec-en sier bare statuskode i loggen. Det trengs sjelden lokalt, og rettingen legger til en parameter. Avvist | avvist |
| B12 | `page.test.ts` leser `page.props.children` direkte og avhenger av markupen | low | Testen må oppdateres hvis `<main>` får flere barn, men det er lett å se når det skjer. Avvist | avvist |

## Design Notes

`has_image` regnes ut i Next-serveren og ikke i visningen. Arkitekturen sier at serveren regner det ut fra `image_path`. En ny kolonne i `reports_with_counts` ville krevd en migrering og endret kolonnesettet som vakttesten låser. `image_path` blir aldri med i `Report`, så den kan ikke spres til en komponent ved et uhell. Playwright-testene for HTML og RSC er sikringen.

Next sender `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` for dynamiske sider, og overstyrer `headers()` i `next.config.ts` for sider. Kravet sikres derfor med testen, ikke med egen kode. Viser testen at Next ikke sender `private`, er det et funn som må løses før storyen er ferdig.

## Verification

**Commands:**
- `npm run lint && npx tsc --noEmit` -- 0 feil
- `npm test` -- alt består, og PR-en får sammendraget (bestått og axe-funn)
