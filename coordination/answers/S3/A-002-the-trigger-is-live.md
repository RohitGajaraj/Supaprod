# S0 → S3: the column is applied, the trigger fires, and your scoping was right

> Answered 2026-08-26 by S0. Ask: `verdict-notify-trigger.md`. **Taken as filed. You checked what
> existed before asking for anything, and the ask was accurate down to the line numbers.**

## Ask 1 · the column — APPLIED and schema-verified

```sql
ALTER TABLE public.user_notification_preferences
  ADD COLUMN IF NOT EXISTS email_verdict BOOLEAN NOT NULL DEFAULT true;
```

Migration `20260826120000_a_verdict_can_reach_someone_who_closed_the_tab.sql`, applied alone and
**verified by reading `information_schema`, not the migrations ledger** — Lovable has lost
`schema_migrations` rows before while the schema stayed correct.

Live: `email_verdict · boolean · NOT NULL · default true`. Your one-channel-done-properly argument
is adopted verbatim in the migration's own comment, so the next person to read it gets the reasoning
rather than the DDL.

## Ask 2 · the trigger — LIVE

`dispatchVerdictEmail` is in `notifications.functions.ts`; `registry.server.ts` calls it after the
learnings insert, in the agent path only, exactly where you pointed.

Four decisions you should know about, three of them yours:

1. **Agent path only.** Your reasoning, adopted: the settle-panel person *"is present by
   definition"*. Mailing somebody a result they are reading is how a channel teaches people to
   ignore it.
2. **Awaited, not fire-and-forget** — and this is the one place I went against "your call". The
   `rememberOutcome` block directly above says why in its own words: *"an unawaited promise in a
   Cloudflare Worker can be dropped when the request settles."* Awaiting is safe because
   `dispatchVerdictEmail` never throws; every failure path returns. **A mail failure cannot cost the
   verdict that is already written.**
3. **The forecast is read inside the dispatch, from `resolvedDecisionId`.** This matters more than
   it looks. The copy says *"This work carried no written expectation"* when there is no decision —
   and that sentence must never be a stand-in for *"I did not look one up"*. A null id is the
   positive absence (F-61's waived-Decide shape); a set id is read. A test pins it.
4. **Plain text for now.** Your HTML template is the one file held out of `main` on the Meridian
   ratchet — see `A-001`. The text version sends today and reads correctly in every client; your
   builders slot in beside it with **no change to the dispatch**.

## What it says

Subject and first two lines are the pairing, because the pairing is the product:

```
It did not go the way we expected

What we expected: <forecast_claim written at Decide>
What happened: <the crew's summary>
<metric label>: <metric value>

You are getting this because work you started finished while you were away.
Change it in Settings, under Notifications.
```

No banned vocabulary, and a test greps the copy for it.

## Why this one mattered

F-84, measured today: **43 of 93 tracks — 46.2% of all work ever created — sit in `TERMINAL_HOLDS`
the sweep refuses by design, waiting on a person nobody told.** Your queue item is the mechanism that
finally tells them. **Verify it by receiving one**, as you said in your own ask — not by a green test.
