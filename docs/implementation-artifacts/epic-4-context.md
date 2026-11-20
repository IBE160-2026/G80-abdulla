# Epic 4 Context: Moderator følger opp sakene

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Moderatoren følger opp rapportene: hen flytter statusen ett steg om gangen (Ny ↔ Under behandling ↔ Løst), og alle ser den nye statusen og «sist oppdatert» neste gang de laster siden. Moderatoren kan skjule en rapport, for eksempel med et lesbart bilskilt, og vise den igjen, uten at noe slettes. Alle andre enn moderatoren avvises, også når de går rett på API-et. Epicen fullfører kjerneflyten (UJ-3), så kjerneflyttesten går hele veien, og avslutter med at sensor kan starte og teste appen bare ved å følge README. Ingenting i epicen kan kuttes hvis tiden blir knapp.

## Stories

- Story 4.1: Endre status
- Story 4.2: Skjule og vise en rapport
- Story 4.3: Sensor kan starte og vurdere appen

## Requirements & Constraints

- **Statusflyt:** kodeverdiene er `new`, `in_progress` og `resolved`, og enum-rekkefølgen er en del av kontrakten. Bare ett steg om gangen, fram eller tilbake. Hopp mellom Ny og Løst avvises med `invalid_status_step`. En skjult rapport kan få ny status, og status og skjuling kan endres i samme oppdatering.
- **«Sist oppdatert»** er `status_changed_at`, vist som dato og klokkeslett i norsk tid («Sist oppdatert 4. november kl. 14:20»). Den flyttes bare når statusen endres, aldri ved skjuling, og kan ikke settes av noen klient. En rapport som aldri har fått ny status, viser registreringstidspunktet.
- **Skjuling:** en skjult rapport forsvinner fra lista, «Mine rapporter» og detaljsiden for alle andre enn moderatoren, også rapportøren, og en direkte lenke gir 404-siden «Fant ikke rapporten.». Rapportøren får ingen melding. Bildet kan ikke hentes, og allerede utstedte signerte lenker lever til de utløper etter 60 sekunder. Å skjule en skjult rapport er lov og endrer ingenting. Ingenting slettes.
- **Tilgang (FR-2, NFR-4):** en vanlig bruker får `42501` (403) ved statusendring og skjuling, også på egen rapport. Via REST gir en besøkende 401 og en vanlig bruker 403. Grensesnittet er aldri eneste kontroll.
- **Ingen sanntid:** andre ser endringen ved neste innlasting.
- **Tester per story:** pgTAP med `tests.as_user` og `tests.as_anon` for hver regel (steg, hopp, 42501, `status_changed_at` flyttes eller står stille, idempotent skjuling), Vitest-skriptet mot REST-grensen (401 og 403), og Playwright i `e2e/` på 360×800 og 1280×800. axe skal gi null `serious` eller `critical` på detaljsiden med panelet, lista med en skjult rapport, detaljsiden for en skjult rapport og den åpne `AlertDialog`-en. En e2e-test dekker UJ-3: rapportøren ser **Løst** under «Mine rapporter» og «Sist oppdatert» på detaljsiden.
- **Kjerneflyttesten** (`e2e/core-flow.spec.ts`) utvides bare med tastatur: moderatoren logger inn, sorterer på «Flest har sett», flytter status og skjuler (også bekreftelsen i dialogen) på rapporten testen selv registrerte i samme kjøring. Etter 4.2 går hele flyten. Ingen `skip` eller `fixme`.
- **Story 4.3 (SM-7, NFR-2):** README blir komplett (Docker Desktop først, versjoner, kopierbare kommandoer, testbrukere med passord og `moderator@localfix.test`, SQL-setningen som gjør en bruker til moderator, testkommandoene, skjermbilde, mock-modus og hvordan en ekte KI-leverandør slås på uten nøkler i repoet, og at v1 bare bruker oppdiktede testdata). Den følges på en ny klone i en tom mappe, og alt som ikke virker, rettes. I tillegg en tabell fra FR-1–FR-9, NFR-1–NFR-8 og SM-1–SM-7 til testene (og det som er sjekket for hånd), og en lenke til et skjermopptak av kjerneflyten under 3 minutter.
- **Ferdig (hver story):** issue, egen branch, PR med `Closes #N`, alle testene og `npm run lint` grønne, og testsammendraget (bestått og axe-funn) i PR-beskrivelsen.

## Technical Decisions

