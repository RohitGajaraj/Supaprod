# S4-033 · Three more leads driven, and two corrections to my own audit

> _Created: 2026-08-26 · Last updated: 2026-08-26_

> _S4, 2026-08-26, on `lane/proof`, merged tree. Continues closing the `S4-028` list by hand. Two of
> the three are confirmed at a **smaller** size than the audit claimed, and that is recorded as
> plainly as the confirmations._

---

## 1 · "step 6 of 8" counts a skipped step as a done step

**CONFIRMED, and it is the operating model's own named example.**

`src/components/runs/RunBoard.tsx:361` (and the same figure in `RunsGrid.tsx:395` and `:423`):

```tsx
step <Figure>{progress.done}</Figure> of <Figure>{progress.total}</Figure>
```

`progressById` is built at `_authenticated.runs.index.tsx:848-851` from `missionProgress(m.steps)`,
and that function is `src/lib/delegate-desk.ts:154-159`:

```ts
const total = list.length;
const done  = list.filter((s) => STEP_DONE.has((s?.status ?? "").trim().toLowerCase())).length;
```

**`STEP_DONE` contains `"skipped"`** (`delegate-desk.ts:138-151`, alongside `executed`, `completed`,
`complete`, `succeeded`).

So *"step 6 of 8"* can be four steps executed and two skipped. §1.3 of the operating model names this
case exactly: *"a progress bar over a route that waives stations."*

**But the honest size is smaller than the audit's phrasing**, and it matters:

- Read as **position** — *"we are past six of the eight markers"* — counting a skipped step is
  **correct**. The work really did move past it.
- Read as **work carried out** — *"six steps have been done"* — it overstates.

The surface invites the second reading, because on the board this figure sits beside an activity
verb: *"Engineer is writing the change, step 6 of 8"*. The arithmetic is defensible; the pairing is
what misleads.

**So the fix is wording, not counting.** Either say what was skipped, or keep the figure away from a
verb that claims work. `delegate-desk.ts:153` already describes it accurately in its own docstring
(*"how many steps have reached a terminal-done state"*), which is the honest sentence; the surface
just does not say it.

**How often this bites is a database question I cannot answer** (how many mission steps carry
`skipped`). If skipped steps are rare it is nearly harmless; if they are common it is a standing
overstatement. Worth one count before anyone spends effort on it.

---

## 2 · A settled receipt announces the next agent as currently working

**CONFIRMED on the substance. One detail of the audit's claim is WRONG and is corrected here.**

`src/components/meridian/Receipt.tsx:103`:

```tsx
<AgentMark slug={handoff.slug} name={handoff.name} state="running" />
```

**`state="running"` is a literal with no condition.** Any receipt row carrying a `handoff` draws the
next agent in the machine-is-working colour, whatever the row's actual age or outcome.

And a screen reader is told so. `src/components/meridian/marks.tsx:123`:

```tsx
aria-label={state === "idle" ? label : `${label}, ${state}`}
```

With `state="running"`, that renders **"&lt;agent&gt;, running"**.

**Reachable, and on the surface where it is least appropriate:** `Receipt` is rendered at
`SettlePanel.tsx:1147` (and via `ReceiptStack` at `:562` and `:840`). The settle panel is Learn's
record of what already happened, so every row there is by definition historical. The other call
site, `MembersCard.tsx:374`, passes no `handoff` and is unaffected.

**The correction.** `S4-028` reported that this mark *"animates indefinitely"*. **It does not.**
`marks.tsx:44-46` states the design ruling: `gate` is *"The one animated state"*; `running` is
*"Ambient, not urgent."* So the defect is the colour and the announced state, not motion. The audit
overstated it and the smaller claim is the true one.

---

## 3 · The pass rate is painted green when there is no eval data

**CONFIRMED, and cosmetic is the right severity, but only because of one thing.**

`src/components/engine-room/rooms/QualityRoom.tsx:120-127`:

```tsx
<FigureCard
  label="Pass rate"
  value={passRatePct != null ? `${passRatePct}%` : "-"}
  tone={ health?.verdict === "at-risk" ? "fail" : health?.verdict === "watch" ? "hold" : "pass" }
/>
```

`getEvalHealth` returns four verdicts, not three — `engine-room-glance.ts:644`:

```ts
verdict: "healthy" | "watch" | "at-risk" | "no-data";
```

The ternary handles `at-risk` and `watch` and sends **everything else to `"pass"`** — which catches
both `"no-data"` and `health === undefined`. So with no eval data at all the figure is **pass-green**.

**What keeps this cosmetic is that the value is honest:** it renders `-`, not a number. A green `-`
is odd rather than false. It is still a fail under R-20's restraint rule, where colour is reserved
for the one live fact, and the comment directly above it argues that the pass rate *"is genuinely an
OUTCOME, which is the one case where a figure is entitled to a hue"* — an argument that only holds
when the outcome exists. `no-data` deserves the neutral tone, and the four-value union already gives
it a name.

---

## Verdict

| Lead | Result |
| --- | --- |
| `RunBoard`/`RunsGrid` step count | **CONFIRMED**, smaller than claimed. Arithmetic defensible as position; the pairing with an activity verb is the defect. Needs one DB count to size. |
| `Receipt.tsx:103` | **CONFIRMED**, with the animation claim in `S4-028` **withdrawn**. Colour and aria only. |
| `QualityRoom.tsx:125` | **CONFIRMED**, cosmetic, because the value stays honest while the tone does not. |

**Corrections to my own audit, twice in one document** — the receipt does not animate, and the
Diagnostics claim was narrowed in `S4-032`. Both came from reading the code rather than the report,
which is the entire argument for the label `S4-028` put on those thirteen leads. **Eight remain
audit-reported and not personally driven.**

Ownership: `runs/**` and `today/**` are S2's, `meridian/**` is S0's, `engine-room/**` is S3's.
**I have fixed nothing.**
