# Digest: tredjeparter og praksis (D3), runde 1, assistent 3

Tilgangsdato for alle kilder: 2026-11-06. Budsjettet ble brukt opp: 15 kall, 7 kilder lest i fulltekst og 4 søk med bare sammendrag.

## Funn

### 1. KI-leverandører (gratisnivå)

**Google Gemini API**
- På «Unpaid Services» bruker Google innhold og svar til å «provide, improve, and develop» produkter og maskinlæringsteknologi. Kilde: https://aistudio.google.com/docs/terms | Google | 2026-03 («Effective March 23, 2026») | high | vendor-policy
- Menneskelige kontrollører kan lese, annotere og behandle input og output på gratisnivået. Dataene kobles fra konto, API-nøkkel og prosjekt. Kilde: samme | high
- «Do not submit sensitive, confidential, or personal information to the Unpaid Services». Kilde: samme | high
- **«You may use only Paid Services when making API Clients available to users in the European Economic Area»** (gjelder også Storbritannia og Sveits). I disse landene gjelder vilkårene for betalt nivå også for gratiskvote. Kilde: samme | high
- Ingen lagringstid er oppgitt for gratisnivået, unntatt Grounding with Google Search, som lagrer i 30 dager. Kilde: samme | high
- På betalt nivå trenes det ikke på dataene, og de logges «for a limited period of time» for å oppdage misbruk. Behandlingen følger Googles Data Processing Addendum, og data kan mellomlagres i alle land der Google har anlegg. Kilde: samme | high
- Bare én kilde. Kravet om to kilder for leverandørpolicy er ikke oppfylt.

**Groq**
- Groq lagrer som standard ikke inferensdata. Ved feilsøking eller misbruk kan data logges i opptil 30 dager. Kilde: https://console.groq.com/docs/your-data | Groq | ukjent | medium | vendor-policy
- Zero Data Retention kan slås på under «Data Controls». Kilde: samme | medium
- «All customer data is retained in Google Cloud Platform (GCP) buckets located in the United States». Overføring skjer med SCC. Kilde: samme | medium
- Siden sier ingenting om trening, DPA eller forskjell mellom gratis og betalt nivå. Kilde: samme | low

**Mistral (La Plateforme)**
- I Studio Free mode kan input og output brukes til trening, med mulighet for reservasjon (opt-out). Siden omtaler Studio og Vibe, ikke La Plateforme eksplisitt. Kilde: https://help.mistral.ai/en/articles/347617-do-you-use-my-user-data-to-train-your-artificial-intelligence-models | Mistral AI | ukjent | medium | vendor-policy
- Ifølge DPA-en kan Mistral trene på personopplysninger som behandlingsansvarlig hvis kunden ikke har reservert seg. Tilbakemeldinger brukes alltid til trening. Misbruksovervåking regnes som Mistrals egen behandling, med mindre Zero Data Retention er slått på. Kilde: https://legal.mistral.ai/terms/data-processing-addendum | Mistral AI | 2026-07 | high | vendor-policy
- DPA-en oppgir ikke hvor data lagres. Overføring skjer med adekvansbeslutning eller SCC. Den sier ikke om gratisplanen «Experiment» er omfattet. Kilde: samme | medium

**Cloudflare Workers AI**
- «Cloudflare does not use Customer Content processed by Workers AI to train AI models». Kilde: https://developers.cloudflare.com/workers-ai/platform/privacy/ | Cloudflare | 2026-10 | high | vendor-policy
- Input og output lagres ikke etter vanlig inferens, unntatt i funksjoner med lagring (AI Gateway-logging, R2 og batch). Kilde: samme | high
- Siden oppgir ikke hvor data behandles. Det finnes en kunde-DPA, men den er ikke lest. Kilde: samme | medium

