# UX etter PRD-vurdering

## 2026-11-06 kl. 11:26 — Ali Yousef Abdulla

### Oppgave
Første steg etter sensorsjekken ([sensorsjekk-del-1](991-2026-11-06-11-07-02-sensorsjekk-del-1.md)): rette avvikene mellom UX-dokumentet, PRD-en (2026-11-04) og arkitekturspinen, og oppdatere skissene slik at de sier det samme. Brukeren vil følge sensorveiledningen og ha et ryddig prosjekt.

### Plan
- Kjørte `bmad-ux` i Update-modus på `docs/planning-artifacts/ux-designs/ux-LocalFix-2026-10-11/`.
- Leste `EXPERIENCE.md`, `.memlog.md`, PRD-en og de delene av arkitekturen som gjelder (AD-4, AD-5, AD-8, AD-10 og konvensjonene for filter og data).
- Fire valg gikk til brukeren. Brukeren ba om anbefalinger ut fra sensorveiledningen og godtok alle fire:
  1. Beskrivelsen kan ikke være tom og har maks 1000 tegn, samme regel som PRD og arkitektur. Minstegrensen på 10 tegn er fjernet.
  2. «Mine rapporter» er første brikke i filterraden, med `?mine=true`.
  3. «Sist oppdatert» vises som dato og klokkeslett.
  4. Påminnelsen er: «Ikke skriv navn eller andre personopplysninger. Teksten sendes til en KI-tjeneste for å foreslå kategori.»
- Resten var ren tilpasning til PRD og arkitektur.

### Resultat
Commit `154e361` «Tilpass UX til PRD-vurderingen og arkitekturen», på branchen `docs/ux-etter-prd-vurdering`.

- `EXPERIENCE.md`:
  - Lengdegrenser (1000, 200 og 300 tegn) og tegnteller.
  - «Send inn» krever kategori, også mens KI-en jobber.
  - Filter-URL med `category`, `status`, `sort` og `mine` med enum-koder.
  - Ny komponent «Sist oppdatert», og ny tilstand «Ingen egne rapporter».
  - Telleren er `confirmation_count + 1`, så en ny rapport viser «1 har sett dette».
  - En skjult rapport forsvinner også for rapportøren.
  - `aria-pressed` på filterbrikkene, og kontrollen for NFR-8 (axe og bare tastatur).
  - Flow 1 viser «1 har sett dette», og Flow 3 har fått klimakset fra UJ-3.
  - Arkitekturen er lagt inn som kilde, og `updated` er satt til 2026-11-06.
- Skissene:
  - `liste.html`: brikken «Mine rapporter» og en ny skjerm for Idas klimaks.
  - `registrer.html`: påminnelse, tegnteller, «(obligatorisk)» på kategori og tillatte bildeformater.
  - `detalj.html`: «Sist oppdatert» på alle tre skjermene.
- Kopiene i `docs/ux/` er byte-identiske med originalene.
- `.memlog.md` har fått 8 nye linjer, kopiert til `docs/beslutninger/ux-beslutningslogg.md`. Raden i `docs/beslutninger/README.md` er oppdatert.
- `DESIGN.md` er ikke endret, fordi ingen av endringene gjelder det visuelle.
- Fire UX-punkter i `issues.md` er krysset av: «sist oppdatert», «Mine rapporter», lengde, kategori og URL, og telleren, NFR-8 og personopplysninger.
- Reviewer-gaten og `bmad-review` (struktur og språk) i Finalize er ikke kjørt. Det var en målrettet tilpasning, ikke en ny UX.

### Åpne punkter
- Arkitekturen må ta inn URL-parameteren `mine=true` for «Mine rapporter» i filterkonvensjonen. Dette er allerede et punkt i `issues.md` fra 2026-11-04, og nå er navnet bestemt.
- Kontrollen for NFR-8 sier «før hver fletting av en story som endrer grensesnittet». Den må bli en del av hvordan en story regnes som ferdig, når epics og stories lages.
