-- Faste, oppdiktede testdata for lokal utvikling og testene (Story 1.3).
-- Kjøres som postgres av `npx supabase db reset`. Alle uuid-er og tidspunkter
-- er faste, så rekkefølgen og «sist oppdatert» er de samme etter hver reset
-- (AD-11). Ingen personopplysninger: kontoene og tekstene er oppdiktet.
--
-- Kontoene står også i README («Testbrukere»), og
-- lib/supabase/seed-login.db.test.ts logger inn med hver av dem.
-- Alle har passordet localfix-test.

-- Kontoene. Profilen lages av triggeren on_auth_user_created med role = 'user'.
-- confirmation_token, recovery_token, email_change_token_new og email_change
-- har ingen standardverdi og må være '', ellers feiler innloggingen.
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
select
  '00000000-0000-0000-0000-000000000000',
  u.id,
  'authenticated',
  'authenticated',
  u.email,
  extensions.crypt('localfix-test', extensions.gen_salt('bf')),
  u.created_at,
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  u.created_at,
  u.created_at,
  '',
  '',
  '',
  ''
from (
  values
    ('10000000-0000-4000-8000-000000000001'::uuid, 'moderator@localfix.test', '2026-10-01T08:00:00Z'::timestamptz),
    ('10000000-0000-4000-8000-000000000002'::uuid, 'bruker1@localfix.test', '2026-10-01T08:05:00Z'::timestamptz),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'bruker2@localfix.test', '2026-10-01T08:10:00Z'::timestamptz),
    -- Satt av til kjerneflyttesten, én per Playwright-prosjekt (endrer-360 og
    -- endrer-1280). De har ingen rapporter eller bekreftelser i seed.
    ('10000000-0000-4000-8000-000000000004'::uuid, 'kjerneflyt360@localfix.test', '2026-10-01T08:15:00Z'::timestamptz),
    ('10000000-0000-4000-8000-000000000005'::uuid, 'kjerneflyt1280@localfix.test', '2026-10-01T08:20:00Z'::timestamptz)
) as u (id, email, created_at);

insert into auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  u.id::text,
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email',
  u.created_at,
  u.created_at,
  u.created_at
from auth.users u
where u.email like '%@localfix.test';

-- Rolle settes bare med SQL som postgres (AD-12).
update public.profiles
set role = 'moderator'
where id = '10000000-0000-4000-8000-000000000001';

