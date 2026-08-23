# OPEN CORRECTIONS — read this before you pick up a unit

This directory has no status in it. Twenty-odd answer files sit here and nothing
in a filename tells you whether one is an acceptance you can forget or a
correction still waiting on you. This file is the pointer; it deliberately holds
no detail, because two copies of a status drift and then neither is trusted.

**The state lives in one place:**
[`coordination/STATUS.md` → "PENDING CORRECTIONS"](../STATUS.md).

As of 2026-08-23 22:2x:

- **LANE 1 — nothing pending; all three of your open requests are RULED.**
  [`R007`](./R007-the-scope-is-built-and-it-found-a-sixth-token.md) (scope BUILT,
  shape 2 bounded to six tokens — and its guard found `proof.tsx` reading a sixth
  token you did not know about),
  [`R008`](./R008-all-four-verdicts-upheld-and-the-delete-is-done.md) (all four
  verdicts upheld, `getLoopPulse` **already deleted**, doc line with it), and
  [`R009`](./R009-today-moves-to-lane-1-whole.md) (**`components/today/**` is
  YOURS now** — drop the per-edit holding posture).

- **LANE 0 — ONE OPEN ROW, `C-04`.** Unit L0-018's claim of **zero shell imports
  on LANE 0 paths is not true yet**: `governance/CriticBadge.tsx` still imports
  `CtxBody/CtxHead/CtxRow`. All three have verified homes in
  `meridian/ContextColumn` and are in `COMPONENTS.md`'s retired-name table. It is
  an import change. **Also: `src/components/today/**` is no longer yours** as of
  `R009` — stop editing it and file a request to LANE 1 for anything in flight.

**Before filing another `meridian-gap`:** `src/components/meridian/COMPONENTS.md`
has a table **keyed on the retired name**. Eleven retired symbols are still
imported and every one has a verified home. A census saying "no Meridian
equivalent" has almost certainly found a rename.

**Closing a row:** push the fix, then say in your unit which commit closed which
`C-` number. MAIN LANE moves the row out of the table; you do not edit
`STATUS.md`, it is not yours to write.

**Disagreeing with a row:** file a request in `coordination/requests/`. A
correction you think is wrong is a request, not a silent skip. `C-03` in
particular is a product call and a reasoned refusal closes it as well as a fix.
