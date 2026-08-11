-- The demo walked a graph the product cannot write.
--
-- Prospects open the record and follow its edges. Three seeded hop types are
-- shapes no product path can produce, and two more carry a relation word
-- production never writes, so the demo and the real product could not agree on
-- an edge label for the same hop. Every row touched here is `seeded = true`;
-- verified before writing, no product row is in range.
--
-- The repo already has two cheap tests for striking a hop, applied in
-- `lineage.functions.ts` when `decision -> prd` was struck: could any COLUMN hold
-- it, and could any DOOR supply the parent. A hop failing both is not a gap to
-- fill, it is an assertion the schema cannot make.
--
-- STRUCK, 28 rows: learning -> deployment 'measures'. Fails both tests.
-- `learnings` carries no deployment reference and no door has a deployment id in
-- hand when a learning is written. It is also redundant: once the outbound
-- learning hop lands (20260811, `recordLearningPrecedents`) the same fact is
-- reachable as learning -> ... -> changeset -> deployment, and a direct edge
-- beside a transitive one is a second place for the graph to disagree with
-- itself.
--
-- STRUCK, 28 rows: learning -> prd 'validates'. Seeded BACKWARDS. The product
-- writes `prd -> learning 'settled-by'` (outcome.functions.ts) because
-- `learnings` carries `prd_id` and a prd carries no learning reference. Since
-- `getProvenance` walks parents only, the seeded direction shows a spec
-- descending from the learning it produced -- a cycle the real graph cannot
-- contain. NOT re-seeded in the correct direction: the product's own hop uses
-- the relation `settled-by`, and inserting `validates` on the same pair would
-- put two relation words on one edge, which is the label-divergence defect this
-- migration exists to end, in a new costume.
--
-- STRUCK, 21 rows: decision -> prd, 14 'promoted' and 7 'informs'. This exact
-- hop was struck in code at `lineage.functions.ts` on the same two tests, so the
-- seed asserts a hop the writer explicitly refuses. Not re-seeded: the seeded
-- decisions predate their specs in the narrative, so a `decided` edge would file
-- a receipt the story never had.
--
-- RELABELLED, 35 rows: mission -> changeset and changeset -> deployment both
-- seeded as 'promoted' where production writes 'produced'
-- (ai/tools/registry.server.ts) and 'deployed' (deployments.functions.ts). Two
-- vocabularies for one hop means a demo and a real workspace can never share an
-- edge label, and `knowledge-graph-view.ts` folds relations into FAMILIES for
-- its legend, so the same hop drew two different words on the same map.
--
-- WHY DELETE RATHER THAN FLIP. A demo showing MORE than the product can produce
-- and a demo showing LESS are not equally bad, but they are both bad, and the
-- fix for the first is not to manufacture the second. Every fact struck here is
-- either unreachable in the real product or already reachable another way.
--
-- TO REVERSE: re-run the seed migrations, which are idempotent on their fixed
-- ids. Nothing outside `artifact_lineage` is read or written.

delete from public.artifact_lineage
 where seeded is true
   and parent_kind = 'learning'
   and child_kind in ('deployment', 'prd');

delete from public.artifact_lineage
 where seeded is true
   and parent_kind = 'decision'
   and child_kind = 'prd';

update public.artifact_lineage
   set relation = 'produced'
 where seeded is true
   and parent_kind = 'mission'
   and child_kind = 'changeset'
   and relation = 'promoted';

update public.artifact_lineage
   set relation = 'deployed'
 where seeded is true
   and parent_kind = 'changeset'
   and child_kind = 'deployment'
   and relation = 'promoted';

do $$
declare
  v_left bigint;
begin
  select count(*) into v_left
    from public.artifact_lineage
   where (parent_kind = 'learning' and child_kind in ('deployment', 'prd'))
      or (parent_kind = 'decision' and child_kind = 'prd')
      or (parent_kind in ('mission', 'changeset') and relation = 'promoted');
  raise notice 'impossible or mislabelled seeded hops remaining: %', v_left;
end $$;
