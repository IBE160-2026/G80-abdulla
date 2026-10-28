# KI-research og arkitektur

## 2026-10-28 kl. 22:07 — Ali Yousef Abdulla

### Oppgave
Brukeren ville ha forslag til research- og brainstormingtemaer før PRD-en, og valgte å researche KI-leverandør med gratisnivå (PRD §11, åpent spørsmål 1). Resultatet skulle inn i PRD og addendum. Deretter ble arkitekturen startet med `bmad-architecture` (coaching, bare spine som leveranse), og arbeidet ble pauset midt i reviewer-gate.

### Plan
- `bmad-help` for å se hvor prosjektet sto: brief, PRD og UX var ferdige, arkitektur var neste påkrevde steg.
- `bmad-deep-recon` (technical, select, preset deep): ramme avtalt med brukeren, kandidatscreening, seks parallelle assistenter på primærkilder, verifisering av de avgjørende påstandene, rapport med beslutningsmatrise.
- `bmad-prd` (oppdatering): bare §11 og §8, pluss henvisning i addendumet. Ingen krav endret.
- `bmad-architecture` (coaching): ti beslutninger tatt sammen med brukeren, spine skrevet ut, reviewer-gate med tre uavhengige reviewere, spine skrevet om etter funnene.
- Planlegging og research ligger her: `docs/planning-artifacts/research/technical-ki-leverandor-gratisniva-norsk-klassifis-2026-10-28/research.md` og `docs/planning-artifacts/architecture/architecture-LocalFix-2026-10-28/ARCHITECTURE-SPINE.md` (med `.memlog.md` og `reviews/`).

### Resultat
- **Research:** `research.md` med digests for Gemini, Cloudflare Workers AI, Groq, Mistral, OpenRouter og norsk modellkvalitet. Ingen klar vinner (Gemini 355, Groq 350, Cloudflare 350, Mistral 320, OpenRouter 185 av 500). Gemini på gratisnivå faller ut for ekte brukerdata (EØS-vilkår, trening, menneskelige vurderere), bekreftet to ganger på Googles vilkårsside. Kvalifisert favoritt: Cloudflare Workers AI med Gemma 4 26B A4B. Nest beste: Groq med gpt-oss-120b. Avgjøres av SM-5-testen. Rapporten er gyldig til 2027-01-28.
- **PRD:** §8 (rapportteksten sendes til ekstern KI-tjeneste, Gemini gratis ikke med ekte data), §11 spørsmål 1 (foreløpig valg og vilkår for å lukke det), `updated` og en «Endringer 2026-10-28»-linje i §0. Addendumet har fått en henvisning til researchen. `docs/prd.md` og `docs/prd-addendum.md` er synkronisert som kopier. Committet som `a0071e0`.
- **Arkitektur:** `ARCHITECTURE-SPINE.md` med AD-1 til AD-14, status **draft**. Beslutningene tatt av brukeren: databasen eier reglene (RLS, trigger), startpakken `with-supabase`, all dataflyt via serveren med ett navngitt unntak for innlogging, tre tabeller, bekreftelser som visning, skjulte rapporter og bilder følger samme regel, KI bak ett grensesnitt med mock, bildeopplasting via serveren, konvensjoner, bare lokalt i v1, Tailwind 3.4 beholdes, brukere ser bare antallet bekreftelser. Reviewer-gate ga 12 funn fra motparten (tre kritiske), fem fra sjekklisten og tre om startpakken. De er rettet i spinen. Lint uten funn. Committet som `2f9fa1e`.
- Alt ligger på branchen `docs/ki-research-og-arkitektur`, avgrenet fra `main`. Ikke pushet.

### Åpne punkter
- Spinen står som `draft`: velg mellom en ny runde med motpart-reviewer (anbefalt, omtrent fire minutter) og å sette den til `final`. Gjenoppta med «fortsett arkitekturen» i et nytt kontekstvindu.
- Bekreft eller endre syv antagelser jeg la inn fra reviewernes forslag (står som `assumption` i `.memlog.md`): lengdegrenser, 60 sekunders signerte lenker, URL-parametre og sortering, 404 for skjulte rapporter, e-postbekreftelse av lokalt, grense på KI-kall, SM-5 i mock-modus.
- Installer Docker Desktop før bygging. Lokal Supabase kan ikke kjøres uten (det var ikke installert på maskinen 2026-10-28).
- Velg endelig KI-leverandør ved å kjøre SM-5-testsettet (20 beskrivelser) mot Cloudflare, Groq og Mistral med testdata, og med språk-ID-sjekk av sammendragene.
- Avklar for Cloudflare om gratis Workers AI krever betalingskort, og hvor inferensen kjører. Les de faktiske gratisgrensene for Groq, Mistral og Gemini i konsollene. Åpne `euroeval.com/leaderboards/Monolingual/norwegian` i nettleser og les norsk rangering.
- AD-6 og AD-9 er foreløpige: test at en Storage-policy kan slå opp `reports` via `image_path`, hvilken rettighet `createSignedUrl` krever, og tilfellet med anonyme besøkende. Reserveløsningen krever en endring av AD-11.
- Sjekk ved oppstart at shadcn CLI 4.x passer med startpakkens Tailwind 3.4, og Vitest 5 med Next.js.
- Oppdater researchen etter 2027-01-28.
- Ikke gjort fra temalisten: research på hvem moderator er og om vedkommende vil gjøre jobben (avgjør om produktet fungerer), konkurrentresearch (`competition.md` inneholder bare én linje), personvern for bilder og posisjon, begrense innlogging til campus, og brainstorming.
- Neste BMad-steg etter arkitekturen er `bmad-create-epics-and-stories`, deretter `bmad-sprint-planning` og `bmad-build`.
