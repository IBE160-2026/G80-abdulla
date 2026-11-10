# Installere Impeccable

## 2026-11-10 kl. 10:38 — Ali Yousef Abdulla

### Oppgave
Brukeren spurte om designskillen «Impeccable» var installert. Det var den ikke, og brukeren ba om å få den installert i prosjektet (ikke globalt), med designkroken som sjekker UI-filer.

### Plan
- Sjekket kilden: `pbakaus/impeccable` på GitHub (Apache-2.0), npm-pakken `impeccable` 4.8.2, og leste installasjonsdelen i README og CLI-shimmen (nedlasting med sjekksumkontroll).
- Lagde en egen worktree `../G80-abdulla-impeccable` på branchen `chore/installer-impeccable` fra `origin/main`, slik at story-branchen `story/2-2-registrere-en-rapport` ikke ble berørt.
- Kjørte `npx impeccable@4.8.2 install --providers=claude --scope=project --yes`.
- Ryddet før commit: binæren holdes utenfor git, upstreams gitignore-blokk er lagt til, og linjeskiftene for launcherne er låst.

### Resultat
- Installert: `.claude/skills/impeccable/` (SKILL.md, 46 referansefiler, launcher-skript) og fire agenter i `.claude/agents/impeccable-*.md`. Engine 0.1.21. `scripts/impeccable engine-probe` svarer `impeccable-engine 0.1.21`, exit 0.
- `.gitignore`: `.claude/skills/impeccable/scripts/bin/` (engine-binæren, 21 MB). Launcheren laster den ned til `~/.impeccable/bin/` og verifiserer sjekksummen. Upstreams blokk for `.impeccable/` er også lagt til.
- `.gitattributes`: `scripts/impeccable` får `eol=lf` (sh-skript), og `impeccable.cmd` får `eol=crlf`. Den kjørbare biten er satt i indeksen.
- Designkroken (SessionStart, PostToolUse på Edit/Write, Stop) ligger i `.claude/settings.local.json`. Den er gitignorert og bare personlig. Fila er kopiert til hovedmappa `G80-abdulla/.claude/`, og kroken hopper over seg selv til skillen finnes der.
- Commit `67aba5e` på `chore/installer-impeccable`, pushet, og PR #52 er åpnet: https://github.com/IBE160-2026/G80-abdulla/pull/52

### Åpne punkter
- Kjør `/impeccable init` etter omstart av Claude Code. Init lager `PRODUCT.md` og `DESIGN.md`, men prosjektet har allerede `docs/ux/DESIGN.md`. Avklar at init bygger på den og ikke lager en konkurrerende kopi i roten.
- Designkroken bruker en POSIX-kommando (`[ ! -f … ] || …`) og er ikke prøvd i en ekte Claude Code-økt på Windows. Sjekk at den kjører uten feil etter fletting og omstart.
