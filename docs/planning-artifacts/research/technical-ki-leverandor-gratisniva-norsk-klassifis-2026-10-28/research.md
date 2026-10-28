---
title: 'Teknisk research: KI-leverandør med gratisnivå for LocalFix'
type: 'technical'
topic: 'KI-leverandør med gratisnivå for norsk klassifisering og oppsummering'
decision: 'Velge KI-leverandør med gratisnivå for kategori og oppsummering av norske rapportbeskrivelser i LocalFix'
shape: 'select'
source: 'native'
status: final
preset: 'deep'
validation: 'normal'
created: '2026-10-28'
updated: '2026-10-28'
valid-until: '2027-01-28'
---

# Teknisk research: KI-leverandør med gratisnivå for LocalFix

**Beslutningen denne researchen skal støtte:** Hvilken KI-leverandør med gratisnivå skal LocalFix bruke til å foreslå kategori og skrive en kort oppsummering av norske rapporter (PRD §11, åpent spørsmål 1, FR-4, NFR-7, SM-5)?

**Ferskhet:** Alle priser, grenser og vilkår er lest 2026-10-28. Modellfeltet for KI endrer seg på uker. Rapporten bør oppdateres før noen handler på den etter **2027-01-28**.

## Sammendrag

1. **Researchen gir ingen klar vinner, og den kan ikke gi det.** Ingen av kandidatene har et lesbart, uavhengig mål på kvaliteten på norsk tekstklassifisering. Samlet score ligger tett (Gemini 355, Groq 350, Cloudflare 350, Mistral 320 av 500). Forskjellene er mindre enn usikkerheten i tallene.
2. **Google Gemini bør ikke brukes på gratisnivå med ekte brukerdata.** Vilkårene sier at man bare kan bruke betalte tjenester når API-klienter gjøres tilgjengelige for brukere i EØS, Sveits eller Storbritannia. Gratisinnhold brukes til produktforbedring og kan leses av menneskelige vurderere. Begge påstandene er bekreftet på Googles egne vilkårsside.
3. **OpenRouter faller ut.** Gratismodellene har 50 forespørsler per dag, omtrent 15 modeller som kommer og går, og OpenRouter skriver selv at de «vanligvis ikke er egnet for produksjon».
4. **Kvalifisert favoritt: Cloudflare Workers AI** (først Gemma 4 26B A4B). Gratisgrensen er publisert på primærsiden (10 000 Neurons per dag, omtrent 1 200 til 2 000 kall per dag etter en grov regning), overforbruk gir feil og ikke regning, og Cloudflare sier at kundeinnhold ikke brukes til opplæring. **Nest beste: Groq (gpt-oss-120b).**
5. **Det som gjenstår må måles, ikke leses.** Fire ting er uverifisert for favoritten: kredittkortkrav, hvor inferens kjøres, om `json_schema` virker pålitelig på Gemma 4 via Cloudflare, og norsk kvalitet. SM-5-testsettet svarer på de to siste.
6. **Anbefalt fremgangsmåte:** Bygg KI-grensesnittet mot et OpenAI-kompatibelt endepunkt (leverandør, modell og base-URL i `.env`). Kjør SM-5 mot Cloudflare, Groq og Mistral med testdata. Velg ut fra resultatet.

## 1. Kravramme

Rammen er avtalt med deg før researchen startet. Prosjektets krav er brukt til å styre hva det letes etter, og ikke som bevis.

**Harde krav:** (1) Gratisnivå uten betalingskort. (2) Strukturert svar (JSON-skjema). (3) Brukbar norsk. (4) Kall fra Next.js-serverrute i TypeScript eller REST. (5) Vilkår som tillater at studentskrevne rapporter sendes dit, særlig om leverandøren trener på dataene.

**Vekter:** norsk kvalitet 25 · gratisstabilitet og grenser 25 · JSON 15 · personvern og datavilkår 10 · svartid 10 · SDK 10 · innlåsing 5.

