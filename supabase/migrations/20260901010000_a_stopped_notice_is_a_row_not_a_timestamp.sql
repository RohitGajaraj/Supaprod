-- A STOPPED-WORK NOTICE IS A ROW, NOT A TIMESTAMP (S0-A02 §2, gap #2).
--
-- WHY A TABLE AND NOT A `notified_at` COLUMN. Three reasons and the third decides it:
--
--   1. A column cannot express the claim. "Fire once on hold acquisition" is about a
--      (track, hold) PAIR, not about a track. A bare `notified_at` cannot say WHICH hold
--      it was for, so a track moving from `out-of-time` to `station-cannot-finish` either
--      never notifies again or notifies wrongly. Adding a second column to fix that is a
--      one-row table, built badly.
--   2. It is the record the product's own thesis asks for. "The result finds somebody who
--      is not looking" is §0.7's fourth ranking step; whether it DID is a question
--      somebody will ask, and a timestamp overwritten in place cannot answer it.
--   3. THE DEDUPE MUST BE THE DATABASE'S JOB. Cron job 68 runs every 10 minutes — 144
--      passes a day. A check-then-write in application code races with itself the moment
--      two passes overlap or a retry lands, and the failure mode is exactly the flood of
--      duplicate messages it exists to prevent. A unique index cannot race.
--
-- THE KEY IS ONCE PER (track, hold) FOR THE LIFE OF THE TRACK, and that is a limitation
-- stated rather than discovered later. `spine_tracks` carries `last_hold` and
-- `last_hold_because` and NO acquisition timestamp — checked against `information_schema`,
-- not against the generated types. So "this acquisition" is not expressible today. For the
-- four TERMINAL holds this narrows to very nearly correct, and shipping the honest key
-- beats adding `last_hold_at` on speculation. A real re-acquired terminal hold is the
-- evidence for widening it, and that is a small migration then.
--
-- NARROW ON PURPOSE: the 42, not the 97. `TERMINAL_HOLDS` is `given-up`,
-- `station-cannot-finish`, `tools-refused`, `going-in-circles` — measured 2 + 36 + 1 + 3.
-- A terminal hold is definitionally "the sweep will never act on this again", so for those
-- 42 "this stopped and nobody is coming" is a claim the data supports outright.
-- `out-of-time` (28) and `needs-evidence` (12) can still clear on a later tick, so a
-- message about them may be false by the time it is read. THE FIRST EMAIL THIS PRODUCT
-- EVER SENDS MUST BE ONE A PERSON IS GLAD TO HAVE RECEIVED.

CREATE TABLE IF NOT EXISTS public.track_hold_notices (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id   uuid NOT NULL REFERENCES public.spine_tracks(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL,
  hold       text NOT NULL,
  channel    text NOT NULL DEFAULT 'email',
  sent_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (track_id, hold)
);

-- TENANT ISOLATION IS NOT OPTIONAL AND THIS TABLE MUST NOT EXIST WITHOUT IT.
-- `public` is exposed through PostgREST, so an un-RLS'd table here is readable by any
-- authenticated user the moment it holds a row. The enterprise gate is `workspace_id` or
-- `user_id` on every read and write; this table carries `user_id` and the policy below is
-- what makes it mean anything.
ALTER TABLE public.track_hold_notices ENABLE ROW LEVEL SECURITY;

-- Read your own notices. There is no client write path at all: the only writer is the
-- tick, which runs as the service role and bypasses RLS by design.
--
-- APPLIED 2026-09-01 EXCEPT THIS STATEMENT (F-180). The table and the RLS enable both
-- landed and are verified; `CREATE POLICY` was refused three times on this path, bare and
-- wrapped in a DO block, every one `499 request_cancelled` with `pg_policies` still 0.
-- **RLS ON WITH NO POLICY IS DENY-ALL, so the table is safe as it stands** and the gap is
-- functional rather than a leak: an owner cannot yet read their own notices, on a feature
-- that has no reader. Re-run this one statement when the path allows it.
CREATE POLICY track_hold_notices_select_own
  ON public.track_hold_notices FOR SELECT
  USING (auth.uid() = user_id);
