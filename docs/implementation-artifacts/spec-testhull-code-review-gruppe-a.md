---
title: 'Testhull fra code review v1 gruppe A'
type: 'chore'
created: '2026-11-26'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '9af45aaa91ee974c9249f44f7c87226d1d2cbcc0'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Code review av v1 gruppe A (`deferred-work.md`, 2026-11-25) fant fem hull der kode kan endres eller ødelegges uten at noen test feiler: `updateSession` når `getClaims()` kaster, PWA-manifestet, `config.matcher` i `proxy.ts`, `app/error.tsx` mot Nexts feilkomponent og fargen per status i `StatusBadge`.

**Approach:** Skriv enhetstester (Vitest, prosjektet `unit`) som lukker hullene. Produksjonskode endres bare der en test viser en feil. Det gjelder trolig `updateSession`: et kast fra `getClaims()` (ikke-`AuthError`, for eksempel en feilet JWKS-henting) gir i dag avvist løfte og dermed 500 på alle sider for en bruker med sesjonskapsel, også offentlige. Proxyen skal bare fornye sesjonen og aldri avgjøre tilgang (AR-2), så den skal feile åpent: logge feilen uten innhold fra kapselen, og gi tilbake den uendrede `NextResponse.next({ request })`.

**Beslutninger (prosjekteieren, 2026-11-26):**
- `app/error.tsx` testes bare mot Nexts egen type (`ErrorComponent`). Den ekte feilgrensen i e2e (reset-prosjektet med SQL-fixture) står fortsatt som utsatt i `deferred-work.md`.
- Testene er enhetstester. Ingen ny e2e og ingen endringer i `playwright.config.ts`.

## Boundaries & Constraints

**Always:** Testene kjører i `npm run test:unit` uten Supabase. Meldinger i kommentarer og testnavn er på norsk. Feilen fra `getClaims` logges uten verdier fra kapselen eller tokenet. Sesjonsfornyelsen (`setAll` sender kapsler til både forespørselen og svaret) skal fortsatt virke.

**Never:** Endre `app/manifest.ts`, `app/error.tsx`, `StatusBadge` eller `proxy.ts`-matcheren for å få testene til å passe. Ny npm-pakke. Sende besøkende til innlogging fra proxyen. Hoppede tester (`.skip`).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| getClaims gir data | `{ data, error: null }` | Status 200, ingen `location` | N/A |
| getClaims gir `{ error }` | `AuthError` som data | Status 200, ingen `location` | N/A |
| getClaims kaster | `Error("JWKS")` | Løftet løses med status 200, ingen `location`, én `console.error` uten kapselverdier | Fail-open |
| Fornyet sesjon | `setAll` kalles under `getClaims` | Kapselen står på forespørselen og i `set-cookie` på svaret | N/A |
| Matcher treffer | `/`, `/rapporter/<id>`, `/auth/login`, `/rapporter/ny` | Proxyen kjører | N/A |
| Matcher hopper over | `/_next/static/…`, `/_next/image`, `/favicon.ico`, `/manifest.webmanifest`, `/icons/icon-192.png`, `.svg`, `.jpg`, `.webp` | Proxyen kjører ikke | N/A |
| Manifest | `manifest()` | `display: "standalone"`, `start_url: "/"`, navn, `lang: "nb"`, farger, ikoner på 192 og 512 px som finnes i `public/`, ett ikon med `maskable` | N/A |
| Statusfarge | `new`, `in_progress`, `resolved` | Hver gir sitt eget klassepar og sin norske etikett | N/A |

</frozen-after-approval>

## Code Map

