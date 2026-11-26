# Epic 3 Context: Finne rapporter og si «jeg har også sett dette»

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Brukeren finner raskt ut om noen allerede har meldt et problem: lista filtreres på kategori og status og sorteres på «Nyeste» eller «Flest har sett». Innloggede finner sine egne rapporter med «Mine rapporter» og bekrefter andres rapporter én gang, slik at moderatoren ser hvor mange problemet gjelder og rapporten klatrer i lista.

## Stories

- Story 3.1: Filtrere og sortere lista
- Story 3.2: «Mine rapporter»
- Story 3.3: Bekrefte en rapport

## Requirements & Constraints

- **Filtrering og sortering:** Én kategori og én status kan være aktive samtidig, og «Mine rapporter» kan kombineres med dem. Sorteringen er «Nyeste» (`created_at DESC, id DESC`, standard) eller «Flest har sett» (`confirmation_count DESC, created_at DESC, id DESC`). Filtrene beholdes når sorteringen endres, og omvendt.
- **Tilstanden bor i URL-en** med kodeverdiene (`category`, `status`, `mine`, `sort`), så en deling eller en omlasting gir samme visning. Ukjente verdier ignoreres: feil store og små bokstaver, gjentatt nøkkel, tom verdi og ukjent sortering gir lista uten den verdien.
- **Tomtilstander:** «Ingen rapporter matcher filteret.» med «Nullstill filter» (fjerner kategori, status og `mine`, beholder sorteringen), «Du har ingen rapporter å vise.» med «Registrer problem», og den eksisterende tomme databasen.
- **Bekreftelse:** En bruker bekrefter en annens rapport én gang. Egen rapport, skjult rapport og dobbel bekreftelse avvises, og en bekreftelse på en løst rapport endrer ikke statusen. Telleren «N har sett dette» øker med én med en gang og erstattes av serverens `seen_count`.
- **Måling og tilgjengelighet:** Hver kombinasjon av kategori, status og sortering (og «Mine rapporter») skal gi forventet antall og rekkefølge i en tabelldrevet test, med en håndskrevet fasit over seed-rapportene og ikke den samme spørringen som appen bruker (SM-4). Ingen horisontal scrolling på 360 px, og axe gir ingen `serious` eller `critical` på lista med aktive filtre og tomtilstander. Kjerneflyten kan gjøres bare med tastatur.
- **Ferdig (hver story):** issue, egen branch, PR med `Closes #N`, Vitest, pgTAP og Playwright grønne, lint uten feil, og testsammendrag med kjøretid i PR-en. Siste story (3.3) krever også at README er fulgt på en ny klone (SM-7).

## Technical Decisions

- **`lib/list-params.ts` er eneste tolkning av filter-URL-en:** `parseListParams(searchParams, isSignedIn)` (Zod) gir `{ category?, status?, mine, sort }`, og `buildListHref` lager lenkene. Spørringen, brikkene, `aria-pressed`, tomtilstandene og lenkene bygges bare fra resultatet. `mine` er `false` for en besøkende.
- **Filtrering skjer i databasen, via visningen `reports_with_counts`,** lest med brukerens sesjon (`security_invoker`). Visningen har `confirmation_count`, `seen_count`, `confirmed_by_me` og `authored_by_me`. «Mine rapporter» bruker `authored_by_me`, aldri en sammenligning i TypeScript. RLS skjuler skjulte rapporter, så det filtreres aldri på `hidden` i appen.
- **Ingen mellomlagring:** sidene er `force-dynamic`, og alle endringer kaller `revalidatePath` for lista og detaljsiden. Lista henter høyst 500 rader.
- **Server Actions** svarer `{ ok, data | error }` med feilkoder fra `lib/errors.ts`. Rapporttekst og e-postadresser logges aldri.
- **Bekreftelse:** `confirmReport(reportId)` kjører `requireUser` først, validerer uuid med Zod og leser raden fra visningen for å gi riktig feilmelding, og setter inn med brukerens sesjon. Databasen håndhever reglene (RLS og unik nøkkel), ikke bare appen.

## UX & Interaction Patterns

- **Brikkerad over kortene** som rulles sideveis inne i seg selv: «Mine rapporter» (bare innloggede, først), «Alle», de fem kategoriene og de tre statusene. Brikkene er knapper med `aria-pressed`. «Alle» nullstiller kategori og status, et nytt trykk på en aktiv brikke slår den av, og en annen kategori eller status bytter den ut. Aktiv brikke er Fjordblå med `rounded-full`, inaktiv har kantlinje på hvit bakgrunn.
- **Sortering** er en shadcn-`Select` til høyre over brikkene.
- **Bekreftknappen** på detaljsiden har fire tilstander: «Jeg har også sett dette», «Din rapport», «Du har sett dette ✓» og «Skjult rapport», de tre siste deaktivert. Fokus må ikke forsvinne etter trykk. En feil gir en toast, og telleren går tilbake. Språket er du-form uten utropstegn.

## Cross-Story Dependencies

- Story 3.2 bygger på `parseListParams`, `buildListHref`, brikkeraden og den tabelldrevne testen fra 3.1, og legger til «Mine rapporter» og `mine=true`. Parseren og brikkene i 3.1 må derfor gjøre plass til `mine` uten å bli skrevet om.
- Story 3.3 endrer `confirmation_count`, som sorteringen «Flest har sett» leser, og trenger at lista revalideres.
- Story 3.1 trenger ingen migrering eller nye seed-data: seed har allerede minst to synlige rapporter med like mange bekreftelser (rapport 1 og 2 med to, rapport 3 og 6 med én).
