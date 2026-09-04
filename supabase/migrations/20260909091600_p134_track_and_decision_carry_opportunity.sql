-- P-134 (A-QUEUE.md): a track started from a ranked bet carries no link back
-- to the opportunity it came from anywhere in its lineage -- not on the
-- track, not on its first decision. `startTrack` never wrote one because
-- neither column existed: `decisions.opportunity_id` was assumed present by
-- the packet's own "Why" and is not (checked against the live schema before
-- writing this). Both null, both optional: most tracks (the autonomous
-- Sense->Decide path with no opportunity row, every seed and every track
-- this product has run before today) legitimately carry neither.

alter table spine_tracks
  add column if not exists opportunity_id uuid references opportunities(id);

alter table decisions
  add column if not exists opportunity_id uuid references opportunities(id);
