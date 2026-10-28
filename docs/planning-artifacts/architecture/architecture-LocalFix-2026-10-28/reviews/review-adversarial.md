# Adversarial review: ARCHITECTURE-SPINE.md (LocalFix)

Reviewer stance: adversary. For every finding, two units (developers or agents) each obey every AD to the letter and still end up incompatible, or an attacker exploits a gap the letter of the ADs allows. Proposed AD wording is in Norwegian so it can be pasted into the spine.

Reviewed: `ARCHITECTURE-SPINE.md` (draft, 2026-10-28) against `prd.md` (final).

## Verdict

The paradigm is right (database owns the rules), but the spine names the rules and not the policies. It never states which role may SELECT/INSERT/UPDATE/DELETE on each table and on `storage.objects`, so a "compliant" build can leave INSERT on `reports` and `profiles` wide open, can let the author of a hidden report confirm it, and can ship a list view that omits reports with zero confirmations. Not ready for parallel implementation until the ADs below are added or tightened.

## Summary table

| # | Severity | Finding | Fix |
| --- | --- | --- | --- |
| F-1 | Critical | `reports` INSERT is unspecified: forge `author_id`, `status`, `hidden`, `created_at`, `image_path` | New AD-12 |
| F-2 | Critical | `profiles` INSERT/role escalation is not covered by "kan aldri endre role" | Tighten AD-4, AD-7 |
| F-3 | Critical | Confirmation rules have gaps: hidden-report self-confirm, confirm hidden, move/unconfirm, state | Tighten AD-7 |
| F-4 | High | Count view shape ambiguous: zero-confirmation reports vanish, NULL sort order, `confirmations` SELECT policy forks | Tighten AD-5 |
| F-5 | High | `storage.objects` policies unspecified (upload folder, DELETE/UPDATE, image sharing, signed-URL persistence) | Tighten AD-6, AD-9 |
| F-6 | High | `BEFORE UPDATE` trigger semantics: status-to-itself, hide-only update, NULLs, column enumeration, silent 0-row update instead of 403 | Tighten AD-7 |
| F-7 | High | Next.js caching can leak hidden reports and signed URLs across users | New AD-13 |
| F-8 | Medium | "Is moderator" mechanism undefined; default grants; exposed functions; RLS-off tables | New AD-14 |
| F-9 | Medium | Data shapes: `''` vs `NULL`, nullability, length limits, whitespace | Tighten AD-4, AD-10 |
| F-10 | Medium | Server Action contracts for status/hide/confirm and error transport | Tighten Conventions |
| F-11 | Medium | Sort ties, URL parameter names, who filters `hidden`, 404 vs 403 | Tighten Conventions |
| F-12 | Low | Auth config, seed vs triggers, FK delete behaviour, open redirect, test harness | New AD-15 / small edits |

---

## F-1 (Critical): INSERT on `reports` is not governed by any AD

**Letter of the ADs.** AD-7 constrains `UPDATE` (moderator only, trigger) and `INSERT` on `confirmations`. AD-4 lists the fields. No AD says who may INSERT into `reports` or with which column values. The `BEFORE UPDATE` trigger does not fire on INSERT.

**Exploit (compliant build).** Developer A writes the minimal policy `FOR INSERT TO authenticated WITH CHECK (true)` (or `author_id = auth.uid()`), plus the Server Action. Every AD is satisfied. An attacker calls PostgREST directly (the spine itself says moderator rules are tested against the REST boundary, so this is the assumed attack surface) with:

- `status: 'resolved'` (skips the status flow, FR-8 and SM-3 broken without any "update");
- `hidden: false` is the default, but an attacker can also insert `hidden: true` rows (invisible spam that moderators must find);
- `author_id` = victim's uuid (then the victim cannot confirm it, and the victim gets blamed; also breaks the `<author_id>/` storage folder convention);
- `created_at: '2099-01-01'` (always first in "nyeste først", FR-6 sort forged);
- `image_path` = path of an image that belongs to another report (see F-5, image sharing through the AD-6 lookup).

Developer B writes a `BEFORE INSERT` trigger that forces `status='new'` and `hidden=false`; the seed (AD-11: "rapporter i alle kategorier og statuser") then fails or silently produces only `new`. Same ADs, incompatible seed/policy.

**Close with (new AD-12).**

