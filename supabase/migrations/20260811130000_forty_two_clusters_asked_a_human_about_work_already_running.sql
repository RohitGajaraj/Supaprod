-- Forty-two clusters asked a human about work already running.
--
-- Discover's ranked queue drops a theme whose status is dismissed, merged or
-- promoted. The autonomous sweep promotes a theme by starting a track and
-- writing `spine_tracks.theme_id` -- and until 20260811 it never wrote
-- `themes.status`. So every theme the sweep promoted stayed in the queue,
-- offering a person a decision on work that was already building. Measured
-- 2026-08-11: 42 of them, 34 `active` and 8 `at_risk`.
--
-- The cost is the founder's own complaint, in its most concrete form: a queue
-- that asks for decisions it does not need. Each one also costs a duplicate bet
-- and a second Critic pass if anyone answers it.
--
-- THE FILTER WAS ALREADY RIGHT AND ALREADY KNEW. `DiscoverSurface.tsx` carries a
-- comment saying `promoted` "was the one settled state nothing wrote, so the
-- queue kept offering it". Somebody diagnosed this exactly and added the status
-- to the filter, and the queue kept offering them, because a filter on a value
-- nobody writes filters nothing. The writer is fixed forward in the same cycle;
-- this is the historical half.
--
-- I FIRST DECIDED NOT TO DO THIS AND CHANGED MY MIND, so the reasoning is here
-- rather than lost. The argument against was that `active` and `at_risk` are
-- Discover's own escalation states and overwriting them destroys a signal a
-- person put there. That is right in general and wrong for exactly these rows: a
-- theme that already has a track HAS been acted on, so `active` is not an
-- escalation worth keeping, it is a stale value describing a cluster that has
-- moved on. The theme genuinely was promoted. Its row should say so.
--
-- SCOPED TO THEMES THAT HAVE A TRACK, which is the whole safety of it. No theme
-- is marked on the strength of its numbers, its age or its status; only on the
-- existence of a `spine_tracks` row pointing at it, which is the product's own
-- record that the promotion happened. `uq_spine_tracks_theme` makes that record
-- unique, so this cannot mark a theme twice or mark one that merely looked
-- promotable.
--
-- Idempotent: re-running marks nothing, because the rows it would mark are
-- already excluded by their new status.
--
-- TO REVERSE: there is no perfect reverse, and that is worth stating plainly
-- rather than pretending. The prior value was `active` or `at_risk` and this
-- does not record which. If it must be undone, the 42 ids are recoverable as
-- `select theme_id from spine_tracks where theme_id is not null`, but their
-- previous status is not. Nothing else is touched: no track, signal, opportunity
-- or lineage row is read or written.

update public.themes t
   set status = 'promoted'
 where t.status not in ('dismissed', 'merged', 'promoted')
   and exists (
     select 1 from public.spine_tracks st where st.theme_id = t.id
   );

do $$
declare
  v_stranded bigint;
begin
  select count(*) into v_stranded
    from public.themes t
   where t.status not in ('dismissed', 'merged', 'promoted')
     and exists (select 1 from public.spine_tracks st where st.theme_id = t.id);
  raise notice 'themes with a track still offered in the queue: %', v_stranded;
end $$;
