-- A decision an agent made had nowhere to say so.
--
-- `decisions.source_kind` is CHECK-constrained to eight values:
--   meeting, mission, prd, manual, roadmap, retrospective, critic, opportunity
--
-- None of them means "an external agent recorded this through the API". So the
-- MCP write tool being added in this change had exactly two dishonest options
-- and no honest one:
--
--   * write 'manual', which asserts a HUMAN authored it. That is not a
--     cosmetic lie. `isAgentDrafted` in approvals-queue.functions.ts treats
--     source_kind = 'manual' as "the human wrote this themselves" and
--     deliberately SKIPS gate-signal recording for it, because scoring a
--     person's own draft as an agent correction biases every correction rate
--     the ranking consumes. An agent writing 'manual' would make its own
--     decisions permanently invisible to the flywheel.
--
--   * write 'mcp' anyway and fail the constraint on every call. That is
--     precisely the `append_decision` defect: a write tool advertised in
--     tools/list, callable, and targeting a schema that cannot accept it, so
--     it could never succeed. It was removed on 2026-06-24 for exactly this.
--
-- The column already anticipates agent authorship elsewhere:
-- `decisions.decided_by_agent_slug` exists and is read by the decisions list.
-- What was missing is the ORIGIN, which is a different fact from the author: a
-- decision recorded through the agent API is a different provenance from one a
-- mission produced internally, and a reader should be able to tell them apart.
--
-- So the constraint is WIDENED by one value rather than the tool bending to
-- fit it. Additive and safe: every existing row still satisfies the check, no
-- row is rewritten, and nothing that reads source_kind today has a branch this
-- new value can break (the readers either display it or compare it to
-- 'manual').

alter table public.decisions drop constraint if exists decisions_source_kind_check;

alter table public.decisions add constraint decisions_source_kind_check
  check (
    source_kind is null
    or source_kind = any (array[
      'meeting'::text,
      'mission'::text,
      'prd'::text,
      'manual'::text,
      'roadmap'::text,
      'retrospective'::text,
      'critic'::text,
      'opportunity'::text,
      -- NEW: recorded by an external agent through POST /api/mcp, under a
      -- scoped token, with the workspace and user taken from the token rather
      -- than from caller input.
      'mcp'::text
    ])
  );

comment on constraint decisions_source_kind_check on public.decisions is
  'Allowed decision origins. ''mcp'' added 2026-08-10 for decisions recorded through the agent API: without it the MCP write tool would have had to claim ''manual'', which isAgentDrafted reads as human-authored and skips for gate-signal recording, making an agent''s own decisions invisible to the correction-rate flywheel.';
