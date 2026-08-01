create or replace function public.seed_agent_tools_for(_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.agent_tools (user_id, tool_name, display_name, description, category, mode, enabled, built_in)
  select v.user_id, v.tool_name, v.display_name, v.display_name, v.category, v.mode, v.enabled, v.built_in
  from (values
    (_user_id, 'workspace.search',     'Search workspace',      'read',          'auto',    true, true),
    (_user_id, 'workspace.list_tasks', 'List tasks',            'read',          'auto',    true, true),
    (_user_id, 'signals.list',         'List signals',          'read',          'auto',    true, true),
    (_user_id, 'themes.list',          'List themes',           'read',          'auto',    true, true),
    (_user_id, 'sources.status',       'Source status',         'read',          'auto',    true, true),
    (_user_id, 'sources.connect',      'Connect a source',      'read',          'auto',    true, true),
    (_user_id, 'repo.tree',            'Repo tree',             'read',          'auto',    true, true),
    (_user_id, 'repo.read',            'Read a file',           'read',          'auto',    true, true),
    (_user_id, 'repo.search',          'Search the repo',       'read',          'auto',    true, true),
    (_user_id, 'ci.logs',              'CI logs',               'read',          'auto',    true, true),
    (_user_id, 'github.ci.read',       'Read GitHub CI',        'read',          'auto',    true, true),
    (_user_id, 'web.search',           'Search the web',        'read',          'auto',    true, true),
    (_user_id, 'web.fetch',            'Fetch a page',          'read',          'auto',    true, true),
    (_user_id, 'web.map',              'Map a site',            'read',          'auto',    true, true),
    (_user_id, 'web.crawl',            'Crawl a site',          'read',          'confirm', true, true),
    (_user_id, 'signals.log',          'Log a signal',          'write',         'confirm', true, true),
    (_user_id, 'research.synthesize',  'Synthesise research',   'write',         'confirm', true, true),
    (_user_id, 'cluster.trigger',      'Cluster signals',       'write',         'confirm', true, true),
    (_user_id, 'decision.record',      'Record a decision',     'write',         'confirm', true, true),
    (_user_id, 'decision.revise',      'Revise a decision',     'write',         'confirm', true, true),
    (_user_id, 'prd.draft',            'Draft a spec',          'write',         'confirm', true, true),
    (_user_id, 'prd.revise',           'Revise a spec',         'write',         'confirm', true, true),
    (_user_id, 'prd.link_issue',       'Link a spec issue',     'write',         'confirm', true, true),
    (_user_id, 'tasks.create',         'Create a task',         'write',         'confirm', true, true),
    (_user_id, 'tasks.update_status',  'Update task status',    'write',         'confirm', true, true),
    (_user_id, 'backlog.prioritize',   'Prioritise backlog',    'write',         'confirm', true, true),
    (_user_id, 'roadmap.move',         'Move on the roadmap',   'write',         'confirm', true, true),
    (_user_id, 'design.draft',         'Draft a design',        'write',         'confirm', true, true),
    (_user_id, 'studio.stage',         'Stage a change',        'write',         'auto',    true, true),
    (_user_id, 'studio.commit',        'Commit a change',       'write',         'confirm', true, true),
    (_user_id, 'studio.fix.commit',    'Commit a fix',          'write',         'auto',    true, true),
    (_user_id, 'studio.sync_branch',   'Sync a branch',         'write',         'auto',    true, true),
    (_user_id, 'studio.pr.open',       'Open a PR',             'write',         'confirm', true, true),
    (_user_id, 'github.issue.create',  'Open an issue',         'write',         'confirm', true, true),
    (_user_id, 'github.pr.open',       'Open a GitHub PR',      'write',         'confirm', true, true),
    (_user_id, 'github.commit.append', 'Append a commit',       'write',         'confirm', true, true),
    (_user_id, 'release.publish',      'Publish a release',     'write',         'review',  true, true),
    (_user_id, 'studio.pr.merge',      'Merge a PR',            'write',         'review',  true, true),
    (_user_id, 'studio.revert',        'Revert a change',       'write',         'review',  true, true),
    (_user_id, 'learning.record',      'Record a learning',     'write',         'confirm', true, true),
    (_user_id, 'mission.plan',         'Plan a mission',        'orchestration', 'auto',    true, true),
    (_user_id, 'mission.dispatch',     'Dispatch a mission',    'orchestration', 'auto',    true, true),
    (_user_id, 'mission.observe',      'Observe a mission',     'orchestration', 'auto',    true, true),
    (_user_id, 'mission.finalize',     'Finalise a mission',    'orchestration', 'auto',    true, true),
    (_user_id, 'agent.handoff',        'Hand off to an agent',  'orchestration', 'auto',    true, true),
    (_user_id, 'agent.spawn',          'Spawn an agent',        'write',         'confirm', true, true),
    (_user_id, 'delegate.openhands',   'Delegate to OpenHands', 'write',         'review',  true, true),
    (_user_id, 'critic.evaluate',      'Red-team this',         'planning',      'auto',    true, true),
    (_user_id, 'scheduler.propose',    'Propose a schedule',    'planning',      'auto',    true, true),
    (_user_id, 'calendar.create',      'Create an event',       'write',         'confirm', true, true),
    (_user_id, 'notes.create',         'Create a note',         'write',         'confirm', true, true),
    (_user_id, 'memory.remember',      'Remember this',         'memory',        'auto',    true, true),
    (_user_id, 'memory.reflect',       'Reflect on memory',     'memory',        'auto',    true, true),
    (_user_id, 'memory.promote',       'Promote a memory',      'memory',        'confirm', true, true)
  ) as v(user_id, tool_name, display_name, category, mode, enabled, built_in)
  on conflict (user_id, tool_name) do nothing;
end;
$$;

comment on function public.seed_agent_tools_for(uuid) is
  'The single authority on which tools a user''s agents can reach. Idempotent. '
  'Must list every tool in TOOL_REGISTRY; src/lib/spine/tool-seed.test.ts fails the build if it drifts.';

drop trigger if exists rf08_seed_missing_tools on public.profiles;
drop trigger if exists seam2_seed_ci_tools_after_profile_insert on public.profiles;
drop trigger if exists seed_station_tools on public.profiles;

create or replace function public.seed_agent_tools_on_profile_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_agent_tools_for(new.id);
  return new;
end;
$$;

drop trigger if exists seed_agent_tools on public.profiles;
create trigger seed_agent_tools
  after insert on public.profiles
  for each row execute function public.seed_agent_tools_on_profile_insert();

do $$
declare r record;
begin
  for r in select id from public.profiles loop
    perform public.seed_agent_tools_for(r.id);
  end loop;
end;
$$;