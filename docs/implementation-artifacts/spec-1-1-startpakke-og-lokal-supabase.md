---
title: 'Story 1.1: Startpakke og lokal Supabase'
type: 'feature'
created: '2026-11-07'
status: 'done'
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
- [x] repo-rot -- `npx create-next-app@latest -e with-supabase` i scratchpad, kopier inn (ikke eksempelets `README.md`/`.gitignore`), og fjern demoinnholdet slik beslutningen sier -- create-next-app avviser en mappe som ikke er tom
- [x] `package.json`, `.nvmrc` -- eksakte versjoner, `engines.node`, `@types/node` `^24`, `eslint-config-next` lik Next-versjonen, `zod` 4.6.7, `supabase` 2.122.1. `npm install` lager `package-lock.json` -- AR-1
- [x] `next.config.ts` -- fjern `cacheComponents` -- AD-13
- [x] `lib/supabase/proxy.ts`, `lib/utils.ts` -- fjern redirect og `hasEnvVars` -- AR-2
- [x] `lib/env.ts` -- `publicEnv` (Zod, literal `process.env.NEXT_PUBLIC_*`) og `serverEnv()` (`AI_PROVIDER` mock|openai med standard mock; `AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY` påkrevd bare for openai). Alle `lib/supabase/*` bruker den -- AR-4
- [x] `lib/env.test.ts`, `lib/supabase/proxy.test.ts` -- én test per rad i I/O-matrisen, kjørt med `node --test` (Node 24 kjører TypeScript direkte) til Vitest kommer i Story 1.2 -- matrisen må være testet
- [x] `.env.example` -- alle variablene. Lokale Supabase-verdier fra `npx supabase status` hvis de er like på alle maskiner, ellers plassholder og README-steg -- NFR-3
- [x] `components.json`, `app/globals.css` -- kjør `npx shadcn@4.23.0 add button --overwrite`, se på diffen og rett etter AR-2. Sjekken står i Implementation Notes
- [x] `supabase/config.toml` -- `npx supabase init`, `project_id = "localfix"`, `enable_confirmations = false`. Egen commit: Realtime, Edge Runtime, Analytics og e-posttesting av -- AR-3, AD-11
- [x] `app/manifest.ts`, `public/icons/` -- navn, `start_url: '/'`, `display: 'standalone'`, temafarger #1F4E79/#F5F7FA, PNG-ikoner 192/512 -- AR-17
- [x] `README.md` -- Docker Desktop først, forutsetninger med versjoner, kopierbare kommandoer, nedlastingsstørrelse og -tid for første oppstart -- AR-16
- [x] `ARCHITECTURE-SPINE.md` -- Stack-tabellen får de låste versjonene -- AR-1

**Acceptance Criteria:**
- Given en ny klone, when README følges, then starter appen på `http://localhost:3000` uten egne nøkler.
- Given en besøkende, when `/`, `/noe` og `/auth/login` åpnes, then svarer ingen med redirect til innlogging.
- Given koden, when `process.env` søkes etter utenfor `lib/env.ts` og byggeresultatet, then finnes ingen treff.
- Given Docker Desktop, when `npx supabase start` kjøres, then starter Supabase uten Realtime, Edge Runtime, Analytics og e-posttesting.
- Given appen, when `/manifest.webmanifest` hentes, then har den ikoner på 192 og 512 px, og det finnes ingen service worker.

## Implementation Notes

- **Commits:** `7b34f87` startpakke, `3c12145` `supabase init`, `ead639c` tjenester av (egen commit), `fa5324b` README, `.env.example` og Stack-tabellen.
- **AR-2, shadcn:** Med startpakkens `tailwind.config: ""` ga `npx shadcn@4.23.0 add button --overwrite` Tailwind v4-klasser i `button.tsx` (`shadow-xs`, `dark:`). Den installerte også pakken `radix-ui` og feil npm-pakke `cn` med en ødelagt import. `globals.css` ble ikke endret. Rettet ved å la `components.json` peke på `tailwind.config.ts`. Da gir CLI-en en Tailwind 3-knapp, og den opprinnelige knappen er beholdt.
- **AR-2, proxy:** Regelen som sendte besøkende videre er fjernet. `getClaims()` og cookie-håndteringen er beholdt. Dekket av `lib/supabase/proxy.test.ts`, som koordinatoren la til fordi raden i matrisen bare var sjekket med curl.
- **Avvik fra spec-en:**
  - `@types/node` er låst til 24.19.2, ikke `^24`, etter regelen om eksakte versjoner.
  - TypeScript 5.9.3 og ESLint 9.39.5 er låst til siste versjon i startpakkens områder.
  - `eslint.config.mjs` er skrevet om til flat config fordi `eslint-config-next` 16 krasjet med FlatCompat.
