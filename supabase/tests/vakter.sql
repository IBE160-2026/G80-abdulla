-- Vakttester (AD-5, AD-12, AD-14). De sjekker hele skjemaet, så de fanger
-- også tabeller, visninger og funksjoner som senere migreringer legger til.
begin;
\ir hjelpere.psql

select plan(9);

select is_empty(
  $$
    select c.relname
    from pg_class c
    where c.relnamespace = 'public'::regnamespace
      and c.relkind in ('r', 'p')
      and not c.relrowsecurity
  $$,
  'alle tabeller i public har RLS'
);

select is_empty(
  $$
    select c.relname
    from pg_class c
    where c.relnamespace = 'public'::regnamespace
      and c.relkind = 'v'
      and not exists (
        select 1
        from pg_options_to_table(c.reloptions) o
        where o.option_name = 'security_invoker'
          and o.option_value in ('true', 'on', '1', 'yes')
      )
  $$,
  'alle visninger i public har security_invoker = true'
);

-- PUBLIC (grantee 0) gjelder også anon og authenticated.
select is_empty(
  $$
    select c.relname, a.privilege_type
    from pg_class c
    cross join lateral aclexplode(c.relacl) a
    where c.relnamespace = 'public'::regnamespace
      and c.relkind in ('v', 'm')
      and a.grantee in (0, 'anon'::regrole, 'authenticated'::regrole)
      and a.privilege_type <> 'SELECT'
  $$,
  'visningene i public gir anon og authenticated bare SELECT'
);

select is_empty(
  $$
    select c.relname, a.privilege_type
    from pg_class c
    cross join lateral aclexplode(c.relacl) a
    where c.relnamespace = 'public'::regnamespace
      and a.grantee in (0, 'anon'::regrole, 'authenticated'::regrole)
      and a.privilege_type in ('DELETE', 'TRUNCATE')
  $$,
  'ingen tabell eller visning i public har DELETE- eller TRUNCATE-grant til anon eller authenticated'
);

-- Funksjoner i public kan kalles via REST (/rpc). Tillatelseslista er tom
-- nå. En funksjon som skal kunne kalles, føres opp her med begrunnelse.
select is_empty(
  $$
    select p.oid::regprocedure::text
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and (
        has_function_privilege('anon', p.oid, 'EXECUTE')
        or has_function_privilege('authenticated', p.oid, 'EXECUTE')
      )
      and p.oid::regprocedure::text <> all (array[]::text[])
  $$,
  'anon og authenticated kan ikke kjøre funksjoner i public utenom tillatelseslista'
);

select results_eq(
  $$
    select p.oid::regprocedure::text
    from pg_proc p
    where p.pronamespace in ('public'::regnamespace, 'private'::regnamespace)
      and p.prosecdef
  $$,
  $$values ('private.handle_new_user()')$$,
  'handle_new_user er eneste security definer i public og private'
);

select is(
  (select proconfig from pg_proc where oid = 'private.handle_new_user()'::regprocedure),
  array['search_path=""'],
  'handle_new_user har search_path = '''''
);

select ok(
  not has_function_privilege('anon', 'private.handle_new_user()', 'EXECUTE')
    and not has_function_privilege('authenticated', 'private.handle_new_user()', 'EXECUTE'),
  'anon og authenticated kan ikke kjøre handle_new_user'
);

-- Visningen har kolonnene i reports, i samme rekkefølge og med samme type,
-- pluss de fire tilleggskolonnene (AD-5).
select is(
  array(
    select a.attname || ' ' || format_type(a.atttypid, a.atttypmod)
    from pg_attribute a
    where a.attrelid = 'public.reports_with_counts'::regclass
      and a.attnum > 0
      and not a.attisdropped
    order by a.attnum
  ),
  array(
    select a.attname || ' ' || format_type(a.atttypid, a.atttypmod)
    from pg_attribute a
    where a.attrelid = 'public.reports'::regclass
      and a.attnum > 0
      and not a.attisdropped
    order by a.attnum
  ) || array[
    'confirmation_count integer',
    'seen_count integer',
    'confirmed_by_me boolean',
    'authored_by_me boolean'
  ],
  'reports_with_counts = kolonnene i reports + confirmation_count, seen_count, confirmed_by_me, authored_by_me'
);

select * from finish();
rollback;
