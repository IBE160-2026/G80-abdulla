---
topic: LocalFix - lokal problemrapportering for nærmiljø
updated: 2026-10-11T22:34
---

- (event) Bruker ga fullstendig initial brain dump: Problem, Løsning, Målgruppe, Kjernefunksjoner (MVP), Avgrensning, Suksesskriterier, og Teknisk retning for LocalFix (IBE160 Programmering med KI kursprosjekt).
- (event) Research: sammenlignbare produkter er stort sett borger-til-kommune (FixMyStreet, SeeClickFix, FiksGataMi, norske 'Meld feil'-portaler). LocalFix sitt naboskap-til-naboskap fokus (uten kommuneintegrasjon i v1) er en reell differensiator. Kjente fallgruver: rapport-utmattelse/status blir stående, duplikater/spam, 'roper i tomrommet' hvis ingen faktisk løser sakene.
- (decision by user) Bruker leverte fullstendig brief-tekst direkte (hurtigspor) - alle kjerneseksjoner dekket, ingen ASSUMPTION-tagger nødvendig
- (decision) communication_language og document_output_language endret til norsk, lagret som override i _bmad/custom/config.user.toml og _bmad/custom/config.toml
- (decision) Konkurrentresearch (FixMyStreet, SeeClickFix, FiksGataMi, Meld feil-portaler) og kjente fallgruver flyttet til addendum.md; differensieringsinnsikt oppsummert i brief under 'Hva gjor dette annerledes'
- (event) brief.md og addendum.md draft skrevet fra brukerens fullstendige tekst
- (decision) Structure/prose-review (bmad-review, lenses=structure,prose) kjort pa brief.md: 2 duplikat-avsnitt kondensert (Sammendrag avsnitt 2, Losningen), 1 komma-fix; addendum.md gjennomgatt ren, ingen funn
- (event) Brief finalisert: status satt til final
- (change by user) Fjernet Kontekst-linjen (IBE160/Hogskolen i Molde) fra toppen av brief.md pa brukers foresporsel, etter finalisering
- (event) Update startet: faglærers tilbakemelding (tilbakemelding-product-brief.md, 2026-10-06) som endringssignal; vurdert enkel og gjennomførbar, tre hovedendringer: roller, testbart KI-kriterium, kjørbar for sensor
- (decision) (by user) Innlogging kreves for å rapportere og bekrefte; én bekreftelse per bruker; egen moderatorrolle endrer status
- (decision) (by user) Lokalmiljø: campus Høgskolen i Molde, studenter og ansatte som typiske brukere
- (decision) (by user) Utvidelse i v1: filtrering (kategori, status) og sortering (bekreftelser, dato); duplikatsjekk ikke valgt for v1
- (decision) (by user) Kjørbar for sensor: lokal Supabase med seed-data + KI-mock-modus uten nøkkel, manuelt kategorivalg som fallback
- (assumption) Faste kategorier: Søppel, Belysning, Vei og fortau, Skadeverk, Annet; KI-testsett 20 beskrivelser med fasit, mål minst 16/20
- (assumption) Personvern: brukere bes unngå ansikter/bilskilt; moderator kan skjule rapporter; bildestørrelse begrenset
- (change) addendum.md kopieres inn i repoet G80-abdulla så briefens henvisning virker; duplikatsjekk parkert i addendum
- (event) Brief oppdatert etter tilbakemelding (roller, campus-persona, testbare kriterier, personvern, kjørbarhet, visjon); addendum utvidet med parkert duplikatsjekk og KI-testsett; kopiert til G80-abdulla og committet
- (change) Bilde gjort valgfritt i Omfang og Suksesskriterier, for å samsvare med PRD-beslutning 2026-10-11
