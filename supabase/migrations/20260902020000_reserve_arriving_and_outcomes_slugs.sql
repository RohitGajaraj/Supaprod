-- P-14a (2026-09-02): /discover -> /arriving and /brain -> /outcomes took
-- two new first segments without reserving them, which
-- reserved-workspace-slugs.test.ts caught the same day. /discover and
-- /brain themselves are presumed already reserved from when those routes
-- were first built; this only adds the two new names. Same insert shape as
-- 20260824200000.
insert into public.reserved_workspace_slugs (slug, reason)
values
  ('arriving', 'route'),
  ('outcomes', 'route')
on conflict (slug) do nothing;
