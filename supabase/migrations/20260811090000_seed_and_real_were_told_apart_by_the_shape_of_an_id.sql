-- 20260811090000_seed_and_real_were_told_apart_by_the_shape_of_an_id.sql
--
-- Audit finding #29. Applied 2026-08-11.
--
-- SEED AND REAL WERE TOLD APART BY THE SHAPE OF AN ID, AND THE SHAPE WAS WRONG
-- IN BOTH DIRECTIONS.
--
-- WHAT WAS BROKEN. Every census of `artifact_lineage` splits demo from real by
-- testing the WORKSPACE id, `workspace_id::text like
-- '_0000000-0000-4000-8000-000000000000'`. The live copies of that test are
-- `DEMO_WORKSPACE_ID_PATTERN` (src/lib/rework.ts:89, used at rework.ts:425 and
-- rework.ts:564), `SEEDED_CLONE_IDS` (src/lib/proof-surface.functions.ts:136,
-- the exclusion applied to this very table at proof-surface.functions.ts:171),
-- and the prose every later reader trusted at src/lib/discovery.functions.ts:630
-- and docs/planning/launch-audit/station-chain-audit.md:149.
--
-- It asks the workspace a question only the row can answer. Measured against
-- production on 2026-08-11, across all 926 rows, it is wrong twice:
--
--   * 95 rows it calls SEED are product writes. `60000000-...` is a live
--     workspace, not just a demo id: 45 of the 95 are its own, and 36 of those
--     are shapes no seed ever wrote -- 18 `design_memory -> prd_scaffold /
--     grounded-in`, 7 `theme -> opportunity`, 6 `prd -> design_memory /
--     taught`, 3 `signal -> opportunity`, 1 `opportunity -> decision /
--     decided`, 1 `opportunity -> prd`. The other 59 are `signal -> theme`
--     edges written at runtime by `signals_write_theme_lineage`
--     (20260806193000) and by discovery.functions.ts, spread over four demo-id
--     workspaces (40000000: 41, 60000000: 9, 50000000: 7, 30000000: 2). Real
--     work, filed under "fiction".
--
--   * 80 rows it calls PRODUCTION are seed. `seed_sample_workspace()`
--     (20260705120000_sample_workspace_seed.sql) writes 20 lineage edges into a
--     workspace it creates with an ORDINARY random id -- see line 88,
--     `INSERT INTO workspaces (owner_id, name, slug) VALUES (_user_id, 'Explore
--     workspace', v_slug) RETURNING id INTO ws_id`. Four such workspaces exist
--     (`b90da531...`, `e375a61c...`, `482bdbb2...`, `11ea33b6...`), 20 seeded
--     edges each. THIS IS THE HALF THAT HID THE PRODUCT'S BIGGEST GAP FROM
--     EVERY PRIOR SWEEP: fabricated supersessions, citations and validations
--     were counted as evidence the loop had run for real.
--
--   And it cannot be fixed by widening the workspace test, because the seeded
--   workspaces are MIXED. `b90da531...` holds 20 seed edges AND 7 genuine
--   product edges (`prd -> mission / dispatched` from Studio, `opportunity ->
--   prd`, `prd -> prototype`, `theme -> opportunity`). Any workspace-level
--   verdict marks one group wrong. The verdict has to be per row.
--
-- WHAT THIS DOES. Adds `seeded boolean not null default false` and backfills
-- `true` for the rows the seed migrations actually wrote, by two predicates,
-- each derived from the migration that wrote them.
--
-- PREDICATE 1 -- the Helio Labs demo seed and its six clones. 280 rows.
--   20260725130000_helio_demo_seed_rich.sql lines 65-278 insert exactly 40
--   lineage rows, each with an explicit literal id in a reserved block. Its own
--   header states the scheme at line 47: "UUID BLOCKS ... 2a01 moat". The ids
--   run '10000000-2a01-4000-8000-000000000001' through '...-000000000040'
--   (ids 41+ in the same block belong to learning_citations, memory_recall_log
--   and ice_adjustments, not to this table).
--   20260725140000_clone_helio_to_investor_workspaces.sql copies them into six
--   more workspaces through `demo_remap_pk`, which swaps ONLY the leading eight
--   characters: "when left(p_id::text, 8) = '10000000' then (p_prefix ||
--   substring(p_id::text from 9))::uuid". So every clone keeps the
--   `-2a01-4000-8000-0000000000NN` tail, and matching on the tail catches the
--   source and all clones without hard-coding a prefix list that the next clone
--   would fall out of.
--
-- PREDICATE 2 -- `seed_sample_workspace()`. 80 rows.
--   That function writes its lineage with `gen_random_uuid()` ids and a random
--   workspace id, so nothing structural pins it. What DOES pin it is the
--   rationale prose: twenty hand-written literals, twelve at
--   20260705120000_sample_workspace_seed.sql lines 493-526 (Prism) and eight at
--   lines 857-878 (Trellis), byte-identical in the earlier revisions of the same
--   function (20260705052457 line 440ff, 20260705063047 line 448ff), and
--   verified against production: each of the twenty appears exactly four times,
--   once per seeded workspace, and nowhere else. The product's own writers use
--   short machine strings ('Promoted from theme', 'Generated PRD from
--   opportunity', 'Sent to Studio') or NULL, so there is no collision surface.
--   Matching on prose is ugly. It is also the only thing the seed left behind,
--   and an ugly true test beats a tidy wrong one -- which is the whole finding.
--
-- WHY A COLUMN AND NOT A SMARTER ID PATTERN. A cleverer regex would still be a
-- guess about provenance encoded in an identifier, which is the defect, not the
-- fix. Three concrete reasons it cannot be made to work:
--   1. Identity is not provenance. `seed_sample_workspace()` runs at SIGNUP, for
--      real users, into workspaces the product allocates the same way it
--      allocates every other one. There is no id shape to find, because the seed
--      deliberately looks like a real workspace -- that is its job.
--   2. A pattern is re-derived at every call site and drifts. The test is
--      already spelled four different ways across src/ and docs/, and each copy
--      has to be right on its own. A column is written once, at the moment the
--      fact is known, and read the same everywhere after.
--   3. A pattern cannot record what a future writer knows. From here, a seed
--      path sets `seeded = true` on INSERT and the fact never has to be
--      reconstructed again. Nothing about an id can do that.
--
-- WHY THE DEFAULT IS FALSE. A column defaulting true would silently reclassify
-- every future product write as fiction the day a writer forgot to set it. The
-- failure mode of `false` is that a new seed path is under-counted and shows up
-- as suspicious real data; the failure mode of `true` is that the product's own
-- record is quietly erased. Only one of those gets noticed.
--
-- WHAT THIS DOES NOT CLAIM. 446 rows carry the rationale 'Backfilled
-- 2026-08-03: signal was clustered into this theme but no edge was ever
-- written', from step 4 of 20260803190000_theme_frequency_is_derived.sql
-- (re-applied verbatim as 20260805134515). They are left `false` and that is a
-- deliberate abstention, not an oversight. They are a THIRD origin -- neither
-- seed nor product, but a one-time repair -- and it ran over every themed signal
-- in all 19 workspaces at once, so 139 of them sit over a seeded Helio signal
-- and 307 over a real one. Folding them into `seeded` would overstate the seed;
-- folding them into product overstates the loop. If the founder wants them
-- separated, the honest shape is a follow-up `origin text` column with three
-- values, or a second forward migration that first audits the Helio signal id
-- blocks (`0004` and `2c01`) the way this one audits `2a01`. Guessing here is
-- what #29 exists to stop.
--
-- SAFETY. `add column ... not null default false` on 926 rows is a catalog-only
-- change in Postgres 11+ (non-volatile default, no table rewrite, no long lock).
-- Both updates are guarded on `seeded is distinct from true`, so a re-run
-- touches nothing. Neither statement writes `created_at`, so
-- `trg_artifact_lineage_created_at_immutable` (20260810160221) passes for any
-- caller, service_role or not. No row is deleted and no existing column is
-- rewritten. No index is added: at 926 rows every reader already scans, and an
-- index chosen without a measured plan is a guess of the same family as the one
-- being removed.
--
-- TO REVERSE: `alter table public.artifact_lineage drop column if exists
-- seeded;` -- one statement, and it takes the backfill with it because the
-- backfill lives nowhere else. If the column must stay but the classification
-- is wrong, `update public.artifact_lineage set seeded = false;` returns the
-- table to its pre-backfill state; nothing here reads `seeded` back into
-- another column, so there is no second thing to undo.


alter table public.artifact_lineage
  add column if not exists seeded boolean not null default false;

comment on column public.artifact_lineage.seeded is
  'True when this edge was written by a seed migration rather than by the product. Set at write time by any seed path; never inferred from the workspace id, which is wrong in both directions (see 20260811090000). Default false so a forgotten seed path under-counts itself rather than erasing a real write. Rows from the one-time 2026-08-03 signal->theme repair backfill are deliberately false: they are a third origin this boolean cannot express.';


-- ---------------------------------------------------------------------------
-- Backfill 1: the Helio Labs demo seed (20260725130000, 40 rows) and the six
-- clones made by 20260725140000, which preserve the id tail verbatim.
-- ---------------------------------------------------------------------------
update public.artifact_lineage
   set seeded = true
 where seeded is distinct from true
   and substring(id::text from 10 for 4) = '2a01'
   and substring(id::text from 15 for 4) = '4000'
   and substring(id::text from 20 for 4) = '8000'
   and right(id::text, 12) between '000000000001' and '000000000040';


-- ---------------------------------------------------------------------------
-- Backfill 2: seed_sample_workspace(). The twenty rationale literals, quoted
-- exactly as they appear at 20260705120000_sample_workspace_seed.sql lines
-- 493-526 (Prism, twelve edges) and 857-878 (Trellis, eight edges).
-- ---------------------------------------------------------------------------
update public.artifact_lineage
   set seeded = true
 where seeded is distinct from true
   and rationale = any (array[
     -- Prism, lines 493-526
     'Precision fraud scoring supersedes the aggressive launch policy. The launch decision was right for a young brand but its outcome (4.1% false positives, top churn driver) invalidated it. The new policy preserves the catch rate while restoring trust.',
     'The fraud-miss learning is derived from running the launch policy: its outcome surfaced the false-positive churn that motivated the supersession.',
     'The precision-scoring decision explicitly cites the fraud-miss learning: 4.1% false positives and the two-declines-then-churn pattern are the evidence.',
     'The validated beta learning confirms the precision-scoring decision: false positives fell to 0.8% with the catch rate held at 96%.',
     'The kill decision refutes the crypto parity hypothesis. The Critic matched the workspace pattern of parity bets failing to retain the ICP before any code was written.',
     'The post-decision learning confirms the kill: crypto-curious churn stayed flat, so the parity bet would have returned nothing.',
     'The bank-link opportunity was promoted to a committed decision at Q3 planning as the highest-ICE activation bet.',
     'Bank-link completion rose 62% to 84% in the beta, validating the resilient-link decision.',
     'The round-up savings opportunity was promoted to a shipped decision as a direct north-star lever.',
     'Funded-goal rate rose 16pts in the pilot, validating the round-up decision.',
     'The pricing decision tests the value-first paywall hypothesis: timing, not price, is the conversion lever.',
     'The mixed paywall learning is derived from the first timing test: the timing helped (9% to 12%) but the value copy is the remaining lever.',
     -- Trellis, lines 857-878
     'The natural-language question box supersedes the SQL-first path. SQL-first was right for early analyst design partners but its outcome (trial-to-paid flat at 11% because non-analysts never reached an answer) invalidated it as the primary path.',
     'The SQL-mixed learning is derived from running the SQL-first decision: strong for analysts, flat overall, which motivated the NLQ supersession.',
     'The NLQ decision cites the SQL-mixed learning: the reach gap for non-analysts is the evidence that the primary path had to change.',
     'The validated NLQ learning confirms the supersession: trial-to-paid 11% to 19%, first-insight under 12 minutes, analysts kept the SQL escape hatch.',
     'The guided first-question opportunity was promoted to a committed decision as the top self-serve conversion lever.',
     'Guided first-question pulled time-to-first-insight to 9 minutes, validating the decision.',
     'The kill decision refutes the reverse-ETL parity hypothesis, matching the workspace parity precedent set on the other product.',
     'Shipping SSO/audit unblocked $260k ARR and halved security-review time, validating the sequence-SSO-first decision.'
   ]);


-- ---------------------------------------------------------------------------
-- Report, not a guard. On production as measured 2026-08-11 this prints
-- 1121 total / 360 seeded / 446 repair-backfill / 195 mission backfill / 120
-- product. The mission count is the 20260811060000 repair, which is a THIRD
-- origin like the 2026-08-03 one and is excluded from the product figure for the
-- same reason: a repair is neither seed nor a thing the loop did. It RAISES NOTICE
-- rather than EXCEPTION on purpose: a fresh database has zero rows and a
-- restored one has its own counts, and a migration that refuses to apply
-- because the data is not the data one person saw once is a migration that
-- blocks the next environment for no reason. The numbers are here so a mismatch
-- is visible in the apply log, which is what the reader actually needs.
-- ---------------------------------------------------------------------------
do $$
declare
  v_total    bigint;
  v_seeded   bigint;
  v_backfill bigint;
  v_product  bigint;
begin
  select count(*),
         count(*) filter (where seeded),
         count(*) filter (where not seeded
                            and coalesce(rationale, '') like 'Backfilled 2026-08-03:%'),
         count(*) filter (where not seeded
                            and coalesce(rationale, '') not like 'Backfilled 2026-08-03:%'
                            and coalesce(created_by_agent, '') <> 'backfill')
    into v_total, v_seeded, v_backfill, v_product
    from public.artifact_lineage;

  raise notice 'artifact_lineage: % rows · % seeded · % from the 2026-08-03 repair backfill (deliberately not seeded) · % product-written',
    v_total, v_seeded, v_backfill, v_product;
end $$;
