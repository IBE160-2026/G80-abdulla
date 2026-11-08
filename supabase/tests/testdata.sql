-- Løftene i supabase/seed.sql (Story 1.3, AD-11): alle kategorier og
-- statuser, én skjult rapport, likt antall bekreftelser på to synlige
-- rapporter, faste tidspunkter og ledige kjerneflytbrukere.
-- Kjøres som postgres, som ser alle radene.
begin;
\ir hjelpere.psql

select plan(8);

select set_eq(
  'select distinct category::text from public.reports',
  $$select unnest(enum_range(null::public.report_category))::text$$,
  'seed har alle de fem kategoriene'
);

select set_eq(
  'select distinct status::text from public.reports',
  $$select unnest(enum_range(null::public.report_status))::text$$,
  'seed har alle de tre statusene'
);

select is(
  (select count(*)::int from public.reports where hidden),
  1,
  'seed har nøyaktig én skjult rapport'
);

select ok(
  exists (
    select confirmation_count
    from public.reports_with_counts
    where not hidden
    group by confirmation_count
    having count(*) >= 2
  ),
  'minst to synlige rapporter har like mange bekreftelser (Story 3.1)'
);

select is_empty(
  $$select id from public.reports where status = 'new' and status_changed_at <> created_at$$,
  'status_changed_at = created_at for alle rapporter med status new'
);

select is_empty(
  $$select id from public.reports where status <> 'new' and status_changed_at <= created_at$$,
  'status_changed_at er senere enn created_at for alle andre rapporter'
);

select is_empty(
  $$
    select id from public.reports
    where author_id in ('10000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000005')
  $$,
  'kjerneflytbrukerne har ingen rapporter'
);

select is_empty(
  $$
    select report_id from public.confirmations
    where user_id in ('10000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000005')
  $$,
  'kjerneflytbrukerne har ingen bekreftelser'
);

select * from finish();
rollback;
