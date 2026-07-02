-- FS-03: the reach channel. Instant email is reserved for expiring gates and
-- critical incidents (this migration adds the dedup column that lets an
-- expiring-gate email fire once, not every minute); the user-scheduled
-- digest gets its own "last sent" column so an hourly tick can tell whether
-- a daily/weekly digest is actually due.

ALTER TABLE public.agent_approvals
  ADD COLUMN IF NOT EXISTS expiry_notified_at timestamptz;

ALTER TABLE public.user_notification_preferences
  ADD COLUMN IF NOT EXISTS last_digest_sent_at timestamptz;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  base_url text := 'https://project--371dd588-1b70-4629-9bb5-9f003f3af373.lovable.app';
BEGIN
  DELETE FROM cron.job WHERE jobname = 'digest-tick';

  PERFORM cron.schedule(
    'digest-tick',
    '0 * * * *',
    format($job$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object('Content-Type','application/json','x-cron-key', public.get_cron_hook_secret()),
        body := '{}'::jsonb
      ) AS request_id;
    $job$, base_url || '/api/public/hooks/digest-tick')
  );
END $$;
