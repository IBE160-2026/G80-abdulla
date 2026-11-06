---
title: 'Domeneresearch: personvern for bilder og rapporter i LocalFix'
type: 'domain'
topic: 'Personvern for bilder og rapporter'
decision: 'Hvilke personvernkrav gjelder for bilder og rapporter i LocalFix, hva må gjøres i v1 (lokalt med testdata) og hva må være på plass før drift'
source: 'native run (nettsøk), 2 runder × 3 assistenter + 1 kontrollrunde'
status: complete
preset: 'standard'
validation: 'normal'
claims_verified: 6
claims_unverified: 12
created: '2026-11-06'
updated: '2026-11-06'
---

# Domeneresearch: personvern for bilder og rapporter

**Beslutningen researchen skal støtte:** Hvilke personvernkrav gjelder for bilder og rapporter i LocalFix, hva må gjøres i v1 (lokalt med testdata), og hva må være på plass før appen settes i drift for ekte brukere.

_Dette er research, ikke juridisk rådgivning. Hver påstand har en kilde `[n]`. Egne tolkninger er merket **Tolkning**. Når en påstand bare har én kilde, er den merket med «(én kilde)»._

## Sammendrag

**For v1:** Bruk bare oppdiktede testdata, også i bildene. Da behandler appen trolig ingen personopplysninger, og den trenger ikke meldes til Sikt [18][20]. Det eneste tekniske tiltaket som bør inn i v1, er at serveren fjerner EXIF-metadata fra opplastede bilder. Nettlesere gjør ikke dette pålitelig [41][42][43]. FixMyStreet gjør det av samme grunn [39], og art. 25(2) krever at bare nødvendige opplysninger behandles som standard [6].

**Før drift:** Det er tre ting som må endres eller avklares.

1. **«Ingenting slettes» (FR-9) holder ikke.** Opplysninger skal ikke lagres lenger enn nødvendig, og brukeren har rett til sletting [2][5][7]. Appen trenger lagringstid og en måte å slette eller anonymisere på. FixMyStreet anonymiserer rapporter når noen ber om sletting [38].
2. **Behandlingsansvar og grunnlag må avklares.** HiMolde blir trolig behandlingsansvarlig. Berettiget interesse (art. 6(1)(f)) kan ikke brukes av offentlige myndigheter i deres oppgaver [3], så grunnlaget blir enten allmenn interesse med støtte i lov eller samtykke [3][21]. Brukerne må få en personvernerklæring etter art. 13 [4].
3. **Valg av KI-leverandør er også et personvernvalg.** Gemini på gratisnivå kan ikke brukes når appen er åpen for brukere i EØS [25]. Cloudflare Workers AI trener ikke på data og lagrer ikke input [26], og har DPA og DPF [27][28]. Om DPA-en dekker gratisplanen, er ikke bekreftet.

**Største forbehold:** De fleste påstandene om leverandørvilkår har bare én kilde, nemlig leverandøren selv. Status for Data Privacy Framework i EU-domstolen kunne ikke sjekkes direkte [35]. Ingen kilde sier om en påminnelse til brukeren er nok, eller om ansikter og bilskilt må sladdes automatisk.

## 1. Personopplysninger, ansvar og grunnlag

**Hva er en personopplysning?** Etter art. 4 nr. 1 er en personopplysning enhver opplysning om en person som kan identifiseres «directly or indirectly» [1]. Et bilde av en person som kan gjenkjennes, er en personopplysning (Ryneš) [15]. Bilskilt er en personopplysning når det kan knyttes til en person. Datatilsynet skriver i Ferde-saken at «bilskilt er en personopplysning» [11][12]. EU-domstolen kom til samme resultat for VIN-nummer i Scania-saken [16]. **Tolkning:** Fritekst som nevner navn, adresser eller kjennetegn ved personer, går under samme definisjon. Ingen kilde sier dette direkte.

