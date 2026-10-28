# Addendum: LocalFix

## Sammenlignbare løsninger (research)

- FixMyStreet
- SeeClickFix
- FiksGataMi
- Norske «Meld feil»-portaler (kommunale)

Felles for disse: borger-til-kommune-fokus — rapportering går til en offentlig saksbehandlingskø, ikke til naboer. LocalFix sitt naboskap-til-naboskap-fokus i v1 (uten kommuneintegrasjon) er identifisert som reell differensiator mot dette landskapet.

## Kjente fallgruver identifisert i research

- **Rapport-utmattelse:** status blir stående uten oppdatering, brukere slutter å stole på systemet
- **Duplikater/spam:** samme problem rapportert flere ganger uten deduplisering
- **«Roper i tomrommet»:** brukere mister tillit hvis rapporter aldri fører til at noe blir løst

Denne informasjonen er kilden til differensieringspunktet i brief'ens «Hva gjør dette annerledes», og kan være nyttig bakgrunn for PRD-arbeidet — særlig ved vurdering av dedupliseringsmekanismer og hvordan statusoppdatering håndheves.

## Parkert for senere versjoner

- **Duplikatsjekk:** før en ny rapport lagres, foreslår appen eksisterende rapporter med samme kategori og adresse. Faglæreren foreslo dette, og det svarer direkte på fallgruven med duplikater. Det er ikke med i v1, fordi bekreftelser og sortering etter antall bekreftelser dekker det viktigste. Det er en naturlig første utvidelse hvis det blir tid til overs.

## Grunnlag for KI-testsettet (til PRD)

- 20 korte beskrivelser, fordelt på kategoriene Søppel, Belysning, Vei og fortau, Skadeverk og Annet, hver med riktig kategori som fasit.
- Målet er minst 16 av 20 riktige. Testsettet ligger i repoet, slik at det kan kjøres på nytt når prompten endres.
- Ugyldige eller tomme svar fra språkmodellen behandles som «ingen forslag», og da velger brukeren kategori manuelt.
