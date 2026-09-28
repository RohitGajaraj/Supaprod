DROP POLICY IF EXISTS reserved_workspace_slugs_readable ON public.reserved_workspace_slugs;
CREATE POLICY reserved_workspace_slugs_readable ON public.reserved_workspace_slugs
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
REVOKE SELECT ON public.reserved_workspace_slugs FROM anon;