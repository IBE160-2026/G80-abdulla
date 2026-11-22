---
title: 'Epic 3 retro 16: felles e2e-hjelpere'
type: 'refactor'
created: '2026-11-22'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Hjelpefunksjoner i Playwright-testene er kopiert mellom spec-filer: `shownReports` og `cardLinks` (`les/filter.spec.ts`, `les/mine.spec.ts`, `cardLinks` også i `les/forside.spec.ts`), `reportId` i to varianter (`les/filter.spec.ts`, `les/detalj.spec.ts`, `les/forside.spec.ts`), og `openForm`, `chooseCategory` og `expectAccessibleLayout` med lokatorene og konstantene de trenger (`NEW_REPORT`, `description`, `location`, `category`, `CATEGORY_ORDER`) i `endrer/bilde.spec.ts`, `endrer/ki-forslag.spec.ts` og `endrer/ny-rapport.spec.ts`. Story 3.3 måtte rette samme race i to kopier, og funnet gikk igjen i to retroer. Kilde: `docs/implementation-artifacts/epic-3-retro-2026-11-22.md` (A2, handlingspunkt 2, `epic-3-retro-item-16`) og `epic-2-retro-2026-11-18.md` (F5).

**Approach:** Flytt hjelperne til delte moduler i `e2e/` ved siden av `a11y.ts`, `auth.ts` og `layout.ts`, og la spec-filene importere dem. Testene skal sjekke det samme som før eller mer, aldri mindre. `SEED`-tabellene og andre håndskrevne fasiter blir stående i hver fil (SM-4).

</frozen-after-approval>

## Implementation Notes

- **Moduler:** `e2e/list.ts` (lista: `reportId`, `cardLinks`, `shownReports`, og `chip` og `sortSelect`, som også var kopiert mellom `filter.spec.ts` og `mine.spec.ts`), `e2e/report-form.ts` (skjemaet: `NEW_REPORT`, `description`, `location`, `category`, `submit`, `isCreateReport`, `openForm`, `chooseCategory`, og `CATEGORY_ORDER` uten eksport, siden bare `chooseCategory` bruker den) og `expectAccessibleLayout` i `e2e/a11y.ts`, siden den kombinerer axe og bredden. Filnavnene følger de andre hjelpefilene (engelske, korte).
- **`expectAccessibleLayout` brukes også der samme blokk var skrevet ut inne i testene:** to steder i `ny-rapport.spec.ts`, og i `bekreft.spec.ts`, `skjul.spec.ts` og `status.spec.ts`, der den sto bak `narrow` (prosjektet `endrer-360`, det samme som bredden 360). `narrow` er fjernet der.
- **`reportUrl` i `les/bekreft-tilstander.spec.ts`** hadde også varianten med ett siffer og bruker nå `reportId`.
- **Bevisst ikke endret:** `core-flow.spec.ts` (seks utskrevne 320 px-blokker i én lang test, ført i `deferred-work.md`), `les/bekreft-tilstander.spec.ts:100` (en egen test som starter på 320 px, ikke samme blokk), bildetesten i `bilde.spec.ts` som leser kroppen med `postDataBuffer` (multipart), innloggingstesten og «←»-testen i `ny-rapport.spec.ts`, som tester innloggingen selv og derfor skriver den ut, og faste seed-id-er som litteraler i andre filer.
- **`reportId`:** varianten med `padStart(12, "0")` fra `filter.spec.ts` brukes overalt. For rapport 1–9 gir den samme streng som varianten med ett siffer i `detalj.spec.ts` og `forside.spec.ts`.
- **`openForm`:** den felles sjekker overskriften «Ny rapport», som alle tre gjorde. `ki-forslag.spec.ts` sjekket i tillegg at beskrivelsesfeltet har fokus. Det står i `EXPERIENCE.md` («Skjemaet åpnes med fokus i beskrivelsesfeltet»), så den felles sjekker det også. Det gjør testene i `bilde.spec.ts` og `ny-rapport.spec.ts` strengere, ikke svakere.
- **`chooseCategory`:** den felles er den strengeste, fra `ny-rapport.spec.ts`, som også sjekker at «Kategori» har fokus etter valget. `ki-forslag.spec.ts` får dermed én sjekk til. Kommentarene fra `ny-rapport.spec.ts` følger med.
- **Uendret:** testene selv, `SEED`, fasitene i `filter.spec.ts` og `mine.spec.ts`, `core-flow.spec.ts` og lokatorer som bare én fil bruker.
- **Verifisert** i en ny klone i Temp (`k16`, main `7eaff8d` pluss endringene, `supabase.exe` er blokkert i prosjektmappen): `npx playwright test` på de elleve berørte spec-filene i `les-360`, `les-1280`, `endrer-360` og `endrer-1280` ga 272 bestått på 12,5 min (etter rettelsene fra gjennomgangen; kjøringen før dem ga 238 bestått på 10,7 min). `npm run lint` og `npx tsc --noEmit` er rene, og `npm run test:unit` gir 84 filer og 1108 tester bestått. Full `npm test` kjøres av CI på PR-en.

