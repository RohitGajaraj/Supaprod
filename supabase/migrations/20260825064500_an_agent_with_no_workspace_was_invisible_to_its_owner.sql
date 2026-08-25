-- An agent with no workspace could not be seen by the user who owns it.
--
-- The policy on `agents` reads:
--
--   (auth.uid() = user_id) AND is_workspace_member(workspace_id)
--
-- and `agents.workspace_id` is nullable. `is_workspace_member(NULL)` returns
-- **false** (measured, not assumed), so the whole predicate is false and the row
-- is invisible **to its own owner**.
--
--   SELECT count(*), count(*) FILTER (WHERE workspace_id IS NULL),
--          count(DISTINCT user_id) FILTER (WHERE workspace_id IS NULL),
--          (SELECT is_workspace_member(NULL))
--     FROM agents;
--   -- 283 | 84 | 6 | false
--
-- **84 of 283 agent rows, across 6 users.**
--
-- WHY IT LOOKED LIKE A MISSING ROSTER. `loop.server.ts:544-549` resolves the
-- seat with `.from("agents").eq("user_id", ...).eq("slug", ...)` and then
-- `if (!agent) throw new Error("Unknown agent: " + slug)`. Zero rows and no such
-- agent are indistinguishable from there, so a PERMISSIONS result was reported
-- as a roster gap. LANE 1 hit it twice while verifying item 34 and item 28 —
-- "Unknown agent: ux-architect" at `design` on track `e976e60e`, and
-- "Unknown agent: discovery-scout" at `sense` on a track created through
-- `/start` — and went looking for slugs that were present the whole time.
--
-- WHY THE BACKGROUND LOOP NEVER SAW IT. `track-tick` drives through
-- `supabaseAdmin`, and the service role bypasses RLS. So the sweep advanced
-- tracks normally while **the product's own front door could not run a single
-- station** — which is exactly the shape that hides longest.
--
-- THE FIX, and it is the same rule `match_agent_memory` already applies to
-- `agent_memory`: a NULL workspace means "not scoped to a workspace", which is a
-- legitimate personal agent, not a row to hide. Tenancy is unchanged — the
-- `auth.uid() = user_id` half still stands alone, so nobody gains sight of
-- anybody else's agents.
drop policy if exists "own agents in member workspace" on public.agents;

create policy "own agents in member workspace"
  on public.agents
  for all
  using (
    (select auth.uid()) = user_id
    and (workspace_id is null or public.is_workspace_member(workspace_id))
  )
  with check (
    (select auth.uid()) = user_id
    and (workspace_id is null or public.is_workspace_member(workspace_id))
  );