**Studentprosjekt og v1.** Alle studentoppgaver ved HiMolde som behandler personopplysninger, skal meldes til Sikt, og Sikt må ha vurdert dem før innsamlingen starter [17] (én kilde). Prosjekter som bare har anonyme opplysninger gjennom hele innsamlingen, trenger ikke meldes [18][20], og personvernreglene gjelder ikke anonyme opplysninger [1]. Fiktive navn på ekte personer er derimot pseudonymisering, og det regnes fortsatt som personopplysninger [46]. Bruker prosjektet personopplysninger på noe tidspunkt, må det meldes, også om dataene anonymiseres senere [19]. Unntaket for rent personlig bruk gjelder ikke når behandlingen dekker offentlig rom, «even partially» [15][24]. **Tolkning:** v1 med oppdiktede testdata, bilder uten personer og ingen ekte brukere faller utenfor reglene. Det endrer seg i det øyeblikket noen tester appen med ekte bilder eller ekte e-postadresser. HiMoldes KI-retningslinjer (2026) sier også at studenter ikke skal legge personopplysninger inn i åpne KI-verktøy [23].

**Ansvar ved drift.** Ingen kilde sier hvem som blir behandlingsansvarlig ved drift. **Tolkning:** Det blir HiMolde, fordi høgskolen da bestemmer formål og midler. HiMolde har personvernombud og egne adresser for henvendelser [22].

**Behandlingsgrunnlag.** «Point (f) … shall not apply to processing carried out by public authorities in the performance of their tasks» [3]. Bokstav e (allmenn interesse) krever et grunnlag i lov (art. 6(3)) [3]. UiB bruker bokstav e med universitets- og høyskoleloven som supplerende grunnlag for studentoppgaver [21]. Hvilket grunnlag høgskoler bruker for egne digitale tjenester, ble ikke funnet.

**Informasjonsplikt (art. 13).** Når opplysningene samles inn, skal brukerne få vite dette: hvem som er behandlingsansvarlig, kontaktopplysninger til personvernombudet, formål og grunnlag, mottakere (her KI-leverandøren og Supabase), overføring til tredjeland, lagringstid, rettighetene sine og retten til å klage til Datatilsynet [4].

**DPIA (vurdering av personvernkonsekvenser).** En DPIA kreves i de fleste tilfeller når to av ni kriterier er oppfylt [13]. Datatilsynets liste nevner blant annet systematisk monitorering av offentlig område i stor skala, og innovativ teknologi sammen med ett kriterium til [14]. **Tolkning:** En campusapp i drift kan treffe kriteriet om «innovativ bruk av teknologi» (KI) og kriteriet om «sårbare registrerte» (maktforholdet til høgskolen, og personer på bilder som ikke har valgt å være med). Da bør en DPIA vurderes. Systematisk monitorering og stor skala er neppe truffet. V1 treffer ingen av kriteriene.

## 2. Rettigheter, lagring og bilder

**Sletting og lagringstid.** Opplysninger skal ikke lagres i identifiserbar form «for no longer than is necessary» [2]. Den behandlingsansvarlige bør ha tidsfrister for sletting eller periodisk gjennomgang [8]. Retten til sletting gjelder blant annet når formålet er oppnådd eller når samtykket trekkes tilbake. En sletteforespørsel skal besvares innen én måned [7]. Unntakene er ytrings- og informasjonsfrihet, rettslig forpliktelse eller oppgave i allmennhetens interesse, arkiv, forskning og statistikk, og rettskrav [5][7]. Arkivunntaket gjelder bare hvis sletting hindrer formålet «i alvorlig grad» [7]. **Tolkning:** Dagens design, der en moderator bare kan skjule og ingenting slettes (FR-9, PRD §6.2), er greit så lenge v1 bare har testdata. Ved drift må det finnes lagringstid og en måte å slette på. Ingen av unntakene passer for en meldeapp på campus.

**Innsyn og dataportabilitet.** Retten til dataportabilitet gjelder bare når grunnlaget er samtykke eller avtale. Den omfatter det brukeren selv har gitt, her tekst, lokasjon og bilde, i et maskinlesbart format innen én måned [9]. Hva innsynsretten (art. 15) krever konkret, ble ikke undersøkt.

**Innebygd personvern og EXIF.** Etter art. 25(2) skal bare de opplysningene som er nødvendige for formålet, behandles som standard [6]. Dataminimering (art. 5(1)(c)) betyr at opplysningene skal være begrenset til det som trengs [2]. Nettlesere fjerner ikke EXIF pålitelig:
- På iOS fjernes GPS i noen tilfeller, avhengig av om bildet kommer fra kameraet eller biblioteket, og av formatet. Enhet og tidspunkt beholdes [41][42].
- Android sier ingenting om at metadata fjernes [43].