**Prosjektforutsetninger som påvirker vekten:** Leverandøren legges bak et grensesnitt med mock-modus, så sensor trenger aldri en nøkkel (NFR-2). Innlåsing veier derfor lite. Behovet er lavt (titalls til noen hundre kall per dag).

## 2. Kandidatscreening

Se `digests/screen-r1-0.md`. Kilder i denne runden var sammenligningsblogger, og tallene ble bare brukt som ledetråder.

| Kandidat | Utfall | Grunn |
|---|---|---|
| Google Gemini API | Finalist | Gratisnivå uten kort ser ut til å finnes |
| Mistral (Free mode) | Finalist | Kort ikke påkrevd |
| Groq | Finalist | Gratisplan finnes |
| Cloudflare Workers AI | Finalist | Publisert daglig gratisandel |
| OpenRouter `:free` | Finalist, falt ut senere | Se §4.5 |
| Cerebras | Kuttet | Engangskreditt som utløper etter 30 dager |
| Vercel AI Gateway | Kuttet | Månedlig kreditt, ikke gratisnivå |
| OpenAI, Cohere, Z.AI | Reserve | Ikke bekreftet gratis API (OpenAI), prøvenøkler ikke for produksjon (Cohere), uavklart norsk og datavilkår (Z.AI) |
| Lokal modell (Ollama) | Utenfor | Ikke en API. Dekkes av mock-modus |

## 3. Norsk kvalitet (kriteriet med høyest vekt, og minst evidens)

**Funn: det finnes ingen lesbar, datert norsk skår for noen av målmodellene.** Kilde: `digests/norsk-kvalitet-r2-1.md`.

- NorEval (ACL Findings 2025, arXiv 2504.07749) dekker 19 åpne modeller. Den er omtrent 16 måneder gammel og har etter det assistenten kunne lese ingen Gemini-, Qwen- eller API-modeller. Den er historie for dagens modeller.
- EuroEval er det levende leaderboardet for norsk, men siden er JavaScript-rendret og kunne ikke leses. Det er en sporbar ledetråd, ikke et funn.
- Én leverandørblogg (Berget.ai, 2026-05-05) sier at Gemma 4 31B fikk 1,33 på EuroEval norsk, #3 samlet og #1 blant åpne vekter, og at bare Gemini-API-modeller rangerer høyere. **Dette er andrehånds og uverifisert, og skalaen er ikke bekreftet.** Merk at det gjelder 31B-modellen. Cloudflare tilbyr 26B A4B, en annen modell.
- Mistral lister norsk blant språkene med «sterk forventet ytelse» (dokumentasjon uten dato, ingen modellversjon). Det er en påstand fra leverandøren, ikke en måling.
- Ingen måling av om modellene blander bokmål med dansk eller nynorsk. Det er en reell risiko som ikke er målt noe sted.
- Cloudflare, Groq, OpenRouter og Gemini publiserer ingen norsk kvalitetsevidens for tekstmodellene sine.

**Konsekvens:** Dette kriteriet kan bare avgjøres av din egen test (§6).

## 4. Kandidatene mot kriteriene

### 4.1 Google Gemini API
Kilde: `digests/gemini-r2-6.md`.
- **Gratisnivå:** Finnes, og nye kontoer starter der. Gratismodellene inkluderer Gemini 3.8 Flash, 3.6 Flash, 3.5 Flash-Lite, 3.1 Flash-Lite og Gemma 4. Kortkrav oppgis ikke. **Eksakte grenser (RPM/RPD) er ikke publisert i dokumentasjonen**, bare synlige innlogget i AI Studio. Blogger oppgir motstridende tall, og de ignoreres.
- **Data og vilkår (bekreftet på `ai.google.dev/gemini-api/terms`, effektiv 2026-03-23):** Gratisinnhold brukes til å forbedre produkter. Menneskelige vurderere kan lese input og output. Vilkårene sier: «Do not submit sensitive, confidential, or personal information to the Unpaid Services». Man kan «only use Paid Services when making API Clients available to users in the European Economic Area, Switzerland, or the United Kingdom». Ingen opt-out uten fakturering.
- **Endringer:** Forhåndsmodeller trekkes raskt (flere nedlagt i 2026). Tilgang til 2.5-modellene er 2026-09-18 begrenset til brukere som har brukt dem før. Google anbefaler 3.5 Flash-Lite eller 3.8 Flash for nye prosjekter.
- **JSON:** Sterkest dokumentert av alle, inkludert `enum` for klassifisering. Fem kategorier er ingen problem.
- **SDK:** `@google/genai` v2.31.0 (2026-10-23), omtrent ukentlige utgivelser. Server er anbefalt miljø.
- **Norsk:** Ingen evidens for tekstmodellene.

