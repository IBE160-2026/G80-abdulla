---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - docs/planning-artifacts/prds/prd-LocalFix-2026-09-18/prd.md
  - docs/planning-artifacts/prds/prd-LocalFix-2026-09-18/addendum.md
  - docs/planning-artifacts/architecture/architecture-LocalFix-2026-10-28/ARCHITECTURE-SPINE.md
  - docs/planning-artifacts/ux-designs/ux-LocalFix-2026-10-11/DESIGN.md
  - docs/planning-artifacts/ux-designs/ux-LocalFix-2026-10-11/EXPERIENCE.md
  - docs/planning-artifacts/research/domain-personvern-bilder-og-rapporter-2026-11-06/research.md
---

# LocalFix: epics og stories

## Oversikt

Dette dokumentet deler kravene i PRD-en, UX-dokumentene og arkitekturen opp i epics og stories som kan implementeres én om gangen. Personvernresearchen er tatt med som kilde til forslag. Forslagene kommer bare inn i en story når prosjekteieren har godkjent dem, og da føres beslutningen i `docs/beslutninger/`.

## Kravoversikt

### Funksjonelle krav

Nummereringen følger PRD-en, så hver story kan spores tilbake dit.

- **FR-1 Registrering og innlogging:** En besøkende kan opprette en konto og logge inn. Uten innlogging kan man bare lese. Prøver en som ikke er innlogget å registrere eller bekrefte, blir hen sendt til innlogging. Nye kontoer får rollen «bruker».
- **FR-2 Moderatorrolle:** Systemet skiller mellom bruker og moderator, og moderatorrettigheter kontrolleres på serveren. En bruker som sender en statusendring direkte til API-et, får 403. Testdataene har minst én moderatorkonto.
- **FR-3 Registrere rapport:** En innlogget bruker kan registrere en rapport med beskrivelse, lokasjon, kategori og valgfritt bilde.
  - Beskrivelse, lokasjon og kategori er påkrevd. Beskrivelsen kan være opptil 1000 tegn og lokasjonen opptil 200, og brudd avvises med en tydelig feilmelding.
  - En rapport uten bilde lagres.
  - Bilder over 5 MB, eller i andre formater enn JPEG, PNG og WebP, avvises.
  - Skjemaet har en påminnelse om å unngå ansikter og bilskilt på bildet, og om å unngå personopplysninger i beskrivelsen.
  - Etter innsending vises rapporten med status **Ny**.
- **FR-4 KI-forslag for kategori og oppsummering:** KI-en foreslår kategori og en kort oppsummering før innsending.
  - Den foreslåtte kategorien er alltid en av de fem. Et ugyldig svar gir «ingen forslag».
  - Brukeren kan overstyre både kategori og oppsummering. Oppsummeringen kan være opptil 300 tegn.
  - Ved timeout etter 5 sekunder, feil eller ingen svar kan rapporten fortsatt sendes inn, med manuelt valgt kategori og uten oppsummering.
  - Uten API-nøkkel går funksjonen i mock-modus.
- **FR-5 Rapportliste og detaljside:** Alle kan se lista over synlige rapporter. Hver rad viser kategori, oppsummering eller beskrivelse, status og «har sett dette», og lenker til en detaljside som viser alle feltene. Skjulte rapporter vises bare for moderator. En ny rapport viser 1, og telleren øker med én for hver bekreftelse.
- **FR-6 Filtrering og sortering:** Lista kan filtreres på kategori og status, og innloggede kan i tillegg filtrere på «Mine rapporter». Filtrene kan kombineres.
  - Lista sorteres etter registreringstidspunkt (nyeste først er standard) eller etter antall bekreftelser.
  - «Mine rapporter» viser bare egne registrerte rapporter, og besøkende har ikke dette filteret.
  - Med et kjent testdatasett gir hver kombinasjon forventet rekkefølge og antall.
  - En tom treffliste gir en melding.
- **FR-7 Bekrefte rapport:** En innlogget bruker kan markere «Jeg har også sett dette» på andres rapporter, og telleren øker med én.
  - En ny bekreftelse fra samme bruker avvises, også via API-et.
  - Rapportøren kan ikke bekrefte sin egen rapport.
  - En bekreftelse kan ikke angres, og den endrer ikke statusen på en løst rapport.
- **FR-8 Endre status:** Moderator flytter status ett steg om gangen: Ny ↔ Under behandling ↔ Løst. Hopp avvises. Andre ser den nye statusen ved neste innlasting. Tidspunktet for siste statusendring lagres og vises som «sist oppdatert», og for en rapport som aldri har fått ny status vises registreringstidspunktet. Alle andre enn moderator avvises.
- **FR-9 Skjule og vise rapport:** Moderator kan skjule en rapport og vise den igjen.
  - En skjult rapport forsvinner fra lista og detaljsiden for alle andre, også rapportøren og «Mine rapporter». Rapportøren får ingen melding om det.
  - Moderator ser skjulte rapporter med merket «Skjult».
  - Ingenting slettes, og alle andre enn moderator avvises.

### Ikke-funksjonelle krav

- **NFR-1 Responsivitet:** Kjerneflyten virker uten horisontal scrolling på 360 px, nettbrett og desktop.
- **NFR-2 Kjørbar for sensor:** Appen startes lokalt etter README, uten gruppens nøkler, betalte kontoer eller skytjenester. Lokal database og bildelagring har testdata, og KI-en går i mock-modus uten nøkkel.
- **NFR-3 Hemmeligheter:** Ingen nøkler i repoet. `.env.example` lister alle variablene.
- **NFR-4 Tilgangskontroll:** Alle rettighetsregler (innlogging, én bekreftelse, moderatorhandlinger) håndheves på serveren eller i databasen.
- **NFR-5 Installerbarhet:** Et PWA-manifest gjør at appen kan legges på hjemskjermen.
- **NFR-6 Ytelse:** Lista med 100 rapporter lastes på under 2 sekunder lokalt.
- **NFR-7 Kostnad:** Utvikling og vurdering krever ingen betalte tjenester, og språkmodellen har et gratisnivå.
- **NFR-8 Universell utforming:** Appen oppfyller WCAG 2.2 AA. Kjerneflyten gir ingen funn med alvorlighet «serious» eller «critical» i axe, og hele kjerneflyten kan gjennomføres bare med tastatur.

### Tilleggskrav fra arkitekturen

**Startpakke (påvirker Epic 1, Story 1):**
- **AR-1 Startpakke (AD-2):** Prosjektet opprettes fra Next.js-eksempelet `with-supabase`.
  - Låsefilen opprettes og committes ved første installasjon, og Stack-tabellen i arkitekturen oppdateres til versjonene som ble låst.
  - Tailwind 3.4.x beholdes.
  - Node 24 LTS settes med `engines.node` og `.nvmrc`.
- **AR-2 Sjekker ved oppstart (Deferred og AD-3):**
  - `proxy.ts` sender ikke besøkende til innlogging. Gjør den det, fjernes den regelen.
  - `npx shadcn@4.23.0 add button` gir ikke Tailwind v4-syntaks i `globals.css`. Gjør den det, låses siste CLI som støtter Tailwind 3.4.
  - Vitest 5 virker sammen med Next.js.

**Lokalt miljø og data:**
- **AR-3 Lokal Supabase (AD-11):** Supabase CLI 2.122.1 som eksakt devDependency, kjørt med `npx supabase`. Docker Desktop er en forutsetning.
  - `supabase/config.toml` har `enable_confirmations = false`.
  - `supabase/seed.sql` kjører som `postgres` og har faste uuid-er, `moderator@localfix.test`, brukerkontoer og rapporter i alle kategorier og statuser, med eksplisitte og ulike `created_at`.
  - `seed-images/` er lagt i mapper per bruker-uuid og lastes via `objects_path`.
- **AR-4 Konfigurasjon (AD-11):** Alle miljøvariabler valideres i `lib/env.ts`, ingen andre filer leser `process.env`, og alle står i `.env.example`. Tjenestenøkkelen brukes bare i seed og migrering.

**Database og regler:**
- **AR-5 Datamodell (AD-4):**
  - Tabellene `profiles`, `reports` og `confirmations`.
  - Enum-verdiene `waste, lighting, roads_sidewalks, vandalism, other`, `new, in_progress, resolved` og `user, moderator`.
  - `CHECK`-reglene for lengde og tomme verdier, med delte grenser i `lib/limits.ts`.
  - `ON DELETE RESTRICT`.
  - Triggeren `handle_new_user` som eneste `security definer`.
  - `status_changed_at`.
- **AR-6 Visningen `reports_with_counts` (AD-5):**
  - `security_invoker = true` og kolonnene `confirmation_count`, `seen_count`, `confirmed_by_me` og `authored_by_me`.
  - `lib/supabase/types.ts` med `MergeDeep` og `REPORT_COLUMNS`, så appen aldri sender `author_id`, `user_id` eller `image_path` til nettleseren. En Playwright-test kontrollerer at seed-forfatterens uuid ikke lekker.
- **AR-7 Regler i databasen (AD-1, AD-7, AD-12, AD-14):**
  - RLS på alle tabeller, og policyer per rolle.
  - `private.is_moderator()`.
  - Triggeren `reports_guard_update` med feilkodene `42501`, `invalid_column_change` og `invalid_status_step`.
  - Kolonnegrants for INSERT og UPDATE, og ingen DELETE.
  - pgTAP-tester med `tests.as_user` og `tests.as_anon` for alle reglene.
  - Et Vitest-skript som tester REST-grensen for 401, 403 og 409.
- **AR-8 Spike for bilder (AD-6, AD-9, Deferred):** Den første storyen som berører bilder, skriver pgTAP-testene for Storage-oppslaget, rettigheten `createSignedUrl` krever, og tilfellet med anonyme besøkende, før andre stories bygger på dem. Feiler testene, avgjør prosjekteieren reserveløsningen.

**Applag:**
- **AR-9 KI-modul (AD-8):**
  - `lib/ai/suggest(description)` med adapterne mock og OpenAI-kompatibel, valgt med `AI_PROVIDER=mock|openai`.
  - Høyst 2000 tegn sendes, og det går ett kall om gangen per bruker.
  - Timeout er 5 sekunder, og svaret valideres mot kodeverdiene. Sammendraget er ren tekst og kortes til 300 tegn.
  - Kallet gjøres bare fra en Server Action for innloggede.
