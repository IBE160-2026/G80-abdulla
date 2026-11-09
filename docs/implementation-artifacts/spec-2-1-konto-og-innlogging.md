---
title: 'Story 2.1: Konto og innlogging'
type: 'feature'
created: '2026-11-09'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '03b4da8d1275a58ede1d5082fa7b8a471d411378'
context:
  - '{project-root}/docs/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Innloggingen er fortsatt startpakkens engelske skjemaer uten retur-adresse, og topplinja har ingen meny. En besøkende kan ikke se hvordan hen logger inn, og appen vet ikke på serveren hvem som er innlogget eller om det er moderatoren (issue #29, FR-1, UX-DR4, AR-13).

**Approach:** `lib/supabase/auth.ts` gir `getViewer()` og `requireUser()`. Layouten sender det topplinja trenger til en meny med «Logg inn» eller e-post, «Moderator» og «Logg ut». Innloggings- og registreringssiden blir norske, tar med `next` og viser norske feilmeldinger. Startpakkens sider som v1 ikke bruker, fjernes.

## Boundaries & Constraints

**Always:**
- `getViewer()` henter brukeren med `auth.getUser()` og rollen fra brukerens egen rad i `profiles` (aldri JWT eller metadata). Den er pakket i Reacts `cache()`, så layouten og siden deler ett kall per forespørsel. Den gir `{ user: { id, email } | null, isModerator }`. Feiler profiloppslaget, er `isModerator` `false`.
- `requireUser(returnTo)` gir brukeren, eller `redirect("/auth/login?next=" + encodeURIComponent(returnTo))`.
- Retur-adressen går alltid gjennom `safeNextPath(next, window.location.origin)` før `router.replace`, etterfulgt av `router.refresh()`.
- `@/lib/supabase/client` importeres bare i `components/login-form.tsx`, `components/sign-up-form.tsx` og `components/user-menu.tsx`, og bare for `signInWithPassword`, `signUp` og `signOut({ scope: "local" })`. En Vitest-vakt sjekker dette.
- Skjemaene har `noValidate`, sjekker tomme felt og passordlengden selv og viser bare tekst fra `authErrorMessage`. Feltfeil står under feltet, har `aria-describedby` og `aria-invalid`, og fokus går til første feil. Skjemafeil har `role="alert"`.
- `MIN_PASSWORD_LENGTH = 6` i `lib/limits.ts` er lik `minimum_password_length` i `supabase/config.toml`, og en Vitest-test sjekker det.
- Tekst i feltene er 16 px, trykkflatene er minst 44 px, og innholdet er maks 640 px bredt som på de andre sidene.

**Never:**
- Ingen migrering, ingen endring i policyene, i `config.toml` eller i `proxy.ts`, og ingen nye npm-pakker.
- Ingen Server Action for innlogging. `profiles` skrives aldri av appen.
- Ingen «Registrer problem»-knapp (Story 2.2), og ingen glemt passord eller sletting av konto (PRD §6.2).
- Ingen tekst fra Supabase vises, og e-post eller passord logges aldri.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Innlogging med `next` | `/auth/login?next=/rapporter/<id>`, riktig passord | Brukeren er på `/rapporter/<id>`, menyen viser e-posten | N/A |
| Fremmed `next` | `next=//evil.example`, `/\evil.example`, `https://x` | Brukeren havner på `/` | `safeNextPath` |
| Feil passord | Kjent e-post, feil passord | «Feil e-post eller passord.» over knappen | `invalid_credentials` |
| Tomme felt | Ingen e-post eller passord | «Skriv inn e-postadressen din.» / «Skriv inn passordet ditt.» ved feltet | Ingen kall til Supabase |
| E-posten er i bruk | Registrering med `bruker1@localfix.test` | «Det finnes allerede en konto med denne e-postadressen.» ved e-postfeltet | `user_already_exists`, `email_exists` |
| For kort passord | 5 tegn ved registrering | «Passordet må ha minst 6 tegn.» ved passordfeltet | Sjekkes før kallet; `weak_password` gir samme tekst |
| Ugyldig e-post | `abc` | «Skriv inn en gyldig e-postadresse.» ved e-postfeltet | `email_address_invalid` |
| For mange forsøk | `over_request_rate_limit` | «For mange forsøk. Vent litt og prøv igjen.» | Skjemafeil |
| Ukjent feil | Annen kode eller nettverksfeil | «Noe gikk galt. Prøv igjen.» | Skjemafeil |

**Beslutning (2026-11-09): «Gjenta passord».** Feltet fjernes. Registreringen har to felt, «E-post» og «Passord», som innloggingen.

