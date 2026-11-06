# Adversarial review 2: ARCHITECTURE-SPINE.md (LocalFix), oppdateringen 2026-11-06

Gjennomgått: `ARCHITECTURE-SPINE.md` (draft, oppdatert 2026-11-06) mot `prd.md` (final, 2026-11-04), `EXPERIENCE.md` (final, 2026-11-06), `.memlog.md` og forrige adversarial review (2026-10-28). Funn som allerede er lukket i forrige runde (F-1 til F-12) er ikke gjentatt.

Metode: for hvert funn bygger to enheter (to stories, to utviklere eller to agenter) hver sin del og følger alle AD-er etter bokstaven, men resultatet passer ikke sammen, eller en angriper bruker et hull som bokstaven tillater. Forslagene til ny AD-tekst er skrevet så de kan limes rett inn i spinen.

Ingen eksterne kilder er slått opp i denne runden. Der et funn hviler på en ekstern detalj som ikke er bekreftet her, står det **Ikke verifisert** i funnet.

## Konklusjon

Oppdateringen 2026-11-06 lukker de gamle hullene, men åpner nye i de fire endringene. Spinen er ikke klar for parallelle stories før K-1 og K-2 er avgjort. K-1: AD-5 sier at appen aldri viser hvem som har registrert eller bekreftet, men visningen gir `author_id` til `anon`, og AD-9 legger forfatterens uuid inn i hver bildelenke. Med `confirmations.user_id` kan en besøkende dermed koble alle rapporter og bekreftelser til samme person. K-2: AD-6, AD-12 og AD-14 tatt bokstavelig gir en lesepolicy som feiler for alle besøkende. I tillegg sier spinen og EXPERIENCE.md motsatte ting om `mine=true` for besøkende. Telleren skal ikke regnes ut i grensesnittet, mens UX krever optimistisk +1. Og AD-15 er en definisjon av ferdig som ingen av de første storyene kan oppfylle.

## Oversikt

| # | Alvor | Funn | Lukkes med |
| --- | --- | --- | --- |
| K-1 | Kritisk | Forfatterens uuid lekker til `anon` via visningen, `image_path` og signerte lenker, og kan kobles mot `confirmations.user_id` (PRD §8) | Eksplisitt beslutning i AD-5, nye regler i AD-5/AD-9 |
| K-2 | Kritisk | `private.is_moderator()` i en felles lesepolicy gir `permission denied` for `anon` på hele lista | Strammere AD-6, AD-12 og AD-14 |
| H-1 | Høy | `mine=true` for besøkende: spinen sier tom liste, EXPERIENCE.md sier ignorer. Nullstilling er udefinert | Strammere konvensjonen Filter og sortering |
| H-2 | Høy | `seen_count` («regner aldri selv») mot optimistisk +1 i UX. `confirmReport` mangler kontrakt for `data` og for `already_confirmed` | Strammere AD-5 og konvensjonen Server Actions |
| H-3 | Høy | AD-15 som definisjon av ferdig: kjerneflyttesten kan ikke bestå før alle flatene finnes, og testdata uten nullstilling gir rekkefølgeavhengige tester | Strammere AD-15, ny regel for seed |
| H-4 | Høy | `42501` dekker fire ulike tilfeller. `own_report` og `report_not_found` kan ikke komme fra databasen. Bekreftknapp på skjult rapport for moderator | Strammere AD-7 og konvensjonen Feilkoder |
| M-1 | Middels | `NOT NULL` kan ikke håndheves på en visning. Genererte typer er nullbare, og `bool_or` gir `NULL` | Strammere AD-5 og AD-10 |
| M-2 | Middels | «Ukjente verdier ignoreres» uten én parser: gjentatte parametre, store bokstaver, tom verdi | Ny regel om `lib/list-params.ts` |
| M-3 | Middels | axe- og tastaturtesten har ingen tilstandsmatrise, regelsett eller grense for hva «bare tastatur» betyr | Strammere AD-15 |
| M-4 | Middels | Visningen står ikke i rettighetsmatrisen i AD-12, og standardgrants gjelder også visninger | Strammere AD-12 og AD-14 |
| M-5 | Middels | Ingen paginering møter 60 sekunders lenker, `loading="lazy"` og PostgRESTs radtak | Strammere AD-9 og konvensjonen Filter og sortering |
| L-1 | Lav | Id som ikke er en uuid gir 500 i stedet for 404 | Konvensjonen Detaljside |
| L-2 | Lav | `confirmations` mangler kolonnegrant: `created_at` kan forfalskes | AD-12 |
| L-3 | Lav | `image_path` kan peke på et objekt som aldri gikk gjennom serverens validering | AD-9 |
| L-4 | Lav | `r.*` i visningen fryses når visningen opprettes | AD-5 |
| L-5 | Lav | AD-15 «ikke ferdig før testene består» har ingen sporbar kontroll uten CI | AD-15 |

