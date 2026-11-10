# Product

<!-- impeccable:product-schema 1 -->

Kort produktsammendrag for designarbeid med Impeccable. Kildene er `docs/prd.md` (final), `docs/product-brief.md` og `docs/ux/EXPERIENCE.md`. Ved uenighet gjelder PRD-en.

## Platform

web

## Users

- **Studenter og ansatte på campus ved Høgskolen i Molde.** De ferdes i området hver dag og ser problemer underveis, ofte med telefonen i hånda. Typisk bruker er Ida, andreårsstudent, som går gangveien til campus om kvelden og på under ett minutt vil finne ut om et mørkt gatelys allerede er meldt. Er det meldt, bekrefter hun det. Er det ikke meldt, tar hun et bilde og registrerer det.
- **Moderator.** En utpekt person, for eksempel fra studentorganisasjonen eller driftsavdelingen. Moderatoren går gjennom lista omtrent én gang i uka, sortert etter flest bekreftelser, endrer status og skjuler upassende rapporter. Hvem moderatoren er i praksis, er ikke avklart (PRD §11).
- **Besøkende uten innlogging.** De kan lese lista og detaljsidene, men ikke registrere eller bekrefte.
- **Sensor i IBE160 (v1).** Sensor kloner repoet, starter appen lokalt etter README og vurderer den med testbrukerne og testdataene. Første møte med appen skal derfor gi mening uten forklaring utenfor README.

## Product Purpose

LocalFix gir et lokalmiljø ett felles, synlig sted å melde fra om problemer som søppel, ødelagte gatelys, hull i veien og farlige fortau. Brukeren kan se om noen alt har meldt det samme, bekrefte det med ett trykk og følge statusen fra **Ny** via **Under behandling** til **Løst**. Målet er at kunnskapen ikke blir sittende hos hver enkelt, og at ingen skal føle at de «roper i tomrommet».

V1 lykkes når kjerneflyten virker: registrere med eller uten bilde, bekrefte én gang, moderere status og skjuling, og filtrere og sortere riktig på testdataene (PRD §10).

## Positioning

FixMyStreet, SeeClickFix, FiksGataMi og kommunale «Meld feil»-portaler går fra borger til kommune. LocalFix går fra nabo til nabo og har ingen kommuneintegrasjon i v1. Forskjellen er en én-trykks «Jeg har også sett dette» som teller og sorterer lista, i en lokal og moderert flyt. Telleren «har sett dette» viser rapportøren pluss bekreftelsene, så en ny rapport viser 1.

## Operating Context

- Brukes mest på mobil, ute, i farten. Også nettbrett og desktop.
- Registrering: beskrivelse, lokasjon som fritekst (et sted, ikke en privatadresse), kategori og valgfritt bilde. KI foreslår kategori og en kort oppsummering før innsending, og brukeren kan alltid overstyre.
- Moderatoren gjør alt fra lista og detaljsiden. Det finnes ingen egen administrasjonsside.
- V1 kjøres bare lokalt med testdata (Docker og lokal Supabase), og KI går i mock-modus når ingen nøkkel er satt.

## Capabilities and Constraints

- Overflater: rapportliste med filter og sortering (forside), detaljside med bekreftelse og moderatorkontroller, skjema for ny rapport med KI-forslag, innlogging og registrering. Ingen profilside.
- Faste kategorier: Søppel, Belysning, Vei og fortau, Skadeverk og Annet. Status: Ny, Under behandling og Løst, ett steg om gangen og bare av moderator.
- Filtre: kategori, status og «Mine rapporter» (bare innlogget). Sortering etter nyeste eller flest bekreftelser.
- En bekreftelse kan ikke angres, og rapportøren kan ikke bekrefte sin egen rapport. Et problem som kommer tilbake etter **Løst**, meldes som en ny rapport.
- Lengder: beskrivelse opptil 1000 tegn, lokasjon opptil 200 og oppsummering opptil 300. Bilder opptil 5 MB som JPEG, PNG eller WebP.
- Ute av v1: kart, varsler, sanntid, chat, betaling, native apper, kommuneintegrasjon, redigering og sletting av rapporter og sletting av konto.
- Stack: Next.js 16, React 19, Tailwind 3.4 og shadcn/ui, med Supabase lokalt. PWA-manifest.
- Uavklart: KI-leverandøren (velges med SM-5-testen i Story 2.5) og hvem moderatoren er i praksis.

## Brand Commitments

- Navnet er **LocalFix**, med undertittelen «Campus Molde».
- Språket er norsk bokmål i hele appen.
- Stemmen er kort, vennlig og saklig, med du-form. Ingen utropstegn og ingen emoji, bortsett fra ✓ i bekreftet-tilstanden.
- LocalFix skal føles som et pålitelig verktøy, ikke en sosial app. Poeng, merker og «toppbidragsytere» er avvist.
- Det visuelle uttrykket står i `docs/ux/DESIGN.md` og hører ikke hjemme her.

## Evidence on Hand

- Testdata i `supabase/seed.sql`: fem testkontoer (én moderator) og ni rapporter i alle kategorier og statuser, der én er skjult. Tre testbilder i `supabase/seed-images/`.
- Skisser i `docs/ux/mockups/`.
- Det finnes ingen ekte brukere, sitater, tall eller bilder fra drift. Brukerresearchen bygger nesten bare på utenlandske kilder. Ingenting av dette skal diktes opp.

## Product Principles

1. **Raskt å melde, enda raskere å bekrefte.** Det skal ta under ett minutt å finne ut om noe er meldt og bekrefte det.
2. **Synlig oppfølging.** Status og «sist oppdatert» skal alltid vises, så brukeren ser at noen følger opp.
3. **Anonymt og varsomt.** Rapporter og bekreftelser vises uten navn, og skjemaet minner om å unngå ansikter, bilskilt og personopplysninger.
4. **KI hjelper, men bestemmer ikke.** Forslaget kan alltid overstyres, og registreringen virker uten KI.
5. **Rolig verktøy, ikke sosialt medium.**

## Accessibility & Inclusion

WCAG 2.2 AA (NFR-8). Kontrollen er at kjerneflyten ikke gir alvorlige eller kritiske funn i axe, og at hele kjerneflyten kan gjennomføres med bare tastatur. Kjerneflyten skal virke uten horisontal scrolling fra 360 px bredde (NFR-1), og trykkflater er minst 44 px.
