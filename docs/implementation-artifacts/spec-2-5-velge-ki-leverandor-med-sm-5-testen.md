---
title: 'Story 2.5: Velge KI-leverandør med SM-5-testen'
type: 'feature'
created: '2026-11-10'
status: 'in-review'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: '98c666c56eb6851d7f1c6d1cb4f11013bf19f463'
context:
  - '{project-root}/docs/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** KI-leverandøren er ikke valgt. Appen har bare mock og en OpenAI-kompatibel adapter, og ingen vet om en leverandør treffer kategorien på norske rapporter (issue #33, SM-5, AR-15, FR-4, PRD §11 spørsmål 1).

**Approach:** `evals/sm5/` får 20 oppdiktede norske beskrivelser med fasit og et skript som kaller `suggest` i `lib/ai` og viser treff av 20, gyldig svar, svartid og oppsummeringer per kall. Resultatet og valget føres i beslutningsloggen, og de fire stedene som peker på det åpne valget lukkes.

## Boundaries & Constraints

**Always:**
- Testsettet er en datafil (`evals/sm5/testset.ts`) med 20 oppføringer: `id`, `description` (norsk bokmål, 1–1000 tegn trimmet) og `expected` (en kodeverdi fra `Constants`), fire per kategori. Blandet lengde, og minst to tvetydige tilfeller (for eksempel knust lyktestolpe) med én fasit som er begrunnet i filen. Ingen virkelige navn, adresser eller personopplysninger.
- Skriptet kaller bare `suggest`-modulen i `lib/ai` (samme adapter, prompt og validering som appen). `lib/ai/index.ts` får en ny eksport `suggestWithOutcome(description)` som gir `{ suggestion, status: "ok" | "none" | "timeout" | "invalid" | "error", code?, ms }`, og `suggest` blir et tynt omslag rundt den, uten endret oppførsel. Ingen logging av tekst, forslag eller nøkkel; `code` er en kort feilkode.
- Utskriften per kall: id, fasit, svar, riktig/feil, status, millisekunder og oppsummeringen. Til slutt: antall riktige av 20, antall gyldige svar, største og midlere svartid, antall over 5000 ms, og avgjørelsen mot kravene (minst 16 riktige, alle gyldige, alle under 5 s, ingen mistenkt dansk eller nynorsk). Språk: oppsummeringene vises i fulltekst, og et enkelt treff på kjente nynorsk- og dansk-ord merkes «mistenkt» som hjelp til lesingen, aldri som dom.
- Mot mock står det først og sist, tydelig: «Mock-modus: resultatet sier ikke noe om kvalitet.» Mot en leverandør vises verten fra `AI_BASE_URL` og `AI_MODEL`, aldri nøkkelen. Bare testsettets tekster sendes ut.
- Skriptet kjører som et eget Vitest-prosjekt `sm5` (`npm run eval:sm5`), ikke som en del av `npm test`, og leser `.env`. Ingen ny npm-pakke. Ren logikk (poengsum, avgjørelse, språkhint, testsettets form) ligger i egne moduler med enhetstester i `unit`-prosjektet. Ingen test kaller en ekte leverandør (`fetch` er stubbet).
- Før noe sendes ut er det avklart og skrevet i beslutningsloggen: om Cloudflare krever betalingskort, hvor Cloudflare kjører inferensen, gratisgrensene hos Groq og Mistral, og at trening på dataene er slått av hos Mistral hvis den velges. Gemini på gratisnivå er ikke med. Kilde og dato står ved hvert svar.
- Vinneren treffer minst 16 av 20, gir gyldig svar hver gang, svarer under 5 s hver gang og har ikke dansk eller nynorsk i oppsummeringene. Treffer ingen, står det i beslutningsloggen, og mock forblir standard. Endres prompten eller adapteren for at en leverandør skal bestå, kjøres hele testsettet om igjen for alle.
- Valget føres i `docs/beslutninger/arkitektur-beslutningslogg.md` med resultatene og begrunnelsen. PRD §11 spørsmål 1 lukkes i begge kopier (`docs/prd.md` og planleggingsdokumentet), raden «Endelig KI-leverandør» i Deferred i arkitekturen oppdateres, og `.env.example` viser variablene for den valgte leverandøren uten verdi (NFR-3). README får kommandoen og status for Story 2.5.
- Siste story i epicen: README følges steg for steg på en ny klone i en tom mappe, uten `.env` og uten installerte avhengigheter, alt som ikke virket rettes i README, og resultatet står i PR-beskrivelsen (SM-7).
- **Omfang (valgt av Ali Yousef Abdulla 2026-11-10, alternativ A):** denne storyen bygger testsett, skript, tester og dokumentasjon og stopper i `in-review`. Prosjekteieren kjører `npm run eval:sm5` mot hver leverandør hen har nøkkel til og gir utskriften, og avklaringene i konsollene gjøres av hen. Resultat, valg, lukking av PRD-spørsmålet, Deferred-raden og `.env.example` føres i samme PR etterpå. Storyen er ikke `done` før det er gjort.
- Ferdig som i resten av Epic 2: issue #33, egen branch, PR med `Closes #33`, Vitest, pgTAP og Playwright grønne, lint uten feil, testsammendrag med kjøretid og gjennomgangsfunn i PR-en.

