create table if not exists public.design_memory (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid(),
  workspace_id uuid not null default public.current_user_default_workspace() references public.workspaces (id) on delete cascade,
  category     text not null check (category in ('token','type','spacing','principle','voice','pattern')),
  title        text not null,
  content      text not null,
  rationale    text,
  source_kind  text not null default 'default' check (source_kind in ('url_import','pasted','default','learned')),
  status       text not null default 'pending' check (status in ('pending','approved','rejected')),
  decided_by   uuid,
  decided_at   timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists design_memory_ws_status_idx on public.design_memory (workspace_id, status, category, created_at desc);
alter table public.design_memory enable row level security;
grant select, insert, update, delete on public.design_memory to authenticated;
grant all on public.design_memory to service_role;
drop policy if exists "design_memory ws read" on public.design_memory;
create policy "design_memory ws read" on public.design_memory for select using (public.is_workspace_member(workspace_id));
drop policy if exists "design_memory ws write" on public.design_memory;
create policy "design_memory ws write" on public.design_memory for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

ALTER TABLE public.user_notification_preferences
  ADD COLUMN IF NOT EXISTS digest_stakeholder_update boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS digest_stakeholder_audience text NOT NULL DEFAULT 'exec'
    CHECK (digest_stakeholder_audience = ANY (ARRAY['exec','eng','board']));

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $mig$
DECLARE
  base_url text := 'https://project--371dd588-1b70-4629-9bb5-9f003f3af373.lovable.app';
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'prompt-optimize-tick';
  PERFORM cron.schedule(
    'prompt-optimize-tick',
    '0 10 * * 2',
    format($job$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-key', public.get_cron_hook_secret()
        ),
        body := '{}'::jsonb
      ) AS request_id;
    $job$, base_url || '/api/public/hooks/prompt-optimize-tick')
  );
END $mig$;

DO $seed$
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

    IF v_suite IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.eval_runs WHERE suite_id = v_suite AND trigger = 'obs15_seed'
    ) THEN
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
END $seed$;

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
  VALUES (p_user_id, p_agent_id, 'observing')
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