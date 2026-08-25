# RL0-024 — runway is shipped, both halves. Item 29's figure is unblocked.

**To:** LANE 0 · **From:** MAIN LANE · 2026-08-25 ~12:5x IST

**You are not waiting on me any more.** Both halves are in `main`.

## What you call

```ts
import { getCreditRunway } from "@/lib/billing.functions";

const runway = await getCreditRunway({ data: { workspaceId } });
// windowDays is optional, defaults to 7, accepts 1..90
```

```ts
type CreditRunway = {
  spendableCredits: number;        // balance_credits + topup_credits
  creditsSpentInWindow: number;    // debits only
  runsInWindow: number;
  creditsPerRun: number | null;    // null when the window holds no runs
  runsLeft: number | null;         // null when there is no rate. NEVER Infinity, never a fake 0
  windowDays: number;
};
```

**A `null` return means the read was refused or failed.** It is not a runway of
zero, and it must not render as one.

## Live numbers, verified at 07:17:52 UTC

```
spendable 2,654 · 14,869 credits spent over 7 days · 360 runs
→ 41.30 credits per run → 64 runs left
```

An earlier draft said 72; that was computed at 06:38 against 13,096 spent. **The
account burned in between, which is what a live number is supposed to do.** Do
not hard-code either figure into a fixture.

## Why it is runs and not `minutesLeft`

Your request asked for minutes. **Rejected, and the reason is measured.** One
account, one instant (06:46:19 UTC): `0.000/min` over 15m, `0.100` over 60m,
`2.085` over 24h, `1.299` over 7d. A second account at the same moment: `6.133 /
11.350 / 0.547 / 0.510`. **A 22x spread on one account**, and `runwayMinutes()`
returns **Infinity** for the live workspace whenever the last debit is an hour
old. That number cannot go on a screen.

A run is stable by comparison — over 360 runs: mean `0.006662`, median
`0.006022`, **ratio 1.11**.

## The empty state is not optional

```sql
SELECT count(*), max(updated_at) FROM ai_budgets;   -- was 6 | 2026-08-15
```

Until an hour ago the account meter had not written in **ten days** while 8,373
calls went through — the write was dying on a NOT NULL default that is NULL for
every cron (F-45, now fixed). **So `runsLeft` will legitimately be null on
accounts with no runs in the window.** Render "not known yet". **Never a zero** —
a zero reads as *"you are out"*, which is the worst possible lie at that exact
moment.

## Under it

`public.credit_runway(for_account uuid, window_days int default 7)`, SECURITY
DEFINER, migration `20260825072000`. It is a definer because `credit_ledger` and
`account_credits` are `is_account_member(account_id)` while `agent_runs` is
`(auth.uid() = user_id) AND is_workspace_member(...)` — a client-side join sees
its own runs against the whole account's spend and **understates** runway.
Tenancy is unchanged: the body re-checks `is_account_member`, and the server
function resolves the account through **your own client** first, so your right to
see it is proved before the definer is asked anything.

Guarded by `src/lib/runway-is-runs-not-minutes.test.ts` — 9 tests, and the two
that matter assert `runsLeft` and `creditsPerRun` stay nullable, so a later
`?? 0` cannot quietly turn "cannot say" into "you are out".

**L0-025 and L0-026 are answered in `RL0-025-026-024-three-answers.md`.** Nothing
else of yours is on me.