**Never:**
- Ingen nøkkel i repoet, i logger, i utskrift eller i beslutningsloggen. Ingen ekte brukerdata sendes til noen leverandør.
- Ingen endring av `lib/env.ts`-kontrakten (`AI_PROVIDER=mock|openai`), appens skjema, Server Actions, migreringer, `supabase/config.toml` eller `proxy.ts`.
- Ikke bytt standard fra mock i `.env.example` med mindre vinneren er avgjort av en kjøring som er ført i loggen.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Mock | `AI_PROVIDER=mock` | Treff og tider vises, advarselen om kvalitet står først og sist, ingen nettverkskall | N/A |
| Leverandør | `AI_PROVIDER=openai`, nøkkel i `.env` | 20 kall, per-kall-linjer, sammendrag og avgjørelse | Mangler variabel: `serverEnv` kaster med navn på variabelen, uten verdier |
| Ugyldig svar | Svar uten JSON eller med feil kategori | `status: "invalid"`, teller som ugyldig og som bom | Ingen tekst fra svaret skrives ut |
| Tidsavbrudd | Intet svar på 5 s | `status: "timeout"`, `ms` ≈ 5000, teller som over grensen | `suggest` gir fortsatt `null` |
| Nettverks- eller HTTP-feil | 401, 429 eller nedetid | `status: "error"` med kort kode (`http_429`), kjøringen fortsetter | Ingen nøkkel eller tekst i utskriften |
| Grenseverdier | 15, 16 og 20 riktige; 4999 og 5000 ms | 15 gir «ikke bestått», 16 bestått; under 5000 ms bestått, 5000 ikke | N/A |
| Språkhint | Oppsummering med «ikkje» eller «jeg» | Merket «mistenkt», avgjørelsen kan ikke bli «bestått» før det er lest og godkjent | N/A |
| Testsettets form | 19 oppføringer, tre i en kategori, ugyldig kode, tom eller over 1000 tegn | Enhetstesten feiler | N/A |

</frozen-after-approval>

## Code Map

