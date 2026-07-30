-- REVERTS the id scatter in 20260730150000, because it broke cloning outright.
--
-- WHAT 20260730150000 TRIED TO DO, and it was a fair goal. Demo clones pasted
-- the target prefix onto every source id, so every row in a demo workspace
-- began '60000000' and every audit tag rendered the same six characters:
-- OPP-600000 matched six real opportunities. It replaced the paste with
-- md5(prefix || ':' || source_id), which does scatter the shorts. The
-- arithmetic was verified. The scheme still cannot work, for a reason no amount
-- of reading the migration would have surfaced.
--
-- WHY IT CANNOT WORK. `clone_demo_workspace` DOES NOT CLONE THE `projects`
-- TABLE. Confirmed against the live database:
--
--   select count(*) from pg_proc
--    where proname = 'clone_demo_workspace'
--      and pg_get_functiondef(oid) like '%into public.projects%';   -- 0
--
-- The four demo products already exist in each demo workspace, provisioned
-- separately, carrying PASTED ids: source '10000000-...-a1' has a counterpart
-- '60000000-...-a1' that is already sitting there. So every foreign key the
-- clone writes into `projects` is only valid under the paste.
--
-- Under the scatter, `demo_remap('10000000-...-a1')` returns '444a7946-...',
-- a row nothing has ever created, and the clone dies on the first table that
-- references a product:
--
--   23503 themes_product_id_fkey:
--     Key (product_id)=(adbadcd9-...) is not present in table "projects"
--
-- The failure is transactional, so no workspace was left half-built, but EVERY
-- clone has failed since 20260730150000 applied. A broken clone is strictly
-- worse than colliding tags, and the collision itself is already neutralised in
-- application code: `getEntityLineage` returns `ambiguous` with the candidate
-- rows and refuses to pick, so the product can no longer be confidently wrong
-- about an id in any workspace, seeded or not. Only the convenience was lost.
--
-- ATTEMPTED FIRST, AND RECORDED BECAUSE IT LOOKED RIGHT. The two remappers had
-- also stopped agreeing: `demo_remap_pk` derived every id while `demo_remap`
-- derived only ids starting with '10000000'. Giving them the same predicate is
-- a real improvement and it did NOT fix this, because the mismatch is not
-- between the two functions, it is between the clone and rows the clone never
-- writes. Reading the diff produced a plausible cause; running it produced the
-- true one.
--
-- IF THE SCATTER IS WANTED LATER, the prerequisite is to make
-- `clone_demo_workspace` clone `projects` too, so every id the clone references
-- is an id the clone created. Until then the paste is load-bearing.

CREATE OR REPLACE FUNCTION public.demo_remap_pk(p_id uuid, p_prefix text)
 RETURNS uuid
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select case
    when p_id is null then null
    when left(p_id::text, 8) = '10000000' then (p_prefix || substr(p_id::text, 9))::uuid
    else p_id
  end
$function$;

CREATE OR REPLACE FUNCTION public.demo_remap(p_id uuid, p_prefix text)
 RETURNS uuid
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select case
    when p_id is null then null
    when left(p_id::text, 8) = '10000000' then (p_prefix || substr(p_id::text, 9))::uuid
    else p_id
  end
$function$;

-- `demo_derive_id` is deliberately LEFT IN PLACE. It is correct, it is unused
-- now, and it is the piece a future fix would reuse once the clone owns
-- `projects`. Dropping it would throw away the only part of 20260730150000
-- that was right.

REVOKE EXECUTE ON FUNCTION public.demo_remap_pk(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.demo_remap(uuid, text) FROM PUBLIC, anon;

-- APPLIED AND VERIFIED LIVE 2026-07-30 20:35 IST: harbor@ re-cloned
-- successfully after this revert. 22 opportunities, 20 missions, 25 decisions,
-- 16 themes, 4 projects, 3 pending approvals. Demo tags still collide; that is
-- the accepted trade until the clone owns `projects`.
