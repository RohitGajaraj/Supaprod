-- Reserve the `boundary` slug, added with the /boundary surface (2026-08-01).
--
-- WHY THIS EXISTS AS ITS OWN MIGRATION. `reserved_workspace_slugs` is what
-- stops a workspace from being named after a route and shadowing it. The repo
-- has a test (src/lib/reserved-workspace-slugs.test.ts) that reads the route
-- tree and the migrations and fails the build when a route's first segment is
-- not reserved, and it caught this one the moment the surface was added. That
-- guard did its job: without this row a workspace called "boundary" would make
-- /boundary unreachable for that account, which is the same
-- capability-with-no-door defect in a different costume.

INSERT INTO public.reserved_workspace_slugs (slug, reason) VALUES
  ('boundary','route')
ON CONFLICT (slug) DO NOTHING;