- **Tillegg:** `instrumentation.ts` kaller `serverEnv()` ved oppstart, slik at en ugyldig `AI_PROVIDER` stopper serveren før første forespørsel. `auth-button` og `logout-button` er fjernet sammen med demoforsiden, og Geist-fonten er byttet med systemfonten (UX).
- **Supabase:** `supabase start` bruker sju bilder, ikke åtte (imgproxy starter ikke). Nedlastingen var ≈ 1,1 GB og tok ≈ 55 min på 2–5 Mbit/s. Neste oppstart tok 37 s. `public.ecr.aws` avviste GoTrue og postgres-meta med `toomanyrequests`, så de ble hentet fra Docker Hub.
- **Beholdt til Story 2.1:** `components/ui/{checkbox,dropdown-menu,badge}`, engelsk tekst på innloggingssidene og `sign-up-success`, som fortsatt ber brukeren bekrefte e-posten.
- **Verifisert:** `npm ci`, lint, `tsc --noEmit`, `npm run build`, `node --test` 5/5, `supabase start`/`status`, at innlogging virker uten e-postbekreftelse, curl mot `/`, `/noe` og `/auth/login` og manifestet. Sjekken i Chrome DevTools er ikke gjort.

## Spec Change Log

## Review Triage Log

Gjennomgang 1 (2026-11-08). Kilder: B = blind-hunter, E = edge-case-hunter, V = verification-gap.

