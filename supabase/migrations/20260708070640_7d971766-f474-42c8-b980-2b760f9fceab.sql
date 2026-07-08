DROP POLICY IF EXISTS mcp_tokens_workspace_read ON public.mcp_tokens;

CREATE POLICY mcp_tokens_owner_or_admin_read ON public.mcp_tokens
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = mcp_tokens.workspace_id
        AND wm.user_id = auth.uid()
        AND wm.role IN ('owner', 'admin')
    )
  );