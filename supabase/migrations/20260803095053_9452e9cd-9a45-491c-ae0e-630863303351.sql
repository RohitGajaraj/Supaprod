-- ===== 20260802170000_theme_growth_and_conditional_decline.sql =====
ALTER TABLE public.themes
  ADD COLUMN IF NOT EXISTS dismissed_at_frequency integer;

ALTER TABLE public.themes
  ADD COLUMN IF NOT EXISTS escalated_at timestamptz;

CREATE INDEX IF NOT EXISTS themes_growth_candidates_idx
  ON public.themes (user_id, last_signal_at DESC NULLS LAST)
  WHERE status IN ('new', 'dismissed', 'promoted');

CREATE INDEX IF NOT EXISTS signals_theme_id_idx
  ON public.signals (theme_id)
  WHERE theme_id IS NOT NULL;

-- ===== 20260802180000_changeset_code_review.sql =====
ALTER TABLE public.studio_changesets
  ADD COLUMN IF NOT EXISTS code_review jsonb;

-- ===== 20260802190000_agent_memory_workspace_visibility.sql =====
ALTER TABLE public.agent_memory
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'workspace';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agent_memory_visibility_check'
  ) THEN
    ALTER TABLE public.agent_memory
      ADD CONSTRAINT agent_memory_visibility_check
      CHECK (visibility IN ('workspace', 'private'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.user_in_workspace(ws uuid, uid uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members m
    WHERE m.workspace_id = ws AND m.user_id = uid
  );
$$;
REVOKE EXECUTE ON FUNCTION public.user_in_workspace(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.user_in_workspace(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "own agent_memory in member workspace" ON public.agent_memory;
DROP POLICY IF EXISTS "read own or workspace-shared agent_memory" ON public.agent_memory;
DROP POLICY IF EXISTS "write own agent_memory in member workspace" ON public.agent_memory;
DROP POLICY IF EXISTS "update own agent_memory in member workspace" ON public.agent_memory;
DROP POLICY IF EXISTS "delete own agent_memory in member workspace" ON public.agent_memory;

CREATE POLICY "read own or workspace-shared agent_memory"
  ON public.agent_memory FOR SELECT
  USING (
    public.is_workspace_member(workspace_id)
    AND (auth.uid() = user_id OR visibility = 'workspace')
  );

CREATE POLICY "write own agent_memory in member workspace"
  ON public.agent_memory FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_workspace_member(workspace_id));

CREATE POLICY "update own agent_memory in member workspace"
  ON public.agent_memory FOR UPDATE
  USING (auth.uid() = user_id AND public.is_workspace_member(workspace_id))
  WITH CHECK (auth.uid() = user_id AND public.is_workspace_member(workspace_id));

CREATE POLICY "delete own agent_memory in member workspace"
  ON public.agent_memory FOR DELETE
  USING (auth.uid() = user_id AND public.is_workspace_member(workspace_id));

CREATE OR REPLACE FUNCTION public.match_agent_memory(
  query_embedding vector, match_count integer DEFAULT 5, for_user uuid DEFAULT NULL,
  for_agent_slug text DEFAULT NULL, for_workspace uuid DEFAULT NULL, for_account uuid DEFAULT NULL
)
RETURNS TABLE(id uuid, content text, kind text, importance integer, agent_slug text, similarity double precision)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  with candidates as (
    select m.id, m.content, m.kind, m.importance, m.agent_slug, m.metadata,
           m.last_used_at, m.created_at,
           (m.embedding <=> query_embedding) as distance
    from public.agent_memory m
    where (
        m.user_id = coalesce(auth.uid(), for_user)
        or (
          m.visibility = 'workspace'
          and m.workspace_id is not null
          and (
            (auth.uid() is not null and public.is_workspace_member(m.workspace_id))
            or (auth.uid() is null and for_user is not null
                and public.user_in_workspace(m.workspace_id, for_user))
          )
        )
      )
      and m.embedding is not null
      and (m.expires_at is null or m.expires_at > now())
      and (
        (for_account is not null
          and (m.workspace_id is null
               or m.workspace_id in (select w.id from public.workspaces w where w.account_id = for_account)))
        or (for_account is null
          and (for_workspace is null or m.workspace_id = for_workspace or m.workspace_id is null))
      )
      and (for_account is null or auth.uid() is null or public.is_account_member(for_account))
      and (auth.uid() is null or m.workspace_id is null or public.is_workspace_member(m.workspace_id))
      and (for_agent_slug is null or m.agent_slug = for_agent_slug or m.scope = 'global')
    order by m.embedding <=> query_embedding
    limit greatest(match_count * 4, 20)
  )
  select c.id, c.content, c.kind, c.importance, c.agent_slug,
         1 - c.distance as similarity
  from candidates c
  order by
    c.distance
    + case c.metadata->>'verdict' when 'validated' then -0.05 when 'missed' then 0.05 else 0 end
    - (coalesce(c.importance, 3) - 3) * 0.01
    + (1 - exp(-extract(epoch from (now() - coalesce(c.last_used_at, c.created_at))) / 3600.0 / 72.0)) * 0.02
  limit match_count;
$function$;

CREATE OR REPLACE FUNCTION public.match_agent_memory(
  query_embedding vector, for_user uuid, for_agent_slug text DEFAULT NULL,
  match_count integer DEFAULT 6, for_workspace uuid DEFAULT NULL, for_account uuid DEFAULT NULL
)
RETURNS TABLE(id uuid, content text, kind text, importance integer, agent_slug text, similarity double precision)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  with candidates as (
    select m.id, m.content, m.kind, m.importance, m.agent_slug, m.metadata,
           m.last_used_at, m.created_at,
           (m.embedding <=> query_embedding) as distance
    from public.agent_memory m
    where (
        m.user_id = coalesce(auth.uid(), for_user)
        or (
          m.visibility = 'workspace'
          and m.workspace_id is not null
          and (
            (auth.uid() is not null and public.is_workspace_member(m.workspace_id))
            or (auth.uid() is null and for_user is not null
                and public.user_in_workspace(m.workspace_id, for_user))
          )
        )
      )
      and m.embedding is not null
      and (m.expires_at is null or m.expires_at > now())
      and (
        (for_account is not null
          and (m.workspace_id is null
               or m.workspace_id in (select w.id from public.workspaces w where w.account_id = for_account)))
        or (for_account is null
          and (for_workspace is null or m.workspace_id = for_workspace or m.workspace_id is null))
      )
      and (for_account is null or auth.uid() is null or public.is_account_member(for_account))
      and (auth.uid() is null or m.workspace_id is null or public.is_workspace_member(m.workspace_id))
      and (for_agent_slug is null or m.agent_slug = for_agent_slug or m.scope = 'global')
    order by m.embedding <=> query_embedding
    limit greatest(match_count * 4, 20)
  )
  select c.id, c.content, c.kind, c.importance, c.agent_slug,
         1 - c.distance as similarity
  from candidates c
  order by
    c.distance
    + case c.metadata->>'verdict' when 'validated' then -0.05 when 'missed' then 0.05 else 0 end
    - (coalesce(c.importance, 3) - 3) * 0.01
    + (1 - exp(-extract(epoch from (now() - coalesce(c.last_used_at, c.created_at))) / 3600.0 / 72.0)) * 0.02
  limit match_count;
$function$;

CREATE INDEX IF NOT EXISTS agent_memory_workspace_shared_idx
  ON public.agent_memory (workspace_id)
  WHERE visibility = 'workspace' AND embedding IS NOT NULL;

-- ===== 20260802191000_reflections_workspace_visibility.sql =====
CREATE OR REPLACE FUNCTION public.recent_agent_reflections(
  for_user uuid, for_agent_slug text, match_count integer DEFAULT 5,
  for_workspace uuid DEFAULT NULL, for_account uuid DEFAULT NULL
)
RETURNS TABLE(id uuid, content text, importance integer, metadata jsonb, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
  select m.id, m.content, m.importance, m.metadata, m.created_at
  from public.agent_memory m
  where (
      m.user_id = coalesce(auth.uid(), for_user)
      or (m.visibility = 'workspace' and m.workspace_id is not null and (
            (auth.uid() is not null and public.is_workspace_member(m.workspace_id))
            or (auth.uid() is null and for_user is not null
                and public.user_in_workspace(m.workspace_id, for_user))))
    )
    and m.kind = 'reflection'
    and (
      (for_account is not null
        and (m.workspace_id is null
             or m.workspace_id in (select w.id from public.workspaces w where w.account_id = for_account)))
      or (for_account is null
        and (for_workspace is null or m.workspace_id = for_workspace or m.workspace_id is null))
    )
    and (for_account is null or auth.uid() is null or public.is_account_member(for_account))
    and (auth.uid() is null or m.workspace_id is null or public.is_workspace_member(m.workspace_id))
    and (for_agent_slug is null or m.agent_slug = for_agent_slug or m.scope = 'global')
  order by m.importance desc, m.created_at desc
  limit greatest(1, least(match_count, 20));
$function$;

-- ===== 20260802200000_enforce_seat_limit_on_membership.sql =====
CREATE OR REPLACE FUNCTION public.enforce_workspace_seat_limit()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public' AS $$
DECLARE
  v_tier text;
  v_seat_limit integer;
  v_used integer;
BEGIN
  IF NOT public.limit_gates_enabled() THEN
    RETURN NEW;
  END IF;

  SELECT a.plan_tier INTO v_tier
  FROM public.workspaces w
  JOIN public.accounts a ON a.id = w.account_id
  WHERE w.id = NEW.workspace_id;

  v_seat_limit := public.tier_seat_limit(v_tier);
  IF v_seat_limit IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT count(*) INTO v_used
  FROM public.workspace_members
  WHERE workspace_id = NEW.workspace_id;

  IF v_used >= v_seat_limit THEN
    RAISE EXCEPTION
      'Seat limit reached: the % plan includes % seat(s) per workspace. Upgrade to Team to add people.',
      coalesce(v_tier, 'current'), v_seat_limit
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_workspace_seat_limit_trigger ON public.workspace_members;
CREATE TRIGGER enforce_workspace_seat_limit_trigger
  BEFORE INSERT ON public.workspace_members
  FOR EACH ROW EXECUTE FUNCTION public.enforce_workspace_seat_limit();

-- ===== 20260802210000_prd_scaffolds_agent_source.sql =====
ALTER TABLE public.prd_scaffolds DROP CONSTRAINT IF EXISTS prd_scaffolds_source_check;
ALTER TABLE public.prd_scaffolds
  ADD CONSTRAINT prd_scaffolds_source_check
  CHECK (source IN ('manual', 'speculative', 'agent'));

-- ===== 20260802220000_liveness_tick_cron.sql =====
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  base_url text := 'https://project--371dd588-1b70-4629-9bb5-9f003f3af373.lovable.app';
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'liveness-tick';
  PERFORM cron.schedule(
    'liveness-tick',
    '20 6 * * *',
    format($job$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-cron-key', public.get_cron_hook_secret()
        ),
        body := '{}'::jsonb
      ) AS request_id;
    $job$, base_url || '/api/public/hooks/liveness-tick')
  );
END $$;

-- ===== 20260802230000_workspace_autonomy_policy.sql =====
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS promotion_min_frequency integer,
  ADD COLUMN IF NOT EXISTS promotion_min_severity integer,
  ADD COLUMN IF NOT EXISTS promotion_min_confidence numeric(3, 2),
  ADD COLUMN IF NOT EXISTS settle_evidence_floor numeric(3, 2),
  ADD COLUMN IF NOT EXISTS settle_stakes_span numeric(3, 2),
  ADD COLUMN IF NOT EXISTS never_settle_above_impact integer;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workspaces_promotion_min_frequency_range') THEN
    ALTER TABLE public.workspaces
      ADD CONSTRAINT workspaces_promotion_min_frequency_range
        CHECK (promotion_min_frequency IS NULL OR promotion_min_frequency BETWEEN 1 AND 100),
      ADD CONSTRAINT workspaces_promotion_min_severity_range
        CHECK (promotion_min_severity IS NULL OR promotion_min_severity BETWEEN 1 AND 5),
      ADD CONSTRAINT workspaces_promotion_min_confidence_range
        CHECK (promotion_min_confidence IS NULL OR promotion_min_confidence BETWEEN 0 AND 1),
      ADD CONSTRAINT workspaces_settle_evidence_floor_range
        CHECK (settle_evidence_floor IS NULL OR settle_evidence_floor BETWEEN 0 AND 1),
      ADD CONSTRAINT workspaces_settle_stakes_span_range
        CHECK (settle_stakes_span IS NULL OR settle_stakes_span BETWEEN 0 AND 1),
      ADD CONSTRAINT workspaces_never_settle_above_impact_range
        CHECK (never_settle_above_impact IS NULL OR never_settle_above_impact BETWEEN 1 AND 10);
  END IF;
END $$;

COMMENT ON COLUMN public.workspaces.promotion_min_frequency IS
  'How many independent signals must say it before a cluster becomes work on its own. NULL means the workspace has not stated one and the shipped bar of 8 applies (src/lib/spine/promote.ts DEFAULT_PROMOTION_BAR). Set on /boundary.';
COMMENT ON COLUMN public.workspaces.promotion_min_severity IS
  'How much a cluster must hurt the people who reported it, 1 to 5, before it becomes work on its own. NULL means the shipped bar of 4 applies. Set on /boundary.';
COMMENT ON COLUMN public.workspaces.promotion_min_confidence IS
  'How sure the clustering must be that the signals belong together, 0 to 1, before work starts. NULL means the shipped bar of 0.75 applies. Set on /boundary.';
COMMENT ON COLUMN public.workspaces.settle_evidence_floor IS
  'The share of the evidence an agent needs before it settles an outcome verdict on which nothing rides, 0 to 1. NULL means the shipped floor of 0.45 applies (src/lib/ai/outcome-review.ts SETTLE_FLOOR). Three hard gates sit above this and no value here can lower them. Set on /boundary.';
COMMENT ON COLUMN public.workspaces.settle_stakes_span IS
  'How much higher that evidence bar climbs at maximum stakes, 0 to 1. NULL means the shipped span of 0.40 applies (SETTLE_STAKES_SPAN), so a verdict with everything riding on it needs 0.85. Set on /boundary.';
COMMENT ON COLUMN public.workspaces.never_settle_above_impact IS
  'The stated carve-out: an agent never settles a verdict on a bet scored ABOVE this impact, whatever the evidence says. NULL means no carve-out, which is a real answer and not a missing one. It can only ever escalate, never hand an agent a call the rule refused. Set on /boundary.';

-- ===== 20260802240000_landing_session_claims.sql =====
CREATE TABLE IF NOT EXISTS public.landing_session_claims (
  session_key text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  claimed_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS landing_session_claims_user_idx
  ON public.landing_session_claims (user_id);

GRANT ALL ON public.landing_session_claims TO service_role;

ALTER TABLE public.landing_session_claims ENABLE ROW LEVEL SECURITY;