- **AR-10 Kodeverdier og typer (AD-10):** `supabase gen types` lager `lib/supabase/database.types.ts`, og norske visningsnavn hentes bare fra `lib/labels.ts`.
- **AR-11 Ingen mellomlagring (AD-13):**
  - Sidene er `force-dynamic`, og ingen data hentes med `'use cache'` eller `fetch`-cache.
  - Bilder vises med `unoptimized`, og svar med signerte lenker har `Cache-Control: private, no-store`.
  - Alle endringer kaller `revalidatePath`.
- **AR-12 Konvensjoner:**
  - Server Actions svarer `{ ok, data | error }`.
  - Feilkodene er et lukket vokabular, oversatt i `lib/errors.ts`.
  - `setReportStatus(reportId, from, to)` gir `stale_state` hvis statusen er endret av noen andre, og `setReportHidden` tar en eksplisitt verdi.
  - `confirmReport` leser først fra visningen for å gi riktig feilmelding.
  - `parseListParams` og `buildListHref` er eneste tolkning av filter-URL-en.
  - Datoer formateres bare i `lib/format.ts`.
  - Rapporttekst og e-postadresser logges aldri.
  - Lista henter høyst 500 rader og viser en tekst om at den er avkortet når grensen nås.
- **AR-13 Innlogging (AD-3):**
  - `getViewer()` og `requireUser(returnTo)` med `next`-parameteren. Retur-adressen godtas bare fra samme opprinnelse, og dette testes med `//x`, `/\x` og `https://x`.
  - Nettleserklienten brukes bare i innloggingsskjemaene.

**Tester og levering:**
- **AR-14 Testoppsett (AD-15):**
  - Playwright i `e2e/` med to prosjekter, 360×800 og 1280×800.
  - Én testkommando som kjører `db reset`, `next build` og `next start` med `AI_PROVIDER=mock`.
  - `e2e/a11y.ts` sjekker de oppgitte tilstandene med axe.
  - `e2e/core-flow.spec.ts` går kjerneflyten bare med tastatur. Den vokser story for story, uten `skip` eller `fixme`.
  - En ytelsestest bruker en egen fixture med 100 rapporter.
  - En story er ikke ferdig før alle testene i `e2e/` består. PR-beskrivelsen har sammendraget fra testkommandoen.
- **AR-15 KI-testsett (SM-5):** `evals/sm5/` har 20 beskrivelser, 4 per kategori, med fasit, og et skript som bruker `lib/ai`. Skriptet melder at resultatet ikke gjelder kvalitet når det kjører mot mock. Leverandøren velges når testen er kjørt mot Cloudflare, Groq og Mistral (PRD §11).
- **AR-16 README (NFR-2, SM-7):** Docker Desktop står først, med forutsetninger og versjoner, kommandoer som kan kopieres, `npx playwright install chromium`, testbrukere, SQL-setningen for å gjøre en bruker til moderator, testkommandoen og et skjermbilde.
- **AR-17 PWA (NFR-5):** `app/manifest`, uten service worker.

**Krav fra personvernresearchen.** Prosjekteieren godkjente begge 2026-11-06. De er ikke en del av PRD-en eller arkitekturen ennå, og beslutningen føres i `docs/beslutninger/`:
- **P-1 EXIF:** Serveren fjerner EXIF-metadata fra alle opplastede bilder før lagring, og det testes med et testbilde som har GPS-data (research, Anbefaling 2). Påvirker AD-9.
- **P-2 Oppdiktede testdata:** Seed-bildene viser ikke ansikter eller lesbare bilskilt, og testbrukerne har oppdiktede e-postadresser. README sier at v1 ikke behandler personopplysninger (research, Anbefaling 1). Påvirker AR-3, AR-16 og PRD §8.

### Krav fra UX-designet

- **UX-DR1 Fargetokens:** shadcn-temaet overstyres med Fjordblå `primary` #1F4E79 og `primary-foreground` #FFFFFF, `background` #F5F7FA, `surface` #FFFFFF, `foreground` #17212B, `muted-foreground` #5B6773 og `border` #DCE2E8. Statusfargene er Ny #E3EEF9/#1F4E79, Under behandling #FFF1D6/#7A4B00 og Løst #E2F3E6/#1E6B34, og Skjult er #EEF0F2/#5B6773. Feil bruker shadcns `destructive`. Bare lys modus. All tekst holder WCAG AA (regnet ut i DESIGN.md), og axe bekrefter det i appen.
- **UX-DR2 Typografi:** Systemfont. Stilene er `title` 20/600, `card-title` 15/600, `body` 16/400 (hindrer zoom på iOS), `meta` 13/400 og `badge` 12/600.
- **UX-DR3 Layout og former:**
  - Mobile-first med én kolonne, 16 px sidemarg og innhold på maks 640 px, sentrert.
  - Trykkflater er minst 44 px.
  - Hjørneradius: 6 px på felt, 8 px på knapper, 12 px på kort og bildeforhåndsvisning, og helt runde merker, brikker og FAB.
  - Kortene har kantlinje, ikke skygge. Bare FAB-en har egen skygge.
- **UX-DR4 Topplinje og navigasjon:**
  - Topplinja viser «LocalFix · Campus Molde». Menyen har «Logg inn», eller e-postadressen og «Logg ut», og merkelappen «Moderator» for moderatorer.
  - «←» og nettleserens tilbakeknapp gjør det samme.
  - Fra 640 px erstattes FAB-en av knappen «Registrer problem» i topplinja.
  - Det finnes ingen bunnmeny.
- **UX-DR5 Rapportkort:** Hele kortet er én lenke. Kategori står til venstre og statusmerket til høyre. Under står `summary ?? description` på maks to linjer, og nederst metadata som «N har sett dette · 2 dager siden». Har rapporten bilde, vises et bildeikon med `aria-label="Har bilde"`, aldri selve bildet.
- **UX-DR6 Statusmerke:** Tre varianter. Statusteksten skrives alltid ut, så fargen er aldri alene om å vise status.
- **UX-DR7 Filterbrikker:** En brikkerad som kan rulles sideveis: «Mine rapporter» (bare for innloggede), «Alle», de fem kategoriene og de tre statusene.
  - «Mine rapporter», én kategori og én status kan være aktive samtidig. «Alle» nullstiller kategori og status, og et nytt trykk på en aktiv brikke slår den av.
  - Brikkene er knapper med `aria-pressed`, og valget lagres i URL-en med kodeverdiene.
- **UX-DR8 Sortering:** En shadcn-`Select` med «Nyeste» (standard) og «Flest har sett», som `sort=newest` eller `sort=confirmations` i URL-en.
- **UX-DR9 Flytende «+»-knapp:** 56 px, nede til høyre, med `aria-label="Registrer problem"`. En besøkende sendes til innlogging og så tilbake til skjemaet.
- **UX-DR10 Skjema for ny rapport:**
  - Fokus står i beskrivelsesfeltet når skjemaet åpnes.
  - **Beskrivelse:** påkrevd. Telleren «N/1000» leses ikke opp for hvert tegn. Under feltet står påminnelsen om personopplysninger og KI.
  - **Kategori:** påkrevd. KI-forslaget velges automatisk med pillen «Foreslått av KI», som forsvinner når brukeren velger selv. KI-en overskriver ikke et valg brukeren har gjort.
  - **KI-oppsummering:** vises som lesetekst med «Endre», maks 300 tegn.
  - **Lokasjon:** påkrevd, maks 200 tegn, med plassholderen «F.eks. gangveien ved bygg A».
  - **Bilde:** «Legg til bilde» med forhåndsvisning og mulighet til å fjerne bildet. Påminnelsen om ansikter og bilskilt står under knappen. For store bilder og feil format avvises med en gang.
  - **«Send inn»:** deaktivert til beskrivelse, lokasjon og kategori er fylt inn, og mens KI-en jobber, med mindre brukeren har valgt kategori selv. Viser «Sender …» under innsending. Etterpå går brukeren til detaljsiden og får toasten «Rapporten er sendt inn».
- **UX-DR11 KI-tilstander:**
  - Forslaget hentes bare når brukeren går ut av beskrivelsesfeltet, og bare når teksten har minst 10 tegn og er endret siden forrige forslag.
  - Mens KI-en jobber, vises «Finner kategori …» med en spinner, og kategorivalget kan fortsatt brukes.
  - Ved feil eller timeout vises «Vi fikk ikke et forslag. Velg kategori selv.»
  - Mock-modus ser ut som et vanlig forslag.
  - Skjermleseren leser opp «Kategori foreslått: …» via `aria-live="polite"`.
- **UX-DR12 Feil i skjemaet:** Valideringsfeil står under feltet, koblet med `aria-describedby`, og fokus flyttes til første feil. Feiler innsendingen, vises en destructive-toast «Kunne ikke sende inn. Prøv igjen.», og alt brukeren har fylt inn, beholdes.
- **UX-DR13 Detaljside:** Viser alle feltene, og bildet via en signert lenke. Under statusmerket står «Sist oppdatert 4. november kl. 14:20» i norsk tid. Mangler bildeobjektet, vises ingen bilde. En rapport som ikke finnes eller ikke er synlig, gir 404-siden «Fant ikke rapporten.» med lenke tilbake.
- **UX-DR14 Bekreftknapp:** Fem tilstander:
  - normal: «Jeg har også sett dette»
  - besøkende: sendes til innlogging og tilbake
  - rapportøren: «Din rapport», deaktivert
  - allerede bekreftet: «Du har sett dette ✓», deaktivert
  - skjult rapport: «Skjult rapport», deaktivert

  Telleren øker med én med en gang og erstattes av serverens tall når svaret kommer. Feiler kallet, går telleren tilbake og en toast vises. Svarer serveren `already_confirmed`, vises den bekreftede tilstanden uten feil. Endringen i telleren leses opp med `aria-live`.
- **UX-DR15 Moderatorpanel:** Et `Card` nederst på detaljsiden med bare nabostatusene: «Under behandling →», «← Ny» og «Løst →», eller «← Under behandling». «Skjul rapport» bekreftes i en `AlertDialog`, mens «Vis rapport» trenger ingen bekreftelse.
- **UX-DR16 Tilstander i lista:**
  - Laster: 4 Skeleton-kort.
  - Tom database: «Ingen rapporter ennå. Har du sett noe som bør fikses?» og knappen «Registrer problem».
  - Ingen treff: «Ingen rapporter matcher filteret.» og «Nullstill filter».
  - Ingen egne rapporter: «Du har ikke registrert noen rapporter ennå.» og «Registrer problem».
  - Skjult, for moderator: grå merkelapp og grå bakgrunn.
  - 403: toasten «Du har ikke tilgang til dette.»
