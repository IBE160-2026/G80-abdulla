# KI-logg

Logg over hvordan KI (Claude Code med BMAD-skills) er brukt i prosjektet. Hver økt har en egen oppføring: hva jeg ba om, hva KI foreslo, hva jeg bestemte, og hvilke commits det førte til. Detaljerte beslutninger med begrunnelse ligger i [beslutninger/](beslutninger/).

**Verktøy:** Claude Code (CLI) med BMAD-skillene `bmad-product-brief`, `bmad-prd` og `bmad-ux` (september og oktober), og fra 28. oktober også `bmad-deep-recon`, `bmad-architecture`, `bmad-create-epics-and-stories`, `bmad-sprint-planning`, `bmad-build`, `bmad-code-review`, `bmad-walkthrough`, `bmad-retrospective`, `bmad-advanced-elicitation` og `bmad-help`, designskillen Impeccable og prosjektskillen `sesjonslogg`. Hver økt er også logget i [.logs/ali-yousef-abdulla/](../.logs/ali-yousef-abdulla/), og oppføringene under lenker dit.

---

## 2026-09-18: Product brief og første PRD

**Ba om:** Product brief og PRD for LocalFix ut fra min egen beskrivelse av ideen.

**KI gjorde:**
- skrev briefen fra teksten min og flyttet konkurrentresearch til `addendum.md`
- lagde PRD med brukerreiser, krav (FR) og antagelser

**Jeg bestemte:**
- Norsk som dokumentspråk.
- Hurtigsporet i PRD-en, med antagelser jeg gikk gjennom etterpå.
- Hold v1 enkel: KI-en foreslo utvidet statusrett, generalisering av adresser og en «rapporter»-knapp. Jeg avviste alle tre (se `prd-beslutningslogg.md`).

**Commits:** `08676b0`, `f38a9fa` (lastet opp 2026-09-21). Disse inneholder bare product briefen. Den første PRD-en ble liggende i BMAD-mappen utenfor repoet og kom inn i repoet først i `ceeedc3` 2026-10-11, da i oppdatert versjon.

---

## 2026-10-11: Oppfølging av faglærers tilbakemelding, PRD og UX

### Product brief
**Utgangspunkt:** Faglærers tilbakemelding (`tilbakemeldinger/tilbakemelding-product-brief.md`) ba om tre ting: avklarte roller, et KI-kriterium som kan testes, og at sensor kan kjøre appen uten nøklene mine.

**KI foreslo:** alternativer for roller, lokalmiljø, utvidelse og lokal kjøring.

**Jeg bestemte:**
- innlogging med moderatorrolle
- campus Molde som lokalmiljø
- filtrering og sortering som utvidelse, ikke duplikatsjekk (den er parkert)
- lokal Supabase og KI-mock

**Rettet underveis:** Briefen sa «registrere en rapport med bilde», og den første PRD-en antok at bilde var obligatorisk. I PRD-arbeidet bestemte jeg at bilde skal være valgfritt, og briefen ble rettet slik at de to dokumentene sier det samme.

**Commit:** `23431d8`

### PRD
**KI foreslo:** at PRD-en skulle følge den nye briefen. Fem tidligere beslutninger ble overstyrt, blant annet at status nå endres av en moderator, ikke av rapportøren.

**Jeg bestemte:**
- statusflyten går ett steg fram eller tilbake
- skjulte rapporter er bare synlige for moderator
- bilde er valgfritt
- PRD-en legges i `docs/`

**Avviste KI-forslag:** KI-en anbefalte Claude via Anthropic API som språkmodell, med begrunnelsen at det var billig og at mock-modus gjorde gratisnivå unødvendig. Jeg sjekket faglærers tilbakemelding, som krever **gratisnivå**, og valgte i stedet en leverandør med gratisnivå (alternativ A). Valget av leverandør tas i arkitekturfasen.

**Commits:** `ceeedc3`, `f1510ae`

### UX
**KI foreslo:** spørsmål om stil, farger og oppførsel, og lagde fire fargetemaer jeg kunne se i nettleseren (`ux/mockups/fargetemaer.html`).

**Jeg bestemte:**
- rolig og saklig stil
- fargetemaet Fjordblå
- shadcn/ui
- bare lys modus
- skjema på én side med beskrivelsen først
- flytende «+»-knapp
- KI-kategori forhåndsvalgt, men mulig å endre

**Gjenstår å kontrollere:** antagelsene i UX-dokumentene (tegngrense, forsinkelse på KI-forslaget, kontrast).

**Commit:** `bdb0b9a`

