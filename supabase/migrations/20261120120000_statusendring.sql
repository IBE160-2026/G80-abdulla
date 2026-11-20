-- Statusendring og skjuling (Story 4.1, FR-8, FR-9, AD-12, AD-14, AR-7): bare
-- moderatoren kan endre en rapport, og bare kolonnene status og hidden.
-- Statusen flyttes ett steg om gangen, fram eller tilbake, og
-- status_changed_at settes av databasen når statusen endres. Migreringen
-- dekker også skjuling (Story 4.2), så den trenger ingen ny regel her.
--
-- UPDATE gis som kolonnegrant bare på status og hidden. status_changed_at,
-- teksten, forfatteren og tidspunktene kan ikke settes av noen klient, og et
-- forsøk gir 42501 fra granten. Ingen DELETE eller TRUNCATE. anon får ingen
-- UPDATE.
--
-- Policyen lar authenticated oppdatere rader brukeren kan se (USING som
-- SELECT-policyen), og bare moderatoren slipper gjennom WITH CHECK. Triggeren
-- reports_guard_update kjører før WITH CHECK og sjekker tilgangen først, så en
-- vanlig bruker får 42501 (403 via REST) før invalid_column_change eller
-- invalid_status_step, og reglene lekker ikke til andre enn moderatoren.

grant update (status, hidden)
  on table public.reports
  to authenticated;

create policy "reports: authenticated oppdaterer synlige, moderator"
  on public.reports
  for update
  to authenticated
  using (hidden = false or (select private.is_moderator()))
  with check ((select private.is_moderator()));

-- Vokter alle oppdateringer fra API-rollene (anon og authenticated), i denne
-- rekkefølgen:
--   1. ikke moderator: 42501
--   2. noe annet enn status og hidden er endret: invalid_column_change
--   3. statusen er endret med mer enn ett steg i enum-rekkefølgen
--      (new, in_progress, resolved): invalid_status_step
--   4. statusen er endret: status_changed_at := now()
-- Uendret status er lov, også en tom oppdatering, og da står
-- status_changed_at stille. Egne feil kastes med ERRCODE P0001 og koden i
-- MESSAGE, som shared/lib/errors.ts oversetter.
--
-- Andre roller (postgres, service_role) slipper gjennom: de omgår RLS uansett,
-- og supabase/tests/begrensninger.sql tester CHECK-regelen på
-- status_changed_at som postgres. SECURITY INVOKER: is_moderator() leser
-- brukerens egen rad i profiles under RLS. En triggerfunksjon trenger ingen
-- EXECUTE-grant for å kjøre, så alle rettigheter tilbakekalles.
create function private.reports_guard_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  statuses public.report_status[] := enum_range(null::public.report_status);
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;

  if not private.is_moderator() then
    raise exception using errcode = '42501', message = 'forbidden';
  end if;

  if (to_jsonb(new) - 'status' - 'hidden') is distinct from (to_jsonb(old) - 'status' - 'hidden') then
    raise exception using errcode = 'P0001', message = 'invalid_column_change';
  end if;

  if new.status is distinct from old.status then
    if abs(array_position(statuses, new.status) - array_position(statuses, old.status)) <> 1 then
      raise exception using errcode = 'P0001', message = 'invalid_status_step';
    end if;
    new.status_changed_at := now();
  end if;

  return new;
end;
$$;

revoke all on function private.reports_guard_update() from public, anon, authenticated;

create trigger reports_guard_update
  before update on public.reports
  for each row
  execute function private.reports_guard_update();
