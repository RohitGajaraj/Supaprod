-- PC-10: roadmap-item rewind (the third artifact type, on the REAL model).
--
-- A "roadmap" is not a table -- it is opportunities.roadmap_bucket (Now/Next/
-- Later) plus roadmap_outcome/roadmap_measure. A roadmap MOVE can now be made by
-- an AGENT (the roadmap.move tool) as well as a human (the drag board), so the
-- move is a first-class AI-modifiable action and one-key Rewind applies to it
-- exactly like PRDs and decisions.
--
-- roadmap_snapshot_before captures the prior placement ({bucket, outcome,
-- measure}) before a move, so revertRoadmapItemToPrevious can restore it; and
-- roadmap_last_agent_slug records the agent that made the last move (null when a
-- human moved it), so a rewind can be filed as a REJECTED judgment against that
-- agent on the Trust Ledger, mirroring the prd/decision revert receipts.

alter table public.opportunities
  add column if not exists roadmap_snapshot_before jsonb default null;

alter table public.opportunities
  add column if not exists roadmap_last_agent_slug text default null;

-- No RLS change: the existing "own opportunities all" owner-scoped policy already
-- governs these columns. They are set by the application (roadmap.move,
-- updateRoadmapItem/commitRoadmapItem, revertRoadmapItemToPrevious), never by a
-- trigger.
