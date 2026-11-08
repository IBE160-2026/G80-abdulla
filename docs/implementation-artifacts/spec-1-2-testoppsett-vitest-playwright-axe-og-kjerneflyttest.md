---
title: 'Story 1.2: Testoppsett: Vitest, Playwright, axe og kjerneflyttest'
type: 'chore'
created: '2026-11-08'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '5d31da96ae0f67881345e19f83572063c425254c'
context:
  - '{project-root}/docs/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Repoet har bare tre `node --test`-filer og ingen nettlesertester. Sensor kan ikke se med én kommando at appen virker og er tilgjengelig, og hver senere story mangler stedet der kjerneflyttesten og axe-sjekken skal vokse (issue #23, AD-15).

**Approach:** Innfør Vitest for ren logikk og Playwright med axe i `e2e/`, med én npm-testkommando som tilbakestiller den lokale databasen, bygger, starter `next start` med `AI_PROVIDER=mock` og kjører alt. Legg hjelperne for axe, tastatur og bredde, en røyktest av forsiden, den første kjerneflyttesten og README-steget.

## Boundaries & Constraints

**Always:** Eksakte versjoner: `vitest` 5.0.5, `vite` (peer, siste 8.x), `@playwright/test` 1.65.0, `@axe-core/playwright` 4.14.0. Låsefila committes. Testkommandoen er et npm-skript som virker på Windows, macOS og Linux, uten `VAR=x` foran kommandoer. `AI_PROVIDER: 'mock'` settes i Playwright-konfigurasjonen (`webServer.env`), så en nøkkel i `.env` aldri brukes i test. `workers: 1`. Prosjektene 360×800 og 1280×800 kjører i fast rekkefølge med `dependencies`: lesetester → tester som endrer data → tester med egen `db reset`. Ingen `test.skip`, `test.fixme` eller `.only` i `e2e/`. Etter første `goto` bruker kjerneflyttesten bare `page.keyboard`. Bare `lib/env.ts` leser `process.env` i appkoden (testkonfigurasjon og `e2e/` er unntatt).

**Never:** Ingen datamodell, seed, migreringer eller pgTAP (Story 1.3). Ingen nye flater i appen. Ingen CI. Ingen endring i `supabase/config.toml`. Ingen Vitest-tester i `e2e/` og ingen Playwright-tester utenfor.

**Beslutning (2026-11-08):** `npm test` kjører alt (Vitest og deretter Playwright), fordi AD-15 krever én kommando for sensor. `npm run test:unit` og `npm run test:e2e` finnes for raske kjøringer. Supabase må kjøre (`npx supabase start`) før `npm test`, og README sier det. Testserveren bruker port 3100, så den ikke kolliderer med `npm run dev` på 3000 (`reuseExistingServer: false`).

**Beslutning (2026-11-08):** Spec-en beholdes samlet (≈ 2 900 tokens), fordi Story 1.2 er én issue, én branch og én PR.

