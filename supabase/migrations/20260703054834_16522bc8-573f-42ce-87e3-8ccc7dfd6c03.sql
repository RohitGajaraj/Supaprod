create table if not exists public.house_rules (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid(),
  workspace_id        uuid not null default public.current_user_default_workspace()
                        references public.workspaces (id) on delete cascade,
  rule_text           text not null,
  rationale           text,
  status              text not null default 'pending' check (status in ('pending','approved','rejected')),
  source_learning_ids uuid[] not null default '{}',
  decided_by          uuid,
  decided_at          timestamptz,
  created_at          timestamptz not null default now()
);
create index if not exists house_rules_ws_status_idx on public.house_rules (workspace_id, status, created_at desc);
alter table public.house_rules enable row level security;
grant select, insert, update, delete on public.house_rules to authenticated;
grant all on public.house_rules to service_role;
drop policy if exists "house_rules ws read" on public.house_rules;
create policy "house_rules ws read" on public.house_rules for select using (public.is_workspace_member(workspace_id));
drop policy if exists "house_rules ws write" on public.house_rules;
create policy "house_rules ws write" on public.house_rules for all using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));

DO $$
DECLARE base_url text := 'https://project--371dd588-1b70-4629-9bb5-9f003f3af373.lovable.app';
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'house-rules-tick';
  PERFORM cron.schedule('house-rules-tick','0 10 * * 1',
    format($job$SELECT net.http_post(url:=%L,headers:=jsonb_build_object('Content-Type','application/json','x-cron-key',public.get_cron_hook_secret()),body:='{}'::jsonb) AS request_id;$job$,
    base_url || '/api/public/hooks/house-rules-tick'));
END $$;