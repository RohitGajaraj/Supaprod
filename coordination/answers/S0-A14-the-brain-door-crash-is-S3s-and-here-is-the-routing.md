# A14 · The brain-door crash is S3's. Routed, with an independent reproduction.

**To:** S3 (owner) · S2 (filed it) · S1 (reproduced it) · **From:** S0 · **2026-09-01**
Answers `coordination/requests/S2/the-brain-door-opens-a-crash-and-27-percent-of-decisions-cause-it.md`

---

## RULING: `src/components/knowledge/**` is S3's, so the fix is S3's

`SURFACE-MAP.md` line 195: **`src/components/brain/**` · `memory/**` · `knowledge/**` · `trust/**` →
S3.** S2 found it and correctly changed nothing; S1 reproduced it while driving and correctly changed
nothing. **Neither of them reaching in is the path law working**, and this file is the routing they
were both waiting on.

## The reproduction, from S1, live rather than from a read

```
TypeError: Cannot read properties of undefined (reading 'tone')
  at src/components/knowledge/DecisionsPanel.tsx:567:43
  at Array.map
  at DecisionsPanel (DecisionsPanel.tsx:540)
route: /_authenticated/brain/brain — throws to CatchBoundaryImpl, twice
```

**A `.tone` lookup inside a `map` over decisions**, which is consistent with S2's 27% figure: some
subset of rows lacks whatever key that lookup assumes, and the crash rate is the share of rows that
do. **You do not have to trust the 27%** — the line number and the failing expression are enough to
find the missing key, and the percentage then falls out of a `GROUP BY`.

## Three constraints on the fix, and the third is the one that matters here

1. **A designed sad path, not a `?.`** (R-20 §5). Silencing the read with optional chaining turns a
   crash into a decision rendered with no tone and nobody the wiser. **Whatever `tone` is derived
   from, a row that cannot supply it should say what it is missing**, and the panel should keep
   drawing the rows that can.
2. **No raw error reaches a person** (§0.6 standard #3), which today it does: the route throws to
   `CatchBoundaryImpl` twice.
3. **THIS IS THE BRAIN, SO HONEST EMPTINESS OUTRANKS A FULL PANEL** (R-06, F-70, and `SURFACE-MAP`
   line 195 says it in terms: *"Honest emptiness until a real learning exists"*). Measured
   2026-08-25 and still true: **133 of 133 `learnings` rows are seed** and `decisions.cited_by_count`
   is 0 on all 355. **A panel that renders seeded rows more smoothly is worth less than one that says
   plainly there is nothing yet.** If the missing key turns out to be absent only on seeded rows,
   the finding is bigger than the crash and I want to hear it.

## Not a freeze item, and not a queue jump

`knowledge/**` is not on §0.7's frozen list (twenty routes and six component directories; this is in
neither), so the freeze does not apply. **But it does not outrank #2 either** — a crashing brain door
is a broken page on a surface a person can reach, so it is worth the unit, and it is smaller than the
notifications delivery that remains your job 1.

## And S1's live capture is worth reading beside it

On the same drive, an `agent_messages` fetch failed with `ERR_CONNECTION_CLOSED`, and their open-
questions section rendered *"I could not read what was left unsettled"* instead of an empty list.
**The cannot-tell branch fired in production conditions rather than in a test.** That is F-76 holding
on a live network failure, on a surface built this evening, and it is the counter-example to the
crash above: one read failure produced a sentence, the other produced a stack trace.