> ### AD-12 — Skriverettigheter per tabell er uttømmende `[NY]`
> - **Binds:** FR-2, FR-3, FR-7, FR-8, FR-9, NFR-4
> - **Prevents:** Forfalskede felt ved INSERT, og to tolkninger av hvem som kan skrive hva
> - **Rule:** Rettighetene er en eksplisitt matrise, og alt som ikke står der er forbudt. RLS er slått på for alle tabeller i `public`. Policyene navngir rolle (`TO authenticated` eller `TO anon, authenticated`), aldri bare `public`.
>
> | Tabell | anon | authenticated | moderator |
> | --- | --- | --- | --- |
> | `profiles` | ingen | SELECT egen rad | SELECT egen rad |
> | `reports` | SELECT synlige | SELECT synlige; INSERT med kolonnene `description, location, category, summary, image_path` | + SELECT alle; UPDATE kolonnene `status, hidden` |
> | `confirmations` | SELECT (se AD-5) | SELECT (se AD-5); INSERT | som authenticated |
>
> INSERT på `reports` gis med kolonnegrant (`GRANT INSERT (description, location, category, summary, image_path)`), ikke bredt. `author_id` har `DEFAULT auth.uid()`, `status` har `DEFAULT 'new'`, `hidden` har `DEFAULT false`, `created_at` har `DEFAULT now()`, og ingen av dem kan settes av `authenticated`. INSERT-policyen har `WITH CHECK (author_id = auth.uid())`. Seed og migrering kjører som `postgres` og er unntatt grantene. Det finnes ingen DELETE-policy og ingen DELETE- eller TRUNCATE-grant på noen tabell i `public` (FR-9).

---

## F-2 (Critical): Moderator self-promotion at account creation or via INSERT

**Letter of the ADs.** AD-7: "En bruker kan aldri endre `profiles.role`." AD-4: "Nye kontoer får `role = user` ved at en profilrad opprettes av en trigger på `auth.users`." Neither covers INSERT on `profiles`, nor what the trigger reads.

**Exploits (each compliant).**

1. A developer adds `CREATE POLICY ... FOR INSERT TO authenticated WITH CHECK (id = auth.uid())` on `profiles` "so the sign-up action can upsert the profile". Nothing says "endre" covers INSERT. A user who has no profile row (or if the trigger is not `ON CONFLICT`-strict) inserts `role='moderator'`. Even without the policy gap, Supabase grants ALL on new public tables to `anon`/`authenticated` by default; RLS is the only guard, so any missing policy is a design decision made by whoever writes the migration.
2. The trigger author copies `raw_user_meta_data->>'role'` into `profiles.role` ("support seeding moderators via metadata"). `supabase.auth.signUp({ options: { data: { role: 'moderator' } } })` is user-controlled. Letter satisfied: the role was set by a trigger.
3. Two owners of one entity: the trigger creates the profile, and a sign-up Server Action also upserts it "to be safe". Duplicate-key error, or the action path writes `role`.
4. "Ingen `security definer`-funksjoner for brukerhandlinger" conflicts with how the profile trigger must work in Supabase (it must be `SECURITY DEFINER`, because the auth schema role cannot insert into `public.profiles`). Developer A reads the AD literally and fails; developer B adds `security definer` without `SET search_path = ''` and the function is callable as an RPC.
5. A "role cannot change" trigger on `profiles` (one reasonable implementation of AD-7) also blocks the SQL promotion in README (PRD §11) and the seed moderator.

**Close with (tighten AD-4 and AD-7).**

> **AD-4 tillegg:** Profilraden opprettes bare av triggerfunksjonen `handle_new_user`, som er den eneste `security definer`-funksjonen i systemet. Den har `SET search_path = ''`, ligger i et skjema som ikke eksponeres av PostgREST (eller har `REVOKE EXECUTE` fra `anon, authenticated`), setter `role = 'user'` hardkodet og leser aldri `raw_user_meta_data` eller `raw_app_meta_data`. Ingen Server Action oppretter eller upserter `profiles`.
>
> **AD-7 erstatter setningen om role:** `authenticated` og `anon` har ingen INSERT-, UPDATE- eller DELETE-grant på `profiles`. Rolle settes bare med SQL som `postgres` (seed, README). Ingen trigger blokkerer `postgres` fra å endre `role`; beskyttelsen er at grant mangler. «Ingen `security definer`» gjelder alt unntatt `handle_new_user`.

---

## F-3 (Critical): `confirmations` rules have letter-compliant holes

**Letter of the ADs.** AD-7: "INSERT på `confirmations` krever `user_id = auth.uid()` og at rapportens `author_id` er en annen." Nothing about visibility, status, moderators, UPDATE, DELETE, or SELECT.