- **UX-DR17 Språk og tone:** Du-form, kort og saklig, uten utropstegn og uten emoji, bortsett fra ✓. Teksten følger tabellen i EXPERIENCE.md under Voice and Tone.
- **UX-DR18 Tilgjengelighet:**
  - WCAG 2.2 AA.
  - Synlige `label` på alle felt.
  - Tab-rekkefølgen følger lesefølgen, og fokusringen kommer fra shadcns `ring`.
  - Trykkflater er minst 44×44 px.
  - Ingen funksjoner virker bare med mus eller hover.
  - Ingen sveip eller dra-og-slipp.
- **UX-DR19 PWA og plattform:** Manifestet gjør at appen kan legges på hjemskjermen. Ingen offline-støtte.

### Dekning av funksjonelle krav

| Krav | Epic | Hva |
|---|---|---|
| FR-1 | Epic 2 | Konto og innlogging |
| FR-2 | Epic 4 | Moderatorrollen håndheves (rollen finnes i datamodellen fra Epic 1) |
| FR-3 | Epic 2 | Registrere rapport, med valgfritt bilde |
| FR-4 | Epic 2 | KI-forslag for kategori og oppsummering, med mock-modus |
| FR-5 | Epic 1 | Rapportliste og detaljside, med bildet |
| FR-6 | Epic 3 | Filtrering, sortering og «Mine rapporter» |
| FR-7 | Epic 3 | Bekrefte rapport |
| FR-8 | Epic 4 | Endre status |
| FR-9 | Epic 4 | Skjule og vise rapport |

NFR-2, NFR-3, NFR-5, NFR-6 og NFR-7 dekkes i Epic 1. NFR-1, NFR-4 og NFR-8 er ikke egne stories, men en del av «Definisjon av ferdig» under Epics, som gjelder hver story: testene i `e2e/` og axe består (AR-14), og rettighetene er testet med pgTAP (AR-7).

## Epics

Rekkefølgen er 1 → 2 → 3 → 4, og den følger brukerreisene i PRD-en. Hver epic bygger bare på epicene før seg.

### Epic 1: Alle kan se rapportene på campus
En besøkende åpner appen og ser lista over testrapportene. Hen trykker på en rapport og ser detaljsiden med status, bilde, «N har sett dette» og «sist oppdatert». Appen starter lokalt etter README, i mock-modus og uten nøkler.
**FR som dekkes:** FR-5
**Notater:** Docker Desktop må være installert før Story 1.1. Startpakken og lokal Supabase er Story 1.1 (AR-1, AR-2), og testoppsettet med kjerneflyttesten er Story 1.2 (AR-14). Datamodell, visning, RLS for lesing og oppdiktede seed-data er med (AR-3 til AR-7, P-2), og det samme er fargetokens, rapportkort, PWA-manifest og README-grunnmur. Story 1.6 er spiken for bilder (AR-8), og Story 1.7 viser bildene, så den største tekniske usikkerheten er avklart før Epic 2.

### Epic 2: Studenter kan melde et problem
En bruker oppretter konto, logger inn og registrerer en rapport med beskrivelse, lokasjon, kategori og valgfritt bilde. KI-en foreslår kategori og oppsummering, og rapporten vises med status **Ny**.
**FR som dekkes:** FR-1, FR-3, FR-4
**Notater:** innloggingen har returadresse (AR-13). KI-modulen har mock og en OpenAI-kompatibel adapter (AR-9), og SM-5-testsettet er med (AR-15). Bildestoryen bygger på spiken i Story 1.6 og visningen i Story 1.7, og serveren fjerner EXIF (P-1).

### Epic 3: Finne rapporter og si «jeg har også sett dette»
Brukeren filtrerer på kategori og status og sorterer på «Nyeste» eller «Flest har sett». Innloggede finner sine egne rapporter med «Mine rapporter» og kan bekrefte andres rapporter én gang.
**FR som dekkes:** FR-6, FR-7
**Notater:** filter-URL-en tolkes bare av `parseListParams` og `buildListHref` (AR-12). Bekreftknappen har fem tilstander (UX-DR14). Doble bekreftelser og bekreftelse av egen rapport avvises i databasen.

### Epic 4: Moderator følger opp sakene
Moderatoren flytter status ett steg om gangen, og alle ser «sist oppdatert». Moderatoren kan skjule og vise rapporter, og andre enn moderatoren avvises med 403.
**FR som dekkes:** FR-2, FR-8, FR-9
**Notater:** triggeren `reports_guard_update` og `stale_state` hører hjemme her (AR-7, AR-12). Moderatorpanelet viser bare nabostatusene (UX-DR15). Når epicen er ferdig, går kjerneflyttesten gjennom UJ-3, og README er komplett (AR-16).

### Definisjon av ferdig

Dette gjelder hver story, i tillegg til akseptansekriteriene. Arbeidsløkken for en story (les, plan, bygg, test, gjennomgang, prøv selv, PR og logg) står i `docs/coaching-plan.md`.

- Storyen har en GitHub-issue, en egen branch og en PR som lukker issuen med `Closes #N`.
- Alle testene består: Playwright i `e2e/`, pgTAP og Vitest. axe gir ingen funn med alvorlighet «serious» eller «critical» på flatene som finnes, og kjerneflyttesten er utvidet uten `skip` eller `fixme` (AR-14, NFR-1, NFR-8).
- Ingen side får horisontal scrolling på 360 px (NFR-1) eller 320 px (WCAG 1.4.10, NFR-8).
- Rettighetsregler som storyen legger til, håndheves og testes i databasen, ikke bare i grensesnittet (NFR-4).
- PR-beskrivelsen har sammendraget fra testkommandoen (antall bestått og antall axe-funn) og funnene fra kodegjennomgangen.
- Endrer storyen en regel i PRD-en, arkitekturen eller UX-en, er dokumentet (begge kopiene der det finnes to) og beslutningsloggen i `docs/beslutninger/` oppdatert i samme PR.
- Når siste story i en epic er ferdig, er README fulgt steg for steg på en ny klone i en tom mappe, og det som ikke virket, er rettet.

### Hvis tiden blir knapp

Innleveringsfristen er ikke kjent ennå (se `docs/coaching-plan.md`). Blir tiden knapp, forenkles dette først, i denne rekkefølgen, uten at noe FR-krav faller bort:

1. **Story 2.5 (SM-5):** testsettet kjøres mot én leverandør i stedet for tre, eller appen leveres med mock. FR-4 er oppfylt med mock.
2. **Story 3.3:** den optimistiske +1 på telleren droppes, og telleren oppdateres når svaret kommer.
3. **Story 2.2:** den flytende knappen beholdes på alle bredder i stedet for knappen «Registrer problem» i topplinja fra 640 px.

Punkt 2 og 3 endrer UX-en, så `EXPERIENCE.md` (begge kopiene) og beslutningsloggen må oppdateres hvis de tas i bruk.

Dette kuttes ikke: FR-1 til FR-9, reglene i databasen og testene deres, kjerneflyttesten og README. Epic 4 bør være påbegynt senest to uker før fristen, så moderatorfunksjonene (FR-2, FR-8, FR-9) blir ferdige.

## Epic 1: Alle kan se rapportene på campus

En besøkende åpner appen og ser lista over testrapportene. Hen trykker på en rapport og ser detaljsiden med status, bilde, «N har sett dette» og «sist oppdatert». Appen starter lokalt etter README, i mock-modus og uten nøkler.

**Før Story 1.1:** Docker Desktop er installert og kjører på utviklermaskinen, og `docker run hello-world` virker. Uten Docker kan verken lokal Supabase eller testene kjøres (AR-3).

### Story 1.1: Startpakke og lokal Supabase

Som sensor
vil jeg klone repoet og starte appen med noen få kommandoer fra README,
slik at jeg kan se appen uten gruppens nøkler eller betalte tjenester.

**Akseptansekriterier:**

**Gitt** et repo uten appkode
**Når** prosjektet opprettes fra Next.js-eksempelet `with-supabase`
**Så** er låsefila committet, startpakkens Tailwind-versjon er beholdt (3.4.x ifølge AD-2), og Node 24 LTS er satt med `engines.node` og `.nvmrc`
**Og** Stack-tabellen i arkitekturen er oppdatert med versjonene som ble låst (AR-1)

**Gitt** at startpakken leverer en annen Tailwind-versjon enn 3.4
**Når** prosjektet opprettes
**Så** stopper storyen til prosjekteieren har valgt mellom startpakkens versjon og å låse 3.4
**Og** valget står i `docs/beslutninger/`, og AD-2, AR-1 og Stack-tabellen er rettet i samme PR

**Gitt** startpakken
**Når** oppstartsjekkene kjøres
**Så** sender `proxy.ts` ikke besøkende til innlogging, og `npx shadcn@4.23.0 add button` gir ikke Tailwind v4-syntaks i `globals.css` (AR-2)
**Og** et avvik er rettet slik AR-2 sier: regelen i `proxy.ts` er fjernet, eller siste shadcn-CLI som støtter Tailwind 3.4 er låst

**Gitt** at det ikke finnes noen KI-nøkkel
**Når** appen starter
**Så** validerer `lib/env.ts` alle miljøvariablene, og `AI_PROVIDER` er `mock`
**Og** ingen andre filer leser `process.env`, `.env.example` lister alle variablene, og `.env` står i `.gitignore` (AR-4, NFR-3)

**Gitt** Supabase CLI 2.122.1 som eksakt devDependency
**Når** `npx supabase start` kjøres med Docker Desktop
**Så** starter lokal Supabase, og `supabase/config.toml` har `enable_confirmations = false` (AR-3)
**Og** `config.toml` slår av Realtime, Edge Runtime, Analytics og e-posttesting, som appen ikke bruker, i en egen commit (AD-11). Da laster første oppstart ned mindre, og Analytics krever ikke at Docker-daemonen eksponeres på Windows

**Gitt** README
**Når** en person som ikke kjenner prosjektet, leser den
**Så** står Docker Desktop først, og deretter forutsetninger med versjoner og kommandoer som kan kopieres for å starte appen (AR-16, grunnmur)
**Og** README sier omtrent hvor mye første oppstart laster ned, og hvor lang tid den tar

**Gitt** `app/manifest`
**Når** appen åpnes på mobil
**Så** kan den legges på hjemskjermen, og det finnes ingen service worker (NFR-5, AR-17, UX-DR19)

