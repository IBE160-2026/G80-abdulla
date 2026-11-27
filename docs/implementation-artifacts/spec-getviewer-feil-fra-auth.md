---
title: 'Auth-feil gir allerede en besøkende, og «Logg ut» låses med test'
type: 'chore'
created: '2026-11-27'
status: 'done'
route: 'dispatch'
review_loop_iteration: 1
baseline_commit: '742752f862bc6d6d537e59603e4dd31229759350'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** To åpne punkter i `deferred-work.md` (testhull-code-review-gruppe-a) sa at `getViewer()` og «Logg ut» manglet feilhåndtering når Auth ikke svarer: `getViewer` har ingen try/catch rundt `auth.getUser()`, og «Logg ut» (`signOut({ scope: "local" })`) gir ingen beskjed når kallet feiler. Begge antakelsene viste seg å være uprøvde.

**Approach:** Prøv dem mot den ekte klienten (`auth-js`) i stedet for en falsk. Funn (2026-11-27): `getUser()` kaster ikke ved nettverksfeil eller 5xx. De kommer som data (`AuthRetryableFetchError`), og `getViewer` gir da en besøkende, ikke feilsiden. `signOut({ scope: "local" })` fjerner sesjonen i nettleseren før nettverkskallet og gir bare `{ error }`, så brukeren er logget ut og står på lista som besøkende. Koden endres derfor ikke. Oppførselen låses med tester, og de to punktene lukkes som «ingen feil, premisset var feil».

**Beslutninger (prosjekteieren, 2026-11-27):**
- Ved feil fra Auth vises siden som for en besøkende (slik det allerede er), ikke feilsiden.
- «Logg ut»: behold koden, lås oppførselen med test. Ingen toast.
- Først bygget jeg en try/catch i `getViewer` på det feilaktige premisset. Prosjekteieren valgte å fjerne den etter review (den fanget bare sjeldne feil som ikke er Auth-feil, og var da død forsvarskode).

## Boundaries & Constraints

**Always:** Testene bruker den ekte `auth-js`-klienten, med falsk fetch og lagring, så en oppgradering som begynte å kaste, feiler i test og ikke i produksjon. En Auth-feil gir aldri mer tilgang enn før (`isModerator: false`). `signOut({ scope: "local" })` er uendret (vakttesten i `shared/supabase/client.test.ts`).

**Never:** Endre `shared/supabase/auth.ts`, `user-menu.tsx`, `requireUser`, `proxy.ts` eller layouten. Ny npm-pakke. Hoppede tester.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Nettverksfeil mot Auth | `fetch` kaster `TypeError` eller en tekst | `getViewer` gir `{ user: null, isModerator: false }`, uten kast og uten profilslåing | Kommer som data fra `auth-js` |
| Feil fra Auth | 500, 503 eller 401 | Samme | Samme |
| requireUser ved Auth-feil | Som over | Omdirigering til `/auth/login?next=…` | N/A |
| Logg ut, Auth svarer ikke | `/auth/v1/logout` avbrutt, innlogget bruker | Brukeren står på `/` som besøkende, uten sesjonskapsel, og «Logg inn» i menyen etter ny innlasting | Kallet er forsøkt |

</frozen-after-approval>

## Code Map

- `shared/supabase/auth.ts` -- `getViewer` leser bare `data.user` fra `getUser()` og ignorerer `error`. Uendret.
- `shared/supabase/auth-utfall.test.ts` (ny) -- `vi.mock("./server")` gir en ekte `createClient` fra `@supabase/supabase-js` med falsk fetch og lagring (en sesjon som ikke er utløpt). Fem utfall for både `getViewer` og `requireUser`.
- `shared/supabase/auth.test.ts` -- eksisterende test med falsk serverklient. Uendret.
- `e2e/les/innlogging.spec.ts` -- ny test «Logg ut når Auth ikke svarer, logger likevel ut denne nettleseren» med `page.route("**/auth/v1/logout**", route => route.abort())`.
- `docs/implementation-artifacts/deferred-work.md`, `.logs/ali-yousef-abdulla/issues.md`, `docs/beslutninger/arkitektur-beslutningslogg.md` og `ux-beslutningslogg.md` -- løste punkter og rettelsen av premisset.
- Ikke endre: `user-menu.tsx`, `proxy.ts`, `app/layout.tsx`, `shared/supabase/auth.ts`.

## Tasks & Acceptance

**Execution:**
- [x] `shared/supabase/auth-utfall.test.ts` -- fem Auth-utfall mot den ekte klienten, for `getViewer` og `requireUser` -- låser at en Auth-feil gir en besøkende
- [x] `e2e/les/innlogging.spec.ts` -- test for «Logg ut» med sperret `/auth/v1/logout` -- låser at sesjonen er borte lokalt
- [x] `deferred-work.md`, `issues.md`, beslutningslogger -- løste punkter og rettelsen av premisset

**Acceptance Criteria:**
- Given at Auth gir nettverksfeil, 5xx eller 401, when en side lastes, then vises den som for en besøkende (ikke feilsiden).
- Given en innlogget bruker og en avbrutt `/auth/v1/logout`, when brukeren velger «Logg ut», then står brukeren på lista som besøkende, uten sesjonskapsel.
- Given `npm test` i CI, when PR-en kjøres, then er alle Vitest-, pgTAP- og Playwright-tester grønne.