**Beslutning (2026-11-08):** Virker ikke Vitest 5.0.5 med Next.js 16.4.5, stopper implementeringen og prosjekteieren velger versjon (AC i issue #23).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Alt i orden | Supabase kjører, `.env` finnes | `npm test`: Vitest og Playwright består, axe 0 `serious`/`critical` | N/A |
| `.env` har `AI_PROVIDER=openai` | Nøkkel i `.env` | Testserveren går i mock | N/A |
| axe-funn | Side med `serious`-brudd | Hjelperen feiler og lister regel-id og antall noder | Funn med `impact` `null`, `minor` eller `moderate` feiler ikke |
| Tab-hjelper finner ikke målet | Element mangler | Feiler etter øvre grense (standard 50 trykk) og navngir rolle og navn | N/A |
| Horisontal scrolling | `scrollWidth > clientWidth` | Testen feiler og oppgir bredden | N/A |

</frozen-after-approval>

## Code Map

- `package.json` -- `"test": "node --test"` byttes. Legg `test`, `test:unit` (`vitest run`) og `test:e2e` (`playwright test`).
- `lib/env.test.ts`, `lib/supabase/proxy.test.ts`, `lib/safe-next.test.ts` -- bruker `node:test`. `env` og `proxy` kjører koden i egne Node-prosesser med `registerHooks` for `@/`. Det må beholdes, fordi `lib/env.ts` validerer ved import. Bare test-API-et byttes til Vitest. `safe-next.test.ts` laster modulen dynamisk bare på grunn av `node --test` og kan importere `@/lib/safe-next` direkte.
- `tsconfig.json` -- `paths: { "@/*": ["./*"] }`, `include: **/*.ts`. Vitest må løse `@/` (Vite 8 `resolve.tsconfigPaths` eller `resolve.alias`).
- `app/page.tsx` -- forsiden har en `h1` og ingen fokuserbare elementer. Kjerneflyttesten sjekker overskriften og bredden.
- `app/manifest.ts`, `public/icons/icon-{192,512}.png` -- grunnlag for den utsatte manifesttesten (`deferred-work.md`, V5 i Story 1.1).
- `lib/env.ts` -- `next build` feiler uten `NEXT_PUBLIC_*`. Next leser `.env` selv. Ikke dupliser variablene i konfigurasjonen.
- `.gitignore` -- dekker allerede `test-results/` og `playwright-report/`.
- `README.md` §«Kom i gang» (linje 11–90) -- en ny seksjon «Kjør testene» etter «Stopp og start igjen».
- `ARCHITECTURE-SPINE.md` §Stack (linje 204–206) -- Vitest, Playwright og axe merkes «låst», og `vite` legges til.

## Tasks & Acceptance

**Execution:**
- [x] `package.json`, `package-lock.json` -- installer de fire pakkene med eksakte versjoner og legg til skriptene -- AR-14
- [x] `vitest.config.ts` -- `environment: 'node'`, `include: ['lib/**/*.test.ts']`, alias `@/` -- én plass for ren logikk
- [x] `lib/*.test.ts`, `lib/supabase/proxy.test.ts` -- over til Vitest (`test`/`expect` fra `vitest`). `safe-next.test.ts` importerer `@/lib/safe-next` direkte, og én test importerer `NextRequest` fra `next/server` i Vitest-prosessen. Det er prøvetesten for at Vitest virker med Next.js -- AC 1
- [x] `playwright.config.ts` -- `testDir: 'e2e'`, `workers: 1`, `webServer` med `npx supabase db reset`, `next build` og `next start -p 3100` i den rekkefølgen, `env: { AI_PROVIDER: 'mock' }`, `timeout` som tåler et kaldt bygg. Fem prosjekter: `les-360`/`les-1280` (`e2e/les/**`), `endrer-360`/`endrer-1280` (`core-flow.spec.ts`, `e2e/endrer/**`, avhenger av begge `les`) og `reset` (`e2e/reset/**`, avhenger av begge `endrer`, 1280×800, tomt nå) -- AD-15
- [x] `e2e/a11y.ts` -- `expectNoSeriousA11yViolations(page)` med taggene i AD-15, filtrerer bare `serious` og `critical` -- NFR-8
- [x] `e2e/keyboard.ts` -- `tabTo(page, role, name, { max = 50 })`: trykker Tab til elementet med rolle og navn har fokus, sjekker at det er synlig, og feiler etter `max` -- AC 2
- [x] `e2e/layout.ts` -- `expectNoHorizontalScroll(page)` med `scrollWidth <= clientWidth` på `document.documentElement` -- NFR-1
- [x] `e2e/les/forside.spec.ts` -- forsiden svarer 200, har `h1` «LocalFix · Campus Molde», og axe er grønn -- røyktesten
- [x] `e2e/les/manifest.spec.ts` -- manifestet har ikoner på 192 og 512 px, og hver `src` svarer 200 med `image/png` -- lukker V5
- [x] `e2e/les/keyboard.spec.ts` -- `tabTo` testes på `page.setContent` med tre knapper: finner riktig knapp, og feiler med god melding når den mangler -- hjelperen har ingen flate å bruke ennå
- [x] `e2e/core-flow.spec.ts` -- `goto('/')`, så bare tastatur. Sjekker overskriften, axe og (i `*-360`) bredden på 360 og 320 px -- AR-14
- [x] `README.md` -- «Kjør testene»: Docker og Supabase må kjøre, `npx playwright install chromium`, `npm test`, de to raske skriptene og forventet tid -- AR-16
- [x] `ARCHITECTURE-SPINE.md` -- Stack-tabellen får de låste versjonene -- AR-1
- [x] `docs/implementation-artifacts/deferred-work.md` -- marker V5-oppføringen som løst i Story 1.2

**Acceptance Criteria:**
- Given en ny klone med Supabase i gang og `.env`, when README følges og `npm test` kjøres, then består Vitest og Playwright i begge prosjektene, og utskriften viser antall bestått.
- Given `e2e/`, when `git grep -nE "test\.(skip|fixme|only)" -- e2e` kjøres, then finnes ingen treff.
- Given Playwright-kjøringen, when rekkefølgen leses i rapporten, then kjører `les-*` før `endrer-*` og `reset` sist.

## Implementation Notes

- **Versjoner:** `vitest` 5.0.5, `vite` 8.3.6 (siste 8.x, 2026-11-05), `@playwright/test` 1.65.0 og `@axe-core/playwright` 4.14.0, eksakte devDependencies. Vitest 5.0.5 virker med Next.js 16.4.5: prøvetesten i `lib/supabase/proxy.test.ts` importerer `NextRequest` i Vitest-prosessen. Det trengs derfor ingen versjonsbeslutning.
- **`@/` i Vitest:** `resolve.tsconfigPaths: true` i Vite 8. En vanlig `resolve.alias` for `"@/"` løste ikke stiene.
- **`--configLoader runner`** står i `test` og `test:unit`. Uten flagget skriver Vite 8 et varsel ved hver kjøring, fordi `vitest.config.ts` bruker ESM og `package.json` ikke har `"type": "module"`. Alternativet var å kalle fila `vitest.config.mts`.
- **Prosjektene:** fem, ikke seks. Opptellingen i oppgaven var feil, mens prosjektlista var riktig.
- **Kjerneflyttesten** trykker ingen taster ennå, fordi forsiden ikke har noe som kan få fokus. 320 px sjekkes bare i `endrer-360`, med en vanlig `if`, siden `test.skip` ikke er lov.
- **Matrisen (lagt til av koordinatoren etter revisjonen):**
  - `playwright.config.test.ts` (Vitest, lagt til i `include`) sjekker at `webServer.env.AI_PROVIDER` er `mock`, og at `@next/env` ikke overstyrer en verdi fra miljøet med `AI_PROVIDER=openai` fra `.env`.
  - `e2e/les/helpers.spec.ts` sjekker at axe-hjelperen feiler på `image-alt (critical): 1 noder` og ikke feiler på `html-xml-lang-mismatch` (`moderate`). Den sjekker også at breddehjelperen feiler med bredden og godtar en side som får plass. Testen for `moderate` krever først at axe faktisk finner bruddet. `server-side-image-map` (`minor`) ble prøvd først, men axe 4.14 rapporterer den ikke. `impact` `null` og `minor` er ikke laget som egne sider. Filteret sammenligner bare med `serious` og `critical`.
- **`npx playwright install chromium`** kan avslutte med kode 0 selv om nedlastingen av `chrome-headless-shell` ble brutt. Da sier `npm test` at `chrome-headless-shell.exe` mangler. README sier at kommandoen da må kjøres på nytt.
- **Verifisert av koordinatoren:**
  - `npm run lint` og `npx tsc --noEmit` er rene.
  - `npm test` (exit 0, 57 s) ga Vitest 16/16 og Playwright 18/18, med alle `les-*` før `endrer-*`. `reset` har ingen tester ennå.
  - `git grep` finner ingen `skip`/`fixme`/`only` og ingen `process.env` utenfor `lib/env.ts`.
  - `PUBLISHABLE_KEY` fra `npx supabase status` er lik verdien i `.env.example`.
- **Etter gjennomgangen (`e7cdaf4`):**
  - `npm run lint` og `npx tsc --noEmit` er rene.
  - `npm test` (exit 0, 62 s) ga Vitest 19/19 og Playwright 22/22, med `les-*` (10 + 10) før `endrer-*` (1 + 1).
- **Ny klone (AC 1, B12):** `git clone --branch story/1-2-testoppsett` til en tom mappe, så stegene i README: `npm ci` (39 s), `cp .env.example .env`, `npx supabase start`, `npx playwright install chromium` og `npm test`. Exit 0 etter 71 s, med Vitest 19/19 og Playwright 22/22. Docker-bildene og Chromium lå allerede på maskinen, så første nedlasting er ikke målt på nytt.
- **Ikke gjort:** ingenting er kjørt på macOS eller Linux.

## Spec Change Log

## Review Triage Log

Gjennomgang 1 (2026-11-08). Kilder: B = blind-hunter, E = edge-case-hunter, V = verification-gap.

| # | Funn | Vurdering | Begrunnelse | Rute |
|---|------|-----------|-------------|------|
| V1 | Rekkefølgen `les` → `endrer` → `reset` (AC 3) har ingen test | medium | Fra V (forhåndsverifisert). Fjernes `dependencies`, består alle testene | patch |
| V2, E3 | En spec i `e2e/` som ingen `testMatch` treffer, kjører aldri, og ingenting sier fra | medium | Bekreftet: hvert prosjekt har egen `testMatch`, så `e2e/rapportliste.spec.ts` ville blitt hoppet over. Senere storyer legger til filer her | patch |
| V3, E10 | 320 px-grenen avhenger av at bredden er nøyaktig 360 | low | Bekreftet. Rettingen er å bruke prosjektnavnet | patch |
| B1 | Matriseraden gjelder `serious`, men bare `critical` er testet. `null` og `minor` er ikke testet | low | `serious` er bekreftet og rettes med en `color-contrast`-test. `null` og `minor` avvises: filteret sammenligner bare med to verdier, og en egen ren funksjon ville gitt mer kode | patch (delvis) |
| B2, E4 | `tabTo` kaster en strict mode-feil når to elementer har samme rolle og navn | medium | Bekreftet: `toBeFocused()` på en lokator med flere treff bryter strict mode. Lista i Story 1.4 kan få like navn | patch |
| B2b | Standardverdien `max = 50` og synlighetssjekken i `tabTo` er ikke testet | low | Liten sjanse for feil, og rettingen ville gitt flere tester uten ny dekning av logikk. Avvist | avvist |
| B3 | `test.skip`/`test.fixme` og «bare tastatur» i kjerneflyttesten sjekkes bare for hånd | medium | Bekreftet: `forbidOnly` fanger bare `.only`. Regelen gjelder hver senere story | patch (skannetest i Vitest) |
| B4 | `@next/env` importeres uten å være oppført i `package.json` | low | Bekreftet: pakken finnes bare fordi `next` henter den. Rettingen er én eksakt devDependency | patch |
| B5 | Sjekken for `process.env` dekker ikke rotfilene | false | `git grep` over alle `*.ts`/`*.mjs` utenom `lib/env.ts`, testene og testkonfigurasjonen gir ingen treff. Rettingen ville dessuten vært å endre spec-en | avvist |
| B6 | Kommentaren i `vitest.config.ts` og README sier at Vitest bare kjører `lib/` | low | Bekreftet etter at `playwright.config.test.ts` kom med. Rettingen er bare tekst | patch |
| B7 | `epic-1-context.md` sier fortsatt at `npm test` kjører `node --test` | low | Bekreftet. Rettingen er én linje i en fil som kan redigeres fritt | patch |
| B8 | Spec-en står som `in-review`, mens `sprint-status.yaml` står som `in-progress` | false | Steg 5 i arbeidsflyten setter storyen til `review`, så avviket finnes bare mellom stegene | avvist |
| B9 | Kommentaren sier at `&&`-kjeden virker i PowerShell | low | Bekreftet: Windows PowerShell 5.1 har ikke `&&`. Playwright kjører kommandoen i `cmd.exe`. Rettingen er bare tekst | patch |
| B10 | Manifesttesten leser ikke pikselstørrelsen i PNG-en og sjekker ikke `<link rel="manifest">` | low | Next legger inn lenken selv fra `app/manifest.ts`, og ikonene er laget med riktig størrelse. Liten sjanse for feil, og rettingen ville gitt mer kode. Avvist | avvist |
| B11 | Ingen ende-til-ende-test viser at testserveren går i mock | low | Mekanismen er dekket av konfigurasjonstesten og testen av `@next/env`. Det finnes ingen KI-flate å se dette på før Story 2.3. Avvist | avvist |
| B12 | AC 1 (ny klone) er ikke verifisert | medium | Bekreftet. Koordinatoren følger README på en ny klone etter rettingene | patch (verifisering) |
| B13 | Hjelpetestene kjører i begge breddene og trenger et helt bygg | low | Det koster noen sekunder. Et eget prosjekt ville gjort konfigurasjonen mer komplisert. Avvist | avvist |
| B14, E7 | Breddesjekken ser bare på `document.documentElement`, ikke på `overflow-x: hidden` eller rullebokser | low | Stemmer, men NFR-1 gjelder scrolling av hele siden, og forsiden har ingen slike elementer. Regelen om lange ord i Story 1.5 bør testes direkte der. Avvist | avvist |
| B15 | Kjerneflyttesten kjører ikke axe på 320 px | low | Bekreftet. Rettingen er ett kall til | patch |
| B16 | `test` gjentar flaggene fra `test:unit` | low | Bekreftet. Rettingen er `npm run test:unit && npm run test:e2e` | patch |
| B17a | Tallene i dokumentene stemmer ikke (61 mot 57 s, «minst 13») | low | 61 s og 57 s er to ulike målinger, og README sier «omtrent ett minutt». «Minst 13» står i spec-en, og funn som må rettes i spec-en, avvises | avvist |
| B17b | axe-meldingen viser ikke hvilke elementer som feiler | low | Bekreftet. Rettingen er å legge til selektorene i samme linje | patch |
| E1 | Vitest har 5 s som standard tidsgrense, og testene som starter egne prosesser, kan bruke lengre tid | low | Den tregeste testen brukte 471 ms. Liten sjanse for feil. Avvist | avvist |
| E2 | `testMatch` sammenlignes med full sti, så en mappe som heter `les`, `endrer` eller `reset` et sted i stien, gir feil prosjekt | low | Bekreftet i `createFileMatcher`, som setter `**/` foran mønsteret. Rettingen er å starte mønstrene med `e2e/` | patch |
| E5 | `tabTo` går en hel runde når målet allerede har fokus | low | Liten sjanse for feil, og rettingen krever en ekstra gren. Avvist | avvist |
| E6 | `max` på 0, negativ eller `NaN` gir en villedende melding | low | Bare testkode kaller hjelperen, med faste verdier. Rettingen krever en vakt. Avvist | avvist |
| E8 | axe-funn i `incomplete` med alvorlighet `serious` blir ignorert | false | AD-15 sier at testen skal feile på `violations` etter `analyze()`. `incomplete` er funn axe ikke kan avgjøre, og de skal sjekkes for hånd | avvist |
| E9 | Testen av `.env` består selv om `.env` aldri ble lest (ingen positiv kontroll) | medium | Bekreftet: `AI_PROVIDER` er `mock` uansett. Rettingen er en kontrollvariabel i samme `.env` | patch |
| E11 | `sizes` kan være en liste med mellomrom, og da feiler manifesttesten | low | Bekreftet etter manifest-spesifikasjonen. Rettingen er `split` | patch |
| E12 | Kjerneflyttesten kaller `setViewportSize`, `evaluate` og axe etter `goto` | false | AD-15 forbyr `click`, `focus`, `fill` og `goto`. Målinger og endring av vindusstørrelse er ikke brukerinput | avvist |

## Design Notes

`db reset` ligger i `webServer.command`, ikke i `globalSetup`, så rekkefølgen reset → build → start er garantert av én kjede med `&&`. Den virker i `cmd`, PowerShell og sh. Port 3100 gjør at en åpen `npm run dev` ikke blir testet ved et uhell.

Kjerneflyttesten ligger i `endrer`-prosjektene allerede nå, fordi den skal endre data fra Story 2.2. Da slipper vi å flytte den senere.

## Verification

**Commands:**
- `npm run lint && npx tsc --noEmit` -- 0 feil
- `npm run test:unit` -- alle Vitest-testene består (minst 13)
- `npx playwright install chromium && npm test` (Supabase i gang) -- alt består, axe 0 `serious`/`critical`
- `git grep -n "process.env" -- app lib components ':!lib/env.ts' ':!*.test.ts'` -- ingen treff

**Manual checks:**
- `npx playwright show-report`: rekkefølgen er `les` → `endrer` → `reset`, og begge viewportene kjørte.