- `lib/ai/index.ts` -- `suggest`, `AI_TIMEOUT_MS`; får `suggestWithOutcome`, og `suggest` blir et omslag. `index.test.ts` -- mønsteret (env settes før import, `fetch` stubbes) og vakten mot logging av tekst.
- `lib/ai/openai.ts` -- `SYSTEM_PROMPT` og `openaiSuggest` (`response_format: json_object`, `AiError`-koder `nettverk`, `avbrutt`, `http_<status>`, `ugyldig_svar`). Ikke endre uten at testen krever det, og kjør i så fall alt på nytt. `lib/ai/validate.ts` -- `parseSuggestion`; ugyldig JSON og ukjent kategori gir begge `ugyldig_svar`. `mock.ts` -- nøkkelord og testordet.
- `lib/env.ts` -- `serverEnv()`; én leverandør om gangen (`AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY`), så tre leverandører betyr tre kjøringer med ulike `.env`-verdier (`node --env-file`).
- `vitest.config.ts` -- to prosjekter, `unit` og `db`; `sm5` legges til, og `unit` får `evals/**/*.test.ts`. `package.json` -- skriptet `eval:sm5` (ikke i `test`). `eslint.config.mjs` dekker `evals/`.
- `lib/limits.ts` -- `charCount`, `SUMMARY_MAX`. `lib/supabase/database.types.ts` -- `Constants` for kategoriene.
- `.env.example`, `README.md` (miljøtabellen rundt linje 139 og statusavsnittet), `docs/beslutninger/arkitektur-beslutningslogg.md`, `docs/prd.md` og `docs/planning-artifacts/prds/prd-LocalFix-2026-09-18/prd.md` (§11 spørsmål 1), `docs/planning-artifacts/architecture/architecture-LocalFix-2026-10-28/ARCHITECTURE-SPINE.md` (Deferred, første rad), `docs/planning-artifacts/research/technical-ki-leverandor-…/research.md` (grunnlag; oppdateres ikke).
- `evals/` -- finnes ikke. Ny: `sm5/testset.ts`, `sm5/score.ts`, `sm5/language.ts`, `sm5/report.ts`, `sm5/run.eval.ts` (+ tester).

## Tasks & Acceptance

**Execution:**
- [x] `lib/ai/index.ts` (+ test) -- `suggestWithOutcome` med status og `ms`; `suggest` uendret i oppførsel -- skriptet må skille ugyldig, tidsavbrudd og feil
- [x] `evals/sm5/testset.ts` (+ formtest) -- 20 beskrivelser, fire per kategori, fasit, to tvetydige med begrunnelse
- [x] `evals/sm5/score.ts`, `language.ts`, `report.ts` (+ tester) -- poengsum, avgjørelse med grenseverdiene, språkhint og utskrift med mock-advarsel; ingen nøkkel i utskriften
- [x] `evals/sm5/run.eval.ts`, `vitest.config.ts`, `package.json` -- `npm run eval:sm5`, ikke med i `npm test`; kjør mot mock og kontroller utskriften
- [ ] `docs/beslutninger/arkitektur-beslutningslogg.md` -- (byggevalgene er ført) avklaringene med kilde og dato, og (etter svaret på åpent spørsmål 1) resultat og valg
- [ ] `docs/prd.md` og PRD i planleggingsmappa, ARCHITECTURE-SPINE (Deferred), `.env.example`, `README.md` -- lukk spørsmål 1 og oppdater raden og variablene etter resultatet
- [ ] README på en ny klone -- følg den steg for steg i en tom mappe, rett det som ikke virket, skriv resultatet til PR-beskrivelsen (krever at Docker Desktop virker)

**Acceptance Criteria:**
- Given `evals/sm5/`, when testsettet åpnes, then har det 20 norske beskrivelser, fire per kategori, med fasit, og skriptet kaller `lib/ai`.
- Given mock, when skriptet kjøres, then står det først og sist at resultatet ikke sier noe om kvalitet.
- Given en leverandør med nøkkel, when skriptet kjøres, then vises riktige av 20, gyldig svar, tid per kall og oppsummeringene, og bare testsettet sendes ut.
- Given valget er tatt, when dokumentene leses, then står resultat og begrunnelse i beslutningsloggen, PRD §11 spørsmål 1 er lukket, Deferred-raden er oppdatert og `.env.example` viser variablene uten nøkkel. Består ingen, står det i loggen at mock er standard.

### Review Findings

Code review av PR #57 (2026-11-16): Blind Hunter, Edge Case Hunter, Verification Gap og Acceptance Auditor, 38 funn. Dommer er satt av triagen, ikke av reviewerne.

