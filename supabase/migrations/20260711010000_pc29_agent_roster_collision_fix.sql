-- PC-29 (the felt agent layer) layer 1: fix a real duplicate-role bug in the
-- default agent roster seed.
--
-- WHY: seed_default_agents (as of 20260709070000) inserts 'engineer',
-- 'stakeholder', and 'copilot' as new, enabled, active agent rows for every
-- signup, alongside 'builder', 'release', and 'orchestrator'. But
-- src/lib/agent-vocabulary.ts's SPECIALIST_CATALOG already marks
-- engineer/stakeholder/copilot as status "deprecated" aliases that resolve to
-- the SAME display name as their active canonical counterpart:
--   engineer    -> Engineer      (same display name as builder)
--   stakeholder -> Announce      (same display name as release)
--   copilot     -> Chief of Staff (same display name as orchestrator)
-- Every account has therefore been getting two live rows per role, which is
-- exactly why a presence/relay UI shows two agents that read as duplicates.
--
-- Separately, the live seed never inserts three catalog specialists that DO
-- exist in both the original canon (20260618200000) and the current catalog:
-- customer-insights (Listen), ux-architect (Design), data-analyst (Measure).
--
-- This migration: (1) fixes seed_default_agents to the corrected 12-specialist
-- roster (drops the 3 colliding slugs, adds the 3 missing ones) so every new
-- signup is correct going forward; (2) retags every agent_slug-shaped column
-- across the schema from the deprecated slug to its canonical replacement for
-- existing accounts, then deactivates (never deletes) any leftover duplicate
-- row in public.agents; (3) backfills the 3 newly-added specialists for every
-- existing account that is missing one of them. No destructive DROP/DELETE
-- anywhere in this file.

