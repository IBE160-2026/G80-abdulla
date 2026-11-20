---
title: 'Rett den ustabile innloggingstesten (epic-2-retro-item-6)'
type: 'bugfix'
created: '2026-11-20'
status: 'in-progress'
route: 'oneshot'
review_loop_iteration: 0
baseline_commit: '55eb89c9f6f909180e57d9c00f1fee3e12cc3e9e'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `e2e/les/innlogging.spec.ts` feiler tilfeldig i CI og stopper hele Playwright-kjøringen (96 tester kjøres ikke). `:98` («Logg ut» med tastatur) feilet 7 av 50 ganger lokalt, og `:44` feiler i CI på axe `color-contrast` på `.break-all, .relative`. Det blokkerer PR #67 og er action item `epic-2-retro-item-6` (retro F1).

**Approach:** Rett rotårsakene i testhjelperne, ikke i appen. `openMenu` skal åpne og returnere en *åpen* meny og ikke ta en meny som tones ut for en åpen. axe-hjelperen skal vente til endelige CSS-animasjoner og overganger er ferdige før den måler, slik den allerede gjør for toaster. Bevis begge rotårsakene før rettelsen og vis at testene er stabile etterpå med `--repeat-each`, lokalt og i CI.

</frozen-after-approval>

## Implementation Notes

**Rotårsak, «Logg ut» med tastatur (`:98` på `main`), bevist med trace (`les-1280`):** «Logg ut» trykkes ved 764 ms og lukker menyen, som tones ut i 150 ms (`data-[state=closed]:animate-out fade-out-0 zoom-out-95` i `components/ui/dropdown-menu.tsx`). Etter navigasjonen kaller `openMenu` (`e2e/auth.ts`) `menu.isVisible()` ved 898 ms. Den gamle menyen finnes fortsatt med `data-state="closed"`, så `isVisible` gir `true`, hjelperen klikker ikke, og `toBeVisible` består. Når uttoningen er ferdig, fjernes menyen, og fokus går tilbake til «Meny» (`[active]` i sidens øyeblikksbilde). `toHaveText(["Logg inn"])` finner da 0 menypunkter i 5 s. Det svarer på det åpne spørsmålet i retroen (`epic-2-retro-2026-11-18.md`, F1): kappløpet er i testen, ikke i appen. Hypotesen B4 (`router.refresh()` monterer `UserMenu` på nytt) stemmer ikke, og Next 16.4 rører ikke fokus ved navigasjon.

**Rotårsak, «en besøkende ser «Logg inn» i menyen …» (`:44` på `main`), bevist med sonde:** axe kjører rett etter at menyen er åpnet, mens den tones inn (`fade-in-0 zoom-in-95`, 150 ms). axe regner kontrast med den halvgjennomsiktige fargen og gir falske brudd på e-postadressen (`.break-all`) og menypunktet (`.relative`). Med animasjonene senket til en tidel (`Animation.setPlaybackRate 0.1` via CDP, som en treg CI-maskin) gir axe nøyaktig CI-feilen `color-contrast (serious): 2 noder: .break-all, .relative`.

**Rettelse (bare testkode, appen er uendret):**
- `e2e/auth.ts`: `openMenu` venter til ingen meny med `data-state="closed"` finnes, åpner menyen hvis det ikke finnes en åpen, og returnerer en locator for menyen med `data-state="open"`.
- `e2e/a11y.ts`: ny eksportert `waitForAnimations(page)`, som venter til alle endelige animasjoner og overganger (`document.getAnimations()`) er ferdige. Uendelige animasjoner (skjelettet, spinneren) teller ikke. Etter 10 s feiler den og lister elementet og animasjonen som fortsatt kjører. `expectNoSeriousA11yViolations` kaller den før axe. Ventingen på toaster beholdes: en Sonner-toast kan stå ett bilde med opasitet 0 før overgangen starter, og da ville `getAnimations()` vært tom.
- `e2e/les/innlogging.spec.ts`: ny regresjonstest, «menyen tones inn og ut uten at axe eller openMenu tar feil, også med trege animasjoner». Den logger inn, senker animasjonene til en tidel, kjører axe på den åpne menyen, trykker «Logg ut» og åpner menyen igjen mens den gamle tones ut. Det er de to virkelige flytene fra de ustabile testene. Påstanden etter Escape i registreringstesten bruker `page.getByRole("menu")`, siden `openMenu` nå bare gir den åpne menyen.
- `e2e/les/helpers.spec.ts`: to tester for axe-hjelperen. Den venter til en inntoning er ferdig (opasitet 0,2 i 10 s, så 1, og den rå axe-kjøringen finner bruddet først), og den venter ikke på en uendelig animasjon (testen sjekker først at animasjonen kjører og er uendelig).

