-- A VERDICT CAN REACH SOMEONE WHO CLOSED THE TAB (F-84 / authorised gap #2).
--
-- WHY THIS COLUMN EXISTS. Gap #2 is ranked second of the authorised gaps and is
-- stated plainly: "Nothing reaches a person who left the page... No notification,
-- email, push or digest exists that carries a verdict to someone who closed the
-- tab." Measured 2026-08-26 (F-84), that costs 46.2% of all work ever created --
-- 43 of 93 tracks sit in TERMINAL_HOLDS which the sweep refuses BY DESIGN,
-- waiting on a person nobody told.
--
-- ONE CHANNEL, DONE PROPERLY. Email only. S3's reasoning, adopted: in-app already
-- shows learn results where the work lives, and a digest copy would dilute the one
-- send whose entire job is "the answer comes to you". No in_app_verdict, no
-- digest_verdict.
--
-- DEFAULT TRUE, matching every other email_* on this row. A person who never
-- opens Settings still gets the one message that closes the loop, and R-22's
-- "say the real number or say it is unset" does not apply to a boolean whose
-- default is the documented behaviour.
--
-- IF NOT EXISTS because Lovable has lost schema_migrations rows before -- seven
-- vanished at once while the schema itself stayed correct -- so this must be safe
-- to re-apply against a database that already has the column.
ALTER TABLE public.user_notification_preferences
  ADD COLUMN IF NOT EXISTS email_verdict BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.user_notification_preferences.email_verdict IS
  'Email the verdict when a track finishes at learn and the person is not present. Agent path only: the human settle path does not email, because that person is present by definition.';