- [x] [Review][Patch] Vakten i `vitest.config.ts` er uten test — `wantsSm5` (prosjektet er bare med når `sm5` står i kommandoen) og stoppen når `.env.<modus>` mangler var bare sjekket manuelt. Fjernes en av dem, feiler ingen test, og et senere `vitest` kan sende 20 kall med ekte nøkkel, eller `--mode` med skrivefeil kan måle mock stille. (low, verification-gap) — gjort 2026-11-16: ny `vitest.config.test.ts` (6 tester i `unit`, lagt til i `include`). Ali valgte først «la det stå», men ba så om at testen ble laget. Kontrollert ved å bryte config tre ganger (alltid-på `include`, uten stopp for manglende `.env.<modus>`, `loadEnv` uten prefiks): hver gang feilet nøyaktig én test.
- [x] [Review][Patch] 401 og 403 gir «ikke bestått», som om leverandøren feilet kvalitetstesten — `decide` skiller ikke ugyldig kjøring (nøkkelen avvist) fra dårlig resultat. Det skjedde i Cloudflare-kjøringene, og tre leverandører skal kjøres. Rettelse: når minst ett kall har `http_401` eller `http_403`, skriv «kjøringen er ugyldig, ikke målt: leverandøren avviste nøkkelen …». Ingen tidlig avbrudd. «Minst ett» i stedet for «alle feilrader», siden Cloudflare-kjøring 2 hadde et tidsavbrudd blant 401-ene. Gjort 2026-11-16: `authRejected` i `Summary`, tre tester i `score.test.ts`. [evals/sm5/score.ts:decide] (medium, blind-hunter)
- [x] [Review][Patch] (gjort 2026-11-16: README-avsnittet og kommentaren i `vitest.config.ts` nevner nå `.env.local` og de andre filene) README og kommentaren i `vitest.config.ts` sier at `.env` leses først og så `.env.<leverandør>`, men `loadEnv` leser også `.env.local`, `.env.<modus>` og `.env.<modus>.local` (i standardmodus `test` også `.env.test`). En glemt `.env.local` kan stille endre hva som måles. Rett teksten. [README.md, vitest.config.ts:14-19] (low, blind-hunter + edge-case-hunter + acceptance-auditor)
- [x] [Review][Patch] Innrykket i `vitest.config.ts` er ikke justert etter at konfigurasjonen ble pakket inn i `return { … }` [vitest.config.ts:28-76] (low, blind-hunter) — gjort 2026-11-16: to mellomrom til.
- [x] [Review][Patch] (gjort 2026-11-16: regexen i `report.ts` tar nå også med C1, U+2028/2029 og dobbeltrettingstegn, med test i `report.test.ts`) Oppsummeringens styretegn: bare U+0000–U+001F og U+007F blir mellomrom. C1-tegn (U+0080–U+009F, for eksempel U+009B), U+2028/2029 og dobbeltrettingstegn (U+202A–U+202E, U+2066–U+2069) slipper gjennom til terminalen [evals/sm5/report.ts:44] (low, edge-case-hunter)
- [x] [Review][Defer] AC 4 og «Ferdig»-definisjonen er ikke oppfylt ennå — beslutningsloggen mangler avklaringene (Cloudflare betalingskort og inferenssted, gratisgrenser, trening) selv om to kjøringer mot Cloudflare allerede er gjort (bare syntetiske beskrivelser sendt), PRD §11 spørsmål 1, Deferred-raden og `.env.example` er ikke oppdatert, full `npm test` med kjøretid og README-sjekken på ny klone er ikke gjort, og PR-en bruker `Refs #33` i stedet for `Closes #33` — deferred: kjent og sporet i `issues.md` og oppgave 5–7 over; avgjøres når Cloudflare-kjøringen gir et resultat (omfang A).

#### Rejected

