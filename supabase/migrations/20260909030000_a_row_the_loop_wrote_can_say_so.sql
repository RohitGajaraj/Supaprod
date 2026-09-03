-- ---------------------------------------------------------------------------
-- A ROW THE LOOP WROTE ABOUT ITSELF CAN SAY SO ON ITS OWN FACE.
--
-- R-37 / P-41. On the founder's own run at 14:41 IST a Sense seat wrote two
-- signals into Helio Labs restating a theme that was already there, having read
-- nothing outside the workspace, and the next sweep carried the run on them.
--
-- `signals.log` now refuses a row that cannot name a source outside this loop,
-- and the evidence readers exclude `source = 'agent'`, so no new row is born
-- this way and none of the existing ones are counted. What neither of those
-- does is let a PERSON looking at the row see what it is. `source_kind` is the
-- lane a row arrived by, and there was no lane for "we wrote this ourselves":
-- the check constraint allowed only the five real doors, so these rows sat
-- under `manual`, which is the lane a HUMAN pastes evidence in through. The
-- most valuable rows in a young workspace and the loop's own exhaust were
-- wearing the same label.
--
-- MARKED, NEVER DELETED. These rows are part of the honest run's record and
-- deleting a customer's data to tidy up our own defect is not ours to do. The
-- lane is added, the rows are relabelled, and every count that matters already
-- excludes them.
--
-- WIDENING A CHECK, NOT REPLACING IT. The five existing lanes are untouched, so
-- nothing that writes today can start failing.
-- ---------------------------------------------------------------------------

alter table public.signals drop constraint if exists signals_source_kind_check;

alter table public.signals add constraint signals_source_kind_check
  check (
    source_kind is null
    or source_kind = any (array[
      'pull_connector'::text,
      'web_scout'::text,
      'mcp_source'::text,
      'webhook'::text,
      'manual'::text,
      -- Written by a seat inside this loop rather than arriving from outside it.
      -- Excluded from every evidence count. See
      -- src/lib/sources/the-loop-does-not-count-its-own-writing.ts
      'loop_authored'::text
    ])
  );
