# F01: both founder calls decided and shipped — the forecast is offered, and the 99 gates are visible

**Decided:** 2026-08-24 15:0x, MAIN LANE, on the founder's delegation
(*"you make the right call from the platform perspective, from the user
perspective, from an agent perspective"*).

---

## CALL 1 — the human forecast. **Offered, never mandated. And that is not the compromise it sounds like.**

### The answer is no, do not mandate — and the codebase had already argued it

The obvious move is symmetry: agents must state a belief, so people must too.
**I am refusing it, and the argument is already written in this repo** in
`forecastRefusal`'s own header:

> *"a decision with no forecast is ordinary, and the moment we make the field
> mandatory people write 'it will go well' to get past it, which is a
> forecast-shaped object that settles nothing."*

That is the whole case and it is right. Reading it through the three lenses:

- **Platform.** A mandate does not produce more beliefs, it produces
  forecast-SHAPED text. That text enters calibration **as signal**, so the moat
  gets *worse*, not thinner — absence is honest, noise is not. A calibration
  score computed over "it will go well" is a number that lies.
- **User.** Decide is a triage queue you move through. Three required fields per
  approval is friction on the highest-frequency action in the product, and the
  predictable response is boilerplate or abandonment.
- **Agent.** An agent can always afford three real parts, cheaply, every time.
  That is *why* the agent doors are right to refuse — the asymmetry is not
  unfairness, it is two actors with genuinely different costs.

### What was actually broken — narrower, and worse than "unforced"

**People were not unforced. They were UNABLE.**

`recordJudgment` — what runs when a person presses the Decide gate — inserted a
decision with the forecast columns permanently null. And migration
`20260810180000` puts an **immutability trigger** on those columns that freezes
them once set, because *"a forecast recorded after the fact is a retrospective"*.
That trigger is correct.

**Together they meant every human gate press minted a decision STRUCTURALLY
INCAPABLE of ever carrying a forecast.** The one moment the trigger allows the
write is the moment the door was shut. That is the defect, and it is not fixed by
forcing anyone.

### Shipped

`recordJudgment` now accepts the forecast trio, **optional**, validated by the
**same `forecastRefusal`** the agent doors use — so the two halves of the product
cannot drift into two definitions of a well-formed forecast. Passing nothing
stays completely ordinary.

**A malformed forecast drops the forecast and never the decision.** This function
never blocks the settle: the bet moving is the user's action and the decision row
is bookkeeping that follows it. A refusal is logged; the decision is written
without it.

### The line I drew, and it is the one that matters

**Nothing is ever DERIVED.** An opportunity carries a `hypothesis`, and promoting
it automatically into a forecast claim was considered and **refused**. A forecast
is something a person asserted *knowing the outcome was unknown*. Lifting a
nearby sentence into that slot puts words in their mouth — **the same sin as
mandating, only harder to see afterwards, because it produces a moat that looks
full and is fabricated.**

A surface may **suggest** the hypothesis as prefilled text a person edits or
clears. Nothing may write it on their behalf. That distinction is written into
the function.

### What remains, and who holds it

The read now carries the columns (shipped 14:3x) and the write now accepts them.
**The render is LANE 1's**: show the agent's forecast under the focused gate so a
person can see the belief they are approving, and offer the three fields on the
human keep path with the hypothesis as an editable suggestion. Both halves of the
plumbing are done.

---

## CALL 2 — the 99 design gates. **Fixed at all three sites.**

### Why fixing it was right

`.is("design_gate_status", null)` is **unsatisfiable by schema** — the column is
`text NOT NULL DEFAULT 'pending'`. It could never match a row, not merely today's
rows. Measured on production at the moment of the fix:

```sql
old predicate (IS NULL)     ->   0
new predicate (= 'pending') ->  99
of those, on design-enabled workspaces -> 99
```

**The earlier session was right to escalate rather than fix silently** — it turns
an empty family into the largest one on the queue, which is a product change. But
the thing being hidden is 99 real undecided gates, and hiding work is not a
feature. Once you delegated it, the call is straightforward: **99 invisible
decisions is a worse product than 99 visible ones.**

### Why it does not flood anything

I checked the surfaces before flipping it rather than assuming. **They already
bound what they show:** approvals reads `.limit(100)`, Today's list reads
`.limit(5)`, and Today's hero renders a count. So this restores a family that was
silently empty; it does not dump 99 rows anywhere.

All three sites moved **in one change** — `today.functions.ts:291`, `:511` and
`approvals-queue.functions.ts` — because correcting one would have made the
approvals pill read 99 while the Today hero read 0, breaking the
one-count-one-source law that module's header claims.

**The number moved and the reasoning did not.** The recorded diagnosis said 80 on
2026-08-06; it is 99 now. The gap grew by 19 while the read said zero. That
comment is rewritten to describe what is true rather than what was deferred.

---

## One guard had to change, and how it changed matters

Three assertions in `the-gate-records-why.test.ts` failed on the forecast branch.
**Not because anything broke** — the error guard, the lineage edge and the catch
were all still there. They had moved past **character 4000**, which is where that
test's window ended.

**A window sized to yesterday's function fails on growth and cannot tell growth
from removal, which is the one distinction it exists to make.** The slice now
runs to the function's own closing brace. Same correction I made to a Meridian
guard yesterday: **bound by structure, never by a magic number.**

---

## Net

`tsc` 0 · `bun test` **10,664 pass / 0 fail** · `docs:check` 0.

Forecast: offered at the only moment the trigger permits, never mandated, never
derived. Design gates: 99 visible, three sites, one change.
