-- WHICH ONE FIRST, AND UNTIL NOW NOBODY COULD SAY (P-20).
--
-- FOUNDER, 2026-09-02 18:54: "when various signals are queued, bucketed and themed, how
-- do I decide which one to hack on? Is there any prominence for that?"
--
-- WHAT DECIDES ORDER TODAY, both halves of it, and neither is a person. A theme becomes a
-- run when it crosses the workspace bar, ranked severity then frequency then confidence
-- (`promote.ts`). The sweep then serves open runs in strict round robin by `driven_at`
-- (`track-tick.ts`), which is deliberately fair and deliberately opinionless: the run that
-- moved longest ago goes next. Between them there is no way for the person who owns the
-- work to say "this one first", and that is the gap.
--
-- ONE PIN, NOT A PRIORITY FIELD. A number would need a scale, a scale needs a meaning, and
-- a meaning nobody agreed becomes five runs all set to 1. A nullable instant answers the
-- only question actually being asked -- is this the one -- and answers it for several runs
-- in the order they were pinned, which is the order a person meant.
--
-- NULLABLE, NO DEFAULT, AND THE THREE READINGS ARE THREE DIFFERENT BYTES: NULL is "nobody
-- said", a timestamp is "somebody said, at this moment", and clearing it back to NULL is
-- "they changed their mind". A boolean would have lost the ordering between two pins and
-- a `NOT NULL DEFAULT false` would have made "never pinned" and "unpinned" the same byte,
-- which is the default-as-data trap SESSION-0-CONDUCTOR named on 2026-08-31.
--
-- THE INDEX IS EARNED, unlike `stop_requested_at`'s. The sweep's own selection orders by
-- this column on every tick over every open track, which is exactly the read a partial
-- index serves: only pinned rows are in it, so it stays small however many tracks exist.

ALTER TABLE public.spine_tracks
  ADD COLUMN IF NOT EXISTS pinned_at timestamptz;

CREATE INDEX IF NOT EXISTS spine_tracks_pinned_at_idx
  ON public.spine_tracks (pinned_at)
  WHERE pinned_at IS NOT NULL;

COMMENT ON COLUMN public.spine_tracks.pinned_at IS
  'When a person said this run goes first. NULL means nobody has. The sweep orders pinned_at asc nulls last, then driven_at asc, so pins are served in the order they were made and everything else keeps its round robin.';
