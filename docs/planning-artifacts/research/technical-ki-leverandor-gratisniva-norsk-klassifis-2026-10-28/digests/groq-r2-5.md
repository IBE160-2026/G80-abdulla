# Groq, runde 2, assistent 5 (acce3af7)

Tilgang 2026-10-28. 18 kall, ca. 12 kilder lest.

**Viktigste forbehold:** tabellen på rate-limits-siden ble hentet uten planetikett. Notatet på siden sier at den viser Developer-planens grunngrenser, og Free-fanen ble ikke fanget. **Free-plan-tall er derfor IKKE verifisert.**

## A. Gratisnivå
| Påstand | Kilde | Dato | Tillit | Klasse |
|---|---|---|---|---|
| For openai/gpt-oss-120b, gpt-oss-20b og qwen/qwen3.8-27b: 30 RPM, 1K RPD, 8K TPM, 200K TPD. gpt-oss-safeguard-20b: 3 RPM, 1K RPD, 2K TPM, 200K TPD. Notatet sier dette er Developer-plan grunngrenser, så Free kan være lavere | https://console.groq.com/docs/rate-limits | ingen dato | medium | limits |
| Siden har egne faner «Free Plan Limits» og «Developer Plan Limits». Eksakte organisasjonsgrenser vises bare på console.groq.com/settings/limits (krever innlogging) | samme | | medium | limits |
| Gratisplan uten kredittkort finnes; kort trengs bare for å oppgradere til Developer. Fra WebSearch-sammendrag, ikke lest side. Community-trådene lenket til videresendte til groq.com | https://community.groq.com/t/is-there-a-free-tier-and-what-are-its-limits/790 (utilgjengelig) | ukjent | lav | pricing |
| groq.com/pricing ga ingen brukbare plan- eller prisdata (trolig JavaScript-rendret) | https://groq.com/pricing | | n/a | pricing |
| Modellsiden, produksjon: llama-3.1-8b-instant og llama-3.3-70b-versatile (begge merket Enterprise-nivå), openai/gpt-oss-120b, openai/gpt-oss-20b, to whisper-modeller. Preview: qwen/qwen3.8-27b, gpt-oss-safeguard-20b, meta-models/muse-spark-open (Enterprise), minimaxai/minimax-m2.7 (Enterprise), Orpheus TTS, prompt-guard | https://console.groq.com/docs/models | ingen dato | høy | other |
| Preview-modeller er «kun ment for evaluering og ikke for produksjon». qwen3.8-27b er Preview; gpt-oss-120b og -20b er Production | samme | | høy | other |

## B. Vilkår og data
- «Som standard beholder ikke Groq kundedata for inferensforespørsler.» Metadata inneholder ikke input/output. https://console.groq.com/docs/your-data. Høy.
- Input/output kan logges midlertidig for feilsøking eller misbruk, «beholdt i opptil 30 dager med mindre loven krever lenger». Høy.
- «All kundedata lagres i GCP-bøtter i USA.» Siden sier ikke hvor inferens kjøres. Høy.
- Services Agreement §4.2: «Groq har ikke lov til å bruke Inputs eller Outputs til trening eller finjustering av AI-modeller… med mindre kunden uttrykkelig gir tillatelse». Avtalen er «Last Modified: June 22, 2026». https://console.groq.com/docs/legal/services-agreement. Høy.
- Samme avtale: 18 år eller eldre. Restriksjoner knyttet bare til eksportkontrollov (US Commerce, OFAC, ITAR), ingen landsliste. Gratis skytjenester dekkes av §5.1; Groqs ansvar begrenset til $5 000 (§14.2), ingen skadesløsholdelse (§15.3c). Høy.
- Personvernerklæring: gjeldende fra 12.11.2025, minimumsalder 18. Utelater «Customer Data» via skytjenestene (GroqCloud/API), som dekkes av Services Agreement og DPA. Tillater overføring ut av brukerens land. https://groq.com/privacy-policy. Høy.
- Ikke verifisert: om gratisplanen i praksis dekkes av §4.2-treningsforbudet, og om personopplysninger i prompter krever DPA. Inferensregioner ukjent.

