alter table public.quotes add column if not exists won_at timestamptz;
update public.quotes set won_at = updated_at where status = 'Won' and won_at is null;
create index if not exists quotes_user_won_at_idx on public.quotes(user_id, won_at) where status = 'Won';

create or replace function public.set_quote_won_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if new.status = 'Won' and old.status is distinct from 'Won' then new.won_at = now(); end if;
  if new.status is distinct from 'Won' then new.won_at = null; end if;
  return new;
end;
$$;
drop trigger if exists quotes_set_won_at on public.quotes;
create trigger quotes_set_won_at before update of status on public.quotes for each row execute function public.set_quote_won_at();
revoke all on function public.set_quote_won_at() from public, anon, authenticated;

create or replace function public.dashboard_metrics(today_date date default current_date)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'active_count', count(*) filter (where status not in ('Won','Lost')),
    'due_count', count(*) filter (where status not in ('Won','Lost') and next_follow_up_date = today_date),
    'overdue_count', count(*) filter (where status not in ('Won','Lost') and next_follow_up_date < today_date),
    'pending_value', coalesce(sum(value_pence) filter (where status not in ('Won','Lost')), 0),
    'won_month_value', coalesce(sum(value_pence) filter (where status = 'Won' and won_at >= date_trunc('month', today_date::timestamp)), 0),
    'won_month_count', count(*) filter (where status = 'Won' and won_at >= date_trunc('month', today_date::timestamp)),
    'won_count', count(*) filter (where status = 'Won'),
    'decided_count', count(*) filter (where status in ('Won','Lost'))
  ) from public.quotes where user_id = (select auth.uid());
$$;
revoke all on function public.dashboard_metrics(date) from public, anon;
grant execute on function public.dashboard_metrics(date) to authenticated;

create or replace function public.report_metrics()
returns jsonb language sql stable security invoker set search_path = '' as $$
  with totals as (
    select count(*) total_quotes, coalesce(sum(value_pence),0) total_value,
      coalesce(sum(value_pence) filter (where status='Won'),0) won_value,
      count(*) filter (where status='Won') won_count,
      count(*) filter (where status in ('Won','Lost')) decided_count
    from public.quotes where user_id=(select auth.uid())
  ), monthly as (
    select to_char(date_trunc('month',won_at),'YYYY-MM') as month_key, sum(value_pence) as value_pence
    from public.quotes where user_id=(select auth.uid()) and status='Won' and won_at is not null
    group by date_trunc('month',won_at) order by date_trunc('month',won_at) desc limit 12
  )
  select jsonb_build_object('total_quotes',totals.total_quotes,'total_value',totals.total_value,
    'won_value',totals.won_value,'won_count',totals.won_count,'decided_count',totals.decided_count,
    'months',coalesce((select jsonb_agg(jsonb_build_object('month',month_key,'value_pence',value_pence) order by month_key) from monthly),'[]'::jsonb))
  from totals;
$$;
revoke all on function public.report_metrics() from public, anon;
grant execute on function public.report_metrics() to authenticated;