### Story 1.2: Testoppsett: Vitest, Playwright, axe og kjerneflyttest

Som sensor
vil jeg kjøre testene med én kommando fra README,
slik at jeg kan se at appen virker og er tilgjengelig uten å teste alt for hånd.

**Akseptansekriterier:**

**Gitt** Vitest 5
**Når** en prøvetest kjøres
**Så** kjører den sammen med Next.js (AR-2)
**Og** virker ikke Vitest 5, velger prosjekteieren en versjon som virker, og valget står i `docs/beslutninger/` og i Stack-tabellen

**Gitt** Playwright i `e2e/` med prosjektene 360×800 og 1280×800
**Når** testkommandoen kjøres
**Så** kjører den `npx supabase db reset`, `next build` og `next start` med `AI_PROVIDER=mock`
**Og** testkommandoen er et npm-skript som virker på Windows, macOS og Linux, og miljøvariabler som `AI_PROVIDER` settes i Playwright-konfigurasjonen, ikke med `VAR=x` foran kommandoen
**Og** en røyktest som åpner forsiden og sjekker den med axe (`e2e/a11y.ts`), består uten funn med alvorlighet «serious» eller «critical»
**Og** `e2e/core-flow.spec.ts` finnes, åpner forsiden bare med tastatur og har ingen `skip` eller `fixme` (AR-14)
**Og** kjerneflyttesten bruker en hjelper som trykker Tab til elementet med riktig rolle og navn har fokus, med en øvre grense for antall trykk, i stedet for et fast antall Tab-trykk, så nye elementer på en side ikke ødelegger tidligere steg
**Og** sjekken for horisontal scrolling kjøres på 360 px (NFR-1) og på 320 px, som WCAG 1.4.10 krever (NFR-8)

**Gitt** Playwright-prosjektene
**Når** testkommandoen kjøres
**Så** kjører de i fast rekkefølge med `dependencies`: først tester som bare leser data, så tester som endrer data, og til slutt tester som kjører sin egen `db reset`
**Og** prosjektene kan stå tomme til storyene som trenger dem, fyller dem, for eksempel ytelsestesten i Story 1.4
**Og** tester som endrer data, skal bruke egne rapporter og egne testbrukere (AD-15), så ingen test avhenger av rekkefølgen den tilfeldigvis kjøres i

**Gitt** README
**Når** sensor vil kjøre testene
**Så** står `npx playwright install chromium` og testkommandoen der, med kommandoer som kan kopieres (AR-16)

### Story 1.3: Testrapporter i den lokale databasen

Som sensor
vil jeg at databasen har faste testrapporter i alle kategorier og statuser, og at lesereglene er testet,
slik at appen viser det samme etter hver `db reset` og skjulte rapporter aldri lekker.

**Akseptansekriterier:**

**Gitt** migreringene
**Når** `npx supabase db reset` kjøres
**Så** finnes tabellene `profiles`, `reports` og `confirmations` med enumene for kategori, status og rolle, `CHECK`-reglene for lengde og tomme verdier, `ON DELETE RESTRICT` og `status_changed_at` (AR-5)
**Og** grensene står også i `lib/limits.ts`, som teller tegn med `[...s].length`
**Og** `handle_new_user` oppretter profilraden med `role = 'user'` og er den eneste `security definer`-funksjonen

**Gitt** hver tabell i `public`
**Når** migreringen som oppretter den, kjøres
**Så** er RLS slått på og standardgrantene tilbakekalt i samme migrering
**Og** det finnes bare leseregler: `anon` og `authenticated` leser rapporter med `hidden = false`, moderator leser alle via `private.is_moderator()`, og ingen tabell har DELETE- eller TRUNCATE-grant (AR-7)

**Gitt** visningen `reports_with_counts`
**Når** den leses
**Så** har den `security_invoker = true` og kolonnene `confirmation_count`, `seen_count` (antall bekreftelser pluss 1), `confirmed_by_me` og `authored_by_me`, og de to siste er `false` for anonyme (AR-6)

**Gitt** `supabase/seed.sql`
**Når** `db reset` kjøres
**Så** finnes `moderator@localfix.test`, minst to brukerkontoer og rapporter i alle fem kategorier og alle tre statuser, minst én skjult rapport og noen bekreftelser (FR-2)
**Og** brukere og rapporter har faste uuid-er og ulike `created_at`, og `status_changed_at` er lik `created_at` for rapporter med status Ny
**Og** testbrukerne og rapporttekstene er oppdiktet, og README sier at v1 ikke behandler personopplysninger (P-2)
**Og** to brukere er satt av til kjerneflyttesten, én per Playwright-prosjekt (360 og 1280 px), så de to kjøringene ikke påvirker hverandre
**Og** minst én rapport har linjeskift, et svært langt ord uten mellomrom (for eksempel en lang URL) og tekst som ligner HTML, som `<b>` og `<script>`

**Gitt** pgTAP-testene
**Når** `npx supabase test db` kjøres
**Så** består testene for at `anon` og vanlige brukere ikke ser skjulte rapporter, at moderator ser dem, og at `anon` kan lese visningen uten feil når en skjult rapport finnes (FR-5, FR-9)
**Og** en test feiler hvis en tabell i `public` mangler RLS, hvis en visning mangler `security_invoker = true`, eller hvis `anon` eller `authenticated` kan kjøre en funksjon i `public` som ikke står på tillatelseslista
**Og** en test feiler hvis kolonnene i `reports_with_counts` ikke er kolonnene i `reports` pluss de fire tilleggskolonnene, så en migrering som endrer `reports` uten å lage visningen på nytt, oppdages med en gang (AD-5)

**Gitt** skjemaet
**Når** typene genereres med `supabase gen types`
**Så** finnes `lib/supabase/database.types.ts`, `lib/supabase/types.ts` med `MergeDeep` og `REPORT_COLUMNS`, og `lib/labels.ts` med de norske navnene på kategorier og statuser (AR-6, AR-10)

**Gitt** seed-kontoene
**Når** en Vitest-test logger inn med hver av dem via Supabase Auth, med passordene som står i README
**Så** lykkes innloggingen for alle, så feil i seed-radene i `auth.users`, for eksempel `NULL` i token-kolonnene, oppdages nå og ikke først i Epic 2

**Gitt** hjelperen `tests.as_user(uuid)`
**Når** en kontrolltest kjøres
**Så** gir `auth.uid()` seed-brukerens id, og `authored_by_me` er `true` for brukerens egen rapport gjennom visningen, så pgTAP-testene ikke består uten å teste noe

### Story 1.4: Rapportlista

Som besøkende
vil jeg se alle synlige rapporter på forsiden, nyeste først,
slik at jeg raskt ser hva som allerede er meldt på campus.

**Akseptansekriterier:**

**Gitt** seed-dataene
**Når** en besøkende åpner forsiden
**Så** vises alle synlige rapporter sortert på `created_at`, nyeste først, og ingen skjulte (FR-5)
**Og** hvert kort er én lenke til detaljsiden, med kategori til venstre, statusmerke med tekst til høyre, `summary ?? description` på maks to linjer og metadata som «5 har sett dette · 2 dager siden» (UX-DR5, UX-DR6)
**Og** telleren er `seen_count` fra visningen, og relativ tid formateres bare i `lib/format.ts`
**Og** relativ tid testes i Vitest med et fast «nå», og e2e-testene sjekker ikke relativ tid mot seed-dataene, så testene ikke går ut på dato før sensor kjører dem
**Og** et tidspunkt under ett minutt siden, eller litt fram i tid på grunn av klokkeforskjell, vises som «nå»

**Gitt** temaet
**Når** lista vises
**Så** bruker den fargetokens, typografi og hjørneradius fra `DESIGN.md`, én kolonne med 16 px marg og maks 640 px bredde, bare lys modus og trykkflater på minst 44 px (UX-DR1, UX-DR2, UX-DR3)
**Og** topplinja viser «LocalFix · Campus Molde» (UX-DR4). Menyen kommer i Story 2.1

**Gitt** at siden laster
**Når** dataene ikke er kommet ennå
**Så** vises fire Skeleton-kort

**Gitt** en tom database
**Når** forsiden åpnes
**Så** vises «Ingen rapporter ennå. Har du sett noe som bør fikses?» (UX-DR16). Knappen «Registrer problem» kommer i Story 2.2

**Gitt** flere enn 500 synlige rapporter
**Når** lista hentes
**Så** hentes høyst 500, og en tekst sier at lista er avkortet (AR-12)

**Gitt** fixturen med 100 rapporter i `e2e/`
**Når** ytelsestesten kjøres mot `next start`
**Så** er lista lastet på under 2000 ms (NFR-6)

**Gitt** lista og RSC-nyttelasten
**Når** en Playwright-test leser dem
**Så** inneholder de ikke seed-forfatterens uuid (AR-6)
**Og** siden er `force-dynamic` og bruker ingen data-cache (AR-11)

**Gitt** en skjerm på 360 px
**Når** lista vises
**Så** er det ingen horisontal scrolling, axe gir ingen funn med alvorlighet «serious» eller «critical», og kjerneflyttesten går til lista og gjennom kortene bare med tastatur (NFR-1, NFR-8, UX-DR18)

**Gitt** seed-rapporten med linjeskift, et svært langt ord og tekst som ligner HTML
**Når** lista vises på 360 px
**Så** vises teksten som ren tekst, kortet holder seg på maks to linjer, og siden får ingen horisontal scrolling

### Story 1.5: Detaljsiden

Som besøkende
vil jeg åpne en rapport og se alle detaljene og når den sist ble oppdatert,
slik at jeg vet om problemet er fulgt opp.

**Akseptansekriterier:**

**Gitt** en synlig rapport
**Når** en besøkende trykker på kortet
**Så** vises kategori, statusmerke, oppsummering, beskrivelse, lokasjon, «N har sett dette» og registreringstidspunktet (FR-5, UX-DR13)
**Og** under statusmerket står «Sist oppdatert 4. november kl. 14:20», formatert fra `status_changed_at` i `Europe/Oslo` via `lib/format.ts`
**Og** Vitest-tester for `lib/format.ts` dekker ett tidspunkt om vinteren og ett om sommeren, så sommertid gir riktig klokkeslett
**Og** for en rapport som aldri har fått ny status, er tidspunktet det samme som registreringstidspunktet (FR-8)

