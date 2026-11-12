# Tilbakemelding på PRD

| | |
|---|---|
| **Gruppe** | G80 – G80-abdulla |
| **PRD vurdert** | `docs/prd.md` (status: final, sist endret 2026-11-04, commit edbba81) |
| **Dato** | 2026-11-12 |
| **Type** | Formativ tilbakemelding, ikke karakter |

## 1. Samlet inntrykk

Dette er en sterk PRD. Den har en tydelig tese (nabo til nabo, med en bekreftelse som teller og sorterer lista), et ærlig og realistisk scope, konkrete testbare konsekvenser på de fleste FR-ene og en gjennomtenkt håndtering av KI, kostnad og personvern. Risikoen ligger i detaljene: FR-1 er tynnere enn de andre, suksessmetrikkene tester funksjonene og ikke tesen, og KI-målet mangler en regel for hva som skjer hvis det ikke nås.

## 2. Dette fungerer godt

- **KI er styrt og testbar.** FR-4 sier at forslaget alltid må være en av de fem kategoriene («Et ugyldig svar fra modellen gir ‹ingen forslag›»), har tidsavbrudd på 5 sekunder og lar registreringen virke uten KI. SM-5 gir et testsett (20 beskrivelser, minst 16 riktige) som kan kjøres på nytt. Mock-modus (§3, NFR-2) gjør at sensor kan kjøre appen uten nøkler.
- **Ærlig scope og tydelige avveininger.** §6 sier at v1 bare kjøres lokalt, og §6.2 begrunner hva som er parkert. FR-9 sier åpent at en skjult rapport også forsvinner for rapportøren, «og rapportøren får ingen melding om det i v1». §11 skiller mellom det som stopper v1 og det som må lukkes før drift.
- **Personvern og kilder behandles som krav.** §8 sier rett ut at «rapportteksten sendes til en ekstern KI-tjeneste» og begrunner hvorfor Gemini på gratisnivå ikke brukes. §0 kaller research med svakt grunnlag for hypoteser, og Vision (§1) sier at FiksGataMi-sammenligningen er «funnet på én side, ikke prøvd i praksis».

## 3. Oversikt per dimensjon

| Dimensjon | Vurdering | Kort begrunnelse |
|---|---|---|
| Beslutningsklarhet | sterk | Beslutninger har grunnlag og dato, og de to åpne spørsmålene i §11 er virkelig åpne, med lukkekriterier. |
| Substans | sterk | Konkret campus-persona, produktspesifikke NFR-er (360 px, WCAG 2.2 AA med axe, 100 rapporter under 2 s). Ingen boilerplate. |
| Strategisk sammenheng | god | Tesen er tydelig, men SM-1–SM-4 viser bare at funksjonene virker. Ingenting tester at bekreftelsen og moderatoren gir verdi. |
| Testbarhet | god | FR-3–FR-9 har konkrete konsekvenser. FR-1 er tynn, og FR-5 sier bare «alle feltene». |
| Scope og avgrensning | sterk | Ikke-mål, ute-av-omfang med begrunnelse, antakelser tagget og indeksert. Passer ett semester. |
| Brukbarhet for neste fase | god | Glossar, ID-er og krysshenvisninger holder stort sett. «Registrere» brukes om to ting, og noen FR-er peker ikke på UJ. |
| Formtilpasning | sterk | Tre UJ-er med navngitte personer passer et forbrukerrettet produkt med to roller. |

## 4. Viktigste forbedringer

### 4.1 FR-1 er for tynn, og «registrere» brukes om to ting
- **Alvorlighet:** medium
- **Hvor:** §4.1 FR-1 «Prøver en som ikke er innlogget å registrere eller bekrefte»; §2.2 «Bruker … Studenter og ansatte»
- **Problem og hvorfor det betyr noe:** FR-1 har to konsekvenser og dekker verken feilsituasjoner eller utlogging. «Registrere» betyr både å opprette konto (FR-1) og å registrere en rapport (FR-3, «Registrer problem»), så testen over kan leses på to måter. Rollene sier «studenter og ansatte», men FR-1 lar «en besøkende» opprette konto uten å si om noen sjekk finnes. Det påvirker datamodell, UX-skjermer og tester.
- **Forslag:** Bruk «opprette konto» om kontoen og «registrere rapport» om rapporten. Legg til for eksempel: «Innlogging med feil passord gir en tydelig feilmelding uten å si hvilket felt som var feil.» «E-postadresse som allerede finnes, avvises.» «Brukeren kan logge ut, og beskyttede handlinger krever da innlogging på nytt.» Skriv også hva som gjelder for kontoopprettingen i v1 (for eksempel «hvem som helst med e-post, siden v1 bare kjøres lokalt» eller et krav om HiM-adresse), og ta det inn i §12 hvis det er en antakelse.

### 4.2 Suksessmetrikkene tester funksjonene, ikke tesen
- **Alvorlighet:** medium
- **Hvor:** §10 SM-1–SM-4; SM-C1, SM-C2 («kan først måles når appen settes i drift»)
- **Problem og hvorfor det betyr noe:** SM-1–SM-4 gjentar i praksis FR-konsekvensene. Tesen er at en teller og et moderatorsvar motvirker «å rope i tomrommet», men ingenting i v1 sjekker om det oppleves slik. Mot-metrikkene sier heller ikke hvilken SM de balanserer, og de kan ikke måles lokalt.
- **Forslag:** Legg til en liten måling som er mulig i v1, for eksempel: «SM-8: Fem medstudenter får oppgaven ‹finn ut om gatelyset allerede er meldt, og bekreft det›. Minst fire klarer det uten hjelp på under to minutter, og alle sier hva de tror skjer med rapporten etterpå.» Skriv i SM-C2 «Counterbalances SM-3», og si hvordan den kan simuleres i testdataene (for eksempel rapporter som har stått som **Ny** i mer enn 14 dager).

