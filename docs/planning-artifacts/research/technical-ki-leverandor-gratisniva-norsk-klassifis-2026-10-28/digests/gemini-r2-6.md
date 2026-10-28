# Google Gemini API, runde 2, assistent 6 (ab37c2d1)

Tilgang 2026-10-28. 16 kall, ca. 11 distinkte kilder.

## A. Gratisnivå
| Påstand | Kilde | Dato | Tillit | Klasse |
|---|---|---|---|---|
| Gratisnivå finnes; nye kontoer starter der; vilkår «aktivt prosjekt eller gratis prøve»; betalte nivåer krever koblet faktureringskonto og forhåndsbetaling på minst $5 | https://ai.google.dev/gemini-api/docs/billing | oppd. 28.09.2026 | høy | pricing |
| Faktureringssiden oppgir IKKE om gratisnivået krever kredittkort. Betalingsmetode dukker opp først i oppgraderingssteget. «AI Studio-bruk forblir gratis med mindre brukere kobler en betalt API-nøkkel» | samme | 28.09.2026 | medium (fravær av evidens) | terms |
| Gratis tekstmodeller (pris «Free of charge»): Gemini 3.8 Flash, 3.6 Flash, 3.5 Flash-Lite, 3.1 Flash-Lite, 3 Flash Preview, 2.5 Pro, 2.5 Flash, 2.5 Flash-Lite, Gemma 4, pluss flere lyd/TTS/embedding/robotmodeller. Gemini 4 Argon og 3.1 Pro Preview er «Not available» på gratis | https://ai.google.dev/gemini-api/docs/pricing | oppd. 27.10.2026 | høy | pricing |
| EKSAKTE RPM/RPD/TPM er IKKE publisert i dokumentasjonen. Rate-limits-siden (oppd. 26.10.2026) viser ingen tall per modell og peker til AI Studios rate-limit-side (krever innlogging) | https://ai.google.dev/gemini-api/docs/rate-limits | 26.10.2026 | høy | limits |
| Tredjepartsblogger gir motstridende gratistall (f.eks. Flash-Lite 15 RPM mot 30 RPM/1 000 RPD). Ikke belagt her, skal ignoreres; les tallene fra eget AI Studio-prosjekt | søkeresultater (apidog, yingtu, laozhang) | | lav | limits |
| Regioner: siden over tilgjengelige regioner lister Norge, Island, Liechtenstein, UK og Sveits uten skille mellom gratis og betalt | https://ai.google.dev/gemini-api/docs/available-regions | 22.10.2026 | høy | other |
| FAQ sier gratis og betalt er tilgjengelig «i mange regioner»; ingen EØS/UK/CH-forbud mot gratisnivå for utviklere. Prisfotnote: AI Studio er gratis «i alle tilgjengelige regioner» | billing + pricing | 28.09 / 27.10.2026 | høy | terms |
| **MEN** vilkårene sier: «You may use only Paid Services when making API Clients available to users in the European Economic Area». Siden sier også at Paid Services-datavilkårene gjelder alle tjenester for EØS/UK/CH-brukere. Uklart om dette stenger en utvikler i Norge på gratisnivå som bygger en demo. Hvis demo-sluttbrukerne er i EØS bør gratisnivået anses som ikke-kompatibelt | https://ai.google.dev/gemini-api/terms | gjeldende fra 23.03.2026, oppd. 28.04.2026 | medium på tolkning, høy på ordlyd | terms |

## B. Vilkår og databruk
- Gratisnivådata brukes til å forbedre produkter. Prissiden viser «Used to improve our products» = Ja på gratis og Nei på betalt for 3.5 Flash-Lite, 3.1 Flash-Lite, 2.5 Flash-Lite og de andre gratismodellene. https://ai.google.dev/gemini-api/docs/pricing (27.10.2026). Høy.
- Vilkår, Unpaid Services: «Google bruker innholdet du sender inn og genererte svar til å tilby, forbedre og utvikle» Google-produkter og «maskinlæringsteknologier»; «menneskelige vurderere kan lese, annotere og behandle API-input og -output» (koblet fra konto/API-nøkkel/prosjekt); «Ikke send sensitiv, konfidensiell eller personlig informasjon til Unpaid Services». https://ai.google.dev/gemini-api/terms (28.04.2026). Høy. (Hentet via oppsummeringsverktøy; sitatene bør verifiseres på siden.)
- Opt-out: ingen beskrevet for ubetalte tjenester. Eneste vei er å slå på fakturering (Paid Services). Medium.
- Alder: «Du må være 18 år eller eldre for å bruke API-ene». Høy.
- Databehandlingssted: ikke funnet.

