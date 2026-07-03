-- OBS-15 (chart grammar adoption): demo workspace chart-history seed.
--
-- WHY: the Obsidian Engine Room (Spend/TREND, Quality/SCORE) and the Brain stat trio now
-- draw real sparklines from existing, unmodified queries and pure functions
-- (getAnalyticsOverview.daily, getEvalHealth.scoreTrend, getImpactLedger.decisionsTrend).
-- No new query, no new table, no schema change.
--
-- The base demo seed (seed_demo_workspace, migration 20260604214243) clusters its 18
-- ai_events within the last 18 hours and writes exactly 1 eval_runs row on a single day, so
-- on the demo accounts those queries have too few distinct days/points for a sparkline to
-- draw a real line (Sparkline needs >= 2 points and renders nothing otherwise). This
-- migration adds MORE REAL rows to the SAME tables with the SAME columns as that seed,
-- spread across the last 2-8 weeks, so the demo accounts (the ones used for screen
-- recordings and demos) show a genuine trend instead of a flat or empty chart. No column is
-- invented; ai_events/eval_runs/decisions all already carry every field written here.
--
-- Idempotent + demo-scoped (auth.users by email), same pattern as
-- 20260613180000_w6_demo_trusted_seed.sql. Guarded so re-running never duplicates:
--   - ai_events rows are tagged surface_ref = 'demo:lumen:obs15-seed' (the base seed uses
--     'demo:lumen'), guarded with NOT EXISTS on that tag.
--   - eval_runs rows are tagged trigger = 'obs15_seed' (the base seed uses 'manual'),
--     guarded with NOT EXISTS on that tag.
--   - decisions rows carry a distinguishing rationale prefix, guarded with NOT EXISTS on it.
-- avg_score is written on the 0-100 scale (KI-14, migration 20260614160000 widened
-- eval_runs.avg_score to numeric(6,3) and rescaled the seed off the old 0-1 fractions).

DO $$
DECLARE
  demo_email text;
  v_user uuid;
  v_ws uuid;
  v_prj uuid;
  v_suite uuid;
  i int;
