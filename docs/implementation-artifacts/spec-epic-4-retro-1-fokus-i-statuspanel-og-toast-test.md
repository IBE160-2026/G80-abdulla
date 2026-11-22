---
title: 'Epic 4 retro 1: fokus i StatusPanel og toast-test'
type: 'bugfix'
created: '2026-11-22'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Statusknappene i `StatusPanel` (Story 4.1) bruker `disabled` mens endringen lagres, så fokus går til `body` til svaret kommer. `HideControl` (4.2) og `ConfirmSection` (3.3) bruker `aria-disabled` og beholder fokus. Grenen der `setReportStatus` eller `setReportHidden` svarer `ok: false` (utenom `stale_state`) og panelet viser en toast, er heller ikke testet i e2e. Kilde: `docs/implementation-artifacts/epic-4-retro-2026-11-22.md` (A4, A5 a og b, handlingspunkt 1), `issues.md:153` og `:154`, `deferred-work.md:31–34`.

**Approach:** Bytt `disabled={saving}` med `aria-disabled` i `StatusPanel`, på samme måte som i `HideControl`, og la testen «knappene er deaktivert mens endringen lagres» sjekke at fokus blir på knappen mens POST-en holdes. Legg til to e2e-tester som utløser `report_not_found` (ikke `stale_state` og ikke nettverksfeil, som er testet) ved å slette den nye testrapporten mens siden er åpen: én for statusknappene og én for «Skjul rapport».

</frozen-after-approval>

## Implementation Notes

- `features/moderering/components/status-panel.tsx`: `disabled={saving}` er byttet med `aria-disabled={saving || undefined}` og klassene `aria-disabled:cursor-not-allowed aria-disabled:opacity-50`, som i `HideControl`. `onStep` hadde allerede `if (saving) return`. Kommentarene er oppdatert.
- `e2e/db.ts`: ny `deleteReportRow(id)`, som sletter én rapport som postgres via `npx supabase db query --local --file` med en midlertidig fil. Den avviser en id som ikke er en uuid. Ingen klient kan slette, og e2e har ingen tjenestenøkkel (AD-11), så CLI-en er veien, som i `resetDb`.
- `e2e/endrer/status.spec.ts`: testen om lagring heter nå «knappene er aria-disabled mens endringen lagres, og fokus blir på knappen». Den sjekker `aria-disabled`, at `disabled` mangler, fokus på knappen (og ikke `body`), og at et nytt Enter-trykk mens POST-en holdes ikke sender et nytt kall (`posts` er 1). Ny test: rapporten slettes mens siden er åpen, og trykket gir toasten «Fant ikke rapporten.» (`report_not_found`), ingen `stale_state`-toast, uendret panel, aktive knapper og fokus på første knapp.
- `e2e/endrer/skjul.spec.ts`: ny test: rapporten slettes, «Skjul rapport» og bekreftelsen gir samme toast, dialogen lukkes, og fokus står på «Skjul rapport».
- **Dekning av `ok: false`:** `report_not_found` går gjennom samme `toast.error(answer.error.message)` som `forbidden`. `forbidden` er ikke utløst i e2e, siden en innlogget moderator ikke kan få 42501, men meldingen er enhetstestet i `shared/lib/errors.test.ts`. `stale_state` (status) og nettverksfeil (status og skjul) var testet fra før.
- **Rettelse til retroen:** punkt A5 b i `epic-4-retro-2026-11-22.md` sier at grenen der `setReportStatus` eller `setReportHidden` svarer `ok: false` ikke er testet i e2e. Det er for bredt: `stale_state` (status) og nettverksfeil (begge) var testet fra før, slik `deferred-work.md` også sier («utenom `stale_state`»). Det som manglet, var `report_not_found` for begge og `forbidden`.
- **Verifisert** i en ny klone (`k43`, main `cac7e51` pluss endringene): `npx playwright test --no-deps` på `status.spec.ts`, `skjul.spec.ts` og `core-flow.spec.ts` i `endrer-360` og `endrer-1280` ga 28 bestått (4,7 min). `npm run lint`, `npx tsc --noEmit` og `npm run test:unit` (84 filer, 1108 tester) er grønne. Full `npm test` er ikke kjørt, siden bare disse filene er endret.

## Review Triage Log

Gjennomgang 1: Blind Hunter (9 funn, minst 4 kreves).

- Dårlig ompakket kommentar i `status-panel.tsx` og `skjul.spec.ts`: **low, patch.** Stemte (en linje ble over 100 tegn). Ompakket.
- `aria-disabled` mangler hover-stil og klassestrengen er kopiert mellom `hide-control.tsx` og `status-panel.tsx`: **low, rejected.** Samme valg som i `HideControl` og `ConfirmSection`. Å flytte strengen inn i `Button` er et nytt felles API og hører til en egen opprydding.
- Ingen «Lagrer…» for skjermleser: **false.** Dette er ikke en endring fra før: `aria-disabled` leses som utilgjengelig, som `disabled` gjorde, og `HideControl` og `ConfirmSection` gjør det samme. Statusteksten er en live-region som endres når svaret kommer.
- Det nye Enter-trykket viser ikke at ingen ny POST gikk: **medium, patch.** Stemte, siden testen ville bestått uten `if (saving) return`. `posts` telles nå i rute-håndtereren og er 1.
- Overflødige påstander (`toBeDisabled` ved siden av `aria-disabled`, og `activeElement !== body`): **low, rejected.** Følger `skjul.spec.ts`, og de kostet ingenting.
- `runSql` tar vilkårlig SQL, og dupliserer `runSqlFile`: **low, patch** for den første delen. Byttet med `deleteReportRow(id)`, som avviser en id som ikke er en uuid. Dupliseringen er avvist, siden de to bruker samme `run`.
- Testene viser ikke at raden er borte eller at det ikke var `stale_state`: **medium, patch.** Stemte. Testene sjekker nå at raden er borte (`readStatusAs` kaster, `readHiddenAs` gir `null`), og at toasten «Rapporten er endret» ikke står der.
- Flere tilfeller (andre fane, `ERROR_MESSAGES.unknown`) og ingen komponenttester: **low, rejected.** Utenfor punktet. `unknown` er testet av nettverksfeiltestene, og komponentene har ingen jsdom-oppsett.
- Spec og logg er ikke committet sammen med endringen: **false.** De committes i samme PR.
