# getCreditRunway vs live DB — verification (2026-08-25, all DB times UTC)

> _Created: 2026-08-25 · Last updated: 2026-08-25_

## VERDICT: MATCH

The live `credit_runway` Postgres function carries the F-47 fix (`reason = 'debit'`, not
`delta_credits < 0`), its arithmetic reproduces exactly against the live credit tables, and the
row class that caused F-47 (negative `reason='reset'` cycle corrections, **all three rows of the
original -10,264 are still inside the current 7-day window**) is correctly excluded. Had the old
filter still been live, "My workspace" would today read runs_left **64 instead of 72** (11%
understatement). Helio Labs shows zero divergence today (its in-window reset row is positive).

## 1. The code path (file:line)

- `src/lib/billing.functions.ts:177-237` — `getCreditRunway` server fn. It does **no arithmetic
  itself**: reads `workspaces.account_id` for the given workspaceId (line 195-199, caller's RLS
  client as a membership gate), then calls `supabase.rpc("credit_runway", { for_account, window_days })`
  (line 205-208). Default window 7 days (line 189). Maps: `spendable_credits→spendableCredits`,
  `credits_spent_in_window→creditsSpentInWindow`, `runs_in_window→runsInWindow`,
  `credits_per_run→creditsPerRun` (null-preserving), `runs_left→runsLeft` (lines 226-233).
  No row / error / no account → `null`, never 0 (lines 203, 209, 221).
- `supabase/migrations/20260825072000_runway_is_denominated_in_runs.sql:36-81` — original RPC,
  **defective**: burn = `cl.delta_credits < 0` (line 63).
- `supabase/migrations/20260825074500_runway_counts_debits_not_every_negative_row.sql:28-72` —
  F-47 fix: burn = `cl.reason = 'debit'` (line 54).
- Tables read by the RPC: `account_credits(balance_credits, topup_credits)` for spendable;
  `credit_ledger(account_id, reason, delta_credits, created_at)` for burn;
  `agent_runs` joined to `workspaces` on `workspace_id`, filtered `w.account_id = for_account`,
  for the run count. `runs_left = floor(spendable / (spent/runs))`, null when runs=0 or spent<=0.
- Related but NOT this path: `src/lib/payments/credit-runway.server.ts:90` (minutes-based warner,
  also filters `reason='debit'`).

## 2. Live function definition is the fixed one

```sql
select now() as db_now_utc, pg_get_functiondef(p.oid) as def
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'credit_runway';
```
→ `db_now_utc 2026-08-25 08:51:42+00`. Live body filters
`cl.account_id = for_account and cl.reason = 'debit'` — the F-47 fix is deployed. (The live
body's comment text is shorter than the repo migration's; **logic is identical, drift is
comments only**.) One live definition, no overloads.

## 3. Workspace → account resolution

```sql
select now() as db_now_utc, id, name, account_id from public.workspaces
where id in ('60000000-0000-4000-8000-000000000000','0b792d52-82e2-43e2-adc5-8a26e5c800b4');
```
→ Helio Labs `60000000-…` → account `5731ab6f-bcbc-4300-bc27-e533357cdc04`;
My workspace `0b792d52-…` → account `164e0692-71e4-4f53-b5e5-66aa930a672f` (the F-47 account).

## 4. Arithmetic reproduced both ways (fixed filter vs old defective filter)

Ran once per account (shown for Helio Labs; the second run is byte-identical except the uuid
`164e0692-71e4-4f53-b5e5-66aa930a672f`):