- `false` NFD-testen tester ikke NFD (blind-hunter): kildefila har `fra` + U+0308 i innputten og `fra` + U+030A i erstatningen (sjekket byte for byte), så testen bruker dekomponert å og feiler uten `normalize("NFC")`.
- `false` `vite` er ikke deklarert (blind-hunter): `"vite": "8.3.6"` står i `package.json`, og PR-en endrer bare skriptlinja.
- `false` `.gitignore`-kravet er ikke sjekket (blind-hunter): `.gitignore:43 .env.*` dekker `.env.groq` (sjekket med `git check-ignore`), og `.env.example` er unntatt.
- `false` Tom `toHaveLength` i `run.eval.ts` gir alltid exit 0 (blind-hunter): exit 0 er valgt i spec-en og står i kommentaren i `run.eval.ts`; triageloggen avviste samme poeng (E9).
- `false` Delvis kjøring kan «bestå» med færre enn 20 (edge-case-hunter): `run.eval.ts` skriver rapport bare etter at løkka har gitt 20 rader, og feiler ellers før rapporten.
- `low` Svartid tar med mislykkede kall (blind-hunter): en feilrad gir allerede «IKKE OK» og «ikke bestått», så snittet leses aldri alene; rettelsen endrer hva `maxMs` betyr.
- `low` Tvetydige tilfeller telles som bom (blind-hunter): spec-en har én fasit, og kravet 16 av 20 gir fire i slingringsmonn; avvist som B4b i gjennomgang 1.
- `low` Testsettet er for ensartet (blind-hunter): formen er fastsatt av spec-en (20, fire per kategori, to tvetydige); nye tilfeller er et nytt testsett; avvist som B4 i gjennomgang 1.
- `low` Rapporten mangler tid, commit og prompt-hash, og «temperature er uspesifisert» (blind-hunter): `temperature: 0` sendes i adapteren, og utskriften føres i loggen med dato; ny funksjon (B6/B7).
- `low` Beslutninger fra gjennomgangen (pause, `timeout.ts`, argv-vakt, prefiksbegrenset env) er ikke i beslutningsloggen (blind-hunter): står i Review Triage Log; ingen leser trenger dem for å tolke et resultat.
- `low` Tallene i triageloggen og sesjonsloggen stemmer ikke (11/9, 12/8 og 12/9 fra tre reviewere), og `review_loop_iteration: 0` (blind-hunter, edge-case-hunter): rettelsen er å endre spec-en eller en historisk logg; kosmetisk.
- `low` Gamle eller doble loggoppføringer, som «lokalt, ikke pushet» (blind-hunter): var riktig da loggen ble skrevet, og punktene i `issues.md` er fortsatt åpne.
- `low` `process.argv.includes("sm5")` er skjør: `--project=sm5` gir tomt prosjekt, og `vitest run sm5` slår det på (blind-hunter, edge-case-hunter, verification-gap, acceptance-auditor): `npm test` kjører ikke `sm5`, `vitest run sm5` er å be om det, og `--project=sm5` feiler trygt; valgt i gjennomgang 1 (E3), og en strengere vakt er mer kode enn skriptet er verdt.
- `low` Reservert modusnavn (`production`, `development`) (edge-case-hunter): ingen slik fil finnes, og `.env.<modus>` må likevel finnes for å kjøre.
- `low` Ingen ny forsøk ved 429 eller 5xx (edge-case-hunter): en avvisning er nettopp det kjøringen skal måle (kravet er «alle gyldige»), og pausen på 2 s ble lagt til i gjennomgang 1.
- `low` Dobbelte beskrivelser og manglende `note` oppdages ikke av formsjekken (blind-hunter, edge-case-hunter): settet er håndskrevet og fast, og testen teller allerede notene.
- `low` Språklistene mangler «eit», «uden», «kun», «hvor», «fordi» (blind-hunter): hintet er bare en merknad, og avgjørelsen krever uansett at et menneske leser oppsummeringene.
- `low` Påstanden i kommentaren om at «et vanlig `vitest` aldri sender noe» (edge-case-hunter): stemmer for `vitest` og `npm test`; se argv-punktet.
- `low` Pausen mellom kall er ikke testet i løkka (verification-gap): `pauseMs` er testet; løkka er to linjer i et verktøy som kjøres for hånd.
- `low` Testen sjekker bare at det finnes to `note` (acceptance-auditor): `sm5-08` og `sm5-15` har dem, og kravet er oppfylt.
- `false` AC 3 er bare vist mot mock og falsk server (acceptance-auditor): ikke en feil i koden; en ekte leverandør er det som mangler, sporet i AC 4-punktet.

