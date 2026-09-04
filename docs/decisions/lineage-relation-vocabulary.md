# Decision needed: collapse the `artifact_lineage.relation` vocabulary

> _Created: 2026-08-02 · Last updated: 2026-08-03_

> _Written 2026-08-02 by the knowledge-graph pass. **Proposal, not applied.** This is
> deliberately NOT in `supabase/migrations/` because part 2 rewrites `parent_id` and
> `child_id` on 105 production rows, and a file placed there would be applied by the next
> Lovable publish without anyone deciding to. It lands there when the founder says so._

## Nothing is broken while this sits here

The read layer normalises at read time and produces byte-identical output before and after
this migration. The graph renders correctly, the drift direction is correct, the legend counts
by meaning, and the outcome trails work, all against the un-migrated data. This is about
removing a permanent tax, not about fixing a live defect.

## The finding

`artifact_lineage.relation` is free text with no constraint. A live census on 2026-08-02
returned **sixteen distinct strings for about thirteen meanings**, because two writers
disagree on both spelling and voice. The underscore and passive forms come almost entirely
from `supabase/migrations/20260725130000_helio_demo_seed_rich.sql`; the hyphen and
active-voice forms come from application code. Neither is wrong alone. Together they fork the
vocabulary.

| Stored | Rows | Meaning | Writer |
| --- | --- | --- | --- |
| `promoted` | 141 | A gave rise to B | app + seed |
| `informed_by` | 49 | A informed B | seed |
| `validated_by` | 42 | B validated A | seed |
| `validates` | 32 | A validated B | app |
| `measured_by` | 28 | B measured A | seed |
| `superseded_by` | 21 | B replaced A | seed |
| `derived_from` | 14 | A gave rise to B | seed |
| `grounded-in` | 12 | A is grounded in B | app |
| `derived-from` | 12 | A gave rise to B | app |
| `promotes` | 12 | A gave rise to B | app |
| `contradicts` | 8 | A contradicts B | app |
| `supersedes` | 8 | A replaced B | app |
| `cites` | 8 | A cites B | app |
| `killed_by` | 7 | B killed A | seed |
| `contradicted_by` | 7 | B contradicts A | seed |
| `dispatched` | 3 | A dispatched B | app |

Three problems fall out:

1. **`derived_from` and `derived-from` are one relation stored two ways.** 14 rows fell
   through as an unknown string with no label and no legend entry.
2. **`X` and `X_by` are one relation written from opposite ends.** A reader assuming one
   direction is wrong about the other half, and one was: the canvas treated the child of a
   revision edge as the overturned belief, which is wrong for all 35 `superseded_by` /
   `contradicted_by` / `killed_by` rows. **That bug is already fixed in code (9d4a908b).**
3. **`informed_by` breaks the convention the other `_by` spellings follow.** In the other
   five the suffix describes the parent's relation to the child, so the child is the actor.
   In `informed_by` the parent is the actor: every row runs `learning -> decision` under the
   seed's own comment, "the loop closes: outcomes feed the next call". A generic suffix rule
   would reverse forty-nine edges. It is pinned as an explicit exception in code today.

## Why this is a founder decision and not a cleanup

Part 2 below **flips `parent` and `child` on 105 rows**. Three reasons it needs a person:

- It is not idempotent in the way the others are. Run once, inside the transaction.
- It rewrites what the record SAYS, and this repo's standing principle is that the record is
  evidence. Changing stored history is a different act from changing how it is read, even
  when the new reading is more correct.
- Four modules outside the graph walk these rows expecting the stored direction:
  `ai/contradiction-history.ts`, `trust-ledger.functions.ts`, `moat/loop-closure.ts`,
  `ai/governing-decision.ts`. They are correct today against the current data. They must be
  re-read against the flipped data before or with this, and that was outside the pass that
  found it.

## The migration, when approved

```sql
-- 1. Separator fork. Same meaning, same direction, one spelling. Rewrites the
--    string only, never the endpoints.
update public.artifact_lineage set relation = 'derived-from' where relation = 'derived_from';
update public.artifact_lineage set relation = 'promoted'     where relation = 'promotes';
update public.artifact_lineage set relation = 'grounded-in'  where relation = 'grounded_in';

-- 2. THE ONE TO REVIEW HARDEST. Collapse the voice fork by FLIPPING THE ENDPOINTS,
--    not by renaming, so every revision and outcome edge reads actor to acted-upon.
--    Postgres evaluates every SET against the OLD tuple, so the four-way swap in one
--    UPDATE is correct as written. Run once, in the transaction.
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

-- 3. informed_by is renamed WITHOUT flipping, because its parent is already the actor.
update public.artifact_lineage set relation = 'informs' where relation = 'informed_by';
update public.artifact_lineage set relation = 'cites'   where relation = 'references';

-- 4. Close the door. A CHECK rather than an enum, so adding a family later is one
--    migration and not a type rewrite. Note this is COUPLED to part 2: the passive
--    spellings are absent from the list, so applying 4 without 2 fails.
alter table public.artifact_lineage
  add constraint artifact_lineage_relation_check
  check (relation in (
    'promoted','derived-from','informs','cites','grounded-in','validates','measures',
    'dispatched','depends-on','relates-to','supersedes','contradicts','kills'
  ));
```

Verify before and after, expecting thirteen distinct relations, no underscores, and an
unchanged row total:

```sql
select relation, count(*) from public.artifact_lineage group by 1 order by 2 desc;
```

## What can be deleted afterwards, and what must not be

Deletable once applied: the inverse entries in `RELATION_ALIASES`
(`src/lib/knowledge-graph-view.ts`), the `informed-by` exception beside them, and the generic
`-by` fallback in `canonicalRelation`.

**`inverted` must stay on `GraphEdge` even then.** It costs one boolean, it is what makes a
wrong-direction bug impossible rather than merely absent, and the seed migration that created
the fork is still in the repo and still runs on every fresh database. The CHECK constraint is
the part that actually closes the door; until the seed is also corrected, a fresh database
would fail on it.

## Related, not blocking

Two kinds still reach the graph with no readable title, recorded in
`src/lib/artifact-tables.ts` under `UNMAPPED_LINEAGE_KINDS`. `deployment` (42 rows) has no
name column at all; its identity is environment plus commit, which the one-column title
contract cannot express, and labelling every one "production" distinguishes nothing.
`prd_scaffold` (12 rows) and `prd_flow` are identified by the spec they belong to, so their
title needs hydration to follow a foreign key. Both now carry a real label and colour on the
canvas, so they are no longer blank grey dots; they still have no title and no door.
