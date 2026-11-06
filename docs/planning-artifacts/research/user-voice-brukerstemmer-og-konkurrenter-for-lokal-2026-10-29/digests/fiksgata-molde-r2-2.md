# Digest: Fiks Gata og Molde kommune, runde 2, assistent B

Format: påstand | kilde | utgiver | pub_date | accessed 2026-10-29 | confidence | klasse | lest-metode
Assistentens metodeforbehold: WebFetch gir bare oppsummeringer fra en liten modell, ikke rå sidetekst. Alt er «fetch-summary», ikke ordrett lest. 17 kall brukt, bare ca. 5 kilder lest.

## Fiks Gata

1. Innlogget bruker kan kommentere meldinger: legge til informasjon, stille spørsmål eller **bekrefte at de har sett problemet**. Det finnes også en «Marker som løst»-knapp (valgfri kommentar). | https://fiksgatami.no/content/steps | FiksGataMi (NUUG-drevet frivillig tjeneste) | ukjent | med-high | feature | fetch-summary
   - Viktigste funn: «bekreft» finnes som fritekstkommentar, ikke som egen «meg også»-knapp. Single-source; vilkårene nevner ikke kommentarer.
2. Man kan sende melding uten å logge inn, men trenger konto for å kommentere. (Vilkårene sier meldinger ikke er anonyme, se 5.) | /content/steps | med | feature | fetch-summary
3. Ansvarlig etat kan oppdatere sakens status. Brukere kan markere en sak som løst, og systemet oppdaterer så statusen. Uklart hvordan etatene faktisk oppdaterer (sannsynligvis e-post); brukerstyrt «løst» ser ut til å være den praktiske mekanismen. Ikke verifisert. | /content/steps | med | status-flow | fetch-summary
4. Meldinger rutes automatisk til ansvarlig kommune, fylkeskommune eller etat (bl.a. Statens vegvesen). Ruting bruker data fra Vegvesenet, Kartverket og Meteorologisk institutt. | /content/steps, /content/about, /content/terms | high | feature | fetch-summary
5. Meldinger kan bli offentlig tilgjengelige (e-post vises ikke). Rapportdata deles under CC-BY-SA-4.0. Innlogging via Google eller GitHub, e-post lagres for å knytte meldinger til konto og sende saksoppdateringer. Meldinger er ikke anonyme. Tjenesten er mellomledd og garanterer ikke at myndighetene løser eller handler. Vilkårene sier ingenting om finansiering eller moderasjon. Kontakt: Gmail-adresse. | /content/terms | med | governance | fetch-summary
6. fiksgata.no gir 308-redirect til www.fiksgatami.no. «Fiks Gata» og «FiksGataMi» er derfor samme domene/tjeneste. | https://fiksgata.no | high | governance | direkte (redirect-header)
7. Forsiden: «Gjør bygda og byen din bedre - en melding om gangen!» Bygget av frivillige som «digital dugnad». Nytt: oljesøl på vei og problemer i parker/naturområder. Lenker til /sendcase, /map, /kommune/, vilkår, om prosjektet, blogg, Signal-gruppe. Ingen operatør, finansiering eller kommuneliste vist. | https://www.fiksgatami.no/ | med | feature/governance | fetch-summary
8. Om-siden: første versjon 2011 og brukt av «mange titalls kommuner»; «den gamle løsningen ble avviklet i 2024». Kombinerer innbyggermeldinger med åpne data. | /content/about | low-med | trajectory | fetch-summary
   - Årsaken til avviklingen er ikke funnet. Ikke kontrollert om dagens tjeneste har samme kodebase som FixMyStreet.
9. /map har statusfilter (alle / uløste / løste), søk og «finn min posisjon». Viste «Viser 0 saker (uløste)», men kartet kan være JS-rendret, så 0 kan være lasteartefakt. | https://fiksgatami.no/map | low-med | feature/trajectory | fetch-summary
10. Historikk: FiksGataMi startet april 2011 som landsdekkende tjeneste, drevet av NUUG, i samarbeid med britiske FixMyStreet. Meldinger sendt som e-post til etaten valgt etter geografi og kategori. 2012: 61 kommuner lenket til tjenesten (14 % av 429). | tu.no, pere.pagekite.me | 2011-04 / 2012 | med | trajectory | snippet

## Molde kommune

11. «Meld ifra» (også «Meld feil») er bare en kontakt-/navigasjonsside uten eget skjema eller app-lenke: tlf 71 11 10 00 (man-fre 10-14), postmottak@molde.kommune.no, sikker digital post, oppmøte i rådhuset. Kart: Romsdalskart. Ingen kategorier, ansvarsfordeling eller statusfeedback i sammendraget («ikke funnet i sammendraget», ikke bevist fravær). | https://www.molde.kommune.no/meld-ifra/ | Molde kommune | ukjent | med | channel | fetch-summary
12. Ingen lenke til Fiks Gata, Norkart eller egen feilmeldingsapp funnet hos Molde kommune. | molde.kommune.no | low | channel | absence-of-evidence

## Data

13. Borgerundersøkelse Molde 2020: veier fikk score 57 (søkesnippet, PDF ulesbar). Ingen opplysning om veilys. Ikke svartidsdata. | molde.kommune.no PDF | 2020 | low | response-rate | snippet

## Mot runde 1

- Runde 1 sa (low-med, søkesammendrag) at «Fiks Gata» er en helt ny tjeneste etter nedleggelsen i 2024, med Digi-artikkel og initiativtaker. Runde 2 fant **ikke** Digi-artikkelen eller initiativtakeren, og fant ingen nedleggelsesårsak. Kun om-siden (fetch-sammendrag) sier at den gamle løsningen ble avviklet i 2024. Behandles som **omstridt/ubekreftet** inntil rå side leses i nettleser.
- Runde 1: «naboer kan bekrefte» ikke bekreftet hos noen. Runde 2: Fiks Gata har kommentar/«bekreft»-språk for innloggede (single-source). Den sterke formuleringen «ingen eksisterende verktøy lar naboer bekrefte» **kan ikke holdes**.

## Leads (manuelt i nettleser)

Les rå sider: /content/about, /content/steps, /kommune/, bloggen, en konkret sak (kommentartråd? hvem endrer status?). Opprett testmelding i Molde og se om «bekreft» virker. Reinholdtsens blogg og nuug.no for 2024. Molde kommune «Vei, transport og parkering», Romsdalskart meld-feil-lag, Mørenett, Statens vegvesen, Møre og Romsdal fylkeskommune for ansvar. Bergens veilyskart som kontrast.

## Ikke funnet

Digi-lanseringsartikkelen og initiativtakeren. Årsak til nedleggelsen 2024. Svartid/lukkingsrate (Fiks Gata, Molde). Finansiering/styring av dagens tjeneste. AI-kategorisering (absence-of-evidence). PWA/app. Hvilke kommuner som mottar og svarer. Moldes faktiske skjema/ansvarsfordeling. «Følg»-funksjon (vilkårene nevner e-post til «saksoppdateringer»).

## Assistentens konsekvens for differensiering

Påstanden «ingen eksisterende verktøy lar naboer bekrefte meldinger» kan ikke holdes. Kandidat for sterkere formulering: ingen enkel «meg også»-teller eller campuslokal flyt. Må verifiseres mot en faktisk sak før bruk.
