# Research: brukerstemmer og konkurrenter

## 2026-10-29 kl. 13:06 — Ali Yousef Abdulla

### Oppgave
Mer research på LocalFix før PRD-en oppdateres: brukerstemmer og konkurrenter, kjørt her (ikke som ekstern prompt). Beslutningen researchen skal støtte er hva PRD-en bør endre eller legge til for campus Molde.

### Plan
- `bmad-deep-recon`, Run, `standard` (3 assistenter, 8 kilder per runde, 2 runder), bredde-først, validering `normal`. Godkjent av bruker.
- Runde 1: brukerstemmer om meldeapper, konkurrent-teardown (FiksGataMi, Molde kommune, FixMyStreet, SeeClickFix), Nextdoor og campuskanaler.
- Runde 2 (målrettet etter hull): norske brukerstemmer, Fiks Gata og Molde «Meld ifra» i detalj, eierskap og kanaler på Molde campus.
- Syntese til `research.md`, mekanisk siteringssjekk, semantisk kildesjekk med fersk assistent, rettelser.

### Resultat
- Ny mappe (ukommittert): `docs/planning-artifacts/research/user-voice-brukerstemmer-og-konkurrenter-for-lokal-2026-10-29/` med `research.md` (29+1 kilder, 7 anbefalinger, foreldelseskart), seks digests i `digests/` og `.memlog.md`.
- Kildestatus: 0 verifisert, 9 uverifisert, 3 omstridte, 1 overstyrt. Grunnlaget er tynt: nesten ingen norske brukerstemmer, mye søkesammendrag.
- Hovedfunn: «tilbakekoblingshullet» er den klagen som går igjen (utenlandske kilder, ett norsk eksempel fra Bergen 2026); Fiks Gata har kommentar/«bekreft» for innloggede (single-source), så briefens påstand om at ingen lar naboer bekrefte holder ikke; HiM har ingen funnet kanal for hverdagsfeil utendørs, og eier av belysning og stier rundt campus er ikke funnet.
- Semantisk kildesjekk fant 16 avvik. Alle er rettet i `research.md` (feil henvisninger fjernet, tillit nedgradert, kilde [30] lagt til). `recon_kit.py citations` er ok etter rettelsene.
- Ikke gjort: `bmad-review` (structure, prose) på rapporten, som konfigurasjonen ber om. `competition.md` er ikke oppdatert og PRD/brief er ikke endret.

### Åpne punkter
- Sjekke manuelt i nettleser: `fiksgatami.no/content/steps` og en faktisk sak (virker «bekreft», hvem setter status), om Fiks Gata er aktiv (kartet viste 0 saker, «nedlagt 2024» er omstridt), og om det ligger et skjema bak Molde kommunes «Meld ifra».
- Åpne `himolde.pureservice.com` og se om det finnes kategori for uteområder/lys/eiendom og hvem som mottar. Sammenlign HiMs «ikke anonymt» mot «også anonymt» på originalsidene.
- Avklare hvem som eier og vedlikeholder belysning, gangveier og fortau rundt campus (HiM, Statsbygg, kommune, fylke eller Vegvesen), og hvem moderator er i praksis. Dette avgjør om «Løst» har dekning.
- Primærdata: 5–10 korte samtaler med studenter og ansatte, pluss Reddit/App Store (norsk storefront)/studentavis, siden norske brukerstemmer mangler.
- Oppdatere PRD (`bmad-prd`, oppdateringsmodus, nytt kontekstvindu) med research som underlag: omskrive differensieringen i brief/PRD (ikke «ingen kan bekrefte»), moderatorrolle og «sist oppdatert»-synlighet. Sjekk deretter om arkitekturen berøres.
- Kjøre `bmad-review` (structure, prose) på `research.md`, og vurdere å fylle ut `docs/planning-artifacts/research/competition.md` (er fortsatt en stump).
- Fire kilder i rapporten er allerede utløpt etter foreldelsesvinduene (tidligste kontroll 2025-04-01); oppdateres med Refresh/Deepen.
