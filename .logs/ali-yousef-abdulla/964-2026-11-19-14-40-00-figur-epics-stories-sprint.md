# Figur: epics, stories og sprint

## 2026-11-19 kl. 14:40 — Ali Yousef Abdulla

### Oppgave
Lage en SVG-figur som viser hvordan epics og stories henger sammen i LocalFix, med sprint og en forklaring på hvorfor vi gjør steget. Deretter en PNG-versjon, og til slutt commit og push av begge filene via egen branch og PR.

### Plan
- Les `docs/planning-artifacts/epics.md`, `docs/implementation-artifacts/sprint-status.yaml` og `docs/beslutninger/epics-beslutningslogg.md` så figuren bruker de faktiske epicene, storyene og statusene.
- Generere SVG-en med et skript (kun i scratchpad, ikke i repoet), kontrollrendre den med Playwright og rette avstander.
- Rendre PNG i 2× oppløsning fra SVG-en.
- Branch `docs/figur-epics-stories-sprint` fra `main`, én commit for figurene og én for loggen, PR mot `main`.

### Resultat
- `docs/figurer/epics-stories-sprint.svg` og `docs/figurer/epics-stories-sprint.png` (2560 × 2430 px). Innhold: pipeline krav → epics → stories → sprint, hierarkiet med 4 epics og 18 stories med status per 19. november 2026 (15 done, Epic 4 i backlog, Epic 3 pågår), sprint-panel med de fem statusene og arbeidsløkka per story, og fire begrunnelser for hvorfor vi deler opp arbeidet.
- Commit `5fd1717` med de to figurfilene.
- Skriptet som genererte figuren ligger ikke i repoet. Skal figuren endres senere, må den enten redigeres for hånd i SVG-en eller tegnes på nytt.

### Åpne punkter
- Figuren sier at sprint hos oss er «rytmen story for story» uten faste uker, fordi `sprint-status.yaml` ikke har datoer eller tidsrammer. Forventer veilederen faste sprinter med bestemt lengde, må teksten i sprint-panelet justeres.
