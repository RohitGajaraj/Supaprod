-- Fix a silent ai_events logging failure for every service-role (cron) AI call.
--
-- Incident: 2026-07-01 cluster-tick investigation. The cluster-tick cron hook
-- (src/routes/api/public/hooks/cluster-tick.ts) runs under supabaseAdmin (service role,
-- auth.uid() is null) and every AI call it makes through callModel() was failing to
-- persist its ai_events row, with the insert error silently swallowed by the
-- `catch (e) { console.error("ai_events insert failed:", e); }` in runtime.server.ts. This
-- left zero DB evidence for a real, separate bug (cluster.server.ts mis-shaping a valid
-- model response as "invalid JSON" — fixed in src/lib/ai/cluster.server.ts) and, more
-- broadly, blinds observability for every cron-driven AI surface (cluster-tick, sense-tick,
-- steward-tick, the scheduled brief, …), not just this one.
--
-- Root cause: ai_events.workspace_id is NOT NULL, defaulting to
-- current_user_default_workspace() -> ensure_user_default_workspace(auth.uid()). The
-- runtime.server.ts INSERT omits workspace_id (relying on that default), which is correct
-- for a real user session (auth.uid() resolves) but not for a service-role caller
-- (auth.uid() is null). ensure_user_default_workspace(NULL) did not short-circuit: it fell
-- through to `INSERT INTO workspaces (owner_id, name) VALUES (NULL, 'My Workspace')`, whose
-- own trigger cascades into `INSERT INTO accounts (owner_id) VALUES (NULL)` — and
-- accounts.owner_id is NOT NULL, so the whole ai_events insert aborted with a nested
-- constraint violation. Reproduced live via a direct probe insert (see the cluster-tick
-- incident notes) before this fix.
--
-- This migration:
--   1. Makes ensure_user_default_workspace(NULL) return NULL immediately instead of
--      cascading into that crash — a NULL caller has no personal workspace to provision,
--      full stop.
--   2. Drops the NOT NULL constraint on ai_events.workspace_id, since a system/service-role
--      event genuinely may have no resolvable workspace (the column default can now safely
--      evaluate to NULL for that case) — analytics on this column already tolerate NULL
--      (see WM-F1's identical pattern on the agent-memory tables).
--
-- The app-side fix (runtime.server.ts) additionally passes opts.workspaceId explicitly into
-- every ai_events insert when the caller already has one (cluster-tick does), so the DEFAULT
-- is only ever relied on for the real user-session path where auth.uid() is meaningful — this
-- migration is the safety net for callers that still hit the default with no auth context.

CREATE OR REPLACE FUNCTION public.ensure_user_default_workspace(_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  existing_workspace_id uuid;
  created_workspace_id uuid;
BEGIN
  -- A NULL caller (service-role context, e.g. a cron job with no auth.uid()) has no
  -- personal workspace to provision. Returning NULL here (instead of falling through to
  -- the INSERT below) avoids a cascading NOT NULL violation on accounts.owner_id when this
  -- runs as a column DEFAULT for a service-role insert (e.g. ai_events from cluster-tick).
  IF _user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT m.workspace_id
    INTO existing_workspace_id
  FROM public.workspace_members m
  WHERE m.user_id = _user_id
  ORDER BY m.created_at
  LIMIT 1;

  IF existing_workspace_id IS NOT NULL THEN
    RETURN existing_workspace_id;
  END IF;

  SELECT w.id
    INTO existing_workspace_id
  FROM public.workspaces w
  WHERE w.owner_id = _user_id
  ORDER BY w.created_at
  LIMIT 1;

  IF existing_workspace_id IS NOT NULL THEN
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (existing_workspace_id, _user_id, 'owner')
    ON CONFLICT (workspace_id, user_id) DO NOTHING;
    RETURN existing_workspace_id;
  END IF;

  INSERT INTO public.workspaces (owner_id, name)
  VALUES (_user_id, 'My Workspace')
  RETURNING id INTO created_workspace_id;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (created_workspace_id, _user_id, 'owner')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  RETURN created_workspace_id;
END;
$function$;

ALTER TABLE public.ai_events ALTER COLUMN workspace_id DROP NOT NULL;
