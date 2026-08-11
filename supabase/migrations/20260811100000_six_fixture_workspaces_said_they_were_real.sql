-- Six fixture workspaces said they were real, and the homepage believed them.
--
-- The seven "Helio Labs" workspaces are demo fixtures: one master and six
-- clones. Only the master, `10000000-...`, carries `is_sample = true`. The clone
-- migration copies the row's content and never sets the flag, so six fixtures
-- have asserted `is_sample = false` since they were created.
--
-- WHAT THAT COST, measured on production 2026-08-11. `getLandingStats` excluded
-- sample workspaces by reading exactly this flag, so the six clones passed a
-- filter written specifically to catch them. Every "outcome graded" on the
-- public homepage was fixture or orphan data -- 49 of 49 -- with the missions
-- and decisions counters inflated by roughly 110 and 126.
--
-- The flag is not a policy choice here, it is a fact about the row that was
-- wrong. A Helio Labs clone is a sample workspace whether or not anything reads
-- the column.
--
-- MATCHED ON THE ID BLOCK AND THE NAME TOGETHER, not on either alone. The name
-- alone would catch a real customer who names their workspace Helio Labs; the id
-- block alone assumes no real workspace was ever handed one of those ids. Both
-- must hold, and both are true only of the fixtures.
--
-- THE CODE FIX BESIDE THIS IS THE DURABLE HALF. `getLandingStats` now counts an
-- ALLOWLIST of workspaces provably not samples rather than excluding a
-- blocklist, so the next fixture nobody flags is excluded by default instead of
-- counted by default. This migration corrects the data; that change corrects the
-- direction the code fails in. Neither is sufficient alone: without the flag the
-- allowlist would admit the six fixtures, and without the allowlist an orphaned
-- workspace_id -- 16 more graded outcomes, pointing at a workspace with no row
-- in this table at all -- would still count.
--
-- AFTER THIS, THE PUBLIC "OUTCOMES GRADED" COUNTER READS ZERO. That is correct
-- and it should ship. Zero is the honest number, it matches what the record
-- actually holds, and a homepage claiming 49 graded outcomes beside an
-- application saying the record starts on first real use is the contradiction
-- that costs more than the counter is worth.
--
-- TO REVERSE: update public.workspaces set is_sample = false where id in
-- (the six ids below). Nothing else is touched: no learning, mission, decision
-- or lineage row is read or written by this.

update public.workspaces
   set is_sample = true
 where is_sample is distinct from true
   and name = 'Helio Labs'
   and id::text like '_0000000-0000-4000-8000-000000000000';

do $$
declare
  v_flagged bigint;
  v_graded  bigint;
begin
  select count(*) into v_flagged
    from public.workspaces
   where is_sample is true;

  select count(*) into v_graded
    from public.learnings l
   where l.verdict is not null
     and l.workspace_id in (select id from public.workspaces where is_sample is not true);

  raise notice 'workspaces flagged as sample: % · graded outcomes now counted as real: %',
    v_flagged, v_graded;
end $$;
