-- 20260820032000_a_steer_can_reach_a_station_that_never_opens_a_mission.sql
--
-- Claude lane, 2026-08-20.
--
-- A STEER CAN ONLY REACH A MISSION, AND SIX OF THE SEVEN STATIONS NEVER OPEN ONE.
--
-- WHAT IS BROKEN. `agent_messages` addresses a steer by `mission_id` and has no
-- other way to name its target. The loop reads them gated on `ctx.missionId`
-- (`loop.server.ts`), and the driver opens a mission for exactly one station:
--
--   driver.server.ts:1189
--     const missionId =
--       station === "build" ? await missionForTrack(...) : null;
--
-- So Discover, Decide, Plan, Design, Ship and Learn run with `missionId: null`,
-- and a steer aimed at any of them has nowhere to land. The direction's §10
-- criterion 11 measures this directly: "stations that accept a steer, 1 of 7,
-- target 7 of 7".
--
-- WHY THE OBVIOUS FIX IS THE WRONG ONE, AND THE FILE SAYS SO ALREADY.
-- The tempting change is to open a mission for every station. The comment
-- directly above that ternary argues against it and is right on its own terms:
-- "a mission they never use would be a noun with no referent cluttering the
-- record", and it warns separately that hoisting the mission "is NOT the fix"
-- for the Learn recovery chain, because `decisions.prd_id` is null by
-- construction at Decide, so reviving the first hop leaves the second dead.
--
-- **That comment is about a different consequence than this one.** It answers
-- the Learn recovery chain; it does not address steerability, and steerability
-- is not repaired by it. But its core objection applies here too: inventing
-- missions so that a message has somewhere to point is inventing a noun to hold
-- an address.
--
-- THE FIX IS THE ONE THE SAME COMMENT ALREADY DESCRIBES, APPLIED AGAIN.
-- `learning.record` had this exact shape of problem and was repaired by keying
-- off the track instead of walking the mission chain: "learning.record now reads
-- the spec off `spine_track_members` using `ToolCtx.trackId`, which this loop
-- already passes." **A steer should be addressed the same way.** Every station
-- on this route has a track -- that is what the driver drives -- while only one
-- has a mission. The track is the durable name for "this piece of work", and the
-- mission is an implementation detail of one station.
--
-- SO: a steer may name a track, and the six stations that never open a mission
-- become reachable without any of them growing a mission they would not use.
--
-- SHAPE. Nullable, because a steer aimed at a mission stays aimed at a mission
-- and nothing existing has to move. FK to `spine_tracks` with ON DELETE CASCADE,
-- matching every other `track_id` on this schema: a message addressed to a track
-- that no longer exists is undeliverable by definition.
--
-- NO BACKFILL, and the number is why it is safe to say that. Measured before
-- writing this:
--
--   select kind, count(*), count(mission_id) from agent_messages group by kind;
--     handoff  104  104
--     kickoff   14   14
--     steer      3    3
--
-- **Three steers have ever been written**, all carrying a mission, all on the
-- Build route that already works. There is nothing to migrate, and deriving a
-- track for them would be inventing an address for messages that already have
-- one.
--
-- THE INDEX IS THE READ THE LOOP ACTUALLY MAKES. It asks, at every step, for
-- unconsumed steers on one target, oldest first. Partial on
-- `consumed_by_run_id is null` because a consumed steer is never read again and
-- the unconsumed set is tiny, which keeps the index the size of the live
-- question rather than the size of the history.

alter table public.agent_messages
  add column if not exists track_id uuid references public.spine_tracks(id) on delete cascade;

comment on column public.agent_messages.track_id is
  'The track this message is addressed to, for the six stations that never open '
  'a mission. A steer names a track OR a mission, never neither. Added '
  '2026-08-20 so §10 criterion 11 can move off 1 of 7: the driver opens a '
  'mission only for Build (driver.server.ts:1189), and inventing one for the '
  'other six purely to carry an address was refused in that file for good '
  'reasons. The track is the durable name for a piece of work; the mission is '
  'one station''s implementation detail.';

create index if not exists agent_messages_track_unconsumed_idx
  on public.agent_messages (track_id, kind, created_at)
  where consumed_by_run_id is null;

do $$
declare n_col int; n_steer_broken int;
begin
  select count(*) into n_col from information_schema.columns
   where table_schema='public' and table_name='agent_messages' and column_name='track_id';
  if n_col <> 1 then
    raise exception 'agent_messages.track_id was not added';
  end if;

  -- Nothing may end up addressed to neither a mission nor a track. Today every
  -- row has a mission, so this is 0 and stays 0 unless a writer forgets both.
  select count(*) into n_steer_broken from public.agent_messages
   where mission_id is null and track_id is null;
  if n_steer_broken <> 0 then
    raise exception '% agent_messages are addressed to nothing at all', n_steer_broken;
  end if;
end $$;
