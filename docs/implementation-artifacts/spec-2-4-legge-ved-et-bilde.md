---
title: 'Story 2.4: Legge ved et bilde'
type: 'feature'
created: '2026-11-10'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'c0b37ec9d28ad82adcfd2176f5d074297d77443a'
context:
  - '{project-root}/docs/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Skjemaet for ny rapport kan ikke ta imot et bilde, selv om bucketen `report-images`, `image_path`, signert lenke, bildeikon og detaljsiden finnes fra Epic 1. Reglene for type, størrelse, dimensjoner og EXIF (AD-9, P-1) er ikke bygget (issue #32, FR-3, UX-DR10, NFR-4).

**Approach:** Skjemaet får «Legg til bilde» med forhåndsvisning og «Fjern bilde». `createReport` tar imot filen, validerer den og fjerner EXIF med `sharp`, laster den opp med brukerens sesjon og lagrer stien i `image_path`. `serverActions.bodySizeLimit` heves, og testene som laster opp, rydder bucketen selv med service-role (retro F3).

## Boundaries & Constraints

**Always:**
- Grensen er `IMAGE_MAX_BYTES = 5 * 1024 * 1024` i `lib/limits.ts`, lik `file_size_limit = "5MiB"` i bucketen. Tillatte typer er `image/jpeg`, `image/png` og `image/webp`. Nøyaktig grensen godtas, én byte mer avvises. Tom fil avvises. `MAX_IMAGE_PIXELS = 40_000_000` (bredde × høyde) avvises over grensen.
- Skjemaet sjekker med en gang, i denne rekkefølgen: tom, type, størrelse, så at nettleseren kan lese bildet (forhåndsvisningen laster) og at pikselgrensen holder. Feilen står under feltet med `aria-invalid` og `aria-describedby`, med faste meldinger i `lib/image-input.ts`. Et avvist valg erstatter ikke et bilde som allerede er valgt. «Fjern bilde» fjerner bildet og gir fokus tilbake til «Legg til bilde».
- Teksten under knappen er nøyaktig «Unngå ansikter og bilskilt på bildet. JPEG, PNG eller WebP, maks 5 MB.» Fila velges med `<input type="file" accept="image/jpeg,image/png,image/webp">` uten `capture`, så mobilen tilbyr kamera og bibliotek. Knapper er 44 px høye, forhåndsvisningen har `rounded-lg`, og alt vises som ren tekst eller `<img>` fra `URL.createObjectURL` (frigjort ved fjerning og avmontering).
- `createReport` tar valgfri `image` (File/Blob) i objektet. Rekkefølgen er fast: `requireUser`, tekstvalidering, bildevalidering og behandling (`lib/image-process.ts`), opplasting, INSERT. Et felt `image_path` fra klienten ignoreres.
- `prepareImage` (server, `sharp` 0.35.5): sjekker størrelse før lesing, leser typen fra innholdet (ikke `file.type` eller filnavn), avviser alt utenom JPEG, PNG og WebP, bruker `limitInputPixels`, retter bildet etter EXIF-orienteringen (`rotate()`), skriver ut i samme format uten metadata (EXIF, GPS, enhet, tidspunkt) og gir endelsen `jpg`, `png` eller `webp` fra bildetypen. Ugyldig, ødelagt eller for stort gir `invalid_image`, uten å lese hele bildet inn i minnet først.
- Opplasting: `supabase.storage.from("report-images").upload("<user.id>/<randomUUID()>.<ext>", bytes, { contentType, upsert: false })` med brukerens egen sesjon. Feiler den: `upload_failed`, ingen INSERT. Lykkes den og INSERT feiler: feilkoden går tilbake, fila slettes ikke (ingen DELETE-policy, utsatt i AD-9), og skjemaet beholder alt, også bildet. Bare feilkode logges, aldri sti, filnavn eller tekst.
- Ny feilkode `invalid_image` i `lib/errors.ts` med fast melding. Skjemaet viser den ved bildefeltet og fokuserer feltet. Andre feil gir toasten «Kunne ikke sende inn. Prøv igjen.»
- `next.config.ts` setter `experimental.serverActions.bodySizeLimit` til `"6mb"` (under `proxyClientMaxBodySize`, standard 10 MB). Et bilde på nøyaktig 5 MiB går gjennom hele veien.
- `sharp` føres som eksakt dependency (`0.35.5`) og i Stack-tabellen. EXIF-regelen føres i AD-9, og beslutningen i `docs/beslutninger/`.
- Testene som laster opp til bucketen (`storage.db.test.ts` og nye) fjerner objektene de la inn, med service-role-klient i `afterAll`. Nøkkelen hentes fra `npx supabase status -o env` i en testhjelper, aldri fra `.env` eller appen.

