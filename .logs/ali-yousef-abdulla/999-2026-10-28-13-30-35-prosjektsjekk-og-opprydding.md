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
