-- Ingen skriving fra klienten i Story 1.3 (AD-12): anon og authenticated får
-- 42501 på INSERT, UPDATE, DELETE og TRUNCATE på alle tabellene, også
-- moderatoren. Skrivereglene kommer i Epic 2–4, og da endres denne fila.
begin;
\ir hjelpere.psql

select plan(37);

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
    'reports_with_counts anon SELECT',
    'reports_with_counts authenticated SELECT'
  ],
  'anon og authenticated har bare lesegrantene i AD-12'
);

-- Setningene kjøres som rollen i hver blokk. Rettigheten sjekkes før
-- verdiene, så DEFAULT VALUES er nok til å treffe 42501.
create temporary table skrivesetninger (sql text not null);
insert into skrivesetninger (sql)
select format(s.mal, t.tabell)
from (values ('public.profiles'), ('public.reports'), ('public.confirmations')) as t (tabell)
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
grant select on skrivesetninger to anon, authenticated;

select tests.as_anon();
select throws_ok(sql, '42501', null, 'anon: ' || sql) from skrivesetninger;

select tests.as_user(tests.bruker1());
select throws_ok(sql, '42501', null, 'bruker: ' || sql) from skrivesetninger;

select tests.as_user(tests.moderator());
select throws_ok(sql, '42501', null, 'moderator: ' || sql) from skrivesetninger;

select * from finish();
rollback;
