-- ============================================================================
-- `learnings.decision_id` NOW HAS A WRITER, AND ITS OWN COMMENT SAYS IT DOES NOT.
--
-- NO SCHEMA CHANGE. The column, its foreign key and its partial index all
-- arrived in 20260819181000 and all three are correct. What is wrong is the one
-- thing a future reader will trust before they read any TypeScript: the column
-- comment, which currently reads "No backfill and no derivation".
--
-- WHY THAT SENTENCE WAS RIGHT WHEN IT WAS WRITTEN. It refuses a specific
-- derivation, and it names it: "prd_id does not identify a decision, since many
-- decisions share one spec". Measured 2026-08-22, that is not a theoretical
-- objection — 14 specs carry a decision and NOT ONE of them carries exactly one.
-- A trigger deriving `decision_id` from `prd_id` would therefore have been wrong
-- on every row it touched, which is worse than the empty column it replaced,
-- because a wrong edge is read as an answer and a missing one is read as a gap.
--
-- WHY IT IS WRONG NOW. `applyOutcome` (src/lib/outcome.functions.ts) resolves and
-- writes the value as of 2026-08-22, on a rule the refused derivation does not
-- describe: UNIQUENESS rather than proximity. The nearest hop that knows anything
-- answers, and if it knows more than one thing the column stays NULL and the
-- ladder stops. So the honest statement is not "no derivation" — it is "no
-- derivation IN THE DATABASE, and the application refuses to guess".
--
-- WHY THE RULE IS NOT MOVED INTO A TRIGGER while we are here. Two reasons, and
-- the first is sufficient. Rung two reads `spine_track_members` twice and then
-- filters candidates by workspace and by `created_at` against the spec — a
-- plpgsql trigger would be a second copy of that, and this repo's own record of
-- what a second copy costs is the `learnings`/`decisions` join it is trying to
-- retire, which exists once in TypeScript (trust.server.ts) and once in SQL
-- (auto_advance_agent_arc) and disagrees with itself about ordering. The second
-- is that `learnings_derive_product_id` is deliberately shaped to defer to a
-- caller-supplied value, and a trigger for this column would have exactly one
-- caller to defer to.
--
-- NOTHING IS BACKFILLED, and that is unchanged. All 133 existing rows are
-- `is_sample` seed content; stamping a decision onto fiction teaches the next
-- reader that the column means something it does not yet mean. It fills from the
-- first real write.
--
-- IDEMPOTENT: `comment on column` is a replace, not an append, and this file can
-- run any number of times.
-- ============================================================================

comment on column public.learnings.decision_id is
  'The decision this learning settles. Written by applyOutcome '
  '(src/lib/outcome.functions.ts) from 2026-08-22, and NULL whenever the record '
  'cannot name exactly one call. There is no trigger and no backfill: the rule '
  'is uniqueness, not proximity. Rung 1 is the spec''s own standing decisions '
  '(decisions.prd_id), which answers only when there is exactly one -- prd_id '
  'does NOT identify a decision in general, since many decisions share one spec. '
  'Rung 2, reached only when the spec carries none, is the track: the driver '
  'files the Decide call and the spec it produced as members of one piece of '
  'work, and the candidate must sit in the spec''s workspace and predate it. '
  'More than one candidate at either rung means NULL, and the ladder stops -- a '
  'farther hop that happens to be unique is a tiebreak invented by the query, '
  'not evidence about which near candidate was meant. '
  'READERS: none yet, as of 2026-08-22. src/lib/ai/trust.server.ts and '
  'public.auto_advance_agent_arc both still reconstruct this edge by joining '
  'learnings to decisions on prd_id, which is the cost this column exists to '
  'stop paying. Neither may switch to it until real rows carry it, because every '
  'row today is seed and NULL, so a reader that switched now would go blank.';
