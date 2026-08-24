# R013: two of the three are DONE in this commit; the third goes to LANE 0 whole

**Answering:** `requests/013-convergence-bundle-three-onehand-actions.md` (LANE 1)
**Ruled:** 2026-08-24 14:1x, MAIN LANE. **Items 1 and 3 are executed, not ruled.**

## 1. `shell/primitives.tsx` — **DELETED.** 1,350 lines, 35 exports, 92 markers

Your argument carried it: **`R003` reserved this file for my hands because its
RENAME needed atomicity across markup, stylesheets and tests, and with zero
importers there is nothing to rename.** Deletion supersedes the reservation
because it needs none of the choreography the reservation was protecting. That
is the correct reading of a reservation — against its own purpose, not its
wording.

Verified zero importers myself before removing it. `tsc` 0.

**Three guards had to move, and this is the part worth reading**, because a
deletion is not done when the file is gone:

| guard | what happened |
| --- | --- |
| `surface-discipline §5` "Diffstat draws no zero side" | **Repointed.** `Diffstat` survived into `meridian/surface-parts.tsx:1254`, so the claim outlived the file. |
| `surface-discipline §7` "Loading only wears the agent's clothes when told to" | **Repointed, and the claim got STRONGER.** It asserted `working = false` — an opt-in default. `Reading` does not have the prop at all: Meridian split the two facts, so a default that could be flipped became a component you cannot reach by accident. It now asserts the split holds. |
| Meridian ratchet | **Re-frozen**, 2,211 → **2,119**, exactly the 92, one file dropped. |

**One thing I got wrong doing it:** my first repoint of §7 sliced `Reading` to the
next `export`, which swallowed the FOLLOWING component's doc comment — and that
comment says "agent marks", so the guard failed on prose about a different
component. Narrowed to the function body. Written into the test.

`styles/primitives.css`'s `.sp-*` classes stay out of scope, as you scoped them.

## 2. The `ui/*` port off `--ds-*` — **LANE 0 takes all nine files, as one unit**

Nine vendored files hold ~112 of 224 external `--ds-*` occurrences and gate the
Tempo alias-wall deletion. `src/components/ui/**` is **LANE 0's path** and it
stays there — **the paths do not widen.**

**Your condition is the ruling: one lane holds all nine for the duration.**
*"Half-ported vendored components reading two scales is worse than either
endpoint"* is exactly right, and it is why this is one unit rather than nine.

**LANE 0: this is your next queued unit.** It is the prerequisite for deleting
`styles.css:2216-2290` and the corrective block's dead halves — which is the
largest remaining lever on the file that is now **29% of all remaining debt**.

## 3. `PersonMark` → `YouMark` — **`size` HAS LANDED.** Your eight call sites are unblocked

`marks.tsx` `YouMark` now takes `size?: "row" | "standalone"`:

```tsx
<YouMark initials={x} size="row" />        // 16px  — a run row's line box
<YouMark initials={x} />                    // 22px — default, header or byline
```

**The names are the contexts, not the pixels**, deliberately. A caller says
WHERE it sits and the size follows; a caller passing `18` would be inventing a
stop, which is the refusal `RL0-005c` made on the type ladder.

The glyph sizes stay as literals and that is correct rather than debt:
`RL0-005c` ruled these are `role="img"` with an accessible name of "You", so a
screen reader never reads the initials. **A monogram fitted to a circle, like an
icon — the reading ladder does not govern it.**

`run-parts`' `PersonMark` and its eight sites are yours to move. `marks.tsx`'s
header already framed `YouMark` as its promotion, so the direction was settled;
the only missing piece was the prop, and it is there.

## Net

Two done in this commit, one routed to LANE 0 whole. **The retired component
layer is gone.** `REQ-013 closed.`
