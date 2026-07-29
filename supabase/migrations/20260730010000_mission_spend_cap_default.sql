-- The spend cap that never fired, and the two reasons it never fired.
--
-- WHY. `mission_spend_cap_usd` has been enforced fail-closed in
-- `checkMissionCaps` (runtime.server.ts) since it was written, and it has never
-- stopped anything, because EVERY writer passes `?? null`:
-- handoff.server.ts:419, loop.server.ts:491 and loop.server.ts:523. A ceiling
-- nobody sets is not a ceiling. The founder's own governance canon names this
-- "the one indefensible default", and the reason it matters is stated there:
-- arguing for more autonomy without a ceiling is the one version of the story a
-- risk officer will refuse.
--
-- There is a SECOND defect underneath the first, and fixing only the null would
-- have shipped a cap that means something different from what it says.
-- `mission_spend_cap_usd` lives on `agent_runs` and `checkMissionCaps` compares
-- it against THAT RUN's `spend_used_usd`, which `record_mission_usage` updates
-- per run. So it is a per-run ceiling wearing a mission-level name: a mission of
-- ten hops would get ten separate ceilings and could spend ten times the cap
-- while every individual check passed.
--
-- This migration fixes both:
--   1. `workspaces.default_mission_spend_cap_usd`, so a cap actually exists.
--   2. `mission_cap_state(run_id)`, which returns the run's caps alongside the
--      MISSION-WIDE totals, so the name becomes true.

-- ---------------------------------------------------------------------------
-- 1. The workspace default
-- ---------------------------------------------------------------------------
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS default_mission_spend_cap_usd numeric(10, 2)
    NOT NULL DEFAULT 10.00;

COMMENT ON COLUMN public.workspaces.default_mission_spend_cap_usd IS
  'Dollars one mission may spend across ALL of its runs before the loop halts. Inherited by every run whose dispatcher does not set an explicit cap. 10.00 is a default the workspace never chose, so it is deliberately generous and must stay visible and changeable: observed single runs cost well under a dollar, so this is roughly an order of magnitude of headroom and stops only a runaway. Set NULL to mean no ceiling, which is a decision a human has to make on purpose.';

-- Nullable-by-intent: NULL is "this workspace has chosen to have no ceiling".
-- The NOT NULL above only guarantees the column has a value on insert; owners
-- can still clear it deliberately.
ALTER TABLE public.workspaces
  ALTER COLUMN default_mission_spend_cap_usd DROP NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Mission-wide cap state, in one round trip
-- ---------------------------------------------------------------------------
-- `checkMissionCaps` runs before EVERY model call, so this must stay one query.
-- It returns the run's own caps plus the totals summed across every run sharing
-- the mission. A run with no mission_id falls back to its own usage, which is
-- the correct reading of "this mission" for a single-run mission.
CREATE OR REPLACE FUNCTION public.mission_cap_state(_run_id uuid)
RETURNS TABLE (
  mission_spend_cap_usd numeric,
  mission_token_cap integer,
  tokens_used integer,
  spend_used_usd numeric,
  halted_reason text,
  status text,
  mission_spend_total_usd numeric,
  mission_token_total integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.mission_spend_cap_usd,
    r.mission_token_cap,
    r.tokens_used,
    r.spend_used_usd,
    r.halted_reason,
    r.status,
    CASE
      WHEN r.mission_id IS NULL THEN COALESCE(r.spend_used_usd, 0)
      ELSE COALESCE((
        SELECT SUM(COALESCE(s.spend_used_usd, 0))
          FROM public.agent_runs s
         WHERE s.mission_id = r.mission_id
      ), 0)
    END AS mission_spend_total_usd,
    CASE
      WHEN r.mission_id IS NULL THEN COALESCE(r.tokens_used, 0)
      ELSE COALESCE((
        SELECT SUM(COALESCE(s.tokens_used, 0))
          FROM public.agent_runs s
         WHERE s.mission_id = r.mission_id
      ), 0)
    END AS mission_token_total
  FROM public.agent_runs r
  WHERE r.id = _run_id;
$$;

COMMENT ON FUNCTION public.mission_cap_state(uuid) IS
  'One round trip for the pre-call governance check: the run row plus the spend and tokens summed across every run in the same mission. SECURITY DEFINER because the loop runs as service_role and must see sibling runs it does not own.';

GRANT EXECUTE ON FUNCTION public.mission_cap_state(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.mission_cap_state(uuid) TO authenticated;

-- Summing per call needs the index that makes it cheap. The existing index on
-- (mission_id, created_at) serves the ordered reads; this one is for the SUM.
CREATE INDEX IF NOT EXISTS idx_agent_runs_mission_usage
  ON public.agent_runs (mission_id)
  WHERE mission_id IS NOT NULL;
