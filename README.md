# LocalFix

LocalFix er en webapp der studenter og ansatte på campus ved Høgskolen i Molde kan melde fra om problemer de ser, som ødelagte gatelys, søppel, hull i veien eller farlige fortau. Andre kan bekrefte at de har sett det samme, og en moderator følger saken fra **Ny** via **Under behandling** til **Løst**. KI foreslår kategori og en kort oppsummering når du registrerer et problem.

Gruppeprosjekt (G80) i **IBE160 Programmering med KI** ved Høgskolen i Molde, høsten 2026.

## Status

🟡 **Implementeringen er i gang (Epic 2).** Epic 1 er ferdig: startpakken og lokal Supabase er på plass (Story 1.1), og det samme er testkommandoen (Story 1.2). Den lokale databasen har datamodellen, lesereglene, testbrukere og testrapporter (Story 1.3). Forsiden viser lista over rapportene, nyeste først (Story 1.4), og hvert kort åpner en detaljside med hele rapporten, når den sist ble oppdatert og hvor mange som har sett problemet (Story 1.5). Reglene for bilder er testet: den lokale bildelagringen har tre testbilder, og bare moderatoren kan lese bildet til en skjult rapport (Story 1.6). Detaljsiden viser bildet til rapporten, og i lista har kortene til rapportene med bilde et bildeikon (Story 1.7). I Epic 2 kan du opprette konto og logge inn med e-post og passord fra menyen i topplinja, og du kommer tilbake til siden du kom fra (Story 2.1). Når du er innlogget, kan du registrere en rapport med beskrivelse, kategori og sted fra «+»-knappen på lista (under 640 px) eller «Registrer problem» i topplinja (fra 640 px), og du kommer til rapporten med toasten «Rapporten er sendt inn» (Story 2.2). Når du forlater beskrivelsen, foreslår KI kategori og en kort oppsummering du kan endre, og hvis den ikke får til det, velger du kategori selv (Story 2.3). Du kan legge ved et bilde (JPEG, PNG eller WebP, maks 5 MB): serveren fjerner posisjon og andre metadata fra bildet og retter det, og bildet vises på rapporten og som ikon i lista (Story 2.4).

## Kom i gang

Appen kjører helt lokalt. Du trenger ingen nøkler, kontoer eller betalte tjenester: databasen, innloggingen og bildelagringen kjører i Docker, og KI-en er i mock-modus.

### 1. Installer Docker Desktop først

Lokal Supabase kjører i Docker, så uten Docker starter ikke appen.

1. Last ned og installer [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows, macOS eller Linux). På Windows bruker Docker Desktop WSL 2.
2. Start Docker Desktop og vent til den sier at motoren kjører.
3. Sjekk at Docker virker:

   ```sh
   docker run hello-world
   ```

### 2. Forutsetninger

| Verktøy | Versjon | Sjekk |
|---|---|---|
| Docker Desktop | 4.x (testet med 4.98.0) | `docker version` |
| Node.js | 24 LTS (står i `.nvmrc`; testet med 24.19.0) | `node --version` |
| npm | 11 (følger med Node 24; testet med 11.17.0) | `npm --version` |
| Git | hvilken som helst nyere | `git --version` |

Supabase CLI trenger du ikke installere selv. Den er en devDependency (`supabase` 2.122.1) og kjøres med `npx supabase`.

### 3. Start appen

Kjør kommandoene fra en terminal. På Windows virker PowerShell, Git Bash og WSL.

```sh
git clone https://github.com/IBE160-2026/G80-abdulla.git
cd G80-abdulla
npm ci
npx supabase start
```

`npx supabase start` skriver ut adresser og nøkler for den lokale Supabase-instansen når den er ferdig. Kopier så eksempelfila til `.env` (kommandoen virker også i PowerShell):

```sh
cp .env.example .env
```

`.env.example` har allerede adressen og den offentlige nøkkelen for lokal Supabase. Det er standardverdiene til Supabase CLI, så de er like på alle maskiner og ikke hemmelige. Du trenger ikke endre noe. Start så appen:

```sh
npm run dev
```

Åpne <http://localhost:3000>.

**Første oppstart tar tid.** Første gang laster `npx supabase start` ned sju Docker-bilder fra `public.ecr.aws/supabase/`, til sammen omtrent 1,1 GB (omtrent 4 GB på disk etter utpakking). Det tar 3–5 minutter på en linje med 50–100 Mbit/s. På utviklermaskinen, med 2–5 Mbit/s, tok det omtrent 55 minutter. Senere oppstarter tok 37 sekunder, fordi bildene ligger lagret i Docker.

