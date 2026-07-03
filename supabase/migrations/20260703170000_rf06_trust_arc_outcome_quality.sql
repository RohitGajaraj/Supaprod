-- RF-06: the trust arc, fed by outcome quality, not just clean execution.
--
-- auto_advance_agent_arc already blocks promotion on ANY rejected approval
-- since the last arc change ("did not crash + the human said yes" isn't
-- enough if the human later said no to a gate). This extends the same
-- fail-closed rule to outcome quality: a PRD attributed to this agent
-- (via decisions.decided_by_agent_slug, the existing agent-authorship link
-- CNV-04/JNY-01 already rely on) whose recorded outcome (public.learnings,
-- written by recordOutcome) came back 'missed' since the last arc change
-- also blocks promotion, even when every run completed cleanly and no
-- approval was rejected. 'mixed' verdicts are deliberately excluded (no
-- clean directional signal, the same call recordOutcome's DBR-3i edge
-- already makes) — only a definitive 'missed' holds the arc back.
--
-- Idempotent: CREATE OR REPLACE on the existing function; no schema change.

CREATE OR REPLACE FUNCTION public.auto_advance_agent_arc(
  p_user_id uuid,
  p_agent_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_arc text;
  arc_set_at timestamptz;
  clean_runs integer;
  rejected integer;
  missed_outcomes integer;
  agent_slug_v text;
  new_arc text;
BEGIN
  -- Bootstrap autonomy row if missing.
  INSERT INTO public.agent_autonomy (user_id, agent_id, arc)
  VALUES (p_user_id, p_agent_id, 'observing')
  ON CONFLICT (user_id, agent_id) DO NOTHING;

  SELECT arc, set_at INTO current_arc, arc_set_at
  FROM public.agent_autonomy
  WHERE user_id = p_user_id AND agent_id = p_agent_id
  FOR UPDATE;

  -- We only auto-promote out of observing / proving. Trusted+ stays put.
  IF current_arc NOT IN ('observing', 'proving') THEN
    RETURN current_arc;
  END IF;

  -- Count rejected approvals since the last arc change — any rejection blocks promotion.
  SELECT COUNT(*) INTO rejected
  FROM public.agent_approvals
  WHERE user_id = p_user_id
    AND agent_id = p_agent_id
    AND status = 'rejected'
    AND COALESCE(decided_at, created_at) >= arc_set_at;

  IF rejected > 0 THEN
    RETURN current_arc;
  END IF;

  -- RF-06: any 'missed'-verdict outcome attributed to this agent since the
  -- last arc change blocks promotion too — outcome quality, not just clean
  -- execution + an accepted gate.
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

  -- Count completed runs since the last arc change. Tolerate both legacy
  -- 'complete' (single-shot agent_loop.runAgent) and modern 'completed' (loop.server.ts).
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
           set_by = NULL,             -- NULL = system-promoted, not operator
           set_at = now(),
           updated_at = now()
     WHERE user_id = p_user_id AND agent_id = p_agent_id;
  END IF;

  RETURN new_arc;
END;
$$;

GRANT EXECUTE ON FUNCTION public.auto_advance_agent_arc(uuid, uuid) TO authenticated, service_role;
