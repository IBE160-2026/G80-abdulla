---
title: 'Story 2.3: KI-forslag for kategori og oppsummering'
type: 'feature'
created: '2026-11-10'
status: 'in-review'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '551de14fe563e690a21237fab390de9ad13363c4'
context:
  - '{project-root}/docs/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Skjemaet for ny rapport har ingen KI-hjelp. Brukeren må velge kategori selv, og rapportene har ingen kort oppsummering å skumlese (issue #31, FR-4, AR-9, UX-DR10, UX-DR11).

**Approach:** En ny modul `lib/ai` har `suggest(description)`, som gir `{ category, summary }` eller `null`, med adapter valgt av `AI_PROVIDER` (mock er standard). En Server Action `suggestReport` for innloggede kaller den. Skjemaet henter forslaget når brukeren forlater beskrivelsen, viser spinner, kategori med «Foreslått av KI» og oppsummering med «Endre», og sender oppsummeringen med `createReport`.

## Boundaries & Constraints

**Always:**
- `lib/ai/index.ts` eksporterer `suggest(description)` og er den eneste inngangen. Appen og senere SM-5-skriptet kaller den. Adapteren velges med `serverEnv().AI_PROVIDER`, og miljøvariabler leses bare via `lib/env.ts`. Høyst 2000 tegn (`charCount`) av beskrivelsen sendes videre. Hele kallet har et tidsavbrudd på 5000 ms, og ugyldig svar, feil eller tidsavbrudd gir `null`. Rapporttekst, forslag og nøkkel logges aldri, bare handling og feilkode.
- Mock-adapteren gjør ingen nettverkskall. Etter nøkkelord (uten hensyn til store og små bokstaver, også ordstammer) gir den `lighting` for «gatelys», «lys» og «belysning», `waste` for «søppel» og «boss», `roads_sidewalks` for «hull», «vei», «fortau», «asfalt» og «sti» (bare som eget ord), og `vandalism` for «hærverk», «skadeverk», «knust» og «tagging». Ved flere treff gjelder rekkefølgen `lighting`, `waste`, `vandalism`, `roads_sidewalks`, så «Gatelyset ved gangveien er ødelagt» gir `lighting`. Uten treff gir den `other`. Testordet `ingenforslag` i teksten gir `null`. Oppsummeringen er første setning (opp til første punktum, linjeskift eller 120 tegn), trimmet.
- OpenAI-adapteren sender `POST {AI_BASE_URL}/chat/completions` med `Authorization: Bearer`, `temperature: 0`, `response_format: { type: "json_object" }`, og en norsk systemmelding som ber om `{ "category": <kode>, "summary": <norsk, høyst 300 tegn> }`. Den tåler JSON pakket i en kodeblokk.
- Svaret valideres i `lib/ai/validate.ts`: kategorien må være nøyaktig en kodeverdi fra `Constants` (feil store og små bokstaver, mellomrom og norske navn som «Belysning» gir `null`). Oppsummeringen er ren tekst: HTML-tagger fjernes, mellomrom trimmes, den kortes til `SUMMARY_MAX` tegn (kodepunkter), og tom blir `null`. Gyldig kategori uten oppsummering gir kategorien og `summary: null`. Ingenting vises som HTML (ingen `dangerouslySetInnerHTML`).
- `suggestReport(description)` i `app/rapporter/ny/actions.ts` bruker `getViewer()` og gir `actionError("unauthenticated")` for en besøkende, uten å nå adapteren. Hver bruker har høyst ett kall i gang (lås i minnet, nøkkel er bruker-id, frigjort også ved feil og tidsavbrudd). Et samtidig kall fra samme bruker gir `{ ok: true, data: null }`. Svaret er `{ ok: true, data: { category, summary } | null }`.
- Skjemaet henter forslag bare når brukeren forlater beskrivelsen (blur), og bare når minst 10 tegn er endret siden forrige forslag (`charsChanged` i `lib/suggest-trigger.ts`: lengden på den delen som er forskjellig etter å ha fjernet felles begynnelse og slutt, på trimmet tekst; første forslag regnes mot tom tekst). Nøyaktig 10 gir kall, 9 gir ikke. Aldri mens brukeren skriver. Skjemaet har høyst ett kall i gang, og et svar for tekst som er endret siden kallet, forkastes.
- Mens KI-en jobber: «Finner kategori …» med spinner ved kategorivalget, valget kan brukes, og «Send inn» venter bare hvis ingen kategori er valgt. Et forslag velger kategorien og viser pillen «Foreslått av KI» (`ai-tag`: `bg-status-new text-primary rounded-full text-badge`), og en usynlig `aria-live="polite"`-region leser «Kategori foreslått: Belysning». Har brukeren valgt kategori selv, endres den ikke. Et manuelt valg låser kategorien mot KI resten av skjemaet og fjerner pillen.
- Oppsummeringen vises som lesetekst med knappen «Endre», som åpner et felt med teller «N/300» og feilen «Oppsummeringen kan ha høyst 300 tegn.» under feltet (nøyaktig 300 godtas, 301 avvises). Et tomt felt gir ingen oppsummering. Et nytt forslag overskriver ikke en oppsummering brukeren har endret.
- Ved `null`, og når kategorien fortsatt er tom: «Vi fikk ikke et forslag. Velg kategori selv.», kategorien er tom og påkrevd, og rapporten kan sendes uten oppsummering.
- `createReport` tar imot valgfri `summary` via `parseReportInput` (trim, ikke tom, `charCount <= SUMMARY_MAX`, ellers utelatt og lagret som `NULL`).
- Påminnelsen under beskrivelsen er nå hele teksten: «Ikke skriv navn eller andre personopplysninger. Teksten sendes til en KI-tjeneste for å foreslå kategori.» Testkommandoen kjører med `AI_PROVIDER=mock`, og ingen test kaller en ekte leverandør (`fetch` er stubbet).

