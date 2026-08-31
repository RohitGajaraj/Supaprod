# S4-190 · It corrected itself, unattended, and corrected the wrong thing

**Measured 2026-09-01, 21:10 UTC live. Lane `lane/proof`.**

## I said it would be given up. It was not, and I was wrong

Twenty minutes before this, S4-189 reported `ce846e9b` at `attempts = 3` — the
give-up ceiling — and said the run that would prove R-18 was one tick from
dying. At the 21:10 tick the loop **sent it back to Define and reset attempts to
0**, on its own.

```
21:10:00  build  -> define   actor=system  driven_via=sweep
20:21:09  design -> build     actor=system  driven_via=sweep
20:00:26  define -> design    actor=system  driven_via=sweep
19:41:11  decide -> define    actor=system  driven_via=sweep
19:30:38  sense  -> decide    actor=system  driven_via=sweep
```

**Six transitions, every one `actor='system'` and `driven_via='sweep'`, zero
presses, zero answered approvals — and the sixth is a self-correction.** Three
refusals at Build, then the loop re-planned its own work with no person in it.

**That is stronger evidence for R-18 than a clean walk.** A clean walk shows the
loop can go forwards. This shows it notices it is stuck and does something.

## And it corrected the wrong thing

`product_id` and `project_id` are still NULL. The repository Build sees has not
changed. Define will re-spec, Design will re-design, and Build will meet the same
sixteen checkout files and refuse for the same reason it gave three times.

**That is a cycle, not a recovery.** `going-in-circles` is a hold that exists for
precisely this, and it sits in `TERMINAL_HOLDS`. So the ceiling moved rather than
lifted: instead of `given-up` after three Build attempts, it is
`going-in-circles` after however many laps.

**A re-plan cannot reach a binding fault, because nothing in the spec is wrong.**

**The cost is already on the record.** The track was at station 5 of 7 an hour
ago and is now at station 3, having spent 0.166 USD to get further from Learn.

## What would have prevented it is built, and duplicated

`src/lib/connectors/product-binding.functions.ts` exports four functions and
**all four are orphaned**: `listProductBindings`, `upsertProductBinding`,
`removeProductBinding`, `listProducts`.

`listProducts` carries its own consumer in its comment:

> Used by the ProductBindingsSection to drive the per-product binding UI.

**That component exists** — `src/components/connections/ProductBindingsSection.tsx`,
280 lines, live on `/sync` — and calls **a different implementation**:
`listProductBindings` at `src/lib/connections.functions.ts:837`. There is no
re-export between them. **Two implementations of the same function in two
modules, one wired and one not.**

**The module is half-live**, which is what makes this a ruling rather than a
cleanup: `createRepoForProduct` in the same file is genuinely used by
`CreateRepoModal`. So it is neither dead weight to delete nor a gap to fill — it
is a **duplicate to merge**, and the two differ in shape rather than only in
wiring:

| | wired (`connections.functions.ts:837`) | orphaned (`product-binding.functions.ts:48`) |
| --- | --- | --- |
| input | `{ projectId }` | none |
| scope | one product | every product-scoped binding the caller can see |
| returns | raw `BindingRow[]` | decorated with connection status, account label, owner name |
| clients | RLS only | RLS for bindings, admin for connections and profiles |

Which survives is a product call, not a verification one, and it is S0's.

## The gate saw a fix, not only debt

Same run: **server functions 142 → 141.** `getSubjectEvidence` left the list —
S1's mount landed. The naming added in S4-185 is now doing both halves of its
job: it named the four that arrived, and it showed the one that left.

## Method note

I published a prediction — *"one tick from `given-up`"* — and the next tick
falsified it. It is recorded here rather than quietly dropped, and the correction
went to S0 within two minutes because they may have been acting on it. The
underlying finding (the wrong repository, the NULL binding) survives the
correction intact; only my claim about what would happen next was wrong.
