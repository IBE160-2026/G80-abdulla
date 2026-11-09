---
title: 'Story 1.6: Bildespike: reglene for bilder er testet'
type: 'feature'
created: '2026-11-09'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'dc5e09a18c75a432a29c90f6b1da25f5752e90dd'
context:
  - '{project-root}/docs/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Reglene for bilder (AD-6, AD-9) er `[PROVISIONAL]`. Ingen har vist at et bilde fra en skjult rapport ikke kan leses av andre enn moderatoren, eller hvilken rettighet `createSignedUrl` krever. Story 1.7 og opplastingen i Epic 2 kan ikke bygges før det er avklart (issue #27, FR-9, AR-8).

**Approach:** Bucketen `report-images` med testbilder settes opp i `supabase/config.toml`. En ny migrering gir `reports` `CHECK` og `UNIQUE` på `image_path` og `storage.objects` de tre policyene fra AD-9 og AD-14. pgTAP tester lesing, opplasting, overskriving og sletting for `anon`, bruker og moderator, og en Vitest-test mot lokal Storage prøver `createSignedUrl`. Består alt, settes AD-6 og AD-9 til `[ADOPTED]`.

## Boundaries & Constraints

**Always:**
- `supabase/config.toml` endres i en egen commit, før resten (AD-11). Bucketen er privat, med `file_size_limit = "5MiB"` (5 × 1024 × 1024 byte) og `allowed_mime_types = ["image/jpeg", "image/png", "image/webp"]`. `objects_path = "./seed-images"`.
- Testbildene ligger i `supabase/seed-images/<forfatter-uuid>/<uuid>.<ext>`, og objektnavnet i bucketen er lik `reports.image_path`. Kilde og lisens for hvert bilde står i `supabase/seed-images/KILDER.md`.
- Policyene står i en ny migrering (navngitt `supabase migration new`), med navn som sier rolle og handling. SELECT `TO anon`: `bucket_id = 'report-images'` og en rapport med `image_path = name` og `hidden = false`. SELECT `TO authenticated`: det samme, med `hidden = false OR (SELECT private.is_moderator())`. INSERT `TO authenticated`: `bucket_id = 'report-images'` og `(storage.foldername(name))[1] = (SELECT auth.uid())::text`. Ingen UPDATE- eller DELETE-policy.
- Migreringen lager `reports_with_counts` på nytt med samme kolonner, fordi den endrer `reports` (regelen i arkitekturen). Visningens kolonnesett endres ikke.
- `image_path` sendes fortsatt aldri til nettleseren. `REPORT_COLUMNS` endres ikke.

**Never:**
- Ingen bilde i appen, ingen signert lenke i en side og ingen bildeikon i lista (Story 1.7). Ingen opplasting i grensesnittet og ingen EXIF-fjerning (Story 2.4).
- Ingen endring i de eksisterende policyene på `reports` og `confirmations`, og ingen ny `security definer`-funksjon.
- Ingen nye npm-avhengigheter.

**Beslutning (2026-11-09): testbildene.** Tre CC0-bilder fra Wikimedia Commons eller Openverse: et gatelys (rapport 2), et hull i asfalten (rapport 3) og lys i en trappeoppgang (rapport 7, skjult). Lisensen sjekkes på originalsiden, ikke bare i et søkeresultat. `KILDER.md` har tittel, opphav, lenke til originalsiden og lisens for hvert bilde. Bildene har ingen ansikter eller lesbare bilskilt (P-2), skaleres ned til høyst 1600 px på lengste side og lagres som JPEG under 1 MiB.

**Beslutning (2026-11-09):** Spec-en beholdes samlet (≈ 3 000 tokens), fordi Story 1.6 er én issue, én branch og én PR.