## Implementation Notes

- Først implementert slik spec-en opprinnelig var skrevet: try/catch i `getViewer`, tester med en falsk klient som kaster, og e2e-testen for «Logg ut». Review (alle tre lag) pekte på at `getUser` ikke kaster ved et vanlig Auth-utfall. Prøvd mot den ekte klienten: nettverksfeil, 500 og tekst-kast kommer som data (`AuthRetryableFetchError`), og bare feil i lagringen kaster. Prosjekteieren valgte å fjerne try/catch og låse dagens oppførsel. `auth.ts` er dermed uendret fra `742752f`.
- `signOut({ scope: "local" })` (`auth-js` 2.119.0, `_signOut`): sesjonen fjernes lokalt før kallet, og nettverksfeil og 500 gir `{ error }` uten kast. Prøvd mot den ekte klienten. Sesjonen er borte i alle tilfeller. Restrisiko: ved feil blir ikke refresh-tokenet tilbakekalt hos serveren. Ført som åpent punkt.
- Mutasjonssjekk: `getViewer` som kaster på en returnert Auth-feil gir 10 røde tester. `scope: "global"` i `user-menu.tsx` gir rød e2e-test (sesjonskapselen blir stående). Begge satt tilbake.
- Verifisert lokalt: `tsc`, lint og `npm run test:unit` er grønne, og `innlogging.spec.ts` var 34/34 i `les-360` og `les-1280` med e2e-testen for «Logg ut». Full `npm test` gjenstår i CI.

## Spec Change Log

- 2026-11-27 (loopback etter review, intent_gap): `<frozen-after-approval>` sa at et kast fra `getUser` ga feilsiden ved Auth-utfall, og ba om try/catch i `getViewer`. Prøvd mot den ekte klienten: det kaster ikke. Prosjekteieren valgte å fjerne try/catch og låse dagens oppførsel. Frossen tekst skrevet om til det som er bestemt. KEEP: e2e-testen for «Logg ut» og beslutningen om at en Auth-feil gir en besøkende.

## Review Triage Log

Verdiene er mine, ikke reviewernes. BH = Blind Hunter, EC = Edge Case Hunter, VG = Verification Gap.

| Funn | Verdikt | Begrunnelse og utfall |
|------|---------|-----------------------|
| BH/EC/VG: premisset om at `getUser` kaster ved Auth-utfall er ikke prøvd, og `auth-js` gir det som data | high | Ekte: prøvd mot den ekte klienten. Gav intent_gap og loopback. Prosjekteieren valgte å fjerne try/catch. **Løst** |
| BH/EC: `catch` svelger Next-kontrollflyt og programmeringsfeil | medium | Moot etter at try/catch er fjernet |
| BH/EC: et kast i `requireUser` sender brukeren til innlogging og skjemainnholdet går tapt | low | Gjelder Auth-feil, som alt ga en besøkende før denne endringen. Låst med test. Ikke en regresjon |
| BH: `createClient()` utenfor try har ingen test | false | Ingen try/catch lenger |
| BH: restrisikoen (refresh-token ikke tilbakekalt) er ikke et åpent punkt | low | Ekte. **Patchet**: ført i `issues.md` |
| BH/EC: degradert tilstand er usynlig, ingen toast eller varsel | low | Ikke et nytt problem: en Auth-feil ga allerede en besøkende. Prosjekteieren har valgt ingen toast |
| BH: `let user` dupliserer `ViewerUser` | false | Koden er fjernet |
| BH: arkitekturloggen ikke i AD-3, spec-status, kolonnebredde i testkommentar | low | Loggen er rettet (ingen kodeendring), spec fylt ut. Kolonnebredden følger fila |
| BH: `expect(logoutRequests).toBe(1)` kan bli ustabil | low | **Patchet**: `toBeGreaterThan(0)` |
| EC: returnert `AuthError` logges ikke, så et ekte utfall er usynlig i loggene | low | Ville vært ny oppførsel utover det som er bedt om. Avvist, ikke i omfang |
| EC: `signOut` kan avvise (SIGNED_OUT-lytter eller lagring kaster), og `router.replace` hoppes over | low | Appen har ingen `onAuthStateChange`-lytter, så kastet er teoretisk. Avvist |
| EC/VG: ingen e2e der `/auth/v1/user` svikter | low | `getUser` kjører på serveren, så nettleseren kan ikke avbryte kallet. Enhetstestene mot den ekte klienten dekker utfallet |
| VG: `scope: "local"` er bare vaktet som kildetekst | low | Dekket av e2e-testen, som feiler med `"global"` (mutasjonssjekket) |

## Verification

**Commands:**
- `npx tsc --noEmit` og `npm run lint` -- ingen feil.
- `npm run test:unit` -- grønt, og `auth-utfall.test.ts` er rød hvis `getViewer` kaster på en returnert Auth-feil.
- Mutasjonssjekk: `getViewer` som kaster ved Auth-feil (rød), `scope: "global"` i `user-menu.tsx` (e2e-testen rød).
- Lokal e2e med `next start -p 3100` og `--no-deps`, og full `npm test` i CI.