**Beslutning (2026-11-09): ubrukte sider.** I tillegg til glemt passord og nytt passord fjernes `/auth/sign-up-success`, `/auth/confirm` og `/auth/error`, som bare trengs ved e-postbekreftelse (`enable_confirmations = false`). `safeNextPath` og testene for den beholdes.

**Beslutning (2026-11-09): menyknappen.** Lucide `Menu` (☰) med `aria-label="Meny"`, lik for besøkende og innloggede, 44 × 44 px.

**Beslutning (2026-11-09):** Spec-en beholdes samlet (≈ 2 800 tokens), fordi Story 2.1 er én issue, én branch og én PR, og menyen, skjemaene og `getViewer` testes sammen fra ende til ende.

</frozen-after-approval>

## Code Map

- `app/layout.tsx` -- kaller `getViewer()` og gir `SiteHeader` `viewer: { email, isModerator } | null`, aldri hele brukerobjektet.
- `components/site-header.tsx` -- topplinja med `BackLink`; menyen legges til høyre (`ml-auto`). Kommentaren om Story 2.1 oppdateres.
- `components/ui/dropdown-menu.tsx`, `components/ui/badge.tsx` -- shadcn-komponenter som finnes; brukes som de er.
- `components/login-form.tsx`, `components/sign-up-form.tsx` -- startpakkens skjemaer med nettleserklienten; skrives om. `sign-up-form` bruker allerede `data.session`, siden `enable_confirmations = false`.
- `app/auth/login/page.tsx`, `app/auth/sign-up/page.tsx` -- leser `searchParams.next` og sender den til skjemaet; får `metadata.title`.
- `lib/safe-next.ts` (+ test) -- finnes og dekker `//x`, `/\x`, `https://x` og `javascript:`; gjenbrukes, ikke endres.
- `lib/supabase/server.ts` -- serverklienten som `auth.ts` bruker. `lib/supabase/reports.test.ts` viser hvordan `./server` mockes.
- `lib/supabase/images.test.ts` -- mønsteret for en vakt som leser kildefilene.
- `lib/supabase/signup-role.db.test.ts` -- viser allerede at en ny konto får `user` fra `handle_new_user`; ingen ny pgTAP trengs.
- `e2e/les/detalj-innlogget.spec.ts` -- har `logIn` med engelske etiketter; flyttes til `e2e/auth.ts`.
- `e2e/core-flow.spec.ts` -- kjerneflyten; `kjerneflyt360@`/`kjerneflyt1280@localfix.test` (passord `localfix-test`) er satt av til den.
- `playwright.config.ts` -- `e2e/les/` endrer ikke data; `e2e/endrer/` kjøres etter `les`.

## Tasks & Acceptance

**Execution:**
- [x] `lib/supabase/auth.ts` (+ `auth.test.ts`) -- `getViewer` og `requireUser` som over. Tester: besøkende, bruker, moderator, profilfeil og `redirect` med kodet `next`.
- [x] `lib/auth-errors.ts` (+ test) -- `authErrorMessage(code)` gir `{ field: "email" | "password" | "form", message }` etter matrisen.
- [x] `lib/limits.ts` (+ test) -- `MIN_PASSWORD_LENGTH` og sjekken mot `config.toml`.
- [x] `components/login-form.tsx`, `components/sign-up-form.tsx` -- norske skjemaer. Overskrift (h1) «Logg inn» / «Registrer konto», feltene «E-post» og «Passord» (`autocomplete` `email`, `current-password` / `new-password`), registreringen med hjelpeteksten «Minst 6 tegn.», knappene «Logg inn» / «Registrer konto» (under arbeid «Logger inn …» / «Registrerer …»), og lenkene «Har du ikke konto? Registrer konto» / «Har du allerede konto? Logg inn» med samme `next`.
- [x] `app/auth/login/page.tsx`, `app/auth/sign-up/page.tsx` -- `next` inn, `<main>` med maks 640 px, tittel.
- [x] `components/user-menu.tsx` (ny, klient) -- menyen. Besøkende: «Logg inn» til `/auth/login?next=<sti og spørring>` (på `/auth/*` beholdes `next` fra adressen). Innlogget: e-posten, `Badge` «Moderator» for moderator og «Logg ut» (`signOut`, så `router.replace("/")` og `refresh()`).
- [x] `components/site-header.tsx`, `app/layout.tsx` -- koble inn menyen.
- [x] Slett `app/auth/forgot-password/`, `app/auth/update-password/`, `app/auth/sign-up-success/`, `app/auth/confirm/`, `app/auth/error/`, `components/forgot-password-form.tsx` og `components/update-password-form.tsx` (`protected` finnes ikke lenger). Ingen lenker til dem blir igjen.
- [x] `lib/supabase/client.test.ts` (ny) -- vakten for hvem som importerer nettleserklienten.
- [x] `e2e/auth.ts` (ny), `e2e/les/detalj-innlogget.spec.ts` -- felles `logIn` med norske etiketter.
- [x] `e2e/les/innlogging.spec.ts` (ny) -- matrisen uten registrering, menyen for besøkende, bruker og moderator, «Logg ut», og axe og bredde (360, 320) på begge sidene, også med feil.
- [x] `e2e/endrer/registrering.spec.ts` (ny) -- ny konto med tilfeldig e-post og `next`, innlogget med en gang uten «Moderator», e-post i bruk og for kort passord.
- [x] `e2e/core-flow.spec.ts` -- til slutt: åpne menyen, «Logg inn», skriv inn kjerneflytbrukeren og send bare med tastatur, tilbake på lista med e-posten i menyen; axe på innloggingssiden.
- [x] `docs/ux/EXPERIENCE.md` og kopien i `docs/planning-artifacts/ux-designs/…`, `docs/beslutninger/ux-beslutningslogg.md`, `README.md` -- menyknappen, tekstene og feilmeldingene, slettede sider, status for Story 2.1 og hvordan man logger inn.