**Stoppregel:** Feiler en test av reglene, og feilen skyldes reglene og ikke testen, stopper arbeidet. Testen skal ikke svekkes. Ingen reserveløsning bygges. Prosjekteieren velger reserven i AD-6, og valget føres i `docs/beslutninger/` før Story 1.7.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Lese synlig bilde | `anon`, bruker, moderator; bildet til en synlig seed-rapport | Raden i `storage.objects` er synlig | N/A |
| Lese skjult bilde | `anon` og en bruker som ikke er moderator; bildet til skjult rapport 7 | Raden er ikke synlig (0 rader), uten feil | N/A |
| Moderator, skjult | Moderatoren; bildet til rapport 7 | Raden er synlig | N/A |
| Laste opp i egen mappe | Bruker, `name = '<egen uuid>/<uuid>.jpg'` | INSERT lykkes | N/A |
| Laste opp i annens mappe | Bruker, `name = '<annen uuid>/…'`; `anon` uansett mappe | Avvist | `42501` |
| Overskrive eller slette | Bruker og moderator, UPDATE eller DELETE på et seed-bilde | 0 rader endret | N/A |
| Feil sti i `reports` | `image_path` utenfor forfatterens mappe, eller samme sti på to rapporter | Avvist | `23514` / `23505` |
| Signert lenke, synlig | `createSignedUrl` som besøkende og som bruker, bildet til en synlig rapport | URL lages, og en GET gir 200 med bildets type | N/A |
| Signert lenke, skjult | Samme, bildet til rapport 7 | Ingen URL. Storage svarer med feil | Feilen sjekkes |

</frozen-after-approval>

## Code Map

- `supabase/config.toml:116-133` -- `[storage]` er på, med en kommentert mal for `[storage.buckets.images]`. CLI 2.122.1 kjenner bare `public`, `file_size_limit`, `allowed_mime_types` og `objects_path`. `objects_path` løses fra `supabase/`, og objektene lastes opp ved `supabase start`, `db reset` (når Storage er klar) og `supabase seed buckets --local`.
- `supabase/migrations/20261108190211_datamodell.sql` -- `reports` (44-60) med `image_path text` uten `CHECK`/`UNIQUE`. Policyene på `reports` (137-147). `private.is_moderator()` (82-101), som bare `authenticated` kan kjøre. `reports_with_counts` (181-205). Linje 26 tar bort EXECUTE fra PUBLIC på nye funksjoner.
- `supabase/tests/hjelpere.psql` -- `tests.as_user(uuid)`, `tests.as_anon()`, `tests.as_postgres()`, `tests.moderator()`, `tests.bruker1()`, `tests.bruker2()` og `tests.skjult_rapport()`. Hver fil er `begin; \ir hjelpere.psql; select plan(N); … finish(); rollback;`.
- `supabase/tests/vakter.sql` -- vaktene gjelder bare `public` og `private`. Tillatelseslisten i `private` er bare `is_moderator`, så ingen ny hjelper skal kunne kjøres av `anon` eller `authenticated`. Kolonnesettet i visningen sjekkes (130-153).
- `supabase/seed.sql` (87-210) -- `image_path` er ikke med i insert-lista. Forfattere: rapport 2 og 3 har `…0003` og `…0002`, rapport 7 (skjult) har `…0002`. Moderatoren er `…0001`. Alle passord er `localfix-test`.
- `lib/supabase/seed-login.db.test.ts` -- mønsteret for Vitest mot databasen: `loadEnvConfig`, `await import("@/lib/env")`, `createClient<Database>(URL, PUBLISHABLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })`, `signInWithPassword` og `signOut`. Prosjektet `db` (`lib/**/*.db.test.ts`) kjøres sist i `test:db` (`db reset`, `db-types --check`, `supabase test db`, `vitest --project db`).
- Nedskalering: `sharp` 0.35.5 ligger i `node_modules` som avhengighet av Next. Den kan brukes fra et engangsskript i scratchpad, men legges ikke til i `package.json` og kalles ikke fra koden i repoet. Originalene lastes ned direkte fra Wikimedia eller Openverse.
- `scripts/db-types.mjs --check` -- feiler hvis `lib/supabase/database.types.ts` er utdatert. Kjør `npm run db:types` etter migreringen.
- `ARCHITECTURE-SPINE.md` -- AD-6 (l. 92) og AD-9 (l. 114) er `[PROVISIONAL]`. Rettighetstabellen (l. 143) har en rad for `storage.objects`. Deferred-raden (l. 310) skal fjernes. `docs/beslutninger/arkitektur-beslutningslogg.md` bruker formatet `- (decision) 2026-11-06 (by user) <tekst>`.

