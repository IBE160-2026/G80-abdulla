-- Lesereglene (FR-5, FR-9, AD-5, AD-12, AD-14): hvem ser hvilke rapporter,
-- bekreftelser og profiler, tellerne i visningen, og at visningen gir false
-- og ikke NULL.
begin;
\ir hjelpere.psql

select plan(36);

-- De åtte synlige rapportene i seed (alle unntatt rapport 7).
create temporary table synlige (id uuid primary key);
insert into synlige (id)
select ('20000000-0000-4000-8000-00000000000' || n)::uuid
from unnest(array[1, 2, 3, 4, 5, 6, 8, 9]) as n;
grant select on synlige to anon, authenticated;

-- Kontroll: hjelperne setter auth.uid(), ellers ville testene under bestått
-- uten å teste noe.
select tests.as_user(tests.bruker1());
select is(auth.uid(), tests.bruker1(), 'as_user setter auth.uid()');
select is(current_user::text, 'authenticated', 'as_user setter rollen authenticated');
select is(
  (select authored_by_me from public.reports_with_counts where id = '20000000-0000-4000-8000-000000000001'),
  true,
  'authored_by_me er true for egen rapport'
);
select is(
  (select confirmed_by_me from public.reports_with_counts where id = '20000000-0000-4000-8000-000000000002'),
  true,
  'confirmed_by_me er true for en rapport brukeren har bekreftet'
);

-- Besøkende
select tests.as_anon();
select is(auth.uid(), null, 'as_anon gir auth.uid() NULL');
select is(current_user::text, 'anon', 'as_anon setter rollen anon');
select results_eq(
  'select id from public.reports order by id',
  'select id from synlige order by id',
  'anon: reports gir nøyaktig de åtte synlige rapportene'
);
select results_eq(
  'select id from public.reports_with_counts order by id',
  'select id from synlige order by id',
  'anon: visningen gir nøyaktig de åtte synlige rapportene'
);
select is(
  (select count(*)::int from public.reports_with_counts where authored_by_me is distinct from false),
  0,
  'anon: authored_by_me er false, ikke NULL'
);
select is(
  (select count(*)::int from public.reports_with_counts where confirmed_by_me is distinct from false),
  0,
  'anon: confirmed_by_me er false, ikke NULL'
);
select is(
  (select confirmation_count from public.reports_with_counts where id = '20000000-0000-4000-8000-000000000001'),
  2,
  'anon: rapport 1 har confirmation_count 2'
);
select is(
  (select confirmation_count from public.reports_with_counts where id = '20000000-0000-4000-8000-000000000002'),
  2,
  'anon: rapport 2 har confirmation_count 2 (likt med rapport 1)'
);
select is(
  (select seen_count from public.reports_with_counts where id = '20000000-0000-4000-8000-000000000001'),
  3,
  'anon: rapport 1 har seen_count 3 (to bekreftelser og rapportøren)'
);
select is(
  (select confirmation_count from public.reports_with_counts where id = '20000000-0000-4000-8000-000000000004'),
  0,
  'anon: en rapport uten bekreftelser har confirmation_count 0'
);
select is(
  (select seen_count from public.reports_with_counts where id = '20000000-0000-4000-8000-000000000004'),
  1,
  'anon: en rapport uten bekreftelser har seen_count 1'
);
select is(
  (select count(*)::int from public.confirmations where report_id = tests.skjult_rapport()),
  0,
  'anon: ingen bekreftelser til den skjulte rapporten'
);
select ok(
  (select count(*) from public.confirmations) > 0,
  'anon: bekreftelser til synlige rapporter kan leses'
);
select throws_ok(
  'select * from public.profiles',
  '42501',
  null,
  'anon: ingen tilgang til profiles'
);

-- Vanlig bruker
select tests.as_user(tests.bruker2());
select results_eq(
  'select id from public.reports order by id',
  'select id from synlige order by id',
  'bruker: reports gir nøyaktig de åtte synlige rapportene'
);
select results_eq(
  'select id from public.reports_with_counts order by id',
  'select id from synlige order by id',
  'bruker: visningen gir nøyaktig de åtte synlige rapportene'
);
select is(
  (select confirmed_by_me from public.reports_with_counts where id = '20000000-0000-4000-8000-000000000001'),
  true,
  'bruker: confirmed_by_me er true for en rapport brukeren har bekreftet'
);
select is(
  (select confirmed_by_me from public.reports_with_counts where id = '20000000-0000-4000-8000-000000000002'),
  false,
  'bruker: confirmed_by_me er false for en rapport andre har bekreftet'
);
select is(
  (select confirmed_by_me from public.reports_with_counts where id = '20000000-0000-4000-8000-000000000004'),
  false,
  'bruker: confirmed_by_me er false, ikke NULL, for en rapport uten bekreftelser'
);
select is(
  (select authored_by_me from public.reports_with_counts where id = '20000000-0000-4000-8000-000000000001'),
  false,
  'bruker: authored_by_me er false for en annens rapport'
);
select is(
  (select authored_by_me from public.reports_with_counts where id = '20000000-0000-4000-8000-000000000002'),
  true,
  'bruker: authored_by_me er true for egen rapport'
);
select is(
  (select count(*)::int from public.confirmations where report_id = tests.skjult_rapport()),
  0,
  'bruker: ingen bekreftelser til den skjulte rapporten, heller ikke egen'
);
select results_eq(
  'select id, role::text from public.profiles',
  $$values (tests.bruker2(), 'user')$$,
  'bruker: profiles gir bare egen rad'
);

-- Moderator
select tests.as_user(tests.moderator());
select is(
  (select count(*)::int from public.reports),
  9,
  'moderator: reports gir alle de ni rapportene'
);
select is(
  (select count(*)::int from public.reports_with_counts),
  9,
  'moderator: visningen gir alle de ni rapportene'
);
select is(
  (select hidden from public.reports where id = tests.skjult_rapport()),
  true,
  'moderator: ser den skjulte rapporten i reports'
);
select is(
  (select hidden from public.reports_with_counts where id = tests.skjult_rapport()),
  true,
  'moderator: ser den skjulte rapporten i visningen'
);
select is(
  (select confirmation_count from public.reports_with_counts where id = tests.skjult_rapport()),
  1,
  'moderator: den skjulte rapporten har confirmation_count 1'
);
select is(
  (select count(*)::int from public.confirmations where report_id = tests.skjult_rapport()),
  1,
  'moderator: ser bekreftelsen til den skjulte rapporten'
);
select results_eq(
  'select id, role::text from public.profiles',
  $$values (tests.moderator(), 'moderator')$$,
  'moderator: profiles gir bare egen rad'
);

-- Kjerneflytbrukeren har ingen rapporter, så authored_by_me er false overalt.
select tests.as_user('10000000-0000-4000-8000-000000000004');
select is(
  (select count(*)::int from public.reports_with_counts where authored_by_me or confirmed_by_me),
  0,
  'kjerneflytbruker: authored_by_me og confirmed_by_me er false for alle rapporter'
);
select is(
  (select count(*)::int from public.reports_with_counts),
  8,
  'kjerneflytbruker: visningen gir de åtte synlige rapportene'
);

select * from finish();
rollback;
