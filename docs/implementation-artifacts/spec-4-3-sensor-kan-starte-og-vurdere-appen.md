---
title: 'Story 4.3: Sensor kan starte og vurdere appen'
type: 'chore'
created: '2026-11-22'
status: 'in-review'
route: 'dispatch'
review_loop_iteration: 1
baseline_commit: 'ac82c4bb22e0bf5e9ae814f4436a4ff89acbfd92'
context:
  - '{project-root}/docs/implementation-artifacts/epic-4-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** README er ikke komplett for sensor. Den mangler skjermbilde, tabell over hvilke tester som dekker kravene, lenke til et skjermopptak og hvordan moderatoren bruker appen, og statusen står fortsatt på Epic 3. README er heller ikke fulgt på en ny klone siden Story 1.2 (SM-7, AR-16).

**Approach:** README fullføres. Dekningstabellen legges i `docs/testdekning.md`, som README lenker til. Skjermbildet lages med Playwright mot seed-dataene. Deretter følges README steg for steg på en ny klone i en tom mappe, og alt som må rettes, rettes i README. Full `npm test` kjøres der og i CI, og resultatet står i PR-beskrivelsen.

## Boundaries & Constraints

**Always:**
- Ingen regler endres: ingen migrering og ingen endring i app-koden. Unntaket er en rettelse som klonekjøringen viser at trengs for å starte, og den føres i Implementation Notes.
- Dekningstabellen har én rad for hver av FR-1–FR-9, NFR-1–NFR-8 og SM-1–SM-7, med testfilene og det som er sjekket for hånd. Hull står som hull, for eksempel nettbrettbredde (NFR-1), NFR-7 uten automatisk test og at skjermleser ikke er testet.
- README er sann for en ny klone. Kommandoene er kopierbare og virker i PowerShell, Git Bash og WSL.
- Klonekjøringen følger README-teksten, ikke egen hukommelse. Det som ikke kunne prøves rent (for eksempel at Docker-bildene allerede lå lagret), står i PR-beskrivelsen.
- PR-en bruker `Closes #39` og har sammendraget: antall beståtte tester per runner og antall axe-funn.
- **Beslutninger** (prosjekteier, 2026-11-22):
  - **Skjermopptaket** lages med Playwright: kjerneflyten i sakte tempo uten tale, som `.webm` i `docs/skjermbilder/`, med et skript som lager det på nytt. Det kjøres ikke i `npm test`.
  - **Vercel-linja** («Live: …») fjernes fra README. README sier bare at appen kjører lokalt.
  - **Node 24 beholdes** (W3). `engines` og `.npmrc` endres ikke. README sier tydelig «Node 24, ikke 26» og hvorfor, viser feilmeldingen `npm ci` gir på Node 26 og forklarer hvordan du bytter versjon.
  - **Spec-en beholdes hel** (omtrent 2500 tokens), selv om den er over grensen.

**Never:**
- Ingen `test.skip` eller `fixme`, og ingen eksisterende test svekkes.
- Ingen nøkler, `.env` eller personopplysninger i repoet, skjermbildet eller opptaket.
- Åpne punkter utenfor README og sensor (for eksempel PRD §8, CI på alle PR-er og avklaringene fra Cloudflare) tas ikke inn her.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Ny klone | tom mappe, uten `.env` og `node_modules`, Docker kjører | appen starter, seed-dataene vises, `npm test` gir exit 0 | feil rettes i README og prøves på nytt |
| Uten Docker | sensor får ikke startet Docker | README lenker til skjermopptaket av kjerneflyten (under 3 min) | – |
| Lang sti på Windows | klone i en svært lang sti | README sier at du kloner til en kort sti | – |
| Moderator | `moderator@localfix.test` logger inn | README sier hvor panelet er og hva det kan (status, skjule og vise) | – |

</frozen-after-approval>

## Code Map

