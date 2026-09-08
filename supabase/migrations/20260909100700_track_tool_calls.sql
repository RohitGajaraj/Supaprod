-- The run screen's tool-call transcript, in one round trip.
--
-- getTrackToolCalls (track.functions.ts) read the track's runs, then the
-- 200 newest tool calls on their traces with `args` in full, then the
-- `result` column of every search call to count what it found: three
-- sequential Worker-to-PostgREST hops, and on track 2fdf93b6 (224 calls)
-- the 200 newest carried 90 KB of args and 150 KB of result, measured
-- 2026-09-08 (Lane 2: one handler at 5,145 ms and 170,843 bytes).
--
-- This answers the same question once, under the caller's own RLS
-- (SECURITY INVOKER, the same policies the three reads ran under):
--   runs / traced_runs   the counts the screen prints beside the calls
--   calls[]              newest first, capped at p_limit, each with
--     args               slimmed to the top-level keys `toolCallFacts`
--                        reads, string values cut at 240 characters (the
--                        reducer clips at 120), `changes` reduced to paths
--                        (the staged file bodies were the weight)
--     found              what a search call found, counted here from
--                        `result` the way `toolCallFacts` counts it (an
--                        array's length, else items/results/rows, else
--                        count/total); only for p_search_tools, and the
--                        result itself never leaves the database
--     run_id             the run whose trace the call belongs to, or null
-- The words a person reads are still made by `toolCallFacts` in TypeScript
-- from these inputs; nothing here decides what a call is called.
create or replace function public.tool_call_args_slim(p_args jsonb)
returns jsonb
language sql
immutable
as $$
  select case
    when p_args is null or jsonb_typeof(p_args) <> 'object' then '{}'::jsonb
    else coalesce((
      select jsonb_object_agg(k, v)
      from (
        select e.key as k,
          case
            when e.key = 'changes' and jsonb_typeof(e.value) = 'array' then (
              select coalesce(jsonb_agg(jsonb_build_object('path', c ->> 'path')), '[]'::jsonb)
              from jsonb_array_elements(e.value) c
              where jsonb_typeof(c) = 'object' and c ? 'path'
            )
            when jsonb_typeof(e.value) = 'array' then (
              select coalesce(jsonb_agg(
                case when jsonb_typeof(x) = 'string' then to_jsonb(left(x #>> '{}', 240)) else x end
              ), '[]'::jsonb)
              from (select x from jsonb_array_elements(e.value) x
                    where jsonb_typeof(x) in ('string', 'number', 'boolean') limit 50) s
            )
            when jsonb_typeof(e.value) = 'string' then to_jsonb(left(e.value #>> '{}', 240))
            when jsonb_typeof(e.value) in ('number', 'boolean', 'null') then e.value
            else null
          end as v
        from jsonb_each(p_args) e
        where e.key in (
          'paths', 'changes', 'tag', 'source_kind', 'sentiment', 'lookback_days', 'pr_number',
          'verdict', 'summary', 'task', 'to_agent_slug', 'status', 'priority',
          'query', 'searched', 'title', 'name', 'message', 'brief', 'instruction',
          'content', 'body', 'path', 'url', 'provider'
        )
      ) kv
      where v is not null
    ), '{}'::jsonb)
  end;
$$;

create or replace function public.tool_call_found(p_result jsonb)
returns integer
language sql
immutable
as $$
  select case
    when p_result is null then null
    when jsonb_typeof(p_result) = 'array' then jsonb_array_length(p_result)
    when jsonb_typeof(p_result) = 'object' then
      case
        when jsonb_typeof(p_result -> 'items') = 'array' then jsonb_array_length(p_result -> 'items')
        when jsonb_typeof(p_result -> 'results') = 'array' then jsonb_array_length(p_result -> 'results')
        when jsonb_typeof(p_result -> 'rows') = 'array' then jsonb_array_length(p_result -> 'rows')
        when jsonb_typeof(p_result -> 'count') = 'number' then (p_result ->> 'count')::integer
        when jsonb_typeof(p_result -> 'total') = 'number' then (p_result ->> 'total')::integer
        else null
      end
    else null
  end;
$$;

create or replace function public.track_tool_calls(
  p_track_id uuid,
  p_limit integer default 200,
  p_search_tools text[] default '{}'
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with runs as (
    select id, trace_id from public.agent_runs where track_id = p_track_id
  ),
  calls as (
    select c.id, c.tool_name, c.ok, c.latency_ms, c.created_at, c.error, c.trace_id, c.args, c.result
    from public.tool_calls c
    where c.trace_id in (select trace_id from runs where trace_id is not null)
    order by c.created_at desc
    limit p_limit
  )
  select jsonb_build_object(
    'runs', (select count(*) from runs),
    'traced_runs', (select count(*) from runs where trace_id is not null),
    'calls', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id,
        'tool_name', c.tool_name,
        'ok', c.ok,
        'latency_ms', c.latency_ms,
        'created_at', c.created_at,
        'error', c.error,
        'trace_id', c.trace_id,
        'run_id', (select r.id from runs r where r.trace_id = c.trace_id limit 1),
        'args', public.tool_call_args_slim(c.args),
        'found', case when c.tool_name = any(p_search_tools) then public.tool_call_found(c.result) else null end
      ) order by c.created_at desc)
      from calls c
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.track_tool_calls(uuid, integer, text[]) from public;
grant execute on function public.track_tool_calls(uuid, integer, text[]) to authenticated;
