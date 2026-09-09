-- The three joins the station strip was making in JavaScript, done in SQL.
--
-- `readStudioSessions` (studio.functions.ts) mounts on every authenticated
-- page. It was eleven sequential Worker-to-PostgREST hops on 2026-09-08 and
-- three after F-216's fold; the third hop existed only because four reads
-- were keyed on what the second hop returned. Each of these functions
-- collapses one of those dependencies into the hop that already has the key,
-- so the read answers in two.
--
-- All three are SECURITY INVOKER: every read they replace was issued with
-- the caller's own client under RLS, and an invoker function keeps exactly
-- that scope. Nothing here is reachable with more than the caller had.

-- 1. mission_spec_titles: artifact_lineage (prd -> mission) joined to prds.
--    The JS read the edges, then read the titles by id in a later hop.
--    LEFT JOIN on purpose: an edge whose prd the caller cannot read still
--    yields its row with a null title, which is what the old code did (the
--    surface falls back to the word "Spec"). An inner join would silently
--    drop the spec link instead of weakening it.
create or replace function public.mission_spec_titles(p_mission_ids uuid[])
returns table (mission_id uuid, prd_id uuid, title text)
language sql
stable
security invoker
set search_path = public
as $$
  select l.child_id as mission_id, l.parent_id as prd_id, p.title
  from public.artifact_lineage l
  left join public.prds p on p.id = l.parent_id
  where l.parent_kind = 'prd'
    and l.child_kind = 'mission'
    and l.child_id = any(p_mission_ids);
$$;

revoke all on function public.mission_spec_titles(uuid[]) from public;
grant execute on function public.mission_spec_titles(uuid[]) to authenticated, service_role;

-- 2. mission_routed_stations: the slug of the agent a mission is routed to.
--    A `proposed` mission has no runs, so the strip falls back to where it
--    was addressed; the JS learned current_agent_id from the missions read
--    and then spent a hop turning it into a slug. Six missions on production
--    point at an agent row that no longer exists, which is why this is a
--    LEFT JOIN and returns a null slug rather than dropping the mission: the
--    caller's own fallback (position zero for a proposed mission) then
--    applies, exactly as it does today when the agents read comes back empty.
create or replace function public.mission_routed_stations(p_mission_ids uuid[])
returns table (mission_id uuid, agent_slug text)
language sql
stable
security invoker
set search_path = public
as $$
  select m.id as mission_id, a.slug as agent_slug
  from public.missions m
  left join public.agents a on a.id = m.current_agent_id
  where m.id = any(p_mission_ids)
    and m.current_agent_id is not null;
$$;

revoke all on function public.mission_routed_stations(uuid[]) from public;
grant execute on function public.mission_routed_stations(uuid[]) to authenticated, service_role;

-- 3. run_trace_costs: what a run cost, whichever place its trace was written.
--    agent_runs.trace_id is newer than the runs that predate August, whose
--    trace exists only on their latest checkpoint's state JSON, so the JS
--    read the checkpoints for the runs without one (hop two) and then summed
--    ai_events by trace (hop three). Both are this coalesce and this sum.
--
--    The checkpoint's traceId is text and ai_events.trace_id is a uuid, so
--    the shape is checked before the cast: a malformed value yields no trace
--    and therefore no cost, which is what string-comparing it in JavaScript
--    did. Casting it blind would throw and take the whole page's strip down.
--
--    Cost is summed per RUN, not per trace, so two runs sharing a trace each
--    report that trace's spend. That is what the caller computed and this
--    function must not quietly change it: the strip's per-mission figure is
--    the sum over its runs.
create or replace function public.run_trace_costs(p_run_ids uuid[])
returns table (run_id uuid, trace_id uuid, cost_usd double precision)
language sql
stable
security invoker
set search_path = public
as $$
  with wanted as (
    select r.id, r.trace_id
    from public.agent_runs r
    where r.id = any(p_run_ids)
  ),
  from_checkpoint as (
    select distinct on (c.run_id)
      c.run_id,
      case
        when c.state ->> 'traceId' ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then (c.state ->> 'traceId')::uuid
      end as trace_id
    from public.agent_run_checkpoints c
    where c.run_id in (select id from wanted where trace_id is null)
    order by c.run_id, c.step_index desc
  ),
  resolved as (
    select w.id as run_id, coalesce(w.trace_id, f.trace_id) as trace_id
    from wanted w
    left join from_checkpoint f on f.run_id = w.id
  )
  select
    resolved.run_id,
    resolved.trace_id,
    coalesce(sum(e.est_cost_usd), 0)::double precision as cost_usd
  from resolved
  left join public.ai_events e on e.trace_id = resolved.trace_id
  where resolved.trace_id is not null
  group by resolved.run_id, resolved.trace_id;
$$;

revoke all on function public.run_trace_costs(uuid[]) from public;
grant execute on function public.run_trace_costs(uuid[]) to authenticated, service_role;
