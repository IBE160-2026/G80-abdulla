---
title: 'Brukermenyen blir et åpne-/lukkepanel'
type: 'feature'
created: '2026-11-26'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '2eaab7f47acf8ba9380dbbb82906959ea7c6b3e0'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Menyen i topplinja er en Radix `DropdownMenu` med `modal={false}`. Det var et KI-forslag fra Story 2.1 som prosjekteieren ikke godkjente (`ux-beslutningslogg.md`, 2026-11-26). Standardmenyen (modal) ga axe-feilen `aria-hidden-focus` (serious), fordi siden bak får `aria-hidden` mens lenkene der fortsatt kan få fokus.

**Approach:** ☰ blir en vanlig knapp med `aria-expanded` og `aria-controls` som viser og skjuler et panel under topplinja (ikke `role="menu"`). Panelet har samme innhold som i dag. Siden bak får verken `aria-hidden` eller fokusfelle, så årsaken til axe-feilen er borte. Beslutning (prosjekteieren, 2026-11-26): åpne-/lukkepanel.

**Beslutninger:**
- Fokus blir på knappen når panelet åpnes. Panelet står rett etter knappen i DOM, så Tab går inn i det. Piltaster brukes ikke.
- Escape lukker panelet og gir fokus tilbake til knappen. Klikk utenfor, Tab ut av panelet og valg av «Logg inn» eller «Logg ut» lukker det også.
- Ingen inn- eller uttoning, så det finnes ikke noe «lukkes»-vindu som kan lure testene.
- Innholdet er uendret: besøkende ser «Logg inn» (lenke med `next`), innloggede ser e-postadressen, «Moderator» for moderatoren og «Logg ut».

## Boundaries & Constraints

**Always:** Knappen heter «Meny», er 44 × 44 px og har fokusring. Lenken og knappen i panelet er minst 44 px høye. Panelet er innenfor skjermen ved 320 px (`max-w-[calc(100vw-32px)]`, e-post bryter). `signOut({ scope: "local" })` og `loginHref` er uendret. Axe uten serious-brudd og uten horisontal scrolling med panelet åpent ved 1280, 360 og 320 px.

**Never:** Bruke `aria-hidden` eller `inert` på resten av siden. Bruke `role="menu"` eller `role="menuitem"`. Ny npm-pakke. Endre `getViewer`, `MenuViewer` eller layouten ut over det komponenten krever.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Åpne | Klikk, Enter eller mellomrom på ☰ | `aria-expanded="true"`, panelet synlig, fokus på knappen | N/A |
| Escape | Panel åpent, fokus på knappen eller i panelet | Lukket, fokus på ☰ | N/A |
| Klikk utenfor | Panel åpent | Lukket | N/A |
| Tab ut | Fokus går forbi siste valg | Lukket | N/A |
| Logg inn | Besøkende velger «Logg inn» | Lukket, `/auth/login?next=…` | N/A |
| Logg ut | Innlogget velger «Logg ut» | Lukket, lista vises som for en besøkende | N/A |

</frozen-after-approval>

## Code Map

- `features/auth/components/user-menu.tsx` -- hele komponenten. Beholder `MenuViewer`, `loginHref`, `logOut` og `ITEM`. Fjerner Radix. Panelet er en `div role="group" aria-label="Konto"` i en `relative`-wrapper, `absolute right-0 top-full z-50`, `bg-popover`, kant og skygge.
- `shared/ui/dropdown-menu.tsx` og `package.json` (`@radix-ui/react-dropdown-menu`) -- brukes bare av menyen i dag. Fjernes sammen med pakken (`npm uninstall`, så `package-lock.json`), etter at `grep -ri dropdown` bekrefter at ingen andre bruker dem.
- `e2e/auth.ts` -- `menuButton` (uendret) og `openMenu`: gir nå panelet (`getByRole("group", { name: "Konto" })`) og trenger ikke vente på uttoning.
- `e2e/les/innlogging.spec.ts` -- `menuitem` blir `link` («Logg inn») og `button` («Logg ut»); `getByRole("menu")` blir panelet. Testen «menyen tones inn og ut … trege animasjoner» (l. 119–151) gjelder en animasjon som ikke finnes mer: erstattes av en test av Escape, klikk utenfor, Tab ut og `aria-expanded`.
- `e2e/core-flow.spec.ts` (l. 181–211, 382–399) og `e2e/endrer/registrering.spec.ts` (l. 39–55) -- tastaturflyten: Enter på ☰, så Tab til første valg (fokus står på knappen).
- `shared/supabase/client.test.ts` -- vakt som leser `user-menu.tsx` (`signOut`, `scope: "local"`). Skal bestå uendret.
- Dokumenter, begge kopier av `EXPERIENCE.md` (`docs/ux/` og `docs/planning-artifacts/ux-designs/ux-LocalFix-2026-10-11/`): raden «Meny» i Component Patterns (nedtrekksmeny og piltaster) og «Information Architecture» (l. 45). Også `epic-2-context.md` l. 40 (piltaster), `ux-beslutningslogg.md` (lukk det åpne punktet 2026-11-26, ny beslutning og endring) og `arkitektur-beslutningslogg.md` ved behov. `epics.md` UX-DR4 og Story 2.1-kriteriene sier bare «åpner menyen» og beholdes.
- Ikke endre: `app/layout.tsx`, `shared/layout/site-header.tsx`, gamle `spec-*.md`, mockups.

