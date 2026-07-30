-- Demo clone: give every cloned row a DISTINCT audit tag.
--
-- THE BUG, found 2026-07-30 while wiring audit-tag lookup into Ask.
-- Every core entity prints a trace tag built from the first six hex of its uuid
-- (`auditShort` in src/lib/audit-id.ts, printed as `MIS·7E7D59`). The clone in
-- 20260725140000 builds a target id by swapping the source's leading eight hex
-- for the target workspace prefix and keeping the rest:
--
--   10000000-0005-4000-8000-000000000002  ->  60000000-0005-4000-8000-000000000002
--
-- so EVERY row in a demo workspace begins `60000000` and every tag in it is
-- `600000`. All twelve traceable kinds collapse onto one short per workspace.
-- Asking "what happened with MIS·600000" in the harbor workspace matches three
-- missions; `OPP·600000` matches six opportunities. The resolver is right to
-- answer "this tag matches N records" (see resolveEntityLineage), but the data
-- made a correct product look broken, and it made the one demo beat that shows
-- provenance impossible to actually demo.
--
-- The source Helio workspace has the same defect for the same reason: its seed
-- ids are hand written and all start `10000000`. This is not specific to the
-- clone; the clone just propagates it.
--
-- THE FIX. Derive the whole target uuid from md5(prefix || ':' || source id)
-- rather than pasting a shared prefix on the front. Verified before writing:
-- valid v4 shape, deterministic, different per target prefix, and sixteen
-- distinct shorts across a sample where the old scheme produced exactly one.
--
-- WHY FK INTEGRITY IS UNCHANGED. `demo_remap` (foreign keys) and
-- `demo_remap_pk` (primary keys) both derive from the same pure function of the
-- same two inputs, so a foreign key still lands on the row it named. The branch
-- STRUCTURE is deliberately identical to the old functions, including
-- `demo_remap`'s pass-through for ids that are not from the source workspace
-- (real users, shared rows), so nothing that worked before changes shape. Only
-- the value a hashed branch returns is different.
--
-- THE ONE ID THAT MUST NOT MOVE is the workspace itself. `clone_demo_workspace`
-- resolves its target as `<prefix>-0000-4000-8000-000000000000` and refuses to
-- run unless a workspace with exactly that id exists, and every `workspace_id`
-- column has to point at it. The old prefix swap produced that value for free;
-- hashing would not, so it is now an explicit first branch. It is also the only
-- row involved that is not itself audit-tagged, so pinning it costs nothing.
--
-- >>> THIS MIGRATION CHANGES NO DATA. <<<
-- It redefines two helper functions and nothing else. Existing demo workspaces
-- keep their colliding ids until someone re-runs `clone_demo_workspace` for a
-- prefix, which WIPES and rebuilds that workspace's content. Read
-- docs/operations/demo-credentials.md before doing that: a re-clone resets the
-- pending approval queue (the demo's signature beat) and inherits the short
-- `expires_at` values that decay within hours, so it needs the queue re-arm
-- afterwards. Do not re-clone a workspace that has been sent to anyone without
-- deciding to, and never inside a review window.

-- The shared derivation. Pure and IMMUTABLE, so both remappers and any future
-- caller agree by construction rather than by two copies staying in sync.
-- Layout mirrors the old md5 fallback: version nibble 4, variant nibble 8.
CREATE OR REPLACE FUNCTION public.demo_derive_id(p_id uuid, p_prefix text)
 RETURNS uuid
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select (substr(m, 1, 8) || '-' || substr(m, 9, 4) || '-4' || substr(m, 14, 3)
          || '-8' || substr(m, 17, 3) || '-' || substr(m, 20, 12))::uuid
  from (select md5(p_prefix || ':' || p_id::text) as m) s
$function$;

-- Foreign keys. Same three cases as before, plus the workspace pin.
CREATE OR REPLACE FUNCTION public.demo_remap(p_id uuid, p_prefix text)
 RETURNS uuid
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select case
    when p_id is null then null
    -- The clone's identity. Must stay exactly what clone_demo_workspace looks up.
    when p_id = '10000000-0000-4000-8000-000000000000'::uuid
      then (p_prefix || '-0000-4000-8000-000000000000')::uuid
    when left(p_id::text, 8) = '10000000' then public.demo_derive_id(p_id, p_prefix)
    -- Not from the source workspace: a real user, a shared row. Never mangled.
    else p_id
  end
$function$;

-- Primary keys. Every cloned row gets a derived id, which is what scatters the
-- shorts. The old function special-cased the '10000000' prefix here purely to
-- reuse the paste; with a single derivation both branches are the same value,
-- so the case collapses.
CREATE OR REPLACE FUNCTION public.demo_remap_pk(p_id uuid, p_prefix text)
 RETURNS uuid
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select case
    when p_id is null then null
    else public.demo_derive_id(p_id, p_prefix)
  end
$function$;

-- Matches the grants the 20260725140000 migration set on its helpers: these are
-- operator tools, never reachable from a browser session.
REVOKE EXECUTE ON FUNCTION public.demo_derive_id(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.demo_remap(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.demo_remap_pk(uuid, text) FROM PUBLIC, anon;

-- Re-clone commands, deliberately commented out. One prefix at a time, and read
-- the header above first.
--
-- select * from public.clone_demo_workspace('60000000', (select id from auth.users where email = 'harbor@supaprod.ai'));
-- select * from public.clone_demo_workspace('20000000', (select id from auth.users where email = 'voyage@supaprod.ai'));
-- select * from public.clone_demo_workspace('30000000', (select id from auth.users where email = 'compass@supaprod.ai'));
-- select * from public.clone_demo_workspace('40000000', (select id from auth.users where email = 'meridian@supaprod.ai'));
-- select * from public.clone_demo_workspace('50000000', (select id from auth.users where email = 'lantern@supaprod.ai'));
--
-- Verify afterwards that the shorts actually scattered (expect many rows, not one):
--   select count(distinct left(replace(id::text,'-',''), 6)) as shorts, count(*) as rows
--   from public.missions where workspace_id = '60000000-0000-4000-8000-000000000000';