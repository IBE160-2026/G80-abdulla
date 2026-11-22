# Epic 4 Context: Moderator følger opp sakene

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Moderatoren følger opp rapportene: hen flytter statusen ett steg om gangen (Ny ↔ Under behandling ↔ Løst), og alle ser ny status og «Sist oppdatert» ved neste innlasting. Moderatoren kan skjule en rapport (for eksempel med et lesbart bilskilt) og vise den igjen, uten at noe slettes, og alle andre avvises, også direkte mot API-et. Epicen fullfører kjerneflyten (UJ-3), og avslutter med at en sensor som ikke kjenner prosjektet, kan starte appen, kjøre alle testene og se hvordan hvert krav er testet bare ved å følge README på en ren maskin (SM-7). Ingenting i epicen står på lista over det som kan forenkles hvis tiden blir knapp.

## Stories

- Story 4.1: Endre status
- Story 4.2: Skjule og vise en rapport
- Story 4.3: Sensor kan starte og vurdere appen

## Requirements & Constraints

- **Statusflyt:** kodeverdiene er `new`, `in_progress`, `resolved`, og enum-rekkefølgen er kontrakt. Bare ett steg fram eller tilbake. Hopp gir `invalid_status_step`. Status og skjuling kan endres i samme oppdatering og på skjulte rapporter. Ingen sanntid: andre ser endringen ved neste innlasting.
- **«Sist oppdatert»** er `status_changed_at`, vist som dato og klokkeslett i norsk tid. Flyttes bare ved statusendring, aldri ved skjuling, og kan ikke settes av klienten. Aldri endret status gir registreringstidspunktet.
- **Skjuling:** en skjult rapport er borte fra lista, «Mine rapporter» og detaljsiden for alle andre enn moderatoren, også rapportøren, som ikke får melding. Direkte lenke gir 404 «Fant ikke rapporten.». Bildet kan ikke hentes, men allerede utstedte signerte lenker lever i opptil 60 sekunder. Å skjule en skjult rapport er lov og endrer ingenting. Ingenting slettes.
- **Tilgang:** vanlig bruker får `42501` (403) ved statusendring og skjuling, også på egen rapport. Via REST gir besøkende 401 og bruker 403. Grensesnittet er aldri eneste kontroll.
- **README (sensor):** Docker Desktop først; forutsetninger med versjoner (Node 24 LTS, Supabase CLI via `npx supabase`); kopierbare kommandoer inkludert `npx playwright install chromium`; testbrukere med passord og `moderator@localfix.test`; SQL-setningen som gjør en bruker til moderator (rolle settes bare med SQL som `postgres`, ingen admin-side); alle testkommandoene; et skjermbilde. Den sier at v1 bare kjører lokalt med oppdiktede testdata og ikke behandler personopplysninger, og forklarer mock-modus og hvordan en ekte KI-leverandør slås på i `.env` uten nøkler i repoet (NFR-2, NFR-3, NFR-7).
- **Ren klone:** README følges steg for steg i en tom mappe uten `.env` og uten installerte avhengigheter. Appen starter, seed-dataene vises og alle testkommandoene består. Alt som måtte rettes, rettes i README, og resultatet står i PR-beskrivelsen.
- **Testene som må bestå:** Playwright i `e2e/`, pgTAP, Vitest, REST-testene og ytelsestesten (100 rapporter under 2 s, NFR-6). axe gir null `serious`/`critical` i alle tilstandene som skannes (se Technical Decisions). Ingen `skip` eller `fixme`.
- **Dekningstabell:** i README eller en fil README lenker til, som viser hvilken test som dekker hvert av FR-1–FR-9, NFR-1–NFR-8 og SM-1–SM-7, og hva som er sjekket for hånd.
- **Reserve uten Docker:** README lenker til et skjermopptak av kjerneflyten, under 3 minutter.
- **Ferdig (hver story):** issue, egen branch, PR med `Closes #N`, alle tester og `npm run lint` grønne, ingen horisontal scrolling på 360 og 320 px, og testsammendraget (antall bestått og axe-funn) i PR-beskrivelsen. Endres en regel i PRD/arkitektur/UX, oppdateres dokumentet og beslutningsloggen i samme PR.

## Technical Decisions

