-- A COMMA IS RIGHT FOR ONE CASE AND WRONG FOR FIVE.
--
-- `strip_ai_dashes` mirrored `humanize.ts`, and it mirrored five defects with it.
-- S1 probed both and got identical output, character for character:
--
--   'It said this ,'        a dangling comma at the end of a sentence
--   ', and then it...'      a line that opens with a comma
--   'It stopped, .'         a comma before a full stop
--   'First,, then second.'  a doubled comma
--   'a run, time decision'  A DIFFERENT SENTENCE from 'a run-time decision'
--
-- The founder's instruction is that no trace of machine writing is left where a
-- person can see it. Every one of those is MORE obviously machine-made than the
-- em dash it replaced, so the tell was not removed, it was swapped for a
-- stranger one, and the compound case changed the meaning outright.
--
-- ORDER IS THE RULE. Each step removes a dash the general rule would mishandle,
-- so the unconditional comma at the end only ever sees the aside it is right
-- for: 'The run, which was held, never moved.'
--
-- THE EN/EM SPLIT follows what the characters are for. An EN dash JOINS
-- (run-time, design-build), so unspaced it becomes a hyphen and the compound
-- survives. An EM dash SEPARATES, so unspaced it stays a comma.
--
-- THIS AND `humanize.ts` MUST MOVE TOGETHER. Two implementations of one rule is
-- how a third variant of this problem gets born, so the steps below are in the
-- same order and do the same thing as `normalizeDashes`.

CREATE OR REPLACE FUNCTION public.strip_ai_dashes(t text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $fn$
  SELECT CASE WHEN t IS NULL THEN NULL ELSE
    -- 7 - anything left is an unspaced em dash, most often a list
    regexp_replace(
    -- 6 - the aside, the one case a comma is right for
    regexp_replace(
    -- 5b - nothing to separate from at the end
    regexp_replace(
    -- 5a - nor at the start
    regexp_replace(
    -- 4 - real punctuation follows, so the dash is redundant
    regexp_replace(
    -- 3 - the comma already separated
    regexp_replace(
    -- 2 - a compound: an EN dash joining two letters keeps them joined
    regexp_replace(
    -- 1 - a range
    regexp_replace(t,
      '(\d)[ \t]*[' || chr(8212) || chr(8211) || '][ \t]*(\d)', '\1 to \2', 'g'),
      '([[:alpha:]])' || chr(8211) || '([[:alpha:]])', '\1-\2', 'g'),
      ',[ \t]*[' || chr(8212) || chr(8211) || '][ \t]*', ', ', 'g'),
      '[ \t]*[' || chr(8212) || chr(8211) || '][ \t]*([.,;:!?])', '\1', 'g'),
      '(^|\n)[ \t]*[' || chr(8212) || chr(8211) || '][ \t]*', '\1', 'g'),
      '[ \t]*[' || chr(8212) || chr(8211) || '][ \t]*($|\n)', '\1', 'g'),
      '[ \t]+[' || chr(8212) || chr(8211) || '][ \t]+', ', ', 'g'),
      '[' || chr(8212) || chr(8211) || ']', ', ', 'g')
  END
$fn$;

COMMENT ON FUNCTION public.strip_ai_dashes(text) IS
  'Mirrors normalizeDashes in src/lib/ai/humanize.ts, step for step. Never touches an ASCII hyphen. Change both or neither.';
