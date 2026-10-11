---
name: LocalFix
status: final
created: 2026-10-11
updated: 2026-10-11
sources:
  - docs/product-brief.md
  - docs/prd.md
---

# LocalFix: opplevelsesspesifikasjon

## Foundation

LocalFix er én responsiv webapp (PWA) laget mobile-first, med shadcn/ui på Next.js og Tailwind. Telefonen er den viktigste flaten, fordi brukeren registrerer problemer ute, der de ser dem. Nettbrett og desktop viser samme enkeltkolonne, sentrert. `DESIGN.md` er referansen for det visuelle, og denne filen beskriver oppførselen. Rollene (besøkende, bruker, moderator) og kravene (FR-1 til FR-9) er definert i `docs/prd.md`.

Skissene ligger i `mockups/`: `liste.html`, `registrer.html` og `detalj.html`. Hvis en skisse og denne spesifikasjonen sier noe ulikt, gjelder spesifikasjonen.

## Information Architecture

| Flate | Nås fra | Formål | Krav |
|---|---|---|---|
| Rapportliste (forside) | Åpning av appen, logo i topplinja | Se, filtrere og sortere synlige rapporter | FR-5, FR-6 |
| Rapportdetalj | Trykk på et rapportkort | Se hele rapporten, bekrefte, og for moderator endre status og skjule | FR-5, FR-7, FR-8, FR-9 |
| Ny rapport | Den flytende «+»-knappen på lista | Registrere et problem med KI-forslag | FR-3, FR-4 |
| Logg inn / Registrer konto | Menyen i topplinja, eller automatisk når en besøkende prøver å registrere eller bekrefte | Konto og innlogging | FR-1 |

Topplinja viser «LocalFix · Campus Molde» til venstre og en meny til høyre. Menyen inneholder «Logg inn» eller navnet ditt og «Logg ut». Moderatoren ser i tillegg «Moderator» som en merkelapp i menyen. Det finnes ingen bunnmeny, og navigasjonen er bare ett nivå dyp: fra lista går du til en detaljside eller til skjemaet, og «←» tar deg tilbake.

Alle flatene har en reise som ender der: UJ-1 i Ny rapport, UJ-2 i Rapportdetalj og UJ-3 i moderatorpanelet.

## Voice and Tone

Tonen er kort, vennlig og saklig, med «du»-form. Det er ingen utropstegn og ingen emoji, bortsett fra ✓ i bekreftet-tilstanden.

| Gjør | Ikke gjør |
|---|---|
| «Registrer problem» | «Rapporter en sak nå!» |
| «Jeg har også sett dette» | «Like» / «Stem opp» |
| «5 har sett dette» | «5 bekreftelser registrert» |
| «Du har sett dette ✓» | «Takk for din bekreftelse!» |
| «Rapporten er sendt inn» | «Suksess! Rapporten ble opprettet.» |
| «Vi fikk ikke et forslag. Velg kategori selv.» | «KI-feil: timeout» |
| «Ingen rapporter matcher filteret.» | «0 resultater» |
| «Unngå ansikter og bilskilt på bildet.» | «Personvernregler gjelder for opplastede bilder.» |

## Component Patterns

Her står oppførselen. Utseendet er beskrevet i `DESIGN.md.Components`.