## Tasks & Acceptance

**Execution:**
- [x] `features/auth/components/user-menu.tsx` -- åpne-/lukkepanel med `useState`, `useId`, Escape, klikk utenfor (`pointerdown` på dokumentet mens det er åpent) og lukking når fokus går ut (`onBlur` med `relatedTarget` utenfor) -- kjernen i endringen.
- [x] `shared/ui/dropdown-menu.tsx`, `package.json`, `package-lock.json` -- fjern ubrukt komponent og pakke -- ryddig repo.
- [x] `e2e/auth.ts`, `e2e/les/innlogging.spec.ts`, `e2e/core-flow.spec.ts`, `e2e/endrer/registrering.spec.ts` -- nye roller, tastaturflyt og testen av åpne/lukke -- ingen hoppede tester.
- [x] `EXPERIENCE.md` (begge), `epic-2-context.md`, beslutningsloggene -- ny tekst for menyen, aksept av beslutningen.

**Acceptance Criteria:**
- Given panelet er åpent, when axe kjøres ved 1280, 360 og 320 px, then er det ingen serious-brudd (heller ikke `aria-hidden-focus`) og ingen horisontal scrolling.
- Given en bruker som bare bruker tastatur, when hen trykker Enter på ☰, Tab til «Logg ut» og Enter, then er hen logget ut og lista vises.
- Given `npm test` i CI, when PR-en kjøres, then er alle Vitest-, pgTAP- og Playwright-tester grønne.

## Implementation Notes

- Implementert direkte i denne økta, uten implementasjonsagent (forrige agent stoppet opp mens den ventet på egen bakgrunnsjobb). `user-menu.tsx` har ingen Radix. `shared/ui/dropdown-menu.tsx` og `@radix-ui/react-dropdown-menu` er fjernet (`package-lock.json` har bare slettinger).
- `aria-controls` står bare mens panelet er åpent, for panelet finnes ikke i DOM-en ellers.
- Valg og Escape gir fokus tilbake til knappen. «Logg inn» og «Logg ut» fører dermed fokus til menyknappen på den nye siden, som `openMenu`-flyten i testene bruker (Tab videre til første felt).
- `scripts/opptak.mjs` (opptaket i README) brukte `menuitem` og `menu`, og er rettet til `link`, `button` og gruppen «Konto». Den er ikke kjørt på nytt, bare syntakssjekket.
- Testen «menyen tones inn og ut … trege animasjoner» er fjernet, for panelet har ingen animasjon. `waitForAnimations` brukes fortsatt av `a11y.ts`.
- Verifisert lokalt mot `next start` og lokal Supabase: `innlogging.spec.ts` 32/32 (les-360 og les-1280), `registrering.spec.ts` 8/8 og `core-flow.spec.ts` første gang (begge prosjekter). Andre kjøring av `core-flow.spec.ts` feilet på «Jeg har også sett dette» fordi databasen ikke var nullstilt (kjerneflytbrukeren hadde allerede bekreftet rapporten). `db reset` er blokkert i prosjektmappen, så `core-flow` etter review-rettingene får sin verifikasjon i CI.

## Spec Change Log

## Review Triage Log

Verdiene er mine, ikke reviewernes. BH = Blind Hunter, EC = Edge Case Hunter, VG = Verification Gap.

