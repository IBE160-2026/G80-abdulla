# Utsatt arbeid

- source_spec: `docs/implementation-artifacts/spec-1-1-startpakke-og-lokal-supabase.md`
  summary: En automatisk test som sjekker at `/manifest.webmanifest` peker på ikoner på 192 og 512 px som finnes i `public/`.
  evidence: Akseptansekriteriet for manifestet er bare sjekket med curl i Story 1.1. Et feilstavet `src` eller et omdøpt ikon ville gjort appen ikke-installerbar uten at noen test feiler. Hører hjemme i Playwright- eller Vitest-oppsettet i Story 1.2 (Verification-gap V5, verdi medium, ikke verifisert i test).
  status: Løst i Story 1.2. `e2e/les/manifest.spec.ts` sjekker at manifestet har ikoner på 192 og 512 px, og at hvert `src` svarer 200 med `image/png`.

- source_spec: `docs/implementation-artifacts/spec-1-5-detaljsiden.md`
  summary: «←» på detaljsiden skal gå til lista, ikke tilbake i historikken, når forrige side i appen ikke er lista (for eksempel innloggingen eller skjemaet).
  evidence: `shared/layout/back-link.tsx` går tilbake i historikken når det finnes en side i appen før detaljsiden, uansett hvilken. I dag lenker bare lista til detaljsiden, men Story 2.2 (detaljsiden etter innsending) og Story 3.3 (innlogging og tilbake ved bekreftelse) gir andre forrige sider (edge-case-hunter E3, gjennomgang 1 i Story 1.5).
  status: Løst i Epic 3 retro 15 (`spec-epic-3-retro-15-17-18-tilbakepil-og-rekonsiliering.md`). «←» går til lista når forrige side i appen ikke er lista, og e2e dekker innlogging og skjemaet som første side i fanen.

- source_spec: `docs/implementation-artifacts/spec-1-5-detaljsiden.md`
  summary: En norsk `app/not-found.tsx` for URL-er som ikke finnes, for eksempel `/foo`, `/rapporter` og `/rapporter/<id>/x`.
  evidence: De gir Nexts engelske 404, og under `/rapporter/` står «←» i topplinja. Problemet fantes før Story 1.5 for alle ukjente URL-er (blind-hunter B2, edge-case-hunter E8).
  status: Løst 2026-11-25 (`spec-norsk-404-side.md`). `app/not-found.tsx` gir «Fant ikke siden.» og lenken «Tilbake til lista», og `BackLink` viser «←» bare på `/rapporter/<id>` og skjemaet.

- source_spec: `docs/implementation-artifacts/spec-2-2-registrere-en-rapport.md`
  summary: «←» på detaljsiden etter innsending forlater appen eller gjør ingenting når skjemaet `/rapporter/ny` var første side i fanen (bokmerke, ny fane eller PWA-snarvei).
  evidence: Verifisert med e2e 2026-11-10 (ny fane, `/rapporter/ny` direkte, innsending, «←» gir `about:blank`). `router.replace` til detaljsiden overskriver `history.state`, så `shared/layout/back-link.tsx` regner dybden som forrige + 1 og kaller `router.back()`. Fra lista virker «←» riktig og er testet. Brukeren godtok begrensningen og utsatte den til Story 3.3, som må løse «←» generelt (innlogging og tilbake til detaljsiden, direkte lenker og skjemaet).
  status: Løst i Epic 3 retro 15 (`spec-epic-3-retro-15-17-18-tilbakepil-og-rekonsiliering.md`). «←» går til lista når forrige side i appen ikke er lista, og e2e dekker innlogging og skjemaet som første side i fanen.

## Deferred from: code review of spec-2-5-velge-ki-leverandor-med-sm-5-testen (2026-11-16)

