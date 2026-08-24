-- The /track/$trackId surface (2026-08-24) took a first segment without
-- reserving it, which reserved-workspace-slugs.test.ts caught the same day.
-- Same insert shape as 20260725200000.
insert into public.reserved_workspace_slugs (slug, reason)
values ('track', 'route')
on conflict (slug) do nothing;