Stopper nedlastingen med `toomanyrequests: Rate exceeded`, kjører du bare `npx supabase start` på nytt. Bildene som allerede er lastet ned, beholdes.

### Testbrukere

`npx supabase start` og `npx supabase db reset` legger inn faste testdata fra `supabase/seed.sql`: fem kontoer og ni rapporter i alle kategorier og statuser, der én er skjult. Alle kontoene har samme passord. Tre av rapportene har bilde, også den skjulte. Bildene ligger i `supabase/seed-images/` og lastes opp til den private bucketen `report-images` i den lokale bildelagringen.

I lista har kortene til de to synlige rapportene med bilde, «Slukkede gatelys på gangveien» og «Hull i asfalten ved P2», et lite bildeikon sist i linja med «har sett dette». Åpner du en av dem, vises bildet mellom overskriften og beskrivelsen. Bildet hentes fra en signert lenke som serveren lager for hver visning, og lenken virker i 60 sekunder. Last siden på nytt for å få en ny lenke. Den skjulte rapporten gir 404 for alle andre enn moderatoren, og da lages ingen lenke til bildet.

| E-post | Passord | Rolle | Brukes til |
|---|---|---|---|
| `moderator@localfix.test` | `localfix-test` | moderator | Ser også skjulte rapporter |
| `bruker1@localfix.test` | `localfix-test` | user | Har skrevet testrapporter |
| `bruker2@localfix.test` | `localfix-test` | user | Har skrevet testrapporter |
| `kjerneflyt360@localfix.test` | `localfix-test` | user | Satt av til kjerneflyttesten på 360 px |
| `kjerneflyt1280@localfix.test` | `localfix-test` | user | Satt av til kjerneflyttesten på 1280 px |

### Logg inn

Åpne menyen ☰ øverst til høyre og velg «Logg inn». Skriv inn en av e-postadressene i tabellen over og passordet `localfix-test`. Etterpå er du tilbake på siden du kom fra, og menyen viser e-postadressen din, «Logg ut» og, for `moderator@localfix.test`, merkelappen «Moderator». Du kan også opprette en ny konto med «Registrer konto» på innloggingssiden. Passordet må ha minst 6 tegn, og kontoen er innlogget med en gang, uten e-postbekreftelse. Glemt passord og sletting av konto finnes ikke i v1.

v1 bruker bare oppdiktede testdata og behandler ingen personopplysninger. Kontoene, e-postadressene og rapporttekstene er oppdiktet, og domenet `localfix.test` finnes ikke. Testbildene er CC0-bilder fra Wikimedia Commons uten ansikter, lesbare bilskilt eller metadata. Kilde og lisens for hvert bilde står i [`supabase/KILDER-seed-images.md`](supabase/KILDER-seed-images.md). Registreringen godtar likevel hvilken som helst e-postadresse, så bruk en oppdiktet adresse, for eksempel på `localfix.test`, når du oppretter en konto lokalt.

En ny konto får alltid rollen `user`. Rollen kan bare endres med SQL som `postgres`, for eksempel i Supabase Studio:

```sql
update public.profiles set role = 'moderator'
where id = (select id from auth.users where email = 'navn@localfix.test');
```

Svaret skal være `UPDATE 1`. Står det `UPDATE 0`, finnes ikke e-postadressen, og ingen rolle er endret.

### Stopp og start igjen

```sh
npx supabase stop     # stopper Supabase og beholder dataene
npx supabase start    # starter den igjen
```

### Kjør testene

Testene trenger Docker Desktop og lokal Supabase, så start Supabase først. Nettleseren til Playwright installerer du én gang:

```sh
npx supabase start
npx playwright install chromium
npm test
```

