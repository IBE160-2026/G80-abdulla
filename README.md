# LocalFix

LocalFix er en webapp der studenter og ansatte på campus ved Høgskolen i Molde kan melde fra om problemer de ser, som ødelagte gatelys, søppel, hull i veien eller farlige fortau. Andre kan bekrefte at de har sett det samme, og en moderator følger saken fra **Ny** via **Under behandling** til **Løst**. KI foreslår kategori og en kort oppsummering når du registrerer et problem.

Gruppeprosjekt (G80) i **IBE160 Programmering med KI** ved Høgskolen i Molde, høsten 2026.

## Status

🟡 **Planleggingsfasen.** Product brief, PRD og UX er ferdige. Neste steg er arkitektur, deretter epics og stories, og så implementering.

Det finnes ingen kode ennå. Når det gjør det, får denne README-en en fullstendig installasjonsguide med forutsetninger, kommandoer, `.env.example`, testbrukere og hvordan testene kjøres.

## Planlagt teknologi

- Next.js (React) med shadcn/ui og Tailwind, mobile-first og PWA
- Supabase for database, innlogging og bildelagring, kjørt lokalt med testdata
- KI-kategorisering via en språkmodell med gratisnivå, og en mock-modus som gjør at appen kan kjøres uten API-nøkkel

## Dokumentasjon

| Dokument | Innhold |
|---|---|
| [docs/product-brief.md](docs/product-brief.md) | Problem, løsning, målgruppe og omfang |
| [docs/addendum.md](docs/addendum.md) | Konkurrentresearch og parkerte idéer |
| [docs/prd.md](docs/prd.md) | Krav (FR-1 til FR-9), brukerreiser og suksessmetrikker |
| [docs/prd-addendum.md](docs/prd-addendum.md) | Teknisk retning, tilgangskontroll og KI-testsett |
| [docs/ux/](docs/ux/) | `DESIGN.md` (utseende), `EXPERIENCE.md` (oppførsel) og skisser i `mockups/` |
| [docs/ki-logg.md](docs/ki-logg.md) | Hvordan KI er brukt i hver økt, hva jeg bestemte og hva jeg avviste |
| [docs/beslutninger/](docs/beslutninger/) | Fortløpende beslutningslogger fra hver planleggingsfase |
| [docs/tilbakemeldinger/](docs/tilbakemeldinger/) | Tilbakemeldinger fra faglærer |

`docs/` er hovedkopien av planleggingsdokumentene. `.docs/planning-artifacts/` er BMAD-ens arbeidskopi av brief, PRD, UX og research. Rett alltid i `docs/`, og kopier endringer til `.docs/` ved behov, så de to ikke kommer ut av synk.

## Arbeidsflyt

Planleggingen følger BMAD: product brief → PRD → UX → arkitektur → epics og stories. Implementeringen gjøres med Claude Code. Hver story utvikles i en egen branch og flettes inn via en pull request.

## Medlemmer

- Ali Yousef Abdulla
