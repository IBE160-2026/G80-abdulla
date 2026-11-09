-- Tom database for e2e/reset/liste.spec.ts (Story 1.4): sletter alle
-- bekreftelser og rapporter. Kjøres som postgres, fordi appen ikke har
-- DELETE-grant. Kontoene beholdes. `db reset` i afterAll legger seed-dataene
-- inn igjen. `db query` godtar bare én setning, og truncate med begge
-- tabellene virker selv om bekreftelsene peker på rapportene.
truncate public.confirmations, public.reports;
