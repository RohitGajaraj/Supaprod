-- Workspace slugs, and the reserved-name guard that keeps them reachable.
--
-- WHY. The room is moving from supaprod.ai/m/<uuid> to the GitHub / Linear /
-- Vercel shape, supaprod.ai/<workspace>/<product>. projects.slug already landed
-- (20260725180000). This is the other half: the workspace segment.
--
-- THE FAILURE MODE THIS EXISTS TO PREVENT. The workspace slug sits at the ROOT of
-- the URL, so it shares a namespace with every top-level route the app already
-- serves. TanStack Router ranks a static segment above a dynamic one, always, so
-- an existing route can never break. The damage runs the other way: a workspace
-- slugged 'settings' or 'login' would be permanently shadowed by the real route
-- and become unreachable, with no error raised anywhere. That is silent, it is
-- user-visible, and it is not recoverable by the user.
--
-- We already have one live instance of exactly that: workspace
-- 0b9b2dc2-891f-42dc-ba28-7ae40a74b5c3 holds the slug 'demo', and /demo is a real
-- public route. Nothing links to it yet because no root-level workspace route
-- exists, so this migration is the last cheap moment to fix it.
--
-- WHERE THE GUARD LIVES, AND WHY IT IS A TABLE. The reserved set is a TABLE, not
-- an array baked into a function body. A route file added next month needs one
-- INSERT, not a new migration that rewrites a function, and a repo-side test can
-- diff the live route tree against this table and fail the build when they drift.
-- A hardcoded list is the thing that rots; a queryable one is the thing a test can
-- hold to account. Enforcing in the database rather than only in TypeScript means
-- SQL seeds, the Lovable console and psql obey the same rule the app does.
--
-- RENAMES DO NOT MOVE THE SLUG. The trigger fills a slug on INSERT and validates a
-- deliberate slug change, but renaming a workspace leaves the slug alone. A slug
-- that follows the name would silently break every link previously shared to that
-- workspace, which is the opposite of what this whole change is for.
--
-- Idempotent and additive: safe to run repeatedly, deletes nothing, and never
-- rewrites a slug that is already good.

-- ------------------------------------------------------------ the reserved set
CREATE TABLE IF NOT EXISTS public.reserved_workspace_slugs (
  slug   text PRIMARY KEY,
  reason text NOT NULL DEFAULT 'route'
);

COMMENT ON TABLE public.reserved_workspace_slugs IS
  'Root URL segments a workspace slug may not take. Seeded from the app route tree and public/ assets. Keep in sync with src/routeTree.gen.ts.';

-- Every distinct first URL segment the app serves today, derived mechanically
-- from the generated route tree rather than typed by hand.
INSERT INTO public.reserved_workspace_slugs (slug, reason) VALUES
  ('.lovable','route'),('.mcp','route'),('.well-known','route'),
  ('admin','route'),('agents','route'),('analytics','route'),('api','route'),
  ('approvals','route'),('ard','route'),('artifacts','route'),('brain','route'),
  ('brief','route'),('briefing','route'),('budgets','route'),('build','route'),
  ('calendar','route'),('changelog','route'),('chat','route'),('checkout','route'),
  ('cockpit','route'),('d','route'),('decide','route'),('delegate','route'),
  ('demo','route'),('design','route'),('discover','route'),('discovery','route'),
  ('docs','route'),('drift','route'),('engine-room','route'),('eval-health','route'),
  ('evals','route'),('fleet','route'),('forgot-password','route'),('govern','route'),
  ('guardrails','route'),('impact','route'),('inbox','route'),('integrations','route'),
  ('join','route'),('knowledge','route'),('learn','route'),('login','route'),
  ('m','route'),('mcp','route'),('meetings','route'),('memory','route'),
  ('missions','route'),('notifications','route'),('observe','route'),
  ('onboarding','route'),('opportunities','route'),('outcome','route'),('p','route'),
  ('plan','route'),('prds','route'),('pricing','route'),('privacy','route'),
  ('product','route'),('prompts','route'),('proof','route'),('reset-password','route'),
  ('roadmap','route'),('security','route'),('settings','route'),('ship','route'),
  ('signup','route'),('stakeholder','route'),('start','route'),('studio','route'),
  ('subprocessors','route'),('swarm','route'),('sync','route'),('t','route'),
  ('tasks','route'),('terms','route'),('threads','route'),('today','route'),
  ('traces','route'),('trust','route'),('trust-ledger','route'),('updates','route')
