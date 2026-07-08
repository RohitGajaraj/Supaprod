-- Founder ruling 2026-07-08 (SW-7 live-run): autonomous by default.
-- The terminal walkthrough showed a tiny two-file mission demanding FOUR human
-- approvals (stage, commit, PR open, merge). The ruling: the machine's own
-- build mechanics run without ceremony; a human decides only what genuinely
-- needs judgment. The decisive studio.pr.merge gate and studio.revert stay
-- review-pinned (code floor HIGH_RISK_FORCE_REVIEW is drift-proof), so
-- nothing lands on a default branch without a human.
--
-- Code twins (same commit): trust-ramp.ts BUILD_LANE_AUTONOMOUS exemption,
-- loop.server.ts resolveToolMode demotion skip, trust.server.ts default arc
-- fallback observing -> trusted.

-- 1) Build-lane mechanics default to auto for EXISTING users (the seed fn's
--    ON CONFLICT DO NOTHING means redefining it alone never fixes old rows).
UPDATE public.agent_tools
   SET mode = 'auto'
 WHERE tool_name IN ('studio.commit', 'studio.pr.open')
   AND mode <> 'auto';

-- 2) Stale per-agent ramp rows would silently re-tighten these tools after
--    the seeded-mode update (agent_tool_modes overrides agent_tools in the
--    loop). The ramp can re-earn rows later; today's rows predate the ruling.
DELETE FROM public.agent_tool_modes
 WHERE tool_name IN ('studio.commit', 'studio.pr.open');

-- 3) Arcs: bootstrap-default 'observing' rows advance to 'trusted' (the
--    observing default pinned EVERY write to review - the "four ceremonial
--    clicks" root cause). Operator-set proving/ambient rows are untouched;
--    an operator can still dial any agent back down.
UPDATE public.agent_autonomy
   SET arc = 'trusted', updated_at = now()
 WHERE arc = 'observing';

-- 4) seed_studio_tools: canonical body (20260618160000_k2_rollbacks.sql) with
--    studio.commit / studio.pr.open seeded 'auto' for future signups.
CREATE OR REPLACE FUNCTION public.seed_studio_tools(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.agent_tools (user_id, tool_name, display_name, description, category, mode, built_in) VALUES
    (_user_id, 'repo.tree',       'Read repo tree',     'Studio: list the connected repo''s file tree (paths, types, sizes). Read-only.', 'read', 'auto', true),
    (_user_id, 'repo.read',       'Read repo files',    'Studio: read up to 8 files from the connected repo. Read-only.', 'read', 'auto', true),
    (_user_id, 'repo.search',     'Search repo code',   'Studio: GitHub code search scoped to the connected repo. Read-only.', 'read', 'auto', true),
    (_user_id, 'studio.stage',    'Stage changes',      'Studio: stage multi-file edits into the mission''s changeset. DB-only, no GitHub write.', 'write', 'auto', true),
    (_user_id, 'studio.commit',   'Commit changeset',   'Studio: commit ALL staged changes to an isolated studio/* branch via the Git Data API. Autonomous; the merge gate decides what lands.', 'write', 'auto', true),
    (_user_id, 'studio.pr.open',  'Open Studio PR',     'Studio: open a multi-file pull request from the changeset branch. Autonomous; the merge gate decides what lands.', 'write', 'auto', true),
    (_user_id, 'studio.pr.merge', 'Merge Studio PR',    'Studio: merge the changeset PR (squash). Review-gated, closes the loop in-platform.', 'write', 'review', true),
    (_user_id, 'studio.revert',   'Roll back release',  'Studio: roll back a merged release by synthesizing an inverse changeset. Flows through commit, PR, CI gate, merge. Review-gated.', 'write', 'review', true)
  ON CONFLICT (user_id, tool_name) DO NOTHING;
END;
$function$;

-- 5) auto_advance_agent_arc: canonical body (20260703193006) with the
--    bootstrap INSERT flipped observing -> trusted, so the ramp fn stops
--    re-creating review-pinned rows for fresh agents. Its advancement logic
--    is unchanged (trusted rows return early, exactly as before).
CREATE OR REPLACE FUNCTION public.auto_advance_agent_arc(
  p_user_id uuid,
  p_agent_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  current_arc text;
  arc_set_at timestamptz;
  clean_runs integer;
  rejected integer;
  missed_outcomes integer;
  agent_slug_v text;
  new_arc text;
BEGIN
  INSERT INTO public.agent_autonomy (user_id, agent_id, arc)
  VALUES (p_user_id, p_agent_id, 'trusted')
  ON CONFLICT (user_id, agent_id) DO NOTHING;

  SELECT arc, set_at INTO current_arc, arc_set_at
  FROM public.agent_autonomy
  WHERE user_id = p_user_id AND agent_id = p_agent_id
  FOR UPDATE;

  IF current_arc NOT IN ('observing', 'proving') THEN
    RETURN current_arc;
  END IF;

  SELECT COUNT(*) INTO rejected
  FROM public.agent_approvals
  WHERE user_id = p_user_id
    AND agent_id = p_agent_id
    AND status = 'rejected'
    AND COALESCE(decided_at, created_at) >= arc_set_at;

  IF rejected > 0 THEN
    RETURN current_arc;
  END IF;

  SELECT slug INTO agent_slug_v FROM public.agents WHERE id = p_agent_id AND user_id = p_user_id;

  SELECT COUNT(*) INTO missed_outcomes
  FROM public.learnings l
  JOIN public.decisions d ON d.prd_id = l.prd_id
  WHERE l.user_id = p_user_id
    AND d.user_id = p_user_id
    AND l.verdict = 'missed'
    AND l.created_at >= arc_set_at
    AND d.decided_by_agent_slug = agent_slug_v;

  IF missed_outcomes > 0 THEN
    RETURN current_arc;
  END IF;

  SELECT COUNT(*) INTO clean_runs
  FROM public.agent_runs
  WHERE user_id = p_user_id
    AND agent_id = p_agent_id
    AND status IN ('completed', 'complete')
    AND created_at >= arc_set_at;

  new_arc := current_arc;
  IF current_arc = 'observing' AND clean_runs >= 5 THEN
    new_arc := 'proving';
  ELSIF current_arc = 'proving' AND clean_runs >= 20 THEN
    new_arc := 'trusted';
  END IF;

  IF new_arc <> current_arc THEN
    UPDATE public.agent_autonomy
       SET arc = new_arc,
           set_by = NULL,
           set_at = now(),
           updated_at = now()
     WHERE user_id = p_user_id AND agent_id = p_agent_id;
  END IF;

  RETURN new_arc;
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.auto_advance_agent_arc(uuid, uuid) TO authenticated, service_role;
