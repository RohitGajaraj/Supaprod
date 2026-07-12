alter table public.house_rules
  add column if not exists source_run_ids uuid[] not null default '{}';