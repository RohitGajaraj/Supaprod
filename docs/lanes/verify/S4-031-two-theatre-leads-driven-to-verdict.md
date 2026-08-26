# S4-031 · Two of the theatre leads, driven to a verdict by hand

> _S4, 2026-08-26, on `lane/proof`, merged tree. `S4-028` listed thirteen findings as
> **audit-reported, not personally driven**, and said that label was the point. This closes the two
> highest-severity of them with my own hands on every link. Static; no database needed._

---

## 1 · `TestStationPanel` stamps every CI clause from a verdict about something else

**CONFIRMED. Severity: ends the feature it is.**

`src/components/engine-room/TestStationPanel.tsx:152-165`, under the heading *"Whether it meets the
spec"*:

```tsx
{plan.ci.map((item: CiPlanItem) => (
  <TestItemRow
    key={item.clauseId}
    text={item.text}
    meta={
      plan.verdict === "blocked"  ? ITEM_META.failed
      : plan.verdict === "passing" ? ITEM_META.passed
      :                              ITEM_META.pending
    }
  />
))}
```

`item` supplies only `key` and `text`. **Its own outcome is never consulted, because it does not
have one:**

```ts
// src/lib/test-station.functions.ts:45
export type CiPlanItem = { clauseId: string; text: string };
```

There is no `result` field on the type. So every CI expectation is labelled from `plan.verdict`, the
plan's overall call, which `test-station.functions.ts:55` defines as *"any failed eval or a failed
mission gate blocks"*.

**What a person therefore reads:** with an overall `passing`, every CI clause shows **PASSED**,
including ones that never ran. With `blocked`, every CI clause shows **FAILED**, including ones that
passed. The label is true of the plan and asserted of the clause.

**It is not a design choice, and the file proves that itself.** Nine lines above, the eval group does
it correctly, because its item type carries the answer:

```tsx
{plan.eval.map((item: EvalPlanItem) => (
  <TestItemRow key={item.clauseId} text={item.text} meta={ITEM_META[item.result]} />
))}
```

Two groups, side by side: one reads the per-item result, the other cannot, and only one of them says
so.

**Reachability, checked rather than assumed:** imported at `_authenticated.runs.$missionId.tsx:233`
and **rendered** at `:1518` as `<TestStationPanel missionId={missionId} />`. Worth noting because
that route carries a comment at `:1498` recording that `TestStationPanel` once *"had no caller
anywhere in the repo"*. It has one now, so this draws.

**The honest fix is not a UI change.** Either `CiPlanItem` gains a real per-clause result and the row
renders it, or the group renders `pending` for every clause until one exists and says the check has
not been made. Painting an unmeasured clause green is the worse of the two, because a person who
trusts one of these stops checking the rest.

---

## 2 · The consent card says the work resumed at the moment the driver is holding it

**CONFIRMED. Severity: misleads, on the only feedback a person gets after answering.**

Four links, each read by me:

**1. The sentence is gated on gate counts alone.** `src/components/track/TrackConsent.tsx:224-228`:

```tsx
{open.length === 0 && settled.length > 0 ? (
  <p className="text-mrd-small font-medium text-mrd-body">
    Answered. Picking the work back up.
  </p>
) : null}
```

Nothing about a drive enters that condition.

**2. `open` and `settled` split on "pending", not on "does it resume".**
`src/lib/spine/track.functions.ts:1503-1506`:

```ts
open:    gates.filter((g) => g.status === "pending"),
settled: gates.filter((g) => g.status !== "pending")…
```

So an **approved** gate is `settled`, and `open` is empty.

**3. But an approved gate explicitly does NOT resume the run.** Same component,
`TrackConsent.tsx:71-73`:

```ts
/** Statuses after which the run may be picked back up (SPEC-CONSENT §4.3). */
function releasesRun(status: string): boolean {
  return status !== "approved" && status !== "pending";
}
```

**4. And the driver is actively holding.** `src/lib/spine/attach.ts:469-471` keeps an approved gate
in `stillPending`:

```ts
if (status === "pending" || status === "approved") {
  stillPending.push(gate);
  continue;
}
```

which reaches `src/lib/spine/driver.ts:1040`:

```ts
if (input.pendingApprovals > 0) return { act: false, hold: "waiting-on-a-person" };
```

**So the card reads "Answered. Picking the work back up." while the driver's own decision for that
track is `act: false, hold: "waiting-on-a-person"`.** Both states are computed from the same row.
They disagree because one asks *"is it still pending?"* and the other asks *"does it release the
run?"*, and `approved` answers those two questions differently.

**Why this is not hypothetical.** An `approved`-but-not-executed gate is a documented resting state,
not only a crash artefact: `loop.server.ts` records that a crashed execution leaves the row
`approved` with the claim held and nothing retries it, and there is a non-crash route to the same
place when a tool call throws before the execution is claimed. Every one of those tracks shows this
sentence.

**And it persists.** `pending_gates` shrinks only on a drive tick. A track that is done, abandoned or
terminally held never ticks, so the sentence renders on every page load, indefinitely.

**The narrowest fix:** gate the sentence on the same predicate the code already has. It is one line
and the function is four lines above the render:

```tsx
{open.length === 0 && settled.some((g) => releasesRun(g.status)) ? …
```

---

## Verdict

Both **CONFIRMED**, both personally driven, both belonging to lanes that are not mine:
`src/components/engine-room/**` and `src/components/track/**`. **I have fixed neither.** The founder's
override earlier today covered the em dash sweep and I am not extending it to findings.

Eleven of the thirteen leads in `S4-028` remain **audit-reported and not personally driven**, and
they keep that label until they get this treatment.
