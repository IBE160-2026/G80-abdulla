# Arkitektur: sist oppdatert

## 2026-10-29 kl. 14:17 — Ali Yousef Abdulla

### Oppgave
Oppdatere arkitekturen slik at den dekker PRD FR-8 («sist oppdatert» på detaljsiden), som kom fra research på brukerstemmer. Fortsetter [brief-oppdatering-etter-research](995-2026-10-29-13-58-00-brief-oppdatering-etter-research.md).

### Plan
- Lese `ARCHITECTURE-SPINE.md` og finne hvor statusendring og tidsfelt hører hjemme.
- Gjøre minimale endringer som følger AD-1 (databasen eier reglene) og AD-7 (triggeren), på ny branch `docs/arkitektur-sist-oppdatert` (bygger på `docs/research-brukerstemmer-og-konkurrenter`, PR #9).
- UX (`EXPERIENCE.md`) ble ikke tatt i denne omgangen.

### Resultat
Endret `docs/planning-artifacts/architecture/architecture-LocalFix-2026-10-28/ARCHITECTURE-SPINE.md` (`updated` 2026-10-29, status fortsatt `draft`) og `.memlog.md`. Ukommittert.
- **AD-4:** `reports.status_changed_at` med `DEFAULT now()`, satt bare av triggeren, uendret ved skjuling. For en rapport uten statusendring er den lik registreringstidspunktet.
- **AD-7:** `reports_guard_update` setter `NEW.status_changed_at := now()` når `status` er endret og kolonnesjekken er bestått.
- **AD-12:** `status_changed_at` har default, kan ikke settes av `authenticated`, og er ikke med i moderators UPDATE-grant.
- **ERD, konvensjoner og kapabilitetskart:** kolonnen er lagt til, «sist oppdatert» viser `status_changed_at`, og FR-8 peker på AD-4. pgTAP-testene skal dekke at kolonnen flyttes ved statusendring, står stille ved skjuling og ikke kan settes av en bruker.
- **Memlog:** beslutning og antagelse ført inn. Antagelsen er lead-utledet: egen kolonne satt av triggeren, ikke historikktabell eller `updated_at`.
- Spine-linteren (`lint_spine.py`) er ikke kjørt, siden Python mangler på maskinen.

### Åpne punkter
- `docs/ux/EXPERIENCE.md` og `docs/planning-artifacts/ux-designs/ux-LocalFix-2026-10-11/EXPERIENCE.md` mangler visningen av «sist oppdatert» på detaljsiden.
- Spine-linteren er ikke kjørt (krever Python).
- Spinen står fortsatt som `draft`, og denne endringen er ikke gjennom ny reviewrunde.
