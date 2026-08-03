# Agent Trust Score & Autonomy Dial

> _Created: 2026-06-04 · Last updated: 2026-07-03 (RF-06: outcome quality feeds both the score and the auto-advance gate)_

> Canonical explanation of what the Trust score on `/agents` means, how it is
> computed, what the four arc levels (Observing → Proving → Trusted → Ambient)
> do at the approval gate, and how operators should think about moving the
> dial. Linked from `docs/feature-backlog.md` (C6) and
> `architecture/orchestration.md`.

## 1. What the number means (operator view)

**Scale: 0 to 100.** Every agent gets one Trust score, recomputed on every read
from the real history Supaprod already records. No cached column, can't go
stale.

|     Score | Qualitative label   | What it says                                                                                                    |
| --------: | ------------------- | --------------------------------------------------------------------------------------------------------------- |
|   0 to 34 | At-risk / Observing | Brand new or recently failed. Keep on Observing. Every tool call should queue for review.                       |
|  35 to 54 | Observing           | Below neutral. Mistakes still likely; keep human eyes on every step.                                            |
|  55 to 74 | Proving             | Earning trust. Right more often than not, but worth catching errors with a one-click confirm.                   |
|  75 to 89 | Trusted             | Consistently succeeds, takes feedback well, evals look good. Day-to-day default; confirm-mode tools run inline. |
| 90 to 100 | Ambient             | Exceptionally reliable. Runs inline except for hard-locked high-risk tools (e.g. `calendar.create`).            |

Agents with fewer than ~10 missions are pulled toward 50 (neutral) by a
Bayesian shrinkage prior so a single lucky run can't show 95.

## 2. The four ingredients (tooltip breakdown)

The chip's hover tooltip on `/agents` shows the full breakdown. The formula:

```
raw = 0.3 · mission_success_rate
    + 0.2 · approval_acceptance_rate
    + 0.2 · mean_eval_score
    + 0.3 · outcome_validated_rate
score = round( shrink(raw, samples) · 100 )
shrink(r, n) = (r · n + 0.5 · 10) / (n + 10)
```

| Weight | Signal                         | Source                                                                                                              | What it measures                                                                                                                                                                                                                                                                                                                     |
| -----: | ------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|    30% | Mission success rate           | `agent_runs.status` (`completed` vs total)                                                                          | End-to-end: did the mission finish without erroring or being rejected?                                                                                                                                                                                                                                                               |
|    20% | Approval acceptance rate       | `agent_approvals.status` (`approved` vs total)                                                                      | When the human had to decide, did they say yes? Proxy for "the agent proposed the right thing."                                                                                                                                                                                                                                      |
|    20% | Mean eval score                | `evals.score` joined via `ai_events.agent_id`                                                                       | Automated quality scores on outputs (plan quality, code correctness, spec completeness, etc.).                                                                                                                                                                                                                                       |
|    30% | Validated-outcome rate (RF-06) | `public.learnings.verdict` (`validated` vs `missed`), attributed to the agent via `decisions.decided_by_agent_slug` | Once the real-world signal came in, did the recorded outcome actually turn out to be right? "Did not crash" and "the human said yes" are not the same as "was right" — this is the ingredient that catches that gap. `mixed` verdicts have no clean directional signal and are excluded from both the numerator and the denominator. |

The total **samples** number (`missions + approvals + evals + outcomes`)
drives the shrinkage. Until it crosses ~10, the score is conservative by design.

## 3. The Autonomy Dial: what each arc actually does

The dial lives in `agent_autonomy(user_id, agent_id, arc)`. The agent loop
(`src/lib/ai/loop.server.ts`) composes the arc with each tool's per-tool
`agent_tools.mode` (`auto` / `confirm` / `review`) via
`resolveApprovalMode(toolMode, arc)` in `src/lib/ai/trust.server.ts`.

