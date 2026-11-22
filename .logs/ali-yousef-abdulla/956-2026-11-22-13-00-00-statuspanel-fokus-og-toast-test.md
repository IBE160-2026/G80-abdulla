# StatusPanel: fokus og toast-test

## 2026-11-22 kl. 13:00 — Ali Yousef Abdulla

### Oppgave
Starte `bmad-build` for handlingspunkt 1 fra retroen for Epic 4: rette fokus i `StatusPanel` (`aria-disabled` i stedet for `disabled`) og teste toasten når handlingene svarer `ok: false`. Lukker `issues.md:153` og `:154` og de to utsatte punktene i `deferred-work.md`.

### Plan
- Gren `fix/statuspanel-fokus-og-toast-test` fra `main` (etter PR #76).
- Ikke en epic-story (ingen story-nøkkel), så oneshot-ruten: spec med Intent og Implementation Notes, bygge, én gjennomgang (Blind Hunter), triage, patch.
- Verifisere de endrede e2e-testene i en ny klone (`k43`), siden `supabase.exe` er blokkert i prosjektmappen.
- Spec: `docs/implementation-artifacts/spec-epic-4-retro-1-fokus-i-statuspanel-og-toast-test.md`.

### Resultat
- **`StatusPanel`:** `aria-disabled` i stedet for `disabled`, med samme klasser som `HideControl`.
- **E2E:** testen om lagring sjekker nå `aria-disabled`, fokus og at bare ett kall går ut. To nye tester utløser `report_not_found` ved å slette den nye testrapporten mens siden er åpen (`status.spec.ts` og `skjul.spec.ts`). Ny hjelper `deleteReportRow(id)` i `e2e/db.ts`, som avviser id-er som ikke er uuid.
- **Gjennomgang:** Blind Hunter ga 9 funn. 4 er brukt (ompakket kommentar, telling av POST-er, uuid-sjekk og kontroll av at raden er borte), resten er avvist eller falske, begrunnet i triage-loggen i spec-en.
- **Verifisert:** 28 e2e-tester bestått i klonen (`status`, `skjul` og `core-flow`, begge bredder). `npm run lint`, `npx tsc --noEmit` og `npm run test:unit` (1108 tester) er grønne. Full `npm test` er ikke kjørt.
- **Retroen rettet:** punkt A5 b var for bredt. `stale_state` og nettverksfeil var testet fra før. Rettelsen står i spec-en.
- **Lukket:** `issues.md:153` og `:154`, og de to oppføringene i `deferred-work.md` (med `resolution`).

### Åpne punkter
- `forbidden` er ikke utløst i e2e: en innlogget moderator kan ikke få 42501. Meldingen er enhetstestet i `errors.test.ts`, og `report_not_found` går gjennom samme toast. Ingen handling.
- Resten av handlingspunktene fra retroen (README på en ren maskin, to prosessregler, to linjer i beslutningsloggene, CI på PR-er) står åpne i `issues.md` og `sprint-status.yaml`.
