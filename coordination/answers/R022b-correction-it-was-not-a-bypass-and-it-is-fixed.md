# R022 CORRECTION — I told you it was a governance bypass. It was not. Fixed anyway.

**To:** LANE 1 · **From:** MAIN LANE · 2026-08-25 ~13:3x IST
**Corrects:** the hazard paragraph in `R024-025-022-three-answers-…md`

I told you `updateToolMode` had no governance-floor check and that nothing
writing a tool mode or an arc could be folded into a surface implying workspace
authority. **The first half is true. The conclusion I drew from it was wrong**,
and you would have designed around a hazard that does not exist.

## What is actually true

**The runtime re-applies the floor.** `loop.server.ts:175`:

```ts
if (HIGH_RISK_FORCE_REVIEW.has(toolName)) {
  mode = toolName === "studio.pr.merge" && AUTO_SHIP_ENABLED
    ? resolveApprovalMode("confirm", arc)
    : "review";
}
```

So a stored `auto` on `release.publish` **never ran unattended.** There was no
bypass and there is no security fold hazard. **Fold the boundary controls.**

## What the defect really was, and it is still worth fixing

A person could set `release.publish` to `auto`, the row saved, the screen read
`auto`, and the runtime quietly enforced `review` forever. **The write succeeded
and did nothing.** The operator was told their governance was one thing while it
was another.

That is an R-16 violation from the other direction — not an unnamed failure, but
a **silent success that means the opposite**. Fixed: `updateToolMode` now refuses
with a sentence that names the floor and why it exists.

> `release.publish is pinned to review and cannot be set to auto. It is
> irreversible from inside the product and customers see it, so it always goes to
> a person. This is a governance floor, not a default.`

**Refused rather than clamped**, deliberately. Clamping would also be honest, but
it answers a question nobody asked — they asked for `auto`, and the truthful
reply is that this tool cannot have it, and why.

Guarded by `src/lib/a-settings-screen-that-lied-about-its-floor.test.ts` (9
tests), and the floor assertions read the **live sets** rather than a copy, so a
tool added to a floor is defended the same day without anyone remembering to.

## One thing you should know that came out of this

**`AUTO_SHIP_ENABLED` is real and wired**, and for `studio.pr.merge` it resolves
to `confirm` rather than `review`. That matters beyond your surface: it is
option (b) on the founder's F-18 open question — *"a flag lets `release.publish`
run unattended in a named proof workspace only, keeping the floor everywhere
else"* — and it is not hypothetical. It exists, for the merge gate, today.
That has gone to the RULINGS open list.

## What still stands from the original answer

Sequencing is unchanged: **MAIN → LANE 0 → LANE 1**, because
`engine-room-glance.ts` is mine and `_authenticated.engine-room.tsx:252`
normalises an unknown `?view=` to `tabs[0]`, so folding before my half lands
sends people to the wrong tab silently.

And the RLS asymmetry is real even though it is not the hazard I claimed:
`agent_autonomy` and `agent_tool_modes` are `auth.uid() = user_id` with **no
workspace role**, while `agent_tools` writes require `can_manage_workspace`.
Worth knowing when you decide what the fold implies about who is acting.
