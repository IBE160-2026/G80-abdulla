# Cloudflare Workers AI, runde 2, assistent 3 (aca4ba3d)

Tilgang 2026-10-28. 14 sider lest via WebFetch (litt over 12-kildersbudsjettet). Forbehold: WebFetch oppsummerer med en liten modell, så tall er andrehånds gjengivelser av primærsidene. Nøkkeltall bør sjekkes med øyet før de legges til grunn.

## A. Gratisnivå
| Påstand | Kilde | Dato | Tillit | Klasse |
|---|---|---|---|---|
| 10 000 Neurons/dag gratis, nullstilles 00:00 UTC | https://developers.cloudflare.com/workers-ai/platform/pricing/ | sist oppd. 20.10.2026 | høy | pricing |
| Overforbruk på gratis plan: «videre operasjoner feiler med en feil», ingen fakturering. Mer krever Workers Paid ($0,011 per 1 000 Neurons over de gratis 10 000) | samme | 20.10.2026 | høy | pricing |
| Neuron-priser (input/output per M tokens): llama-3.1-8b-instruct-fp8 13 778 / 26 128; llama-3.2-3b 4 625 / 30 475; llama-3.2-1b 2 457 / 18 252; gemma-4-26b-a4b-it 9 091 / 27 273; mistral-small-3.1-24b 31 876 / 50 488 | samme | 20.10.2026 | høy | pricing |
| Utregning (assistentens antagelse: ~400 input- og ~100 output-tokens per kall): Llama 3.1 8B fp8 ≈ 8,1 Neurons/kall ≈ 1 200 kall/dag; Gemma 4 26B ≈ 6,4 ≈ 1 550 kall/dag; Llama 3.2 3B ≈ 4,9 ≈ 2 000 kall/dag. Langt over behovet på noen hundre kall/dag | beregnet fra prissiden | | medium | pricing |
| Gemma 4-modellsiden: $0,10/M input og $0,30/M output, stemmer med 9 091 Neurons/M × $0,011/1000 | https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/ | ingen dato | høy | pricing |
| Llama 3.3 70B fp8-fast: $0,293/M input, $2,253/M output, 24k kontekst, mye dyrere i Neurons | .../llama-3.3-70b-instruct-fp8-fast/ | ingen dato | medium | pricing |
| Katalog: 39 tekstgenereringsmodeller. Relevante: gemma-4-26b-a4b-it, llama-3.1-8b-instruct-fp8, llama-3.3-70b-instruct-fp8-fast, llama-4-scout-17b-16e, mistral-small-3.1-24b, qwen3-30b-a3b-fp8, gpt-oss-20b/120b, eurollm-9b-it, glm-4.7-flash/5.x, kimi-k2.6, nemotron-3-120b, deepseek-v4 | https://developers.cloudflare.com/workers-ai/models/ | oppd. 12.08.2026 | høy | other |
| Prissiden lister fortsatt modeller som ikke er i katalogen (llama-3.1-8b-instruct uten fp8, gemma-3-12b-it), altså delvis utdatert | katalog + pris | | medium | other |
| Gratis uten kredittkort: **IKKE bekreftet**. Oversikten sier bare «Tilgjengelig på Free og Paid» | https://developers.cloudflare.com/workers-ai/ | oppd. 21.04.2026 | lav | terms |
| Rategrense: standard 300 forespørsler/min for tekstgenerering uten krav om Paid. Betalt-only-modeller 20/min | https://developers.cloudflare.com/workers-ai/platform/limits/ | 17.09.2026 | medium | limits |

## B. Vilkår og data
- «Cloudflare bruker ikke Customer Content behandlet av Workers AI til å trene AI-modeller.» Behandler innhold «bare så lenge det trengs». Standard inferens lagres ikke, men AI Gateway-logging, R2, KV osv. kan lagre data. https://developers.cloudflare.com/workers-ai/platform/data-usage/ (oppd. 16.10.2026). Høy.
- Inferenslokasjon: «på GPU-er i Cloudflares globale nett», ingen regioner oppgitt. Ikke oppgitt om inferens kan låses til EU eller kjøres utenfor. Medium.
- Land- og aldersbegrensninger: ikke funnet.