| Arc           | Effect on `auto` tools                        | Effect on `confirm` tools | Effect on `review` tools |
| ------------- | --------------------------------------------- | ------------------------- | ------------------------ |
| **Observing** | Forced to `review` (operator sees every step) | Forced to `review`        | `review` (unchanged)     |
| **Proving**   | Promoted to `confirm` (one-click)             | `confirm` (unchanged)     | `review` (unchanged)     |
| **Trusted**   | Run inline                                    | Run inline                | `review` (unchanged)     |
| **Ambient**   | Run inline                                    | Run inline                | `review` (unchanged)     |

### Safety floors (non-negotiable)

1. **`review` is sticky.** The dial can never downgrade a tool that the
   operator (or platform) has explicitly marked `review`.
2. **Hard-locked tools.** `calendar.create` and any future tool flagged
   high-risk keep `confirm` even at Ambient. Add these in the
   `resolveApprovalMode` overrides, never via the dial.
3. **Score is not auto-applied to the dial.** The UI surfaces a
   _suggested arc_ derived from the score, but the operator is the one who
   moves it. Trust must be granted, not assumed.

## 4. How operators should use it

- **Start new agents on Observing.** Watch their work; approve the good ones.
- **Promote to Proving** once you've seen a handful of clean runs. You
  still confirm everything, but with one click instead of a full review.
- **Promote to Trusted** when the score climbs into the mid-70s and you
  notice you're approving without reading. That's the signal to let it run.
- **Reserve Ambient** for agents whose mistakes you'd be comfortable
  catching after the fact, not before.
- **Demote at the first regression.** A drop in approval acceptance or a
  failed mission is a reason to step the dial back down. The safety floor
  is there for hard limits, not for routine prudence.

## 5. Where it lives in the codebase

- Table: `supabase/migrations/<ts>_agent_autonomy.sql` (`agent_autonomy`).
- Compute + combiner: `src/lib/ai/trust.server.ts`
  (`computeAllAgentTrust`, `resolveApprovalMode`, `suggestArc`, `loadAgentArc`).
- Server functions: `src/lib/trust.functions.ts`
  (`getAllAgentTrust`, `setAgentArc`).
- Loop integration: `src/lib/ai/loop.server.ts` calls
  `resolveApprovalMode(toolMode, arc)` at every tool-call gate.
- UI: `src/components/cockpit/TrustDial.tsx` (the Trust Dial on the Agents
  tab — score, the 4-stage arc as a clickable dial, suggested promotion, and
  the breakdown), wired into `src/components/cockpit/AgentsPanel.tsx`.

## 6. What this is _not_

- Not a leaderboard. The score is operator-facing context, not a public
  metric.
- Not auto-promoted. The dial is always a human decision.
- Not retroactive. Changing the arc affects future tool calls, not the
  current decision queue.
- Not a substitute for evals or guardrails. It's a summary _of_ them.

## 7. AMBIENT-ARC: surfacing the dial on the cockpit (shipped 2026-06-17)

The engine computed all of this (`getAllAgentTrust` returns `score`,
`arc`, `suggested_arc`, and the `breakdown`) and the loop already executed
unattended at the **Ambient** arc, but the cockpit only ever showed a bare
`trust_arc` string on the agent card. AMBIENT-ARC closes that visibility gap.

The **Trust Dial** (`src/components/cockpit/TrustDial.tsx`, on the Agents tab)
renders, per agent:

- the 0-100 trust **score** and sample count;
- the four arcs as a **clickable dial** (Observing → Proving → Trusted →
  **Ambient**) — the current arc is filled, Ambient glows ember; clicking a
  stage sets the arc via `setAgentArc`. The dial **is** the control;
