# Teknisk verifisering: ARCHITECTURE-SPINE.md (LocalFix), runde 2

Uavhengig reviewer. Sjekket 2026-11-06 (npm-registeret kl. 11:29 UTC). Spinen er ikke endret. Metode: `npm view` mot registeret, typefilene i de publiserte pakkene (`npm pack`), utgivelsesnotatet for Supabase CLI via GitHubs API og tre sider i Supabase-dokumentasjonen. Punkter som ble løst i forrige runde (`review-tech-verification.md`, 2026-10-28) gjentas ikke. Docker er fortsatt ikke installert, så ingenting er kjørt mot en database.

## Konklusjon

Det som ble lagt til 2026-11-06 holder i hovedsak: `@playwright/test` 1.65.0 og `@axe-core/playwright` 4.14.0 er gjeldende versjoner, peer-avhengighetene går opp, og filtrering på `serious` og `critical` lar seg gjøre etter `analyze()`. `auth.uid()` virker i en visning med `security_invoker`, men gir `NULL` for anonyme, så `authored_by_me` blir `NULL` og ikke `false` slik formelen i AD-5 står. Utenfor endringene er det største avviket at Supabase CLI fikk ny major (3.0.0) 2026-11-02, og den er nå `latest` på npm.

## Oversikt

| # | Punkt | Status |
|---|-------|--------|
| 1 | AD-15: versjoner og peer-avhengigheter | Bekreftet (L4) |
| 2 | AD-15: filtrere axe-funn på `serious` og `critical` | Bekreftet, gjøres etter `analyze()` (L3) |
| 3 | AD-5: `auth.uid()` i visning med `security_invoker` | Virker (slutning). `NULL` for anonyme er bekreftet i dokumentasjonen |
| 4 | AD-5: `authored_by_me` og `confirmed_by_me` er «false for anonyme» | **Avvik** (H1) |
| 5 | AD-5 og AD-10: `NOT NULL` på visningskolonner | **Avvik**, de genererte typene blir nullable (M1) |
| 6 | Stack-tabellen mot npm | Supabase CLI har ny major (H2), ellers bare patch- og minor-drift (L1) |
| 7 | AD-9: opprydding med `remove()` etter feilet innsending | **Avvik** (M2) |
| 8 | AD-15: gjentatte kjøringer og nettlesere | Mangler i spinen (M3) |
| 9 | Rettigheter for `createSignedUrl` og anonyme | Ikke bekreftet |
| 10 | shadcn CLI 4.x mot Tailwind 3.4 | Delvis bekreftet (L7) |
| 11 | Vitest 5 mot Next.js | Ikke sjekket på nytt, lav risiko |

## Funn

### Kritisk

Ingen.

### Høy

#### H1. AD-5: `authored_by_me` blir `NULL` for anonyme, ikke `false`

Spinen sier `authored_by_me boolean NOT NULL (author_id = auth.uid(), false for anonyme)` og `confirmed_by_me boolean NOT NULL (false for anonyme)`.

Bevis: Supabase skriver at `auth.uid()` «returns `null`» når forespørselen ikke har en innlogget bruker, og at `auth.uid() = user_id` «will silently fail for unauthenticated users» fordi `null = user_id` aldri er sant. Dokumentasjonen anbefaler `auth.uid() IS NOT NULL AND auth.uid() = user_id`. Kilde: https://supabase.com/docs/guides/database/postgres/row-level-security. I en `WHERE` betyr det at raden faller bort. Som kolonne i en visning betyr det at verdien er `NULL`.

`auth.uid()` virker inne i visningen. Postgres setter visningen inn i spørringen til den som kaller, og funksjonen leser JWT-claims som PostgREST har satt for forespørselen. `security_invoker = true` bestemmer bare hvilken rolle som sjekkes mot tabellene og RLS under visningen. Supabase-dokumentasjonen omtaler ikke `auth.uid()` i visninger, så dette er utledet fra mekanismen. Beviset blir pgTAP-testene med `tests.as_user` og `tests.as_anon`.

`confirmed_by_me` har samme felle, og spinen gir ingen formel for den. Med `LEFT JOIN` gir `bool_or(c.user_id = auth.uid())` `NULL` også for en innlogget bruker på en rapport uten bekreftelser, fordi raden fra `LEFT JOIN` har `c.user_id = NULL`.

