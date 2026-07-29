ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS default_mission_spend_cap_usd numeric(10, 2)
    NOT NULL DEFAULT 10.00;

COMMENT ON COLUMN public.workspaces.default_mission_spend_cap_usd IS
  'Dollars one mission may spend across ALL of its runs before the loop halts. Inherited by every run whose dispatcher does not set an explicit cap. Set NULL to mean no ceiling, which is a decision a human has to make on purpose.';

ALTER TABLE public.workspaces
  ALTER COLUMN default_mission_spend_cap_usd DROP NOT NULL;

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
  'One round trip for the pre-call governance check: the run row plus the spend and tokens summed across every run in the same mission.';

GRANT EXECUTE ON FUNCTION public.mission_cap_state(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.mission_cap_state(uuid) TO authenticated;

CREATE INDEX IF NOT EXISTS idx_agent_runs_mission_usage
  ON public.agent_runs (mission_id)
  WHERE mission_id IS NOT NULL;