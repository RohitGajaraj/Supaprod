-- SW-6 (mission 3.12, failure-detection floor): error_events, the in-house
-- always-on error store the founder can read.
--
-- WHY: every non-cron server error currently vanishes. The Sentry facade
-- (src/lib/observability/errors.ts) is dormant by design without a DSN plus
-- the observability gate, and console.error on Cloudflare Workers goes to an
-- ephemeral tail log nobody watches. Cron errors already persist via the
-- job_runs ledger (AFD-07); this table is the same pattern for everything
-- else: SSR 500s, server-function throws, API route failures.
--
-- Conventions mirror job_runs: service_role writes, admin-gated authenticated
-- reads via has_role(auth.uid(), 'admin').

create table if not exists public.error_events (
  id             bigint primary key generated always as identity,
  occurred_at    timestamptz not null default now(),
  -- ssr | worker | cron:<job> | server-fn:<name> | api:<path> | unknown
  surface        text not null default 'unknown',
  error_kind     text,
  error_message  text,
  stack          text,
  request_path   text,
  request_method text,
  -- Deliberately NO foreign keys: capture must never fail because the
  -- referenced user/workspace row was deleted mid-flight, and error history
  -- must survive workspace deletion (an error in the delete path is exactly
  -- the kind of thing the founder needs to see afterwards).
  user_id        uuid,
  workspace_id   uuid,
  deployment_id  text,
  extras         jsonb
);

grant all on public.error_events to service_role;
grant select on public.error_events to authenticated;

alter table public.error_events enable row level security;

drop policy if exists "error_events admin read" on public.error_events;
create policy "error_events admin read"
  on public.error_events for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- No insert/update/delete policies for authenticated: writes are service-role
-- only (the server facade), same posture as job_runs.

create index if not exists error_events_occurred_idx
  on public.error_events (occurred_at desc);
create index if not exists error_events_surface_occurred_idx
  on public.error_events (surface, occurred_at desc);

-- SW-6 uptime ping: schedule the uptime tick (every 5 minutes). The tick
-- fetches the app's own public health endpoint (full DNS/CDN/worker/DB path),
-- records the result in job_runs, writes error_events on degradation, and
-- sweeps error_events rows older than 30 days. Same pg_cron + pg_net pattern
-- as resume-runs.
DO $$
DECLARE base_url text := 'https://project--371dd588-1b70-4629-9bb5-9f003f3af373.lovable.app';
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'uptime-tick';
  PERFORM cron.schedule('uptime-tick','*/5 * * * *',
    format($job$SELECT net.http_post(url:=%L,headers:=jsonb_build_object('Content-Type','application/json','x-cron-key',public.get_cron_hook_secret()),body:='{}'::jsonb) AS request_id;$job$, base_url || '/api/public/hooks/uptime-tick'));
END $$;