-- Rapportene: alle kategorier og statuser, én skjult (rapport 7).
-- status_changed_at = created_at for status new, ellers senere.
-- Rapport 5 har linjeskift, en lang URL uten mellomrom og HTML-lignende tekst,
-- som alltid skal vises som ren tekst. Den har ingen oppsummering, så lista
-- viser selve beskrivelsen (Story 1.4).
-- Rapport 2, 3 og 7 (skjult) har bilde (Story 1.6). image_path er lik
-- objektnavnet i bucketen report-images, som CLI-en laster opp fra
-- supabase/seed-images/ (kilder i supabase/KILDER-seed-images.md).
insert into public.reports (
  id,
  author_id,
  description,
  location,
  category,
  summary,
  image_path,
  status,
  hidden,
  created_at,
  status_changed_at
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000002',
    'Søppelkassen ved hovedinngangen er full, og det ligger poser og pappkrus på bakken rundt den.',
    'Hovedinngangen, bygg A',
    'waste',
    'Full søppelkasse ved hovedinngangen',
    null,
    'new',
    false,
    '2026-10-20T08:15:00Z',
    '2026-10-20T08:15:00Z'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000003',
    'To gatelys langs gangveien mot studentboligene er slukket. Det er helt mørkt der om kvelden.',
    'Gangveien mot studentboligene',
    'lighting',
    'Slukkede gatelys på gangveien',
    '10000000-0000-4000-8000-000000000003/30000000-0000-4000-8000-000000000002.jpg',
    'in_progress',
    false,
    '2026-10-21T17:40:00Z',
    '2026-10-23T09:00:00Z'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000002',
    'Stort hull i asfalten ved innkjøringen til parkeringsplassen. Bilene må svinge rundt det.',
    'Innkjøringen til parkeringsplass P2',
    'roads_sidewalks',
    'Hull i asfalten ved P2',
    '10000000-0000-4000-8000-000000000002/30000000-0000-4000-8000-000000000003.jpg',
    'resolved',
    false,
    '2026-10-22T07:30:00Z',
    '2026-10-29T13:10:00Z'
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    '10000000-0000-4000-8000-000000000003',
    'Noen har tagget ned veggen på sykkelskuret med svart spraymaling.',
    'Sykkelskuret ved bygg B',
    'vandalism',
    null,
    null,
    'new',
    false,
    '2026-10-24T12:05:00Z',
    '2026-10-24T12:05:00Z'
  ),
  (
    '20000000-0000-4000-8000-000000000005',
    '10000000-0000-4000-8000-000000000002',
    E'Det lekker vann fra taket i gangen utenfor rom 214.\nDet drypper ned på gulvet hver gang det regner, og gulvet blir glatt.\n\nKart: https://campus.localfix.test/kart/bygg-a/etasje-2/rom-214?visning=plantegning&markering=vannlekkasje-i-taket&kilde=localfix-testdata-uten-mellomrom\n\nTesttekst som skal vises som ren tekst: <b>fet</b> <script>alert(1)</script>',
    'Gangen utenfor rom 214, bygg A',
    'other',
    null,
    null,
    'in_progress',
    false,
    '2026-10-26T10:00:00Z',
    '2026-10-27T08:30:00Z'
  ),
  (
    '20000000-0000-4000-8000-000000000006',
    '10000000-0000-4000-8000-000000000003',
    'Det ligger glasskår fra en knust flaske rundt benkene på uteområdet.',
    'Benkene på uteområdet ved kantina',
    'waste',
    'Glasskår ved benkene',
    null,
    'resolved',
    false,
    '2026-10-27T15:20:00Z',
    '2026-10-30T11:00:00Z'
  ),
  (
    '20000000-0000-4000-8000-000000000007',
    '10000000-0000-4000-8000-000000000002',
    'Lyset i trappeoppgangen blinker hele tiden og slukker innimellom.',
    'Trappeoppgangen i bygg C',
    'lighting',
    'Blinkende lys i trappa',
    '10000000-0000-4000-8000-000000000002/30000000-0000-4000-8000-000000000007.jpg',
    'new',
    true,
    '2026-10-30T19:45:00Z',
    '2026-10-30T19:45:00Z'
  ),
  (
    '20000000-0000-4000-8000-000000000008',
    '10000000-0000-4000-8000-000000000003',
    'Fortauet langs bygg B er dekket av is og har ikke blitt strødd. Flere har nesten falt.',
    'Fortauet langs bygg B',
    'roads_sidewalks',
    'Glatt og ustrødd fortau langs bygg B',
    null,
    'in_progress',
    false,
    '2026-11-02T07:10:00Z',
    '2026-11-03T12:00:00Z'
  ),
  (
    '20000000-0000-4000-8000-000000000009',
    '10000000-0000-4000-8000-000000000003',
    'Skiltet som viser vei til biblioteket har falt ned og ligger i grøfta.',
    'Krysset ved biblioteket',
    'other',
    null,
    null,
    'new',
    false,
    '2026-11-05T09:45:00Z',
    '2026-11-05T09:45:00Z'
  );

-- Bekreftelsene. Ingen bekrefter sin egen rapport. Rapport 1 og 2 er synlige
-- og har like mange bekreftelser (2), så sorteringen etter bekreftelser må
-- bruke created_at som neste nøkkel (Story 3.1). Rapport 7 er skjult og har
-- én bekreftelse, så testene kan sjekke at den ikke lekker.
insert into public.confirmations (report_id, user_id, created_at)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', '2026-10-20T12:00:00Z'),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '2026-10-21T09:30:00Z'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '2026-10-22T08:00:00Z'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '2026-10-22T10:15:00Z'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', '2026-10-23T14:00:00Z'),
  ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000002', '2026-10-28T07:50:00Z'),
  ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000003', '2026-10-31T08:00:00Z');
