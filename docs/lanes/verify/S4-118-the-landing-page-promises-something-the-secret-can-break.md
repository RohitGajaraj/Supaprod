# S4-118 · The landing page makes an absolute promise the product is configured to break

> _Created: 2026-08-27 · Last updated: 2026-08-27_

> _S4, 2026-08-27. Outward copy, so this is presented rather than fixed: it is the founder's call and
> `docs/pitch/`'s procedure, not a lane's._

## Two public claims on the same site, and they do not agree

**`TrustClose.tsx:54-56`**, on the landing page, as a trust badge:

> **Merge is always human**
> *"Merge, revert, and delegate can **never** skip your approval."*

**`index.tsx:157`**, on the same site, carefully:

> *"by default nothing merges, ships, or takes an irreversible outward action without a human
> approval, and no workspace setting can change it. **A platform secret can let an agent that earned
> it merge alone**, and only after the change is merged, CI was green at that commit, a live preview
> exists at it, and a forecast was recorded to grade it."*

**One is an absolute. The other says an absolute is not what is on offer.**

## The wiring says `index.tsx` is right

`ai/tools/defaults.ts:238` and `ai/loop.server.ts:132`:

```
const AUTO_SHIP_ENABLED = process.env.STUDIO_AUTO_SHIP === "1";
"studio.pr.merge": { mode: "confirm", … }          // F-75 moved it off "review"
mode = mergeReleased || shipReleased ? released : "review";
```

- **Flag OFF** — `mergeReleased` is false, the merge is pinned to `review`, a person decides. The
  promise holds.
- **Flag ON, trusted arc** — the merge executes inline. **No person is asked.**

And F-75's own comment records that **the founder set that secret**: *"`STUDIO_AUTO_SHIP=1` WAS SET
AND DID NOTHING, and this line is why."* It did nothing because of a separate bug, now fixed. **The
fix makes the promise breakable in the configuration the product is already in.**

## Why this one matters more than a wording slip

It is the **trust close**. It is the last thing a visitor reads before deciding whether an agent
touching their repository is safe, and it is stated as a guarantee — *"always"*, *"never"* — rather
than as a default.

The file's own comment, four lines above, names this exact class about a different case:

> *"the hero claiming 'No human intervention' while TrustClose promised merge can never skip
> approval: **a surface asserting a capability the wiring does not give it**."*

Here it is the same shape one turn further: **a surface asserting a GUARANTEE the wiring does not
keep.**

## What the honest form probably is, and it is already written

`index.tsx` has it. **"By default, nothing merges without your approval, and no workspace setting can
change that"** is a strong claim, is true, and survives the secret being set. The two words doing the
damage are *always* and *never*.

## What I am not claiming

- **Not a bug in F-75.** S0's change is correct and its safety reasoning is sound in both flag
  directions. The defect is that a public absolute was written when a default was true.
- **I did not verify `STUDIO_AUTO_SHIP` is set in production.** The comment says the founder set it;
  I cannot read production env from here.
- **Outward copy is the founder's, through `docs/pitch/`.** I am not proposing a rewrite, only
  showing that two public surfaces disagree and which one the code supports.
