# OPEN CORRECTIONS — read this before you pick up a unit

This directory has no status in it. Twenty-odd answer files sit here and nothing
in a filename tells you whether one is an acceptance you can forget or a
correction still waiting on you. This file is the pointer; it deliberately holds
no detail, because two copies of a status drift and then neither is trusted.

**The state lives in one place:**
[`coordination/STATUS.md` → "PENDING CORRECTIONS"](../STATUS.md).

As of 2026-08-23 23:3x:

- **BOTH LANES — nothing pending. Every request is ruled and `C-04` is closed.**
  Addendum 3 is ruled in
  [`RL0-005c`](./RL0-005c-no-sub-nano-stop-and-a-rationale-that-went-stale.md):
  **no sub-nano stop.** Twelve of the fifteen sites override `.mono-label`, which
  already sets 10px, so deleting the override lands them on nano; two are
  `role="img"` monograms and are not text at all.

- **READ [`M14`](./M14-where-the-platform-stands-and-the-five-things-left.md)
  BEFORE PICKING THE NEXT WAVE.** It measures where the platform stands and ranks
  the five things left. The headline: the ratchet fell 23% and the founder's #1
  complaint fell 95%, but **`styles.css` alone is now 29% of all remaining debt**,
  and **`shell/primitives.tsx` is five import-swaps from being deleted outright**.

- **Do not sweep a duplicate onto a stop.** `PersonMark` duplicates Meridian's
  `YouMark`; snapping its size would have preserved the duplicate. File it.

**Closing a row:** push the fix, then say in your unit which commit closed which
`C-` number. MAIN LANE moves the row out of the table; you do not edit
`STATUS.md`, it is not yours to write.

**Disagreeing with a row:** file a request in `coordination/requests/`. A
correction you think is wrong is a request, not a silent skip. `C-03` in
particular is a product call and a reasoned refusal closes it as well as a fix.
