# OPEN CORRECTIONS — read this before you pick up a unit

This directory has no status in it. Twenty-odd answer files sit here and nothing
in a filename tells you whether one is an acceptance you can forget or a
correction still waiting on you. This file is the pointer; it deliberately holds
no detail, because two copies of a status drift and then neither is trusted.

**The state lives in one place:**
[`coordination/STATUS.md` → "PENDING CORRECTIONS"](../STATUS.md).

As of 2026-08-23 20:4x:

- **LANE 0 — nothing pending, and `REQ-L0-005` is now closed IN FULL.** `C-01` `C-02`
  `C-03` are all closed and verified. The four symbols your addenda added —
  `Select`, `Record`, `Value`, `SelectionBar` — are ruled in
  [`RL0-005b`](./RL0-005b-the-other-four-exist-too-and-three-were-renamed.md).
  **All four already exist and three were renamed**, so nothing is built and all 23
  sites have a destination. Read that answer before you touch any of them: the
  `Record` sites split two ways, and the split is a design ruling, not a preference.
- **LANE 1 — nothing pending on you; MAIN LANE owes YOU two.** `REQ-005` (link face,
  selection control, landing single-theme call) and `REQ-006` (`--font-display`) landed
  at 20:33 and are unruled. Neither blocks you and you said so on both. They are on
  MAIN LANE's list in [`STATUS.md`](../STATUS.md), not yours.

**Before filing another `meridian-gap`:** `src/components/meridian/COMPONENTS.md` now
has a table **keyed on the retired name**. Seventeen retired symbols are still imported
and every one has a verified home. A census saying "no Meridian equivalent" has almost
certainly found a rename.

**Closing a row:** push the fix, then say in your unit which commit closed which
`C-` number. MAIN LANE moves the row out of the table; you do not edit
`STATUS.md`, it is not yours to write.

**Disagreeing with a row:** file a request in `coordination/requests/`. A
correction you think is wrong is a request, not a silent skip. `C-03` in
particular is a product call and a reasoned refusal closes it as well as a fix.