**Never:**
- Ingen ny npm-pakke, ingen migrering og ingen endring i `supabase/config.toml`, `proxy.ts` eller `BackLink`. Ingen `evals/sm5/` eller leverandørvalg (Story 2.5), og ingen bildeopplasting (Story 2.4).
- Komponenter importerer ikke `lib/ai`. De kaller bare Server Actions.
- Rapporttekst, forslag eller nøkler logges aldri, og modellens rå tekst lagres aldri.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Forslag kommer | Innlogget, beskrivelse «Gatelyset ved gangveien er ødelagt», blur | Spinner, så kategori Belysning med pillen, «Kategori foreslått: Belysning» leses opp, oppsummering med «Endre» | N/A |
| Manuelt valg først | Kategori valgt før svaret kommer | Valget står uten pille, oppsummeringen vises | N/A |
| Endrer kategori | Etter et forslag | Pillen forsvinner, senere forslag overskriver ikke | N/A |
| Utløser | 10 tegn endret / 9 tegn endret | Kall / ingen kall; aldri under skriving | N/A |
| Utdatert svar | Teksten endret mens kallet gikk | Svaret forkastes | N/A |
| Ingen forslag | Testordet, 5 s uten svar, feil eller ugyldig svar | «Vi fikk ikke et forslag. Velg kategori selv.», kategori tom og påkrevd, innsending uten oppsummering | `null` |
| Ugyldig kategori | «Belysning», «LIGHTING», «lighting », ukjent | `null` | Validering |
| Svarformat | JSON i kodeblokk, ugyldig JSON, gyldig kategori uten oppsummering | Godtatt, `null`, kategori uten oppsummering | Validering |
| Oppsummering | Over 300 tegn, HTML, tom | Kortet til 300 tegn, tagger fjernet, `NULL` | Validering |
| Egen oppsummering | 300 og 301 tegn | Godtatt / feil under feltet | `validation_failed`, `23514` |
| Besøkende | Kaller `suggestReport` direkte | `unauthenticated` | Adapteren kalles ikke |
| Samtidige kall | To fra samme bruker | Det andre gir `data: null`, det første påvirkes ikke | Lås frigjøres også ved feil |
| Lang tekst | Over 2000 tegn | Bare 2000 sendes | N/A |
| Innsending | Rapport med oppsummering | Lagret, kortet i lista og overskriften på detaljsiden viser den | N/A |
| Mock | `AI_PROVIDER=mock` | Ingen nettverkskall | N/A |

</frozen-after-approval>

## Code Map

