-- What the autonomous driver needs to remember between ticks.
--
-- FOUNDER RULING 2026-08-01: "even if human do not watch, agent should be able
-- to complete entire thing and deliver the outcome to the user."
--
-- A driver that runs unattended needs exactly two durable facts, and neither
-- can be derived from what spine_tracks already stores:
--
--   attempts   how many times the CURRENT station has been tried and produced
--              nothing. Without it the driver retries forever, which on a
--              product that meters every model call is a cost leak that looks
--              like progress. stage_events cannot supply this: recordStageEvent
--              deliberately drops a transition whose from equals its to, so
--              repeated attempts at one station write no rows at all.
--
--   last_hold  why the driver last declined to move. A person who was not
--              watching needs to arrive at an answer, not at silence. This is
--              the same principle the declined ledger is built on: the refusals
--              are the evidence the thing is working.
--
-- attempts resets to zero on every station change, which the driver does in the
-- same update that advances the station, so the counter can never leak across
-- stations and strand a track that was making progress.

ALTER TABLE public.spine_tracks
  ADD COLUMN IF NOT EXISTS attempts   integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_hold  text,
  -- When the driver last touched this track. Read by the tick to sweep the
  -- least recently driven first, so one busy track cannot starve the rest.
  ADD COLUMN IF NOT EXISTS driven_at  timestamptz;

-- The sweep order for the cron: open tracks, least recently driven first.
-- NULLS FIRST so a track that has never been driven is picked up before one
-- that already ran, which is what makes a newly started track begin promptly.
CREATE INDEX IF NOT EXISTS spine_tracks_drive_queue_idx
  ON public.spine_tracks (driven_at NULLS FIRST)
  WHERE status = 'open';

-- A track moving between stations is a stage transition like any other, and it
-- belongs in the same trail every other artifact writes to rather than in a
-- private log. The CHECK is widened the same way SW-5 widened it for 'signal'
-- (migration 20260708120000); the TS union in stage-events.server.ts is widened
-- in the same commit, so the two cannot disagree.
ALTER TABLE public.stage_events
  DROP CONSTRAINT IF EXISTS stage_events_entity_type_check;

ALTER TABLE public.stage_events
  ADD CONSTRAINT stage_events_entity_type_check
  CHECK (entity_type IN ('spec', 'mission', 'opportunity', 'theme', 'decision',
                         'goal', 'loop', 'signal', 'spine_track'));

-- track-tick: every 10 minutes, drive up to 5 open tracks by ONE station each.
--
-- The cadence is the same as loop-tick because the work is the same shape: a
-- bounded sweep that dispatches real agents. One station per track per tick is
-- enforced in the handler, not here, so the whole loop still completes with
-- nobody present while staying visible and interruptible between stations.
--
-- Registration mirrors goal-tick and loop-tick exactly, including the
-- unschedule-then-schedule so re-applying this migration cannot double-book it.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  base_url text := 'https://project--371dd588-1b70-4629-9bb5-9f003f3af373.lovable.app';
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'track-tick';
  PERFORM cron.schedule(
    'track-tick',
    '*/10 * * * *',
    format($job$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-key', public.get_cron_hook_secret()
        ),
        body := '{}'::jsonb
      ) AS request_id;
    $job$, base_url || '/api/public/hooks/track-tick')
  );
END $$;
