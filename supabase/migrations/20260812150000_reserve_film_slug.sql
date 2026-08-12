-- Reserve the `film` slug, added with the /film route and public/film/ (2026-08-12).
--
-- WHY THIS EXISTS AS ITS OWN MIGRATION. The workspace slug is the first segment
-- of /$workspaceSlug/$productSlug, so every route name AND every entry in
-- public/ shares a namespace with every workspace name.
-- src/lib/reserved-workspace-slugs.test.ts reads the generated route tree and
-- the contents of public/ and fails the moment either names something these
-- migrations have not reserved. It caught this on the first run after the film
-- embed landed, and it caught it TWICE over, which is the interesting part:
-- `film` entered the namespace from two directions at once.
--
--   1. the /film route      -> "every route's first segment is reserved"
--   2. public/film/         -> "every file served at the root is reserved"
--
-- Either one alone is enough to break a workspace named "film": it would be
-- created happily, hold real data, and simply never resolve, with no error
-- raised anywhere for anyone. TanStack Router scores a static first segment
-- above a dynamic one, so the route always wins and the workspace always loses.
--
-- One row closes both, because both tests read the same reserved set.

INSERT INTO public.reserved_workspace_slugs (slug, reason) VALUES
  ('film','route')
ON CONFLICT (slug) DO NOTHING;