- `lib/env.ts` -- `serverEnv()` (Zod, diskriminert på `AI_PROVIDER`: `mock` eller `openai` med `AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY`), kaster i nettleser. Ingen endring nødvendig. `.env.example` har variablene (sjekk at nøklene står uten verdier).
- `lib/ai/` -- finnes ikke. Ny: `index.ts`, `mock.ts`, `openai.ts`, `validate.ts` (+ tester).
- `app/rapporter/ny/actions.ts` -- har `createReport`; `suggestReport` legges ved siden av. `actions.test.ts` -- mønsteret (`vi.hoisted`, `vi.mock` av auth, server og `next/cache`, `console`-spion med `loggedText()`).
- `lib/report-input.ts` -- `reportInputSchema`, `ReportInput`, `REPORT_MESSAGES`; mangler `summary`. `lib/limits.ts` -- `SUMMARY_MAX = 300`, `charCount`. `lib/errors.ts` -- har `unauthenticated` og `ai_unavailable`.
- `lib/supabase/auth.ts` -- `getViewer()` (cache) gir `{ user, isModerator }`.
- `components/report-form.tsx` -- tilstand: `description`, `category`, `location`, `errors`, `pending`; `filled` styrer knappen; `checkLength` er live validering; ingen `onBlur` og ingen `aria-live`. Kategori settes bare i `Select.onValueChange`, som også sletter `errors.category`.
- `components/status-badge.tsx` -- mønsteret for pille (`Badge variant="outline"` + `rounded-full border-transparent text-badge`). `DESIGN.md` definerer `ai-tag` (`bg-status-new`, `text-primary`).
- `components/report-card.tsx` (`summary ?? description`) og `components/report-detail.tsx` (`summary ?? kategorinavn`) -- viser allerede en lagret oppsummering. Ingen endring nødvendig.
- `lib/no-cache.test.ts` -- skanner `{app,components,lib}/**`, så `lib/ai` skannes automatisk. `lib/supabase/client.test.ts` -- uberørt.
- Vitest: `unit` kjører i node uten jsdom, og testfilene er `.ts`. Ingen test stubber `fetch`: innfør `vi.stubGlobal("fetch", …)`.
- `e2e/endrer/ny-rapport.spec.ts` -- `chooseCategory` og `fill` på beskrivelsen. Blur utløser nå et forslag, så tester som velger kategori manuelt må bruke testordet `ingenforslag` eller vente på forslaget. Linje 140–141 forventer at «KI-tjeneste» ikke finnes og må snus. `e2e/core-flow.spec.ts` -- skriver teksten og tabber til kategorien (linje 148–162), og må i stedet bruke forslaget bare med tastatur. `playwright.config.ts` -- `AI_PROVIDER=mock`.
- `docs/ux/mockups/registrer.html` -- viser allerede den fulle påminnelsen. `EXPERIENCE.md` (begge kopier) har en merknad om at 2.2 bare har første setning.

## Tasks & Acceptance

**Execution:**
- [x] `lib/ai/validate.ts` (+ test) -- `parseSuggestion(raw)`: kodeblokk, JSON, kategori mot `Constants`, oppsummering som ren tekst og kortet -- AD-8
- [x] `lib/ai/mock.ts` (+ test), `lib/ai/openai.ts` (+ test med stubbet `fetch`, inkludert `response_format`, 2000 tegn, tidsavbrudd med falske timere, ikke-200 og kastet feil) -- adapterne
- [x] `lib/ai/index.ts` (+ test) -- `suggest`, valg av adapter, 2000 tegn, 5 s-vern som gir `null`, og logging uten tekst
- [x] `lib/suggest-trigger.ts` (+ test) -- `charsChanged` og `SUGGEST_MIN_CHARS = 10`, med 9 og 10 tegn, erstattet tekst og trimming
- [x] `lib/report-input.ts` (+ test) -- valgfri `summary` og meldingen «Oppsummeringen kan ha høyst 300 tegn.»
- [x] `app/rapporter/ny/actions.ts` (+ test) -- `suggestReport` med `unauthenticated`, lås, 2000 tegn og at adapteren ikke kalles for en besøkende; `createReport` lagrer `summary`
- [x] `components/ai-tag.tsx`, `components/report-form.tsx` -- blur, spinner, pille, `aria-live`, oppsummering med «Endre», utdaterte svar, manuelt valg som lås, «ingen forslag» og den fulle påminnelsen
- [x] `components/report-form.test.ts` -- vakt: ingen `dangerouslySetInnerHTML` i `app/` og `components/`, og ingen import av `lib/ai` i `components/`
- [x] `lib/supabase/reports-insert.db.test.ts` -- `summary` på 300 og 301 tegn med emoji
- [x] `e2e/endrer/ki-forslag.spec.ts` (ny) -- forslag, manuelt valg, endret kategori, testordet, oppsummering lagret og vist i lista og på detaljsiden, `aria-live`-teksten, axe og bredde
- [x] `e2e/endrer/ny-rapport.spec.ts`, `e2e/core-flow.spec.ts` -- tilpass til blur-forslag, snu «KI-tjeneste»-forventningen, og bruk forslaget bare med tastatur i kjerneflyten
- [x] `docs/ux/EXPERIENCE.md` og BMAD-kopien, `docs/beslutninger/ux-beslutningslogg.md`, `README.md` -- fjern merknaden om bare én setning, beskriv `AI_PROVIDER` og status for Story 2.3

