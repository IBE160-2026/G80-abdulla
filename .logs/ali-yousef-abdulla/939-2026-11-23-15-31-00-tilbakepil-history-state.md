# «←» etter oppdatering av detaljsiden

## 2026-11-23 kl. 15:31 — Ali Yousef Abdulla

### Oppgave
Ta det åpne punktet fra PR #101: «←» går til lista uten filtre etter en handling som oppdaterer detaljsiden uten å bytte sti (bekreftelse, statusendring, skjuling), fordi Next skriver `history.state` på nytt uten våre felt.

### Plan
- `bmad-build`, rute `oneshot`: spec [spec-tilbakepil-history-state.md](../../docs/implementation-artifacts/spec-tilbakepil-history-state.md), på branchen `fix/tilbake-pil-history-state` fra `main`. Loggcommiten «PR #102 flettet» fra `chore/logg-flettet-102` følger med.
- Test først (rød på dagens kode), så rettelsen i `shared/layout/back-link.tsx`.
- Gjennomgang inline etter brukerens valg (anbefalt av meg: endringen er liten og testen er rød og grønn).
- Verifisere i en ny klone i Temp (`k15`), siden `supabase.exe` er blokkert i prosjektmappen.

### Resultat
- Commit `937f4cc` på `fix/tilbake-pil-history-state`.
- PR #103 er opprettet og flettet 2026-11-25 kl. 17:46 med flettecommit `210604a`, etter at `test` ble grønn på 12 min 53 s og Vercel var grønn. Loggen «PR #102 flettet» fulgte med i PR-en. Denne loggcommiten ligger på `chore/logg-flettet-103`, pushet uten egen PR, og blir med i neste PR.
- `BackLink` holder dybde og forrige sti for den gjeldende oppføringen i refs (`lastDepth`, `lastFrom`) og bruker dem ved klikket når `history.state` mangler dem. Regelen er uendret og står i `EXPERIENCE.md`.
- Ny test i `e2e/endrer/bekreft.spec.ts`: filtrert liste → detalj → bekreft → «←» gir `/?sort=confirmations`. Rød på den gamle koden (6 av 6), grønn på den nye (6 av 6). Første versjon var grønn på 1280 og rød på 360, så testen venter nå på POST-svaret og `networkidle`.
- Verifisert: Playwright på `detalj`, `ny-rapport`, `bekreft`, `status`, `skjul`, `ki-forslag` og `core-flow` 252 bestått (7,9 min), og «←»-testene på nytt etter patchen 176 bestått. Lint, `tsc` og 1108 enhetstester er grønne. Full `npm test` kjøres av CI.
- Gjennomgangen ga 5 funn: 1 patch (overflødig variabel), 1 utsatt, 3 avvist. Se triageloggen i spec-en.
- Lukker «←»-punktet med `history.state` i `issues.md` og `deferred-work.md`.

### Åpne punkter
- En historikkoppføring som Next har skrevet over og som så besøkes på nytt med tilbake-knappen, får feil stempel i `BackLink`, så «←» kan gi `router.back()` ut av appen. Eksisterende oppførsel, ikke verifisert i nettleser (`deferred-work.md`).
