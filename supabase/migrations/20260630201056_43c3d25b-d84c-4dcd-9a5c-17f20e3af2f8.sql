-- SF-SCOUT, SF-FOCUS, SF-AUTOTRIGGER: apply pending migrations
CREATE TABLE IF NOT EXISTS public.scout_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN
    ('competitor-surface','market-news','social-reviews','hiring','tech-platform-shift','regulatory-compliance')),
  label text NOT NULL,
  url text,
  query text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  cadence text NOT NULL DEFAULT 'daily' CHECK (cadence IN ('hourly','daily','weekly')),
  enabled boolean NOT NULL DEFAULT true,
  last_checked_at timestamptz,
  next_check_at timestamptz,
  consecutive_unchanged int NOT NULL DEFAULT 0,
  error_count int NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scout_targets_url_or_query CHECK (url IS NOT NULL OR query IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_scout_targets_due
  ON public.scout_targets (enabled, next_check_at ASC NULLS FIRST) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_scout_targets_ws ON public.scout_targets (workspace_id);

CREATE TABLE IF NOT EXISTS public.scout_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id uuid NOT NULL REFERENCES public.scout_targets(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  content_hash text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  char_count int NOT NULL DEFAULT 0,
  fetched_url text,
  status int,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scout_snapshots_target
  ON public.scout_snapshots (target_id, fetched_at DESC);

CREATE TABLE IF NOT EXISTS public.scout_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  target_id uuid REFERENCES public.scout_targets(id) ON DELETE SET NULL,
  kind text,
  outcome text NOT NULL CHECK (outcome IN ('first-seen','unchanged','changed','error','skipped-cap')),
  changed boolean NOT NULL DEFAULT false,
  signal_id uuid REFERENCES public.signals(id) ON DELETE SET NULL,
  snapshot_id uuid REFERENCES public.scout_snapshots(id) ON DELETE SET NULL,
  fetch_count int NOT NULL DEFAULT 0,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_scout_runs_ws_time
  ON public.scout_runs (workspace_id, created_at DESC);

ALTER TABLE public.scout_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scout_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scout_runs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scout_targets TO authenticated;
GRANT SELECT ON public.scout_snapshots TO authenticated;
GRANT SELECT ON public.scout_runs TO authenticated;
GRANT ALL ON public.scout_targets TO service_role;
GRANT ALL ON public.scout_snapshots TO service_role;
GRANT ALL ON public.scout_runs TO service_role;

DROP POLICY IF EXISTS scout_targets_member_read ON public.scout_targets;
CREATE POLICY scout_targets_member_read ON public.scout_targets
  FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
DROP POLICY IF EXISTS scout_targets_owner_write ON public.scout_targets;
CREATE POLICY scout_targets_owner_write ON public.scout_targets
  FOR ALL TO authenticated
  USING (workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid()))
  WITH CHECK (workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid()));
DROP POLICY IF EXISTS scout_snapshots_member_read ON public.scout_snapshots;
CREATE POLICY scout_snapshots_member_read ON public.scout_snapshots
  FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));
DROP POLICY IF EXISTS scout_runs_member_read ON public.scout_runs;
CREATE POLICY scout_runs_member_read ON public.scout_runs
  FOR SELECT TO authenticated USING (public.is_workspace_member(workspace_id));

DROP TRIGGER IF EXISTS scout_targets_updated_at ON public.scout_targets;
CREATE TRIGGER scout_targets_updated_at BEFORE UPDATE ON public.scout_targets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS auto_scout_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_auto_scout_at timestamptz,
  ADD COLUMN IF NOT EXISTS scout_daily_fetch_cap int NOT NULL DEFAULT 50;
CREATE INDEX IF NOT EXISTS idx_workspaces_auto_scout
  ON public.workspaces (auto_scout_enabled, last_auto_scout_at ASC NULLS FIRST)
  WHERE auto_scout_enabled = true;