**Gitt** en id som ikke finnes, tilhører en skjult rapport eller ikke er en gyldig uuid
**Når** detaljsiden åpnes
**Så** vises 404-siden «Fant ikke rapporten.» med lenke tilbake til lista
**Og** id-en valideres med Zod før noe kall til databasen

**Gitt** seed-rapporten med linjeskift, et svært langt ord og tekst som ligner HTML
**Når** detaljsiden vises på 360 px
**Så** vises linjeskiftene, teksten vises som ren tekst, og det lange ordet brytes, så siden ikke får horisontal scrolling

**Gitt** detaljsiden
**Når** brukeren trykker «←» i topplinja
**Så** kommer hen tilbake til lista, som med nettleserens tilbakeknapp (UX-DR4)

**Gitt** detaljsiden
**Når** en Playwright-test leser siden og RSC-nyttelasten
**Så** inneholder de ikke `author_id`, `user_id` eller `image_path`
**Og** axe gir ingen funn med alvorlighet «serious» eller «critical», og kjerneflyttesten åpner en rapport bare med tastatur

Bildet på detaljsiden kommer i Story 1.7, etter bildespiken i Story 1.6.

### Story 1.6: Bildespike: reglene for bilder er testet

Som prosjekteier
vil jeg vite at reglene for bilder holder før bildene vises og opplastingen bygges,
slik at et bilde fra en skjult rapport aldri kan leses av andre enn moderatoren.

**Akseptansekriterier:**

**Gitt** `supabase/config.toml`, endret i en egen commit (AD-11)
**Når** `db reset` kjøres
**Så** finnes den private bucketen `report-images` med grense på 5 MB (5 × 1024 × 1024 byte) og typene `image/jpeg`, `image/png` og `image/webp`
**Og** testbildene i `seed-images/<bruker-uuid>/` lastes inn via `objects_path`, og noen seed-rapporter peker på dem, også minst én skjult rapport
**Og** testbildene viser ingen ansikter eller lesbare bilskilt (P-2), og de er tatt av prosjekteieren selv eller har en åpen lisens som CC0, med kilden oppgitt i `seed-images/`

**Gitt** migreringen for bilder
**Når** den kjøres
**Så** har `reports` `CHECK (image_path IS NULL OR image_path LIKE author_id::text || '/%')` og `UNIQUE (image_path)` (AD-6)
**Og** `storage.objects` har bare disse policyene for bucketen: SELECT for `anon` når rapporten er synlig, SELECT for `authenticated` når rapporten er synlig eller brukeren er moderator, og INSERT for `authenticated` bare i egen mappe. Det finnes ingen UPDATE- eller DELETE-policy (AD-9)

**Gitt** pgTAP-testene med `tests.as_anon()` og `tests.as_user(uuid)`
**Når** `npx supabase test db` kjøres
**Så** kan `anon` og en bruker lese bildet til en synlig rapport, men ikke bildet til en skjult rapport, og moderatoren kan lese begge (FR-9)
**Og** en bruker kan laste opp i sin egen mappe, men ikke i en annens, og ingen kan overskrive eller slette et bilde
**Og** `anon` kan lese bildeoppslaget uten feil når en skjult rapport finnes (AD-14)

**Gitt** lokal Storage
**Når** et Vitest-skript lager en signert lenke med `createSignedUrl` som besøkende og som bruker
**Så** virker det for bildet til en synlig rapport og avvises for bildet til en skjult rapport
**Og** det står i arkitekturen hvilken rettighet `createSignedUrl` krever

**Gitt** at alle testene består
**Når** spiken er ferdig
**Så** er AD-6 og AD-9 endret fra `[PROVISIONAL]` til `[ADOPTED]`, og raden om dette i Deferred er fjernet (AR-8)

**Gitt** at en test feiler
**Når** spiken er ferdig
**Så** stopper arbeidet med bilder, og prosjekteieren velger reserveløsningen i AD-6: en server-eid modul som signerer lenker etter at rapporten er lest med brukerens sesjon
**Og** valget og endringen av AD-11 står i `docs/beslutninger/` før Story 1.7 starter

### Story 1.7: Bilder på detaljsiden og i lista

Som besøkende
vil jeg se bildet som hører til en rapport,
slik at jeg forstår hva problemet gjelder.

**Akseptansekriterier:**

**Gitt** en synlig rapport med bilde
**Når** detaljsiden åpnes
**Så** vises bildet via én signert lenke som lages på serveren og varer i 60 sekunder, med `<img>` eller `next/image` med `unoptimized` og en alternativ tekst (FR-5, UX-DR13, AR-11)
**Og** svaret har `Cache-Control: private, no-store`
**Og** mangler bildeobjektet, vises siden uten bilde og uten feil

**Gitt** koden som lager signerte lenker
**Når** den gjennomgås
**Så** lages lenken i én funksjon på serveren, så en reserveløsning fra spiken bare endrer den funksjonen (AD-6, AD-9)

**Gitt** en rapport med bilde i lista
**Når** lista vises
**Så** står bildeikonet (lucide `Image`, 16 px, `aria-label="Har bilde"`) sist i metadatalinja, og selve bildet vises ikke (UX-DR5)
**Og** serveren regner ut om rapporten har bilde, og `image_path` sendes aldri til nettleseren (AR-6)

**Gitt** en skjult rapport med bilde
**Når** en besøkende eller en vanlig bruker prøver å åpne den
**Så** vises 404-siden, og det lages ingen signert lenke til bildet (AD-6)

**Gitt** detaljsiden med bilde
**Når** axe-sjekken kjøres
**Så** er det ingen funn med alvorlighet «serious» eller «critical», og kjerneflyttesten åpner en rapport med bilde bare med tastatur (NFR-8)

## Epic 2: Studenter kan melde et problem

En bruker oppretter konto, logger inn og registrerer en rapport med beskrivelse, lokasjon, kategori og valgfritt bilde. KI-en foreslår kategori og oppsummering, og rapporten vises med status **Ny**.

### Story 2.1: Konto og innlogging

Som besøkende
vil jeg opprette en konto og logge inn med e-post og passord,
slik at jeg kan melde problemer og bekrefte rapporter.

**Akseptansekriterier:**

**Gitt** en besøkende
**Når** hen åpner menyen i topplinja
**Så** står «Logg inn» der, og innloggingssiden har en lenke til «Registrer konto» (UX-DR4)
**Og** begge sidene tar med `next`, så brukeren kommer tilbake dit hen kom fra

**Gitt** registreringsskjemaet
**Når** en besøkende oppretter en konto med e-post og passord
**Så** er hen innlogget med en gang, uten e-postbekreftelse, og kommer tilbake dit hen kom fra
**Og** kontoen har rollen `user` fra `handle_new_user`, og appen lagrer ingen navn (FR-1)

**Gitt** registrerings- eller innloggingsskjemaet
**Når** e-posten allerede er i bruk, passordet er for kort, eller e-post eller passord er feil
**Så** står en norsk feilmelding ved feltet eller skjemaet, koblet med `aria-describedby`, og ingen tekst fra Supabase vises (UX-DR12, UX-DR17, AR-12)

**Gitt** en innlogget bruker
**Når** hen åpner menyen
**Så** står hens egen e-postadresse og «Logg ut» der, og moderatoren ser i tillegg merkelappen «Moderator» (UX-DR4)
**Og** e-postadressen vises bare for brukeren selv
**Og** «Logg ut» logger ut og viser lista som for en besøkende

**Gitt** `lib/supabase/auth.ts`
**Når** en side eller en Server Action trenger å vite hvem som er innlogget
**Så** gir `getViewer()` `{ user, isModerator }`, med brukeren fra `auth.getUser()` og rollen fra brukerens egen rad i `profiles`, aldri fra JWT (AR-13)
**Og** `requireUser(returnTo)` sender en besøkende til `/auth/login?next=<sti>`, og etter innlogging kommer hen tilbake til stien

**Gitt** en `next`-parameter som peker til et annet domene
**Når** innloggingen er ferdig
**Så** sendes brukeren til `/`
**Og** Vitest-tester viser at `//x`, `/\x`, `https://x` og `javascript:alert(1)` gir `/`, og at en sti på samme domene godtas (AR-13)

**Gitt** koden for innlogging
**Når** den gjennomgås
**Så** brukes nettleserklienten (`lib/supabase/client`) bare i skjemaene for innlogging, registrering og utlogging, aldri til data (AR-13)
**Og** startpakkens sider som v1 ikke bruker, er fjernet: glemt passord, nytt passord og eksempelsiden `protected` (PRD §9)

**Gitt** innloggings- og registreringssiden
**Når** axe-sjekken kjøres
**Så** er det ingen funn med alvorlighet «serious» eller «critical», og alle felt har synlig `label` (NFR-8, UX-DR18)
**Og** kjerneflyttesten logger inn som en testbruker bare med tastatur

### Story 2.2: Registrere en rapport

Som innlogget bruker
vil jeg registrere et problem med beskrivelse, kategori og lokasjon,
slik at moderatoren og andre på campus ser det.

**Akseptansekriterier:**

**Gitt** lista
**Når** en bruker trykker den flytende «+»-knappen (under 640 px) eller «Registrer problem» i topplinja (fra 640 px)
**Så** åpnes skjemaet for ny rapport med fokus i beskrivelsesfeltet (UX-DR4, UX-DR9, UX-DR10)
**Og** den flytende knappen er 56 px, ligger nede til høyre og har `aria-label="Registrer problem"`
**Og** tomtilstanden i lista har nå knappen «Registrer problem», som går til samme sted (UX-DR16)

**Gitt** en besøkende
**Når** hen trykker «+» eller åpner skjemaet direkte
**Så** sender `requireUser` hen til innlogging, og etter innlogging kommer hen tilbake til skjemaet (FR-1)

**Gitt** skjemaet
**Når** det vises
**Så** har det beskrivelse med telleren «N/1000» og påminnelsen «Ikke skriv navn eller andre personopplysninger.», kategori med de fem kategoriene fra `lib/labels.ts`, og lokasjon med plassholderen «F.eks. gangveien ved bygg A», alle påkrevd og med synlig `label` (FR-3, UX-DR10)
**Og** telleren leses ikke opp for hvert tegn
**Og** «Send inn» er deaktivert til beskrivelse, kategori og lokasjon er fylt inn, og tekst med bare mellomrom regnes som tom

