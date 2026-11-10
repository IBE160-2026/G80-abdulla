-- Skriving (AD-12): fra Story 2.2 kan authenticated sette inn i reports, og
-- bare på kolonnene description, location, category, summary og image_path.
-- Alt annet gir 42501 for anon, authenticated og moderatoren: INSERT på
-- profiles og confirmations, INSERT med author_id, status, hidden, created_at
-- eller status_changed_at, og UPDATE, DELETE og TRUNCATE på alle tabellene.
-- Resten av skrivereglene kommer i Epic 3–4, og da endres denne fila.
begin;
\ir hjelpere.psql

select plan(60);

-- Rettighetsmatrisen i AD-12 er uttømmende: dette er alle grants til anon,
-- authenticated og PUBLIC på tabeller, visninger og kolonner i public.
select is(
  array(
    select g.rad
    from (
      select format('%s %s %s', c.relname, a.grantee::regrole, a.privilege_type) collate "C" as rad, a.grantee
      from pg_class c
      cross join lateral aclexplode(c.relacl) a
      where c.relnamespace = 'public'::regnamespace
      union all
      select format('%s.%s %s %s', c.relname, att.attname, a.grantee::regrole, a.privilege_type) collate "C", a.grantee
      from pg_class c
      join pg_attribute att on att.attrelid = c.oid
      cross join lateral aclexplode(att.attacl) a
      where c.relnamespace = 'public'::regnamespace
    ) g
    where g.grantee in (0, 'anon'::regrole, 'authenticated'::regrole)
    order by g.rad
  ),
  array[
    'confirmations anon SELECT',
    'confirmations authenticated SELECT',
    'profiles authenticated SELECT',
    'reports anon SELECT',
    'reports authenticated SELECT',
    'reports.category authenticated INSERT',
    'reports.description authenticated INSERT',
    'reports.image_path authenticated INSERT',
    'reports.location authenticated INSERT',
    'reports.summary authenticated INSERT',
    'reports_with_counts anon SELECT',
    'reports_with_counts authenticated SELECT'
  ],
  'anon og authenticated har lesegrantene og INSERT på fem kolonner i reports (AD-12)'
);

-- Policyen for INSERT navngir rollen og sjekker forfatteren.
select is(
  array(
    select p.cmd || ' ' || array_to_string(p.roles, ',') || ' ' || p.with_check
    from pg_policies p
    where p.schemaname = 'public' and p.tablename = 'reports' and p.cmd = 'INSERT'
  ),
  array['INSERT authenticated (author_id = ( SELECT auth.uid() AS uid))'],
  'reports har én INSERT-policy: TO authenticated WITH CHECK (author_id = auth.uid())'
);

-- Setningene kjøres som rollen i hver blokk. Rettigheten sjekkes før
-- verdiene, så DEFAULT VALUES er nok til å treffe 42501 der rollen ikke har
-- INSERT på noen kolonne.
create temporary table skrivesetninger (sql text not null);
insert into skrivesetninger (sql)
select format(s.mal, t.tabell)
from (values ('public.profiles'), ('public.confirmations')) as t (tabell)
cross join (
  values
    ('insert into %s default values'),
    ('update %s set created_at = created_at'),
    ('delete from %s'),
    ('truncate %s')
) as s (mal);
-- profiles har ingen created_at.
update skrivesetninger
set sql = 'update public.profiles set role = role'
where sql = 'update public.profiles set created_at = created_at';
-- reports: alt utenom INSERT, som har egne tester under.
insert into skrivesetninger (sql) values
  ('update public.reports set created_at = created_at'),
  ('delete from public.reports'),
  ('truncate public.reports');
grant select on skrivesetninger to anon, authenticated;

select tests.as_anon();
select throws_ok(sql, '42501', null, 'anon: ' || sql) from skrivesetninger;
select throws_ok(
  $$insert into public.reports default values$$,
  '42501', null, 'anon: insert into public.reports default values'
);
select throws_ok(
  $$insert into public.reports (description, location, category) values ('Hull', 'Bygg A', 'other')$$,
  '42501', null, 'anon kan ikke sette inn en rapport'
);

select tests.as_user(tests.bruker1());
select throws_ok(sql, '42501', null, 'bruker: ' || sql) from skrivesetninger;

select tests.as_user(tests.moderator());
select throws_ok(sql, '42501', null, 'moderator: ' || sql) from skrivesetninger;