**Never:**
- Ingen migrering, ingen endring i `supabase/config.toml`, `proxy.ts` eller policyene på `storage.objects`, og ingen DELETE-policy eller `upsert`.
- Komponenter importerer ikke `lib/image-process` eller `sharp`. Ingen `dangerouslySetInnerHTML`. Ingen service-role-nøkkel i appen.
- Ingen opprydding av fil som blir liggende etter feilet INSERT, og ingen endring i hvordan detaljsiden og lista viser bilder (Story 1.7).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Gyldig bilde | JPEG, PNG eller WebP under grensen | Forhåndsvisning med «Fjern bilde»; lagret med stien `<author_id>/<uuid>.<ext>`, vist i lista som ikon og på detaljsiden | N/A |
| På grensen | Gyldig bilde på 5 242 880 / 5 242 881 byte | Godtas / avvist med en gang i skjemaet, i Server Action og i bucketen | `invalid_image`, Storage `413` |
| Feil format | GIF, SVG, tekst eller HEIC, også omdøpt til `.jpg` | Avvist med en gang ved feltet, og i Server Action etter innholdet | `invalid_image`, `415` i bucketen |
| Tom eller ødelagt | 0 byte, avkortet fil, tilfeldige byte | Avvist ved feltet og i Server Action | `invalid_image` |
| Store dimensjoner | Liten PNG på 20000 × 20000 px | Avvist uten at serveren går tom for minne | `invalid_image` |
| EXIF | JPEG med oppdiktet GPS, enhet og tidspunkt | Lagret fil har ingen EXIF; bildet står riktig vei etter orientering 6 | N/A |
| Endelse | `bilde.png` med JPEG-innhold | Stien slutter på `.jpg` | N/A |
| Fjerne | «Fjern bilde» | Bildet borte, fokus på «Legg til bilde», rapporten sendes uten `image_path` | N/A |
| INSERT feiler | Opplasting OK, INSERT feiler | Toast, skjemaet beholder alt, også bildet; fila blir liggende | `unknown` / `forbidden` |
| Opplasting feiler | Storage svarer med feil | Ingen INSERT, toast, alt beholdes | `upload_failed` |
| Utenom skjemaet | Server Action eller Storage direkte med for stor eller feil type | Avvist | `invalid_image`, `413`/`415` |
| Fremmed mappe | Opplasting i en annens mappe | Avvist | `403` |
| Uten bilde | Ingen `image` | Ingen Storage-kall, `image_path` utelatt | N/A |

</frozen-after-approval>

## Code Map

- `components/report-form.tsx` -- har `errors`, `pending`, `focusFirstError`, `FieldError` (lokal) og `handleSubmit` som leser bare `result.ok`. Legg `image`-felt og `invalid_image` til; `ReportFieldErrors` har ikke `image`, bruk egen tilstand.
- `app/rapporter/ny/actions.ts` -- `createReport(input: unknown)`; `requireUser` gir `{ id }`. `actions.test.ts` -- mock av `createClient` har bare `from`; trenger `storage`.
- `lib/report-input.ts` -- `parseReportInput` fjerner ukjente felt, så `image` og `image_path` går aldri gjennom den. `lib/limits.ts`, `lib/errors.ts` (`upload_failed` finnes; `invalid_image` mangler).
- `lib/supabase/images.ts` -- `IMAGE_BUCKET`, `signReportImage`. Gjenbruk `IMAGE_BUCKET`, ikke endre.
- `supabase/config.toml:122-126` -- bucketen har `5MiB` og de tre typene. `supabase/migrations/20261109141557_bilder.sql` -- INSERT bare i egen mappe, ingen UPDATE/DELETE. Rør ikke.
- `lib/supabase/storage.db.test.ts` -- `describe("upload som bruker1")` laster opp uten opprydding; mønster for `clientFor` og `loadEnvConfig`.
- `next.config.ts` -- tom i dag. `node_modules/next/dist/docs/.../serverActions.md` -- `bodySizeLimit`.
- `sharp` 0.35.5 ligger allerede i `node_modules` (Next sin valgfrie avhengighet), og virker (verifisert). `withExif` kan sette GPS i testbilder; `metadata().exif` viser om EXIF finnes.
- `e2e/core-flow.spec.ts` (rundt linje 148–215) -- kjerneflyten; legg bilde etter lokasjon med `setInputFiles` (unntatt tastaturkravet), og sjekk ikon i lista og bilde på detaljsiden. `e2e/endrer/ny-rapport.spec.ts` -- `isCreateReport` leter etter `"location"` i kroppen; sjekk at den virker med filkropp. `supabase/seed-images/**/*.jpg` -- CC0-bilder uten ansikter, kan brukes som testbilde.
- `docs/planning-artifacts/architecture/architecture-LocalFix-2026-10-28/ARCHITECTURE-SPINE.md` (AD-9, Stack), `docs/beslutninger/arkitektur-beslutningslogg.md` og `ux-beslutningslogg.md`, `docs/ux/EXPERIENCE.md` og kopien i `docs/planning-artifacts/ux-designs/…`, `README.md`, `epic-2-context.md`.

