-- Reserve the `meridian` slug, added with the /meridian design gallery (2026-08-14).
--
-- WHY THIS EXISTS AS ITS OWN MIGRATION. `reserved_workspace_slugs` is what stops
-- a workspace from being named after a route and shadowing it.
-- src/lib/reserved-workspace-slugs.test.ts reads the route tree and the
-- migrations and fails when a route's first segment is not reserved. It caught
-- this one within minutes of the surface landing, which is the second time that
-- guard has paid for itself.
--
-- Worth stating plainly, because /meridian is an internal workbench rather than
-- a customer surface and it is tempting to argue it does not need reserving:
-- it does. The router claims the path either way. A workspace called "meridian"
-- would find that path resolving to the gallery rather than to their workspace,
-- and the failure would be silent and account-specific, which is the worst
-- shape a routing collision can take.

INSERT INTO public.reserved_workspace_slugs (slug, reason) VALUES
  ('meridian','route')
ON CONFLICT (slug) DO NOTHING;
