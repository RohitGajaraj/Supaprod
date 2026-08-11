-- The graph could not say which mission produced the call.
--
-- `decisions.mission_id` has always carried the answer and `artifact_lineage`
-- never held the edge. Measured 2026-08-11 against production: 195 decisions
-- carry a mission_id and ZERO have a `mission -> decision` row. The largest
-- single producer is the trigger door (routes/api/public/hooks/trigger-tick.ts),
-- which wrote the decision and stamped nothing; the guard that exists to catch
-- exactly that held a hardcoded list of four caller files and this route was not
-- among them, so it was green over the biggest gap it was written to find.
--
-- The writer is fixed in the same cycle, and a writer is FORWARD-ONLY. Without
-- this, every decision already on disk stays unattributable for ever and the
-- station chain keeps under-measuring Decide's real inbound.
--
-- WHY THIS IS A FAITHFUL PROJECTION AND NOT INVENTED EVIDENCE, which matters
-- because the same cycle DECLINED to backfill the learning hop. There the
-- relationship itself existed only in seeded narrative rows, so writing edges
-- would have manufactured proof of the product's central claim out of demo data.
-- Here the parent is a column on the child row: `decisions.mission_id` was
-- written by whoever created the decision, and this only moves a fact the
-- database already holds into the graph that should have held it. Nothing is
-- asserted that the row did not already say.
--
-- SEEDED ROWS ARE INCLUDED, deliberately. 90 of the 195 belong to the Helio
-- demo workspaces, and excluding them would leave the demo graph unable to draw
-- a hop the product writes on every real mission -- a demo that shows LESS than
-- the product is the mirror of the defect where it shows more. When the `seeded`
-- column lands on artifact_lineage these rows are classified by their workspace,
-- the same as every other seeded edge.
--
-- `relation = 'decided'` matches DECISION_ORIGIN_RELATION in
-- src/lib/lineage.functions.ts, so a backfilled edge is indistinguishable in
-- SHAPE from one the writer produces -- which is the point. `created_by_agent`
-- is 'backfill' rather than an agent slug, so it is distinguishable in ORIGIN:
-- no backfilled row may read as an agent write. That distinction is the same one
-- decision-gate.server.ts draws for auto-approvals.
--
-- Idempotent. The unique key on artifact_lineage is
-- (user_id, parent_kind, parent_id, child_kind, child_id, relation), so a second
-- run inserts nothing.
--
-- TO REVERSE: delete from public.artifact_lineage where parent_kind = 'mission'
-- and child_kind = 'decision' and created_by_agent = 'backfill'. No decision,
-- mission or stage event is touched by any of this.

insert into public.artifact_lineage (
  user_id,
  workspace_id,
  parent_kind,
  parent_id,
  child_kind,
  child_id,
  relation,
  rationale,
  created_by_agent
)
select
  d.user_id,
  d.workspace_id,
  'mission',
  d.mission_id,
  'decision',
  d.id,
  'decided',
  'The mission this call was filed against',
  'backfill'
from public.decisions d
join public.missions m on m.id = d.mission_id
where d.mission_id is not null
  and d.user_id is not null
on conflict (user_id, parent_kind, parent_id, child_kind, child_id, relation)
do nothing;
