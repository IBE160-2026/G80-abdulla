# Norsk modellkvalitet, runde 2, assistent 1 (aff91949)

Tilgang 2026-10-28. 16 verktøykall. Hovedfunn: **ingen lesbare, daterte norske skårer for målmodellene ble funnet.** euroeval.com er JavaScript-rendret, og WebFetch ga bare sidetittelen. Spørsmål B og D er i praksis ubesvart av primærkilder. Bare 3 sider ble lest i dybden (NorEval abstract, Berget-innlegget, EuroEval GitHub README), pluss en garblet NorEval-PDF.

## A. Benchmarks og leaderboards

| Påstand | Kilde | Utgiver | Dato | Tillit |
|---|---|---|---|---|
| NorEval: 24 norske datasett (5 nye), bokmål og nynorsk, 9 oppgavekategorier, 19 åpne modeller, menneskelige baselines, i LM Evaluation Harness | https://arxiv.org/abs/2504.07749 | arXiv / ACL Findings 2025 | v1 10.04.2025, v2 05.06.2025 | medium-høy |
| NorEval er ca. 16 måneder gammel, altså historie for dagens modeller. Modellene (fra lenkeannoteringer i PDF-en, delvis lest) er Llama 2/3/3.3, Mistral 7B/Nemo og norske/nordiske modeller (NorMistral, NorBloom, Viking, GPT-SW3). Ingen Gemini, Qwen eller API-modeller sett | samme | samme | samme | lav-medium (PDF-tekst garblet) |
| EuroEval (tidl. ScandEval) er det levende leaderboardet som inkluderer norsk og tilsynelatende API-modeller. Siste oppdateringsdato og oppgaveliste kunne ikke leses | https://euroeval.com/leaderboards ; https://github.com/EuroEval/EuroEval | EuroEval | repo-siden viser ingen dato | medium |
| Ikke funnet: noe annet nordisk LLM-leaderboard enn EuroEval/NorEval; ingen norsk Global-MMLU-skår | | | | |

## B. Nåværende resultater (sep-okt 2026)

| Påstand | Kilde | Utgiver | Dato | Tillit |
|---|---|---|---|---|
| Gemma 4 31B fikk 1,33 på EuroEval norsk, #3 samlet og #1 blant åpne vekter. Bare lukkede API-modeller (Gemini Pro Preview og Gemini Flash-varianter) rangerte over. Innlegget sier ikke hvilke som rangerer over på norsk. Skalaen (trolig rangindeks, lavere er bedre) er ikke bekreftet | https://berget.ai/en/blog/gemma-4-general-availability | Berget.ai (leverandørblogg, andrehånds, ikke primærkilde) | publisert 05.05.2026; evalueringsdato ikke oppgitt | lav-medium |
| Kun søkesnutter, ikke lest: Gemini 3.7 Flash rangeres først på EuroEval **nederlandsk** per sep 2026 (datanorth.ai). Ikke norsk | | | | lav |
| Ingen skårer funnet for Mistral Small/Medium, Llama 3.x/4, gpt-oss eller Qwen3 på norsk. Flere generelle leaderboard-nettsteder nevner modellnavn som ikke lot seg verifisere, og ble forkastet | | | | |

## C. Klassifisering og oppsummering

- NorSumm (norsk nyhetsoppsummering, 33 testartikler, 3 menneskelige sammendrag hver, bokmål og nynorsk, ROUGE-L og BERTScore pluss manuell vurdering) er del av NorEval. https://aclanthology.org/2025.nodalida-1.73 (NoDaLiDa 2025, Touileb m.fl., sett via søkesnutt). Tillit medium.
- Event-basert oppsummeringsartikkel (https://arxiv.org/pdf/2507.01160, 2025) tester åpne norske/nordiske modeller på NorSumm. Ingen Gemini, Mistral Small eller Qwen3 etter snutten. Historie. Tillit lav.
- NorEval-sentiment (NoReC) er det nærmeste vi kommer tekstklassifisering. Utledet fra siteringsnøkler, uverifisert. Ingen norsk emneklassifiseringsbenchmark funnet, og ingen sammenligning av API-modellene i kandidatlista.

## D. Bokmål/nynorsk/dansk-sammenblanding

- Ingen evidens funnet for målt dansk- eller svensk-interferens i LLM-utdata for disse modellfamiliene. Dette er en uverifisert antagelse og en reell risiko.
- NorEval dekker begge målformer og sier nynorsk var underrepresentert. Ingen skår per målform rapportert på abstrakt-siden.
- SLIDE (språkidentifisering på setningsnivå for dansk, bokmål, nynorsk, svensk) sett via snutt. Kan brukes til å flagge dansk-lente utdata, men ingen bruk på LLM-utdata bekreftet.

## Ledetråder
1. Åpne euroeval.com/leaderboards/Monolingual/norwegian i ekte nettleser. Les «Last Updated», sorteringsmetrikk og rader for Gemini Flash/Flash-Lite, Mistral Small/Medium, gpt-oss, Qwen3 og Llama. Sjekk om NoReC-sentiment og NorSumm inngår.
2. EuroEvals resultatfil på GitHub (JSONL; sti ikke funnet) kan scriptes uten JS-siden.
3. NorEval-repoet (ltgoslo/noreval) og arXiv HTML-versjonen av 2504.07749 for tabeller per oppgave.
4. Nasjonalbiblioteket / LTG-Oslo for nyere evalueringer.
5. **Egen test:** merk 50-100 virkelige rapporter og kjør en språk-ID-sjekk (bokmål mot dansk) på genererte sammendrag. Praktisk eneste måte å avgjøre D.

## Ikke funnet
- Lesbar, datert norsk skår for målmodellfamiliene
- Uavhengig klassifiserings- eller emneklassifiseringsevaluering på norsk
- Publisert måling av dansk/nynorsk-blanding i LLM-utdata
- Nordisk leaderboard utover EuroEval/NorEval
