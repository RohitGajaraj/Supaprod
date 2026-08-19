-- 20260819181000_learnings_gains_the_two_edges_the_canon_already_claims.sql
--
-- Claude lane, 2026-08-19. Depends on 20260819180000, which must apply first.
--
-- LEARNINGS GAINS THE TWO EDGES THE CANON ALREADY CLAIMS IT HAS, AND THE
-- FOREIGN KEY THAT WOULD HAVE STOPPED 16 ROWS FROM OUTLIVING THEIR WORKSPACE.
--
-- ================================================================= PART 1 ===
-- THE MISSING FOREIGN KEY, AND THE 16 ROWS THAT PROVE IT WAS MISSING.
--
-- `agent_memory.workspace_id` references `workspaces` and has a BEFORE INSERT
-- trigger, `trg_set_agent_memory_workspace`, running
-- `set_row_workspace_from_user()` (20260619212731_...sql:342). It has zero
-- orphans.
--
-- `learnings.workspace_id` has neither. It has 16:
--
--   select count(*) from learnings l where not exists
--     (select 1 from workspaces w where w.id = l.workspace_id);      -- 16
--   select distinct workspace_id ...;   -- b13b3c2d-391b-4911-8954-4ecf539440e4
--
-- One user, one workspace that was deleted out from under them, rows dated
-- 2025-12-05 to 2026-06-05. Two sibling tables, one guarded and one not, and
-- the unguarded one is the one the strategy leans on. That is the whole finding.
--
-- >>> THIS PART DELETES 16 PRODUCTION ROWS. <<<
--
-- They are unreachable by any query that joins `workspaces`, which is every
-- query in the product that reads learnings. They were marked `is_sample` by
-- the preceding migration on the argument that no real learning has ever been
-- written. They cannot be repaired, because the workspace they name does not
-- exist and nothing records which one it was. The alternative to deleting them
-- is not adding the foreign key, which leaves the defect that produced them.
--
-- If that trade is not wanted, comment out step 1.1 and step 1.2 together; the
-- rest of this file applies without them.
--
-- ================================================================= PART 2 ===
-- product_id, AND WHY IT IS DERIVED AT THE TABLE RATHER THAN LEFT TO CALLERS.
--
-- A product is a row in `projects`; there is no `products` table. 15 tables
-- carry `product_id` as a FK to `projects` today. `learnings` is not one, so
-- "evidence carries a product" is not a thing the schema can express about the
-- moat's own table.
--
-- The obvious build is: add a nullable column, stamp it at the two writers.
-- THAT BUILD ALREADY EXISTS ON THIS DATABASE AND IT FAILED.
-- `credit_ledger.product_id` has been there since 20260619212731. Both writing
-- functions take a `_product_id` parameter and both write it. Measured:
--
--   select count(*), count(product_id) from credit_ledger;   -- 13890, 0
--
-- Zero of 13,890, because 1 of 72 `callModel` call sites passes the value
-- (`src/lib/ai/cluster.server.ts:185`, a background clustering tick) and
-- `runtime.server.ts:393` says so in its own doc comment: "Most call sites
-- leave it null." A column whose correctness depends on every caller
-- remembering is a column that will read zero.
--
-- So the value is derived at the table, from edges the row already carries.
-- This is not a new pattern here; it is the argument 20260806193000 made for
-- doing lineage at the table rather than in each caller -- "expressing that
-- once at the table means no future writer can forget it" -- and the shape
-- `set_row_workspace_from_user()` already uses on `agent_memory`.
--
-- The derivation is measured, not assumed. Across all 133 rows:
--
--   with r as (select l.id, p.product_id via_prd, o.product_id via_opp
--                from learnings l
--                left join prds p on p.id = l.prd_id
--                left join opportunities o on o.id = l.opportunity_id)
--   select count(*) filter (where via_prd is not null or via_opp is not null),
--          count(*) filter (where via_prd is not null and via_opp is not null
--                             and via_prd <> via_opp)
--     from r;                                              -- 61 resolvable, 0 disagree
--
-- The two routes never contradict each other, so preferring the spec over the
-- bet is an ordering choice with no cost. Where neither resolves, NULL is the
-- honest answer and the column says so.
--
-- The trigger does not override a value the caller supplied. A caller that
-- knows better -- and both of them do, see below -- wins.
--
-- CALLER WORK THIS DOES NOT REPLACE. Both `learnings` writers can supply the
-- value with no new plumbing, and should, because a caller-supplied value is
-- correct on the autonomous path where the derivation is not:
--
--   * src/lib/outcome.functions.ts:591 -- `shippedChangeset.product_id` is
--     already selected at :492; or add `,product_id` to the prds select at :465.
--   * src/lib/ai/tools/registry.server.ts:4101 -- add `,product_id` to the prds
--     select at :4063. That file's own comments record that on the autonomous
--     driver route `prd_id`, `opportunity_id` and `mission_id` all come back
--     NULL, which is exactly where the trigger cannot help. `ctx.trackId` ->
--     `spine_tracks.product_id` is the fallback that closes it, and `trackId` is
--     already on `ToolCtx`.
--
-- ================================================================= PART 3 ===
-- decision_id, THE EDGE THE CANON ASSERTS AND THE SCHEMA DOES NOT HAVE.
--
-- The canonical sentence is that a learning is "written back against the
-- decision that caused it." The schema writes it back against the spec
-- (`prd_id`) and the bet (`opportunity_id`), and there is no decision edge at
-- all. src/lib/ai/trust.server.ts:151-153 pays for this every time it runs, in
-- its own words: "RF-06: no FK exists between learnings and decisions (both key
-- off prd_id independently), so resolve agent attribution via a second query +
-- JS join."
--
-- So the cost is already being paid in application code, twice per trust score.
-- The column is nullable with no backfill and no derivation: `prd_id` does not
-- identify a decision (many decisions share one spec), and inventing the edge
-- from a shared parent is precisely the guess that comment is working around.
-- It fills going forward or not at all.