**Vurdering:** Teknisk best, men vilkårene gjør gratisnivået uegnet så snart ekte brukere i Norge bruker appen. Det er rimelig å regne med at en demo for sensor og medstudenter faller under dette. **Dette er en tolkning av vilkårene, ikke juridisk rådgivning.**

### 4.2 Cloudflare Workers AI
Kilde: `digests/cloudflare-r2-3.md`. Pris- og datasiden er hentet direkte to ganger.
- **Gratisnivå:** 10 000 Neurons per dag, nullstilles 00:00 UTC. Overforbruk på gratisplanen «will fail with an error», så det er ingen fakturering. Siden er oppdatert 2026-10-20.
- **Kapasitet (egen grov regning, antar ca. 400 tokens inn og 100 ut per kall):** Gemma 4 26B A4B (9 091 / 27 273 Neurons per million tokens) gir ca. 6,4 Neurons per kall, altså omtrent 1 500 kall per dag. Llama 3.1 8B omtrent 1 200. Mer enn nok for behovet.
- **Data (bekreftet, oppdatert 2026-10-16):** «Cloudflare does not use Customer Content processed by Workers AI to train AI models». Standard inferens beholdes ikke. **Hvor inferens kjøres oppgis ikke**, og EU-behandling nevnes ikke.
- **Ubekreftet:** Om gratis registrering krever kredittkort. Landbegrensninger.
- **Endringer:** Rundt 18 eldre modeller ble avviklet 2026-05-30. Prissiden lister fortsatt modeller som ikke er i katalogen.
- **JSON:** `response_format` med `json_object` og `json_schema` finnes, men dokumentasjonen sier at skjemaoverholdelse ikke garanteres, modelllisten ser utdatert ut og Gemma 4-siden er ikke tydelig. **Må testes live.**
- **SDK:** REST med API-token, OpenAI-kompatibelt endepunkt (offisiell `openai`-SDK virker), og TS-SDK v7.3.0 (2026-10-02).
- **Norsk:** Ingen Cloudflare-publisert evidens. Modellkatalogen har 39 tekstmodeller, blant annet Gemma 4, Llama 3.3, Mistral Small 3.1, Qwen3 og gpt-oss.

### 4.3 Groq
Kilde: `digests/groq-r2-5.md`.
- **Gratisnivå:** **Gratistallene er ikke publisert i dokumentasjonen.** Siden har en gratisfane uten tall, og tabellen som vises er Developer-planens (30 RPM, 1 000 RPD, 8 000 TPM, 200 000 TPD for gpt-oss og Qwen3.8). Bekreftet ved ny henting. Kortkrav kun støttet av et søkesammendrag.
- **Data:** Avtalen (endret 2026-06-22) forbyr trening på input og output. Logger opptil 30 dager. Kundedata lagres i USA. Inferensregion ikke oppgitt. Dette er kun lest én gang.
- **Modellomsetning:** Rundt åtte chatmodeller ble avviklet eller erstattet på 12 måneder, blant annet begge Llama-modellene. gpt-oss-120b og -20b er produksjonsmodeller uten kjent nedleggelse. Qwen3.8 er forhåndsvisning.
- **JSON:** Streng, begrenset dekoding for gpt-oss og Qwen3.8 (`strict: true`). Sterkt.
- **Latens:** Uavhengig mål (Artificial Analysis) 0,66 s til første token for gpt-oss-120b. Raskest av alle.
- **Norsk:** Ingen evidens. Et søkesammendrag av en arXiv-evaluering antyder at gpt-oss er svak på flerspråklige oppgaver (kun kinesiske tall sett). Lav tillit, men ingen annen evidens peker andre veien.
- **SDK:** OpenAI-kompatibelt (`https://api.groq.com/openai/v1`). Pakkenavnet er ikke bekreftet.

