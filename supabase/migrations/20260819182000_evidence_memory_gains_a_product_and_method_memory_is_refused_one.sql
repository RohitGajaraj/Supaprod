-- 20260819182000_evidence_memory_gains_a_product_and_method_memory_is_refused_one.sql
--
-- Claude lane, 2026-08-19. Implements defect 1 of the founder ruling in
-- docs/planning/initiatives/agent-first-platform.md §2.3, made 2026-08-19.
--
-- EVIDENCE MEMORY GAINS A PRODUCT, AND METHOD MEMORY IS REFUSED ONE.
--
-- WHAT THE RULING SAYS, AND WHY THIS FILE IS NOT SIMPLY "ADD product_id".
-- §2.3 settled that the instinct to scope all memory to a product "is right
-- about the dominant harm and wrong if applied universally", and split the
-- table by `kind`:
--
--   evidence -- a measurement about product A, NOT true of product B  -> product
--   method   -- "check the window before blaming deliverability"      -> workspace
--
-- A leaked evidence memory does not make the director noisy, it makes it
-- WRONG, and for an agency running three clients out of one workspace it is a
-- confidentiality breach. A method memory re-learned per product kills the
-- compounding claim. So the two need opposite treatment and a single nullable
-- column applied uniformly would get one of them wrong.
--
-- WHAT PRODUCTION ACTUALLY HOLDS, 2026-08-19. The ruling's table was written
-- from a count taken earlier the same day; here it is again, with the sample
-- split the ruling did not carry:
--
--   select kind, count(*), count(*) filter (where not w.is_sample)
--     from agent_memory m join workspaces w on w.id = m.workspace_id group by 1;
--
--     kind        rows    of which real
--     reflection  1125    46
--     precedent     28     0
--     note          26     0
--     correction    10     0
--
-- TWO THINGS FALL OUT OF THAT AND BOTH MATTER.
--
-- First, the ONLY real memory this product has ever written is reflection --
-- method. All 46 of them. Every evidence row on the system is seeded.
--
-- Second, and worse: `rememberOutcome` (src/lib/ai/memory.server.ts:438) is the
-- writer that produces evidence, and it writes `kind: OUTCOME_MEMORY_KIND`,
-- which is the literal 'outcome' (src/lib/ai/outcome-memory.ts:14).
--
--   select count(*) from agent_memory where kind = 'outcome';   -- 0
--
-- Zero. Not "few" -- none, ever. The 28 rows the ruling calls `precedent` were
-- written by the seed under a kind the product does not produce. So the
-- evidence half of the moat has a writer that has never fired and a vocabulary
-- that only the seed speaks.
--
-- That is not a defect this file fixes, and it should not be fixed by renaming
-- the constant to match the seed. The reason the writer has never fired is
-- visible in the sibling table: every one of the 133 learnings was written by
-- SQL seed, and `rememberOutcome` is called from the TypeScript paths that
-- follow a real learning (outcome.functions.ts:687,
-- registry.server.ts:4195). No real learning has ever been recorded, so no
-- outcome memory has ever been written. The column is being added ahead of the
-- traffic, deliberately, because the alternative is adding it afterwards when
-- seed and real are already mixed.
--
-- WHY A CHECK AND NOT A TRIGGER. The obvious enforcement is a BEFORE INSERT
-- trigger that nulls `product_id` on method kinds. That would be a silent
-- discard: a caller that believed it was scoping a reflection would be told
-- nothing and would be wrong. A CHECK refuses the write and says why. Loud
-- beats quiet, and this repo has an agent dedicated to hunting the quiet kind.
--
-- WHY NO DERIVATION TRIGGER, UNLIKE learnings. `learnings` carries `prd_id` and
-- `opportunity_id`, both of which lead to a product in one hop. `agent_memory`
-- carries neither. Of its six writers, only two have a product reachable
-- without new plumbing:
--
--   * memory.server.ts:438 (`rememberOutcome`, the evidence writer) -- `prdId`
--     and `opportunityId` are ALREADY function arguments. One optional
--     `productId` arg, and both call sites have the value for free.
--   * spine/correction.server.ts:316 -- `args.trackId` is in scope and
--     `spine_tracks.product_id` exists; widen DRIVE_SELECT
--     (driver.server.ts:1606) and the `track` param type at :134.
--
-- The other four are method writers or seeds, and NULL is the correct answer
-- for them rather than a gap to close. reflection.server.ts:180 in particular
-- has no product route at all -- `agent_runs` and `missions` carry no
-- `product_id` -- and under this ruling it should not have one.
--
-- SHAPE AND SECURITY. Nullable, FK to `projects` with ON DELETE SET NULL, so
-- deleting a product blanks the scope rather than destroying the memory. RLS is
-- untouched; no policy on this table references the column. The BEFORE INSERT
-- trigger that fills `workspace_id` (`trg_set_agent_memory_workspace`) is
-- unaffected and still runs first.

alter table public.agent_memory
  add column if not exists product_id uuid references public.projects(id) on delete set null;

comment on column public.agent_memory.product_id is
  'The product this memory is evidence about, per the §2.3 ruling of '
  '2026-08-19. Set on EVIDENCE kinds only. Method kinds (reflection, '
  'correction) are workspace-scoped and are refused a product by '
  'agent_memory_method_has_no_product -- that is the design, not a gap. '
  'Promotion of a lesson from one product to the whole workspace is a '
  'deliberate, governable event that runs through memory_candidates into '
  'house_rules; it is never an accident of a NULL.';

-- Evidence is product-scoped, method is not. Refuse the contradiction loudly.
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.agent_memory'::regclass
       and conname  = 'agent_memory_method_has_no_product'
  ) then
    alter table public.agent_memory
      add constraint agent_memory_method_has_no_product
      check (kind not in ('reflection', 'correction') or product_id is null);
  end if;
end $$;

-- The retrieval path filters by workspace and will now also filter by product.
create index if not exists agent_memory_product_idx
  on public.agent_memory (workspace_id, product_id, created_at desc)
  where product_id is not null;

-- Deliberately NOT backfilled. Every evidence row on the system is seeded
-- (0 of 28 `precedent` rows sit in a real workspace) and the 46 real rows are
-- all reflections, which this ruling says must stay workspace-scoped. There is
-- nothing to backfill that would be true.

do $$
declare n_bad bigint;
begin
  select count(*) into n_bad from public.agent_memory
   where kind in ('reflection','correction') and product_id is not null;
  if n_bad <> 0 then
    raise exception 'method memory carrying a product_id: % rows', n_bad;
  end if;
end $$;