**Pair A: author confirms own hidden report.** Developer A writes the check as `NOT EXISTS (SELECT 1 FROM reports r WHERE r.id = report_id AND r.author_id = auth.uid())`. The subquery runs under RLS. AD-6 makes a hidden report invisible to everyone except moderators, including its own author. The subquery finds no row, `NOT EXISTS` is true, and the author confirms their own (hidden) report. Developer B writes `(SELECT author_id FROM reports WHERE id = report_id) <> auth.uid()`; invisible report gives NULL, check fails closed. Both obey "rapportens author_id er en annen". They behave differently exactly on hidden reports.

**Pair B: hidden report is confirmable.** AD-6/FR-9 say hidden reports disappear, but no AD forbids INSERT on `confirmations` for a hidden `report_id`. The foreign key check bypasses RLS, so an attacker who knows or guesses an id gets different errors for "exists" and "does not exist" (an existence oracle), and with form B above the confirmation succeeds only if visible, with form A it succeeds always. A confirmation on a hidden report also changes the count a moderator sees and survives un-hiding.

**Pair C: moderator.** PRD: moderator "kan alt en bruker kan". Developer A lets moderators confirm (policy based on `authenticated`); developer B excludes them "to prevent manipulating counts". Both read the AD correctly.

**Pair D: UPDATE/DELETE.** AD-7 mentions only INSERT. Developer A adds "angre bekreftelse" with a DELETE policy (PRD UJ-2 shows a button state, not an undo, but nothing forbids it; the one-per-user rule then no longer holds over time: confirm, unconfirm, confirm). Developer B adds an UPDATE policy `USING (user_id = auth.uid())`; the primary key is `(report_id, user_id)`, so an UPDATE of `report_id` moves the confirmation to a different report and bypasses the "not the author" INSERT check entirely.

**Pair E: report state.** Can a `resolved` report still be confirmed? Seed has resolved reports with confirmations; developer A allows it, developer B rejects it with a trigger, then the seed's confirmations (inserted as `postgres`, so fine) and the pgTAP tests disagree.

**Close with (tighten AD-7).**

> INSERT på `confirmations` krever alle fire: `user_id = auth.uid()`; rapporten finnes og er synlig for innsetteren (`hidden = false`, ingen moderatorunntak: skjulte rapporter kan ikke bekreftes av noen); rapportens `author_id <> auth.uid()` uttrykt som `EXISTS (SELECT 1 FROM reports r WHERE r.id = report_id AND r.hidden = false AND r.author_id <> auth.uid())` (positiv EXISTS, aldri `NOT EXISTS` på `author_id = uid`); og rapportens status er hvilken som helst. Moderator kan bekrefte andres rapporter på lik linje med bruker. Det finnes ingen UPDATE- og ingen DELETE-policy eller -grant på `confirmations`: en bekreftelse kan ikke angres eller flyttes i v1. `created_at` har `DEFAULT now()` og er ikke skrivbar.

---

## F-4 (High): the count view has at least four compliant shapes

**Letter of the ADs.** AD-5: "en visning som teller `confirmations` per rapport, med `security_invoker = true`. Lista og detaljsiden leser fra visningen."

**Pair A: zero-confirmation reports disappear.** Developer A defines `SELECT report_id, count(*) FROM confirmations GROUP BY report_id` (literally "teller confirmations per rapport") and the list joins it with an inner join, or reads only the view. Reports with 0 confirmations vanish from the list (violates FR-5, UJ-1: the new report must appear). Developer B defines the view as `reports LEFT JOIN confirmations`. Both match the AD.

**Pair B: NULL counts and sort.** `LEFT JOIN` + `count(c.user_id)` gives 0; developers using a lateral subselect or a join to a grouped subquery give NULL. In Postgres `ORDER BY count DESC` puts NULLs first, so FR-6 "sorter etter flest bekreftelser" shows unconfirmed reports at the top. `count(*)` returns `bigint`, which some clients serialise as string.

**Pair C: the view's column set and the "already confirmed" flag.** UJ-2 needs "knappen viser at han allerede har bekreftet". Developer A adds `confirmed_by_me boolean` to the view; developer B queries `confirmations` separately with `user_id = uid`. The view's name, columns (all of `reports.*`?), and the count column name (`confirmation_count`? `confirmations`? `count`?) are not fixed, so two features written in parallel (list vs detail) will not compile against each other. Generated Supabase types also mark every view column nullable.

