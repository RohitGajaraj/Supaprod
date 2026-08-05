-- The invite dropdown promises four roles. The database enforced one.
--
-- WHAT A VIEWER CAN AND CANNOT DO AFTER THIS MIGRATION
--
--   CANNOT: create, edit, enable, disable or delete a guardrail rule; approve,
--           reject, edit, supersede or delete a house rule; propose a house rule;
--           set or clear an agent tool override; set, raise, lower or delete an AI
--           spend cap (global or per-surface).
--   CAN:    read every one of those rows exactly as before. Not one row, column or
--           screen a viewer could see yesterday is hidden by this migration. The
--           SELECT policies are untouched or, where a single FOR ALL policy was
--           doing double duty as the read policy, restated verbatim before the
--           write half was tightened.
--
-- THE GAP. src/lib/workspaces.functions.ts:188 offers admin | member | viewer on the
-- invite form and again on the role editor at :157. src/lib/roles.functions.ts states
-- the model those words are meant to carry: admin edits guardrails and approves
-- actions, member creates content and runs missions, viewer is read-only. Measured on
-- the live database on 2026-08-05, the write policies on the tables that govern agent
-- behaviour and money asked only `is_workspace_member(workspace_id)`. Membership, not
-- role. So the row labelled "viewer, read-only" in the members list could delete all 27
-- guardrail rules in the Helio workspace, approve a house rule into every agent's
-- system prompt, or switch off a tool the loop depends on. A dropdown that asserts a
-- permission model the database does not enforce is worse than no dropdown, because a
-- reviewer trusts it.
--
-- THE CALL WAS TO ENFORCE, NOT TO REMOVE THE DROPDOWN. Nothing in the UI changes.
--
-- WHAT THIS MIGRATION DOES NOT DO. It does not touch a single function. The trap this
-- repo has already hit (CREATE OR REPLACE FUNCTION with a changed argument list forks
-- into an overload rather than replacing, and production then cannot choose a candidate
-- function) is avoided by having nothing to fork: every predicate below is built from
-- helpers that already exist on the live database, each verified to have exactly one
-- signature and an EXECUTE grant to `authenticated`:
--
--   public.has_workspace_role(ws uuid, required_roles text[]) -> boolean   1 overload
--   public.can_manage_workspace(ws uuid)                      -> boolean   1 overload
--   public.is_workspace_member(ws uuid)                       -> boolean   1 overload
--
-- can_manage_workspace(ws) is has_workspace_role(ws, array['owner','admin']). It is the
-- same predicate `workspaces` and `kill_switches` already enforce, so this migration
-- spreads a rule the product already lives by rather than inventing one.
--
-- WHY DROP-AND-REPLACE AND NOT SIMPLY ADD. Permissive policies OR together. Adding a
-- strict policy beside a FOR ALL membership policy would change nothing at all: the old
-- one would keep saying yes. Every tightened table therefore has its FOR ALL write
-- policy dropped and per-command policies created in its place.
--
-- THE TWO TIERS, and why each table sits where it does.
--
--   GOVERNANCE (owner or admin). These decide what an agent is allowed to do. The
--   documented model already assigns them to admin.
--     guardrail_rules  INSERT/UPDATE/DELETE   the hard floors screening every AI call
--     house_rules      UPDATE/DELETE          approving, retiring or rewriting a rule
--                                             that is injected into every agent prompt
--     agent_tools      INSERT/UPDATE/DELETE   tool overrides are platform policy, not
--                                             user rows (absent means the default applies)
--
--   NOT-A-VIEWER (owner, admin or member). These are proposals and self-limits. A
--   member keeps every one of them; only the read-only role is excluded.
--     house_rules         INSERT   a member may still DRAFT a rule, but only as
--                                  status='pending'. Writing 'approved' directly is the
--                                  approval act, so it stays with owner/admin.
--     ai_budgets          INSERT/UPDATE/DELETE   a spend cap is money
--     ai_surface_budgets  INSERT/UPDATE/DELETE
--
-- WHAT MEMBERS LOSE, stated plainly rather than buried: a member can no longer edit
-- guardrail rules, approve or reject a house rule, or change a tool override. Those
-- three are exactly the lines roles.functions.ts already assigns to admin. A member
-- keeps drafting house rules, running missions, and every content table, all untouched.
--
-- LEFT ALONE ON PURPOSE, each verified already closed against a viewer:
--   kill_switches       INSERT/UPDATE/DELETE already require role in (owner, admin).
--   workspaces          the autonomy policy columns (promotion_min_*, settle_*,
--                       never_settle_above_impact) live on this table, and its write
--                       policy is already has_workspace_role(id, owner|admin).
--   accounts, credit_caps, credit_ledger, account_credits, credit_topups, subscriptions
--                       billing is account-owner-only or read-only already; there is no
--                       authenticated write path for a viewer to reach.
--   ai_budget_alerts    an alert RECORD, not a cap. src/lib/ai/runtime.server.ts:980
--                       inserts it through the ACTING USER's client when a soft cap is
--                       crossed. Gating it by role would silence the safety alert for
--                       the very person who triggered it, which is the opposite of the
--                       point.
--
-- KNOWN AND NOT FIXABLE HERE, reported rather than quietly skipped: public.agent_autonomy
-- and public.spine_tracks are keyed to auth.uid() = user_id with no workspace column at
-- all. There is no workspace_id to ask a role about, so role-gating them needs a schema
-- change and its own migration.
--
-- SAFETY. Measured before writing: ai_budgets 6 rows, ai_surface_budgets 0, agent_tools 7,
-- guardrail_rules 27, house_rules 5, and ZERO rows with a null workspace_id in any of
-- them. So no existing row becomes unwritable because its workspace could not be
-- resolved. Live membership today is 21 owners, 1 admin, 1 member and 0 viewers, so no
-- one loses an ability they are exercising right now.
--
-- Idempotent: every policy is drop-then-create. Forward-only, no data change.

