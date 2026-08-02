-- Canonicalise artifact_lineage.relation for EXISTING rows.
--
-- ALREADY APPLIED to the live database on 2026-08-02 and verified there (404 edges
-- before, 404 after, zero duplicate tuples, zero underscored spellings remaining).
-- Recorded here so the repo matches the database and a fresh build reaches the same
-- state.
--
-- THE PRINCIPLE THIS COMPLETES (founder ruling 2026-08-02): fix it at the PLATFORM
-- level so every new user is correct by construction, AND backfill so existing users
-- get the same benefit. Not one or the other. The three parts:
--   1. the seed (20260725130000) now writes canonical vocabulary, so a fresh
--      database is never born with the fork;
--   2. the readers accept both voices (trust-ledger, proof-surface, critic,
--      decisions-share), so nothing depends on this migration having run;
--   3. this, which brings the rows already stored into line.
--
-- NO-OP ON A FRESH DATABASE. Every statement is guarded by a WHERE on the old
-- spellings, and the seed no longer writes them, so on a new build this matches
-- nothing. It is safe to re-run for the same reason.
--
-- WHY THE ENDPOINT FLIP IS SEPARATE AND MATTERS. The application writes the ACTIVE
-- voice (new -> old) and the demo seed wrote the PASSIVE voice (old -> new). Those
-- are the same fact stored from opposite ends, so renaming alone would have left
-- every passive row pointing at the wrong artifact: worse than the fork, because a
-- missing edge is visible and a reversed one is not. Postgres evaluates every SET
-- against the OLD tuple, so the four-way swap in one UPDATE is correct as written.

-- 1. Separator and voice-neutral renames. String only, endpoints already correct.
update public.artifact_lineage set relation = 'derived-from' where relation = 'derived_from';
update public.artifact_lineage set relation = 'promoted'     where relation = 'promotes';
update public.artifact_lineage set relation = 'grounded-in'  where relation = 'grounded_in';
update public.artifact_lineage set relation = 'cites'        where relation = 'references';

-- 2. informed_by is renamed WITHOUT flipping. It is the ONE `_by` spelling whose
--    PARENT is already the actor: every row runs learning -> decision or
--    opportunity -> decision, under the seed's own comment "the loop closes:
--    outcomes feed the next call". Handling it with the group below would have
--    reversed all 49 rows and inverted the demo's most important story.
update public.artifact_lineage set relation = 'informs' where relation = 'informed_by';

-- 3. The five passive spellings, where the CHILD is the actor: flip the endpoints
--    AND rename, so every row reads actor -> acted upon.
update public.artifact_lineage
   set parent_kind = child_kind, parent_id = child_id,
       child_kind  = parent_kind, child_id = parent_id,
       relation    = case relation
                       when 'superseded_by'   then 'supersedes'
                       when 'contradicted_by' then 'contradicts'
                       when 'validated_by'    then 'validates'
                       when 'measured_by'     then 'measures'
                       when 'killed_by'       then 'kills'
                     end
 where relation in ('superseded_by','contradicted_by','validated_by','measured_by','killed_by');

-- DELIBERATELY NOT ADDED: a CHECK constraint on relation.
--
-- It is the obvious next step and it would have broken production. An audit of every
-- relation string the code writes found THIRTY distinct values, including
-- `decomposed`, `documents`, `produced`, `supports`, `design_parity`, `test_verdict`
-- and `relates_to`. A CHECK carrying only the thirteen canonical families would have
-- started rejecting live inserts from features that have nothing to do with this
-- fork. Closing the door properly needs a pass over which of those thirty actually
-- reach artifact_lineage, and that is its own piece of work, not a footnote to this
-- one. Until then `RELATION_ALIASES` and the both-voice readers stay.