---

## Kritiske funn

### K-1 (Kritisk): forfatteren kan identifiseres via API-et og via appens egne bildelenker

**Bokstaven.** AD-5: visningen returnerer «alle kolonnene i `reports`», også `author_id`. Appen «viser aldri hvem som har bekreftet». AD-12: `anon` har SELECT på synlige rapporter, uten kolonnegrant for SELECT. AD-6 og AD-9: `image_path` er `<author_id>/<uuid>.<ext>` (CHECK-krav), og bildet vises via en signert lenke laget på serveren. Memloggen godtok 2026-10-28 at `confirmations.user_id` eksponeres som uuid via REST. Den sier ingenting om `author_id`. PRD §8: «Appen viser ikke andre hvem som har registrert eller bekreftet en rapport.»

**Utnyttelse (uten innlogging):**

1. `GET /rest/v1/reports_with_counts?select=id,author_id` gir forfatterens uuid for hver synlige rapport.
2. `GET /rest/v1/confirmations?select=report_id,user_id` gir hvem (som uuid) som har bekreftet hva.
3. Samme uuid går igjen i begge tabellene. Kjenner du én rapport fra en person (Ida forteller vennene sine om gatelyset), kjenner du uuid-en hennes. Da kan du liste alle rapportene hun har registrert og alle hun har bekreftet. Det er en pseudonym profil som blir et navn med én opplysning utenfra.
4. Dette trenger ikke engang API-et. Den signerte lenken har formen `.../object/sign/report-images/<author_id>/<uuid>.jpg?token=...` og står i HTML-en på detaljsiden, som enhver besøkende ser. To rapporter med samme mappe i bilde-URL-en har samme forfatter. **Ikke verifisert:** nøyaktig URL-format i den lokale Storage-versjonen, men stien ligger i lenken i alle Storage-versjoner jeg kjenner.

**Divergent par.** Story A (lista) leser `select('*')` fra visningen og sender raden til en klientkomponent (kortet eller bekreftknappen, som må være klientkomponent for optimistisk telling). Hele raden med `author_id` og `image_path` havner i RSC-nyttelasten til nettleseren. Story B velger kolonner eksplisitt. Begge følger AD-5 («appen viser aldri»), for ingen av dem *viser* uuid-en.

**Hvorfor det ikke kan lukkes med en kolonnegrant alene.** `authored_by_me` regnes ut i en visning med `security_invoker = true`. Da sjekkes kolonnerettighetene på `reports.author_id` mot den som spør, også for `anon`. Tar du bort SELECT på `author_id` fra `anon`, feiler hele visningen for besøkende. **Ikke verifisert her**, men slik beskriver Postgres-dokumentasjonen `security_invoker`. En visning med eierrettigheter omgår RLS og bryter AD-6, og en ny `security definer`-funksjon bryter AD-4. Å skjule uuid-en helt krever altså en reell designendring.

**Lukk med (beslutning hos prosjekteier, så tekst i AD-5).** Velg ett av to og skriv det inn:

> **Alternativ A (godta, minste endring), tillegg til AD-5:** `author_id` og `confirmations.user_id` er ugjennomsiktige uuid-er som er lesbare via REST for alle som kan se rapporten. Dette er en bevisst avveining (samme som for bekreftelser 2026-10-28), og PRD §8 gjelder det appen viser, ikke API-et. Appen sender aldri `author_id`, `user_id` eller `image_path` til nettleseren: Server Components velger kolonnene eksplisitt (`REPORT_COLUMNS` i `lib/reports.ts`), og klientkomponenter får bare id, visningsfelt, `seen_count`, `confirmed_by_me`, `authored_by_me`, `hidden` og den signerte lenken. Bildestien er `<uuid>.<ext>` i en mappe som ikke avslører forfatteren (se alternativ B), eller så godtas det at mappenavnet står i lenken, og det skrives i README under personvern.
>
> **Alternativ B (lukk i lenken), endring i AD-9:** Objektnavnet er `<uuid>.<ext>` uten forfattermappe. INSERT- og DELETE-policyen på `storage.objects` bruker eieren av objektet i stedet for mappen, og INSERT-policyen på `reports` krever at `image_path` er et objekt i `report-images` som innsetteren eier. CHECK-en `image_path LIKE author_id::text || '/%'` fjernes. **Ikke verifisert:** at Storage setter `storage.objects.owner_id` fra JWT-en ved opplasting. Det må testes med pgTAP før B velges.