```sql
with p as (select '5731ab6f-bcbc-4300-bc27-e533357cdc04'::uuid as acct),
bal as (select coalesce(ac.balance_credits,0)+coalesce(ac.topup_credits,0) as spendable
          from public.account_credits ac, p where ac.account_id = p.acct),
spent_fixed as (select coalesce(-sum(cl.delta_credits),0) as c from public.credit_ledger cl, p
                 where cl.account_id = p.acct and cl.reason = 'debit'
                   and cl.created_at > now() - interval '7 days'),
spent_defect as (select coalesce(-sum(cl.delta_credits),0) as c from public.credit_ledger cl, p
                  where cl.account_id = p.acct and cl.delta_credits < 0
                    and cl.created_at > now() - interval '7 days'),
runs as (select count(*)::int as n from public.agent_runs r
           join public.workspaces w on w.id = r.workspace_id
           cross join p
          where w.account_id = p.acct and r.created_at > now() - interval '7 days')
select now() as db_now_utc,
       bal.spendable, spent_fixed.c as spent_debit_only, spent_defect.c as spent_all_negative,
       runs.n as runs_in_window,
       case when runs.n > 0 then round(spent_fixed.c::numeric / runs.n, 4) end as cpr_fixed,
       case when runs.n > 0 then round(spent_defect.c::numeric / runs.n, 4) end as cpr_defect,
       case when runs.n > 0 and spent_fixed.c > 0
            then floor(bal.spendable::numeric / (spent_fixed.c::numeric / runs.n))::int end as runs_left_fixed,
       case when runs.n > 0 and spent_defect.c > 0
            then floor(bal.spendable::numeric / (spent_defect.c::numeric / runs.n))::int end as runs_left_defect
from bal, spent_fixed, spent_defect, runs;
```

| account | measured at (UTC) | spendable | spent (fixed) | spent (old filter) | runs | credits/run (fixed) | runs_left (fixed) | runs_left (old) |
|---|---|---|---|---|---|---|---|---|
| Helio Labs `5731ab6f` | 08:52:16 | 2,971 | 6,243 | 6,243 | 105 | 59.4571 | **49** | 49 |
| My workspace `164e0692` | 08:52:22 | 2,646 | 13,104 | 14,877 | 360 | 36.4000 | **72** | 64 |

These are exactly the numbers the live RPC computes (same CTE structure, same rounding, same
floor). `getCreditRunway` would return: Helio Labs `{2971, 6243, 105, 59.4571, 49}`; My
workspace `{2646, 13104, 360, 36.4000, 72}`.

## 5. Row classes — who counts what

```sql
select now() as db_now_utc, account_id, reason, count(*) as n_rows,
       sum(delta_credits) as sum_delta,
       count(*) filter (where delta_credits < 0) as neg_rows,
       coalesce(sum(delta_credits) filter (where delta_credits < 0), 0) as neg_sum
from public.credit_ledger
where account_id in ('5731ab6f-bcbc-4300-bc27-e533357cdc04','164e0692-71e4-4f53-b5e5-66aa930a672f')
  and created_at > now() - interval '7 days'
group by account_id, reason
order by account_id, reason;
```
→ `164e0692`: debit 1,831 rows / −13,104; grant 1 / +5,000; **reset 1 / −1,773 (negative)**;
topup 1 / +5,000. `5731ab6f`: debit 858 / −6,243; grant 1 / +5,000; reset 1 / **+1,919**
(positive, so no divergence for this account today).

```sql
select now() as db_now_utc, reason, count(*) as n_rows,
       min(delta_credits) as min_delta, max(delta_credits) as max_delta,
       count(*) filter (where delta_credits < 0) as neg_rows
from public.credit_ledger
group by reason order by reason;
```
→ whole ledger holds only `debit` (18,924, all negative), `grant` (50, one negative), `reset`
(17, four negative, min −4,250), `topup` (1). No `adjustment` rows exist yet.

