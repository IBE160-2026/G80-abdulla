# Research: personvern

## 2026-11-06 kl. 19:30 — Ali Yousef Abdulla

### Oppgave
Brukeren kjørte `bmad-deep-recon` og valgte at researchen skulle kjøres her, med tema personvern for bilder og rapporter (et åpent punkt fra ki-research-og-arkitektur). Målet var å finne ut hva som gjelder i v1 med testdata, og hva som må på plass før appen settes i drift.

### Plan
- Researchtype domain. Planen ble godkjent av brukeren: 3 assistenter, standard innstillinger, maks 2 runder, normal kontroll av påstandene.
- Runde 1 og 2 med tre assistenter hver, som fikk sine egne spørsmål. Deretter én kontrollrunde mot GDPR-teksten, Gemini-vilkårene og Cloudflare.
- Digestene ble skrevet til disk etter hvert som de kom inn, og rapporten ble satt sammen fra dem.

### Resultat
- Ny mappe `docs/planning-artifacts/research/domain-personvern-bilder-og-rapporter-2026-11-06/` med `research.md`, 7 digester og `.memlog.md`. 18 påstander er logget: 6 bekreftet og 12 ubekreftet. Den mekaniske sitatsjekken er OK.
- Hovedfunn:
  - v1 med oppdiktede data, også i bildene, trenger trolig ikke meldes til Sikt.
  - Serveren bør fjerne EXIF fra opplastede bilder.
  - «Ingenting slettes» (FR-9) holder ikke ved drift, og anonymisering er et mulig alternativ.
  - Gemini på gratisnivå er ikke tillatt for brukere i EØS. Cloudflare Workers AI trener ikke på data og lagrer dem ikke.
  - Berettiget interesse (art. 6(1)(f)) kan ikke brukes av en statlig høgskole i dens oppgaver.
- README har fått en rad for researchen.
- Commit `de3d5bd` på branchen `docs/research-personvern`.
- Ikke kjørt: den semantiske sitatsjekken, bmad-review-poleringen og HTML-briefingen, fordi brukeren ba om commit.

### Åpne punkter
- Spør faglærer eller HiMoldes personvernombud om v1 med oppdiktede data kan la være å meldes til Sikt.
- Seed-bildene i v1 skal ikke vise ansikter eller lesbare bilskilt, og testbrukerne skal ha oppdiktede e-postadresser. Skriv det i README og PRD §8.
- Fjerning av EXIF på serveren: legg det inn som regel i AD-9 med beslutningslogg, og som akseptansekriterium i storyen for bildeopplasting.
- Ta personvern med i valget av KI-leverandør (SM-5): ta Gemini ut for drift, og slå av trening hvis Mistral velges.
- Før drift: avklar behandlingsansvar og grunnlag, lag personvernerklæring etter art. 13, innfør lagringstid og anonymisering i stedet for «ingenting slettes», velg EU-region i Supabase og inngå DPA-er. Legg dette i arkitekturens Deferred-tabell og i PRD §6.2.
- Fullfør researchen: kjør den semantiske sitatsjekken og `bmad-review` på `research.md`, og test selv om iOS og Android fjerner EXIF.
