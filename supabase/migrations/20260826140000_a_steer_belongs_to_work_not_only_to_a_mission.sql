-- A STEER BELONGS TO WORK, NOT ONLY TO A MISSION (S1's find, 2026-08-26).
--
-- FOUND BY DRIVING THE REAL UI, in S1's first browser pass after the `.env`
-- landed — which is the whole argument for R-21's browser checks in one example.
-- Typed a steer into a live run's composer and the insert came back:
--
--   null value in column "mission_id" of relation "agent_messages"
--   violates not-null constraint
--
-- WHY IT HAPPENS. `agent_messages` was designed mission-first: `mission_id` is
-- NOT NULL and `track_id` was added later as nullable. `steerTrack`
-- (track.functions.ts:2093-2099) inserts `{user_id, workspace_id, track_id,
-- kind:"steer", payload}` and cannot supply a mission, because **at six of the
-- seven stations there is no mission**. Only Build has one, which is why
-- `steerStudioSession` works and every track-scoped steer fails.
--
-- So "steer without restarting" — authorised gap #5, and one of the five
-- properties that make this truly agentic — has been refused by the database on
-- every station but one.
--
-- WHY DROP THE CONSTRAINT RATHER THAN DEFAULT A SENTINEL. A sentinel mission id
-- would be a lie in the data, and this repo has already paid for exactly that:
-- F-42 repurposed `workspaces.is_sample` to mean something it did not say, and
-- the bill arrived as F-61, an acceptance query that read a false 1. A row that
-- belongs to a track and not to a mission should SAY so by holding null.
--
-- THE INVARIANT THAT REPLACES IT. A message must still belong to something, so
-- the CHECK below refuses a row that names neither. Existing rows all carry a
-- mission (the column was NOT NULL until now), so the constraint validates
-- against the whole table without a rewrite.
--
-- The read path needs no change: `loop.server.ts:1303-1310` already selects
-- steers by `track_id OR mission_id`.
ALTER TABLE public.agent_messages
  ALTER COLUMN mission_id DROP NOT NULL;

ALTER TABLE public.agent_messages
  ADD CONSTRAINT agent_messages_belongs_to_work
  CHECK (mission_id IS NOT NULL OR track_id IS NOT NULL);

COMMENT ON COLUMN public.agent_messages.mission_id IS
  'The Build mission this message belongs to, or NULL for a track-scoped message. Six of the seven stations have no mission; agent_messages_belongs_to_work keeps a row from belonging to nothing.';
