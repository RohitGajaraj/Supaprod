ALTER TABLE public.spine_tracks
  ADD COLUMN IF NOT EXISTS attempts   integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_hold  text,
  ADD COLUMN IF NOT EXISTS driven_at  timestamptz;

CREATE INDEX IF NOT EXISTS spine_tracks_drive_queue_idx
  ON public.spine_tracks (driven_at NULLS FIRST)
  WHERE status = 'open';

ALTER TABLE public.stage_events
  DROP CONSTRAINT IF EXISTS stage_events_entity_type_check;

ALTER TABLE public.stage_events
  ADD CONSTRAINT stage_events_entity_type_check
  CHECK (entity_type IN ('spec', 'mission', 'opportunity', 'theme', 'decision',
                         'goal', 'loop', 'signal', 'spine_track'));

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