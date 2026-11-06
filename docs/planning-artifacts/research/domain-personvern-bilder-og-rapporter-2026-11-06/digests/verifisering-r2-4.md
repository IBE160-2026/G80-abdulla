# Digest: kontroll av lastbærende påstander, runde 2, assistent 4

Tilgangsdato for alle kilder: 2026-11-06. Formålet er en uavhengig kontroll av påstandene anbefalingene hviler på.

## Funn
- Art. 17(3)(a): «for exercising the right of freedom of expression and information». Kilde: https://gdpr-info.eu/art-17-gdpr/ | Intersoft Consulting | 2016-04 (forordningen) | high | regulatory
- Art. 17(3)(b): «for compliance with a legal obligation which requires processing by Union or Member State law …». Kilde: samme | high
- Art. 17(3)(d): «for archiving purposes in the public interest, scientific or historical research purposes or statistical purposes …». Kilde: samme | high
- Dette bekrefter Datatilsynets oppsummering av unntakene fra runde 1 med en uavhengig kilde. Bokstav (b) omfatter også oppgaver i allmennhetens interesse, men den delen av teksten er avkortet i sitatet.
- Art. 5(1)(c): «adequate, relevant and limited to what is necessary in relation to the purposes». Kilde: https://gdpr-info.eu/art-5-gdpr/ | Intersoft Consulting | 2016-04 | high | regulatory
- Art. 5(1)(e): «kept in a form which permits identification of data subjects for no longer than is necessary …». Kilde: samme | high
- Art. 25(2): «The controller shall implement appropriate technical and organisational measures for ensuring that, by default, only personal data which are necessary for each specific purpose of the processing are processed.» Kilde: https://gdpr-info.eu/art-25-gdpr/ | Intersoft Consulting | 2016-04 | high | regulatory
- Gemini: «You may use only Paid Services when making API Clients available to users in the European Economic Area». Gemini API er en Paid Service bare med et Cloud Project med aktiv faktureringskonto. I EØS gjelder vilkårene for betalte tjenester også for gratis bruk. Vilkårene gjelder fra «Effective March 23, 2026». Siden ble lest på nytt via omdirigering fra ai.google.dev. Kilde: https://aistudio.google.com/docs/terms | Google | 2026-03 | high | vendor-policy
- Listen over tilgjengelige regioner for Gemini omfatter Norge, men sier ingenting om nivåer. Kilde: https://aistudio.google.com/docs/available-regions | Google | ukjent | medium | vendor-policy
- Cloudflare Workers AI: «**No training:** Cloudflare does not use Customer Content processed by Workers AI to train AI models.» Under «Zero data retention» står det at input og output ikke beholdes etter at forespørselen er behandlet, med unntak for R2, KV, Durable Objects, Vectorize, logging og caching i AI Gateway, og batch. Siden er sist oppdatert 2026-10-16. Kilde: https://developers.cloudflare.com/workers-ai/platform/privacy/ | Cloudflare | 2026-10 | high | vendor-policy
- Ingen annen side fra Cloudflare bekrefter at Workers AI ikke trener på data: /ai-policy/ ga 404, og trust-hub sier ingenting om det. Påstanden har altså bare én kilde, utgiveren selv.