## C. Endringshistorikk
- Changelog (oppd. 28.10.2026) har ingen oppføring om kutt i gratisgrenser siste 12 mnd. Mars 2026 har faktureringsendringer (prosjektforbrukstak 12.03, nye bruksnivåer 16.03, forhånds-/etterbetaling 23.03). https://ai.google.dev/gemini-api/docs/changelog. Medium (grenser logges ikke der, så stille endringer er mulig).
- 18.09.2026: tilgang til 2.5-modellene (Pro/Flash/Flash-Lite) er «begrenset til brukere som aktivt har brukt dem tidligere», ikke avviklet, levert «inntil videre». Nytt prosjekt får kanskje ikke 2.5. Høy.
- Nedleggelser siste 12 mnd: gemini-2.5-flash-lite-preview-09-2025 (31.03.2026), gemini-3.1-flash-lite-preview (25.05.2026), gemini-2.0-flash og -flash-lite (01.06.2026), gemini-3-pro-preview (09.03.2026). 08.10.2026: gemini-3.7-flash og 3.5-flash avviklet (rutes til 3.8 og 3.6 Flash). Preview-modeller trekkes raskt; bruk GA-modeller. Høy.
- Avviklingssiden: gemini-3.1-flash-lite (GA) nedleggelse 07.05.2027, erstatning 3.5 Flash-Lite. gemini-3-flash-preview: ingen dato. 2.5-modeller: ingen dato. Google anbefaler 3.5 Flash-Lite eller 3.8 Flash for nye prosjekter. https://ai.google.dev/gemini-api/docs/deprecations (22.10.2026). Høy.

## D. Strukturert output
- Støttet, med enum for string, number og integer («fast mengde… for klassifiseringsoppgaver»). Eksempel `{type:"string", enum:[...]}`. Dagens side dokumenterer det via `response_format` (type, mime_type "application/json", schema-felt), med JS-eksempler med vanlig JSON Schema og Zod. Viser ikke de eldre parameterne responseMimeType/responseSchema/responseJsonSchema, så sjekk hvilken API-flate SDK-et eksponerer. https://ai.google.dev/gemini-api/docs/structured-output (21.10.2026). Høy.
- Begrensning: svært store skjemaer (bl.a. «enum med mange verdier») kan gi 400 INVALID_ARGUMENT. Fem kategorier er greit. Høy.
- gemini-3.5-flash-lite-siden: «Structured outputs: Supported», status Stable. https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite (22.10.2026). Høy.

## E. SDK
- Pakke `@google/genai` (repo googleapis/js-genai). Siste v2.31.0, utgitt 23.10.2026. Tidligere: 2.30.0 14.10, 2.28.0 07.10, 2.27.0 02.10 (omtrent ukentlige utgivelser). https://github.com/googleapis/js-genai/releases. Høy.
- README: Node.js 20+ kreves, 22+ fra SDK 3.0.0. Server (Node) er anbefalt miljø, nøkler skal ikke i klientkode, noe som passer en Next.js-serverrute (ikke testet). `npm install @google/genai`. Høy.
- Latens: ingen tall på modellsiden («low-latency»); ingen primærkilde. Lav.
- npm-siden ga 403.

## F. Norsk
- Ingen evidens for tekstmodellene. Norsk (no, nb) er listet for Live API (99 språk), Gemini 3.5 Transcribe (nb-NO) og TTS. Det er ikke evidens for kvalitet i tekstklassifisering eller oppsummering. 3.5 Flash-Lite-siden lister ingen språk. Lav.
- (Fra norsk-assistenten, sekundær: Gemini-varianter rangeres høyest av alle på EuroEval norsk ifølge et andrehånds leverandørinnlegg. Uverifisert, se norsk-kvalitet-r2-1.md.)

## Ledetråder
- Åpne AI Studios rate-limit-side innlogget for faktiske RPM/RPD/TPM for 3.5 Flash-Lite, 3.1 Flash-Lite og 3.8 Flash.
- Spør Google eller les vilkårene nøye om gratisbruk for en demo med EØS-brukere er tillatt.
- Test om et nytt prosjekt fortsatt kan bruke 2.5-modeller.
- Kjør egen norsk testsett (f.eks. 50 rapporter) på 3.5 Flash-Lite mot 3.8 Flash.
- Sjekk om `@google/genai` v2.x godtar responseMimeType/responseJsonSchema eller bare nye response_format.
- Loggingspolicy-siden (ai.google.dev/gemini-api/docs/logs-policy) ble ikke lest.

## Ikke funnet
Offisielle numeriske gratisgrenser; kortkrav; databehandlingsregion; opt-out for gratisnivå; uavhengige norske tekstbenchmarks; latenstall; npm-metadata.