**Pair D: the `confirmations` SELECT policy forks the count.** With `security_invoker = true`, the count is computed under the caller's RLS on `confirmations`. Developer A restricts SELECT to own rows ("privacy"): every user sees count 0 or 1, and anonymous visitors see 0. Developer B opens SELECT to everyone: counts are right, but `(report_id, user_id)` pairs of all users are exposed to anonymous visitors through PostgREST, and if the policy is `USING (true)` rather than "report visible", confirmations of hidden reports leak (count and voters), which also reveals that hidden reports exist.

**Close with (tighten AD-5).**

> Visningen heter `reports_with_counts`. Den er `FROM reports r LEFT JOIN` på `confirmations` (eller en korrelert delspørring), har `security_invoker = true`, og returnerer alle kolonnene i `reports` pluss `confirmation_count integer NOT NULL` (`count(c.user_id)::int`, aldri NULL) og `confirmed_by_me boolean NOT NULL` (`bool_or(c.user_id = auth.uid())`, `false` for anon). Lista og detaljsiden leser bare fra visningen; skriving går alltid mot `reports`. SELECT-policyen på `confirmations` er `USING (EXISTS (SELECT 1 FROM reports r WHERE r.id = report_id))` (altså: synlig hvis rapporten er synlig under RLS), for `anon` og `authenticated`. `user_id` regnes som et ugjennomsiktig uuid uten visning av identitet i UI. Appen leser aldri `confirmations` direkte, bare via visningen.

---

## F-5 (High): `storage.objects` policies are left to the implementer

**Letter of the ADs.** AD-6: storage policy for `report-images` "slår opp rapporten via `image_path`". AD-9: server uploads with the user session, path `<author_id>/<uuid>.<ext>`, delete the image if report creation fails. The Deferred table admits the lookup is unverified. INSERT/UPDATE/DELETE policies for `storage.objects` are never mentioned.

**Exploits and forks.**

1. **Upload folder.** No AD requires the INSERT policy to check `(storage.foldername(name))[1] = auth.uid()::text`. A user can upload into someone else's folder, or into any path (including filenames that collide with another report's `image_path` with `x-upsert`, which needs UPDATE, see 3).
2. **Orphans and storage abuse.** Authenticated users can upload up to the bucket limit unlimited times without ever creating a report; the "slettes hvis opprettelsen feiler" cleanup is only done by the happy-path Server Action.
3. **Who deletes?** AD-9 requires deleting an uploaded image when the insert fails. With "tjenestenøkkelen aldri", that needs a DELETE policy for the owner. Developer A grants owners DELETE/UPDATE on their folder. Then a user can delete or overwrite the image of a live (even moderator-handled) report, which contradicts "ingenting blir slettet" (FR-9) and breaks the image link. Developer B grants no DELETE and leaks orphans on every failed insert. Both comply.
4. **Image sharing across reports.** `image_path` is only "text, kan være tom". With no UNIQUE constraint and no check that the path lives under the author's folder, an attacker (or a bug) creates a visible report whose `image_path` points to the image of a hidden report. The AD-6 policy ("slå opp rapporten via `image_path`") may match the visible report first and grant read access to the hidden image. Even if the attacker needs the uuid, it is a latent leak, and a correctness problem if the same path is attached twice.
5. **Signed URLs outlive hiding.** A signed URL validated by token does not re-check RLS. "Kort levetid" is not defined (60 s vs 1 h). A report hidden because of a visible licence plate keeps serving the image to anyone holding a URL until expiry. Also, who may call `createSignedUrl` for visitors (`anon` has no `SELECT` on `storage.objects` unless the policy says so)?
6. **List performance.** One signed URL per row in a Server Component loop (100 calls) versus `createSignedUrls` batch affects NFR-6.

**Close with (tighten AD-6 and AD-9).**

> **AD-9 tillegg:** Policyene på `storage.objects` for `report-images` er uttømmende: INSERT for `authenticated` bare når `(storage.foldername(name))[1] = auth.uid()::text`; SELECT som i AD-6 (for `anon` og `authenticated`); ingen UPDATE-policy og ingen `upsert`; DELETE bare for eier og bare når ingen rad i `reports` har denne `image_path` (opprydding ved feilet opprettelse). Filnavnet er alltid en ny `uuid`. `reports` har `CHECK (image_path IS NULL OR image_path LIKE author_id::text || '/%')` og `UNIQUE (image_path)`. Signerte lenker har levetid på 60 sekunder, lages i én batch per side (`createSignedUrls`) og caches aldri (se AD-13). Moderatorer som skjuler en rapport aksepterer at allerede utstedte lenker lever til utløp.

---

## F-6 (High): semantics of the `BEFORE UPDATE` trigger and the 403 claim