- `README.md` -- har allerede Docker først, versjonstabell, kommandoer, testbrukere, SQL for moderator, testkommandoer, mock-modus og KI. Mangler skjermbilde, lenken til testdekning, opptak, moderatorbruk, Epic 4-status og merknaden om kort sti. Linje 3 er Vercel-linja. Statusavsnittet (linje 11) er én lang setning per story.
- `.npmrc` (`engine-strict=true`), `.nvmrc` (`24`), `package.json` `engines.node ^24.0.0` -- W3.
- `.env.example` -- nøkkelen sjekkes mot `npx supabase status` i klonen.
- `.github/workflows/npm-test.yml` -- følger README-stegene på ubuntu. Kjører ved push til `ci/**` og ved `workflow_dispatch`. Er den uavhengige kontrollen fra en ren maskin.
- `playwright.config.ts` -- prosjektene `les-360/1280`, `endrer-360/1280` og `reset` (NFR-6 ligger i `e2e/reset/liste.spec.ts`). `e2e/a11y.ts` har axe-hjelperen. `core-flow.spec.ts` er grunnlaget for opptaket.
- Dekningskart (fra undersøkelsen, bekreftes mot filene): FR-1 `e2e/endrer/registrering.spec.ts`, `features/auth/signup-role.db.test.ts`. FR-2 og SM-3 `features/moderering/status.db.test.ts`, `supabase/tests/status.sql`. FR-3 og SM-1 `e2e/endrer/ny-rapport.spec.ts`, `bilde.spec.ts`. FR-4 og SM-6 `e2e/endrer/ki-forslag.spec.ts`, `features/registrering/ai/index.test.ts`. FR-5 `supabase/tests/lesing.sql`, `e2e/les/forside.spec.ts`, `detalj.spec.ts`. FR-6 og SM-4 `e2e/les/filter.spec.ts`, `mine.spec.ts`. FR-7 og SM-2 `supabase/tests/bekreftelser.sql`, `features/bekreftelser/bekreftelser.db.test.ts`, `e2e/endrer/bekreft.spec.ts`. FR-8 `e2e/endrer/status.spec.ts`. FR-9 `e2e/endrer/skjul.spec.ts`. NFR-1 og NFR-8 `e2e/core-flow.spec.ts`, `e2e/les/keyboard.spec.ts`. NFR-4 `supabase/tests/skriving.sql`, `vakter.sql`. NFR-5 `e2e/les/manifest.spec.ts`. NFR-6 `e2e/reset/liste.spec.ts`. SM-5 `evals/sm5/` (`npm run eval:sm5`, gjøres for hånd mot leverandøren, 19/20). SM-7 er klonekjøringen fra denne storyen.
- `.logs/ali-yousef-abdulla/issues.md` linje 70, 71, 98, 122 og 145 -- lukkes av denne storyen. `sprint-status.yaml` action item `epic-1-retro-item-1` settes til `done`.
- `supabase.exe` er blokkert av Windows' programkontroll i prosjektmappen (`npx supabase …` gir `spawn UNKNOWN`). `npm run build`, `next start`, `test:unit`, `lint` og `npx playwright test <fil> --project …` mot en app som allerede kjører, virker. Docker-containerne til lokal Supabase deles med klonen i Temp og kan allerede kjøre. Skriptene for skjermbilde og opptak tar derfor en base-URL mot en app som kjører, og kaller aldri Supabase-CLI-en. Starter de appen selv, er det med `next start` og `AI_PROVIDER=mock`. Full `npm test` og alt som trenger `db reset`, kjøres bare i klonen i Temp (kort sti, for eksempel `%TEMP%\sm11`, `npm ci`, `cp .env.example .env`). En lang sti gir «Filename too long».
- Ingen push og ingen remote-operasjoner under implementeringen.

## Tasks & Acceptance

**Execution:**
- [x] `scripts/skjermbilde.mjs` (eller en Playwright-spec utenfor `npm test`) + `docs/skjermbilder/*.png` -- lag skjermbildet av lista på 360 px og detaljsiden med moderatorpanelet på 1280 px fra seed-dataene. Kommandoen står i README -- AR-16.
- [x] `docs/testdekning.md` -- tabellen over krav og tester: krav, kort tekst, testfiler og hva som er sjekket for hånd, pluss hvordan hver testtype kjøres. Hver testfil i tabellen må finnes -- AC 4.
- [x] `README.md` -- statusen: alle fire epicene er ferdige. Nytt avsnitt «Som moderator»: panelet, statusstegene, skjule med bekreftelse og vise. Legg inn skjermbildet, lenken til `docs/testdekning.md`, lenken til opptaket, at du kloner til en kort sti på Windows, og teksten om Node 24 fra beslutningen. Fjern Vercel-linja. Avsnittet om data fra testene og personvern står fortsatt -- AR-16, P-2, NFR-3, NFR-7.
- [x] `scripts/` + `docs/skjermbilder/kjerneflyt.webm` -- skjermopptaket med Playwright-video: kjerneflyten fra AD-15 i sakte tempo, under 3 minutter og helst under 10 MB. Kommandoen står i README.
- [ ] Klonekjøringen (gjøres av hovedsesjonen etter review, når grenen er pushet, ikke av implementeringen) -- følg README i en tom mappe på kort sti (`git clone -b feat/story-4-3`, `npm ci`, `npx supabase start`, `cp .env.example .env`, `npm run dev` med seed i nettleseren, `npx playwright install chromium`, `npm test`). Sjekk at nøkkelen i `.env.example` er lik `npx supabase status`. Rett README og prøv på nytt -- SM-7.
- [ ] CI (etter review, som over) -- kjør `npm-test.yml` med `workflow_dispatch` på grenen. Ta med antall og tid fra både klonen og CI i PR-en.
- [x] axe-tilstandene -- sjekk lista over tilstandene AD-15 krever, mot `e2e/`. Mangler en tilstand en skanning, legges den til i den nærmeste spec-en.
- [ ] `issues.md` og `sprint-status.yaml` -- lukk punktene i Code Map med dato og henvisning, men bare de som er gjort. Linje 70 (W3) og 145 (kort sti) lukkes av README-endringen. Linje 71, 98 og 122 og retro-punktet lukkes av hovedsesjonen etter klonekjøringen.

