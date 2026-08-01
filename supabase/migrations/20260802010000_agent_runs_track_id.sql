-- ATTRIBUTE EVERY RUN TO THE WORK IT WAS DOING.
--
-- FOUNDER RULING 2026-08-01: "if some agents are working, there should be some
-- scope for showing visually that this agent is what, after this particular
-- agent it switched to next agent, this is the outcome. Something like Claude
-- Code or Copilot or Codex. Some status message on each station so the user
-- knows what is happening, what got changed, what is it impacting."
--
-- WHAT BLOCKED THAT. A run could be attributed to a user, a workspace, and
-- sometimes a mission, but never to a TRACK. Only the Build station opens a
-- mission, so six of the seven stations produced runs that no surface could tie
-- back to the piece of work they were doing. `spine_track_members` records the
-- ARTIFACTS a track collected but says nothing about who acted, in what order,
-- what it cost, or what happened on a run that produced nothing, which is
-- exactly the case a person most needs to see.
--
-- One column closes it. The driver now passes the track on every dispatch, so
-- the activity view can read runs and artifacts as one story: this agent ran,
-- then handed to that one, and here is what came out.
--
-- Nullable on purpose: a run a person starts by hand from Ask or Build belongs
-- to no track and must stay insertable.

alter table public.agent_runs
  add column if not exists track_id uuid references public.spine_tracks(id) on delete set null;

create index if not exists idx_agent_runs_track on public.agent_runs(track_id, created_at)
  where track_id is not null;

comment on column public.agent_runs.track_id is
  'The piece of work this run belongs to, when the driver started it. NULL for runs a person '
  'started by hand. Only Build opens a mission, so this is the only link the other six stations have.';