-- ---------------------------------------------------------------------------
-- 1.1 Remove the unreachable rows. DESTRUCTIVE. See PART 1 above.
-- ---------------------------------------------------------------------------

delete from public.learnings l
 where not exists (select 1 from public.workspaces w where w.id = l.workspace_id);

-- ---------------------------------------------------------------------------
-- 1.2 The foreign key and the trigger that keep it from happening again
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.learnings'::regclass
       and conname  = 'learnings_workspace_id_fkey'
  ) then
    alter table public.learnings
      add constraint learnings_workspace_id_fkey
      foreign key (workspace_id) references public.workspaces(id) on delete cascade;
  end if;
end $$;

-- Same trigger agent_memory has carried since 20260619212731. It fills a NULL
-- workspace from the user's default; it does not touch a supplied value.
drop trigger if exists trg_set_learnings_workspace on public.learnings;
create trigger trg_set_learnings_workspace
  before insert on public.learnings
  for each row execute function public.set_row_workspace_from_user();

-- ---------------------------------------------------------------------------
-- 2.1 product_id
-- ---------------------------------------------------------------------------

alter table public.learnings
  add column if not exists product_id uuid references public.projects(id) on delete set null;

comment on column public.learnings.product_id is
  'The product this learning is about. A product is a row in `projects`. '
  'Derived at insert from prd_id, then opportunity_id, when the caller does not '
  'supply one -- see trg_learnings_derive_product. NULL is truthful and means '
  'no route resolved, not that the value was forgotten.';

create index if not exists learnings_product_idx
  on public.learnings (product_id, created_at desc)
  where product_id is not null;

create or replace function public.learnings_derive_product_id()
returns trigger language plpgsql security definer set search_path to 'public'
as $$
begin
  -- A caller that supplied a value knows more than this function does.
  if NEW.product_id is not null then
    return NEW;
  end if;

  if NEW.prd_id is not null then
    select p.product_id into NEW.product_id from public.prds p where p.id = NEW.prd_id;
  end if;

  if NEW.product_id is null and NEW.opportunity_id is not null then
    select o.product_id into NEW.product_id
      from public.opportunities o where o.id = NEW.opportunity_id;
  end if;

  return NEW;
end; $$;

drop trigger if exists trg_learnings_derive_product on public.learnings;
create trigger trg_learnings_derive_product
  before insert on public.learnings
  for each row execute function public.learnings_derive_product_id();

-- Deliberately NOT backfilled. Every surviving row is seeded example content
-- (`is_sample` is true on all of them after 20260819180000), and stamping a
-- product onto fiction teaches the next reader that the column means something
-- it does not yet mean. It fills from the first real write.

-- ---------------------------------------------------------------------------
-- 3.1 decision_id
-- ---------------------------------------------------------------------------

alter table public.learnings
  add column if not exists decision_id uuid references public.decisions(id) on delete set null;

comment on column public.learnings.decision_id is
  'The decision this learning settles. No backfill and no derivation: prd_id '
  'does not identify a decision, since many decisions share one spec. See '
  'src/lib/ai/trust.server.ts:151 (RF-06), which reconstructs this edge in JS '
  'today and can stop once this column is written.';

create index if not exists learnings_decision_idx
  on public.learnings (decision_id)
  where decision_id is not null;

-- ---------------------------------------------------------------------------
-- 4. Assert
-- ---------------------------------------------------------------------------

do $$
declare n_orphan bigint;
begin
  select count(*) into n_orphan from public.learnings l
   where not exists (select 1 from public.workspaces w where w.id = l.workspace_id);
  if n_orphan <> 0 then
    raise exception 'learnings still holds % orphaned rows; the foreign key cannot be trusted', n_orphan;
  end if;
end $$;
