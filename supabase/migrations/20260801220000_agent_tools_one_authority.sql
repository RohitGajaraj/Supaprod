-- ONE AUTHORITY FOR WHICH TOOLS AN AGENT CAN REACH.
--
-- THE DEFECT, found 2026-08-01 by driving a real track through the live loop and
-- reading what each station actually produced. A track ran Plan -> Design ->
-- Build -> Ship autonomously and delivered nothing. Plan's agent wrote a
-- complete spec into its final answer and never called `prd.draft`, because
-- `prd.draft` had no row in that user's `agent_tools`. `loop.server.ts` builds an
-- agent's tool list from `agent_tools` filtered to the user, so a tool with no
-- row is not disabled, it is INVISIBLE: it never enters the prompt and the agent
-- cannot know it exists. The station then does the only thing left to it and
-- answers in prose, which nothing downstream can read.
--
-- WHY IT WAS MISSING, which is the part worth fixing rather than patching.
-- `agent_tools` was seeded by SIX separate functions written across two months
-- (`seed_default_agent_tools`, `seed_pm_lifecycle_tools`, `seed_studio_tools`,
-- `seed_rf08_missing_agent_tools`, `seed_seam2_ci_tools`, `seed_station_agent_tools`),
-- each backfilling only the tools that existed the day it was written, and only
-- THREE of them left a trigger behind on `profiles`. The other three were
-- one-shot. So which tools a user can reach is decided by what date their
-- profile was created:
--
--     decision.record / design.draft / learning.record / release.publish   16 users
--     studio.* / mission.* / repo.*                                     14-16 users
--     prd.draft / tasks.create / signals.log / research.synthesize          5 users
--     themes.list / cluster.trigger / web.*                                 4 users
--     prd.revise / decision.revise / roadmap.move                           0 users
--
-- Sixteen profiles exist. Eleven of them could not draft a spec. Three
-- registered tools were reachable by nobody at all. Measured on the live
-- database, not inferred.
--
-- The seven-station consequence, which is what makes this a product defect and
-- not a data cleanup: Discover could not log a signal or cluster a theme, and
-- Plan could not draft a spec. The two stations that START the loop were the two
-- that could not produce anything, so everything downstream inherited nothing.
--
-- WHAT THIS DOES. One function that is the single authority, listing every tool
-- in `TOOL_REGISTRY`, idempotent, safe to re-run, and safe to call for a user who
-- already has some rows. One trigger. The three competing triggers are dropped so
-- there is exactly one path by which a user gets tools, and the next tool added
-- has exactly one place to be added.
--
-- The drift cannot silently return: src/lib/spine/tool-seed.test.ts parses the
-- canonical list out of THIS file and fails the build when it and TOOL_REGISTRY
-- disagree. Register a tool without seeding it and the build goes red, which is
-- the same shape as the route-reachability test that guards "capability built,
-- door missing" elsewhere in this repo.
--
-- MODES ARE PRESERVED, NEVER DOWNGRADED. Every mode below is the one the live
-- table already carries for the users who have that row; nothing here loosens a
-- boundary. `ON CONFLICT DO NOTHING` means a user who has deliberately changed a
-- mode keeps their choice. The runtime floors in `resolveToolMode` /
-- `HIGH_RISK_FORCE_REVIEW` still compose on top of whatever is stored, so a
-- seeded mode is a default and never a bypass.

