# Rubric review: ARCHITECTURE-SPINE.md (LocalFix, draft 2026-10-28)

Reviewer: independent architecture reviewer. Inputs: the spine and prd.md (FR-1..FR-9, NFR-1..NFR-7, SM-1..SM-7). Only this file was written. Tech versions could not be independently verified (no registry access in this review); see check 4.

## Verdict

The spine is a strong, well-scoped, database-first design that fixes most real divergence points, but it has one concrete security hole (image_path vs the AD-6 storage policy), a contradiction between the layer rule and the chosen starter's auth pattern, several rules that are not enforceable as written (AD-7 "RLS rejects" does not yield a 403; AD-7 vs the profile trigger), and gaps in NFR/SM coverage and in the operational envelope. Fixable in one revision; not ready to be marked final.

## Checklist summary

| # | Check | Result |
| --- | --- | --- |
| 1 | Fixes the real divergence points, misses none | Mostly. Misses: auth-guard pattern, TS source of enum codes, mock behaviour, RLS on `confirmations`/`profiles` reads, field limits, generated types workflow |
| 2 | Every Rule enforceable and prevents its divergence | Partly. AD-3, AD-6, AD-7, AD-10 have enforceability gaps (findings 1-4, 9, 12) |
| 3 | Nothing in Deferred lets units diverge | Two items are risky: storage-policy verification and seed images (finding 5) |
| 4 | Named tech plausibly current and fits | Plausible. Zod listed but unused by any rule; Next 16 file naming; key naming (finding 13) |
| 5 | Covers every FR/NFR/SM | FR-1..9 covered. NFR-1, NFR-4, NFR-6, NFR-7 and SM-1..4, SM-6, SM-7 are not in the Capability map (finding 8) |
| 6 | Operational/environmental envelope decided | Deployment is deferred legitimately, but environments, CI, DB/migration workflow, Docker risk and PWA-over-HTTPS are neither decided nor listed as open (finding 10) |
| 7 | Internally consistent | Several inconsistencies (findings 3, 6, 7, 11, 14) |

## Findings

### F1. AD-6 / AD-9 / AD-4 (reports.image_path): cross-report image leak. Severity: HIGH (security)

AD-6 lets the storage policy resolve visibility by looking up a report by `image_path`. Nothing constrains what a user writes into `reports.image_path` on INSERT. A user can create a visible report whose `image_path` equals the path of another user's hidden report's image; the policy then finds a visible report for that path and grants read. The same weakness lets any path be claimed. AD-7's "only status and hidden may change" protects later UPDATEs but not INSERT.

Fix: add to AD-9/AD-7 an INSERT rule on `reports`: `image_path is null or image_path like author_id::text || '/%'`, plus a `UNIQUE` constraint on `image_path`, so one object belongs to exactly one report. Add the storage INSERT policy rule: object name must start with `auth.uid()::text || '/'`. Add a pgTAP test for the leak case.

### F2. AD-7: "RLS lets only moderator update" does not produce a rejection. Severity: HIGH (enforceability, PRD FR-2 says 403)

In PostgREST, an UPDATE whose USING clause filters out the row affects 0 rows and returns success (empty result), not 403. So a user "sending a status change directly" gets a silent no-op, and the trigger error code never fires for non-moderators. The PRD's testable consequence (rejection) and AD-3's "test against the REST boundary" cannot be asserted as written. The same applies to a hidden report being updated by a non-moderator.

Fix: define "rejected" explicitly in AD-7: either (a) Server Actions treat 0 affected rows as `{ ok: false, error: { code: 'forbidden' } }` and the tests assert 0 rows changed, or (b) keep UPDATE visible to authenticated users via RLS and let the BEFORE UPDATE trigger raise `insufficient_privilege` (named code) when the caller is not a moderator. Pick one; (b) gives the PRD's 403 semantics. Also state in the trigger rule that an update changing only `hidden` (status unchanged) is allowed, and that `author_id`, `created_at`, `image_path`, etc. are immutable.

### F3. AD-3 + Design Paradigm layer rule vs AD-2 starter pattern. Severity: HIGH (internal contradiction)

The layer table says `lib/supabase/` is "the only place a Supabase client is created (server, from cookie)" and `components/` never imports `lib/supabase/`. AD-2 keeps the `with-supabase` pattern, which ships a browser client (`lib/supabase/client.ts`), a session-refresh layer (`proxy.ts`, formerly `middleware.ts` in Next 15 and earlier) that creates its own client, and login/sign-up forms as client components in `components/` that call `supabase.auth.*` in the browser. Following AD-2 literally violates AD-3; following AD-3 literally means rewriting the starter's auth.

