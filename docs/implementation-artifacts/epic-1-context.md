# Epic 1 Context: Alle kan se rapportene på campus

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

En besøkende åpner appen, ser lista over testrapportene og kan åpne en detaljside med status, bilde, «N har sett dette» og «sist oppdatert». Epicen legger grunnmuren for hele LocalFix: startpakken, lokal Supabase i Docker, testoppsettet med kjerneflyttest og axe, datamodellen med leseregler og faste, oppdiktede seed-data, og en spike som avklarer bildereglene før Epic 2 bygger opplasting. Appen skal kunne startes lokalt etter README, i mock-modus og uten nøkler, betalte tjenester eller skytjenester.

## Stories

- Story 1.1: Startpakke og lokal Supabase
- Story 1.2: Testoppsett: Vitest, Playwright, axe og kjerneflyttest
- Story 1.3: Testrapporter i den lokale databasen
- Story 1.4: Rapportlista
- Story 1.5: Detaljsiden
- Story 1.6: Bildespike: reglene for bilder er testet
- Story 1.7: Bilder på detaljsiden og i lista

## Requirements & Constraints

- **Lesing for alle:** Alle (også uten innlogging) ser synlige rapporter. Hver rad viser kategori, `summary ?? description`, status og «har sett dette», og lenker til en detaljside med alle feltene. Skjulte rapporter vises bare for moderator. En ny rapport viser 1.
- **Kjørbar for sensor:** Appen startes etter README uten gruppens nøkler. Lokal database og bildelagring har testdata, og KI-en er i mock-modus uten nøkkel. Ingen nøkler i repoet, `.env.example` lister alle variablene, `.env` står i `.gitignore`.
- **Installerbar:** `app/manifest` gir PWA-installasjon, uten service worker eller offline-støtte.
- **Ytelse:** Lista med 100 rapporter lastes på under 2000 ms mot `next start` (egen fixture i `e2e/`, rører aldri `supabase/seed.sql`).
- **Personvern i testdata:** Testbrukere og rapporttekster er oppdiktet, seed-bilder viser ingen ansikter eller lesbare bilskilt (tatt selv eller CC0, med kilde), og README sier at v1 ikke behandler personopplysninger. Appen sender aldri `author_id`, `user_id` eller `image_path` til nettleseren, og en Playwright-test sjekker at seed-forfatterens uuid ikke er i lista eller RSC-nyttelasten.
- **Definisjon av ferdig (hver story):** Issue, egen branch, PR med `Closes #N`. Playwright, pgTAP og Vitest består, axe uten `serious`/`critical`-funn, `e2e/core-flow.spec.ts` utvidet bare med tastatur og uten `test.skip`/`test.fixme`, ingen horisontal scrolling på 360 og 320 px. PR-en har sammendraget fra testkommandoen. Regelendringer føres i dokumentet og `docs/beslutninger/` i samme PR.

## Technical Decisions