### Sensorveiledning
**Gjort:** Sjekket repoet mot sensorveiledningen for del 1. Fant at README hadde feil prosjektnavn, at en fil lå løst i rotmappa, at beslutningsloggene ikke var i repoet, og at det manglet KI-logg og bruk av branches og pull requests.

**Tiltak:** Denne loggen, `beslutninger/`, opprydding i repoet og en ny README. Fra nå blir arbeidet gjort i branches med pull requests.

**Branch:** `docs/prosessdokumentasjon`

---

## 2026-10-28: Prosjektsjekk, sesjonslogg og KI-research

### Prosjektsjekk og opprydding
**Ba om:** Sjekk at alt stemmer (README-lenker, FR-1–FR-9, datoer og commit-hasher i denne loggen), og rett funnene. Senere: BMAD-dokumentene skulle ligge synlig i `docs/planning-artifacts/` i stedet for den skjulte `.docs/`.

**KI gjorde:** Fant at lenker, krav og hasher stemte og at `docs/` og kopiene var like bortsett fra linjeskift. Rettet én utdatert setning, flyttet `.docs/planning-artifacts` til `docs/planning-artifacts` og pekte BMAD-konfigurasjonen dit.

**Jeg bestemte:**
- repoet skal ligne faglærerens, med BMAD-dokumentene synlige i `docs/planning-artifacts/` og ikke i en skjult mappe
- `docs/` er hovedkopi, og rettelser gjøres der

**PR-er:** #1–#5 (flettet). Detaljer: [prosjektsjekk-og-opprydding](../.logs/ali-yousef-abdulla/999-2026-10-28-13-30-35-prosjektsjekk-og-opprydding.md).

### Sesjonslogg: push via branch og PR
**Ba om:** Oppdatere `sesjonslogg`-skillen og `CLAUDE.md` (med subagenter i parallell) så loggcommiter pushes via en egen branch og PR, aldri rett til `main`.

**KI gjorde:** Rettet «Ikke push»-punktet i skillen og la inn regelen i `CLAUDE.md`. PR #7 ble laget. Flettingen ble stoppet av tillatelsene i Claude Code og gjort etter min godkjenning 2026-11-06.

**Detaljer:** [sesjonslogg-pr-flyt](../.logs/ali-yousef-abdulla/998-2026-10-28-21-06-55-sesjonslogg-pr-flyt.md).

### KI-research og arkitektur
**Ba om:** Forslag til research før PRD-en, og valgte å researche KI-leverandør med gratisnivå (PRD §11, åpent spørsmål 1). Deretter startet arkitekturen.

**KI gjorde:** Research med digests for Gemini, Cloudflare Workers AI, Groq, Mistral, OpenRouter og norsk modellkvalitet. Ingen klar vinner. PRD §8 og §11 ble oppdatert (rapportteksten sendes til en ekstern KI-tjeneste, og Gemini gratis brukes ikke med ekte data).

**Detaljer:** [ki-research-og-arkitektur](../.logs/ali-yousef-abdulla/997-2026-10-28-22-06-34-ki-research-og-arkitektur.md).

---

## 2026-10-29: Research på brukerstemmer og arkitektur

**Ba om:** Mer research (brukerstemmer og konkurrenter, kjørt i økten), og at briefen og arkitekturen skulle oppdateres etter funnene.

**KI gjorde:**
- `research.md` med 29+1 kilder og 7 anbefalinger. Kildestatus: 0 verifisert, 9 uverifisert, 3 omstridte, 1 overstyrt. Grunnlaget er tynt, nesten ingen norske brukerstemmer.
- Oppdaterte briefen: forskjellen er en én-trykks teller som sorterer lista. Fallgruvesetningen er attribuert til tidligere research, siden den nye researchen ikke fant data på duplikater og spam.
- Arkitekturen dekker FR-8 «sist oppdatert»: `reports.status_changed_at` (AD-4), satt av triggeren `reports_guard_update` (AD-7).

**Detaljer:** [research-brukerstemmer-og-konkurrenter](../.logs/ali-yousef-abdulla/996-2026-10-29-13-06-03-research-brukerstemmer-og-konkurrenter.md), [brief-oppdatering](../.logs/ali-yousef-abdulla/995-2026-10-29-13-58-00-brief-oppdatering-etter-research.md), [arkitektur-sist-oppdatert](../.logs/ali-yousef-abdulla/994-2026-10-29-14-17-48-arkitektur-sist-oppdatert.md).

---

## 2026-11-04: Status og PRD-vurdering

