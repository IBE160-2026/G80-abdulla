# Beslutningslogg: dialogen fra 4.2 og Vercel-linja

## 2026-11-22 kl. 14:10 — Ali Yousef Abdulla

### Oppgave
Føre de to logglinjene fra retroen for Epic 4 (handlingspunkt 4) inn i beslutningsloggene, med ordlyden jeg foreslo og prosjekteieren godkjente («før logglinjene inn som foreslått»).

### Plan
- Gren `chore/beslutningslogg-4-2-og-vercel` fra `main`.
- To linjer i `docs/beslutninger/ux-beslutningslogg.md` (en `decision` og en `change` for Story 4.2) og én `change` i `docs/beslutninger/arkitektur-beslutningslogg.md` (Vercel-linja). Oppdatere `updated` i begge.
- Lukke punktet i `issues.md` og sette `epic-4-retro-item-14-…` til `done` med skriptet.

### Resultat
- **UX-loggen:** `(decision) (Skjuling) 2026-11-21 …` med dialogteksten prosjekteieren bestemte, og `(change) 2026-11-21 EXPERIENCE.md (begge kopier) …`. Kilden er `EXPERIENCE.md` (commit `727ee0d`).
- **Arkitekturloggen:** `(change) 2026-11-22 …` om at Vercel-linja (`50e67a9`, 2026-11-18) er fjernet, slik PRD §6 og NFR-2 krever. Linja sier ikke noe om at siden fortsatt ligger oppe.
- `issues.md`: punktet er lukket, og et nytt er lagt til om Vercel-siden. `sprint-status.yaml`: `epic-4-retro-item-14-…` er `done`.

### Åpne punkter
- `https://g80-abdulla.vercel.app` svarte HTTP 200 da jeg sjekket (2026-11-22), selv om PRD §6 sier at v1 ikke settes i drift. Prosjekteieren har ikke svart på om siden skal tas ned eller om loggen skal si at den står oppe. Ført i `issues.md`.
- Resten av handlingspunktene fra retroen: README på en ren maskin, og CI på PR-er (`epic-2-retro-item-9`).
