-- Rapport 4 får et bilde som ikke finnes, for e2e/reset/bilde-mangler.spec.ts
-- (Story 1.7). Stien ligger i mappen til forfatteren (…0003), så den
-- oppfyller reports_image_path_check, men det finnes ikke noe objekt med det
-- navnet i bucketen report-images. Kjøres som postgres med
-- `npx supabase db query --local --file`. `db reset` i afterAll fjerner
-- endringen. Endrer aldri supabase/seed.sql.
update public.reports
set image_path = '10000000-0000-4000-8000-000000000003/30000000-0000-4000-8000-0000000000ff.jpg'
where id = '20000000-0000-4000-8000-000000000004';
