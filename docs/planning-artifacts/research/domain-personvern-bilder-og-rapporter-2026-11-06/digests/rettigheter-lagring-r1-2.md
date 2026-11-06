# Digest: rettigheter og lagring (D2), runde 1, assistent 2

Tilgangsdato for alle kilder: 2026-11-06. Budsjettet ble brukt opp: 15 kall og 8 kilder, hvorav én PDF var uleselig.

## Funn

### 1. Retten til sletting (art. 17) og lagringsbegrensning (art. 5(1)(e))
- Opplysninger skal ikke lagres lenger enn nødvendig og skal slettes når formålet er oppnådd. Det er vanskelig å forsvare å beholde alt for alltid. Kilde: https://www.datatilsynet.no/rettigheter-og-plikter/den-registrertes-rettigheter/rett-til-sletting/ | Datatilsynet | 2026-01 | high | guidance
- Den behandlingsansvarlige «bør innføre tidsfrister for sletting eller periodisk gjennomgang». Opplysningene skal slettes eller anonymiseres når de ikke lenger trengs. Kilde: https://www.datatilsynet.no/rettigheter-og-plikter/personvernprinsippene/grunnleggende-personvernprinsipper/lagringsbegrensning/ | Datatilsynet | 2019-07 | high | guidance
- Retten til sletting gjelder blant annet når formålet er oppnådd, når samtykke trekkes tilbake, når en protest får gjennomslag, når behandlingen er ulovlig og når det finnes en lovpålagt sletteplikt. Kilde: rett-til-sletting | high
- Unntak: ytrings- og informasjonsfrihet, arkiv, forskning og statistikk, folkehelse og rettskrav. Arkivunntaket gjelder bare hvis sletting vil hindre formålet «i alvorlig grad», og virksomheten må dokumentere det. Kilde: rett-til-sletting | high
- «Allmenn interesse» er ikke nevnt som eget unntak på siden. Unntaket i art. 17(3)(b) er ikke bekreftet. Kilde: rett-til-sletting | medium
- Fristen for å svare er senest én måned, og mottakere skal varsles. Kilde: rett-til-sletting | high
- Overtredelsesgebyr på 1 000 000 kr til Statens pensjonskasse for brudd på lagringsbegrensning. Bare sett i søkeresultat, og årstallet er usikkert. Kilde: https://www.datatilsynet.no/contentassets/cafec165542143da94fb0a7d119001ef/~-20_01893-12-vedtak-om-overtredelsesgebyr--245646_15_1.pdf | Datatilsynet | ukjent | low | enforcement
- Data i digitale tjenester skal slettes «så raskt som mulig, og normalt innen én måned». Bare sett i søkeresultat. Kilde: https://www.datatilsynet.no/personvern-pa-ulike-omrader/kundehandtering-handel-og-medlemskap/digitale-tjenester-og-forbrukeres-personopplysninger/avslutning-av-kundeforholdet/ | Datatilsynet | ukjent | low | guidance
- At sletting i sikkerhetskopier kan vente til neste ordinære rotasjon, er ubekreftet, uten primærkilde. | low

### 2. Innsyn og dataportabilitet (art. 15 og 20)
- Dataportabilitet gjelder bare når grunnlaget er samtykke eller avtale. Kilde: https://www.datatilsynet.no/rettigheter-og-plikter/den-registrertes-rettigheter/rett-til-dataportabilitet/ | Datatilsynet | 2025-03 | high | guidance
- Portabiliteten omfatter opplysninger brukeren har gitt og opplysninger som samles inn ved bruk. For appen er det tekst, lokasjon og bilde, men ikke analyser virksomheten har laget. Kilde: samme | high
- Opplysningene leveres i et maskinlesbart og vanlig brukt format, gratis og innen én måned, etter at identiteten er fastslått. Kilde: samme | high
- Hva innsynsretten etter art. 15 krever konkret, er ikke bekreftet. Kilde: samme | low

### 3. Innebygd personvern og dataminimering (art. 25 og 5(1)(c))
- EDPB Guidelines 4/2019 v2.0 om art. 25 ble vedtatt 2020-10-20. Innholdet er ikke lest, fordi PDF-en var uleselig. Kilde: https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-42019-article-25-data-protection-design-and_en | EDPB | 2020-10 | high (bare eksistens) | guidance
- **EXIF på iOS:** WebKit-bug 257534 viser at GPS ble fjernet ved `<input type="file">` fra iOS 16.4, mens enhet og tidspunkt ble beholdt. Fra iOS 17 velger brukeren selv om lokasjon deles. Kilden er fra 2023, altså eldre enn 18 måneder, og oppførselen varierer mellom kamera og bilderull. Kilde: https://bugs.webkit.org/show_bug.cgi?id=257534 | WebKit Bugzilla | 2023-05 | low | technical
- **EXIF på Android:** Dokumentasjonen for bildevelgeren sier ingenting om at lokasjon eller EXIF fjernes. Kilde: https://developer.android.com/training/data-storage/shared/photo-picker | Android Developers | ukjent | medium (som fravær av belegg) | technical
- Samlet: metadata fjernes ikke pålitelig av nettleser eller mobil. At serveren bør fjerne dem, er assistentens slutning. | low
- Sladding: ingen tilsynskilde sier om automatisk sladding forventes, eller om en påminnelse er nok.

### 4. Bilder av tredjeparter
- Etter åndsverkloven § 104 kan bilder av personer ikke vises offentlig uten samtykke, med unntak for aktuell og allmenn interesse. Kilde: https://www.datatilsynet.no/personvern-pa-ulike-omrader/internett-og-apper/bilder-pa-nett/ | Datatilsynet | 2025-09 | high | guidance
- Datatilsynet skiller mellom portretter og situasjonsbilder. Personopplysningsloven gjelder hvis personer kan gjenkjennes, og da anbefales en interesseavveiing. At rapportbilder ligner situasjonsbilder, er assistentens tolkning. Kilde: samme | medium
- Den som deler et bilde, må kunne bevise samtykke, og brudd kan være straffbart. Kilde: samme | high
- Den avbildede går først til den som delte bildet, så til nettstedet eller appen, og deretter til Slettmeg.no, Konfliktrådet eller Datatilsynet. Det forutsetter at tjenesten har en kontaktvei for fjerning. Kilde: samme | high
- Plattformens egne plikter og husholdningsunntaket er ikke avklart. Kilde: samme | medium

## Spor verdt å følge
- Lovteksten på lovdata.no eller eur-lex: art. 17(3)(b) og (d) og art. 89. Påstandene om lovverket har bare én kilde, Datatilsynet.
- EDPB Guidelines 4/2019 som tekst.
- EDPB Guidelines 01/2022 om innsynsrett, særlig art. 15(4) om tredjeparter.
- EDPB Guidelines 3/2019 om video (lagringstid og sladding), den nærmeste analogien.
- Vedtakene mot Statens pensjonskasse og Timegrip AS (2025).
- DSA art. 16 om melde- og fjerningsmekanisme.
- Nyere EXIF-dokumentasjon: WebKit-bugs 263192 og 207088, Chromium og Android, eller en egen test.

## Lette etter, fant ikke
- En EXIF-kilde som er høyst 18 måneder gammel.
- En tilsynskilde om sladding eller påminnelse.
- Lovteksten for art. 15, 17, 20 og 25.
- En andre uavhengig kilde for lovpåstandene.
- Innholdet i Guidelines 4/2019.
- Vedtak om bilder i brukerinnhold, eller om å skjule i stedet for å slette.