**Acceptance Criteria:**
- Given en innlogget bruker, when hen forlater beskrivelsen med nok endrede tegn, then hentes forslaget fra Server Action, og et forslag velger kategorien og viser pillen og oppsummeringen.
- Given `AI_PROVIDER=mock`, when `suggest` kalles, then gjøres ingen nettverkskall, og svaret er forutsigbart etter nøkkelord.
- Given ingen forslag, when skjemaet får `null`, then står meldingen, kategorien er tom og påkrevd, og rapporten kan sendes uten oppsummering.
- Given en rapport sendt inn med oppsummering, when den lagres, then viser lista og detaljsiden oppsummeringen.
- Given skjemaet med et forslag bare med tastatur, when det fylles og sendes, then virker alt, og axe gir ingen `serious`/`critical` på 360, 320 og 1280 px.

## Implementation Notes

- Implementert av en underagent: `lib/ai` (mock, OpenAI-kompatibel, validering), `lib/suggest-trigger.ts`, `suggestReport`, valgfri `summary` i `createReport`, skjemaet med spinner, pille, `aria-live` og oppsummering med «Endre», og tester (Vitest, e2e). Ingen nye pakker eller migreringer.
- Matrise-revisjonen fant at alle 15 rader har minst én test som dekker dem.
- Avgjørelser underveis: spinneren står i samme rad som «Kategori»-etiketten, så layouten ikke flytter seg. Å åpne «Endre» regnes som at brukeren har endret oppsummeringen, så et senere forslag overskriver den ikke. Et forkastet svar for utdatert tekst gir et nytt kall hvis brukeren allerede er ute av feltet.

## Spec Change Log

## Review Triage Log

Gjennomgang 1 (blind-hunter 13 funn, edge-case-hunter 19 og verification-gap 1). Kjørt mot diff fra `baseline_commit`. Kollisjonen mellom «Send inn» og forslaget er verifisert med en midlertidig e2e-test.

