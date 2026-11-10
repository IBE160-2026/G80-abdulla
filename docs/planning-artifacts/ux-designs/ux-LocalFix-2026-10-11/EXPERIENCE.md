---
name: LocalFix
status: final
created: 2026-10-11
updated: 2026-11-10
sources:
  - docs/product-brief.md
  - docs/prd.md
  - docs/planning-artifacts/architecture/architecture-LocalFix-2026-10-28/ARCHITECTURE-SPINE.md
---

# LocalFix: opplevelsesspesifikasjon

## Foundation

LocalFix er én responsiv webapp (PWA) laget mobile-first, med shadcn/ui på Next.js og Tailwind. Telefonen er den viktigste flaten, fordi brukeren registrerer problemer ute, der de ser dem. Nettbrett og desktop viser samme enkeltkolonne, sentrert. `DESIGN.md` er referansen for det visuelle, og denne filen beskriver oppførselen. Rollene (besøkende, bruker, moderator) og kravene (FR-1 til FR-9, NFR-1 til NFR-8) er definert i `docs/prd.md`. Navn i URL-er, kodeverdier og lengdegrenser følger arkitekturspinen (`ARCHITECTURE-SPINE.md`).

**Oppdatert 2026-11-06:** tilpasset PRD-en etter vurderingen 2026-11-04 og arkitekturspinen. Lengdegrensene, kategori som krav før innsending, filteret «Mine rapporter», «sist oppdatert», telleren «1 har sett dette», påminnelsen om personopplysninger og kontrollen for NFR-8 er nye eller endret. Senere samme dag ble det presisert når KI-forslaget hentes, at et eget kategorivalg låser opp «Send inn» mens KI-en jobber, og at «Registrer problem» ligger i topplinja på bred skjerm.

**Oppdatert 2026-11-09 (Story 1.5):** beslutningene om topplinja på detaljsiden, overskriften, «Registrert», telleren og den norske feilsiden er ført inn. Der de avviker fra `detalj.html`, gjelder denne filen.

**Oppdatert 2026-11-10 (Story 2.2):** skjemaet for en ny rapport er bygget uten KI-forslag, oppsummering og bilde (Story 2.3 og 2.4). Påminnelsen under beskrivelsen har bare første setning, «Ikke skriv navn eller andre personopplysninger.», for setningen om KI-tjenesten er ikke sann før Story 2.3 sender teksten dit. «Registrer problem» i topplinja har lyst omriss, fordi en Fjordblå primærknapp ville forsvunnet mot den blå topplinja, og den er skjult på innloggingssidene og på selve skjemaet. Kategorivalget er shadcn `Select`.

**Oppdatert 2026-11-09 (Story 2.1):** menyen i topplinja, innloggings- og registreringssiden, tekstene og feilmeldingene er ført inn. Registreringen har ikke lenger «Gjenta passord», og startpakkens sider for glemt passord, nytt passord og e-postbekreftelse er fjernet.

Skissene ligger i `mockups/`: `liste.html`, `registrer.html` og `detalj.html`. Hvis en skisse og denne spesifikasjonen sier noe ulikt, gjelder spesifikasjonen.

## Information Architecture

| Flate | Nås fra | Formål | Krav |
|---|---|---|---|
| Rapportliste (forside) | Åpning av appen, logo i topplinja | Se, filtrere og sortere synlige rapporter. Innloggede kan finne igjen sine egne med «Mine rapporter» | FR-5, FR-6 |
| Rapportdetalj | Trykk på et rapportkort | Se hele rapporten og når den sist ble oppdatert, bekrefte, og for moderator endre status og skjule | FR-5, FR-7, FR-8, FR-9 |
| Ny rapport | Den flytende «+»-knappen på lista | Registrere et problem med KI-forslag | FR-3, FR-4 |
| Logg inn / Registrer konto | Menyen i topplinja, eller automatisk når en besøkende prøver å registrere eller bekrefte | Konto og innlogging | FR-1 |