**Gitt** en beskrivelse over 1000 tegn eller en lokasjon over 200 tegn
**Når** brukeren skriver forbi grensen
**Så** står en feilmelding under feltet, koblet med `aria-describedby`, og ved et forsøk på å sende inn flyttes fokus til første feil (UX-DR12)
**Og** Server Action avviser for lang eller tom tekst med `validation_failed`, og databasen avviser den med `CHECK`, så regelen gjelder også utenom skjemaet (AR-5, NFR-4)

**Gitt** en beskrivelse på nøyaktig 1000 tegn og en lokasjon på nøyaktig 200 tegn, også med emoji og æøå
**Når** rapporten sendes inn
**Så** godtas den, og ett tegn mer avvises i skjemaet, i Server Action og i databasen
**Og** grensen gjelder teksten etter trimming, både i skjemaet og i Server Action, så mellomrom på slutten ikke gir feil
**Og** Vitest- og pgTAP-tester viser at `lib/limits.ts` og `char_length` teller de samme tekstene likt

**Gitt** et gyldig skjema
**Når** brukeren trykker «Send inn»
**Så** viser knappen «Sender …» og er deaktivert til svaret kommer
**Og** rapporten lagres med trimmet tekst, uten oppsummering og uten bilde
**Og** brukeren kommer til detaljsiden med status **Ny**, «1 har sett dette» og toasten «Rapporten er sendt inn» (FR-3, FR-5)
**Og** rapporten står øverst i lista, fordi Server Action kaller `revalidatePath` for lista og detaljsiden (AR-11)

**Gitt** at innsendingen feiler
**Når** svaret kommer
**Så** vises destructive-toasten «Kunne ikke sende inn. Prøv igjen.», og alt brukeren har fylt inn, er beholdt (UX-DR12)
**Og** feilen er oversatt i `lib/errors.ts`, og ingen databasetekst vises (AR-12)

**Gitt** migreringen for innsending
**Når** pgTAP-testene kjøres
**Så** kan en innlogget bruker sette inn en rapport med kolonnene `description`, `location`, `category`, `summary` og `image_path`, og `author_id` blir brukerens egen id (AR-7)
**Og** en bruker kan ikke sette `author_id`, `status`, `hidden`, `created_at` eller `status_changed_at`, og `anon` kan ikke sette inn rapporter (NFR-4)

**Gitt** skjemaet tomt og med valideringsfeil
**Når** axe-sjekken kjøres
**Så** er det ingen funn med alvorlighet «serious» eller «critical»
**Og** kjerneflyttesten registrerer en rapport bare med tastatur, uten horisontal scrolling på 360 px (NFR-1, NFR-8)

### Story 2.3: KI-forslag for kategori og oppsummering

Som bruker som registrerer et problem
vil jeg få forslag til kategori og en kort oppsummering ut fra beskrivelsen,
slik at det går raskt å melde, og rapportene blir lette å skumlese.

**Akseptansekriterier:**

**Gitt** `lib/ai`
**Når** `suggest(description)` kalles
**Så** svarer den `{ category, summary }` eller `null`, med adapteren valgt av `AI_PROVIDER=mock|openai`, og mock når nøkkel mangler (AR-9, NFR-2)
**Og** den OpenAI-kompatible adapteren leser base-URL, modell og nøkkel fra `lib/env.ts`, og variablene står i `.env.example` uten verdier (NFR-3)
**Og** adapteren ber om JSON-svar (`response_format`) der leverandøren støtter det, og tåler at JSON-svaret er pakket i en kodeblokk
**Og** mock gir forutsigbare svar etter nøkkelord, for eksempel `lighting` for «gatelys», og sender ingen tekst ut av maskinen (PRD §8)

**Gitt** et svar fra modellen
**Når** det valideres
**Så** godtas bare kategorier som er kodeverdiene i de genererte typene, og et ugyldig svar, en feil eller et svar etter 5 sekunder gir `null` (FR-4)
**Og** oppsummeringen er ren tekst, kortes til 300 tegn og vises aldri som HTML, og en tom oppsummering blir `NULL`
**Og** rapportteksten logges aldri, heller ikke når kallet feiler (AR-12)
**Og** Vitest-tester dekker ugyldig kategori (også kodeverdi med feil store og små bokstaver og norsk navn som «Belysning»), ugyldig JSON, JSON i en kodeblokk, gyldig kategori uten oppsummering (gir kategori og ingen oppsummering), for lang oppsummering, HTML i oppsummeringen og tidsavbrudd

**Gitt** en innlogget bruker i skjemaet
**Når** hen går ut av beskrivelsesfeltet med minst 10 tegn som er endret siden forrige forslag
**Så** henter skjemaet forslaget fra en Server Action som krever innlogging, og høyst 2000 tegn sendes (AR-9, UX-DR11)
**Og** forslaget hentes ikke mens brukeren skriver
**Og** nøyaktig 10 tegn henter forslag, og 9 tegn gjør det ikke
**Og** hver bruker har høyst ett kall i gang, og svar på tekst som er endret siden, forkastes
**Og** en besøkende som kaller handlingen direkte, får `unauthenticated`

**Gitt** at KI-en jobber
**Når** skjemaet vises
**Så** står «Finner kategori …» med en spinner ved kategorivalget, kategorivalget kan fortsatt brukes, og «Send inn» venter bare hvis brukeren ikke har valgt kategori selv (UX-DR10, UX-DR11)

**Gitt** et forslag
**Når** det kommer
**Så** blir kategorien valgt med merkelappen «Foreslått av KI», og skjermleseren leser «Kategori foreslått: Belysning» via `aria-live="polite"`
**Og** oppsummeringen vises som lesetekst med «Endre», og en oppsummering brukeren skriver selv, har også maks 300 tegn: nøyaktig 300 tegn godtas, og 301 avvises (FR-4)
**Og** har brukeren valgt kategori selv, endres ikke valget, og merkelappen forsvinner når brukeren endrer kategori

**Gitt** at KI-en ikke svarer innen 5 sekunder, feiler eller gir et ugyldig svar
**Når** skjemaet får `null`
**Så** står «Vi fikk ikke et forslag. Velg kategori selv.», kategorivalget er tomt og påkrevd, og rapporten kan sendes inn uten oppsummering (FR-4, SM-6)
**Og** mock-adapteren gir ingen forslag for et fast testord, så e2e-testene kan teste denne tilstanden

**Gitt** en rapport som sendes inn med oppsummering
**Når** den lagres
**Så** er oppsummeringen lagret, og kortet i lista viser den i stedet for beskrivelsen (UX-DR5)

**Gitt** påminnelsen under beskrivelsesfeltet
**Når** skjemaet vises
**Så** står hele teksten: «Ikke skriv navn eller andre personopplysninger. Teksten sendes til en KI-tjeneste for å foreslå kategori.» (PRD §8)

**Gitt** skjemaet med et KI-forslag
**Når** axe-sjekken kjøres
**Så** er det ingen funn med alvorlighet «serious» eller «critical», og kjerneflyttesten bruker forslaget fra mock bare med tastatur (NFR-8)

### Story 2.4: Legge ved et bilde

Som bruker som registrerer et problem
vil jeg legge ved et bilde,
slik at moderatoren og andre ser hva problemet gjelder.

**Akseptansekriterier:**

**Gitt** skjemaet for ny rapport
**Når** brukeren trykker «Legg til bilde»
**Så** åpnes kamera eller bildebibliotek på mobil, og under knappen står «Unngå ansikter og bilskilt på bildet. JPEG, PNG eller WebP, maks 5 MB.» (FR-3, UX-DR10)
**Og** brukeren ser bildet før innsending og kan fjerne det igjen

**Gitt** en fil over 5 MB, i et annet format enn JPEG, PNG eller WebP, eller som ikke er et gyldig bilde
**Når** brukeren velger den
**Så** avvises den med en gang med en feilmelding ved feltet
**Og** Server Action og bucketen avviser den samme fila, så regelen gjelder også utenom skjemaet (AD-9, NFR-4)

**Gitt** grensen på 5 MB
**Når** den sjekkes i skjemaet, i Server Action og i bucketen
**Så** betyr den 5 × 1024 × 1024 byte alle tre steder, en fil på nøyaktig grensen godtas, og én byte mer avvises
**Og** en tom fil og et bilde med svært store dimensjoner avvises, uten at serveren går tom for minne
**Og** filendelsen i stien kommer fra bildetypen serveren fant i fila, ikke fra filnavnet

**Gitt** et bilde på nesten 5 MB
**Når** rapporten sendes inn
**Så** går innsendingen gjennom, fordi grensen for forespørselsstørrelse i Server Actions (`serverActions.bodySizeLimit`) er satt høyt nok for 5 MB pluss overhead (AD-9)

**Gitt** et bilde med EXIF-data
**Når** serveren tar imot det
**Så** fjernes alle EXIF-metadata, også GPS, enhet og tidspunkt, før bildet lagres, og bildet står riktig vei etterpå (P-1)
**Og** en test laster opp et testbilde med GPS-data og sjekker at den lagrede fila ikke har EXIF-data
**Og** GPS-koordinatene i testbildet er oppdiktet og satt med et verktøy, så bildet ikke avslører en ekte posisjon
**Og** AD-9 i arkitekturen har regelen om EXIF, og biblioteket som brukes, står i Stack-tabellen

**Gitt** et gyldig bilde
**Når** rapporten sendes inn
**Så** lastes bildet opp først, med brukerens sesjon, til `<author_id>/<uuid>.<ext>` med en ny uuid og uten `upsert`, og stien lagres i `image_path` (AD-9)
**Og** feiler opprettelsen av rapporten etter opplastingen, vises feiltoasten, skjemaet beholder alt, også bildet, og fila blir liggende uten at noen kan lese den (Deferred i arkitekturen)

**Gitt** skjemaet med et valgt bilde
**Når** axe-sjekken kjøres
**Så** er det ingen funn med alvorlighet «serious» eller «critical»
**Og** kjerneflyttesten legger ved et bilde, der valget av fil er unntatt fra kravet om bare tastatur, og rapporten vises med bildeikon i lista og med bilde på detaljsiden, slik Story 1.7 viser dem (SM-1)

### Story 2.5: Velge KI-leverandør med SM-5-testen

Som prosjekteier
vil jeg kjøre et fast testsett mot leverandørene på kortlista,
slik at KI-leverandøren velges ut fra målinger, og det åpne spørsmålet i PRD §11 kan lukkes.

**Akseptansekriterier:**