-- ---------------------------------------------------------------------------
-- 1. guardrail_rules. Governance. Read policy untouched.
-- ---------------------------------------------------------------------------

-- "guardrail_rules ws read" (SELECT, is_workspace_member) is deliberately NOT dropped.
drop policy if exists "guardrail_rules ws write" on public.guardrail_rules;
drop policy if exists "guardrail_rules manager insert" on public.guardrail_rules;
drop policy if exists "guardrail_rules manager update" on public.guardrail_rules;
drop policy if exists "guardrail_rules manager delete" on public.guardrail_rules;

create policy "guardrail_rules manager insert" on public.guardrail_rules
  for insert
  with check (public.can_manage_workspace(workspace_id));

create policy "guardrail_rules manager update" on public.guardrail_rules
  for update
  using (public.can_manage_workspace(workspace_id))
  with check (public.can_manage_workspace(workspace_id));

create policy "guardrail_rules manager delete" on public.guardrail_rules
  for delete
  using (public.can_manage_workspace(workspace_id));

-- ---------------------------------------------------------------------------
-- 2. house_rules. A member drafts; an owner or admin decides. Read untouched.
-- ---------------------------------------------------------------------------

-- "house_rules ws read" (SELECT, is_workspace_member) is deliberately NOT dropped.
drop policy if exists "house_rules ws write" on public.house_rules;
drop policy if exists "house_rules draft or manage insert" on public.house_rules;
drop policy if exists "house_rules manager update" on public.house_rules;
drop policy if exists "house_rules manager delete" on public.house_rules;

-- A member may insert only a pending draft. An owner or admin may insert any status,
-- which is how the approved-on-creation path in src/lib/self-improve.functions.ts stays
-- open to them. (That path actually runs as the service role, which bypasses RLS
-- entirely, so this clause is about a human doing it by hand.)
create policy "house_rules draft or manage insert" on public.house_rules
  for insert
  with check (
    public.can_manage_workspace(workspace_id)
    or (
      public.has_workspace_role(workspace_id, array['owner', 'admin', 'member'])
      and status = 'pending'
    )
  );

