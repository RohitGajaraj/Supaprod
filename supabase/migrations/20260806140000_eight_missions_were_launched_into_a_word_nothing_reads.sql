-- EIGHT MISSIONS WERE LAUNCHED INTO A WORD NOTHING READS.
--
-- WHAT WAS MEASURED, 2026-08-06, through the Lovable MCP against production.
-- `select status, count(*) from missions group by 1` returns 8 rows at
-- 'queued'. Every one of them has 0 mission_steps, 0 agent_runs, and 0 active
-- runs. The oldest was written 2026-07-05, the newest 2026-07-25. Nothing in
-- this product consumes a mission at 'queued': resume-runs advances
-- running/in_progress, maybeCompleteMission finalizes running/in_progress, and
-- the mission page read 'queued' as already-live. They were stopped, and they
-- looked live while they were stopped.
--
-- WHERE THEY CAME FROM. Six carry auto_trigger_source='auto' and were written
-- by the trigger-tick's auto-promote (src/routes/api/public/hooks/trigger-tick.ts);
-- two carry 'trigger' and came from a person pressing the launch button, which
-- used to write the same word. Both writers now flip the mission to 'running'
-- and hand it to the orchestrator, and resume-runs adopts any leftover 'queued'
-- row into 'running' within a tick. So no NEW row can land here. This migration
-- is only about the eight that already did.
--
-- WHY THIS EXISTS AT ALL, GIVEN THE SWEEPER WOULD ADOPT THEM. Because adoption
-- means these eight start running, and running costs money and makes noise. They
-- are month-old goals belonging to seeded demo accounts (demo@redcadence.app,
-- demo2@redcadence.app, harbor@supaprod.ai), and four of them point at
-- workspaces that have since been DELETED. Resurrecting all eight unasked, in
-- launch week, is not a decision a cron sweep should be making on the founder's
-- behalf. Applying this first makes the choice explicit; skipping it lets the
-- sweeper adopt them instead. Either way nothing stays invisible, and this file
-- is a no-op if the sweeper got there first (every statement is scoped to rows
-- still at 'queued').
--
-- TWO DESTINATIONS, BECAUSE THE EIGHT ARE NOT ONE CASE.
--
--  (1) FOUR whose workspace_id has no row in `workspaces` (2 in
--      c0691494-a5c8-4dd2-b357-de7d51d5f1b2, 2 in
--      93c9b052-8247-4247-82b4-10b2f89fe363, all demo@redcadence.app). These can
--      never run: agent_runs.workspace_id is a foreign key to workspaces, so the
--      very first thing a launch does — insert the orchestrator run — is refused.
--      'halted' is the honest word for work that cannot start, and it is the
--      status the UI already offers a retry from.
--
--  (2) THE REST go back to 'proposed', the gate they should never have left. A
--      proposal costs nothing, it is visible on the mission page with a working
--      Launch button, and the person who owns it decides whether a month-old
--      goal is still worth running. It keeps suppressing its own re-proposal in
--      the trigger-tick either way ('proposed' and 'queued' are both counted as
--      open work there), so this changes no dedup behaviour.
--
-- THE TRAIL IS WRITTEN TOO. A status change with no stage_events row is exactly
-- the kind of silent move that produced this bug, so each update files its own
-- transition. stage_events.workspace_id is a foreign key to workspaces, so the
-- four orphaned rows are filed with a NULL workspace — the user_id still carries
-- the ownership, and a NULL there is honest about a workspace that is gone.

-- (1) Cannot ever start: no workspace to run in.
with gone as (
  update public.missions m
     set status = 'halted',
         updated_at = now()
   where m.status = 'queued'
     and m.workspace_id is not null
     and not exists (select 1 from public.workspaces w where w.id = m.workspace_id)
  returning m.id, m.user_id
)
insert into public.stage_events
  (entity_type, entity_id, from_stage, to_stage, actor, workspace_id, user_id)
select 'mission', gone.id, 'queued', 'halted', 'system', null, gone.user_id
from gone;

-- (2) Everything still at 'queued' goes back to the gate.
with parked as (
  update public.missions m
     set status = 'proposed',
         updated_at = now()
   where m.status = 'queued'
  returning m.id, m.user_id, m.workspace_id
)
insert into public.stage_events
  (entity_type, entity_id, from_stage, to_stage, actor, workspace_id, user_id)
select 'mission', parked.id, 'queued', 'proposed', 'system', parked.workspace_id, parked.user_id
from parked;
