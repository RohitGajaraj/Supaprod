-- P-65: a workspace with an owner and no owner member row cannot exist.
--
-- Live 00:35 IST 09-04: a workspace whose owner had no `workspace_members`
-- row (the probe workspace, created by SQL -- see arrival-2026-09.md) made
-- Start throw "Forbidden: not a member of this workspace", machine copy
-- (`error-copy.ts`'s own MACHINE list) that `messageForPerson` silently
-- dropped, so the person read "Nothing was started ... nothing was filed"
-- with no reason. `resolveStartWorkspace` (track.functions.ts) is fixed
-- separately, in the same commit, to admit the owner. This migration closes
-- the ROOT: the reason a workspace can be missing its owner's membership row
-- at all.
--
-- `workspaces.functions.ts`'s own `createWorkspace` deliberately does NOT use
-- a trigger for its own write ("a trigger on workspaces would also fire for
-- the definer path [ensure_user_default_workspace], which already writes its
-- own membership, and two writers for one row is how the second one comes to
-- be wrong"). That reasoning is sound against a trigger that unconditionally
-- inserts. It is not an argument against a SAFETY NET: a trigger guarded by
-- the same `ON CONFLICT (workspace_id, user_id) DO NOTHING` shape
-- `ensure_user_default_workspace` already uses for exactly this reason never
-- competes with a writer that already ran -- it only fills the gap when
-- nothing did. That is the guarantee this migration adds: not a second
-- writer, a backstop for every path, present or future, that inserts a
-- workspace and forgets the row that makes it readable.

create or replace function public.ensure_owner_member_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (workspace_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_ensure_owner_member_row on public.workspaces;

create trigger trg_ensure_owner_member_row
  after insert on public.workspaces
  for each row
  execute function public.ensure_owner_member_row();

-- Backfill: two existing workspaces (both from 2026-07-22, predating this
-- session) were already in the state this migration exists to prevent.
-- Checked live before writing this, not assumed.
insert into public.workspace_members (workspace_id, user_id, role)
select w.id, w.owner_id, 'owner'
from public.workspaces w
where not exists (
  select 1 from public.workspace_members m
  where m.workspace_id = w.id and m.user_id = w.owner_id
)
on conflict (workspace_id, user_id) do nothing;

-- Fail-loud verification, matching this session's own established pattern.
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'trg_ensure_owner_member_row'
      and tgrelid = 'public.workspaces'::regclass
  ) then
    raise exception 'trg_ensure_owner_member_row was not created';
  end if;

  if exists (
    select 1 from public.workspaces w
    where not exists (
      select 1 from public.workspace_members m
      where m.workspace_id = w.id and m.user_id = w.owner_id
    )
  ) then
    raise exception 'a workspace still has an owner with no member row after backfill';
  end if;
end $$;
