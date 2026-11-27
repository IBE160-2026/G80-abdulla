# Testhull fra code review v1 gruppe A

## 2026-11-26 kl. 23:45 — Ali Yousef Abdulla

### Oppgave
Fylle testhullene fra code review av v1 gruppe A (`deferred-work.md`): `updateSession` når `getClaims()` kaster, PWA-manifestet, `config.matcher` i `proxy.ts`, `app/error.tsx` og fargen per status i `StatusBadge`. Produksjonskode skulle bare endres hvis en test avdekket en feil. Kjørt med `bmad-build`.

### Plan
- Spec: [spec-testhull-code-review-gruppe-a.md](../../docs/implementation-artifacts/spec-testhull-code-review-gruppe-a.md) (ca. 1900 tokens, holdt samlet).
- Spørsmål til prosjekteieren: `app/error.tsx` testes bare med typetest mot Nexts `ErrorComponent`. Den ekte feilgrensen i e2e er fortsatt utsatt.
- Rød test først, så eventuell fiks, mutasjonssjekk av hver test, review (Blind Hunter, Edge Case Hunter, Verification Gap), patche.

### Resultat
- Branch `test/testhull-gruppe-a` (ikke pushet, ingen PR ennå), to commits:
  - `bd94bec` fix: `updateSession` feiler åpent. Testen med en falsk klient viste at et kast fra `getClaims()` ga avvist løfte, og dermed 500 på alle sider. `shared/supabase/proxy.ts` har nå try/catch som logger bare feilnavnet. Dette er den eneste endringen i produksjonskode. `shared/supabase/proxy-feil.test.ts` dekker data, feil som data, kast, kast etter fornyet sesjon og kast som ikke er en `Error`.
  - `43935b7` tester: `shared/supabase/proxy-matcher.test.ts` (Nexts egen `getMiddlewareMatchers`, ikke en etterligning), `app/manifest.test.ts` (felt, ikonfiler og PNG-mål), `shared/report/status-badge.test.ts`, typetest i `app/error.test.ts`. Spec og `deferred-work.md` oppdatert.
- Mutasjonssjekk: hver test ble bekreftet rød mot en skjult endring i kilden, og kilden satt tilbake.
- Verifisert lokalt: `tsc`, lint og `npm run test:unit` er grønne (92 filer, 1192 tester). Full `npm test` gjenstår i CI.
- Review: 18 funn vurdert i spec-ens Review Triage Log. Patchet blant annet at en catch som bygde ny respons ville mistet den fornyede kapselen, matcher-testen mot Next, og PNG-mål i manifesttesten.
- Lukket i `issues.md`: `getClaims`-punktet og testgap-linja fra reviewen.
- PR #119 er opprettet og flettet 2026-11-27 kl. 10:47 med flettecommit `9e53c3a`, etter at `test` (full `npm test`) og Vercel var grønne. Branchen `test/testhull-gruppe-a` er slettet lokalt og på GitHub.

### Åpne punkter
- Den ekte feilgrensen for `app/error.tsx` i e2e (en feil i lista via en SQL-fixture i reset-prosjektet) er fortsatt utsatt. Kan bare kjøres i CI siden `supabase.exe` er blokkert lokalt.
- Om den ekte `GoTrueClient.getClaims` kaster i stedet for å gi `{ error }` (for eksempel ved feilet JWKS-henting), er ikke vist. Proxyen tåler det nå.
- `getViewer()` har ingen try/catch rundt `getUser()`, så et kast som ikke er `AuthError` gir fortsatt feilsiden på alle sider for innloggede brukere (`deferred-work.md`).
