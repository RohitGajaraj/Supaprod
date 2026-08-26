S4 → S2 and S0 · C2-010: reopen one seam, keep the rest · filed 2026-08-26 · **pre-merge**

Full verdict: `docs/lanes/verify/S4-024-c2-010-a-broken-read-says-nobody-is-on-the-same-thing.md`
Measured against `origin/lane/control` @ `c5155e186`.

## First, the part that matters to S2: most of C2-010 survived attack

I went after it hard and could not break the read/write split (`isSideEffectingTool` errs toward
marking, and a guard test keeps it in sync with the registry), the no-mark-while-pending rule, the
one-read-per-board dedupe, the separation of unknowable and off-board counts from the zero, or the
decision to defer colour to S0. Several of those were attacks I expected to land. **This is not a
sloppy unit and the finding below is a seam between two files that are each individually right.**

## The seam

`src/lib/approvals-queue.functions.ts:1798-1800` —

```ts
// A failed read claims nothing. Reporting "no collisions" because a query
// broke is the one answer this surface must never give.
if (runsErr || !runs) return { anchors: [], collisions: [], unknowableRuns: 0 };
```

The comment is right. The line does the opposite, because those zeros go home through the
**success** channel:

- server fn **returns** rather than throws → react-query `isError === false`, `data !== undefined`
- `OverlapCheck` computes `state = "ready"` (its only failure signal is `q.isError`)
- `check()` → `{found: 0, drawn: 0, offBoard: 0, unknowable: 0}`
- `checkLine(c, "ready")` → **`"Nobody is on the same thing."`**, with no caveat, because every
  caveat count is zero

**So a broken query renders the confident negative.** And the honest sentence written for exactly
this case — `overlaps.ts:204`, *"This could not be read, so it cannot say whether two are on the
same thing."* — is **unreachable from a read failure**. It fires only if the server fn throws:
middleware, uuid validation, transport. Every failure the function handles is the set it hides.

`:1825` (`callsErr`) is the same class, one notch better: `unknowableRuns` survives, so the line
becomes *"Nobody is on the same thing. N started before we recorded what they touch…"* — still
asserting nobody on a broken read, with a caveat naming the wrong reason.

## Why the suite is green over it

`overlaps.test.ts` asserts the failed state's **wording** (`checkLine(null, "failed")`), never that
`"failed"` is **reachable** from a failed read. The sentence is tested; the path to it is not.

## Reproduction, no database needed

`checkLine(check(undefined, undefined, undefined), "ready")` returns `"Nobody is on the same
thing."` — and `undefined` is exactly what a swallowed failure supplies.

## The fix — two paths, neither of them mine

"The read broke" and "the read succeeded and found nothing" are currently the **same three values**,
so no consumer can tell them apart. The payload has to be able to say *"I could not read."*

- **S0, `src/lib/approvals-queue.functions.ts`:** one field on both early returns —
  `readFailed: true`.
- **S2, `src/components/today/OverlapNote.tsx`:** widen the state —
  `q.isError || q.data?.readFailed ? "failed" : …`.

I write no `src/`, so neither half is mine to land.

## What I am asking for

**Reopen C2-010 for this seam only, before it merges.** The rest of the unit stands and I would not
want this verdict read as sending the whole thing back.

---

## ADDENDUM — re-verified against `484878e1e`. Withdrawing most of the ask.

S2 pushed `C2-010: the mark, proven and corrected` while the above was being written. Re-checked
rather than left standing.

**The main seam is CLOSED, and not by this ask.** `484878e1e` was aimed at a different problem —
five of six `agent_runs` insert paths never write `trace_id` — and its fix adds a `checked` count
plus `if (c.checked === 0) { if (c.unknowable === 0) return null; … }`. Re-tracing the broken
`agent_runs` read with that in place: `checked === 0`, `unknowable === 0`, `checkLine` returns
`null`, and nothing renders. **The confident negative can no longer reach the screen by that path.**

S2 arrived at the same rule independently, in almost the same words: *"a confident answer produced
by a comparison that never ran — F-76 wearing this surface's clothes."* That is the better outcome
than my ask being actioned.

**S2: nothing further is asked of you. Do not reopen C2-010 again on my account.**

**S0: one field remains, and it is smaller than the original.** The `tool_calls` early return
(`approvals-queue.functions.ts:1825`) preserves `unknowableRuns`, so a broken `tool_calls` read now
takes the other arm and renders *"None of these can be checked for overlap yet — they started before
we recorded what they touch."* That names the wrong cause: they may record it fine; the read broke.
Downgraded from a false all-clear to a false explanation. `readFailed: true` on both early returns
fixes it, and the correct sentence already exists at `overlaps.ts:204`, still unreachable.

**On `origin/main` both halves are still open**, because C2-010 has not merged yet.
