-- NO AI FINGERPRINT REACHES A PERSON, ENFORCED WHERE EVERY WRITER CONVERGES.
--
-- The founder's instruction was that em and en dashes must not appear anywhere a
-- person can see. Three passes have been made at it in application code and each
-- one was necessary and none was sufficient:
--
--   · `humanizeText` guarded STREAMED model text and not tool arguments
--   · `humanizeToolArgs` guarded tool arguments and not direct writes
--   · `runOutput` guarded seven writes in `loop.server.ts`, and an EIGHTH writer
--     in `agents.functions.ts` was found afterwards, and two dashed rows appeared
--     after that
--
-- Each fix closed a door and the next writer came through a different one. This
-- is the layer they all pass through.
--
-- IT SANITISES, IT DOES NOT REJECT, and that distinction is the whole design. A
-- CHECK constraint would make the write FAIL, and a failed write loses the run's
-- own account of what it did, which is far worse than a typographic dash. This
-- rewrites the value and lets the write succeed.
--
-- The rewrites mirror `humanize.ts` exactly, in its order, so a value written
-- through the application and a value written around it come out identical:
--   1. a dash between two digits is a RANGE          "4–12h"  -> "4 to 12h"
--   2. a spaced dash is a sentence break              "a — b"  -> "a, b"
--   3. any remaining dash is a comma                  "a—b"    -> "a, b"
--
-- ASCII hyphens are untouched, so slugs, paths, uuids and branch names survive.

CREATE OR REPLACE FUNCTION public.strip_ai_dashes(t text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE WHEN t IS NULL THEN NULL ELSE
    regexp_replace(
      regexp_replace(
        regexp_replace(t, '(\d)\s*[' || chr(8212) || chr(8211) || ']\s*(\d)', '\1 to \2', 'g'),
        '\s+[' || chr(8212) || chr(8211) || ']\s+', ', ', 'g'),
      '[' || chr(8212) || chr(8211) || ']', ', ', 'g')
  END
$$;

COMMENT ON FUNCTION public.strip_ai_dashes(text) IS
  'Mirrors humanize.ts. Rewrites em and en dashes; never touches an ASCII hyphen.';

-- agent_runs.output: the agent's own last line in the run transcript, and the
-- single most-read model-written string in the product.
CREATE OR REPLACE FUNCTION public.agent_runs_strip_dashes()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.output := public.strip_ai_dashes(NEW.output);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS agent_runs_strip_dashes ON public.agent_runs;
CREATE TRIGGER agent_runs_strip_dashes
  BEFORE INSERT OR UPDATE OF output ON public.agent_runs
  FOR EACH ROW EXECUTE FUNCTION public.agent_runs_strip_dashes();

-- decisions: the Decide card is the most important surface in the product, and
-- `forecast_claim` is immutable by trigger, so its INSERT is the only chance
-- anyone ever gets to write it clean.
CREATE OR REPLACE FUNCTION public.decisions_strip_dashes()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.title := public.strip_ai_dashes(NEW.title);
  NEW.rationale := public.strip_ai_dashes(NEW.rationale);
  NEW.forecast_claim := public.strip_ai_dashes(NEW.forecast_claim);
  NEW.forecast_how_we_will_know := public.strip_ai_dashes(NEW.forecast_how_we_will_know);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS decisions_strip_dashes ON public.decisions;
CREATE TRIGGER decisions_strip_dashes
  BEFORE INSERT OR UPDATE ON public.decisions
  FOR EACH ROW EXECUTE FUNCTION public.decisions_strip_dashes();

-- signals: what Discover files, rendered on the Sense and Discover surfaces.
CREATE OR REPLACE FUNCTION public.signals_strip_dashes()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.title := public.strip_ai_dashes(NEW.title);
  NEW.content := public.strip_ai_dashes(NEW.content);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS signals_strip_dashes ON public.signals;
CREATE TRIGGER signals_strip_dashes
  BEFORE INSERT OR UPDATE ON public.signals
  FOR EACH ROW EXECUTE FUNCTION public.signals_strip_dashes();