| # | Funn | Vurdering | Begrunnelse | Rute |
|---|------|-----------|-------------|------|
| B1, E1, V-a | `app/auth/confirm/route.ts`: `next` fra spørringen går rett til `redirect()` (open redirect) | medium | Bekreftet. `redirect()` godtar absolutte URL-er og `//host`, og koden er kopiert inn i denne storyen. AR-13 krever retur bare til samme opprinnelse | patch |
| B2, E2, V-a | `confirm/route.ts`: `error.message` er ikke URL-kodet | low | Bekreftet. `&` eller `#` i meldingen kutter teksten, og retting er `encodeURIComponent` | patch |
| B2b | `type` castes til `EmailOtpType` uten sjekk | low | `verifyOtp` avviser ukjent type, og en sjekk ville lagt til en ekstra vakt. Avvist | avvist |
| B3 | `/auth/error` viser vilkårlig tekst fra URL-en | low | React escaper, så det er bare innholdsforfalskning lokalt. Rettingen krever en kodetabell (Story 2.1, `lib/errors.ts`). Avvist | avvist |
| B4a, E3 | Etter registrering sendes en innlogget bruker til «Check your email» | low | Bekreftet: `enable_confirmations = false` gir sesjon med en gang. Rettingen er én linje (`data.session ? "/" : …`) | patch |
| B4b, E4, V-c | «Forgot password» er en blindvei uten e-posttjeneste | low | Bekreftet, men siden kan bare nås ved å skrive inn adressen (forsiden har ingen lenker til `/auth`). Rettingen krever omarbeiding av innloggingsflyten, som hører til Story 2.1. Avvist og ført som åpent punkt | avvist |
| B5, E5, V-b | `additional_redirect_urls` har bare `https://127.0.0.1:3000`, men README sier `http://localhost:3000` | low | Bekreftet. Gjelder bare e-postlenker, men rettingen er én linje | patch (egen commit for `config.toml`) |
| B6 | Innloggingssidene er på engelsk | low | Beslutningen i intent beholder innloggingssidene urørt til Story 2.1. Avvist | avvist |
| B7 | Ubrukt startkode: `checkbox` med avhengighet, `./pages` og `./src` i Tailwind-`content`, engelske malkommentarer | low | `checkbox` og stiene som ikke finnes, er bekreftet ubrukte, og rettingen er sletting. `badge` (statusmerker, Story 1.4) og `dropdown-menu` (menyen, Story 2.1) beholdes. Supabase-kommentarene er nyttige advarsler og beholdes | patch (delvis) |
| B8 | Ingen `test`-skript i `package.json` | low | Bekreftet. `"test": "node --test"` er en direkte retting, og Story 1.2 bytter til Vitest | patch |
| B9a, V1 | Ingen test av gyldig openai-konfigurasjon | medium | Fra V (forhåndsverifisert). En feil i openai-grenen ville ikke blitt oppdaget | patch |
| B9b, V2 | Tom `AI_PROVIDER` gir mock, men det er ikke testet | low | Fra V (forhåndsverifisert). `||` byttet med `??` ville ikke blitt oppdaget | patch |
| V3 | «Oppstart feiler» via `instrumentation.ts` er ikke testet | medium | Fra V (forhåndsverifisert). Uten `serverEnv()` i `register()` består alle testene | patch |
| B9c | Ingen tester for ugyldig URL, lekket nøkkel eller proxyens cookie-sti | low | Utover matrisen, og cookie-stien testes ende-til-ende i Story 1.2. Avvist | avvist |
| B10a | `lib/env.ts` kaster ved import også i nettleseren | false | Manglende `NEXT_PUBLIC_*` stopper `next build` (verifisert), så en bunt med feil verdier lages ikke | avvist |
| B10b, E10 | `z.url()` godtar alle skjemaer (`ftp:`, `mailto:`) | low | Bekreftet. Rettingen er `protocol: /^https?$/` | patch |
| B10c | `serverEnv()` parser på nytt ved hvert kall | low | Ubetydelig kostnad, og ingen kaller den ofte ennå. Avvist | avvist |
| B11 | PWA: samme ikon for `maskable`, mangler iOS-metadata, temafargene er ikke i `globals.css` | low | Temaet er Story 1.4 (UX-DR1). Om ikonet beskjæres, er ikke sjekket (maybe-false, i så fall low). iOS kan likevel legge appen på hjemskjermen. Avvist | avvist |
| B12 | Proxyen kjører på `/manifest.webmanifest` | low | Bekreftet. Rettingen er ett ledd i matcheren | patch |
| B13 | `engines.node` håndheves ikke | low | Bekreftet. Rettingen er `.npmrc` med `engine-strict=true` | patch |
| B14 | Svake passordregler | low | Hører til FR-1 og Story 2.1. Avvist | avvist |
| B15 | Stack-tabellen mangler småpakker | false | Tabellen gjelder rammeverket. Alle versjonene står låst i `package.json`, så ingen regel brytes | avvist |
| E6 | `router.push('/')` uten `refresh()` etter innlogging | false | Forsiden leser ingen sesjon, og dynamiske sider bufres ikke i ruterens cache i Next 16 | avvist |
| E7, E8 | `spawnSync` i testene har ingen timeout | low | Bekreftet. Rettingen er `timeout: 30000` | patch |
| E9 | Proxytesten godtar 4xx og 5xx | low | Bekreftet. En 500 ville bestått, og rettingen er å kreve 200 | patch |
| V4 | Proxytesten står ikke i Verification i spec-en | low | Rettingen er å endre spec-en. Avvist, men `npm test` (B8) kjører begge testfilene | avvist |
| V5 | Manifestet testes bare for hånd | medium (ikke verifisert i test) | Statisk konfigurasjon. Hører hjemme i testoppsettet i Story 1.2 | defer |

Gjennomgang 2 (2026-11-08, `bmad-walkthrough` av PR #44 sammen med brukeren). Kilde: W = walkthrough.

| # | Funn | Vurdering | Begrunnelse | Rute |
|---|------|-----------|-------------|------|
| W1 | `confirm/route.ts`: sperren fra B1 slipper gjennom `next=/%09/evil.example`. Nettleseren fjerner tab og linjeskift, så `/\t/evil.example` blir `//evil.example` | medium | Bekreftet med `new URL("/\t/evil.example", origin)`, som gir `http://evil.example/`. Rettet med `lib/safe-next.ts`, som følger regelen i AD-3 (`new URL(next, origin).origin === origin`, ellers `/`) og returnerer den normaliserte stien. `lib/safe-next.test.ts` tester `//`, `/\`, `https:`, en annen port, `javascript:`, tab, linjeskift og CR. Story 2.1 kan bruke funksjonen i `requireUser` | patch |
| W2 | Med ugyldig `.env` stopper `npm run dev` (kode 1 etter ≈ 5 s), men `next start` kjører videre og svarer 500 på alle sider | low | Sett i walkthrough. Ingen side vises med feil oppsett, og README bruker `npm run dev`. Ført som åpent punkt | defer |
| W3 | `engines.node` `^24.0.0` med `engine-strict` stopper `npm ci` på Node 26, som er gjeldende LTS | low | Bevisst valg (AR-1), og README sier Node 24. Vurderes når README følges på en ny klone ved slutten av Epic 1 | defer |

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
