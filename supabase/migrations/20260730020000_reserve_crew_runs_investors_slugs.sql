-- Reserve the three root segments that shipped without a reservation.
--
-- src/lib/reserved-workspace-slugs.test.ts derives the live namespace from the
-- generated route tree and fails the moment a surface lands without reserving
-- its first URL segment. It was failing on 'crew', 'investors' and 'runs':
--
--   /crew              src/routes/_authenticated.crew.tsx        (2026-07-29)
--   /runs, /runs/$id   src/routes/_authenticated.runs.*.tsx      (2026-07-29)
--   /investors         src/routes/investors.tsx                  (2026-07-25)
--
-- The workspace slug is the FIRST segment of /$workspaceSlug/$productSlug, so a
-- workspace slugged "runs" would still exist, still hold data, and simply be
-- unreachable, with no error anywhere: the static route always outscores the
-- dynamic one. Reserving them is additive and cannot break an existing URL.
--
-- Any workspace that already holds one of these names keeps it (the trigger
-- only checks the reserved list on INSERT or on a deliberate slug change), so
-- this is safe to apply to a live database.
INSERT INTO public.reserved_workspace_slugs (slug, reason) VALUES
  ('crew','route'),('investors','route'),('runs','route')
ON CONFLICT (slug) DO NOTHING;
