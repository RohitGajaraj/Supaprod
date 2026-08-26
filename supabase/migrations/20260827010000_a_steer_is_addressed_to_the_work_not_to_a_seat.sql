-- A STEER IS ADDRESSED TO THE WORK, NOT TO A SEAT (S1's blocker, 2026-08-26).
--
-- `agent_messages.mission_id` lost its NOT NULL so a steer could be addressed to
-- a track. The insert then fell straight to the next mandatory column and every
-- track-scoped steer is still refused in production:
--
--   null value in column "to_agent_slug" of relation "agent_messages"
--   violates not-null constraint
--
-- The table was modelled for ONE message type: a handoff from one named seat to
-- another. Measured 2026-08-26: 156 rows, every one mission-scoped, none
-- track-scoped, and only 3 of the 7 ruled kinds ever written (handoff 139,
-- kickoff 14, steer 3). `ask`, `claim`, `challenge`, `escalate` and `broadcast`
-- are all uninsertable for exactly this reason, so this unblocks five surfaces,
-- not one.
--
-- A SENTINEL SLUG WAS THE WRONG FIX and is deliberately not what this does.
-- Writing "the-work" or the lead seat into the column would make a steer look
-- addressed to somebody nobody chose, and at Discover more than one seat runs.
--
-- So the invariant is kept where it is real and dropped where it never was:
-- a message TO A SEAT must still name one; a message to the work must not be
-- required to. Same shape as the `agent_messages_belongs_to_work` CHECK.
ALTER TABLE public.agent_messages
  ALTER COLUMN to_agent_slug DROP NOT NULL;

-- Every existing row already satisfies this: all 139 handoffs and all 14
-- kickoffs name a recipient, so it validates without a backfill.
ALTER TABLE public.agent_messages
  ADD CONSTRAINT agent_messages_seat_addressed_kinds_name_a_recipient
  CHECK (kind NOT IN ('handoff', 'kickoff') OR to_agent_slug IS NOT NULL);

COMMENT ON COLUMN public.agent_messages.to_agent_slug IS
  'The seat this message is addressed to. NULL for messages addressed to the work itself (steer, ask, claim, challenge, escalate, broadcast). Required for handoff and kickoff, enforced by agent_messages_seat_addressed_kinds_name_a_recipient.';
