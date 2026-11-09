-- Bildereglene (Story 1.6, AD-6, AD-9, AD-14): hvem kan lese, laste opp,
-- overskrive og slette objekter i bucketen report-images, CHECK og UNIQUE på
-- reports.image_path, og at seed-bildene og bucketen er satt opp.
--
-- Bucketen og objektene lages av Supabase CLI via Storage etter migreringene
-- og seed.sql (`db reset`), så denne fila må kjøres etter en reset.
--
-- Testene leser storage.objects direkte, som Storage gjør med rollen og
-- JWT-en til den som spør. Vitest-testen lib/supabase/storage.db.test.ts
-- tester createSignedUrl gjennom selve Storage-tjenesten.
begin;
\ir hjelpere.psql

select plan(36);

-- Objektnavnene til seed-bildene (lik reports.image_path i seed.sql).
-- Rapport 2 (bruker2) og 3 (bruker1) er synlige, rapport 7 (bruker1) er skjult.
create function tests.bilde(rapport int) returns text language sql immutable
as $$
  select case rapport
    when 2 then '10000000-0000-4000-8000-000000000003/30000000-0000-4000-8000-000000000002.jpg'
    when 3 then '10000000-0000-4000-8000-000000000002/30000000-0000-4000-8000-000000000003.jpg'
    when 7 then '10000000-0000-4000-8000-000000000002/30000000-0000-4000-8000-000000000007.jpg'
  end
$$;

-- Kjører en UPDATE eller DELETE og gir antall rader som ble endret. RLS gir
-- 0 rader uten feil når ingen policy tillater endringen.
create function tests.endrede_rader(sql text) returns int language plpgsql
as $$
declare
  n int;
begin
  execute sql;
  get diagnostics n = row_count;
  return n;
end;
$$;

grant execute on function tests.bilde(int), tests.endrede_rader(text) to anon, authenticated;

-- Storage tillater bare DELETE i storage.objects når denne innstillingen er
-- satt, slik Storage-tjenesten gjør selv. Uten den ville triggeren
-- protect_objects_delete avvist slettingen før policyene ble prøvd.
select set_config('storage.allow_delete_query', 'true', true);

-- Bucketen og seed-bildene (som postgres)
select results_eq(
  $$select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'report-images'$$,
  $$values (false, 5242880::bigint, array['image/jpeg', 'image/png', 'image/webp'])$$,
  'bucketen report-images er privat, høyst 5 MiB, JPEG, PNG og WebP'
);
select set_eq(
  $$select name from storage.objects where bucket_id = 'report-images'$$,
  $$select image_path from public.reports where image_path is not null$$,
  'objektene i report-images er nøyaktig bildene seed-rapportene peker på'
);
select set_eq(
  $$select image_path from public.reports where image_path is not null$$,
  array[tests.bilde(2), tests.bilde(3), tests.bilde(7)],
  'rapport 2, 3 og 7 har bilde i seed'
);
select is(
  (select hidden from public.reports where id = tests.skjult_rapport()),
  true,
  'kontroll: rapport 7 er skjult'
);

-- Besøkende
select tests.as_anon();
select lives_ok(
  $$select count(*) from storage.objects where bucket_id = 'report-images'$$,
  'anon: oppslaget i storage.objects gir ingen feil når en skjult rapport finnes (AD-14)'
);
select set_eq(
  $$select name from storage.objects where bucket_id = 'report-images'$$,
  array[tests.bilde(2), tests.bilde(3)],
  'anon: leser nøyaktig bildene til de synlige rapportene'
);
select is_empty(
  format($$select name from storage.objects where bucket_id = 'report-images' and name = %L$$, tests.bilde(7)),
  'anon: bildet til den skjulte rapporten er ikke synlig'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('report-images', '10000000-0000-4000-8000-000000000002/40000000-0000-4000-8000-000000000001.jpg')$$,
  '42501',
  null,
  'anon: kan ikke laste opp i en brukers mappe'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('report-images', '40000000-0000-4000-8000-000000000002.jpg')$$,
  '42501',
  null,
  'anon: kan ikke laste opp utenfor en mappe'
);
select is(
  tests.endrede_rader($$update storage.objects set user_metadata = '{"endret": true}' where bucket_id = 'report-images'$$),
  0,
  'anon: kan ikke overskrive seed-bildene'
);
select is(
  tests.endrede_rader($$delete from storage.objects where bucket_id = 'report-images'$$),
  0,
  'anon: kan ikke slette seed-bildene'
);

