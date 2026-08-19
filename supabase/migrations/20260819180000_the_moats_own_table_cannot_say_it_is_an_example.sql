-- 20260819180000_the_moats_own_table_cannot_say_it_is_an_example.sql
--
-- Claude lane, 2026-08-19. Queried against production the same day; every count
-- below carries the query that produced it, in the comment above it.
--
-- THE MOAT'S OWN TABLE CANNOT SAY IT IS AN EXAMPLE, AND A RE-SEED IS THE MOMENT
-- THAT STOPS BEING FREE.
--
-- WHAT IS BROKEN. `is_sample` is the settled vocabulary for "this row is an
-- example, not something that happened." It exists on `workspaces`
-- (20260708160000), on `signals` and `opportunities` (20260805220000), on
-- `themes` (20260806060000) and on `prds` (20260806120000). It does not exist
-- on `learnings` or on `agent_memory`, which are the two tables layer 03 is
-- made of.
--
-- The product already knows this and works around it. src/lib/today.functions.ts
-- :955-963 says so in its own words -- "DERIVED, NOT STORED. `learnings` carries
-- no `is_sample` column, but every learning points at an opportunity and
-- `opportunities.is_sample` exists" -- and joins through the parent at :1002.
--
-- THAT WORKAROUND IS ALREADY FAILING, SILENTLY. The Helio seed hangs its
-- learnings off `prd_id` and `mission_id`, not `opportunity_id`
-- (20260718120000_helio_labs_demo_seed.sql:429). A learning with no
-- `opportunity_id` cannot be reached by that join at all, so every Helio-seeded
-- learning is invisible to every sample-labelling path in the product. It is not
-- labelled an example and it is not labelled real. It is simply unlabelled, and
-- it renders as fact.
--
--   select count(*) from learnings;                                   -- 133
--   select count(*) from learnings l join workspaces w
--     on w.id = l.workspace_id where w.is_sample;                     -- 117
--   select count(*) from learnings l where not exists
--     (select 1 from workspaces w where w.id = l.workspace_id);       --  16
--
-- 117 seeded, 16 orphaned, and ZERO in a workspace that is not a sample. The
-- moat's own table has never held a single real row.
--
-- `agent_memory` is the opposite case and the reason this migration does not
-- take a shortcut:
--
--   select w.is_sample, count(*) from agent_memory m
--     join workspaces w on w.id = m.workspace_id group by 1;
--     -- is_sample = true  -> 1143
--     -- is_sample = false ->   46
--
-- 46 of those rows are real. They must not be marked.
--
-- WHY A COLUMN AND NOT THE MARKER THAT ALREADY EXISTS. `agent_memory` has an
-- informal convention: the seeds write `metadata->>'seed'`
-- ('sample-workspace-v1' at 20260705120000_sample_workspace_seed.sql:531,
-- 'sample-mc-v2' at 20260720020000_sample_workspace_seed_v2.sql:67, `{seed:true}`
-- at src/lib/onboarding/seed-workspace.server.ts:110-133). Measured, it covers
-- almost nothing:
--
--   select count(*) filter (where metadata ? 'seed'), count(*)
--     from agent_memory m join workspaces w on w.id = m.workspace_id
--     where w.is_sample;                                     -- 53 of 1143
--
-- 53 of 1,143, which is 4.6%. The Helio seed sets no metadata marker at all
-- (20260718120000_...sql:442-457 inserts no `metadata` column), so the largest
-- seeder on the system is the one the convention misses entirely. This is the
-- same argument 20260805220000 made about reading a name prefix: "a convention
-- drifts... A boolean is a fact the row carries itself."
--
-- WHY NOW AND NOT AFTER THE RE-SEED. The clone engine reads its column list out
-- of `information_schema` at run time
-- (20260725140000_clone_helio_to_investor_workspaces.sql, `v_tables` at :110
-- includes both `learnings` and `agent_memory`), so a column that exists before
-- the clone runs is carried by the clone automatically and a column that does
-- not, is not.
--
-- That is the whole deadline. Today every learning is fiction, so nothing is
-- lost by not being able to tell fiction from fact. The moment a re-seed puts
-- rich seeded learnings alongside the first real one, the two are
-- indistinguishable forever, because no retroactive query can separate them --
-- and every future measurement of the thing this company calls its moat is then
-- measuring a mixture. 20260806193000 recorded the same shape of mistake from
-- the other side: "a re-seed today would produce a demo with LESS provenance
-- than the ones already in the database."
--
-- SHAPE AND SECURITY. Both columns are `not null default false`, matching the
-- five tables that already carry one. The backfill is derived from
-- `workspaces.is_sample`, which is itself write-protected by
-- `protect_workspace_is_sample()` (20260708160000_sample_workspace_label.sql
-- :31-48), so it cannot be flipped by a non-service-role update.
--
-- The 16 orphaned learnings are marked `true` as well. They belong to one user
-- and one workspace that no longer exists
-- (b13b3c2d-391b-4911-8954-4ecf539440e4, rows dated 2025-12-05 to 2026-06-05).
-- They cannot be joined to a workspace, so no derivation can ever reach them,
-- and since no real learning has ever been written, "example" is the truthful
-- label rather than a convenient one. The following migration removes them.
--
-- NO RLS CHANGE. Neither table's policies reference these columns, and adding a
-- column does not widen any existing policy.

