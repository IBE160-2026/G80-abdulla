---
title: 'Story 1.7: Bilder på detaljsiden og i lista'
type: 'feature'
created: '2026-11-09'
status: 'in-progress'
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
- [ ] `lib/supabase/images.ts` + `images.test.ts` -- `signReportImage(path)` etter Always. Enhetstest med falsk klient: riktig bucket, sti og 60 s, feil gir `null` og logger uten sti. Vakt: `createSignedUrl` brukes bare her
- [ ] `lib/supabase/types.ts` + `types.test.ts` -- `has_image` i `Report`
- [ ] `lib/supabase/reports.ts` + `reports.test.ts` -- `image_path` leses, `has_image` regnes ut, `image_path` er ikke med i resultatet. `getReport` signerer bare når raden finnes og har bilde
- [ ] `app/rapporter/[id]/page.tsx` + `page.test.ts` -- sender `imageUrl` til `ReportDetail`
- [ ] `components/report-detail.tsx` -- bildet etter Always og beslutningene om alternativ tekst og visning
- [ ] `components/report-card.tsx` + `report-card.test.ts` -- ikonet når `has_image`
- [ ] `e2e/les/detalj.spec.ts` -- rapport 2 med bilde (lenken gir 200 og `image/jpeg`, `alt`, `Cache-Control` med `private` og `no-store` for HTML og RSC, ingen `image_path` og forfatter-uuid bare inni den signerte lenken), rapport 1 uten `<img>`, rapport 7 uten lenke
- [ ] `e2e/les/forside.spec.ts` -- ikonet på kortene for rapport 2 og 3 og ingen andre
- [ ] `e2e/reset/bilde-mangler.spec.ts` + fixture -- rapport 4 får `image_path` til et objekt som ikke finnes, og detaljsiden gir 200 uten bilde og uten feilside
- [ ] `e2e/core-flow.spec.ts` -- åpne rapport 2 med tastatur, se bildet, axe og bredde
- [ ] `docs/ux/EXPERIENCE.md` (begge kopier), `.memlog.md` og `docs/beslutninger/ux-beslutningslogg.md` -- alternativ tekst og visningen av bildet
- [ ] `README.md` -- status for Story 1.7 og guiden med bildene

**Acceptance Criteria:**
- Given seed-dataene, when `npm test` kjøres, then består Vitest, pgTAP og alle Playwright-prosjektene, og axe gir 0 funn med `serious`/`critical` på detaljsiden med bilde.
- Given kildekoden, when den søkes gjennom, then kalles `createSignedUrl` bare i `lib/supabase/images.ts`.
- Given 360 og 320 px, when detaljsiden for rapport 2 vises, then er det ingen horisontal scrolling.

## Spec Change Log

## Review Triage Log

## Design Notes

`has_image` regnes ut i Next-serveren og ikke i visningen. Arkitekturen sier at serveren regner det ut fra `image_path`. En ny kolonne i `reports_with_counts` ville krevd en migrering og endret kolonnesettet som vakttesten låser. `image_path` blir aldri med i `Report`, så den kan ikke spres til en komponent ved et uhell. Playwright-testene for HTML og RSC er sikringen.

Next sender `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` for dynamiske sider, og overstyrer `headers()` i `next.config.ts` for sider. Kravet sikres derfor med testen, ikke med egen kode. Viser testen at Next ikke sender `private`, er det et funn som må løses før storyen er ferdig.

## Verification

**Commands:**
- `npm run lint && npx tsc --noEmit` -- 0 feil
- `npm test` -- alt består, og PR-en får sammendraget (bestått og axe-funn)
