-- Bekreftelser (Story 3.3, FR-7, AD-7, AD-12, AR-7): en innlogget bruker kan
-- bekrefte en annens synlige rapport, én gang.
--
-- INSERT gis som kolonnegrant bare på report_id. user_id (DEFAULT auth.uid())
-- og created_at (DEFAULT now()) kommer fra DEFAULT, og et forsøk på å sette
-- dem gir 42501. Policyen sjekker at bekreftelsen er brukerens egen, og at
-- rapporten finnes, ikke er skjult og ikke er brukerens egen. Underspørringen
-- leser reports under RLS, så en skjult rapport er usynlig for en vanlig bruker.
-- Moderatoren ser skjulte rapporter, så hidden = false står uttrykkelig.
-- Samme bekreftelse to ganger gir 23505 fra primærnøkkelen.
--
-- anon får ingen INSERT. Ingen UPDATE, DELETE eller TRUNCATE: en bekreftelse
-- kan ikke angres.

grant insert (report_id)
  on table public.confirmations
  to authenticated;

create policy "confirmations: authenticated bekrefter andres synlige rapporter"
  on public.confirmations
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.reports r
      where r.id = confirmations.report_id
        and r.hidden = false
        and r.author_id <> (select auth.uid())
    )
  );