| Komponent | Bruk | Regler for oppførsel |
|---|---|---|
| Rapportkort | Lista | Hele kortet er én lenke til detaljsiden. Ingen handlinger på selve kortet. |
| Filterbrikker | Lista, over kortene | Brikkerad: «Alle», de fem kategoriene og de tre statusene. Én kategori og én status kan være aktive samtidig. Et nytt trykk på en aktiv brikke slår den av. Valget lagres i URL-en, for eksempel `?kategori=belysning&status=ny`, så det overlever en ny innlasting og kan deles. |
| Sortering | Lista, til høyre over brikkene | En shadcn-`Select` med «Nyeste» (standard) og «Flest har sett». |
| Flytende «+»-knapp | Lista | Går til Ny rapport. Ikke innlogget: sendes til innlogging og så tilbake til skjemaet. |
| Beskrivelsesfelt | Ny rapport | Obligatorisk, 10–500 tegn [ASSUMPTION]. KI-forslaget hentes når brukeren går ut av feltet, eller 1,5 sekunder etter siste tastetrykk [ASSUMPTION]. |
| Kategorivalg | Ny rapport | Velger med de fem kategoriene. Når KI-forslaget kommer, blir kategorien valgt automatisk med merkelappen «Foreslått av KI». Velger brukeren selv, forsvinner merkelappen, og KI overskriver ikke valget senere. |
| KI-oppsummering | Ny rapport | Vises som lesetekst under kategorien, med «Endre» for å redigere. Uten forslag sendes rapporten uten oppsummering. |
| Lokasjonsfelt | Ny rapport | Obligatorisk fritekst. Plassholderen er «F.eks. gangveien ved bygg A». |
| Bildeopplasting | Ny rapport | Valgfritt. Knappen «Legg til bilde» åpner kamera eller bildebibliotek på mobil. Under knappen står påminnelsen om ansikter og bilskilt. Brukeren ser bildet før innsending og kan fjerne det. Bilder over 5 MB eller i feil format avvises med en gang. |
| Send inn | Ny rapport | Er deaktivert til beskrivelse og lokasjon er fylt inn. Viser «Sender …» mens rapporten sendes. Etter innsending går brukeren til rapportens detaljside og får en toast: «Rapporten er sendt inn». |
| Bekreftknapp | Detalj | Synlig for alle. Besøkende: sendes til innlogging og så tilbake. Rapportøren selv: deaktivert, med teksten «Din rapport». Allerede bekreftet: «Du har sett dette ✓», deaktivert. Ved trykk øker telleren med én med en gang (optimistisk). Feiler kallet, går telleren tilbake og en toast vises. |
| Moderatorpanel | Detalj, bare for moderator | Viser nåværende status og knapper bare til nabostatusene. Ny gir «Under behandling →». Under behandling gir «← Ny» og «Løst →». Løst gir «← Under behandling». «Skjul rapport» spør om bekreftelse i en shadcn-`AlertDialog`, mens «Vis rapport» trenger ingen bekreftelse. |

## State Patterns

| Tilstand | Flate | Visning |
|---|---|---|
| Laster | Lista | 4 Skeleton-kort i samme form som rapportkortene |
| Tom database | Lista | «Ingen rapporter ennå. Har du sett noe som bør fikses?» og en primærknapp «Registrer problem» |
| Ingen treff | Lista | «Ingen rapporter matcher filteret.» og en lenke «Nullstill filter» |
| KI tenker | Ny rapport | En liten spinner og «Finner kategori …» ved kategorivalget. Brukeren kan fortsette å fylle ut skjemaet imens. |
| KI svarer ikke eller er av (mock av) | Ny rapport | «Vi fikk ikke et forslag. Velg kategori selv.» Kategorivalget står tomt og er obligatorisk. |
| Mock-modus | Ny rapport | Oppfører seg som et vanlig forslag. Det er ingen synlig forskjell for brukeren. |
| Valideringsfeil | Ny rapport | Feilmeldingen står under feltet, og fokus flyttes til første feil |
| Innsending feiler | Ny rapport | En destructive-toast: «Kunne ikke sende inn. Prøv igjen.» Alt brukeren har fylt inn, beholdes. |
| Skjult rapport (moderator) | Lista og detalj | Grå merkelapp «Skjult» og grå bakgrunn. «Vis rapport» står i panelet. |
| Skjult rapport (andre) | Direkte lenke | 404-siden: «Fant ikke rapporten.» og en lenke tilbake til lista |
| Ikke tilgang (API 403) | Moderatorhandling | Skal ikke skje i grensesnittet. Skjer det likevel, vises en toast: «Du har ikke tilgang til dette.» |

## Interaction Primitives

- Trykk og klikk er de eneste handlingene. Det er ingen sveip, ingen dra-og-slipp og ingen lange trykk.
- «←» i topplinja og nettleserens tilbakeknapp gjør det samme.
- Lista bruker «Vis flere» nederst, med 20 rapporter om gangen. Det er ingen uendelig rulling.
- Statusendringer vises når siden lastes på nytt (PRD FR-8). Det er ingen sanntidsoppdatering.
- Det finnes ingen funksjoner som bare virker med mus eller hover.

## Accessibility Floor

Her står kravene til oppførsel. Kontrast er beskrevet i `DESIGN.md`.

