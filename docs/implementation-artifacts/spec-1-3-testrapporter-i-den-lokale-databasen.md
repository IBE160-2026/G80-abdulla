---
title: 'Story 1.3: Testrapporter i den lokale databasen'
type: 'feature'
created: '2026-11-08'
status: 'in-progress'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'c207c4f5e0a2b0e5eb24eb65c03666fc448f730b'
context:
  - '{project-root}/docs/implementation-artifacts/epic-1-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Databasen er tom. Lista og detaljsiden i Story 1.4 og 1.5 har ingenting å vise, og ingen regel hindrer at skjulte rapporter lekker til besøkende eller vanlige brukere (issue #24, FR-2, FR-5, FR-9).

**Approach:** Én migrering med datamodellen, lesereglene (RLS og grants) og visningen `reports_with_counts` etter AD-4, AD-5, AD-12 og AD-14. Faste, oppdiktede seed-data med innloggbare kontoer. pgTAP-tester for reglene og vakttester, genererte typer med `REPORT_COLUMNS` og norske navn, og en Vitest-test som logger inn med hver konto i README.

## Boundaries & Constraints

**Always:**
- Navn og regler står i arkitekturen (spine linje 76–160): enumene `user_role`, `report_category`, `report_status` med kodene og rekkefølgen i AD-10, kolonnene i ERD-et, `CHECK`-uttrykkene i AD-4, `ON DELETE RESTRICT`, standardverdiene i AD-12 (l.147) og visningsdefinisjonen i AD-5.
- RLS slås på, og `REVOKE ALL ... FROM anon, authenticated` kjøres i samme migrering som oppretter tabellen. Policyer sier alltid `TO anon` eller `TO authenticated`.
- Bare lesing: `anon` får SELECT på `reports` (`hidden = false`) og `confirmations` (når rapporten er synlig). `authenticated` får i tillegg sin egen rad i `profiles` og alle rapporter hvis `(SELECT private.is_moderator())`. Ingen INSERT, UPDATE, DELETE eller TRUNCATE for `anon` eller `authenticated` i denne storyen.
- Visningen får `REVOKE ALL` og så `GRANT SELECT TO anon, authenticated`.
- `private.is_moderator()` og `private.handle_new_user()` ligger i skjemaet `private`, som PostgREST ikke viser. `handle_new_user` er den eneste `security definer` i `public` og `private`, har `SET search_path = ''`, setter `role = 'user'` og leser aldri metadata. Supabase gir `EXECUTE` på nye funksjoner som standard, så det tilbakekalles eksplisitt.
- Seed kjører som `postgres`, med faste uuid-er og eksplisitte, ulike tidspunkter (ingen `now()`). Moderator får rollen med `UPDATE profiles` etter at triggeren har laget raden.
- pgTAP-hjelperne `tests.as_user(uuid)` og `tests.as_anon()` setter rolle og `request.jwt.claims`. De ligger i `supabase/tests/`, ikke i en migrering.
- `type-fest` 5.10.0 eksakt. Typene genereres med `npx supabase gen types typescript --local --schema public` og committes.

**Never:**
- Ingen skriveregler eller skrivegrants (Epic 2–4), ingen trigger `reports_guard_update` (AD-7, Epic 4), ingen `CHECK`/`UNIQUE` på `image_path`, ingen bucket og ingen seed-bilder (Story 1.6).
- Ingen sider i appen. Ingen endring i `supabase/config.toml`.
- Ingen tjenestenøkkel i appen eller testene, unntatt i seed og migrering.

**Beslutning (2026-11-08):** Spec-en beholdes samlet (≈ 3 800 tokens), fordi Story 1.3 er én issue, én branch og én PR.

**Beslutning (2026-11-08): testbrukerne.** Alle har passordet `localfix-test`, og README har en tabell med e-post, passord og rolle:
- `moderator@localfix.test` (moderator)
- `bruker1@localfix.test` og `bruker2@localfix.test` (forfattere av rapportene)
- `kjerneflyt360@localfix.test` og `kjerneflyt1280@localfix.test`, satt av til kjerneflyttesten i `endrer-360` og `endrer-1280`

**Beslutning (2026-11-08): testkommandoene.**
- `npm test` kjører `test:unit`, så `test:db`, så `test:e2e`.
- `test:unit` krever fortsatt ikke Supabase.
- `test:db` kjører `npx supabase db reset`, så `npx supabase test db` og så Vitest-prosjektet `db` (`lib/**/*.db.test.ts`).
- `db:types` genererer typene.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Besøkende leser | `anon`, en skjult rapport finnes | `reports` og visningen gir bare synlige. `authored_by_me` og `confirmed_by_me` er `false`, ikke `NULL` | Ingen feil |
| Vanlig bruker leser | `authenticated`, ikke moderator | Bare synlige rapporter, bare egen rad i `profiles` | N/A |
| Moderator leser | `moderator@localfix.test` | Alle rapporter, også skjulte | N/A |
| Bekreftelser til skjult rapport | `anon` leser `confirmations` | Ingen rader for den skjulte rapporten | N/A |
| Tom eller lang tekst | `description` `''`, `'   '` eller 1001 tegn, `summary` `''` | Avvist av `CHECK` | `23514` |
| Grensen med emoji | `description` med 1000 emoji | Godtatt, og `[...s].length` i `lib/limits.ts` gir også 1000 | N/A |
| Ny konto med falsk rolle | `raw_user_meta_data` `{"role":"moderator"}` | Profilen får `role = 'user'` | N/A |
| Skriving fra klient | `anon`/`authenticated` INSERT, UPDATE eller DELETE på en tabell | Avvist | `42501` |
| Sletting med rapporter | `postgres` sletter en bruker som har rapporter | Avvist av `ON DELETE RESTRICT` | `23503` |
| Innlogging | Hver konto i README-tabellen | `signInWithPassword` gir en sesjon | Testen navngir kontoen som feilet |

