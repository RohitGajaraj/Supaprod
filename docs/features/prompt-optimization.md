# RF-07 - Eval-driven prompt optimization

> _Created: 2026-07-03 · Last updated: 2026-07-03_

> Status · Shipped 2026-07-03 · Route(s) `/api/public/hooks/prompt-optimize-tick` · Owner: chokepoint-adjacent (zero edits to `src/lib/ai/runtime.server.ts` or `loop.server.ts`)

## What it does

A weekly steward pass mines a prompt template's matching eval suite for graded failures (2+
corroborating cases needed) and drafts a revised system prompt as a new `prompt_versions` row,
`status: 'draft'`. A human reviews and publishes it from the existing Prompt Studio UI (Settings →
Prompts) - this feature never activates anything itself.

## Why it exists

v12's Learning Ladder names this the eval-to-prompt leg of the reinforcement loop: graded failures
become a concrete, versioned fix a human can approve, not just a dashboard number. See
[`v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §3.2 (RF-07).

## The chokepoint-gating question, resolved

This row was previously marked "Gated: attended chokepoint work" on the assumption that the
drafting call would need a new `CallSurface` literal in the pinned `runtime.server.ts` (the same
reasoning that correctly gated AGT-01/AGT-02). Fresh investigation found two already-shipped
precedents for a structurally identical "draft-only, human confirms" AI call reusing the _existing_
`judge` surface without any founder-attended session: `src/lib/outcome.functions.ts`'s LRN-02
Historian verdict drafter, and this session's own RF-04 (`house-rules-tick.ts`). RF-07 follows the
same path - reuses `judge`, makes zero edits to any of the 5 pinned chokepoint files
(`runtime.server.ts`, `loop.server.ts`, `tools/registry.server.ts`, `cache.server.ts`,
`memory.server.ts`). A 3-lens adversarial review (see Governance & guardrails) confirmed this
holds: every place `CallSurface` actually branches behavior in the chokepoint is gated by a
`CallOpts` field RF-07 already sets correctly, not by the surface string itself. Session decision
recorded in [`session-decisions.md`](../strategy/session-decisions.md).

The auto-pickup side needs no new wiring either: `loop.server.ts` already calls `resolvePrompt`
with `promptKey: "planner_executor"` (the only one of 7 seeded templates actually live-wired to a
production call site). The moment a human publishes a draft (existing `publishPromptVersion`,
which sets `active_version_id`), the next agent run picks it up automatically.

## Where to find it

- Drafts land as ordinary rows in Settings → Prompts (Prompt Studio), indistinguishable in
  mechanism from a human-forked draft - reviewed with the same publish/edit/rollback flow.
- The `notes` field on a drafted version cites the evidence: how many graded failures, out of how
  many cases, from which eval suite.

## Demo script

Requires an **enabled eval suite** targeting the same `(surface, key)` as a real prompt template
(today, only `agent`/`planner_executor` is live-wired) with at least one run producing 2+ cases
with `status: 'failed'` in the last 30 days, graded against the template's current
`active_version_id`. As of ship date, no such suite exists in the live/demo data (the only seeded
eval suites target an orphaned `agent.policy_check` key with no matching template) - see Known
limits.

1. Create/enable an eval suite for `agent`/`planner_executor`, run it, get 2+ failing cases.
2. `POST /api/public/hooks/prompt-optimize-tick` with a valid `x-cron-key`.
3. A new `draft` version appears on the `planner_executor` template in Settings → Prompts, with a
   `notes` field citing the failure count and the drafting model's rationale.
4. Publish it - the next `planner_executor` agent run uses the revised prompt automatically (no
   code change; `resolvePrompt` already resolves whatever is `active_version_id`).

## How it works

- **Mining** - `getFailureReport` (`src/lib/prompt-optimization.functions.ts`) finds the enabled
  eval suite matching `(surface, key)`, scopes `eval_runs` to the template's current
  `active_version_id` (a run graded against an already-superseded version is not evidence about
  the current prompt - matches `drift.server.ts`'s per-version partitioning), and reads
  `eval_case_results` where `status = 'failed'` specifically (not `passed = false`, which would
  also catch infra/API `'error'` rows that were never actually graded).
- **Gating** - `shouldProposeDraft` requires at least 2 corroborating failures; a single case is
  noise, mirroring RF-04's `MIN_LEARNINGS_TO_CLUSTER`.
- **Drafting** - `renderFailureEvidence` + `draftingMessages` build a prompt asking the model
  (`surface: "judge"`, cheap default model with a Haiku fallback) to revise the current system
  prompt from the evidence, wrapped in `<untrusted_eval_evidence>` tags with an explicit
  never-an-instruction warning (evidence content comes from user-authored `eval_cases` rows, the
  same untrusted-content posture as any tool output at the chokepoint). Returns `null` (no draft)
  when the model has no confident fix.
- **Screening** - `assessAndQuarantine` (FND-0.7) runs on the drafted revision before it is ever
  stored. A structural quarantine signal discards the draft outright (stricter than RF-04's
  quarantine-and-still-insert - a system prompt is the model's entire instruction set, a larger
  blast radius than one house-rule sentence). A moderate "flag" signal still reaches the reviewer
  as a prefix on the stored note, mirroring RF-04's own flag note.
- **Writing** - `proposePromptOptimization` inserts one new `prompt_versions` row
  (`status: 'draft'`, next version number, evidence-citing `notes`) via the existing schema; it
  never touches `active_version_id`, `eval_suites`, `eval_runs`, or `eval_case_results`.
- **Idempotency** - skipped if this template already carries ANY undecided draft from the last 7
  days (a plain `status = 'draft'` existence check, not a content match on `notes` - a free-text
  column a human could edit, which would silently defeat a content-keyed check).
- **Trigger** - `src/routes/api/public/hooks/prompt-optimize-tick.ts`, a weekly cron (Tuesday
  10:00 UTC, migration `20260703150000_rf07_prompt_optimize_tick_cron.sql`), iterating the first 5
  users by creation order and every one of their prompt templates. No new table.

## Governance & guardrails

- Draft-only, always: the weekly pass never calls `publishPromptVersion` or sets
  `active_version_id` - that stays a human decision in the existing Prompt Studio UI.
- 3-lens adversarial review (CallSurface-reuse safety, injection risk, mining correctness) ran
  before ship; findings applied: mining excludes infra-error rows from the failure count (was
  conflating `eval-runner.server.ts`'s `errored` and `fail_count` categories), evidence scoped to
  the active prompt version, evidence wrapped as explicitly untrusted content, the "flag" band
  gets a visible note, idempotency no longer depends on free-text `notes` matching, and the eval
  suite lookup no longer errors silently if a user creates two suites for the same
  `(surface, key)`.
- Shares the `judge` `ai_surface_budgets` bucket with RF-04, LRN-02, and real eval-suite grading
  (see Known limits) - an accepted, low-volume addition to an already-accepted pattern, not a new
  risk category.

## Verification checklist

- [ ] `POST /api/public/hooks/prompt-optimize-tick` with a valid `x-cron-key` on a template with a
      matching enabled eval suite and 2+ recent `status: 'failed'` cases drafts one `draft` version.
- [ ] A run with only `status: 'error'` cases (no real judged failures) drafts nothing.
- [ ] Re-running the hook while an undecided draft still exists is a no-op.
- [ ] Publishing the draft (existing `publishPromptVersion`) is the only way it reaches
      `active_version_id`; the next `planner_executor` run uses it with zero code changes.

## Known limits / out of scope

- No eval suite in the live/demo data currently targets `agent`/`planner_executor` - the 3 seeded
  suites target an orphaned `agent.policy_check` key with no matching prompt template. RF-07 is
  fully built and tested against synthetic data but starts at zero real proposals until a suite is
  authored against a live-wired template; authoring eval-suite content is a product/domain
  decision, not something to fabricate here.
- Of the 7 seeded (surface, key) prompt templates, only `agent`/`planner_executor` is actually
  live-wired to a `resolvePrompt` call site - RF-07 mines any template with a matching suite, but a
  draft against one of the other 6 has no effect until (separately) that call site starts passing
  `promptKey`. Out of scope here; noted as a distinct, smaller cleanup ticket.
- The `judge` surface's per-user budget cap and the cost-dashboard's by-surface rollup both key on
  the surface string alone, not `surface_ref` - RF-07 spend cannot be isolated from RF-04/LRN-02/
  real eval-grading spend in the built-in UI, though `surface_ref` is stored and distinguishing at
  the raw-row level. Pre-existing, inherited from RF-04/LRN-02; a lightweight follow-up (break out
  `surface_ref` in the cost dashboard) would resolve it for all four at once.
- No workspace-scoped opt-in - runs for the first 5 users by creation order (capped like
  `house-rules-tick`).

## Related

- [`docs/planning/archive/build-log.md`](../planning/archive/build-log.md) §4 (2026-07-03 entry)
- [`v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §3.2
- Sibling/precedent: [`house-rules.md`](./house-rules.md) (RF-04, the structural template this
  follows almost mechanically)