## Review Triage Log

Gjennomgang 1: Blind Hunter (12 funn, minst 5 kreves). Dommene er satt mot koden, ikke av reviewer.

- `ny-rapport.spec.ts` hadde fortsatt to utskrevne kopier av `expectAccessibleLayout`: **medium, patch.** Stemte (linje 133 og 224). Byttet med hjelperen.
- `ny-rapport.spec.ts:127` sjekket fokus i beskrivelsen rett etter `openForm`, som nå gjør det selv: **low, patch.** Linjen er fjernet, med en kommentar. Innloggingstesten og «←»-testen skriver ut innloggingen med vilje, se Implementation Notes.
- `les/bekreft-tilstander.spec.ts:17` hadde `reportUrl` med ett siffer, og andre filer har faste seed-id-er: **low, patch** for `reportUrl`, som nå bruker `reportId`. De faste id-ene som litteraler er avvist: de er ikke en kopiert hjelper, og de leses greit.
- Samme 320 px-blokk i `bekreft.spec.ts`, `skjul.spec.ts`, `status.spec.ts` og `core-flow.spec.ts`: **medium, patch** for de tre første (bytte til hjelperen og fjerne `narrow`), **defer** for `core-flow.spec.ts` (ført i `deferred-work.md`).
- `expectAccessibleLayout` setter bredden tilbake til 360 × 800 i stedet for størrelsen fra før: **false.** Begge 360-prosjektene har nøyaktig 360 × 800 (`SMALL` i `playwright.config.ts:10`), og koden er flyttet uendret.
- Spec-en nevnte ikke `chip` og `sortSelect`: **low, patch.** Implementation Notes er oppdatert. Status og dekning fylles inn når storyen er ferdig.
- `epic-3-retro-item-16` står som `open` i `sprint-status.yaml`: **low, patch.** Settes til `done` med `sprint_status.py` når Playwright har bestått.
- Doble blanke linjer i `filter.spec.ts` og `forside.spec.ts`, og ingen blank linje etter importene i `detalj.spec.ts`: **low, patch.** Rettet.
- `isCreateReport` kopiert mellom `ny-rapport.spec.ts` og `ki-forslag.spec.ts`: **low, patch.** Flyttet til `report-form.ts`. `bilde.spec.ts` leser kroppen med `postDataBuffer` (multipart) og er ikke samme sjekk.
- `chip` er ikke avgrenset til filtergruppen, og `shownReports` kan gi `NaN`: **low, rejected.** Begge er flyttet uendret og brukes slik de ble brukt før. En `NaN` gir et avvik mot fasiten, så testen feiler høyt.
- `CATEGORY_ORDER` eksporteres men brukes bare i fila: **low, patch.** Ikke eksportert lenger.
- Ingenting hindrer at kopiene kommer tilbake: **rejected.** Det er en prosessregel, og den er allerede et eget handlingspunkt (`epic-3-retro-item-18`).
