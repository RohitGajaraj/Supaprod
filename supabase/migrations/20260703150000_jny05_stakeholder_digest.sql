-- JNY-05: the ambient stakeholder loop. Lets a user's scheduled digest (FS-03's
-- reach channel) also carry their latest decision's audience-tuned stakeholder
-- pack, so keeping stakeholders in the loop rides the same cron/preferences
-- machinery instead of a separate surface.

ALTER TABLE public.user_notification_preferences
  ADD COLUMN IF NOT EXISTS digest_stakeholder_update boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS digest_stakeholder_audience text NOT NULL DEFAULT 'exec'
    CHECK (digest_stakeholder_audience = ANY (ARRAY['exec', 'eng', 'board']));
