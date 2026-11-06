# Uavhengig gjennomgang av arkitektur-spinen (2026-11-06)

Gjennomgått: `ARCHITECTURE-SPINE.md` (updated 2026-11-06, status draft), `.memlog.md`, PRD (`prd.md`, updated 2026-11-04), `EXPERIENCE.md` (updated 2026-11-06), og `DESIGN.md` og skissene der det trengtes. Funn som ble løst etter gjennomgangen 2026-10-28 (`review-rubric.md`), er ikke gjentatt. Spinen er ikke endret.

## Konklusjon

Spinen er solid og nesten klar til `final`: den databasestyrte modellen, skrivematrisen, statustriggeren og den nye AD-15 dekker alle FR og NFR, og oppdateringene fra 2026-11-04 og 2026-11-06 er tatt inn. Fire funn bør likevel rettes før den settes til `final`. Moderatorfunksjonen kan stoppe all lesing for besøkende. Spinen og UX sier ulike ting om `mine=true` for besøkende. Innloggingsvakten og retur-adressen er ikke fastsatt, og startpakken sender besøkende til innlogging. AD-15 sier ikke hvilken databasetilstand testene kjører mot. Ingen funn er kritiske. Alle har en liten, konkret retting.

## Funn

### Kritisk

Ingen.

### Høy

#### H1. AD-14 / AD-12 / AD-6: `private.is_moderator()` gir tilgangsfeil for besøkende

- **Sted:** AD-14 (funksjonen er `SECURITY INVOKER` og leser `public.profiles`), AD-12 (`profiles`: anon «ingen»), AD-6 (lesing når `hidden = false` eller moderator), AD-5 og AD-9 (policyer som slår opp synlige rapporter).
- **Problem:** Funksjonen kjører med kallerens rettigheter. `anon` har ingen grant på `profiles`, så hvert kall som `anon` gir `permission denied for table profiles` (42501). Med én felles policy `USING (hidden = false OR private.is_moderator())` feiler lista for besøkende så snart det finnes en skjult rapport i databasen. Seed har skjulte rapporter, fordi FR-9 skal testes. Med Supabases anbefalte `(SELECT private.is_moderator())` feiler alle spørringer som `anon`. Det samme gjelder `confirmations`-policyen, telleren i visningen og Storage-oppslaget. Utviklere vil rette dette på ulike måter: en grant til `anon`, en ny `security definer` som bryter AD-4, eller egne policyer per rolle.
- **Retting:** Legg til i AD-14: «Policyer `TO anon` kaller aldri `private.is_moderator()`. `reports` har én SELECT-policy `TO anon USING (hidden = false)` og én `TO authenticated USING (hidden = false OR (SELECT private.is_moderator()))`. Samme deling gjelder for `confirmations` og `storage.objects`.» Legg til en pgTAP-test: som `anon`, med minst én skjult rapport i databasen, gir SELECT på `reports_with_counts`, `confirmations` og bildeoppslaget ingen feil.

#### H2. Konvensjon «Filter og sortering» mot EXPERIENCE.md: `mine=true` for en besøkende

- **Sted:** Spinen sier at `mine=true` for en besøkende gir en tom liste (memlog 2026-11-06, «by user»). EXPERIENCE.md (Filterbrikker) sier at `mine` ignoreres for en besøkende.
- **Problem:** De to dokumentene sier det motsatte på et punkt der de overlapper, og begge er datert 2026-11-06. Listesiden og SM-4- eller e2e-testen vil bygges mot hver sin regel. Med tom liste kommer besøkende i tillegg i en felle. De har ingen «Mine rapporter»-brikke å slå av, og «Alle» nullstiller bare kategori og status. Det er heller ikke bestemt hvilken tom-tilstand de ser: «Ingen treff» eller «Ingen egne rapporter».
- **Retting:** Velg én regel og skriv den likt i begge dokumentene. Anbefaling: følg UX. «For en besøkende ignoreres `mine`, og lista vises som uten filteret.» Siden har allerede brukeren fra innloggingsvakten (H3), så dette er en visningsregel og ikke en domeneregel. Vil dere beholde tom liste, må UX få en tom-tilstand for besøkende med en lenke som fjerner `mine`. Bestem også hvilken melding «Mine rapporter» kombinert med et filter uten treff gir. Anbefaling: «Ingen treff» når brukeren har egne rapporter.

