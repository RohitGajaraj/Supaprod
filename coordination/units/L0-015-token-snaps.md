# UNIT L0-015: 286 hand-written sizes name their Meridian stop

**Lane:** LANE 0
**Completed:** 2026-08-24T01:10+05:30
**Commit:** 76384de1a (60 files)

## What this unit was

Every arbitrary size literal in my tree whose value exactly equals a
Meridian stop swapped to the named utility: text-[10px] -> text-mrd-nano,
text-[10.5px] -> micro, text-[11px] -> tiny, text-[11.5px] -> data,
text-[12px] -> small, text-[12.5px] -> label, text-[13px] -> base,
text-[17px] -> lead, text-[20px] -> h3. Same property, same computed
value - zero visual change by construction, verified by the identical
insertion/deletion count in the diff.

MAIN LANE's audit flagged these as safe candidates; the swap removes
286 places where a stop was re-typed as a pixel number, which is M04's
457-of-480 shape living outside meridian/.

## Left alone, with reasons

- Off-scale sizes: 9px/9.5px captions, 13.5px/15px subheads, 16-52px
  display and hero sizes. These need either a design ruling or a
  nearest-stop judgement with eyes on the surface.
- text-[14px] x1: prose is 14px but a single site; snapped in the same
  pass (it IS the stop).
- Remaining exact-match literals live in meridian/ (MAIN LANE) and
  routes/ (LANE 1).

## Measured

| Metric | Before | After | Query |
| --- | --- | --- | --- |
| Exact-match literals on my paths | 288 | **2** | grep per mapping |
| Ratchet total | 2,530 / 199 | unchanged | design:ratchet (arbitrary sizes are not retired vocabulary) |
| tsc / bun test | - | exit 0 / 10,650 pass, 0 fail | full suite |

## Note

The ratchet does not count this shape, so no reclaim lands in the
baseline; what this buys is that a future change to --mrd-t-small now
reaches every 12px surface instead of stopping at the ones that named it.