| Id | Funn | Dom | Bevis | Rute |
|----|------|-----|-------|------|
| B1 | Et mislykket forslag kan ikke prøves på nytt (`lastSuggested` settes før kallet) | low | Sant, men «forrige forslag» er der ingen forslag kom, og brukeren får meldingen og velger selv. Å prøve på nytt ved hver blur ville gitt gjentatte kall med samme tekst. Rettingen er mer enn en direkte rettelse. | avvist |
| B2 | Låskollisjon ser ut som en KI-feil | low | Kollisjon krever to samtidige kall fra samme bruker, og klienten har selv høyst ett kall i gang. Bare to faner kan gi det. | avvist |
| B3 | Et `null`-svar lar gammelt KI-forslag, pille og oppsummering stå | low | Krever et vellykket forslag og så et mislykket etter at teksten er skrevet kraftig om. Den frosne teksten gir meldingen bare når kategorien er tom. Å tømme forslag ved `null` er en ny regel med flere grener. | avvist |
| B4 | «Endre» setter `summaryTouched` ved klikk, selv om brukeren ikke skriver | low | Verifisert i `report-form.tsx`: klikket setter `summaryTouched.current = true`. Den frosne teksten sier «en oppsummering brukeren har endret», og et klikk er ikke en endring. Direkte rettelse. | patch |
| B5 | Fokusrekkefølgen ved feil har `summary` sist, men feltet står mellom kategori og lokasjon | low | Verifisert: `focusFirstError` sjekker beskrivelse, kategori, lokasjon og så oppsummering, mens oppsummeringen står før lokasjon. Fokus hopper over den. Direkte rettelse. | patch |
| B6 | «Finner kategori …» er ikke annonsert, og oppsummeringen annonseres ikke | low | Kriteriet krever bare at kategorien leses opp via `aria-live="polite"`, og det gjør den. Spinnerteksten er koblet til kategorifeltet med `aria-describedby`. | avvist |
| B7 | Låsen er prosesslokal og det finnes ingen kvote eller lengdesjekk før `[...text]` | low | AD-8 sier uttrykkelig at låsen ligger i minnet i én prosess fordi v1 kjører lokalt. En kvote er en ny funksjon. Body-grensen for Server Actions begrenser størrelsen på teksten. | avvist |
| B8 | `catch` i `suggestReport` er unødvendig, `clipInput` brukes tre ganger | low | Forsvar i dybden: `suggest` kan i teorien kaste fra `serverEnv()`. Gjentatt klipping er ufarlig og billig. Kosmetikk. | avvist |
| B9 | HTML-fjerningen `/<[^>]*>/g` sletter tekst mellom `<` og `>` | low | Verifisert i `lib/ai/validate.ts:cleanSummary`: «skilt < 30 og > 50» mister teksten mellom tegnene. En ufullstendig tagg på slutten blir stående, mens spec-en sier at tagger aldri lagres. Direkte rettelse av regexen. | patch |
| B10 | Beskyttelsen mot prompt-injeksjon er tynn | low | Systemmeldingen sier at teksten er data, og utdata valideres mot kategorikodene og lengde. Moderering av KI-tekst er ikke en del av intensjonen. | avvist |
| B11a | Mock-nøkkelord treffer som delstrenger («lys» i «lyst», «vei» i «veiledning») | low | Mock er en deterministisk stand-in, og den frosne teksten sier uttrykkelig at ordstammer treffer også bøyde former. | avvist |
| B11b | `firstSentence` deler på alle punktum, så «3.5 meter hull» gir «3» | low | Verifisert i `lib/ai/mock.ts:firstSentence`. Mock er standard og brukes i alle demoer og e2e-tester. Direkte rettelse. | patch |
| B12 | Svake tester: kildesøk, faste ventetider, ingen komponenttest, ingen test for 400 på `response_format` | low | Kildevakten er det spec-en ber om. Faste ventetider kan bare gi falske bestått. Enhetsprosjektet er node-only. Leverandørenes støtte for `response_format` hører til leverandørvalget i Story 2.5. | avvist |
| B13a | Spec-en står som `in-review` med alle oppgaver krysset, og triagelogg og verifikasjon mangler | false | Dette er arbeidsflytens tilstand under gjennomgangen. Triageloggen skrives nå, og verifikasjonen kjøres etter patchene. | avvist |
| B13b | Dokumentkommentaren i `actions.ts` er endret til én for lang linje | low | Verifisert: «Uten oppsummering lagres `NULL`. Både `error` …» ligger på én linje. Direkte rettelse. | patch |
| G1 | Ingen test for nytt forslag etter et forkastet svar når brukeren allerede er ute av feltet | medium | Verifisert: i den eneste testen om utdaterte svar er feltet i fokus når svaret slippes, så grenen `document.activeElement !== descriptionRef.current` kjøres aldri. En regresjon ville gitt ingen forslag for teksten som sendes inn. | patch |
| E1 | Et forkastet svar for tekst endret med under 10 tegn gir aldri nytt forslag | medium | Verifisert ved å lese `requestSuggestion`: `lastSuggested` settes til teksten som ble sendt, så `charsChanged` mot den nye teksten blir under 10 og neste blur gjør ingenting. Brukeren får hverken forslag eller melding. | patch |
| E2 | Et `null`-svar etter et tidligere KI-forslag lar det gamle stå | low | Samme som B3. | avvist |
| E3 | Et mislykket svar lar `lastSuggested` stå på samme tekst | low | Samme som B1. | avvist |
| E4 | Server Action som aldri svarer gir spinner for alltid | low | Krever at nettleseren henger, og kategorivalget og «Send inn» virker likevel. Et klienttidsavbrudd er en ny gren. | avvist |
| E5 | «Send inn» rett fra beskrivelsen starter et forslag og venter på det | medium | Verifisert med midlertidig e2e: mens forslagskallet holdes, sendes ikke `createReport` (sendt først 2,6 s senere, etter at forslaget slapp). Next kjører Server Actions i kø, så innsendingen kan vente opp til 5 s med en ekte leverandør, og teksten sendes unødvendig. | patch |
| E6 | Et forslag kan endre kategori etter at en innsending har feilet | false | Et forslag for uendret tekst er et gyldig forslag, og `submitting.current` stopper bare svar mens innsendingen pågår. | avvist |
| E7 | En utløpt økt vises som «ingen forslag» | low | Innsendingen sender brukeren til innlogging via `requireUser`. Forslaget er hjelp og stopper aldri innsendingen. | avvist |
| E8 | `cleanSummary` sletter tekst mellom `<` og `>` | low | Samme som B9. | patch (gruppert med B9) |
| E9 | En ufullstendig tagg overlever i lagret oppsummering | low | Samme som B9. | patch (gruppert med B9) |
| E10 | `firstSentence` deler på alle punktum | low | Samme som B11b. | patch (gruppert med B11b) |
| E11 | JSON med tekst rundt eller etter gir `ugyldig_svar` | low | Spec-en krever bare at kodeblokk tåles. Et JSON-uttrekk er ny leniens som ikke er bestemt. | avvist |
| E12 | Sekvensielle kall uten kvote kan tømme KI-kvoten | low | Samme som B7. Kvote er en ny funksjon, og v1 kjører lokalt med mock som standard. | avvist |
| E13 | Låsen holder ikke på tvers av instanser | false | AD-8 sier at låsen ligger i minnet i én prosess fordi v1 kjører lokalt, og spec-en gjentar det. | avvist |
| E14 | En svært stor streng spres til en liste før den klippes | false | Server Actions har en kroppsgrense, og strengen er først testet som `string`. | avvist |
| E15 | Påstand: `epic-2-context.md` sier at `createReport` bare setter inn tre kolonner og at påminnelsen har én setning | low | Verifisert: bulletpunktet «Fra Story 2.2» ble riktig for 2.2, men er utdatert etter 2.3. Direkte rettelse. | patch |
| E16 | Påstand: spec-en sier at tagger aldri lagres, men regexen fjerner bare lukkede tagger | low | Samme som B9. | patch (gruppert med B9) |
| E17 | Påstand: «ett kall i gang» gjelder bare innen én prosess | false | Samme som E13. | avvist |
| E18 | Påstand: et forkastet svar gir ingen melding eller nytt forsøk | medium | Samme årsak som E1. Et `null`-svar etter et tidligere forslag er B3 og avvises. | patch (gruppert med E1) |
| E19 | Kjerneflyttesten har mistet tastaturstegene i kategorilista | low | `chooseCategory` i `ny-rapport.spec.ts` dekker tastaturvalg i `Select`, og kriteriet krever at kjerneflyten bruker forslaget bare med tastatur. | avvist |

