-- Reserve the seven files in public/ that shipped today without a reservation.
--
-- src/lib/reserved-workspace-slugs.test.ts derives the live namespace from the
-- generated route tree AND from public/ on disk, and fails the moment a surface
-- lands without reserving its name. It was failing on all seven of these,
-- every one added during the 2026-08-07 launch-readiness pass:
--
--   favicon-16.png         the icon set, added for the sub-pixel favicon fix
--   favicon-32.png                  "
--   favicon-adaptive.svg            "
--   icon-192.png                    "
--   icon-512.png                    "
--   site.webmanifest       PWA manifest, referenced from __root.tsx
--   llms-full.txt          the machine-readable corpus for AI search
--
-- WHY A FILENAME IS A SLUG AT ALL. The workspace slug is the FIRST segment of
-- /$workspaceSlug/$productSlug, and a file served out of public/ occupies that
-- same first segment. TanStack Router scores a static segment above a dynamic
-- one, so the existing URL can never break; the failure runs the other way. A
-- workspace slugged "llms-full.txt" would still be created, still hold data,
-- and simply be UNREACHABLE, with no error raised anywhere. Unlikely names, but
-- the guard is cheap and the failure it prevents is silent, which is the worst
-- kind to debug.
--
-- ADDITIVE, and a NEW migration rather than an edit to an old one. Editing a
-- historical migration leaves the fix inert against any database that already
-- ran it, which is exactly how ea899590 shipped a correction that never
-- applied. Any workspace already holding one of these names keeps it: the
-- trigger consults the reserved list only on INSERT or on a deliberate slug
-- change, so this is safe against a live database.
INSERT INTO public.reserved_workspace_slugs (slug, reason) VALUES
  ('favicon-16.png','static'),
  ('favicon-32.png','static'),
  ('favicon-adaptive.svg','static'),
  ('icon-192.png','static'),
  ('icon-512.png','static'),
  ('site.webmanifest','static'),
  ('llms-full.txt','static')
ON CONFLICT (slug) DO NOTHING;
