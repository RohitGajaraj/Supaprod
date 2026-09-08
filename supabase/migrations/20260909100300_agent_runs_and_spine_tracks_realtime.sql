-- Lane 3, 2026-09-08: the two tables the live-work pushes listen to join the
-- realtime publication, for real this time.
--
-- ── WHAT WAS FOUND ───────────────────────────────────────────────────────────
-- `useRunningNowPush` (agent_runs) and `useTrackActivityPush` (agent_runs by
-- track) were written on the strength of migration 20260618182608, which reads
-- `ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_runs`. Read on
-- production on 2026-09-08: `pg_publication_tables` for supabase_realtime holds
-- agent_approvals, decisions, memory_candidates, opportunities and themes, and
-- nothing else. The early publication rows did not survive whatever rebuilt the
-- database; P-83's per-table guard is what put its four in. So every socket on
-- agent_runs has been silent in production, and the strip and the transcript
-- moved on their polls alone, which is exactly what Lane 2 saw on the probe run.
--
-- ── WHAT THIS ADDS ───────────────────────────────────────────────────────────
-- agent_runs, so a seat's row reaches the shell, the home and the run screen
-- when it is written; spine_tracks, so a station finishing, a hold landing or a
-- deferral shows on the home's rows and the hero when the driver writes it
-- rather than up to ten seconds later (Lane 1's `useTrackChangePush`).
-- REPLICA IDENTITY FULL as P-83 set for its four, so an UPDATE carries the
-- columns the socket filters on. RLS on both tables scopes what a subscriber
-- receives, the same posture as the other five.
ALTER TABLE public.agent_runs REPLICA IDENTITY FULL;
ALTER TABLE public.spine_tracks REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'agent_runs'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_runs';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'spine_tracks'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.spine_tracks';
  END IF;
END $$;