#### H3. AD-2 / AD-3 / FR-1 / FR-5: innloggingsvakt, retur-parameter og startpakkens proxy

- **Sted:** AD-3 (retur-adressen valideres, men parameteren har ikke noe navn), AD-2 («mønsteret … utvides ikke»), diagrammet (`proxy.ts` fra startpakken), FR-1-raden i kapabilitetskartet.
- **Problem:** Det står ikke hvor regelen «ikke innlogget sendes til innlogging og tilbake» bor. Valget står mellom proxyen og en hjelper per side eller handling. Det står heller ikke hva retur-parameteren heter (`next`, `redirectTo` …). Skjemasiden, bekreftknappen og innloggingsskjemaet bygges i ulike stories og må bruke samme navn. Slik jeg kjenner `with-supabase`, sender sesjonskoden besøkende uten sesjon til `/auth/login` på alle stier unntatt `/` og `/auth/*`. Beholdes den uendret, kan besøkende ikke åpne detaljsider, og det bryter FR-5 og rolletabellen i PRD §2.2. Dette må sjekkes ved oppstart. Grensesnittet trenger dessuten rollen (merkelappen «Moderator», moderatorpanelet), og det er ikke sagt hvordan den leses.
- **Retting:** Legg til i AD-3: «`proxy.ts` fornyer bare sesjonen og redirecter ikke. Startpakkens redirect fjernes. `lib/supabase/auth.ts` eksporterer `getViewer()` → `{ user, isModerator }` (bruker fra `auth.getUser()`, rolle fra egen rad i `profiles`, aldri fra JWT) og `requireUser(returnTo)`, som redirecter til `/auth/login?next=<sti>`. Den kalles først i hver beskyttet side og hver Server Action. Parameteren heter `next`.» Oppdater FR-1-raden.

#### H4. AD-15: testenes databasetilstand og kjøremiljø er ikke fastsatt

- **Sted:** AD-15, konvensjonen «Tester», AD-11 (seed), AD-8 (mock bare når nøkkel mangler).
- **Problem:** Kjerneflyttesten registrerer, bekrefter, endrer status og skjuler i den samme seeden som SM-4 krever skal gi «forventet rekkefølge og antall». En ny kjøring feiler (`already_confirmed`, `stale_state`), og tester som kjører i parallell, påvirker hverandre. Seed som setter inn alle rapporter i én transaksjon med `DEFAULT now()`, gir dessuten lik `created_at` på alle rader, siden `now()` er starttidspunktet for transaksjonen. Da avgjøres «Nyeste» av tilfeldige uuid-er, og rekkefølgen endrer seg ved hver `db reset`. Rapporter som seedes med `created_at` i fortiden og standardverdien for `status_changed_at`, viser seed-tidspunktet som «sist oppdatert». Det bryter FR-8. Det er heller ikke bestemt om testene kjører mot `next dev` eller `next start`, og hvordan mock-modus tvinges når utvikleren har en KI-nøkkel i `.env`. Da kan e2e-testene sende seed-tekst til en ekstern leverandør.
- **Retting:** Legg til i AD-15 og AD-11:
  - Testkommandoen kjører `supabase db reset` først. Playwright kjører med `workers: 1` eller med data hver test lager selv.
  - Seed bruker faste uuid-er for brukere og rapporter og eksplisitte, ulike `created_at`. `status_changed_at` settes eksplisitt (lik `created_at` for `new`). Legg til `CHECK (status_changed_at >= created_at)`. `seed-images/` har undermapper med de faste bruker-uuid-ene, så `image_path`-CHECK-en i AD-6 holder.
  - Testene kjører mot `next build && next start`.
  - `lib/env.ts` får `AI_PROVIDER=mock|openai`. Standard er `mock` når nøkkelen mangler, og testkommandoen setter `mock` eksplisitt.

### Middels

#### M1. AD-9: DELETE-policyen lar rapportøren slette bildet til sin egen skjulte rapport

- **Sted:** AD-9, «DELETE bare for eieren og bare når ingen rad i `reports` har denne `image_path`».
- **Problem:** Oppslaget i policyen kjører under kallerens RLS. For en vanlig bruker er skjulte rapporter usynlige, så `NOT EXISTS` blir sann, og eieren kan slette bildet via Storage-API-et. Det bryter FR-9 («Ingenting blir slettet»), og moderator står igjen med en død `image_path`. Regelen slik den er ment («ingen rad i det hele tatt») kan ikke uttrykkes uten `security definer`, og det forbyr AD-4.
- **Retting:** Fjern DELETE-policyen i v1. Foreldreløse filer etter en mislykket innsending godtas lokalt, og opprydding føres i Deferred. Alternativt: begrens DELETE til objekter yngre enn noen minutter, og skriv i AD-9 at rest-risikoen er godtatt. Legg til en pgTAP-test for tilfellet.

