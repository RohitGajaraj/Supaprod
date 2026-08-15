-- 20260814100000_reserve_meridian_slug.sql
INSERT INTO public.reserved_workspace_slugs (slug, reason) VALUES
  ('meridian','route')
ON CONFLICT (slug) DO NOTHING;