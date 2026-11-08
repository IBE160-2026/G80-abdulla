-- Lesereglene (FR-5, FR-9, AD-5, AD-12, AD-14): hvem ser hvilke rapporter,
-- bekreftelser og profiler, og at visningen gir false og ikke NULL.
begin;
\ir hjelpere.psql

select plan(24);

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
select is(
  (select count(*)::int from public.reports where hidden),
  0,
  'anon: reports gir ingen skjulte rapporter'
);
select is(
  (select count(*)::int from public.reports),
  8,
  'anon: reports gir alle de synlige rapportene'
);
select is(
  (select count(*)::int from public.reports_with_counts where hidden),
  0,
  'anon: visningen gir ingen skjulte rapporter'
);
select is(
  (select count(*)::int from public.reports_with_counts),
  8,
  'anon: visningen gir alle de synlige rapportene'
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
  (select seen_count from public.reports_with_counts where id = '20000000-0000-4000-8000-000000000004'),
  1,
  'en rapport uten bekreftelser har seen_count 1'
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
select is(
  (select count(*)::int from public.reports_with_counts where hidden),
  0,
  'bruker: visningen gir ingen skjulte rapporter'
);
select is(
  (select count(*)::int from public.reports where hidden),
  0,
  'bruker: reports gir ingen skjulte rapporter'
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
  (select count(*)::int from public.reports_with_counts),
  9,
  'moderator: visningen gir alle rapportene'
);
select is(
  (select hidden from public.reports_with_counts where id = tests.skjult_rapport()),
  true,
  'moderator: ser den skjulte rapporten'
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

select * from finish();
rollback;
