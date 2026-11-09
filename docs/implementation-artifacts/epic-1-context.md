# Epic 1 Context: Alle kan se rapportene på campus

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

En besøkende åpner appen, ser lista over testrapportene og kan åpne en detaljside med status, bilde, «N har sett dette» og «sist oppdatert». Epicen legger grunnmuren for hele LocalFix: startpakken, lokal Supabase i Docker, testoppsettet med kjerneflyttest og axe, datamodellen med leseregler og faste, oppdiktede seed-data, og en spike som avklarer bildereglene før Epic 2 bygger opplasting. Appen skal kunne startes lokalt etter README, i mock-modus og uten nøkler, betalte tjenester eller skytjenester.

## Stories

- Story 1.1: Startpakke og lokal Supabase
- Story 1.2: Testoppsett: Vitest, Playwright, axe og kjerneflyttest
- Story 1.3: Testrapporter i den lokale databasen
- Story 1.4: Rapportlista
- Story 1.5: Detaljsiden
- Story 1.6: Bildespike: reglene for bilder er testet
- Story 1.7: Bilder på detaljsiden og i lista

## Requirements & Constraints

- **Lesing for alle:** Alle, også uten innlogging, ser synlige rapporter. Hver rad viser kategori, `summary ?? description`, status og «har sett dette», og lenker til en detaljside med alle feltene og bildet. Skjulte rapporter vises bare for moderator; for alle andre gir en direkte lenke 404. En ny rapport viser 1.
- **Kjørbar for sensor:** Appen startes etter README uten gruppens nøkler. Lokal database og bildelagring har testdata, og KI-en går i mock-modus uten nøkkel. Ingen nøkler i repoet, `.env.example` lister alle variablene, `.env` står i `.gitignore`.
- **Installerbar:** `app/manifest` gir PWA-installasjon, uten service worker eller offline-støtte.
- **Ytelse:** Lista med 100 rapporter lastes på under 2000 ms mot `next start` (egen fixture i `e2e/`, rører aldri `supabase/seed.sql`). Lista henter høyst 500 rader og sier fra når den er avkortet.
- **Personvern:** Testbrukere og rapporttekster er oppdiktet. Seed-bilder viser ingen ansikter eller lesbare bilskilt (tatt selv eller CC0, med kilde i `seed-images/`), og README sier at v1 ikke behandler personopplysninger. Appen sender aldri `author_id`, `user_id` eller `image_path` til nettleseren, og Playwright sjekker siden og RSC-nyttelasten for dette.
- **Definisjon av ferdig (hver story):** Issue, egen branch, PR med `Closes #N`. Playwright, pgTAP og Vitest består, axe uten `serious`/`critical`-funn, `e2e/core-flow.spec.ts` utvidet bare med tastatur og uten `test.skip`/`test.fixme`, ingen horisontal scrolling på 360 og 320 px. Rettighetsregler håndheves og testes i databasen. PR-en har sammendraget fra testkommandoen (bestått og axe-funn) og funnene fra kodegjennomgangen. Regelendringer føres i planleggingsdokumentet (begge kopier der det finnes to) og `docs/beslutninger/` i samme PR. Siste story i epicen følger README steg for steg på en ny klone.

## Technical Decisions

