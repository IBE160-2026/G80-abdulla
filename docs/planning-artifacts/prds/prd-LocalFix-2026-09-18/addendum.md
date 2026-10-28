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

## Moderatorrolle

- Profiltabellen har en rollekolonne (`bruker` | `moderator`) med `bruker` som standard. Row Level Security hindrer brukere i å endre sin egen rolle.
- Seed-dataene oppretter en moderatorkonto, for eksempel `moderator@localfix.test`, og innloggingen står i README.
- En ekte bruker gjøres til moderator med én SQL-setning i Supabase Studio. README dokumenterer setningen.

## Valg av språkmodell

- Faglæreren krever en løsning med gratisnivå (alternativ A, valgt 2026-10-11). Vi sammenligner leverandører med gratisnivå i arkitekturfasen og sjekker gjeldende vilkår, fordi de endrer seg ofte.
- **Research gjort 2026-10-28:** `docs/planning-artifacts/research/technical-ki-leverandor-gratisniva-norsk-klassifis-2026-10-28/research.md` sammenligner Gemini, Cloudflare Workers AI, Groq, Mistral og OpenRouter. Foreløpig valg er Cloudflare Workers AI (Gemma 4 26B A4B), nest beste Groq (gpt-oss-120b). Ingen leverandør har målt norsk kvalitet, så valget bekreftes av SM-5-testen. Se PRD §11. Researchen må oppdateres etter 2027-01-28.
- Cloudflare og Groq har dokumenterte OpenAI-kompatible chat-endepunkt. Grensesnittet kan derfor skrives mot ett slikt endepunkt, med base-URL, modell og nøkkel i `.env`. For OpenRouter er base-URL-en ikke bekreftet, og for Gemini og Mistral er det ikke undersøkt om slike endepunkt finnes, så regn med egne adaptere der.
- Gemini på gratisnivå brukes ikke med ekte brukerdata (EØS-vilkår, trening på innholdet, menneskelige vurderere). Se PRD §8.
- Kandidatene vurderes på om de har et stabilt gratisnivå, om de kan gi strukturert eller JSON-svar slik at kategorien alltid er en av de fem, på resultatet mot KI-testsettet og på SDK-støtte i TypeScript.
- Integrasjonen legges bak et lite grensesnitt med en mock-implementasjon, så leverandøren kan byttes uten at resten av appen må endres.

## KI-testsett (SM-5)

- 20 beskrivelser, 4 per kategori, lagret som en datafil med fasit
- Et skript som kjører testsettet mot gjeldende prompt og modell, og rapporterer antall riktige
- Målet er minst 16 av 20. Testsettet kjøres på nytt hver gang prompten endres.