Topplinja viser «LocalFix · Campus Molde» til venstre og en meny til høyre. På detaljsiden, og på 404-siden for en rapport, står «←» foran «LocalFix · Campus Molde», med `aria-label="Tilbake til lista"`. Mockupens «← Rapport» brukes ikke. Menyen åpnes med knappen ☰ (`aria-label="Meny"`, 44 × 44 px), som er lik for besøkende og innloggede. Den inneholder «Logg inn» eller e-postadressen din og «Logg ut». Appen lagrer ingen navn i v1, og e-postadressen vises bare for brukeren selv. Moderatoren ser i tillegg «Moderator» som en merkelapp i menyen. Det finnes ingen bunnmeny, og navigasjonen er bare ett nivå dyp: fra lista går du til en detaljside eller til skjemaet, og «←» tar deg tilbake.

Alle flatene har en reise som ender der: UJ-1 i Ny rapport, UJ-2 i Rapportdetalj og UJ-3 i moderatorpanelet.

## Voice and Tone

Tonen er kort, vennlig og saklig, med «du»-form. Det er ingen utropstegn og ingen emoji, bortsett fra ✓ i bekreftet-tilstanden.

| Gjør | Ikke gjør |
|---|---|
| «Registrer problem» | «Rapporter en sak nå!» |
| «Jeg har også sett dette» | «Like» / «Stem opp» |
| «5 har sett dette» | «5 bekreftelser registrert» |
| «Sist oppdatert 4. november kl. 14:20» | «Status endret 2026-11-04T13:20Z» |
| «Ikke skriv navn eller andre personopplysninger. Teksten sendes til en KI-tjeneste for å foreslå kategori.» | «Ved å sende inn godtar du at data behandles av tredjepart.» |
| «Du har sett dette ✓» | «Takk for din bekreftelse!» |
| «Rapporten er sendt inn» | «Suksess! Rapporten ble opprettet.» |
| «Vi fikk ikke et forslag. Velg kategori selv.» | «KI-feil: timeout» |
| «Ingen rapporter matcher filteret.» | «0 resultater» |
| «Unngå ansikter og bilskilt på bildet.» | «Personvernregler gjelder for opplastede bilder.» |
| «Feil e-post eller passord.» | «Invalid login credentials» |

## Component Patterns

Her står oppførselen. Utseendet er beskrevet i `DESIGN.md.Components`.