### 4.4 Mistral (Free mode)
Kilde: `digests/mistral-r2-4.md`.
- **Gratisnivå:** Mistrals dokumentasjon sier «no credit card required». **Ingen grenser publisert** utenfor innlogget konsoll. Tall fra aggregatorer (omtrent 1 milliard tokens per måned) er uverifiserte.
- **Data:** Mistral skriver at de «may use your data (input and output) to train» på Free mode og at man har rett til å velge seg ut. Det er uklart om det virker på gratisplanen.
- **Endringer:** Ingen endring i gratisnivået siste 12 måneder etter changelog. Eldre modeller (Small 3.2) er avviklet, så unngå festede modellnavn.
- **JSON:** Strukturert output finnes. De rå feltnavnene og enum-støtte er ikke bekreftet fra Mistral-sider.
- **SDK:** `@mistralai/mistralai`, ESM-bare, versjon 3.4.0. Region-valg `eu`/`us`/`global` finnes i SDK-et.
- **Norsk:** Norsk står på språklisten. Ingen uavhengig måling.

### 4.5 OpenRouter (`:free`)
Kilde: `digests/openrouter-r2-2.md`.
- 20 forespørsler per minutt og **50 per dag** (1 000 etter at du har kjøpt 10 kreditter). FAQ: gratismodeller «are usually not suitable for production use».
- Gratislisten har 15 modeller, mest NVIDIA, kode og eksperimentelle. OpenRouter skriver selv at noen gratismodeller «will soon transition away» og at de «cannot guarantee the future».
- Gratismodellers leverandører kan trene på prompter med mindre en kontobryter er skrudd av. Strukturert output avgjøres per endepunkt og er ikke verifisert for noen gratismodell.
- Ingen norsk evidens.
- **Faller ut** på stabilitet og modellfelt. Kan brukes som reservevei.

## 5. Beslutningsmatrise

Skala 1–5. Poengene er mine vurderinger av evidensen over, så vektene kan endres. Tillit i parentes.

| Kriterium | Vekt | Gemini | Cloudflare | Groq | Mistral | OpenRouter |
|---|---|---|---|---|---|---|
| Norsk kvalitet | 25 | 4 (lav) | 3 (lav) | 2 (lav) | 3 (lav) | 1 (lav) |
| Gratisstabilitet og grenser | 25 | 3 (medium) | 4 (høy) | 3 (medium) | 3 (medium) | 1 (høy) |
| Pålitelig JSON | 15 | 5 (høy) | 3 (medium) | 5 (høy) | 4 (medium) | 2 (medium) |
| Personvern og datavilkår | 10 | 1 (høy) | 4 (høy) | 4 (medium) | 2 (medium) | 2 (medium) |
| Svartid | 10 | 3 (lav) | 3 (lav) | 5 (medium) | 3 (lav) | 2 (lav) |
| SDK og utvikleropplevelse | 10 | 5 (høy) | 4 (medium) | 4 (medium) | 4 (medium) | 4 (medium) |
| Innlåsing | 5 | 3 | 4 | 4 | 4 | 5 |
| **Sum (maks 500)** | | **355** | **350** | **350** | **320** | **185** |

Hvordan hvert tall er regnet: vekt × poeng, summert. Eksempel Cloudflare: 25·3 + 25·4 + 15·3 + 10·4 + 10·3 + 10·4 + 5·4 = 75 + 100 + 45 + 40 + 30 + 40 + 20 = 350.

