-- PC-36 gap fix: approval gates reach the Ask panel by push, not polling.
-- agent_approvals joins the realtime publication so the panel can subscribe
-- to the signed-in user's gate changes and refetch instantly.
--
-- Security posture (the 20260611085122 agent_runs drop is the precedent to
-- honor): realtime postgres_changes enforces ROW LEVEL SECURITY per
-- subscriber, and agent_approvals RLS is strictly per-user
-- (auth.uid() = user_id). A subscriber can only ever receive their own rows.
-- NOTE: The actual RLS policy does NOT include workspace membership scoping
-- (is_workspace_member check), so a user could theoretically see their own
-- approvals from workspaces they're no longer members of IF the insert/update
-- logic created them. This is mitigated by application code that enforces
-- workspace membership at insert time, but a workspace-scoped broadcast channel
-- would be more robust as the original comment suggested.
-- The client additionally filters user_id=eq.<uid> at the channel level for
-- bandwidth, which provides defense in depth but is not sufficient alone.
--
-- REPLICA IDENTITY FULL so UPDATE events carry full rows and the channel
-- filter evaluates on updates, not just inserts.
ALTER TABLE public.agent_approvals REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'agent_approvals'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_approvals';
  END IF;
END $$;
