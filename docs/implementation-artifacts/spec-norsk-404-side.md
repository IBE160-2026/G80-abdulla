---
title: 'Norsk 404-side for ukjente URL-er'
type: 'bugfix'
created: '2026-11-25'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Ukjente URL-er som `/foo`, `/rapporter` og `/rapporter/<id>/x` gir Nexts engelske «404 This page could not be found.». Under `/rapporter/` står «←» i topplinja (`BackLink` viser den for alle stier som begynner med `/rapporter/`), selv om siden ikke er en rapport. Fra deferred-work, Story 1.5 (blind-hunter B2, edge-case-hunter E8).

**Approach:** Legg til `app/not-found.tsx` med norsk tekst: «Fant ikke siden.» og lenken «Tilbake til lista» til `/`, i samme oppsett som `app/rapporter/[id]/not-found.tsx`. `BackLink` viser «←» bare på `/rapporter/<én-del>` (detaljsiden, 404-siden for en rapport og skjemaet `/rapporter/ny`), ikke under dypere stier. 404-siden for en rapport er uendret.

</frozen-after-approval>

## Implementation Notes

- Filer: `app/not-found.tsx` (ny), `shared/layout/back-link.tsx` (regex `^\/rapporter\/[^/]+$` i stedet for `startsWith("/rapporter/")`), `e2e/les/detalj.spec.ts` (fire URL-er og axe), `EXPERIENCE.md` i begge kopier (ny rad «URL som ikke finnes»), `ux-beslutningslogg.md` og `deferred-work.md`.
- `/rapporter/ny` beholder «←» (som før). `/rapporter/abc` og andre ugyldige id-er går fortsatt til `[id]/not-found.tsx` («Fant ikke rapporten.») med «←».
- Verifisert: `tsc`, `eslint` og `npm run test:unit` (84 filer, 1108 tester) grønne. En engangsjekk i Chromium mot `next dev` viste 404, «Fant ikke siden.» og ingen «←» for `/foo`, `/rapporter`, `/rapporter/<id>/x` og `/rapporter/ny/x`, og «←» på `/rapporter/abc`. curl kan ikke brukes: Next sender feilskallet og tegner siden i nettleseren.
- Ikke kjørt lokalt: de nye Playwright-testene (webserveren starter `supabase db reset`, og `supabase.exe` er blokkert). De må kjøres i CI.
- Gjennomgang: bare egen gjennomgang av diffen. Blind Hunter-subagenten ble ikke startet, fordi brukeren ikke har bedt om subagenter. Ingen funn som krevde rettelse.

## Review Triage Log

- Ingen funn fra egen gjennomgang. Sjekket: `/rapporter/<id>/` med slutt-skråstrek (Next omdirigerer til uten, ingen `trailingSlash` i `next.config.ts`), `/rapporter/ny/x` (404 uten «←», bekreftet i nettleser) og at `proxy.ts` ikke endrer 404-svaret.