Fix: add an explicit decision. Recommended: all auth (sign-up, login, logout) via Server Actions, delete the starter's browser client, keep the session-refresh `proxy.ts` as the single documented exception that calls a factory in `lib/supabase/`, and add `proxy.ts` to the folder tree and the dependency diagram. Alternative: allow a browser client for `auth.*` only and state it as the named exception.

### F4. AD-7 vs AD-4: `security definer` ban contradicts the profile trigger. Severity: MEDIUM

AD-4 requires a trigger on `auth.users` that inserts into `profiles`. In Supabase this trigger function must be `security definer` (with `set search_path = ''`) to write to `public.profiles`. AD-7 says "no security definer functions for user actions". It is arguable that the trigger is not a user action, but the wording invites a reviewer or builder to reject or work around it.

Fix: reword AD-7: "No `security definer` functions callable via the API. The only permitted `security definer` is the `auth.users` profile trigger function, with fixed `search_path`, not exposed (revoke execute from `anon`, `authenticated`)." Also state: `profiles` has no UPDATE and no DELETE policy for any API role (this is the enforceable form of "a user can never change `profiles.role`"), and a SELECT policy letting a user read at least their own row (needed by the moderator check in other policies).

### F5. Deferred: storage-policy lookup, signed-link rights and seed images. Severity: MEDIUM-HIGH (risk of divergence in the core security mechanism)

AD-6 and AD-9 are tagged `[ADOPTED]` while the Deferred table admits it is unverified that a Storage policy can look up `reports` via `image_path`, what permission signed URLs need, and how local bucket limits are set. If the mechanism fails, AD-6 and AD-9 are built by different units against a different fallback. Also the anonymous visitor case (FR-5: visitors see lists and details, thus images) is not addressed: signed links must be creatable for `anon`, which requires a storage SELECT policy `to anon`. Seed images that cannot be uploaded from `seed.sql` mean seeded `image_path` values may point to nothing.

Fix: (a) mark AD-6 and AD-9 `[PROVISIONAL]` with a named fallback, for example: the server reads the report through RLS (visibility check), and only if visible creates a signed URL using a narrowly scoped path, with the bucket policy limited to "authenticated and anon may select objects whose name exists as a visible report's image_path". (b) State that visibility is decided by the report row read through RLS first (single source), the storage policy being defence in depth. (c) Decide the seed-image mechanism now, since it is a one-line decision with two options: a `supabase/seed-images` upload step in a `npm run db:seed` script using the service key (allowed in seed per AD-11), or `[storage.buckets]` `objects_path` in `config.toml`. Pick one.

### F6. AD-3 vs Consistency/Tests: "tested directly against the REST boundary" vs pgTAP. Severity: MEDIUM

AD-3 says moderator rules are tested against Supabase's REST boundary independent of the app. The Tests convention uses pgTAP, which simulates roles with `set role` and JWT claims inside SQL and never goes through PostgREST; end-to-end tests are deferred. PRD FR-2/FR-7 specify direct API calls.

Fix: either relax AD-3 to "pgTAP simulating `authenticated`/`anon` roles with JWT claims" or add one small Vitest integration suite (supabase-js with real user sessions against the local stack) as a non-deferred test covering FR-2, FR-7, FR-8, FR-9 rejections, including the F2 semantics.

### F7. AD-4 / ERD: types and constraints. Severity: MEDIUM

(a) The ERD shows `role`, `category`, `status` as `text` while the prose says Postgres enum; the ERD is the "structural seed" builders copy. (b) Nullability, defaults and limits are missing: `status default 'new'`, `hidden default false`, `description`/`location` NOT NULL (FR-3 rejects empty), max lengths, `category` NOT NULL, `author_id` FK delete behaviour (no cascade deletion of reports, per FR-9 "nothing is deleted"), `created_at default now()`. AD-1 says all rules in Postgres, but empty/oversized description would only be checked in TypeScript. (c) No DELETE policy statement for `reports`: "Det finnes ingen sletting" is not a rule until RLS denies DELETE and no grant exists. (d) Nothing says whether `confirmations` can be removed (PRD: no undo; state it).

Fix: redraw the ERD with enum type names and `PK/FK/NN/default` notes; add `CHECK (char_length(trim(description)) between 1 and N)` and similar for location/summary; add "no DELETE grant or policy on `reports`, `confirmations`, `profiles` for API roles".

### F8. Capability → Architecture Map: missing NFR/SM coverage. Severity: MEDIUM

