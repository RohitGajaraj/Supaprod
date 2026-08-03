-- Restore credit balances on the ten accounts we actually use, so investor, incubator
-- and demo exploration cannot be blocked mid-session.
--
-- WHY THEY DRAINED, because a top-up without the cause is just a slower leak. Two
-- defects, both fixed on 2026-08-03 and both shipped before this grant:
--
--   1. `qwen/qwen-plus` was absent from MODEL_PRICING and silently took the neutral
--      {0.5, 1.5} fallback. It is not a marginal model: AGENT_MODEL_PRIORITY routes the
--      entire agent loop to it, so every credit debit on the busiest path in the product
--      was computed from a placeholder. Priced now from the published Singapore list.
--   2. `ASSUMED_COMPLETION_TOKENS` was 1200 against a live median of 122. Every pre-call
--      projection overestimated the completion half about sevenfold, so the gate refused
--      calls the balance could comfortably cover. Live example: an account holding 16
--      credits blocked at "below projected 19" for work whose real debit was 12. Those
--      were FALSE REFUSALS counted as exhaustion. Recalibrated to 400 (p95 plus headroom).
--
-- Six of the ten were genuinely at zero-ish (2 to 16 credits) and being refused in
-- production at the moment this was written.
--
-- WHY THIS IS A MIGRATION AND NOT admin_grant_credits(). The supported admin path
-- requires a platform-admin identity, and the only way an agent can satisfy that is by
-- forging a `request.jwt.claims` sub to impersonate a real admin. That function writes
-- `admin_audit_log`, so doing it that way would record a human admin as having granted
-- these credits when no human did. For a product whose claim is a tamper-evident record
-- of every decision, falsifying the provenance of a billing action is not a shortcut
-- worth taking. This migration is the honest form: reviewable, attributed to a migration,
-- and authorised explicitly by the founder on 2026-08-03.
--
-- WHY 5000 EACH, and why that is cheap. At CREDIT_COGS_USD of 0.0002 a credit, 5000
-- credits is 1 USD of underlying cost, so the whole grant is about 10 USD of COGS IF
-- fully spent. Measured reality is smaller still: total Qwen spend across every account
-- is running near 5 USD a month, verified against two real Alibaba invoices. The cost of
-- an investor hitting a credit wall mid-demo is far larger than the cost of the credits.
--
-- The ledger entry is written in the same loop iteration as the balance change, so a
-- balance never moves without a row recording it.
--
-- NOTE ON WHERE THE "WHY" LIVES. `credit_ledger.reason` is not free text: a CHECK
-- constrains it to grant / reset / debit / topup / adjustment, and the table has no other
-- prose column. So the ledger can record THAT this was a grant and never WHY it was
-- needed. This file is therefore the only durable record of the cause, which is an
-- argument for reading migrations as history rather than as instructions, and a small
-- schema gap worth closing if credit disputes ever matter.
--
-- APPLIED LIVE 2026-08-03. Ten accounts restored to 5000; the six unused and test
-- accounts (rg_test, sw7-verify, step0.rerun, sanchhr, saicruzz.tools, infinitemuzic21)
-- were deliberately left untouched at their existing 603 to 750 balances.

DO $$
DECLARE
  r record;
  delta bigint;
  granted int := 0;
BEGIN
  FOR r IN
    SELECT a.id AS account_id, a.owner_id, u.email, coalesce(c.balance_credits, 0) AS bal
      FROM public.accounts a
      JOIN auth.users u ON u.id = a.owner_id
      LEFT JOIN public.account_credits c ON c.account_id = a.id
     WHERE u.email IN ('explore@supaprod.ai','harbor@supaprod.ai','lantern@supaprod.ai',
                       'compass@supaprod.ai','meridian@supaprod.ai','voyage@supaprod.ai',
                       'ember@supaprod.ai','demo@redcadence.app','demo2@redcadence.app',
                       'santacruzz656@gmail.com')
  LOOP
    delta := 5000 - r.bal;
    CONTINUE WHEN delta <= 0;

    PERFORM public._ensure_account_credits(r.account_id);

    UPDATE public.account_credits
       SET balance_credits = 5000
     WHERE account_id = r.account_id;

    INSERT INTO public.credit_ledger (account_id, user_id, delta_credits, reason, surface)
    VALUES (r.account_id, r.owner_id, delta, 'grant', 'admin');

    granted := granted + 1;
  END LOOP;

  RAISE NOTICE 'restored credit balance on % accounts', granted;
END $$;

-- Guard: none of the ten may be left below a usable floor, or the grant silently
-- half-applied and the next demo hits the same wall.
DO $$
DECLARE low text;
BEGIN
  SELECT string_agg(u.email || ' (' || c.balance_credits || ')', ', ')
    INTO low
    FROM public.accounts a
    JOIN auth.users u ON u.id = a.owner_id
    JOIN public.account_credits c ON c.account_id = a.id
   WHERE u.email IN ('explore@supaprod.ai','harbor@supaprod.ai','lantern@supaprod.ai',
                     'compass@supaprod.ai','meridian@supaprod.ai','voyage@supaprod.ai',
                     'ember@supaprod.ai','demo@redcadence.app','demo2@redcadence.app',
                     'santacruzz656@gmail.com')
     AND c.balance_credits < 1000;
  IF low IS NOT NULL THEN
    RAISE EXCEPTION 'credit restore left these accounts below 1000: %', low;
  END IF;
END $$;
