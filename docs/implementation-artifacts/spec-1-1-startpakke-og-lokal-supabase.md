---
title: 'Story 1.1: Startpakke og lokal Supabase'
type: 'feature'
created: '2026-11-07'
status: 'in-progress'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '16e32979e6e54e9e6588932956cd21e84803fceb'
context:
  - '{project-root}/docs/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Repoet har ingen appkode. Sensor skal kunne klone repoet og starte appen med noen få kommandoer fra README, uten gruppens nøkler eller betalte tjenester (issue #22).

**Approach:** Opprett appen fra Next.js-eksempelet `with-supabase` i repo-roten, lås versjonene, rett oppstartsavvikene (AR-2), legg til `lib/env.ts`, lokal Supabase med CLI 2.122.1, PWA-manifest og README-grunnmur.

## Boundaries & Constraints

**Always:** Tailwind 3.4.x. Node 24 (`engines.node` `^24.0.0`, `.nvmrc`). Eksakte versjoner i `package.json` (ingen `latest`), og låsefila committes. `supabase` CLI `2.122.1` som eksakt devDependency, kjørt med `npx supabase`. Bare `lib/env.ts` leser `process.env`. `config.toml`-endringene ligger i en egen commit. Docker Desktop står først i README. Planleggingsfilene (`docs/`, `_bmad/`, `.logs/`, `.claude/`, `CLAUDE.md`) røres ikke, bortsett fra Stack-tabellen i arkitekturen.

**Beslutning (2026-11-07):** `supabase start` kjøres i denne økta på nåværende linje. De åtte bildene (≈ 1,2 GB) forhåndslastes fra `public.ecr.aws/supabase/`, og de fire tjenestene er slått av før første oppstart. README oppgir målt størrelse og tid.

**Beslutning (2026-11-07):** Demoinnholdet fjernes: veiledningen (`components/tutorial/`, `hero`, `deploy-button`, `env-var-warning`, logoene), `app/protected/` og mørk modus (`next-themes`, `theme-switcher`, `dark:`-variablene). Forsiden blir en enkel LocalFix-side på norsk. Innloggingssidene (`app/auth/*` og skjemaene deres) beholdes til Story 2.1.

**Beslutning (2026-11-07):** Spec-en beholdes samlet (≈ 2 300 tokens), fordi Story 1.1 er én issue, én branch og én PR.

**Never:** Ingen service worker, datamodell, seed, testoppsett (Story 1.2) eller KI-modul (Story 2.3). Ingen nøkler i repoet. `proxy.ts` sender aldri besøkende til innlogging. Supabase CLI 3.x brukes ikke.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Uten KI-nøkkel | `AI_PROVIDER` ikke satt | `serverEnv().AI_PROVIDER === 'mock'` | N/A |
| openai uten nøkkel | `AI_PROVIDER=openai`, ingen `AI_API_KEY` | Oppstart feiler | Zod-feil som navngir variabelen, uten verdier |
| Ugyldig verdi | `AI_PROVIDER=foo` | Oppstart feiler | Samme |
| Mangler Supabase-URL | ingen `NEXT_PUBLIC_SUPABASE_URL` | Oppstart feiler | Melding peker til README/`.env.example` |
| Besøkende på undersider | uinnlogget GET `/noe` | Ingen redirect til `/auth/login` | N/A |

</frozen-after-approval>

## Code Map

- `examples/with-supabase` (vercel/next.js `canary`) -- kilde. `package.json` har `next`/`@supabase/*` = `latest`, `tailwindcss` `^3.4.1`, `eslint-config-next` `15.3.1`, `@types/node` `^20`.
- `proxy.ts` + `lib/supabase/proxy.ts` -- `updateSession` sender alle stier unntatt `/`, `/login*` og `/auth*` til `/auth/login` når brukeren ikke er innlogget. Behold `getClaims()` og cookie-håndteringen, fjern bare redirect-blokken.
- `lib/utils.ts` -- `hasEnvVars` leser `process.env`. Fjernes, og bruken erstattes av `lib/env.ts`.
- `lib/supabase/{server,client,proxy}.ts` -- leser `NEXT_PUBLIC_SUPABASE_URL` og `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` direkte. Endres til `publicEnv`.
- `next.config.ts` -- `cacheComponents: true`. Tillater ikke `export const dynamic = 'force-dynamic'`, som AD-13 krever.
- `components.json` -- `tailwind.config: ""`. Kan få shadcn-CLI til å tro at prosjektet bruker Tailwind v4 (AR-2-sjekken).
- `README.md` (prosjektets egen, ikke eksempelets) -- utvides. `.gitignore` dekker alt, inkludert `.env` og `!.env.example`.
- `ARCHITECTURE-SPINE.md` §Stack (linje 186–206) -- oppdateres med låste versjoner (npm 2026-11-07: next 16.4.5, supabase-js 2.119.0).

