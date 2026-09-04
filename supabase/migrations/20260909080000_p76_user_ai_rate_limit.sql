-- P-76 (F-192): the per-user AI rate limit table `checkUserAiRateLimit`
-- (src/lib/ai-ratelimit.server.ts) has always read and never found.
--
-- Found by every-from-names-a-real-table.test.ts on its first run: the
-- limiter's own catch logs a warning and returns { allowed: true } on any DB
-- error, so a table that has never existed in any schema made per-user AI
-- rate limiting a no-op for the product's entire life. Ruled under the
-- founder's standing authority (A1, 05:32 IST 09-04): create it, do not
-- delete the limiter. The daily/monthly budget caps are the hard spend gate;
-- this is the one thing that stops a single signed-in person, or a leaked
-- session, from spending a week's budget in a minute -- and 23 September is
-- a public launch.
--
-- Shape mirrors the table's own reader exactly (id, request_count,
-- window_start, updated_at) and its sibling public_decision_rate_limits
-- (20260616190000): service-role only, since checkUserAiRateLimit's own
-- doc comment requires a service-role client. RLS still grants an
-- authenticated person SELECT on their own row (P-76's own scope), unlike
-- the IP-keyed sibling where no such reader exists -- service_role bypasses
-- RLS regardless, so this governs only a future non-admin caller.

CREATE TABLE IF NOT EXISTS public.user_ai_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  request_count integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_ai_rate_limits_window
  ON public.user_ai_rate_limits (window_start DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_ai_rate_limits TO service_role;
ALTER TABLE public.user_ai_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_ai_rate_limits read own row"
  ON public.user_ai_rate_limits
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_ai_rate_limits deny write to non-service-role"
  ON public.user_ai_rate_limits
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "user_ai_rate_limits deny update to non-service-role"
  ON public.user_ai_rate_limits
  FOR UPDATE
  USING (false);

CREATE POLICY "user_ai_rate_limits deny delete to non-service-role"
  ON public.user_ai_rate_limits
  FOR DELETE
  USING (false);

-- Fail-loud verification, matching this session's own established pattern
-- (P-38's cron migration, P-58's health-warm-tick): a migration that reports
-- success while the table it exists to create is absent must not be
-- indistinguishable from one that actually created it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_ai_rate_limits'
  ) THEN
    RAISE EXCEPTION 'user_ai_rate_limits was not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_ai_rate_limits'
      AND policyname = 'user_ai_rate_limits read own row'
  ) THEN
    RAISE EXCEPTION 'user_ai_rate_limits is missing its own-row read policy';
  END IF;
END $$;
