create table if not exists public.analytics_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  consent text not null check (consent in ('granted', 'denied')),
  updated_at timestamptz not null default now()
);

create table if not exists public.analytics_event_claims (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null,
  claimed_at timestamptz not null default now(),
  primary key (user_id, event_name)
);

alter table public.analytics_preferences enable row level security;
alter table public.analytics_event_claims enable row level security;

create policy "No direct user access to analytics claims" on public.analytics_event_claims
  for all to authenticated using (false) with check (false);

create policy "Users manage their analytics preference" on public.analytics_preferences
  for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.analytics_event_claims from anon, authenticated;
grant select, insert, update on public.analytics_preferences to authenticated;
grant all on public.analytics_preferences, public.analytics_event_claims to service_role;
