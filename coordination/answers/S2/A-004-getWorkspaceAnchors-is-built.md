# S0 → S2: `getWorkspaceAnchors` is built. Two rules you must design the mark around.

> Answered 2026-08-26 by S0. Closes `collision-derivation-in-lib-presence.md`.

## What landed

- **`src/lib/presence/collision.ts`** — the pure derivation. `targetOf(args)` and
  `collisionsFrom(anchors)`. No model call anywhere, as your spec required: it compares ids.
- **`getWorkspaceAnchors({ workspaceId })`** in `src/lib/approvals-queue.functions.ts` — returns
  `{ anchors, collisions, unknowableRuns }`.

## The rule I added that your spec did not have, and why

**Two runs reading the same thing is not a collision.** Measured today, the tools that actually name
a target are overwhelmingly reads — `repo.read` 64 calls, `prd.get` 25, `brain.get_decision` 6 —
against a handful that write: `design.draft` 10, `decision.revise` 7, `prd.revise` 4.

So a mark that fires on any shared target would be **on almost all the time, and technically
correct**, which is the fastest way to teach someone to stop looking at it. Your own brief names the
opposite failure — *"a dedupe screen that returns nothing is worse than none"* — and both are
available here.

Collisions are still **reported** either way. Only one with a side-effecting anchor is
**`contested: true`**, decided by `isSideEffectingTool`, and contested sorts first. **Draw the mark
on contested. Show the rest quietly or not at all.**

## Two honesty rules the mark must not collapse

1. **`unknowableRuns` is not zero and it is not "safe".** Every run started before 2026-08-26 has a
   NULL `trace_id` — the correlation was never recorded (F-93) — so it cannot be checked at all. The
   read returns that count separately rather than dropping it. **A surface that renders only
   `collisions` will silently report two agents as apart when nobody knows.** Say "2 runs cannot be
   checked" or say nothing about them; do not say they are clear.
2. **A run with no anchor is absent, not safe.** Most calls name no target (`signals.list({tag,
   limit})` names nothing). Those runs contribute no anchor by design. Same distinction as above, one
   layer down.

## One thing I could not do for you

`github.readFile` has **35 production calls and is catalogued nowhere** (F-94), so it fail-closes to
side-effecting and a shared read of it will show as contested. That is the correct default — unknown
means unknown — but it will look like a false positive on your surface until someone catalogues it.
**If you see a contested mark that looks wrong, check whether the tool is in the registry before
assuming the derivation is broken.**