**Les matrisen slik:**
- De fire øverste ligger innenfor 35 poeng av hverandre. Det er ikke en meningsfull forskjell gitt at «norsk kvalitet» (høyest vekt) er et gjetningsfelt for alle.
- **Gemini topper på poeng, men faller på harde krav 5** (datavilkår) for ekte brukere i EØS. En sum kan ikke veie opp for det.
- Etter den porten står Cloudflare og Groq likt. Cloudflare får fordelen fordi grensen er publisert og kontrollert på primærsiden, og fordi norsk-signalet (om svakt) peker mot Gemma, som Cloudflare tilbyr. Groq får fordelen på latens og strengere JSON.
- **To-kilde-regelen:** Cloudflares 10 000 Neurons er lest to ganger fra primærsiden, pluss modellsiden (dollarprisen stemmer med Neuron-prisen). Geminis EØS-vilkår er lest to ganger. Groqs manglende gratistall er bekreftet to ganger. Alt som står som «uverifisert» ligger bak én kilde.

## 6. Verdikt

**Valg:** Cloudflare Workers AI, først med **Gemma 4 26B A4B**, kalt over det OpenAI-kompatible endepunktet.
**Nest beste:** Groq med **openai/gpt-oss-120b**.

**Når nest beste vinner i stedet:**
- Cloudflare krever kredittkort, eller `json_schema` på Gemma 4 viser seg upålitelig i live-test.
- Norsk-testen viser at gpt-oss-120b treffer minst 16 av 20 og Gemma 4 ikke gjør det.
- Du kan lese Groqs egne gratisgrenser i konsollen og de dekker behovet.

**Når Mistral vinner:** Hvis testen viser at Mistral Small er klart best på norsk og du har bekreftet at opt-out virker på Free mode. Mistral er også et selskap i EU (Frankrike), men dette er ikke undersøkt her.

**Sterkeste argument mot valget:** Det finnes ingen norsk måling bak noen av modellene, og den eneste signalet for Gemma 4 gjelder en annen størrelse (31B) og kommer fra en leverandørblogg. Cloudflares egen JSON-dokumentasjon er utdatert og motsier seg selv, og kredittkortspørsmålet og inferensregionen er ikke avklart. Valget kan altså vise seg å være feil allerede ved første kjøring.

**Billigste sikring (reversibilitet):**
1. Skriv KI-grensesnittet mot OpenAI-kompatibelt chat-endepunkt, med base-URL, modell og nøkkel i `.env` og `.env.example`. Cloudflare, Groq og OpenRouter støtter dette. Gemini og Mistral har egne SDK-er, men kan legges til som egne adaptere.
2. Kjør SM-5-testsettet (20 beskrivelser, 4 per kategori) mot Cloudflare Gemma 4, Groq gpt-oss-120b og Mistral Small, bare med testdata. Gemini kan tas med så lenge testdataene ikke inneholder personopplysninger.
3. Kjør en språk-ID-sjekk på de genererte sammendragene for å fange dansk eller nynorsk i svaret.
4. Velg den leverandøren som treffer minst 16 av 20, har gyldig JSON hver gang og holder seg under 5 sekunder. Skriv valget og resultatet inn i PRD (§11) og arkitekturen.
5. Ha mock-modus som standard slik at NFR-2 holder uansett.

## 7. Konsekvenser for PRD og arkitektur

- **PRD §11, åpent spørsmål 1** kan oppdateres: «Foreløpig valg Cloudflare Workers AI, bekreftes av SM-5. Alternativer Groq og Mistral.» Ikke lukk spørsmålet før testen er kjørt.
- **PRD §8 (personvern):** KI-kallet sender rapportteksten til en ekstern tjeneste. Dette bør stå eksplisitt, i tillegg til påminnelsen om å unngå personopplysninger.
- **Arkitektur:** KI-grensesnittet må tåle at gratisgrenser eller modeller endres, og at kall feiler. FR-4 har allerede 5 sekunders grense og fallback. Husk å håndtere «JSON Mode couldn't be met» (Cloudflare) og 429 (alle).
- **SM-5-testsettet** får dobbelt rolle: det kvalitetssikrer funksjonen og velger leverandør.

