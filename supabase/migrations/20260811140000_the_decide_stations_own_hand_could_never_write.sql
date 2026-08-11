-- The Decide station's own hand could never write.
--
-- `src/lib/ai/tools/registry.server.ts` (the `decision.record` tool) inserts
-- `source_kind: 'agent'`. `decisions_source_kind_check` does not admit that
-- value, and the tool throws on error, so EVERY call has failed since the tool
-- shipped in 31728cca on 2026-08-01 -- the commit titled "the four handless
-- stations get hands".
--
-- Measured 2026-08-11, and this is the proof rather than an inference:
--
--   select source_kind, count(*) from decisions group by 1 order by 2 desc;
--   -- mission 205, prd 29, roadmap 28, manual 10, critic 8,
--   -- retrospective 8, opportunity 6, meeting 2
--
-- Eight kinds present across 296 rows and ZERO 'agent'. A tool called on a live
-- path for ten days that produced not one row did not produce zero rows because
-- nobody called it; it produced zero rows because it cannot succeed.
--
-- THIS IS THE THIRD TIME THIS CONSTRAINT HAS BEEN THE BUG, which is the part
-- worth stopping on. 'opportunity' was added 2026-08-06 (the Gate wrote its
-- judgment and a check threw it away) and 'mcp' on 2026-08-10 (a decision an
-- agent made had nowhere to say so). Each time: a writer shipped, the value it
-- writes was not in the check, the insert threw, and nobody noticed because a
-- station that files nothing looks exactly like a station with nothing to file.
-- Three instances is a pattern, not a coincidence, so this migration is paired
-- with a test that reads THIS FILE and asserts the TypeScript union matches it
-- (src/lib/__tests__/the-source-kinds-agree.test.ts). The next person to widen
-- the constraint without widening the union gets a red test instead of a
-- silently dead station.
--
-- WHY 'agent' RATHER THAN REUSING A VALUE. 'mcp' is the closest existing token
-- and is wrong: it means "recorded by an EXTERNAL agent through POST /api/mcp
-- under a scoped token". This is the internal Decide hand running inside a
-- mission, and the two have different trust, different auth and different blast
-- radius. 'mission' is also wrong -- it names the CONTEXT, and the tool already
-- writes `mission_id` for that, so folding origin into context would lose the
-- one fact this column exists to carry. 'manual' would be an outright lie, and
-- an expensive one: `isAgentDrafted` in approvals-queue.functions.ts reads
-- source_kind = 'manual' as "the human wrote this themselves" and SKIPS
-- gate-signal recording, so an agent claiming 'manual' would make its own calls
-- permanently invisible to the correction-rate flywheel.
--
-- 'agent' is also already this product's token for exactly this fact:
-- `isAgentDrafted` matches memory_candidates on `source_kind === 'agent'`.
-- Using the same word for the same meaning in a second table is the consistent
-- choice, not a new one.
--
-- Additive and safe: every existing row still satisfies the widened check, no
-- row is rewritten, and no reader has a branch this value can break (readers
-- either display it through SOURCE_LABEL, which is widened in the same commit,
-- or compare it to 'manual').
--
-- TO REVERSE: re-run the 2026-08-10 constraint without the 'agent' entry. Any
-- rows written in the meantime would then violate it, so delete or relabel them
-- first: `select id from decisions where source_kind = 'agent'`.

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
      'mcp'::text,
      -- NEW: the Decide station's own hand, `decision.record`, called by an
      -- agent inside a mission. Distinct from 'mcp' (external, token-scoped)
      -- and from 'mission' (the context, already carried by mission_id).
      'agent'::text
    ])
  );

comment on constraint decisions_source_kind_check on public.decisions is
  'Allowed decision origins. ''agent'' added 2026-08-11: the decision.record tool had written it since 2026-08-01 and every insert threw, so the Decide station''s only artifact-creating hand produced zero rows for ten days. Widen this and the DecisionSource union together -- the-source-kinds-agree.test.ts enforces it.';