**Utenfor:** `core-flow.spec.ts` (`document-title (serious)` under klientnavigasjon, `issues.md`) har en annen årsak, siden tittelen mangler et øyeblikk. `waitForAnimations` dekker den ikke. Den blir et eget punkt.

## Review Triage Log

Gjennomgang: én kontekstfri reviewer (Blind Hunter), 13 funn.

- 1 **low, patch:** `toBeHidden()` på den åpne menyen ble trivielt sann etter Escape. Bruker nå `page.getByRole("menu")`.
- 2 **medium, patch:** `waitForAnimations` hadde ingen timeout og ingen forklaring ved feil. Nå 10 s og en liste over animasjonene som kjører. Delen om `toHaveCount(0)` i `openMenu` er **false**: den har `timeout: 1_000` i `toPass`.
- 3 **medium, patch:** testen for inntoning brukte ikke den ekte menyen. Regresjonstesten kjører nå axe på den ekte menyen under senket animasjon.
- 4 **low, patch:** forutsetningen på 4 s var tidsavhengig på en treg maskin. Nå 10 s.
- 5 **low, patch:** testen for uendelig animasjon sjekket ikke at animasjonen kjørte. Sjekker nå `[["running", Infinity]]` først.
- 6 **low, patch:** `openMenu`-testen brøt med premisset i `helpers.spec.ts` og er flyttet til `innlogging.spec.ts`. Chromium-vakten (`test.skip`) er **avvist**: vakttesten i `playwright.config.test.ts` forbyr `test.skip` i `e2e/` («Definisjon av ferdig»), og alle prosjektene er Desktop Chrome.
- 7 **medium, patch:** regresjonstesten lukket menyen med Escape, ikke «Logg ut» og navigasjon. Den bruker nå «Logg ut».
- 8 **low, patch:** kommentarene viste til linjenumre. De viser nå til testnavn og `epic-2-retro-item-6`.
- 9 **low, patch:** én JSDoc-linje var ikke brutt om.
- 10 **medium, patch:** intensjonen krever `--repeat-each` også i CI. Kjøres på en midlertidig `ci/`-gren (se Verifisering).
- 11 **medium, patch:** den lokale gjentakelsen viste ikke at `:44` er rettet. Dekket av regresjonstesten med senket animasjon og mutasjonssjekken under.
- 12 **low, patch:** specen manglet resultater og `baseline_commit`. Lagt inn.
- 13 **low, patch:** «Utenfor» stemte ikke med `issues.md`, der `core-flow`-punktet var slått sammen med denne testen. Punktet skilles ut i `issues.md`.

## Verification

Kjørt i en ny klone i Temp mot lokal Supabase:

- **Før rettelsen:** `npx playwright test e2e/les/innlogging.spec.ts -g "…" --project les-360 --project les-1280 --repeat-each 25` ga 7 feil av 50 for «Logg ut» med tastatur og 0 av 50 for den andre testen (den feilet bare i CI).
- **Mutasjonssjekk av regresjonstesten:** gammel axe-hjelper gir 6 feil av 6 (`color-contrast (serious): 2 noder: .break-all, .relative`), og gammel `openMenu` gir 6 feil av 6 (`toBeVisible`, menyen er borte). Gammel axe-hjelper gir også feil i inntoningstesten i `helpers.spec.ts`.
- **Etter rettelsen:** de ustabile testene, regresjonstesten og testene for axe-hjelperen med `--repeat-each 20` på begge bredder gir 200 av 200 bestått.
- **Full `npm test`:** se PR-beskrivelsen.
- **CI:** `npm-test.yml` på branchen, og en midlertidig `ci/`-gren med `--repeat-each 20` på Linux.