**Gitt** `evals/sm5/`
**Når** testsettet åpnes
**Så** har det 20 oppdiktede beskrivelser på norsk, fire per kategori, med fasit (AR-15, SM-5, FR-4)
**Og** skriptet kaller `lib/ai`, den samme modulen som appen bruker

**Gitt** skriptet
**Når** det kjøres mot mock
**Så** sier det tydelig at resultatet ikke sier noe om kvalitet

**Gitt** en leverandør med nøkkel i `.env`
**Når** skriptet kjøres
**Så** viser det antall riktige kategorier av 20, om hvert svar var gyldig JSON, svartiden for hvert kall og oppsummeringene, så språket kan sjekkes (PRD §11)
**Og** bare testsettet sendes til leverandøren

**Gitt** kortlista Cloudflare, Groq og Mistral
**Når** testen kjøres
**Så** er det først avklart om Cloudflare krever betalingskort, hvor Cloudflare kjører inferensen, og hva gratisgrensene hos Groq og Mistral er (PRD §11, NFR-7)
**Og** vinneren treffer minst 16 av 20, gir gyldig JSON hver gang, svarer på under 5 sekunder og viser ikke dansk eller nynorsk i oppsummeringene
**Og** personvernet er vurdert: Gemini på gratisnivå er ikke med, og velges Mistral, er trening på dataene slått av (PRD §8, personvernresearchen)

**Gitt** valget
**Når** det er tatt
**Så** står resultatene og begrunnelsen i `docs/beslutninger/`, spørsmål 1 i PRD §11 er lukket, raden i Deferred i arkitekturen er oppdatert, og `.env.example` viser variablene for den valgte leverandøren uten nøkkel (NFR-3)
**Og** oppfyller ingen leverandør kravene, står det i beslutningsloggen, og appen bruker fortsatt mock som standard

## Epic 3: Finne rapporter og si «jeg har også sett dette»

Brukeren filtrerer på kategori og status og sorterer på «Nyeste» eller «Flest har sett». Innloggede finner sine egne rapporter med «Mine rapporter» og kan bekrefte andres rapporter én gang.

### Story 3.1: Filtrere og sortere lista

Som besøkende
vil jeg filtrere lista på kategori og status og sortere den på nyeste eller flest som har sett,
slik at jeg raskt finner ut om noen allerede har meldt problemet jeg ser.

**Akseptansekriterier:**

**Gitt** lista
**Når** den vises
**Så** står en brikkerad over kortene med «Alle», de fem kategoriene og de tre statusene, og en `Select` for sortering med «Nyeste» (standard) og «Flest har sett» (UX-DR7, UX-DR8)
**Og** brikkene er knapper med `aria-pressed`, og «Alle» er trykket inn når verken kategori eller status er valgt
**Og** brikkeraden kan rulles sideveis inne i seg selv, mens siden ikke får horisontal scrolling på 360 px (NFR-1)

**Gitt** brikkeraden
**Når** brukeren trykker en kategori og en status
**Så** viser lista bare rapporter med den kategorien og den statusen, og én kategori og én status kan være aktive samtidig (FR-6)
**Og** et trykk på en annen kategori eller status bytter den ut, et nytt trykk på en aktiv brikke slår den av, og «Alle» fjerner kategori og status

**Gitt** sorteringsvalget
**Når** brukeren velger «Flest har sett»
**Så** sorteres lista på `confirmation_count DESC, created_at DESC, id DESC`, og «Nyeste» sorterer på `created_at DESC, id DESC` (FR-6)
**Og** filtrene beholdes når sorteringen endres, og sorteringen beholdes når filtrene endres

**Gitt** et valg av filter og sortering
**Når** siden lastes på nytt eller lenken deles
**Så** gir URL-en samme visning, med kodeverdiene, for eksempel `?category=lighting&status=new&sort=confirmations` (UX-DR7)

**Gitt** `lib/list-params.ts`
**Når** URL-en tolkes
**Så** er `parseListParams` med Zod eneste tolkning, og spørringen, brikkene, `aria-pressed`, tomtilstandene og lenkene fra `buildListHref` bygges bare fra resultatet (AR-12)
**Og** ukjente verdier ignoreres: feil store og små bokstaver, gjentatt nøkkel, tom verdi og ukjent sortering gir lista uten den verdien
**Og** Vitest-tester dekker disse tilfellene og lenkene `buildListHref` lager

**Gitt** et filter uten treff
**Når** lista vises
**Så** står «Ingen rapporter matcher filteret.» og lenken «Nullstill filter», som fjerner kategori og status og beholder sorteringen (UX-DR16)

**Gitt** seed-dataene
**Når** en tabelldrevet test går gjennom alle kombinasjoner av kategori, status og sortering
**Så** gir hver kombinasjon forventet antall og rekkefølge (SM-4)
**Og** fasiten er en håndskrevet tabell over seed-rapportene i testen, ikke den samme spørringen som appen bruker
**Og** seed-dataene har minst to synlige rapporter med like mange bekreftelser, så rekkefølgen ved likt antall blir testet

**Gitt** lista med aktive filtre og tilstanden «Ingen treff»
**Når** axe-sjekken kjøres
**Så** er det ingen funn med alvorlighet «serious» eller «critical»
**Og** kjerneflyttesten filtrerer bare med tastatur (NFR-8)

### Story 3.2: «Mine rapporter»

Som innlogget bruker
vil jeg filtrere lista på rapportene jeg selv har registrert,
slik at jeg finner dem igjen og ser om de er fulgt opp.

**Akseptansekriterier:**

**Gitt** en innlogget bruker
**Når** lista vises
**Så** er «Mine rapporter» første brikke i raden, og en besøkende ser ikke brikken (UX-DR7)

**Gitt** brikken «Mine rapporter»
**Når** brukeren trykker den
**Så** viser lista bare rapporter brukeren selv har registrert, ikke rapporter hen har bekreftet, og URL-en får `mine=true` (FR-6)
**Og** filteret bruker bare `authored_by_me` fra visningen, aldri en sammenligning i TypeScript (AR-6)
**Og** «Mine rapporter» kan kombineres med én kategori og én status, og «Alle» endrer ikke «Mine rapporter»

**Gitt** en besøkende med `mine=true` i URL-en
**Når** lista vises
**Så** vises lista som uten filteret, fordi `parseListParams` gir `mine = false` for besøkende

**Gitt** en bruker som har registrert en rapport som er skjult
**Når** hen bruker «Mine rapporter»
**Så** vises ikke den skjulte rapporten (FR-9)

**Gitt** en bruker uten egne rapporter
**Når** «Mine rapporter» er eneste aktive filter
**Så** står «Du har ikke registrert noen rapporter ennå.» og knappen «Registrer problem» (UX-DR16)
**Og** er en kategori eller status også aktiv, står «Ingen rapporter matcher filteret.» i stedet
**Og** «Nullstill filter» fjerner nå også «Mine rapporter» og beholder sorteringen

**Gitt** seed-dataene og en innlogget seed-bruker
**Når** den tabelldrevne testen fra Story 3.1 kjøres med «Mine rapporter»
**Så** gir hver kombinasjon med kategori, status og sortering forventet antall og rekkefølge (SM-4)

**Gitt** lista for en innlogget bruker med aktive filtre og tilstanden «Ingen egne rapporter»
**Når** axe-sjekken kjøres
**Så** er det ingen funn med alvorlighet «serious» eller «critical» (NFR-8)

### Story 3.3: Bekrefte en rapport

Som innlogget bruker
vil jeg markere «Jeg har også sett dette» på en annens rapport,
slik at moderatoren ser hvor mange problemet gjelder, og rapporten klatrer i lista.

**Akseptansekriterier:**

**Gitt** migreringen for bekreftelser
**Når** pgTAP-testene kjøres
**Så** kan en innlogget bruker sette inn en bekreftelse med bare kolonnen `report_id`, og `user_id` blir brukerens egen id (AR-7)
**Og** en bruker kan ikke bekrefte sin egen rapport, en skjult rapport eller samme rapport to ganger, og kan ikke sette `user_id` eller `created_at`
**Og** ingen kan endre eller slette en bekreftelse, og en moderator kan bekrefte andres rapporter som en vanlig bruker (FR-7)
**Og** en bekreftelse på en løst rapport endrer ikke statusen, og `seen_count` øker med én

**Gitt** REST-grensen i lokal Supabase
**Når** Vitest-skriptet sender bekreftelser direkte til API-et
**Så** gir en besøkende 401, en bekreftelse av egen rapport 403, og en ny bekreftelse fra samme bruker 409 (FR-7, NFR-4)

**Gitt** `confirmReport(reportId)`
**Når** den kalles
**Så** kjøres `requireUser` først, og `reportId` valideres som uuid med Zod, ellers `validation_failed` (AR-12, AR-13)
**Og** den leser raden fra `reports_with_counts` med brukerens sesjon, bare for en riktig feilmelding: ingen rad gir `report_not_found`, `authored_by_me` gir `own_report`, `confirmed_by_me` gir `already_confirmed`, og `hidden` gir `forbidden`
**Og** ved innsettingen gir `42501` `forbidden` og `23505` `already_confirmed`, og svaret er `{ ok: true, data: { seen_count, confirmed_by_me } }` lest fra visningen etterpå
**Og** handlingen sjekker både `error` og antall rader, og kaller `revalidatePath` for lista og detaljsiden (AR-11)

**Gitt** detaljsiden
**Når** den vises
**Så** viser bekreftknappen «Jeg har også sett dette», eller «Din rapport» for rapportøren, «Du har sett dette ✓» når brukeren allerede har bekreftet, og «Skjult rapport» på en skjult rapport, som bare moderatoren ser. De tre siste er deaktivert (UX-DR14)
**Og** tilstanden kommer fra `authored_by_me`, `confirmed_by_me` og `hidden` i visningen, og knappen har stilene `button-confirm` og `button-confirm-done` fra `DESIGN.md`

**Gitt** en besøkende
**Når** hen trykker «Jeg har også sett dette»
**Så** sendes hen til innlogging og så tilbake til detaljsiden, der hen kan trykke på nytt (FR-1, UX-DR14)

**Gitt** en innlogget bruker på en annens rapport
**Når** hen trykker «Jeg har også sett dette»
**Så** øker telleren med én med en gang, for eksempel fra «1 har sett dette» til «2 har sett dette», og tallet erstattes av serverens `seen_count` når svaret kommer (FR-7, UJ-2)
**Og** knappen viser «Du har sett dette ✓» og er deaktivert, og endringen i telleren leses opp med `aria-live`
**Og** tastaturfokuset forsvinner ikke: knappen beholder fokus fordi den er deaktivert med `aria-disabled`, eller fokus flyttes til teksten «Du har sett dette ✓»
**Og** lista sortert på «Flest har sett» bruker det nye antallet

