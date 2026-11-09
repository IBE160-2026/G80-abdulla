# Story 2.1: Konto og innlogging

## 2026-11-09 kl. 22:13 — Ali Yousef Abdulla

### Oppgave
Brukeren kjørte `bmad-help`, som viste at Epic 1 er ferdig og at Story 2.1 er neste påkrevde steg. Deretter kjørte brukeren `bmad-build` for Story 2.1 (issue #29): konto og innlogging med e-post og passord, en meny i topplinja og `getViewer`/`requireUser` på serveren.

### Plan
- Branchen `story/2-1-konto-og-innlogging` ble laget fra den lokale branchen `logg/story-1-7-flettet`, så `done` for Story 1.7 og Epic 1 følger med i PR-en.
- `docs/implementation-artifacts/epic-2-context.md` ble laget med en underagent.
- Spec: [spec-2-1-konto-og-innlogging.md](../../docs/implementation-artifacts/spec-2-1-konto-og-innlogging.md). Ingen migrering, ingen endring i policyene eller `config.toml`, og ingen nye pakker.
- Brukeren valgte anbefalingene:
  - «Gjenta passord» fjernes.
  - Også `/auth/sign-up-success`, `/auth/confirm` og `/auth/error` fjernes.
  - Menyknappen er ☰ med `aria-label="Meny"`.
  - Spec-en holdes samlet (≈ 2 800 tokens).
- Implementeringen ble gjort av en underagent. Etterpå kom en gjennomgang med blind-hunter, edge-case-hunter og verification-gap.

### Resultat
- `3c266ed`: spec, epic-2-konteksten og sprintstatusen `in-progress` (Epic 2 og Story 2.1).
- `5210e9f` (implementeringen og rettelsene):
  - `lib/supabase/auth.ts`: `getViewer` i `cache()`, med rollen fra `profiles`, og `requireUser`.
  - `lib/auth-errors.ts`: faste norske feilmeldinger og sjekkene før kallet.
  - `MIN_PASSWORD_LENGTH` i `lib/limits.ts`, testet mot `config.toml`.
  - Det felles `components/auth-form.tsx` med de tynne `login-form.tsx` og `sign-up-form.tsx`.
  - `components/user-menu.tsx` med «Logg inn», e-post, «Moderator» og «Logg ut» (`scope: "local"`), koblet inn via layouten.
  - Fem startpakkesider og to skjemakomponenter er slettet.
  - Vakten `lib/supabase/client.test.ts`.
  - Playwright: `e2e/auth.ts`, `e2e/les/innlogging.spec.ts`, `e2e/endrer/registrering.spec.ts` og kjerneflyten, som nå logger inn bare med tastatur.
  - Dokumentasjon: begge kopiene av `EXPERIENCE.md`, `ux-beslutningslogg.md` og `.memlog.md`, og README med avsnittet «Logg inn».
- Underagenten tok fire valg som spec-en ikke tok. De står som «KI-forslag» i UX-beslutningsloggen og er ikke godkjent av brukeren ennå:
  - Feilteksten har vanlig tekstfarge og et rødt ikon, fordi `destructive` bare har 3,8:1 og feilet axe.
  - Skjemaet sjekker e-postformatet selv.
  - Passordlengden sjekkes bare ved registrering.
  - Menyen er ikke modal (`modal={false}`).
- Gjennomgangen ga 25 funn: 6 ble rettet og 19 avvist med begrunnelse i Review Triage Log i spec-en. Rettelsene:
  - En `next` under `/auth/` gir lista i stedet for å låse skjemaet.
  - Testene dekker nå spørringen i menyens `next`, «Logger inn …» uten dobbel innsending, utlogging bare i denne nettleseren og trimmet e-post.
  - README har en setning om å bruke en oppdiktet e-postadresse.
- Verifisert etter rettelsene:
  - Lint og `tsc` gir 0 feil.
  - Hele `npm test` (exit 0): Vitest `unit` 251/251, pgTAP 157/157, Vitest `db` 20/20 og Playwright 116/116.
  - axe ga 0 alvorlige funn, og ytelsestesten målte 442 ms for 108 rapporter.
- Spec-en er `done`, og sprintstatusen er `review`.
- Brukeren ba om push. `story/2-1-konto-og-innlogging` er pushet, og PR #51 (https://github.com/IBE160-2026/G80-abdulla/pull/51) er laget med `Closes #29`, testsammendraget og funnene fra gjennomgangen. Den er ikke flettet. PR-en tar også med `done` for Story 1.7 og Epic 1 og loggen for flettingen av PR #50.
- Lukket i `issues.md`: punktene om de engelske innloggingssidene og «Glemt passord» (Story 1.1), og om `logIn` i `detalj-innlogget.spec.ts` (Story 1.7).

### Åpne punkter
- En innlogget bruker kan åpne `/auth/login` og `/auth/sign-up` direkte og bytte konto eller lage en ny uten advarsel (B3). Menyen lenker ikke dit. Vurder å sende innloggede videre til `next` eller `/`.
- Fokus flyttes ikke etter innlogging, så en tastaturbruker fortsetter der passordfeltet sto (B5). Vurder felles fokusstyring etter navigering i Story 2.2, som også sender brukeren videre etter innsending.
- «Logg ut» viser ingen feil hvis `signOut` feiler (nettverk). Brukeren havner på lista fortsatt innlogget (B2).
- Menyen kan lukke seg rett etter innlogging eller utlogging når `router.refresh()` blir ferdig (B4). Testene prøver på nytt, og rotårsaken er ikke funnet.
- Godkjenn eller endre de fire KI-forslagene i `ux-beslutningslogg.md`: feilfargen, sjekken av e-postformatet, at passordlengden bare sjekkes ved registrering, og den ikke-modale menyen.
