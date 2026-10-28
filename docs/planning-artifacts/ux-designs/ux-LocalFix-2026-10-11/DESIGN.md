---
name: LocalFix
description: Rolig og saklig app for å melde og følge opp problemer på campus Molde. Bygget med shadcn/ui på Next.js og Tailwind. Denne filen beskriver bare merkevarelaget, altså det som avviker fra standardoppsettet i shadcn.
status: final
created: 2026-10-11
updated: 2026-10-11
sources:
  - docs/product-brief.md
  - docs/prd.md
colors:
  # Overstyringer av shadcn-standardene. Alle tokens som ikke er nevnt her (card, popover,
  # input, ring, destructive, muted), arver fra shadcn. Bare lys modus i v1.
  primary: '#1F4E79'
  primary-foreground: '#FFFFFF'
  background: '#F5F7FA'
  surface: '#FFFFFF'
  foreground: '#17212B'
  muted-foreground: '#5B6773'
  border: '#DCE2E8'
  status-new-bg: '#E3EEF9'
  status-new-fg: '#1F4E79'
  status-progress-bg: '#FFF1D6'
  status-progress-fg: '#7A4B00'
  status-done-bg: '#E2F3E6'
  status-done-fg: '#1E6B34'
  hidden-bg: '#EEF0F2'
  hidden-fg: '#5B6773'
typography:
  # Systemfont via shadcn/Tailwinds sans-stack. Ingen egen merkefont.
  title:
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.3'
  card-title:
    fontSize: 15px
    fontWeight: '600'
    lineHeight: '1.35'
  body:
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  meta:
    fontSize: 13px
    fontWeight: '400'
    lineHeight: '1.4'
  badge:
    fontSize: 12px
    fontWeight: '600'
rounded:
  sm: 6px
  md: 8px
  lg: 12px
  full: 9999px
spacing:
  # Tailwinds 4-baserte skala arves. Navngitte unntak:
  gutter-mobile: 16px
  touch-min: 44px
  content-max: 640px
components:
  button-primary:
    background: '{colors.primary}'
    foreground: '{colors.primary-foreground}'
    radius: '{rounded.md}'
    minHeight: '{spacing.touch-min}'
  button-confirm:
    background: '{colors.surface}'
    foreground: '{colors.primary}'
    border: '1px solid {colors.primary}'
    radius: '{rounded.md}'
    minHeight: '{spacing.touch-min}'
  button-confirm-done:
    background: '{colors.status-new-bg}'
    foreground: '{colors.primary}'
    border: 'none'
  fab-register:
    background: '{colors.primary}'
    foreground: '{colors.primary-foreground}'
    radius: '{rounded.full}'
    size: 56px
  report-card:
    background: '{colors.surface}'
    border: '1px solid {colors.border}'
    radius: '{rounded.lg}'
  status-badge-new:
    background: '{colors.status-new-bg}'
    foreground: '{colors.status-new-fg}'
    radius: '{rounded.full}'
  status-badge-progress:
    background: '{colors.status-progress-bg}'
    foreground: '{colors.status-progress-fg}'
    radius: '{rounded.full}'
  status-badge-done:
    background: '{colors.status-done-bg}'
    foreground: '{colors.status-done-fg}'
    radius: '{rounded.full}'
  ai-tag:
    background: '{colors.status-new-bg}'
    foreground: '{colors.primary}'
    radius: '{rounded.full}'
  filter-chip-active:
    background: '{colors.primary}'
    foreground: '{colors.primary-foreground}'
    radius: '{rounded.full}'
---

## Brand & Style

LocalFix skal føles som et pålitelig verktøy, ikke som en sosial app. Uttrykket er rolig og saklig, med mye luft, én merkefarge og nøytrale gråtoner. Fargen Fjordblå knytter appen til Molde uten å bli pyntete.

Grunnlaget er shadcn/ui. Denne filen beskriver bare det som skiller seg fra standardoppsettet: merkefarge, bakgrunn, statusfarger og et lite sett egne komponenter. Komponentene Button, Card, Input, Textarea, Select, Badge, Dialog, Sheet, DropdownMenu, Toast (Sonner) og Skeleton brukes slik shadcn leverer dem.

## Colors

