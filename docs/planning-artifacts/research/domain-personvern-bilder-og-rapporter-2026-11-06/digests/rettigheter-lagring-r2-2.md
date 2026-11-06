# Digest: rettigheter og lagring (D2), runde 2, assistent 2

Tilgangsdato for alle kilder: 2026-11-06. Budsjettet ble brukt opp (15 kall). Eur-lex ga tomme sider, og PDF-ene fra Lovdata, Eur-lex og EDPB var uleselige. Påstander som bare bygger på treningsdata, er utelatt.

## Funn

### 1. Lovteksten (art. 5, 17 og 25)
- Personopplysningsloven (LOV-2018-06-15-38) gjelder, i kraft fra 2018-07-20. Siste endring er LOV-2021-06-18-124. Kilde: https://lovdata.no/dokument/NL/lov/2018-06-15-38 | Lovdata | 2026-11 («Kort om loven» datert 04.11.2026) | high | regulatory
- Lovdata viser bare overskriftene til art. 5, 17 og 25. Kilde: samme | high
- Ordlyden i art. 5(1)(c) og (e), 17(1), 17(3)(b) og (d) og 25 ble IKKE hentet. Datatilsynets oppsummering fra runde 1 er verken bekreftet eller avkreftet. Kilde: https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng | EU | – | low | regulatory

### 2. EDPB 3/2019 og 4/2019
- Guidelines 3/2019 om video kom i endelig versjon 2020-01-30. Kilde: https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-32019-processing-personal-data-through-video_en | EDPB | 2020-01 | high | guidance
- Guidelines 4/2019 om art. 25 kom i endelig versjon v2.0 2020-10-20. Kilde: https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-42019-article-25-data-protection-design-and_en | EDPB | 2020-10 | high | guidance
- Hva retningslinjene sier om sladding, lagringstid og standardinnstillinger, ble ikke hentet.

### 3. EXIF ved `<input type="file">`
- WebKit-bug 263192 (2023-10, REOPENED): GPS fjernes alltid ved opplasting rett fra kameraet, og WebKit på iOS konverterer bildet til JPEG. Feilen ligger i et rammeverk under WebKit. Kilde: https://bugs.webkit.org/show_bug.cgi?id=263192 | WebKit Bugzilla | 2023-10 | medium | technical
- WebKit-bug 207088 (2020-02, iOS 13): EXIF ble fjernet ved opplasting fra biblioteket. Lukket som «configuration changed». Kilde: https://bugs.webkit.org/show_bug.cgi?id=207088 | WebKit Bugzilla | 2020-02 | medium | technical
- Ingen kilde er 18 måneder gammel eller nyere. Oppførselen varierer med kamera eller bibliotek og med HEIC eller JPEG. Hva iOS 18 og 26, Android og Chrome gjør i dag, er ikke bekreftet. | low

### 4. DSA
- Per 2026-06-05 er DSA «foreløpig ikke innlemmet i EØS-avtalen» på grunn av uenighet om håndhevingssystemet. Kilde: https://www.stortinget.no/no/Hva-skjer-pa-Stortinget/EU-EOS-informasjon/EU-EOS-nytt/2026/eueos-nytt---5.-juni-2026/dsa-utkast-til-retningslinjer-for-betrodde-varslere-pa-horing/ | Stortinget | 2026-06 | medium (søkeutdrag) | regulatory
- Medietilsynet skriver at innføringen av lov om digitale tjenester er forsinket fordi forhandlingene om EØS-tilpasning tar lengre tid enn ventet. Kilde: https://www.medietilsynet.no/nyheter/aktuelt/innforinga-av-lova-om-digitale-tenester-er-forseinka/ | Medietilsynet | ukjent | medium | regulatory
- Nkom er DSA-koordinator. Tjenestene deles inn i mere conduit, caching, hosting, plattformer og søkemotorer. Nkoms forventning om ikrafttredelse i 2026 er utdatert. Kilde: https://nkom.no/internett/internettbaserte-plattformer/digital-services-act-dsa | Nkom | ukjent | medium | guidance
- Ordlyden i art. 16 og unntaket for små virksomheter er ikke hentet. At DSA ikke er bindende i Norge per november 2026, er en slutning. | low

## Spor verdt å følge
- Høringsnotatet om DSA: https://www.regjeringen.no/contentassets/2edaa49e37ea4ed5831ab8da2a935d95/horingsnotat-dsa.pdf
- Nkom, «Hva er DSA?», og årsrapporten «Internett i Norge 2026».
- GDPR-teksten via en HTML-kilde.
- Sammendraget av EDPB 4/2019.
- Datatilsynets side om kameraovervåking, om lagringstid og sladding.

## Lette etter, fant ikke
- Ordlyden i art. 5, 17 og 25.
- Innholdet i EDPB 3/2019 og 4/2019.
- EXIF-kilder fra 2025–2026.
- Ordlyden i DSA art. 16 og unntaket for små virksomheter.
