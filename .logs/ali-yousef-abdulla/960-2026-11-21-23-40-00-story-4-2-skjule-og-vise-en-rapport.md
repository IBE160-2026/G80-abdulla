# Story 4.2: Skjule og vise en rapport

## 2026-11-21 kl. 23:40 — Ali Yousef Abdulla

### Oppgave
Bygge Story 4.2 med `bmad-build`: moderatoren skjuler en rapport (for eksempel med et lesbart bilskilt) etter en bekreftelse og viser den igjen, uten at noe slettes. Issue #38.

### Plan
- Før denne storyen ble PR #70 (`chore/story-4-1-done`) flettet og grenen slettet. Det logges her, i neste PR.
- `bmad-build` på `story/4-2-skjule-og-vise-en-rapport` med subagenter, godkjent av brukeren for hele kjøringen. Den gjenbrukte `epic-4-context.md` og spec-en for 4.1.
- Spec: [spec-4-2-skjule-og-vise-en-rapport.md](../../docs/implementation-artifacts/spec-4-2-skjule-og-vise-en-rapport.md), omtrent 2 500 tokens. Brukeren valgte å beholde den hel og bestemte dialogteksten (alternativ A).
- Implementering i en subagent, så review med Blind Hunter, Edge Case Hunter og Verification Gap.

### Resultat
- **Commit `727ee0d`** («Story 4.2: Skjule og vise en rapport»).
- **Handling:** `setReportHidden(reportId, hidden)` i `features/moderering/actions.ts`. Den tar en eksplisitt målverdi og gir `report_not_found` ved 0 rader. Ingen migrering trengtes, siden regelen kom med 4.1.
- **Dialog:** `shared/ui/alert-dialog.tsx` (shadcn new-york). `@radix-ui/react-alert-dialog` er pinnet til 1.2.1.
- **Knapp:** `HideControl` i moderatorpanelet.
  - «Skjul rapport» åpner dialogen («Skjule rapporten?» med forklaring, «Avbryt» og «Skjul rapport»). «Vis rapport» virker uten bekreftelse.
  - Knappene har `aria-disabled` mens de lagrer, så fokus aldri havner på `body`.
  - Etter svaret går fokus til motsatt knapp.
- **Merking:** «Skjult» (`features/rapporter/components/hidden-badge.tsx`) og grå bakgrunn på kortet i lista og på detaljsiden, bare for moderatoren. RLS avgjør hva som vises.
- **Tester:**
  - `status.sql`: visning, og at ingen rad blir slettet.
  - `status.db.test.ts`: skjule, skjule igjen og vise via REST, og at rapporten er borte for andre.
  - Enhetstester for handlingen og kortet.
  - `e2e/endrer/skjul.spec.ts`: dialog, Avbryt og Escape, fokus, 404 for rapportøren, en annen bruker og en besøkende, vise igjen, nettverksfeil, synk fra serveren og omlasting.
  - Kjerneflyten skjuler rapporten med tastatur, så hele AD-15-flyten går. Tidsgrensen er hevet til 90 s.
- **UX-dokumentene:** `EXPERIENCE.md` (begge kopiene) har fått et punkt «Oppdatert 2026-11-21 (Story 4.2)».
- **Review:** 7 patcher, blant annet fokus med `aria-disabled`, grå bakgrunn på detaljsiden (frossen AC) og test av synken. To punkter er utsatt til `deferred-work.md`, og resten er avvist med begrunnelse i triageloggen.
- **Verifisering** (ny klone i Temp): `tsc` og lint er rene. Full `npm test` ga exit 0 på 839 s: unit 1108, pgTAP PASS, db 53, Playwright 280.
- Spec-en er `done`, og `4-2-skjule-og-vise-en-rapport` er `review` i `sprint-status.yaml`.

- **PR #71** (`Closes #38`) er flettet som `4b63224`, og issue #38 er lukket. PR-beskrivelsen har testsammendraget og CI-kjøringen ([44957847326](https://github.com/IBE160-2026/G80-abdulla/actions/runs/44957847326), `workflow_dispatch` på `d185481`). Den var grønn på første forsøk: `npm test` 8 min 42 s, jobben 11 min 8 s, Vitest `unit` 1108 og `db` 53, pgTAP bestått, Playwright 280 (7,9 min).
- PR #70 (`chore/story-4-1-done`, Story 4.1 `done`) var flettet før denne storyen. Begge story-grenene er slettet, og `4-2-skjule-og-vise-en-rapport` er satt til `done` i `sprint-status.yaml` på `chore/story-4-2-done`, sammen med denne loggen.

### Åpne punkter
- Statusknappene fra 4.1 bruker fortsatt `disabled` under lagring, så fokus kan gå til `body` (`deferred-work.md`). Vurder `aria-disabled` som i `HideControl`.
- Grenen der `setReportHidden` eller `setReportStatus` svarer `ok: false` og viser toast i panelet, er ikke testet i e2e (`deferred-work.md`).
