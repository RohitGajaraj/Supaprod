-- Reserve the six email assets added to public/ on 2026-08-07.
--
-- src/lib/reserved-workspace-slugs.test.ts derives the namespace from public/ on
-- disk and failed on all six. A file at the root occupies the same first URL
-- segment as a workspace slug, so an unreserved name means a workspace could be
-- created, hold data, and be silently UNREACHABLE: the static route always
-- outscores the dynamic one, so the failure is invisible rather than an error.
--
--   mark-white.png / .svg          the mark on transparency, for the ember band
--   mark-graphite.png / .svg      its counterpart for light grounds
--   email-band-texture.png / .svg the tiled band texture
--
-- Why these exist at all: every other mark in public/ carries its own dark tile,
-- which on an orange band is a black square. Reasoning and the contrast
-- measurements: docs/growth/branding/email-design.md.
--
-- Additive, and a NEW migration rather than an edit to a historical one. Any
-- workspace already holding one of these names keeps it; the trigger consults
-- the list only on INSERT or a deliberate slug change.
INSERT INTO public.reserved_workspace_slugs (slug, reason) VALUES
  ('mark-white.png','static'),
  ('mark-white.svg','static'),
  ('mark-graphite.png','static'),
  ('mark-graphite.svg','static'),
  ('email-band-texture.png','static'),
  ('email-band-texture.svg','static')
ON CONFLICT (slug) DO NOTHING;
