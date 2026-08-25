-- Runway counted a cycle correction as burn.
--
-- `20260825072000` shipped `credit_runway` filtering `cl.delta_credits < 0`
-- where it meant `cl.reason = 'debit'`. **A monthly cycle correction lands as
-- `reason = 'reset'` and can be negative**, so it was counted as spend.
--
--   SELECT reason, count(*), sum(delta_credits), count(*) FILTER (WHERE delta_credits < 0)
--     FROM credit_ledger WHERE created_at > now() - interval '7 days' GROUP BY reason;
--   -- debit | 6032 | -38638 | 6032
--   -- reset |   11 |  +6766 |    3     <- three negative rows, -10,264 credits
--   -- grant |    6 | +30000 |    0
--   -- topup |    1 |  +5000 |    0
--
-- On account `164e0692`: spend read **14,869** instead of 13,096,
-- credits-per-run **41.3028** instead of 36.3778, and **runs_left 64 instead of
-- 72** — an 11% understatement, arriving on exactly the day a cycle rolls.
--
-- IT FAILS SAFE, which is why it survived a review: understating runway warns
-- early rather than late. That makes it a correctness defect rather than a
-- safety one, and it is still wrong — a number a person is asked to act on has
-- to be the number.
--
-- **THE CODE PREDICTED THIS IN WRITING.**
-- `src/lib/payments/credit-runway.server.ts:96-100` says a filter that ever
-- widened would *"silently turn a monthly cycle correction into a burn rate and
-- warn every account on the day its cycle rolls."* I widened it the same day, in
-- a different file, without reading that comment.
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
    -- `reason = 'debit'`, never `delta_credits < 0`. See the header.
    select coalesce(-sum(cl.delta_credits), 0) as credits
      from public.credit_ledger cl
     where cl.account_id = for_account
       and cl.reason = 'debit'
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
