-- P-131 (A-QUEUE.md): a changeset created before Build wrote prd_id/product_id
-- at creation carries neither, so the release document reports "not linked to
-- a spec" for work that genuinely has one on record. Backfilled the same way
-- resolvePrdForMission (registry.server.ts) resolves it live: the oldest
-- artifact_lineage row naming a prd as this mission's parent. product_id
-- follows from that same resolved prd. Scoped to merged changesets only --
-- an open changeset's mission can still gain or lose its spec link before it
-- ships, and backfilling one mid-flight would assert a fact not yet true.

update studio_changesets cs
set prd_id = lineage.parent_id
from (
  select distinct on (child_id) child_id, parent_id
  from artifact_lineage
  where parent_kind = 'prd' and child_kind = 'mission'
  order by child_id, created_at asc
) lineage
where cs.mission_id = lineage.child_id
  and cs.prd_id is null
  and cs.status = 'merged';

update studio_changesets cs
set product_id = p.product_id
from prds p
where cs.prd_id = p.id
  and cs.product_id is null
  and p.product_id is not null
  and cs.status = 'merged';
