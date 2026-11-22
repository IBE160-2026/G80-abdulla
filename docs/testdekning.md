# Testdekning

Tabellen viser hvilke tester som dekker hvert krav i [PRD-en](prd.md): FR-1–FR-9 (§4), NFR-1–NFR-8 (§7) og SM-1–SM-7 (§10). Kolonnen «Sjekket for hånd» sier hva som ikke er automatisert. «Hull» betyr at kravet, eller en del av det, ikke har en automatisk test. Er det sjekket for hånd i stedet, står det i samme celle. Alle testene unntatt `npm run eval:sm5` kjøres med `npm test` (se [README](../README.md#kjør-testene)).

Sist oppdatert 2026-11-22, i Story 4.3.

## Testtypene

| Type | Hvor | Kjøres med | Trenger |
| --- | --- | --- | --- |
| Vitest, ren logikk og komponenter | `features/**/*.test.ts`, `shared/**/*.test.ts`, `app/**/*.test.ts`, `evals/sm5/*.test.ts` og oppsettet i `playwright.config.test.ts` og `vitest.config.test.ts` | `npm run test:unit` | Bare Node |
| pgTAP, reglene i databasen | `supabase/tests/*.sql` | `npm run test:db` (`npx supabase test db`) | Lokal Supabase |
| Vitest mot lokal Supabase (REST, Auth og Storage) | `features/**/*.db.test.ts` | `npm run test:db` | Lokal Supabase |
| Playwright, i 360 og 1280 px, med axe | `e2e/les/`, `e2e/endrer/`, `e2e/core-flow.spec.ts` | `npm run test:e2e` | Lokal Supabase og Chromium |
| Playwright med egne data, også ytelsestesten | `e2e/reset/` | `npm run test:e2e` (prosjektet `reset`) | Lokal Supabase og Chromium |
| SM-5, KI-leverandøren mot testsettet | `evals/sm5/run.eval.ts` | `npm run eval:sm5` | En leverandør i `.env` (ikke en del av `npm test`) |

`npm test` kjører de fem første radene. axe (`e2e/a11y.ts`) feiler testen ved funn med alvorlighet `serious` eller `critical`, og `e2e/layout.ts` feiler ved horisontal scrolling.

## Funksjonelle krav

| Krav | Kort | Automatiske tester | Sjekket for hånd |
| --- | --- | --- | --- |
| FR-1 | Registrering og innlogging. Uten innlogging kan man bare lese | `e2e/endrer/registrering.spec.ts`, `e2e/les/innlogging.spec.ts`, `e2e/endrer/ny-rapport.spec.ts` og `e2e/endrer/bekreft.spec.ts` (besøkende sendes til innlogging), `features/auth/signup-role.db.test.ts` (ny konto får `user`), `features/auth/seed-login.db.test.ts`, `features/auth/auth-errors.test.ts`, `features/auth/safe-next.test.ts` | – |
| FR-2 | Moderatorrolle, kontrollert på serveren | `features/moderering/status.db.test.ts` (bruker får 403 via REST), `supabase/tests/status.sql`, `supabase/tests/testdata.sql` (moderatorkontoen), `features/moderering/actions.test.ts`, `e2e/endrer/status.spec.ts` (panelet bare for moderatoren) | – |
| FR-3 | Registrere rapport med beskrivelse, lokasjon, kategori og valgfritt bilde | `e2e/endrer/ny-rapport.spec.ts`, `e2e/endrer/bilde.spec.ts`, `features/registrering/report-input.test.ts`, `features/registrering/reports-insert.db.test.ts`, `features/registrering/image-input.test.ts`, `features/registrering/image-process.test.ts`, `features/registrering/storage.db.test.ts`, `supabase/tests/skriving.sql`, `supabase/tests/begrensninger.sql` | – |
| FR-4 | KI-forslag for kategori og oppsummering, med reserve | `e2e/endrer/ki-forslag.spec.ts`, `features/registrering/ai/index.test.ts`, `features/registrering/ai/mock.test.ts`, `features/registrering/ai/openai.test.ts`, `features/registrering/ai/validate.test.ts`, `features/registrering/suggest-trigger.test.ts` | Ekte leverandør: se SM-5 |
| FR-5 | Rapportliste og detaljside, skjulte bare for moderatoren | `supabase/tests/lesing.sql`, `e2e/les/forside.spec.ts`, `e2e/les/detalj.spec.ts`, `e2e/les/detalj-innlogget.spec.ts`, `features/rapporter/queries.test.ts`, `features/rapporter/components/report-card.test.ts` | – |
| FR-6 | Filtrering, «Mine rapporter» og sortering | `e2e/les/filter.spec.ts`, `e2e/les/mine.spec.ts` (hver kombinasjon på seed-dataene), `features/rapporter/list-params.test.ts`, `e2e/reset/liste.spec.ts` (tom database) | – |
| FR-7 | Bekrefte en annens rapport, én gang | `supabase/tests/bekreftelser.sql`, `features/bekreftelser/bekreftelser.db.test.ts`, `e2e/endrer/bekreft.spec.ts`, `e2e/les/bekreft-tilstander.spec.ts`, `features/bekreftelser/actions.test.ts`, `features/bekreftelser/confirm-state.test.ts` | – |
| FR-8 | Endre status ett steg om gangen, med «Sist oppdatert» | `e2e/endrer/status.spec.ts`, `supabase/tests/status.sql`, `features/moderering/status.db.test.ts`, `features/moderering/status-steps.test.ts`, `features/moderering/actions.test.ts`, `e2e/les/detalj.spec.ts` («Sist oppdatert») | – |
| FR-9 | Skjule og vise en rapport, uten sletting | `e2e/endrer/skjul.spec.ts`, `features/moderering/status.db.test.ts`, `supabase/tests/status.sql`, `supabase/tests/lesing.sql`, `supabase/tests/bilder.sql` (bildet til en skjult rapport), `e2e/les/detalj-innlogget.spec.ts` | – |

## Ikke-funksjonelle krav

| Krav | Kort | Automatiske tester | Sjekket for hånd |
| --- | --- | --- | --- |
| NFR-1 | Kjerneflyten uten horisontal scrolling på mobil, nettbrett og desktop | `e2e/core-flow.spec.ts` (360, 320 og 1280 px), breddesjekken (`e2e/layout.ts`) i `e2e/les/` (`bekreft-tilstander`, `detalj`, `filter`, `forside`, `innlogging`, `mine`) og `e2e/endrer/` (`bekreft`, `bilde`, `ki-forslag`, `ny-rapport`, `registrering`, `skjul`, `status`), `e2e/les/helpers.spec.ts` (selve sjekken) | **Hull:** ingen automatisk test i nettbrettbredde. Sjekket én gang 2026-11-22 med et engangsskript på 768 og 1024 px: lista med og uten filter, detaljsiden (også som moderator), skjemaet, innlogging og registrering hadde ingen horisontal scrolling |
| NFR-2 | Kjørbar for sensor etter README, uten nøkler og betalte kontoer | `features/auth/seed-login.db.test.ts` (testbrukerne i README kan logge inn), `shared/lib/env.test.ts` (mock uten nøkkel, og feilen peker til README), `supabase/tests/testdata.sql`, `.github/workflows/npm-test.yml` (README-stegene på en ny Ubuntu-kjører hos GitHub, der Docker finnes fra før og Chromium installeres med `--with-deps`. Kjøres ved push til `ci/**` eller startet for hånd) | Se SM-7 |
| NFR-3 | Ingen nøkler i repoet, `.env.example` har alle variablene | `shared/lib/env.test.ts` (variablene valideres ved oppstart) | `.env` og `.env.*` står i `.gitignore`. **Hull:** ingen automatisk søk etter nøkler i repoet, og ingen test som sammenligner `.env.example` med variablene i `shared/lib/env.ts` |
| NFR-4 | Rettighetsreglene håndheves i databasen | `supabase/tests/skriving.sql`, `supabase/tests/vakter.sql` (hele skjemaet), `supabase/tests/lesing.sql`, `supabase/tests/bekreftelser.sql`, `supabase/tests/status.sql`, `supabase/tests/bilder.sql`, REST-testene i `features/**/*.db.test.ts` | – |
| NFR-5 | Installerbar som PWA | `e2e/les/manifest.spec.ts` (manifest og ikoner) | **Hull:** å legge appen til på hjemskjermen på en telefon er ikke prøvd |
| NFR-6 | Lista med 100 rapporter under 2 sekunder lokalt | `e2e/reset/liste.spec.ts` | – |
| NFR-7 | Ingen betalte tjenester, språkmodellen har gratisnivå | **Hull:** ingen automatisk test | Alt kjører lokalt i Docker, og KI-en er i mock-modus uten nøkkel. SM-5 ble kjørt på gratisnivået til Cloudflare Workers AI (2026-11-18) |
| NFR-8 | WCAG 2.2 AA: ingen alvorlige axe-funn, og kjerneflyten bare med tastatur | `e2e/core-flow.spec.ts` (hele flyten med tastatur og axe ved hvert steg), axe (`e2e/a11y.ts`) i `e2e/les/` (`bekreft-tilstander`, `detalj`, `detalj-innlogget`, `filter`, `forside`, `innlogging`, `mine`), `e2e/endrer/` (`bekreft`, `bilde`, `ki-forslag`, `ny-rapport`, `registrering`, `skjul`, `status`) og `e2e/reset/` (`bilde-mangler`, `liste`), `e2e/les/helpers.spec.ts`, `e2e/les/keyboard.spec.ts` | **Hull:** axe finner bare en del av WCAG-bruddene, og appen er ikke testet med skjermleser |

## Suksessmetrikker

| Krav | Kort | Automatiske tester | Sjekket for hånd |
| --- | --- | --- | --- |
| SM-1 | Registrere en rapport, med eller uten bilde, og se den i lista | `e2e/endrer/ny-rapport.spec.ts`, `e2e/endrer/bilde.spec.ts`, `e2e/core-flow.spec.ts` | – |
| SM-2 | En annen bruker bekrefter én gang, og nytt forsøk avvises | `supabase/tests/bekreftelser.sql`, `features/bekreftelser/bekreftelser.db.test.ts` (409), `e2e/endrer/bekreft.spec.ts` | – |
| SM-3 | Bare moderatoren endrer status og skjuler, og andre ser endringen | `features/moderering/status.db.test.ts`, `supabase/tests/status.sql`, `e2e/endrer/status.spec.ts` (UJ-3: rapportøren ser Løst), `e2e/endrer/skjul.spec.ts` | – |
| SM-4 | Filtrering og sortering gir forventet resultat på testdataene | `e2e/les/filter.spec.ts`, `e2e/les/mine.spec.ts` | – |
| SM-5 | KI-en treffer minst 16 av 20 på testsettet | `evals/sm5/testset.test.ts` (20 beskrivelser, fire per kategori), `evals/sm5/score.test.ts`, `evals/sm5/report.test.ts`, `evals/sm5/language.test.ts`, `evals/sm5/run-helpers.test.ts` | `npm run eval:sm5` mot leverandøren, for hånd fordi den trenger en nøkkel: Cloudflare Workers AI med `gpt-oss-20b` traff 19 av 20 (2026-11-18, se README) |
| SM-6 | Rapporten kan registreres når KI er av eller ikke svarer | `e2e/endrer/ki-forslag.spec.ts` (ingen forslag og feil i kallet), `features/registrering/ai/index.test.ts` (tidsavbrudd etter 5 s) | – |
| SM-7 | En som ikke kjenner prosjektet, starter appen etter README på en ren maskin | `.github/workflows/npm-test.yml` (README-stegene og `npm test` på en ny Ubuntu-kjører hos GitHub. Den har Docker fra før og installerer Chromium med `--with-deps`, så den viser ikke alt en sensor må installere selv. Kjøres ved push til `ci/**` eller startet for hånd) | README fulgt steg for steg på en ny klone i en tom mappe i Story 4.3. Resultatet står i PR-en som lukker issue #39 |
