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

- **Lesing for alle:** Alle, også uten innlogging, ser synlige rapporter. Hver rad viser kategori, `summary ?? description`, status og «har sett dette», og lenker til en detaljside med alle feltene. Skjulte rapporter vises bare for moderator. En ny rapport viser 1.
- **Kjørbar for sensor:** Appen startes etter README uten gruppens nøkler. Lokal database og bildelagring har testdata, og KI-en går i mock-modus uten nøkkel. Ingen nøkler i repoet, `.env.example` lister alle variablene, `.env` står i `.gitignore`.
- **Installerbar:** `app/manifest` gir PWA-installasjon, uten service worker eller offline-støtte.
- **Ytelse:** Lista med 100 rapporter lastes på under 2000 ms mot `next start` (egen fixture i `e2e/`, rører aldri `supabase/seed.sql`). Lista henter høyst 500 rader og sier fra når den er avkortet.
- **Personvern:** Testbrukere og rapporttekster er oppdiktet. Seed-bilder viser ingen ansikter eller lesbare bilskilt (tatt selv eller CC0, med kilde), og README sier at v1 ikke behandler personopplysninger. Appen sender aldri `author_id`, `user_id` eller `image_path` til nettleseren, og en Playwright-test sjekker at seed-forfatterens uuid ikke er i siden eller RSC-nyttelasten.
- **Definisjon av ferdig (hver story):** Issue, egen branch, PR med `Closes #N`. Playwright, pgTAP og Vitest består, axe uten `serious`/`critical`-funn, `e2e/core-flow.spec.ts` utvidet bare med tastatur og uten `test.skip`/`test.fixme`, ingen horisontal scrolling på 360 og 320 px. PR-en har sammendraget fra testkommandoen (bestått og axe-funn). Regelendringer føres i planleggingsdokumentet og `docs/beslutninger/` i samme PR. Siste story i epicen følger README på en ny klone.

## Technical Decisions

