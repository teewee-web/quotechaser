-- Launch hardening: least privilege, safer storage ownership, query indexes,
-- bounded user input and self-service account deletion.

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.assign_quote_number() from public, anon, authenticated;

drop policy if exists "Users update own logos" on storage.objects;
create policy "Users update own logos"
on storage.objects for update to authenticated
using (bucket_id = 'business-logos' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'business-logos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create index if not exists quotes_customer_id_idx on public.quotes(customer_id);
create index if not exists quote_items_quote_id_idx on public.quote_items(quote_id);
create index if not exists follow_up_history_quote_id_idx on public.follow_up_history(quote_id);

alter table public.profiles
  add constraint profiles_email_length check (email is null or length(email) <= 320);

alter table public.customers
  add constraint customers_field_lengths check (
    length(name) <= 200 and
    (mobile is null or length(mobile) <= 30) and
    (email is null or length(email) <= 320) and
    (address is null or length(address) <= 500) and
    (notes is null or length(notes) <= 2000)
  );

alter table public.quotes
  add constraint quotes_field_lengths check (
    length(job_description) <= 5000 and
    (notes is null or length(notes) <= 5000) and
    (payment_terms is null or length(payment_terms) <= 3000) and
    (terms_and_conditions is null or length(terms_and_conditions) <= 10000)
  ),
  add constraint quotes_amount_limits check (
    value_pence <= 1000000000 and subtotal between 0 and 1000000000 and
    final_total between 0 and 1200000000 and vat_amount between 0 and 1000000000 and
    discount_value <= 10000000 and
    (discount_type <> 'percentage' or discount_value <= 100)
  ),
  add constraint quotes_date_order check (expiry_date is null or expiry_date >= quote_date);

alter table public.quote_items
  add constraint quote_items_limits check (
    length(description) <= 1000 and quantity <= 100000 and
    unit_price <= 1000000000 and line_total <= 1000000000000 and
    sort_order between 0 and 99
  );

alter table public.follow_up_history
  add constraint follow_up_notes_length check (notes is null or length(notes) <= 2000);

alter table public.user_settings
  add constraint settings_field_lengths check (
    (business_name is null or length(business_name) <= 200) and
    (user_name is null or length(user_name) <= 200) and
    (telephone is null or length(telephone) <= 30) and
    (google_review_link is null or length(google_review_link) <= 2048) and
    (follow_up_message is null or length(follow_up_message) <= 3000) and
    (review_request_message is null or length(review_request_message) <= 3000) and
    (business_address is null or length(business_address) <= 1000) and
    (business_email is null or length(business_email) <= 320) and
    (vat_number is null or length(vat_number) <= 30) and
    (default_payment_terms is null or length(default_payment_terms) <= 3000) and
    (default_terms_and_conditions is null or length(default_terms_and_conditions) <= 10000) and
    coalesce(array_length(follow_up_schedule, 1), 0) between 1 and 10 and
    365 >= all(follow_up_schedule)
  );

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.delete_current_user()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;
  delete from auth.users where id = current_user_id;
end;
$$;
revoke all on function private.delete_current_user() from public, anon, authenticated;

create or replace function public.delete_own_account()
returns void
language sql
security invoker
set search_path = ''
as $$ select private.delete_current_user(); $$;
revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