#### M2. AD-9 / AD-13 / ingen paginering: miniatyrbilder i lista og lenker som varer 60 sekunder

- **Sted:** DESIGN.md (Rapportkort: «lite miniatyrbilde til høyre» [ASSUMPTION]), AD-9 (60 s, én batch per side), AD-13 (ingen bildeoptimerer), Deferred (paginering).
- **Problem:** Uten paginering kan lista vise 100 kort med originalbilder på opptil 5 MB, uten nedskalering. Med `loading="lazy"` hentes bilder lenger ned først når brukeren ruller dit. Lenkene kan da ha utløpt, og kortene får ødelagte bilder. Laster siden alle bildene med en gang, er NFR-6 i fare. Stories vil løse dette ulikt (lat eller ivrig lasting, lengre levetid, nye lenker).
- **Retting:** Velg én av to. (a) Lista viser ikke bilder, slik FR-5 beskriver raden, og `createSignedUrls` brukes bare på detaljsiden. DESIGN.md oppdateres. (b) Lista viser miniatyrer med en egen, lengre levetid (for eksempel 10 minutter) og `loading="eager"`. Skriv valget inn i AD-9, og skriv i AD-6 at en skjult rapport da kan vise bilde i opptil så lenge. Anbefaling: (a).

#### M3. NFR-6 kan ikke etterprøves

- **Sted:** NFR-6-raden i kartet, Deferred «Paginering», AD-11 (seed).
- **Problem:** NFR-6 er nå begrunnelsen for at det ikke er paginering, men ingen seed eller test har 100 rapporter, og det står ikke hvordan tiden måles eller mot hvilken server. Første innlasting i `next dev` kan i seg selv ta over 2 s.
- **Retting:** Legg til en fixture (et SQL-skript eller et Playwright-oppsett) med minst 100 synlige rapporter, og én Playwright-test som måler at lista er lastet på under 2000 ms mot `next start` (H4). Før testen inn i NFR-6-raden og under AD-15.

#### M4. AD-15: hva axe-sjekken dekker er for vagt, og NFR-1 er bundet uten regel

- **Sted:** AD-15 (axe på «lista, detaljsiden, skjemaet og innloggingen», Binds NFR-1), NFR-1-raden i kartet.
- **Problem:** Det står ikke hvilke tilstander som skal skannes, og moderatorpanelet, `AlertDialog`, valideringsfeil, KI-forslaget og visningen av en skjult rapport er en del av kjerneflyten. Det står heller ikke hvilke axe-regler som gjelder. Uten felles tagger og én felles hjelper kan to tester gi ulikt svar på samme side. AD-15 binder NFR-1, men har ingen regel om skjermbredde.
- **Retting:** Legg til i AD-15:
  - `e2e/a11y.ts` eksporterer én hjelper som bruker `AxeBuilder.withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'])` og feiler på `serious` og `critical`.
  - Disse tilstandene skannes: lista (besøkende, innlogget med aktive filtre), detalj (besøkende, bruker, moderator med panel, skjult rapport, åpen dialog), skjemaet (tomt, med valideringsfeil, med KI-forslag), innlogging og registrering.
  - Playwright har to prosjekter: 360×800 og 1280×800. På 360 px sjekker kjerneflyttesten at `scrollWidth <= clientWidth` (NFR-1).
  - Legg til AD-15 i NFR-1-raden i kartet.

#### M5. AD-4: tekstreglene gir ikke samme svar i SQL og TypeScript

