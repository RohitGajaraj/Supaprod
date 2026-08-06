-- A SEEDED WORKSPACE IS BORN WITHOUT PROVENANCE, AND LAUNCH DAY IS ALL SEEDED
-- WORKSPACES.
--
-- WHAT IS BROKEN. `getProvenance` (src/lib/lineage.functions.ts:292) counts a
-- node as a source signal only on `parent_kind = 'signal'`, and LineageDrawer
-- gates the whole "Traces back to" section on `signal_count > 0`
-- (LineageDrawer.tsx:299). The live `seed_sample_workspace()` function writes
-- lineage edges, but never one of that kind. Read out of pg_proc on 2026-08-06,
-- the only artifact kinds appearing as literals anywhere in its 91,359-character
-- body are 'decision', 'learning', 'mission' and 'opportunity'. The string
-- 'signal' does not occur in it at all, and neither does 'theme'.
--
-- So every workspace created from the seed opens the moat's own surface on an
-- empty state. That is layer 03, the only layer of the three that is defensible
-- alone, showing nothing on the walkthrough a launch visitor takes.
--
-- WHY NOBODY HAS SEEN IT. Production holds 455 signal-parent edges across 19
-- workspaces, so the section renders correctly everywhere it is looked at today.
-- Those edges came from a ONE-TIME BACKFILL, step 4 of
-- 20260803190000_theme_frequency_is_derived.sql, plus the runtime writers in
-- discovery.functions.ts (656, 1017, 3397). No workspace has been created since
-- 2026-08-03, so no workspace has yet been born after the backfill that would
-- have rescued it. The defect is real and currently invisible, which is the
-- worst combination this close to a launch: it appears for the first time on the
-- first signup after SAMPLE_WORKSPACE_ENABLED is flipped.
--
-- WHY NOT THE FIX THE BOARD ASKED FOR. SOURCE-OF-TRUTH recorded this as "the
-- demo seed writes no artifact_lineage edges ... fix is a seed migration plus a
-- re-seed". Both halves are wrong and the second is actively harmful. The seed
-- writes 20 edges, and the rich Helio demo seed writes 40 more. A re-seed today
-- would produce a demo with LESS provenance than the ones already in the
-- database, because the backfill has run and will not run again. That line is
-- being corrected in the same commit as this file.
--
-- WHY A TRIGGER AND NOT A REWRITTEN SEED. The seed function is 91KB. Restating
-- it to add two inserts is a large diff with a large blast radius for a small
-- fact, and it would fix exactly one writer. A signal that carries a theme
-- ALWAYS descends from it, on every path: the seed, the scout, an import, a
-- backfill, a hand-written row. Expressing that once at the table means no
-- future writer can forget it, which is the same argument
-- 20260802260000_artifact_lineage_canonicalise.sql makes for keeping lineage
-- rules at platform level rather than in each caller.
--
-- SHAPE AND SECURITY. `signal -> theme` with relation 'promoted' is not a
-- choice made here, it is the shape already in the database: 450 of the 455
-- existing signal edges are exactly that, across all 19 workspaces. Direction
-- follows the canonicalise migration's active voice, parent = the actor.
-- SECURITY DEFINER with a pinned search_path mirrors `signals_sync_theme_
-- frequency`, the sibling trigger on this same table and column, because the
-- seed runs as owner while inserting rows owned by a brand new user.

create or replace function public.signals_write_theme_lineage()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- A signal with no theme has no ancestry to record. Not an error: most
  -- signals arrive unthemed and are clustered later, which is why this trigger
  -- watches UPDATE OF theme_id as well as INSERT.
  if new.theme_id is null then
    return new;
  end if;

  insert into public.artifact_lineage
    (user_id, workspace_id, parent_kind, parent_id, child_kind, child_id, relation)
  values
    (new.user_id, new.workspace_id, 'signal', new.id, 'theme', new.theme_id, 'promoted')
  -- The table is unique on
  -- (user_id, parent_kind, parent_id, child_kind, child_id, relation), so the
  -- three runtime writers in discovery.functions.ts and this trigger cannot
  -- produce a duplicate no matter which of them gets there first. Untargeted
  -- ON CONFLICT so a re-theming that lands on the same pair is also absorbed.
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists signals_theme_lineage on public.signals;

create trigger signals_theme_lineage
after insert or update of theme_id on public.signals
for each row execute function public.signals_write_theme_lineage();

-- SELF-HEALING FOR ROWS THAT PREDATE THE TRIGGER. Idempotent by the same unique
-- constraint, and a no-op on this database today because the 2026-08-03 backfill
-- already covered every themed signal that existed then. It is here so that a
-- database restored from a pre-backfill dump, or seeded between that migration
-- and this one, corrects itself rather than carrying the hole forward silently.
insert into public.artifact_lineage
  (user_id, workspace_id, parent_kind, parent_id, child_kind, child_id, relation)
select s.user_id, s.workspace_id, 'signal', s.id, 'theme', s.theme_id, 'promoted'
from public.signals s
where s.theme_id is not null
on conflict do nothing;