**Ba om:** `/bmad-help` for status, så KI-ens vurdering av PRD-en, og at alt som ble nevnt ble rettet.

**KI gjorde:** Viste at brief, PRD og UX var ferdige og kjørte spine-linteren på arkitekturen. Vurderte PRD-en og rettet den: nytt klimaks i UJ-3 med «Mine rapporter», ordlisten, FR-3, FR-4 og FR-6, og at leverandøren velges med SM-5-testen i implementeringen.

**Jeg bestemte:**
- telleren «har sett dette» viser rapportøren pluss bekreftelsene, så en ny rapport viser 1
- NFR-8 har en kontroll: ingen alvorlige eller kritiske funn i en automatisk tilgjengelighetstest, og kjerneflyten kan gjennomføres bare med tastatur

**Detaljer:** [status-og-neste-steg](../.logs/ali-yousef-abdulla/993-2026-11-04-22-29-02-status-og-neste-steg.md), [prd-vurdering](../.logs/ali-yousef-abdulla/992-2026-11-04-22-39-17-prd-vurdering.md).

---

## 2026-11-06: Sensorsjekk, UX, arkitektur final, epics og Docker

### Sensorsjekk del 1
**Ba om:** En sammenligning mot sensorveiledningen for del 1, og at alt som ikke var i `main` ble flettet.

**KI gjorde:** Fant at `main` manglet det siste arbeidet (20 commits uten PR) og at dokumentene ikke sa det samme (for eksempel tegngrense). Laget og flettet PR #10, #7, #11 og #17, og la funnene i `issues.md`.

### UX etter PRD-vurdering og UX-presiseringer
**Ba om:** Rette avvikene mellom UX, PRD og arkitektur. Senere: rette fire punkter etter KI-ens vurdering av UX-en, før epics og stories.

**KI gjorde:** Oppdaterte `EXPERIENCE.md` (begge kopier) og skissene, og viste kategorivalget i tilstanden «KI tenker».

### Arkitektur final
**Ba om:** Gjøre arkitekturspinen ferdig med PRD og UX som grunnlag.

**KI gjorde:** To vurderingsrunder som fant til sammen 2 kritiske, 10 høye og 19 middels funn. Rettet dem, og spinen ble `final`.

**Jeg bestemte:** Godkjente antagelsene fra 2026-10-28. PR #13 ble flettet etter min godkjenning.

### Coaching-plan
**Ba om:** En coachingplan i en md-fil. Det fantes ingen tidligere omtale, så KI tolket den som en plan for hvordan Claude Code brukes som coach.

**KI gjorde:** `docs/coaching-plan.md` (rollefordeling: jeg bestemmer, Claude gir én anbefaling per valg). PR #15.

### Research: personvern
**Ba om:** `bmad-deep-recon` om personvern for bilder og rapporter, kjørt i økten.

**KI gjorde:** `research.md` med 7 digester og 18 loggførte påstander. PR #18.

### Epics og stories
**Ba om:** `bmad-create-epics-and-stories`, med Advanced Elicitation på storyene før sluttvalideringen.

**KI gjorde:** `epics.md` med 4 epics, 18 stories og rundt 130 akseptansekriterier i Gitt/Når/Så-form. **Commit:** `671d5d7`. PR #20 (UX-presiseringer) flettet som `4aeb0ad`.

### Docker Desktop
**Ba om:** Installere WSL og Docker Desktop og sjekke `docker run hello-world`.

**KI gjorde:** Første forsøk med `wsl --install --no-distribution` feilet etter 49 minutter (tilkoblingen ble tilbakestilt på en treg linje). Etter omstart virket `docker run hello-world` (Docker 29.9.2, Compose v5.6.1).

**Detaljer:** [sensorsjekk-del-1](../.logs/ali-yousef-abdulla/991-2026-11-06-11-07-02-sensorsjekk-del-1.md), [arkitektur-final](../.logs/ali-yousef-abdulla/989-2026-11-06-14-33-33-arkitektur-final.md), [epics-og-stories](../.logs/ali-yousef-abdulla/985-2026-11-06-20-50-45-epics-og-stories.md), [docker-desktop](../.logs/ali-yousef-abdulla/984-2026-11-06-21-24-02-docker-desktop.md).

---

## 2026-11-07 til 2026-11-08: Story 1.1–1.3

**Ba om:** `bmad-build` for Story 1.1 (startpakke og lokal Supabase), 1.2 (testoppsett) og 1.3 (testrapporter i databasen), og en `bmad-walkthrough` av PR #44 før flettingen.

