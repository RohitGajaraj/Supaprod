# S4-024 · C2-010 — the one answer this surface must never give is the one a broken read produces

> _Verified 2026-08-26 by S4 against `origin/lane/control` @ `c5155e186`, **before merge**, which is
> the cheapest moment to catch it. Static; no database required to reproduce the reasoning, and the
> repro at the end needs only a forced error._

## What I was testing

C2-010 draws a mark where two teammates are on the same thing, and — the part worth attacking —
**says the negative out loud**: *"Nobody is on the same thing."* A surface that speaks a negative is
a surface that can be confidently wrong, and both new files know it. `overlaps.ts` opens with the
graveyard: *"a dedupe screen that returns nothing is worse than none … the restatement fold answered
`ids: []` and ~46 tracks of honest work read as producing nothing."*

**Most of this unit is unusually careful and survives attack.** Recording that first, because the
finding below is a seam and not a sloppiness:

- `OverlapNote` draws **nothing** while the read is in flight or failed — absence of a mark claims
  nothing, and the component is explicitly forbidden from saying "clear".
- `OverlapCheck` is the only place allowed to speak the negative, and it carries what it could not
  check: unknowable runs (F-93, NULL `trace_id`) and off-board overlaps are counted separately and
  **never folded into the zero**.
- The read/write split is sound in the safe direction: `isSideEffectingTool` is
  `!READ_ONLY_TOOLS.has(toolName)` (`tool-consequences.ts:696-698`), so an *unknown* tool counts as
  a write and gets marked. It over-warns rather than under-warns, and a guard test keeps the set in
  sync with the registry.
- One read for the whole board, deduped by one react-query key. `VERB_BY_TOOL` was checked first and
  correctly rejected. Colour deferred to S0 rather than invented locally.

I could not break any of that. **The defect is between two files that are each individually right.**

## The finding

`getWorkspaceAnchors` (`src/lib/approvals-queue.functions.ts:1791-1800`):

```ts
const { data: runs, error: runsErr } = await supabase
  .from("agent_runs")
  .select("id,agent_slug,mission_id,trace_id")
  …
// A failed read claims nothing. Reporting "no collisions" because a query
// broke is the one answer this surface must never give.
if (runsErr || !runs) return { anchors: [], collisions: [], unknowableRuns: 0 };
```

**The comment is right and the line does the opposite of it**, because the zeros travel home through
the *success* channel.

Follow the value:

| Step | What happens |
| --- | --- |
| the `agent_runs` read errors | RLS denial, PostgREST error, transient failure |
| the server fn | **returns** `{ anchors: [], collisions: [], unknowableRuns: 0 }` — it does not throw |
| react-query | sees a resolved promise: `q.isError === false`, `q.data !== undefined` |
| `OverlapCheck` (`OverlapNote.tsx`) | `state = q.isError ? "failed" : (!workspaceId \|\| q.data === undefined) ? "pending" : "ready"` → **`"ready"`** |
| `check(...)` (`overlaps.ts:111-124`) | `{ found: 0, drawn: 0, offBoard: 0, unknowable: 0 }` |
| `checkLine(c, "ready")` (`overlaps.ts:223`) | `if (c.found === 0) return "Nobody is on the same thing." + tail` — and `tail` is empty because every caveat count is 0 |

**A broken query renders the sentence `"Nobody is on the same thing."` with no caveat, in the
confident voice reserved for a completed check.**

And the honest sentence that was written for exactly this case —
`"This could not be read, so it cannot say whether two are on the same thing."` (`overlaps.ts:204`)
— **is unreachable from a read failure.** It fires only if the server fn itself throws: the auth
middleware, the uuid validator, a transport error. Every failure the function was written to handle
is precisely the set of failures it hides.

The second early return, `:1825` (`callsErr` on `tool_calls`), is the same class one notch better:
it preserves `unknowableRuns`, so the line becomes *"Nobody is on the same thing. N started before
we recorded what they touch…"* — still asserting nobody, on a broken read, with a caveat that names
the wrong reason.

## Why the tests do not catch it

`overlaps.test.ts` covers the failed state's **wording**:

```
expect(checkLine(null, "failed")).toBe(…)
expect(checkLine(null, "pending")).toBeNull()
```

Nothing asserts that `"failed"` is **reachable** from a failed read. The sentence is tested; the
path to the sentence is not. That is the same shape as this repo's `pageContent.includes()` spec —
a check that passes on the artefact of correctness rather than on correctness.

## The narrowest reproduction

No database needed: force the branch.

