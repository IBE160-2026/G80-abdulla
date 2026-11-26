# Åpne punkter og beslutninger

## 2026-11-26 kl. 15:09 — Ali Yousef Abdulla

### Oppgave
Gå gjennom de åpne punktene i `issues.md`, lukke det som er løst, og ta de fem beslutningene som ventet på prosjekteieren. Økten fortsatte etter at PR #112 var flettet (se [code-review-v1-gruppe-a](936-2026-11-25-21-51-00-code-review-v1-gruppe-a.md)).

### Plan
- Sortere de 72 åpne punktene i: kan lukkes, enkle å lukke, krever beslutning, følg med, før drift og research.
- Sjekke punktene som kunne lukkes mot repoet (CI-trigger, språk i BMAD-konfigurasjonen, `docs/ki-logg.md`, `.working/`).
- Ta beslutningene én etter én med prosjekteieren og føre dem i beslutningsloggene i `docs/beslutninger/`.

### Resultat
- PR #113 (`chore/logg-flettet-112`): loggen for PR #112, 7 lukkede punkter og `communication_language`/`document_output_language: Norwegian` i `_bmad/bmm/config.yaml` (var `English`, mens `_bmad/config.toml` sa norsk). CI grønn (`test` 11 min 12 s), flettet som `3a0838a`. Branchene `fix/code-review-gruppe-e-f` og `chore/logg-flettet-112` er slettet lokalt og på GitHub.
- Beslutninger (prosjekteierens valg):
  1. Bildegrensen: bildet skaleres ned i nettleseren før opplasting. 5 MiB på serveren beholdes som sikkerhetsgrense. Ført i `arkitektur-beslutningslogg.md`. Funn underveis: Vercel tillater etter dokumentasjonen høyst 4,5 MB i forespørselen til en funksjon (ikke prøvd på demoen), så å heve grensen ville ikke hjulpet på demoen.
  2. Tom «Mine rapporter»: nøytral tekst, for eksempel «Du har ingen rapporter å vise.» (`ux-beslutningslogg.md`).
  3. Ingen egen oppsummering når KI-en ikke ga en; FR-4 står (`ux-beslutningslogg.md`).
  4. KI-forslagene fra Story 2.1: feilfargen, sjekken av e-postformatet og passordlengden bare ved registrering er godkjent. Den ikke-modale brukermenyen er ikke godkjent (`ux-beslutningslogg.md`).
  5. Sikt: v1 meldes ikke, og ingen blir spurt. Forbeholdet om at demoen kan ta imot ekte tekst og bilder er ført i `prd-beslutningslogg.md`.
- `issues.md`: punktene om egen oppsummering, KI-forslagene og Sikt er lukket. Bildegrensen og «Mine rapporter» står åpne med beslutningen notert, siden koden ikke er endret. Åpne punkter: 63.

### Åpne punkter
- Implementere nedskalering av bilder i nettleseren (egen story): tester og ny tekst i FR-3, UX-DR10 og meldingen «maks 5 MB». Står på punktet fra 2026-11-10 i `issues.md`.
- Implementere den nøytrale teksten i «Mine rapporter»: `report-list.tsx`, EXPERIENCE.md (begge kopier), UX-DR16 i `epics.md` og testene. Står på punktet fra 2026-11-19 i `issues.md`.
- Brukermenyen: bestem hva den skal være i stedet for ikke-modal. En modal meny ga axe-feilen aria-hidden-focus (serious).