## Tasks & Acceptance

**Execution:**
- [ ] repo-rot -- `npx create-next-app@latest -e with-supabase` i scratchpad, kopier inn (ikke eksempelets `README.md`/`.gitignore`), og fjern demoinnholdet slik beslutningen sier -- create-next-app avviser en mappe som ikke er tom
- [ ] `package.json`, `.nvmrc` -- eksakte versjoner, `engines.node`, `@types/node` `^24`, `eslint-config-next` lik Next-versjonen, `zod` 4.6.7, `supabase` 2.122.1. `npm install` lager `package-lock.json` -- AR-1
- [ ] `next.config.ts` -- fjern `cacheComponents` -- AD-13
- [ ] `lib/supabase/proxy.ts`, `lib/utils.ts` -- fjern redirect og `hasEnvVars` -- AR-2
- [ ] `lib/env.ts` -- `publicEnv` (Zod, literal `process.env.NEXT_PUBLIC_*`) og `serverEnv()` (`AI_PROVIDER` mock|openai med standard mock; `AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY` påkrevd bare for openai). Alle `lib/supabase/*` bruker den -- AR-4
- [ ] `lib/env.test.ts` -- én test per rad i I/O-matrisen, kjørt med `node --test` (Node 24 kjører TypeScript direkte) til Vitest kommer i Story 1.2 -- matrisen må være testet
- [ ] `.env.example` -- alle variablene. Lokale Supabase-verdier fra `npx supabase status` hvis de er like på alle maskiner, ellers plassholder og README-steg -- NFR-3
- [ ] `components.json`, `app/globals.css` -- kjør `npx shadcn@4.23.0 add button --overwrite`, se på diffen og rett etter AR-2. Sjekken står i Implementation Notes
- [ ] `supabase/config.toml` -- `npx supabase init`, `project_id = "localfix"`, `enable_confirmations = false`. Egen commit: Realtime, Edge Runtime, Analytics og e-posttesting av -- AR-3, AD-11
- [ ] `app/manifest.ts`, `public/icons/` -- navn, `start_url: '/'`, `display: 'standalone'`, temafarger #1F4E79/#F5F7FA, PNG-ikoner 192/512 -- AR-17
- [ ] `README.md` -- Docker Desktop først, forutsetninger med versjoner, kopierbare kommandoer, nedlastingsstørrelse og -tid for første oppstart -- AR-16
- [ ] `ARCHITECTURE-SPINE.md` -- Stack-tabellen får de låste versjonene -- AR-1

**Acceptance Criteria:**
- Given en ny klone, when README følges, then starter appen på `http://localhost:3000` uten egne nøkler.
- Given en besøkende, when `/`, `/noe` og `/auth/login` åpnes, then svarer ingen med redirect til innlogging.
- Given koden, when `process.env` søkes etter utenfor `lib/env.ts` og byggeresultatet, then finnes ingen treff.
- Given Docker Desktop, when `npx supabase start` kjøres, then starter Supabase uten Realtime, Edge Runtime, Analytics og e-posttesting.
- Given appen, when `/manifest.webmanifest` hentes, then har den ikoner på 192 og 512 px, og det finnes ingen service worker.

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Design Notes

`cacheComponents` fjernes i stedet for å skrive om AD-13: arkitekturen sier eksplisitt `force-dynamic`, og Next 16 avviser den innstillingen sammen med `cacheComponents`. Det endrer ingen regel, så det trengs ingen beslutningslogg, men valget nevnes i PR-en.

Navnene på KI-variablene (`AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY`) er ikke gitt i AD-8 og velges her. `serverEnv()` kaster hvis den kalles i nettleseren, slik at hemmeligheter ikke kan havne i klientkoden.

## Verification

**Commands:**
- `npm ci && npm run lint && npx tsc --noEmit && npm run build` -- alt består
- `node --test lib/env.test.ts` -- alle radene i matrisen består
- `npx supabase start` og deretter `npx supabase status` (de åtte bildene forhåndslastes i bakgrunnen fra `public.ecr.aws/supabase/`. Ta denne til slutt, og se med `docker images` hva som er lastet ned) -- tjenestene kjører, og de fire tjenestene som er slått av, er ikke med
- `npm run start` og `curl -sI localhost:3000/noe` -- ingen `Location: /auth/login`
- `git grep -n "process.env" -- ':!lib/env.ts'` -- ingen treff i appkoden

**Manual checks:**
- Chrome DevTools > Application: manifestet har ingen feil, og ingen service worker er registrert.
