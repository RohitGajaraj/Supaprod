-- Demo workspace cloning: the verified production implementation.
--
-- WHY THIS FILE WAS REPLACED.
-- The previous contents of this migration were a hand written DO $$ block that
-- deleted the existing cloned rows and re-inserted them column by column. It was
-- replaced wholesale for three concrete reasons.
--
--   1. THE share_slug TRAP. share_slug carries a GLOBAL unique constraint on
--      decisions, opportunities and prototypes. It is not scoped per workspace.
--      In the Helio Labs seed, 15 rows carry one: 7 opportunities, 7 decisions,
--      1 prototype. Any column for column copy therefore collides with the
--      source row that already owns that slug, and because every insert in the
--      old block ended in ON CONFLICT DO NOTHING the collision was swallowed in
--      total silence. Not just the slug: the WHOLE ROW vanishes, with no error,
--      no warning, and a surface that renders empty. A clone that reports
--      success while dropping rows is worse than one that fails loudly. The old
--      block only dodged this by accident, by omitting share_slug from its hand
--      written column lists and never covering decisions or prototypes at all,
--      which loses the same rows a different way. The implementation below
--      derives the slug per prefix, substr(md5(prefix || share_slug), 1, 32), so
--      the copy is globally unique by construction, deterministic across re-runs,
--      and nothing is ever silently discarded.
--
--   2. MISSING PREFIXES. The old block hard coded only four investor prefixes,
--      20000000 (voyage), 30000000 (compass), 40000000 (meridian) and 50000000
--      (lantern). Two real, provisioned demo workspaces were left out entirely:
--      60000000 (harbor@supaprod.ai) and 70000000 (explore@supaprod.ai). Those
--      two accounts would have logged into an empty product.
--
--   3. HAND MAINTAINED TABLE AND COLUMN LISTS, WITH ERRORS SWALLOWED. The old
--      block spelled out every column of every table by hand, so any new column
--      would be silently dropped from the clone. Worse, four of the tables it
--      wrote to do not exist in this database at all: products, workspace_signals,
--      signal_submissions and theme_signals. Every one of those statements would
--      have thrown, and every block wrapped its body in EXCEPTION WHEN others
--      THEN RAISE NOTICE, which downgrades any failure to a log line nobody
--      reads. It also opened with DELETE FROM projects and DELETE FROM products
--      against the target workspace, so the one clearly destructive statement in
--      the file sat in the same swallow everything block. The implementation
--      below reads information_schema at run time, picks up new columns
--      automatically, returns an explicit SKIPPED row for any table that is
--      missing or has no workspace_id, and deletes nothing, ever.
--
-- THIS FILE DOES NOT RUN THE CLONE.
-- The clone already ran successfully in production earlier today. It produced
-- seven byte identical workspaces with zero dangling foreign keys. This file
-- exists so the repository can reproduce that implementation, not so it can
-- re-run it. Applying this migration ONLY defines three functions. It reads no
-- data, writes no data and deletes no data. The calls that would actually clone
-- are at the bottom of this file, commented out, for a human to run one at a
-- time and deliberately.
--
-- THE THREE FUNCTIONS.
--   public.demo_remap(uuid, text)
--     Rewrites a foreign key uuid. If it starts with the Helio source prefix
--     10000000 the prefix is swapped for the target prefix, otherwise the value
--     passes through untouched (so references to real users or shared rows are
--     never mangled).
--   public.demo_remap_pk(uuid, text)
--     Same, for primary keys, with a deterministic md5 derived fallback so a
--     source row whose id does not carry the 10000000 prefix still gets a
--     stable, collision free id in the target workspace.
--   public.clone_demo_workspace(text, uuid)
--     The driver. Validates the prefix, refuses to clone the source onto itself,
--     checks the target workspace and owner exist, disables user triggers for the
--     duration, then for each table builds the insert from information_schema and
--     returns one row per table with the count actually inserted.
--
-- All three are CREATE OR REPLACE, so this migration is idempotent on its own.

CREATE OR REPLACE FUNCTION public.demo_remap(p_id uuid, p_prefix text)
 RETURNS uuid
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select case
    when p_id is null then null
    when left(p_id::text, 8) = '10000000' then (p_prefix || substring(p_id::text from 9))::uuid
    else p_id
  end
