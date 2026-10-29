# Brief-oppdatering etter research

## 2026-10-29 kl. 13:58 — Ali Yousef Abdulla

### Oppgave
Hente siste versjon av product briefen og oppdatere den med funnene fra research på brukerstemmer og konkurrenter, og med avvik mot PRD-en.

### Plan
- Finne siste versjon: `docs/product-brief.md` (hovedkopi) og `docs/planning-artifacts/briefs/brief-LocalFix-2026-09-18/brief.md` (identisk arbeidskopi).
- Sammenligne briefen mot [research.md](../../docs/planning-artifacts/research/user-voice-brukerstemmer-og-konkurrenter-for-lokal-2026-10-29/research.md) og `docs/prd.md`, og foreslå endringer før noe ble redigert.
- Brukeren valgte forslag 1–4 (differensiering, fallgruvesetningen, moderator, personvern). Forslag 5–7 ble ikke gjort.

### Resultat
Endret `docs/product-brief.md` og synkroniserte `docs/planning-artifacts/briefs/brief-LocalFix-2026-09-18/brief.md` (identiske). `updated` er satt til 2026-10-29. Ukommittert.
- **Hva gjør dette annerledes:** la til at FiksGataMi også har kommentar og «bekreft» (én side, ikke prøvd), og at forskjellen er en én-trykks teller som sorterer lista, campuslokal og moderert.
- **Fallgruvesetningen:** attribuert til tidligere research (`addendum.md`). Ny research støtter bare «manglende tilbakemelding» og fant ingen data på duplikater og spam.
- **Moderator:** nytt «Åpent punkt»-avsnitt om at moderatorens identitet og eierskapet til belysning og stier rundt campus er uavklart.
- **Personvern:** la til at beskrivelsesteksten sendes til ekstern KI-leverandør, at Gemini gratisnivå ikke brukes med ekte data, og at mock-modus ikke sender noe ut (henviser til PRD §8).

### Åpne punkter
- PRD er ikke oppdatert med researchen (differensiering i §1, moderatorrolle, «sist oppdatert» på detaljsiden). Arkitekturen er ikke sjekket mot endringene.
- Briefen har fortsatt tre avvik mot PRD som ikke ble tatt: statusflyten kan gå ett steg tilbake (FR-8), rapportøren kan ikke bekrefte egen rapport (FR-7), og KI-leverandør er ikke nevnt i «Teknisk retning».
