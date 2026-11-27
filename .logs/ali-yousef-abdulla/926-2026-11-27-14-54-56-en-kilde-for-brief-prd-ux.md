# Én kilde for brief, PRD og UX

## 2026-11-27 kl. 14:54 — Ali Yousef Abdulla

### Oppgave
Velge én kilde for brief, PRD og UX. Dokumentene lå to steder: `docs/planning-artifacts/` (BMAD-ens mappe) og flate kopier i `docs/` (og `DESIGN.md` i roten). Punktet stod åpent i `issues.md` siden sensorsjekken 2026-11-06 (kriterium 7).

### Plan
- Kartlegge hva som er duplisert og hvem som leser hva, anbefale én løsning og la prosjekteieren velge.
- Fjerne kopiene, rette lenker i de levende dokumentene, og føre beslutningen i loggene.
- Branch `chore/en-kilde-for-brief-prd-ux`.

### Resultat
- **Funn:** alle seks parene var helt like (bortsett fra linjeskift): `docs/prd.md`, `docs/product-brief.md`, `docs/prd-addendum.md`, `docs/addendum.md`, `docs/ux/` og `DESIGN.md`. Arkitektur, research og `epics.md` fantes bare i `planning-artifacts/`, og README lenket allerede dit. Ingen kode eller tester leste filene i `docs/`. `DESIGN.md` i roten brukes av `app/globals.css` (kommentaren) og Impeccable.
- **Prosjekteierens valg:** `docs/planning-artifacts/` er den ene kilden for brief, PRD, UX (med tilleggsfiler, `.memlog.md` og skisser), arkitektur, research og epics. `DESIGN.md` ligger bare i roten. Avvist: også `DESIGN.md` i planning-artifacts (Impeccable finner den ikke lenger i roten), og `docs/` som kilde (`.memlog.md`, tilleggsfilene og skissene mister plassen ved siden av dokumentene, og BMad-skillene leser planning-artifacts).
- **Fjernet (`git rm`):** `docs/prd.md`, `docs/product-brief.md`, `docs/prd-addendum.md`, `docs/addendum.md`, `docs/ux/` (`EXPERIENCE.md` og fire skisser) og `docs/planning-artifacts/ux-designs/ux-LocalFix-2026-10-11/DESIGN.md`.
- **Rettet lenker og stier i:** `README.md` (tabellen og avsnittet om kilden), `PRODUCT.md`, `DESIGN.md` og `EXPERIENCE.md` (kildelistene i frontmatter), `epics.md` og `ARCHITECTURE-SPINE.md` (peker nå på `DESIGN.md` i roten), `docs/beslutninger/README.md`, `docs/testdekning.md` og `docs/tilbakemelding-prd.md`. En lenkesjekk av README, `PRODUCT.md`, `DESIGN.md`, `docs/*.md` og `docs/beslutninger/*.md` gir 0 brutte relative lenker. Spine-linteren gir 0 funn.
- **Ikke rettet (historikk):** de gamle spec-filene og retroene i `docs/implementation-artifacts/`, `.memlog.md`-filene og øktloggene i `.logs/` nevner fortsatt `docs/prd.md`, `docs/ux/` og «begge kopier». De er et spor av hva som ble gjort på den tiden.
- Beslutningen er ført i `ux-beslutningslogg.md`, `prd-beslutningslogg.md` og `brief-beslutningslogg.md`, og punktet i `issues.md` er lukket.

### Åpne punkter
- Fremtidige endringer i EXPERIENCE.md, PRD og brief gjøres bare i `docs/planning-artifacts/`. Prosessregelen i `coaching-plan.md` (linje i beslutningsloggen ved endring) gjelder uendret.
