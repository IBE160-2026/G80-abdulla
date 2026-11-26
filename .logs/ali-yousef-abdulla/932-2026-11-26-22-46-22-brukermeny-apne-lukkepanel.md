# Brukermeny som åpne-/lukkepanel

## 2026-11-26 kl. 22:46 — Ali Yousef Abdulla

### Oppgave
Brukermenyen i topplinja var en ikke-modal Radix-dropdown (`modal={false}`), et KI-forslag fra Story 2.1 som prosjekteieren ikke godkjente. Den skulle erstattes med noe godkjent, uten at axe-feilen aria-hidden-focus (serious) kommer tilbake. Kjørt med `bmad-build`.

### Plan
- Spørre prosjekteieren hva menyen skal være. Valgt: åpne-/lukkepanel (knapp med `aria-expanded`, ikke `role="menu"`). Avvist: modal dropdown, sidepanel, ingen meny.
- Spec: [spec-brukermeny-som-apne-lukkepanel.md](../../docs/implementation-artifacts/spec-brukermeny-som-apne-lukkepanel.md) (ca. 1800 tokens, holdt samlet etter valg).
- Implementere direkte (ikke med implementasjonsagent, som stoppet opp sist), teste, review med Blind Hunter, Edge Case Hunter og Verification Gap, patche.

### Resultat
- Commit `cc90176` på branchen `feat/brukermeny-apne-lukkepanel` (ikke pushet, ingen PR ennå).
- `features/auth/components/user-menu.tsx`: vanlig knapp ☰ med `aria-expanded` og `aria-controls`, panel (`role="group"`, «Konto») under topplinja. Escape (dokumentlytter), klikk utenfor, Tab ut, valg og sidebytte lukker det. Valg og Escape gir fokus tilbake til knappen.
- Fjernet `shared/ui/dropdown-menu.tsx` og `@radix-ui/react-dropdown-menu`.
- Tester: `e2e/auth.ts` (`menuPanel`, ny `openMenu`), `innlogging.spec.ts` (nye roller, tre nye tester: åpne/lukke, tilbake i nettleseren og axe/bredde ved 1280/360/320 px, den gamle testen av trege animasjoner fjernet), `core-flow.spec.ts`, `registrering.spec.ts`. `scripts/opptak.mjs` rettet til de nye rollene.
- Dokumenter: begge `EXPERIENCE.md`, `epic-2-context.md`, `ux-beslutningslogg.md` (ny beslutning og endring), `arkitektur-beslutningslogg.md`, `deferred-work.md` (2 punkter).
- Verifisert lokalt: `tsc` og lint rene, `npm run test:unit` 1141 grønne, `innlogging.spec.ts` 32/32 og `registrering.spec.ts` 8/8 i begge prosjekter, `core-flow.spec.ts` grønn i første kjøring. Etter review-rettingene feilet `core-flow` ved «Jeg har også sett dette» fordi databasen ikke var nullstilt (`db reset` er blokkert i prosjektmappen). Full `npm test` gjenstår i CI.
- Review: 20 funn vurdert i spec-ens Review Triage Log. Patchet: Escape med fokus på body, panelet åpent etter tilbake/fram, opptaksskriptet, fragilt utenfor-klikk, mellomrom i test. To utsatt, resten avvist eller falske.
- Lukket det åpne punktet «brukermenyen er ikke modal» i `issues.md`.

### Åpne punkter
- `core-flow.spec.ts` etter review-rettingene er bare kjørt i CI, ikke lokalt (databasen var ikke nullstilt).
- `scripts/opptak.mjs` er rettet, men ikke kjørt på nytt (bare syntakssjekket). Opptaket `docs/skjermbilder/kjerneflyt.webm` kan vise den gamle menyen.
- «Logg ut» har ingen feilhåndtering (panelet lukkes før `signOut`, ingen beskjed ved nettverksfeil). Fantes før endringen.
- `DESIGN.md` (tre kopier, linje 111) lister `Dialog`, `Sheet` og `DropdownMenu`, som ikke finnes i repoet.
