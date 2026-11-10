# Installere Impeccable

## 2026-11-10 kl. 10:38 — Ali Yousef Abdulla

### Oppgave
Brukeren spurte om designskillen «Impeccable» var installert. Det var den ikke, og brukeren ba om å få den installert i prosjektet (ikke globalt), med designkroken som sjekker UI-filer. Etterpå ba brukeren om å flette PR #52, hente `main` inn i story-branchen, rydde bort worktreen og kjøre `/impeccable init`.

### Plan
- Sjekket kilden: `pbakaus/impeccable` på GitHub (Apache-2.0), npm-pakken `impeccable` 4.8.2, og leste installasjonsdelen i README og CLI-shimmen (nedlasting med sjekksumkontroll).
- Lagde en egen worktree `../G80-abdulla-impeccable` på branchen `chore/installer-impeccable` fra `origin/main`, slik at story-branchen `story/2-2-registrere-en-rapport` ikke ble berørt.
- Kjørte `npx impeccable@4.8.2 install --providers=claude --scope=project --yes`.
- `/impeccable init`: leste PRD-en, briefen, README og `docs/ux/` og stilte ett spørsmål om sensor. Init skriver bare `PRODUCT.md` og rører ikke `DESIGN.md`.
- Ryddet før commit: binæren holdes utenfor git, upstreams gitignore-blokk er lagt til, og linjeskiftene for launcherne er låst.

### Resultat
- Installert: `.claude/skills/impeccable/` (SKILL.md, 46 referansefiler, launcher-skript) og fire agenter i `.claude/agents/impeccable-*.md`. Engine 0.1.21. `scripts/impeccable engine-probe` svarer `impeccable-engine 0.1.21`, exit 0.
- `.gitignore`: `.claude/skills/impeccable/scripts/bin/` (engine-binæren, 21 MB). Launcheren laster den ned til `~/.impeccable/bin/` og verifiserer sjekksummen. Upstreams blokk for `.impeccable/` er også lagt til.
- `.gitattributes`: `scripts/impeccable` får `eol=lf` (sh-skript), og `impeccable.cmd` får `eol=crlf`. Den kjørbare biten er satt i indeksen.
- Designkroken (SessionStart, PostToolUse på Edit/Write, Stop) ligger i `.claude/settings.local.json`. Den er gitignorert og bare personlig. Fila er kopiert til hovedmappa `G80-abdulla/.claude/`, og kroken hopper over seg selv til skillen finnes der.
- Commit `67aba5e` på `chore/installer-impeccable`, pushet, og PR #52 er åpnet: https://github.com/IBE160-2026/G80-abdulla/pull/52
- PR #52 er flettet (merge-commit `49e0150`), og `origin/main` er hentet inn i `story/2-2-registrere-en-rapport` (merge-commit `cae612a`). Den ucommittede endringen i `docs/implementation-artifacts/epic-2-context.md` ble ikke berørt. Skillen `impeccable` vises i Claude Code, og `engine-probe` svarer `impeccable-engine 0.1.21` i hovedmappa.
- Ryddet etter flettingen: worktreen `../G80-abdulla-impeccable` er fjernet, og branchen `chore/installer-impeccable` er slettet lokalt og på GitHub.
- `/impeccable init`: `PRODUCT.md` er skrevet i roten (plattform `web`, brukere med sensor som egen målgruppe for v1, formål, posisjon, rammer, stemme, fem prinsipper og WCAG 2.2 AA). Faktaene er hentet fra `docs/prd.md` (final), `docs/product-brief.md` og `docs/ux/EXPERIENCE.md`. Brukeren svarte ja til å ta med sensor, men svarte ikke eksplisitt på om sammendraget stemmer. Bildegenerering finnes ikke, så `buildPath` er ikke lagret, og live-modus er ikke satt opp. `PRODUCT.md` er ikke committet ennå.

### Åpne punkter
- Impeccable leser bare `DESIGN.md` i roten og finner derfor ikke `docs/ux/DESIGN.md` (`designPath` er null). Avgjør om fila skal flyttes til roten, eller om `/impeccable document` skal lage en ny ut fra koden.
- Les gjennom `PRODUCT.md` og rett det som ikke stemmer. Sammendraget ble ikke eksplisitt godkjent.
- Designkroken bruker en POSIX-kommando (`[ ! -f … ] || …`) og er ikke prøvd i en ekte Claude Code-økt på Windows. Sjekk at den kjører uten feil etter fletting og omstart.
