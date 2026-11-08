-- Datamodellen for LocalFix (Story 1.3): tabellene profiles, reports og
-- confirmations, lesereglene og visningen reports_with_counts.
-- Navn og regler: AD-4, AD-5, AD-10, AD-12 og AD-14 i arkitekturen.
--
-- Denne migreringen gir bare lesing. Skriveregler og skrivegrants (INSERT på
-- reports og confirmations, UPDATE av status og hidden, triggeren
-- reports_guard_update) kommer i Epic 2–4.
--
-- Supabase gir anon og authenticated alle rettigheter på nye tabeller og
-- EXECUTE på nye funksjoner i public, og Postgres gir EXECUTE til PUBLIC på
-- alle nye funksjoner. Derfor tilbakekalles alt eksplisitt før de nødvendige
-- grantene gis.

-- Skjemaet for hjelpefunksjoner. PostgREST eksponerer bare public, så
-- funksjonene her kan ikke kalles via REST (AD-14).
create schema private;
revoke all on schema private from public, anon, authenticated;
-- authenticated får USAGE på private (se is_moderator under), så nye
-- funksjoner her skal ikke få EXECUTE til PUBLIC automatisk. Hver funksjon
-- som skal kunne kalles, får en eksplisitt grant. Postgres gir EXECUTE til
-- PUBLIC som global standard, og den kan ikke tilbakekalles per skjema
-- (ALTER DEFAULT PRIVILEGES IN SCHEMA kan bare oppheve en grant per skjema).
-- Derfor tilbakekalles den globalt for funksjoner postgres lager. Supabase
-- sine egne standardgrants per skjema (public, storage og andre) gjelder
-- fortsatt. vakter.sql sjekker uansett hver funksjon i private.
alter default privileges for role postgres revoke execute on functions from public;

-- Enumene (AD-10). Rekkefølgen i report_status er en del av kontrakten.
create type public.user_role as enum ('user', 'moderator');
create type public.report_category as enum ('waste', 'lighting', 'roads_sidewalks', 'vandalism', 'other');
create type public.report_status as enum ('new', 'in_progress', 'resolved');

-- profiles: én rad per bruker, opprettet bare av private.handle_new_user.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete restrict,
  role public.user_role not null default 'user'
);

alter table public.profiles enable row level security;
revoke all on table public.profiles from anon, authenticated;

-- reports. summary og image_path er de eneste kolonnene som kan være NULL, og
-- de lagrer NULL i stedet for tom streng (AD-4). Standardverdiene følger AD-12.
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  description text not null
    constraint reports_description_check check (description ~ '\S' and char_length(description) <= 1000),
  location text not null
    constraint reports_location_check check (location ~ '\S' and char_length(location) <= 200),
  category public.report_category not null,
  summary text
    constraint reports_summary_check check (summary is null or (summary ~ '\S' and char_length(summary) <= 300)),
  image_path text,
  status public.report_status not null default 'new',
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  status_changed_at timestamptz not null default now(),
  constraint reports_status_changed_at_check check (status_changed_at >= created_at)
);

alter table public.reports enable row level security;
revoke all on table public.reports from anon, authenticated;

-- confirmations: én bekreftelse per bruker og rapport.
create table public.confirmations (
  report_id uuid not null references public.reports (id) on delete restrict,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

alter table public.confirmations enable row level security;
revoke all on table public.confirmations from anon, authenticated;

-- Indeks for oppslaget fra bekreftelsene til brukeren (fremmednøkkelen).
create index confirmations_user_id_idx on public.confirmations (user_id);
create index reports_author_id_idx on public.reports (author_id);

-- Den eneste definisjonen av moderator (AD-14). SECURITY INVOKER: leser
-- brukerens egen rad i profiles under RLS. Rollen leses aldri fra JWT.
create function private.is_moderator()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'moderator'
  );
$$;

revoke all on function private.is_moderator() from public, anon, authenticated;
-- Policyene TO authenticated kaller funksjonen med brukerens rettigheter.
-- anon har ingen policy som kaller den, og får derfor ingen tilgang.
grant usage on schema private to authenticated;
grant execute on function private.is_moderator() to authenticated;

-- Oppretter profilen når en konto lages i auth.users. Den eneste
-- SECURITY DEFINER-funksjonen (AD-4): rollen er hardkodet til 'user', og
-- raw_user_meta_data og raw_app_meta_data leses aldri.
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'user');
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function private.handle_new_user();

-- Lesegrants og policyer (AD-12, AD-14). Policyene navngir alltid rollen.
grant select on table public.profiles to authenticated;

create policy "profiles: authenticated leser egen rad"
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

grant select on table public.reports to anon, authenticated;

create policy "reports: anon leser synlige"
  on public.reports
  for select
  to anon
  using (hidden = false);

create policy "reports: authenticated leser synlige, moderator alle"
  on public.reports
  for select
  to authenticated
  using (hidden = false or (select private.is_moderator()));

grant select on table public.confirmations to anon, authenticated;

create policy "confirmations: anon leser til synlige rapporter"
  on public.confirmations
  for select
  to anon
  using (
    exists (
      select 1
      from public.reports r
      where r.id = confirmations.report_id
        and r.hidden = false
    )
  );

create policy "confirmations: authenticated leser til synlige rapporter, moderator alle"
  on public.confirmations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.reports r
      where r.id = confirmations.report_id
        and (r.hidden = false or (select private.is_moderator()))
    )
  );

-- Visningen som lista og detaljsiden leser fra (AD-5). security_invoker gjør
-- at RLS på reports og confirmations gjelder for den som leser. Uttrykkene
-- garanterer at de fire tilleggskolonnene aldri er NULL. Lages på nytt i
-- samme migrering som endrer reports.
create view public.reports_with_counts
with (security_invoker = true)
as
select
  r.id,
  r.author_id,
  r.description,
  r.location,
  r.category,
  r.summary,
  r.image_path,
  r.status,
  r.hidden,
  r.created_at,
  r.status_changed_at,
  count(c.user_id)::integer as confirmation_count,
  (count(c.user_id) + 1)::integer as seen_count,
  coalesce(bool_or(c.user_id = (select auth.uid())), false) as confirmed_by_me,
  coalesce(r.author_id = (select auth.uid()), false) as authored_by_me
from public.reports r
left join public.confirmations c on c.report_id = r.id
group by r.id;

revoke all on table public.reports_with_counts from anon, authenticated;
grant select on table public.reports_with_counts to anon, authenticated;
