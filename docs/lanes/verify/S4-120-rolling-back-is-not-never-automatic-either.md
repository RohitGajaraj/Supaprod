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

## What I am not claiming, and it is load-bearing here

**I did not run a revert.** I traced a seed, a set membership, a mode expression and an arc
resolution across four files. That is the same kind of source-derived reasoning that produced two of
my wrong findings tonight, and S3's own words for it are *"source reading is my route interception"*.

**The cost of being wrong here is a safety claim on the landing page**, in both directions, so this
one wants a second pair of eyes before the sentence changes again.