**Acceptance Criteria:**
- Gitt README, når en sensor leser den, så finner hen alt som AR-16, P-2, NFR-3 og NFR-7 krever, et skjermbilde, en lenke til dekningstabellen og en lenke til opptaket, uten at noe strider mot hverandre.
- Gitt en ny klone i en tom mappe, når README følges steg for steg, så starter appen, seed-dataene vises og `npm test` gir exit 0. Alt som måtte rettes, er rettet i README.
- Gitt testpakken, når `npm test` og `npm run lint` kjøres, så består alt. axe gir null funn med alvorlighet serious eller critical, og ytelsestesten består.
- Gitt `docs/testdekning.md`, når kravene leses, så har hvert av de 24 kravene en rad, og hver testfil som er nevnt, finnes.

## Implementation Notes

- **Skjermbilder:** `scripts/skjermbilde.mjs [base-URL]` (standard `http://localhost:3000`) lager `docs/skjermbilder/liste-360.png` (besøkende, 360 × 800, deviceScaleFactor 2) og `detalj-moderator-1280.png` (rapport 2 som moderator, 1280 px, hel side). Endrer ingen data. Laget mot `next build` + `next start -p 3100` med `AI_PROVIDER=mock` og seed-dataene.
- **Opptak:** `scripts/opptak.mjs [base-URL]` lager `docs/skjermbilder/kjerneflyt.webm`: 1280 × 720, 90 s, 7,8 MB. Sju steg med tekstlinje nederst og ramme rundt elementet før hvert trykk: besøkende ser lista, bruker1 logger inn, filtrerer på «Vei og fortau», bekrefter rapport 8, registrerer en rapport med mock-forslag og testbildet til seed-rapport 3 (CC0), moderatoren logger inn, sorterer på «Flest har sett», flytter statusen til Under behandling og skjuler rapporten med dialogen. Opptaket lagres bare når hele flyten gikk gjennom. Skriptet endrer data, så README sier `npx supabase db reset` etterpå. Her ble radene fjernet med SQL som `postgres` via `docker exec` (Supabase-CLI-en er blokkert i prosjektmappen), så den delte databasen har seed-dataene igjen (9 rapporter, 7 bekreftelser, 3 bildeobjekter).
- **Ingen kall til Supabase CLI** i skriptene, og de er ikke en del av `npm test`. `expect` har 30 s grense, fordi `npm run dev` bygger hver side første gang.
- **axe-tilstandene (AD-15)** er sjekket mot `e2e/`, og alle har en skanning, så ingen spec er endret: lista som besøkende (`forside.spec.ts`, `core-flow.spec.ts`), innlogget med filtre (`mine.spec.ts`), moderator med skjult rapport (`skjul.spec.ts`), tom (`reset/liste.spec.ts`, `mine.spec.ts`), ingen treff (`filter.spec.ts`); detaljsiden som besøkende (`detalj.spec.ts`), bruker (`bekreft-tilstander.spec.ts`), moderator med panel (`status.spec.ts`), skjult rapport (`detalj-innlogget.spec.ts`, `skjul.spec.ts`), åpen `AlertDialog` (`skjul.spec.ts`, `core-flow.spec.ts`); skjemaet tomt og med valideringsfeil (`ny-rapport.spec.ts`) og med KI-forslag (`ki-forslag.spec.ts`); innlogging (`innlogging.spec.ts`) og registrering (`registrering.spec.ts`).
- **Nettbrettbredde (NFR-1):** sjekket én gang med et engangsskript (ikke i repoet) på 768 og 1024 px: `scrollWidth <= clientWidth` på lista med og uten filter, detaljsidene 2, 5 og 7 (7 som moderator), skjemaet, innlogging og registrering. Står i `docs/testdekning.md` som sjekket for hånd, og fortsatt som hull for automatisk test.
- **Node 26-feilmeldingen** i README er formatet npm 11 gir med `engine-strict` (gjenskapt med `engines.node ^22.0.0` på Node 24.19.0), med versjonene i «Actual» erstattet med `v26.…`/`…`. Den er ikke kjørt på en ekte Node 26.
- **README:** Vercel-linja er fjernet. Statusen er fire punkter, ett per epic, og innholdet fra det lange statusavsnittet er flyttet til et nytt avsnitt «Bruke appen». «Forventet tid» er oppdatert fra 4 min 28 s til 10–15 minutter med tallene fra Story 4.2 (839 s lokalt, 8 min 42 s i CI), og bør rettes med tallet fra klonekjøringen.
- **Ikke gjort her (hovedsesjonen):** klonekjøringen, sjekken av nøkkelen i `.env.example` mot `npx supabase status`, CI med `workflow_dispatch`, og å lukke `issues.md` linje 71, 98 og 122 og `epic-1-retro-item-1`. Linje 70 og 145 er lukket.
- Verifisert: `npm run lint` og `npx tsc --noEmit` uten feil, `npm run test:unit` 1108 bestått, alle 63 stiene i `docs/testdekning.md` finnes, og den har 24 kravrader. Tabellen «Testbrukere» i README leses fortsatt likt av `seed-login.db.test.ts`.

