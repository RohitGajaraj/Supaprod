CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  base_url text := 'https://project--371dd588-1b70-4629-9bb5-9f003f3af373.lovable.app';
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'delegate-poll-tick';
  PERFORM cron.schedule('delegate-poll-tick', '*/5 * * * *',
    format($job$SELECT net.http_post(url:=%L,headers:=jsonb_build_object('Content-Type','application/json','x-cron-key',public.get_cron_hook_secret()),body:='{}'::jsonb) AS request_id;$job$, base_url || '/api/public/hooks/delegate-poll-tick'));

  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'competitor-tick';
  PERFORM cron.schedule('competitor-tick', '0 8 * * 1',
    format($job$SELECT net.http_post(url:=%L,headers:=jsonb_build_object('Content-Type','application/json','x-cron-key',public.get_cron_hook_secret()),body:='{}'::jsonb) AS request_id;$job$, base_url || '/api/public/hooks/competitor-tick'));

  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'calibrate-tick';
  PERFORM cron.schedule('calibrate-tick', '0 */6 * * *',
    format($job$SELECT net.http_post(url:=%L,headers:=jsonb_build_object('Content-Type','application/json','x-cron-key',public.get_cron_hook_secret()),body:='{}'::jsonb) AS request_id;$job$, base_url || '/api/public/hooks/calibrate-tick'));

  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'assumption-watch-tick';
  PERFORM cron.schedule('assumption-watch-tick', '0 */4 * * *',
    format($job$SELECT net.http_post(url:=%L,headers:=jsonb_build_object('Content-Type','application/json','x-cron-key',public.get_cron_hook_secret()),body:='{}'::jsonb) AS request_id;$job$, base_url || '/api/public/hooks/assumption-watch-tick'));

  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'digest-tick';
  PERFORM cron.schedule('digest-tick', '0 * * * *',
    format($job$SELECT net.http_post(url:=%L,headers:=jsonb_build_object('Content-Type','application/json','x-cron-key',public.get_cron_hook_secret()),body:='{}'::jsonb) AS request_id;$job$, base_url || '/api/public/hooks/digest-tick'));

  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'house-rules-tick';
  PERFORM cron.schedule('house-rules-tick', '0 10 * * 1',
    format($job$SELECT net.http_post(url:=%L,headers:=jsonb_build_object('Content-Type','application/json','x-cron-key',public.get_cron_hook_secret()),body:='{}'::jsonb) AS request_id;$job$, base_url || '/api/public/hooks/house-rules-tick'));

  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'cadence-indexer-tick';
  PERFORM cron.schedule('cadence-indexer-tick', '7 * * * *',
    format($job$SELECT net.http_post(url:=%L,headers:=jsonb_build_object('Content-Type','application/json','x-cron-key',public.get_cron_hook_secret()),body:='{}'::jsonb) AS request_id;$job$, base_url || '/api/public/hooks/indexer-tick'));

  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'cadence-eval-suite-tick';
  PERFORM cron.schedule('cadence-eval-suite-tick', '0 3 * * *',
    format($job$SELECT net.http_post(url:=%L,headers:=jsonb_build_object('Content-Type','application/json','x-cron-key',public.get_cron_hook_secret()),body:='{}'::jsonb) AS request_id;$job$, base_url || '/api/public/hooks/eval-suite-tick'));

  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'cadence-drift-tick';
  PERFORM cron.schedule('cadence-drift-tick', '0 4 * * *',
    format($job$SELECT net.http_post(url:=%L,headers:=jsonb_build_object('Content-Type','application/json','x-cron-key',public.get_cron_hook_secret()),body:='{}'::jsonb) AS request_id;$job$, base_url || '/api/public/hooks/drift-tick'));

  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'cadence-eval-tick';
  PERFORM cron.schedule('cadence-eval-tick', '*/30 * * * *',
    format($job$SELECT net.http_post(url:=%L,headers:=jsonb_build_object('Content-Type','application/json','x-cron-key',public.get_cron_hook_secret()),body:='{}'::jsonb) AS request_id;$job$, base_url || '/api/public/hooks/eval-tick'));