Uansett valg: en pgTAP- eller Vitest-test som ber om `/rest/v1/reports_with_counts?select=author_id` som `anon` dokumenterer om feltet er synlig, og en Playwright-test sjekker at sidens HTML ikke inneholder seed-forfatterens uuid.

### K-2 (Kritisk): én felles lesepolicy med `private.is_moderator()` stenger lista for besøkende

**Bokstaven.** AD-6: «Lesing er tillatt når `hidden = false` eller brukeren er moderator.» AD-14: alle policyer bruker `private.is_moderator()`, som er `SECURITY INVOKER` og leser `public.profiles`. AD-12: `anon` har ingen rettigheter på `profiles`. AD-14: standardgrants tilbakekalles.

**Divergent par.** Utvikler A skriver AD-6 slik den står, som én policy: `CREATE POLICY reports_select ON reports FOR SELECT TO anon, authenticated USING (hidden = false OR private.is_moderator())`. For hver skjult rad (seed har skjulte rader) må `is_moderator()` kjøres som `anon`. Funksjonen spør `profiles`, og `anon` har ingen grant, så spørringen feiler med `permission denied for table profiles` (eller `for schema private` hvis `USAGE` mangler). Lista, detaljsiden, bildepolicyen og bekreftelsespolicyen, som alle slår opp i `reports`, feiler da for alle besøkende. Bruker A Supabases anbefalte ytelsesmønster `(SELECT private.is_moderator())`, kjøres funksjonen én gang per spørring og feiler også når ingen rad er skjult. Utvikler B skriver to policyer: `TO anon USING (hidden = false)` og `TO authenticated USING (hidden = false OR private.is_moderator())`. Begge følger alle AD-er.

**Den farlige «reparasjonen».** Den som ser feilen hos A, har tre nærliggende rettelser, og alle er sikkerhetshull eller brudd: gi `anon` SELECT på `profiles` med `USING (true)` (lekker hvem som er moderator, og med K-1 også moderatorens rapporter), gjøre `is_moderator()` til `SECURITY DEFINER` (bryter AD-4 om én eneste), eller filtrere `hidden` i appen (bryter AD-6).

**Lukk med (tillegg til AD-14 og AD-12).**

> Policyer for `anon` kaller aldri `private.is_moderator()`. Hver tabell har egne policyer per rolle: `TO anon` uten moderatorledd, og `TO authenticated` med `private.is_moderator()`. `USAGE ON SCHEMA private` og `EXECUTE ON FUNCTION private.is_moderator()` gis bare til `authenticated`. `anon` har ingen rettigheter i `private` og ingen på `profiles`. Storage-policyen og SELECT-policyen på `confirmations` deles på samme måte. En pgTAP-test kjører `SELECT` mot `reports_with_counts` som `tests.as_anon()` med minst én skjult rad i tabellen og forventer bare synlige rader og ingen feil.

---

## Høye funn

### H-1 (Høy): `mine=true` for besøkende betyr to motsatte ting

**Bokstaven.** Spinen, Filter og sortering: «`mine=true` for en besøkende gir en tom liste.» EXPERIENCE.md, Filterbrikker: «For en besøkende ignoreres `mine`.» Memloggen 2026-11-06 sier tom liste. EXPERIENCE.md sier i sin innledning at «navn i URL-er … følger arkitekturspinen», men har en egen regel her.

**Divergent par.** Story A (lista, bygget etter spinen) sender `.eq('authored_by_me', true)` til visningen og får null rader for `anon`. Story B (filterbrikkene, bygget etter EXPERIENCE.md) skjuler brikken for besøkende og forventer at `mine` ignoreres. Resultat: Ida deler `/?mine=true&category=lighting` med Jonas (UX sier valget «kan deles»), eller hun logger ut mens filteret står på. Jonas ser en tom liste. Hvilken tomtilstand vises? «Ingen treff» med «Nullstill filter», eller «Ingen egne rapporter» med «Du har ikke registrert noen rapporter ennå» (feil for en besøkende)? Brikken som slår av filteret er skjult for ham, og «Alle» nullstiller bare kategori og status. Han har ingen synlig vei ut. SM-4-fiksturen («forventet rekkefølge og antall for hver kombinasjon») får to fasiter.

**Lukk med (erstatt setningen i Filter og sortering, og rett EXPERIENCE.md).**

> `mine=true` gjelder bare innloggede. For en besøkende behandles `mine` som ukjent verdi og ignoreres. Lista viser da alle synlige rapporter, og det er det EXPERIENCE.md sier. Tolkningen skjer i URL-parseren (M-2), ikke i spørringen. «Nullstill filter» fjerner `category`, `status` og `mine` og beholder `sort`. «Alle» fjerner `category` og `status`. Tomtilstanden «Ingen egne rapporter» vises bare når `mine` er aktiv, brukeren er innlogget og ingen andre filtre er satt. Ellers vises «Ingen treff».