-- ============================================================================
-- 1. seed_default_agents: corrected 12-specialist roster (+ the orchestrator,
--    seeded separately by seed_orchestrator_agent, unchanged below).
-- ============================================================================
CREATE OR REPLACE FUNCTION public.seed_default_agents(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.agents (user_id, slug, name, role, system_prompt, color, enabled) VALUES
    (_user_id, 'discovery-scout', 'Discovery Scout', 'Signal mining & opportunity framing',
      'Mine signals and surface themes. Terse.', 'violet', true),
    (_user_id, 'strategist', 'Strategist', 'Product strategy & prioritisation',
      'Senior product strategist. Structured. Concise.', 'cyan', true),
    (_user_id, 'prd-writer', 'PRD Writer', 'Spec generation',
      'Generate crisp PRDs. No hedging.', 'emerald', true),
    (_user_id, 'builder', 'Studio', 'In-platform development engine',
      'In-platform development engine.', 'blue', true),
    (_user_id, 'researcher', 'Researcher', 'User & market research',
      'Run interviews, benchmark competitors, synthesize evidence.', 'amber', true),
    (_user_id, 'qa', 'QA Reviewer', 'Eval + quality gate',
      'Write eval cases; block ships that regress.', 'rose', true),
    (_user_id, 'release', 'Release Coordinator', 'Ship / rollout',
      'Coordinate ships behind flags; watch launch metrics.', 'teal', true),
    (_user_id, 'critic', 'Critic', 'Adversarial reviewer',
      'Argue the strongest case against every decision.', 'red', true),
    (_user_id, 'sprint-planner', 'Sprint Planner', 'Sequencing + capacity',
      'Turn decisions into a sequenced sprint plan.', 'orange', true),
    (_user_id, 'customer-insights', 'Listen', 'Voice of the customer',
      'Cluster feedback into named themes.', 'pink', true),
    (_user_id, 'ux-architect', 'Design', 'User & interaction design',
      'Map flows and screen states before the build.', 'indigo', true),
    (_user_id, 'data-analyst', 'Measure', 'Outcome measurement & memory',
      'Read outcomes against the bet; feed memory.', 'sky', true)
  ON CONFLICT (user_id, slug) DO UPDATE
    SET name = EXCLUDED.name, role = EXCLUDED.role, system_prompt = EXCLUDED.system_prompt,
        color = EXCLUDED.color, enabled = true;

  -- Demo-seed FK compatibility only, always disabled: seed_sample_workspace
  -- (20260705120000) looks up an agent row by slug='engineer' and wires its id
  -- into ~12 FK columns across its two seeded product narratives. That slug is
  -- deliberately no longer part of the ACTIVE roster above (it collided with
  -- 'builder', which is the whole point of this migration), so without this
  -- row that lookup would resolve to NULL and silently break those FKs on the
  -- next sample-workspace seed (the dormant per-signup path, or the manual
  -- reseed path documented in demo-credentials.md). Keeping it permanently
  -- disabled means it can never reappear as a live duplicate in any fleet/
  -- presence/relay surface - none of those look up agents by 'engineer'.
  INSERT INTO public.agents (user_id, slug, name, role, system_prompt, color, enabled) VALUES
    (_user_id, 'engineer', 'Engineer', 'Deprecated alias of Builder',
      'Deprecated - kept only for demo-seed FK compatibility, never active.', 'blue', false)
  ON CONFLICT (user_id, slug) DO UPDATE
    SET enabled = false;

  -- The orchestrator plans + dispatches multi-agent missions; every other
  -- roster agent above is a no-op without it if a mission ever needs
  -- re-planning (resume-runs.ts KI-17). Unchanged from 20260709070000.
  PERFORM public.seed_orchestrator_agent(_user_id);
END;
$$;

-- ============================================================================
-- 2. Existing accounts: retag every agent_slug-shaped column from the
--    deprecated slug to its canonical replacement, then deactivate (not
--    delete) any leftover duplicate row in public.agents. Each table gets its
--    own exception-safe block so one missing/renamed table never blocks the
--    rest, matching the established pattern in 20260708100000.
--
--    Colliding pairs:  engineer -> builder | stakeholder -> release | copilot -> orchestrator
--
--    Every column below is on a row that already carries its own user_id (or
--    a workspace_id whose membership resolves to a user); the UPDATEs below
--    only ever rewrite the slug VALUE in place on that same row, so no row's
--    ownership changes and no other user's data is touched.
-- ============================================================================

-- 2a. public.agent_memory.agent_slug
DO $$
BEGIN
  UPDATE public.agent_memory SET agent_slug = 'builder' WHERE agent_slug = 'engineer';
  UPDATE public.agent_memory SET agent_slug = 'release' WHERE agent_slug = 'stakeholder';
  UPDATE public.agent_memory SET agent_slug = 'orchestrator' WHERE agent_slug = 'copilot';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'PC-29 retag failed for agent_memory.agent_slug: %', SQLERRM;
END $$;

-- 2b. public.agent_messages.from_agent_slug / to_agent_slug
DO $$
BEGIN
  UPDATE public.agent_messages SET from_agent_slug = 'builder' WHERE from_agent_slug = 'engineer';
  UPDATE public.agent_messages SET from_agent_slug = 'release' WHERE from_agent_slug = 'stakeholder';
  UPDATE public.agent_messages SET from_agent_slug = 'orchestrator' WHERE from_agent_slug = 'copilot';
  UPDATE public.agent_messages SET to_agent_slug = 'builder' WHERE to_agent_slug = 'engineer';
  UPDATE public.agent_messages SET to_agent_slug = 'release' WHERE to_agent_slug = 'stakeholder';
  UPDATE public.agent_messages SET to_agent_slug = 'orchestrator' WHERE to_agent_slug = 'copilot';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'PC-29 retag failed for agent_messages.{from,to}_agent_slug: %', SQLERRM;
END $$;

-- 2c. public.agent_runs.agent_slug
DO $$
BEGIN
  UPDATE public.agent_runs SET agent_slug = 'builder' WHERE agent_slug = 'engineer';
  UPDATE public.agent_runs SET agent_slug = 'release' WHERE agent_slug = 'stakeholder';
  UPDATE public.agent_runs SET agent_slug = 'orchestrator' WHERE agent_slug = 'copilot';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'PC-29 retag failed for agent_runs.agent_slug: %', SQLERRM;
END $$;

-- 2d. public.decisions.decided_by_agent_slug
DO $$
BEGIN
  UPDATE public.decisions SET decided_by_agent_slug = 'builder' WHERE decided_by_agent_slug = 'engineer';
  UPDATE public.decisions SET decided_by_agent_slug = 'release' WHERE decided_by_agent_slug = 'stakeholder';
  UPDATE public.decisions SET decided_by_agent_slug = 'orchestrator' WHERE decided_by_agent_slug = 'copilot';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'PC-29 retag failed for decisions.decided_by_agent_slug: %', SQLERRM;
END $$;

-- 2e. public.event_subscriptions.target_agent_slug
DO $$
BEGIN
  UPDATE public.event_subscriptions SET target_agent_slug = 'builder' WHERE target_agent_slug = 'engineer';
  UPDATE public.event_subscriptions SET target_agent_slug = 'release' WHERE target_agent_slug = 'stakeholder';
  UPDATE public.event_subscriptions SET target_agent_slug = 'orchestrator' WHERE target_agent_slug = 'copilot';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'PC-29 retag failed for event_subscriptions.target_agent_slug: %', SQLERRM;
END $$;

-- 2f. public.mission_steps.agent_slug
DO $$
BEGIN
  UPDATE public.mission_steps SET agent_slug = 'builder' WHERE agent_slug = 'engineer';
  UPDATE public.mission_steps SET agent_slug = 'release' WHERE agent_slug = 'stakeholder';
  UPDATE public.mission_steps SET agent_slug = 'orchestrator' WHERE agent_slug = 'copilot';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'PC-29 retag failed for mission_steps.agent_slug: %', SQLERRM;
END $$;

-- 2g. public.agent_approvals.agent_slug
DO $$
BEGIN
  UPDATE public.agent_approvals SET agent_slug = 'builder' WHERE agent_slug = 'engineer';
  UPDATE public.agent_approvals SET agent_slug = 'release' WHERE agent_slug = 'stakeholder';
  UPDATE public.agent_approvals SET agent_slug = 'orchestrator' WHERE agent_slug = 'copilot';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'PC-29 retag failed for agent_approvals.agent_slug: %', SQLERRM;
END $$;

-- 2h. public.agent_tool_modes.agent_slug (SW-4 trust ramp: graduated per-tool mode)
DO $$
BEGIN
  UPDATE public.agent_tool_modes SET agent_slug = 'builder' WHERE agent_slug = 'engineer';
  UPDATE public.agent_tool_modes SET agent_slug = 'release' WHERE agent_slug = 'stakeholder';
  UPDATE public.agent_tool_modes SET agent_slug = 'orchestrator' WHERE agent_slug = 'copilot';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'PC-29 retag failed for agent_tool_modes.agent_slug: %', SQLERRM;
END $$;

-- 2i. public.trust_graduation_proposals.agent_slug
DO $$
BEGIN
  UPDATE public.trust_graduation_proposals SET agent_slug = 'builder' WHERE agent_slug = 'engineer';
  UPDATE public.trust_graduation_proposals SET agent_slug = 'release' WHERE agent_slug = 'stakeholder';
  UPDATE public.trust_graduation_proposals SET agent_slug = 'orchestrator' WHERE agent_slug = 'copilot';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'PC-29 retag failed for trust_graduation_proposals.agent_slug: %', SQLERRM;
END $$;

-- 2j. public.learnings.recorded_by_agent_slug
DO $$
BEGIN
  UPDATE public.learnings SET recorded_by_agent_slug = 'builder' WHERE recorded_by_agent_slug = 'engineer';
  UPDATE public.learnings SET recorded_by_agent_slug = 'release' WHERE recorded_by_agent_slug = 'stakeholder';
  UPDATE public.learnings SET recorded_by_agent_slug = 'orchestrator' WHERE recorded_by_agent_slug = 'copilot';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'PC-29 retag failed for learnings.recorded_by_agent_slug: %', SQLERRM;
END $$;

-- 2k. public.artifact_lineage.created_by_agent
DO $$
BEGIN
  UPDATE public.artifact_lineage SET created_by_agent = 'builder' WHERE created_by_agent = 'engineer';
  UPDATE public.artifact_lineage SET created_by_agent = 'release' WHERE created_by_agent = 'stakeholder';
  UPDATE public.artifact_lineage SET created_by_agent = 'orchestrator' WHERE created_by_agent = 'copilot';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'PC-29 retag failed for artifact_lineage.created_by_agent: %', SQLERRM;
END $$;

-- 2l. Refresh the two materialized views that group by decided_by_agent_slug /
--     agent_slug (AFD-10, AFD-11) so their per-agent breakdown reflects the
--     retag above instead of the stale deprecated slugs. Plain (non-
--     CONCURRENTLY) refresh: CONCURRENTLY cannot run inside a PL/pgSQL block.
DO $$
BEGIN
  REFRESH MATERIALIZED VIEW public.mv_supersession_rate;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'PC-29 refresh failed for mv_supersession_rate: %', SQLERRM;
END $$;

DO $$
BEGIN
  REFRESH MATERIALIZED VIEW public.mv_agent_cost_per_decision;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'PC-29 refresh failed for mv_agent_cost_per_decision: %', SQLERRM;
END $$;

-- 2m. public.agents: deactivate (never delete) a leftover duplicate row, only
--     once its canonical replacement is confirmed active for that same user.
--     Historical referential integrity (agent_runs, decisions, ... above) is
--     preserved because the row still exists; it just stops appearing as a
--     second live specialist.
DO $$
BEGIN
  UPDATE public.agents leftover
  SET enabled = false
  WHERE leftover.slug IN ('engineer', 'stakeholder', 'copilot')
    AND leftover.enabled = true
    AND EXISTS (
      SELECT 1 FROM public.agents canon
      WHERE canon.user_id = leftover.user_id
        AND canon.enabled = true
        AND canon.slug = CASE leftover.slug
          WHEN 'engineer' THEN 'builder'
          WHEN 'stakeholder' THEN 'release'
          WHEN 'copilot' THEN 'orchestrator'
        END
    );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'PC-29 deactivate-leftover failed for public.agents: %', SQLERRM;
END $$;

-- ============================================================================
-- 3. Backfill: seed the 3 newly-added specialists (customer-insights,
--    ux-architect, data-analyst) for every existing account missing at least
--    one of them. seed_default_agents is idempotent (ON CONFLICT DO UPDATE),
--    so this only ever inserts the missing rows for a given user; it does not
--    touch the engineer/stakeholder/copilot rows (no longer part of the
--    insert list above), which were already handled in step 2m. Same
--    agent-less/slug-less scoping pattern as 20260708100000.
-- ============================================================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.id
    FROM public.profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.agents a WHERE a.user_id = p.id AND a.slug = 'customer-insights'
    )
    OR NOT EXISTS (
      SELECT 1 FROM public.agents a WHERE a.user_id = p.id AND a.slug = 'ux-architect'
    )
    OR NOT EXISTS (
      SELECT 1 FROM public.agents a WHERE a.user_id = p.id AND a.slug = 'data-analyst'
    )
  LOOP
    BEGIN
      PERFORM public.seed_default_agents(r.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'PC-29 specialist backfill failed for %: %', r.id, SQLERRM;
    END;
  END LOOP;
END $$;
