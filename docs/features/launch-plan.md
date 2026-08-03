# JNY-04 — Launch and GTM kit

> _Created: 2026-07-03 · Last updated: 2026-07-03_

> Status · Shipped 2026-07-03 · Route(s) `/prds/$id` (Launch tab) · Owner: Launch (`src/lib/launch-plan.functions.ts`)

## What it does

A new "Launch" tab on a spec's detail page composes the layer above LCH-01's existing channel-copy
generator: a positioning paragraph grounded in the spec's own intent and the decision that approved
it, a standing launch checklist, the spec's stated success metric (pulled from its compiled
Outcome Contract, never invented), and an armed outcome-check window, a future date before which
RF-01's outcome-tick pass will not draft a verdict for this PRD.

## Why it exists

The v12 journey audit graded "Launch / GTM / marketing" THIN: a launch-kit generator (LCH-01)
already exists in Build, drafting channel copy from a shipped changeset, but nothing composes a
launch plan from the decision graph's own WHY, and nothing arms a sensible window before judging
whether a launch worked. See [`strategy/v12-self-improving-os.md`](../strategy/v12-self-improving-os.md)
§8.4 (JNY-04).

## Where to find it

`/prds/$id`, the "Launch" tab (alongside Edit / Preview / Contract / Flow). Channel copy itself
(changelog/blog/email/social/docs) is still generated per shipped changeset on the Build page
(LCH-01) — this tab does not duplicate it.

## Demo script

1. Open a spec that has a compiled Outcome Contract (Contract tab) with at least one success
   metric, ideally one that traces to an approved `decisions` row.
2. Click the Launch tab, then "Draft launch plan."
3. A positioning paragraph appears, grounded only in the contract's `intent` and the linked
   decision's `rationale` (falls back to the PRD body if neither exists).
4. The standing launch checklist renders with five items, all unchecked; click any to toggle it.
5. The success metric shows the first stated `success_metrics` clause from the contract, or an
   honest "none stated yet" if the contract has none.
6. The outcome check shows an armed date 30 days out. Change the day count and click "Rearm" to
   reschedule it.
7. Ship this PRD (status becomes `shipped`) and confirm via `outcome-tick`'s logic (not
   live-testable in this worktree) that it is excluded from the RF-01 pending-suggestion pass
   until `check_by` has passed.

## How it works

- **Schema** — `launch_plans` (migration `20260703040000_jny04_launch_plan.sql`): one row per PRD
  (`UNIQUE(prd_id)`), `positioning` text, `checklist` jsonb, `success_metric` text, `check_by`
  timestamptz. Regenerating upserts in place, same convention as DSN-03's `prd_flows`.
- **Positioning** — the only AI call in this feature (`generateLaunchPlan`), strictly grounded in
  the PRD's `contract.intent`, the most recent linked `decisions.rationale`, or the PRD body as a
  last resort; the system prompt explicitly forbids inventing a benefit the text does not support.
- **Checklist and success metric** — deliberately NOT AI-generated. `defaultLaunchChecklist` is a
  fixed, deterministic template (pure, unit-tested); `pickSuccessMetric` deterministically picks
  the contract's first stated metric or returns `null` (pure, unit-tested). Keeping these
  deterministic avoids inventing operational checklist items or metrics an AI call might
  hallucinate for something that should read as a standard operating procedure.
- **The outcome window** — `defaultCheckByDate` (pure, unit-tested) arms `check_by` 30 days from
  generation by default; `rearmOutcomeCheck` lets the operator reschedule it. `outcome-tick.ts`'s
  existing RF-01 pending-suggestion query now fetches `launch_plans.check_by` for the batch it is
  about to process and filters out any PRD whose window has not yet closed, additive-only: a PRD
  with no launch plan (or no `check_by` set) is evaluated exactly as before.

## Governance & guardrails

- Workspace-scoped RLS on `launch_plans` (`is_workspace_member`), matching the rest of the
  register.
- The positioning AI call never writes to `prds` or `decisions`; it only reads them.
- `outcome-tick`'s filter only ever narrows the RF-01 batch (skips a PRD), never widens it or
  changes any other tick behavior.

## Verification checklist

- [x] `tsc --noEmit` clean.
- [x] `bun test` full suite green (2173 pass / 0 fail), including 7 new
      `launch-plan.functions.test.ts` cases pinning `defaultLaunchChecklist`/`pickSuccessMetric`/
      `defaultCheckByDate`.
- [x] `bunx eslint` clean on every touched/new file (0 errors; 1 pre-existing unrelated warning in
      `_authenticated.prds.$id.tsx`).
- [x] `bun scripts/lint-migrations.ts` — 0 apply-fatal errors on the new migration.
- [ ] Live-browser walk of the demo script above and a live confirmation that `outcome-tick`
      actually skips an armed PRD (deferred to the primary checkout before publish, this
      worktree's `bun run dev`/`build` hits the pre-existing node20-vs-ESM `lovable-tagger`
      failure; the cron itself is not runnable outside the live scheduler).

## Known limits / out of scope

- **No email/Slack send.** JNY-04's "stakeholders notified" checklist item is a manual checkbox,
  not a real send — that is FS-03/JNY-05's territory (the reach channel), not duplicated here.
- **The checklist is fixed, not per-launch customized.** A future pass could let an operator add
  a custom item; kept to the standing five for now, matching the "standard operating checklist"
  framing rather than inventing per-launch items.
- **Not yet live.** The migration is code-complete and gate-verified but not yet applied to the
  live database; it lands on the founder's next publish, same as the other migrations shipped this
  session.

## Related

- [`planning/archive/build-log.md`](../planning/archive/build-log.md) §4 (2026-07-03 entry)
- [`strategy/v12-self-improving-os.md`](../strategy/v12-self-improving-os.md) §8.4
- Siblings this reuses the idiom of: LCH-01 (`generateLaunchKit`, channel copy, not duplicated),
  CNV-01 (the `contract.intent`/`success_metrics` source), RF-01 (`outcome-tick`'s pending-
  suggestion pass, now window-gated)
