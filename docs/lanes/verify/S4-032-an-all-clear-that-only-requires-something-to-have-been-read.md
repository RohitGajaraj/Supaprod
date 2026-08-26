# S4-032 · One rule, three surfaces: an all-clear that requires *something* to have been read, not *everything*

> _S4, 2026-08-26, on `lane/proof`, merged tree, plus `origin/lane/control` for the third site.
> Driven by hand. Two of these came from the `S4-028` audit and are now personally verified; the
> third I found independently this morning in `S4-024`, which is why the pattern is worth stating
> once rather than three times._

## The rule, and it is the only thing anyone needs to remember

> **A surface may say "nothing is wrong" only when it can show that everything was read. If any read
> failed, the honest sentence is that it could not look.**

Every defect below is the same mistake: a readiness test written as *something answered* where it
had to mean *everything answered*. Each is an `&&` that should be an `||`, or an `isLoading` that
should also ask `isError`.

---

## Site 1 · `VerifyCockpit` never consults `isError` at all

**CONFIRMED, and it is the worst of the three.**
`src/components/engine-room/rooms/VerifyCockpit.tsx:502`:

```ts
const summaryReady = !approvalsQ.isLoading && !appliedQ.isLoading;
```

An errored query is **not loading**. So on a failed read `summaryReady` is `true`, and:

```ts
const pending = (approvalsQ.data?.approvals ?? []).filter((a) => a.status === "pending");  // []
const applied = appliedQ.data?.changes ?? [];                                              // []
```

which reaches `cockpitVerdict(0, 0)` at `:100-109` and renders, verbatim:

> **"Nothing is waiting on you, and no applied changes on the record yet. Everything the agents did,
> in one place."**

**A reassuring all-clear, produced entirely by the absence of an answer.** Nothing distinguishes it
from the same sentence on a genuinely quiet workspace. The fix is one clause:
`!approvalsQ.isError && !appliedQ.isError && summaryReady`, falling back to the sentence that says
the read failed.

---

## Site 2 · `Diagnostics` guards one direction of this and not the other

**CONFIRMED, but narrower than the audit reported, and the file deserves the credit.**

`src/components/settings/DiagnosticsSection.tsx:59-60`:

```ts
const bothFailed = sloQ.isError && runawayQ.isError;
const loading    = sloQ.isLoading && runawayQ.isLoading;
```

Both are `&&`, so **one** failed read never reaches the honest heading at `:82`
(*"The reliability reads failed, so nothing below is known."*). It falls through to
`rollup.headline`.

**But `summarizeHealth` is more careful than a quick read suggests**, and `S4-028` overstated this.
`src/lib/reliability/health-view.ts:68-72` protects one direction explicitly, and names the contract
while doing it:

```ts
// The SLO budget is the primary health signal. If only the runaway read has answered (and it is
// clean), we cannot yet claim "healthy" without over-claiming on an unread budget. Honor the
// "never a false healthy" contract: report unknown until the primary read resolves.
if (!slo && runaway && watch === 0) {
  return { state: "unknown", headline: "Checking AI call health now.", signals: [] };
}
```

**The opposite direction is unguarded.** With `slo` present and `runaway` undefined:

```ts
const spinning = runaway?.flagged.filter((f) => f.severity === "runaway").length ?? 0;  // 0
const watch    = runaway?.flagged.filter((f) => f.severity === "watch").length ?? 0;    // 0
```

The missing read contributes **zero signals**, which is indistinguishable from a clean one, so a
healthy budget falls straight through to:

```ts
return { state: "healthy", headline: "Everything looks healthy.", signals };
```

**So the precise finding is: a failed runaway scan plus a healthy SLO renders "Everything looks
healthy.", and the runaway scan is the one that detects missions spinning right now.** Its absence is
reported as none spinning.

The author reasoned that the SLO is the primary signal and protected the case where *it* is missing.
That reasoning is sound and half-applied: `?? 0` on an unread source is the same over-claim the
comment forbids, pointing the other way.

---

## Site 3 · The same shape, found independently this morning

`S4-024`: `getWorkspaceAnchors` returns `{ anchors: [], collisions: [], unknowableRuns: 0 }` on a
failed read, **through the success channel**, so `OverlapCheck`'s only failure signal (`q.isError`)
never fires and the board renders *"Nobody is on the same thing."*

S2's `484878e1e` has since closed the worst of that from a different direction, and the residue is
one field. Recorded here only to show the count: **three surfaces, one rule.**

---

## Why this class is worth a rule rather than three fixes

All three sentences are *reassurance*. That is what makes the class expensive: a person who reads
"nothing is waiting on you" stops looking, which is the entire purpose of the sentence and the exact
reason it must never be produced by silence. And `health-view.ts` proves the rule is already known
here, in its own words: **"never a false healthy."** It is written down, it is enforced in one
direction at one site, and it is absent at the other two.

**Cheapest durable form**, and it is not mine to build: a shared helper both surfaces call, e.g.
`readState(...queries)` returning `"loading" | "failed" | "ready"`, where `failed` is any error and
`ready` requires every query to have answered. Three call sites, one definition, and the `&&`/`||`
question stops being re-decided per surface.

## Verdict

- `VerifyCockpit.tsx:502` — **CONFIRMED**, all-clear on a failed read, no error check anywhere.
- `DiagnosticsSection.tsx:59` with `health-view.ts:68-72` — **CONFIRMED in one direction only.**
  `S4-028` stated this more broadly than the code supports; corrected here.
- Ownership: `engine-room/**` and `settings/**` are S3's, `reliability/**` is S0's. **I have fixed
  nothing.**