| Komponent | Bruk | Regler for oppførsel |
|---|---|---|
| Meny | Topplinja, til høyre på alle sider | Knappen ☰ med `aria-label="Meny"` åpner en nedtrekksmeny. Besøkende: «Logg inn», som går til innloggingen med siden du står på som retur-adresse (`/auth/login?next=…`). På innloggings- og registreringssiden beholdes retur-adressen fra adressen. Innlogget: e-postadressen din, merkelappen «Moderator» for moderatoren og «Logg ut». «Logg ut» logger ut denne nettleseren og viser lista som for en besøkende. Menyen virker med tastatur: Enter eller mellomrom åpner den, piltastene flytter mellom valgene, og Escape lukker den og gir fokus tilbake til knappen. |
| Innlogging og registrering | `/auth/login` og `/auth/sign-up` | Overskriften er «Logg inn» eller «Registrer konto». Begge har bare feltene «E-post» og «Passord». Registreringen har hjelpeteksten «Minst 6 tegn.» under passordet og ikke noe felt for å gjenta passordet. Knappene er «Logg inn» og «Registrer konto», og viser «Logger inn …» og «Registrerer …» mens kallet pågår. Under skjemaet står «Har du ikke konto? Registrer konto» eller «Har du allerede konto? Logg inn», og lenken tar med samme retur-adresse. En ny konto er innlogget med en gang, uten e-postbekreftelse. Etter innlogging eller registrering kommer du tilbake til siden du kom fra. En retur-adresse til et annet nettsted gir lista. Det finnes ingen «Glemt passord» og ingen sletting av konto i v1 (PRD §6.2). |
| Rapportkort | Lista | Hele kortet er én lenke til detaljsiden. Ingen handlinger på selve kortet. Har rapporten bilde, står et lite bildeikon («Har bilde») sist i metadatalinja, og lista viser aldri selve bildet. Telleren viser «N har sett dette», der N er `seen_count` fra visningen: antall bekreftelser pluss rapportøren (PRD §3). Grensesnittet regner ikke selv, bortsett fra den optimistiske +1 på bekreftknappen. En ny rapport viser «1 har sett dette». Tiden i metadatalinja er relativ og regnes fra registreringen: under ett minutt, eller fram i tid (for eksempel ved klokkeforskjell), vises som «nå». Deretter «N minutter siden» (under en time), «N timer siden» (under et døgn), «N dager siden» (under 7 døgn), «N uker siden» (under 30 døgn), «N måneder siden» (under 365 døgn, 30 døgn per måned) og «N år siden» (365 døgn per år), med entall for 1 («1 minutt siden», «1 time siden», «1 dag siden», «1 uke siden», «1 måned siden») og tallene rundet ned. |
| Filterbrikker | Lista, over kortene | Brikkerad: «Mine rapporter» (bare for innloggede), «Alle», de fem kategoriene og de tre statusene. «Mine rapporter», én kategori og én status kan være aktive samtidig. «Mine rapporter» viser bare rapporter brukeren selv har registrert, ikke de hen har bekreftet. «Alle» nullstiller kategori og status. Et nytt trykk på en aktiv brikke slår den av. Valget lagres i URL-en med kodeverdiene fra arkitekturen, for eksempel `?mine=true&category=lighting&status=new`, så det overlever en ny innlasting og kan deles. Ukjente verdier ignoreres. For en besøkende ignoreres `mine`. |
| Sortering | Lista, til høyre over brikkene | En shadcn-`Select` med «Nyeste» (standard) og «Flest har sett». Valget lagres i URL-en som `sort=newest` eller `sort=confirmations`. |
| Flytende «+»-knapp | Lista | Går til Ny rapport. Vises bare under 640 px. Fra 640 px har topplinja «Registrer problem» i stedet. Ikke innlogget: sendes til innlogging og så tilbake til skjemaet. |
| Beskrivelsesfelt | Ny rapport | Obligatorisk, kan ikke være tomt eller bare mellomrom, og har maks 1000 tegn (FR-3). En teller «N/1000» vises under feltet. Tekst over grensen gir en feilmelding ved feltet. Under feltet står påminnelsen «Ikke skriv navn eller andre personopplysninger. Teksten sendes til en KI-tjeneste for å foreslå kategori.» (Story 2.2 har bare første setning. Den andre kommer med Story 2.3.) Telleren er ren tekst og leses ikke opp for hvert tegn. Grensen kommer via feilmeldingen «Beskrivelsen kan ha høyst 1000 tegn.», som står under feltet, og fokus går til første feil. KI-forslaget hentes bare når brukeren går ut av feltet, og bare når teksten har minst 10 tegn og er endret siden forrige forslag. Det hentes ikke mens brukeren skriver, så det blir færre kall mot gratisnivået, og halvferdig tekst sendes ikke til KI-tjenesten. |
| Kategorivalg | Ny rapport | Obligatorisk velger (shadcn `Select`, 44 px høy, 16 px tekst, valgt med Enter eller mellomrom, piltaster og Enter) med de fem kategoriene. Uten valg står «Velg kategori», og feilen «Velg en kategori.» står under feltet. Når KI-forslaget kommer, blir kategorien valgt automatisk med merkelappen «Foreslått av KI». Velger brukeren selv, forsvinner merkelappen, og KI overskriver ikke valget senere. |
| KI-oppsummering | Ny rapport | Vises som lesetekst under kategorien, med «Endre» for å redigere. Maks 300 tegn, også når brukeren skriver den selv. Uten forslag sendes rapporten uten oppsummering. |
| Lokasjonsfelt | Ny rapport | Obligatorisk fritekst, maks 200 tegn. Plassholderen er «F.eks. gangveien ved bygg A». |
| Bildeopplasting | Ny rapport | Valgfritt. Knappen «Legg til bilde» åpner kamera eller bildebibliotek på mobil. Under knappen står påminnelsen om ansikter og bilskilt. Brukeren ser bildet før innsending og kan fjerne det. Bilder over 5 MB, eller i andre formater enn JPEG, PNG og WebP, avvises med en gang. |
| Send inn | Ny rapport | Er deaktivert til beskrivelse, lokasjon og kategori er fylt inn (FR-3). Mens KI-en finner kategori, er knappen deaktivert, med mindre brukeren allerede har valgt kategori selv. Da er knappen aktiv med en gang, og et forslag som kommer senere, endrer ikke kategorien. Svarer ikke KI-en, må brukeren velge kategori selv. Viser «Sender …» mens rapporten sendes. Etter innsending går brukeren til rapportens detaljside og får en toast: «Rapporten er sendt inn». |
| Rapportdetalj | Detalj | Øverst kategori til venstre og statusmerket til høyre, med «Sist oppdatert» rett under. Overskriften er oppsummeringen. Mangler den, er overskriften kategorinavnet, for eksempel «Skadeverk». Beskrivelsen står alltid som eget avsnitt under overskriften, som ren tekst, med linjeskiftene bevart og lange ord brutt. Under beskrivelsen står «Hvor:» med lokasjonen, «Registrert 20. oktober kl. 10:15» (registreringstidspunktet i samme format som «Sist oppdatert») og telleren «N har sett dette». Mockupens «Har sett dette: N» og relative registreringstid brukes ikke. Har rapporten bilde, står bildet mellom overskriften og beskrivelsen, som i `detalj.html`. Det har full bredde, og høyden følger bildet, men er høyst 480 px. Høye bilder vises hele (ikke beskåret) på dempet bakgrunn, så ingenting av problemet kuttes bort. Hjørnene er avrundet med `{rounded.lg}`, og margen er 8 px over og 12 px under. Bildet har alternativ tekst «Bilde fra rapporten». |
| «Sist oppdatert» | Detalj, under statusmerket | Viser tidspunktet for siste statusendring som dato og klokkeslett i norsk tid, for eksempel «Sist oppdatert 4. november kl. 14:20». Er statusen aldri endret, vises registreringstidspunktet (FR-8). Skjuling endrer ikke tidspunktet. |
| Bekreftknapp | Detalj | Synlig for alle. Besøkende: sendes til innlogging og så tilbake. Rapportøren selv: deaktivert, med teksten «Din rapport». Allerede bekreftet: «Du har sett dette ✓», deaktivert. Skjult rapport (bare moderator ser den): deaktivert, med teksten «Skjult rapport». En bekreftelse kan ikke angres (FR-7). Ved trykk øker telleren med én med en gang (optimistisk), og tallet erstattes av serverens `seen_count` når svaret kommer. Feiler kallet, går telleren tilbake og en toast vises. Svarer serveren at brukeren allerede har bekreftet, vises «Du har sett dette ✓» uten feiltoast. |
| Moderatorpanel | Detalj, bare for moderator | Viser nåværende status og knapper bare til nabostatusene. Ny gir «Under behandling →». Under behandling gir «← Ny» og «Løst →». Løst gir «← Under behandling». «Skjul rapport» spør om bekreftelse i en shadcn-`AlertDialog`, mens «Vis rapport» trenger ingen bekreftelse. |

