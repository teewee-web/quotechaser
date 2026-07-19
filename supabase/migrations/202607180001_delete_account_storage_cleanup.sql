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
  delete from storage.objects
  where bucket_id = 'business-logos'
    and (storage.foldername(name))[1] = current_user_id::text;
  delete from auth.users where id = current_user_id;
end;
$$;
revoke all on function private.delete_current_user() from public, anon, authenticated;