- **Databasen eier reglene.** UPDATE-policyen på `reports` har `USING` for rader brukeren kan se og `WITH CHECK (private.is_moderator())`. `authenticated` får bare `GRANT UPDATE (status, hidden)`, ikke `status_changed_at`. Ingen DELETE-grant. Moderator er bare `private.is_moderator()` (rollen fra `profiles`, aldri fra JWT eller metadata).
- **Triggeren `reports_guard_update`** kjører først: `42501` for ikke-moderatorer (gir 403, ikke en stille 0-rader-oppdatering), så `invalid_column_change` hvis noe annet enn `status` og `hidden` er endret (sammenlign `to_jsonb(NEW)` og `to_jsonb(OLD)` uten de to kolonnene), så `invalid_status_step` hvis forskjellen i enum-rekkefølge ikke er nøyaktig 1. Uendret status er lov. Ved gyldig statusendring settes `NEW.status_changed_at := now()`. Egne feil kastes med `ERRCODE = 'P0001'` og koden i `MESSAGE`.
- **Server Actions i `features/moderering/actions.ts`:** `setReportStatus(reportId, from, to)` og `setReportHidden(reportId, hidden)` med eksplisitt målverdi, aldri veksling. `reportId` valideres som uuid med Zod (ugyldig gir `validation_failed`). Statusoppdateringen bruker `WHERE id = $1 AND status = $2`, og null rader på en rad som finnes gir `stale_state`. Sjekk både `error` og antall rader. Svaret er `{ ok, data | error }`, feil oversettes i `shared/lib/errors.ts` uten databasetekst, og handlingen kaller `revalidatePath` for lista og detaljsiden. Brukerens egen sesjon, aldri tjenestenøkkelen.
- **Synlighet:** appen filtrerer aldri på `hidden`. RLS (og Storage-policyen, som sjekker `hidden` selv) avgjør hva som vises. Lista og detaljsiden leser fra `reports_with_counts`, skriving går mot `reports`. Sidene er `force-dynamic`, uten noen form for cache, så en moderators visning aldri serveres til andre.
- **Vertical slices (AD-16):** moderatorpanelet, knappene, dialogen og handlingene ligger i den nye sliceen `features/moderering/`. Den importerer bare fra seg selv og `shared/`, aldri fra `features/rapporter` eller `app/`. Detaljsiden i `features/rapporter` tar innhold fra andre slices som slot, så bare ruten i `app/` setter panelet inn og gir det status, `hidden` og `isModerator` fra `getViewer()`. Merkingen «Skjult» i lista og på detaljsiden hører til `rapporter`. Brukes noe av det av mer enn én slice (for eksempel et «Skjult»-merke), flyttes det til `shared/report/`. `no-restricted-imports` og `shared/lib/slices.test.ts` stopper brudd.
- **Visningsnavn og datoer:** norske statusnavn bare fra `shared/report/labels.ts`, datoer bare fra `shared/lib/format.ts`. Rapporttekst og e-postadresser logges aldri.

## UX & Interaction Patterns

- **Moderatorpanel:** et shadcn-`Card` nederst på detaljsiden, bare for moderatoren. Det viser nåværende status og bare knapper til nabostatusene: Ny gir «Under behandling →», Under behandling gir «← Ny» og «Løst →», Løst gir «← Under behandling». Skjul-knappen er `outline` og blir «Vis rapport» når rapporten er skjult.
- **Skjuling bekreftes** i en shadcn-`AlertDialog`, og rapporten skjules først når moderatoren bekrefter. «Vis rapport» trenger ingen bekreftelse.
- **Under lagring** er knappene deaktivert. Etter statusendring står fokus på det nye statusmerket eller første statusknapp, etter skjuling på «Vis rapport» og etter visning på «Skjul rapport», aldri på `body`.
- **Feil:** `stale_state` og `forbidden` gir en toast med meldingen fra `shared/lib/errors.ts`, og siden viser statusen som gjelder nå. Ved `forbidden` er teksten «Du har ikke tilgang til dette.».
- **Skjult for moderatoren:** rapporten står blandet inn i lista med grå merkelapp «Skjult» og grå bakgrunn (`hidden-bg` #EEF0F2, `hidden-fg` #5B6773), og detaljsiden har samme merking. Status vises alltid som tekst, ikke bare farge.
- **Felles:** trykkflater minst 44×44 px, ingen horisontal scrolling på 360 px og 320 px, du-form uten utropstegn.

## Cross-Story Dependencies

- `private.is_moderator()`, SELECT-policyene med `hidden = false OR is_moderator()`, Storage-policyen og `status_changed_at` finnes fra Epic 1. Story 4.1 legger til UPDATE-policyen, kolonnegranten og triggeren, og migreringen dekker også skjuling, så 4.2 trenger ingen ny regel i databasen, bare tester, handling og grensesnitt.
- Story 4.2 bygger på panelet, slot-oppsettet i `app/` og mønsteret for handlinger fra 4.1. Teksten «Skjult rapport» på bekreftknappen finnes fra Story 3.3.
- UJ-3-testen i 4.1 trenger «Mine rapporter» (3.2) og sorteringen «Flest har sett» (3.1).
- Teksten for `forbidden` i `shared/lib/errors.ts` ble endret i Story 4.1 til «Du har ikke tilgang til dette.», som UX-en krever, og testene som leser den, ble oppdatert.
- Story 4.3 forutsetter at 4.1 og 4.2 er ferdige og kjerneflyttesten er komplett. Den endrer ingen regler.