## Design Notes

- **Mock uten treff gir `other` (Annet)**, ikke `null`, så mock oppfører seg som et vanlig forslag (UX: «Mock ser ut som et vanlig forslag»). Bare testordet `ingenforslag` gir `null`.
- **Tomme felt og forslag.** Aldri forslag for under 10 tegn. «Send inn» krever fortsatt kategori, så en bruker som ikke får forslag, må velge selv.
- **`charsChanged`** måler den differerende midten, så å skrive om en setning teller som endring, og et tillegg på 10 tegn teller også. Å bare bytte tegn på samme sted teller med lengden av den delen som er forskjellig.
- **HTML i oppsummering fjernes** (`/<[^>]*>/g`) i tillegg til at alt vises som tekst, så en lagret oppsummering aldri bærer tagger.
- **Test-hjelpere i e2e.** Tester som velger kategori manuelt, bruker beskrivelser med `ingenforslag` for å unngå at et mock-forslag flytter fokus eller endrer valget.

## Verification

**Commands:**
- `npm run lint` -- expected: 0 feil (de 93 advarslene fra `.claude/` er kjent)
- `npm run test:unit` -- expected: alle bestått, ingen typefeil
- `npm run build` -- expected: bygger
- `node scripts/db-types.mjs --check` -- expected: ingen avvik
- `npm test` -- expected: Vitest `unit` og `db`, pgTAP og Playwright består, exit 0. Skriv kjøretiden i PR-beskrivelsen.

**Manual checks (if no CLI):**
- Skriv «Gatelyset ved gangveien er ødelagt» i skjemaet og tab ut: spinner, så Belysning med «Foreslått av KI» og en oppsummering med «Endre».
- Skriv teksten «ingenforslag …»: meldingen «Vi fikk ikke et forslag. Velg kategori selv.» og tom kategori.