## Tasks & Acceptance

**Execution:**
- [x] `package.json`, `package-lock.json` -- `sharp` 0.35.5 eksakt (`npm install --save-exact`) -- brukes direkte
- [x] `next.config.ts` -- `serverActions.bodySizeLimit: "6mb"` med kommentar om 5 MiB pluss overhead -- AD-9
- [x] `lib/limits.ts`, `lib/image-input.ts` (+ test) -- `IMAGE_MAX_BYTES`, `IMAGE_TYPES`, `MAX_IMAGE_PIXELS`, `IMAGE_MESSAGES`, `checkImageFile({ size, type })` med 0, 5 MiB, 5 MiB + 1 og typer -- delt av skjema og server
- [x] `lib/image-process.ts` (+ test) -- `prepareImage`: innholdstype, endelse, pikselgrense, EXIF vekk (oppdiktet GPS satt med sharp), orientering 6, GIF/SVG/tekst/avkortet/tom, 20000 × 20000 -- P-1
- [x] `lib/errors.ts` (+ test) -- `invalid_image` med fast melding
- [x] `app/rapporter/ny/actions.ts` (+ test) -- bildesti, rekkefølge, `upload_failed` uten INSERT, INSERT-feil etter opplasting uten sletting, `image_path` fra klient ignorert, uten bilde ingen Storage-kall, ingen sti eller tekst i loggen
- [x] `components/image-field.tsx`, `components/report-form.tsx` -- knapp, hint, forhåndsvisning, «Fjern bilde», umiddelbar avvisning, `invalid_image` ved feltet, fil sendt med `createReport`
- [x] `components/report-form.test.ts` -- vakt: ingen import av `lib/image-process` eller `sharp` i `components/`
- [x] `lib/supabase/test-admin.ts`, `lib/supabase/storage.db.test.ts` -- service-role-opprydding i `afterAll`; bucketen tar imot 5 MiB, avviser 5 MiB + 1 (`413`), tar imot PNG og WebP, avviser GIF (`415`)
- [x] `e2e/endrer/bilde.spec.ts` (ny) -- valg, forhåndsvisning, fjerne, avvisninger ved feltet, 5 MiB-bilde sendt inn, EXIF borte i lagret fil, bilde på detaljsiden og ikon i lista, feilet innsending beholder bildet, axe og bredde på 360, 320 og 1280 px
- [x] `e2e/core-flow.spec.ts` -- legg ved bilde (filvalg unntatt tastatur), ikon i lista, bilde på detaljsiden
- [x] Dokumenter -- AD-9 (EXIF-regel, `sharp`, `bodySizeLimit`) og Stack-tabell, beslutningslogger, `EXPERIENCE.md` (begge kopier), `README.md`, `epic-2-context.md`; sprint-status settes av byggeflyten

**Acceptance Criteria:**
- Given skjemaet, when brukeren velger et gyldig bilde og sender inn, then lagres filen uten EXIF under `<author_id>/<uuid>.<ext>`, og detaljsiden viser bildet og lista ikonet.
- Given en fil som bryter en regel, when den velges eller sendes direkte til Server Action eller bucketen, then avvises den med samme grense og samme regel alle tre steder der stedet kan sjekke den.
- Given `npm test`, when alt kjøres, then består Vitest `unit` og `db`, pgTAP og Playwright, og bucketen er ryddet av testene selv.