**KI gjorde:**
- **1.1:** appen fra Next.js-eksempelet `with-supabase`, låste versjoner (Next 16.4.5, React 19.3.1, supabase-js 2.119.0, Supabase CLI 2.122.1, Zod 4.6.7), lokal Supabase og README-grunnmuren.
- **Walkthrough av PR #44:** fant at sperren mot åpen omdirigering slapp gjennom `next=/%09/evil.example`, og rettet den.
- **1.2:** Vitest 5.0.5, Playwright 1.65.0 og axe-core, med én testkommando og den første kjerneflyttesten.
- **1.3:** datamodellen i en migrering, faste testdata med innloggbare kontoer, pgTAP-tester og genererte typer.

**Detaljer:** [story-1-1](../.logs/ali-yousef-abdulla/982-2026-11-07-23-44-08-story-1-1-startpakke.md), [story-1-2](../.logs/ali-yousef-abdulla/981-2026-11-08-18-47-29-story-1-2-testoppsett.md), [story-1-3](../.logs/ali-yousef-abdulla/980-2026-11-08-20-59-49-story-1-3-testrapporter.md).

---

## 2026-11-09: Story 1.4–1.7 og 2.1

**Ba om:** `bmad-build` for rapportlista (1.4), detaljsiden (1.5), bildespiken (1.6), bilder på detaljsiden og i lista (1.7) og konto og innlogging (2.1).

**KI gjorde:**
- **1.4:** forsiden som liste over synlige rapporter, nyeste først, med temaet fra DESIGN.md og tester for ytelse, tom og avkortet liste. PR #47 flettet (`7cfec8b`).
- **1.5:** detaljsiden med «Sist oppdatert» i norsk tid.
- **1.6:** spike for reglene om bilder (AD-6, AD-9): et bilde fra en skjult rapport kan bare leses av moderator.
- **1.7:** bildene på detaljsiden og i lista.
- **2.1:** innlogging og registrering med e-post og passord, og menyen i topplinja. **Commits:** `3c266ed`, `5210e9f`.

**Jeg bestemte:** Godkjente i ettertid (2026-11-26) tre av KI-forslagene i 2.1: feilfargen (vanlig tekstfarge, feilikon og rød kant), sjekken av e-postformatet i skjemaet og at passordlengden bare sjekkes ved registrering. Forslaget om at menyen ikke er modal (`modal={false}`) godkjente jeg ikke (se 2026-11-26).

**Detaljer:** [story-1-4](../.logs/ali-yousef-abdulla/979-2026-11-09-10-00-29-story-1-4-rapportlista.md), [story-1-5](../.logs/ali-yousef-abdulla/978-2026-11-09-14-36-59-story-1-5-detaljsiden.md), [story-1-6](../.logs/ali-yousef-abdulla/977-2026-11-09-15-34-57-story-1-6-bildespike.md), [story-1-7](../.logs/ali-yousef-abdulla/976-2026-11-09-21-07-38-story-1-7-bilder.md), [story-2-1](../.logs/ali-yousef-abdulla/975-2026-11-09-22-13-49-story-2-1-konto-og-innlogging.md).

---

## 2026-11-10: Impeccable, retro for Epic 1 og Story 2.2–2.5

**Ba om:** Installere designskillen Impeccable i prosjektet (ikke globalt), kjøre retrospektivet for Epic 1, og bygge Story 2.2–2.5 med `bmad-build`.

**KI gjorde:**
- **Impeccable:** installert i `.claude/skills/impeccable/` med fire agenter og designkroken som sjekker UI-filer.
- **Retro for Epic 1:** verdikt «godkjent med åpne punkter». Hovedfunn (F1): README var ikke fulgt på en ny klone. To av punktene ble gjort samme dag (README-sjekk som akseptansekriterium, og `.claude/**` i `globalIgnores`, som tok lint fra 93 advarsler til 0). PR #56 (`0d8b74b`).
- **2.2:** registrere en rapport (beskrivelse, kategori, lokasjon, flytende «+»-knapp). **Commits:** `a35f2cf`, `aeca7e1`.
- **2.3:** KI-forslag for kategori og oppsummering, med mock som standard og en OpenAI-kompatibel adapter. **Commits:** `917d712`, `a6f7fb5`. To runder code review (24 og 38 funn). PR #54 flettet (`e26aa31`).
- **2.4:** legge ved et bilde med `sharp` (type, størrelse, dimensjoner, EXIF). **Commit:** `eee489c`. Under walkthroughen ba jeg om Advanced Elicitation på feilhåndteringen, og KI la til signatursjekk før `sharp` leser noe (`2d3ab74`) og README-avsnittet «Bilder feiler». PR #55 flettet (`cef114f`).
- **2.5:** et testsett på 20 norske beskrivelser og et skript som kjører det mot leverandørene på kortlista. **Commit:** `5628ed2`. PR #57.