## C. Endringshistorikk
- Avviklingssiden (ingen dato; nyeste oppføring varslet 24.08.2026). Alle relevante nedleggelser er allerede passert:
  - qwen/qwen3-32b og llama-4-scout: 17.07.2026
  - llama-3.1-8b-instant (erstatning gpt-oss-20b) og llama-3.3-70b-versatile (erstatning gpt-oss-120b eller qwen3.6-27b): 16.08.2026
  - qwen/qwen3.6-27b (erstatning qwen3.8-27b): 14.09.2026
  - groq/compound og compound-mini: 21.09.2026
  - Tidligere: kimi-k2 (10.10.2025), llama-4-maverick (09.03.2026), kimi-k2-0905 (15.04.2026)
  https://console.groq.com/docs/deprecations. Høy.
- Siden sier at jul/aug/sep 2026-avviklingene «gjelder gratis- og developer-nivå». Enterprise-kontrakter er unntatt. Modellsiden lister fortsatt de to Llama-modellene som produksjon (Enterprise-nivå), noe som strider mot avviklingsdatoene. Ikke løst. Medium.
- Ingen nedleggelse planlagt for gpt-oss-120b/-20b. qwen3.8-27b er Preview og kan endres. Høy omsetning: ca. 8 chatmodeller avviklet/erstattet på 12 mnd.
- Changelog nevner ikke gratisnivået. https://console.groq.com/docs/changelog. Medium.

## D. Strukturert output
- `response_format: {type:"json_schema", json_schema:{name, strict, schema}}`. strict true = begrenset dekoding; false/utelatt = best-effort. https://console.groq.com/docs/structured-outputs. Høy.
- Modeller med strict true: openai/gpt-oss-20b, openai/gpt-oss-120b, qwen/qwen3.8-27b, meta-models/muse-spark-open. Høy.
- JSON Object Mode (`{type:"json_object"}`) gir gyldig JSON og krever JSON-instruks i prompten; skal virke med alle modeller. Høy.

## E. SDK
- OpenAI-kompatibel: base_url `https://api.groq.com/openai/v1`. Ikke støttet (400): logprobs, logit_bias, top_logprobs, messages[].name, n ≠ 1. temperature 0 blir 1e-8. https://console.groq.com/docs/openai. Høy.
- Offisielt TS-repo groq/groq-typescript (npm-pakke `groq-sdk` etter hukommelse; npm ga 403, navnet er uverifisert). Utgivelser: v1.6.0 26.08.2026, v1.5.0 31.07, v1.4.1 29.07. https://github.com/groq/groq-typescript/releases. Medium.
- Bruk fra serverrute er gjennomførbart via groq-sdk eller OpenAI-SDK med Groqs base-URL (slutning, ingen Next.js-spesifikk dokumentasjon lest).
- Latens (Artificial Analysis, uavhengig): første chunk 0,66 s og 470 tokens/s for gpt-oss-120b; 0,73 s og ca. 854 tokens/s for gpt-oss-20b. Gjelder resonnementsvariantene. Tid til første svartoken for gpt-oss-20b (high) er 3,07 s inkl. resonnering. https://artificialanalysis.ai/providers/groq, ca. 26.10.2026. Medium.

## F. Norsk
- Ingen norsk-spesifikk evidens for gpt-oss, Qwen3.8 eller Llama på Groq. En arXiv-evaluering (2508.12461) rapporterer at gpt-oss er svak på flerspråklige oppgaver, men bare kinesiske C-Eval-tall sett (120B 20 %, 20B 28 %); søkesnutt, ikke lest i fulltekst. Lav.
- NorEval (arXiv 2504.07749) viste bare norske spesialmodeller i tabellen (topp NorMistral-11B 54,4). Medium.

## Ledetråder
- Logg inn på console.groq.com/settings/limits for faktiske Free-tall og om qwen3.8-27b er med.
- Sjekk eksakt npm-pakkenavn og versjon.
- Røyktest på 20 norske eksempler (klassifisering + sammendrag) for gpt-oss-120b, gpt-oss-20b og qwen3.8-27b.
- Les Groqs DPA og «Terms of Use».
- Modellkort og NorEval-repoet for gpt-oss/Qwen-skårer.

## Ikke funnet
Free-plan-spesifikke grenser per modell og kortfri bekreftelse (bare søkesammendrag); inferensregioner; landsbegrensninger utover eksportkontroll; offisielle tokenpriser; norsk kvalitetstest for modeller på Groq.