BEGIN
  FOREACH demo_email IN ARRAY ARRAY['demo@redcadence.app', 'demo2@redcadence.app'] LOOP
    SELECT id INTO v_user FROM auth.users WHERE email = demo_email LIMIT 1;
    CONTINUE WHEN v_user IS NULL;

    SELECT id INTO v_ws FROM public.workspaces WHERE owner_id = v_user AND name = 'Demo workspace' LIMIT 1;
    CONTINUE WHEN v_ws IS NULL;

    SELECT id INTO v_prj FROM public.projects WHERE workspace_id = v_ws AND name = 'Lumen' LIMIT 1;
    SELECT id INTO v_suite FROM public.eval_suites WHERE user_id = v_user AND name = 'Lumen — protected topic escalation' LIMIT 1;

    -- (1) Spend/TREND: 8 more days of ai_events, one per day, real cost/token fields in the
    -- same shape as the base seed's own loop (20260604214243, lines ~245-262).
    IF v_prj IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.ai_events WHERE workspace_id = v_ws AND surface_ref = 'demo:lumen:obs15-seed'
    ) THEN
      FOR i IN 1..8 LOOP
        INSERT INTO public.ai_events (
          user_id, workspace_id, product_id, trace_id, surface, surface_ref, provider, via,
          model, prompt_tokens, completion_tokens, total_tokens, est_cost_usd, latency_ms,
          ttft_ms, status, fallback, cache_hit, input_preview, output_preview, created_at
        )
        VALUES (
          v_user, v_ws, v_prj, gen_random_uuid(),
          (ARRAY['chat', 'agent', 'copilot', 'discovery'])[((i - 1) % 4) + 1],
          'demo:lumen:obs15-seed', 'openai', 'lovable', 'openai/gpt-5',
          420 + (i * 29) % 500, 140 + (i * 17) % 300, 600 + (i * 46) % 800,
          ROUND((0.0018 + (i % 5) * 0.0014)::numeric, 5),
          500 + (i * 97) % 2000, 90 + (i * 13) % 200,
          'success', false, i % 4 = 0,
          'Triage ticket #' || (1400 + i) || ' from ' || (ARRAY['Acme', 'Northwind', 'Vector', 'Initech'])[((i - 1) % 4) + 1],
          'Drafted reply, confidence 0.' || (72 + (i * 4) % 24),
          now() - (i || ' days')::interval - ((i * 3) || ' hours')::interval
        );
      END LOOP;
    END IF;

    -- (2) Quality/SCORE: 5 more eval_runs on the existing suite, spread over the last two
    -- weeks, avg_score trending up so the sparkline reads as a real quality climb.
    IF v_suite IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.eval_runs WHERE suite_id = v_suite AND trigger = 'obs15_seed'
    ) THEN
      -- created_at is set explicitly (matching started_at) because it is the column
      -- getEvalHealth/computeEvalHealth actually sort and bucket on, never
      -- started_at/completed_at. A bare multi-row INSERT would otherwise leave
      -- created_at at its `DEFAULT now()`, identical for all 5 rows (Postgres
      -- evaluates now() once per statement), collapsing the intended 14/11/8/5/2-day
      -- spread into a single tied timestamp and losing the chronological order the
      -- scoreTrend sparkline depends on.
      INSERT INTO public.eval_runs (
        suite_id, user_id, model, status, pass_count, fail_count, avg_score, total_cost_usd,
        judge_model, trigger, total_cases, errored, total_latency_ms, started_at, completed_at,
        created_at
      )
      VALUES
        (v_suite, v_user, 'openai/gpt-5', 'completed', 2, 2, 68.0, 0.0201, 'openai/gpt-5', 'obs15_seed', 4, 0, 6100, now() - INTERVAL '14 days', now() - INTERVAL '14 days' + INTERVAL '6 seconds', now() - INTERVAL '14 days'),
        (v_suite, v_user, 'openai/gpt-5', 'completed', 3, 1, 74.0, 0.0219, 'openai/gpt-5', 'obs15_seed', 4, 0, 6250, now() - INTERVAL '11 days', now() - INTERVAL '11 days' + INTERVAL '6 seconds', now() - INTERVAL '11 days'),
        (v_suite, v_user, 'openai/gpt-5', 'completed', 3, 1, 79.0, 0.0227, 'openai/gpt-5', 'obs15_seed', 4, 0, 6300, now() - INTERVAL '8 days', now() - INTERVAL '8 days' + INTERVAL '6 seconds', now() - INTERVAL '8 days'),
        (v_suite, v_user, 'openai/gpt-5', 'completed', 4, 0, 85.0, 0.0230, 'openai/gpt-5', 'obs15_seed', 4, 0, 6350, now() - INTERVAL '5 days', now() - INTERVAL '5 days' + INTERVAL '6 seconds', now() - INTERVAL '5 days'),
        (v_suite, v_user, 'openai/gpt-5', 'completed', 4, 0, 88.0, 0.0233, 'openai/gpt-5', 'obs15_seed', 4, 0, 6380, now() - INTERVAL '2 days', now() - INTERVAL '2 days' + INTERVAL '6 seconds', now() - INTERVAL '2 days');
    END IF;

    -- (3) Brain stat trio: 5 more decisions on the same Lumen project, backdated across the
    -- last 8 weeks so the decisions-per-week sparkline has real variation instead of a
    -- single same-day cluster (the base seed's 3 decisions all land in one instant).
    IF v_prj IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.decisions WHERE workspace_id = v_ws AND rationale = 'OBS-15 seed. Backdated for the decision-cadence sparkline.'
    ) THEN
      INSERT INTO public.decisions (user_id, workspace_id, project_id, title, rationale, status, created_at) VALUES
        (v_user, v_ws, v_prj, 'Ship the policy DSL behind a flag, not a config UI', 'OBS-15 seed. Backdated for the decision-cadence sparkline.', 'approved', now() - INTERVAL '52 days'),
        (v_user, v_ws, v_prj, 'Delay Smart Off-Hours Routing to November', 'OBS-15 seed. Backdated for the decision-cadence sparkline.', 'approved', now() - INTERVAL '38 days'),
        (v_user, v_ws, v_prj, 'Escalate every GDPR request, never auto-resolve', 'OBS-15 seed. Backdated for the decision-cadence sparkline.', 'approved', now() - INTERVAL '24 days'),
        (v_user, v_ws, v_prj, 'Add a Finance approval step before refund credits', 'OBS-15 seed. Backdated for the decision-cadence sparkline.', 'approved', now() - INTERVAL '17 days'),
        (v_user, v_ws, v_prj, 'Track CSAT recovery weekly through the policy rollout', 'OBS-15 seed. Backdated for the decision-cadence sparkline.', 'approved', now() - INTERVAL '6 days');
    END IF;
  END LOOP;
END $$;