END $$;

-- signals.source_kind
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS source_kind text;
UPDATE public.signals SET source_kind = CASE
  WHEN source IN ('github', 'posthog_analytics') THEN 'pull_connector'
  WHEN source = 'competitive_research' THEN 'web_scout'
  WHEN source = 'mcp' THEN 'mcp_source'
  WHEN source = 'webhook' THEN 'webhook'
  ELSE 'manual'
END WHERE source_kind IS NULL;
ALTER TABLE public.signals DROP CONSTRAINT IF EXISTS signals_source_kind_check;
ALTER TABLE public.signals ADD CONSTRAINT signals_source_kind_check
  CHECK (source_kind IS NULL OR source_kind IN ('pull_connector','web_scout','mcp_source','webhook','manual'));

-- seed_default_agent_tools + backfill
CREATE OR REPLACE FUNCTION public.seed_default_agent_tools(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.agent_tools (user_id, tool_name, display_name, description, category, mode, built_in) VALUES
    (_user_id, 'workspace.search',     'Search workspace',     'Semantic search across docs, PRDs, notes, signals, meetings.', 'read',     'auto',    true),
    (_user_id, 'workspace.list_tasks', 'List tasks',           'List open tasks with optional filter.',                         'read',     'auto',    true),
    (_user_id, 'tasks.create',         'Create task',          'Create a task in the workspace.',                               'write',    'confirm', true),
    (_user_id, 'tasks.update_status',  'Update task',          'Change a task status.',                                         'write',    'confirm', true),
    (_user_id, 'signals.log',          'Log signal',           'Log a discovery signal.',                                       'write',    'confirm', true),
    (_user_id, 'notes.create',         'Save note',            'Save a free-form note.',                                        'write',    'confirm', true),
    (_user_id, 'memory.remember',      'Remember',             'Save a long-term memory.',                                      'memory',   'auto',    true),
    (_user_id, 'scheduler.propose',    'Propose slots',        'Generate calendar slot proposals.',                             'planning', 'auto',    true),
    (_user_id, 'calendar.create',      'Create event',         'Create a calendar event.',                                      'write',    'confirm', true),
    (_user_id, 'github.issue.create',  'Open GitHub issue',    'Open a GitHub issue on the connected product repo.',            'write',    'confirm', true),
    (_user_id, 'agent.handoff',        'Hand off to agent',    'Pass mission to another specialist agent.',                     'planning', 'auto',    true),
    (_user_id, 'signals.list',         'List signals',         'List recent signals.',                                          'read',     'auto',    true),
    (_user_id, 'themes.list',          'List themes',          'List clustered signal themes.',                                 'read',     'auto',    true),
    (_user_id, 'sources.status',       'Sources status',       'Show signal ingestion health.',                                 'read',     'auto',    true),
    (_user_id, 'cluster.trigger',      'Trigger clustering',   'Re-run signal clustering.',                                     'write',    'confirm', true),
    (_user_id, 'sources.connect',      'Connect a source',     'Look up source setup instructions.',                            'read',     'auto',    true),
    (_user_id, 'delegate.openhands',   'Delegate to OpenHands','Delegate a build task to an external OpenHands coding agent.',  'write',    'review',  true)
  ON CONFLICT (user_id, tool_name) DO NOTHING;
  PERFORM public.seed_pm_lifecycle_tools(_user_id);
END $function$;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.profiles LOOP
    PERFORM public.seed_default_agent_tools(r.id);
  END LOOP;
END $$;

-- hosted_apps schema
CREATE SCHEMA IF NOT EXISTS hosted_apps;
REVOKE ALL ON SCHEMA hosted_apps FROM PUBLIC;
GRANT ALL ON SCHEMA hosted_apps TO service_role;

-- ai_events service-role safety
CREATE OR REPLACE FUNCTION public.ensure_user_default_workspace(_user_id uuid)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  existing_workspace_id uuid;
  created_workspace_id uuid;
BEGIN
  IF _user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT m.workspace_id INTO existing_workspace_id
  FROM public.workspace_members m WHERE m.user_id = _user_id
  ORDER BY m.created_at LIMIT 1;
  IF existing_workspace_id IS NOT NULL THEN RETURN existing_workspace_id; END IF;

  SELECT w.id INTO existing_workspace_id
  FROM public.workspaces w WHERE w.owner_id = _user_id
  ORDER BY w.created_at LIMIT 1;
  IF existing_workspace_id IS NOT NULL THEN
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (existing_workspace_id, _user_id, 'owner')
    ON CONFLICT (workspace_id, user_id) DO NOTHING;
    RETURN existing_workspace_id;
  END IF;

  INSERT INTO public.workspaces (owner_id, name) VALUES (_user_id, 'My Workspace')
  RETURNING id INTO created_workspace_id;
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (created_workspace_id, _user_id, 'owner')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;
  RETURN created_workspace_id;
END;
$function$;

ALTER TABLE public.ai_events ALTER COLUMN workspace_id DROP NOT NULL;

-- FS-01 columns
ALTER TABLE public.insights
  ADD COLUMN IF NOT EXISTS claim text,
  ADD COLUMN IF NOT EXISTS horizon_date timestamptz,
  ADD COLUMN IF NOT EXISTS resolution text CHECK (resolution IS NULL OR resolution IN ('hit', 'miss', 'inconclusive')),
  ADD COLUMN IF NOT EXISTS brier_score real,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

CREATE INDEX IF NOT EXISTS insights_due_for_calibration_idx
  ON public.insights (workspace_id, horizon_date)
  WHERE kind IN ('prediction', 'risk') AND status = 'open' AND resolution IS NULL;

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS prediction_throttle_until timestamptz,
  ADD COLUMN IF NOT EXISTS risk_throttle_until timestamptz;

-- FS-02 assumptions + challenges
CREATE TABLE IF NOT EXISTS public.assumptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workspace_id uuid NOT NULL DEFAULT public.current_user_default_workspace() REFERENCES public.workspaces (id) ON DELETE CASCADE,
  decision_id uuid NOT NULL REFERENCES public.decisions (id) ON DELETE CASCADE,
  statement text NOT NULL,
  status text NOT NULL DEFAULT 'standing' CHECK (status IN ('standing', 'challenged', 'superseded')),
  last_watched_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assumptions TO authenticated;
GRANT ALL ON public.assumptions TO service_role;
ALTER TABLE public.assumptions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_assumptions_ws_status ON public.assumptions (workspace_id, status, last_watched_at ASC NULLS FIRST);
CREATE INDEX IF NOT EXISTS idx_assumptions_decision ON public.assumptions (decision_id);
DROP POLICY IF EXISTS "assumptions ws read" ON public.assumptions;
CREATE POLICY "assumptions ws read" ON public.assumptions FOR SELECT USING (public.is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "assumptions ws write" ON public.assumptions;
CREATE POLICY "assumptions ws write" ON public.assumptions FOR ALL USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));
DROP TRIGGER IF EXISTS assumptions_updated_at ON public.assumptions;
CREATE TRIGGER assumptions_updated_at BEFORE UPDATE ON public.assumptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.assumption_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  assumption_id uuid NOT NULL REFERENCES public.assumptions (id) ON DELETE CASCADE,
  signal_id uuid REFERENCES public.signals (id) ON DELETE SET NULL,
  learning_id uuid REFERENCES public.learnings (id) ON DELETE SET NULL,
  rationale text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'confirmed', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  decided_at timestamptz,
  decided_by uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assumption_challenges TO authenticated;
