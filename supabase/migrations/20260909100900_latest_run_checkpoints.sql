-- The latest checkpoint of each run, slimmed to what a reader draws.
--
-- getMission (missions.functions.ts) read EVERY checkpoint of every run on a
-- mission with `state` in full (on the mission of track 2fdf93b6: 185 rows,
-- 8.8 MB of state) to keep the newest per run in JavaScript, and used three
-- fields of it: the trace id, the steps and the recalled memories. This is
-- the `distinct on` the database was built for, under the caller's own RLS.
create or replace function public.latest_run_checkpoints(p_run_ids uuid[])
returns table (
  run_id uuid,
  step_index integer,
  trace_id text,
  steps jsonb,
  recalled_memories jsonb
)
language sql
stable
security invoker
set search_path = public
as $$
  select distinct on (c.run_id)
    c.run_id,
    c.step_index,
    c.state ->> 'traceId' as trace_id,
    coalesce(c.state -> 'steps', '[]'::jsonb) as steps,
    coalesce(c.state -> 'recalledMemories', '[]'::jsonb) as recalled_memories
  from public.agent_run_checkpoints c
  where c.run_id = any(p_run_ids)
  order by c.run_id, c.step_index desc;
$$;

revoke all on function public.latest_run_checkpoints(uuid[]) from public;
grant execute on function public.latest_run_checkpoints(uuid[]) to authenticated;