</frozen-after-approval>

## Code Map

- `supabase/migrations/` -- finnes ikke. Lag med `npx supabase migration new datamodell` (tidsstempel i navnet).
- `supabase/config.toml:67–72` -- `[db.seed] sql_paths = ["./seed.sql"]` finnes allerede. Rør ikke fila.
- Lokale fakta (CLI 2.122.1, Postgres 17.11.0.006, GoTrue 2.197.0):
  - **pgcrypto** ligger i skjemaet `extensions`. Bruk `extensions.crypt(pw, extensions.gen_salt('bf'))`.
  - **`auth.users`:** `confirmation_token`, `recovery_token`, `email_change_token_new` og `email_change` har ingen standardverdi og må settes til `''`, ellers feiler innloggingen. `confirmed_at` er GENERATED og skal ikke settes. Sett `instance_id` `'00000000-0000-0000-0000-000000000000'`, `aud` og `role` `'authenticated'`, `email_confirmed_at` og `raw_app_meta_data` `{"provider":"email","providers":["email"]}`.
  - **`auth.identities`:** `provider_id` = bruker-id som tekst, `provider 'email'`, `identity_data` med `sub`, `email` og `email_verified`. `email` er GENERATED.
  - **pgTAP** 1.3.3 installeres av `supabase test db` selv. Filene i `supabase/tests/` med `.sql` eller `.pg` kjøres som tester, hver i sin egen sesjon. Hjelperne må derfor lastes i hver fil, for eksempel med `\ir` fra en fil som ikke kjøres som test. Det er ikke verifisert, så sjekk det først, og bruk en annen delt løsning hvis det ikke virker.
  - **Supabase gir `anon`/`authenticated` alle rettigheter på nye tabeller og `EXECUTE` på nye funksjoner i `public`.** Derfor må `REVOKE` kjøres eksplisitt.
- `vitest.config.ts` -- `include: ["lib/**/*.test.ts", "playwright.config.test.ts"]`. Gjøres om til to prosjekter, `unit` og `db`. Vitest leser ikke `.env`. Bruk `loadEnvConfig` fra `@next/env`, slik `playwright.config.test.ts:36` gjør.
- `package.json:12–14` -- skriptene. `type-fest` er ikke installert.
- `lib/env.ts` -- `publicEnv` gir URL og den offentlige nøkkelen. Innloggingstesten bruker `createClient` fra `@supabase/supabase-js` med disse, ikke tjenestenøkkelen.
- `README.md:9` -- status sier at testbrukere kommer senere. `README.md:84–90` -- tabellen over testkommandoer. Det finnes ingen seksjon om testbrukere og ingen setning om personopplysninger (P-2).
- `e2e/` -- Playwright kjører allerede `db reset`. Ingen endring trengs.
- Labels (`docs/prd.md:94`, `docs/ux/DESIGN.md:120`): Søppel, Belysning, Vei og fortau, Skadeverk, Annet og Ny, Under behandling, Løst.

## Tasks & Acceptance