1. In `getWorkspaceAnchors`, temporarily replace the `agent_runs` read result with
   `{ data: null, error: new Error("forced") }`.
2. Open `/today` with at least one running row.
3. **Observed today:** the check line reads *"Nobody is on the same thing."*
   **Expected:** *"This could not be read, so it cannot say whether two are on the same thing."*

Equivalently, and without touching the server: render
`checkLine(check(undefined, undefined, undefined), "ready")` — it returns
`"Nobody is on the same thing."`, and `undefined` is exactly what a swallowed failure supplies.

## The fix, named so the verdict is actionable — and it is not mine to make

The payload must be able to say *"I could not read."* Today "the read broke" and "the read succeeded
and found nothing" are the **same three values**, so no consumer can tell them apart.

Cheapest shape: add one field the failure sets — `{ anchors: [], collisions: [], unknowableRuns: 0,
readFailed: true }` — and widen `OverlapCheck`'s state to `q.isError || q.data?.readFailed ?
"failed" : …`. `src/lib/**` is S0's and `src/components/today/**` is S2's, so this is a two-path fix
and neither path is mine. **I write no `src/`.**

## Verdict

**CONFIRMED, pre-merge.** Class: a state not derived from a row that exists — the definition of
theatre, in the quietest possible form: a true-sounding sentence produced by the absence of data
rather than by data. Severity: **misleads**, on the one line the unit exists to make trustworthy,
and it defeats the unit's own stated purpose rather than merely falling short of it.

Everything else in C2-010 survived attack and several parts of it survived attacks I expected to
land. **Reopen the unit for this one seam; do not reopen the rest.**

---

# ADDENDUM · re-verified against `484878e1e` — the main seam is closed, and not by this verdict

> _S4, same day. S2 pushed `C2-010: the mark, proven and corrected` while the above was being
> written. Re-checked rather than left standing, because a stale verdict is worse than none._

**The primary seam is CLOSED, and the credit is not mine.** `484878e1e` was aimed at something else
entirely — five of six `agent_runs` insert paths never write `trace_id`, so a workspace can hold
live runs that produce no anchors at all. The fix for that is a new `checked` count
(`checked: anchors?.length ?? 0`) and a new branch in `checkLine`:

```ts
if (c.checked === 0) {
  if (c.unknowable === 0) return null;
  …
}
```

Re-trace the broken `agent_runs` read with that in place: the server still returns
`{ anchors: [], collisions: [], unknowableRuns: 0 }` through the success channel, state is still
computed as `"ready"`, `check()` still yields all zeros — but now `checked === 0` and
`unknowable === 0`, so `checkLine` returns **`null`** and `OverlapCheck` renders **nothing**.
Silence claims nothing. **The confident negative can no longer reach the screen by that path.**

S2's own comment states the principle in the same words this verdict used, arrived at independently:
*"a confident answer produced by a comparison that never ran — F-76 wearing this surface's
clothes."* Two sessions reaching the same rule from opposite ends is the best evidence the rule is
right.

## What is still open, at its true and smaller size

**The `tool_calls` early return, `approvals-queue.functions.ts:1825`**, returns
`{ anchors: [], collisions: [], unknowableRuns }` with `unknowableRuns` **preserved and possibly
non-zero**. So on a broken `tool_calls` read: `checked === 0`, `unknowable > 0`, and `checkLine`
takes the *other* arm of the new branch:

> *"None of these can be checked for overlap yet — they started before we recorded what they
> touch."*

**That names the wrong cause.** They may well record what they touch; the read that would have
looked broke. The failure has been downgraded from *a false all-clear* to *a true-shaped sentence
with a false explanation* — materially less harmful, since it no longer claims safety, and still a
state the data does not support.

The fix is the same one field and it is still S0's path: `readFailed: true` on both early returns,
with `OverlapCheck` mapping it to `"failed"`, where the correct sentence already exists and is still
unreachable.

## Standing

| | On `origin/lane/control` @ `484878e1e` | On `origin/main` |
| --- | --- | --- |
| broken `agent_runs` read → confident all-clear | **closed** — renders nothing | **still open**, C2-010 is unmerged |
| broken `tool_calls` read → wrong cause named | **open**, downgraded | **open** |
| `overlaps.test.ts` covers reachability of `"failed"` | **still no** — it asserts the wording only | — |

**Revised verdict: the finding was real, the worst of it is fixed, and the residue is one field.**
Nothing here asks S2 to reopen the unit again. It asks S0 for `readFailed` on two returns.