- **Fjordblå (`{colors.primary}` #1F4E79)** er merkefargen og handlingsfargen. Den brukes på primærknapper, den flytende «+»-knappen, aktivt filter, lenker og topplinjen. Den brukes ikke som dekor.
- **Bakgrunn (`{colors.background}` #F5F7FA)** er den svakt kjølige flaten under innholdet. Kort og skjema ligger på hvit flate (`{colors.surface}`).
- **Tekst (`{colors.foreground}` #17212B og `{colors.muted-foreground}` #5B6773)** brukes til brødtekst og metadata, som kategori, tid og antall bekreftelser.
- **Statusfarger** finnes bare på statusmerker og betyr alltid det samme:
  - **Ny:** blå (`{colors.status-new-bg}` / `{colors.status-new-fg}`)
  - **Under behandling:** gul (`{colors.status-progress-bg}` / `{colors.status-progress-fg}`)
  - **Løst:** grønn (`{colors.status-done-bg}` / `{colors.status-done-fg}`)
- **Skjult (`{colors.hidden-bg}` / `{colors.hidden-fg}`)** er en grå merking som bare moderator ser.
- **Feil** bruker shadcns `destructive`.

Alle tekstfarger møter WCAG AA mot bakgrunnen de står på [ASSUMPTION: må verifiseres med en kontrastsjekker under implementering].

## Typography

Systemfont via shadcn. Det er ingen egen merkefont, fordi det holder uttrykket saklig og sidene lette å laste på mobil.

| Rolle | Bruk |
|---|---|
| `{typography.title}` | Sidetittel, for eksempel «Rapporter» eller «Ny rapport» |
| `{typography.card-title}` | Oppsummering eller beskrivelse i rapportkortet |
| `{typography.body}` | Skjemafelt og brødtekst. 16 px hindrer at iOS zoomer inn i feltene. |
| `{typography.meta}` | Kategori, tid og «5 har sett dette» |
| `{typography.badge}` | Statusmerker og merkelappen «Foreslått av KI» |

## Layout & Spacing

Designet er mobile-first med én kolonne. Sidemargen er `{spacing.gutter-mobile}`, og innholdet er maks `{spacing.content-max}` bredt, sentrert på nettbrett og desktop. Alle trykkflater er minst `{spacing.touch-min}` høye. Resten av avstandene følger Tailwinds skala med steg på 4 px, der 8, 12, 16 og 24 px brukes mest.

## Elevation & Depth

Skygger arves fra shadcn. Den eneste egne skyggen ligger på den flytende «+»-knappen (`{components.fab-register}`), så den skiller seg ut fra lista under. Kortene bruker kantlinje, ikke skygge.

## Shapes

- `{rounded.sm}` (6 px) på inndatafelt
- `{rounded.md}` (8 px) på knapper
- `{rounded.lg}` (12 px) på rapportkort og bildeforhåndsvisning
- `{rounded.full}` bare på statusmerker, filterbrikker, merkelappen «Foreslått av KI» og den flytende knappen

## Components

- **Rapportkort (`{components.report-card}`):** Øverste linje har kategori til venstre og statusmerke til høyre. Under kommer oppsummeringen (eller beskrivelsen, hvis KI ikke har laget oppsummering) i `{typography.card-title}`, maks to linjer. Nederst står metadata: «5 har sett dette · 2 dager siden». Det kommer et lite miniatyrbilde til høyre hvis rapporten har bilde [ASSUMPTION].
- **Statusmerke:** Bruker `{components.status-badge-new}`, `-progress` og `-done`. Teksten skrives alltid ut, så fargen er aldri eneste bærer av status.
- **Primærknapp (`{components.button-primary}`):** Brukes til «Send inn» og «Logg inn».
- **Bekreftknapp (`{components.button-confirm}`):** «Jeg har også sett dette». Den har kantlinje i normaltilstand. Når brukeren har bekreftet, bytter den til `{components.button-confirm-done}` med teksten «Du har sett dette ✓» og blir deaktivert.
- **Flytende «+»-knapp (`{components.fab-register}`):** Rund knapp på 56 px nede til høyre på rapportlista. Ikonet er «+» og tilgjengelig navn er «Registrer problem».
- **Merkelappen «Foreslått av KI» (`{components.ai-tag}`):** En liten pille ved siden av kategorivalget. Den forsvinner når brukeren endrer kategori selv.
- **Filterbrikker:** Vannrett rad som kan rulles sideveis. Aktiv brikke bruker `{components.filter-chip-active}`, inaktiv har kantlinje på hvit bakgrunn.
- **Moderatorpanel:** Et shadcn-`Card` nederst på detaljsiden, synlig bare for moderator. Det har to knapper for status («← Ny» og «Løst →», merket med nabostatusene) og en skjul-knapp i `outline`-variant.

## Do's and Don'ts

| Gjør | Ikke gjør |
|---|---|
| Bruk Fjordblå bare på handlinger og navigasjon | Bruk statusfargene til noe annet enn status |
| Skriv statusteksten i merket | La fargen alene vise status |
| Hold én kolonne og maks 640 px innholdsbredde | Lag tabeller eller flere kolonner på desktop |
| Bruk shadcn-komponentene som de er | Lag egne varianter av Button, Input eller Dialog |
| Gjør trykkflater minst 44 px høye | Lag små tekstlenker som eneste vei til en handling |
