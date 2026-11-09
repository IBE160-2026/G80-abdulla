-- Reglene for bildene til rapportene (Story 1.6, AD-6, AD-9, AD-14).
--
-- Bucketen report-images er privat og settes opp i supabase/config.toml.
-- Objektnavnet er <author_id>/<uuid>.<ext> og er lik reports.image_path.
-- Policyene på storage.objects avgjør hvem som kan lese et bilde, også når
-- Storage lager en signert lenke (createSignedUrl krever SELECT på objektet
-- for den som spør). Bildene arver synligheten til rapporten: et bilde fra en
-- skjult rapport kan bare moderatoren lese.
--
-- Ingen UPDATE- eller DELETE-policy: et opplastet bilde kan ikke overskrives
-- eller slettes av anon eller authenticated (AD-9).

-- image_path ligger alltid i mappen til forfatteren, og to rapporter deler
-- aldri samme bilde. NULL betyr ingen bilde (AD-4).
alter table public.reports
  add constraint reports_image_path_check
    check (image_path is null or image_path like author_id::text || '/%'),
  add constraint reports_image_path_key unique (image_path);

-- Visningen lages på nytt i samme migrering som endrer reports (AD-5), med
-- samme kolonner og samme grants som i 20261108190211_datamodell.sql.
drop view public.reports_with_counts;

create view public.reports_with_counts
with (security_invoker = true)
as
select
  r.id,
  r.author_id,
  r.description,
  r.location,
  r.category,
  r.summary,
  r.image_path,
  r.status,
  r.hidden,
  r.created_at,
  r.status_changed_at,
  count(c.user_id)::integer as confirmation_count,
  (count(c.user_id) + 1)::integer as seen_count,
  coalesce(bool_or(c.user_id = (select auth.uid())), false) as confirmed_by_me,
  coalesce(r.author_id = (select auth.uid()), false) as authored_by_me
from public.reports r
left join public.confirmations c on c.report_id = r.id
group by r.id;

revoke all on table public.reports_with_counts from anon, authenticated;
grant select on table public.reports_with_counts to anon, authenticated;

-- Lesing. Policyene sjekker hidden selv, i tillegg til RLS på reports, så en
-- senere endring i policyene på reports ikke kan gjøre skjulte bilder
-- lesbare (AD-14). anon kaller aldri is_moderator().
create policy "report-images: anon leser synlige"
  on storage.objects
  for select
  to anon
  using (
    bucket_id = 'report-images'
    and exists (
      select 1
      from public.reports r
      where r.image_path = storage.objects.name
        and r.hidden = false
    )
  );

create policy "report-images: authenticated leser synlige, moderator alle"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'report-images'
    and exists (
      select 1
      from public.reports r
      where r.image_path = storage.objects.name
        and (r.hidden = false or (select private.is_moderator()))
    )
  );

-- Opplasting bare i egen mappe: første ledd i objektnavnet er brukerens id.
create policy "report-images: authenticated laster opp i egen mappe"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'report-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
