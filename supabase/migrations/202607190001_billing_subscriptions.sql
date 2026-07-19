create table if not exists public.billing_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  stripe_subscription_id text unique,
  status text not null default 'incomplete' check (status in ('active','trialing','past_due','unpaid','canceled','incomplete','incomplete_expired','paused')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists billing_subscriptions_status_idx on public.billing_subscriptions(status);
alter table public.billing_subscriptions enable row level security;
drop policy if exists billing_subscriptions_own_select on public.billing_subscriptions;
create policy billing_subscriptions_own_select on public.billing_subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);
revoke all on public.billing_subscriptions from anon, authenticated;
grant select on public.billing_subscriptions to authenticated;

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);
alter table public.stripe_webhook_events enable row level security;
drop policy if exists stripe_webhook_events_deny_clients on public.stripe_webhook_events;
create policy stripe_webhook_events_deny_clients on public.stripe_webhook_events for all to authenticated
  using (false) with check (false);
revoke all on public.stripe_webhook_events from anon, authenticated;

drop trigger if exists billing_subscriptions_updated on public.billing_subscriptions;
create trigger billing_subscriptions_updated before update on public.billing_subscriptions
for each row execute function public.set_updated_at();