## State Patterns

| Tilstand | Flate | Visning |
|---|---|---|
| Laster | Lista | 4 Skeleton-kort i samme form som rapportkortene |
| Tom database | Lista | «Ingen rapporter ennå. Har du sett noe som bør fikses?» og en primærknapp «Registrer problem» |
| Ingen treff | Lista | «Ingen rapporter matcher filteret.» og en lenke «Nullstill filter» |
| Ingen egne rapporter | Lista med «Mine rapporter» som eneste aktive filter | «Du har ikke registrert noen rapporter ennå.» og en primærknapp «Registrer problem». Er et kategori- eller statusfilter også aktivt, vises «Ingen treff» i stedet |
| KI tenker | Ny rapport | En liten spinner og «Finner kategori …» ved kategorivalget. Kategorivalget er fortsatt i bruk. Brukeren kan fortsette å fylle ut skjemaet imens, også velge kategori selv. «Send inn» venter bare hvis det ikke finnes en kategori ennå. |
| KI svarer ikke etter 5 sekunder, feiler eller er av | Ny rapport | «Vi fikk ikke et forslag. Velg kategori selv.» Kategorivalget står tomt og er obligatorisk. |
| Mock-modus | Ny rapport | Oppfører seg som et vanlig forslag. Det er ingen synlig forskjell for brukeren. |
| Valideringsfeil | Ny rapport | Feilmeldingen står under feltet, og fokus flyttes til første feil |
| Feil i feltene | Innlogging og registrering | Skjemaet sjekker selv før det sender: «Skriv inn e-postadressen din.», «Skriv inn passordet ditt.», «Skriv inn en gyldig e-postadresse.» og, ved registrering, «Passordet må ha minst 6 tegn.». Svarer Supabase at e-postadressen er i bruk, står «Det finnes allerede en konto med denne e-postadressen.» ved e-postfeltet. Feilen står under feltet, og fokus flyttes til første feil. |
| Innlogging eller registrering feiler | Innlogging og registrering | En melding over knappen: «Feil e-post eller passord.», «For mange forsøk. Vent litt og prøv igjen.» eller, ved alle andre feil, også nettverksfeil, «Noe gikk galt. Prøv igjen.». Fokus flyttes til meldingen. Tekst fra Supabase vises aldri, og det du har skrevet, beholdes. |
| Innsending feiler | Ny rapport | En destructive-toast: «Kunne ikke sende inn. Prøv igjen.» Alt brukeren har fylt inn, beholdes. |
| Skjult rapport (moderator) | Lista og detalj | Grå merkelapp «Skjult» og grå bakgrunn. «Vis rapport» står i panelet. |
| Skjult rapport (alle andre enn moderator, også rapportøren) | Direkte lenke og «Mine rapporter» | Rapporten er borte fra lista og fra «Mine rapporter». En direkte lenke gir 404-siden: «Fant ikke rapporten.» og en lenke tilbake til lista. Rapportøren får ingen melding i v1 (FR-9). |
| Bildet mangler | Detalj | Finnes ikke bildet i lagringen, eller kan lenken til det ikke lages, vises siden som for en rapport uten bilde, uten feilmelding og uten feilside. |
| Feil ved lasting | Alle sider | «Noe gikk galt. Prøv igjen.», knappen «Prøv igjen», som henter siden på nytt, og en lenke «Tilbake til lista». Rapporttekst og feilmeldinger fra databasen vises aldri. |
| Ikke tilgang (API 403) | Moderatorhandling | Skal ikke skje i grensesnittet. Skjer det likevel, vises en toast: «Du har ikke tilgang til dette.» |