## Implementation Notes

- Implementert direkte i hovedsesjonen (ingen underagent). Ferdig: `suggestWithOutcome`, testsett og formsjekk (`testset-check.ts`), poengsum, språkhint, utskrift, Vitest-prosjektet `sm5` og `npm run eval:sm5` (utskrift krever `--reporter=verbose`, som ligger i skriptet), README-avsnitt og to linjer i beslutningsloggen. Kjørt mot mock og mot en lokal falsk OpenAI-server (verten og modellen vises, nøkkelen aldri).
- **Venter på prosjekteieren (omfang A):** de tre siste oppgavene. Kjør `npm run eval:sm5 -- --mode <leverandør>`, gjør avklaringene i konsollene, og gi meg utskriftene. Deretter føres resultat og valg, PRD §11 lukkes (begge kopier), Deferred-raden og `.env.example` oppdateres, og README følges på en ny klone (Docker Desktop kreves). Storyen blir ikke `done` før det.

## Spec Change Log

## Review Triage Log

Gjennomgang 1 (blind-hunter 10 funn, edge-case-hunter 9, verification-gap 2 + 1 annet). Kjørt mot diff fra `baseline_commit`, uten spec-en og `sprint-status.yaml`. Ingen intent_gap eller bad_spec.

| Id | Funn | Dom | Bevis | Rute |
|----|------|-----|-------|------|
| V1 | `run.eval.ts` (utfall til rad, valg av mock eller leverandør, env-kobling) har ingen test | medium | Sant: bare lengden ble sjekket. | patch: `run-helpers.ts` + `run-helpers.test.ts` |
| V2 | `formatReport`: `fasit=`, `svar=`, `riktig`/`feil`, `Svartid` og `Språk` er ikke testet | medium | Sant: bare id, oppsummering, treff- og gyldig-linjene var sjekket. | patch: nye tester i `report.test.ts` |
| V3/B2 | `loadEnv` med tomt prefiks tar med hele skallmiljøet og lar det vinne over filene | medium | Sant (Vite slår process.env over filene). | patch: bare `AI_` og `NEXT_PUBLIC_`, og README sier at skallet vinner |
| B3/E4 | `--mode` med skrivefeil eller en fil uten leverandør måler mock stille | medium | Sant: advarselen er eneste signal, exit 0. | patch: config stopper når `.env.<mode>` mangler, og `assertModeMatchesProvider` stopper når mock kommer ut |
| E3 | `vitest` uten `--project` tar med `sm5` og kan sende 20 kall med nøkkelen | medium | Sant: prosjektet hadde alltid `include`. | patch: prosjektet er bare med når `sm5` står i kommandoen |
| B5/E1 | 20 kall uten pause gir 429 på gratisnivå (Mistral) som teller som ugyldig | medium | Plausibelt; pausen koster ingenting og teller ikke i svartiden. | patch: `PROVIDER_PAUSE_MS` = 2000 mot leverandør |
| B1 | Lekkasjetesten av nøkkel kan ikke feile (`formatReport` får aldri nøkkelen) | low | Sant for den gamle testen. | patch: `runInfoFrom` testes med en nøkkel i `ServerEnv`, og utskriften sjekkes |
| E5 | Styretegn og linjeskift i en modelloppsummering bryter utskriften | low | Sant; enkel rettelse. | patch: styretegn blir mellomrom, med test |
| E2 | Gyldig svar uten oppsummering får ingen språksjekk og består | low | Sant. | patch: `noSummary` telles, vises og nevnes i avgjørelsen |
| B8/E6 | Språklistene er korte, og NFD-å treffer ikke | low | Sant for NFD, og noen vanlige ord manglet. | patch: sju nynorsk- og to dansk-ord, `normalize("NFC")`, test |
| B9 | `score.ts` henter `AI_TIMEOUT_MS` fra hele `lib/ai`, så testene må stubbe env | low | Sant: utviklerfriksjon. | patch: `lib/ai/timeout.ts` uten importer, og `index.ts` eksporterer den videre |
| E7 | `sm5-11` («e blitt») og `sm5-16` («bushen») er ikke bokmål, i strid med at settet er bokmål | low | Sant. | patch: rettet til «er blitt» og «busken» |
| B4 | Settet skiller dårlig mellom leverandører, ingen vanskelige tilfeller | low | Sett fra spec-en: 16 av 20 er kravet (PRD §11), og to tvetydige tilfeller finnes. En endring er et nytt testsett. | avvist |
| B4b | Tvetydige tilfeller bør ha godtatte alternativer | low | Spec-en har én fasit og begrunnelse i filen. Rettelsen er å endre spec-en. | avvist |
| B6/B7 | Ingen gjentatte kjøringer eller lagring av resultatet til fil | low | Ny funksjon. README sier at alt kjøres om igjen ved endring, og utskriften føres i loggen. | avvist |
| B10 | README-statusavsnittet vokser | low | Samme mønster som i hver story. | avvist |
| B-sk | `suggest` kan gi `none` for ikke-mock, og `ms >= 5000` kan avrundes | false | Adapteren kaster ved ugyldig svar, så `none` finnes bare for mock-testordet. En avrunding i grensen er uten betydning. | avvist |
| E8 | `SM5_SIZE` er fast mens kategoriene kommer fra enumen | false | Spec-en fastsetter 20 og fire per kategori. | avvist |
| E9 | Exit 0 selv om leverandøren ikke består | false | Valgt i spec-en («exit 0») og beskrevet i `run.eval.ts`. | avvist |
| B-eng | Engelsk oppsummering gir ingen språkhint | low | Avgjørelsen krever uansett at du leser dem. En engelsk-sjekk er ny funksjon. | avvist |

