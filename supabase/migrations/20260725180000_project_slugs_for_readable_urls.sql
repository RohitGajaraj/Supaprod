-- Readable product URLs: give every project a slug.
--
-- WHY. The room's URL is currently /m/<uuid>, which renders as
-- supaprod.ai/m/60000000-0000-4000-8000-0000000000a2. That is unreadable, it is
-- unmemorable, it cannot be typed, and on a demo recording it teaches the viewer
-- nothing while occupying the most-read strip of the screen. The founder asked for
-- supaprod.ai/m/relay instead.
--
-- SCOPING. The slug is unique PER WORKSPACE, not globally. That is deliberate: the
-- seven demo workspaces each contain a product called Relay, so a globally unique
-- slug would force relay, relay-2, relay-3 and so on, which is worse than the uuid
-- it replaces. Per-workspace uniqueness means every one of them is simply "relay",
-- and the route resolves it inside the caller's active workspace.
--
-- The uuid remains the primary key and keeps working in URLs, so existing links,
-- bookmarks and the seeded data are untouched. The slug is an additional, nicer
-- way to say the same thing.
--
-- NEW PRODUCTS. A trigger generates the slug on insert when one is not supplied,
-- so this cannot silently regress the moment somebody adds a product through the
-- UI. Without it, new products would have a null slug and no readable URL.
--
-- Idempotent: safe to run repeatedly.

-- ---------------------------------------------------------------- the column
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS slug text;

-- --------------------------------------------------------------- slugify
-- Lowercase, accents stripped to ASCII where possible, every run of
-- non-alphanumeric collapsed to a single hyphen, trimmed. Empty input falls back
-- to 'product' so the result is never an empty string.
CREATE OR REPLACE FUNCTION public.slugify(p_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $fn$
  SELECT COALESCE(
    NULLIF(
      trim(both '-' from
        regexp_replace(
          lower(unaccent_fallback(coalesce(p_text, ''))),
          '[^a-z0-9]+', '-', 'g'
        )
      ),
      ''
    ),
    'product'
  )
$fn$;

-- unaccent is not guaranteed to be installed, so degrade to a plain passthrough
-- rather than making the whole migration depend on an extension.
CREATE OR REPLACE FUNCTION public.unaccent_fallback(p_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $fn$
  SELECT p_text
$fn$;

-- ------------------------------------------------------------- backfill
-- Numbered only where a workspace genuinely holds two products that slugify the
-- same way. The first keeps the clean slug.
WITH ranked AS (
  SELECT id,
         workspace_id,
         public.slugify(name) AS base,
         row_number() OVER (
           PARTITION BY workspace_id, public.slugify(name)
           ORDER BY created_at, id
         ) AS n
  FROM public.projects
  WHERE slug IS NULL
)
UPDATE public.projects p
   SET slug = CASE WHEN r.n = 1 THEN r.base ELSE r.base || '-' || r.n END
  FROM ranked r
 WHERE p.id = r.id;

-- --------------------------------------------------------------- uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS projects_workspace_slug_key
  ON public.projects (workspace_id, slug)
  WHERE slug IS NOT NULL;

-- ------------------------------------------------------- keep it true onward
CREATE OR REPLACE FUNCTION public.set_project_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $fn$
DECLARE
  v_base text;
  v_try  text;
  i      int := 1;
BEGIN
  IF NEW.slug IS NOT NULL AND NEW.slug <> '' THEN
    RETURN NEW;
  END IF;

  v_base := public.slugify(NEW.name);
  v_try  := v_base;

  -- Walk until the slug is free inside this workspace. Bounded so a pathological
  -- case cannot spin forever; after 50 tries fall back to a uuid fragment, which
  -- is ugly but always unique and never blocks the insert.
  WHILE EXISTS (
    SELECT 1 FROM public.projects
     WHERE workspace_id = NEW.workspace_id
       AND slug = v_try
       AND id <> NEW.id
  ) LOOP
    i := i + 1;
    IF i > 50 THEN
      v_try := v_base || '-' || substr(replace(NEW.id::text, '-', ''), 1, 6);
      EXIT;
    END IF;
    v_try := v_base || '-' || i;
  END LOOP;

  NEW.slug := v_try;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_set_project_slug ON public.projects;
CREATE TRIGGER trg_set_project_slug
  BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_project_slug();
