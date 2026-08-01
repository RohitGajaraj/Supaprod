ALTER TABLE public.spine_tracks
  ADD COLUMN IF NOT EXISTS pending_gates jsonb NOT NULL DEFAULT '[]'::jsonb;