| Funn | Verdikt | Begrunnelse og utfall |
|------|---------|-----------------------|
| EC/BH: Escape virker ikke når fokus er på body etter klikk på tekst i panelet | medium | Ekte: Escape treffer body utenfor komponenten. **Patchet**: Escape lyttes det etter på dokumentet mens panelet er åpent. Ny e2e-sjekk |
| EC/BH: panelet blir åpent over ny side ved tilbake/fram | low | Ekte, topplinja står igjen. **Patchet**: state nullstilles når adressen endres (React-mønsteret under rendering). Ny e2e-test med `goBack()` |
| VG: `scripts/opptak.mjs` bruker `menuitem` og `menu` | medium | Ekte, ingen test dekker skriptet, og README bruker det til opptaket. **Patchet** (ikke kjørt, bare syntakssjekket) |
| BH/EC: utenfor-klikket i testen treffer kanskje en kontroll i `main` | low | **Patchet**: klikker på `h1` |
| BH: mellomrom og «lang e-postadresse» står i spec og kommentar, men testes ikke | low | **Patchet**: mellomrom testes, og kommentaren om lang e-post er fjernet |
| BH: panelet beholdes etter tilbake/Escape uten test | low | Dekket av patchene over |
| EC: Tab ut lukker ikke når det ikke finnes noe fokuserbart etter panelet (`relatedTarget` er null) | low | Ekte, men sidene har alltid mer å tabbe til. En fiks gir enten lukking ved klikk på tekst i panelet eller en tidsstyrt sjekk. Avvist |
| EC/BH: `logOut` uten feilhåndtering, panelet lukkes før `signOut` | low | Eksisterte før (Radix lukket også ved valg, og `signOut` var uten try/catch). **Utsatt** (`deferred-work.md`) |
| EC: Ctrl/Cmd-klikk på «Logg inn» lukker og flytter fokus | low | Samme atferd som Radix ved valg, og skadeløs. Avvist |
| EC: Safari og Firefox på macOS gir ikke knappen fokus ved klikk | low | Escape virker nå uansett (dokumentlytter). Avvist |
| EC: `openMenu` kan klikke igjen og lukke et åpent panel | false | Hvert forsøk sjekker `isVisible()` først, så en åpen meny klikkes ikke igjen |
| BH: ☰ mister høyrejusteringen uten `ml-auto` | false | `SiteHeader` har `ml-auto` på `actions`-wrapperen. Plassen er uendret |
| BH: `waitForAnimations` er død kode | false | `expectNoSeriousA11yViolations` i `a11y.ts` bruker den |
| BH: transitive Radix-pakker blir liggende i lockfilen | false | `npm uninstall` fjernet dem (118 linjer, bare slettinger) |
| BH: `role="group"` er tynt, `nav` passer bedre | low | Meningsspørsmål uten navngitt skade, og `nav` ville gitt en landemerke-region til to valg. Avvist |
| BH/EC: panelet mangler `max-h` og kollisjonshåndtering, og kan dekkes av sticky innhold | low | Panelet har to valg. Eneste fixed-element er «+»-knappen på `z-40`, panelet er `z-50`. Avvist |
| BH: `aria-controls` bare når åpent er ulikt spec | low | Gyldig ARIA, og notert over. Avvist |
| BH/VG: besøkerpanelet er ikke axe-testet ved 320/360 px; Shift+Tab ut er ikke testet | low | Samme komponent og samme klasser. Avvist |
| BH: begge `EXPERIENCE.md`-oppdateringene og åpent punkt i beslutningsloggen | low | Det åpne punktet står som historikk (loggen er append-only), og den nye beslutningen løser det. Arkitekturloggen har fått en linje om pakken. Resten allerede gjort |
| VG/EC: `DESIGN.md:111` lister `DropdownMenu` | low | Lista nevner også `Dialog` og `Sheet`, som heller ikke finnes i repoet, så den var upresis før. **Utsatt** (`deferred-work.md`) |
| BH: sesjonslogg mangler i diffen | false | Skrives ved slutten av økta, etter present |

## Verification

**Commands:**
- `npx tsc --noEmit` og `npm run lint` -- ingen feil.
- `npm run test:unit` -- grønt.
- Full `npm test` i CI eller en ny klone i Temp (Supabase-CLI er blokkert i prosjektmappen). Lokal e2e: `bilde.spec.ts`-oppskriften med `next start -p 3100` og `--no-deps`.
