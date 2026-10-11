# PRD-addendum: LocalFix

Teknisk bakgrunn og retning til arkitekturfasen. PRD-en beskriver *hva* som skal bygges. Dette dokumentet samler det vi allerede vet om *hvordan*.

## Teknisk retning (fra brief)

- Next.js (React) med API routes, i én kodebase og med mobile-first design
- Supabase for database, innlogging (Auth) og bildelagring (Storage)
- PWA-manifest legges til mot slutten av prosjektet

## Kjørbar uten gruppens nøkler (NFR-2)

- **Database og lagring:** Supabase kjøres lokalt med Supabase CLI og Docker. Migreringer og seed-data ligger i repoet. Seed-dataene har én moderatorkonto, et par brukerkontoer, rapporter i alle kategorier og statuser, og noen testbilder.
- **KI:** En mock-modus slår seg på automatisk når API-nøkkel mangler. Den gir forutsigbare forslag, for eksempel etter nøkkelord, slik at registreringsflyten og testene virker uten nøkkel.
- **Konfigurasjon:** `.env.example` lister alle variablene. `.env` står i `.gitignore`.
- **Mapper:** Planleggingsdokumentene ligger i `docs/`. Testbilder og KI-testsettet får egne mapper i repoet, og de nøyaktige stiene avgjøres i arkitekturfasen.

## Tilgangskontroll (NFR-4)

- Supabase Row Level Security, eller tilsvarende kontroll på serveren, håndhever moderatorhandlinger og regelen om én bekreftelse per bruker.
- En unik databasebegrensning på (rapport, bruker) i bekreftelsestabellen gjør regelen om én bekreftelse robust, også når to forespørsler kommer samtidig.

## KI-testsett (SM-5)

- 20 beskrivelser, 4 per kategori, lagret som en datafil med fasit
- Et skript som kjører testsettet mot gjeldende prompt og modell, og rapporterer antall riktige
- Målet er minst 16 av 20. Testsettet kjøres på nytt hver gang prompten endres.