Frontmatter `binds` lists NFR-1..NFR-7, but the map and ADs do not govern:
- NFR-1 (responsive, 360 px): no rule or owner (components/layout, mobile-first convention, manual check). Add a convention line and a verification note.
- NFR-4: only implicit via AD-1/7; add a map row.
- NFR-6 (100 reports < 2 s): no decision at all. Sorting/filtering by confirmation count through a view needs indexes (`reports(status, category, created_at)`, `confirmations(report_id)`); pagination deferred is fine, but the index decision belongs in AD-4/AD-5. Add a seed of at least 100 reports so the NFR is checkable.
- NFR-7 (no paid services): bound in AD-8 but missing in the map; the Deferred provider decision has no stated acceptance gate in the spine (the PRD §11 criteria: >= 16/20, valid JSON, < 5 s, language check). Reference them.
- SM-1..SM-4, SM-6, SM-7: not mapped (SM-5 is). Add a row mapping SM-1..4 to pgTAP/integration tests, SM-6 to the Vitest adapter-failure test, SM-7 to README + AD-11 (clean-machine check).
- FR-3's required reminder about faces/plates and PRD §8's reminder about personal data in the description field and the "text is sent to an external service" disclosure are not in the map. Add as UI obligations under FR-3/FR-4.

### F9. AD-5: view and RLS on `confirmations`. Severity: MEDIUM

The view uses `security_invoker = true`, so the count is only right if `confirmations` SELECT is allowed for the same audience as `reports` (including `anon`, and without exposing which user confirmed). The spine does not state the `confirmations` SELECT policy. Visibility of confirmation counts for hidden reports is also unspecified. UJ-2 needs "has the current user already confirmed" for the button state; no rule says how it is read. Also the view must LEFT JOIN so zero-confirmation reports appear.

Fix: add to AD-5: `confirmations` SELECT policy is `using (exists visible report)`; the view exposes `confirmation_count` (LEFT JOIN, `coalesce 0`) and a `confirmed_by_me` boolean computed with `auth.uid()`; list/detail read only the view; sorting and filtering happen in that query (FR-6).

### F10. Operational / environmental envelope not decided. Severity: MEDIUM

The scope is "run locally", and hosting is rightly deferred, but the following structural dimensions are neither decided nor in Deferred/open questions:
- Environments: a single local environment is implied; state it. Also whether a test database is separate from dev (pgTAP and `supabase db reset` wipes dev data).
- CI: none mentioned. Even for a student project, `supabase test db` + Vitest + lint on PR is the cheapest enforcement of AD-1/6/7/10. Decide or defer explicitly.
- DB change workflow: forward-only migrations, who regenerates and commits the generated database types (`lib/supabase/` "genererte databasetyper"), and a check that types are current.
- Docker as a hard prerequisite for sensor (NFR-2/SM-7): the Supabase local stack is heavy (many containers, several GB RAM). It is listed in README but is a real risk to SM-7. Add an open question/risk and a documented fallback (for example, an optional free hosted Supabase project path via `.env`) or accept the risk explicitly.
- Runtime: Node version pinning (`engines`/`.nvmrc`) for sensor; "Node (utvikling)" only. Dev OS is Windows, sensor unknown; note path/line-ending hygiene (`.gitattributes`) for shell scripts if any.
- Secrets/seed credentials: the moderator password in `seed.sql` and README (PRD §11) is a deliberate test credential; state that seed credentials are local-only and must never be used if hosting is later added.
- PWA installability (NFR-5) needs HTTPS and 192/512 px icons; on localhost it only works on the same machine. State that installability is verified on desktop localhost or via a tunnel, and that icons are part of the manifest.
- Observability: "console only" is stated; fine for v1, state "no error tracking".
- Backup/DR: not applicable locally; one line saying so closes the dimension.

Fix: add a short "Environment & Operations" subsection (or table) with these decisions, and add the Docker and HTTPS items to Deferred or an Open Questions list.

### F11. AD-10: TypeScript source of the code values. Severity: MEDIUM

AD-10 fixes the values and says labels live in `lib/labels.ts`, but not where the TypeScript list of valid codes lives. The KI prompt, the AD-8 validation, URL-filter parsing (FR-6) and the form select each need that list. Three units will define three arrays. Generated DB types contain the enum union but not a runtime array. AD-10 also has no tag and no test that the DB enum, the TS list and `labels.ts` agree.

Fix: AD-10 Rule: "One module `lib/domain.ts` exports `CATEGORIES` and `STATUSES` as const arrays; `lib/labels.ts` is `Record<Category, string>`; the type check enforces completeness; a Vitest test compares the arrays with the enum values from the database." Add the rule that URL filter params are parsed against these arrays and unknown values are ignored.