## Interaction Primitives

- Trykk og klikk er de eneste handlingene. Det er ingen sveip, ingen dra-og-slipp og ingen lange trykk.
- «←» i topplinja og nettleserens tilbakeknapp gjør det samme: kommer du fra en side i appen, går «←» ett steg tilbake i historikken, så filtrene og rulleposisjonen i lista er bevart. Har du åpnet siden direkte, for eksempel fra en delt lenke, går «←» til lista. Uten JavaScript er «←» en vanlig lenke til lista.
- Lista viser alle synlige rapporter. Det er ingen «Vis flere» og ingen uendelig rulling i v1 (arkitekturen, NFR-6).
- Statusendringer vises når siden lastes på nytt (PRD FR-8). Det er ingen sanntidsoppdatering.
- Det finnes ingen funksjoner som bare virker med mus eller hover.

## Accessibility Floor

Her står kravene til oppførsel. Kontrast er beskrevet i `DESIGN.md`.

- Appen skal oppfylle WCAG 2.2 AA.
- Status kommer alltid fram som tekst, ikke bare som farge.
- Alle skjemafelt har en synlig `label`. Feilmeldinger kobles til feltet med `aria-describedby`.
- Den flytende knappen har `aria-label="Registrer problem"`.
- Menyknappen har `aria-label="Meny"`. I skjemaene for innlogging og registrering får et felt med feil `aria-invalid`, og en melding over knappen har `role="alert"`. Feilmeldingene har vanlig tekstfarge og et feilikon i `destructive`, fordi `destructive` har for lav kontrast til liten tekst.
- Når KI-forslaget kommer, leser skjermleseren opp «Kategori foreslått: Belysning» via `aria-live="polite"`.
- Endringer i telleren på bekreftknappen leses opp via `aria-live`.
- Tab-rekkefølgen følger lesefølgen. Fokusringen arves fra shadcns `ring`.
- Trykkflater er minst 44 × 44 px.
- Bildet på detaljsiden har `alt="Bilde fra rapporten"`. Overskriften rett over sier hva rapporten gjelder, så den alternative teksten gjentar den ikke, og den lover ikke mer enn vi vet om bildet. Bildeikonet i lista har `role="img"` og `aria-label="Har bilde"`.
- Filterbrikkene er knapper med `aria-pressed`, så skjermleseren sier om filteret er på.
- Telleren for tegn i beskrivelsesfeltet leses ikke opp for hvert tegn. Feilmeldingen ved for lang tekst kobles til feltet med `aria-describedby`.

