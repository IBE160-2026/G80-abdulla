# Ustabil innloggingstest

## 2026-11-20 kl. 13:50 — Ali Yousef Abdulla

### Oppgave
Rett den ustabile `e2e/les/innlogging.spec.ts` (`:98` «Logg ut» med tastatur og `:44` axe `color-contrast`), som stoppet hele Playwright-kjøringen i CI og blokkerte PR #67. Action item `epic-2-retro-item-6` (retro F1, Story 2.1 B4).

### Plan
- Spec: [spec-epic-2-retro-6-ustabil-innloggingstest.md](../../docs/implementation-artifacts/spec-epic-2-retro-6-ustabil-innloggingstest.md) (oneshot, bugfix).
- Reprodusere begge feilene før rettelsen (`--repeat-each 25`, trace og sonde med senket animasjon).
- Rette rotårsakene i testhjelperne, ikke i appen.
- Mutasjonssjekk av regresjonstestene, én kontekstfri review (Blind Hunter, 13 funn), så full `npm test` og `--repeat-each 20` i CI.

### Resultat
- **Rotårsak `:98`:** «Logg ut» lukker menyen, som tones ut i 150 ms. `openMenu` kalte `isVisible()` på den gamle menyen (`data-state="closed"`), tok den for åpen og klikket ikke. Lokalt 7 feil av 50.
- **Rotårsak `:44`:** axe målte kontrast mens menyen tones inn, med halvgjennomsiktig farge. Gir nøyaktig CI-feilen når animasjonen senkes til en tidel.
- **Hypotesen B4 stemte ikke:** `router.refresh()` remonterer ikke `UserMenu`. Kappløpet var i testen, ikke i appen.
- **Rettelse (bare testkode):** `e2e/auth.ts` (`openMenu` venter til ingen lukket meny finnes og returnerer den åpne), `e2e/a11y.ts` (ny `waitForAnimations`, kalt før axe), regresjonstest i `e2e/les/innlogging.spec.ts`, to tester for axe-hjelperen i `e2e/les/helpers.spec.ts`.
- **Mutasjonssjekk:** gammel axe-hjelper og gammel `openMenu` gir hver 6 feil av 6 i regresjonstesten.
- **Verifisering:**
  - Lokalt `--repeat-each 20`: 200 av 200.
  - Full `npm test` lokalt (ny klone i Temp): Vitest unit 983/983, pgTAP PASS, Vitest db 44/44, Playwright 258/258, 616 s.
  - CI full `npm test` (run 44732827431): `success`, 10 min 13 s.
  - CI `--repeat-each 20` på Linux (run 44732840134, midlertidig gren `ci/ustabil-innloggingstest-repeat`): 840 av 840, 26,2 min.
- **Commits:** `7d09042` (rettelsen, spec, sprintstatus og `issues.md`) på `fix/ustabil-innloggingstest`. Spec satt til `done`, `epic-2-retro-item-6` satt til `done`.
- **Lukket i `issues.md`:** Story 2.1 B4, `:98` fra Story 2.3 og `:44`/`:98` fra Story 2.5.
- Den midlertidige `ci/`-grenen er slettet etter kjøringen.

### Åpne punkter
- `core-flow.spec.ts` (`document-title (serious)` under klientnavigasjon) har en annen årsak og er ikke dekket av `waitForAnimations`; punktet står åpent i `issues.md` (fra Story 3.3).
- Retro-punkt 9 (skal `npm-test.yml` kjøre på alle PR-er og blokkere flett) er fortsatt åpent. `--repeat-each` i CI trengte en midlertidig gren og en endret arbeidsflyt, og full kjøring tar 10 min.