**Letter of the ADs.** AD-7: trigger "krever at bare `status` og `hidden` endres og at `status` flyttes ett steg (`new` ↔ `in_progress` ↔ `resolved`), og avviser ellers med en navngitt feilkode."

**Pair A: status to itself.** Moderator hides a report: the update sends `hidden = true`. Does `status` "flyttes ett steg"? Literal reading: `status` did not move one step (distance 0), so reject with `invalid_status_step`; the hide action then fails. Developer A therefore makes the hide Server Action send `status = status`, or implements the trigger as "if status changed then step must be 1", which accepts hide-only updates. Developer B implements the literal check and breaks FR-9. A third developer's stale-page double click (two moderators setting `new -> in_progress`) hits distance 0 and gets a confusing error or silent success depending on the reading.

**Pair B: NULL and column enumeration.** "Bare `status` og `hidden` endres" is implemented by comparing named columns (`NEW.author_id IS DISTINCT FROM OLD.author_id` ...) by developer A, who forgets any column added in a later migration, while developer B compares `to_jsonb(NEW) - 'status' - 'hidden'` to the same for `OLD`. A migration that adds a column in A's world silently makes it moderator-editable. Using `<>` instead of `IS DISTINCT FROM` lets NULL-valued columns (`summary`, `image_path`) slip through: `NULL <> 'x'` is NULL, so the check does not fire and a moderator can rewrite `summary`/`image_path` of a report.

**Pair C: "403".** PRD FR-2 says a user sending a status change straight to the API "får avvisning (403)". With AD-7's "RLS lar bare moderator oppdatere", the policy is `USING (is_moderator)`. A non-moderator UPDATE through PostgREST then matches zero rows and returns 200/204 with an empty body, not 403. A Server Action that checks only `error` reports success (developer A); one that checks `.select()` row count reports failure (developer B). The pgTAP test "returns 403" cannot pass for a `USING` denial.

**Pair D: ordering of `BEFORE` trigger and RLS.** Row filtering (`USING`) happens first, `WITH CHECK` after the `BEFORE` trigger; test authors who do not know this write tests that expect `invalid_status_step` from a non-moderator.

**Pair E: transitions on hidden reports and combined updates.** Can `status` and `hidden` change in one UPDATE? Can the status of a hidden report change? Not stated.

**Close with (tighten AD-7).**

> RLS på UPDATE er `USING (true-for-synlige-rader) WITH CHECK (is_moderator())` slik at et forsøk fra en ikke-moderator gir SQLSTATE `42501` (403 via PostgREST), ikke en stille 0-rad-oppdatering. Triggeren `reports_guard_update` oppfører seg slik: (1) alle kolonner utenom `status` og `hidden` må være uendret, sjekket som `(to_jsonb(NEW) - 'status' - 'hidden') IS NOT DISTINCT FROM (to_jsonb(OLD) - 'status' - 'hidden')`, aldri kolonne for kolonne og aldri med `<>`; (2) hvis `NEW.status = OLD.status` er det lov (hide-only og tom oppdatering er idempotente); (3) hvis `NEW.status <> OLD.status` må forskjellen i enum-rekkefølge være nøyaktig 1, ellers feilkoden `invalid_status_step`; (4) `status` og `hidden` kan endres i samme UPDATE og på skjulte rapporter. Brudd på (1) gir `invalid_column_change`. Feilene reises som `RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = '<kode>'`, og `lib/errors.ts` slår opp på `MESSAGE`. Enum-rekkefølgen `new, in_progress, resolved` er en del av kontrakten og endres ikke. Server Actions sjekker alltid både `error` og antall rader som `.select()` returnerer.

(Correction note for the PRD: FR-2 "403" holds only if the policy is shaped as above. Alternatively change the FR to "avvises, uten endring".)

---

## F-7 (High): Next.js caching can cross-leak users' data

**Letter of the ADs.** AD-3: pages read in Server Components with a per-request client built from the cookie. Nothing says the results must not be cached. The stack is Next.js 16, which has Cache Components (`use cache`) and the data cache for `fetch`.

**Exploits (compliant).**

1. A developer marks the list page or a `getReports()` helper with `'use cache'` / `unstable_cache` to meet NFR-6 (100 reports in under 2 s). The first request is a moderator's: hidden reports are rendered and cached; anonymous visitors then get them. Or the reverse: moderators do not see the newly hidden state. The per-request client uses cookies, but a cached function can capture a client or user-specific result.
2. `next/image` is used for report images. The image optimizer fetches the signed URL server-side and caches the result by URL, then serves `/_next/image?url=...` to anyone, past the signed URL expiry and past hiding. Alternatively `next.config` `remotePatterns` / `dangerouslyAllowLocalIP` is loosened to make local Supabase images work.
3. Status/hide changes are not visible "neste gang de laster siden" (FR-8) if the page was statically rendered or `revalidatePath` is forgotten.