```sql
select now() as db_now_utc, account_id, reason, delta_credits, created_at,
       (created_at > now() - interval '7 days') as in_current_7d_window
from public.credit_ledger
where delta_credits < 0 and reason <> 'debit'
order by created_at desc;
```
→ The three F-47 rows are all dated `2026-08-22 02:20 UTC`, **all still in the current window**:
`164e0692` −1,773; `5d5cc377` −4,250; `1a8da78c` −4,241 (sum −10,264 — F-47's exact figure).
Plus one negative `grant` (−469, account `d76648b2`, 2026-07-09, out of window).

Classes one side counts and the other does not:
- **`reset` (negative cycle corrections)**: my old-filter SQL counts them, the live function
  excludes them — correct per F-47. Live magnitude today: 1,773 credits / 8 runs of runway on
  `164e0692`; accounts `5d5cc377` and `1a8da78c` are also protected in this window.
- **negative `grant`** (one −469 clawback-shaped row): also excluded by the fixed filter, would
  have counted under the old one. None in the current window.
- **`adjustment`** (refund credit-backs written by `refund_account_credits`,
  `supabase/migrations/20260713010000_g_price_a1_refund_rpc.sql:49-52`): positive rows, excluded
  from burn by both filters; zero rows exist so far.

## 6. Refunded runs (`agent_runs.credits_refunded`) — no distortion

```sql
select now() as db_now_utc, w.account_id, r.credits_refunded, count(*) as n
from public.agent_runs r
join public.workspaces w on w.id = r.workspace_id
where w.account_id in ('5731ab6f-bcbc-4300-bc27-e533357cdc04','164e0692-71e4-4f53-b5e5-66aa930a672f')
  and r.created_at > now() - interval '7 days'
group by w.account_id, r.credits_refunded
order by w.account_id, r.credits_refunded;
```
→ `164e0692`: 318 false / 42 true. `5731ab6f`: 91 false / 14 true.

```sql
select now() as db_now_utc, w.account_id,
       count(distinct r.id) as refunded_runs,
       coalesce(sum(-cl.delta_credits), 0) as debit_credits_on_refunded_runs
from public.agent_runs r
join public.workspaces w on w.id = r.workspace_id
left join public.ai_events e on e.surface_ref = r.id::text
left join public.credit_ledger cl on cl.ai_event_id = e.id and cl.reason = 'debit'
where r.credits_refunded
  and w.account_id in ('5731ab6f-bcbc-4300-bc27-e533357cdc04','164e0692-71e4-4f53-b5e5-66aa930a672f')
  and r.created_at > now() - interval '7 days'
group by w.account_id;
```
→ debit credits on all 56 refunded runs: **0**. The flag is the settled idempotency claim for
abandoned runs that never debited (`src/lib/credits.functions.ts:167` marks zero-debit runs
settled). Consistent with zero `adjustment` rows. Latent (documented, fails-safe) behavior: if a
refund ever does move credits, the run's original debits stay in burn while the `adjustment`
credit-back is not netted — runway would warn slightly early, never late.

```sql
select now() as db_now_utc, refund_ref, account_id, provider, credits_requested, credits_clawed, note, created_at
from public.credit_refunds order by created_at desc limit 20;
```
→ empty (provider money-refund clawbacks; never fired).

## 7. Sanity cross-checks

```sql
select now() as db_now_utc, ac.account_id, ac.balance_credits, ac.topup_credits,
       ac.balance_credits + ac.topup_credits as spendable,
       (select sum(delta_credits) from public.credit_ledger l where l.account_id = ac.account_id) as ledger_sum_all_time
from public.account_credits ac
where ac.account_id in ('5731ab6f-bcbc-4300-bc27-e533357cdc04','164e0692-71e4-4f53-b5e5-66aa930a672f');
```
→ `5731ab6f`: balance 2,971 + topup 0; all-time ledger sum −6,279. `164e0692`: balance 2,635 +
topup 11 = 2,646; ledger sum −2,354. The balance is maintained directly by the grant/debit/reset
RPCs (initial seeding is not ledgered), so ledger-sum ≠ balance is expected and the runway
function does not depend on that equality — it reads spendable from `account_credits`.

```sql
select now() as db_now_utc, * from public.credit_runway('164e0692-71e4-4f53-b5e5-66aa930a672f'::uuid, 7);
```
→ zero rows: the SECURITY DEFINER body's `is_account_member` gate refuses this non-member API
connection (no `auth.uid()`), and `billing.functions.ts:221` maps that to `null`, not zero.
Working as designed; it also means the RPC's own output for a real member could not be observed
directly here — the comparison above reproduces its body's CTEs verbatim instead.

## Schema/column notes
```sql
select table_name, column_name, data_type from information_schema.columns
where table_schema = 'public'
  and (table_name in ('credit_ledger','account_credits') or column_name ilike '%refund%')
order by table_name, ordinal_position;
```
→ `credit_ledger(id, account_id, user_id, delta_credits bigint, reason text, surface, ai_event_id,
product_id, created_at)`; `account_credits(account_id, balance_credits, monthly_grant_credits,
topup_credits, cycle_anchor, updated_at, overage_enabled, overage_cap_multiplier)`;
`agent_runs.credits_refunded boolean`; `credit_refunds(refund_ref, account_id, user_id, provider,
credits_requested, credits_clawed, note, created_at)`.