-- Bruker1 er forfatter av rapport 3 og den skjulte rapport 7
select tests.as_user(tests.bruker1());
select set_eq(
  $$select name from storage.objects where bucket_id = 'report-images'$$,
  array[tests.bilde(2), tests.bilde(3)],
  'bruker1: leser nøyaktig bildene til de synlige rapportene'
);
select is_empty(
  format($$select name from storage.objects where bucket_id = 'report-images' and name = %L$$, tests.bilde(7)),
  'bruker1: bildet til sin egen skjulte rapport er ikke synlig'
);
select lives_ok(
  $$insert into storage.objects (bucket_id, name) values ('report-images', '10000000-0000-4000-8000-000000000002/40000000-0000-4000-8000-000000000003.jpg')$$,
  'bruker1: kan laste opp i egen mappe'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('report-images', '10000000-0000-4000-8000-000000000003/40000000-0000-4000-8000-000000000004.jpg')$$,
  '42501',
  null,
  'bruker1: kan ikke laste opp i en annens mappe'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('report-images', '40000000-0000-4000-8000-000000000005.jpg')$$,
  '42501',
  null,
  'bruker1: kan ikke laste opp utenfor en mappe'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('annen-bucket', '10000000-0000-4000-8000-000000000002/40000000-0000-4000-8000-000000000006.jpg')$$,
  '42501',
  null,
  'bruker1: kan ikke laste opp i en annen bucket'
);
select is(
  tests.endrede_rader(format($$update storage.objects set user_metadata = '{"endret": true}' where bucket_id = 'report-images' and name = %L$$, tests.bilde(3))),
  0,
  'bruker1: kan ikke overskrive bildet til sin egen rapport'
);
select is(
  tests.endrede_rader($$update storage.objects set user_metadata = '{"endret": true}' where bucket_id = 'report-images'$$),
  0,
  'bruker1: kan ikke overskrive seed-bildene'
);
select is(
  tests.endrede_rader($$delete from storage.objects where bucket_id = 'report-images'$$),
  0,
  'bruker1: kan ikke slette seed-bildene, heller ikke sine egne'
);

-- Bruker2 er forfatter av rapport 2
select tests.as_user(tests.bruker2());
select set_eq(
  $$select name from storage.objects where bucket_id = 'report-images'$$,
  array[tests.bilde(2), tests.bilde(3)],
  'bruker2: leser nøyaktig bildene til de synlige rapportene'
);
select is_empty(
  format($$select name from storage.objects where bucket_id = 'report-images' and name = %L$$, tests.bilde(7)),
  'bruker2: bildet til den skjulte rapporten er ikke synlig'
);

-- Moderator
select tests.as_user(tests.moderator());
select set_eq(
  $$select name from storage.objects where bucket_id = 'report-images'$$,
  array[tests.bilde(2), tests.bilde(3), tests.bilde(7)],
  'moderator: leser bildene til alle rapportene'
);
select isnt_empty(
  format($$select name from storage.objects where bucket_id = 'report-images' and name = %L$$, tests.bilde(7)),
  'moderator: bildet til den skjulte rapporten er synlig'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('report-images', '10000000-0000-4000-8000-000000000002/40000000-0000-4000-8000-000000000007.jpg')$$,
  '42501',
  null,
  'moderator: kan ikke laste opp i en annens mappe'
);
select is(
  tests.endrede_rader($$update storage.objects set user_metadata = '{"endret": true}' where bucket_id = 'report-images'$$),
  0,
  'moderator: kan ikke overskrive seed-bildene'
);
select is(
  tests.endrede_rader($$delete from storage.objects where bucket_id = 'report-images'$$),
  0,
  'moderator: kan ikke slette seed-bildene'
);

-- Kontroll som postgres: seed-bildene er urørt, og opplastingen til bruker1
-- ble lagret.
select tests.as_postgres();
select is(
  (select count(*)::int from storage.objects where bucket_id = 'report-images' and name in (tests.bilde(2), tests.bilde(3), tests.bilde(7)) and not coalesce(user_metadata ? 'endret', false)),
  3,
  'seed-bildene finnes fortsatt og er ikke endret'
);
select is(
  (select count(*)::int from storage.objects where bucket_id = 'report-images' and name = '10000000-0000-4000-8000-000000000002/40000000-0000-4000-8000-000000000003.jpg'),
  1,
  'opplastingen i egen mappe ble lagret'
);

-- CHECK og UNIQUE på reports.image_path (som postgres, siden klienten ikke
-- har INSERT på reports ennå).
create function pg_temp.ny_rapport(author uuid, path text)
returns void
language sql
as $$
  insert into public.reports (author_id, description, location, category, image_path)
  values (author, 'Testrapport med bilde', 'Bygg A', 'other', path);
$$;

select throws_ok(
  format($$select pg_temp.ny_rapport(%L, %L)$$, tests.bruker1(), '10000000-0000-4000-8000-000000000003/40000000-0000-4000-8000-000000000008.jpg'),
  '23514',
  null,
  'image_path i en annens mappe avvises'
);
select throws_ok(
  format($$select pg_temp.ny_rapport(%L, %L)$$, tests.bruker1(), '40000000-0000-4000-8000-000000000009.jpg'),
  '23514',
  null,
  'image_path utenfor en mappe avvises'
);
select throws_ok(
  format($$select pg_temp.ny_rapport(%L, %L)$$, tests.bruker1(), '10000000-0000-4000-8000-000000000002'),
  '23514',
  null,
  'image_path som bare er forfatterens uuid avvises'
);
select throws_ok(
  format($$select pg_temp.ny_rapport(%L, %L)$$, tests.bruker1(), ''),
  '23514',
  null,
  'image_path som tom streng avvises (NULL, ikke tom streng)'
);
select throws_ok(
  format($$select pg_temp.ny_rapport(%L, %L)$$, tests.bruker1(), tests.bilde(3)),
  '23505',
  null,
  'samme image_path på to rapporter avvises'
);
select lives_ok(
  format($$select pg_temp.ny_rapport(%L, %L)$$, tests.bruker1(), '10000000-0000-4000-8000-000000000002/40000000-0000-4000-8000-000000000010.jpg'),
  'image_path i forfatterens egen mappe godtas'
);
select lives_ok(
  format($$select pg_temp.ny_rapport(%L, null)$$, tests.bruker1()),
  'rapport uten bilde (image_path NULL) godtas'
);

select * from finish();
rollback;