**Close with (new AD-13).**

> ### AD-13 — Ingen mellomlagring av brukeravhengige data `[NY]`
> - **Binds:** FR-5, FR-8, FR-9, NFR-4
> - **Prevents:** At en moderators visning av skjulte rapporter eller en signert bildelenke serveres til andre
> - **Rule:** Sider som leser `reports_with_counts` eller lager signerte lenker er dynamiske (`export const dynamic = 'force-dynamic'`), og ingen funksjon som leser fra Supabase bruker `'use cache'`, `unstable_cache` eller `fetch`-cache. Rapportbilder vises med `<img>` eller `next/image` med `unoptimized`, aldri gjennom bildeoptimereren. Responser med signerte lenker sendes med `Cache-Control: private, no-store`. Hver Server Action som endrer `reports` eller `confirmations` kaller `revalidatePath('/')` og `revalidatePath('/reports/[id]', 'page')`.

---

## F-8 (Medium): "is the caller a moderator" has no single definition

**Letter of the ADs.** AD-6: "brukeren er moderator". AD-7: "RLS lar bare moderator oppdatere". `profiles.role` is the stated store (AD-4). The mechanism is open.

**Forks.**

- Developer A reads `profiles.role` through a subquery in each policy. If `profiles` SELECT is own-row only, this works; if a policy on `profiles` itself uses the same subquery you get infinite recursion, which the developer "fixes" with a `SECURITY DEFINER` helper (a user action? the AD says no).
- Developer B reads a JWT claim (`auth.jwt() ->> 'role'` is the Postgres role, not the app role; they pick `user_metadata.role` or a custom access-token hook). `user_metadata` is writable by the user via `auth.updateUser`, so any user becomes moderator: a letter-compliant escalation. Even `app_metadata` or a hook claim goes stale until token refresh, so SQL promotion in README (PRD §11) does not take effect for an hour.
- Default grants: Supabase gives `anon`/`authenticated` privileges on new `public` objects, so a table added later without `ENABLE ROW LEVEL SECURITY` is wide open. Every function in `public` is exposed as an RPC, so a helper like `is_moderator()` or a future `set_status()` is callable by anyone.

**Close with (new AD-14).**

> ### AD-14 — Én definisjon av moderator, og lukkede standarder `[NY]`
> - **Binds:** FR-2, NFR-4
> - **Prevents:** Rolle lest fra brukerstyrte kilder, rekursive policyer, åpne tabeller
> - **Rule:** Moderator betyr `EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'moderator')`, uttrykt i funksjonen `private.is_moderator()` (`STABLE`, `SECURITY INVOKER`) som alle policyer bruker. `profiles` har bare policyen «SELECT egen rad», som gjør at funksjonen ikke blir rekursiv. Roller leses aldri fra JWT, `user_metadata` eller `app_metadata`. Hver migrering som oppretter en tabell i `public` slår på RLS i samme migrering og tilbakekaller standardgrants (`REVOKE ALL ... FROM anon, authenticated`) før nødvendige grants gis. En pgTAP-test feiler hvis noen tabell i `public` har `rowsecurity = false`, og hvis `anon` eller `authenticated` kan kjøre en funksjon i `public` som ikke står på en tillatelsesliste.

---

## F-9 (Medium): shared data shapes are underspecified

**Letter of the ADs.** AD-4 and the ERD give column names and types only; "`summary` og `image_path` kan være tomme"; the ERD says `role`, `category`, `status` are `text` while the prose says enum.

**Forks.**

- **`''` vs `NULL`.** "Tomme" is ambiguous. The form posts an empty string when KI is off or the user clears the summary. Developer A stores `''`, developer B normalises to `NULL`. FR-5 says each row shows "oppsummering eller beskrivelse"; `summary ?? description` shows an empty row for `''`, `summary || description` is correct for both but nobody is told which to use. Same for `image_path` (`''` produces a broken signed-URL call).
- **Nullability.** `description`, `location`, `category`, `author_id` are not declared `NOT NULL`. A `NULL author_id` makes the author check (`<> auth.uid()`) evaluate to NULL.
- **"Uten beskrivelse eller lokasjon blir avvist" (FR-3).** Whitespace-only text passes `NOT NULL` and `<> ''`. Zod trims in the Action; a direct PostgREST call does not.
- **Length caps.** No cap on `description`, `location`, `summary`. The form uses 500, the database nothing; a direct call stores 1 MB, which then goes to the external KI provider (cost, PRD §8) and bloats the list.
- **ERD vs prose types.** The ERD says `text`; a developer who trusts the ERD makes text columns plus a CHECK, another uses the enum. Generated types differ.