- **Databasen eier reglene.** UPDATE-policy på `reports` med `USING` for synlige rader og `WITH CHECK (private.is_moderator())`. `authenticated` har bare `GRANT UPDATE (status, hidden)`, ingen DELETE. Moderator er bare `private.is_moderator()` (rollen fra `profiles`, aldri JWT/metadata).
- **Triggeren `reports_guard_update`:** `42501` for ikke-moderatorer, så `invalid_column_change` hvis noe annet enn `status`/`hidden` er endret, så `invalid_status_step` ved hopp. Gyldig statusendring setter `status_changed_at := now()`. Egne feil kastes med `ERRCODE = 'P0001'` og koden i `MESSAGE`.
- **Server Actions** i `features/moderering/actions.ts`: `setReportStatus(reportId, from, to)` (oppdaterer med `WHERE id AND status = from`, null rader gir `stale_state`) og `setReportHidden(reportId, hidden)` med eksplisitt målverdi. `reportId` valideres som uuid med Zod. Sjekk både `error` og antall rader, svar `{ ok, data | error }`, feil oversettes i `shared/lib/errors.ts` uten databasetekst, og `revalidatePath` for lista og detaljsiden. Alltid brukerens egen sesjon.
- **Synlighet og cache:** appen filtrerer aldri på `hidden`; RLS og Storage-policyen avgjør. Lesing fra `reports_with_counts`, skriving mot `reports`. Sidene er `force-dynamic` uten cache.
- **Vertical slices:** moderatorpanel, dialog og handlinger ligger i `features/moderering/`, som bare importerer fra seg selv og `shared/`. Bare ruten i `app/` setter panelet inn som slot og gir det data fra `getViewer()`. Det flere slices bruker, ligger i `shared/report/`.
- **Testkommandoen** (én, står i README) kjører `npx supabase db reset`, `next build`, `next start` med `AI_PROVIDER=mock`, seriell (`workers: 1`), med to Playwright-prosjekter (360×800 og 1280×800) pluss eget ytelsesprosjekt med en fixture i `e2e/` som aldri rører `seed.sql`. pgTAP kjøres med `npx supabase test db` og hjelperne `tests.as_user`/`tests.as_anon`.
- **axe-tilstander:** lista (besøkende, innlogget med filtre, moderator med skjult rapport, tom, ingen treff), detaljsiden (besøkende, bruker, moderator med panel, skjult rapport, åpen `AlertDialog`), skjemaet (tomt, valideringsfeil, KI-forslag), innlogging og registrering.
- **Kjerneflyttesten** (`e2e/core-flow.spec.ts`) går hele flyten bare med tastatur etter første side: logge inn, filtrere, åpne, bekrefte, registrere, og som moderator sortere på «Flest har sett», endre status og skjule (med bekreftelsen) på rapporten testen selv registrerte. Den sjekker synlig fokus og `scrollWidth <= clientWidth` på 360 px.
- **KI i README:** mock er standard uten nøkkel. Valgt ekte leverandør er Cloudflare Workers AI med `@cf/openai/gpt-oss-20b` via det OpenAI-kompatible endepunktet, slått på med `AI_PROVIDER=openai` og tre variabler (base-URL, modell, nøkkel) i `.env`. Alle variabler står i `.env.example`. SM-5 kjøres på nytt med `npm run eval:sm5`.

## UX & Interaction Patterns

- **Moderatorpanel:** shadcn-`Card` nederst på detaljsiden, bare for moderatoren, med nåværende status og bare nabostatusknapper («Under behandling →», «← Ny» og «Løst →», «← Under behandling»). «Skjul rapport» (`outline`) står på egen rad under statusknappene og blir «Vis rapport» når rapporten er skjult.
- **Skjule-dialog:** `AlertDialog` med tittelen «Skjule rapporten?», teksten «Rapporten blir borte for alle andre, også for den som sendte den inn. Ingenting slettes, og du kan vise den igjen.» og knappene «Avbryt» og «Skjul rapport». Åpner med fokus på «Avbryt», og knappene står i Tab-rekkefølge også på mobil. «Vis rapport» trenger ingen bekreftelse.
- **Fokus og lagring:** under lagring er knappen deaktivert med `aria-disabled`, så den beholder fokus. Etter statusendring står fokus på nytt statusmerke eller første statusknapp, etter skjuling på «Vis rapport», etter visning på «Skjul rapport», og «Avbryt»/Escape gir fokus tilbake til «Skjul rapport». Aldri på `body`.
- **Feil:** `stale_state` og `forbidden` gir toast med meldingen fra `shared/lib/errors.ts` («Du har ikke tilgang til dette.» ved `forbidden`), og siden viser gjeldende status.
- **Skjult for moderatoren:** grå merkelapp «Skjult» med tynn, mørkere grå kant foran statusmerket og grå bakgrunn (`hidden-bg` #EEF0F2, `hidden-fg` #5B6773), både i lista (blandet inn) og på detaljsiden. Status vises alltid som tekst.
- **Felles:** trykkflater minst 44×44 px, ingen horisontal scrolling, du-form uten utropstegn.

## Cross-Story Dependencies

- `private.is_moderator()`, SELECT-policyene, Storage-policyen og `status_changed_at` finnes fra Epic 1. Migreringen i 4.1 dekker også skjuling, så 4.2 trengte ingen ny databaseregel.
- 4.2 bygger på panelet, slot-oppsettet og handlingsmønsteret fra 4.1. UJ-3-testen bruker «Mine rapporter» (3.2) og «Flest har sett» (3.1), og «Skjult rapport» på bekreftknappen finnes fra 3.3.
- 4.3 forutsetter at 4.1 og 4.2 er ferdige og kjerneflyttesten komplett. Den endrer ingen regler, men retter README og oppsett der den rene klonen avslører feil. README-grunnmuren og seed-dataene er fra Epic 1, SM-5-testsettet fra Epic 2.
