# Story 2.2: registrere en rapport

## 2026-11-10 kl. 13:22 — Ali Yousef Abdulla

### Oppgave
Brukeren ba om å kjøre `bmad-build` for Story 2.2 (issue #30): en innlogget bruker skal kunne registrere en rapport med beskrivelse, kategori og lokasjon, med flytende «+»-knapp, topplinjeknapp og knapp i tomtilstanden. Etter at implementeringen var ferdig, ba brukeren om commit, push og en PR.

### Plan
- Spec: [spec-2-2-registrere-en-rapport.md](../../docs/implementation-artifacts/spec-2-2-registrere-en-rapport.md) (rute `dispatch`, ca. 4 000 tokens, beholdt samlet etter brukerens valg). Epic 2-konteksten var gyldig, og Story 2.1 var forrige ferdige story.
- Underagent til kartlegging av front-end og e2e, så en implementeringsagent uten forhistorikk, så tre uavhengige gjennomganger (blind-hunter, edge-case-hunter og verification-gap). Brukeren godkjente underagenter for hele kjøringen.
- Jeg vurderte diffen mot spec-en og matrisen selv. Matrise-revisjonen fant at raden «Dobbeltklikk» manglet test, og den ble lagt til.
- Triage av 23 funn med verifisering mot koden (to midlertidige e2e-tester for kategorivalget med klikk og for «←» fra første side i fanen). Beslutningen om «←» ble lagt til brukeren.

### Resultat
- **Committer:** `a35f2cf` (selve storyen, 37 filer) og `aeca7e1` (spec `done` og sprintstatus `review`). Begge er pushet, og PR er laget (se under).
- **Database:** migrering `20261110120000_skriving_reports.sql` med INSERT som kolonnegrant for `description, location, category, summary, image_path` og policy `WITH CHECK (author_id = (select auth.uid()))`. pgTAP-matrisen i `skriving.sql` er oppdatert (60 tester).
- **Kode:** `createReport` (`app/rapporter/ny/actions.ts`), felles validering i `lib/report-input.ts`, feilvokabular i `lib/errors.ts`, `components/report-form.tsx` med live validering av grensene, destructive toast og `router.replace` til detaljsiden, samt `NewReportFab`, `NewReportLink` og knappen i tomtilstanden. Nye pakker: `sonner` 2.0.8 og `@radix-ui/react-select` 2.4.1 (`next-themes` som shadcn la til, er fjernet).
- **Gjennomgangen:** 23 funn. Fire rettelser (live feil og `aria-required`, destructive toast, «under 640 px» i `EXPERIENCE.md`, handlingens navn i feilloggen), ett utsatt («←» etter innsending når skjemaet var første side i fanen, verifisert og lagt i `deferred-work.md`) og 17 avvist med begrunnelse i triagetabellen i spec-en.
- **Verifisert:** hele `npm test` exit 0 (Vitest `unit` 341/341 uten typefeil, pgTAP 180/180, Vitest `db` 25/25, Playwright 136 bestått på 4,8 min). Lint 0 feil, `next build` bygger, og `db-types --check` er uten avvik. En første kjøring feilet på ett axe-funn i toasten mens den tonet inn. `e2e/a11y.ts` venter nå til toasten er ferdig animert.
- Underagenten sendte den samme rapporten mange ganger etter at den var ferdig, så jeg stoppet den.

### Åpne punkter
- «←» etter innsending forlater appen når `/rapporter/ny` var første side i fanen (utsatt til Story 3.3, som må løse «←» generelt).
- `docs/ux/mockups/registrer.html` er ikke oppdatert og viser fortsatt påminnelsen med to setninger. Story 2.3 legger inn setningen om KI-tjenesten, og skissen og `EXPERIENCE.md` må følge.
- Avviste lavfunn som kan bli aktuelle: idempotens ved tapt svar etter lagring, tapt tekst ved utløpt økt midt i skjemaet, og nullbredde-tegn i beskrivelsen. De står i triagetabellen i spec-en.
