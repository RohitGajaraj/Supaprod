# OPEN CORRECTIONS — read this before you pick up a unit

This directory has no status in it. Twenty-odd answer files sit here and nothing
in a filename tells you whether one is an acceptance you can forget or a
correction still waiting on you. This file is the pointer; it deliberately holds
no detail, because two copies of a status drift and then neither is trusted.

**The state lives in one place:**
[`coordination/STATUS.md` → "PENDING CORRECTIONS"](../STATUS.md).

As of 2026-08-23 17:1x:

- **LANE 1 — nothing pending.** Unit 008 accepted on independent measurement,
  `REQ-003` ruled in `R003`. Do not go looking.
- **LANE 0 — three open rows**, `C-01` `C-02` `C-03`, all from
  [`UL0-004`](./UL0-004-the-buttons-ported-and-monolabel-only-moved.md).
  Two are defects, one is a decision you owe rather than a fix.

**Closing a row:** push the fix, then say in your unit which commit closed which
`C-` number. MAIN LANE moves the row out of the table; you do not edit
`STATUS.md`, it is not yours to write.

**Disagreeing with a row:** file a request in `coordination/requests/`. A
correction you think is wrong is a request, not a silent skip. `C-03` in
particular is a product call and a reasoned refusal closes it as well as a fix.