**Execution:**
- [x] `supabase/migrations/<ts>_datamodell.sql` -- skjemaet `private`, enumene, tabellene med standardverdier, `CHECK` og fremmednøkler, RLS, `REVOKE` og lesegrants, policyene, `private.is_moderator()`, `private.handle_new_user()` med trigger på `auth.users`, og visningen -- AR-3 til AR-7
- [x] `supabase/seed.sql` -- fem kontoer etter beslutningen, i `auth.users` og `auth.identities`. Moderatoren oppgraderes. Minst åtte rapporter fra `bruker1` og `bruker2`, i alle kategorier og statuser, med én skjult. To synlige rapporter har like mange bekreftelser (Story 3.1). Én rapport har linjeskift, en URL på over 120 tegn uten mellomrom og teksten `<b>fet</b> <script>alert(1)</script>`. `status_changed_at = created_at` for `new`, ellers senere. Ingen av kjerneflytbrukerne har rapporter eller bekreftelser -- FR-2, P-2
- [x] `supabase/tests/` -- hjelperne og tester for hver rad i matrisen som gjelder databasen. Vakttester for tabeller uten RLS, visninger uten `security_invoker` eller med mer enn SELECT, funksjoner i `public` som `anon`/`authenticated` kan kjøre (tillatelseslista er tom nå), og at `handle_new_user` er eneste `security definer` i `public`/`private`. Visningens kolonner = kolonnene i `reports` + 4. Kontrolltest: `as_user` gir riktig `auth.uid()` og `authored_by_me = true` for egen rapport -- AR-7, AD-5
- [x] `lib/supabase/database.types.ts` -- generert med `npm run db:types` -- AR-10
- [x] `lib/supabase/types.ts` -- `ReportRow` fra visningen med `MergeDeep`, så kolonnene som aldri er `NULL` blir ikke-nullbare. `REPORT_COLUMNS` er en eksplisitt liste uten `author_id` og `image_path` -- AD-5
- [x] `lib/labels.ts` -- `CATEGORY_LABELS` og `STATUS_LABELS` som `Record` nøklet på enumtypene, så en ny kode gir typefeil -- AR-10
- [x] `lib/limits.ts` + `lib/limits.test.ts` -- `DESCRIPTION_MAX` 1000, `LOCATION_MAX` 200, `SUMMARY_MAX` 300 og `charCount(s)` med `[...s].length`. Testen bruker emoji og kombinerte tegn
- [x] `lib/supabase/seed-login.db.test.ts` -- leser tabellen over testbrukere i README og logger inn med hver konto via Supabase Auth -- AC i issue #24
- [x] `vitest.config.ts`, `package.json` -- prosjektene `unit` og `db`, skriptene `test:db` og `db:types`, `test` utvidet, og `type-fest` 5.10.0
- [x] `README.md` -- status, «Testbrukere» med tabellen, P-2-setningen («v1 bruker bare oppdiktede testdata og behandler ingen personopplysninger»), og `test:db` i tabellen over kommandoer -- AR-16
- [x] `ARCHITECTURE-SPINE.md` -- Stack-tabellen: `type-fest` 5.10.0 er låst

**Acceptance Criteria:**
- Given en ny klone med Supabase i gang, when `npm test` kjøres, then består Vitest (`unit` og `db`), pgTAP og Playwright.
- Given migreringen, when visningen sammenlignes med `reports`, then er de eneste ekstra kolonnene `confirmation_count`, `seen_count`, `confirmed_by_me` og `authored_by_me`.
- Given en endring i skjemaet, when `npm run db:types` kjøres, then er `database.types.ts` lik den committede fila.

## Implementation Notes

- Migreringen er `supabase/migrations/20261108190211_datamodell.sql`. I tillegg til spec-en har den indekser på fremmednøklene `reports.author_id` og `confirmations.user_id`. `private.is_moderator()` har også `SET search_path = ''`, og `authenticated` får `USAGE` på `private` og `EXECUTE` på `is_moderator` (policyene kaller den med brukerens rettigheter). `anon` får ingen tilgang til `private`.
- `ir` virker i `supabase test db` (pg_prove 3.36). Hjelperne ligger i `supabase/tests/hjelpere.psql`, som ikke kjøres som test fordi bare `.sql` og `.pg` kjøres. Første kjøring laster ned Docker-bildet `supabase/pg_prove` (står i README).
- pgTAP: `lesing.sql` (lesereglene og kontrolltesten for `as_user`), `skriving.sql` (hele grant-matrisen i AD-12 og 42501 på INSERT, UPDATE, DELETE og TRUNCATE for anon, bruker og moderator), `begrensninger.sql` (CHECK, emoji, falsk rolle, ON DELETE RESTRICT) og `vakter.sql`. Vakttestene og grant-matrisen er sjekket ved å bryte reglene i databasen for hånd: de feilet som forventet.
- `lib/supabase/types.test.ts` sjekker med `expectTypeOf` at `REPORT_COLUMNS` er alle kolonnene i visningen unntatt `author_id` og `image_path`. Typesjekken kjøres av `npx tsc --noEmit`.
- `seed-login.db.test.ts` sjekker også rollen i brukerens egen profil mot rollekolonnen i README.
- README har fått SQL-en for å gjøre en konto til moderator (AD-12: rolle settes bare med SQL som `postgres`, i seed og README), og forventet tid for `npm test` er oppdatert til omtrent to minutter.

## Spec Change Log

## Review Triage Log

## Design Notes

Én migrering holder for hele datamodellen: tabellene, RLS og visningen hører sammen, og regelen om RLS i samme migrering er lettest å oppfylle da. Senere storyer legger til nye migreringer.

`test:db` tilbakestiller databasen før pgTAP, så testene alltid ser seed-dataene. Playwright tilbakestiller igjen etterpå. Det koster noen sekunder, men gjør rekkefølgen trygg.

## Verification

**Commands:**
- `npm run lint && npx tsc --noEmit` -- 0 feil
- `npm run test:unit` uten Supabase i gang -- består
- `npm run test:db` -- `db reset`, pgTAP og Vitest `db` består
- `npm test` -- alt består, axe 0 `serious`/`critical`
- `npm run db:types && git diff --exit-code lib/supabase/database.types.ts` -- ingen endring
