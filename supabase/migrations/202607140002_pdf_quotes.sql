alter table public.quotes
  add column if not exists quote_number text,
  add column if not exists expiry_date date,
  add column if not exists subtotal bigint not null default 0,
  add column if not exists discount_type text not null default 'fixed' check (discount_type in ('fixed','percentage')),
  add column if not exists discount_value numeric(12,2) not null default 0 check (discount_value >= 0),
  add column if not exists vat_enabled boolean not null default false,
  add column if not exists vat_rate numeric(5,2) not null default 20 check (vat_rate between 0 and 100),
  add column if not exists vat_amount bigint not null default 0,
  add column if not exists final_total bigint not null default 0,
  add column if not exists payment_terms text,
  add column if not exists terms_and_conditions text;

update public.quotes set subtotal=value_pence, final_total=value_pence where subtotal=0 or final_total=0;

alter table public.user_settings
  add column if not exists logo_url text,
  add column if not exists business_address text not null default '',
  add column if not exists business_email text not null default '',
  add column if not exists vat_registered boolean not null default false,
  add column if not exists vat_number text not null default '',
  add column if not exists default_vat_rate numeric(5,2) not null default 20 check(default_vat_rate between 0 and 100),
  add column if not exists default_payment_terms text not null default 'Payment is due within 14 days of completion.',
  add column if not exists default_terms_and_conditions text not null default 'Any additional work will be agreed and quoted separately.',
  add column if not exists default_quote_validity_days integer not null default 30 check(default_quote_validity_days between 1 and 365);

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  quote_id uuid not null references public.quotes(id) on delete cascade, description text not null check(length(trim(description))>0),
  quantity numeric(12,3) not null check(quantity>0), unit_price bigint not null check(unit_price>=0),
  line_total bigint not null check(line_total>=0), sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists quote_items_user_quote_idx on public.quote_items(user_id,quote_id,sort_order);
alter table public.quote_items enable row level security;
drop policy if exists quote_items_own_all on public.quote_items;
create policy quote_items_own_all on public.quote_items for all to authenticated
  using(user_id=(select auth.uid()))
  with check(user_id=(select auth.uid()) and exists(select 1 from public.quotes q where q.id=quote_id and q.user_id=(select auth.uid())));
grant select,insert,update,delete on public.quote_items to authenticated;
drop trigger if exists quote_items_updated on public.quote_items;
create trigger quote_items_updated before update on public.quote_items for each row execute function public.set_updated_at();

create or replace function public.assign_quote_number() returns trigger language plpgsql security definer set search_path='' as $$
declare y text; n integer;
begin
  if new.quote_number is not null then return new; end if;
  y := extract(year from new.quote_date)::text;
  perform pg_advisory_xact_lock(hashtext(new.user_id::text || y));
  select coalesce(max(substring(q.quote_number from '[0-9]+$')::integer),0)+1 into n
  from public.quotes q where q.user_id=new.user_id and q.quote_number like 'QC-'||y||'-%';
  new.quote_number := 'QC-'||y||'-'||lpad(n::text,4,'0');
  return new;
end$$;
drop trigger if exists assign_quote_number on public.quotes;
create trigger assign_quote_number before insert on public.quotes for each row execute function public.assign_quote_number();
with numbered as (
  select id, 'QC-'||extract(year from quote_date)::integer||'-'||lpad(row_number() over(partition by user_id,extract(year from quote_date) order by created_at,id)::text,4,'0') as generated_number
  from public.quotes where quote_number is null
)
update public.quotes q set quote_number=n.generated_number, expiry_date=coalesce(q.expiry_date,q.quote_date+30)
from numbered n where q.id=n.id;
create unique index if not exists quotes_user_number_idx on public.quotes(user_id,quote_number) where quote_number is not null;
create or replace function public.keep_quote_number() returns trigger language plpgsql security invoker set search_path='' as $$begin new.quote_number=old.quote_number; return new; end$$;
drop trigger if exists keep_quote_number on public.quotes;
create trigger keep_quote_number before update of quote_number on public.quotes for each row execute function public.keep_quote_number();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('business-logos','business-logos',false,2097152,array['image/png','image/jpeg','image/webp'])
on conflict(id) do update set public=false,file_size_limit=2097152,allowed_mime_types=array['image/png','image/jpeg','image/webp'];
drop policy if exists logos_own_select on storage.objects;
drop policy if exists logos_own_insert on storage.objects;
drop policy if exists logos_own_update on storage.objects;
drop policy if exists logos_own_delete on storage.objects;
create policy logos_own_select on storage.objects for select to authenticated using(bucket_id='business-logos' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy logos_own_insert on storage.objects for insert to authenticated with check(bucket_id='business-logos' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy logos_own_update on storage.objects for update to authenticated using(bucket_id='business-logos' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy logos_own_delete on storage.objects for delete to authenticated using(bucket_id='business-logos' and (storage.foldername(name))[1]=(select auth.uid())::text);
