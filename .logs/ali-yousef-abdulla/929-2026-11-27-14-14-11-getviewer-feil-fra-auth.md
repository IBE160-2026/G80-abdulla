# Auth-feil gir allerede en besøkende, og «Logg ut» låses med test

## 2026-11-27 kl. 14:14 — Ali Yousef Abdulla

### Oppgave
Ta de to siste kodepunktene fra testhull-runden: `getViewer()` mangler try/catch rundt `getUser()`, og «Logg ut» mangler feilhåndtering. Kjørt med `bmad-build`. Før det: PR #120 (opprydding i arbeidsfiler, komponentlista og KI-loggen) ble flettet (`742752f`), og de gamle branchene ble slettet.

### Plan
- Spørre prosjekteieren hva en bruker skal se ved feil, og skrive spec ([spec-getviewer-feil-fra-auth.md](../../docs/implementation-artifacts/spec-getviewer-feil-fra-auth.md)).
- Rød test først, så try/catch i `getViewer`, e2e-test for «Logg ut», mutasjonssjekk og review.
- Underveis ble premisset prøvd mot den ekte `auth-js`-klienten (se Resultat).

### Resultat
- **Premisset for «Logg ut» var feil.** Mot den ekte klienten: `signOut({ scope: "local" })` fjerner sesjonen i nettleseren før nettverkskallet, og nettverksfeil og 500 gir bare `{ error }` (kaster ikke). Brukeren er logget ut og står på lista som besøkende. Prosjekteieren valgte å beholde koden og låse oppførselen med en e2e-test.
- **Premisset for `getViewer` var også feil.** Jeg bygde først try/catch med en falsk klient som kaster, og tre reviewere pekte uavhengig på at `getUser()` ikke kaster ved et vanlig Auth-utfall. Mot den ekte klienten kommer nettverksfeil, 500 og tekst-kast som data (`AuthRetryableFetchError`), og `getViewer` gir da en besøkende. Bare feil som ikke er Auth-feil kaster. Spørsmålet gikk tilbake til prosjekteieren (intent_gap), som valgte å fjerne try/catch og låse dagens oppførsel. `shared/supabase/auth.ts` er uendret.
- **Tester:** `shared/supabase/auth-utfall.test.ts` (ny, 5 Auth-utfall for `getViewer` og `requireUser` mot den ekte klienten) og e2e-testen «Logg ut når Auth ikke svarer, logger likevel ut denne nettleseren» i `e2e/les/innlogging.spec.ts`. Mutasjonssjekk: `getViewer` som kaster på en returnert Auth-feil gir 10 røde tester, og `scope: "global"` i `user-menu.tsx` gir rød e2e-test.
- **Dokumenter:** begge punktene er lukket i `deferred-work.md` og `issues.md` med rettelsen av premisset, og arkitektur- og UX-loggen har en beslutning hver. Spec-en er skrevet om til det som er bestemt (frosset tekst endret etter loopback, ført i Spec Change Log).
- Verifisert lokalt: `tsc`, lint og `npm run test:unit` (1204 tester) er grønne, og `innlogging.spec.ts` var 34/34 i begge prosjekter med e2e-testen. Full `npm test` gjenstår i CI.
- Review: 13 funn vurdert i spec-ens Review Triage Log.
- PR #121 er opprettet og flettet 2026-11-27 kl. 14:29 med flettecommit `ebcd509`, etter at `test` (full `npm test`, den nye e2e-testen inkludert) og Vercel var grønne. Branchen `fix/getviewer-feil-fra-auth` er slettet lokalt og på GitHub.

### Åpne punkter
- Restrisiko ved «Logg ut»: når kallet til Auth feiler, blir refresh-tokenet ikke tilbakekalt hos serveren. Avgjør å akseptere det for v1 eller å gjøre noe med det.