-- ---------------------------------------------------------------------------
-- 1. learnings.is_sample
-- ---------------------------------------------------------------------------

alter table public.learnings
  add column if not exists is_sample boolean not null default false;

comment on column public.learnings.is_sample is
  'True when this learning is seeded example content rather than something that '
  'happened. Set by the seeds and by the clone engine. Read it directly; do NOT '
  'derive sample-ness by joining to opportunities.is_sample, because a learning '
  'that hangs off prd_id alone (every Helio-seeded row) has no opportunity to '
  'join to and silently reads as real.';

-- Every learning in a sample workspace is an example. 117 rows.
update public.learnings l
   set is_sample = true
  from public.workspaces w
 where w.id = l.workspace_id
   and w.is_sample
   and l.is_sample is distinct from true;

-- The 16 orphans, which no join can reach. Argued above.
update public.learnings l
   set is_sample = true
 where not exists (select 1 from public.workspaces w where w.id = l.workspace_id)
   and l.is_sample is distinct from true;

-- ---------------------------------------------------------------------------
-- 2. agent_memory.is_sample
-- ---------------------------------------------------------------------------

alter table public.agent_memory
  add column if not exists is_sample boolean not null default false;

comment on column public.agent_memory.is_sample is
  'True when this memory is seeded example content. Supersedes the informal '
  'metadata->>''seed'' marker, which covered 53 of 1143 seeded rows when measured '
  'on 2026-08-19 because the Helio seed sets no metadata at all.';

-- 1,143 rows. The 46 in non-sample workspaces are deliberately left false.
update public.agent_memory m
   set is_sample = true
  from public.workspaces w
 where w.id = m.workspace_id
   and w.is_sample
   and m.is_sample is distinct from true;

-- ---------------------------------------------------------------------------
-- 3. Indexes, for the readers that will filter on this
-- ---------------------------------------------------------------------------

-- Partial, because the interesting query is always "the real ones" and that is
-- the smaller set on learnings today and the larger set later. A partial index
-- on false stays useful in both regimes.
create index if not exists learnings_real_idx
  on public.learnings (workspace_id, created_at desc)
  where is_sample = false;

create index if not exists agent_memory_real_idx
  on public.agent_memory (workspace_id, created_at desc)
  where is_sample = false;

-- ---------------------------------------------------------------------------
-- 4. Assert what we just claimed, so a silent partial apply cannot pass
-- ---------------------------------------------------------------------------

do $$
declare
  n_learn_unmarked bigint;
  n_mem_real       bigint;
begin
  select count(*) into n_learn_unmarked from public.learnings where is_sample = false;
  if n_learn_unmarked <> 0 then
    raise exception
      'expected 0 unmarked learnings after backfill, found %. No real learning has '
      'ever been written; investigate before continuing.', n_learn_unmarked;
  end if;

  select count(*) into n_mem_real from public.agent_memory where is_sample = false;
  if n_mem_real = 0 then
    raise exception
      'expected the 46 real agent_memory rows to remain unmarked, found 0. The '
      'backfill over-reached.';
  end if;
end $$;