-- authenticated setter inn en rapport: author_id blir brukerens egen id, og
-- status og hidden får standardverdiene.
select tests.as_user(tests.bruker1());
select lives_ok(
  $$insert into public.reports (description, location, category) values ('Ny fra pgTAP', 'Bygg A', 'other')$$,
  'bruker kan sette inn en rapport med description, location og category'
);
select results_eq(
  $$select author_id, status::text, hidden, status_changed_at = created_at from public.reports where description = 'Ny fra pgTAP'$$,
  $$values ('10000000-0000-4000-8000-000000000002'::uuid, 'new', false, true)$$,
  'author_id er brukerens id, status er new, hidden er false'
);
select lives_ok(
  $$insert into public.reports (description, location, category, summary) values ('Med oppsummering', 'Bygg B', 'waste', 'Kort tekst')$$,
  'bruker kan sette summary'
);
select lives_ok(
  $$insert into public.reports (description, location, category, summary, image_path) values ('Med bilde', 'Bygg B', 'waste', null, null)$$,
  'bruker kan sette image_path (her NULL)'
);

select tests.as_user(tests.moderator());
select lives_ok(
  $$insert into public.reports (description, location, category) values ('Fra moderator', 'Bygg C', 'lighting')$$,
  'moderatoren kan også registrere en rapport'
);
select is(
  (select author_id from public.reports where description = 'Fra moderator'),
  tests.moderator(),
  'author_id er moderatorens egen id'
);

-- Forfalskede kolonner avvises med 42501 (kolonnegranten), også med en
-- verdi som ellers ville vært gyldig.
select tests.as_user(tests.bruker1());
select throws_ok(
  $$insert into public.reports (author_id, description, location, category) values ('10000000-0000-4000-8000-000000000003', 'Forfalsket', 'Bygg A', 'other')$$,
  '42501', null, 'author_id kan ikke settes (heller ikke til en annen bruker)'
);
select throws_ok(
  $$insert into public.reports (author_id, description, location, category) values ('10000000-0000-4000-8000-000000000002', 'Forfalsket', 'Bygg A', 'other')$$,
  '42501', null, 'author_id kan ikke settes (heller ikke til egen id)'
);
select throws_ok(
  $$insert into public.reports (description, location, category, status) values ('Forfalsket', 'Bygg A', 'other', 'resolved')$$,
  '42501', null, 'status kan ikke settes'
);
select throws_ok(
  $$insert into public.reports (description, location, category, hidden) values ('Forfalsket', 'Bygg A', 'other', true)$$,
  '42501', null, 'hidden kan ikke settes'
);
select throws_ok(
  $$insert into public.reports (description, location, category, created_at) values ('Forfalsket', 'Bygg A', 'other', now() - interval '1 year')$$,
  '42501', null, 'created_at kan ikke settes'
);
select throws_ok(
  $$insert into public.reports (description, location, category, status_changed_at) values ('Forfalsket', 'Bygg A', 'other', now() - interval '1 year')$$,
  '42501', null, 'status_changed_at kan ikke settes'
);
select tests.as_user(tests.moderator());
select throws_ok(
  $$insert into public.reports (description, location, category, status) values ('Forfalsket', 'Bygg A', 'other', 'resolved')$$,
  '42501', null, 'moderator: status kan heller ikke settes ved INSERT'
);

-- CHECK-reglene gjelder også for brukerens INSERT, med samme telling som
-- lib/limits.ts (kodepunkter).
select tests.as_user(tests.bruker1());
select throws_ok(
  $$insert into public.reports (description, location, category) values (repeat('a', 1001), 'Bygg A', 'other')$$,
  '23514', null, 'description på 1001 tegn avvises'
);
select lives_ok(
  $$insert into public.reports (description, location, category) values (repeat('a', 1000), 'Bygg A', 'other')$$,
  'description på 1000 tegn godtas'
);
select throws_ok(
  $$insert into public.reports (description, location, category) values (repeat('😀', 1001), 'Bygg A', 'other')$$,
  '23514', null, 'description med 1001 emoji avvises'
);
select lives_ok(
  $$insert into public.reports (description, location, category) values (repeat('😀', 1000), 'Bygg A', 'other')$$,
  'description med 1000 emoji godtas'
);
select throws_ok(
  $$insert into public.reports (description, location, category) values ('   ', 'Bygg A', 'other')$$,
  '23514', null, 'description med bare mellomrom avvises'
);
select throws_ok(
  $$insert into public.reports (description, location, category) values ('Hull', repeat('a', 201), 'other')$$,
  '23514', null, 'location på 201 tegn avvises'
);
select lives_ok(
  $$insert into public.reports (description, location, category) values ('Hull', repeat('a', 200), 'other')$$,
  'location på 200 tegn godtas'
);
select throws_ok(
  $$insert into public.reports (description, location, category) values ('Hull', '   ', 'other')$$,
  '23514', null, 'location med bare mellomrom avvises'
);
select throws_ok(
  $$insert into public.reports (description, location, category) values ('Hull', 'Bygg A', 'ukjent')$$,
  '22P02', null, 'ugyldig kategori avvises av enumen'
);
select throws_ok(
  $$insert into public.reports (description, location, category) values (null, 'Bygg A', 'other')$$,
  '23502', null, 'description kan ikke være NULL'
);

select * from finish();
rollback;
