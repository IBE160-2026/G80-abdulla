# Prosjektsjekk og opprydding

## 2026-10-28 kl. 13:30 — Ali Yousef Abdulla

### Oppgave
Brukeren ba om en sjekk av at alt stemmer med prosjektet (LocalFix, G80), og ba deretter om at funnene ble rettet: oppdatere en utdatert setning og slette den flettede branchen.

### Plan
- Gå gjennom repoet: git-status, README-lenker, lenker i `docs/`, status og datoer i dokumentene, commit-hasher i KI-loggen, hemmeligheter i sporede filer.
- Sammenligne `docs/` med kopiene i `.docs/planning-artifacts/`.
- Rette det som var feil, uten å committe annet enn loggen.

### Resultat
- Sjekken fant at README-lenker, FR-1 til FR-9, status/datoer og commit-hasher i `docs/ki-logg.md` stemmer. `docs/` og `.docs/planning-artifacts/` har likt innhold; alle filer ser ulike ut i en vanlig diff, men det er bare CRLF mot LF. Ingen nøkler eller `.env`-filer er sporet.
- Rettet siste linje i `docs/beslutninger/README.md`: den sa at originalene ligger «utenfor repoet», men `.docs/` ble lagt i repoet i `4b09523`. Endringen er **ikke committet** (står som endret i arbeidskopien).
- Slettet den lokale branchen `docs/rett-ki-logg-og-loggtyper` med `git branch -d` (var flettet via PR #2, siste commit `4b09523`). Den eksterne `origin/docs/rett-ki-logg-og-loggtyper` er ikke rørt.

### Åpne punkter
- Avgjøre hvilken kopi som er hovedkopi av planleggingsdokumentene (`docs/` eller `.docs/planning-artifacts/`) og skrive det i README, så kopiene ikke kommer ut av synk.

## 2026-10-28 kl. 14:04 — Ali Yousef Abdulla

### Oppgave
Brukeren ba om en ny helhetssjekk av lokal arbeidskopi, prosjektmappe og GitHub, og ba deretter om at det åpne punktet fra forrige økt ble løst: skrive i README hvilken kopi som er hovedkopi av planleggingsdokumentene.

### Plan
- Sjekke git-status, remote, branches og historikk, README-lenker, synk mellom `docs/` og `.docs/planning-artifacts/`, og hemmeligheter i sporede filer.
- Skrive en setning i README om hovedkopi, på en egen branch, og lukke punktet i `issues.md`.

### Resultat
- Sjekken: `main` lik `origin/main`, ren arbeidskopi, PR #1–#3 flettet, alle README-lenker gyldige, `docs/prd.md` og `docs/product-brief.md` lik kopiene i `.docs/` (bortsett fra linjeskift), ingen hemmeligheter funnet. `origin/docs/rett-ki-logg-og-loggtyper` er borte fra GitHub. `gh` er ikke innlogget, så PR-er og issues ble ikke lest via GitHub.
- La til et avsnitt under dokumentasjonstabellen i `README.md`: `docs/` er hovedkopi, `.docs/planning-artifacts/` er BMAD-ens arbeidskopi, og rettelser gjøres i `docs/` og kopieres til `.docs/` ved behov. Committet som `a1f1e4b` på den nye branchen `docs/hovedkopi-planleggingsdokumenter`.
- Lukket det åpne punktet fra forrige økt i `issues.md`.
- Branchen er ikke pushet.

### Åpne punkter
- Ingen.

## 2026-10-28 kl. 14:15 — Ali Yousef Abdulla

### Oppgave
Brukeren la merke til at repoet har mange flere filer enn faglærerens, og ville ha BMAD-dokumentene synlig i `docs/planning-artifacts/` som tidligere, ikke i den skjulte `.docs/`.

### Plan
- Telle filer per mappe for å forklare forskjellen (243 av 303 sporede filer ligger i `.claude/`, hovedsakelig 40 skills).
- Flytte `.docs/planning-artifacts/` til `docs/planning-artifacts/`, peke BMAD-konfigurasjonen dit og rette referansene i README.

### Resultat
- `git mv .docs/planning-artifacts docs/planning-artifacts`; `.docs/` er borte.
- `output_folder` i `_bmad/config.toml`, `_bmad/bmm/config.yaml`, `_bmad/cis/config.yaml` og `_bmad/core/config.yaml` er endret fra `{project-root}/.docs` til `{project-root}/docs`.
- README og `docs/beslutninger/README.md` er oppdatert (avsnittet fra forrige økt om hovedkopi er skrevet om, siden `docs/` nå også er BMAD-ens mappe).
- Committet på `docs/hovedkopi-planleggingsdokumenter`, ikke pushet.

### Åpne punkter
- Brukeren avgjør om `.claude/skills` og `_bmad` skal bli i repoet (se forklaring) eller gitignores.
- `docs/` har nå dobbelt innhold: de flate kopiene (`docs/prd.md` osv.) og originalene i `docs/planning-artifacts/`. Avgjøre om kopiene skal bli.
