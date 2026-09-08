-- The shell's mission marks, in one round trip.
--
-- useLiveAgents and the shell's mark stack mount on every authenticated
-- page and read listMissions: fifty missions with their goals, every step
-- and every run of each, and a cost. On the run screen of 2fdf93b6 that
-- call answered in 5,045 to 5,311 ms carrying 170,843 bytes (2026-09-09),
-- the largest handler in the product, and the two readers used eight
-- fields of it. This answers exactly those, under the caller's own RLS
-- (SECURITY INVOKER): the mission's own columns, the newest run's agent and
-- the newest run's track (missions carry no track column; the run is where
-- the link is written). Fifty rows in about 7 KB. listMissions stays for
-- the Build board and the Ask pane, which draw the steps and the cost.
drop function if exists public.mission_marks(uuid, integer);
create function public.mission_marks(p_workspace_id uuid, p_limit integer default 50)
returns table (
  id uuid,
  title text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  completed_at timestamptz,
  current_agent_id uuid,
  current_agent_slug text,
  track_id uuid
)
language sql
stable
security invoker
set search_path = public
as $$
  with m as (
    select id, title, status, created_at, updated_at, completed_at, current_agent_id
    from public.missions
    where workspace_id = p_workspace_id
    order by updated_at desc
    limit p_limit
  )
  select m.id, m.title, m.status, m.created_at, m.updated_at, m.completed_at, m.current_agent_id,
    (select r.agent_slug from public.agent_runs r
      where r.mission_id = m.id and r.agent_slug is not null
      order by r.created_at desc limit 1) as current_agent_slug,
    (select r.track_id from public.agent_runs r
      where r.mission_id = m.id and r.track_id is not null
      order by r.created_at desc limit 1) as track_id
  from m
  order by m.updated_at desc;
$$;

revoke all on function public.mission_marks(uuid, integer) from public;
grant execute on function public.mission_marks(uuid, integer) to authenticated;
