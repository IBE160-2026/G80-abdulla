---
title: 'Nøytral tekst i tom «Mine rapporter»'
type: 'bugfix'
created: '2026-11-26'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** En bruker som bare har skjulte rapporter, får «Du har ikke registrert noen rapporter ennå.» når «Mine rapporter» er eneste aktive filter. Det er usant, for RLS skjuler rapportene også for forfatteren (FR-9).

**Approach:** Bytt teksten til «Du har ingen rapporter å vise.», som er sann både når brukeren ikke har registrert noe og når alt er skjult, og som ikke røper at noe er skjult (FR-9, «ingen melding i v1»). Knappen «Registrer problem» og `role="status"` beholdes. Beslutning: `docs/beslutninger/ux-beslutningslogg.md` 2026-11-26.

</frozen-after-approval>

## Implementation Notes

- Kode: `features/rapporter/components/report-list.tsx`, grenen `reports.length === 0 && params.mine` og JSDoc-en øverst.
- Test: konstanten `NO_OWN` i `e2e/les/mine.spec.ts`. Ingen enhetstest har teksten.
- Dokumenter: `docs/ux/EXPERIENCE.md` og kopien i `docs/planning-artifacts/ux-designs/ux-LocalFix-2026-10-11/EXPERIENCE.md` (raden «Ingen egne rapporter» og tilgjengelighetslinja), mockupen `liste.html` i begge mappene, UX-DR16 og akseptansekriteriet i Story 3.2 i `docs/planning-artifacts/epics.md`, og `docs/implementation-artifacts/epic-3-context.md`.
- Ikke endret: spec-3-2 og andre `spec-*.md` i `docs/implementation-artifacts/`, reviewrapportene under `architecture/reviews/` og loggene. De viser hvordan teksten var da de ble skrevet.
- Ingen ny e2e-test for en bruker med bare skjulte rapporter: endringen er bare tekst i samme gren, og den eksisterende testen (`NO_OWN`) dekker grenen.
- Endret med samme erstatning (sed): `report-list.tsx` (JSDoc-en rettet for hånd etter reviewen, pluss kommentar om hvorfor teksten er nøytral), `e2e/les/mine.spec.ts`, begge `EXPERIENCE.md`, begge `liste.html` og `epics.md`.
- Playwright kan ikke kjøre lokalt (`supabase.exe` er blokkert), så e2e-endringen bekreftes i CI.
- Rad B2 i triagen i `spec-3-2-mine-rapporter.md` avviste dette problemet («teksten står i den frosne blokka»). Den er snudd av beslutningen 2026-11-26; spec-3-2 er ikke endret, siden den viser hvordan det var.
- Kjørt lokalt: `tsc --noEmit`, `eslint` på `features/rapporter` og `e2e/les/mine.spec.ts`, og `vitest run --project unit features/rapporter`, alle grønne.

## Review Triage Log

Blind Hunter (Edge Case Hunter, Verification Gap og Acceptance Auditor ble hoppet over: endringen bytter én tekst).

- medium (patch): JSDoc-en i `report-list.tsx` hadde den gamle teksten fordi setningen var delt over to linjer. Rettet.
- low (patch): `epic-3-context.md` hadde den gamle teksten. Rettet.
- low (patch): beslutningsloggen sa «ikke implementert ennå». Ny `change`-linje i `ux-beslutningslogg.md`.
- low (patch): EXPERIENCE.md sa ikke hvorfor teksten er nøytral. Én setning i raden «Ingen egne rapporter» i begge kopier.
- low (patch): faste linjenumre i Implementation Notes. Byttet til navngitte ankre.
- low (patch): ingen peker fra B2 i spec-3-2. Nevnt her.
- low (patch): lokale sjekker var ikke ført. Ført over.
- low (patch, ved logging): det åpne punktet i `issues.md` lukkes i sesjonsloggen.
- false: «ingen test dekker en bruker med bare skjulte rapporter, og en RLS-regresjon ville gått ubemerket». RLS-delen er dekket av pgTAP: `supabase/tests/bilder.sql` og `status.sql` bruker den skjulte rapport 7 med bruker1 som forfatter. Teksten i UI-et er samme gren som `NO_OWN` dekker.
- false: «spec-en er ikke ferdig». Den var under arbeid; status settes til `done` her.