- source_spec: `docs/implementation-artifacts/spec-2-5-velge-ki-leverandor-med-sm-5-testen.md`
  summary: AC 4 og «Ferdig»-definisjonen for Story 2.5 er ikke oppfylt ennå: avklaringene i beslutningsloggen, PRD §11 spørsmål 1 (begge kopier), Deferred-raden i arkitekturen, `.env.example`, full `npm test` med kjøretid, README-sjekken på ny klone og `Closes #33` i siste PR.
  evidence: Kjent og sporet i `.logs/ali-yousef-abdulla/issues.md` og oppgave 5–7 i spec-en. Avklaringene (Cloudflare betalingskort og inferenssted, gratisgrenser, trening) står heller ikke i loggen selv om to kjøringer mot Cloudflare er gjort; bare syntetiske beskrivelser er sendt. Lukkes når Cloudflare-kjøringen gir et resultat (acceptance-auditor, omfang A).
  resolution: 2026-11-18: Resultat og valg er ført (Cloudflare Workers AI, `gpt-oss-20b`), PRD §11 spørsmål 1 er lukket, Deferred-raden og `.env.example` er oppdatert, full `npm test` er kjørt i CI (5 min 42 s) og PR #57 bruker `Closes #33`. Avklaringene fra konsollene og README-sjekken på ny klone står fortsatt åpne i `issues.md`; storyen er satt til `done` på prosjekteierens ønske.
- source_spec: `docs/implementation-artifacts/spec-4-1-endre-status.md`
  summary: `signedIn()` i `e2e/api.ts` logger inn på nytt ved hvert kall, og e2e-testene kan nå grensen `sign_in_sign_ups = 30` per 5 min per IP i `supabase/config.toml`; vurder én klient per e-post.
  evidence: Uverifisert (maybe-false, ville vært medium). Full `npm test` besto med flere innlogginger enn grensen innenfor kjøringen, så grensen ser ikke ut til å slå inn lokalt. Avgjøres ved å telle innloggingene i én kjøring og se om GoTrue svarer 429 lokalt og i CI.
- source_spec: `docs/implementation-artifacts/spec-4-2-skjule-og-vise-en-rapport.md`
  summary: Grenen der `setReportHidden` (og `setReportStatus` utenom `stale_state`) svarer `ok: false` og viser `toast.error(answer.error.message)` i panelet, er ikke testet i e2e.
  evidence: Verification Gap, gjennomgang 1 i Story 4.2. `forbidden` og `report_not_found` er vanskelige å utløse for en innlogget moderator i e2e. Handlingene er enhetstestet til svaret, men ingen test ser hva grensesnittet gjør med svaret.
  resolution: 2026-11-22: `report_not_found` for begge handlingene er testet i e2e (`status.spec.ts` og `skjul.spec.ts`, rapporten slettes mens siden er åpen). `forbidden` er ikke utløst i e2e, men går gjennom samme toast og er enhetstestet i `errors.test.ts`. Se `spec-epic-4-retro-1-fokus-i-statuspanel-og-toast-test.md`.
- source_spec: `docs/implementation-artifacts/spec-4-2-skjule-og-vise-en-rapport.md`
  summary: Statusknappene i `StatusPanel` (Story 4.1) bruker `disabled` under lagring, så fokus kan gå til `body` til svaret kommer. Vurder `aria-disabled` som i `HideControl` og `ConfirmSection`.
  evidence: Fantes før Story 4.2 (fra 4.1). Funnet under gjennomgangen av 4.2, der samme feil ble rettet i `HideControl`. Testen «knappene er deaktivert mens endringen lagres» i `status.spec.ts` sjekker ikke fokus mens POST-en holdes igjen.
  resolution: 2026-11-22: `StatusPanel` bruker `aria-disabled`, og `status.spec.ts` sjekker fokus og at bare ett kall går ut mens POST-en holdes. Se `spec-epic-4-retro-1-fokus-i-statuspanel-og-toast-test.md`.
- source_spec: `docs/implementation-artifacts/spec-epic-3-retro-16-felles-e2e-hjelpere.md`
  summary: `e2e/core-flow.spec.ts` skriver ut axe, breddesjekken og 320 px-blokken seks ganger i stedet for å bruke `expectAccessibleLayout` fra `e2e/a11y.ts`.
  evidence: Blind Hunter i gjennomgangen av epic-3-retro-item-16 (`core-flow.spec.ts:95`, `:166`, `:241`, `:282`, `:319`, `:438`). Kjerneflyten er én lang test som kjører i begge endrer-prosjektene, så endringen bør kjøres og vurderes for seg, ikke sammen med ryddingen av hjelperne.