### F12. AD-8: gaps in the adapter contract. Severity: MEDIUM

- Mock behaviour is not specified (deterministic keyword mapping? what summary?), yet SM-5 "can be rerun" by a reader without a key and SM-6/FR-4 rely on it. State what SM-5 does in mock mode (it should refuse to report a score, or report "mock, not a measurement").
- How structured output is obtained is not fixed (prompt-only plus JSON parse vs `response_format`), and providers differ; define the adapter's contract: system prompt in one file, the category list from AD-10, JSON schema validation with Zod, the summary language (bokmål, PRD §11 language check), and a max length for `summary`.
- The "5 second timeout" lives in the adapter, but the Server Action also needs a total budget; say that the abort signal is enforced inside the adapter.
- Prompt injection and rendering: the summary is model output stored in the DB and rendered; state it is plain text, never HTML.
- Privacy: PRD §8 says Gemini free tier is not used with real data, but an OpenAI-compatible adapter makes that a one-line env change. Add an env guard or README warning, and state what gets sent (description only, never author id, email or location).
- "Only logged-in users" is weak protection since registration is open; the Deferred "rate limit" row should say that. Acceptable for v1 but state it.

### F13. Stack (check 4). Severity: LOW-MEDIUM

- Versions look plausible and are consistent with "lockfile of the starter has the last word", but I could not verify them; the claim "confirmed against npm 2026-10-28" should carry a source or command in the artifact.
- Zod is listed but no AD says to use it, so validation style diverges (Zod vs hand-written). Either add "all Server Action input and adapter output validated with Zod schemas, co-located in `schemas.ts`" to a convention, or drop it.
- `lib/env.ts` must name the keys the starter uses (current starter uses the publishable key variable, not necessarily `ANON_KEY`); fix names in `.env.example` at start-up and state that Supabase local key names are copied from `supabase status`.
- Next 16 file naming (`proxy.ts`) is absent from the tree (see F3).
- Postgres major version is not pinned (`config.toml` `major_version`); `security_invoker` views need Postgres 15+. Pin and state.
- Docker Desktop "not installed yet" is a status note, not a stack row; move it to the risk list.

### F14. Internal consistency (check 7), smaller items. Severity: LOW

- Layer table and diagram omit `lib/labels.ts`, `lib/env.ts`, `lib/errors.ts` and `evals/` as importable layers. State "cross-cutting modules (`env`, `errors`, `labels`, `domain`) may be imported by any layer, but `lib/ai` and `lib/supabase` must not import from `app/` or `components/`". The diagram shows `evals/sm5 -> lib/ai` but `lib/ai` imports `lib/env.ts`, which must then be loadable outside Next (state that env loading in scripts is via `dotenv`/`--env-file`).
- AD-10 and AD-11 lack the `[ADOPTED]` tag that AD-1..AD-9 have.
- "Frontend and auth" in AD-2 Binds is not an FR ID; bind to FR-1.
- FR-1's "unauthenticated user is sent to login": no rule says where this guard lives (proxy redirect vs per-page helper). Add to AD-3: one helper `requireUser()` in `lib/supabase/` using `auth.getUser()` (or `getClaims()`), never `getSession()` on the server, called first in every Server Action and protected page.
- The map row "NFR-5 PWA: Konvensjon" points at a convention that says only "app/manifest"; add icons and "no service worker".
- The dependency rule sentence "piler viser hvem som kan importere hvem" is not enforceable without a tool; add an ESLint `no-restricted-imports` rule (or `eslint-plugin-boundaries`) for `components/` -> `lib/supabase|ai` and `process.env` outside `lib/env.ts`. Without it, AD-3 and the Konfigurasjon convention are conventions only.

## Proposed edit list (priority order)

1. F1: add the `image_path` prefix CHECK, UNIQUE, storage INSERT policy and a leak test.
2. F2: define "rejected" semantics for non-moderator updates; make the trigger raise a named error for non-moderators.
3. F3: resolve starter-auth vs AD-3 and add `proxy.ts` to the tree and diagram.
4. F5: mark AD-6/AD-9 provisional with a fallback; decide the seed-image mechanism; cover the `anon` image case.
5. F8: extend the Capability map to NFR-1, 4, 6, 7 and SM-1..4, 6, 7; add the privacy-reminder obligations.
6. F4, F7, F9, F11, F12: tighten AD-7, AD-4 (ERD), AD-5, AD-10, AD-8 as specified.
7. F10: add the Environment & Operations subsection and Docker/HTTPS risks.
8. F6, F13, F14: test-strategy alignment, stack hygiene, lint enforcement of the layer rule.
