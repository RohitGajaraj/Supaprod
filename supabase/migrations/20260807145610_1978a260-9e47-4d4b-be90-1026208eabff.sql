INSERT INTO public.reserved_workspace_slugs (slug, reason) VALUES
  ('favicon-16.png','static'),
  ('favicon-32.png','static'),
  ('favicon-adaptive.svg','static'),
  ('icon-192.png','static'),
  ('icon-512.png','static'),
  ('site.webmanifest','static'),
  ('llms-full.txt','static')
ON CONFLICT (slug) DO NOTHING;