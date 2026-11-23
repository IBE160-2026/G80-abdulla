---
title: 'Epic 3 retro 15, 17 og 18: «←» til lista, UX-rekonsiliering og prosessregel'
type: 'bugfix'
created: '2026-11-23'
status: 'done'
baseline_commit: '568d39a3801b98759205414ec107d777c3172b64'
route: 'dispatch'
review_loop_iteration: 0
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** «←» på detaljsiden går tilbake i historikken uansett hvilken side som var forrige. Etter innlogging eller innsending fra skjemaet havner brukeren på feil side, og når `/rapporter/ny` var første side i fanen gir den `about:blank` (`deferred-work.md`, to punkter; `issues.md` «←»-punktene). Tilgjengelighetsdetaljene fra Epic 3 og 4 står bare i koden og testene, ikke i `EXPERIENCE.md`, og to prosessregler fra retroen er ikke skrevet. Kilde: `epic-3-retro-2026-11-22.md` (handlingspunkt 1, 3 og 4) og `sprint-status.yaml` (`epic-3-retro-item-15`, `-17`, `-18`).

**Approach:** Rett «←» i koden (brukeren valgte å rette, ikke godta). Før UX-detaljene og den nye «←»-regelen inn i begge kopier av `EXPERIENCE.md` og én linje i `ux-beslutningslogg.md`, og skriv prosessregelen i `docs/coaching-plan.md`. Alt i én PR, sammen med loggen «PR #100 flettet».

## Boundaries & Constraints

**Always:** Nettleserens tilbakeknapp og «←» skal fortsatt gjøre det samme når forrige side i appen er lista, så filtrene og rulleposisjonen bevares. Uten JavaScript er «←» en lenke til `/`. Ctrl-, Cmd-, Shift-, Alt- og midtklikk åpner lista som vanlig. Begge kopier av `EXPERIENCE.md` holdes identiske. Brukeren bestemmer ordlyden i `EXPERIENCE.md`, `ux-beslutningslogg.md` og `coaching-plan.md`.

**Vedtatt ordlyd (2026-11-23, godkjent av brukeren):**
- `EXPERIENCE.md`, Interaction Primitives, erstatter «←»-linja: «←» i topplinja går ett steg tilbake i historikken bare når forrige side i appen er lista, så filtrene og rulleposisjonen bevares. I alle andre tilfeller går den til lista: delt lenke, bokmerke, ny fane, innlogging og skjemaet etter innsending. Uten JavaScript er «←» en vanlig lenke til lista.
- `EXPERIENCE.md`, Accessibility Floor, tre nye punkter: (1) Filtrene på lista er to navngitte grupper, «Kategori» og «Status» (`role="group"` med `aria-label`). Antallet rapporter leses opp via `aria-live="polite"`. Tomtilstandene («Ingen rapporter matcher filteret.», «Du har ikke registrert noen rapporter ennå.») har `role="status"`. (2) Bekreftknappen bruker `aria-disabled`, ikke `disabled`, så den beholder fokus når den blir «Du har sett dette ✓». Telleren over den står i en `aria-live`-region. (3) Etter en statusendring flyttes fokus til første statusknapp i moderatorpanelet, og statusteksten har `role="status"`. Etter skjuling og visning går fokus til skjul/vis-knappen, og etter at dialogen lukkes går det tilbake til «Skjul rapport».
- `ux-beslutningslogg.md`: `(change) 2026-11-23 EXPERIENCE.md (begge kopier): «←» går til lista når forrige side ikke er lista, og tilgjengelighetsdetaljene fra Epic 3 og 4 (grupper, aria-live, role=status, fokus etter bekreftelse, statusendring og skjuling) er ført inn (Epic 3 retro 15 og 17)`
- `coaching-plan.md`, Fase 2 punkt 1, legges til på slutten: «Står det et utsatt punkt i `deferred-work.md` eller `issues.md` som peker på en navngitt story («må løses i Story N»), føres det inn i den storyens akseptansekriterier eller spec før storyen bygges. Claude sjekker dette når storyen leses.» Fase 3, retrospektiv: «Et funn en retro utsetter «til neste gang», blir et handlingspunkt i `action_items` i `sprint-status.yaml`, ikke bare en setning i retroen.»

**Never:** Ikke endre `router.replace` etter innsending eller innlogging. Ikke legg til nye avhengigheter. Ikke endre lista, filtrene eller andre sider enn `BackLink`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Fra lista | Lista (også med filter), trykk på kort, «←» | `router.back()`, filter og rulling bevart | N/A |
| Direkte lenke, bokmerke, ny fane | Detaljside som første side | Lenken til `/` følges, lista vises | N/A |
| Etter innsending | Skjemaet → `router.replace` til detaljsiden | «←» går til lista, også når skjemaet var første side i fanen (aldri `about:blank`) | N/A |
| Etter innlogging | Detalj → «Jeg har også sett dette» → innlogging → tilbake til detalj | «←» går til lista, ikke til innloggingen | N/A |
| Nettleserens tilbake og fram | Oppføring med lagret tilstand | Riktig forrige side følger oppføringen | Mangler tilstanden: lista |