- **Paradigme:** Databasestyrt, servergjengitt monolitt. Postgres (RLS, grants, triggere, visning) eier alle regler. Sider leser i Server Components, ingen egne REST-ruter. Supabase-klienter opprettes bare i `lib/supabase/` (`server` med cookie-sesjon; `client` bare i innloggingsskjemaene). `components/` importerer verken `lib/supabase/` eller `lib/ai/`. Tjenestenøkkelen brukes bare i seed og migrering.
- **Startpakke (AD-2):** Next.js-eksempelet `with-supabase` (App Router, `@supabase/ssr` med cookies, shadcn/ui, Tailwind, `proxy.ts`). Den har ingen låsefil og bruker `latest`: låsefil committes ved første installasjon, og Stack-tabellen i arkitekturen oppdateres til de låste versjonene. Tailwind 3.4.x beholdes. `proxy.ts` fornyer bare sesjonen og sender aldri besøkende til innlogging.
- **Stack (bekreftet mot npm 2026-10-28):** Next.js 16.4.3, React 19.3.1, `@supabase/supabase-js` 2.118.0, `@supabase/ssr` 0.12.7, Supabase CLI 2.122.1 (eksakt devDependency, `npx supabase`; 3.0.0 er ikke verifisert), `type-fest` 5.10.0, PostgreSQL 17, shadcn CLI 4.23.0, Zod 4.6.7, Vitest 5.0.5, `@playwright/test` 1.65.0, `@axe-core/playwright` 4.14.0, Node.js 24 LTS (`engines.node` `^24.0.0` og `.nvmrc`), Docker Desktop påkrevd.
- **Mappestruktur:** `app/`, `components/`, `lib/` (`supabase/`, `ai/`, `labels.ts`, `limits.ts`, `format.ts`, `list-params.ts`, `env.ts`, `errors.ts`), `proxy.ts`, `supabase/` (`config.toml`, `migrations/`, `seed.sql`, `seed-images/`, `tests/`), `e2e/`, `evals/sm5/`, `.env.example`, `README.md`.
- **Lokalt miljø (AD-11):** Supabase CLI + Docker. `enable_confirmations = false`. `supabase/config.toml` endres bare i en egen commit. Alle miljøvariabler valideres i `lib/env.ts`, ingen andre filer leser `process.env`. `AI_PROVIDER=mock|openai`, mock er standard uten nøkkel.
- **Datamodell (AD-4):** `profiles`, `reports`, `confirmations`. Enumer: `waste, lighting, roads_sidewalks, vandalism, other` / `new, in_progress, resolved` (rekkefølgen er kontrakt) / `user, moderator`. Alt `NOT NULL` unntatt `reports.summary` og `reports.image_path` (`NULL`, aldri tom streng). Lengde-`CHECK`: `description` ≤ 1000, `location` ≤ 200, `summary` ≤ 300, delt med `lib/limits.ts` som teller med `[...s].length`. `ON DELETE RESTRICT`. `handle_new_user` er eneste `security definer` (`SET search_path = ''`, `role = 'user'` hardkodet). `status_changed_at` `DEFAULT now()`, `CHECK (status_changed_at >= created_at)`.
- **Visningen `reports_with_counts` (AD-5):** `security_invoker = true`, alle kolonner i `reports` pluss `confirmation_count`, `seen_count` (= +1), `confirmed_by_me`, `authored_by_me` (de to siste `coalesce(..., false)`). Lista og detaljsiden leser bare herfra. `lib/supabase/types.ts` overstyrer nullbarhet med `MergeDeep` og eksporterer `REPORT_COLUMNS`. Typer genereres med `supabase gen types` til `lib/supabase/database.types.ts`; norske navn bare i `lib/labels.ts`.
- **Leseregler (AD-12, AD-14):** RLS og `REVOKE ALL ... FROM anon, authenticated` i samme migrering som oppretter tabellen. Policyer navngir rolle (`TO anon`, `TO authenticated`). Moderator = `private.is_moderator()` (`STABLE`, `SECURITY INVOKER`), rolle aldri fra JWT. Ingen DELETE/TRUNCATE-grant. pgTAP med `tests.as_user(uuid)`/`tests.as_anon()`, inkludert vakttester for manglende RLS, `security_invoker` og visningens kolonnesett.
- **Seed (AD-11):** Kjører som `postgres`, faste uuid-er, ulike eksplisitte `created_at`, `status_changed_at = created_at` for `new`. `moderator@localfix.test`, brukerkontoer, alle kategorier og statuser, minst én skjult rapport og noen bekreftelser.
- **Ingen cache (AD-13):** Sider som leser visningen er `force-dynamic`. Ingen `'use cache'`, `unstable_cache` eller `fetch`-cache. Bilder med `<img>` eller `next/image` med `unoptimized`. Svar med signerte lenker: `Cache-Control: private, no-store`.
- **Bilder (AD-6, AD-9, `[PROVISIONAL]`):** Privat bucket `report-images` (5 MB, JPEG/PNG/WebP), sti `<author_id>/<uuid>.<ext>`, `UNIQUE (image_path)` og `CHECK` på forfattermappen. Storage-SELECT slår opp rapporten via `image_path` under RLS; ingen UPDATE/DELETE. Bildet vises bare på detaljsiden via én signert lenke (60 s, `createSignedUrl`) fra én serverfunksjon; lista viser bare et ikon. Ikke bekreftet i dokumentasjonen: spiken avgjør, ellers velger prosjekteieren reserven.
- **Formater:** `timestamptz` i UTC, vist i `Europe/Oslo` bare via `lib/format.ts`. Ugyldig, skjult eller manglende id gir `notFound()` (Zod-validert først). Logging bare `console`, aldri rapporttekst eller e-post.
- **Tester (AD-15):** Playwright i `e2e/`, prosjekter 360×800 og 1280×800, `workers: 1`. Én npm-testkommando (virker på Windows/macOS/Linux): `npx supabase db reset`, `next build`, `next start`, `AI_PROVIDER=mock` satt i Playwright-konfigurasjonen. `e2e/a11y.ts` med `AxeBuilder.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])`. README har `npx playwright install chromium`.

## UX & Interaction Patterns

- Tema overstyrer shadcn: `primary` #1F4E79, `background` #F5F7FA, `surface` #FFFFFF, `foreground` #17212B, `muted-foreground` #5B6773, `border` #DCE2E8. Statusmerker Ny #E3EEF9/#1F4E79, Under behandling #FFF1D6/#7A4B00, Løst #E2F3E6/#1E6B34, Skjult #EEF0F2/#5B6773. Bare lys modus, systemfont.
- Mobile-first, én kolonne, 16 px marg, maks 640 px sentrert, trykkflater ≥ 44 px. Radius 6/8/12 px, merker helt runde. Kort har kantlinje, ikke skygge.
- Topplinja: «LocalFix · Campus Molde». «←» og nettleserens tilbakeknapp gjør det samme.
- Rapportkort: hele kortet én lenke, kategori venstre, statusmerke (alltid med tekst) høyre, `summary ?? description` maks to linjer, metadata «N har sett dette · 2 dager siden», bildeikon (lucide `Image`, 16 px, `aria-label="Har bilde"`) sist.
- Rapporttekst vises alltid som ren tekst; lange ord brytes uten horisontal scrolling. 404-siden er «Fant ikke rapporten.» med lenke tilbake.
- Tone: du-form, kort og saklig, ingen utropstegn eller emoji (unntatt ✓).

## Cross-Story Dependencies

- Docker Desktop må være installert og `docker run hello-world` virke før Story 1.1.
- 1.1 → 1.2 → 1.3 → 1.4 → 1.5; testoppsettet (1.2) må finnes før flater bygges, og hver flate-story utvider kjerneflyttesten og axe-sjekken.
- Story 1.4 fyller Playwright-prosjektet for ytelsestesten. Menyen kommer i Story 2.1, knappen «Registrer problem» i Story 2.2.
- Story 1.6 (spiken) må være ferdig og AD-6/AD-9 satt til `[ADOPTED]`, eller reserven valgt i `docs/beslutninger/`, før Story 1.7 og bildeopplastingen i Epic 2 (som også må fjerne EXIF).
- To seed-brukere settes av til kjerneflyttesten, én per Playwright-prosjekt; tester som endrer data bruker egne rapporter og brukere.
