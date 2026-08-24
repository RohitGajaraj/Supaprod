# OPEN CORRECTIONS — read this before you pick up a unit

This directory has no status in it. Twenty-odd answer files sit here and nothing
in a filename tells you whether one is an acceptance you can forget or a
correction still waiting on you. This file is the pointer; it deliberately holds
no detail, because two copies of a status drift and then neither is trusted.

**The state lives in one place:**
[`coordination/STATUS.md` → "PENDING CORRECTIONS"](../STATUS.md).

As of 2026-08-24 14:2x:

- **LANE 1 — all four rulings are in. Nothing waits on MAIN LANE.**
  [`R010`](./R010-retire-the-readers-first.md) shape 2, retire readers first —
  **your census overturned my own R005**.
  [`R011`](./R011-the-blessed-mappings-and-the-weight-bridge.md) clusters 2/3/5
  confirmed, **cluster 4 takes `mrd-subtitle` rather than `lead(17)`**, no weight
  bridge. [`R012`](./R012-five-deleted-one-held-for-the-founder-and-M14-corrected.md)
  five deletions cleared — **you execute both halves in one commit**, the gallery
  is your path — and **`FineTuneCard` is HELD for the founder**.
  [`R013`](./R013-two-of-three-are-done-and-the-third-goes-to-lane-0.md) items 1
  and 3 are **already done**: `shell/primitives.tsx` is deleted and `YouMark`
  takes `size`, so your eight `PersonMark` sites are unblocked.

- **You were right and I was wrong on the weight mechanic.** No `--mrd-w-*` is
  bridged to a Tailwind utility; `font-[600]` was already the honest spelling.
  `RL0-005c` carries the correction in a banner. I read a token in `:root` and
  concluded a utility existed — **a token existing is not a utility existing.**

- **LANE 0 — one queued unit: the `ui/*` port off `--ds-*`**
  ([`R013`](./R013-two-of-three-are-done-and-the-third-goes-to-lane-0.md) item 2).
  Nine vendored files, **all nine held by one lane for the duration**; paths do
  not widen. It gates the Tempo alias-wall deletion, which is the largest lever
  left on `styles.css` — now 29% of all remaining debt.

- **`shell/primitives.tsx` IS DELETED.** The retired component layer is gone:
  1,350 lines, 35 exports, 92 markers, ratchet 2,211 → 2,119.

**Closing a row:** push the fix, then say in your unit which commit closed which
`C-` number. MAIN LANE moves the row out of the table; you do not edit
`STATUS.md`, it is not yours to write.

**Disagreeing with a row:** file a request in `coordination/requests/`. A
correction you think is wrong is a request, not a silent skip. `C-03` in
particular is a product call and a reasoned refusal closes it as well as a fix.
