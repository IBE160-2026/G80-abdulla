# Utsatt arbeid

- source_spec: `docs/implementation-artifacts/spec-1-1-startpakke-og-lokal-supabase.md`
  summary: En automatisk test som sjekker at `/manifest.webmanifest` peker på ikoner på 192 og 512 px som finnes i `public/`.
  evidence: Akseptansekriteriet for manifestet er bare sjekket med curl i Story 1.1. Et feilstavet `src` eller et omdøpt ikon ville gjort appen ikke-installerbar uten at noen test feiler. Hører hjemme i Playwright- eller Vitest-oppsettet i Story 1.2 (Verification-gap V5, verdi medium, ikke verifisert i test).
  status: Løst i Story 1.2. `e2e/les/manifest.spec.ts` sjekker at manifestet har ikoner på 192 og 512 px, og at hvert `src` svarer 200 med `image/png`.

- source_spec: `docs/implementation-artifacts/spec-1-5-detaljsiden.md`
  summary: «←» på detaljsiden skal gå til lista, ikke tilbake i historikken, når forrige side i appen ikke er lista (for eksempel innloggingen eller skjemaet).
  evidence: `shared/layout/back-link.tsx` går tilbake i historikken når det finnes en side i appen før detaljsiden, uansett hvilken. I dag lenker bare lista til detaljsiden, men Story 2.2 (detaljsiden etter innsending) og Story 3.3 (innlogging og tilbake ved bekreftelse) gir andre forrige sider (edge-case-hunter E3, gjennomgang 1 i Story 1.5).

- source_spec: `docs/implementation-artifacts/spec-1-5-detaljsiden.md`
  summary: En norsk `app/not-found.tsx` for URL-er som ikke finnes, for eksempel `/foo`, `/rapporter` og `/rapporter/<id>/x`.
  evidence: De gir Nexts engelske 404, og under `/rapporter/` står «←» i topplinja. Problemet fantes før Story 1.5 for alle ukjente URL-er (blind-hunter B2, edge-case-hunter E8).

- source_spec: `docs/implementation-artifacts/spec-2-2-registrere-en-rapport.md`
  summary: «←» på detaljsiden etter innsending forlater appen eller gjør ingenting når skjemaet `/rapporter/ny` var første side i fanen (bokmerke, ny fane eller PWA-snarvei).
  evidence: Verifisert med e2e 2026-11-10 (ny fane, `/rapporter/ny` direkte, innsending, «←» gir `about:blank`). `router.replace` til detaljsiden overskriver `history.state`, så `shared/layout/back-link.tsx` regner dybden som forrige + 1 og kaller `router.back()`. Fra lista virker «←» riktig og er testet. Brukeren godtok begrensningen og utsatte den til Story 3.3, som må løse «←» generelt (innlogging og tilbake til detaljsiden, direkte lenker og skjemaet).

## Deferred from: code review of spec-2-5-velge-ki-leverandor-med-sm-5-testen (2026-11-16)

- source_spec: `docs/implementation-artifacts/spec-2-5-velge-ki-leverandor-med-sm-5-testen.md`
  summary: AC 4 og «Ferdig»-definisjonen for Story 2.5 er ikke oppfylt ennå: avklaringene i beslutningsloggen, PRD §11 spørsmål 1 (begge kopier), Deferred-raden i arkitekturen, `.env.example`, full `npm test` med kjøretid, README-sjekken på ny klone og `Closes #33` i siste PR.
  evidence: Kjent og sporet i `.logs/ali-yousef-abdulla/issues.md` og oppgave 5–7 i spec-en. Avklaringene (Cloudflare betalingskort og inferenssted, gratisgrenser, trening) står heller ikke i loggen selv om to kjøringer mot Cloudflare er gjort; bare syntetiske beskrivelser er sendt. Lukkes når Cloudflare-kjøringen gir et resultat (acceptance-auditor, omfang A).
  resolution: 2026-11-18: Resultat og valg er ført (Cloudflare Workers AI, `gpt-oss-20b`), PRD §11 spørsmål 1 er lukket, Deferred-raden og `.env.example` er oppdatert, full `npm test` er kjørt i CI (5 min 42 s) og PR #57 bruker `Closes #33`. Avklaringene fra konsollene og README-sjekken på ny klone står fortsatt åpne i `issues.md`; storyen er satt til `done` på prosjekteierens ønske.