(Velger prosjekteieren heller tom liste, må EXPERIENCE.md endres og få en tomtilstand for besøkende med en lenke til innlogging. Det viktige er at det bare finnes én regel.)

### H-2 (Høy): telleren skal ikke regnes ut i grensesnittet, men UX krever optimistisk +1

**Bokstaven.** AD-5: «Grensesnittet viser bare `seen_count` og regner aldri selv.» EXPERIENCE.md, Bekreftknapp: «Ved trykk øker telleren med én med en gang (optimistisk). Feiler kallet, går telleren tilbake og en toast vises.» EXPERIENCE.md, Rapportkort: «N … altså `confirmation_count + 1`.» Konvensjonen sier at `confirmReport(reportId)` svarer `{ ok: true, data }`, men ikke hva `data` er.

**Divergent par.** Story A (bekreftknappen) følger UX: `useOptimistic` med `seen_count + 1`, altså regning i TypeScript. Story B (detaljsiden) følger AD-5 og viser bare det serveren sender etter `revalidatePath`. Da hopper telleren 1 → 2 → 2 i A, mens B viser 1 til siden er lastet på nytt. Den som leser UX-ens formel `confirmation_count + 1` bokstavelig, regner ut seen_count selv på lista, nettopp det AD-5 skulle hindre.

**Kant med feil oppførsel i begge.** To faner, eller dobbeltklikk før knappen deaktiveres: andre kall gir `already_confirmed`. UX sier at telleren går tilbake og at en toast vises. Men sannheten er at brukeren *har* bekreftet. Knappen går tilbake til «Jeg har også sett dette», aktiv, med feil tall. Neste trykk gir samme feil igjen.

**Lukk med (tillegg til AD-5 og konvensjonen Server Actions).**

> `confirmReport(reportId)` svarer `{ ok: true, data: { seen_count, confirmed_by_me } }`, lest fra `reports_with_counts` etter innsettingen i samme forespørsel. Grensesnittet kan vise en ventetilstand mens kallet pågår (knappen deaktivert, «Sender …»), men ingen utregnet verdi. Telleren endres først når svaret kommer. Ved `already_confirmed` behandles svaret som bekreftet: knappen viser «Du har sett dette ✓», siden hentes på nytt, og det vises ingen feiltoast. EXPERIENCE.md endres fra «optimistisk +1» til dette, og formelen `confirmation_count + 1` står bare i definisjonen av visningen.

(Ønsker prosjekteieren å beholde optimistisk visning, må AD-5 få et navngitt unntak: «den eneste regningen i grensesnittet er `seen_count + 1` i bekreftknappens ventetilstand, og den byttes ut med serverens verdi når svaret kommer».)

### H-3 (Høy): AD-15 er en definisjon av ferdig som de første storyene ikke kan oppfylle, og testene endrer delte data

**Bokstaven.** AD-15: «Én test går hele kjerneflyten bare med tastatur: logge inn, filtrere, åpne en rapport, bekrefte, registrere en rapport, og som moderator endre status og skjule. … En story som endrer grensesnittet, er ikke ferdig før disse testene består.» Testene kjører «mot appen med lokal Supabase og seed». AD-11: seed har «rapporter i alle kategorier og statuser». SM-4: «forventet rekkefølge og antall» på testdatasettet.

**Divergent par 1 (definisjon av ferdig).** Story 1 bygger lista. Kjerneflyttesten trenger skjemaet, detaljsiden og moderatorpanelet, som ikke finnes ennå. Agent A skriver hele testen og merker stegene som mangler `test.fixme`. Testene «består». Agent B regner storyen som blokkert til alle flatene finnes, og ingen story før den siste kan bli ferdig. Agent C skriver bare sin del og kaller den «kjerneflyttesten». Alle følger AD-15.

**Divergent par 2 (delte, muterte data).** Kjerneflyttesten bekrefter, registrerer, flytter status og skjuler en seed-rapport. Ved andre kjøring er bekreftelsen der allerede (`already_confirmed`), statusen er flyttet (knappen «Under behandling →» finnes ikke), og rapporten er skjult. Utvikler A kjører `supabase db reset` før hver kjøring. Utvikler B lager nye brukere per test. Playwright kjører som standard flere arbeidere i parallell, så en test som skjuler en rapport, endrer tallene en SM-4-test leser samtidig. Den som legger 100 genererte rapporter i `seed.sql` for å måle NFR-6, endrer fasiten for SM-4 og e2e. Da har `seed.sql` to eiere med ulike behov.