Kildene om iOS er fra 2020–2023, og hva nettleserne gjør i dag, er ikke bekreftet. FixMyStreet fjerner EXIF fordi metadata kan avsløre telefonmodell og identifisere anonyme innsendere [39].

**Bilder av andre personer.** Et fotografi av en person kan ikke vises offentlig uten samtykke etter åndsverkloven § 104, med unntak for blant annet aktuell og allmenn interesse [10]. Datatilsynet skiller mellom portretter og situasjonsbilder. Selv for situasjonsbilder gjelder personvernreglene hvis personer kan gjenkjennes [10]. Den som er avbildet, går først til den som delte bildet og deretter til tjenesten [10]. Det forutsetter at tjenesten har en kontaktvei for å få fjernet bilder. Ingen tilsynskilde sier om automatisk sladding av ansikter og bilskilt forventes, eller om en påminnelse er nok.

**DSA.** Forordningen om digitale tjenester er ikke innlemmet i EØS-avtalen ennå, og innføringen i Norge er forsinket [44][45]. Kravet om en meldeordning for ulovlig innhold (art. 16) gjelder derfor ikke nå.

## 3. Tredjeparter og praksis

**KI-leverandører på gratisnivå** (fritekstbeskrivelsen sendes ut, jf. PRD §8):

| Leverandør | Trening på input | Lagring | DPA og overføring | Merknad |
|---|---|---|---|---|
| Gemini API | Ja på gratisnivå, og mennesker kan lese input [25] | Ikke oppgitt for gratisnivå [25] | Bare betalt nivå er tillatt for brukere i EØS [25] | Kan ikke brukes i drift uten betaling (én kilde, primær) |
| Cloudflare Workers AI | Nei [26] | Lagres ikke etter forespørselen, med unntak for loggfunksjoner [26] | DPA v6.4 med SCC og DPF [27][28] | Om DPA-en dekker gratisplanen, er uklart [27] |
| Mistral | Ja på gratisnivå, med mulighet for reservasjon [32][48] | Ikke oppgitt. ZDR finnes bare på betalt nivå [34] | DPA finnes. Lagringssted ikke oppgitt [33] | Slå av «Anonymous improvement data» hvis Mistral velges [48] |
| Groq | Ikke oppgitt [30][31] | Logges i opptil 30 dager ved misbruk. Data ligger i USA [30] | DPA finnes. Groq er ikke selv DPF-sertifisert [31] | Ingen DPF-oppføring funnet |

**Overføring til USA.** Cloudflare og Google er aktive i Data Privacy Framework [28][29]. Tribunalet avviste i 2025 et søksmål mot DPF, og avgjørelsen er anket til EU-domstolen (C-703/25 P) [35]. Ingen dom er funnet per november 2026, men det kunne ikke kontrolleres direkte på curia.

**Supabase.** Velg en bestemt region i EU, for eksempel Frankfurt eller Stockholm, ikke den generelle «Europe», som kan havne i London eller Zürich [36]. Konto- og fakturadata, telemetri og logger kan behandles utenfor regionen [37]. **Tolkning:** Når Supabase kjøres lokalt, slik det gjør i v1, ligger det ingen data hos Supabase.

**Praksis hos lignende tjenester.**
- **FixMyStreet** sletter ikke rapporter, men anonymiserer dem når noen ber om sletting. Persondata slettes etter to år uten aktivitet [38]. Bildene får EXIF fjernet [39].
- **Fiks Gata** har ingen personvernerklæring og oppgir ikke hvem som er behandlingsansvarlig. Vilkårene sier at meldinger, med bilder, kan bli offentlige [40]. Den er et eksempel på hva LocalFix ikke bør gjøre.

## Det kombinasjonen av funnene viser