create or replace function public.seed_agent_tools_for(_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.agent_tools (user_id, tool_name, display_name, category, mode, enabled, built_in)
  values
    -- Read and search. Auto: they observe, they never change anything.
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
    -- Crawling pulls a whole site and costs real money, so it asks first even
    -- though it only reads.
    (_user_id, 'web.crawl',            'Crawl a site',          'read',          'confirm', true, true),

    -- THE SEVEN STATIONS' OWN HANDS. Every one of these writes the artifact its
    -- station hands to the next, so a missing row here stops the loop dead.
    -- 01 Discover
    (_user_id, 'signals.log',          'Log a signal',          'write',         'confirm', true, true),
    (_user_id, 'research.synthesize',  'Synthesise research',   'write',         'confirm', true, true),
    (_user_id, 'cluster.trigger',      'Cluster signals',       'write',         'confirm', true, true),
    -- 02 Decide
    (_user_id, 'decision.record',      'Record a decision',     'write',         'confirm', true, true),
    (_user_id, 'decision.revise',      'Revise a decision',     'write',         'confirm', true, true),
    -- 03 Plan
    (_user_id, 'prd.draft',            'Draft a spec',          'write',         'confirm', true, true),
    (_user_id, 'prd.revise',           'Revise a spec',         'write',         'confirm', true, true),
    (_user_id, 'prd.link_issue',       'Link a spec issue',     'write',         'confirm', true, true),
    (_user_id, 'tasks.create',         'Create a task',         'write',         'confirm', true, true),
    (_user_id, 'tasks.update_status',  'Update task status',    'write',         'confirm', true, true),
    (_user_id, 'backlog.prioritize',   'Prioritise backlog',    'write',         'confirm', true, true),
    (_user_id, 'roadmap.move',         'Move on the roadmap',   'write',         'confirm', true, true),
    -- 04 Design
    (_user_id, 'design.draft',         'Draft a design',        'write',         'confirm', true, true),
    -- 05 Build
    (_user_id, 'studio.stage',         'Stage a change',        'write',         'auto',    true, true),
    (_user_id, 'studio.commit',        'Commit a change',       'write',         'confirm', true, true),
    (_user_id, 'studio.fix.commit',    'Commit a fix',          'write',         'auto',    true, true),
    (_user_id, 'studio.sync_branch',   'Sync a branch',         'write',         'auto',    true, true),
    (_user_id, 'studio.pr.open',       'Open a PR',             'write',         'confirm', true, true),
    (_user_id, 'github.issue.create',  'Open an issue',         'write',         'confirm', true, true),
    (_user_id, 'github.pr.open',       'Open a GitHub PR',      'write',         'confirm', true, true),
    (_user_id, 'github.commit.append', 'Append a commit',       'write',         'confirm', true, true),
    -- 06 Ship. Everything irreversible sits at review, which is a hard floor in
    -- trust-ramp.ts as well and cannot be earned away by an agent's record.
    (_user_id, 'release.publish',      'Publish a release',     'write',         'review',  true, true),
    (_user_id, 'studio.pr.merge',      'Merge a PR',            'write',         'review',  true, true),
    (_user_id, 'studio.revert',        'Revert a change',       'write',         'review',  true, true),
    -- 07 Learn
    (_user_id, 'learning.record',      'Record a learning',     'write',         'confirm', true, true),

    -- Orchestration and delegation.
    (_user_id, 'mission.plan',         'Plan a mission',        'orchestration', 'auto',    true, true),
    (_user_id, 'mission.dispatch',     'Dispatch a mission',    'orchestration', 'auto',    true, true),
    (_user_id, 'mission.observe',      'Observe a mission',     'orchestration', 'auto',    true, true),
    (_user_id, 'mission.finalize',     'Finalise a mission',    'orchestration', 'auto',    true, true),
    (_user_id, 'agent.handoff',        'Hand off to an agent',  'orchestration', 'auto',    true, true),
    (_user_id, 'agent.spawn',          'Spawn an agent',        'write',         'confirm', true, true),
    (_user_id, 'delegate.openhands',   'Delegate to OpenHands', 'write',         'review',  true, true),

    -- Planning aids. Advisory and side-effect-free beyond their own row.
    (_user_id, 'critic.evaluate',      'Red-team this',         'planning',      'auto',    true, true),
    (_user_id, 'scheduler.propose',    'Propose a schedule',    'planning',      'auto',    true, true),
    (_user_id, 'calendar.create',      'Create an event',       'write',         'confirm', true, true),
    (_user_id, 'notes.create',         'Create a note',         'write',         'confirm', true, true),

    -- Memory.
    (_user_id, 'memory.remember',      'Remember this',         'memory',        'auto',    true, true),
    (_user_id, 'memory.reflect',       'Reflect on memory',     'memory',        'auto',    true, true),
    (_user_id, 'memory.promote',       'Promote a memory',      'memory',        'confirm', true, true)
  on conflict (user_id, tool_name) do nothing;
end;
$$;

comment on function public.seed_agent_tools_for(uuid) is
  'The single authority on which tools a user''s agents can reach. Idempotent. '
  'Must list every tool in TOOL_REGISTRY; src/lib/spine/tool-seed.test.ts fails the build if it drifts.';

-- One trigger, replacing three. The old ones each seeded their own era's subset,
-- which is how the drift accumulated in the first place; leaving them attached
-- alongside this would preserve the exact structure that caused the defect.
-- Their functions are left in place (dropping functions other migrations
-- reference buys nothing and risks a replay failing), but nothing calls them.
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

create trigger seed_agent_tools
  after insert on public.profiles
  for each row execute function public.seed_agent_tools_on_profile_insert();

-- Backfill every existing user. This is what actually reopens Discover and Plan
-- for the eleven accounts that could not produce anything, including the demo
-- logins the loop is rehearsed on.
do $$
declare r record;
begin
  for r in select id from public.profiles loop
    perform public.seed_agent_tools_for(r.id);
  end loop;
end;
$$;