- **Paradigme:** Databasestyrt, servergjengitt monolitt. Postgres (RLS, grants, triggere, visning) eier alle regler, og appen filtrerer aldri på `hidden` selv. Sider leser i Server Components, ingen egne REST-ruter. Supabase-klienter opprettes bare i `lib/supabase/`. `components/` importerer verken `lib/supabase/` eller `lib/ai/` (unntatt `import type`). Tjenestenøkkelen brukes bare i seed og migrering.
- **Versjoner:** Eksakte versjoner, aldri `latest`; de står i `package.json` og Stack-tabellen i arkitekturen. Supabase CLI 2.x kjøres med `npx supabase` (3.x brukes ikke). shadcn kjøres med `npx shadcn@4.23.0`, og `components.json` må peke på `tailwind.config.ts`, ellers lager CLI-en Tailwind v4-komponenter. Ingen nye npm-avhengigheter uten at Stack-tabellen oppdateres.
- **Miljø:** Alle miljøvariabler valideres i `lib/env.ts`, ingen andre filer leser `process.env`. `AI_PROVIDER=mock|openai`, mock er standard. `supabase/config.toml` endres bare i en egen commit. `cacheComponents` er av, fordi den ikke tillater `force-dynamic`.
- **Datamodell:** `profiles`, `reports`, `confirmations`. Enumrekkefølgen er kontrakt. Alt `NOT NULL` unntatt `reports.summary` og `reports.image_path` (`NULL`, aldri tom streng). Lengdegrensene står både i `CHECK` og `lib/limits.ts`. Ingen sletting (`ON DELETE RESTRICT`, ingen DELETE/TRUNCATE-grant). En migrering som endrer `reports`, lager `reports_with_counts` på nytt i samme migrering; en pgTAP-vakttest feiler ellers.
- **Visningen `reports_with_counts`:** `security_invoker = true`, kolonnene i `reports` pluss `confirmation_count`, `seen_count` (den eneste telleren UI viser), `confirmed_by_me` og `authored_by_me`. Lista og detaljsiden leser bare herfra med `REPORT_COLUMNS` fra `lib/supabase/types.ts`. Typer genereres med `npm run db:types`; norske navn bare i `lib/labels.ts`.
- **Leseregler:** RLS og `REVOKE ALL ... FROM anon, authenticated` i samme migrering som oppretter tabellen. Policyer navngir rolle (`TO anon` / `TO authenticated`); moderator via `private.is_moderator()` (`STABLE`, `SECURITY INVOKER`, rollen leses aldri fra JWT). pgTAP bruker `tests.as_user(uuid)`/`tests.as_anon()`.
- **Ingen cache:** Sider som leser visningen eller lager signerte lenker er `force-dynamic`. Ingen `'use cache'`, `unstable_cache` eller `fetch`-cache. Bilder med `<img>` eller `next/image` med `unoptimized`. Svar med signerte lenker har `Cache-Control: private, no-store`.
- **Bilder (`[PROVISIONAL]` til spiken i Story 1.6):** Privat bucket `report-images` (5 × 1024 × 1024 byte, JPEG/PNG/WebP), satt i `config.toml`; seed-bilder i `seed-images/<bruker-uuid>/` lastes via `objects_path`, og noen seed-rapporter, også minst én skjult, peker på dem. Sti `<author_id>/<uuid>.<ext>`, med `UNIQUE (image_path)` og `CHECK (image_path IS NULL OR image_path LIKE author_id::text || '/%')`. Storage-policyer: SELECT for `anon` når rapporten er synlig, SELECT for `authenticated` når den er synlig eller brukeren er moderator, INSERT bare i egen mappe, ingen UPDATE/DELETE. Spiken tester dette i pgTAP og `createSignedUrl` i Vitest, og skriver i arkitekturen hvilken rettighet `createSignedUrl` krever. Består alt, settes AD-6 og AD-9 til `[ADOPTED]` og Deferred-raden fjernes. Feiler noe, stopper bildearbeidet, og prosjekteieren velger reserven (en server-eid modul som signerer etter at rapporten er lest med brukerens sesjon), ført i `docs/beslutninger/` før Story 1.7.
- **Visning av bilder:** Én serverfunksjon lager én signert lenke på 60 sekunder, så en reserveløsning bare endrer den funksjonen. Ingen lenke lages for en skjult rapport. Lista viser bare et ikon; serveren regner ut om rapporten har bilde, og `image_path` sendes aldri til nettleseren.
- **Formater og feil:** `timestamptz` i UTC, vist i `Europe/Oslo` bare via `lib/format.ts`. Ugyldig, skjult eller manglende id gir `notFound()`, med Zod-validering før databasekall. Logging bare `console`, aldri rapporttekst eller e-post.
- **Tester:** Playwright i `e2e/`, prosjekter 360×800 og 1280×800, `workers: 1`, i fast rekkefølge (lesetester, tester som endrer data, tester med egen `db reset`). Tester som endrer data bruker egne rapporter og brukere. `npm test` kjører `test:unit`, `test:db` og `test:e2e`. Relativ tid testes i Vitest med fast «nå», aldri i e2e mot seed-data.