- **Valget av oppdiktede testdata i v1 er det som gjør v1 nesten fri for personvernplikter.** Det gjelder bare så lenge alle data er oppdiktet, også bildene, og ingen kjører appen med ekte rapporter og en ekte KI-nøkkel. Grunnene er tre: Anonyme data trenger ikke meldes til Sikt [18], gratisnivåene hos Gemini og Mistral trener på input [25][32], og HiMolde forbyr personopplysninger i åpne KI-verktøy [23]. Til sammen gjør dette mock-modus (NFR-2) og fiktive bilder til et personvernkrav, ikke bare et praktisk valg.
- **FR-9 er den designbeslutningen som kolliderer mest med regelverket ved drift.** Samtidig trenger historikken og telleren «har sett dette» rapportene. FixMyStreets løsning er å anonymisere i stedet for å slette [38]. Det fjerner personopplysningen og beholder saken. Det passer arkitekturen, der fremmednøklene er `ON DELETE RESTRICT`, bedre enn ekte sletting.
- **SM-5 avgjør i dag valget av KI-leverandør ut fra kvalitet.** Funnene i del 3 viser at personvern skiller leverandørene minst like mye. Gemini faller ut ved drift [25], og Cloudflare er den eneste som verken trener på data eller lagrer dem på gratisnivå [26].

## Motargumenter

Det ble ikke kjørt en egen runde der en assistent prøver å motbevise konklusjonene, siden den er slått av i oppsettet. Det sterkeste motargumentet som kom fram underveis: Når en påminnelse og moderatorens skjuling (FR-3, FR-9) kombineres, kan det være nok for bilder, og sladding er ikke påkrevd. Ingen kilde sa noe om dette, verken for eller mot.

## Anbefalinger

**For v1 (nå):**
1. **Hold v1 fri for personopplysninger.** Seed-bildene skal ikke vise ansikter eller lesbare bilskilt, og testbrukerne skal ha oppdiktede e-postadresser. Skriv det i README og PRD §8. Det gir grunnlaget for at ingen melding til Sikt trengs [17][18]. *Gjelder: PRD §8 og README. Konfidens: middels, se åpent spørsmål 1.*
2. **La serveren fjerne EXIF fra alle opplastede bilder** før lagring, og test det med et testbilde som har GPS-data. *Gjelder: AD-9 i arkitekturen (ny regel, før i beslutningsloggen), akseptansekriterium i storyen for bildeopplasting. Konfidens: middels. Prinsippet er sikkert [6], men oppførselen i dagens nettlesere er ikke bekreftet.*
3. **Ta personvern med i valget av KI-leverandør (SM-5).** Ta Gemini ut av listen over kandidater for drift [25]. Velges Mistral, slå av trening [48]. Mock-modus forblir standard. *Gjelder: PRD §11 og arkitekturens KI-AD. Konfidens: middels (leverandørenes egne vilkår, én kilde hver).*
4. **Behold påminnelsen før opplasting** (FR-3) for både bilde og beskrivelse, slik PRD §8 sier. *Konfidens: lav for om den er nok, fordi ingen kilde sier noe om det.*

**Før drift (legg i Deferred-tabellen i arkitekturen og i PRD §6.2):**

5. **Avklar med HiMoldes personvernombud** hvem som er behandlingsansvarlig og hvilket grunnlag som skal brukes (e eller samtykke, ikke f) [3][22]. Vurder også DPIA [13].
6. **Lag en personvernerklæring** med alle punktene i art. 13 [4], og en kontaktvei for å få fjernet bilder [10].
7. **Erstatt «ingenting slettes» med lagringstid og anonymisering på forespørsel** [2][5][7][38]. Moderator trenger en måte å fjerne et bilde helt. Det krever en sti for sletting i Storage, som AD-9 i dag forbyr.
8. **Velg en EU-region i Supabase og inngå DPA** med Supabase og KI-leverandøren [27][36][37]. Sjekk at leverandørens DPA dekker planen som brukes.
9. **Sjekk status for DSA og DPF på nytt** før drift [35][44].

## Åpne spørsmål

1. **Godtar HiMolde at v1 med oppdiktede data ikke meldes?** HiMoldes side nevner ikke fiktive data [17]. Svaret får du ved å spørre faglærer eller personvernombudet (personvernombud@himolde.no) [22].
2. **Dekker Cloudflare-DPA-en gratisplanen og Workers AI?** Svaret får du ved å lese Cloudflares Self-Serve Subscription Agreement.
3. **Hva er status for C-703/25 P?** Svaret får du ved å slå opp saken manuelt på curia.europa.eu.
4. **Fjerner nettleserne EXIF i dag?** Svaret får du ved å teste selv med iOS og Android, eller ved å følge rådet om å alltid fjerne det på serveren.
5. **Hva sier EDPB Guidelines 4/2019 (art. 25) og 3/2019 (video, sladding)?** PDF-ene var uleselige, så dette krever manuell lesing.
6. **Hvilket grunnlag bruker HiMolde for egne digitale tjenester?** Svaret står trolig i HiMoldes personvernerklæring for studenter, som ikke er lest.
7. **Hva sier Groqs DPA, og hvor behandler Mistral data?** Begge krever manuell lesing.

