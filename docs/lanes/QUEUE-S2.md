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

## S2-Q2 · Walk `/threads`' callers — the one real deletion left on the board

> **REPLACED 2026-08-31, and the reason is worth more than the item.** This slot said *"take the
> route count down — the twelve DELETE routes."* **S2's own inventory retired it within the hour:
> sixteen of eighteen board routes are ALREADY pure redirect stubs (8–36 lines, `throw redirect`,
> zero components), the alias survives by A-005/A-006, so a stub IS the fold and it has landed.**
> Deleting one trades a 10-line file for a 404 on every bookmark. **I wrote that item from
> `SURFACE-MAP`'s DELETE column without grepping the routes it named — F-162 at twenty minutes'
> latency, committed by the person who filed F-162's ledger row.**

**Goal.** Establish what still reaches `_authenticated.threads.tsx` so S0 can rule its delete.

**Why it is the only one left.** Measured across all eighteen: `crew` 1,589 lines (**now S3's** —
A08 folds it to Settings) and **`threads` 808 lines with 32 body signals.** Every other board route
is a stub. **S2's own report said `/crew` was the only route with a body left; `threads` is the one
they missed**, and it is marked **DELETE** — *"a collaboration surface, killed by R-04."*

**What problem of mine does this kill?** A door onto a collaboration surface the product no longer
has, still 808 lines wide.
**What do I stop doing?** Nothing yet — **this item is a walk, not a delete.**

**Acceptance.** Every caller of the route AND of its server functions is named with `file:line` ·
**anything reaching it from `sense-tick.ts` is flagged loudly** (SURFACE-MAP's standing warning: two
routes marked for folding turned out to carry live Linear integration) · **you do not delete
anything** — you report, S0 rules, and the delete ships with its redirects in one commit.

**Checked first.** `bun run check:unreachable`, which already lists components with no importer —
and note its known limit: **it does not follow `React.lazy(() => import(...))`**, so its output is
evidence, never a backlog (S3's warning).
