# Unit 065 · item 13 finished: the four held lifts get named homes

LANE 1 · 2026-08-25 · **no code changed.** Unit 058 ruled the routes before the
queue added its condition; this unit answers the four inputs RL0-018 folded in,
as that ruling requires. Every claim below checked against source today.

## The four lifts, placed among the survivors

**1 · Bulk approve → `/approvals`, wired into DecisionQueue's existing bulk
verbs.** `decideApprovalItems`
(`src/lib/approvals-queue.functions.ts:1316`, cap `MAX_BULK_DECISIONS = 50` at
`:1265`) is built with zero callers — the sixth instance of the engine-without-a-
door pattern. This is not a convenience feature: R-04 requires that a person can
answer the CLASS of question, and 90 dead cluster gates were one question asked
90 times. The queue is the overflow surface where instances collect, so the
class-answer control lives exactly there. Control built by LANE 0 (their
component); the server fn needs nothing.

**2 · Decided history → Engine Room, Record room** (`?room=record`). The Record
room is the audit trail — it already carries the receipts view and the verify
view ("Approvals waiting on you"). What you settled yesterday, with what each
caused, belongs beside both, as its own view. Today's settled-receipts strip and
its door move here at promotion (unit 057, region 7), which gives the view its
first real content the day it exists.

**3 · The snooze list → `/approvals`, its own quiet section under the queue.**
A deferred call is still the person's call — hiding it entirely is why
`approval_snoozes` reads as machinery today. `getApprovalsQueue` already reads
the table to filter items out (`:888-897`) and states the failure direction
honestly; what nothing renders is *"you deferred these, returning <date>"*.
**Dependency:** the reader must return the rows with their `snoozed_until`
alongside the filtered set — one widened return on MAIN's function. Until it
lands, the section does not exist rather than lying empty.

**4 · The sent-back note → rendered on the decided-history entry, and beside
the item if it returns.** `approval_feedback`'s note is the WHY a machine was
wrong — part of the record of what happened, so its primary home is the
Record-room decided entry (with 2). Secondarily, when a sent-back item comes
back around, the prior note shows beside it: deciding again without seeing why
it came back is re-deciding blind. The count-only aggregate stays wherever it
stands; it answers a different question.

## Sequencing

None of the four builds before the promotion bundle settles (unit 057), because
three of the four land on surfaces whose shape that bundle changes. They are now
specified tightly enough to be queue rows of their own; I have not written them
into BUILD-QUEUE — MAIN owns it.

## Also closed by earlier work, for MAIN's row-moving

**Item 32 is DONE** — unit 060, commit `81700f6a1` (pushed): `/start` composes
Meridian's `PickCard` + `Composer`; `shell/JobCards.tsx` and
`shell/RunComposer.tsx` deleted; no `leading-[` anywhere in `shell/`;
`onramp-parts` has two real importers since. The row predates the swap.

Gates: none owed (no code). Dev server not started.