**Kontroll (NFR-8):** Kjerneflyten testes på to måter før hver fletting av en story som endrer grensesnittet:

1. En automatisk tilgjengelighetstest med axe på lista, detaljsiden, skjemaet og innloggingen skal gi null funn med alvorlighet «serious» eller «critical».
2. Hele kjerneflyten skal kunne gjennomføres bare med tastatur: logge inn, filtrere, åpne en rapport, bekrefte, registrere en rapport, og for moderator endre status og skjule.

## Responsive & Platform

| Bredde | Oppførsel |
|---|---|
| < 640 px (mobil, testes på 360 px) | Full bredde med 16 px marg. Den flytende knappen ligger nede til høyre. |
| ≥ 640 px (nettbrett, desktop) | Innholdet er sentrert med maks 640 px bredde. Den flytende knappen er erstattet av knappen «Registrer problem» i topplinja, fordi en flytende knapp i hjørnet havner langt fra innholdet på en bred skjerm. Knappen er en lenke med lyst omriss på den blå topplinja (en Fjordblå primærknapp ville ikke vært synlig der) og er 44 px høy. Den går til samme sted og følger samme regel for innlogging, og er skjult på `/auth/*` og på `/rapporter/ny`, der den enten er til ingen nytte eller peker på siden brukeren står på. |

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
4. Hun skriver «Gatelyset ved gangveien mot campus har vært mørkt i flere dager» og trykker videre. Påminnelsen under feltet minner henne om å ikke skrive navn.
5. «Finner kategori …» vises kort. Så står «Belysning» valgt med merkelappen «Foreslått av KI», og oppsummeringen «Mørkt gatelys på gangveien mot campus» vises under.
6. Hun skriver «Gangveien mellom bussholdeplassen og bygg A» i lokasjonsfeltet og hopper over bildet, fordi det er for mørkt.
7. **Klimaks:** Hun trykker «Send inn». Detaljsiden åpnes med status **Ny**, «1 har sett dette» og toasten «Rapporten er sendt inn». Problemet er synlig for alle.

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
5. **Klimaks:** Ida trykker på brikken «Mine rapporter» og ser at gatelysrapporten står som **Løst**. Hun åpner den og ser «Sist oppdatert 11. november kl. 09:15». Alle andre som åpner rapporten, ser det samme. Saken ble fulgt opp.

Har Sara satt **Løst** for tidlig, trykker hun «← Under behandling». Blir lyset mørkt igjen senere, registrerer Ida en ny rapport, og den gamle blir stående som **Løst**.

Hvis Sara oppdager at en rapport har et lesbart bilskilt på bildet, trykker hun «Skjul rapport» og bekrefter. Rapporten forsvinner for alle andre, også fra rapportørens «Mine rapporter».
