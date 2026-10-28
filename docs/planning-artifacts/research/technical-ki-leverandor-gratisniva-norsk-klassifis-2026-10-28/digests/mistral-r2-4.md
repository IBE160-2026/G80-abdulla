# Mistral (Free mode), runde 2, assistent 4 (aa012d53)

Tilgang 2026-10-28. 18 kall; ca. 9 primærsider og 1 aggregator lest.

**Hovedfunn:** gratisnivået krever ikke kort, men Mistral publiserer ingen eksakte grenser eller modellliste utenfor innlogget konsoll. På gratisplanen kan prompter og svar brukes til trening. Dokumentasjonen nevner opt-out, men hjelpeartikkelen assistenten fikk se er tvetydig på om opt-out virker på gratisplanen.

## A. Gratisnivå
| Påstand | Kilde | Dato | Tillit | Klasse |
|---|---|---|---|---|
| Free mode: «API access is enabled by default with no credit card required. Usage and rate limits apply.» Ingen tall | https://docs.mistral.ai/getting-started/quickstarts/studio/activate-and-generate-api-key | ingen dato | høy | limits |
| «Free mode lar deg lage API-nøkler og bruke inkludert månedlig bruk innenfor grensene på Limits-siden.» Grenser vises i Admin Panel > API > Limits | https://docs.mistral.ai/admin/billing-usage/usage-limits | ingen dato | høy | limits |
| Free mode beskrives som «limited limits for testing and prototyping». Ingen RPS-, TPM- eller tokens/mnd-tall. Grenser på admin.mistral.ai/plateforme/limits | https://help.mistral.ai/en/articles/698531-why-am-i-hitting-api-rate-limits-and-how-do-i-increase-them | 12.08.2026 | høy | limits |
| Tre grensetyper (forespørsler/sek, tokens/min, tokens/mnd). Brudd gir 429. Per organisasjon. Pay-as-you-go gir Tier 1+; Tier 2 over $20 fakturert totalt, Tier 3 over $100, Tier 4 over $500. Forhåndsbetalt kreditt øker ikke grensene. (Fra søkesammendrag av samme sider) | hjelpeartikkel + usage-limits | | medium | limits |
| Ja, noen grenser er bare synlige i konsollen. Primærsidene publiserer ingen tall | | | høy | limits |
| **Uverifisert, kun aggregatorer:** ca. 1 forespørsel/s, 500k tokens/min, 1 mrd tokens/mnd per modell. Tallene stemmer med hverandre, trolig én oppstrøms kilde, telles som én lavtillitskilde | pricepertoken.com/endpoints/mistral/free, freellm.net/providers/mistral-ai (snutter) | | lav | limits |
| Telefonverifisering rapporteres av tredjeparts søkesammendrag. Ingen Mistral-side bekrefter | | | lav | |
| Modeller på Free mode: Mistral publiserer ingen liste. Eneste modell nevnt i quickstart er mistral-small-latest | quickstart | | medium | |

## B. Vilkår og data
- Free mode under Mistral Studio: «vi kan bruke dine data (input og output) til å trene våre KI-modeller» og «du har rett til å velge deg ut av dette programmet når som helst». Siden lenker til en egen artikkel «Can I opt out of my input or output data being used for training?» som ikke ble lest. https://help.mistral.ai/en/articles/347617-do-you-use-my-user-data-to-train-your-models. «Oppdatert for over en uke siden», ingen absolutt dato. Høy på ordlyd, medium på hvordan opt-out virker.
- Pay-as-you-go: «kunder beholder full kontroll over denne behandlingen og har rett til å velge seg ut når som helst». Medium.
- Forbrukerprissiden har en «Model training»-rad merket «Opt-out» tre ganger. Planmapping uklar, og siden gjelder forbrukerprodukter, ikke API. https://mistral.ai/pricing. Lav.
- EU-hosting, landsbegrensninger og aldersgrense: ikke funnet. JS-SDK-et har `server = global | eu | us`, som antyder regionvalg. https://github.com/mistralai/client-ts. Lav.