## Design Notes

- **Hvorfor Vitest og ikke et frittstående skript.** `lib/ai` bruker `@/`-importer og TypeScript som Node ikke kan fjerne rent (parameteregenskaper i `AiError`). Vitest løser stiene allerede, og ingen ny pakke trengs. Skriptet ligger utenfor `npm test` fordi det bruker nettverk, nøkler og kvote.
- **«Gyldig» betyr det appen godtar:** `parseSuggestion` (JSON, én av fem koder). Feil, men gyldig kategori er en bom og ikke ugyldig. Skillet mellom ugyldig JSON og ukjent kode går tapt i `ugyldig_svar`; det godtas.
- **Kjøring mot flere leverandører:** `node --env-file=.env --env-file=.env.groq` osv., der `.env.<leverandør>` er ignorert av git (`.env.*`).
- **Modellnavn og adresser** hentes fra leverandørens konsoll ved kjøring, ikke festet i repoet, siden modeller avvikles raskt (research §4).

## Verification

**Commands:**
- `npm run lint` -- expected: 0 feil
- `npm run test:unit` -- expected: alle bestått, ingen typefeil
- `npm run eval:sm5` -- expected: mot mock: 20 linjer og advarselen om kvalitet, exit 0
- `npm run build` -- expected: bygger
- `npm test` -- expected: Vitest `unit` og `db`, pgTAP og Playwright består. Skriv kjøretiden i PR-beskrivelsen.

**Manual checks (if no CLI):**
- Les utskriften mot en leverandør: oppsummeringene er norsk bokmål, og ingen nøkkel eller beskrivelse utenfor testsettet er med.