</frozen-after-approval>

## Code Map

- `shared/layout/back-link.tsx` -- `BackLink`: `localfixDepth` i `history.state`, `entryDepth()`, effekt på `pathname`. Legg til `localfixFrom` (forrige `pathname`) i samme oppføring. Behold håndteringen av modifikatortaster og `aria-label="Tilbake til lista"`.
- `shared/layout/site-header.tsx` -- bruker `BackLink`. Uendret.
- `features/registrering/components/report-form.tsx:270` -- `router.replace` til detaljsiden. Uendret.
- `features/auth/components/auth-form.tsx:119` -- `router.replace(target)` etter innlogging. Uendret.
- `e2e/les/detalj.spec.ts:333-416` -- eksisterende «←»-tester (kort → tilbake, direkte lenke, logo og tilbakeknapp, Ctrl-klikk). Utvid her.
- `e2e/endrer/ny-rapport.spec.ts:263,331` og `e2e/endrer/ki-forslag.spec.ts:363` -- «←» etter innsending og fra skjemaet.
- `docs/ux/EXPERIENCE.md` og `docs/planning-artifacts/ux-designs/ux-LocalFix-2026-10-11/EXPERIENCE.md` -- linje 43 (topplinja), Interaction Primitives (linje 112, «←»-regelen) og Accessibility Floor (linje 126–128).
- `docs/beslutninger/ux-beslutningslogg.md` -- én `(change)`-linje med dato.
- `docs/coaching-plan.md` -- Fase 2 punkt 1 («Les storyen sammen») og Fase 3 (retrospektiv).
- `docs/implementation-artifacts/deferred-work.md` og `sprint-status.yaml` -- lukk de to «←»-punktene og sett `epic-3-retro-item-15`, `-17`, `-18` til `done`. `issues.md` (i `.logs/`) får punktene krysset av i sesjonsloggen.

## Tasks & Acceptance

**Execution:**
- [x] `shared/layout/back-link.tsx` -- lagre forrige `pathname` i oppføringen og kall `router.back()` bare når den er `/` -- ellers følges lenken til `/`
- [x] `e2e/les/detalj.spec.ts`, `e2e/endrer/ny-rapport.spec.ts` -- tester for innlogging og for skjemaet som første side i fanen
- [x] `docs/ux/EXPERIENCE.md` (begge kopier), `docs/beslutninger/ux-beslutningslogg.md` -- med den vedtatte ordlyden
- [x] `docs/coaching-plan.md` -- prosessregelen, med den vedtatte ordlyden
- [x] `deferred-work.md`, `sprint-status.yaml` -- lukk punktene og sett handlingspunktene til `done`

**Acceptance Criteria:**
- Given at `/rapporter/ny` er første side i fanen, når brukeren sender inn og trykker «←», da vises lista og ikke `about:blank`.
- Given en besøkende på en detaljside som trykker bekreftknappen og logger inn, når hun trykker «←», da vises lista og ikke innloggingen.
- Given at brukeren kom fra lista, når hun trykker «←», da er filter og rulleposisjon bevart (eksisterende test består).
- Given `EXPERIENCE.md`, når de to kopiene sammenlignes, da er de identiske og nevner «←»-regelen og tilgjengelighetsdetaljene.

## Implementation Notes

- **`BackLink`:** `localfixFrom` (stien til siden før) skrives sammen med `localfixDepth` når oppføringen mangler dybde. Klikket bruker `router.back()` bare når dybden er over 0 og `localfixFrom === "/"`. Ellers følges lenken til `/`. Sjekken på dybden er med vilje beholdt som sikkerhet, selv om `from === "/"` alltid gir dybde over 0.
- **Tester:** innloggingstesten i `e2e/les/detalj.spec.ts` feiler på den gamle koden (lista forventet, detaljsiden fikk) og består på den nye. Testen for skjemaet som første side i fanen (`ny-rapport.spec.ts`, ny fane med innloggingen i økten) består også på den gamle koden, så den gamle feilen (`about:blank`) ser ikke ut til å oppstå lenger. Den står som regresjonstest for matriseraden.
- **Dokumenter:** de vedtatte tekstene er ført inn ordrett, bortsett fra tre presiseringer etter gjennomgangen: linje 43 sier «tar deg tilbake til lista», tilgjengelighetspunktet nevner den ytre gruppen «Filtrer rapportene», og fokuspunktet sier «avbryter du dialogen». Begge kopier av `EXPERIENCE.md` er identiske.
- **Verifisert** i en ny klone i Temp (`k15`, `main` `568d39a` pluss endringene, `supabase.exe` er blokkert i prosjektmappen): `npx playwright test e2e/les/detalj.spec.ts e2e/endrer/ny-rapport.spec.ts e2e/endrer/ki-forslag.spec.ts e2e/core-flow.spec.ts` ga 216 bestått på 6,4 min. `npm run lint` og `npx tsc --noEmit` er rene, og `npm run test:unit` gir 84 filer og 1108 tester bestått. Full `npm test` kjøres av CI på PR-en.

