---
title: '«←» etter oppdatering av detaljsiden'
type: 'bugfix'
created: '2026-11-23'
status: 'done'
baseline_commit: 'cdf877c0d1c08bbbbe12d7e6ffb76e717f9951c6'
route: 'oneshot'
review_loop_iteration: 0
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Etter en handling som oppdaterer detaljsiden uten å bytte sti (bekreftelse, statusendring, skjuling, `router.refresh()`) går «←» til lista uten filtre i stedet for ett steg tilbake i historikken. Nexts `HistoryUpdater` (`node_modules/next/dist/client/components/app-router.js:91-110`) skriver `history.state` på nytt uten `localfixDepth` og `localfixFrom` når oppdateringen ikke er en tilbake- eller fram-navigasjon (`preserveCustomHistoryState: false` i `app-router-state.js`), og effekten i `shared/layout/back-link.tsx` kjører bare når stien endres. Kilde: `deferred-work.md` og `issues.md` (2026-11-23, `tilbakepil-og-epic-3-retro-15-17-18`).

**Approach:** `BackLink` holder dybden og forrige sti for den gjeldende oppføringen i refs og bruker dem ved klikket når `history.state` mangler dem, og skriver dem tilbake i oppføringen. Regelen i `EXPERIENCE.md` er uendret: tilbake i historikken bare når forrige side er lista, ellers til lista.

</frozen-after-approval>

## Implementation Notes

- **`BackLink`:** ny ref `lastFrom` ved siden av `lastDepth` og `lastPath`. Effekten holder dem i takt med den gjeldende oppføringen. Ved klikket brukes `history.state` når den har dybden, ellers refs. Regelen er uendret: `router.back()` bare når dybden er over 0 og forrige sti er `/`, ellers følges lenken til `/`.
- **Test:** `e2e/endrer/bekreft.spec.ts`, ««←» etter en bekreftelse går tilbake til lista med filteret bevart»: logget inn, `/?sort=confirmations` → detaljside → bekreft → «←». Testen venter på POST-svaret og `networkidle` før «←», ellers avhenger den av tidspunktet (første versjon var grønn på 1280 og rød på 360). Rød på den gamle koden (6 av 6 med `--repeat-each 3`), grønn på den nye (6 av 6).
- **Avvik fra tilnærmingen:** refs brukes ved klikket, men oppføringen skrives ikke på nytt (det ville ikke løst besøk på nytt av en overskrevet oppføring, se triageloggen). Det frosne avsnittet er ikke endret.
- **Dokumenter:** `EXPERIENCE.md` er uendret. Regelen står der fra før, og endringen får koden til å følge den.
- **Verifisert** i en ny klone i Temp (`k15`, `main` `cdf877c` pluss endringene, `supabase.exe` er blokkert i prosjektmappen): `detalj`, `ny-rapport`, `bekreft`, `status`, `skjul`, `ki-forslag` og `core-flow` i alle prosjekter ga 252 bestått på 7,9 min med første versjon av koden. Etter den lille patchen fra gjennomgangen ga «←»-testene i `detalj`, `bekreft` og `ny-rapport` 176 bestått med `--repeat-each 2`. `npm run lint` og `npx tsc --noEmit` er rene, og `npm run test:unit` gir 84 filer og 1108 tester bestått. Full `npm test` kjøres av CI på PR-en.

## Review Triage Log

Gjennomgang 1 (inline, etter brukerens valg, mot lensene fra Blind Hunter og Edge Case Hunter). Dommene er satt mot koden.

- Dybde og forrige sti hentes to ganger fra `history.state` med en overflødig `stamped`-variabel: **low, patch.** Forenklet til `stampedDepth`.
- En oppføring som er skrevet over av Next og så besøkes på nytt med tilbake-knappen får feil stempel i effekten (dybde fra siden brukeren kom fra, ikke oppføringens egen). Eksempel: bokmerke til detaljsiden, statusendring, logoen til lista, tilbake-knappen, «←» gir `router.back()` ut av appen: **medium (ikke verifisert i nettleser), defer.** Samme oppførsel som før denne endringen. Ført i `deferred-work.md`.
- Bare bekreftelse er testet, ikke statusendring, skjuling eller `router.refresh()`: **low, rejected.** Alle går via samme revalidering og samme kodebane i `BackLink`.
- `waitForLoadState("networkidle")` i testen: **low, rejected.** Brukes allerede i `detalj.spec.ts`, og uten den avhenger testen av tidspunktet.
- Testen lager en rapport som blir liggende: **low, rejected.** Samme som alle tester i `endrer-*` (liggende til neste `db reset`).