## C. Endringshistorikk siste 12 mnd
- Ca. 18 eldre modeller avviklet 30.05.2026 (varslet 08.05.2026): Llama 2, 3 og 3.1-varianter, Mistral 7B, Gemma 7B og Gemma 3 12B, Hermes 2 Pro, Phi-2, SQLCoder. `-fast` og `-lora` beholdes. https://developers.cloudflare.com/workers-ai/changelog/. Medium.
- Kimi K2.5 aliaset til K2.6 (høyere pris) 30.05.2026.
- Nye modeller: Qwen3 30B A3B (13.11.2025), GLM-4.7-Flash (13.02.2026), Nemotron 3 Super (11.03.2026), Gemma 4 26B A4B (04.04.2026), Kimi K2.6/K2.7, GLM-5.2 (16.06.2026). Katalogen viser også nyere (glm-5.3, deepseek-v4.x, qwen3.8) som changelog-oppsummeringen utelot.
- Ingen endring i gratisgrensen funnet. 10 000/dag er gjeldende.
- Avviklingssiden ga 404.

## D. Strukturert output
- `response_format` med `type: "json_object"` eller `"json_schema"` pluss `json_schema`-egenskap. OpenAI-kompatibel. https://developers.cloudflare.com/workers-ai/features/json-mode/ (14.09.2026). Høy.
- Dokumenterte modeller: llama-3.3-70b-instruct-fp8-fast, llama-3-8b-instruct, llama-3.1-8b-instruct, hermes-2-pro-mistral-7b, deepseek-coder-6.7b-awq, deepseek-r1-distill-qwen-32b. Listen ser utdatert ut (flere avviklet/omdøpt). Gemma 4-siden lister `response_format` som parameter, men detaljerer ikke JSON-schema-støtte. Medium.
- Begrensninger: skjemaoverholdelse er ikke garantert, feilen «JSON Mode couldn't be met» må håndteres, ingen streaming i JSON-modus, eksempelsvar pakket i en `response`-nøkkel. Høy.

## E. SDK og integrasjon
- REST: POST `https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/run/@cf/<modell>` med Bearer API-token. https://developers.cloudflare.com/workers-ai/get-started/rest-api/ (15.09.2026). Høy.
- OpenAI-kompatibel: base-URL `https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/v1` med `/chat/completions` og `/embeddings`. `/responses` kun for gpt-oss. Offisiell `openai` JS-SDK fungerer med Cloudflare-token som apiKey. Siden dokumenterer ikke `response_format` her. (18.09.2026). Høy.
- Offisiell TS-SDK: repo cloudflare/cloudflare-typescript, siste v7.3.0, 02.10.2026. Pakkenavnet `cloudflare` er utledet fra import-setninger. Ingen `ai.run`-eksempel sett. Medium.
- Må ikke flytte DNS/hosting for REST-bruk (slutning fra dokumentasjon, ikke eksplisitt). Latens: ingen primærtall.

## F. Norsk
- Ingen Cloudflare-publisert evidens for norsk kvalitet. Modellsidene for Gemma 4, Llama 3.3 og EuroLLM lister ikke støttede språk. EuroLLM-siden sier «de vurderte språkene» uten å nevne norsk. Søk fant ingen uavhengig norsk benchmark av Workers AI-modeller. Lav-medium.

## Ledetråder
- Test Gemma 4 26B A4B (billigst, 256k kontekst) og Llama 3.3 70B på ca. 20 virkelige norske eksempler. Sjekk modellkortene for norsk støtte.
- Live-test `response_format` json_schema på gemma-4 via OpenAI-endepunktet; dokumentasjonen er inkonsistent.
- Cloudflares personvernerklæring og DPA for EU-behandling; registreringsflyten for kortspørsmålet.
- hvilkenai.no (daglig skandinavisk benchmark) for å se om Cloudflare-modeller inngår.

## Ikke funnet
Kortfri registrering; EU-only inferens; land- og aldersbegrensninger; latenstall; avviklingsside (404); npm-side (403); norsk benchmark.