## Tasks & Acceptance

**Execution:**
- [x] `supabase/config.toml` -- `[storage.buckets.report-images]` etter Always. Egen commit (AD-11)
- [x] `supabase/seed-images/<forfatter-uuid>/<uuid>.<ext>` + `KILDER.md` -- tre CC0-bilder etter beslutningen om testbildene, med kilde og lisens
- [x] `supabase/migrations/<tid>_bilder.sql` -- `CHECK` og `UNIQUE` på `reports.image_path`, `reports_with_counts` laget på nytt og de tre policyene på `storage.objects`
- [x] `supabase/seed.sql` -- `image_path` for rapport 2, 3 og 7, med stier som peker på bildene
- [x] `lib/supabase/database.types.ts` -- generert på nytt med `npm run db:types`
- [x] `supabase/tests/bilder.sql` -- radene i matrisen som gjelder databasen: lesing for `anon`, bruker og moderator, opplasting i egen og annens mappe, overskriving og sletting, og `CHECK`/`UNIQUE`. I tillegg seed-bildene finnes som objekter i bucketen, bucketen er privat med riktig grense og riktige typer, og `anon` kan lese oppslaget uten feil når en skjult rapport finnes (AD-14)
- [x] `supabase/tests/vakter.sql` -- en vakt for at `storage.objects` har nøyaktig de tre policyene for `report-images`, og ingen for UPDATE eller DELETE
- [x] `lib/supabase/storage.db.test.ts` -- `createSignedUrl` (60 s) som besøkende, som bruker og som moderator, for et synlig og et skjult bilde. En GET på URL-en for det synlige bildet gir 200 og `image/*`
- [x] `docs/planning-artifacts/architecture/architecture-LocalFix-2026-10-28/ARCHITECTURE-SPINE.md` -- AD-6 og AD-9 settes til `[ADOPTED]`, det står hvilken rettighet `createSignedUrl` krever (SELECT-policy på objektet for den som spør), og Deferred-raden fjernes. Bare hvis alt består (stoppregelen)
- [x] `docs/beslutninger/arkitektur-beslutningslogg.md` -- én linje om resultatet av spiken
- [x] `README.md` -- status for Story 1.6, testbildene og hvor kilden står

**Acceptance Criteria:**
- Given seed-dataene og Supabase i gang, when `npm test` kjøres, then består Vitest (`unit` og `db`), pgTAP med `bilder.sql` og de nye vaktene, og alle Playwright-prosjektene. axe gir 0 funn med `serious`/`critical`.
- Given `npx supabase db reset`, when den er ferdig, then ligger de tre bildene i bucketen `report-images` med objektnavn lik `image_path` i seed-rapportene.
- Given detaljsiden og lista, when de vises, then er HTML-en og RSC-nyttelasten fortsatt uten `image_path` (testene fra Story 1.4 og 1.5 består uendret).

## Implementation Notes

