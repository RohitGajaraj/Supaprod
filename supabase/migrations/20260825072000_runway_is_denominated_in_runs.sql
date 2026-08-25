-- Runway, denominated in RUNS, from one SECURITY DEFINER read.
--
-- WHY NOT MINUTES. Measured 2026-08-25 06:46:19 UTC, one account, one instant:
-- 15m 0.000/min, 60m 0.100/min, 24h 2.085/min, 7d 1.299/min. A second account
-- read 6.133 / 11.350 / 0.547 / 0.510 at the same moment. **A 22x spread on one
-- account at one instant**, and `runwayMinutes()` returns Infinity for the live
-- workspace whenever the last debit is an hour old. A number that swings 22x and
-- reads Infinity while money is being spent is not a number to put on a screen.
--
-- WHY RUNS WORK. A run is a near-uniform unit of cost:
--
--   SELECT count(*), avg(spend_used_usd), percentile_cont(0.5) WITHIN GROUP (ORDER BY spend_used_usd),
--          percentile_cont(0.9) ..., percentile_cont(0.99) ..., max(spend_used_usd)
--     FROM agent_runs WHERE created_at > now() - interval '7 days';
--   -- n=360 | mean 0.006662 | p50 0.006022 | p90 0.012373 | p99 0.018124 | max 0.021456
--
-- **Mean over median is 1.11.** The unit is stable enough to divide by.
--
-- WHY A SECURITY DEFINER RPC RATHER THAN TWO CLIENT READS. The three tables
-- disagree about scope: `credit_ledger` and `account_credits` are
-- `is_account_member(account_id)`, while `agent_runs` is
-- `(auth.uid() = user_id) AND is_workspace_member(workspace_id)`. A client
-- joining them sees only its OWN runs against the WHOLE account's spend, which
-- **understates runs-per-credit and therefore understates runway** — it warns
-- early rather than late, so this is a correctness fix rather than a safety one.
-- It is also 1,827 debit rows in seven days on one account, which is not a
-- payload to pull to a browser.
--
-- TENANCY IS NOT WIDENED. The definer body re-checks `is_account_member`
-- itself, so this returns nothing to a caller who could not already read the
-- account's credits.
--
-- THE HONEST UNKNOWN. No runs in the window means no rate, and the function
-- returns NULL for `credits_per_run` and `runs_left` rather than Infinity or a
-- fabricated number. A surface must render that as "not known yet".
create or replace function public.credit_runway(for_account uuid, window_days integer default 7)
returns table (
  spendable_credits bigint,
  credits_spent_in_window bigint,
  runs_in_window integer,
  credits_per_run numeric,
  runs_left integer
)
language sql
stable
security definer
set search_path to 'public'
as $function$
  with allowed as (
    select 1 where public.is_account_member(for_account)
  ),
  bal as (
    select coalesce(ac.balance_credits, 0) + coalesce(ac.topup_credits, 0) as spendable
      from public.account_credits ac
     where ac.account_id = for_account
  ),
  spent as (
    -- Debits only. A top-up landing inside the window must not read as negative
    -- burn, which is what summing every row would do.
    select coalesce(-sum(cl.delta_credits), 0) as credits
      from public.credit_ledger cl
     where cl.account_id = for_account
       and cl.delta_credits < 0
       and cl.created_at > now() - make_interval(days => greatest(window_days, 1))
  ),
  runs as (
    select count(*)::int as n
      from public.agent_runs r
      join public.workspaces w on w.id = r.workspace_id
     where w.account_id = for_account
       and r.created_at > now() - make_interval(days => greatest(window_days, 1))
  )
  select
    bal.spendable::bigint,
    spent.credits::bigint,
    runs.n,
    case when runs.n > 0 then round(spent.credits::numeric / runs.n, 4) end,
    case when runs.n > 0 and spent.credits > 0
         then floor(bal.spendable::numeric / (spent.credits::numeric / runs.n))::int end
  from allowed, bal, spent, runs;
$function$;

comment on function public.credit_runway(uuid, integer) is
  'Runway in RUNS for an account. Returns NULL runs_left when the window holds no runs or no spend - the honest unknown, never Infinity. SECURITY DEFINER because credit_ledger/account_credits are account-scoped while agent_runs is user-and-workspace-scoped, and a client-side join understates runway; the body re-checks is_account_member so tenancy is unchanged.';