**Lukk med (erstatt siste setning i AD-15 og legg til en regel om seed).**

> Kjerneflyttesten vokser story for story: hver story som lager eller endrer en flate, legger til sine steg i `e2e/core-flow.spec.ts`, og testen skal bestå med de stegene som finnes. `test.skip` og `test.fixme` er ikke tillatt i `e2e/`. Den fullstendige flyten i AD-15 er kravet for at epicen, ikke den enkelte storyen, er ferdig. «Disse testene» betyr alle testene i `e2e/` og axe-sjekken av hver flate som finnes.
>
> Playwright kjører med `workers: 1`. `globalSetup` nullstiller databasen til seed (`supabase db reset`) før hver kjøring. Tester som endrer data, lager sine egne rapporter og bruker egne seed-brukere. De endrer aldri rapportene SM-4-fiksturen bruker. `supabase/seed.sql` er det faste, lille datasettet for SM-4 og e2e. Data for NFR-6 (100 rapporter) lastes av et eget skript (`supabase/seed-perf.sql` eller tilsvarende) som aldri kjøres sammen med e2e. **Ikke verifisert:** om `supabase db reset` også laster bildene fra `objects_path` på nytt. Hvis ikke, må `globalSetup` gjøre det.

### H-4 (Høy): `42501` dekker fire ulike tilfeller, og to feilkoder kan ikke oppstå

**Bokstaven.** AD-7: INSERT på `confirmations` krever `EXISTS (… r.hidden = false AND r.author_id <> auth.uid())`. Feilkoder: `own_report` og `report_not_found` finnes i vokabularet. `lib/errors.ts` slår opp på SQLSTATE `23505` og `42501`. AD-1: TypeScript kan sjekke input for å gi en bedre feilmelding.

**Hva databasen faktisk gir.** RLS-sjekken `WITH CHECK` kjører etter BEFORE-triggere og før andre begrensninger, også før fremmednøkkelen (som er en AFTER-trigger). Derfor gir alle disse samme `42501` (403 via PostgREST): egen rapport, skjult rapport, rapport som ikke finnes, og en moderator som bekrefter en skjult rapport. **Ikke verifisert her**, men det følger av Postgres-dokumentasjonen for `CREATE POLICY`. At alt blir likt, er bra (ingen orakel for om en rapport finnes). Men `own_report` og `report_not_found` kan ikke komme fra databasen.

**Divergent par.** Utvikler A lar `confirmReport` lese raden fra visningen først: ingen rad gir `report_not_found`, `authored_by_me` gir `own_report`, og først deretter settes raden inn. Utvikler B setter inn direkte og oversetter `42501` til `forbidden`, så brukeren får UX-toasten «Du har ikke tilgang til dette.» på sin egen rapport (i et kappløp der knappen ikke var deaktivert ennå). Testene for SM-2 forventer ulike koder.

**Moderator og skjulte rapporter.** UX: bekreftknappen er «synlig for alle». En moderator åpner en skjult rapport. Story A viser knappen aktiv, og trykket gir `forbidden`. Story B deaktiverer den på grunnlag av `hidden`, mens AD-6 sier at «appen filtrerer aldri på `hidden` selv». Er det å deaktivere en knapp å filtrere? Kjerneflyttesten «som moderator endre status og skjule» passerer bekreftknappen på en skjult rapport hvis den skjuler først.

**Lukk med (tillegg til AD-7 og konvensjonen Feilkoder).**

> `confirmReport` leser først raden fra `reports_with_counts` med brukerens sesjon: ingen rad gir `report_not_found`, `authored_by_me` gir `own_report`, `confirmed_by_me` gir `already_confirmed`, og `hidden` gir `forbidden`. Så settes raden inn. `42501` fra innsettingen (kappløp) gir `forbidden`, og `23505` gir `already_confirmed`. Databasen er fortsatt eneste kontroll (AD-1), og forhåndssjekken er bare for feilmeldingen. Bekreftknappen er deaktivert når `hidden = true` og viser da «Skjult rapport». Å bruke `hidden` til å styre en knapp er ikke å filtrere (AD-6 gjelder hvilke rader som vises).

---

## Middels funn

### M-1 (Middels): `NOT NULL` på en visning er et løfte databasen ikke holder

**Bokstaven.** AD-5: `confirmation_count integer NOT NULL`, `seen_count integer NOT NULL`, `confirmed_by_me boolean NOT NULL`, `authored_by_me boolean NOT NULL`. AD-10: TypeScript-typene genereres fra databasen og er eneste kilde.