- **Paradigme:** Databasestyrt, servergjengitt monolitt. Postgres (RLS, grants, triggere, visning) eier alle regler, og appen filtrerer aldri på `hidden` selv. Sider leser i Server Components, ingen egne REST-ruter. Supabase-klienter opprettes bare i `lib/supabase/` (`server` med cookie-sesjon; `client` bare i innloggingsskjemaene). `components/` importerer verken `lib/supabase/` eller `lib/ai/`. Tjenestenøkkelen brukes bare i seed og migrering.
- **Stack (låst i Story 1.1, eksakte versjoner, ingen `latest`):** Next.js 16.4.5, React 19.3.1, `@supabase/supabase-js` 2.119.0, `@supabase/ssr` 0.12.7, Supabase CLI 2.122.1 (eksakt devDependency, `npx supabase`; 3.x brukes ikke), PostgreSQL 17 (`supabase/postgres:17.11.0.006`), Tailwind 3.4.19, Zod 4.6.7, TypeScript 5.9.3, ESLint 9.39.5 med `eslint-config-next` 16.4.5, Node 24 LTS (`engines.node` `^24.0.0`, `.nvmrc`). Låses av storyen som installerer dem: Vitest 5.0.5, `@playwright/test` 1.65.0, `@axe-core/playwright` 4.14.0, `type-fest` 5.10.0. shadcn kjøres med `npx shadcn@4.23.0`, og `components.json` må peke på `tailwind.config.ts`, ellers lager CLI-en Tailwind v4-komponenter.
- **Startpakke og miljø:** Fra `with-supabase`. `proxy.ts` fornyer bare sesjonen og sender aldri besøkende til innlogging. Alle miljøvariabler valideres i `lib/env.ts`, ingen andre filer leser `process.env`. `AI_PROVIDER=mock|openai`, mock er standard. `supabase/config.toml` (`enable_confirmations = false`) endres bare i en egen commit. `cacheComponents` er av, fordi den ikke tillater `force-dynamic`.
- **Datamodell:** `profiles`, `reports`, `confirmations`. Enumer: `waste, lighting, roads_sidewalks, vandalism, other` / `new, in_progress, resolved` (rekkefølgen er kontrakt) / `user, moderator`. Alt `NOT NULL` unntatt `reports.summary` og `reports.image_path` (`NULL`, aldri tom streng). `CHECK` for ikke-tom tekst og lengde: `description` ≤ 1000, `location` ≤ 200, `summary` ≤ 300, med samme grenser i `lib/limits.ts`, som teller med `[...s].length`. `ON DELETE RESTRICT`, ingen sletting. `handle_new_user` er eneste `security definer` (`SET search_path = ''`, `role = 'user'` hardkodet). `status_changed_at` har `DEFAULT now()` og `CHECK (status_changed_at >= created_at)`.
- **Visningen `reports_with_counts`:** `security_invoker = true`, alle kolonner i `reports` pluss `confirmation_count`, `seen_count` (= antall + 1, den eneste telleren UI viser), `confirmed_by_me` og `authored_by_me` (begge `coalesce(..., false)`). Lista og detaljsiden leser bare herfra med eksplisitte kolonner (`REPORT_COLUMNS` i `lib/supabase/types.ts`, som også overstyrer nullbarhet med `MergeDeep`). Typer genereres med `supabase gen types` til `lib/supabase/database.types.ts`; norske navn bare i `lib/labels.ts`. Visningen lages på nytt i samme migrering som endrer `reports`.
- **Leseregler:** RLS og `REVOKE ALL ... FROM anon, authenticated` i samme migrering som oppretter tabellen. Policyer navngir rolle: én `TO anon` (`hidden = false`) og én `TO authenticated` (`hidden = false OR (SELECT private.is_moderator())`). `private.is_moderator()` er `STABLE`, `SECURITY INVOKER`, og rollen leses aldri fra JWT. Ingen DELETE/TRUNCATE-grant. pgTAP med `tests.as_user(uuid)`/`tests.as_anon()`, pluss vakttester for manglende RLS, `security_invoker`, funksjoner som `anon`/`authenticated` kan kjøre, og visningens kolonnesett.
- **Seed:** Kjører som `postgres`. Faste uuid-er, ulike eksplisitte `created_at`, `status_changed_at = created_at` for `new`. `moderator@localfix.test`, minst to brukere, alle kategorier og statuser, minst én skjult rapport, noen bekreftelser og én rapport med linjeskift, et svært langt ord og HTML-lignende tekst. Seed-kontoene må kunne logge inn via Supabase Auth.
- **Ingen cache:** Sider som leser visningen eller lager signerte lenker er `force-dynamic`. Ingen `'use cache'`, `unstable_cache` eller `fetch`-cache. Bilder med `<img>` eller `next/image` med `unoptimized`. Svar med signerte lenker har `Cache-Control: private, no-store`.
- **Bilder (`[PROVISIONAL]` til spiken):** Privat bucket `report-images` (5 MB, JPEG/PNG/WebP), sti `<author_id>/<uuid>.<ext>`, `UNIQUE (image_path)` og `CHECK` på forfattermappen. Storage-SELECT slår opp rapporten via `image_path` under RLS; INSERT bare i egen mappe; ingen UPDATE/DELETE. Bildet vises bare på detaljsiden via én 60-sekunders signert lenke (`createSignedUrl`) fra én serverfunksjon; lista viser bare et ikon som serveren regner ut. Feiler spiken, velger prosjekteieren reserven: en server-eid modul som signerer etter at rapporten er lest med brukerens sesjon.
- **Formater og feil:** `timestamptz` i UTC, vist i `Europe/Oslo` bare via `lib/format.ts` (`Intl.DateTimeFormat('nb-NO')`). Ugyldig, skjult eller manglende id gir `notFound()`, med Zod-validering før databasekall. Logging bare `console`, aldri rapporttekst eller e-post.
- **Tester:** Playwright i `e2e/`, prosjekter 360×800 og 1280×800, `workers: 1`, kjørt i fast rekkefølge med `dependencies` (lesetester, så tester som endrer data, så tester med egen `db reset`). Én npm-testkommando som virker på Windows/macOS/Linux: `npx supabase db reset`, `next build`, `next start`, med `AI_PROVIDER=mock` satt i Playwright-konfigurasjonen. `e2e/a11y.ts` bruker `AxeBuilder.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])` og feiler bare på `serious`/`critical`. Kjerneflyttesten bruker bare `page.keyboard` etter første side, med en Tab-hjelper som leter etter rolle og navn (med øvre grense), og sjekker `scrollWidth <= clientWidth`. README har `npx playwright install chromium`.