## Implementation Notes

- Implementert direkte i hovedsesjonen (ingen implementeringsagent). Ny pakke: `sharp` 0.35.5 (eksakt, i Stack-tabellen). Ingen migrering og ingen endring i `config.toml`, `proxy.ts` eller policyene.
- Nye filer: `lib/image-input.ts` (grense, typer, meldinger, `checkImageFile`), `lib/image-process.ts` (`prepareImage`), `components/image-field.tsx`, `lib/test-images.ts` (testbilder med oppdiktet GPS), `lib/supabase/test-admin.ts` (service-role-opprydding) og `e2e/endrer/bilde.spec.ts`. Ny feilkode `invalid_image`.
- `File` i objektargumentet til `createReport` virket uten `FormData` (verifisert med e2e, også med 5 MiB). `bodySizeLimit` er `6mb`.
- Avgjørelser underveis: grensen på 40 megapiksler (`MAX_IMAGE_PIXELS`) er valgt her, siden epics bare sier «svært store dimensjoner». Etter at et bilde er valgt, er «Legg til bilde» byttet ut med «Fjern bilde», som får fokus, så tastaturbrukeren ikke mister plassen. En melding om bildet gir fokus til «Legg til bilde». Serverens `invalid_image` viser meldingen ved feltet og fjerner bildet.
- Bucketen sjekker bare størrelse og oppgitt type, så tom fil og feil innhold stoppes bare av serveren (Design Notes og beslutningsloggen).
- Verifisering: lint 0 feil, `npm run test:unit` 678 bestått, `npm run build`, `db-types --check`, og hele `npm test` med exit 0 på 505 s (Vitest unit 678, Vitest db 36, pgTAP, Playwright 192). Etter review-patchene er lint, unit, build og `storage.db.test.ts` kjørt på nytt.
- Matriserevisjonen fant at alle 13 rader har minst én test som kjørte og besto.
- Etter advanced elicitation på feilhåndteringen (walkthrough, brukerens valg): `prepareImage` sjekker filsignaturen før `sharp` leser noe (bare JPEG, PNG og WebP slippes til sharp), og `sharp` lastes først når et bilde skal behandles. Kan den ikke lastes, gir `prepareImage` `unavailable`, og `createReport` svarer `upload_failed` og logger `bilde_unavailable`, mens rapporter uten bilde virker. Nye tester: `lib/image-process.unavailable.test.ts`, signaturtester i `lib/image-process.test.ts` og en test i `actions.test.ts`. Forslaget om en egen toast ved `upload_failed` ble ikke tatt med, siden den generelle toasten er frosset i spec-en.

## Spec Change Log

## Review Triage Log

Gjennomgang 1 (Blind Hunter 12 funn, Edge Case Hunter 12 og Verification Gap 1 med 2 observasjoner), kjørt mot diff fra `baseline_commit` uten spec-en. Ingen intent_gap eller bad_spec, så ingen loopback.

