-- Statusendring (Story 4.1, FR-8, AD-12, AD-14): bare moderatoren endrer
-- status, ett steg om gangen fram eller tilbake, og status_changed_at flyttes
-- bare når statusen endres. En vanlig bruker får 42501, også på egen rapport,
-- og anon har ingen UPDATE-grant. Bare status og hidden kan endres. Seed:
-- rapport 1 (new) og 7 (new, skjult) har bruker1 som forfatter, rapport 2
-- (in_progress), 4 (new) og 6 (resolved) har bruker2.
begin;
\ir hjelpere.psql

select plan(36);

-- Policyen og triggeren finnes, og policyen navngir rollen.
select is(
  array(
    select p.cmd || ' ' || array_to_string(p.roles, ',') || ' ' || p.qual || ' ' || p.with_check
    from pg_policies p
    where p.schemaname = 'public' and p.tablename = 'reports' and p.cmd = 'UPDATE'
  ),
  array['UPDATE authenticated ((hidden = false) OR ( SELECT private.is_moderator() AS is_moderator)) ( SELECT private.is_moderator() AS is_moderator)'],
  'reports har én UPDATE-policy: TO authenticated, USING som SELECT-policyen, WITH CHECK is_moderator()'
);
select has_trigger('public', 'reports', 'reports_guard_update', 'reports har triggeren reports_guard_update');
select is(
  (select tgtype & 2 = 2 and tgtype & 16 = 16 and tgtype & 1 = 1 from pg_trigger where tgname = 'reports_guard_update'),
  true,
  'reports_guard_update er en BEFORE UPDATE-trigger for hver rad'
);
select is(
  (select proconfig from pg_proc where oid = 'private.reports_guard_update()'::regprocedure),
  array['search_path=""'],
  'reports_guard_update har search_path = '''''
);

-- En vanlig bruker får 42501 fra triggeren, også på egen rapport og ved hopp.
select tests.as_user(tests.bruker1());
select throws_ok(
  $$update public.reports set status = 'in_progress' where id = '20000000-0000-4000-8000-000000000001'$$,
  '42501', null, 'bruker1 kan ikke endre status på egen rapport'
);
select throws_ok(
  $$update public.reports set status = 'new' where id = '20000000-0000-4000-8000-000000000002'$$,
  '42501', null, 'bruker1 kan ikke endre status på en annens rapport'
);
select throws_ok(
  $$update public.reports set status = 'resolved' where id = '20000000-0000-4000-8000-000000000001'$$,
  '42501', null, 'bruker1 får 42501 også ved hopp (tilgangen sjekkes først)'
);
select throws_ok(
  $$update public.reports set hidden = true where id = '20000000-0000-4000-8000-000000000001'$$,
  '42501', null, 'bruker1 kan ikke skjule egen rapport'
);
-- En skjult rapport er usynlig for bruker1, så oppdateringen treffer ingen rader.
select lives_ok(
  format($$update public.reports set status = 'in_progress' where id = %L$$, tests.skjult_rapport()),
  'bruker1 ser ikke den skjulte rapporten, så oppdateringen treffer ingen rader'
);

-- anon har ingen UPDATE-grant.
select tests.as_anon();
select throws_ok(
  $$update public.reports set status = 'in_progress' where id = '20000000-0000-4000-8000-000000000001'$$,
  '42501', null, 'anon kan ikke endre status'
);
select throws_ok(
  $$update public.reports set hidden = true where id = '20000000-0000-4000-8000-000000000001'$$,
  '42501', null, 'anon kan ikke skjule en rapport'
);

-- Ingenting av det over endret noe.
select tests.as_postgres();
select results_eq(
  $$select id::text, status::text, hidden from public.reports where id in ('20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000007') order by id$$,
  $$values ('20000000-0000-4000-8000-000000000001', 'new', false), ('20000000-0000-4000-8000-000000000002', 'in_progress', false), ('20000000-0000-4000-8000-000000000007', 'new', true)$$,
  'avviste oppdateringer endret verken status eller hidden'
);

-- Moderatoren flytter rapport 1 ett steg fram om gangen, og status_changed_at
-- blir now() hver gang.
select tests.as_user(tests.moderator());
select lives_ok(
  $$update public.reports set status = 'in_progress' where id = '20000000-0000-4000-8000-000000000001' and status = 'new'$$,
  'moderatoren flytter new → in_progress'
);
select results_eq(
  $$select status::text, status_changed_at = now() from public.reports where id = '20000000-0000-4000-8000-000000000001'$$,
  $$values ('in_progress', true)$$,
  'statusen er in_progress, og status_changed_at er now()'
);
select lives_ok(
  $$update public.reports set status = 'resolved' where id = '20000000-0000-4000-8000-000000000001'$$,
  'moderatoren flytter in_progress → resolved'
);
select is(
  (select status::text from public.reports where id = '20000000-0000-4000-8000-000000000001'),
  'resolved',
  'statusen er resolved'
);

-- Og tilbake, ett steg om gangen.
select lives_ok(
  $$update public.reports set status = 'in_progress' where id = '20000000-0000-4000-8000-000000000001'$$,
  'moderatoren flytter resolved → in_progress'
);
select lives_ok(
  $$update public.reports set status = 'new' where id = '20000000-0000-4000-8000-000000000001'$$,
  'moderatoren flytter in_progress → new'
);
select results_eq(
  $$select status::text, status_changed_at = now() from public.reports where id = '20000000-0000-4000-8000-000000000001'$$,
  $$values ('new', true)$$,
  'statusen er new igjen, og status_changed_at er now()'
);

-- Hopp mellom new og resolved avvises begge veier.
select throws_ok(
  $$update public.reports set status = 'resolved' where id = '20000000-0000-4000-8000-000000000004'$$,
  'P0001', 'invalid_status_step', 'hopp new → resolved avvises'
);
select throws_ok(
  $$update public.reports set status = 'new' where id = '20000000-0000-4000-8000-000000000006'$$,
  'P0001', 'invalid_status_step', 'hopp resolved → new avvises'
);

-- Utdatert fra-status: WHERE status = ... treffer ingen rader, og ingenting endres.
select lives_ok(
  $$update public.reports set status = 'resolved' where id = '20000000-0000-4000-8000-000000000002' and status = 'new'$$,
  'utdatert fra-status gir ingen feil'
);
select results_eq(
  $$select status::text, status_changed_at from public.reports where id = '20000000-0000-4000-8000-000000000002'$$,
  $$values ('in_progress', '2026-10-23T09:00:00Z'::timestamptz)$$,
  'utdatert fra-status endret ingenting'
);

-- Uendret status og skjuling er lov, og status_changed_at står stille.
select lives_ok(
  $$update public.reports set status = status where id = '20000000-0000-4000-8000-000000000002'$$,
  'tom oppdatering (status = status) er lov'
);
select lives_ok(
  $$update public.reports set status = 'in_progress' where id = '20000000-0000-4000-8000-000000000002'$$,
  'samme status som før er lov'
);
select lives_ok(
  $$update public.reports set hidden = true where id = '20000000-0000-4000-8000-000000000002'$$,
  'moderatoren kan skjule en rapport'
);
select lives_ok(
  $$update public.reports set hidden = true where id = '20000000-0000-4000-8000-000000000002'$$,
  'å skjule en skjult rapport er lov'
);
select results_eq(
  $$select status::text, hidden, status_changed_at from public.reports where id = '20000000-0000-4000-8000-000000000002'$$,
  $$values ('in_progress', true, '2026-10-23T09:00:00Z'::timestamptz)$$,
  'uendret status og skjuling flytter ikke status_changed_at'
);

-- En skjult rapport kan få ny status, også i samme oppdatering som hidden.
select lives_ok(
  format($$update public.reports set status = 'in_progress' where id = %L$$, tests.skjult_rapport()),
  'moderatoren kan endre status på en skjult rapport'
);
select lives_ok(
  format($$update public.reports set status = 'resolved', hidden = false where id = %L$$, tests.skjult_rapport()),
  'status og hidden kan endres i samme oppdatering'
);
select results_eq(
  format($$select status::text, hidden, status_changed_at = now() from public.reports where id = %L$$, tests.skjult_rapport()),
  $$values ('resolved', false, true)$$,
  'den skjulte rapporten er resolved og synlig, og status_changed_at er now()'
);

-- Andre kolonner: status_changed_at og teksten har ingen grant (42501).
select throws_ok(
  $$update public.reports set status_changed_at = now() where id = '20000000-0000-4000-8000-000000000004'$$,
  '42501', null, 'moderatoren kan ikke sette status_changed_at'
);
select throws_ok(
  $$update public.reports set description = 'Endret' where id = '20000000-0000-4000-8000-000000000004'$$,
  '42501', null, 'moderatoren kan ikke endre description (ingen grant)'
);

-- Triggeren er forsvar i dybden: med en grant på description (bare i denne
-- transaksjonen) stopper den likevel endringen.
select tests.as_postgres();
grant update (description) on table public.reports to authenticated;
select tests.as_user(tests.moderator());
select throws_ok(
  $$update public.reports set description = 'Endret' where id = '20000000-0000-4000-8000-000000000004'$$,
  'P0001', 'invalid_column_change', 'triggeren avviser endring av description'
);
select throws_ok(
  $$update public.reports set description = 'Endret', status = 'in_progress' where id = '20000000-0000-4000-8000-000000000004'$$,
  'P0001', 'invalid_column_change', 'triggeren avviser description også sammen med en gyldig statusendring'
);

-- postgres slipper gjennom triggeren (seed og begrensninger.sql).
select tests.as_postgres();
select lives_ok(
  $$update public.reports set status = 'resolved' where id = '20000000-0000-4000-8000-000000000004'$$,
  'postgres er ikke vokta av triggeren'
);

select * from finish();
rollback;
