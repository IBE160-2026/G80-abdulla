# LocalFix

LocalFix er en webapp der studenter og ansatte på campus ved Høgskolen i Molde kan melde fra om problemer de ser, som ødelagte gatelys, søppel, hull i veien eller farlige fortau. Andre kan bekrefte at de har sett det samme, og en moderator følger saken fra **Ny** via **Under behandling** til **Løst**. KI foreslår kategori og en kort oppsummering når du registrerer et problem.

Gruppeprosjekt (G80) i **IBE160 Programmering med KI** ved Høgskolen i Molde, høsten 2026.

## Status

🟡 **Implementeringen er i gang (Epic 1).** Startpakken og lokal Supabase er på plass (Story 1.1), og det samme er testkommandoen (Story 1.2). Appen viser foreløpig bare en forside. Testbrukere og testdata kommer i de neste storyene, og da utvides denne guiden.

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

`npm test` kjører alt med én kommando: først Vitest (ren logikk i `lib/`), så Playwright (`e2e/`). Playwright tilbakestiller den lokale databasen (`npx supabase db reset`), bygger appen (`next build`) og starter den med `next start` på port 3100, så en åpen `npm run dev` på port 3000 ikke blir testet. KI-en går alltid i mock-modus i testene, også om `.env` har `AI_PROVIDER=openai`. Testene kjører i to skjermbredder, 360 og 1280 px, og sjekker tilgjengelighet med axe.

| Kommando | Hva den kjører |
|---|---|
| `npm test` | Vitest og deretter Playwright |
| `npm run test:unit` | Bare Vitest, uten Supabase og bygg (noen sekunder) |
| `npm run test:e2e` | Bare Playwright |

**Forventet tid:** Omtrent ett minutt. På utviklermaskinen tok `npm test` 61 sekunder med et kaldt bygg. Det meste av tiden går til `db reset` og `next build`, selve testene tar noen sekunder.

Første gang laster `npx playwright install chromium` ned nettleseren. Brytes nedlastingen, kan kommandoen likevel avslutte uten feil. Kjør den da på nytt. Sier `npm test` at `chrome-headless-shell.exe` mangler, er det samme årsak.

Utskriften viser antall tester som besto. `npx playwright show-report` åpner rapporten fra siste Playwright-kjøring.

`npm test` tilbakestiller den lokale databasen, så data du har lagt inn selv mens du prøvde appen, forsvinner.

### Miljøvariabler

Alle variablene står i `.env.example`, og `lib/env.ts` validerer dem når appen starter. Mangler en verdi, stopper appen med en melding som sier hvilken variabel det gjelder. `.env` står i `.gitignore`, og repoet har ingen nøkler.

| Variabel | Standard | Forklaring |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `http://127.0.0.1:54321` | Adressen til lokal Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | lokal standardnøkkel | Den offentlige nøkkelen fra `npx supabase status` |
| `AI_PROVIDER` | `mock` | `mock` trenger ingen nøkkel. `openai` bruker et OpenAI-kompatibelt API |
| `AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY` | tomme | Påkrevd bare når `AI_PROVIDER=openai` |

### Lokal Supabase

`supabase/config.toml` slår av Realtime, Edge Functions, Analytics og e-posttesting, som appen ikke bruker. Da laster første oppstart ned mindre, og Docker-daemonen trenger ikke eksponeres på Windows. E-postbekreftelse er slått av (`enable_confirmations = false`), så nye brukere kan logge inn med en gang.

Supabase Studio, et grensesnitt for den lokale databasen, ligger på <http://127.0.0.1:54323> mens Supabase kjører.

## Teknologi

- Next.js 16 (App Router, React 19) med shadcn/ui og Tailwind CSS 3.4, mobile-first og installerbar som PWA (uten service worker)
- Supabase (PostgreSQL 17, innlogging og bildelagring), kjørt lokalt i Docker
- KI-kategorisering via en språkmodell med gratisnivå, og en mock-modus som gjør at appen kan kjøres uten API-nøkkel

De eksakte versjonene står i `package.json` og Stack-tabellen i [arkitekturen](docs/planning-artifacts/architecture/architecture-LocalFix-2026-10-28/ARCHITECTURE-SPINE.md#stack).

## Dokumentasjon

| Dokument | Innhold |
|---|---|
| [docs/product-brief.md](docs/product-brief.md) | Problem, løsning, målgruppe og omfang |
| [docs/addendum.md](docs/addendum.md) | Konkurrentresearch og parkerte idéer |
| [docs/prd.md](docs/prd.md) | Krav (FR-1 til FR-9), brukerreiser og suksessmetrikker |
| [docs/prd-addendum.md](docs/prd-addendum.md) | Teknisk retning, tilgangskontroll og KI-testsett |
| [docs/ux/](docs/ux/) | `DESIGN.md` (utseende), `EXPERIENCE.md` (oppførsel) og skisser i `mockups/` |
| [Arkitektur](docs/planning-artifacts/architecture/architecture-LocalFix-2026-10-28/ARCHITECTURE-SPINE.md) | Arkitekturbeslutninger (AD-1 til AD-15), datamodell, stack og mappestruktur. Vurderingene ligger i `reviews/` ved siden av |
| [Research: KI-leverandør](docs/planning-artifacts/research/technical-ki-leverandor-gratisniva-norsk-klassifis-2026-10-28/research.md) | Språkmodeller med gratisnivå og norsk kvalitet |
| [Research: brukerstemmer og konkurrenter](docs/planning-artifacts/research/user-voice-brukerstemmer-og-konkurrenter-for-lokal-2026-10-29/research.md) | Hva brukere sier om lignende løsninger, og hvordan LocalFix skiller seg ut |
| [Research: personvern](docs/planning-artifacts/research/domain-personvern-bilder-og-rapporter-2026-11-06/research.md) | Personvernkrav for bilder og rapporter: hva som gjelder i v1 og hva som må på plass før drift |
| [docs/coaching-plan.md](docs/coaching-plan.md) | Hvordan jeg bruker Claude Code som coach fra epics og stories til ferdig app |
| [docs/ki-logg.md](docs/ki-logg.md) | Hvordan KI er brukt i hver økt, hva jeg bestemte og hva jeg avviste |
| [.logs/](.logs/) | Sesjonslogg for hver arbeidsøkt med Claude Code (oppgave, plan, resultat) og `issues.md` med åpne punkter |
| [docs/beslutninger/](docs/beslutninger/) | Fortløpende beslutningslogger fra hver planleggingsfase |
| [docs/tilbakemeldinger/](docs/tilbakemeldinger/) | Tilbakemeldinger fra faglærer |

`docs/planning-artifacts/` er BMAD-ens arbeidsmappe for brief, PRD, UX og research. Brief, PRD og UX i `docs/` er kopier derfra, og kopiene oppdateres når en fase oppdateres. Arkitektur og research lenkes direkte til BMAD-mappen.

## Arbeidsflyt

Planleggingen følger BMAD: product brief → PRD → UX → arkitektur → epics og stories. Implementeringen gjøres med Claude Code. Hver story utvikles i en egen branch og flettes inn via en pull request.

## Medlemmer

- Ali Yousef Abdulla
