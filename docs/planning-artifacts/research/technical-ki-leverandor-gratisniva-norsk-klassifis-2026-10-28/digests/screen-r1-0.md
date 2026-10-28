# Kandidatscreening, runde 1 (lead, bred søkerunde)

Kilde-kvalitet: kun sekundærkilder (aggregatorer/bloggsammenligninger). Alle tall her er LEDETRÅDER, ikke funn. De må verifiseres mot leverandørens egne sider i runde 2. Søkedato: 2026-10-28.

## Felt som ble identifisert

| Kandidat | Gratisnivå (rapportert, uverifisert) | Foreløpig status |
|---|---|---|
| Google Gemini API | Gratis uten fakturering; rapporterte kutt i 2025-26 (5 RPM / 100 RPD for Flash, Pro betalt) ; innhold kan brukes til å forbedre Googles produkter på gratisnivå | Finalist |
| Mistral (La Plateforme, "Free mode"/Experiment) | Gratis uten kort (evt. telefonverifisering); ~1 mrd tokens/mnd rapportert, ~1 req/s/modell; hjelpesenter sier forespørsler på Experiment kan brukes til trening; uenighet om opt-out | Finalist |
| Groq | Gratis uten kort; ca. 30 RPM, 1 000-14 400 RPD avhengig av modell (gpt-oss, llama) | Finalist |
| Cloudflare Workers AI | 10 000 Neurons/dag gratis, nullstilles 00:00 UTC | Finalist |
| OpenRouter (`:free`-modeller) | 20 RPM og 50 RPD (1 000 RPD etter $10 kreditt); gratismodellene varierer | Finalist (aggregator over modeller) |

## Kuttet eller ikke finalist

| Kandidat | Grunn |
|---|---|
| Cerebras | Kun engangs $5 prøvekreditt som utløper på 30 dager (bryter "gratis i hele kursperioden") |
| Cohere | Trial-nøkler 1 000 kall/mnd, ikke ment for produksjon; vilkår må sjekkes. Reserve |
| Vercel AI Gateway | $5 kreditt per måned, ikke ekte gratisnivå |
| OpenAI | Kildene er uenige om gratis API-nivå; ikke bekreftet. Reserve, verifiseres i runde 2 |
| Z.AI GLM Flash | Gratis modeller, men uavklart norsk kvalitet og datavilkår. Reserve |
| Ollama / lokal modell | Ikke en API-leverandør; dekkes av mock-modus og egen maskin. Nevnes som reversibilitetsvalg |

## Kilder (sekundære, til screening)
- https://openrouter.ai/blog/tutorials/free-llm-apis-compared/ (OpenRouter, 2026)
- https://blogs.novita.ai/free-llm-api-comparison-2026/ (Novita, 2026)
- https://dev.to/tariqnasser/free-llm-api-tiers-in-october-2026-whats-left-and-how-i-chain-them-227l (DEV Community, okt 2026)
- https://agentdeals.dev/gemini-api-pricing-changes (april 2026)
- https://help.mistral.ai/en/articles/450104-how-can-i-try-the-api-for-free-with-the-experiment-plan (Mistral, primærkilde, innhold ikke lest i full tekst)
- https://community.groq.com/t/what-are-the-rate-limits-for-the-groq-api-for-the-free-and-dev-tier-plans/42 (Groq-forum)
- https://arxiv.org/pdf/2504.07749 (NorEval, ACL Findings 2025): sammenligner 19 åpne norske modeller, ikke kommersielle API-modeller

## Åpne ledetråder
- Mistral: motstridende påstander om trening på gratisdata og opt-out
- Gemini: gratisgrenser kuttet flere ganger; primærkilden viser ikke gjeldende tall
- Gratistjenester som krever geografisk tilgang (EU/EØS) må sjekkes
- Ingen uavhengig norsk benchmark funnet for de kommersielle API-modellene