- **`KILDER.md` ligger ved siden av `seed-images/`, ikke i den** (avvik fra Always): Supabase CLI 2.122.1 laster opp alle filer i `objects_path`, også `.md` og skjulte filer. Bucketen godtar bare bilder, så `supabase/seed-images/KILDER.md` ga `415 invalid_mime_type` og fikk `supabase seed buckets` (og dermed `start`/`db reset`) til å feile. Fila heter derfor `supabase/KILDER-seed-images.md`. `objects_path` og bildestiene er som i spec-en. Prosjekteieren bør godkjenne plasseringen.
- **Testbildene:** «Street lamps at the National Assembly of Quebec» (Wilfredor), «A pothole in Dilova Street in Kyiv» (Роман Рябенко) og «Wall light in stairwell - NÄL hospital 1» (W.carter), alle `{{self|cc-zero}}` i wikiteksten på originalsiden. Skalert med `sharp` fra et engangsskript i scratchpad til 1600 px, JPEG kvalitet 80 (47–215 KB), uten EXIF/GPS. Objektnavn: `<forfatter-uuid>/3000…000N.jpg`, der N er rapportnummeret.
- **Policynavn:** Postgres kutter navn over 63 byte, så navnene er kortet til `report-images: anon leser synlige`, `report-images: authenticated leser synlige, moderator alle` og `report-images: authenticated laster opp i egen mappe`.
- **DELETE i pgTAP:** Storage har triggeren `protect_objects_delete`, som avviser all direkte DELETE i `storage.objects` (42501) med mindre `storage.allow_delete_query = true`. `bilder.sql` setter den lokalt, slik Storage-tjenesten gjør, så testen viser at policyene gir 0 rader og ikke bare at triggeren stopper. Kontrollert: med en midlertidig DELETE- og UPDATE-policy endres 2 rader.
- **`createSignedUrl`:** Kontrollert ved å fjerne SELECT-policyen for `anon` midlertidig: da fikk besøkende ingen lenke til det synlige bildet. Rettigheten er altså en SELECT-policy på objektet for den som spør. Både skjult og manglende objekt gir `Object not found`.
- **`database.types.ts`:** `npm run db:types` ga ingen endring (CHECK og UNIQUE vises ikke i typene), så fila er ikke endret.

- **Etter gjennomgangen (2026-11-09):** de elleve patch-radene er rettet. Opplasting gjennom Storage-API-et (`storage.upload`) virker i egen mappe før en rapport peker på bildet. En annens mappe gir 403, og `text/plain` gir 415, så stoppregelen slo ikke inn. `bilder.sql` har 40 tester, med en åpen testpolicy på `reports` som viser at `hidden`-sjekken i bildepolicyene virker alene. Agenten viste at testene feiler når sjekken fjernes. `vakter.sql` har 15 tester. Verifisert: lint, `tsc` og `test:unit` 151/151 er rene, pgTAP 157/157 og Vitest `storage.db.test.ts` 13/13 består. Hele `npm test` er ikke kjørt etter rettingene.

## Spec Change Log

## Review Triage Log

Gjennomgang 1 (2026-11-09). Kilder: B = blind-hunter, E = edge-case-hunter, V = verification-gap.