- **Sted:** AD-4 (`CHECK (length(btrim(x)) > 0)`, lengdegrenser, `summary` «aldri tom streng»), konvensjonen `summary ?? description`, AD-8 («kortes til 300 tegn»).
- **Problem:** `btrim(x)` fjerner bare mellomrom. En beskrivelse som bare består av linjeskift eller tabulatorer, slipper gjennom databasen via REST, men stoppes av `.trim()` i skjemaet. Dette er nettopp avviket AD-1 skal hindre. Det står heller ikke at maksgrensene er `CHECK`-er, eller hvordan tegn telles: JS `length` teller UTF-16-enheter, Postgres `char_length` teller tegn, så emoji gir ulike tall. «Aldri tom streng» for `summary` er ikke håndhevet. Lagres `''`, viser `summary ?? description` en tom tittel, fordi `??` bare faller tilbake ved `null`.
- **Retting:** I AD-4: `CHECK (description ~ '\S' AND char_length(description) <= 1000)`, tilsvarende for `location` (200), og `CHECK (summary IS NULL OR (summary ~ '\S' AND char_length(summary) <= 300))`. Server Action trimmer og gjør tom tekst om til `NULL`, også når KI-en svarer med tom tekst. `lib/limits.ts` teller med `[...s].length`, og KI-sammendraget kortes på samme måte.

#### M6. AD-5: visningen kan ikke garantere NOT NULL, og `authored_by_me` blir NULL for besøkende

- **Sted:** AD-5 (`authored_by_me boolean NOT NULL (author_id = auth.uid())`, `confirmed_by_me boolean NOT NULL`).
- **Problem:** En visning kan ikke ha `NOT NULL`. Bare uttrykket kan garantere at verdien ikke er NULL. `author_id = auth.uid()` gir `NULL`, ikke `false`, når `auth.uid()` er `NULL`. `supabase gen types` gjør dessuten alle visningskolonner nullbare (`number | null`), så hver komponent må velge mellom `?? 0`, `?? 1` og `!`. Da regner grensesnittet likevel selv, stikk i strid med regelen om `seen_count`.
- **Retting:** Skriv uttrykkene inn i AD-5: `coalesce(r.author_id = auth.uid(), false)` og `coalesce(bool_or(c.user_id = auth.uid()), false)`. Bestem én radtype i `lib/supabase/` som overstyrer nullbarheten for visningens kolonner (Supabases `MergeDeep`-mønster), og si at komponenter bare bruker den typen.

#### M7. AD-12: kolonnen «moderator» blander grants og RLS

- **Sted:** Matrisen i AD-12 («moderator (i tillegg): UPDATE kolonnene `status, hidden`», «UPDATE-granten til moderator»).
- **Problem:** Det finnes ingen Postgres-rolle for moderator. Både brukere og moderatorer er `authenticated`. Leser man matrisen bokstavelig, gis ingen UPDATE-grant til `authenticated`, og da kan heller ikke moderatoren oppdatere. Noen vil også prøve å lage en egen rolle.
- **Retting:** Skriv under tabellen: «Grants gis til `anon` og `authenticated`. Kolonnen moderator håndheves av RLS og triggeren i AD-7. `GRANT UPDATE (status, hidden) ON reports TO authenticated`, og ikke-moderatorer stoppes av `reports_guard_update` med 42501.»

#### M8. AD-3: sjekken av retur-adressen kan omgås

- **Sted:** AD-3, «Retur-adressen etter innlogging må starte med `/` og ikke `//`».
- **Problem:** `/\evil.example` består sjekken, men nettlesere tolker `\` som `/` og sender brukeren til et annet domene (åpen redirect). Regelen er presis, men utilstrekkelig, og den vil bli bygget akkurat som den står.
- **Retting:** «Retur-adressen godtas bare hvis `new URL(next, origin).origin === origin`. Ellers brukes `/`.» Alternativt regexen `^/(?![/\\])`. Legg til en Vitest-test med `//x`, `/\x` og `https://x`.

#### M9. AD-9: «engangsnøkkelen» har ingen kolonne

- **Sted:** AD-9 («Skjemaet har en engangsnøkkel som hindrer dobbel innsending»), ERD-et.
- **Problem:** ERD-et har ingen kolonne for nøkkelen, så den kan bare håndheves i nettleseren eller i minnet i én prosess. To utviklere vil bygge den ulikt, eller legge til en kolonne som ikke står i ERD-et eller i INSERT-granten i AD-12.
- **Retting:** Enten `reports.submission_id uuid NOT NULL UNIQUE` (lagd av skjemaet, med i INSERT-granten og ERD-et, og et nytt forsøk returnerer den eksisterende rapporten), eller fjern engangsnøkkelen og la «Send inn» være deaktivert mens innsendingen pågår (UX). Anbefaling: den andre, fordi den er enklest.

