-- Credits spent per trace, in one round trip.
--
-- `creditsSpentByTrace` (credits.functions.ts) backs the credits figure on
-- the home's rows, the run screen and a decision's detail. It read
-- ai_events by trace id in batches of 25, then credit_ledger by event id in
-- batches of 25, under the service role: two sequential Worker-to-PostgREST
-- hops at best and, on the home (174 traces on 2026-09-04), fourteen URLs.
-- credit_ledger.ai_event_id carried no index, so every ledger batch was a
-- scan of 27,539 rows. This is the same join, done once, in the database.
--
-- SECURITY DEFINER for the same reason the read used the service role:
-- credit_ledger is readable by account members and ai_events by workspace
-- members, and a trace's spend spans both. The caller has already proved it
-- may see the runs whose trace ids it passes (both callers read agent_runs
-- under RLS first), so the ids are the scope. Only debits count, as
-- `sumCreditsByTrace` counts them: negative deltas, reported positive.
create index if not exists credit_ledger_ai_event_idx
  on public.credit_ledger (ai_event_id)
  where ai_event_id is not null;

create or replace function public.credits_spent_by_trace(p_trace_ids uuid[])
returns table (trace_id uuid, credits bigint)
language sql
stable
security definer
set search_path = public
as $$
  select e.trace_id, sum(-l.delta_credits)::bigint as credits
  from public.credit_ledger l
  join public.ai_events e on e.id = l.ai_event_id
  where e.trace_id = any(p_trace_ids)
    and l.surface = 'agent'
    and l.reason = 'debit'
    and l.delta_credits < 0
  group by e.trace_id;
$$;

revoke all on function public.credits_spent_by_trace(uuid[]) from public;
grant execute on function public.credits_spent_by_trace(uuid[]) to authenticated, service_role;
