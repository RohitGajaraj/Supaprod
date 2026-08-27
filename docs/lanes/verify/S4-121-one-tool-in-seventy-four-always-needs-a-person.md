# S4-121 · One tool of seventy-four always needs a person, and that is a design rather than a gap

> _S4, 2026-08-27. The trust surface, counted. Traced through `defaults.ts`, `trust-ramp.ts`,
> `trust.server.ts` and `loop.server.ts`; **nothing was executed**._

## The seeds

```
74 tools seeded in defaults.ts:   52 auto   21 confirm   1 review
```

## What a trusted arc does to them

`trust.server.ts:232` — `case "trusted": return toolMode === "confirm" ? "auto" : toolMode`

**Every `confirm` tool becomes `auto`.** So on a trusted arc the seeds alone would leave 73 of 74
running with no person. Two floors sit above them:

| floor | contents |
| --- | --- |
| `HIGH_RISK_MIN_CONFIRM` | `calendar.create` |
| `HIGH_RISK_FORCE_REVIEW` | `studio.pr.merge`, `studio.revert`, `delegate.openhands`, `release.publish` |

## And two of the four are released back out, unconditionally

`loop.server.ts:308` — `mode = mergeReleased || shipReleased ? released : "review"`

| tool | released? | needs a person? |
| --- | --- | --- |
| `delegate.openhands` | never | **yes, always** |
| `studio.pr.merge` | only when `STUDIO_AUTO_SHIP=1` | yes, unless the secret is set |
| `studio.revert` | **always** (`SHIP_AUTONOMY_TOOLS`) | **no** |
| `release.publish` | **always** (`SHIP_AUTONOMY_TOOLS`) | **no** |

**On a trusted arc, exactly one tool of seventy-four always requires a human: `delegate.openhands`.**
S0 measured all 93 agent rows as `trusted`, with `loadAgentArc` defaulting the other 190 to trusted.

## This is a deliberate architecture, not a hole

`release.publish` is not unguarded. Its gate moved from a click to a proof, and `defaults.ts:232`
says so: publishing requires the change **merged, CI green at that head sha, a live preview at that
exact commit, and a recorded forecast** — enforced in `promoteChangeset`, the one place that can read
all four, which a human-initiated publish also goes through.

> *"A change nobody can grade cannot ship itself."*

**That is a stronger guarantee than a click**, and the reasoning is written down where the decision
was made. `studio.revert` is released on the argument at `:169` that a loop able to merge must be
able to undo, or the undo is gated harder than the do.

**So the finding is not "the product is unsafe".** It is that **the product's safety model is proof,
not permission** — and the public copy still describes permission.

## Why that matters for `S4-118` and `S4-120`

Both of those are the same defect seen twice: a landing badge promising a person stands in front of
an action, when the design deliberately replaced the person with evidence the loop must produce.

**The honest public sentence is available and it is stronger than the false one.** `index.tsx:157`
already writes it: nothing merges without approval by default, no workspace setting can change that,
and a platform secret can graduate an agent that has earned it — *only after* merged, CI green, live
preview and a recorded forecast.

## What I am not claiming

- **I ran nothing.** Four files traced. Twice tonight source-derived reasoning of mine was wrong, and
  this deserves the same suspicion.
- ~~**`BUILD_LANE_AUTONOMOUS` is imported and I did not trace it.**~~ **TRACED, and it does not change
  the count.** It holds `studio.stage`, `studio.unstage`, `studio.commit` and `studio.pr.open`, and at
  `:318-322` it EXEMPTS them from the high-risk min-confirm floor rather than adding one. The founder
  ruling of 2026-07-08 is stated inline: build-lane mechanics run autonomously with **no contract
  precondition**, because a branch and a draft PR are reversible and **the decisive `studio.pr.merge`
  gate stays**. So it releases four already-auto tools and floors none, and the tally is unchanged:
  one tool of seventy-four always needs a person.
- **Seeds are not the whole story**: `agent_tools` override rows exist, and S0 measured 97 of them
  with none disabled and none touching the four gates above.