#### M10. EXPERIENCE.md mot datamodellen: «navnet ditt» i menyen

- **Sted:** EXPERIENCE.md (IA: menyen viser «navnet ditt»), ERD-et (`profiles` har bare `id` og `role`), AD-4 (`handle_new_user` leser aldri metadata), PRD §8.
- **Problem:** Det finnes ikke noe navn å vise. Den som bygger topplinja, må finne på en kilde: e-post fra `auth.getUser()`, `user_metadata` eller en ny kolonne. Den siste bryter ERD-et og AD-12.
- **Retting:** Bestem kilden i spinen (konvensjonen «Data og formater»): «Menyen viser e-postadressen til den innloggede brukeren fra `getViewer()`, bare til brukeren selv. Ingen navn lagres i v1.» Rett UX til «e-postadressen din».

#### M11. Foreløpige AD-er og Deferred trenger byggerekkefølge og en felles reserve

- **Sted:** AD-6 og AD-9 `[PROVISIONAL]`, Deferred (Storage-verifisering, shadcn 4 mot Tailwind 3.4).
- **Problem:** AD-6 har en reserve, men AD-9 har ingen. Ingenting sier at verifiseringen skal skje før stories bygger bildevisning på mekanismen. Hvis shadcn CLI 4 ikke støtter Tailwind 3.4, står det ikke hva som skal gjøres. Da kan én story oppgradere Tailwind (brudd på AD-2) mens en annen låser en eldre CLI.
- **Retting:** I AD-9: «Reserven er den samme som i AD-6.» I Deferred: «Den første storyen som berører bilder, er en spike som skriver pgTAP-testene for AD-6 og AD-9 før andre stories bygger på dem.» For shadcn: «Støtter ikke CLI 4 Tailwind 3.4, låses siste CLI-versjon som gjør det. Tailwind oppgraderes ikke.»

### Lav

- **L1. Feilkoder uten kilde (konvensjonen «Feilkoder»).** `own_report` og `report_not_found` kan ikke utledes fra SQLSTATE. En RLS-avvisning ved INSERT gir 42501 for egen rapport, for skjult rapport og for en rapport som ikke finnes. Hva 42501 oversettes til, er heller ikke skrevet. *Retting:* «42501 → `forbidden`. `own_report` og `report_not_found` settes av Server Action etter en forhåndslesing fra visningen (bare for en bedre melding, AD-1). `stale_state` gjelder bare når raden finnes.»
- **L2. REST-testen (konvensjonen «Tester») nevner 401 og 403 for FR-7.** En dobbel bekreftelse gir 409 (23505) i PostgREST. *Retting:* «401, 403 og 409».
- **L3. Telleren (AD-5 mot EXPERIENCE.md).** UX skriver «altså `confirmation_count + 1`» og har en optimistisk +1 i bekreftknappen. Det strider mot «regner aldri selv». *Retting:* UX viser til `seen_count`. AD-5 tillater én optimistisk +1 på `seen_count`, som erstattes av serverens verdi etter `revalidatePath`. Ved `already_confirmed` viser knappen «Du har sett dette ✓» uten feiltoast.
- **L4. AD-6, «kjører under innsetterens RLS».** Det skal være kallerens (leserens) RLS. Ordet kan leses som at det trengs en `security definer`. *Retting:* Endre ordlyden.
- **L5. Merking før `final`.** AD-10, AD-12, AD-13 og AD-14 mangler `[ADOPTED]`, selv om antagelsene er godkjent (memlog 2026-11-06). Stack-raden «Docker Desktop: påkrevd, ikke installert ennå» er en statusmerknad. *Retting:* Merk AD-ene og skriv «påkrevd».
- **L6. Kodeverdier ved kjøring (AD-10, konvensjonen «Filter og sortering»).** Tolkningen av URL-en trenger en liste ved kjøring, og det står ikke hvor den kommer fra. Det står heller ikke hva som skjer når en parameter gjentas (`?category=a&category=b` gir en liste i Next). *Retting:* «Lista ved kjøring hentes fra `Constants` i `database.types.ts`. En parameter med flere verdier ignoreres.»
- **L7. Grants på visningen.** Supabase gir nye relasjoner i `public` alle rettigheter som standard, også visninger. AD-14 nevner bare tabeller. `r.*` i visningen låses når visningen opprettes. *Retting:* «`reports_with_counts` får `REVOKE ALL` og så `GRANT SELECT TO anon, authenticated`. En migrering som endrer `reports`, gjenoppretter visningen.»
- **L8. Datoformat.** «Sist oppdatert» og «2 dager siden» formateres på flere flater. *Retting:* Én modul, `lib/format.ts`, med `Intl.DateTimeFormat('nb-NO', { timeZone: 'Europe/Oslo' })`.
- **L9. AD-8, «ett kall om gangen per bruker».** Hvordan dette håndheves, og hva et samtidig kall får tilbake, er ikke sagt. Et `null` vises i dag som «Vi fikk ikke et forslag». *Retting:* «Låsen ligger i minnet i én prosess (lokal v1). Klienten har høyst ett kall i gang og forkaster svar på utdatert tekst.»
- **L10. Åpent fra 2026-10-28.** Zod står i Stack uten noen regel. Lagregelen håndheves ikke med lint (`no-restricted-imports` for `lib/supabase/client` og `process.env`). Node-versjonen er ikke låst (`engines`). Dette gir lav risiko for en solo-utvikler, men er billig å lukke.
- **L11. `author_id` er lesbar via REST** (også gjennom `image_path`). PRD §8 sier bare at *appen* ikke viser navn. *Retting:* Skriv at dette er godtatt, slik det ble godtatt for uuid-ene i bekreftelser (memlog 2026-10-28).

