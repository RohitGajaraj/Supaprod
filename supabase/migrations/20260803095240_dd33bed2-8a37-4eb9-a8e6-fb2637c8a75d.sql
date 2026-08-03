-- ===== 20260802260000_artifact_lineage_canonicalise.sql =====
update public.artifact_lineage set relation = 'derived-from' where relation = 'derived_from';
update public.artifact_lineage set relation = 'promoted'     where relation = 'promotes';
update public.artifact_lineage set relation = 'grounded-in'  where relation = 'grounded_in';
update public.artifact_lineage set relation = 'cites'        where relation = 'references';

update public.artifact_lineage set relation = 'informs' where relation = 'informed_by';

update public.artifact_lineage
   set parent_kind = child_kind, parent_id = child_id,
       child_kind  = parent_kind, child_id = parent_id,
       relation    = case relation
                       when 'superseded_by'   then 'supersedes'
                       when 'contradicted_by' then 'contradicts'
                       when 'validated_by'    then 'validates'
                       when 'measured_by'     then 'measures'
                       when 'killed_by'       then 'kills'
                     end
 where relation in ('superseded_by','contradicted_by','validated_by','measured_by','killed_by');

-- ===== 20260802270000_workspace_claim.sql =====
CREATE OR REPLACE FUNCTION public.claim_workspace_into_account(
  _workspace_id    uuid,
  _to_account_id   uuid,
  _from_account_id uuid,
  _actor_id        uuid,
  _claimant_id     uuid,
  _grace_until     timestamptz,
  _inventory       jsonb
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
DECLARE
  v_current_account uuid;
  v_tier            text;
  v_added           uuid := NULL;
  v_actor           uuid := coalesce(auth.uid(), _actor_id);
BEGIN
  SELECT account_id INTO v_current_account
  FROM public.workspaces WHERE id = _workspace_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workspace not found.';
  END IF;

  IF v_current_account IS DISTINCT FROM _from_account_id THEN
    RAISE EXCEPTION 'This workspace moved since the offer was made.'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.account_members m
    WHERE m.account_id = _to_account_id
      AND m.user_id = v_actor
      AND m.role IN ('owner', 'admin')
  ) THEN
    RAISE EXCEPTION 'Only an owner or admin of that organisation can accept a workspace into it.';
  END IF;

  SELECT plan_tier INTO v_tier FROM public.accounts WHERE id = _to_account_id;
  IF v_tier IS NULL OR v_tier NOT IN ('team', 'enterprise') THEN
    RAISE EXCEPTION 'That plan is a single seat, so it cannot hold a second person''s workspace.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_audit_log l
    WHERE l.workspace_id = _workspace_id
      AND l.action = 'workspace_claim_offered'
      AND l.detail->>'to_account_id' = _to_account_id::text
      AND (l.detail->>'expires_at')::timestamptz > now()
      AND l.created_at > coalesce((
            SELECT max(l2.created_at) FROM public.workspace_audit_log l2
            WHERE l2.workspace_id = _workspace_id
              AND l2.action IN ('workspace_claim_withdrawn', 'workspace_claim_declined',
                                'workspace_claim_accepted', 'workspace_claim_released')
          ), '-infinity'::timestamptz)
  ) THEN
    RAISE EXCEPTION 'There is no live offer on this workspace for your organisation.';
  END IF;

  PERFORM set_config('app.workspace_claim', 'on', true);

  UPDATE public.workspaces SET account_id = _to_account_id WHERE id = _workspace_id;

  IF NOT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = _workspace_id AND user_id = v_actor
  ) THEN
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (_workspace_id, v_actor, 'admin');
    v_added := v_actor;
  END IF;

  INSERT INTO public.workspace_audit_log (workspace_id, actor_id, action, detail)
  VALUES (_workspace_id, v_actor, 'workspace_claim_accepted', jsonb_build_object(
    'from_account_id', _from_account_id,
    'to_account_id',   _to_account_id,
    'accepted_by',     v_actor,
    'claimant_id',     _claimant_id,
    'grace_until',     _grace_until,
    'added_member_id', v_added,
    'acknowledged',    true,
    'inventory',       coalesce(_inventory, '{}'::jsonb)
  ));

  PERFORM set_config('app.workspace_claim', 'off', true);
  RETURN v_added;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_workspace_into_account(
  uuid, uuid, uuid, uuid, uuid, timestamptz, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_workspace_into_account(
  uuid, uuid, uuid, uuid, uuid, timestamptz, jsonb) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.release_workspace_claim(
  _workspace_id     uuid,
  _to_account_id    uuid,
  _from_account_id  uuid,
  _actor_id         uuid,
  _actor_role       text,
  _remove_member_id uuid,
  _reason           text
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
DECLARE
  v_current_account uuid;
  v_accept          jsonb;
  v_claimant        uuid;
  v_grace           timestamptz;
  v_actor           uuid := coalesce(auth.uid(), _actor_id);
  v_is_manager      boolean;
BEGIN
  SELECT account_id INTO v_current_account
  FROM public.workspaces WHERE id = _workspace_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workspace not found.';
  END IF;
  IF v_current_account IS DISTINCT FROM _from_account_id THEN
    RAISE EXCEPTION 'This workspace moved while you were releasing it.'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT l.detail INTO v_accept
  FROM public.workspace_audit_log l
  WHERE l.workspace_id = _workspace_id AND l.action = 'workspace_claim_accepted'
  ORDER BY l.created_at DESC LIMIT 1;
  IF v_accept IS NULL THEN
    RAISE EXCEPTION 'This workspace is not claimed, so there is nothing to release.';
  END IF;

  v_claimant := (v_accept->>'claimant_id')::uuid;
  v_grace    := (v_accept->>'grace_until')::timestamptz;

  v_is_manager := EXISTS (
    SELECT 1 FROM public.account_members m
    WHERE m.account_id = _from_account_id
      AND m.user_id = v_actor
      AND m.role IN ('owner', 'admin')
  );

  IF NOT v_is_manager AND NOT (v_actor = v_claimant AND v_grace > now()) THEN
    RAISE EXCEPTION 'Only the person who claimed it, inside their window, or an owner or admin of the organisation, can release it.';
  END IF;

  PERFORM set_config('app.workspace_claim', 'on', true);
  UPDATE public.workspaces SET account_id = _to_account_id WHERE id = _workspace_id;

  IF _remove_member_id IS NOT NULL AND _remove_member_id IS DISTINCT FROM v_claimant THEN
    DELETE FROM public.workspace_members
    WHERE workspace_id = _workspace_id AND user_id = _remove_member_id;
  END IF;

  INSERT INTO public.workspace_audit_log (workspace_id, actor_id, action, detail)
  VALUES (_workspace_id, v_actor, 'workspace_claim_released', jsonb_build_object(
    'from_account_id',   _from_account_id,
    'to_account_id',     _to_account_id,
    'released_by',       v_actor,
    'released_by_role',  CASE WHEN v_is_manager THEN 'account_admin' ELSE 'claimant' END,
    'reason',            _reason
  ));

  PERFORM set_config('app.workspace_claim', 'off', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.release_workspace_claim(
  uuid, uuid, uuid, uuid, text, uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.release_workspace_claim(
  uuid, uuid, uuid, uuid, text, uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.guard_workspace_account_move()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
BEGIN
  IF NEW.account_id IS DISTINCT FROM OLD.account_id
     AND coalesce(current_setting('app.workspace_claim', true), '') <> 'on' THEN
    RAISE EXCEPTION
      'A workspace changes account only through a claim. Offer it, and have an owner or admin of the other organisation accept.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_workspace_account_move_trigger ON public.workspaces;
CREATE TRIGGER guard_workspace_account_move_trigger
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.guard_workspace_account_move();

CREATE INDEX IF NOT EXISTS workspace_audit_log_claim_to_account_idx
  ON public.workspace_audit_log ((detail->>'to_account_id'), created_at DESC)
  WHERE action IN ('workspace_claim_offered', 'workspace_claim_withdrawn',
                   'workspace_claim_declined', 'workspace_claim_accepted',
                   'workspace_claim_released');

CREATE INDEX IF NOT EXISTS workspace_audit_log_claim_workspace_idx
  ON public.workspace_audit_log (workspace_id, created_at)
  WHERE action IN ('workspace_claim_offered', 'workspace_claim_withdrawn',
                   'workspace_claim_declined', 'workspace_claim_accepted',
                   'workspace_claim_released');

-- ===== 20260802280000_entity_embeddings.sql =====
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE public.decisions     ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE public.prds          ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE public.learnings     ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE INDEX IF NOT EXISTS decisions_embedding_hnsw
  ON public.decisions USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS opportunities_embedding_hnsw
  ON public.opportunities USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS prds_embedding_hnsw
  ON public.prds USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS learnings_embedding_hnsw
  ON public.learnings USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS decisions_embedding_backfill_queue_idx
  ON public.decisions (created_at)
  WHERE embedding IS NULL;
CREATE INDEX IF NOT EXISTS opportunities_embedding_backfill_queue_idx
  ON public.opportunities (created_at)
  WHERE embedding IS NULL;
CREATE INDEX IF NOT EXISTS prds_embedding_backfill_queue_idx
  ON public.prds (created_at)
  WHERE embedding IS NULL;
CREATE INDEX IF NOT EXISTS learnings_embedding_backfill_queue_idx
  ON public.learnings (created_at)
  WHERE embedding IS NULL;

-- ===== 20260803000000_add_embedding_model_tracking.sql =====
ALTER TABLE public.signals        ADD COLUMN IF NOT EXISTS embedding_model text;
ALTER TABLE public.themes         ADD COLUMN IF NOT EXISTS embedding_model text;
ALTER TABLE public.agent_memory   ADD COLUMN IF NOT EXISTS embedding_model text;
ALTER TABLE public.decisions      ADD COLUMN IF NOT EXISTS embedding_model text;
ALTER TABLE public.opportunities  ADD COLUMN IF NOT EXISTS embedding_model text;
ALTER TABLE public.prds           ADD COLUMN IF NOT EXISTS embedding_model text;
ALTER TABLE public.learnings      ADD COLUMN IF NOT EXISTS embedding_model text;
ALTER TABLE public.rag_chunks     ADD COLUMN IF NOT EXISTS embedding_model text;

CREATE INDEX IF NOT EXISTS signals_embedding_model_idx
  ON public.signals (embedding_model, created_at)
  WHERE embedding IS NOT NULL;
CREATE INDEX IF NOT EXISTS themes_embedding_model_idx
  ON public.themes (embedding_model, created_at)
  WHERE embedding IS NOT NULL;
CREATE INDEX IF NOT EXISTS agent_memory_embedding_model_idx
  ON public.agent_memory (embedding_model, created_at)
  WHERE embedding IS NOT NULL;
CREATE INDEX IF NOT EXISTS decisions_embedding_model_idx
  ON public.decisions (embedding_model, created_at)
  WHERE embedding IS NOT NULL;
CREATE INDEX IF NOT EXISTS opportunities_embedding_model_idx
  ON public.opportunities (embedding_model, created_at)
  WHERE embedding IS NOT NULL;
CREATE INDEX IF NOT EXISTS prds_embedding_model_idx
  ON public.prds (embedding_model, created_at)
  WHERE embedding IS NOT NULL;
CREATE INDEX IF NOT EXISTS learnings_embedding_model_idx
  ON public.learnings (embedding_model, created_at)
  WHERE embedding IS NOT NULL;
CREATE INDEX IF NOT EXISTS rag_chunks_embedding_model_idx
  ON public.rag_chunks (embedding_model, created_at)
  WHERE embedding IS NOT NULL;

-- ===== 20260803000100_add_judgment_match_rpcs.sql =====
CREATE OR REPLACE FUNCTION public.match_decisions(
  query_embedding vector(1536),
  match_count int DEFAULT 8,
  for_user uuid DEFAULT NULL,
  embedding_model text DEFAULT NULL
) RETURNS TABLE (id uuid, title text, rationale text, similarity float)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT d.id, d.title, d.rationale, 1 - (d.embedding <=> query_embedding) AS similarity
  FROM public.decisions d
  WHERE d.embedding IS NOT NULL
    AND (for_user IS NULL OR d.user_id = for_user)
    AND (embedding_model IS NULL OR d.embedding_model = embedding_model)
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION public.match_opportunities(
  query_embedding vector(1536),
  match_count int DEFAULT 8,
  for_user uuid DEFAULT NULL,
  embedding_model text DEFAULT NULL
) RETURNS TABLE (id uuid, title text, problem text, similarity float)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT o.id, o.title, o.problem, 1 - (o.embedding <=> query_embedding) AS similarity
  FROM public.opportunities o
  WHERE o.embedding IS NOT NULL
    AND (for_user IS NULL OR o.user_id = for_user)
    AND (embedding_model IS NULL OR o.embedding_model = embedding_model)
  ORDER BY o.embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION public.match_prds(
  query_embedding vector(1536),
  match_count int DEFAULT 8,
  for_user uuid DEFAULT NULL,
  embedding_model text DEFAULT NULL
) RETURNS TABLE (id uuid, title text, body_md text, similarity float)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT p.id, p.title, p.body_md, 1 - (p.embedding <=> query_embedding) AS similarity
  FROM public.prds p
  WHERE p.embedding IS NOT NULL
    AND (for_user IS NULL OR p.user_id = for_user)
    AND (embedding_model IS NULL OR p.embedding_model = embedding_model)
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION public.match_learnings(
  query_embedding vector(1536),
  match_count int DEFAULT 8,
  for_user uuid DEFAULT NULL,
  embedding_model text DEFAULT NULL
) RETURNS TABLE (id uuid, summary text, similarity float)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT l.id, l.summary, 1 - (l.embedding <=> query_embedding) AS similarity
  FROM public.learnings l
  WHERE l.embedding IS NOT NULL
    AND (for_user IS NULL OR l.user_id = for_user)
    AND (embedding_model IS NULL OR l.embedding_model = embedding_model)
  ORDER BY l.embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION public.match_signals(
  query_embedding vector(1536),
  match_count int DEFAULT 8,
  for_user uuid DEFAULT NULL,
  embedding_model text DEFAULT NULL
) RETURNS TABLE (id uuid, content text, title text, similarity float)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT s.id, s.content, s.title, 1 - (s.embedding <=> query_embedding) AS similarity
  FROM public.signals s
  WHERE s.embedding IS NOT NULL
    AND (for_user IS NULL OR s.user_id = for_user)
    AND (embedding_model IS NULL OR s.embedding_model = embedding_model)
  ORDER BY s.embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION public.match_themes(
  query_embedding vector(1536),
  match_count int DEFAULT 8,
  for_user uuid DEFAULT NULL,
  embedding_model text DEFAULT NULL
) RETURNS TABLE (id uuid, title text, summary text, similarity float)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT t.id, t.title, t.summary, 1 - (t.embedding <=> query_embedding) AS similarity
  FROM public.themes t
  WHERE t.embedding IS NOT NULL
    AND (for_user IS NULL OR t.user_id = for_user)
    AND (embedding_model IS NULL OR t.embedding_model = embedding_model)
  ORDER BY t.embedding <=> query_embedding
  LIMIT match_count;
$$;