Følger: «Mine rapporter» virker fortsatt, siden `NULL` ikke er `true`, og `if (row.authored_by_me)` blir usann. Men kontrakten «`NOT NULL`, `false` for anonyme» stemmer ikke. En pgTAP-test som sjekker `false` feiler, og kode som sjekker `=== false` eller filtrerer på `false` mister radene.

Fiks i AD-5:

- `authored_by_me`: `coalesce(r.author_id = auth.uid(), false)`. Alternativt `r.author_id IS NOT DISTINCT FROM auth.uid()`, som gir `false` for anonyme fordi `author_id` er `NOT NULL`.
- `confirmed_by_me`: `coalesce(bool_or(c.user_id = auth.uid()), false)` eller `count(c.user_id) FILTER (WHERE c.user_id = auth.uid()) > 0`.
- pgTAP: test `is(authored_by_me, false)` og `is(confirmed_by_me, false)` som anonym, og som innlogget bruker på en rapport uten bekreftelser. `is()` i pgTAP sammenligner med `IS NOT DISTINCT FROM`, så `NULL` blir fanget.

#### H2. Supabase CLI: `latest` er nå 3.0.0, en ny major

Spinen sier Supabase CLI 2.122.0.

Bevis: `npm view supabase dist-tags` gir `latest: 3.0.0` og `v2.stable: 2.122.1`, begge publisert 2026-11-02. Utgivelsesnotatet (https://github.com/supabase/cli/releases/tag/v3.0.0) sier: «v3 is a major release. Commands that can run locally now target your local stack by default ... deprecated commands, flags, config keys and the bundled `supabase-go` binary are gone.» `gen types` uten mål genererer nå fra den lokale databasen, `--local` «does nothing and warns», og en `config.toml` som fortsatt har `[inbucket]` gjør at `start`, `stop`, `status` og `db`-kommandoene feiler (gjelder prosjekter laget med CLI eldre enn 2.108.0).

Hvorfor det betyr noe: AD-2 låser bare pakker som står i `package.json`. Står ikke CLI-en der, får sensor 3.x via `npx supabase` og trolig også via Scoop, mens forrige verifisering av `test db`, `seed buckets` og `objects_path` ble gjort mot v2. README-kommandoene er også ulike. I v2 trengs `gen types typescript --local`, mens Supabase-dokumentasjonen nå viser `npx supabase gen types typescript > database.types.ts` uten flagg.

Fiks: Legg `supabase` inn som eksakt devDependency og skriv alle README-kommandoer som `npx supabase ...`. Velg major i Stack-tabellen. Anbefalt for v1 er `2.122.1` (`v2.stable`), fordi 3.0.0 er fire dager gammel og all verifisering så langt er gjort mot v2. Velger dere 3.x, les migreringsguiden (https://supabase.com/docs/guides/local-development/cli/migrating-to-v3, lenket fra utgivelsesnotatet, ikke hentet), sjekk at `config.toml` bruker `[local_smtp]`, og kjør `start`, `db reset`, `test db` og `gen types` før tabellen oppdateres. v3 har også en eksperimentell `supabase start --runtime native` uten Docker. Den bør ikke brukes i v1, og Docker-kravet i AD-11 står.

### Middels

#### M1. AD-5 og AD-10: `NOT NULL` på visningskolonner håndheves ikke, og de genererte typene blir nullable

En visning i Postgres har ingen `NOT NULL`-begrensninger. Supabase skriver at «a view's column may show up as nullable when you expect it to be `not null`», og viser en overstyring med `MergeDeep` fra `type-fest`, som krever `strictNullChecks: true`. Kilde: https://supabase.com/docs/guides/api/rest/generating-types.

Følge: Radtypen for `reports_with_counts` får trolig `seen_count: number | null` og tilsvarende for de andre kolonnene. Da skriver komponentene `seen_count ?? 1` eller `!`, og det bryter regelen «Grensesnittet viser bare `seen_count` og regner aldri selv». `NOT NULL` i AD-5 er dermed noe spørringen lover, ikke noe databasen eller typene sikrer.

Fiks:

1. Skriv visningen slik at kolonnene aldri kan bli `NULL` (se H1). `count()` gir aldri `NULL`.
2. Legg til én fil, for eksempel `lib/supabase/types.ts`, som eksporterer `Database = MergeDeep<DatabaseGenerated, ...>` der kolonnene i `reports_with_counts` som er `NOT NULL` i kontrakten, er markert som ikke-null. Skriv i AD-10 at appen importerer typene derfra, og at fila bare overstyrer nullbarhet. Ny devDependency: `type-fest` (5.10.0 på npm 2026-11-06).

#### M2. AD-9: oppryddingen etter en feilet innsending virker ikke sammen med AD-6

AD-9 sier at bildet lastes opp først og slettes hvis opprettelsen av rapporten feiler, og at DELETE er tillatt for eieren når ingen rad i `reports` har denne `image_path`. AD-6 gir SELECT bare på bilder som hører til synlige rapporter.

Postgres bruker SELECT-policyen også ved DELETE når setningen leser kolonner i `WHERE` eller `RETURNING` (tabellen «Policies Applied by Command Type» på https://www.postgresql.org/docs/current/sql-createpolicy.html, ikke hentet i denne runden). Storage-API-et sletter rader i `storage.objects` med `WHERE` på `name` (antatt fra Storage-kildekoden, ikke sjekket i denne runden). Etter en feilet innsetting finnes ingen rapport som peker på bildet, så SELECT nektes, og `remove()` sletter 0 rader uten å melde feil. Supabase-referansen for `remove()` er ikke bekreftet (se Ikke bekreftet), så funnet er utledet og må bekreftes med en pgTAP-test.

Felle hvis noen retter dette med SELECT for eieren: underspørringen «ingen rad i `reports`» kjører under RLS for den som spør, og forfatteren ser ikke sin egen skjulte rapport. Da får forfatteren slette bildet til en rapport som moderator har skjult.

Fiks (anbefalt): Fjern oppryddingen og DELETE-policyen fra AD-9 og AD-12. En fil uten rapport kan ingen lese (AD-6), så lokalt koster den bare plass. Skriv det inn i AD-9 som akseptert. Alternativ: SELECT og DELETE for eieren, men bare hvis forfatteren også får lese sine egne skjulte rapporter. Det endrer tolkningen av FR-9 og må avgjøres av prosjekteieren. Legg i begge tilfeller inn en pgTAP-test for at forfatteren av en skjult rapport ikke kan slette bildet.

#### M3. AD-15: testene endrer seed-dataene og trenger nedlastede nettlesere

Kjerneflyt-testen bekrefter, registrerer, endrer status og skjuler. Neste kjøring mot samme database får `already_confirmed`, `invalid_status_step` eller `stale_state`. Playwright kjører testfiler i parallell som standard. `npm install` henter ikke nettleserne. Det gjør `npx playwright install` (https://playwright.dev/docs/browsers, ikke hentet i denne runden).

Fiks: Kommandoen i README kjører `npx supabase db reset` før `playwright test`, eller gjør det i `globalSetup`. Kjerneflyt-testen kjører seriell (`test.describe.configure({ mode: 'serial' })`) eller med `workers: 1`. Oppstartsdelen i README får `npx playwright install chromium`. `webServer` i `playwright.config.ts` starter Next.

### Lav

#### L1. Versjonsdrift i Stack-tabellen

| Pakke | Spinen | npm 2026-11-06 | Publisert |
|---|---|---|---|
| `next` | 16.4.3 | 16.4.5 | 2026-11-03 |
| `react` | 19.3.1 | 19.3.1 | |
| `@supabase/supabase-js` | 2.118.0 | 2.119.0 | 2026-11-04 |
| `@supabase/ssr` | 0.12.7 | 0.12.7 | |
| `supabase` (CLI) | 2.122.0 | 3.0.0 (`latest`), 2.122.1 (`v2.stable`) | 2026-11-02 |
| `tailwindcss` | 3.4.x | 3.4.19 (`v3-lts`), 4.3.4 (`latest`) | 2025-12-10 og 2026-11-02 |
| `shadcn` | 4.23.0 | 4.23.0 | 2026-10-27 |
| `zod` | 4.6.7 | 4.6.7 | |
| `vitest` | 5.0.5 | 5.1.0 | 2026-11-02 |
| `@playwright/test` | 1.65.0 | 1.65.0 | 2026-11-05 |
| `@axe-core/playwright` | 4.14.0 | 4.14.0 | 2026-10-15 |
| Node.js | 24.19.0 | 24.22.2 (LTS «Krypton»), 26.13.0 (LTS «Lithium») | 2026-10-27 og 2026-10-28 |

Fiks: Ingen tall trenger endres før oppstart, siden AD-2 skriver inn de låste versjonene. Startpakkens `^3.4.1` gir 3.4.19. Startpakkens `typescript: "^5"` blir på 5.x selv om `latest` på npm er 7.0.2, og det bør beholdes i v1. Oppdater Node på maskinen til siste 24.x.

#### L2. Node-gulvet steg med AD-15

`@axe-core/playwright` 4.14.0 krever Node `>=22.12.0`. Vitest 5 krever `^22.12.0 || ^24.0.0 || >=26.0.0`, så Node 23 og 25 er utelukket. Spinen oppgir bare versjonen på utviklermaskinen. Fiks: `engines.node` i `package.json` lik kravet til Vitest, `.nvmrc` med `24`, og «Node 24 LTS» i README ved siden av Docker.

#### L3. AxeBuilder har ikke filter på alvorlighet

Typene i 4.14.0 har `include`, `exclude`, `options`, `withRules`, `withTags`, `disableRules`, `setLegacyMode` og `analyze(): Promise<AxeResults>`. I axe-core er `impact?: ImpactValue`, der `ImpactValue` er `'minor' | 'moderate' | 'serious' | 'critical' | null`. Filtreringen må altså gjøres på resultatet, og det er enkelt.

Fiks: Én hjelper i `e2e/` som kjører `new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()` og feiler på `violations.filter(v => v.impact === 'serious' || v.impact === 'critical')`. Taggene knytter testen til WCAG 2.2 AA i NFR-8 og holder `best-practice`-regler utenfor. Filtrer på de to verdiene og ikke med `!== 'minor'`, fordi `impact` kan være `null`. Legg hele resultatet ved testrapporten (`testInfo.attach`), så moderate funn også synes.

#### L4. Peer-avhengighetene for AD-15 er i orden, men 1.65.0 er ny

`@axe-core/playwright` 4.14.0 har peer `playwright-core >= 1.0.0` og avhengigheten `axe-core ~4.14.0`. `@playwright/test` 1.65.0 drar inn `playwright` 1.65.0, som drar inn `playwright-core` 1.65.0, så peeren er dekket. `next` 16.4.3 har valgfri peer `@playwright/test ^1.51.1`. `@playwright/test` 1.65.0 ble publisert dagen før denne sjekken. Fiks: ingen. Feiler noe ved oppstart, gå tilbake til siste 1.64.x.

#### L5. Visningen mangler i rettighetsmatrisen

`reports_with_counts` står ikke i AD-12. Supabase gir som standard rettigheter til `anon` og `authenticated` på nye relasjoner i `public`, også visninger (Supabase-standard, ikke sjekket i denne runden). Med `GROUP BY` kan visningen ikke skrives til, så det lekker ikke noe, men matrisen sier at alt som ikke står der er forbudt. Fiks: Legg til en rad (SELECT for `anon` og `authenticated`), la migreringen gjøre `REVOKE ALL` før `GRANT SELECT`, og avgrens pgTAP-sjekken for RLS til tabeller (`relkind = 'r'`), siden en visning ikke kan ha RLS. `r.*` i en visning utvides når visningen opprettes, så en ny kolonne i `reports` krever at visningen lages på nytt i samme migrering.

#### L6. Ordlyd i AD-6

«kjører under innsetterens RLS» bør bli «kjører under RLS for den som spør». Det er leserens rettigheter som avgjør om rapporten er synlig, ikke rettighetene til den som lastet opp.

#### L7. shadcn 4.23.0 mot Tailwind 3.4: delvis bekreftet

Pakken har egen kode for Tailwind v3: `i.tailwindVersion==="v3"&&(!i?.tailwindConfigFile||!i?.tailwindCssFile)?...fail()`. CLI-en oppdager altså v3 og krever at `tailwind.config` og CSS-fila finnes, og startpakken har begge. Ikke bekreftet: at `add` henter v3-varianter av komponentene. Fiks: Kjør `npx shadcn@4.23.0 add button` rett etter oppstart og sjekk at `globals.css` ikke får v4-syntaks (`@import "tailwindcss"`, `@theme`). Feiler det, bruk komponentene som følger med startpakken, eller lås en eldre shadcn-versjon (hvilken er ikke bekreftet).

## Ikke bekreftet

- Hvilken rettighet `createSignedUrl`, `createSignedUrls` og `remove()` krever på `storage.objects`, og hvordan det går for anonyme. Referansesiden https://supabase.com/docs/reference/javascript/storage-from-createsignedurl ble hentet, men viste ikke rettighetsavsnittet. Et søk på supabase.com feilet og ble ikke gjentatt. Fiks som før: én pgTAP-test per tilfelle ved første bygg.
- At en policy på `storage.objects` kan slå opp `reports` via `image_path`: fortsatt bare kjent fra praksis (uendret fra forrige runde).
- At `auth.uid()` virker i visningen gjennom PostgREST: utledet fra mekanismen, ikke dokumentert for visninger (H1).
- Vitest 5 mot Next.js: ikke sjekket på nytt. Lav risiko, siden spinen bare bruker Vitest til ren logikk og et REST-skript i Node-miljø. Vitest 5 har `vite ^6.4 || ^7 || ^8` som peer, og Next bruker ikke Vite.
- Alt som krever kjøring, siden Docker ikke er installert.

## Bevis

npm, 2026-11-06 kl. 11:29 UTC:

```text
$ npm view <pakke> dist-tags
next                   latest 16.4.5
react                  latest 19.3.1
@supabase/supabase-js  latest 2.119.0
@supabase/ssr          latest 0.12.7
supabase               latest 3.0.0, v2.stable 2.122.1, beta 3.1.0-beta.26
tailwindcss            latest 4.3.4, v3-lts 3.4.19
shadcn                 latest 4.23.0
zod                    latest 4.6.7
vitest                 latest 5.1.0, V4 4.1.12
@playwright/test       latest 1.65.0
@axe-core/playwright   latest 4.14.0
axe-core               latest 4.14.0
typescript             latest 7.0.2

$ npm view @axe-core/playwright@4.14.0 peerDependencies dependencies engines
{ "peerDependencies": { "playwright-core": ">= 1.0.0" },
  "dependencies": { "axe-core": "~4.14.0" },
  "engines": { "node": ">=22.12.0" } }

$ npm view @playwright/test@1.65.0 dependencies engines
{ "dependencies": { "playwright": "1.65.0" }, "engines": { "node": ">=20" } }

$ npm view playwright@1.65.0 dependencies
{ "playwright-core": "1.65.0" }

$ npm view next@16.4.3 peerDependencies engines
peerDependencies inkluderer "@playwright/test": "^1.51.1"; engines { "node": ">=20.9.0" }

$ npm view vitest@5.0.5 peerDependencies engines
"vite": "^6.4.0 || ^7.0.0 || ^8.0.0"; engines { "node": "^22.12.0 || ^24.0.0 || >=26.0.0" }

$ npm view type-fest version
5.10.0
```

Typefiler fra `npm pack`, pakket ut i en midlertidig mappe:

```text
@axe-core/playwright@4.14.0  dist/index.d.ts
18:    include(selector: SerialFrameSelector): this;
19:    exclude(selector: SerialFrameSelector): this;
20:    options(options: RunOptions): this;
21:    withRules(rules: string | string[]): this;
22:    withTags(tags: string | string[]): this;
23:    disableRules(rules: string | string[]): this;
24:    setLegacyMode(legacyMode?: boolean): this;
25:    analyze(): Promise<AxeResults>;

axe-core@4.14.0  axe.d.ts
5:  type ImpactValue = 'minor' | 'moderate' | 'serious' | 'critical' | null;
159:    impact?: ImpactValue;
```

Node-utgivelser (https://nodejs.org/dist/index.json): v26.13.0 2026-10-28 lts=Lithium, v24.22.2 2026-10-27 lts=Krypton.

Nettsider:

- https://supabase.com/docs/guides/database/postgres/row-level-security (hentet): `auth.uid()` gir `null` uten innlogget bruker, og `security_invoker` krever Postgres 15 eller nyere.
- https://supabase.com/docs/guides/api/rest/generating-types (hentet): visningskolonner kan bli nullable, eksempel med `MergeDeep`, og `npx supabase gen types typescript > database.types.ts`.
- https://github.com/supabase/cli/releases/tag/v3.0.0 (via GitHubs API): brytende endringer i v3.
- https://supabase.com/docs/reference/javascript/storage-from-createsignedurl (hentet): rettighetsavsnittet ble ikke funnet på siden.
