-- A demo account kept making workspaces nobody flagged.
--
-- `is_sample` is set by the seed migrations on the workspaces they create. It is
-- not set on a workspace the PRODUCT creates, and the product creates one for
-- every account on first use: `current_user_default_workspace()` mints
-- "My Workspace" on demand. So a demo or investor account signing in to look
-- around produces an unflagged workspace, and every census that reads
-- `is_sample` counts it as production.
--
-- Three exist today: ember@supaprod.ai, demo2@redcadence.app and a
-- step0.rerun test account. None was created by a customer. None was flagged,
-- because nothing was watching -- the flag records what a SEED did, and this is
-- what a SIGN-IN did.
--
-- THE DEEPER POINT, and it is the third time this exact shape has cost us in one
-- morning. `20260811090000` ended a census that asked a workspace id its shape.
-- `20260811100000` fixed six fixtures whose `is_sample` was simply the wrong
-- fact. Both replaced an inference with a column. This one goes one step
-- further, because a column on the workspace cannot answer this question at all:
-- whether a workspace is production depends on WHO OWNS IT, and ownership lives
-- somewhere else. So the question gets a function rather than another boolean
-- nobody will remember to set.
--
-- FAILS CLOSED, which is the whole reason it exists. An unknown workspace id, an
-- orphaned one with no row, or a workspace whose owner cannot be resolved all
-- return FALSE -- not production. The predicate this replaces failed OPEN: it
-- built a list of things to exclude, so anything it had not heard of counted.
-- For a public counter, and for any claim about what the product has done, the
-- only safe direction to be wrong is downward.
--
-- `@redcadence.app` is matched as a DOMAIN here, unlike `demo_account_emails()`
-- which is deliberately an explicit list. The difference is real: supaprod.ai is
-- shared with founder and staff accounts, so a domain match there would sweep in
-- the people the gate protects. redcadence.app is retired entirely -- every
-- account on it is a dead demo login -- so the domain IS the set.
--
-- TO REVERSE: drop both functions. Nothing reads them until the application is
-- pointed at them, and no row anywhere is modified by this migration.

create or replace function public.is_production_workspace(_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (
    select 1
      from public.workspaces w
      join auth.users u on u.id = w.owner_id
     where w.id = _workspace_id
       and w.is_sample is not true
       and u.email <> all (public.demo_account_emails())
       and u.email not like '%@redcadence.app'
  );
$fn$;

comment on function public.is_production_workspace(uuid) is
  'True only when a workspace is provably NOT a demo: not flagged is_sample AND not owned by a demo-allowlist account AND not owned by a retired redcadence.app login. Fails closed on an unknown, orphaned or unresolvable workspace. Use this rather than reading is_sample directly: the product auto-creates workspaces for demo accounts and nothing flags those.';

create or replace function public.production_workspace_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $fn$
  select w.id
    from public.workspaces w
    join auth.users u on u.id = w.owner_id
   where w.is_sample is not true
     and u.email <> all (public.demo_account_emails())
     and u.email not like '%@redcadence.app';
$fn$;

comment on function public.production_workspace_ids() is
  'The allowlist form of is_production_workspace, for callers that need to scope a query with IN rather than test one id. An ALLOWLIST on purpose: a blocklist admits whatever it has not heard of, which is how six fixture workspaces and one orphan came to be counted as production.';

grant execute on function public.is_production_workspace(uuid) to authenticated;
grant execute on function public.production_workspace_ids() to authenticated;

do $$
declare
  v_all bigint;
  v_prod bigint;
begin
  select count(*) into v_all from public.workspaces;
  select count(*) into v_prod from public.production_workspace_ids();
  raise notice 'workspaces: % total, % production, % demo or test', v_all, v_prod, v_all - v_prod;
end $$;