create policy "house_rules manager update" on public.house_rules
  for update
  using (public.can_manage_workspace(workspace_id))
  with check (public.can_manage_workspace(workspace_id));

create policy "house_rules manager delete" on public.house_rules
  for delete
  using (public.can_manage_workspace(workspace_id));

-- ---------------------------------------------------------------------------
-- 3. agent_tools. Tool overrides are platform policy.
--
--    This table's ONLY policy was a single FOR ALL that was also serving as its read
--    policy, so the read half is restated verbatim FIRST and the FOR ALL is dropped
--    after. The SELECT predicate below is character-for-character the qual that was
--    live: (auth.uid() = user_id) AND is_workspace_member(workspace_id).
-- ---------------------------------------------------------------------------

drop policy if exists "agent_tools own read" on public.agent_tools;
create policy "agent_tools own read" on public.agent_tools
  for select
  using (auth.uid() = user_id and public.is_workspace_member(workspace_id));

drop policy if exists "own agent_tools in member workspace" on public.agent_tools;
drop policy if exists "own agent_tools all" on public.agent_tools;
drop policy if exists "agent_tools manager insert" on public.agent_tools;
drop policy if exists "agent_tools manager update" on public.agent_tools;
drop policy if exists "agent_tools manager delete" on public.agent_tools;

-- The `auth.uid() = user_id` half is kept alongside the role check, so this is strictly
-- narrower than what was live and can never widen access: an admin still cannot write a
-- teammate's override row.
create policy "agent_tools manager insert" on public.agent_tools
  for insert
  with check (auth.uid() = user_id and public.can_manage_workspace(workspace_id));

create policy "agent_tools manager update" on public.agent_tools
  for update
  using (auth.uid() = user_id and public.can_manage_workspace(workspace_id))
  with check (auth.uid() = user_id and public.can_manage_workspace(workspace_id));

create policy "agent_tools manager delete" on public.agent_tools
  for delete
  using (auth.uid() = user_id and public.can_manage_workspace(workspace_id));

-- ---------------------------------------------------------------------------
-- 4. ai_budgets and ai_surface_budgets. A spend cap is money, so a read-only role
--    does not set one. Members keep theirs.
--
--    Metering is unaffected: the runtime advances usage through supabaseAdmin
--    (src/lib/ai/runtime.server.ts:1477 and :1560), which bypasses RLS, and
--    `authenticated` is already column-restricted to the cap columns on UPDATE.
--    The "ws read" SELECT policies on both tables are NOT touched.
-- ---------------------------------------------------------------------------

drop policy if exists "ai_budgets ws insert" on public.ai_budgets;
drop policy if exists "ai_budgets owner update" on public.ai_budgets;
drop policy if exists "ai_budgets owner delete" on public.ai_budgets;

create policy "ai_budgets ws insert" on public.ai_budgets
  for insert
  with check (
    user_id = auth.uid()
    and public.has_workspace_role(workspace_id, array['owner', 'admin', 'member'])
  );

create policy "ai_budgets owner update" on public.ai_budgets
  for update
  using (
    user_id = auth.uid()
    and public.has_workspace_role(workspace_id, array['owner', 'admin', 'member'])
  )
  with check (
    user_id = auth.uid()
    and public.has_workspace_role(workspace_id, array['owner', 'admin', 'member'])
  );

create policy "ai_budgets owner delete" on public.ai_budgets
  for delete
  using (
    user_id = auth.uid()
    and public.has_workspace_role(workspace_id, array['owner', 'admin', 'member'])
  );

drop policy if exists "ai_surface_budgets ws insert" on public.ai_surface_budgets;
drop policy if exists "ai_surface_budgets owner update" on public.ai_surface_budgets;
drop policy if exists "ai_surface_budgets owner delete" on public.ai_surface_budgets;