## UX & Interaction Patterns

- Tema overstyrer shadcn: `primary` #1F4E79, `background` #F5F7FA, `surface` #FFFFFF, `foreground` #17212B, `muted-foreground` #5B6773, `border` #DCE2E8. Statusmerker Ny #E3EEF9/#1F4E79, Under behandling #FFF1D6/#7A4B00, Løst #E2F3E6/#1E6B34, Skjult #EEF0F2/#5B6773. Bare lys modus, systemfont (`title` 20/600, `card-title` 15/600, `body` 16/400, `meta` 13/400, `badge` 12/600).
- Mobile-first, én kolonne, 16 px marg, maks 640 px sentrert, trykkflater ≥ 44 px. Radius 6/8/12 px, merker helt runde. Kort har kantlinje, ikke skygge.
- Topplinja: «LocalFix · Campus Molde». «←» og nettleserens tilbakeknapp gjør det samme.
- Rapportkort: hele kortet én lenke, kategori venstre, statusmerke (alltid med tekst) høyre, `summary ?? description` maks to linjer, metadata «N har sett dette · 2 dager siden», bildeikon (lucide `Image`, 16 px, `aria-label="Har bilde"`) sist. Under ett minutt, eller litt fram i tid, vises som «nå».
- Lista: fire Skeleton-kort mens den laster; tom database gir «Ingen rapporter ennå. Har du sett noe som bør fikses?».
- Detaljsiden: «Sist oppdatert 4. november kl. 14:20» under statusmerket. Mangler bildeobjektet, vises ingen bilde. 404 er «Fant ikke rapporten.» med lenke tilbake.
- Rapporttekst vises alltid som ren tekst; linjeskift bevares på detaljsiden, og lange ord brytes uten horisontal scrolling.
- Tone: du-form, kort og saklig, ingen utropstegn eller emoji (unntatt ✓).

## Cross-Story Dependencies

- Story 1.1 er ferdig: startpakke, låste versjoner, `lib/env.ts`, lokal Supabase og manifest finnes. `npm test` kjører foreløpig `node --test` (testene for `lib/env.ts` og proxyen); Story 1.2 innfører Vitest og den samlede testkommandoen, og de eksisterende testene må fortsatt kjøre.
- 1.2 → 1.3 → 1.4 → 1.5: testoppsettet må finnes før flater bygges, og hver flate-story utvider kjerneflyttesten og axe-sjekken. Virker ikke Vitest 5 med Next.js, velger prosjekteieren versjon og fører det i `docs/beslutninger/` og Stack-tabellen.
- Story 1.3 setter av to seed-brukere til kjerneflyttesten, én per Playwright-prosjekt; tester som endrer data bruker egne rapporter og brukere.
- Story 1.4 fyller Playwright-prosjektet for ytelsestesten. Menyen kommer i Story 2.1, knappen «Registrer problem» i Story 2.2.
- Story 1.6 må være ferdig og AD-6/AD-9 satt til `[ADOPTED]`, eller reserven valgt i `docs/beslutninger/`, før Story 1.7 og bildeopplastingen i Epic 2 (som også må fjerne EXIF).