- `shared/supabase/proxy.ts` -- `updateSession`: `await supabase.auth.getClaims()` uten try/catch (linje 43). Legg try/catch rundt kallet, bare der testen feiler.
- `shared/supabase/proxy.test.ts` -- eksisterende test i egen Node-prosess med ekte klient. Ikke rør. Nye tester går i en ny fil.
- `shared/supabase/proxy-feil.test.ts` (ny) -- `vi.mock("@supabase/ssr")` og `vi.mock("@/shared/lib/env")` (env valideres ved import). Importerer `updateSession` i prosessen.
- `shared/supabase/proxy-matcher.test.ts` (ny) -- importerer rot-`proxy.ts` (`vi.mock` av `@/shared/supabase/proxy`) og leser `config.matcher`. Rot-`proxy.test.ts` hadde falt utenfor `include` i `vitest.config.ts`. Matcheren er `"/((?!…).*)"`: pakk ut gruppen og bygg `^/(…)$` mot stien. Sjekker også at `proxy()` gir svaret fra `updateSession`.
- `app/manifest.test.ts` (ny) -- kaller `manifest()` fra `app/manifest.ts` og sjekker feltene, og at hvert `src` finnes under `public/`. `e2e/les/manifest.spec.ts` (serverer ikonene som PNG) beholdes.
- `app/error.test.ts` -- legg til en typetest med `expectTypeOf` mot `ErrorComponent` fra `next/dist/client/components/error-boundary`. Typecheck er slått på for `app/**/*.test.ts`.
- `shared/report/status-badge.test.ts` (ny) -- `renderToStaticMarkup` som i `features/rapporter/components/report-card.test.ts`. `STATUS_CLASSES` er ikke eksportert og skal ikke eksporteres, så testen sjekker klassene i HTML-en.
- `docs/implementation-artifacts/deferred-work.md`, `.logs/ali-yousef-abdulla/issues.md` -- marker lukkede hull.

## Tasks & Acceptance

**Execution:**
- [x] `shared/supabase/proxy-feil.test.ts` -- rader for `getClaims` (data, `{ error }`, kaster) og fornyet sesjon -- viser om `updateSession` må feile åpent.
- [x] `shared/supabase/proxy.ts` -- try/catch rundt `getClaims()` som logger og lar svaret gå videre, bare hvis testen over feiler uten den -- 500 på offentlige sider.
- [x] `shared/supabase/proxy-matcher.test.ts` -- matcheren mot stiene i matrisen og delegeringen -- et ødelagt uttrykk stopper sesjonsfornyelsen.
- [x] `app/manifest.test.ts` -- feltene i matrisen -- fjernet `display` eller `maskable` feiler.
- [x] `app/error.test.ts` -- typetest mot `ErrorComponent` -- propnavnet `retry` kan ikke drive vekk fra Next.
- [x] `shared/report/status-badge.test.ts` -- tabelltest for tre statuser: etikett og klasser, og at klassene er ulike -- byttede farger feiler.
- [x] `deferred-work.md` og `issues.md` -- marker hullene som lukket, `error.tsx`-e2e som fortsatt utsatt.

**Acceptance Criteria:**
- Given at `getClaims()` kaster, when `updateSession` kjøres, then løses løftet med status 200 uten omdirigering og uten kapselverdier i loggen.
- Given at en matcher-, manifest- eller statusfarge-linje endres, when `npm run test:unit` kjøres, then feiler en test.
- Given `npm test` i CI, when PR-en kjøres, then er alle Vitest-, pgTAP- og Playwright-tester grønne.

## Implementation Notes

- Implementert direkte i denne økta, uten implementasjonsagent. Den røde testen kom først: med en falsk klient som kaster, slapp `updateSession` kastet videre som avvist løfte. Så ble try/catch lagt til i `shared/supabase/proxy.ts`. Det er den eneste endringen i produksjonskode, og den bør vurderes for seg (egen commit). Loggen har bare feilnavnet, aldri meldingen.
- Om den ekte `GoTrueClient.getClaims` kaster i stedet for å gi `{ error }`, er ikke vist. Testen viser bare at proxyen tåler det.
- Matcher-testen bruker Nexts egen `getMiddlewareMatchers` (intern modul uten typer, hentet med `createRequire`). Next gjør `\.` i uttrykket om til et vilkårlig tegn, så en håndlaget regex ville gitt et annet svar enn Next.
- Mutasjonssjekk (kilden endres, testen blir rød, kilden settes tilbake): uten try/catch (4 røde), catch som gir ny respons (1 rød), logger meldingen (2 røde), matcher uten manifest og uten webp (1 rød hver), manifest uten `display`, uten `maskable`, med feil ikonsti og med feil størrelse (1 rød hver), byttet statusfarge (1 rød), `error.tsx` med `reset` i stedet for `retry` (4 røde, tre av dem typefeil).
- Verifisert: `tsc`, lint og `npm run test:unit` er grønne. Full `npm test` gjenstår i CI.

