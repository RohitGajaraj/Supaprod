
-- 20260630000100_delegate_poll_cron.sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
DO $$
DECLARE
  base_url text := 'https://project--371dd588-1b70-4629-9bb5-9f003f3af373.lovable.app';
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'delegate-poll-tick';
  PERFORM cron.schedule(
    'delegate-poll-tick',
    '*/5 * * * *',
    format($job$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object('Content-Type','application/json','x-cron-key', public.get_cron_hook_secret()),
        body := '{}'::jsonb
      ) AS request_id;
    $job$, base_url || '/api/public/hooks/delegate-poll-tick')
  );
END $$;

-- 20260630120000_sources_source_kind.sql
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

-- 20260630190000_sense_tools_seed.sql (includes delegate.openhands to preserve BLD-04 seed)
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

-- Backfill for all existing users (adds any missing tools including delegate.openhands + Sense tools)
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.profiles LOOP
    PERFORM public.seed_default_agent_tools(r.id);
  END LOOP;
END $$;
