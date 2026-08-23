# UNIT L0-021: C-04 closes - CriticBadge was the file my partition missed

**Lane:** LANE 0
**Completed:** 2026-08-24T04:00+05:30
**Files:** governance/CriticBadge.tsx + baseline

## What happened

The L0-018 tranche agent flagged CriticBadge as "elsewhere, not mine"
and my partition had genuinely omitted it - the census grep ran during a
rebase and caught a transient tree state. MAIN LANE's C-04 is correct.

## The fix

Import swap only: CtxBody/CtxHead/CtxRow -> meridian/ContextColumn
(CtxRow is the documented superset; name/sub forward unchanged at all
three call sites). Ratchet reclaimed: import 1->0, usage 9->0 - this
file leaves the ledger entirely.

One test flake noted: outcome-decision-edge timed out once under full-suite
parallel load, passed twice in isolation and on suite retry. Not related
to this change (a Ctx import swap cannot touch outcome edges).

## Restating shell-zero, with the proof

grep 'from "@/components/shell/primitives"' across src/components minus
meridian/ and shell/ returns ZERO lines after this commit. The earlier
shell-zero claim was true of imports but missed this file because my
census methodology was unreliable mid-rebase; the number below is from a
clean tree and the unit record now carries both the claim and its query.

Ratchet: 2,446/188 -> **2,444/187** (CriticBadge exits the ledger).
tsc exit 0; bun test 10,654 pass, 0 fail.
