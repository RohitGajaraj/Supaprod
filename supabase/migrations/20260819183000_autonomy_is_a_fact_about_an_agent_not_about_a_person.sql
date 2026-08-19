-- 20260819183000_autonomy_is_a_fact_about_an_agent_not_about_a_person.sql
--
-- Claude lane, 2026-08-19. Implements defect 2 of the §2.3 ruling in
-- docs/planning/initiatives/agent-first-platform.md.
--
-- AUTONOMY IS A FACT ABOUT AN AGENT, NOT ABOUT A PERSON, AND THE TABLE IS
-- CURRENTLY KEYED ON THE PERSON.
--
-- WHAT THE RULING SAYS. "Agent track record is workspace-scoped. It is a fact
-- about the agent, not about the product." And on this table specifically:
-- "`agent_autonomy` has neither `workspace_id` nor `product_id` -- it is keyed
-- per user, so an agent a colleague spent three months graduating arrives
-- untrusted for the next person. The record travels and the permission does
-- not, which is backwards."
--
-- WHAT THE TABLE ACTUALLY HOLDS, AND WHY THAT CHANGES THE ORDER OF WORK.
-- Measured 2026-08-19:
--
--   select arc, count(*), count(distinct user_id) from agent_autonomy group by 1;
--     -- trusted   87   12        (and no other arc, at all)
--   select count(*) from agent_autonomy where set_by is null;   -- 86 of 87
--
-- The CHECK permits four rungs -- observing, proving, trusted, ambient -- and
-- 87 of 87 rows sit on `trusted`. `observing` and `proving` have never been
-- used once.
--
-- THAT IS NOT RUNAWAY PROMOTION, AND IT IS IMPORTANT NOT TO READ IT AS ONE.
-- `loadAgentArc` (src/lib/ai/trust.server.ts:265) returns `"trusted"` when no
-- row exists, on a standing founder ruling recorded in that function's own
-- comment: "Founder ruling 2026-07-08 (SW-7): autonomous by default." So a row
-- saying `trusted` is a row saying exactly what the absence of a row would say.
--
--   >>> EVERY ROW IN THIS TABLE IS CURRENTLY INERT. <<<
--
-- All 87 restate the default. Not one changes an outcome. That is the single
-- most useful fact here, because it means the keying can be corrected now at
-- zero behavioural cost, and it stops being free the first time somebody sets a
-- real tightening -- which, given the default is `trusted`, is the only kind of
-- row that will ever matter.
--
-- THE LEAK, STATED PRECISELY. `loadAgentArc` queries
-- `.eq("user_id", userId).eq("agent_id", agentId)` with no workspace predicate,
-- and the unique key is `(user_id, agent_id)`. So an arc is a fact about a
-- PERSON and applies in every workspace that person belongs to. Measured:
--
--   3 of 12 users belong to more than one workspace (max 3),
--   and they hold 28 of the 87 rows.
--
-- Today those 28 leak a value identical to the default, so nothing happens. The
-- day one of them is set to `observing` to rein an agent in on one client, the
-- tightening silently applies to the other two.
--
-- WHY THIS FILE ADDS A COLUMN AND DOES NOT YET MOVE THE KEY.
-- The end state the ruling describes is a workspace fact: `(workspace_id,
-- agent_id)`. Getting there needs the READER to change in the same breath --
-- `loadAgentArc` still selects on `(user_id, agent_id)` and calls
-- `.maybeSingle()`. Drop the old unique constraint before that reader is
-- updated and two workspaces' rows for one user become two rows for one query,
-- and `maybeSingle()` starts throwing on a path that gates every tool call.
--
-- So this file does the half that is safe on its own: the column, the foreign
-- key, the backfill, and a unique index expressing the target shape ALONGSIDE
-- the existing one rather than instead of it. The old constraint is left in
-- place. Moving the reader and dropping `agent_autonomy_user_id_agent_id_key`
-- is a follow-up that must land with its TypeScript, and is recorded as such in
-- the ledger rather than half-done here.
--
-- THE BACKFILL, AND THE 47 IT CANNOT REACH.
--
--   select count(*) from agent_autonomy a left join agents g on g.id = a.agent_id
--    where g.workspace_id is not null;                          -- 40 of 87
--
-- `agent_autonomy.agent_id` resolves to an `agents` row in all 87 cases, but
-- only 40 of those agents carry a `workspace_id`; the other 47 are
-- workspace-less template agents. Those 47 are left NULL, and NULL here keeps
-- exactly today's meaning -- "applies wherever this user is" -- so nothing
-- changes for them. They belong to 6 users, none of whom is a member of any
-- non-sample workspace:
--
--   select count(*) from agent_autonomy a left join agents g on g.id=a.agent_id
--    where g.workspace_id is null
--      and exists (select 1 from workspace_members m join workspaces w
--                   on w.id = m.workspace_id
--                  where m.user_id = a.user_id and not w.is_sample);   -- 0
--
-- Deleting them was considered and refused. They are inert, so deleting them
-- changes nothing that leaving them changes, and a delete of production rows
-- that buys no behaviour is not worth the blast radius. They will fall out
-- naturally when the reader moves to a workspace key.
--
-- SHAPE AND SECURITY. FK to `workspaces` with ON DELETE CASCADE, matching every
-- other `workspace_id` on this schema. RLS unchanged; the two existing policies
-- key on `user_id` and are not weakened by an added column. No arc value is
-- changed by this file -- nothing is promoted and nothing is demoted.

alter table public.agent_autonomy
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

comment on column public.agent_autonomy.workspace_id is
  'The workspace this arc applies in. NULL means the pre-2026-08-19 behaviour, '
  '"applies wherever this user is", which is the leak this column exists to '
  'close. Autonomy is a fact about an agent in a workspace, not about a person: '
  'see §2.3 of docs/planning/initiatives/agent-first-platform.md. The reader, '
  'loadAgentArc at src/lib/ai/trust.server.ts:255, still selects on '
  '(user_id, agent_id) and must move before the old unique key can be dropped.';

-- 40 of 87. The agent already knows which workspace it belongs to.
update public.agent_autonomy a
   set workspace_id = g.workspace_id
  from public.agents g
 where g.id = a.agent_id
   and g.workspace_id is not null
   and a.workspace_id is null;

-- The target shape, added alongside the existing (user_id, agent_id) key rather
-- than replacing it. Partial, because NULL workspace rows are the legacy
-- "everywhere" case and must not collide with each other.
create unique index if not exists agent_autonomy_workspace_agent_key
  on public.agent_autonomy (workspace_id, agent_id)
  where workspace_id is not null;

create index if not exists agent_autonomy_workspace_idx
  on public.agent_autonomy (workspace_id)
  where workspace_id is not null;

do $$
declare n_filled bigint; n_arcs bigint;
begin
  select count(*) into n_filled from public.agent_autonomy where workspace_id is not null;
  if n_filled = 0 then
    raise exception 'backfill filled nothing; expected 40 rows resolvable via agents.workspace_id';
  end if;

  -- Nothing in this file may change an arc.
  select count(distinct arc) into n_arcs from public.agent_autonomy;
  if n_arcs <> 1 then
    raise exception
      'agent_autonomy now holds % distinct arcs; this migration must not have '
      'changed any. Investigate before continuing.', n_arcs;
  end if;
end $$;
