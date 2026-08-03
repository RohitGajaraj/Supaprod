-- Repair a live retrieval outage: drop two match_* overloads that made the function
-- name ambiguous, so Postgres could no longer choose which one to call.
--
-- WHAT BROKE, AND THE PROOF IT WAS BROKEN. On 2026-08-03 migration
-- 20260803095240_dd33bed2-8a37-4eb9-a8e6-fb2637c8a75d.sql (lines 354 and 370) ran
-- against production and added a second four-argument overload to both
-- match_signals and match_themes. Calling either one then failed outright:
--
--   ERROR:  42725: function match_themes(query_embedding => vector, for_user => uuid,
--           match_count => integer) is not unique
--   HINT:  Could not choose a best candidate function.
--
-- That is the exact named-argument shape `src/lib/ai/cluster.server.ts:299` uses to
-- attach a signal to a theme, so theme growth was dead, not degraded. match_signals
-- failed the same way for any three-argument call.
--
-- WHY IT HAPPENED, because this is the reusable lesson. CREATE OR REPLACE FUNCTION
-- replaces a function ONLY when the argument list matches exactly. Change the
-- arguments and Postgres does not replace anything, it silently creates an ADDITIONAL
-- overload. The two pairs then collided:
--
--   live      match_signals(vector, integer, uuid, for_product uuid)
--   added     match_signals(vector, integer, uuid, embedding_model text)
--   live      match_themes(vector, for_user uuid, exclude_id uuid, match_count integer)
--   added     match_themes(vector, integer, uuid, embedding_model text)
--
-- Same arity, and for match_signals the first three arguments are identical with only
-- the fourth type differing. Every argument the callers actually pass is satisfied by
-- both candidates, so there is no best match and resolution fails. A migration that
-- "adds an optional parameter" to an existing function is therefore never additive:
-- it either matches the signature exactly, or it forks the function.
--
-- WHAT THIS FILE DOES NOT DO. It does not restore an embedding_model filter on these
-- two functions. Model scoping is a real requirement (see
-- 20260803000000_add_embedding_model_tracking.sql) but it has to be done by appending
-- to the EXACT existing signature so CREATE OR REPLACE genuinely replaces, and every
-- live caller has to be checked first. Getting retrieval working again does not wait
-- on that design.
--
-- STILL OPEN, tracked deliberately rather than fixed here. The same migration created
-- match_decisions, match_opportunities, match_prds and match_learnings scoped only by
-- an optional `for_user`, while the convention every comparable function in this schema
-- follows is `s.user_id = auth.uid() AND public.is_workspace_member(s.workspace_id)`
-- (see match_signals' body). Those four are contained today rather than dangerous:
-- RLS is enabled with policies on all four tables and the functions are LANGUAGE sql
-- STABLE with no SECURITY DEFINER, so they execute as the caller and RLS applies. No
-- application code calls them yet either. They should be rewritten to the convention
-- before anything does, and a membership-scoped version is what the product's
-- "the record travels with the workspace" claim actually requires.

DROP FUNCTION IF EXISTS public.match_signals(vector, integer, uuid, text);
DROP FUNCTION IF EXISTS public.match_themes(vector, integer, uuid, text);

-- Guard: fail loudly if either name is still ambiguous after the drops, rather than
-- letting a later reader assume this migration worked. One row per name is correct.
DO $$
DECLARE
  n_signals int;
  n_themes  int;
BEGIN
  SELECT count(*) INTO n_signals FROM pg_proc p
    JOIN pg_namespace ns ON ns.oid = p.pronamespace
    WHERE ns.nspname = 'public' AND p.proname = 'match_signals';
  SELECT count(*) INTO n_themes FROM pg_proc p
    JOIN pg_namespace ns ON ns.oid = p.pronamespace
    WHERE ns.nspname = 'public' AND p.proname = 'match_themes';

  IF n_signals <> 1 THEN
    RAISE EXCEPTION 'match_signals still has % overloads, expected exactly 1', n_signals;
  END IF;
  IF n_themes <> 1 THEN
    RAISE EXCEPTION 'match_themes still has % overloads, expected exactly 1', n_themes;
  END IF;
END $$;