## Spec Change Log

## Review Triage Log

Gjennomgang 1: Blind Hunter (13 funn), Edge Case Hunter (7) og Verification Gap (0 hull, 1 annet funn). Alle patchene er brukt (commit etter cdfe317). Etterpå: `npm run lint`, `npx tsc --noEmit` og `npm run test:unit` (84 filer, 1108 tester) grønne.

- **VG-annet/BH1, low, patch:** `epic-4-context.md:26` sier «siden det ikke finnes CI», men `npm-test.yml` finnes. Leddet fjernes.
- **BH2, false:** at `epic-4-context.md` er kortere, er tilsiktet (compile-reglene: ikke ta med det som kan leses av koden). Reglene som er tatt ut, står i koden og i arkitekturen.
- **BH3, medium, patch:** NFR-2 og SM-7 i `testdekning.md` sier mer enn CI viser. CI går på Linux med Docker ferdig installert, med `--with-deps`, og bare ved `ci/**` eller manuell start. Radene skrives om så de sier det.
- **BH4, false:** klonekjøringen og lukkingen av punktene står som egne oppgaver etter review. SM-7-raden og «Forventet tid» oppdateres med resultatet. `issues.md` linje 73 (Linux) oppdateres etter CI.
- **BH5, low, avvist:** en Vitest-test som sjekker stiene i `testdekning.md`, er en ny fil og er ikke nødvendig nå.
- **BH6, low, patch:** innledningen til `testdekning.md`: definisjonen av «Hull» skal passe til NFR-1, det skal stå at `eval:sm5` ikke er med i `npm test`, og fila skal ha en datolinje.
- **BH7, low, patch:** NFR-1 («de fleste spec-ene») og NFR-8 skal navngi filene.
- **BH8, low, patch:** `.webm`-fila i repoet var prosjekteierens valg. README får en merknad om at fila åpnes i Chrome, Firefox eller Edge. Avspilling på GitHub sjekkes etter push.
- **BH9, low, patch:** kommentaren øverst i `opptak.mjs` sier at flyten er den samme som i core-flow. Den bruker mus og en del av flyten. Bare tastatur i opptaket avvises.
- **BH10/EC2/EC3/EC7, low, patch:** `opptak.mjs` skal skrive en melding når opptaket ikke blir lagret (kjør `db reset` og bruk mock). README skal ha `npx supabase db reset` også før `opptak.mjs`.
- **BH11, low, delvis patch:** kommentaren i `skjermbilde.mjs` skal si «endrer ingen rapportdata». At den teller `listitem` for bredt og at innloggingen er duplisert, avvises.
- **BH12, low, patch:** EBADENGINE-utskriften merkes som forkortet, og «Som moderator» nevner at en besøkende får 401. «Forventet tid» oppdateres etter klonekjøringen.
- **BH13, false:** spec-en ble holdt utenfor diffen med vilje. Edge Case Hunter fikk den som claims-fil.
- **EC1, low, patch:** `BASE_URL = new URL(arg ?? standard).origin` i begge skriptene, så `/` på slutten ikke gir `//`.
- **EC4/EC5/EC6, low, avvist:** lekkasje av tmp-mappa når start feiler, feil i `finally` og en sjekk av lengden er ikke sannsynlige i vanlig bruk. Opptaket er 90 s.

## Verification

**Commands:**
- `npm run lint` og `npx tsc --noEmit` -- uten feil.
- `npm test` i klonen i Temp -- exit 0, med kjøretiden.
- `gh workflow run npm-test.yml --ref feat/story-4-3` -- grønn.
- Et lite skript som sjekker at hver sti i `docs/testdekning.md` finnes -- ingen mangler.

**Manual checks:**
- README og testdekning gjengis riktig på GitHub, og bildene og lenkene virker.
