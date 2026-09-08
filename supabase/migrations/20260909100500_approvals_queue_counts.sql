-- One count per workspace for the Inbox's "N waiting in X" line.
--
-- The line used to be drawn by running the WHOLE approvals queue once per
-- other workspace the person belongs to (2026-09-08, Lane 2: six full reads
-- fired in the same tick for a number and a name). This function answers
-- every workspace the caller is a member of in one round trip, under the
-- caller's own row-level security (SECURITY INVOKER), with the same
-- predicates the queue's family reads use in approvals-queue.functions.ts:
--
--   tool_call            agent_approvals   status = pending, own rows
--   decision             decisions         status = pending, mission not still proposed
--   memory_candidate     memory_candidates status = pending
--   house_rule           house_rules       status = pending
--   spec                 prds              status = review, design gate not superseded
--   opportunity          opportunities     status = backlog, critic verdict revise|kill
--   assumption_challenge assumption_challenges status = open
--   playbook_proposal    playbook_proposals status = proposed
--   design_gate          prds              design_gate_status = pending, stage enabled
--
-- Snoozed items are left out, as the queue leaves them out. Each family is
-- capped the way its read is capped (FAMILY_LIMIT 100; 50 for tool calls,
-- whose read takes the newest 50 of every status; 200 for house rules), so a
-- workspace past a cap reads the same floor the page prints. Trust
-- graduation proposals carry no workspace and are counted in none: the queue
-- shows them under every workspace, and a line about ANOTHER workspace must
-- not repeat them per row.
create or replace function public.approvals_queue_counts(p_exclude uuid default null)
returns table (workspace_id uuid, name text, waiting integer)
language sql
stable
security invoker
set search_path = public
as $$
  with ws as (
    select w.id, w.name, w.design_stage_enabled
    from public.workspaces w
    join public.workspace_members m on m.workspace_id = w.id and m.user_id = auth.uid()
    where p_exclude is null or w.id <> p_exclude
  ),
  snoozed as (
    select kind, source_id
    from public.approval_snoozes
    where user_id = auth.uid() and snoozed_until > now()
  ),
  fam as (
    select ws.id as wid, 'tool_call'::text as kind, a.id::text as sid, 50 as cap
      from ws join public.agent_approvals a
        on a.workspace_id = ws.id and a.status = 'pending' and a.user_id = auth.uid()
    union all
    select ws.id, 'decision', d.id::text, 100
      from ws join public.decisions d on d.workspace_id = ws.id and d.status = 'pending'
      left join public.missions mi on mi.id = d.mission_id
      where mi.status is distinct from 'proposed'
    union all
    select ws.id, 'memory_candidate', mc.id::text, 100
      from ws join public.memory_candidates mc on mc.workspace_id = ws.id and mc.status = 'pending'
    union all
    select ws.id, 'house_rule', hr.id::text, 200
      from ws join public.house_rules hr on hr.workspace_id = ws.id and hr.status = 'pending'
    union all
    select ws.id, 'spec', p.id::text, 100
      from ws join public.prds p
        on p.workspace_id = ws.id and p.status = 'review'
       and (p.design_gate_status is null or p.design_gate_status <> 'superseded')
    union all
    select ws.id, 'opportunity', o.id::text, 100
      from ws join public.opportunities o
        on o.workspace_id = ws.id and o.status = 'backlog'
       and (o.critic_review ->> 'verdict') in ('revise', 'kill')
    union all
    select ws.id, 'assumption_challenge', c.id::text, 100
      from ws join public.assumption_challenges c on c.workspace_id = ws.id and c.status = 'open'
    union all
    select ws.id, 'playbook_proposal', pp.id::text, 100
      from ws join public.playbook_proposals pp on pp.workspace_id = ws.id and pp.status = 'proposed'
    union all
    select ws.id, 'design_gate', p.id::text, 100
      from ws join public.prds p on p.workspace_id = ws.id and p.design_gate_status = 'pending'
      where ws.design_stage_enabled
  ),
  kept as (
    select f.wid, f.kind, f.sid,
           row_number() over (partition by f.wid, f.kind order by f.sid) as rn, f.cap
    from fam f
    where not exists (
      select 1 from snoozed s where s.kind = f.kind and s.source_id = f.sid
    )
  ),
  counted as (
    select wid, count(*)::integer as n from kept where rn <= cap group by wid
  )
  select ws.id, ws.name, coalesce(c.n, 0)
  from ws left join counted c on c.wid = ws.id
  order by coalesce(c.n, 0) desc, ws.name;
$$;

revoke all on function public.approvals_queue_counts(uuid) from public;
grant execute on function public.approvals_queue_counts(uuid) to authenticated;