- source_spec: `docs/implementation-artifacts/spec-epic-3-retro-15-17-18-tilbakepil-og-rekonsiliering.md`
  summary: «←» går til lista uten filtre i stedet for tilbake i historikken etter en handling som oppdaterer detaljsiden på samme sti (bekreft, statusendring, skjuling eller `router.refresh()`).
  evidence: Nexts `HistoryUpdater` (`node_modules/next/dist/client/components/app-router.js`, linje 91–110) skriver `history.state` på nytt ved hver treoppdatering, uten egne felt, så `localfixDepth` og `localfixFrom` forsvinner. Effekten i `BackLink` kjører bare når stien endres, så `entryDepth()` er `undefined` ved klikket, og lenken går til `/`. Samme oppførsel som før rettelsen, ikke verifisert i nettleser. Fiks: hold dybde og forrige sti i en `ref` og bruk den når `history.state` mangler, eller skriv dem på nytt ved klikket (Edge Case Hunter, gjennomgang 1).
  status: Løst i spec-tilbakepil-history-state.md (2026-11-23). `BackLink` holder dybde og forrige sti i refs og bruker dem ved klikket når `history.state` er skrevet over. En ny e2e-test i `bekreft.spec.ts` dekker bekreftelse.

- source_spec: `docs/implementation-artifacts/spec-epic-3-retro-15-17-18-tilbakepil-og-rekonsiliering.md`
  summary: `docs/planning-artifacts/epics.md` sier fortsatt at «←» og nettleserens tilbakeknapp gjør det samme (linje 154, UX-DR4) og at Story 1.5 går «tilbake til lista, som med nettleserens tilbakeknapp» (linje 478).
  evidence: `EXPERIENCE.md` (begge kopier) har fra Epic 3 retro 15 en ny regel: «←» går tilbake i historikken bare når forrige side er lista, ellers til lista. Å endre `epics.md` krever en linje i `epics-beslutningslogg.md`, og ordlyden er prosjekteierens (Blind Hunter, gjennomgang 1).
  status: Løst i PR «docs: epics.md følger «←»-regelen» (2026-11-23). UX-DR4 (linje 154) og akseptansekriteriet i Story 1.5 (linje 478) er rettet, og `epics-beslutningslogg.md` har en linje.

- source_spec: `docs/implementation-artifacts/spec-tilbakepil-history-state.md`
  summary: En historikkoppføring som Next har skrevet over uten våre felt (revalidering på samme sti) og som så besøkes på nytt med tilbake-knappen, får feil stempel i `BackLink`, så «←» kan gi `router.back()` ut av appen.
  evidence: Effekten i `shared/layout/back-link.tsx` regner en oppføring uten dybde som ny (forrige dybde + 1, forrige sti fra siden brukeren kom fra). Eksempel: bokmerke til detaljsiden (dybde 0), statusendring (oppføringen skrives over), logoen til lista, tilbake-knappen, «←» gir `router.back()` til feil oppføring. Samme oppførsel som før endringen, ikke verifisert i nettleser. Fiks: skriv dybde og forrige sti tilbake i oppføringen rett etter at Next har skrevet den over, for eksempel ved å pakke `history.replaceState`, eller gi hver oppføring en id i `sessionStorage` (Blind Hunter og Edge Case Hunter, inline gjennomgang 1).
  status: Godtatt for v1 (2026-11-25, prosjekteieren). Problemet er reelt (en e2e-test med detaljsiden som første side i en ny fane, bekreftelse, logoen til lista, tilbake-knappen og «←» ga `about:blank` på dagens kode), men sjelden: det krever at detaljsiden var første side i fanen, at siden ble oppdatert uten å bytte sti, og at brukeren gikk til lista og tilbake med nettleserens knapp før «←». Løsningene (pakke inn `history.replaceState`, eller Navigation API med `sessionStorage`) er enten avhengige av Nexts interne rekkefølge eller gir to kodeveier. Testen er kastet, ingen kodeendring.

