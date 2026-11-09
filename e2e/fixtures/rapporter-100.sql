-- 100 ekstra synlige rapporter for e2e/reset/liste.spec.ts (Story 1.4).
-- Kjøres som postgres med `npx supabase db query --local --file` etter
-- `db reset`. Rapportene er eldre enn seed-rapportene, så seed-rapportene
-- står fortsatt øverst. Endrer aldri supabase/seed.sql.
insert into public.reports (
  author_id,
  description,
  location,
  category,
  summary,
  status,
  created_at,
  status_changed_at
)
select
  '10000000-0000-4000-8000-000000000002',
  'Testrapport nummer ' || n || ' fra fixturen med 100 rapporter.',
  'Testområde ' || n,
  (enum_range(null::public.report_category))[
    1 + n % array_length(enum_range(null::public.report_category), 1)
  ],
  case when n % 2 = 0 then 'Testrapport nummer ' || n end,
  'new',
  t.created_at,
  t.created_at
from generate_series(1, 100) as n,
  lateral (select timestamptz '2026-09-01T00:00:00Z' - n * interval '1 minute') as t (created_at);
