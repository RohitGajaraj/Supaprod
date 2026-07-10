# AGT-02 - Consent scopes

> _Created: 2026-07-03 · Last updated: 2026-07-03_

> Status · Shipped 2026-07-03 · Route(s) - engine only, rides `executeLoop` (the agent core) · Owner: Foundational (`src/lib/ai/loop.server.ts`)

## What it does

Once a mission's own governing Outcome Contract is approved (`prds.status === "approved"`, the
human's CNV-01 confirm step), the run's REVERSIBLE tool calls stop queuing a per-step "confirm"
approval and execute inline instead - the plan-level approval already granted consent for that
scope of work. Nothing about the sticky `review` state or the hand-curated safety floors changes:
a merge, a revert, a delegate-to-OpenHands call, and every other hardened-high-risk action still
gates exactly as before, regardless of contract approval.

## Why it exists

The founder's latency ask (v12 §7.3, step 4): "Consent is granted at the plan level: approving the
contract approves its reversible work as a scope; per-step gates remain only at irreversible
boundaries (merge, deploy, spend, publish, outbound). Kills the residual approval round-trips
without touching the safety floors." See
[`v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §7.3 (AGT-02).

## Where to find it

No UI surface - this is a pure engine-level change inside `executeLoop`'s existing approval-mode
resolution. It is observable indirectly: on a mission whose PRD is approved, previously-`confirm`
reversible tool calls (e.g. `github.pr.open`, `github.issue.create`) execute without an approval
card appearing on `/missions/$id`, where they would have before.

## Demo script

1. Approve a spec's contract (`/prds/$id`, flip status to Approved - CNV-01's confirm step).
2. Dispatch or resume a mission linked to that spec via a `studio_changesets` row (the
   `mission_id -> prd_id` link this reads).
3. Have the agent call a reversible, non-hardened tool (e.g. `github.pr.open`).
4. Confirm no approval card appears on `/missions/$id` for that call - it executed inline.
5. Repeat with an un-approved contract: the same tool call queues an approval as it always has.
6. Repeat with a hardened tool (`calendar.create`, `studio.pr.merge`) on an approved contract:
   confirm the approval/review gate still fires - the safety floors are unaffected either way.

## How it works

- **`resolveToolMode(toolName, rawToolMode, arc, contractApproved)`** (`loop.server.ts`, exported)
  - the full mode-composition chain, extracted out of `executeLoop`'s prior inline block so its
    safety-floor ORDERING is directly unit-tested, not just the predicates it calls. Order: seeded
    mode → arc dial (`resolveApprovalMode`, `review` sticky) → `HIGH_RISK_FORCE_REVIEW` floor →
    `HIGH_RISK_MIN_CONFIRM`/`isHighRiskTool` floor → the pre-existing low-risk auto-clear → the new
    AGT-02 branch, LAST in the chain.
- **The AGT-02 branch itself** only fires when `mode === "confirm"` AND `contractApproved` AND the
  tool is in NEITHER hand-curated safety-floor set AND `toolConsequence(toolName).reversible ===
"reversible"` (the existing `tool-consequences.ts` axis - not `"partial"`, not the fail-closed
  default an uncatalogued tool gets). Every one of those four conditions must hold; failing any one
  leaves the tool at its pre-AGT-02 mode.
- **`contractApproved`** is resolved ONCE per `executeLoop` invocation (a point-in-time gate, not
  re-checked per step) via `studio_changesets.mission_id -> studio_changesets.prd_id` (the
  most-recently-updated non-null row), then `prds.status === "approved"`. `missions` itself carries
  no `prd_id` column - this reuses the exact link `test-station.functions.ts`'s
  `resolveMissionPrdId` and BYO-P3's `outcome.functions.ts` already established and rely on.
- **Scope note:** because the link is via `studio_changesets`, a mission never routed through a
  Studio/Build code-shipping dispatch (no changeset row yet) simply never gets `contractApproved =
true` - it falls back to normal per-step gating, the strictly safer default. This is a
  conservative, honest subset of the ideal "any mission executing an approved contract," not a bug.

## Governance & guardrails

- **Never touches `review`.** `resolveApprovalMode` resolves `review` before the AGT-02 branch is
  even reached, and the branch's own condition requires `mode === "confirm"`.
- **Safety floors are explicitly excluded by name, not just by chain position.** `HIGH_RISK_MIN_CONFIRM`
  (`calendar.create`, `studio.commit`, `studio.pr.open`) and `HIGH_RISK_FORCE_REVIEW`
  (`studio.pr.merge`, `studio.revert`, `delegate.openhands`) are checked directly inside the AGT-02
  condition - this matters concretely for `calendar.create`, which IS classified `"reversible"` in
  `tool-consequences.ts` yet must never auto-clear; the explicit set-exclusion is what prevents it,
  not the chain ordering alone.
- **Fails closed for uncatalogued tools** - the `Reversibility` default is `"partial"`, never
  `"reversible"`, so a tool with no entry in `tool-consequences.ts`'s `CONSEQUENCES` map never
  qualifies.
- **A missing/failed lookup is non-fatal and defaults to `false`** (no consent) - the safer
  direction, never a fail-open.

## Verification checklist

- [x] `tsc --noEmit` clean.
- [x] `bun test` full suite green (2228 pass / 0 fail), including 8 new
      `resolve-tool-mode.test.ts` cases covering every branch (regression-safe when the contract
      isn't approved, the new auto-clear for a genuinely reversible external tool, both
      hand-curated floors staying unbroken even for a reversible-classified tool, sticky review,
      the partial-reversibility non-clear, the uncatalogued-tool fail-closed case, and the
      auto-only-loosens-from-confirm invariant).
- [x] `bunx eslint` clean on every touched/new file.
- [x] A 4-lens adversarial review (safety-floor preservation, AGT-01 backward-compat, wire-format
      correctness, loop-integration-integrity) caught one real, confirmed-blocking defect in an
      earlier version of this exact lookup (an incorrect assumption that `missions` carries a
      `prd_id` column) - fixed to the verified `studio_changesets` link before this shipped; see
      "How it works" above.
- [ ] Live-mission walk of the demo script above (deferred to the primary checkout - this
      worktree's `bun run dev`/`build` hits the pre-existing node20-vs-ESM `lovable-tagger`
      failure, not a regression from this change).

## Known limits / out of scope

- **No UI surfaces this.** There is no visible "plan-level consent granted" indicator anywhere yet
  - an operator only notices its effect as fewer approval cards. A future pass could surface this
    explicitly (e.g. a note on the mission's approval history), not built here since the spec's own
    ask was the latency win, not a new UI affordance.
- **Point-in-time, not continuously re-checked.** `contractApproved` is resolved once per
  `executeLoop` call; revoking a PRD's approval mid-run does not retroactively re-gate calls
  already in flight for that same continuous run (up to the mission's step budget). This matches
  the spec's own framing of consent as a plan-level, one-time grant, not a per-step re-poll.
- **Scoped to Studio/Build-linked missions today** (see "How it works" scope note above) - a
  mission with no `studio_changesets` row never gets plan-level consent, even if its own PRD is
  approved. Extending the link to non-Studio missions (if that ever becomes a real gap) is real,
  well-scoped follow-up, not silently dropped.

## Related

- [`plan.md`](../../plan.md) §4 (2026-07-03 entry)
- [`v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §7.3
- [`agent-native-toolcalling.md`](./agent-native-toolcalling.md) - AGT-01, shipped alongside this in
  the same chokepoint-attended session
- Sibling: AGT-03 ([`speculative-prep.md`](./speculative-prep.md)) - a different "reversible" concept
  (background pre-staging, never touches the approval loop) - the two do not share a code path
