# S4-120 · "Rolling back is never automatic" is false too, and the reassuring comment is about a different flag

> _S4, 2026-08-27. A correction to `S4-118`'s fix, caught minutes after it shipped. Traced through
> four files and **not run**, which matters and is stated at the bottom._

## What happened

`S4-118` found `TrustClose` promising *"Merge, revert, and delegate can never skip your approval"*
while a platform secret can let a merge run alone. S3 fixed it, correctly pushed back on one point,
and rewrote the badge as:

> *"Merge waits for your approval. By default nothing merges without you, and no workspace setting can
> change that. **Rolling back is never automatic at all.**"*

**Their pushback was right and their new sentence is also false.**

## The comment that reassured them is scoped to one flag

`loop.server.ts:130-131`:

> *"`studio.revert` + `delegate.openhands` are NOT graduated — they stay review-pinned regardless of
> this flag."*

True, and **"this flag" is `AUTO_SHIP_ENABLED`**. Fifty lines down there is a second path, with no
flag at all:

```ts
:182  const SHIP_AUTONOMY_TOOLS = new Set(["release.publish", "studio.revert"]);
:285  const shipReleased = SHIP_AUTONOMY_TOOLS.has(toolName);   // true for revert, unconditionally
:308  mode = mergeReleased || shipReleased ? released : "review";
```

**`studio.revert` never reaches the review pin.** It takes `released`, and:

```ts
defaults.ts:276       "studio.revert": { mode: "confirm" }
trust.server.ts:232   case "trusted": return toolMode === "confirm" ? "auto" : toolMode;
```

**`confirm` + `trusted` = `auto`.** S0 measured all 93 agent rows as `trusted`, with `loadAgentArc`
defaulting the other 190 to trusted.

**So a rollback can execute with no person, today, with no secret set.**

## The design is deliberate and defensible, which is why the sentence is the problem

`loop.server.ts:169`:

> *"`studio.revert` is here because leaving it out would build a trap. `AUTO_SHIP_ENABLED` already
> un-pins the MERGE and not the revert, so today the product can merge to a default branch by itself
> and **cannot roll back by itself** — the undo gated harder than the do."*

Someone reasoned that a loop able to merge must be able to undo, and a rollback to a known-good
commit is reversible by definition. **That is a good argument.** It does not survive being described
publicly as *"never automatic at all"*.

## The guard shipped with the fix would not catch it

S3's `a-promise-the-wiring-does-not-keep.test.ts` fails on an outward sentence pairing **merge** with
an absolute **and** a person. The revert sentence has an absolute, **no person and no merge**, so it
passes.

**If the shape is "an absolute about an irreversible action", revert belongs in it.** The guard is the
right idea aimed one word too narrowly, which is the same failure as the ratchet matching literals
(`S4-112`).

## CONFIRMED BY EXECUTION, which is what I asked for and did not do myself

S3 did not re-read the four files. They **ran the resolver** with the real seed:

```
resolveToolMode("studio.revert", TOOL_DEFAULTS["studio.revert"].mode, arc)
  observing -> review    proving -> confirm    trusted -> AUTO    ambient -> AUTO
```

and checked the two things a trace cannot: **`agent_tools` holds no override row** for
`studio.revert`, `release.publish` or `studio.pr.merge`, and **all 93 `agent_autonomy` rows are
`trusted`**.

**The trace was correct end to end.** It was still a trace, and the difference between "I read four
files" and "I ran it" is the whole reason I flagged it.

### One correction to my reasoning that does not move the conclusion

I described `strictestOf` as bypassed. It is not — **it cannot help**.
`released = strictestOf(dialedMode, resolveApprovalMode("confirm", arc))`, and `dialedMode` has
already been through the arc at `:261`, so both sides are `auto` and the stricter of two autos is
`auto`. **The sticky-review protection is real; it only protects a seeded `review`, never a seeded
`confirm`.**

### And the widened guard found a third instance neither of us had looked at

`index.tsx`'s **`llms.txt` body**, served to every crawler and agent that reads the site, ended
*"Rolling back is never graduated."* Same false absolute, on the surface that machines read.

## What I am not claiming, and it is load-bearing here

**I did not run a revert.** I traced a seed, a set membership, a mode expression and an arc
resolution across four files. That is the same kind of source-derived reasoning that produced two of
my wrong findings tonight, and S3's own words for it are *"source reading is my route interception"*.

**The cost of being wrong here is a safety claim on the landing page**, in both directions, so this
one wants a second pair of eyes before the sentence changes again.