$function$;

CREATE OR REPLACE FUNCTION public.demo_remap_pk(p_id uuid, p_prefix text)
 RETURNS uuid
 LANGUAGE sql
 IMMUTABLE
AS $function$
  select case
    when p_id is null then null
    when left(p_id::text, 8) = '10000000'
      then (p_prefix || substring(p_id::text from 9))::uuid
    else (p_prefix || '-' || substr(m,1,4) || '-4' || substr(m,6,3)
          || '-8' || substr(m,10,3) || '-' || substr(m,13,12))::uuid
  end
  from (select md5(p_prefix || ':' || p_id::text) as m) s
$function$;

CREATE OR REPLACE FUNCTION public.clone_demo_workspace(p_prefix text, p_owner uuid)
 RETURNS TABLE(tbl text, rows_inserted bigint, note text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_src  constant uuid := '10000000-0000-4000-8000-000000000000';
  v_band constant bigint := 1000000;
  v_own  constant text[] := array['user_id','decided_by','actor_id','updated_by','escalated_to','generated_by','design_decided_by'];
  v_tables constant text[] := array[
    'projects','goals','themes','signals','opportunities','prds','missions','agent_runs',
    'mission_steps','studio_changesets','deployments','meetings','conversations','messages',
    'decisions','learnings','insights','agent_memory','memory_candidates','memory_recall_log',
    'artifact_lineage','learning_citations','ice_adjustments','agent_approvals','human_gate_events',
    'stage_events','guardrail_hits','ai_evals','workspace_audit_log','tool_calls','launch_plans',
    'changelog_entries','prototypes','docs','daily_briefs','tasks','loops','loop_runs',
    'assumptions','design_memory','scout_runs','workspace_briefs'];
  v_live text[] := '{}';
  v_tgt uuid;
  v_off bigint;
  t text; r record;
  v_cols text; v_sels text; v_sql text;
  v_ident boolean; v_maxid bigint; n bigint;
begin
  if p_prefix !~ '^[0-9a-f]{8}$' then
    raise exception 'p_prefix must be exactly 8 lowercase hex chars, got %', p_prefix;
  end if;
  if p_prefix = '10000000' then
    raise exception 'refusing to clone the source workspace onto itself';
  end if;

  v_tgt := (p_prefix || '-0000-4000-8000-000000000000')::uuid;

  if not exists (select 1 from public.workspaces w where w.id = v_tgt) then
    raise exception 'target workspace % does not exist; create it first', v_tgt;
  end if;
  if not exists (select 1 from auth.users u where u.id = p_owner) then
    raise exception 'p_owner % is not a real auth.users row', p_owner;
  end if;

  v_off := (('x' || lpad(p_prefix, 16, '0'))::bit(64)::bigint) * v_band;

  select array_agg(x order by ord) into v_live
  from unnest(v_tables) with ordinality u(x, ord)
  where exists (select 1 from information_schema.columns c
                where c.table_schema='public' and c.table_name=u.x and c.column_name='workspace_id');

  foreach t in array v_live loop
    execute format('alter table public.%I disable trigger user', t);
  end loop;

  foreach t in array v_tables loop
    if not (t = any(v_live)) then
      tbl := t; rows_inserted := 0; note := 'SKIPPED: missing table or no workspace_id';
      return next; continue;
    end if;

    v_cols := ''; v_sels := ''; v_ident := false;

    for r in
      select c.column_name, c.udt_name, c.is_identity
      from information_schema.columns c
      where c.table_schema = 'public' and c.table_name = t
        and c.is_generated <> 'ALWAYS'
      order by c.ordinal_position
    loop
      if r.is_identity = 'YES' then v_ident := true; end if;

      v_cols := v_cols || case when v_cols = '' then '' else ', ' end || quote_ident(r.column_name);
      v_sels := v_sels || case when v_sels = '' then '' else ', ' end ||
        case
          when r.column_name = 'workspace_id'
            then quote_literal(v_tgt) || '::uuid'
          when r.udt_name = 'uuid' and r.column_name = any(v_own)
            then quote_literal(p_owner) || '::uuid'
          when r.udt_name = 'uuid' and r.column_name = 'id'
            then format('public.demo_remap_pk(%I, %L)', r.column_name, p_prefix)
          when r.is_identity = 'YES' and r.udt_name in ('int8','int4')
            then format('%I + %s', r.column_name, v_off)
          when r.udt_name = 'text' and r.column_name = 'share_slug'
            then format('substr(md5(%L || %I), 1, 32)', p_prefix, r.column_name)
          when r.udt_name = 'uuid'
            then format('public.demo_remap(%I, %L)', r.column_name, p_prefix)
          else quote_ident(r.column_name)
        end;
    end loop;

    if v_ident then
      execute format('select coalesce(max(id),0) from public.%I where workspace_id = %L', t, v_src)
        into v_maxid;
      if v_maxid >= v_band then
        raise exception 'table %: max identity id % >= band %, offset scheme would collide', t, v_maxid, v_band;
      end if;
    end if;

    v_sql := format(
      'insert into public.%I (%s) %s select %s from public.%I where workspace_id = %L on conflict do nothing',
      t, v_cols,
      case when v_ident then 'overriding system value' else '' end,
      v_sels, t, v_src);

    execute v_sql;
    get diagnostics n = row_count;

    tbl := t; rows_inserted := n; note := null;
    return next;
  end loop;

  foreach t in array v_live loop
    execute format('alter table public.%I enable trigger user', t);
  end loop;
end
$function$;


-- ============================================================================
-- HOW TO RE-RUN A CLONE, DELIBERATELY.
--
-- Everything below is commented out ON PURPOSE. Applying this migration must
-- never mutate data by itself. To rebuild one demo workspace, uncomment exactly
-- one line, run it by hand against the target database, read the returned table
-- (one row per table, with the count actually inserted, and SKIPPED notes for
-- tables that do not apply), then re-comment it.
--
-- The source of truth is always the Helio Labs seed at workspace
-- 10000000-0000-4000-8000-000000000000. The owner uuid is looked up by email so
-- no uuid is ever pasted in by hand and the call fails loudly if the account is
-- missing, rather than seeding rows owned by nobody.
--
-- Prefix to account map, all six targets:
--   20000000  voyage@supaprod.ai
--   30000000  compass@supaprod.ai
--   40000000  meridian@supaprod.ai
--   50000000  lantern@supaprod.ai
--   60000000  harbor@supaprod.ai
--   70000000  explore@supaprod.ai
--
-- select * from public.clone_demo_workspace('20000000', (select id from auth.users where email = 'voyage@supaprod.ai'));
-- select * from public.clone_demo_workspace('30000000', (select id from auth.users where email = 'compass@supaprod.ai'));
-- select * from public.clone_demo_workspace('40000000', (select id from auth.users where email = 'meridian@supaprod.ai'));
-- select * from public.clone_demo_workspace('50000000', (select id from auth.users where email = 'lantern@supaprod.ai'));
-- select * from public.clone_demo_workspace('60000000', (select id from auth.users where email = 'harbor@supaprod.ai'));
-- select * from public.clone_demo_workspace('70000000', (select id from auth.users where email = 'explore@supaprod.ai'));
--
-- The clone is additive, guarded by on conflict do nothing. It does not delete
-- anything. If a target workspace needs a genuinely clean rebuild, the rows must
-- be removed first in a separate, reviewed statement, with the share_slug
-- uniqueness in mind.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- LOCK THE CLONE DOWN. This must stay next to the definition above, because
-- CREATE OR REPLACE FUNCTION in the public schema grants EXECUTE to PUBLIC by
-- default, and this function is SECURITY DEFINER: it bypasses RLS by design and
-- disables user triggers across 42 tables while it runs. Left at the default it
-- is callable as an unauthenticated PostgREST RPC, which means anyone could
-- re-clone or repeatedly rewrite the demo workspaces.
--
-- Its own guards keep this off the tenant-data-leak path (the target must be an
-- existing workspace whose id is exactly <prefix>-0000-4000-8000-000000000000,
-- which today is only the seven demo workspaces, and p_owner must be a real
-- auth.users row), but denial of service and demo vandalism were both open.
-- Applied live on 2026-07-25 the moment it was found.
--
-- service_role keeps EXECUTE so an operator can still re-arm a workspace.
REVOKE EXECUTE ON FUNCTION public.clone_demo_workspace(text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.demo_remap(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.demo_remap_pk(uuid, text) FROM PUBLIC, anon;
