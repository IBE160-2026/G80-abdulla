# Digest: tredjeparter og praksis (D3), runde 2, assistent 3

Tilgangsdato for alle kilder: 2026-11-06. Budsjettet ble brukt opp: 15 kall, 7 sider lest og 6 søk.

## Funn

### 1. DPF-status (C-703/25 P)
- Latombe anket til EU-domstolen 2025-10-31 (C-703/25 P). Kilde: https://www.wilmerhale.com/en/insights/blogs/wilmerhale-privacy-and-cybersecurity-law/20251201-european-court-of-justice-to-review-challenge-to-eu-us-data-privacy-framework | WilmerHale | 2025-12 | medium | enforcement
- Anførslene: Data Protection Review Court er ikke uavhengig, og DPF hindrer ikke masseinnsamling. Kilde: https://captaincompliance.com/education/latombe-pleas-in-eu-us-data-privacy-framework-appeal-published-in-eu-official-journal/ | Captain Compliance (aggregator) | ukjent | low | enforcement
- Microsoft støtter Kommisjonen i ankesaken, så saken verserte fortsatt i juni 2026. Kilde: https://ieu-monitoring.com/editorial/microsoft-backs-eu-commission-in-eu-court-case-on-transatlantic-data-flows-and-privacy/1244467/ | IEU Monitoring | 2026-06 | low (403) | enforcement
- Ingen kilde nevner høring, forslag fra generaladvokaten eller dom per 2026-11-06. Curia kunne ikke leses maskinelt. Kilde: https://infocuria.curia.europa.eu/tabs/redirect/juris/liste.jsf?num=C-703/25&language=en | EU-domstolen | – | low | enforcement
- Ingen ny periodisk vurdering fra Kommisjonen er funnet.

### 2. DPF-listen
- Google LLC er aktiv i EU–US DPF med UK Extension og Swiss-U.S.-ordningen. Neste resertifisering for Swiss-U.S. er 2027-09-13. Kilde: https://www.dataprivacyframework.gov/participant/5780 | U.S. Department of Commerce | – | medium (søkesammendrag) | regulatory
- Ingen DPF-oppføring er funnet for Groq, Inc. At den mangler i søket, beviser ikke at den mangler i listen. | low
- Groq overfører data med «approved contractual protections» eller med «third parties' Data Privacy Framework certifications, where applicable», og hevder ikke selv å være sertifisert. Kilde: https://groq.com/privacy-policy | Groq | 2025-11 | medium | vendor-policy

### 3. Cloudflare kunde-DPA
- DPA v6.4 gjelder fra 2026-04-03. Kilde: https://www.cloudflare.com/cloudflare-customer-dpa/ | Cloudflare | 2026-04 | high | vendor-policy
- DPA-en er en del av Enterprise-avtalen, Self-Serve-avtalen «or other written or electronic agreement». Free plan nevnes ikke uttrykkelig. Kilde: samme | high om ordlyden, low om at den dekker Free | vendor-policy
- «Services» er definert som alle skytjenester Cloudflare tilbyr, med API-er og SDK-er. Workers AI er ikke nevnt ved navn. Kilde: samme | medium
- Cloudflare er databehandler, og kunden er behandlingsansvarlig. Kilde: samme | high
- Data kan behandles utenfor EØS. Overføring skjer med SCC og «Cloudflare complies with the Data Privacy Framework». Kunden varsles hvis DPF faller bort, og da gjelder SCC. Kilde: samme | high
- Underleverandører står på cloudflare.com/gdpr/subprocessors. Endringer varsles 30 dager i forveien, med 10 dagers frist for å protestere. Kilde: samme | high

### 4. Mistral
- I Free mode «we may use your data (input and output) to train», og gratisbrukere kan melde seg ut. Siden gjelder Studio, og «Experiment» er ikke nevnt ved navn. Kilde: https://help.mistral.ai/en/articles/347617-do-you-use-my-user-data-to-train-your-artificial-intelligence-models | Mistral AI | ca. 2026-10 | medium | vendor-policy
- Trening på API-kall slås av med en egen bryter: Admin panel → Privacy → «Anonymous improvement data». Kilde: https://help.mistral.ai/en/articles/455207-can-i-opt-out-of-my-input-or-output-data-being-used-for-training | Mistral AI | ukjent | medium (søkesammendrag) | vendor-policy
- Reservasjon mot trening krever ikke ZDR. ZDR finnes bare på pay-as-you-go. Kilde: https://docs.mistral.ai/admin/monitor-comply/zero-data-retention | Mistral AI | ukjent | medium | vendor-policy
- Hvor Mistral behandler data, er ikke bekreftet.

### 5. Groq
- Personvernerklæringen gjelder ikke data Groq behandler som databehandler for GroqCloud og API-ene. Kilde: https://groq.com/privacy-policy | Groq | 2025-11 | high | vendor-policy
- Groq har en DPA på console.groq.com/docs/legal/customer-data-processing-addendum. Innholdet er ikke lest. Kilde: samme | high (at den finnes) | vendor-policy
- Groq «is located in the United States, and maintains processing operations in various global jurisdictions». Kilde: samme | high

### 6. Fiks Gata
- Vilkårene (sist oppdatert 2025-03-20) oppgir verken selskap, organisasjonsnummer eller behandlingsansvarlig. Eneste kontakt er fiksgatami@gmail.com. Kilde: https://www.fiksgatami.no/content/terms | FiksGata.no | 2025-03 | high | practice
- «Meldinger du sender inn kan bli offentlig tilgjengelige, med unntak av din e-postadresse». Bilder sendes med til myndighetene. Sladding og moderering av bilder nevnes ikke. Kilde: samme | high
- Vilkårene sier ingenting om sletting, lagringstid eller rettigheter, og det finnes ingen personvernerklæring. Innlogging skjer via Google eller GitHub. Kilde: samme | high
- Den gamle løsningen fra 2011 gikk ut av produksjon i 2024, og dagens tjeneste er ny. Kilde: https://www.fiksgatami.no/content/about | FiksGata.no | ukjent | high | practice
- Forsiden sier bare «utviklet av frivillige i en digital dugnad». Kilde: https://www.fiksgatami.no/ | FiksGata.no | ukjent | high | practice
- Den opprinnelige løsningen fra 2011 ble laget sammen med mySociety, med NUUG-lederen som prosjektleder. Kilde: https://www.tu.no/artikler/fix-my-street-pa-norsk/248356 | TU | 2011-03 | medium | practice

## Spor verdt å følge
- Groq-DPA-en.
- Cloudflare Self-Serve Subscription Agreement (om Free plan er dekket).
- C-703/25 P på curia, sjekket manuelt i nettleser.
- trust.mistral.ai.
- Fiks Gata som eksempel på hva man ikke bør gjøre.

## Lette etter, fant ikke
- Status for C-703/25 P på curia.
- En ny vurdering av DPF fra Kommisjonen i 2026.
- Groq i DPF-listen.
- Hvor Mistral behandler data.
- Om Cloudflare-DPA-en dekker Free plan og Workers AI uttrykkelig.
- Hvem som drifter dagens Fiks Gata.
