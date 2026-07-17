alter table public.self_improve_proposals add column if not exists ai_explanation text;
alter table public.self_improve_proposals add column if not exists ai_suggested_fix text;
alter table public.self_improve_proposals add column if not exists ai_grounded_on integer;
alter table public.self_improve_proposals add column if not exists ai_enriched_at timestamptz;