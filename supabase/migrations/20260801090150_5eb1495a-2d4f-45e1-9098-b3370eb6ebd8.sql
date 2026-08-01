CREATE TABLE IF NOT EXISTS public.spine_tracks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL,
  workspace_id uuid NOT NULL DEFAULT current_user_default_workspace(),
  product_id   uuid,
  project_id   uuid,
  title        text NOT NULL,
  origin       text,
  entry_station text NOT NULL DEFAULT 'sense',
  path         jsonb NOT NULL DEFAULT
                 '["sense","decide","define","design","build","ship","learn"]'::jsonb,
  waived       jsonb NOT NULL DEFAULT '[]'::jsonb,
  station      text NOT NULL DEFAULT 'sense',
  status       text NOT NULL DEFAULT 'open',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.spine_track_members (
  track_id      uuid NOT NULL REFERENCES public.spine_tracks(id) ON DELETE CASCADE,
  artifact_kind text NOT NULL,
  artifact_id   uuid NOT NULL,
  station       text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (track_id, artifact_kind, artifact_id)
);

CREATE INDEX IF NOT EXISTS spine_tracks_workspace_status_idx
  ON public.spine_tracks (workspace_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS spine_tracks_station_idx
  ON public.spine_tracks (workspace_id, station) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS spine_track_members_artifact_idx
  ON public.spine_track_members (artifact_kind, artifact_id);

ALTER TABLE public.spine_tracks        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spine_track_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own tracks all" ON public.spine_tracks;
CREATE POLICY "own tracks all" ON public.spine_tracks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own track members all" ON public.spine_track_members;
CREATE POLICY "own track members all" ON public.spine_track_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.spine_tracks t
             WHERE t.id = spine_track_members.track_id AND t.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.spine_tracks t
             WHERE t.id = spine_track_members.track_id AND t.user_id = auth.uid())
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.spine_tracks        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.spine_track_members TO authenticated;
GRANT ALL ON public.spine_tracks        TO service_role;
GRANT ALL ON public.spine_track_members TO service_role;