---
title: LocalFix Product Brief
status: final
created: 2026-09-18
updated: 2026-09-18
---

# Product Brief: LocalFix

## Sammendrag

LocalFix er en nettbasert løsning der innbyggere i et lokalmiljø — nabolag, by eller campus — kan registrere og dele problemer de observerer i nærmiljøet, som søppel, ødelagte gatelys, hull i veien eller farlige fortau. Andre brukere kan se rapportene, bekrefte at de har sett det samme problemet og følge statusen fram til det er løst.

LocalFix fyller et konkret hull i nabolagskommunikasjonen (se Problemet) ved å gi nærmiljøet et felles, synlig sted for denne typen rapportering — uten å være avhengig av at kommunen er involvert.

## Problemet

I dag finnes det ingen enkel, samlet måte for innbyggere å dele informasjon om lokale problemer med naboer. Folk vet ikke om andre allerede har rapportert samme problem, eller om noe blir gjort med det. Resultatet er at kunnskap om problemer i nærmiljøet blir værende hos enkeltpersoner, i stedet for å samles et sted der naboer kan se og bekrefte hverandres observasjoner.

## Løsningen

LocalFix gir naboer én delt kjerneopplevelse: registrere et problem, se hva andre allerede har rapportert, bekrefte at man har sett det samme og følge det gjennom en enkel status fram til det er løst. KI foreslår kategori og oppsummering automatisk ut fra beskrivelsen brukeren skriver, slik at rapportering tar sekunder. Full funksjonsliste: se Omfang.

## Hva gjør dette annerledes

Sammenlignbare løsninger er i all hovedsak bygget for kommunikasjon fra borger til kommune (se `addendum.md` for detaljer). LocalFix sitt naboskap-til-naboskap-fokus — uten kommuneintegrasjon i v1 — er en reell differensiator: verdien ligger i at naboer ser og bekrefter hverandres observasjoner, ikke i en saksbehandlingskø mot en offentlig etat.

Kjente fallgruver fra disse sammenlignbare løsningene (rapport-utmattelse når status blir stående, duplikater/spam, og at brukere opplever å «rope i tomrommet» hvis ingenting blir løst) er tatt med som bevisste hensyn i MVP-scopet, blant annet gjennom den eksplisitte statusflyten og bekreftelsesfunksjonen.

## Hvem dette er for

Innbyggere i et lokalmiljø som ønsker oversikt over problemer rundt seg — naboer, ikke saksbehandlere. Løsningen retter seg ikke mot kommunen i denne versjonen.

## Omfang

**I omfang (v1 / MVP):**
- Registrere en rapport (bilde, kategori, kort beskrivelse, lokasjon som tekst/adresse)
- Se liste over alle rapporter
- Markere «jeg har også sett dette» på en eksisterende rapport
- Statusflyt: Ny → Under behandling → Løst
- KI-funksjon: foreslå kategori automatisk og generere kort oppsummering av rapporten basert på beskrivelsen

**Ikke i omfang (v1):**
- Betalingsløsning
- Integrasjon mot kommunesystemer
- Avansert kartvisning (enkel liste/punktvisning er nok)
- Chat/meldinger mellom brukere
- Native mobil-/desktop-apper (kun responsiv webapp/PWA)

## Suksesskriterier

- Bruker kan registrere en rapport og se den i listen
- Annen bruker kan bekrefte og se statusendringer
- KI foreslår kategori/oppsummering korrekt i de fleste tilfeller
- Løsningen fungerer godt på desktop, iPad og mobil
- Løsningen er stabil nok til demonstrasjon i mappekravet

## Teknisk retning

Fullstack, responsiv webapp (PWA) bygget med Next.js (React) for frontend og API routes for backend, med Supabase som database og bildelagring. Én kodebase, mobile-first design som fungerer på desktop, nettbrett og mobil gjennom nettleseren. Mot slutten av prosjektet legges det til PWA-manifest slik at appen kan «installeres» på hjemskjermen. Realistisk å bygge alene med KI-assistert utvikling i løpet av ett semester.