**Problemet.** En visning kan ikke ha `NOT NULL`. `supabase gen types` merker alle kolonner i en visning som nullbare (`number | null`, `boolean | null`). **Ikke verifisert** for CLI 2.122, men slik har det vært. I tillegg er de naturlige SQL-formene nullbare. `bool_or(c.user_id = auth.uid())` over en LEFT JOIN uten bekreftelser, eller for `anon` (der `auth.uid()` er `NULL`), gir `NULL`. Det samme gjør `author_id = auth.uid()` for `anon`.

**Divergent par.** Story A skriver `report.seen_count ?? 1` og `report.confirmed_by_me ?? false` i komponenten. Det er regning og en standardverdi i TypeScript, nettopp det AD-5 forbyr. Story B skriver `report.seen_count!`. Story C lager sin egen type for raden. Tre typer for samme rad.

**Lukk med (tillegg til AD-5 og AD-10).**

> Hver kolonne i visningen som er lovet `NOT NULL`, er uttrykt slik at den aldri kan bli `NULL`: `count(c.user_id)::int`, `(count(c.user_id) + 1)::int`, `coalesce(bool_or(c.user_id = auth.uid()), false)` og `coalesce(r.author_id = auth.uid(), false)`. Visningen grupperer på `r.id`. En pgTAP-test leser visningen som `anon`, som en bruker uten bekreftelser og som en bruker med bekreftelser, og forventer at ingen av de fire kolonnene er `NULL`. Typen for en rad defineres ett sted, `lib/reports.ts`, som den genererte typen der de fire kolonnene er gjort ikke-nullbare. Ingen annen fil bruker `??` eller `!` på disse kolonnene.

### M-2 (Middels): «ukjente verdier ignoreres» uten én parser

**Bokstaven.** Konvensjonen: parametrene er `category`, `status`, `mine`, `sort`. «Ukjente verdier ignoreres.» I Next.js er `searchParams` en `string | string[] | undefined` per nøkkel.

**Divergent par.** `/?category=waste&category=lighting`: lista (A) tar første verdi, filterbrikkene (B) ser en tabell og markerer ingen brikke som aktiv, og en tredje (C) sender tabellen til `.eq()` og får en databasefeil. `?mine=1`, `?mine=TRUE`, `?sort=Confirmations`, `?status=`: ignorert eller tolket? Brikkenes `aria-pressed` (EXPERIENCE.md) leses fra rå URL i én komponent og fra parset verdi i en annen, så skjermleseren sier «på» om et filter som ikke er brukt. axe-testen fanger ikke dette.

**Lukk med (ny regel i konvensjonen Filter og sortering).**

> URL-en tolkes bare av `parseListParams(searchParams, isSignedIn)` i `lib/list-params.ts` (Zod). Den returnerer `{ category?, status?, mine: boolean, sort: 'newest' | 'confirmations' }`. Bare én verdi per nøkkel er gyldig, så en gjentatt nøkkel behandles som ukjent. Verdiene skilles på store og små bokstaver og må være nøyaktig enum-kodene, `true` eller sorteringsnavnene. Tom verdi er ukjent. `mine` er `false` for besøkende (H-1). Spørringen, filterbrikkene, `aria-pressed`, tomtilstanden og lenkene bygges bare fra resultatet av parseren, og lenker lages av `buildListHref(params)` i samme fil. Vitest dekker tilfellene over.

### M-3 (Middels): axe- og tastaturtesten mangler omfang

**Bokstaven.** AD-15: axe «på lista, detaljsiden, skjemaet og innloggingen», feil ved `serious` eller `critical`. «Én test går hele kjerneflyten bare med tastatur.»

**Divergent par.**

- **Tilstander og roller.** Utvikler A kjører axe én gang per side som besøkende. Utvikler B kjører i alle tilstander. Funnene som faktisk er sannsynlige, finnes bare i tilstandene A ikke ser: grå merkelapp «Skjult» på grå bakgrunn (kontrast, bare moderator), åpen `AlertDialog`, feilmeldinger koblet med `aria-describedby`, KI-forslag med `aria-live`, toast, tom liste og «Ingen treff».
- **Regelsett.** `AxeBuilder` kjører som standard også best-practice-regler. A filtrerer på WCAG-tagger, B gjør det ikke, og det blir ulikt hva som stopper en story.
- **«Bare tastatur».** A bruker `locator.focus()` og `press('Enter')`, eller `page.goto()` til detaljsiden. Det beviser verken tab-rekkefølge eller synlig fokus. B går med `Tab`. Begge kaller det tastaturtest.
- **Server.** A kjører mot `next dev`, med dev-overlegget og langsom første kompilering. B kjører mot `next build && next start`. Dev-modus kan gi andre axe-funn og tidsavbrudd. **Ikke verifisert:** om Next 16 sitt dev-overlegg gir axe-funn.

