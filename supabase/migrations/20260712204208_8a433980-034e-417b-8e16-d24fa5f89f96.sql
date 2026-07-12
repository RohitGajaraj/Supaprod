alter table public.self_improve_proposals add column if not exists applied_at timestamptz;
alter table public.self_improve_proposals add column if not exists applied_house_rule_id uuid;