### 2. Overføring til tredjeland (DPF)
- Tribunalet avviste Latombe (T-553/23) 2025-09-03. Saken er anket til EU-domstolen (C-703/25 P) 2025-10-31. Kilde: https://www.wilmerhale.com/en/insights/blogs/wilmerhale-privacy-and-cybersecurity-law/20251201-european-court-of-justice-to-review-challenge-to-eu-us-data-privacy-framework | WilmerHale | 2025-12 | medium | enforcement
- Microsoft har gått inn i ankesaken på Kommisjonens side. Ingen dom og ikke noe forslag fra generaladvokaten er funnet. Det er tolket som at DPF gjelder, men det er ikke verifisert mot curia. Kilde: https://ieu-monitoring.com/editorial/microsoft-backs-eu-commission-in-eu-court-case-on-transatlantic-data-flows-and-privacy/1244467/ | iEU Monitoring | 2026-06 | low | enforcement
- Cloudflare, Inc. er aktiv i DPF, med neste sertifisering 2027-09-15. Kilde: https://www.dataprivacyframework.gov/participant/5666 | U.S. Department of Commerce | ukjent | high | regulatory
- Cloudflares personvernerklæring bekrefter DPF. Kilde: https://www.cloudflare.com/privacypolicy/ | Cloudflare | ukjent | high | vendor-policy
- DPF for Google og Groq er ikke bekreftet. Mistral er fransk, så DPF gjelder ikke selskapet.

### 3. Supabase
- Supabase har 17 AWS-regioner, og Postgres, Auth og Storage blir i valgt region. Den generelle regionen «Europe» kan havne i London eller Zürich, så man må velge en bestemt region (for eksempel Frankfurt eller Stockholm). Kilde: https://supabase.com/regions | Supabase | ukjent | medium | vendor-policy
- Supabase har en DPA. Konto- og fakturadata, telemetri og logger kan behandles utenfor regionen, og support er globalt fordelt. Kilde: https://supabase.com/legal/dpa og https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq | Supabase | ukjent | medium | vendor-policy
- Listen over underleverandører datert 2026-10-12 består for det meste av amerikanske selskaper (AWS, Cloudflare, Google, Vercel, OpenAI, Sentry). Kilde: https://supabase.com/legal/subprocessor-list/October-12-2026.pdf | Supabase | 2026-10 | medium (bare sett i søkeresultat) | vendor-policy
- Ved lokal kjøring ligger ingen data hos Supabase. At DPA og underleverandører da ikke gjelder, er en ubekreftet tolkning uten kilde.

### 4. Praksis hos lignende tjenester
- FixMyStreet (mySociety) sender rapporter og kontaktopplysninger videre til ansvarlig kommune. Pro-kommuner behandler data etter egne retningslinjer. Kilde: https://www.fixmystreet.com/privacy | mySociety | ukjent | medium | practice
- FixMyStreet sletter ikke rapporter, bortsett fra i spesielle tilfeller. Ber noen om sletting, blir rapporten vanligvis anonymisert, og brukeren kan velge «Hide your name». Kilde: samme | medium
- Personopplysninger slettes etter to års inaktivitet, og supporthenvendelser lagres i to år. Kilde: samme | medium
- Personvernsiden sier ingenting om bilder (moderering, EXIF eller sladding). Kilde: samme | medium
- FixMyStreet fjerner EXIF fra opplastede bilder (#2326, #2134), med begrunnelsen at EXIF kan avsløre telefonmodell og identifisere anonyme innsendere. Gjeldende kode er ikke sjekket. Kilde: https://github.com/mysociety/fixmystreet/issues/2134 og https://github.com/mysociety/fixmystreet/releases | mySociety | ukjent | medium | practice
- Fiks Gata: ingen kilde funnet. fiksgatami.no/personvern og /faq ga 404.

## Spor verdt å følge
- Gemini-vilkårene om EØS utelukker trolig gratisnivået når appen er tilgjengelig for brukere i EØS.
- Siden fritekst kan inneholde personopplysninger, trekker det mot Cloudflare (ingen trening, ingen lagring, DPF), eller Mistral med reservasjon og Zero Data Retention.
- curia C-703/25 P: sjekk om det finnes et forslag fra generaladvokaten eller en dom.
- dataprivacyframework.gov: slå opp Google LLC og Groq.
- Cloudflare-DPA-en: hvor data behandles, og om gratisplanen er omfattet.
- trust.mistral.ai/subprocessors.
- FixMyStreet-koden: strip og sladding av bilder.
- Fiks Gata: rotsiden, NUUG og GitHub-forken.

## Lette etter, fant ikke
- Fiks Gatas personvernerklæring, behandlingsansvar, bildehåndtering og lagringstid.
- Sladding av ansikter og bilskilt hos FixMyStreet.
- Hvor lenge Gemini lagrer data på gratisnivå, og antall dager på betalt nivå.
- Om Groq trener på data og har DPA.
- Hvor Mistral behandler data.
- DPF for Google og Groq.
- Kilde på at Supabase-DPA-en ikke gjelder ved lokal kjøring.
- Primærkilde fra curia om C-703/25 P.
