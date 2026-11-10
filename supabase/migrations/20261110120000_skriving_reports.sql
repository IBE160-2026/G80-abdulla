-- Skriving av rapporter (Story 2.2, AD-12, AR-7): innloggede brukere kan
-- registrere en rapport.
--
-- INSERT gis som kolonnegrant, så bare de fem kolonnene brukeren kan påvirke,
-- kan settes. author_id (DEFAULT auth.uid()), status, hidden, created_at og
-- status_changed_at kommer fra DEFAULT, og et forsøk på å sette dem gir 42501.
-- summary og image_path settes ikke av skjemaet i Story 2.2, men får grant nå
-- (Story 2.3 og 2.4), slik at grantmatrisen i supabase/tests/skriving.sql bare
-- endres én gang. Lengdereglene ligger fortsatt i CHECK-uttrykkene i
-- 20261108190211_datamodell.sql.
--
-- anon får ingen INSERT. Ingen UPDATE, DELETE eller TRUNCATE (Epic 3–4).

grant insert (description, location, category, summary, image_path)
  on table public.reports
  to authenticated;

-- Policyen navngir rollen og krever at raden tilhører brukeren. author_id har
-- fått sin DEFAULT før policyen sjekkes, så den er alltid brukerens egen id.
create policy "reports: authenticated oppretter egne"
  on public.reports
  for insert
  to authenticated
  with check (author_id = (select auth.uid()));