- Appen skal oppfylle WCAG 2.2 AA.
- Status kommer alltid fram som tekst, ikke bare som farge.
- Alle skjemafelt har en synlig `label`. Feilmeldinger kobles til feltet med `aria-describedby`.
- Den flytende knappen har `aria-label="Registrer problem"`.
- Når KI-forslaget kommer, leser skjermleseren opp «Kategori foreslått: Belysning» via `aria-live="polite"`.
- Endringer i telleren på bekreftknappen leses opp via `aria-live`.
- Tab-rekkefølgen følger lesefølgen. Fokusringen arves fra shadcns `ring`.
- Trykkflater er minst 44 × 44 px.

## Responsive & Platform

| Bredde | Oppførsel |
|---|---|
| < 640 px (mobil, testes på 360 px) | Full bredde med 16 px marg. Den flytende knappen ligger nede til høyre. |
| ≥ 640 px (nettbrett, desktop) | Innholdet er sentrert med maks 640 px bredde. Den flytende knappen er erstattet av en «Registrer problem»-knapp i topplinja [ASSUMPTION]. |

PWA-manifestet gjør at appen kan legges på hjemskjermen (NFR-5). Det er ingen offline-støtte i v1.

## Inspiration & Anti-patterns

- **Hentet fra FixMyStreet og FiksGataMi:** rapportkort med tydelig status. I LocalFix vises i tillegg hvor mange som har sett problemet.
- **Avvist: kart som forside.** Kartvisning er utenfor omfanget, og en liste er raskere å skumlese på mobil.
- **Avvist: kommentarer og chat.** Bekreftelsen er den eneste sosiale handlingen (PRD §5).
- **Avvist: poeng, merker og «toppbidragsytere».** Det passer ikke med den rolige, saklige tonen og kan friste til spam.

## Key Flows

### Flow 1: Ida registrerer det mørke gatelyset (UJ-1)

1. Ida går hjem fra trening klokka ni om kvelden og ser at gatelyset ved gangveien er mørkt igjen. Hun åpner LocalFix.
2. Lista vises. Hun trykker på brikken «Belysning», og det er ingen treff.
3. Hun trykker på «+». Skjemaet åpnes med fokus i beskrivelsesfeltet.
4. Hun skriver «Gatelyset ved gangveien mot campus har vært mørkt i flere dager» og trykker videre.
5. «Finner kategori …» vises kort. Så står «Belysning» valgt med merkelappen «Foreslått av KI», og oppsummeringen «Mørkt gatelys på gangveien mot campus» vises under.
6. Hun skriver «Gangveien mellom bussholdeplassen og bygg A» i lokasjonsfeltet og hopper over bildet, fordi det er for mørkt.
7. **Klimaks:** Hun trykker «Send inn». Detaljsiden åpnes med status **Ny** og toasten «Rapporten er sendt inn». Problemet er synlig for alle.

Hvis KI-en feiler i steg 5, ser Ida «Vi fikk ikke et forslag. Velg kategori selv.» Hun velger «Belysning» selv og fortsetter.

### Flow 2: Jonas bekrefter (UJ-2)

1. Jonas åpner LocalFix samme kveld og ser Idas rapport øverst, sortert på «Nyeste».
2. Han trykker på kortet og leser detaljene.
3. Han trykker «Jeg har også sett dette». Han er ikke innlogget, så han sendes til innlogging og tilbake igjen. Han trykker på nytt.
4. **Klimaks:** Telleren går fra «1 har sett dette» til «2 har sett dette», og knappen viser «Du har sett dette ✓».

### Flow 3: Sara følger opp (UJ-3)

1. Sara logger inn som moderator og velger sorteringen «Flest har sett».
2. Gatelysrapporten ligger øverst, med 5 som har sett den. Hun åpner den og melder fra til driften.
3. I moderatorpanelet trykker hun «Under behandling →». Merket blir gult.
4. En uke senere er lyset fikset. Hun trykker «Løst →».
5. **Klimaks:** Alle som åpner rapporten, ser at den er **Løst**. Saken ble fulgt opp.

Hvis Sara oppdager at en rapport har et lesbart bilskilt på bildet, trykker hun «Skjul rapport» og bekrefter. Rapporten forsvinner for alle andre.