**Lukk med (tillegg til AD-15).**

> axe kjøres med taggene `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa` i denne matrisen: lista (besøkende, bruker, moderator med en skjult rapport, tom liste, ingen treff), detaljsiden (besøkende, egen rapport, bekreftet, moderator med panel og åpen `AlertDialog`, skjult rapport som moderator), skjemaet (tomt, med valideringsfeil, med KI-forslag) og innloggingen (tom, med feil). Tastaturtesten bruker bare `page.keyboard` fra startadressen. `click`, `focus`, `fill` og `goto` er ikke tillatt etter første side, og testen sjekker at elementet med fokus er synlig ved hvert steg. Valg av bilde er unntatt fordi filvelgeren ikke kan styres med tastatur i Playwright. Testene kjører mot `next build && next start`.

### M-4 (Middels): visningen står ikke i rettighetsmatrisen

**Bokstaven.** AD-12: «alt som ikke står der er forbudt». Matrisen lister `profiles`, `reports`, `confirmations` og `storage.objects`, men ikke `reports_with_counts`. AD-14: tilbakekall standardgrants for «tabell i `public`». Supabase gir som standard `anon` og `authenticated` rettigheter også på nye visninger. **Ikke verifisert** for denne CLI-versjonen.

**Divergent par.** Utvikler A leser AD-12 bokstavelig («ikke i matrisen = forbudt»), tilbakekaller alt og gir ingen grant på visningen. Lista feiler med `permission denied for view` for alle. Utvikler B lar standardgrantene stå, så `anon` har `INSERT, UPDATE, DELETE, TRUNCATE` på visningen. De fleste blir stoppet fordi visningen ikke kan oppdateres (GROUP BY) og fordi rettighetene på `reports` sjekkes for den som spør, men det er en tilfeldighet og ikke en regel. pgTAP-testen «tabell i `public` mangler RLS» sier ingenting om visninger, som ikke har RLS.

**Lukk med (ny rad i AD-12 og tillegg til AD-14).**

> | `reports_with_counts` (visning) | SELECT | SELECT | (via RLS på `reports`) |
>
> Visningen opprettes med `security_invoker = true`, får `REVOKE ALL … FROM anon, authenticated` og så bare `GRANT SELECT … TO anon, authenticated`. pgTAP-testen i AD-14 feiler også hvis en visning i `public` mangler `security_invoker = true` eller har andre rettigheter enn SELECT for `anon` eller `authenticated`.

### M-5 (Middels): ingen paginering møter 60 sekunders lenker og PostgRESTs radtak

**Bokstaven.** Konvensjonen: «Det er ingen paginering: lista viser alle synlige rapporter.» AD-9: signerte lenker varer 60 sekunder og hentes i én batch per side. Kapabilitetskartet knytter NFR-6 til `createSignedUrls`, så det antar at lista har bilder. FR-5 og EXPERIENCE.md sier ikke at rapportkortet har bilde.

**Divergent par.**

- **Bilder i lista.** Story A viser miniatyrbilder med `loading="lazy"` (eller `next/image`, som laster lat som standard) for å nå NFR-6. Et bilde langt nede som brukeren ruller til etter 60 sekunder, har en utløpt lenke og vises ødelagt. Story B laster alle 100 med en gang og bryter NFR-6. Story C har ingen bilder i lista, og kapabilitetskartet stemmer ikke.
- **«Alle» er ikke alle.** PostgREST har et tak på antall rader (`db.max_rows`, standard 1000 i `supabase/config.toml`, **ikke verifisert** for denne versjonen). Over taket blir lista stille avkortet, uten feil og uten melding, mens spinen lover at alle vises. Langt over NFR-6, men det er en stille feil.

**Lukk med (tillegg til konvensjonen og AD-9).**

> Rapportkortet i lista har ikke bilde (FR-5). Signerte lenker lages bare på detaljsiden, ett bilde per side. NFR-6 i kapabilitetskartet knyttes bare til `reports_with_counts`. Lista ber om høyst 500 rader, og når grensen nås, vises en tekst om at lista er avkortet. Paginering står i Deferred.

(Ønsker designet bilder i lista, må levetiden på lenken være lengre enn en side kan stå åpen, og bildene må lastes uten `lazy`. Det må avgjøres eksplisitt.)

---

## Lave funn

### L-1 (Lav): id som ikke er en uuid gir 500, ikke 404

`/reports/abc` sendes til Postgres som uuid og gir SQLSTATE `22P02`. `lib/errors.ts` gir `unknown`, og detaljsiden kaster feil (500). En annen story validerer først og kaller `notFound()`. **Lukk:** «Detaljsiden og Server Actions validerer `reportId` som uuid med Zod før noe kall. Ugyldig id gir `notFound()` på siden og `validation_failed` i en handling.»

