-- Bekreftelser (Story 3.3, FR-7, AD-7, AD-12, AR-7): en innlogget bruker
-- bekrefter en annens synlige rapport, én gang, med bare report_id. user_id
-- blir brukerens egen id. Egen rapport, skjult rapport (også for moderatoren),
-- samme rapport to ganger og satt user_id eller created_at avvises. Ingen kan
-- endre eller slette en bekreftelse. En bekreftelse på en løst rapport endrer
-- ikke statusen, og seen_count øker med én. Seed: rapport 1, 3, 5 og 7 (skjult)
-- har bruker1 som forfatter, rapport 2, 4, 6, 8 og 9 har bruker2. Rapport 4 har
-- ingen bekreftelser (seen_count 1), og rapport 6 er løst med én bekreftelse.
begin;
\ir hjelpere.psql

select plan(20);

-- Policyen: nøyaktig én INSERT-policy på confirmations, bare TO authenticated.
select is(
  array(
    select p.cmd || ' ' || array_to_string(p.roles, ',')
    from pg_policies p
    where p.schemaname = 'public' and p.tablename = 'confirmations' and p.cmd = 'INSERT'
  ),
  array['INSERT authenticated'],
  'confirmations har én INSERT-policy, og den gjelder bare authenticated'
);

-- En vanlig bruker bekrefter en annens rapport. user_id får DEFAULT auth.uid(),
-- og seen_count går fra 1 til 2.
select tests.as_user(tests.bruker1());
select is(
  (select seen_count from public.reports_with_counts where id = '20000000-0000-4000-8000-000000000004'),
  1,
  'rapport 4 har seen_count 1 før bekreftelsen'
);
select lives_ok(
  $$insert into public.confirmations (report_id) values ('20000000-0000-4000-8000-000000000004')$$,
  'bruker1 kan bekrefte bruker2s rapport med bare report_id'
);
select results_eq(
  $$select user_id from public.confirmations where report_id = '20000000-0000-4000-8000-000000000004'$$,
  $$values ('10000000-0000-4000-8000-000000000002'::uuid)$$,
  'user_id er brukerens egen id'
);
select results_eq(
  $$select seen_count, confirmation_count, confirmed_by_me from public.reports_with_counts where id = '20000000-0000-4000-8000-000000000004'$$,
  $$values (2, 1, true)$$,
  'seen_count øker med én, og confirmed_by_me er true'
);

-- Samme rapport to ganger gir 23505 fra primærnøkkelen.
select throws_ok(
  $$insert into public.confirmations (report_id) values ('20000000-0000-4000-8000-000000000004')$$,
  '23505', null, 'samme rapport to ganger avvises'
);

-- Egen rapport og en rapport som ikke finnes gir 42501 fra policyen.
select throws_ok(
  $$insert into public.confirmations (report_id) values ('20000000-0000-4000-8000-000000000005')$$,
  '42501', null, 'en bruker kan ikke bekrefte sin egen rapport'
);
select throws_ok(
  $$insert into public.confirmations (report_id) values ('20000000-0000-4000-8000-0000000000aa')$$,
  '42501', null, 'en rapport som ikke finnes, kan ikke bekreftes'
);

-- Skjult rapport: en vanlig bruker ser den ikke, og moderatoren ser den, men
-- får ikke bekrefte den (hidden = false står i policyen).
select throws_ok(
  format($$insert into public.confirmations (report_id) values (%L)$$, tests.skjult_rapport()),
  '42501', null, 'en bruker kan ikke bekrefte en skjult rapport'
);
select tests.as_user(tests.moderator());
select is(
  (select count(*)::int from public.reports where id = tests.skjult_rapport()),
  1,
  'moderatoren ser den skjulte rapporten'
);
select throws_ok(
  format($$insert into public.confirmations (report_id) values (%L)$$, tests.skjult_rapport()),
  '42501', null, 'heller ikke moderatoren kan bekrefte en skjult rapport'
);

-- Moderatoren bekrefter andres rapporter som en vanlig bruker, også en løst
-- rapport. Statusen endres ikke, og seen_count øker med én.
select lives_ok(
  $$insert into public.confirmations (report_id) values ('20000000-0000-4000-8000-000000000004')$$,
  'moderatoren kan bekrefte en annens rapport'
);
create temporary table for_bekreftelse as
select status::text as status, seen_count
from public.reports_with_counts
where id = '20000000-0000-4000-8000-000000000006';
grant select on for_bekreftelse to authenticated;
select lives_ok(
  $$insert into public.confirmations (report_id) values ('20000000-0000-4000-8000-000000000006')$$,
  'moderatoren kan bekrefte en løst rapport'
);
select results_eq(
  $$select status::text, seen_count from public.reports_with_counts where id = '20000000-0000-4000-8000-000000000006'$$,
  $$select status, seen_count + 1 from for_bekreftelse$$,
  'en bekreftelse på en løst rapport endrer ikke statusen, og seen_count øker med én'
);

-- user_id og created_at kan ikke settes, heller ikke til brukerens egen id
-- eller til en gyldig verdi.
select tests.as_user(tests.bruker2());
select throws_ok(
  $$insert into public.confirmations (report_id, user_id) values ('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000002')$$,
  '42501', null, 'user_id kan ikke settes til en annen bruker'
);
select throws_ok(
  $$insert into public.confirmations (report_id, user_id) values ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003')$$,
  '42501', null, 'user_id kan ikke settes, heller ikke til egen id'
);
select throws_ok(
  $$insert into public.confirmations (report_id, created_at) values ('20000000-0000-4000-8000-000000000003', now() - interval '1 year')$$,
  '42501', null, 'created_at kan ikke settes'
);

-- Ingen UPDATE eller DELETE, heller ikke for moderatoren. En bekreftelse kan
-- ikke angres (FR-7).
select throws_ok(
  $$update public.confirmations set report_id = report_id$$,
  '42501', null, 'en bruker kan ikke endre en bekreftelse'
);
select tests.as_user(tests.moderator());
select throws_ok(
  $$delete from public.confirmations$$,
  '42501', null, 'moderatoren kan ikke slette en bekreftelse'
);

-- En besøkende får ikke bekrefte.
select tests.as_anon();
select throws_ok(
  $$insert into public.confirmations (report_id) values ('20000000-0000-4000-8000-000000000004')$$,
  '42501', null, 'anon kan ikke bekrefte'
);

select * from finish();
rollback;
