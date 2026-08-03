# RF-04 — House-rules distillation

> _Created: 2026-07-03 · Last updated: 2026-07-03_

> Status · Shipped 2026-07-03 · Route(s) `/govern?tab=house-rules` · `/api/public/hooks/house-rules-tick` · Owner: chokepoint (`src/lib/ai/loop.server.ts`)

## What it does

A weekly steward pass clusters a workspace's validated learnings into short, standing operating
rules ("bets touching checkout convert 2x when scoped under a week"). Each rule is drafted
`pending`; a human approves or rejects it in the Engine Room. Only approved, non-superseded rules
are injected into every agent's system prompt at the chokepoint, right alongside the Strategic
Brief.

## Why it exists

v12's Learning Ladder names this L5 (self-revising method): the system drafts new standing
judgment from outcome clusters, a human approves. Sierra Expert Answers is the market's reference
implementation for the pattern paying off. See [`v12-self-improving-os.md`](../strategy/v12-self-improving-os.md)
§3.2 (RF-04) and §7.2 (house rules as one of the three "standing context" lifetimes).

## Where to find it

- Engine Room → **House rules** tab (`/govern?tab=house-rules`), in the "Needs you" band next to
  Approvals.
- Every agent run: house rules render as a block in the system prompt (see "How it works").

## Demo script

1. Open `/govern?tab=house-rules`. If the steward has run this week and found a real pattern
   across 2+ learnings, a pending draft is waiting with its rationale and source-learning count.
2. Approve it — the toast confirms it is "live at the chokepoint."
3. Start any agent run in that workspace; the rule now renders in its system prompt (verify via
   the run's trace in `/govern?tab=traces`, or by asking the agent what its standing rules are).
4. Back on the House rules tab, click "Supersede" on the approved rule, edit the text, and submit
   a replacement. The old rule stays active (still shown as approved) until the new draft is
   itself approved — approve it, and the old rule silently retires.

## How it works

- **Distillation** — `src/routes/api/public/hooks/house-rules-tick.ts`, a weekly cron (Monday
  10:00 UTC, migration `20260703000100_rf04_house_rules_tick_cron.sql`). Reads up to 30 days of
  `learnings` not yet cited by any existing `house_rules.source_learning_ids`, and — only when at
  least 3 undistilled learnings exist — asks an AI judge (`surface: "judge"`) to find genuine
  cross-learning patterns and draft up to 3 rules as `status: 'pending'` rows. A workspace that
  already drafted a rule this ISO week is skipped (idempotent against a cron double-fire).
- **Storage** — `house_rules` table (migration `20260703000000_rf04_house_rules.sql`),
  workspace-scoped, RLS via `is_workspace_member`. `status` is `pending | approved | rejected`
  (mirrors `decisions`).
- **Supersession** — mirrors `decisions`: retired-ness is DERIVED from an `artifact_lineage`
  edge (`relation='supersedes'`, `parent`=the new rule, `child`=the old one), never a status flag.
  `house_rule` was added to `ArtifactKind` (`src/lib/lineage.functions.ts`) for this. The pure
  derivation — `filterActiveRules` — lives in `src/lib/house-rules.functions.ts` and is
  unit-tested independent of the DB.
- **Chokepoint injection** — `getActiveHouseRulesForWorkspace` + `renderHouseRulesBlock`
  (`src/lib/house-rules.functions.ts`, modeled directly on `renderBriefBlock` in
  `briefs.functions.ts`). Wired into both `runAgentLoop` and `resumeAgentLoop`
  (`src/lib/ai/loop.server.ts`), injected immediately after the Strategic Brief block.
- **UI** — `src/components/governance/HouseRulesPanel.tsx`, styled after `ApprovalsPanel`; server
  functions in `house-rules.functions.ts` (`listHouseRules`, `decideHouseRule`,
  `supersedeHouseRule`).

## Governance & guardrails

- Every rule reaching the chokepoint passed a human approval — the weekly pass only ever inserts
  `pending` drafts, never `approved` ones.
- RLS scope: `house_rules` is workspace-member read/write. `artifact_lineage` (used for the
  supersedes edge) is owner-scoped (`auth.uid() = user_id`) — a pre-existing constraint of the
  whole lineage system, not new here (see Known limits).
- The steward pass makes zero writes beyond `pending` drafts; it never mutates `learnings` or
  auto-approves anything.

## Verification checklist

- [ ] `POST /api/public/hooks/house-rules-tick` with a valid `x-cron-key` on a workspace with 3+
      undistilled `learnings` drafts 1-3 pending rules.
- [ ] Re-running the hook the same ISO week is a no-op (`skipped: "already drafted this week"`).
- [ ] Approving a pending rule makes it appear in the next agent run's system prompt (grep the
      trace for "Workspace House Rules").
- [ ] Rejecting a pending rule never reaches the chokepoint.
- [ ] Superseding an approved rule keeps the OLD rule active until the NEW draft is itself
      approved, then retires it.

## Known limits / out of scope

- No workspace opt-in toggle yet (the steward runs for the first 5 workspaces by creation order,
  capped like `competitor-tick`); a per-workspace enable flag can be added if this needs
  targeting later.
- `artifact_lineage` RLS is owner-scoped, not workspace-scoped — in a multi-user workspace, a
  supersession recorded by one member may not be visible to another member's chokepoint read.
  Identical to how `decisions` supersession already behaves; fixing lineage RLS is a cross-cutting
  change outside this ticket.
- No verdict/confidence weighting on rules yet — every approved, non-superseded rule is injected
  with equal weight. RF-02 (outcome-weighted retrieval) is the natural place to extend this later.

## Related

- [`docs/planning/archive/build-log.md`](../planning/archive/build-log.md) §4 (2026-07-03 entry)
- [`v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §3.2, §7.2
- Siblings: [`decision-brain.md`](./decision-brain.md) (the supersession convention this follows)