**Gitt** at kallet feiler
**Når** svaret kommer
**Så** går telleren tilbake, og en toast viser feilmeldingen fra `lib/errors.ts`, for eksempel «Du har ikke tilgang til dette.» ved `forbidden` (UX-DR14, UX-DR16)
**Og** svarer serveren `already_confirmed`, vises «Du har sett dette ✓» uten feiltoast

**Gitt** detaljsiden for en besøkende og for en innlogget bruker, før og etter bekreftelse
**Når** axe-sjekken kjøres
**Så** er det ingen funn med alvorlighet «serious» eller «critical»
**Og** kjerneflyttesten bekrefter en rapport bare med tastatur (NFR-8, SM-2)

## Epic 4: Moderator følger opp sakene

Moderatoren flytter status ett steg om gangen, og alle ser «sist oppdatert». Moderatoren kan skjule og vise rapporter, og andre enn moderatoren avvises med 403.

### Story 4.1: Endre status

Som moderator
vil jeg flytte statusen til en rapport ett steg om gangen,
slik at alle ser at saken er fulgt opp, og når det skjedde.

**Akseptansekriterier:**

**Gitt** migreringen for statusendring
**Når** den kjøres
**Så** har `reports` en UPDATE-policy med `USING` for rader brukeren kan se og `WITH CHECK (private.is_moderator())`, og `authenticated` har bare `GRANT UPDATE (status, hidden)` (AR-7)
**Og** triggeren `reports_guard_update` kaster `42501` for alle som ikke er moderator, `invalid_column_change` hvis noe annet enn `status` og `hidden` endres, og `invalid_status_step` ved hopp i statusflyten
**Og** triggeren setter `status_changed_at` til `now()` bare når statusen endres, og feilkodene kastes med `ERRCODE = 'P0001'` og koden i `MESSAGE`

**Gitt** pgTAP-testene
**Når** `npx supabase test db` kjøres
**Så** kan moderatoren flytte Ny → Under behandling → Løst og tilbake ett steg om gangen, og hopp mellom Ny og Løst gir `invalid_status_step` (FR-8)
**Og** en vanlig bruker får `42501` ved statusendring, også på sin egen rapport, og ingen kan sette `status_changed_at` selv (FR-2)
**Og** `status_changed_at` flyttes ved statusendring, mens en oppdatering uten ny status er lov og ikke flytter den

**Gitt** REST-grensen i lokal Supabase
**Når** Vitest-skriptet sender en statusendring direkte til API-et
**Så** gir en besøkende 401 og en vanlig bruker 403 (FR-2, NFR-4)

**Gitt** `setReportStatus(reportId, from, to)`
**Når** moderatoren endrer status
**Så** valideres `reportId` som uuid med Zod, og oppdateringen bruker `WHERE id = $1 AND status = $2` (AR-12)
**Og** er statusen allerede endret av noen andre, gir handlingen `stale_state`
**Og** handlingen sjekker både `error` og antall rader, oversetter feil i `lib/errors.ts` uten databasetekst og kaller `revalidatePath` for lista og detaljsiden (AR-11)

**Gitt** detaljsiden for en moderator
**Når** den vises
**Så** står moderatorpanelet nederst som et `Card` med nåværende status og bare knapper til nabostatusene: «Under behandling →» for Ny, «← Ny» og «Løst →» for Under behandling, og «← Under behandling» for Løst (UX-DR15)
**Og** brukere og besøkende ser ikke panelet

**Gitt** at moderatoren trykker en statusknapp
**Når** endringen er lagret
**Så** viser statusmerket den nye statusen, og «Sist oppdatert» viser tidspunktet for endringen i norsk tid (FR-8, UX-DR13)
**Og** knappene er deaktivert mens endringen lagres
**Og** etter endringen står tastaturfokuset på det nye statusmerket eller den første statusknappen, ikke på `body`
**Og** andre ser den nye statusen og tidspunktet neste gang de laster siden, uten sanntidsoppdatering

**Gitt** at handlingen feiler med `stale_state` eller `forbidden`
**Når** svaret kommer
**Så** vises en toast med meldingen fra `lib/errors.ts`, «Du har ikke tilgang til dette.» ved `forbidden`, og siden viser statusen som gjelder nå (UX-DR16)

**Gitt** brukerreisen UJ-3
**Når** en e2e-test registrerer en rapport og lar moderatoren sette den til Løst
**Så** ser rapportøren rapporten som **Løst** under «Mine rapporter» og «Sist oppdatert» med tidspunktet på detaljsiden (UJ-3, SM-3)

**Gitt** detaljsiden for moderatoren med panelet
**Når** axe-sjekken kjøres
**Så** er det ingen funn med alvorlighet «serious» eller «critical»
**Og** kjerneflyttesten logger inn som moderator, sorterer på «Flest har sett» og flytter statusen ett steg på rapporten den selv registrerte i samme kjøring, bare med tastatur (NFR-8)

### Story 4.2: Skjule og vise en rapport

Som moderator
vil jeg skjule en rapport og vise den igjen,
slik at en rapport med for eksempel et lesbart bilskilt forsvinner for alle andre, uten at noe slettes.

**Akseptansekriterier:**

**Gitt** `setReportHidden(reportId, hidden)`
**Når** moderatoren skjuler eller viser en rapport
**Så** tar handlingen en eksplisitt målverdi, aldri en veksling, validerer `reportId` med Zod og kaller `revalidatePath` for lista og detaljsiden (AR-11, AR-12)
**Og** ingenting slettes, og skjuling endrer ikke `status_changed_at` (FR-9)

**Gitt** pgTAP-testene
**Når** de kjøres
**Så** kan moderatoren skjule og vise en rapport, og det å skjule en rapport som allerede er skjult, er lov og endrer ingenting
**Og** en skjult rapport kan få ny status
**Og** en vanlig bruker får `42501` ved forsøk på å skjule, også sin egen rapport, og `status_changed_at` står uendret ved skjuling (FR-9)

**Gitt** REST-grensen i lokal Supabase
**Når** Vitest-skriptet prøver å skjule en rapport direkte via API-et som vanlig bruker
**Så** gir det 403 (FR-9, NFR-4)

**Gitt** moderatorpanelet på en synlig rapport
**Når** moderatoren trykker «Skjul rapport»
**Så** åpnes en `AlertDialog` som ber om bekreftelse, og rapporten skjules først når moderatoren bekrefter (UX-DR15)
**Og** knappen i panelet blir «Vis rapport», som viser rapporten igjen uten bekreftelse
**Og** etter skjuling står fokus på «Vis rapport», og etter visning på «Skjul rapport», så tastaturbrukeren ikke mister plassen

**Gitt** en skjult rapport
**Når** moderatoren ser lista eller detaljsiden
**Så** står rapporten blandet inn i lista med den grå merkelappen «Skjult» og grå bakgrunn (`hidden-bg` og `hidden-fg`), og detaljsiden har samme merking (UX-DR16, FR-9)
**Og** appen filtrerer aldri på `hidden` selv: RLS avgjør hva som vises (AD-6)

**Gitt** en skjult rapport
**Når** en annen enn moderatoren, også rapportøren, åpner lista, «Mine rapporter» eller en direkte lenke
**Så** er rapporten borte fra lista og «Mine rapporter», og lenken gir 404-siden «Fant ikke rapporten.» (FR-9, UX-DR13)
**Og** rapportøren får ingen melding
**Og** bildet kan ikke hentes, og signerte lenker som allerede er laget, slutter å virke etter 60 sekunder (AD-6, AD-9)

**Gitt** lista for moderatoren med en skjult rapport, detaljsiden for en skjult rapport og den åpne `AlertDialog`-en
**Når** axe-sjekken kjøres
**Så** er det ingen funn med alvorlighet «serious» eller «critical»
**Og** kjerneflyttesten skjuler rapporten den selv registrerte i samme kjøring, bare med tastatur, også bekreftelsen i dialogen
**Og** den fullstendige kjerneflyten i AD-15 går nå gjennom: logge inn, filtrere, åpne en rapport, bekrefte, registrere en rapport, og som moderator endre status og skjule (NFR-8)

### Story 4.3: Sensor kan starte og vurdere appen

Som sensor
vil jeg starte appen og kjøre alle testene på en ren maskin bare ved å følge README,
slik at jeg kan vurdere hele løsningen uten hjelp fra gruppen.

**Akseptansekriterier:**

**Gitt** README
**Når** den leses
**Så** har den Docker Desktop først, forutsetningene med versjoner, kommandoer som kan kopieres, `npx playwright install chromium`, testbrukerne med passord, `moderator@localfix.test`, SQL-setningen for å gjøre en bruker til moderator, alle testkommandoene og et skjermbilde (AR-16, NFR-2)
**Og** den sier at v1 bare kjører lokalt med oppdiktede testdata og ikke behandler personopplysninger (P-2)
**Og** den forklarer mock-modus og hvordan en ekte KI-leverandør slås på i `.env`, uten nøkler i repoet (NFR-3, NFR-7)

**Gitt** en ny klone i en tom mappe, uten `.env` og uten installerte avhengigheter
**Når** README følges steg for steg
**Så** starter appen, seed-dataene vises, og alle testkommandoene består (SM-7)
**Og** alt som måtte rettes underveis, er rettet i README

**Gitt** testkommandoene
**Når** de kjøres
**Så** består Playwright-testene i `e2e/`, pgTAP-testene, Vitest-testene og REST-testene, axe gir null funn med alvorlighet «serious» eller «critical» i alle tilstandene AD-15 nevner, og ytelsestesten består (NFR-6, NFR-8)
**Og** sammendraget med antall beståtte tester og antall axe-funn står i PR-beskrivelsen (AR-14)

**Gitt** kravene i PRD-en
**Når** sensor vil se hvordan de er testet
**Så** finnes en tabell, i README eller i en fil README lenker til, som viser hvilken test som dekker hvert av FR-1 til FR-9, NFR-1 til NFR-8 og SM-1 til SM-7, og hva som er sjekket for hånd

**Gitt** at sensor ikke får startet Docker
**Når** hen leser README
**Så** finnes en lenke til et kort skjermopptak av kjerneflyten, under 3 minutter