GRANT ALL ON public.assumption_challenges TO service_role;
ALTER TABLE public.assumption_challenges ENABLE ROW LEVEL SECURITY;
CREATE UNIQUE INDEX IF NOT EXISTS uq_assumption_challenges_open ON public.assumption_challenges (assumption_id) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_assumption_challenges_ws_status ON public.assumption_challenges (workspace_id, status, created_at DESC);
DROP POLICY IF EXISTS "assumption_challenges ws read" ON public.assumption_challenges;
CREATE POLICY "assumption_challenges ws read" ON public.assumption_challenges FOR SELECT USING (public.is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "assumption_challenges ws write" ON public.assumption_challenges;
CREATE POLICY "assumption_challenges ws write" ON public.assumption_challenges FOR ALL USING (public.is_workspace_member(workspace_id)) WITH CHECK (public.is_workspace_member(workspace_id));

-- FS-03 reach channel columns
ALTER TABLE public.agent_approvals ADD COLUMN IF NOT EXISTS expiry_notified_at timestamptz;
ALTER TABLE public.user_notification_preferences ADD COLUMN IF NOT EXISTS last_digest_sent_at timestamptz;

-- RF-01 outcome_suggestion
ALTER TABLE public.prds ADD COLUMN IF NOT EXISTS outcome_suggestion jsonb;

-- CNV-01 contract
ALTER TABLE public.prds
  ADD COLUMN IF NOT EXISTS contract jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS contract_migrated_at timestamptz;

-- RF-08 missing tools seed
CREATE OR REPLACE FUNCTION public.seed_rf08_missing_agent_tools(_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.agent_tools (user_id, tool_name, display_name, description, category, mode, built_in) VALUES
    (_user_id, 'agent.spawn',    'Spawn sub-agents',    'Fan out independent, parallelizable subtasks across bounded sub-agents.', 'write',  'confirm', true),
    (_user_id, 'memory.reflect', 'Reflect on this run', 'Distil a one-paragraph lesson from this run and persist it for future runs.', 'memory', 'auto',    true),
    (_user_id, 'memory.promote', 'Promote a memory',    'Escalate a memory from agent-scope to workspace-scope.',                    'memory', 'confirm', true),
    (_user_id, 'studio.revert',  'Revert a release',    'Roll back a merged release via an inverse changeset through commit/PR/CI/merge rails.', 'write',  'review',  true)
  ON CONFLICT (user_id, tool_name) DO NOTHING;
END $function$;

DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.profiles LOOP
    PERFORM public.seed_rf08_missing_agent_tools(r.id);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.rf08_seed_missing_tools_on_profile_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.seed_rf08_missing_agent_tools(NEW.id);
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS rf08_seed_missing_tools ON public.profiles;
CREATE TRIGGER rf08_seed_missing_tools
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.rf08_seed_missing_tools_on_profile_insert();

-- RF-02 outcome-weighted match_agent_memory
create or replace function public.match_agent_memory(
  query_embedding vector(1536),
  match_count int default 5,
  for_user uuid default null,
  for_agent_slug text default null,
  for_workspace uuid default null,
  for_account uuid default null
) returns table (
  id uuid, content text, kind text, importance integer,
  agent_slug text, similarity double precision
) language sql stable security definer set search_path to 'public' as $$
  with candidates as (
    select m.id, m.content, m.kind, m.importance, m.agent_slug, m.metadata,
           m.last_used_at, m.created_at,
           (m.embedding <=> query_embedding) as distance
    from public.agent_memory m
    where m.user_id = coalesce(auth.uid(), for_user)
      and m.embedding is not null
      and (m.expires_at is null or m.expires_at > now())
      and (
        (for_account is not null
          and (m.workspace_id is null
               or m.workspace_id in (select w.id from public.workspaces w where w.account_id = for_account)))
        or (for_account is null
          and (for_workspace is null or m.workspace_id = for_workspace or m.workspace_id is null))
      )
      and (for_account is null or auth.uid() is null or public.is_account_member(for_account))
      and (auth.uid() is null or m.workspace_id is null or public.is_workspace_member(m.workspace_id))
      and (for_agent_slug is null or m.agent_slug = for_agent_slug or m.scope = 'global')
    order by m.embedding <=> query_embedding
    limit greatest(match_count * 4, 20)
  )
  select c.id, c.content, c.kind, c.importance, c.agent_slug,
         1 - c.distance as similarity
  from candidates c
  order by
    c.distance
    + case c.metadata->>'verdict' when 'validated' then -0.05 when 'missed' then 0.05 else 0 end
    - (coalesce(c.importance, 3) - 3) * 0.01
    + (1 - exp(-extract(epoch from (now() - coalesce(c.last_used_at, c.created_at))) / 3600.0 / 72.0)) * 0.02
  limit match_count;
$$;

-- RF-04 house_rules table
create table if not exists public.house_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  workspace_id uuid not null default public.current_user_default_workspace()
    references public.workspaces (id) on delete cascade,
  rule_text text not null,
  rationale text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  source_learning_ids uuid[] not null default '{}',
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists house_rules_ws_status_idx on public.house_rules (workspace_id, status, created_at desc);
grant select, insert, update, delete on public.house_rules to authenticated;
grant all on public.house_rules to service_role;
alter table public.house_rules enable row level security;
drop policy if exists "house_rules ws read" on public.house_rules;
create policy "house_rules ws read" on public.house_rules for select using (public.is_workspace_member(workspace_id));
drop policy if exists "house_rules ws write" on public.house_rules;
create policy "house_rules ws write" on public.house_rules for all
  using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

-- RF-05 mission_steps.playbook_id
alter table public.mission_steps add column if not exists playbook_id text;

-- CNV-02 eval_suites.prd_id + assumptions.prd_id
ALTER TABLE public.eval_suites ADD COLUMN IF NOT EXISTS prd_id uuid REFERENCES public.prds (id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_eval_suites_prd ON public.eval_suites (prd_id) WHERE prd_id IS NOT NULL;

ALTER TABLE public.assumptions
  ALTER COLUMN decision_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS prd_id uuid REFERENCES public.prds (id) ON DELETE CASCADE;
ALTER TABLE public.assumptions DROP CONSTRAINT IF EXISTS assumptions_source_chk;
ALTER TABLE public.assumptions ADD CONSTRAINT assumptions_source_chk CHECK (decision_id IS NOT NULL OR prd_id IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_assumptions_prd ON public.assumptions (prd_id) WHERE prd_id IS NOT NULL;

-- RF-03 memory_recall_log + bump_memory_importance
CREATE TABLE IF NOT EXISTS public.memory_recall_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid NOT NULL REFERENCES public.agent_memory(id) ON DELETE CASCADE,
  trace_id uuid,
  user_id uuid NOT NULL,
  workspace_id uuid,
  outcome text NOT NULL DEFAULT 'ignored' CHECK (outcome IN ('used', 'ignored', 'contradicted')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memory_recall_log TO authenticated;
GRANT ALL ON public.memory_recall_log TO service_role;
CREATE INDEX IF NOT EXISTS memory_recall_log_trace_idx ON public.memory_recall_log (trace_id);
CREATE INDEX IF NOT EXISTS memory_recall_log_memory_idx ON public.memory_recall_log (memory_id);
ALTER TABLE public.memory_recall_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own memory_recall_log all" ON public.memory_recall_log;
CREATE POLICY "own memory_recall_log all" ON public.memory_recall_log FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.bump_memory_importance(p_memory_id uuid, p_delta integer)
RETURNS integer LANGUAGE sql AS $$
  UPDATE public.agent_memory
  SET importance = LEAST(5, GREATEST(1, importance + p_delta))
  WHERE id = p_memory_id
  RETURNING importance;
$$;
REVOKE EXECUTE ON FUNCTION public.bump_memory_importance(uuid, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.bump_memory_importance(uuid, integer) TO authenticated;
