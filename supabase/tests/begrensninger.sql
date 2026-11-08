-- Begrensningene i datamodellen (AD-4): CHECK på tekst og lengde, at
-- handle_new_user alltid gir role = 'user', og ON DELETE RESTRICT.
-- Kjøres som postgres, siden klienten ikke har skrivegrants ennå.
begin;
\ir hjelpere.psql

select plan(14);

-- Setter inn en rapport fra bruker1 med gitt beskrivelse, sted og sammendrag.
create function pg_temp.ny_rapport(description text, location text, summary text)
returns void
language sql
as $$
  insert into public.reports (author_id, description, location, category, summary)
  values ('10000000-0000-4000-8000-000000000002', description, location, 'other', summary);
$$;

-- Tom eller for lang tekst
select throws_ok($$select pg_temp.ny_rapport('', 'Bygg A', null)$$, '23514', null, 'description tom avvises');
select throws_ok($$select pg_temp.ny_rapport('   ', 'Bygg A', null)$$, '23514', null, 'description med bare mellomrom avvises');
select throws_ok($$select pg_temp.ny_rapport(repeat('a', 1001), 'Bygg A', null)$$, '23514', null, 'description på 1001 tegn avvises');
select lives_ok($$select pg_temp.ny_rapport(repeat('a', 1000), 'Bygg A', null)$$, 'description på 1000 tegn godtas');
select throws_ok($$select pg_temp.ny_rapport('Hull i veien', '', null)$$, '23514', null, 'location tom avvises');
select throws_ok($$select pg_temp.ny_rapport('Hull i veien', repeat('a', 201), null)$$, '23514', null, 'location på 201 tegn avvises');
select throws_ok($$select pg_temp.ny_rapport('Hull i veien', 'Bygg A', '')$$, '23514', null, 'summary tom avvises (NULL, ikke tom streng)');
select throws_ok($$select pg_temp.ny_rapport('Hull i veien', 'Bygg A', repeat('a', 301))$$, '23514', null, 'summary på 301 tegn avvises');

-- Grensen telles i tegn (kodepunkter), ikke byte eller UTF-16-enheter, som
-- [...s].length i lib/limits.ts.
select lives_ok($$select pg_temp.ny_rapport(repeat('😀', 1000), 'Bygg A', null)$$, 'description med 1000 emoji godtas');
select throws_ok($$select pg_temp.ny_rapport(repeat('😀', 1001), 'Bygg A', null)$$, '23514', null, 'description med 1001 emoji avvises');

select throws_ok(
  $$update public.reports set status_changed_at = created_at - interval '1 second' where id = '20000000-0000-4000-8000-000000000003'$$,
  '23514',
  null,
  'status_changed_at før created_at avvises'
);

-- Ny konto med falsk rolle i metadata får likevel role = 'user'.
insert into auth.users (instance_id, id, aud, role, email, raw_user_meta_data, raw_app_meta_data)
values (
  '00000000-0000-0000-0000-000000000000',
  '10000000-0000-4000-8000-0000000000ff',
  'authenticated',
  'authenticated',
  'falsk-moderator@localfix.test',
  '{"role":"moderator"}',
  '{"provider":"email","providers":["email"],"role":"moderator"}'
);
select is(
  (select role::text from public.profiles where id = '10000000-0000-4000-8000-0000000000ff'),
  'user',
  'ny konto med role i metadata får role = user'
);

-- Ingen sletting: en bruker med rapporter kan ikke slettes.
select throws_ok(
  $$delete from auth.users where id = '10000000-0000-4000-8000-000000000002'$$,
  '23503',
  null,
  'sletting av en bruker med rapporter avvises (ON DELETE RESTRICT)'
);
select throws_ok(
  $$delete from public.reports where id = '20000000-0000-4000-8000-000000000001'$$,
  '23503',
  null,
  'sletting av en rapport med bekreftelser avvises (ON DELETE RESTRICT)'
);

select * from finish();
rollback;