### 4.3 KI-målet mangler en regel for å bomme og for ikke-pålitelig tekst
- **Alvorlighet:** medium
- **Hvor:** §10 SM-5 (sekundær), §11 spørsmål 1, FR-4
- **Problem og hvorfor det betyr noe:** Kravet «minst 16 av 20» står, men ikke hva som skjer hvis ingen gratisleverandør klarer det. Oppsummeringen fra modellen vises til andre brukere, men FR-4 sier ikke at den behandles som upålitelig tekst. Mock-modus kan ikke måles mot SM-5 siden den ikke er en språkmodell. Testsettet har 4 per kategori, men ingen uklare tilfeller.
- **Forslag:** Legg til i FR-4: «Oppsummeringen vises som ren tekst, aldri som HTML.» Legg til i §11: «Treffer ingen leverandør 16 av 20, leveres v1 med manuelt kategorivalg og mock-modus, og resultatet dokumenteres.» Utvid testsettet med for eksempel to tvetydige beskrivelser der forventet resultat er «ingen forslag» eller **Annet**.

### 4.4 UJ-3 blander to personer, og FR-5/FR-6 peker ikke på reisene
- **Alvorlighet:** lav
- **Hvor:** §2.4 UJ-3 «Ida filtrerer på ‹Mine rapporter› … Alle andre som åpner rapporten, ser det samme»; FR-5, FR-6
- **Problem og hvorfor det betyr noe:** UJ-3 handler om Sara, men klimakset er Idas. «Ser det samme» er vagt. FR-5 og FR-6 har ingen «Realiserer UJ-x», så sporbarheten til UX og stories brytes akkurat der Ida og Jonas bruker lista.
- **Forslag:** Flytt Idas oppfølging til en egen kort UJ-4 («Ida ser at gatelyset er løst»), og legg til «Realiserer UJ-1, UJ-2, UJ-4» på FR-5 og FR-6. Skriv i klimakset hva Ida konkret ser: «status **Løst** og dato for ‹sist oppdatert›».

### 4.5 Endringslogg før visjonen
- **Alvorlighet:** lav
- **Hvor:** §0, fire «Endringer»-blokker (omtrent 350 ord)
- **Problem og hvorfor det betyr noe:** Den som leser PRD-en for å lage UX eller stories, må forbi historikken før visjonen. Git-historikken og `docs/beslutninger/` fanger allerede dette.
- **Forslag:** Flytt endringslogg til et eget vedlegg eller bakerst, og la §0 holde seg til formål og leseveiledning.

## 5. Mekaniske funn

- **IDer:** FR-1–FR-9, UJ-1–UJ-3 og SM-1–SM-7 er sammenhengende, og krysshenvisningene løser seg. NFR-ene er nummerert NFR-1–NFR-8 uten hull. FR-1, FR-2, FR-5 og FR-6 har ingen «Realiserer UJ-x».
- **Glossar:** «Registrere» brukes om konto og rapport (4.1). «Problem» brukes som synonym for rapport i UJ-1 («Registrer problem»). «Mine rapporter» står ikke i ordlista.
- **Antakelser:** De seks inline-taggene i FR-3, FR-4, §8 og NFR-6 er alle indeksert i §12, og omvendt. Taggen heter «ANTAGELSE», konsekvent.
- **FR-5:** «Detaljsiden viser alle feltene i rapporten» kan gjøres sjekkbar ved å vise til Rapport i ordlista.
- **Referanse til arbeidsfil:** §12 sier at begrunnelsen står i `.memlog.md`. Skriv én setning om begrunnelsen i PRD-en eller i `docs/beslutninger/`, så den ikke avhenger av en arbeidsfil.
- **Status:** Frontmatter sier `final`, mens §11 har to «Ikke lukket». Det er forsvarlig siden de ikke stopper v1, men si det i §0.

## 6. Før dere går videre

**Må avklares før UX, arkitektur og epics:**
- Hvem kan opprette konto i v1, og hvordan skal FR-1 testes (4.1)?
- Hva skjer med KI-funksjonen hvis ingen leverandør treffer 16 av 20 (4.3)? Arkitekturen har allerede et grensesnitt bak KI-kallet, så dette er en beslutning, ikke en omarbeiding.

**Kan vente:**
- Valg av språkmodell (§11 spørsmål 1) til SM-5-testen er kjørt.
- Hvem moderator er i praksis (§11 spørsmål 2), som må lukkes før drift, ikke før v1.
- Måling av mot-metrikkene (SM-C1, SM-C2) etter drift.

**Oppfølging av tilbakemeldingen på product brief:** ja. Roller og moderator (FR-2, §2.2), testbart KI-mål med testsett og fallback (FR-4, SM-5), kjøring uten nøkler (NFR-2, NFR-3), campus Molde som lokalmiljø, filtrering og sortering (FR-6), konkrete suksesskriterier og addendum er alle fulgt opp. Duplikatsjekk er parkert med begrunnelse i §6.2.

## 7. Refleksjonsspørsmål

1. §0 og §11 viser at dere har brukt research (også med svakt grunnlag) og endret PRD-en flere ganger. Hvilke forslag fra KI-en har dere avvist eller endret, og hvordan avgjorde dere det?
2. SM-5-testsettet er laget før valget av leverandør. Hvordan sørger dere for at beskrivelsene og fasiten ikke er skrevet slik at KI-en lett treffer, men heller ligner det ekte brukere på campus ville skrevet?

_Vurdert mot kvalitetsrubrikken i bmad-prd. Dette er veiledning, ikke sensur._
