-- Repair memory recall: match_agent_memory has two overloads and is therefore
-- unresolvable, so every recall path in the product has been failing silently.
--
-- THIS IS THE COMPANY-BRAIN LAYER, AND IT IS DEAD IN PRODUCTION. Verified live:
--
--   select count(*) from match_agent_memory(
--     query_embedding => array_fill(0::real, ARRAY[1536])::vector,
--     for_user => '000...0'::uuid, for_agent_slug => 'critic',
--     match_count => 5, for_workspace => '000...0'::uuid);
--
--   ERROR:  42725: function match_agent_memory(query_embedding => vector,
--           for_user => uuid, for_agent_slug => unknown, match_count => integer,
--           for_workspace => uuid) is not unique
--   HINT:  Could not choose a best candidate function.
--
-- That is the exact named-argument payload the code sends. All four callers are
-- affected, and each of them passes for_user, so none escapes:
--   src/lib/ai/memory.server.ts:111        recall injected into an agent's prompt
--   src/lib/ai/decision-precedent.server.ts:99  the Critic's precedent lookup
--   src/lib/brain/novelty.server.ts:42     novelty scoring
--   src/lib/memory-candidates.functions.ts:103  memory candidates
--
-- WHY NOBODY NOTICED, which is the part worth fixing culturally. Every one of those
-- call sites tolerates exactly one error code, `PGRST202` ("that overload does not
-- exist yet"), as a deliberate pre-migration grace. Ambiguity returns `PGRST203`
-- instead, which no caller handles, so it falls through to a generic non-fatal branch
-- and recall simply returns nothing. A brain that recalls nothing and a brain with
-- nothing to recall are indistinguishable from the outside. `error_events` contains no
-- PGRST203 row at all, which is consistent with the error being swallowed rather than
-- with it not happening.
--
-- WHY DROPPING ONE IS SAFE. The two bodies are BYTE-IDENTICAL (md5 5ab9685d83d6b450
-- 95b27d76a46e4855, length 1864, both prosecdef=true), so this changes no behaviour.
-- They differ only in argument ORDER, defaults, and grants:
--
--   oid 24489  (vector, for_user uuid, for_agent_slug text, match_count int DEFAULT 6,
--               for_workspace uuid, for_account uuid)
--              acl: postgres, authenticated, service_role, sandbox_exec
--   oid 28220  (vector, match_count int DEFAULT 5, for_user uuid DEFAULT NULL,
--               for_agent_slug text, for_workspace uuid, for_account uuid)
--              acl: PUBLIC (=X), anon, postgres, authenticated, service_role, sandbox_exec
--
-- 28220 is the one dropped, for two independent reasons. It grants EXECUTE to PUBLIC
-- and to `anon` on a SECURITY DEFINER function that reads agent_memory, which is the
-- looser posture of the two; and keeping 24489 costs nothing, because every caller
-- passes for_user and match_count explicitly, so neither its required for_user nor its
-- DEFAULT 6 can change any live call.
--
-- Note that the parameter NAME sets are identical, which is precisely why PostgREST
-- cannot disambiguate by name and why this could never have resolved on its own.

DROP FUNCTION IF EXISTS public.match_agent_memory(vector, integer, uuid, text, uuid, uuid);

-- Guard: exactly one overload must remain, or recall is still unresolvable and a later
-- reader must not be able to assume this worked.
DO $$
DECLARE n int;
BEGIN
  SELECT count(*) INTO n FROM pg_proc p
    JOIN pg_namespace ns ON ns.oid = p.pronamespace
    WHERE ns.nspname = 'public' AND p.proname = 'match_agent_memory';
  IF n <> 1 THEN
    RAISE EXCEPTION 'match_agent_memory has % overloads, expected exactly 1', n;
  END IF;
END $$;