**Jeg bestemte:**
- under code review av 2.3: la et sent KI-forslag få stå (avvist funn)
- å flette PR-ene først når full `npm test` var grønn

**Detaljer:** [epic-1-retrospektiv](../.logs/ali-yousef-abdulla/973-2026-11-10-11-26-17-epic-1-retrospektiv.md), [story-2-2](../.logs/ali-yousef-abdulla/972-2026-11-10-13-22-00-story-2-2-registrere-en-rapport.md), [story-2-3](../.logs/ali-yousef-abdulla/971-2026-11-10-15-10-15-story-2-3-ki-forslag.md), [story-2-4](../.logs/ali-yousef-abdulla/970-2026-11-10-20-44-04-story-2-4-legge-ved-et-bilde.md), [story-2-5](../.logs/ali-yousef-abdulla/969-2026-11-10-23-00-40-story-2-5-velge-ki-leverandor.md).

---

## 2026-11-16 til 2026-11-18: KI-leverandør, retro for Epic 2 og Story 3.1

**Ba om:** Finne ut hva som gjensto for Story 2.5, og få en gyldig Cloudflare-måling for å velge KI-leverandør. Så retrospektiv for Epic 2 og Story 3.1.

**KI gjorde:**
- **Cloudflare-401:** koden var riktig, og `.env.groq` hadde en plassholder som token. Etter nytt token ble SM-5-målingen gjort. Code review av PR #57 ga 38 funn (4 patcher, 1 utsatt, 25 avvist og 4 påstander motbevist). Valget (Cloudflare Workers AI med `@cf/openai/gpt-oss-20b`) er ført i dokumentene (commit `c0b1729`).
- **Retro for Epic 2:** verdikt `accepted-with-open-items`. Hovedfunn: den ustabile `e2e/les/innlogging.spec.ts` var ikke ny.
- **3.1:** filtrere og sortere lista med brikkerad for kategori og status, sortering («Nyeste», «Flest har sett») og valget i URL-en. Tabelldrevet e2e over 48 kombinasjoner.

**Jeg bestemte:** Cloudflare Workers AI i stedet for Groq (filen heter fortsatt `.env.groq`), og at Story 2.5 settes til `done` med noen punkter åpne med vilje.

**Detaljer:** [story-2-5](../.logs/ali-yousef-abdulla/969-2026-11-10-23-00-40-story-2-5-velge-ki-leverandor.md), [epic-2-retrospektiv](../.logs/ali-yousef-abdulla/968-2026-11-18-13-04-00-epic-2-retrospektiv.md), [story-3-1](../.logs/ali-yousef-abdulla/967-2026-11-18-13-42-22-story-3-1-filtrere-og-sortere-lista.md).

---

## 2026-11-19 til 2026-11-20: Story 3.2–3.3, vertical slices, Story 4.1

**Ba om:** `bmad-build` for «Mine rapporter» (3.2), å bekrefte en rapport (3.3) og å endre status (4.1). Koden skulle også legges om til «vertical slices»: isolert per funksjon, men DRY.

**KI gjorde:**
- **3.2:** `mine=true` i URL-en. **Commit:** `87ec1aa`.
- **3.3:** bekrefte en annens rapport én gang, med migrering, kolonnegrant og policy. **Commit:** `3ebc29e`. Chore-PR #63 satte 3.2 til `done`.
- **Vertical slices:** først en flytteplan jeg godkjente, så 94 filer flyttet med `git mv` og importer omskrevet (`7320671`).
- **Ustabil innloggingstest:** fant rotårsakene i `openMenu` (en meny som tones ut ble tatt for åpen) og i axe (kontrast målt mens menyen tones inn).
- **4.1:** moderatoren flytter status ett steg om gangen. **Commit:** `cc7aa0b`, med migrering, UPDATE-policy og triggeren `reports_guard_update`.

**Detaljer:** [story-3-2](../.logs/ali-yousef-abdulla/966-2026-11-19-09-43-24-story-3-2-mine-rapporter.md), [story-3-3](../.logs/ali-yousef-abdulla/965-2026-11-19-14-04-00-story-3-3-bekrefte-en-rapport.md), [vertical-slices](../.logs/ali-yousef-abdulla/963-2026-11-19-15-20-00-vertical-slices.md), [ustabil-innloggingstest](../.logs/ali-yousef-abdulla/962-2026-11-20-12-30-00-ustabil-innloggingstest.md), [story-4-1](../.logs/ali-yousef-abdulla/961-2026-11-20-15-02-17-story-4-1-endre-status.md).