## C. Endringshistorikk siste 12 mnd
- Ingen endringer i gratisnivå, Experiment eller rategrenser i changelog siste 12 mnd. https://docs.mistral.ai/resources/changelogs (ingen sidedato, oppsummeringsuttrekk). Medium.
- 27.01.2026: «Devstral 2.0 moves to paid API access» (modellnivå, ikke gratisnivåpolicy).
- Utgivelser: Ministral 3 (3B/8B/14B) 02.12.2025; Mistral Small 4 (mistral-small-2603) 16.03.2026, 256k kontekst; Mistral Medium 3.5 28.04.2026; Mistral Large 4 06.10.2026.
- Avviklinger i changelog: OCR 4.0, Leanstral 1.5, Z.ai GLM 5.2. Ingen små eller mellomstore chatmodeller.
- Søkesnutter om eldre modeller: Mistral Small 3.2 avviklet 30.04.2026, Devstral 2 22.05.2026, Pixtral Large 27.02.2026 (lav-medium). Konklusjon: unngå festede gamle modell-ID-er; bruk `-latest` eller Small 4.

## D. Strukturert output
- «Custom» structured output (gi JSON-schema; dokumentasjonen kaller det mer pålitelig) og «JSON mode» (`response_format = {"type":"json_object"}`). JSON mode krever eksplisitt instruks i prompten om å svare med JSON. https://docs.mistral.ai/capabilities/structured_output/json_mode og /custom. Høy.
- Custom-siden viser bare Python-eksempel: `client.chat.parse(model="ministral-8b-latest", response_format=<Pydantic-klasse>)`. Nevner Zod og JSON Schema som alternativer; SDK-et legger inn en setning i systemprompten om skjemaet. Høy.
- **Ikke bekreftet fra Mistral-sider:** rå feltnavn `type:"json_schema"`, `json_schema{name, schema, strict}` og enum-støtte. En GitHub-issue (pydantic-ai #4762) hevder Mistral aksepterer json_schema med strict:true. Tredjepart, lav.

## E. SDK
- Pakke `@mistralai/mistralai`. Kun ESM. Støtter Node, konfigurerbare retries, `server` global/eu/us. chat.complete-eksempel med `responseFormat` finnes. https://github.com/mistralai/client-ts. Høy.
- npm «latest» 3.4.0. Ingen publiseringsdato. En temp-sti antyder ca. 2026-10-28 (kun slutning). Lav på dato.
- Latens: ikke funnet fra primærkilde.

## F. Norsk
- «Listene under viser språk med sterk forventet ytelse.» Norsk står i den europeiske gruppen for språkmodeller (og OCR). Ingen modellversjoner nevnt. https://docs.mistral.ai/resources/languages. Ingen dato. Medium.
- Ingen uavhengig norsk benchmark funnet.

## Ledetråder
- Logg inn og ta skjermbilde av admin.mistral.ai/plateforme/limits (eneste autoritative kilde for grenser og gratismodeller).
- Les hjelpeartikkelen «Can I opt out…» for å bekrefte at opt-out er mulig på Free mode.
- API-referansen for chat completions (`response_format`) og client-ts docs/sdks/chat/README.md for `jsonSchema` i TypeScript.
- Mistrals vilkår, personvernerklæring og DPA for EU-hosting og aldersgrense.
- NorwAI, ScandEval/EuroEval for Mistral Small 4 og Ministral.
- GitHub releases for SDK-dato.

## Ikke funnet
Eksakte grenser på primærside; telefonverifisering; modelliste for Free mode; EU-behandlingssted, land- og aldersbegrensninger; rå json_schema-parametre og enum-støtte; latenstall; norske benchmarks. Både docs.mistral.ai/deployment/laplateforme/tier og /resources/changelog ga 404 (gjeldende changelog er /resources/changelogs).