**Acceptance Criteria:**
- Given en besøkende, when hen åpner menyen, then står «Logg inn» der, og etter innlogging er hen tilbake på siden hen kom fra.
- Given en innlogget bruker, when hen åpner menyen, then står bare hens egen e-post og «Logg ut» der, og moderatoren ser i tillegg «Moderator».
- Given «Logg ut», when den velges, then vises lista med «Logg inn» i menyen.
- Given innlogging, registrering og menyen, when de brukes bare med tastatur, then virker alt, og axe gir ingen `serious`/`critical` på 360, 320 og 1280 px.

## Implementation Notes

- Den felles `components/auth-form.tsx` (skjema, feilvisning, fokus og retur-adresse) er lagt til, så `login-form.tsx` og `sign-up-form.tsx` bare har kallet til Supabase og er de eneste som importerer nettleserklienten.
- Fire valg som spec-en ikke tok, står i `ux-beslutningslogg.md` som «KI-forslag»: feiltekst i vanlig tekstfarge med rødt ikon (`destructive` har 3,8:1 og feilet axe), egen sjekk av e-postformatet (Supabase svarer `validation_failed` på «abc»), passordlengden sjekkes bare ved registrering, og menyen har `modal={false}` (en modal meny ga axe `aria-hidden-focus`).
- `tabTo` i `e2e/keyboard.ts` har fått `reverse` (Shift+Tab), fordi fokus etter innlogging fortsetter der passordfeltet sto.
- `npx next typegen` måtte kjøres én gang, fordi `.next/types` pekte på de slettede sidene.
- Etter gjennomgangen: 6 rettelser (B1/E1, B7, B8/V1, B9, V2, V3). Hele `npm test` (exit 0): Vitest `unit` 251/251, pgTAP 157/157, Vitest `db` 20/20 og Playwright 116/116, axe uten alvorlige funn. Lint og `tsc` 0 feil.
- B4 er sett igjen: rett etter «Logg ut» kunne menyen lukke seg når `router.refresh()` ble ferdig (én gang i testen for to nettleserkontekster på 1280 px). Testene prøver på nytt, og rotårsaken er ikke funnet.

## Spec Change Log

## Review Triage Log

Gjennomgang 1 (2026-11-09): blind-hunter (B), edge-case-hunter (E) og verification-gap (V).

