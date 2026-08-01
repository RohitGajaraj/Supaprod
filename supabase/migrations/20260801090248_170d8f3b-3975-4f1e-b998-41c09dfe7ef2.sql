INSERT INTO public.reserved_workspace_slugs (slug, reason) VALUES
  ('boundary','route')
ON CONFLICT (slug) DO NOTHING;