**Close with (tighten AD-4).**

> Alle kolonner unntatt `reports.summary` og `reports.image_path` er `NOT NULL`. De to valgfrie kolonnene lagrer `NULL`, aldri tom streng (`CHECK (summary IS NULL OR length(btrim(summary)) > 0)`, tilsvarende for `image_path`); Server Actions konverterer `''` til `null`, og visning bruker `summary ?? description`. `description` og `location` har `CHECK (length(btrim(x)) > 0)` og lengdegrenser i databasen (`description <= 1000`, `location <= 200`, `summary <= 300`); Zod-skjemaene bruker de samme tallene fra én konstantfil `lib/limits.ts`. `role`, `category` og `status` er Postgres-enum, og ERD-et viser dem som enum.

---

## F-10 (Medium): Server Action contracts for the mutations are not fixed

**Letter of the ADs.** Conventions: Server Actions return `{ ok: true, data }` or `{ ok: false, error: { code, message } }`; errors are "navngitte koder". Not specified: the action signatures, the `code` vocabulary, or how Postgres errors reach the translator.

**Forks.**

- **Absolute vs relative.** `setStatus(reportId, 'resolved')` (absolute) vs `advanceStatus(reportId, 'forward'|'back')` vs `toggleHidden(reportId)`. Toggle is racy: two moderators clicking "skjul" turn it back on. Absolute actions with the stale-page problem (F-6 Pair A) need an expected-current-value guard.
- **Code transport.** Developer A reads `error.code` (SQLSTATE), developer B reads `error.message`, developer C `error.hint`. `lib/errors.ts` then handles one of them. A unique violation on `confirmations` is SQLSTATE `23505`, an RLS rejection is `42501`, a trigger rejection is whatever the trigger raised: three families with no common key.
- **Duplicate-confirmation semantics.** FR-7: "avvises". Should the Action return `{ ok: false, code: 'already_confirmed' }` or treat it as success (idempotent)? Two UIs will disagree on the button state.
- **Upload failure ordering.** AD-9 uploads first, then inserts; a double-click on submit creates two uploads and two reports (no idempotency key).

**Close with (tighten Consistency Conventions).**

> Server Actions for moderator er `setReportStatus(reportId, from, to)` og `setReportHidden(reportId, hidden)`; de tar alltid en eksplisitt målverdi, aldri toggle, og `setReportStatus` oppdaterer med `WHERE id = $1 AND status = $2` og returnerer `stale_state` hvis ingen rad ble endret. `confirmReport(reportId)` returnerer `{ ok: false, error: { code: 'already_confirmed' } }` ved SQLSTATE `23505`. Kodevokabularet er lukket: `unauthenticated, forbidden, invalid_status_step, invalid_column_change, already_confirmed, own_report, report_not_found, stale_state, validation_failed, upload_failed, ai_unavailable`. `lib/errors.ts` slår opp på `MESSAGE` for egne feil og på SQLSTATE `23505`/`42501` for de to innebygde; alt annet blir `unknown` uten å lekke databasetekst. Skjemaet har en engangsnøkkel som hindrer dobbel innsending.

---

## F-11 (Medium): list semantics: sort ties, parameter names, who filters `hidden`, 404

**Letter of the ADs.** Convention: "URL-parametre som evalueres i databasespørringen (FR-6). Standard er nyeste først." FR-5/FR-9: hidden reports not visible to others; moderator sees them "merket som skjult".

**Forks.**

- **Sort ties.** `ORDER BY confirmation_count DESC` with no tiebreaker returns an unstable order. FR-6 / SM-4 require "forventet rekkefølge" on a known dataset; two developers pick `created_at DESC` vs `id`, and pgTAP/Vitest fixtures disagree.
- **Parameter names/values.** `?category=waste&status=new&sort=newest|confirmations` vs `?kategori=` vs `?sort=-created_at`. Filter bar (one story) and links from detail back to list (another) will not match. Invalid values: error, or ignore?
- **Who filters hidden.** Developer A adds `.eq('hidden', false)` in the list query "to be safe"; moderators then never see hidden reports. Developer B relies on RLS alone. AD-1 implies B, but nothing states it. Moderator list: hidden mixed in with a badge, or a separate filter?
- **Detail route for hidden/non-existent.** 404 for both (no existence oracle) or 403 for hidden (confirms existence)? FR-9: "forsvinner fra detaljsiden".

