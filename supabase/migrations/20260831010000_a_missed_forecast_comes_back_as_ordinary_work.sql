-- A MISSED FORECAST COMES BACK AS ORDINARY WORK — gap #4, the return edge.
--
-- ── WHY THIS COLUMN EXISTS AND WHY IT IS NOT A STRING MARKER ───────────────
-- Learn -> Discover is the edge that closes the loop, and it has processed
-- ZERO workspaces in its life (F-51). The playbook's Stage 6 turns a breach
-- into a NORMAL, REFUSABLE piece of work re-entering at Stage 1 -- not a
-- special object -- and that is the shape we adopt.
--
-- The edge must fire EXACTLY ONCE per missed forecast. The tick runs on a
-- schedule, so a check-then-insert races with itself and the failure mode is a
-- workspace filling with duplicate tracks for one miss. So the dedupe is the
-- DATABASE's job, not the tick's -- the same argument S0 gave S3 for
-- `track_hold_notices` on 2026-08-31, and the same reason a unique index beats
-- application logic at 144 passes a day: a unique index cannot race.
--
-- ── AND IT IS THE ACCEPTANCE PATH, WHICH IS NEW INFORMATION (F-164) ────────
-- Measured 2026-08-31: of 20 tracks ever driven, EIGHTEEN were pressed as their
-- first drive, the soonest 2.133 seconds after creation, because submitting the
-- composer at /start creates a track and presses it in the same breath. The
-- acceptance query excludes any track carrying a press, so every piece of work
-- born through the product's own front door is disqualified at birth.
--
-- A track created by THIS edge carries no press. So the return edge is not
-- merely Tier 0.4 -- it is the first path by which work can enter and complete
-- with nobody touching it, which is what R-18 actually asks.
ALTER TABLE public.spine_tracks
  ADD COLUMN IF NOT EXISTS from_learning_id uuid REFERENCES public.learnings(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.spine_tracks.from_learning_id IS
  'The missed forecast this track came back from (gap #4). NULL for work that entered any other way. Unique when set, so the return edge fires exactly once per miss.';
