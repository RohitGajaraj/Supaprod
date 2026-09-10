-- LANE 1 (2026-09-10): the four jargon routes were renamed so the address bar
-- reads as the person's own word for the surface --
--   /approvals -> /inbox, /arriving -> /evidence, /crew -> /team, /sync -> /sources.
--
-- The workspace slug is the FIRST segment of /$workspaceSlug/$productSlug, so
-- every new route name takes a name out of that namespace. `inbox` and `team`
-- were already reserved ('route' and 'held'); `evidence` and `sources` were
-- not, and a workspace slugged either one would still exist, still hold data,
-- and simply be unreachable with no error anywhere.
--
-- reserved-workspace-slugs.test.ts derives the live namespace from
-- routeTree.gen.ts and fails the build without this. Same insert shape as
-- 20260902020000, which did this for the /discover -> /arriving rename.
insert into public.reserved_workspace_slugs (slug, reason)
values
  ('evidence', 'route'),
  ('sources', 'route')
on conflict (slug) do nothing;