**Close with (tighten Consistency Conventions).**

> URL-parametre er `category` (enum-kode eller utelatt), `status` (enum-kode eller utelatt) og `sort` (`newest` standard, `confirmations`); ukjente verdier ignoreres og gir standardvisning. Sortering er alltid `confirmation_count DESC, created_at DESC, id DESC` eller `created_at DESC, id DESC`. Appkode filtrerer aldri på `hidden`: RLS alene bestemmer hva som vises, og moderator ser skjulte rapporter blandet inn med merket «Skjult». Detaljside for en rapport som ikke finnes eller ikke er synlig gir `notFound()` (404) i begge tilfeller.

---

## F-12 (Low): smaller gaps that still produce incompatible builds

1. **Auth configuration.** FR-1 does not say whether email confirmation is on. `supabase/config.toml` `enable_confirmations`, `enable_signup`, minimum password length, and `site_url`/redirect allow-list are set by whoever touches `config.toml`. Seed users created by SQL need `email_confirmed_at` and an `auth.identities` row to log in. Add: "Registrering krever ikke e-postbekreftelse lokalt (`enable_confirmations = false`); `config.toml` er eid av én fil og endres bare i en egen PR."
2. **FK delete behaviour.** `reports.author_id` and `confirmations.*` foreign keys have no `ON DELETE`. `CASCADE` from `auth.users` deletes reports, contradicting FR-9 "ingenting slettes"; `SET NULL` makes `author_id` nullable (see F-9). Add: `ON DELETE RESTRICT` på alle fremmednøkler.
3. **Seed vs triggers.** Seed inserts reports in all statuses, hidden rows, confirmations, and promotes the moderator. Any `BEFORE INSERT` normalisation trigger or "role is immutable" trigger breaks it (see F-1, F-2). Add: "Seed kjører som `postgres`; ingen trigger eller policy avhenger av at det ikke gjør det."
4. **Open redirect.** FR-1: unauthenticated users are sent to login. A `next`/`redirect_to` parameter that is not validated as a same-origin relative path is an open redirect. Add: "Retur-URL etter innlogging må starte med `/` og ikke `//`."
5. **Test harness.** AD-3 says moderator rules are tested "direkte mot Supabases REST-grense", but the Tests convention names only pgTAP (SQL, not REST). pgTAP must impersonate with `SET LOCAL ROLE authenticated` and `request.jwt.claims` for `auth.uid()` to work; developers who skip this get `auth.uid() = NULL` and tests that pass vacuously. Add one shared helper `tests.as_user(uuid)`, `tests.as_anon()`, and a small REST smoke test (Vitest + `fetch` against local PostgREST) for the 403/401 cases in FR-2, FR-7.
6. **AI endpoint abuse.** The `suggest` Server Action is callable by any logged-in user without limits, and registration is open and confirmation-free, so quota drain is trivial. Deferred is acceptable, but add a minimum: max 2000 characters of description sent, one in-flight call per user.
7. **Prompt injection.** `suggest` validates `category` against the enum but passes `summary` through. Add: summary is plain text, trimmed to 300 characters, never rendered as HTML, never used as an instruction.

---

## Suggested spine edits in one list

1. Add AD-12 (write-matrix and column grants), AD-13 (no caching), AD-14 (one moderator definition, closed defaults).
2. Replace the role sentence in AD-7 and add the `confirmations` rules, the trigger semantics, and the 42501 policy shape.
3. Tighten AD-4 (profile trigger as the only `security definer`, NOT NULL, `NULL` not `''`, enum in ERD, `ON DELETE RESTRICT`).
4. Tighten AD-5 with the exact view definition and `confirmations` SELECT policy.
5. Tighten AD-6/AD-9 with `storage.objects` policies, `image_path` CHECK and UNIQUE, 60 s signed URLs.
6. Extend Consistency Conventions with the action signatures, closed error-code vocabulary, URL parameters, sort tiebreakers, and the 404 rule.
7. Remove "Verifisering av Storage-policy" from Deferred only after F-5 is implemented and covered by a pgTAP test that attempts each exploit above (insert into another user's folder, confirm own hidden report, insert `status = 'resolved'`, insert `role = 'moderator'`, update `summary` as moderator, status to itself).