`npm test` kjører alt med én kommando: først Vitest (ren logikk i `lib/` og en sjekk av Playwright-oppsettet i `playwright.config.test.ts`), så databasetestene og til slutt Playwright (`e2e/`). Databasetestene tilbakestiller den lokale databasen (`npx supabase db reset`), tester lesereglene og bildereglene med pgTAP (`npx supabase test db`, filene i `supabase/tests/`), logger inn med hver testbruker i tabellen over og lager signerte lenker til testbildene. Testene som laster opp bilder, rydder bildelagringen selv etterpå, med service-role-nøkkelen fra `npx supabase status -o env`, så `db reset` ikke trengs først. Playwright tilbakestiller den lokale databasen (`npx supabase db reset`), bygger appen (`next build`) og starter den med `next start` på port 3100, så en åpen `npm run dev` på port 3000 ikke blir testet. KI-en går alltid i mock-modus i testene, også om `.env` har `AI_PROVIDER=openai`. Testene kjører i to skjermbredder, 360 og 1280 px, og sjekker tilgjengelighet med axe. Til slutt kjører prosjektet `reset` testene som trenger andre data enn seed (lista med 100 og 500 ekstra rapporter, en tom database og en rapport der bildet mangler i bildelagringen). De legger inn data med `npx supabase db query --local` og kjører `npx supabase db reset` selv, også etter siste test, så databasen har seed-dataene igjen når `npm test` er ferdig.

| Kommando | Hva den kjører |
|---|---|
| `npm test` | Vitest, databasetestene og deretter Playwright |
| `npm run test:unit` | Bare Vitest for ren logikk, uten Supabase og bygg (noen sekunder) |
| `npm run test:db` | `db reset`, en sjekk av at `lib/supabase/database.types.ts` er lik skjemaet, pgTAP (`supabase/tests/`) og Vitest-testene mot lokal Supabase (`lib/**/*.db.test.ts`) |
| `npm run test:e2e` | Bare Playwright, med `db reset` før bygget og flere `db reset` i prosjektet `reset` |
| `npm run db:types` | Genererer `lib/supabase/database.types.ts` fra den lokale databasen. Kjøres etter hver ny migrering, og fila committes |

**Forventet tid:** Omtrent fem minutter. På utviklermaskinen tok `npm test` 4 minutter og 28 sekunder. Det meste av tiden går til `db reset` (rundt et halvt minutt hver gang: databasetestene, Playwright før bygget og fire ganger i prosjektet `reset`) og `next build`. Selve testene tar noen sekunder.

Første gang laster `npx supabase test db` ned Docker-bildet `supabase/pg_prove`, og `npx playwright install chromium` laster ned nettleseren. Brytes nedlastingen, kan kommandoen likevel avslutte uten feil. Kjør den da på nytt. Sier `npm test` at `chrome-headless-shell.exe` mangler, er det samme årsak.

Utskriften viser antall tester som besto. `npx playwright show-report` åpner rapporten fra siste Playwright-kjøring.

`npm test` tilbakestiller den lokale databasen, så data du har lagt inn selv mens du prøvde appen, forsvinner.

### Miljøvariabler

Alle variablene står i `.env.example`, og `lib/env.ts` validerer dem når appen starter. Mangler en verdi, stopper appen med en melding som sier hvilken variabel det gjelder. `.env` står i `.gitignore`, og repoet har ingen nøkler.

| Variabel | Standard | Forklaring |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `http://127.0.0.1:54321` | Adressen til lokal Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | lokal standardnøkkel | Den offentlige nøkkelen fra `npx supabase status` |
| `AI_PROVIDER` | `mock` | `mock` trenger ingen nøkkel og gjør ingen nettverkskall: den svarer etter nøkkelord (for eksempel «gatelys» gir Belysning, «søppel» gir Søppel, «hull» gir Vei og fortau, «hærverk» gir Skadeverk, ellers Annet), og testordet `ingenforslag` i teksten gir ingen forslag. `openai` bruker et OpenAI-kompatibelt API (`POST {AI_BASE_URL}/chat/completions`). Svaret valideres alltid, og feil, ugyldig svar eller mer enn 5 sekunder gir «ingen forslag». Høyst 2000 tegn av beskrivelsen sendes |
| `AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY` | tomme | Påkrevd bare når `AI_PROVIDER=openai` |

### Lokal Supabase

`supabase/config.toml` slår av Realtime, Edge Functions, Analytics og e-posttesting, som appen ikke bruker. Da laster første oppstart ned mindre, og Docker-daemonen trenger ikke eksponeres på Windows. E-postbekreftelse er slått av (`enable_confirmations = false`), så nye brukere kan logge inn med en gang. Derfor har appen heller ingen sider for bekreftelse, glemt passord eller nytt passord. Minste passordlengde er 6 tegn (`minimum_password_length`), og `lib/limits.ts` har samme tall. Bucketen `report-images` for bildene er privat og godtar JPEG, PNG og WebP på høyst 5 MiB. Testbildene i `supabase/seed-images/` lastes opp ved `npx supabase start` og `npx supabase db reset`.

