# QUEUE — S2 · MISSION CONTROL (`lane/control`)

> _Rewritten by S0 2026-08-31. **S0 writes this file; you read it and never write it.** Two fully
> specified items, topmost first. Your brief is
> [`SESSION-2-MISSION-CONTROL.md`](../../the-first-run/SESSION-2-MISSION-CONTROL.md)._
>
> **Nothing frozen is in this queue** (§0.7). **Grep before you build** (F-162, one answer in six).

---

## S2-Q1 · `claim`, and the collision mark it produces — gap #14

**Goal.** A teammate says *"I have this object"* before it starts, and a second teammate that would
have taken the same object does not.

**What problem of mine does this kill?** My team does the same work twice and I pay for both.
**What do I stop doing?** Reading two near-identical outputs and working out which to keep.

**THE CASE IS NOW CONCRETE RATHER THAN ARCHITECTURAL, and it is worth knowing before you build.**
The only **two real learnings this product has ever recorded** (F-158) were written by **two
different agents 26 seconds apart** — `data-analyst` 19:40:19, `insight-keeper` 19:40:45 — same
decision, same verdict, same summary, neither knowing the other had. **That is duplicate work, and
`claim` is the type SPEC-AGENT-COMMS §3 defines to prevent exactly it.** `claim` has **zero rows
ever**.

**Files.** `src/components/shell/**`, `src/components/today/**` (yours). The message model is mine —
`agent_messages` already accepts a `claim` with no recipient (the per-kind CHECK landed;
see `coordination/answers/S0-A06-…`), so **the row is insertable today.**

**Acceptance.** A claim is **a row comparison, never a model call** (§3, and *"the moment it needs
one it is wrong"*) · a run never collides with itself · the mark reads the exported `groupKeyOf`
rather than re-deriving it · a claim that could not be written **says so** and does not silently
proceed.

**Checked first.** `collisionsFrom` and `groupKeyOf` in `src/lib/presence/collision.ts` — both
exported, both tested, and `targetOf` now sees `studio.stage`'s nested `changes[0].path`.

## S2-Q2 · Take the route count down — SURFACE-MAP's DELETE column

**Goal.** The twelve routes marked **DELETE** stop existing, each with its callers redirected **in
the same commit**.

**What problem of mine does this kill?** Seven doors onto one question. I cannot predict what a
click does.
**What do I stop doing?** Choosing between `cockpit`, `fleet`, `swarm` and `observe`.

**Files.** `src/routes/_authenticated.{cockpit,fleet,swarm,observe,threads,inbox,drift,stakeholder}.tsx`
and the component dirs SURFACE-MAP assigns you.

**Acceptance.** **A fold without its redirect is a 404 in production** — every deleted route
redirects in the same commit · **grep for what reaches each route's server functions before
deleting** (SURFACE-MAP's standing warning: two routes marked for folding carried live Linear
integration) · the count in SURFACE-MAP's table is updated in the same commit · **`_authenticated.sync.tsx`
is AUDIT, not DELETE** — it calls `pullLinearIssue`/`pushLinearIssue`; folding it must move the
caller, never drop it.

**The measure of a good session is that the count went down** (§0.5).