ON CONFLICT (slug) DO NOTHING;

-- Files served straight out of public/. No route table knows about these, so a
-- router-derived list alone would miss them and the static handler would win.
INSERT INTO public.reserved_workspace_slugs (slug, reason) VALUES
  ('assets','static'),('fonts','static'),('soundscape','static'),
  ('agents.txt','static'),('llms.txt','static'),('robots.txt','static'),
  ('sitemap.xml','static'),('brief.html','static'),('favicon.ico','static'),
  ('favicon.png','static'),('favicon.svg','static'),
  ('apple-touch-icon.png','static'),('og-supaprod.png','static'),
  ('favicon','static'),('robots','static'),('sitemap','static'),('llms','static')
ON CONFLICT (slug) DO NOTHING;

-- Held back so a future surface never has to strand a paying customer to claim
-- its own name. Cheaper to reserve now than to take one away later.
INSERT INTO public.reserved_workspace_slugs (slug, reason) VALUES
  ('about','held'),('account','held'),('accounts','held'),('app','held'),
  ('auth','held'),('billing','held'),('blog','held'),('careers','held'),
  ('cdn','held'),('community','held'),('contact','held'),('dashboard','held'),
  ('developers','held'),('download','held'),('enterprise','held'),('events','held'),
  ('explore','held'),('faq','held'),('features','held'),('feed','held'),
  ('files','held'),('forum','held'),('help','held'),('home','held'),
  ('images','held'),('img','held'),('jobs','held'),('legal','held'),
  ('logout','held'),('mail','held'),('media','held'),('new','held'),
  ('news','held'),('null','held'),('oauth','held'),('order','held'),
  ('orders','held'),('partners','held'),('pay','held'),('payment','held'),
  ('payments','held'),('press','held'),('public','held'),('refund','held'),
  ('register','held'),('root','held'),('rss','held'),('search','held'),
  ('session','held'),('sessions','held'),('setup','held'),('ssl','held'),
  ('static','held'),('status','held'),('store','held'),('support','held'),
  ('system','held'),('team','held'),('teams','held'),('test','held'),
  ('undefined','held'),('upgrade','held'),('user','held'),('users','held'),
  ('verify','held'),('webhook','held'),('webhooks','held'),('workspace','held'),
  ('workspaces','held'),('www','held')
ON CONFLICT (slug) DO NOTHING;

-- Every single letter. Four are already routes (d, m, p, t) and the rest are the
-- most grabbable names on the domain, so none of them belongs to a tenant.
INSERT INTO public.reserved_workspace_slugs (slug, reason)
SELECT chr(c), 'held' FROM generate_series(ascii('a'), ascii('z')) AS c
ON CONFLICT (slug) DO NOTHING;

-- Readable by anyone: a signup form has to be able to say "that name is taken"
-- before the insert fails. Nobody but the service role may edit the list.
ALTER TABLE public.reserved_workspace_slugs ENABLE ROW LEVEL SECURITY;

DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename  = 'reserved_workspace_slugs'
       AND policyname = 'reserved_workspace_slugs_readable'
  ) THEN
    CREATE POLICY reserved_workspace_slugs_readable
      ON public.reserved_workspace_slugs
      FOR SELECT USING (true);
  END IF;
END
$do$;

