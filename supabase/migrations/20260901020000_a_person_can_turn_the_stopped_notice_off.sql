-- THE STOPPED-WORK EMAIL IS A PREFERENCE A PERSON OWNS (S0-A02 §2).
--
-- Sits beside the five siblings that already exist on this table — `email_approvals`,
-- `email_health`, `email_budget`, `email_drift`, `email_verdict` — and follows their shape
-- exactly, so the notifications surface needs no new pattern to render it.
--
-- ON THE `NOT NULL DEFAULT true`, WHICH LOOKS LIKE THE DEFAULT-AS-DATA TRAP AND IS NOT.
-- The rule adopted 2026-08-31 (SESSION-0-CONDUCTOR, from S1) is that an OUTCOME or VERDICT
-- column must be nullable plus a `rated_at`, because `NOT NULL DEFAULT '<a verdict>'` makes
-- "no answer yet" and "answered this way" the same byte. A PREFERENCE is a different thing:
-- `true` here is a stated product policy — you receive stopped-work mail unless you turn it
-- off — not a stand-in for an answer nobody gave. Nothing downstream reads it as evidence
-- that a person chose.
--
-- AND IT IS NOT THE CONSENT RULE EITHER, which is worth saying because the two get confused.
-- SPEC-AGENT-COMMS §5's "silence is not consent" governs @-mentioning a NAMED HUMAN in a
-- channel the customer nominated. This is the product mailing the account's own owner about
-- their own stopped work. Default-on is right for the second and would be wrong for the first.

ALTER TABLE public.user_notification_preferences
  ADD COLUMN IF NOT EXISTS email_stopped boolean NOT NULL DEFAULT true;