## Kilder

Alle kilder er lest 2026-11-06.

| # | Påstand eller funn | Utgiver | Publisert | Konfidens |
|---|---|---|---|---|
| [1] | Art. 4 nr. 1: definisjonen av personopplysning | [Intersoft Consulting (GDPR-tekst)](https://gdpr-info.eu/art-4-gdpr/) | 2016-04 | high |
| [2] | Art. 5(1)(c) og (e): dataminimering og lagringsbegrensning | [Intersoft Consulting](https://gdpr-info.eu/art-5-gdpr/) | 2016-04 | high |
| [3] | Art. 6(1)(e) og (f) og 6(3) | [Intersoft Consulting](https://gdpr-info.eu/art-6-gdpr/) | 2016-04 | medium (én kilde) |
| [4] | Art. 13(1) og (2): informasjonsplikten | [Intersoft Consulting](https://gdpr-info.eu/art-13-gdpr/) | 2016-04 | medium (én kilde) |
| [5] | Art. 17(3): unntak fra retten til sletting | [Intersoft Consulting](https://gdpr-info.eu/art-17-gdpr/) | 2016-04 | high |
| [6] | Art. 25(2): personvern som standard | [Intersoft Consulting](https://gdpr-info.eu/art-25-gdpr/) | 2016-04 | high |
| [7] | Rett til sletting: vilkår, unntak og frist på én måned | [Datatilsynet](https://www.datatilsynet.no/rettigheter-og-plikter/den-registrertes-rettigheter/rett-til-sletting/) | 2026-01 | high |
| [8] | Lagringsbegrensning: tidsfrister for sletting | [Datatilsynet](https://www.datatilsynet.no/rettigheter-og-plikter/personvernprinsippene/grunnleggende-personvernprinsipper/lagringsbegrensning/) | 2019-07 | high |
| [9] | Dataportabilitet: vilkår og omfang | [Datatilsynet](https://www.datatilsynet.no/rettigheter-og-plikter/den-registrertes-rettigheter/rett-til-dataportabilitet/) | 2025-03 | medium |
| [10] | Bilder på nett: åndsverkloven § 104, situasjonsbilder og fjerning | [Datatilsynet](https://www.datatilsynet.no/personvern-pa-ulike-omrader/internett-og-apper/bilder-pa-nett/) | 2025-09 | medium |
| [11] | Registreringsnummer kan være en personopplysning | [Datatilsynet](https://www.datatilsynet.no/rettigheter-og-plikter/personopplysninger/) | ukjent | high |
| [12] | Ferde: «bilskilt er en personopplysning» | [Datatilsynet](https://www.datatilsynet.no/aktuelt/aktuelle-nyheter-2021/varsel-om-overtredelsesgebyr-til-ferde-as/) | 2021 | high |
| [13] | De ni DPIA-kriteriene og to-kriterieregelen | [Datatilsynet](https://www.datatilsynet.no/rettigheter-og-plikter/virksomhetenes-plikter/vurdering-av-personvernkonsekvenser/nar-er-risiko-hoy/) | 2023-07 | medium (én kilde) |
| [14] | Listen over behandlinger som alltid krever DPIA | [Datatilsynet](https://www.datatilsynet.no/rettigheter-og-plikter/virksomhetenes-plikter/vurdering-av-personvernkonsekvenser/nar-ma-man-gjennomfore-en-vurdering-av-personvernkonsekvenser/) | 2023-07 | medium |
| [15] | Ryneš (C-212/13): kamerabilde av en identifiserbar person | [EU Law Radar](https://eulawradar.com/case-c-21213-rynes-data-from-private-cctv-cameras-overlooking-public-spaces-and-private-homes/) | 2014-12 | medium |
| [16] | Scania (C-319/22): VIN og identifiserbarhet | [Matheson](https://www.matheson.com/insights/detail/cjeu-considers-whether-vehicle-identification-numbers-constitute-personal-data) | 2023-11 | high |
| [17] | HiMolde: studentoppgaver med personopplysninger meldes til Sikt | [Høgskolen i Molde](https://www.himolde.no/om/regelverk/personvern/personvern-studentoppgaver.html) | 2024-11 | medium (én kilde) |
| [18] | Sikt: anonyme prosjekter trenger ikke meldes, og pseudonymiserte data er personopplysninger | [Sikt](https://sikt.no/tjenester/personverntjenester-forskning/personvernhandbok-forskning/gjennomfore-et-prosjekt-uten-behandle-personopplysninger) | ukjent | high |
| [19] | Sikt FAQ: meldeplikt selv om data anonymiseres senere | [Sikt](https://sikt.no/tjenester/personverntjenester-forskning/fylle-ut-meldeskjema-personopplysninger/vanlige-sporsmal-om-personvern-og-meldeskjema) | ukjent | medium |
| [20] | UiA: anonyme data som standard, uten melding | [Universitetet i Agder](https://www.uia.no/om-uia/regelverk-og-retningslinjer/personvern/retningslinjer-personopplysninger-studentprosjekter.html) | 2024-05 | high |
| [21] | UiB: art. 6(1)(e) med universitets- og høyskoleloven | [Universitetet i Bergen](https://www4.uib.no/forskning/forskningsetikk/saerlig-om-studentoppgaver) | ukjent | medium |
| [22] | HiMoldes personvernombud og kontaktadresser | [Høgskolen i Molde](https://www.himolde.no/om/regelverk/personvern/) | ukjent | medium |
| [23] | HiMoldes KI-retningslinjer: ikke personopplysninger i åpne KI-verktøy | [Høgskolen i Molde](https://www.himolde.no/om/aktuelt/aktuelle-saker/2026/nye-retningslinjer-for-ki-for-studenter.html) | 2026 | low (ikke lest) |
| [24] | Unntaket for personlig bruk gjelder ikke offentlig rom | [Data Protection Commission (IE)](https://www.dataprotection.ie/sites/default/files/uploads/2026-05/Domestic_CCTV_A5_ENG_Final.pdf) | 2026-05 | medium |
| [25] | Gemini: trening på gratisnivå, og bare betalt nivå i EØS | [Google](https://aistudio.google.com/docs/terms) | 2026-03 | medium (én kilde, primær) |
| [26] | Workers AI: ingen trening og ingen lagring | [Cloudflare](https://developers.cloudflare.com/workers-ai/platform/privacy/) | 2026-10 | medium (én kilde, primær) |
| [27] | Cloudflare-DPA v6.4: SCC, DPF og uklart omfang | [Cloudflare](https://www.cloudflare.com/cloudflare-customer-dpa/) | 2026-04 | medium |
| [28] | Cloudflare er aktiv i DPF | [U.S. Department of Commerce](https://www.dataprivacyframework.gov/participant/5666) | ukjent | high |
| [29] | Google LLC er aktiv i DPF | [U.S. Department of Commerce](https://www.dataprivacyframework.gov/participant/5780) | ukjent | medium |
| [30] | Groq: logging i opptil 30 dager og lagring i USA | [Groq](https://console.groq.com/docs/your-data) | ukjent | medium |
| [31] | Groq: DPA finnes, og Groq er ikke selv DPF-sertifisert | [Groq](https://groq.com/privacy-policy) | 2025-11 | medium |
| [32] | Mistral: trening på gratisnivå med mulighet for reservasjon | [Mistral AI](https://help.mistral.ai/en/articles/347617-do-you-use-my-user-data-to-train-your-artificial-intelligence-models) | 2026-10 | medium |
| [33] | Mistral-DPA-en oppgir ikke lagringssted | [Mistral AI](https://legal.mistral.ai/terms/data-processing-addendum) | 2026-07 | medium |
| [34] | Mistral: ZDR bare på betalt nivå | [Mistral AI](https://docs.mistral.ai/admin/monitor-comply/zero-data-retention) | ukjent | medium |
| [35] | DPF: Latombe anket til EU-domstolen (C-703/25 P) | [WilmerHale](https://www.wilmerhale.com/en/insights/blogs/wilmerhale-privacy-and-cybersecurity-law/20251201-european-court-of-justice-to-review-challenge-to-eu-us-data-privacy-framework) | 2025-12 | medium |
| [36] | Supabase-regioner, og at «Europe» kan havne utenfor EU | [Supabase](https://supabase.com/regions) | ukjent | medium |
| [37] | Supabase: DPA, og data som behandles utenfor regionen | [Supabase](https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq) | ukjent | medium |
| [38] | FixMyStreet: anonymisering i stedet for sletting, og lagring i to år | [mySociety](https://www.fixmystreet.com/privacy) | ukjent | medium |
| [39] | FixMyStreet fjerner EXIF | [mySociety (GitHub)](https://github.com/mysociety/fixmystreet/issues/2134) | ukjent | medium |
| [40] | Fiks Gata: ingen personvernerklæring, og meldinger kan bli offentlige | [FiksGata.no](https://www.fiksgatami.no/content/terms) | 2025-03 | medium |
| [41] | iOS: GPS fjernes ved opplasting fra kameraet (REOPENED) | [WebKit Bugzilla](https://bugs.webkit.org/show_bug.cgi?id=263192) | 2023-10 | low |
| [42] | iOS 16.4: GPS fjernes, andre EXIF-felt beholdes | [WebKit Bugzilla](https://bugs.webkit.org/show_bug.cgi?id=257534) | 2023-05 | low |
| [43] | Androids bildevelger sier ingenting om fjerning av metadata | [Android Developers](https://developer.android.com/training/data-storage/shared/photo-picker) | ukjent | low |
| [44] | DSA er ikke innlemmet i EØS-avtalen | [Stortinget](https://www.stortinget.no/no/Hva-skjer-pa-Stortinget/EU-EOS-informasjon/EU-EOS-nytt/2026/eueos-nytt---5.-juni-2026/dsa-utkast-til-retningslinjer-for-betrodde-varslere-pa-horing/) | 2026-06 | high |
| [45] | Innføringen av lov om digitale tjenester er forsinket | [Medietilsynet](https://www.medietilsynet.no/nyheter/aktuelt/innforinga-av-lova-om-digitale-tenester-er-forseinka/) | ukjent | high |
| [46] | Sikt: fiktive navn på ekte personer er pseudonymisering | [Sikt](https://sikt.no/personvernordbok) | ukjent | medium |
| [48] | Mistral: slik slår du av trening på API-kall | [Mistral AI](https://help.mistral.ai/en/articles/455207-can-i-opt-out-of-my-input-or-output-data-being-used-for-training) | ukjent | medium |

## Når påstandene bør sjekkes på nytt

Tidspunktene for ny sjekk er beregnet med `recon_kit.py staleness`. Påstander om lovverk og leverandørenes vilkår ble bekreftet som gjeldende 2026-11-06, så de regnes fra den datoen og skal sjekkes på nytt etter 6 måneder. Tekniske påstander og påstander om praksis regnes fra publiseringsdatoen og skal sjekkes etter 18 måneder.

| Påstand | Klasse | Sjekk på nytt |
|---|---|---|
| [41] EXIF i nettlesere | technical | **2025-04-01, allerede utdatert** |
| [40] Fiks Gata har ingen personvernerklæring | practice | **2026-09-01, allerede utdatert** |
| [25] Gemini: bare betalt nivå i EØS | vendor-policy | 2027-05-01 |
| [26][27] Cloudflare Workers AI og DPA | vendor-policy | 2027-05-01 |
| [31][32] Groq og Mistral | vendor-policy | 2027-05-01 |
| [35] DPF og C-703/25 P | regulatory | 2027-05-01 |
| [44] DSA i EØS | regulatory | 2027-05-01 |
| [17][18] Sikt og meldeplikt | regulatory | 2027-05-01 |
| [5][13] Sletting og DPIA | regulatory | 2027-05-01 |
| [38] FixMyStreet anonymiserer | practice | 2027-07-01 |

Den tidligste datoen for ny sjekk, 2025-04-01, er allerede passert. Påstanden om EXIF bygger på kilder fra 2023, så en egen test i dagens nettlesere er det første som bør gjøres. Det er åpent spørsmål 4. Avgjørelsen i C-703/25 P kan komme når som helst. Sjekk den før drift uansett dato.
