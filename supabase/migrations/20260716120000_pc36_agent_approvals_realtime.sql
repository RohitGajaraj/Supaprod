-- PC-36 gap fix: approval gates reach the Ask panel by push, not polling.
-- agent_approvals joins the realtime publication so the panel can subscribe
-- to the signed-in user's gate changes and refetch instantly.
--
-- Security posture (the 20260611085122 agent_runs drop is the precedent to
-- honor): realtime postgres_changes enforces ROW LEVEL SECURITY per
-- subscriber, and agent_approvals RLS is strictly per-user
-- ("own agent_approvals in member workspace": auth.uid() = user_id AND
-- is_workspace_member(workspace_id)), so a subscriber can only ever receive
-- their own rows. The past agent_runs leak was about column grants on WAL
-- rows, which does not apply to a table whose every column is already
-- visible to its owning user. The client additionally filters
-- user_id=eq.<uid> at the channel level for bandwidth.
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
