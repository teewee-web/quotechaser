create table if not exists public.quote_delivery_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade,
  channel text not null check (channel in ('download','email','whatsapp','share','print')),
  created_at timestamptz not null default now()
);
create index if not exists quote_delivery_events_user_quote_idx on public.quote_delivery_events(user_id, quote_id, created_at desc);
create index if not exists quote_delivery_events_quote_id_idx on public.quote_delivery_events(quote_id);
alter table public.quote_delivery_events enable row level security;
drop policy if exists quote_delivery_events_own_all on public.quote_delivery_events;
create policy quote_delivery_events_own_all on public.quote_delivery_events for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and exists (
    select 1 from public.quotes q where q.id = quote_id and q.user_id = (select auth.uid())
  ));
revoke all on public.quote_delivery_events from anon;
grant select, insert, delete on public.quote_delivery_events to authenticated;

create or replace function public.save_quote_transaction(
  p_quote jsonb,
  p_items jsonb,
  p_quote_id uuid default null,
  p_customer jsonb default null
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_quote_id uuid := p_quote_id;
  v_customer_id uuid;
  v_customer_created boolean := false;
  v_item jsonb;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 100 then
    raise exception 'Use between 1 and 100 quote items';
  end if;

  if p_customer is not null then
    insert into public.customers(user_id,name,mobile,email,address,notes)
    values(v_user, trim(p_customer->>'name'), nullif(trim(p_customer->>'mobile'),''), nullif(trim(p_customer->>'email'),''), nullif(trim(p_customer->>'address'),''), null)
    returning id into v_customer_id;
    v_customer_created := true;
  else
    v_customer_id := (p_quote->>'customer_id')::uuid;
    if not exists(select 1 from public.customers where id=v_customer_id and user_id=v_user) then
      raise exception 'Customer not found';
    end if;
  end if;

  if v_quote_id is null then
    insert into public.quotes(user_id,customer_id,job_description,value_pence,quote_date,expiry_date,status,next_follow_up_date,notes,subtotal,discount_type,discount_value,vat_enabled,vat_rate,vat_amount,final_total,payment_terms,terms_and_conditions)
    values(v_user,v_customer_id,p_quote->>'job_description',(p_quote->>'value_pence')::bigint,(p_quote->>'quote_date')::date,nullif(p_quote->>'expiry_date','')::date,(p_quote->>'status')::public.quote_status,nullif(p_quote->>'next_follow_up_date','')::date,nullif(p_quote->>'notes',''),(p_quote->>'subtotal')::bigint,p_quote->>'discount_type',(p_quote->>'discount_value')::numeric,(p_quote->>'vat_enabled')::boolean,(p_quote->>'vat_rate')::numeric,(p_quote->>'vat_amount')::bigint,(p_quote->>'final_total')::bigint,nullif(p_quote->>'payment_terms',''),nullif(p_quote->>'terms_and_conditions',''))
    returning id into v_quote_id;
  else
    update public.quotes set customer_id=v_customer_id,job_description=p_quote->>'job_description',value_pence=(p_quote->>'value_pence')::bigint,quote_date=(p_quote->>'quote_date')::date,expiry_date=nullif(p_quote->>'expiry_date','')::date,status=(p_quote->>'status')::public.quote_status,next_follow_up_date=nullif(p_quote->>'next_follow_up_date','')::date,notes=nullif(p_quote->>'notes',''),subtotal=(p_quote->>'subtotal')::bigint,discount_type=p_quote->>'discount_type',discount_value=(p_quote->>'discount_value')::numeric,vat_enabled=(p_quote->>'vat_enabled')::boolean,vat_rate=(p_quote->>'vat_rate')::numeric,vat_amount=(p_quote->>'vat_amount')::bigint,final_total=(p_quote->>'final_total')::bigint,payment_terms=nullif(p_quote->>'payment_terms',''),terms_and_conditions=nullif(p_quote->>'terms_and_conditions','')
    where id=v_quote_id and user_id=v_user;
    if not found then raise exception 'Quote not found'; end if;
    delete from public.quote_items where quote_id=v_quote_id and user_id=v_user;
  end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    insert into public.quote_items(user_id,quote_id,description,quantity,unit_price,line_total,sort_order)
    values(v_user,v_quote_id,trim(v_item->>'description'),(v_item->>'quantity')::numeric,(v_item->>'unit_price')::bigint,(v_item->>'line_total')::bigint,(v_item->>'sort_order')::integer);
  end loop;
  return jsonb_build_object('quote_id',v_quote_id,'customer_id',v_customer_id,'customer_created',v_customer_created);
end;
$$;
revoke all on function public.save_quote_transaction(jsonb,jsonb,uuid,jsonb) from public, anon;
grant execute on function public.save_quote_transaction(jsonb,jsonb,uuid,jsonb) to authenticated;
