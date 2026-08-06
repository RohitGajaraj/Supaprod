-- A SPEC DRAWN FROM AN EXAMPLE IS AN EXAMPLE, AND NOTHING COULD SAY SO.
--
-- WHAT HAPPENED. Migration 20260805220000 gave `is_sample` to `signals` and to
-- `opportunities`; 20260806060000 gave it to `themes`, which sit between them.
-- The chain stops there. `prds` -- the artifact the next three stations read,
-- and the one a person opens to decide what to build -- has no such column, so
-- the mark dies at the Decide -> Plan handoff.
--
-- Measured live before this ran (2026-08-06): 20 sample opportunities across 5
-- workspaces, 81 prds, and ZERO of those prds descend from a sample bet. So the
-- backfill below marks nothing today. That is not a reason to skip it: it is
-- the reason to run it NOW. This is launch week, the defect is entirely ahead
-- of us, and the first row it would produce is the one a stranger sees first.
--
-- WHY IT BITES ON DAY ONE SPECIFICALLY. /decide's gate falls through to the
-- top-ranked bet when a workspace has no real one, so on a brand-new workspace
-- the gate holds a seeded example and says so in its first line. Pressing
-- "Keep it" puts that invented bet in the Next lane of the roadmap and an
-- invented spec in the Specs list. Decide printed the Example tag one screen
-- earlier; Plan cannot, because the fact never arrived. The first thing a new
-- user's roadmap contains would be unlabelled fiction, on the product whose
-- whole claim is that its judgement is grounded in THEIR record.
--
-- THE RULE, INHERITED: A CHILD IS A SAMPLE ONLY IF IT DESCENDS FROM ONE. The
-- themes migration states the asymmetry and it holds here unchanged --
-- mislabelling a person's real spec as fiction is the worse of the two errors,
-- so the condition is the parent bet's own flag and nothing looser. A spec
-- written from a freeform brief has no parent bet and is never a sample: those
-- are the user's own words by construction.
--
-- Forward-only. Default false, so every spec anyone has ever written is
-- untouched.

alter table public.prds
  add column if not exists is_sample boolean not null default false;

comment on column public.prds.is_sample is
  'True when this spec was generated from a seeded example bet (opportunities.is_sample). '
  'Written by generatePrd at creation, not by a person or an agent. Surfaces must mark it '
  'the way /decide marks the bet it came from, and anything that forms a judgement must '
  'exclude it. A spec written from a freeform brief is never a sample.';

-- THE BACKFILL, anchored on the foreign key rather than on titles.
--
-- `prds.opportunity_id` is a real FK, so unlike the signals/opportunities
-- backfill (which had to match authored titles because no link existed) this
-- one can ask the parent directly. Guarded with `is_sample = false` so
-- re-running is a no-op rather than a rewrite of rows someone has since
-- corrected.

update public.prds p
   set is_sample = true
  from public.opportunities o
 where o.id = p.opportunity_id
   and o.is_sample
   and p.is_sample = false;

-- The Specs list and the roadmap read prds by workspace and status on every
-- /plan load, and now have a column to filter and tag on. Partial, because the
-- rows that matter are the ones that are NOT samples and that is the
-- overwhelming majority.
create index if not exists prds_live_not_sample_idx
  on public.prds (workspace_id, status)
  where is_sample = false;