-- ------------------------------------------------------------------ predicates
-- Shape. Matches what public.slugify already emits, and the structural rules do
-- the work a name list cannot: no leading dot (.well-known and friends), no dot
-- at all (sitemap.xml, favicon.ico and every future file of that class), no bare
-- number and no bare uuid (so a slug can never be mistaken for the /m/<uuid> id).
CREATE OR REPLACE FUNCTION public.workspace_slug_is_valid(p_slug text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $fn$
  SELECT p_slug IS NOT NULL
     AND p_slug ~ '^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$'
     AND p_slug !~ '^[0-9]+$'
     AND p_slug !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
$fn$;

CREATE OR REPLACE FUNCTION public.workspace_slug_is_reserved(p_slug text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $fn$
  SELECT EXISTS (
    SELECT 1 FROM public.reserved_workspace_slugs WHERE slug = lower(coalesce(p_slug, ''))
  )
$fn$;

-- ------------------------------------------------------------------- generator
-- Deterministic and single shot. No counter loop: "My Workspace" is the default
-- name every signup gets, so a -2 / -3 walk would queue every new account on the
-- same scan and hand supaprod.ai/my-workspace permanently to whoever signed up
-- first. Suffixing with the workspace id fragment is collision free by
-- construction and matches the explore-9e7958c5 convention already in the seeds.
CREATE OR REPLACE FUNCTION public.generate_workspace_slug(p_name text, p_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $fn$
DECLARE
  v_base text;
BEGIN
  v_base := trim(both '-' from left(public.slugify(p_name), 30));

  IF v_base IS NULL OR v_base = '' THEN
    v_base := 'workspace';
  END IF;

  -- Generic defaults never get to claim a bare vanity root segment.
  IF v_base IN ('workspace', 'my-workspace', 'product', 'untitled')
     OR public.workspace_slug_is_reserved(v_base)
     OR NOT public.workspace_slug_is_valid(v_base)
     OR EXISTS (
       SELECT 1 FROM public.workspaces
        WHERE slug = v_base AND id <> p_id
     )
  THEN
    RETURN v_base || '-' || substr(replace(p_id::text, '-', ''), 1, 8);
  END IF;

  RETURN v_base;
END;
$fn$;

-- ------------------------------------------------------------------- backfill
-- The Helio family is a curated exception, not a generated one. Seven workspaces
-- share the name "Helio Labs" on purpose, so no function can produce good URLs
-- for them: slugify would yield helio-labs-2 through helio-labs-7, and
-- supaprod.ai/helio-labs-4/relay in an investor's address bar is worse than the
-- uuid it replaces. The suffixes are the account codenames already recorded in
-- docs/operations/demo-credentials.md, so the URL doubles as the engagement
-- tracker that doc asks for. Deterministic because the ids are fixed by seed.
DO $do$
DECLARE
  v_map CONSTANT jsonb := jsonb_build_object(
    '10000000-0000-4000-8000-000000000000', 'helio-labs',
    '20000000-0000-4000-8000-000000000000', 'helio-labs-voyage',
    '30000000-0000-4000-8000-000000000000', 'helio-labs-compass',
    '40000000-0000-4000-8000-000000000000', 'helio-labs-meridian',
    '50000000-0000-4000-8000-000000000000', 'helio-labs-lantern',
    '60000000-0000-4000-8000-000000000000', 'helio-labs-harbor',
    '70000000-0000-4000-8000-000000000000', 'helio-labs-explore'
  );
  v_id   uuid;
  v_slug text;
BEGIN
  FOR v_id, v_slug IN SELECT key::uuid, value #>> '{}' FROM jsonb_each(v_map) LOOP
    -- Only claim the name if it is genuinely free. Never take a slug away from a
    -- workspace that already holds it.
    IF EXISTS (SELECT 1 FROM public.workspaces WHERE slug = v_slug AND id <> v_id) THEN
      CONTINUE;
    END IF;

    UPDATE public.workspaces
       SET slug = v_slug
     WHERE id = v_id
       -- 'helio-labs-demo' is the one existing value we deliberately replace: it
       -- reads as a placeholder on camera and the clean name is free.
       AND (slug IS NULL OR slug = '' OR slug = 'helio-labs-demo');
  END LOOP;
END
$do$;

-- The live reserved-name collision. 'demo' is a real public route, so this
-- workspace would be unreachable the moment the root-level route ships. Nothing
-- can link to it yet, which is why this is safe today and would not be later.
UPDATE public.workspaces
   SET slug = 'demo-workspace'
 WHERE slug = 'demo'
   AND NOT EXISTS (
     SELECT 1 FROM public.workspaces w2 WHERE w2.slug = 'demo-workspace'
   );

-- Everything still null. Row by row rather than one set-based UPDATE, because a
-- single statement sees a pre-statement snapshot and two rows generating the
-- same base would both believe it was free.
DO $do$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, name FROM public.workspaces
     WHERE slug IS NULL OR slug = ''
     ORDER BY created_at, id
  LOOP
    UPDATE public.workspaces
       SET slug = public.generate_workspace_slug(r.name, r.id)
     WHERE id = r.id;
  END LOOP;
END
$do$;

-- ------------------------------------------------------------------ uniqueness
-- The workspace slug is the URL root, so uniqueness is GLOBAL, unlike
-- projects.slug which is deliberately per workspace. This index already exists as
-- a constraint on this database; the guard is here so the migration is complete
-- for any environment that lacks it.
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = 'workspaces_slug_key'
  ) THEN
    CREATE UNIQUE INDEX workspaces_slug_key ON public.workspaces (slug);
  END IF;
END
$do$;

-- Shape floor, so a hand-written value can never produce a URL that does not
-- resolve. Validated rather than NOT VALID: every row conforms after the backfill.
DO $do$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.workspaces'::regclass
       AND conname  = 'workspaces_slug_shape'
  ) THEN
    ALTER TABLE public.workspaces
      ADD CONSTRAINT workspaces_slug_shape
      CHECK (slug IS NULL OR public.workspace_slug_is_valid(slug));
  END IF;
END
$do$;

-- ------------------------------------------------------- keep it true onward
CREATE OR REPLACE FUNCTION public.set_workspace_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $fn$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
      NEW.slug := public.generate_workspace_slug(NEW.name, NEW.id);
      RETURN NEW;
    END IF;
  ELSE
    -- A rename must not move the slug. Links already shared to this workspace
    -- have to keep resolving, so only a deliberate slug change is considered.
    IF NEW.slug IS NOT DISTINCT FROM OLD.slug THEN
      RETURN NEW;
    END IF;

    -- Clearing the slug would strand the workspace at no URL at all.
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
      NEW.slug := COALESCE(
        NULLIF(OLD.slug, ''),
        public.generate_workspace_slug(NEW.name, NEW.id)
      );
      RETURN NEW;
    END IF;
  END IF;

  -- A slug was supplied on purpose. Refuse it loudly rather than accept a value
  -- that silently makes the workspace unreachable.
  NEW.slug := lower(NEW.slug);

  IF NOT public.workspace_slug_is_valid(NEW.slug) THEN
    RAISE EXCEPTION
      'workspace slug "%" is not a valid URL segment (lowercase letters, digits and hyphens, 1 to 40 characters)',
      NEW.slug
      USING ERRCODE = '23514';
  END IF;

  IF public.workspace_slug_is_reserved(NEW.slug) THEN
    RAISE EXCEPTION
      'workspace slug "%" is reserved: an app route already answers at supaprod.ai/%, so the workspace would be unreachable',
      NEW.slug, NEW.slug
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_set_workspace_slug ON public.workspaces;
CREATE TRIGGER trg_set_workspace_slug
  BEFORE INSERT OR UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.set_workspace_slug();
