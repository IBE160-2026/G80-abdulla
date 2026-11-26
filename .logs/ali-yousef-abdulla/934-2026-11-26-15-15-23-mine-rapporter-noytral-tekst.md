# Mine rapporter: nøytral tekst

## 2026-11-26 kl. 15:15 — Ali Yousef Abdulla

### Oppgave
Implementere beslutningen fra samme dag (se [apne-punkter-og-beslutninger](935-2026-11-26-15-09-13-apne-punkter-og-beslutninger.md)): tom «Mine rapporter» skal ha en nøytral tekst, siden «Du har ikke registrert noen rapporter ennå.» er usann for en bruker som bare har skjulte rapporter. Kjørt med `bmad-build`.

### Plan
- `bmad-build`, rute `oneshot` (ingen uavklarte valg, ingenting irreversibelt, liten endring). Spec: [`spec-mine-rapporter-noytral-tekst.md`](../../docs/implementation-artifacts/spec-mine-rapporter-noytral-tekst.md).
- Bytte teksten til «Du har ingen rapporter å vise.» i kode, e2e-test og dokumenter; ikke endre gamle specer, reviewrapporter og logger.
- Review med Blind Hunter (de andre lagene hoppet over, siden endringen bare bytter én tekst).

### Resultat
- Commit `31d0f52` på `fix/mine-rapporter-noytral-tekst`: `features/rapporter/components/report-list.tsx` (tekst, JSDoc og kommentar om hvorfor teksten er nøytral), `e2e/les/mine.spec.ts` (`NO_OWN`), `EXPERIENCE.md` og `liste.html` i begge kopier, UX-DR16 og Story 3.2 i `epics.md`, `epic-3-context.md` og en `change`-linje i `ux-beslutningslogg.md`.
- Blind Hunter: 10 funn. 8 rettet (blant annet den gamle teksten i JSDoc-en, som sed ikke traff fordi setningen var delt over to linjer, og `epic-3-context.md`), 2 avvist (RLS for skjulte rapporter er dekket av pgTAP med rapport 7). Triage i spec-en.
- Lokalt grønt: `tsc --noEmit`, `eslint` og `vitest run --project unit features/rapporter`. Playwright kan ikke kjøre lokalt, så e2e-testen bekreftes i CI.
- Lukket punktet om teksten i «Mine rapporter» i `issues.md`.

### Åpne punkter
- Ingen nye. Branchen er ikke pushet, og e2e-testen er ikke kjørt før CI.