## Spec Change Log

## Review Triage Log

Verdiene er mine, ikke reviewernes. BH = Blind Hunter, EC = Edge Case Hunter, VG = Verification Gap.

| Funn | Verdikt | Begrunnelse og utfall |
|------|---------|-----------------------|
| BH/VG/EC: `issues.md` har en `PLACEHOLDER`-lenke | medium | Ekte, fylles når sesjonsloggen skrives. **Patchet** |
| BH/EC: `issues.md` viser testgap-linja som åpen | low | Ekte. **Patchet**: lukket, og `error.tsx`-e2e står som egen åpen linje |
| BH: «viste» overstiller hva testen viser (falsk klient, ikke ekte `getClaims`) | low | Ekte. **Patchet**: `deferred-work.md` og notatene sier hva som er vist |
| VG: ingen test for `setAll` etterfulgt av kast | medium | Ekte, en catch som bygget ny respons ville mistet den fornyede kapselen uten at noe feilet. **Patchet**: ny test, bekreftet rød med den mutasjonen |
| EC: `expect` i `getClaims`-callbacken svelges av catch | low | Ekte. **Patchet**: alt leses ut og sjekkes etter kallet |
| BH: kast som ikke er `Error` er ikke testet | low | **Patchet**: ny test med tekst som kast |
| BH/VG/EC: matcher-testen etterligner Next | medium | Ekte, og en etterligning ga avvikende svar (`\.`). **Patchet**: bruker Nexts `getMiddlewareMatchers` |
| BH/EC: matcher-rader for store bokstaver, `/_next/data` og `/favicon.icon` | low | Ville låst fast tilfeldig atferd som ingen bruker. Avvist |
| BH/EC: manifest-testen sjekker ikke PNG-målene, tom `icons`, `sizes` som `undefined` | low | **Patchet**: leser IHDR, krever ikoner og `sizes`. `import.meta.dirname` byttet til `fileURLToPath(new URL(…))` |
| BH: manifest-testen låser navn og språk | low | Det er meningen: teksten er det brukeren ser når appen installeres. Avvist |
| BH: status-testen er skjør (regex, Tailwind-navn) | low | `Badge` gir ett `class`-attributt, og klassenavnene er det testen skal låse. Avvist |
| BH/EC: typetesten virker bare om Vitest typecheck er på, og bruker intern sti | false | Mutasjonen ga tre typefeil i Vitest og i `tsc`, så den er på. Den interne stien feiler tydelig ved oppgradering |
| EC: typetesten viser ikke at Next faktisk sender `retry` | low | Dekket av typen. Selve feilgrensen i e2e er valgt bort av prosjekteieren, utsatt |
| BH/EC: fail-open dekker bare proxyen, `getViewer()` kan fortsatt kaste | low | Ekte, men eksisterte før. **Utsatt** (`deferred-work.md`) |
| EC: logg bare navnet, ikke `cause` | low | Navnet er nok, og meldingen kan ha kapselverdier. Avvist |
| BH: spec-filen er uferdig, og mutasjonssjekkene har ikke bevis | medium | Fylt ut over |
| BH: produksjonskode endres i en `chore`-oppgave | low | Er sagt i spec-en. **Patchet**: egen commit og nevnt i PR-teksten |

## Verification

**Commands:**
- `npx tsc --noEmit` og `npm run lint` -- ingen feil.
- `npm run test:unit` -- grønt, med de nye filene (typecheck inkludert).
- Mutasjonssjekk for hver ny test (skjult endring i kilden gir rødt, deretter tilbake): fjern try/catch, endre matcher, fjern `display`, bytt to statusklasser.
- Full `npm test` i CI.
