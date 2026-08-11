-- Reserve the `track-record` slug, added with the /track-record route (2026-08-11).
--
-- WHY THIS EXISTS AS ITS OWN MIGRATION. The workspace slug is the first segment
-- of /$workspaceSlug/$productSlug, so every route name shares a namespace with
-- every workspace name, and `reserved_workspace_slugs` is what stops a workspace
-- from being named after a route and shadowing it. src/lib/reserved-workspace-slugs.test.ts
-- reads the generated route tree and these migrations and fails the moment a
-- route's first segment is not reserved. It caught this one on the first run
-- after the route was added, which is exactly the job it was written for: a
-- workspace called "track-record" would otherwise make /track-record silently
-- unreachable for that account, with no error anywhere.
--
-- `trust-ledger` was reserved in 20260725200000 and stays reserved. That route
-- is still live as a compatibility stub, and a reserved name should outlive the
-- surface that earned it anyway: releasing it back into the namespace would let
-- a workspace claim a URL that external links still point at.

INSERT INTO public.reserved_workspace_slugs (slug, reason) VALUES
  ('track-record','route')
ON CONFLICT (slug) DO NOTHING;