| Id | Funn | Dom | Bevis | Rute |
|----|------|-----|-------|------|
| B1 / E2 / E3 / E11 | Et avvist valg over et valgt bilde annonseres ikke, mangler `aria-describedby`, og feilen blir stående ved siden av gyldig forhåndsvisning | low | Verifisert i `image-field.tsx`: med et bilde valgt er «Legg til bilde» og filfeltet (`hidden`) ikke tilgjengelige, så brukeren kan ikke velge en ny fil uten å fjerne bildet først. Tilstanden nås bare med `setInputFiles` i testen. Rettelsen (varsel, flere koblinger) er mer enn en direkte rettelse. | avvist |
| B2 | `upload_failed` forsvinner i en generell toast | false | Den frosne teksten sier at alle andre feil enn `invalid_image` gir toasten «Kunne ikke sende inn. Prøv igjen.». Koden gjør nøyaktig det. | avvist |
| B3 / E8 | Foreldreløse filer etter feilet INSERT og ved gjentatte forsøk, og testen «fila slettes ikke» låser det | false | Den frosne teksten og AD-9 sier at fila blir liggende, uten DELETE-policy, og at oppryddingen er utsatt (Deferred). Testen sjekker nettopp den regelen. | avvist |
| B4 / E7 | Ingen lås eller kvote mot parallelle opplastinger, og `sharp` uten `concurrency`/`cache`-grenser | low | Verifisert: `createReport` har ingen lås, og 40 megapiksler koster rundt 160 MB å dekode. Krever en innlogget bruker som sender mange store bilder samtidig mot en lokal v1 uten drift (AD-8 godtar samme begrensning for KI-låsen). Rettelsen er en ny funksjon (lås, kvote, sharp-oppsett). Før drift hører dette hjemme i hardeningen. | avvist |
| B5 / G2 | Gjenkodingen kan gi større fil, og grenen `too_large` etter gjenkoding har ingen test | low | Design Notes sier uttrykkelig at grenen ikke har noen test fordi et slikt bilde ikke kan lages pålitelig, og bucketen avviser uansett med 413. | avvist |
| B6 / E9 | Animert WebP og PNG flates stille ut til første bilde | low | Verifisert i `prepareImage` (ingen `animated`), og kommentaren sier det. Animerte bilder til en problemrapport er sjeldne. Å avvise `pages > 1` er en ny gren og en ny regel utenfor intensjonen. | avvist |
| B7 / E6 | Tom eller uvanlig `File.type` for et gyldig bilde gir avvisning i skjemaet | low | Verifisert i `checkImageFile`. Krever en plattform som gir tom type for en vanlig JPEG, og brukeren får en melding og velger på nytt. Den frosne teksten ber om at skjemaet sjekker typen. En endelsesreserve er en ny gren. | avvist |
| B8 / E1 | `Image`-sonden i `handleChange` kan avsluttes sent og overskrive et nyere valg, og kalles etter avmontering | low | Verifisert: ingen avbrudd. Krever at brukeren åpner filvelgeren to ganger før den første sonden er ferdig (millisekunder), og sonden til et vanlig bilde er raskere enn filvelgeren. Å sette tilstand etter avmontering er ufarlig i React 19. Rettelsen er en teller i en ref, altså en ny vakt. | avvist |
| B9 | Testhull: `image_path` uten bilde, `upload_failed` og serialisering av `File` | false | `actions.test.ts` har fra 2.2 testen «bare description, location, category og summary sendes» med `image_path: "y"` og uten bilde. `File` i objektargumentet er dekket av e2e-testene som sender bilde (30 bestått). Verification Gap-laget fant ingen svikt her. | avvist |
| B10 / G3 | `rss`-målingen i testen om 20000 × 20000 er maskinavhengig og kan gi falsk feil | low | Verifisert: `process.memoryUsage().rss` avhenger av søppelrydding og parallelle tester, og viser ikke mer enn at `prepareImage` gir `dimensions`, som skjer før dekoding (`limitInputPixels`). Direkte sletting. | patch |
| B11 | E2E-bilder ryddes ikke | false | Retro F3 og spec-en gjelder Vitest `db`. Playwright starter med `db reset`, og `reset`-prosjektet kjører den også til slutt. Etter hele `npm test` var det tre objekter i bucketen (verifisert). | avvist |
| B12 | «5 MB» er hardkodet flere steder mens grensen er 5 MiB, og `6mb` er ikke knyttet til `IMAGE_MAX_BYTES` i en test | low | «5 MB» er den frosne brukerteksten (UX-DR10), og AD-9 og spec-en sier 5 × 1024 × 1024 byte. `image-input.test.ts` kobler grensen til `config.toml`, og e2e-testen på nøyaktig 5 MiB feiler hvis `6mb` ikke rekker. | avvist |
| B12b | `epic-2-context.md` har fortsatt «Gjør det som en del av Story 2.4», og EXPERIENCE-merknaden for 2.3 sier «Bilde kommer med Story 2.4» | low | Verifisert i begge filer. Direkte tekstrettelse. | patch |
| G1 | Oppryddingen av bucketen er ikke verifisert: ingen assertion sjekker at bucketen er tilbake til seed, og pgTAP `bilder.sql` kjører bare mot nytilbakestilt database | medium | Verifisert: slettes `uploaded.push(path)` eller `afterAll`, består alt, og `npx supabase test db` uten `db reset` ville feilet på `set_eq`. README og epic-konteksten sier nå at `db reset` ikke trengs. | patch |
| E4 | Nettleseren dekoder et svært bilde for å lese `naturalWidth`, og fanen kan fryse | low | Chrome leser målene fra hodet uten full dekoding (e2e med 9000 × 9000 gikk på sekunder). Rammer bare brukerens egen fane med en bevisst laget fil. Å lese hodet selv er ny kode. | avvist |
| E5 | `ImageField` er ikke deaktivert mens innsendingen pågår | low | Verifisert: knappene virker under «Sender …». `createReport` får bildet fra lukkingen, så innsendingen er uendret, og vinduet er ett nettverkskall. | avvist |
| E10 | Vakten mot `sharp` i komponenter ser ikke `app/` eller dynamiske import | low | `sharp` i klientkode stopper bygget med en tydelig feil. En bredere skanning er ny funksjon. | avvist |
| H1 | Elicitation: `sharp` importeres øverst, så en maskin der pakken ikke lar seg laste, mister også `createReport` og `suggestReport` | medium | Verifisert: `actions.ts` importerer `prepareImage`, som importerte `sharp` øverst, så modulen ville kastet ved lasting. Story 4.3 og README-sjekken ber sensor kjøre appen på en annen maskin. | patch |
| H2 | Elicitation: `sharp.metadata()` kjører SVG-, TIFF-, HEIF- og AVIF-parserne på upålitelige byte før formatet avvises | low | Verifisert i `prepareImage` og i den gamle testen («type» eller «unreadable»). Rettelsen er en signaturkontroll på noen få linjer. | patch |
| H3 | Elicitation: `upload_failed` gir den generelle toasten og ingen hint om å sende uten bilde | low | Frosset i spec-en («alle andre feil gir toasten»). Krever at spec-en åpnes. | avvist |
| E12 | «uten å lese hele bildet inn i minnet først» stemmer ikke, siden `arrayBuffer()` leser opp til 5 MiB | false | Pikselbomben dekodes aldri, og lesingen er begrenset til 5 MiB etter størrelsessjekken. Rettelsen er å endre spec-ordlyden. | avvist |

