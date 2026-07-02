-- FS-01: Prediction contracts + calibration.
-- Every derive-tick prediction/risk insight gets a falsifiable claim, a horizon
-- date, and (already present) a confidence. A calibrate-tick cron scores expired
-- claims Brier-style, throttles a kind that keeps missing, and the hit rate is
-- readable via getForecastCalibration.

ALTER TABLE public.insights
  ADD COLUMN IF NOT EXISTS claim text,
  ADD COLUMN IF NOT EXISTS horizon_date timestamptz,
  ADD COLUMN IF NOT EXISTS resolution text CHECK (resolution IS NULL OR resolution IN ('hit', 'miss', 'inconclusive')),
  ADD COLUMN IF NOT EXISTS brier_score real,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

CREATE INDEX IF NOT EXISTS insights_due_for_calibration_idx
  ON public.insights (workspace_id, horizon_date)
  WHERE kind IN ('prediction', 'risk') AND status = 'open' AND resolution IS NULL;

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS prediction_throttle_until timestamptz,
  ADD COLUMN IF NOT EXISTS risk_throttle_until timestamptz;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  base_url text := 'https://project--371dd588-1b70-4629-9bb5-9f003f3af373.lovable.app';
BEGIN
  DELETE FROM cron.job WHERE jobname = 'calibrate-tick';

  PERFORM cron.schedule(
    'calibrate-tick',
    '0 */6 * * *',
    format($job$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object('Content-Type','application/json','x-cron-key', public.get_cron_hook_secret()),
        body := '{}'::jsonb
      ) AS request_id;
    $job$, base_url || '/api/public/hooks/calibrate-tick')
  );
END $$;
