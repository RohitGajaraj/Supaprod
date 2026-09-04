-- P-120: `artifact_lineage.workspace_id` is NOT NULL with a default of
-- `current_user_default_workspace()`, which resolves to NULL outside an
-- authenticated request (the autonomous driver and the tool registry both
-- write through a service-role/background context, where there is no
-- `auth.uid()` for that function to read). Every `recordLineage` call from
-- those two paths that omitted `workspace_id` therefore hit the column's own
-- NOT NULL constraint and was refused -- 53 refusals across two edge kinds
-- (`prd->mission:dispatched`, `prd->prd:revised`) in the 7 days before this
-- migration, confirmed live via `error_events` (surface
-- 'lineage.recordLineage'). The code fix (this same packet, application
-- code) makes both callers pass `workspace_id` explicitly; this migration
-- repairs the edges already lost.
--
-- `error_events.error_message`/`extras` carry no parent_id/child_id -- a
-- Postgres NOT NULL violation names the column, not the row -- so the 53
-- refused writes cannot be replayed literally. Every edge below is instead
-- RE-DERIVED from tables that still hold the fact the edge would have
-- recorded, exactly as the packet's own Scope asks ("re-derived from their
-- specs and missions where both still exist"):
--
--   prd->mission:dispatched  a track's newest non-superseded 'prd' member and
--                            newest non-superseded 'mission' member
--                            (spine_track_members) name the pair
--                            `recordLineage` would have linked in
--                            driver.server.ts.
--   prd->prd:revised         a prd carrying `snapshot_before` genuinely was
--                            revised at least once (prd.revise's own write,
--                            registry.server.ts); its edge's parent follows
--                            the exact same rule the live code uses --
--                            opportunity when the prd has one, else the prd
--                            itself.
--
-- Verified live before writing this migration (query_database,
-- 371dd588-1b70-4629-9bb5-9f003f3af373): 11 missing dispatched edges, 10
-- missing revised edges, 21 total, several prds appearing in both (the same
-- active work hit both refusal paths during the incident window) -- which is
-- also why 53 refusal EVENTS collapse to far fewer distinct missing EDGES:
-- driver.server.ts retries the same unlinked mission on every Build tick
-- until it succeeds (its own header: "the reuse path re-runs on every Build
-- tick"), so one gap produced many refusals.
--
-- ON CONFLICT DO NOTHING against the table's own unique index
-- (user_id,parent_kind,parent_id,child_kind,child_id,relation) makes this
-- migration safe to re-run and safe to run after the code fix has already
-- repaired some of these on its own.

INSERT INTO public.artifact_lineage
  (user_id, workspace_id, parent_kind, parent_id, child_kind, child_id, relation, rationale)
SELECT
  t.user_id,
  t.workspace_id,
  'prd',
  p.prd_id,
  'mission',
  m.mission_id,
  'dispatched',
  'Backfilled by P-120 (20260909090200): the original write was refused for a NULL workspace_id before the driver.server.ts fix landed.'
FROM public.spine_tracks t
JOIN (
  SELECT DISTINCT ON (track_id) track_id, artifact_id AS prd_id, created_at
  FROM public.spine_track_members
  WHERE artifact_kind = 'prd' AND superseded_at IS NULL
  ORDER BY track_id, created_at DESC
) p ON p.track_id = t.id
JOIN (
  SELECT DISTINCT ON (track_id) track_id, artifact_id AS mission_id, created_at
  FROM public.spine_track_members
  WHERE artifact_kind = 'mission' AND superseded_at IS NULL
  ORDER BY track_id, created_at DESC
) m ON m.track_id = t.id
WHERE NOT EXISTS (
  SELECT 1 FROM public.artifact_lineage al
  WHERE al.parent_kind = 'prd' AND al.parent_id = p.prd_id
    AND al.child_kind = 'mission' AND al.child_id = m.mission_id
    AND al.relation = 'dispatched'
)
ON CONFLICT (user_id, parent_kind, parent_id, child_kind, child_id, relation) DO NOTHING;

INSERT INTO public.artifact_lineage
  (user_id, workspace_id, parent_kind, parent_id, child_kind, child_id, relation, rationale)
SELECT
  prds.user_id,
  prds.workspace_id,
  CASE WHEN prds.opportunity_id IS NOT NULL THEN 'opportunity' ELSE 'prd' END,
  COALESCE(prds.opportunity_id, prds.id),
  'prd',
  prds.id,
  'revised',
  'Backfilled by P-120 (20260909090200): the original write was refused for a NULL workspace_id before the registry.server.ts fix landed.'
FROM public.prds
WHERE prds.snapshot_before IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.artifact_lineage al
    WHERE al.relation = 'revised'
      AND al.child_kind = 'prd' AND al.child_id = prds.id
      AND al.parent_kind = CASE WHEN prds.opportunity_id IS NOT NULL THEN 'opportunity' ELSE 'prd' END
      AND al.parent_id = COALESCE(prds.opportunity_id, prds.id)
  )
ON CONFLICT (user_id, parent_kind, parent_id, child_kind, child_id, relation) DO NOTHING;