| # | Funn | Vurdering | Begrunnelse | Rute |
|---|------|-----------|-------------|------|
| B4, E3, E9 | Opplasting er bare testet med SQL rett mot `storage.objects`, ikke gjennom Storage-API-et. AD-9 er satt til `[ADOPTED]` og sier at appen laster opp med brukerens sesjon, før rapporten finnes | maybe-false | Hvis Storage leser raden tilbake etter INSERT, gir SELECT-policyen false (ingen rapport peker på bildet ennå), og opplastingen feiler. Det avgjøres av én Vitest-opplasting gjennom `storage.upload`. Feiler den på grunn av policyene, slår stoppregelen inn. Rettingen er en test og ikke ny kode, så den er rutet som patch | patch |
| V1 | `hidden`-sjekken i policyene på `storage.objects` er ikke testet alene | medium | Fra V (forhåndsverifisert): RLS på `reports` skjuler rapport 7 allerede, så alle testene består også uten sjekken. AD-6 sier nå at sjekken er en ekstra sikring, men ingen test viser det | patch |
| B10 | Setningen i AD-6 om hva `hidden`-sjekken beskytter mot, blander policyene på `reports` og pgTAP | low | Bekreftet. Retting av ordlyden, sammen med testen fra V1 | patch |
| B1, E5 | AD-9 sier «5 MB», mens bucketen, README og pgTAP bruker 5 MiB (5 242 880 byte) | medium | Bekreftet. Story 2.4 bygger Server Action etter AD-9, og 5 000 000 byte ville gitt en annen grense enn bucketen. Direkte retting av teksten | patch |
| E8 | AD-9 og loggen sier at `createSignedUrl` ikke krever «noen annen rettighet» enn SELECT-policyen | low | Bekreftet unøyaktig. Policyen leser `public.reports` og kaller `private.is_moderator()` med rollens egne grants og RLS, så de trengs også. Retting av ordlyden | patch |
| B9 | Merkingen av `[ADOPTED]`-linjen i beslutningsloggen følger ikke formatet i `docs/beslutninger/README.md` | low | Bekreftet. Stoppregelen var et forslag i spec-en som prosjekteieren godkjente, og README-en har merket «(KI-forslag, godkjent av prosjekteier)» for det | patch |
| B2 | Loggen sier «image/jpeg», men testen sjekker bare `image/*` | low | Bekreftet. Alle seed-bildene er JPEG, så testen kan sjekke `image/jpeg` | patch |
| B13, E7 | Testen for «finnes ikke» sammenligner bare meldingen, og bare for `anon` | low | Bekreftet. Sammenlign hele feilobjektet (også status) for et skjult og et manglende objekt, for samme leser | patch |
| B5 | Ingen test viser at brukeren selv ikke kan lese sitt eget bilde før en rapport peker på det | low | Bekreftet: bruker1 sin lesetest kjører før opplastingen. AD-9 sier at ingen kan lese en slik fil. Én `is_empty` | patch |
| B3 | Grensene for type og størrelse i bucketen er bare lest tilbake, ikke prøvd med en opplasting | low | Bekreftet. Én opplasting av `text/plain` gjennom Storage-API-et, i samme test som B4, viser at bucketen avviser den | patch |
| E6 | Vakten sjekker bare policyene på `storage.objects`. En policy på `storage.buckets` ville latt brukere lage bøtter uten at noen test feiler | low | Bekreftet. Én påstand om at `storage` ikke har policyer på andre tabeller | patch |
| B6, E1, E2 | `CHECK` og INSERT-policyen godtar stier som `<forfatter>/` og `<forfatter>/a/b.jpg`, ikke bare `<forfatter>/<uuid>.<ext>` | low | Bekreftet, men begrensningen er ordrett som i AD-6 og den frosne spec-en. Formatet lages av Server Action (AD-9), og en egen opplasting kan bare gå i egen mappe, med bildetyper. Strengere regex er ny regel. Avvist | avvist |
| E4 | Bucketen sjekker bare oppgitt MIME-type, ikke selve bytene | low | Sjekken av innholdet hører til Server Action i Story 2.4 (AD-9). Avvist | avvist |
| B7 | Visningen lages på nytt uten endring | false | Regelen i AD-5 og Always i spec-en krever det når `reports` endres. Vakttesten sjekker kolonnene | avvist |
| B8 | To like filer for beslutningsloggen | false | Fantes før storyen. `docs/beslutninger/README.md` sier at kopiene oppdateres sammen med originalene | avvist |
| B11 | `Thumbs.db` eller `desktop.ini` i `seed-images/` kan få `supabase start` til å feile på Windows | low | Explorer lager ikke slike filer i vanlige mapper som standard, og `KILDER-seed-images.md` forklarer at bare bilder kan ligge der. Avvist | avvist |
| B12 | README beskriver Story 1.6 som levert mens sprintstatusen er `in-progress` | false | Steg 5 setter storyen til `review` i samme PR | avvist |
| E10 | Kildelista ligger i `supabase/KILDER-seed-images.md`, ikke i `seed-images/KILDER.md` | false | Nødvendig: CLI-en laster opp alle filer i `objects_path`, og bucketen avviser `.md` (415). Forklart i fila og i Implementation Notes, og lagt fram for prosjekteieren | avvist |

## Design Notes

Policyene sjekker `hidden` selv, i tillegg til RLS på `reports`. Det følger AD-14 ordrett, og en senere endring i policyene på `reports` kan ikke gjøre skjulte bilder lesbare uten at pgTAP feiler.

pgTAP tester policyene direkte på `storage.objects` med `as_anon`/`as_user`. Vitest-testen tester det Storage-API-et faktisk gjør, siden `createSignedUrl` går gjennom tjenesten og ikke bare SQL. Begge trengs før AD-6 kan bli `[ADOPTED]`.

## Verification

**Commands:**
- `npm run lint && npx tsc --noEmit` -- 0 feil
- `npm run test:db` -- `db reset`, typesjekk, pgTAP og Vitest `db` består
- `npm test` -- alt består, og PR-en får sammendraget (bestått og axe-funn)