| # | Funn | Verdikt | Begrunnelse | Rute |
|---|------|---------|-------------|------|
| B1 | `next` til en side under `/auth/` låser skjemaet på «Logger inn …» | low | Riktig: `router.replace` til samme rute monterer ikke skjemaet på nytt, så `pending` blir stående. Menyen lager aldri en slik lenke, men en håndskrevet URL gjør det. Rettelsen er én linje | patch |
| E1 | Samme som B1 | low | Samme rotårsak som B1 | patch |
| E2 | `router.replace` kan feile og la skjemaet stå deaktivert | false | `replace` til en annen rute bytter alltid side. Det eneste tilfellet der siden blir stående, er B1 | avvist |
| B2 | «Logg ut» sjekker ikke feilen fra `signOut` | low | Riktig: auth-js beholder sesjonen ved nettverksfeil, og brukeren havner på lista fortsatt innlogget, uten melding. Det skjer sjelden lokalt, og rettelsen krever en ny feilvisning i menyen | avvist |
| E3 | Samme som B2 | low | Samme rotårsak som B2 | avvist |
| E7 | «Logg ut» kan velges flere ganger mens kallet pågår | low | Menyen lukkes når valget gjøres, og den må åpnes på nytt innen et kort kall. Rettelsen krever et eget flagg | avvist |
| B3 | En innlogget bruker kan åpne `/auth/login` og `/auth/sign-up` og bytte konto | low | Riktig, men menyen lenker ikke dit for innloggede, og `router.replace` fjerner innloggingen fra historikken. Rettelsen krever en ny gren og et valg av mål. Ført som åpent punkt | avvist |
| E5 | Samme som B3 | low | Samme rotårsak som B3 | avvist |
| B4 | `openMenu` i testene skjuler at `router.refresh()` kan lukke en meny som nettopp ble åpnet | maybe-false | Skjer bare hvis menyen åpnes i de første millisekundene etter innlogging. Er det riktig, er det bare low. Det avgjøres ved å finne ut om `refresh()` monterer `UserMenu` på nytt | avvist |
| B5 | Fokus flyttes ikke etter innlogging, så tastaturbrukeren fortsetter der passordfeltet sto | low | Riktig: kjerneflyttesten bruker Shift+Tab. Next leser opp sidetittelen, men flytter ikke fokus. Rettelsen er felles fokusstyring etter navigering, som også trengs etter innsending i Story 2.2. Ført som åpent punkt | avvist |
| B6 | Feltfeilen blir stående mens brukeren retter feltet | low | Riktig, og et vanlig mønster: feilen forsvinner ved neste innsending. Rettelsen legger til logikk i `onChange` | avvist |
| B7 | Ingen test for «Logger inn …», deaktivert knapp eller dobbel innsending | low | Riktig: spec-en nevner tekstene, men ingen test viser dem. En e2e-test med forsinket kall er en ren tillegg | patch |
| B8 | Spørringen i `next` fra menyen er ikke testet | low | Samme som V1 | patch |
| V1 | Spørringen i «Logg inn»-lenken (`?category=…`) er ikke testet | low | Bekreftet av verification-gap: alle testene starter fra en URL uten spørring | patch |
| B9 | README sier at v1 ikke behandler personopplysninger, men registreringen tar imot hvilken som helst e-postadresse | low | Riktig, og README sier ikke at man bør bruke en oppdiktet adresse. Én setning retter det | patch |
| B10 | `signUp` uten sesjon gir «Noe gikk galt», men kontoen er laget | low | Kan bare skje med `enable_confirmations = true`, som v1 ikke har. Med dagens oppsett nås det ikke | avvist |
| E4 | Samme som B10 | low | Samme som B10 | avvist |
| B11 | Spec-en er ikke med i diffen, og sprintstatusen er `in-progress` | false | Spec-en er holdt utenfor diffen med vilje, og sprintstatusen settes til `review` når gjennomgangen er ferdig | avvist |
| B12 | e2e-testen for fremmed `next` mangler `/\t/` og `javascript:` | false | Skjemaet bruker `safeNextPath`, og `safe-next.test.ts` dekker begge. e2e-testen viser at skjemaet bruker funksjonen | avvist |
| B13 | Vakten for nettleserklienten fanger ikke `require` eller `export *`, og kan gi falske treff på `Array.from` | low | Repoet har verken `require`, `export *` eller samleeksporter, og vakten består i dag. Rettelsen gjør mønsteret mer komplisert | avvist |
| E6 | `#anker` i adressen er ikke med i `next` | low | Ingen sider bruker ankre i v1, og `window.location.hash` kan ikke leses under serverrendering uten en effekt | avvist |
| V2 | At `signOut` bare logger ut denne nettleseren, er bare sjekket med et regulært uttrykk på kildeteksten | low | Bekreftet av verification-gap. En e2e-test med to nettleserkontekster viser oppførselen | patch |
| V3 | At e-postadressen trimmes før kallet, er ikke testet ende til ende | low | En innlogging med mellomrom rundt adressen i en test som finnes, dekker det uten nye kall | patch |
| V4 | Mange innlogginger i e2e kan treffe grensen på 30 per 5 minutter | maybe-false | Underagenten så ingen 429 lokalt etter 40 raske forsøk. Er det riktig, er det bare low. Det avgjøres ved å se om lokal Auth håndhever `sign_in_sign_ups` | avvist |

## Design Notes

Topplinja er i layouten, så `pathname` er ikke kjent på serveren. Derfor bygger `UserMenu` `next` selv med `usePathname()` og `useSearchParams()`, med `<Suspense>` rundt. `components/` importerer ikke `lib/supabase/auth.ts`; layouten gjør kallet og sender ren data videre (AD-3).

## Verification

**Commands:**
- `npm run lint` og `npx tsc --noEmit` -- 0 feil
- `npm test` -- exit 0: Vitest, pgTAP og Playwright grønne, axe uten alvorlige funn
