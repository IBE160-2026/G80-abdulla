---
topic: LocalFix UX
updated: 2026-11-06T11:31
---

- (event) Create startet; kilder: product-brief.md og prd.md (2026-10-11). Faglærer ba om skisser av registreringsskjema, liste og detaljside; mobile-first; designkriteriet teller 10 %
- (decision) (by user) Stemning: rolig og saklig
- (decision) (by user) UI-system: shadcn/ui + Tailwind på Next.js; DESIGN.md beskriver kun merkevarelaget
- (decision) (by user) Kun lys modus i v1
- (event) Fargetemaer rendret: .working/color-themes-1.html (Fjordblå, Skifer og havgrønn, Mose, Blekk og signal)
- (decision) (by user) Fargetema: 1 Fjordblå (primary #1F4E79, bg #F5F7FA, statusfarger Ny blå / Under behandling gul / Løst grønn)
- (decision) (by user) Registreringsskjema: én side, beskrivelse først, KI-forslag under, deretter lokasjon og bilde
- (decision) (by user) Navigasjon: topplinje + flytende +-knapp; lista er forsiden
- (decision) (by user) KI-kategori forhåndsvelges med merkelapp 'Foreslått av KI', kan endres
- (event) Spines skrevet (fast path); mockups liste/registrer/detalj rendret i mockups/; fargetemaer kopiert til mockups/fargetemaer.html
- (event) Update startet 2026-11-06: tilpasse EXPERIENCE.md til PRD (2026-11-04) og arkitekturspinen (2026-10-29). Avvikene er hentet fra .logs/ali-yousef-abdulla/issues.md
- (decision) (by user) Beskrivelse: ikke tom og maks 1000 tegn, samme regel som PRD FR-3 og AD-4. Minstegrensen på 10 tegn er fjernet. Lokasjon maks 200, oppsummering maks 300 (lib/limits.ts)
- (decision) (by user) «Mine rapporter» er første brikke i filterraden, bare for innloggede, kan kombineres med kategori og status. URL: ?mine=true (arkitekturen må ta inn parameteren)
- (decision) (by user) «Sist oppdatert» på detaljsiden vises som dato og klokkeslett i Europe/Oslo, f.eks. «Sist oppdatert 4. november kl. 14:20» (status_changed_at, FR-8)
- (decision) (by user) Påminnelse ved beskrivelsesfeltet: «Ikke skriv navn eller andre personopplysninger. Teksten sendes til en KI-tjeneste for å foreslå kategori.» (FR-3, PRD §8)
- (change) Tilpasset PRD og arkitektur: «Send inn» krever kategori (FR-3); filter-URL bruker category/status/sort med enum-koder (konvensjonen i arkitekturen); telleren viser bekreftelser + 1, så en ny rapport viser «1 har sett dette» (PRD §3); skjult rapport gir 404 også for rapportøren (FR-9); NFR-8-kontroll i Accessibility Floor; Flow 3 får klimaks fra UJ-3
- (decision) (by user) Skissene liste.html, registrer.html og detalj.html oppdateres så de stemmer med EXPERIENCE.md
- (event) EXPERIENCE.md og skissene liste/registrer/detalj oppdatert og kopiert til docs/ux/; status står som final
- (change) 2026-11-06 «Vis flere» fjernet fra Interaction Primitives: lista viser alle synlige rapporter i v1, som i arkitekturen (NFR-6)