## Spec Change Log

## Review Triage Log

Gjennomgang 1: Blind Hunter (11 funn, minst 6 kreves), Edge Case Hunter (7 funn) og Verification Gap (ingen funn). Dommene er satt mot koden, ikke av reviewer.

- `history.state` skrives på nytt av Next ved hver treoppdatering (`router.refresh`, bekreft, status, skjul), så «←» går til lista uten filtre: **medium, defer.** Stemte (`app-router.js:91-110`), men samme oppførsel som før rettelsen. Ført i `deferred-work.md`.
- `epics.md:154` og `:478` sier fortsatt at «←» og tilbakeknappen gjør det samme: **medium, defer.** Stemte. Å endre `epics.md` krever en linje i `epics-beslutningslogg.md` og prosjekteierens ordlyd. Ført i `deferred-work.md`.
- `EXPERIENCE.md` linje 43 sa bare «tar deg tilbake» (Blind Hunter og Edge Case Hunter): **low, patch.** Nå «tar deg tilbake til lista».
- Tilgjengelighetsteksten telte to grupper, men `list-filters.tsx:79` har en ytre gruppe «Filtrer rapportene»: **low, patch.**
- Fokusteksten var uklar om «dialogen lukkes» var avbryt eller bekreft: **low, patch.** Nå «avbryter du dialogen».
- Rund tid i `updated` og `last_updated`: **low, patch.** Satt til 14:45.
- Handlingspunktene er `done` før flett: **false.** Samme praksis som punkt 16, som ble satt til `done` da Playwright bestod.
- `issues.md` er ikke i diffen (Blind Hunter og Edge Case Hunter): **false.** Føres i sesjonsloggen, som spec-en sier.
- Innloggingstesten kan endre seed-data: **false.** Innloggingen sender bare tilbake til detaljsiden, og bekreftelsen utføres ikke.
- Ny fane ikke lukket, `about:blank` ikke sjekket, rapporten blir liggende: **low, rejected.** Konteksten lukkes etter testen, sluttsjekken er lista, og alle testene i `endrer-*` lar rapporter bli liggende til neste `db reset`.
- Manglende `localfixFrom` i gamle oppføringer og rapporter uten stempel etter filterendring: **low, rejected.** Begge gir lista, som er trygg oppførsel, og en rettelse krever flere grener.
- `localfixFrom === "/"` men forrige oppføring ikke er lista: **false.** Stien settes bare når siden før var lista, og oppføringen før den er da lista.
- Ingen enhetstest for `BackLink` og ingen håndheving av prosessregelen: **low, rejected.** Prosjektet tester navigasjon med Playwright, og regelen er en prosess, ikke kode.
- Rapporten om at «brukeren bestemmer ordlyden» og `(change)` i stedet for `(decision)`: **low, rejected.** Ordlyden er godkjent av brukeren.
- Skjøre linjenumre i spec-en og dybdesjekken som er overflødig: **low, rejected.** Spec-en endres ikke av gjennomgangen, og sjekken er beholdt med vilje.

## Design Notes

`BackLink` er alltid montert i topplinja, så en `ref` med forrige `pathname` overlever klientnavigasjon. Når `history.state` mangler `localfixDepth` (ny oppføring, eller Next har overskrevet den med `router.replace`), skrives både dybden og `localfixFrom` inn i oppføringen. Klikket bruker `router.back()` bare når dybden er over 0 og `localfixFrom === "/"`. Ellers får `Link` gå til `/`.

## Verification

**Commands:**
- `npm run lint` og `npx tsc --noEmit` -- expected: rene
- `npm run test:unit` -- expected: alle bestått
- `npx playwright test e2e/les/detalj.spec.ts e2e/endrer/ny-rapport.spec.ts e2e/endrer/ki-forslag.spec.ts` (i ny klone i Temp, `supabase.exe` er blokkert i prosjektmappen) -- expected: alle bestått
- `diff docs/ux/EXPERIENCE.md docs/planning-artifacts/ux-designs/ux-LocalFix-2026-10-11/EXPERIENCE.md` -- expected: ingen forskjell