Supabase Studio, et grensesnitt for den lokale databasen, ligger på <http://127.0.0.1:54323> mens Supabase kjører.

## Teknologi

- Next.js 16 (App Router, React 19) med shadcn/ui og Tailwind CSS 3.4, mobile-first og installerbar som PWA (uten service worker)
- Supabase (PostgreSQL 17, innlogging og bildelagring), kjørt lokalt i Docker
- `sharp` på serveren: fjerner posisjon og andre metadata (EXIF) fra opplastede bilder og retter dem før de lagres
- KI-kategorisering via en språkmodell med gratisnivå, og en mock-modus som gjør at appen kan kjøres uten API-nøkkel

De eksakte versjonene står i `package.json` og Stack-tabellen i [arkitekturen](docs/planning-artifacts/architecture/architecture-LocalFix-2026-10-28/ARCHITECTURE-SPINE.md#stack).

## Dokumentasjon

| Dokument | Innhold |
|---|---|
| [docs/product-brief.md](docs/product-brief.md) | Problem, løsning, målgruppe og omfang |
| [docs/addendum.md](docs/addendum.md) | Konkurrentresearch og parkerte idéer |
| [docs/prd.md](docs/prd.md) | Krav (FR-1 til FR-9), brukerreiser og suksessmetrikker |
| [docs/prd-addendum.md](docs/prd-addendum.md) | Teknisk retning, tilgangskontroll og KI-testsett |
| [DESIGN.md](DESIGN.md) | Utseendet: fargetokens, typografi og komponenter. Ligger i roten, der designskillen Impeccable leser den |
| [PRODUCT.md](PRODUCT.md) | Kort produktsammendrag for Impeccable, hentet fra PRD-en |
| [docs/ux/](docs/ux/) | `EXPERIENCE.md` (oppførsel) og skisser i `mockups/` |
| [Arkitektur](docs/planning-artifacts/architecture/architecture-LocalFix-2026-10-28/ARCHITECTURE-SPINE.md) | Arkitekturbeslutninger (AD-1 til AD-15), datamodell, stack og mappestruktur. Vurderingene ligger i `reviews/` ved siden av |
| [Research: KI-leverandør](docs/planning-artifacts/research/technical-ki-leverandor-gratisniva-norsk-klassifis-2026-10-28/research.md) | Språkmodeller med gratisnivå og norsk kvalitet |
| [Research: brukerstemmer og konkurrenter](docs/planning-artifacts/research/user-voice-brukerstemmer-og-konkurrenter-for-lokal-2026-10-29/research.md) | Hva brukere sier om lignende løsninger, og hvordan LocalFix skiller seg ut |
| [Research: personvern](docs/planning-artifacts/research/domain-personvern-bilder-og-rapporter-2026-11-06/research.md) | Personvernkrav for bilder og rapporter: hva som gjelder i v1 og hva som må på plass før drift |
| [docs/coaching-plan.md](docs/coaching-plan.md) | Hvordan jeg bruker Claude Code som coach fra epics og stories til ferdig app |
| [docs/ki-logg.md](docs/ki-logg.md) | Hvordan KI er brukt i hver økt, hva jeg bestemte og hva jeg avviste |
| [.logs/](.logs/) | Sesjonslogg for hver arbeidsøkt med Claude Code (oppgave, plan, resultat) og `issues.md` med åpne punkter |
| [docs/beslutninger/](docs/beslutninger/) | Fortløpende beslutningslogger fra hver planleggingsfase |
| [docs/tilbakemeldinger/](docs/tilbakemeldinger/) | Tilbakemeldinger fra faglærer |

`docs/planning-artifacts/` er BMAD-ens arbeidsmappe for brief, PRD, UX og research. Brief, PRD og UX i `docs/` er kopier derfra, og kopiene oppdateres når en fase oppdateres. Unntaket er at kopien av `DESIGN.md` ligger i roten. Arkitektur og research lenkes direkte til BMAD-mappen.

## Arbeidsflyt

Planleggingen følger BMAD: product brief → PRD → UX → arkitektur → epics og stories. Implementeringen gjøres med Claude Code. Hver story utvikles i en egen branch og flettes inn via en pull request.

## Medlemmer

- Ali Yousef Abdulla