---

## 2026-11-21 til 2026-11-22: Epic 4, retroer, drift og ryddearbeid

### Story 4.2 og 4.3
**Ba om:** Skjule og vise en rapport (4.2), og å gjøre det mulig for en sensor å starte og vurdere appen (4.3).

**KI gjorde:** 4.2: `setReportHidden` med eksplisitt målverdi, og en bekreftelsesdialog med tekst jeg bestemte (**Commit:** `727ee0d`). 4.3: README med skjermbilder og skjermopptak, og `docs/testdekning.md` med 24 rader for FR, NFR og SM (PR #74, `2bdd5ba`).

### Retroer for Epic 4 og Epic 3
**Ba om:** `bmad-retrospective` for Epic 4 og senere Epic 3.

**KI gjorde:** Begge fikk verdikt `accepted-with-open-items`. Handlingspunktene ble tatt i egne økter: `aria-disabled` i `StatusPanel` og toast-test, to prosessregler i `coaching-plan.md`, logglinjer i beslutningsloggene, README-sjekkliste for en annen tester, og felles e2e-hjelpere (PR #100, `d47a95f`).

### Vercel, CI og blokkering av flett
**Ba om:** Ta ned Vercel-siden (PRD §6 sier at v1 ikke settes i drift), kjøre CI på alle PR-er og blokkere flett når CI feiler.

**KI gjorde:** `vercel project rm` krevde min eksplisitte godkjenning, og jeg skrev «ja slett g80-abdulla». CI kjører nå på PR-er mot `main` (PR #83, `paths-ignore` for `.logs/**` og `docs/**`). `gh api` viste at jeg ikke har administratorrettigheter, så GitHub-blokkering gikk ikke.

**Jeg bestemte:** prosessregel i stedet for GitHub-blokkering: PR-en flettes først når CI er grønn.

### README på ren maskin og Cloudflare
**Ba om:** Få README prøvd på en ren maskin, og føre avklaringene om Cloudflare i beslutningsloggen.

**KI gjorde:** Klonekjøring: `supabase start` tok 7 min 25 s og traff `toomanyrequests` på `public.ecr.aws`; hele oppsettet tok 27 minutter (PR #85, `e258e99`). Funn om Cloudflare: gratisgrense 10 000 Neurons per dag, og regionen for Workers AI er ikke oppgitt og kan ikke begrenses.

**Jeg bestemte:** ingen betalingskort er lagt inn hos Cloudflare (oppgitt av meg og ikke sjekket i kontoen), og ordlyden om regionen. Item 7 og 10 ble satt til `done` etter mine ord.

### Offentlig demo
**Ba om:** Gjøre appen offentlig tilgjengelig. Jeg valgte først «ekte brukere», men PRD §6.2 og §11 (moderator, sletting, personvern, EXIF, bildestørrelse på Vercel) måtte lukkes først, så jeg valgte en offentlig demo med testdata.

**KI gjorde:** Satte opp en offentlig demo med Vercel og et Supabase-prosjekt (migreringer, seed og testbilder, registrering slått av). Første deploy ga 500 på alle sider fordi miljøvariablene fikk et linjeskift gjennom PowerShell, og de ble lagt inn på nytt og kontrollert. Underveis skrev KI ut de 15 første tegnene av Supabase-prosjektets hemmelige nøkkel, og det er ført som et åpent punkt (rotere nøkkelen). PR #99 (`bed671c`).

**Detaljer:** [story-4-2](../.logs/ali-yousef-abdulla/960-2026-11-21-23-40-00-story-4-2-skjule-og-vise-en-rapport.md), [story-4-3](../.logs/ali-yousef-abdulla/958-2026-11-22-12-15-00-story-4-3-sensor-kan-starte-og-vurdere-appen.md), [epic-4-retrospektiv](../.logs/ali-yousef-abdulla/957-2026-11-22-12-45-00-epic-4-retrospektiv.md), [vercel-nedtatt](../.logs/ali-yousef-abdulla/953-2026-11-22-14-25-00-vercel-nedtatt.md), [ci-pa-pr-er](../.logs/ali-yousef-abdulla/952-2026-11-22-14-30-00-ci-pa-pr-er.md), [readme-pa-ren-maskin](../.logs/ali-yousef-abdulla/951-2026-11-22-15-25-00-readme-pa-ren-maskin.md), [cloudflare-avklaringer](../.logs/ali-yousef-abdulla/950-2026-11-22-15-55-00-cloudflare-avklaringer.md), [blokkering-av-flett](../.logs/ali-yousef-abdulla/949-2026-11-22-16-00-00-blokkering-av-flett.md), [epic-3-retrospektiv](../.logs/ali-yousef-abdulla/944-2026-11-22-21-11-14-epic-3-retrospektiv.md), [offentlig-demo](../.logs/ali-yousef-abdulla/943-2026-11-22-22-25-09-offentlig-demo.md), [felles-e2e-hjelpere](../.logs/ali-yousef-abdulla/942-2026-11-22-23-24-08-felles-e2e-hjelpere.md).

---

## 2026-11-23 til 2026-11-25: «←», norsk 404 og code review av v1

**Ba om:** Rette «←» på detaljsiden (handlingspunkt 15, 17 og 18 fra retroen for Epic 3), en norsk 404-side, og code review av hele v1 i deler med `bmad-code-review`.

**KI gjorde:**
- **«←»:** rettet i kode (PR #101, `88a74e9`), og `epics.md` og UX-dokumentene følger regelen. Et oppfølgingspunkt om `history.state` etter oppdatering ble rettet i PR #103 (`210604a`).
- **«←» etter overskrevet oppføring:** testen var rød på dagens kode. Alternativene (pakke inn `history.replaceState`, som kan knekke ved en Next-oppgradering, eller å godta det) ble lagt fram, og det ble godtatt for v1.
- **Norsk 404:** `app/not-found.tsx` («Fant ikke siden.»), uten «←» i topplinja. PR #105 (`0d4bd06`) flettet etter grønn `npm test`.
- **Code review av gruppe A** (`app/`, `shared/`, `proxy.ts`, `next.config.ts`): 34 funn fra fire lag, med 1 beslutning, 6 patcher, 5 utsatt og 22 avvist.

**Jeg bestemte:**
- «←» godtatt for v1 etter overskrevet historikkoppføring
- sikkerhetsheadere: minimumsheadere uten CSP (D1, valg 1)

**Detaljer:** [tilbakepil-og-epic-3-retro](../.logs/ali-yousef-abdulla/941-2026-11-23-14-46-00-tilbakepil-og-epic-3-retro-15-17-18.md), [tilbakepil-history-state](../.logs/ali-yousef-abdulla/939-2026-11-23-15-31-00-tilbakepil-history-state.md), [godta-stempel-v1](../.logs/ali-yousef-abdulla/938-2026-11-25-18-55-00-godta-stempel-v1.md), [norsk-404-side](../.logs/ali-yousef-abdulla/937-2026-11-25-21-04-00-norsk-404-side.md), [code-review-v1-gruppe-a](../.logs/ali-yousef-abdulla/936-2026-11-25-21-51-00-code-review-v1-gruppe-a.md).

---

## 2026-11-26: Review-rettinger, beslutninger og fire endringer

### PR #112 og åpne punkter
**Ba om:** `bmad-walkthrough` av PR #112 (rettinger fra code review av gruppe E og F), så en gjennomgang av `issues.md`.

**KI gjorde:** CI på PR #112 var rød: en regex i `e2e/les/helpers.spec.ts` brukte `d+` i stedet for `\d+`. Rettet (`ee3b701`) og flettet etter grønn CI. Gikk gjennom åpne punkter og lukket det som var løst, med bevis (PR #113).

**Jeg bestemte:**
- tom «Mine rapporter» får en nøytral tekst («Du har ingen rapporter å vise.»), siden en skjult rapport ikke skal kunne ses som skjult av forfatteren (FR-9)
- telefonbilder over 5 MB skaleres ned i nettleseren, i stedet for å heve grensen
- ingen egen oppsummering når KI-en ikke ga en: FR-4 står som før
- språk i BMAD-konfigurasjonen er norsk

### Nøytral tekst i «Mine rapporter»
**KI gjorde:** Endret `report-list.tsx`, e2e-testen, begge `EXPERIENCE.md`, skissene og `epics.md`. Blind Hunter ga 10 funn, 8 rettet. **Commit:** `31d0f52`. PR #115 (`f727541`).

### Bilder skaleres ned i nettleseren
**KI gjorde:** `image-resize.ts` (`createImageBitmap` med EXIF-orientering, canvas, hvit bakgrunn, JPEG med kvalitetstrapp 0,85 → 0,7 → 0,55 til under 4 MiB). Serveren er uendret (5 MiB, `sharp` og EXIF-fjerning). PR #116 (`e902182`). CI var først rød fordi Chromium gir `postData() === null` for en forespørsel med fil, og testhjelperen ble rettet til å kjenne igjen `multipart/form-data` og lese `content-length`.

### Brukermenyen som åpne-/lukkepanel
**Ba om:** `bmad-build` for å erstatte den ikke-modale Radix-menyen, som jeg ikke hadde godkjent.

**Jeg bestemte:** åpne-/lukkepanel (en knapp med `aria-expanded`, ikke `role="menu"`). Avvist: modal dropdown, sidepanel og ingen meny.

**KI gjorde:** Skrev komponenten uten Radix og fjernet pakken og `dropdown-menu.tsx`. Tre reviewere ga 20 funn. En av dem ga en ekte forbedring: Escape virket ikke etter et klikk på tekst i panelet, og ble rettet. **Commit:** `cc90176`. PR #118 flettet (`9af45aa`).

### Testhull fra code review av gruppe A
**Ba om:** `bmad-build` for testhullene, uten endringer i produksjonskode med mindre en test avdekket en feil.

**Jeg bestemte:** `app/error.tsx` testes bare med en typetest mot Nexts `ErrorComponent`. Den ekte feilgrensen i e2e er utsatt.

**KI gjorde:** Testen for `updateSession` viste at et kast fra `getClaims()` ga 500 på alle sider, og `updateSession` feiler nå åpent (`bd94bec`). Nye tester for matcheren (med Nexts egen `getMiddlewareMatchers`), manifestet og `StatusBadge`, alle mutasjonssjekket (`43935b7`). PR #119 flettet (`9e53c3a`).

**Detaljer:** [apne-punkter-og-beslutninger](../.logs/ali-yousef-abdulla/935-2026-11-26-15-09-13-apne-punkter-og-beslutninger.md), [mine-rapporter-noytral-tekst](../.logs/ali-yousef-abdulla/934-2026-11-26-15-15-23-mine-rapporter-noytral-tekst.md), [bilder-skaleres-ned](../.logs/ali-yousef-abdulla/933-2026-11-26-21-23-10-bilder-skaleres-ned.md), [brukermeny-apne-lukkepanel](../.logs/ali-yousef-abdulla/932-2026-11-26-22-46-22-brukermeny-apne-lukkepanel.md), [testhull-code-review-gruppe-a](../.logs/ali-yousef-abdulla/931-2026-11-26-23-45-53-testhull-code-review-gruppe-a.md).

---

## 2026-11-27: Opprydding og et feil premiss

### Opprydding i arbeidsfiler, komponentlista og KI-loggen
**Ba om:** Starte en opprydding-PR etter PR #118 og #119.

**Jeg bestemte:**
- `.working/` fjernes, men `.memlog.md` beholdes
- KI-loggen skal fylles ut i samme format som før, for alle øktene fra 2026-10-28

**KI gjorde:** Fjernet `.working/`, rettet komponentlista i `DESIGN.md`, skrevet inn øktene i denne loggen fra øktloggene i `.logs/`, og lagt inn loggene for PR #118 og #119. PR #120 (`742752f`). Detaljer: [opprydding-logger-og-arbeidsfiler](../.logs/ali-yousef-abdulla/930-2026-11-27-10-55-45-opprydding-logger-og-arbeidsfiler.md).

### getViewer og «Logg ut»
**Ba om:** `bmad-build` for to utsatte punkter: manglende try/catch i `getViewer()` og manglende feilhåndtering i «Logg ut».

**KI foreslo og bygget:** try/catch i `getViewer` og en toast ved feil i «Logg ut», på antakelsen at et Auth-utfall gir feilsiden og at en mislykket utlogging lar sesjonen stå.

**Rettet underveis:** KI prøvde antakelsene mot den ekte `auth-js`-klienten. Begge var feil: `signOut({ scope: "local" })` fjerner sesjonen før nettverkskallet, og `getUser()` gir nettverksfeil og 5xx som data, så en bruker får allerede en besøkende, ikke feilsiden. Tre reviewere pekte uavhengig på det samme for `getViewer`.

**Jeg bestemte:**
- «Logg ut»: behold koden, lås oppførselen med en e2e-test, ingen toast
- `getViewer`: fjern try/catch (død forsvarskode), og lås oppførselen med tester mot den ekte klienten

**Detaljer:** [getviewer-feil-fra-auth](../.logs/ali-yousef-abdulla/929-2026-11-27-14-14-11-getviewer-feil-fra-auth.md).