create policy "ai_surface_budgets ws insert" on public.ai_surface_budgets
  for insert
  with check (
    user_id = auth.uid()
    and public.has_workspace_role(workspace_id, array['owner', 'admin', 'member'])
  );

create policy "ai_surface_budgets owner update" on public.ai_surface_budgets
  for update
  using (
    user_id = auth.uid()
    and public.has_workspace_role(workspace_id, array['owner', 'admin', 'member'])
  )
  with check (
    user_id = auth.uid()
    and public.has_workspace_role(workspace_id, array['owner', 'admin', 'member'])
  );

create policy "ai_surface_budgets owner delete" on public.ai_surface_budgets
  for delete
  using (
    user_id = auth.uid()
    and public.has_workspace_role(workspace_id, array['owner', 'admin', 'member'])
  );

-- ---------------------------------------------------------------------------
-- 5. Guard. Fail the migration rather than report a permission model it did not
--    actually install.
-- ---------------------------------------------------------------------------

do $$
declare
  leftover text;
  missing text;
  reads int;
begin
  -- (a) No membership-only write policy may survive on a tightened table. A single
  --     leftover permissive FOR ALL would OR the whole thing back open.
  select string_agg(format('%s.%s', tablename, policyname), ', ')
    into leftover
    from pg_policies
   where schemaname = 'public'
     and tablename in ('guardrail_rules', 'house_rules', 'agent_tools',
                       'ai_budgets', 'ai_surface_budgets')
     and cmd <> 'SELECT'
     and coalesce(qual, '') || coalesce(with_check, '') like '%is_workspace_member%'
     and coalesce(qual, '') || coalesce(with_check, '') not like '%has_workspace_role%'
     and coalesce(qual, '') || coalesce(with_check, '') not like '%can_manage_workspace%';
  if leftover is not null then
    raise exception 'membership-only write policy still open after tightening: %', leftover;
  end if;

  -- (b) Every policy this migration promises must exist.
  select string_agg(want.name, ', ')
    into missing
    from (values
      ('guardrail_rules', 'guardrail_rules manager insert'),
      ('guardrail_rules', 'guardrail_rules manager update'),
      ('guardrail_rules', 'guardrail_rules manager delete'),
      ('house_rules', 'house_rules draft or manage insert'),
      ('house_rules', 'house_rules manager update'),
      ('house_rules', 'house_rules manager delete'),
      ('agent_tools', 'agent_tools own read'),
      ('agent_tools', 'agent_tools manager insert'),
      ('agent_tools', 'agent_tools manager update'),
      ('agent_tools', 'agent_tools manager delete'),
      ('ai_budgets', 'ai_budgets ws insert'),
      ('ai_budgets', 'ai_budgets owner update'),
      ('ai_budgets', 'ai_budgets owner delete'),
      ('ai_surface_budgets', 'ai_surface_budgets ws insert'),
      ('ai_surface_budgets', 'ai_surface_budgets owner update'),
      ('ai_surface_budgets', 'ai_surface_budgets owner delete')
    ) as want(tbl, name)
   where not exists (
     select 1 from pg_policies p
      where p.schemaname = 'public' and p.tablename = want.tbl and p.policyname = want.name
   );
  if missing is not null then
    raise exception 'policies missing after migration: %', missing;
  end if;

  -- (c) THE RATCHET. Every tightened table must still have a SELECT policy, or a
  --     screen someone read yesterday goes blank today.
  select count(distinct tablename) into reads
    from pg_policies
   where schemaname = 'public'
     and cmd = 'SELECT'
     and tablename in ('guardrail_rules', 'house_rules', 'agent_tools',
                       'ai_budgets', 'ai_surface_budgets');
  if reads <> 5 then
    raise exception 'a tightened table lost its read policy: only % of 5 still have one', reads;
  end if;

  raise notice 'Role-aware writes installed. A viewer now reads everything and writes none of it.';
end $$;