## UX & Interaction Patterns

- Tema og typografi fra `DESIGN.md` (bare lys modus, systemfont). Mobile-first, én kolonne, 16 px marg, maks 640 px sentrert, trykkflater ≥ 44 px. Kort har kantlinje, ikke skygge. `EXPERIENCE.md` går foran skissene når de sier ulikt.
- **Topplinja:** «LocalFix · Campus Molde». På detaljsiden og 404-siden for en rapport står «←» foran (`aria-label="Tilbake til lista"`); mockupens «← Rapport» brukes ikke. «←» går ett steg tilbake i historikken når forrige side er i appen (filtre og rulleposisjon bevares), går til lista etter en direkte lenke, og er en vanlig lenke til lista uten JavaScript.
- **Rapportkort:** Hele kortet én lenke, kategori venstre, statusmerke (alltid med tekst) høyre, `summary ?? description` maks to linjer, metadata «N har sett dette · 2 dager siden», bildeikon (lucide `Image`, 16 px, `aria-label="Har bilde"`) sist i metadatalinja. Relativ tid: «nå» under ett minutt eller fram i tid, deretter minutter, timer, dager, uker (under 30 døgn), måneder (30 døgn) og år (365 døgn), rundet ned, med entall for 1.
- **Lista:** Fire Skeleton-kort mens den laster; tom database gir «Ingen rapporter ennå. Har du sett noe som bør fikses?».
- **Detaljsiden:** Kategori venstre og statusmerke høyre, med «Sist oppdatert 4. november kl. 14:20» (uten årstall) rett under. Overskriften er oppsummeringen, eller kategorinavnet når den mangler. Beskrivelsen står alltid som eget avsnitt, deretter «Hvor:» med lokasjonen, «Registrert 20. oktober kl. 10:15» (samme format som «Sist oppdatert», ikke relativ tid) og «N har sett dette». Skissen viser bildet mellom overskriften og beskrivelsen. Mangler bildeobjektet, vises siden uten bilde og uten feil. Bildet har alternativ tekst.
- **Feil:** 404 er «Fant ikke rapporten.» med lenke tilbake. Feil ved lasting gir «Noe gikk galt. Prøv igjen.», knappen «Prøv igjen» (henter siden på nytt fra serveren) og lenken «Tilbake til lista»; rapporttekst og databasefeil vises aldri.
- Rapporttekst vises alltid som ren tekst; linjeskift bevares på detaljsiden, og lange ord brytes uten horisontal scrolling.
- Tone: du-form, kort og saklig, ingen utropstegn eller emoji (unntatt ✓).

## Cross-Story Dependencies

- Story 1.1–1.5 er ferdige: startpakke, `lib/env.ts`, lokal Supabase, manifest, testoppsettet med hjelperne `expectNoSeriousA11yViolations`, `tabTo` og `expectNoHorizontalScroll`, datamodellen med seed (fem kontoer, passord i README), lista på `/` og detaljsiden på `/rapporter/<id>`. Gjenstår: 1.6 og 1.7.
- Story 1.6 må være ferdig og AD-6/AD-9 satt til `[ADOPTED]`, eller reserven valgt i `docs/beslutninger/`, før Story 1.7 og bildeopplastingen i Epic 2 (som også må fjerne EXIF).
- Story 1.7 utvider kjerneflyttesten til å åpne en rapport med bilde bare med tastatur, og legger bildeikonet i lista.
- Senere stories: menyen kommer i Story 2.1, «Registrer problem» i Story 2.2, bekreftknappen i Story 3.3 og merkelappen «Skjult» og moderatorpanelet i Epic 4. Utsatt arbeid: «←» bør gå til lista når forrige side i appen ikke er lista (blir aktuelt med Story 2.2 og 3.3), og en norsk `app/not-found.tsx` mangler for ukjente URL-er.