### L-2 (Lav): `confirmations` har ingen kolonnegrant

AD-12 gir kolonnegrant for INSERT på `reports`, men sier bare «INSERT (AD-7)» for `confirmations`. Via REST kan en bruker sette `created_at` (for eksempel til 2099). Det brukes ikke i dag, men brukes det senere, er verdien forfalsket. **Lukk:** «INSERT på `confirmations` gis som kolonnegrant på `report_id`. `user_id` har `DEFAULT auth.uid()` og `created_at` har `DEFAULT now()`, og ingen av dem kan settes av `authenticated`. Policyen beholder `WITH CHECK (user_id = auth.uid())`.»

### L-3 (Lav): `image_path` kan peke på et objekt som ikke er validert av serveren

Med sin egen JWT kan en bruker laste opp direkte til Storage API-et i sin egen mappe, utenom Server Action-ens sjekk av filtype, og så sette inn en rapport med `image_path` til objektet. Det kan også peke på et objekt som ikke finnes. Bucketens grenser for størrelse og type stopper det meste, men typen sjekkes etter oppgitt `Content-Type`. **Ikke verifisert:** om Storage sjekker innholdet. **Lukk:** «Bucketen tillater bare `image/jpeg, image/png, image/webp`, og bilder vises med `Content-Type` fra bucketen og `X-Content-Type-Options: nosniff`. Detaljsiden tåler at objektet mangler og viser da ingen bilde.»

### L-4 (Lav): `r.*` i visningen fryses når visningen opprettes

Postgres erstatter `*` med kolonnelisten når visningen opprettes. En senere migrering som legger en kolonne til `reports`, gir ikke kolonnen i visningen. «Alle kolonnene i `reports`» (AD-5) blir da usant uten at noe feiler. **Lukk:** «En migrering som endrer `reports`, gjenoppretter `reports_with_counts` i samme migrering og genererer typene på nytt. pgTAP sammenligner kolonnene i visningen med `reports` pluss de fire tilleggskolonnene.»

### L-5 (Lav): «ikke ferdig før testene består» har ingen sporbar kontroll

Det finnes ingen CI (Deferred). Om testene har bestått, er det bare agenten eller utvikleren selv som vet. **Lukk:** «PR-beskrivelsen for en story som endrer grensesnittet, har sammendraget fra testkommandoen i README (antall bestått og antall axe-funn).»

---

## Forslag til endringer i spinen, samlet

1. **AD-5:** bestem K-1 (godta og dokumenter, eller endre bildestien). Kolonnene velges eksplisitt, og `author_id`, `user_id` og `image_path` sendes aldri til nettleseren. Uttrykk alle fire tilleggskolonner så de aldri blir `NULL` (M-1). Gjenopprett visningen når `reports` endres (L-4).
2. **AD-6, AD-12 og AD-14:** egne policyer per rolle, og `anon` kaller aldri `private.is_moderator()`. `USAGE` og `EXECUTE` gis bare til `authenticated` (K-2). Visningen får en egen rad i matrisen og en pgTAP-sjekk (M-4). Kolonnegrant på `confirmations` (L-2).
3. **Filter og sortering:** én regel for `mine` hos besøkende, og EXPERIENCE.md rettes til samme regel (H-1). Én parser, `lib/list-params.ts` (M-2). Ingen bilder i lista, og et radtak med melding (M-5).
4. **AD-5 og Server Actions:** `confirmReport` svarer med `seen_count` og `confirmed_by_me`. Ingen optimistisk +1, eller et navngitt unntak. `already_confirmed` betyr bekreftet (H-2).
5. **AD-7 og Feilkoder:** `confirmReport` sjekker først i visningen for å gi riktig feilmelding. `42501` gir `forbidden`. Bekreftknappen er deaktivert på skjulte rapporter (H-4). Id som ikke er en uuid, gir 404 (L-1).
6. **AD-15:** kjerneflyttesten vokser story for story, uten `skip` og `fixme`. Én arbeider, nullstilling før kjøring, egne data for tester som endrer noe, egen seed for NFR-6 (H-3). Matrise for axe, WCAG-tagger, strenge tastaturregler og `next start` (M-3). Testsammendrag i PR-en (L-5).
7. **Ny pgTAP- og e2e-dekning:** `anon` leser lista med skjulte rader i tabellen (K-2), ingen `NULL` i visningen (M-1), rettighetene på visningen (M-4), og at sidens HTML ikke inneholder seed-forfatterens uuid (K-1).
