-- P-83: the approvals queue, Arriving and Start's three answers refetch on
-- the live channel already carrying agent_approvals, instead of asking a
-- person to refresh. Four more of the queue's federated (or Start/Arriving's
-- own) source tables join the realtime publication -- checked live
-- (pg_publication_tables), only agent_approvals was actually in it despite
-- older migrations naming agent_runs/messages/decisions; at least one of
-- those was since deliberately dropped (see agent_approvals' own migration's
-- "the 20260611085122 agent_runs drop is the precedent to honor"), so this
-- adds exactly what P-83 needs rather than trusting migration-file history:
-- memory_candidates (memory review), opportunities (a proposal family here
-- and Arriving's own read), themes (Arriving's "what the crew found" count
-- and Start's arrivingCount), and decisions (Start's learnedCount).
--
-- No workspace_id filter is set at the channel level -- same posture
-- trust_graduation_proposals' own read already documents ("RLS-wide...
-- across every workspace I'm a member of"): postgres_changes enforces RLS
-- per subscriber, so a client only ever receives rows it could already SELECT.
-- REPLICA IDENTITY FULL so an UPDATE event carries the columns RLS policies
-- need to evaluate, matching the agent_approvals precedent
-- (20260716120000_pc36_agent_approvals_realtime.sql).

ALTER TABLE public.memory_candidates REPLICA IDENTITY FULL;
ALTER TABLE public.opportunities REPLICA IDENTITY FULL;
ALTER TABLE public.themes REPLICA IDENTITY FULL;
ALTER TABLE public.decisions REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'memory_candidates'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.memory_candidates';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'opportunities'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.opportunities';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'themes'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.themes';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'decisions'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.decisions';
  END IF;
END $$;
