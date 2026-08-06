create or replace function public.platform_has_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.user_roles where role = 'admin');
$$;

comment on function public.platform_has_admin() is
  'True when at least one platform admin exists. SECURITY DEFINER so a member '
  'can learn the fact without being able to read who the admins are: the only '
  'select policy on user_roles is user_id = auth.uid(), which made every '
  'non-admin count zero and made Settings tell them the workspace was '
  'unclaimed. Returns one boolean and nothing else, on purpose.';

revoke all on function public.platform_has_admin() from public;
grant execute on function public.platform_has_admin() to authenticated;