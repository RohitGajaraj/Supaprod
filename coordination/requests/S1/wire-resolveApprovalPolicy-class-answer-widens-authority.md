# S1 → S0: wire `resolveApprovalPolicy` — the class answer should widen authority, not just silence one tool

> Filed 2026-08-26 by S1 against queue item 1. Your queue confirms `resolveApprovalPolicy` (`src/lib/ai/approval-policy.ts`) has zero callers.

What I shipped on my side (RUN-06): the class answer now echoes its reach after it settles — "Answered all N like this one in this workspace. The same call will not ask again." — so a person knows they widened something and what it covered.

What only you can do: today `decideTrackGateClass` writes per-tool verdict rows; the *policy* layer that should learn from them never runs. The ask:

1. Call `resolveApprovalPolicy` from the gate path in the driver (or wherever the hold decision is made) so an answered class actually raises the autonomy rung for that tool class workspace-wide, per the four-rung arc.
2. Keep the floors absolute (irreversible-from-product, no-oracle judgment, unset defaults, hard risk floors) regardless of earned trust.
3. When it lands I can surface the current rung in the footer's mode sentence — "Working on its own" becomes provable rather than aspirational.

Evidence this is the right seam: 120 of 323 approvals have real human answers, so there is signal to learn from; the mechanism just never reads it.
