# OpenRouter (:free), runde 2, assistent 2 (a8a0658e)

Tilgang 2026-10-28. 14 kilder lest, 16 kall. De fleste openrouter.ai-sider har ingen dato. WebFetch oppsummerer via en liten modell, så ordlyd er parafrase med mindre den er sitert.

## A. Gratisnivå
| Påstand | Kilde | Dato | Tillit | Klasse |
|---|---|---|---|---|
| `:free`-modeller: 20 forespørsler/min uansett kjøpshistorikk. Dagstak 50 hvis under 10 kreditter kjøpt totalt, 1 000 hvis 10 eller mer | https://openrouter.ai/docs/api-reference/limits | ingen dato | høy | limits |
| Høyere dagsnivå starter «ett kreditt under tabellens terskel». Eksakt tall var en tom malplassholder på siden | samme | ingen dato | medium | limits |
| FAQ: gratismodeller «har lave grenser (50 forespørsler per dag totalt) og er vanligvis ikke egnet for produksjon» | https://openrouter.ai/docs/faq | ingen dato | høy | limits |
| Negativ saldo kan gi feil «også for gratismodeller». Uklart om mislykkede kall teller mot dagstaket | limits-siden | ingen dato | medium | limits |
| Kredittkortkrav: ikke nevnt på limits-siden, **uverifisert** | samme | | lav | terms |
| Samlingssiden viste 15 `:free`-modeller, dominert av NVIDIA (nemotron-3-*), poolside/laguna-*, thinkingmachines/inkling*, recursive/flint, cohere/north-mini-code, dots-studio, xingchen-agi, liquid/lfm-2.5-2.6b, pluss rerank- og sikkerhetsmodell. Mange er kode- eller eksperimentelle | https://openrouter.ai/collections/free-models | ingen dato | medium | other |
| Sekundære kilder (buldrr.com, aitoolsradar.org, gravity.fast, ikke lest direkte): kontinuerlig omsetning. 15 gratis tekstmodeller 14. okt 2026, 19 per 4. okt; noen modeller gikk til betalt i 2026 | søkeresultater | | lav | other |
| OpenRouter selv: «noen mindre populære modeller vil snart gå ut av gratisnivået» og «kan ikke garantere fremtiden» | https://openrouter.ai/blog/announcements/updates-to-our-free-tier-sustaining-accessible-ai-for-everyone/ | publ. 10.07.2025, oppd. 11.06.2026 | høy | other |

## B. Vilkår og data
- «Prompt og completion logges ikke som standard». Logging er opt-in mot 1 % rabatt. Høy. https://openrouter.ai/docs/faq
- Leverandører som logger, eller som OpenRouter ikke kan bekrefte policyen til, «rutes ikke til med mindre treningsbryteren er slått på i personverninnstillinger». Ingen treff gir feil. Høy. FAQ.
- Loggingssiden har «separate innstillinger for betalte og gratis modeller» for å tillate ruting til leverandører som kan trene på data. Det finnes «unntak». https://openrouter.ai/docs/guides/privacy/logging. Høy.
- Assistentens egen slutning: gratismodellers leverandører kan trene på prompter med mindre treningsbryteren for gratismodeller er av. Dette er den viktigste justeringen for prosjektet.
- Terms §6.1: «Noen modeller kan lagre eller trene på dine input». §16: ingen garanti for leverandørers databehandling. https://openrouter.ai/terms, sist oppdatert 31.08.2026. Høy.
- Alder minst 18 år (§2). Ingen landsliste, men §5.7: enkelte modeller er begrenset av brukerens lokasjon. Høy.
- EU-residens finnes via eu.openrouter.ai (EU/EØS, UK, Sveits). «Konto- og betalingsdata kan lagres i USA». Om EU-ruting virker for gratismodeller er uverifisert.

## C. Endringshistorikk
- Eneste primærevidens er blogginnlegget fra juli 2025 (to store leverandører ble betalt-only). Mer enn 12 mnd gammelt, men siden oppdatert juni 2026.
- Feilkoder: 429 «rate limited», 502/503 leverandør nede/overbelastet, Retry-After gis. https://openrouter.ai/docs/api-reference/errors. Ingen omtale av gratismodeller.
- Ingen velbelagte 429- eller avbruddsrapporter for gratismodeller funnet.

## D. Strukturert output
- `response_format {type:"json_schema", json_schema:{name, strict:true, schema}}`. https://openrouter.ai/docs/guides/features/structured-outputs. Høy.
- Støtte avgjøres «per endepunkt, ikke per modell», varierer og kan endre seg. Noen leverandører garanterer skjema, andre behandler det som hint. Filtrer med `supported_parameters=structured_outputs`; tving med `provider.require_parameters:true`. Det finnes en Response Healing-plugin (kun ikke-streaming).
- **Ikke verifisert** hvilke av de 15 gratismodellene som støtter structured_outputs.

## E. SDK og integrasjon
- npm `@openrouter/sdk`, latest 1.5.19 (repo OpenRouterTeam/typescript-sdk). Utgivelsesdato ikke hentet. Medium.
- Integrasjonssiden lister OpenAI SDK (TS/Python), Vercel AI SDK (Next.js), Effect AI, TanStack AI, Mastra. https://openrouter.ai/docs/guides/community/frameworks-and-integrations-overview. Høy.
- OpenAI-kompatibel baseURL (`https://openrouter.ai/api/v1`) ble ikke bekreftet fra en hentet side (uverifisert antagelse).
- Latens: oppstart «fra noen sekunder til noen minutter», og modellen kan returnere tomt innhold ved kaldstart (errors-siden). Gratis-spesifikk latens uverifisert.

## F. Norsk
- Ingen evidens for norsk kvalitet for noen av dagens `:free`-modeller. Søk ga bare NorEval (ACL Findings 2025): «de fleste LM presterer bedre på bokmål enn nynorsk». https://arxiv.org/abs/2504.07749

## Ledetråder
- Hent modellsidene for nemotron-3-ultra, inkling og laguna-s-2.1 (`:free`): supported_parameters, leverandører, personvern, gjennomstrømning.
- Test `openrouter/free`-ruteren på 20–30 norske eksempler.
- Les kontoens personverninnstillinger i UI for gratis-treningsbryteren.
- `npm view @openrouter/sdk time` for utgivelsesdato.

## Ikke funnet
Kredittkortkrav; om mislykkede kall teller; ZDR/data_collection for gratismodeller; daterte endringer siste 12 mnd; pålitelighetsklager fra gode kilder; latenstall; norsk kvalitet; structured_outputs-flagg for gratismodellene.