## Design Notes

- **Bucketen sjekker bare størrelse og deklarert type** (`file_size_limit`, `allowed_mime_types`), ikke innholdet. En tom fil eller en fil med feil innhold under riktig `content-type` kan bare Server Action stoppe. Akseptansekriteriet «Server Action og bucketen avviser den samme fila» gjelder derfor størrelse og type, og beslutningsloggen sier det.
- **Gjenkoding er prisen for å fjerne EXIF.** `sharp` skriver bildet på nytt uten metadata, så JPEG og WebP mister litt kvalitet. Blir resultatet større enn 5 MiB (svært sjelden), gir det `invalid_image`. Grenen har ingen test, fordi et slikt bilde ikke kan lages pålitelig.
- **Filer i objektargumentet.** `createReport` får `File` inne i et vanlig objekt, og React serialiserer det som en del av forespørselen. Virker ikke det i e2e, brukes `FormData` som argument, med samme felt.
- **Servergrensen på 6 MiB** er 5 MiB pluss tekstfeltene og kodingen. Den gjelder alle Server Actions, så den avgjør ikke størrelsesregelen. Den gjør `prepareImage` og skjemaet.
- **`capture` utelatt** med vilje: med bare `accept` tilbyr mobilen både kamera og bibliotek.

## Verification

**Commands:**
- `npm run lint` -- expected: 0 feil (de 93 advarslene fra `.claude/` er kjent)
- `npm run test:unit` -- expected: alle bestått, ingen typefeil
- `npm run build` -- expected: bygger, og `sharp` lastes på serveren
- `npx playwright test e2e/endrer/bilde.spec.ts` -- expected: alle bestått
- `npm test` -- expected: Vitest `unit` og `db`, pgTAP og Playwright består, exit 0. Skriv kjøretiden i PR-beskrivelsen.

**Manual checks (if no CLI):**
- Åpne skjemaet på 360 px, trykk «Legg til bilde», velg et bilde: forhåndsvisning og «Fjern bilde». Velg en tekstfil omdøpt til `.jpg`: feil ved feltet.
- Send inn med bilde, åpne lagret fil fra detaljsiden og sjekk at `exiftool` eller `sharp(...).metadata().exif` ikke finner EXIF.
