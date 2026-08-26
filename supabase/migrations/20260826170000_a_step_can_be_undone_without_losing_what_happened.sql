-- A STEP CAN BE UNDONE WITHOUT LOSING WHAT HAPPENED (gap #5, S1's request).
--
-- "Undo a step" means Plan wrote a wrong spec and Build already consumed it.
-- The station pointer moves back and the work is re-walked. The obvious
-- implementation deletes the artifacts that are being undone, and that is the
-- one thing this product must not do: the record of what happened is the thing
-- being sold, and a track whose history is edited to look tidy cannot support a
-- verdict measured against a forecast.
--
-- So supersession is a STAMP, not a delete. The row stays, the artifact stays,
-- and one nullable timestamp says "this was undone, and when".
--
-- NULLABLE WITH NO DEFAULT, deliberately. Every existing row means "still
-- standing", which is true of all 1,516 of them, and a DEFAULT now() would
-- silently mark the entire history as undone the moment it was added.
ALTER TABLE public.spine_track_members
  ADD COLUMN IF NOT EXISTS superseded_at timestamptz;

-- The reads that gate progression all ask "what is standing at this station",
-- which is `superseded_at IS NULL`. Partial index because the superseded rows
-- are the minority and are never on the hot path.
CREATE INDEX IF NOT EXISTS spine_track_members_standing_idx
  ON public.spine_track_members (track_id, station)
  WHERE superseded_at IS NULL;

COMMENT ON COLUMN public.spine_track_members.superseded_at IS
  'When a rewind undid this artifact. NULL means it still stands. The row is never deleted: the record keeps what happened.';
