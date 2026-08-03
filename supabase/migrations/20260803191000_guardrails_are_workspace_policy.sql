-- Guardrails become workspace policy, which is what the product already claims.
--
-- FOUND BY WALKING THE LIVE PRODUCT on 2026-08-03. The Engine room's Safety room
-- read "0 guardrails on - 7 incidents" and "Nothing checks your AI calls yet",
-- directly above a list of blocks that had plainly happened: prompt injection
-- blocked three times, agent-written email to homeowners blocked twice, PII and
-- an okta client secret redacted. Both statements cannot be true.
--
-- Measured live: 27 guardrail rules exist, all 27 enabled, all 27 owned by members
-- of that workspace, and 14 hits recorded in it. The guardrails are on. The
-- counter was reading a different table's idea of "mine".
--
-- THE CAUSE, and it is not a counter. `guardrail_hits` carries workspace_id (the
-- tenancy retrofit included it) while `guardrail_rules` does not. Rules are keyed
-- to a USER. So both of these filter by the viewer:
--
--   guardrails.functions.ts:88   .from("guardrail_rules").eq("user_id", userId)   -- display
--   ai/runtime.server.ts:881     .from("guardrail_rules").eq("user_id", userId)   -- ENFORCEMENT
--
-- The display bug is the harmless half. The enforcement query means a workspace
-- member who never personally created a rule is screened by NOTHING: no PII
-- redaction, no secret redaction, no prompt-injection block. An admin sets up 27
-- guardrails, a teammate joins, and that teammate's calls run unscreened while the
-- Safety room shows them somebody else's incidents. egress-guardrails.ts:12 already
-- describes this as "per-workspace guardrail_rules", so the code believed it was
-- workspace policy and the schema never was.
--
-- This is squarely the governance canon: policy is set in advance, at the boundary,
-- by the workspace, and hard floors do not depend on which member happens to be
-- signed in.
--
-- DIRECTION OF CHANGE IS FAIL-SAFE. Scoping to the workspace makes MORE rules apply
-- to a given call, never fewer. A member who previously had their own rules keeps
-- them and inherits their colleagues' as well.

-- 1. The column, backfilled from each rule owner's default workspace before it is
--    made NOT NULL, so no rule is stranded.
alter table public.guardrail_rules
  add column if not exists workspace_id uuid references public.workspaces (id) on delete cascade;

update public.guardrail_rules r
   set workspace_id = coalesce(
     (select m.workspace_id
        from public.workspace_members m
       where m.user_id = r.user_id
       order by m.created_at asc
       limit 1),
     (select w.id from public.workspaces w where w.owner_id = r.user_id order by w.created_at asc limit 1)
   )
 where r.workspace_id is null;

-- A rule whose owner belongs to no workspace at all cannot be placed. Deleting it
-- would silently reduce screening, so fail loudly and let a human decide instead.
do $$
declare orphans int;
begin
  select count(*) into orphans from public.guardrail_rules where workspace_id is null;
  if orphans > 0 then
    raise exception '% guardrail rules could not be placed in a workspace; resolve before tightening', orphans;
  end if;
end $$;

alter table public.guardrail_rules alter column workspace_id set not null;
alter table public.guardrail_rules
  alter column workspace_id set default public.current_user_default_workspace();

create index if not exists guardrail_rules_workspace_enabled_idx
  on public.guardrail_rules (workspace_id, enabled);

-- 2. RLS follows the same membership shape every other workspace table uses. The
--    old user_id-only policy is dropped: leaving it would let a rule stay visible
--    to its author after they left the workspace.
alter table public.guardrail_rules enable row level security;
drop policy if exists "own guardrail_rules all" on public.guardrail_rules;
drop policy if exists "guardrail_rules ws read" on public.guardrail_rules;
drop policy if exists "guardrail_rules ws write" on public.guardrail_rules;

create policy "guardrail_rules ws read" on public.guardrail_rules
  for select using (public.is_workspace_member(workspace_id));
create policy "guardrail_rules ws write" on public.guardrail_rules
  for all using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

-- 3. Guard. Every rule placed, and the workspace that reported "0 guardrails on"
--    must now be able to see the rules that were screening it all along.
do $$
declare n int; helio uuid; visible int;
begin
  select count(*) into n from public.guardrail_rules where workspace_id is null;
  if n <> 0 then raise exception '% guardrail rules still have no workspace', n; end if;

  select id into helio from public.workspaces where name ilike '%helio%' limit 1;
  if helio is not null then
    select count(*) into visible from public.guardrail_rules where workspace_id = helio and enabled;
    raise notice 'Helio Labs now sees % enabled guardrails (was reported as 0)', visible;
  end if;
end $$;