-- Theme scoring + insights
ALTER TABLE public.themes
  ADD COLUMN IF NOT EXISTS embedding      vector(1536),
  ADD COLUMN IF NOT EXISTS novelty        real,
  ADD COLUMN IF NOT EXISTS novelty_basis  jsonb,
  ADD COLUMN IF NOT EXISTS scored_at      timestamptz,
  ADD COLUMN IF NOT EXISTS last_signal_at timestamptz;

CREATE INDEX IF NOT EXISTS themes_embedding_hnsw
  ON public.themes USING hnsw (embedding vector_cosine_ops);

CREATE OR REPLACE FUNCTION public.match_themes(
  query_embedding vector(1536),
  for_user        uuid,
  exclude_id      uuid    DEFAULT NULL,
  match_count     integer DEFAULT 6
) RETURNS TABLE (id uuid, title text, summary text, similarity double precision)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT t.id, t.title, t.summary,
         1 - (t.embedding <=> query_embedding) AS similarity
  FROM public.themes t
  WHERE t.user_id = COALESCE(auth.uid(), for_user)
    AND t.embedding IS NOT NULL
    AND (exclude_id IS NULL OR t.id <> exclude_id)
  ORDER BY t.embedding <=> query_embedding
  LIMIT match_count;
$$;
REVOKE EXECUTE ON FUNCTION public.match_themes(vector, uuid, uuid, integer) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.match_themes(vector, uuid, uuid, integer) TO authenticated;
GRANT  EXECUTE ON FUNCTION public.match_themes(vector, uuid, uuid, integer) TO service_role;

CREATE TABLE IF NOT EXISTS public.insights (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL DEFAULT auth.uid(),
  workspace_id  uuid NOT NULL DEFAULT public.current_user_default_workspace()
                  REFERENCES public.workspaces (id) ON DELETE CASCADE,
  product_id    uuid REFERENCES public.projects (id) ON DELETE SET NULL,
  theme_id      uuid REFERENCES public.themes (id) ON DELETE SET NULL,
  kind          text NOT NULL CHECK (kind IN
                  ('prediction','risk','next_best_action','cost_of_inaction','hidden_connection')),
  headline      text NOT NULL,
  detail        text NOT NULL DEFAULT '',
  evidence      jsonb NOT NULL DEFAULT '{}'::jsonb,
  recommended_action jsonb,
  score         real,
  status        text NOT NULL DEFAULT 'open',
  dedup_key     text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS insights_ws_dedup_idx
  ON public.insights (workspace_id, dedup_key);
CREATE INDEX IF NOT EXISTS insights_ws_status_idx
  ON public.insights (workspace_id, status, score DESC);

ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.insights TO authenticated;
GRANT ALL ON public.insights TO service_role;

DROP POLICY IF EXISTS "insights ws read" ON public.insights;
CREATE POLICY "insights ws read" ON public.insights FOR SELECT
  USING (public.is_workspace_member(workspace_id));
DROP POLICY IF EXISTS "insights ws write" ON public.insights;
CREATE POLICY "insights ws write" ON public.insights FOR ALL
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

DROP TRIGGER IF EXISTS insights_updated_at ON public.insights;
CREATE TRIGGER insights_updated_at BEFORE UPDATE ON public.insights
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS auto_derive_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_auto_derive_at  timestamptz;
CREATE INDEX IF NOT EXISTS idx_workspaces_auto_derive
  ON public.workspaces (auto_derive_enabled, last_auto_derive_at ASC NULLS FIRST)
  WHERE auto_derive_enabled = true;

-- SF-AUTOTRIGGER: auto_trigger_source on missions
ALTER TABLE public.missions
  ADD COLUMN IF NOT EXISTS auto_trigger_source text
  CHECK (auto_trigger_source IS NULL OR auto_trigger_source = 'auto');

COMMENT ON COLUMN public.missions.auto_trigger_source IS
  'Set to ''auto'' when the mission was auto-promoted proposed→queued by the BRAIN_AUTO_TRIGGER path. NULL for human-promoted missions.';