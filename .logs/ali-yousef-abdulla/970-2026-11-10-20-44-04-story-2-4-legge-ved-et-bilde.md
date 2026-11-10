# Story 2.4: Legge ved et bilde

## 2026-11-10 kl. 20:44 — Ali Yousef Abdulla

### Oppgave
Brukeren ba om å gjøre `bmad-build` for Story 2.4 (issue #32): skjemaet for ny rapport skal kunne ta imot et bilde, med regler for type, størrelse, dimensjoner og EXIF (AD-9, P-1), og testene som laster opp skal rydde bucketen selv (retro F3). Brukeren ba om å huske commit, push og logging.

### Plan
- Branch `story/2-4-legge-ved-et-bilde` fra `logg/story-2-3-flettet`, så loggcommiten for 2.3 følger med. Epic 2-konteksten var gyldig (innholdet sist endret 19:42, mtime var bare checkout).
- Spec: [spec-2-4-legge-ved-et-bilde.md](../../docs/implementation-artifacts/spec-2-4-legge-ved-et-bilde.md) (rute `dispatch`, ca. 4 000 tokens, beholdt samlet, ingen åpne spørsmål). Brukeren godkjente spec-en.
- Implementert direkte i hovedsesjonen, uten implementeringsagent. Brukeren godkjente tre review-underagenter (Blind Hunter, Edge Case Hunter, Verification Gap) for hele kjøringen.
- Triage av 25 funn mot koden, med triagelogg i spec-en. Matriserevisjon: alle 13 rader har en test som kjørte og besto.

### Resultat
- **Commit:** `eee489c` («Story 2.4: Legge ved et bilde», `Closes #32`) på `story/2-4-legge-ved-et-bilde`. Spec er `done` og `2-4-legge-ved-et-bilde` er `review` i `sprint-status.yaml`.
- **Server:** `lib/image-process.ts` (`prepareImage`, `sharp` 0.35.5 som ny eksakt dependency): størrelse før lesing, type fra innholdet, 5 MiB, 40 megapiksler (`limitInputPixels`), rettet etter EXIF-orientering, all EXIF fjernet, endelse fra bildetypen. `createReport` tar valgfri `image` (File i objektet), laster opp med brukerens sesjon til `<author_id>/<uuid>.<ext>` uten `upsert`, og setter `image_path`. Ny feilkode `invalid_image`. `serverActions.bodySizeLimit` er `6mb`.
- **Skjema:** `components/image-field.tsx` med «Legg til bilde», teksten om ansikter og bilskilt, forhåndsvisning, «Fjern bilde» (får fokus etter valg) og umiddelbar avvisning (tom, type, størrelse, ulesbar, dimensjoner). Serverens `invalid_image` vises ved feltet.
- **Tester:** `lib/image-input.test.ts`, `lib/image-process.test.ts` (GPS satt med sharp, orientering 6, 20000 × 20000), flere i `actions.test.ts`, vakt i `report-form.test.ts`, bucket-tester (5 MiB godtas, 5 MiB + 1 gir 413, PNG og WebP godtas, GIF gir 415) og `e2e/endrer/bilde.spec.ts` med 14 tester, pluss bilde i kjerneflyten. `lib/test-images.ts` lager testbildene, og `lib/supabase/test-admin.ts` gir service-role-opprydding (retro F3, avgjort), med en sluttsjekk i `afterAll`.
- **Dokumentasjon:** AD-9 og Stack-tabellen, beslutningsloggene (arkitektur og UX), `EXPERIENCE.md` (begge kopier), README og `epic-2-context.md`.
- **Verifisert:** hele `npm test` exit 0 på 505 s (8 min 25 s): Vitest `unit` 678, Vitest `db` 36, pgTAP og Playwright 192 bestått. Etter review-patchene er lint (0 feil, 93 kjente advarsler), `test:unit`, `build`, `db-types --check` og `storage.db.test.ts` kjørt på nytt. Bucketen har bare de tre seed-objektene etter full kjøring.
- **Gjennomgangen:** 3 patcher: maskinavhengig `rss`-sjekk fjernet fra testen, sluttsjekk av at bucketen er ryddet, og to utdaterte dokumentsetninger. 22 funn avvist, ingen utsatte. Viktigste avvisning: a11y- og race-funnene om et avvist valg over et valgt bilde, fordi «Legg til bilde» og filfeltet ikke er tilgjengelige mens et bilde er valgt.
- **Avvik fra akseptansekriteriene:** bucketen sjekker bare størrelse og oppgitt type, ikke innholdet, så tom fil og feil innhold stoppes bare av serveren. Ført i Design Notes og arkitekturloggen.
- **Lukket:** uploadtestene i Vitest legger ikke lenger igjen objekter (punktet fra Story 1.6).

### Åpne punkter
- Før drift: `createReport` har ingen lås eller kvote mot parallelle opplastinger, og `sharp` har ingen `concurrency`/`cache`-grenser. 40 megapiksler koster rundt 160 MB å dekode, så parallelle kall kan tømme minnet på en delt server. Avvist i review som low for lokal v1.
- Hvert nytt forsøk etter en feilet innsending laster opp fila på nytt under ny uuid, så en bruker kan legge igjen flere foreldreløse 5 MiB-filer (AD-9 Deferred, uten opprydding).
- Et bilde som blir større enn 5 MiB etter gjenkoding avvises, og den grenen har ingen test. Animerte WebP og PNG flates stille ut til første bilde, og en tom `File.type` for et gyldig bilde gir avvisning i skjemaet.
- `.impeccable/config.json` er ny og ikke committet: Impeccable-kroken ble dempet for `broken-image` på `components/image-field.tsx`. Avgjør om fila skal committes eller gitignores.
- PR for Story 2.4 er ikke laget, og full `npm test` er ikke kjørt etter review-patchene (bare de berørte filene).

## 2026-11-10 kl. 21:03 — Ali Yousef Abdulla

### Oppgave
Brukeren ba om PR for Story 2.4, så om `bmad-walkthrough` og flett, og ba under walkthroughen om advanced elicitation på feilhåndteringen.

### Plan
- PR #55 mot `main` etter malen fra PR #54, deretter walkthrough (orientering og gjennomgang levert), og flett først når brukeren avslutter walkthroughen med «godkjent».
- Elicitation med seks metoder valgt av brukeren (Failure Mode Analysis, Architecture Decision Records, Cascading Failure Simulation, Chain-of-Thought Scaffolding, Security Audit Personas og Challenge from Critical Perspective). Brukeren valgte A og B av tre forslag (A: last `sharp` ved behov, B: sjekk filsignaturen, C: egen toast ved `upload_failed`).

### Resultat
- **PR #55** er åpen: https://github.com/IBE160-2026/G80-abdulla/pull/55 (`Closes #32`, testsammendrag med kjøretid 8,4 min). Ikke flettet ennå.
- **Commit `2d3ab74`:** `prepareImage` sjekker filsignaturen (JPEG, PNG, WebP) før `sharp` leser noe, så parserne for SVG, TIFF, HEIF og AVIF aldri får upålitelige byte, og `sharp` lastes først når et bilde skal behandles. Kan den ikke lastes, gir `createReport` `upload_failed` og logger `bilde_unavailable`, og rapporter uten bilde virker. Et hull review-lagene ikke fant: `sharp` øverst i filen ville tatt ned både `createReport` og `suggestReport`.
- **Tester:** ny `lib/image-process.unavailable.test.ts`, signaturtester i `image-process.test.ts` og en test i `actions.test.ts`. `test:unit` 694 bestått, lint 0 feil, `build` bygger, og e2e `endrer-360` (bilde og kjerneflyt) 15 bestått.
- **Dokumentasjon:** AD-9, arkitekturloggen og spec-en (rader H1–H3 i triageloggen).
- **Ikke gjort (C):** egen toast ved `upload_failed`, siden den generelle toasten er frosset i spec-en.

### Åpne punkter
- Tidligere punkter står i `issues.md`. Full `npm test` er ikke kjørt etter review-patchene og elicitation-endringen (bare de berørte testene og e2e `endrer-360`).
- Valgfritt, krever at spec-en åpnes: `upload_failed` kunne gitt en toast som foreslår å sende uten bilde.

## 2026-11-10 kl. 21:12 — Ali Yousef Abdulla

### Oppgave
Brukeren ba under walkthroughen om flere elicitation-metoder på feilhåndteringen i Story 2.4, og om å gjøre forslagene fra dem, committe, pushe og oppdatere loggen.

### Plan
- Fem metoder til: Pre-mortem Analysis, Red Team vs Blue Team, Second-Order Thinking, Inversion Analysis og Stakeholder Lens Rotation. Forslagene var bare dokumentasjon og åpne punkter, ingen kodeendring.

### Resultat
- **README:** nytt avsnitt «Bilder feiler» som forklarer `bilde_unavailable` og `opplasting_<kode>` i serverloggen.
- **AD-9 og arkitekturloggen:** godtatt restrisiko ført uttrykkelig: EXIF fjernes bare i Server Action, og en bruker som laster opp direkte mot Storage beholder EXIF i sin egen fil. Lukkes før drift.
- **`issues.md`:** to nye punkter (telefonbilder over 5 MB, og plattformens grense for forespørselsstørrelse før drift).
- Ingen kode eller tester er endret siden commit `2d3ab74`.

### Åpne punkter
- Telefonbilder over 5 MB avvises uten hjelp: avgjør nedskalering i nettleseren eller høyere grense, og i så fall som egen story eller endring av kravet.
- Før drift: plattformens grense for forespørselsstørrelse (for eksempel Vercel 4,5 MB, ikke verifisert) må være minst 5 MiB pluss overhead.
- Full `npm test` er ikke kjørt etter review-patchene og elicitation-endringene i koden.