## 8. Åpne spørsmål og begrensninger

1. Krever Cloudflare kredittkort for gratis Workers AI? (Sjekk registreringsflyten.)
2. Hvor kjører Cloudflare inferens, og er det et problem for studentprosjektet?
3. Hva er Groqs faktiske gratisgrenser? (Konsoll, innlogget.)
4. Hva er Mistral Free mode-grensene, og virker opt-out på gratisplanen?
5. Hvordan rangerer Gemini Flash, Gemma 4, Mistral Small og gpt-oss på norsk i EuroEval i dag? (Åpne euroeval.com i nettleser. Hele leaderboardet er JavaScript-rendret og kunne ikke leses her.)
6. Blander modellene dansk eller nynorsk inn i norske sammendrag? (Ikke målt noe sted.)
7. Er gratisbruk av Gemini tillatt for en demo med brukere i Norge? (Tolkning av vilkårene. Spør Google hvis du vil bruke den.)

**Begrensninger ved metoden:** Siden WebFetch oppsummerer sider med en liten modell, er sitater og tall i digestene gjengivelser og ikke ordrette kopier med mindre de står i anførselstegn. Nøkkeltallene som avgjør valget er derfor lest på nytt direkte. Flere sentrale tall (Groqs, Mistrals og Geminis gratisgrenser) ligger bak innlogging og kunne ikke leses. Rapporten bruker kildelister per leverandør og ikke nummererte henvisninger `[n]` i teksten, så den mekaniske sitatsjekken og en uavhengig semantisk sjekk ble ikke kjørt. Alle påstander kan i stedet spores til digestene i `digests/`.

## Kilder og digests

Alle råfunn med kilde, utgiver og dato ligger i `digests/`:
- `screen-r1-0.md` (screening, sekundærkilder)
- `norsk-kvalitet-r2-1.md`
- `openrouter-r2-2.md`
- `cloudflare-r2-3.md`
- `mistral-r2-4.md`
- `groq-r2-5.md`
- `gemini-r2-6.md`

Primærkilder brukt i verdiktet (alle hentet 2026-10-28):
- Google, Gemini API vilkår: https://ai.google.dev/gemini-api/terms (effektiv 2026-03-23, oppdatert 2026-04-28)
- Google, Gemini API priser: https://ai.google.dev/gemini-api/docs/pricing (oppdatert 2026-10-27)
- Google, Gemini API fakturering: https://ai.google.dev/gemini-api/docs/billing (oppdatert 2026-09-28)
- Cloudflare, Workers AI priser: https://developers.cloudflare.com/workers-ai/platform/pricing/ (oppdatert 2026-10-20)
- Cloudflare, Workers AI datavilkår: https://developers.cloudflare.com/workers-ai/platform/data-usage/ (oppdatert 2026-10-16)
- Groq, rategrenser: https://console.groq.com/docs/rate-limits (ingen dato)
- Groq, Services Agreement: https://console.groq.com/docs/legal/services-agreement (endret 2026-06-22)
- Groq, datahåndtering: https://console.groq.com/docs/your-data (ingen dato)
- Mistral, hjelpeartikkel om trening: https://help.mistral.ai/en/articles/347617-do-you-use-my-user-data-to-train-your-models
- Mistral, API-nøkkel og Free mode: https://docs.mistral.ai/getting-started/quickstarts/studio/activate-and-generate-api-key
- OpenRouter, grenser: https://openrouter.ai/docs/api-reference/limits ; FAQ: https://openrouter.ai/docs/faq
- NorEval: https://arxiv.org/abs/2504.07749 (ACL Findings 2025)