- a **"Promote to {suggested}"** affordance whenever `suggested_arc` is higher
  than the current arc (the score-derived hint, never auto-applied — safety
  floor #3);
- an expandable **breakdown** (missions / approvals / eval-mean / validated,
  the last added by RF-06) and a plain-language meaning per arc (Ambient =
  "runs confirm-gated tools unattended where it is safe to").

This is the only place **Ambient** is shown: the user-wide AutonomyCard ladder
(Today) deliberately tops out at Trusted because Ambient is per-agent, not a
workspace stage. No new server fn and no migration — it consumes the existing
`getAllAgentTrust` / `setAgentArc`. Trust is user + agent scoped (agents are
not workspace-scoped), so the dial is intentionally workspace-agnostic.

**Fast-follow (not built):** an auto-promotion achievement on the Today
AutonomyCard when an agent crosses into a new arc.

## 8. RF-06: the arc, fed by outcome quality (shipped 2026-07-03)

The auto-advance gate (`auto_advance_agent_arc`, §5) already blocked promotion
on any rejected approval since the last arc change — "the human said no" always
sticks. But a run that completed cleanly with every gate accepted could still
turn out to have been the wrong call once real-world signal came in (a PRD
shipped, then later recorded `verdict: 'missed'` via `recordOutcome`). Before
RF-06, that never held the arc back — "did not crash" and "the human said yes"
were treated as "was right."

**What changed:**

- `auto_advance_agent_arc` now also blocks promotion if any `public.learnings`
  row attributed to the agent has `verdict = 'missed'` since the last arc
  change, mirroring the existing rejected-approval rule exactly (any single
  miss blocks promotion; `mixed` verdicts don't count either way).
- Attribution: `learnings.prd_id → decisions.prd_id → decisions.decided_by_agent_slug`
  (there is no FK between `learnings` and `decisions` — both key off `prd_id`
  independently — so this is a same-`prd_id` join, scoped by `user_id` on
  BOTH tables so a workspace-mate's differently-authored decision can never be
  joined into another user's agent's outcome count).
- The same validated-outcome rate is now the trust score's 4th ingredient (§2)
  and a "validated X/Y" display record next to the existing "approved X/Y"
  track record, both on the Govern → Approvals card
  (`src/lib/agent-track-record.ts`'s `AgentOutcomeRecord`, wired through
  `listGovernApprovals` in `src/lib/governance.functions.ts`) and on the
  Trust Dial's breakdown (§7).

**A real defect caught before commit** by a dispatched database-specialist
review of the SQL migration: the first draft's `decisions` join carried no
`user_id` scope at all (only `learnings` did). Because `decisions` RLS is
workspace-membership (not owner-only) and `createDecision` accepts a
client-supplied `prd_id` + `decided_by_agent_slug` with no ownership check,
and the 8 default agent slugs are seeded identically for every account, an
unscoped join would have let any other user insert a `decisions` row that
gets joined into a different user's agent's missed-outcome count — a
cross-tenant griefing vector against a safety-relevant gate. Fixed by scoping
`decisions` by `user_id = p_user_id` too, matching the pattern the function
already used for `agent_approvals`/`agent_runs`/`agents` (and matching both
JS-side re-implementations of the same attribution logic, which had it right
from the start). The same review also caught that the new `UPDATE` had
silently dropped the existing `set_by = NULL` reset (the marker that
distinguishes a system-promoted arc from an operator's manual override) —
restored.

**Known limit:** `learnings`/`decisions` are workspace-shared, but the
attribution scoping here (matching the pre-existing model for
`agents`/`agent_autonomy`/`agent_approvals`/`agent_runs`, all strictly
per-`user_id`, never workspace-scoped) means a teammate recording the outcome
on the agent owner's behalf is not currently counted. Consistent across all
three implementations (SQL gate, trust score, display record); a genuine
follow-on only if agents ever become workspace-shared.

## 9. Related

- A2A handoff (how receiver-arc gating applies on handoff): [`a2a-handoff.md`](./a2a-handoff.md)
- Orchestration contract (approval modes, sweeper, mission lifecycle): [`../../architecture/orchestration.md`](../../architecture/orchestration.md)
- Governance & approval gates (kill-switch, caps, Decision Queue): [`../../architecture/security.md`](../../architecture/security.md)
- AI runtime chokepoint (where the gate is enforced server-side): [`../../architecture/runtime.md`](../../architecture/runtime.md)
- Feature ticket (C6, Trust score + Autonomy dial): [`planning/archive/feature-backlog.md`](../planning/archive/feature-backlog.md)
- Parent index: [`README.md`](./README.md)