## Sjekkliste

| Kriterium | Resultat |
| --- | --- |
| Fastsetter de virkelige avviksstedene og overser ingen | Nesten. Mangler innloggingsvakt og retur-parameter (H3), testtilstand (H4), kilden til menynavnet (M10) og radtyper for visningen (M6) |
| Hver regel kan håndheves og hindrer sitt avvik | Nesten. H1, M1, M5, M7, M8 og M9 er regler som enten ikke kan bygges slik de står, eller som ikke hindrer avviket |
| Ingenting i Deferred lar enheter skille lag | Nesten. Storage-verifiseringen og shadcn/Tailwind trenger rekkefølge og reserve (M11). Pagineringen er greit utsatt, men NFR-6 må kunne måles (M3) |
| Dekker alle FR og NFR, også NFR-8 og PRD-endringene 2026-11-04 | Ja, på papiret. FR-5 for besøkende er i fare (H1, H3), NFR-6 kan ikke etterprøves (M3), og NFR-1 er bundet i AD-15 uten regel (M4) |
| Samsvar med UX der de overlapper | URL-parametre: motstrid om `mine` (H2). Teller: liten forskjell i ordlyden (L3). Lengdegrenser: samme tall, ulik telling (M5). Skjulte rapporter: samsvarer. «Sist oppdatert»: samsvarer, men seeden kan bryte det (H4). Paginering: samsvarer, «Vis flere» er borte fra skissene, men miniatyrbildene i DESIGN.md kolliderer med lenker som varer 60 s (M2). Menynavn: motstrid (M10) |
| Alle dimensjoner for nivået er avgjort, utsatt eller åpne | Ja. Ett lokalt miljø, ingen CI, logging, hemmeligheter, seed og testmiljø (men se H4) |

## Hva som er bra

- Klart paradigme: databasen eier reglene, og laget i Next.js er tynt. Lagene og avhengighetsretningen er tydelige, med ett navngitt unntak.
- AD-7 er presis: 42501 for ikke-moderatorer, en diff i `to_jsonb`, steg i enum-rekkefølgen og `status_changed_at` satt av triggeren.
- AD-5 samler telleren, «Mine rapporter» og «Din rapport» i én kilde, og det hindrer de vanligste avvikene i grensesnittet.
- AD-12 som en uttømmende matrise og AD-14 med lukkede standarder og pgTAP-vakter.
- AD-15 binder NFR-8 til en konkret kontroll som PRD og UX allerede bruker.
- Deferred har en begrunnelse og et tidspunkt for å se på saken igjen på hver rad, og PRD-endringene 2026-11-04 kan spores i memloggen.

## Anbefalt rekkefølge før `final`

1. H1, H2 og H3. Dette er korte endringer i AD-14, i filterkonvensjonen (og UX) og i AD-3.
2. H4 og M3. Testtilstand og seed i AD-15 og AD-11.
3. M1, M2, M5, M6, M7, M8, M9 og M10.
4. M11 og L1–L11. Kan tas sammen med merkingen av `final`.