## Deferred from: code review of v1, gruppe A: app/, shared/, proxy.ts og next.config.ts (2026-11-25)

- source_spec: none (reviewet mot `docs/planning-artifacts/epics.md`)
  summary: `updateSession` i `shared/supabase/proxy.ts` har ingen try/catch rundt `supabase.auth.getClaims()`.
  evidence: Ikke verifisert (maybe-false, ville vært medium: en innlogget bruker får 500 på alle sider hvis `getClaims` kaster i stedet for å returnere `{ error }`). `GoTrueClient.getClaims` returnerer feil som data for `AuthError`, men kaster andre feil videre, og det er uklart om en feilet JWKS-henting blir en `AuthError`. Besøkende uten sesjon rammes ikke. Avgjøres med en test i `proxy.test.ts` der `getClaims` kaster, og ved å se hva proxyen svarer.
- source_spec: none (reviewet mot `docs/planning-artifacts/epics.md`)
  summary: `e2e/les/manifest.spec.ts` sjekker bare ikonene i manifestet, ikke `display`, `start_url`, navn eller at et `maskable`-ikon finnes.
  evidence: Verification gap (verdi lav). Å fjerne `display: "standalone"` i `app/manifest.ts` feiler ingen test. En liten utvidelse av den eksisterende testen lukker det.
- source_spec: none (reviewet mot `docs/planning-artifacts/epics.md`)
  summary: Ingen test importerer rot-`proxy.ts` eller sjekker `config.matcher`.
  evidence: Verification gap (verdi lav). `proxy.test.ts` kjører bare `updateSession`. Et ødelagt matcher-uttrykk ville stoppet fornyelsen av sesjonen uten at noen test feiler. En enhetstest som sjekker matcheren mot `/`, `/rapporter/<id>`, `/auth/login` og mot `_next/static` og bildefiler lukker det.
- source_spec: none (reviewet mot `docs/planning-artifacts/epics.md`)
  summary: `app/error.tsx` er bare testet med en håndgitt `retry`, aldri som ekte feilgrense i e2e.
  evidence: Verification gap (verdi lav). Enhetstesten dekker markup og klikk. Å tvinge en serverfeil i e2e (for eksempel med `reset`-prosjektet) er dyrt, så det er utsatt. Next 16.4.5 har `retry` i typene (`error-boundary.d.ts`), så propnavnet er ikke i tvil.
- source_spec: none (reviewet mot `docs/planning-artifacts/epics.md`)
  summary: Fargen per status i `StatusBadge` (`new`, `in_progress`, `resolved`) er ikke testet.
  evidence: Verification gap (verdi lav). `report-card.test.ts` sjekker bare den skjulte tilstanden og etiketten. Byttes klassene for «Ny» og «Løst», består alle tester. En tabelltest med `renderToStaticMarkup` i stil med `report-card.test.ts` lukker det.

## Deferred from: code review of v1, gruppe B: features/registrering (2026-11-25)

- source_spec: none (reviewet mot `docs/planning-artifacts/epics.md`)
  summary: `prepareImage` gjenkoder bildet, og en fil nær 5 MiB kan bli større enn grensen etter gjenkoding og gi `too_large`, vist som «Bildet kan ikke brukes …» etter at skjemaet og signatursjekken slapp det gjennom.
  evidence: Reell men sjelden (verdi lav): docblocken i `features/registrering/image-process.ts` sier det selv, og `epics.md` (Story 2.4) krever at en fil på nøyaktig 5 MiB godtas. Fiksen krever et valg (nedskalering, lavere kvalitet i et nytt forsøk, eller å godta begrensningen), så den er ikke utvetydig. Avgjøres med en test med et JPEG på cirka 4,9 MiB som gjenkodes med `quality: 90`.
