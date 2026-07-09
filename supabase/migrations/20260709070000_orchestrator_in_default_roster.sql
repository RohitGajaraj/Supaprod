-- SW-7 root-cause fix (found live): resume-runs.ts's KI-17 re-plan path calls
-- runAgentLoop with agentSlug='orchestrator' unconditionally, but 'orchestrator'
-- was never part of seed_default_agents (the roster handle_new_user seeds at
-- signup) - it only ever got created lazily, the first time a user explicitly
-- started an orchestrated mission (ensureOrchestrator / startOrchestratedMission
-- in orchestrator.functions.ts). Any account that never did that, but DID hit
-- the automatic re-plan sweep, failed forever with "Unknown agent: orchestrator"
-- - discovered live via two genuinely stuck accounts, whose dead missions were
-- also permanently starving resume-runs' fixed per-tick re-plan budget for
-- every OTHER tenant on the platform (REPLAN_BATCH slots ordered oldest-first,
-- so unkillable old failures always won the slot). A one-time backfill closes
-- today's incident but not tomorrow's signups, so this fixes it at the root:
-- seed_default_agents now seeds the orchestrator (agent row + its mission.*
-- tools) exactly like the other 12 roster agents, every signup, permanently.
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
    (_user_id, 'engineer', 'Engineer', 'Backend / systems engineering',
      'Design and implement backend systems.', 'sky', true),
    (_user_id, 'researcher', 'Researcher', 'User & market research',
      'Run interviews, benchmark competitors, synthesize evidence.', 'amber', true),
    (_user_id, 'qa', 'QA Reviewer', 'Eval + quality gate',
      'Write eval cases; block ships that regress.', 'rose', true),
    (_user_id, 'release', 'Release Coordinator', 'Ship / rollout',
      'Coordinate ships behind flags; watch launch metrics.', 'teal', true),
    (_user_id, 'critic', 'Critic', 'Adversarial reviewer',
      'Argue the strongest case against every decision.', 'red', true),
    (_user_id, 'stakeholder', 'Stakeholder Comms', 'Update owners and partners',
      'Draft stakeholder updates; keep them decision-oriented.', 'indigo', true),
    (_user_id, 'sprint-planner', 'Sprint Planner', 'Sequencing + capacity',
      'Turn decisions into a sequenced sprint plan.', 'orange', true),
    (_user_id, 'copilot', 'Copilot', 'Assistant',
      'General-purpose in-app copilot.', 'slate', true)
  ON CONFLICT (user_id, slug) DO UPDATE
    SET name = EXCLUDED.name, role = EXCLUDED.role, system_prompt = EXCLUDED.system_prompt,
        color = EXCLUDED.color, enabled = true;

  -- The orchestrator plans + dispatches multi-agent missions; every other
  -- roster agent above is a no-op without it if a mission ever needs
  -- re-planning (resume-runs.ts KI-17). Its full setup (system prompt +
  -- mission.* tools) lives in seed_orchestrator_agent, already idempotent.
  PERFORM public.seed_orchestrator_agent(_user_id);
END;
$$;

-- Backfill: covered live for the currently-known accounts this session, but
-- run it here too so this migration is a complete, standalone fix on its own
-- (idempotent - ON CONFLICT DO UPDATE, safe to re-run).
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM auth.users LOOP
    BEGIN
      PERFORM public.seed_orchestrator_agent(r.id);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'orchestrator backfill failed for %: %', r.id, SQLERRM;
    END;
  END LOOP;
END $$;
