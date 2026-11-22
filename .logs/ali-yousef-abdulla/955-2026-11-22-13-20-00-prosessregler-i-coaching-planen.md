# Prosessregler i coachingplanen

## 2026-11-22 kl. 13:20 — Ali Yousef Abdulla

### Oppgave
Ta handlingspunkt 3 fra retroen for Epic 4: skrive to prosessregler i `docs/coaching-plan.md` (arbeidsløkken).

### Plan
- Gren `chore/prosessregler-coaching-plan` fra `main`.
- Legge reglene inn i Fase 2 i planen, i samme form som resten (løkken med nummererte trinn), uten ny seksjon.
- Lukke punktet i `issues.md` og sette action item 13 til `done` i `sprint-status.yaml` med skriptet. Item 11 (`StatusPanel`) er gjort i PR #78, men sto fortsatt som `open`, så den settes også til `done`.

### Resultat
- **Regel a** (trinn 4, Test): før CI startes, leser Claude åpne punkter i `issues.md` om ustabile tester og sier fra hvis et gjelder flyten storyen utvider. En ustabil test med et kjent rettelsesforslag rettes i neste story som utvider eller kjører CI på samme test.
- **Regel b** (trinn 7, PR): har storyen endret `EXPERIENCE.md`, `DESIGN.md`, PRD-en eller arkitekturen, står det en linje i beslutningsloggen i `docs/beslutninger/` i samme PR, og Claude sjekker det før PR-en lages. Det samme krever «Definisjon av ferdig» i `epics.md`, men det ble ikke fanget i Story 4.2.
- «Sist oppdatert» i planen er 2026-11-22. Planen er skrevet i jeg-form, og reglene følger den formen.
- `issues.md`: punktet er lukket. `sprint-status.yaml`: `epic-4-retro-item-11-…` og `epic-4-retro-item-13-…` er `done` (2 oppdatert).

### Åpne punkter
- Reglene er ikke prøvd i en story ennå. Første test er neste story eller endring som rører `EXPERIENCE.md`, `DESIGN.md`, PRD eller arkitektur, og neste CI-start.
- Resten av handlingspunktene fra retroen står åpne: README på en ren maskin, to linjer i beslutningsloggene (trenger din ordlyd), og CI på PR-er (`epic-2-retro-item-9`).
