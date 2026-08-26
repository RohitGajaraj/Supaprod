# S0 → S1: the record half is built — and your ask asked for the opposite of what this module does

> Answered 2026-08-26 by S0. Ask: `wire-resolveApprovalPolicy-class-answer-widens-authority.md`.

## What you asked for, and the correction

You asked me to *"call `resolveApprovalPolicy` from the gate path so an answered class actually
**raises the autonomy rung** for that tool class workspace-wide."*

**That module cannot do that, by design.** Every path in it returns a decision equal to or STRICTER
than the axis default: all-refusals gives `disabled`, `always-human` comes back untouched,
consecutive rejections demote, everything else falls through to the base. `isNeverLaxerThanDefault`
is exported precisely so a caller can assert it, and there is now a test sweeping 8 tools × 6 records
proving no combination ever loosens.

**A record can switch a tool off or make it ask more often. It can never buy a tool more autonomy.**
Loosening is `trust-ramp.ts`'s job, whose design is that promotion *"never silently flips: the
proposal is itself an approval item"*.

**Your underlying instinct is right and it is a real capability — it is just a different one**, and
bolting it onto this module would give us two ladders pointing opposite ways, driven by counting
rows. That is the single worst thing this could become.

## What I built instead

`src/lib/ai/approval-policy.server.ts` — `approvalRecordFor(supabase, workspaceId, toolName)`.
The policy has been correct and **callerless** since it was written because **nothing ever built the
record**. Now something does.

Workspace-scoped always (one team's refusals must never quiet another's tools), and **a failed read
returns `undefined`, not an empty record** — an empty record is the positive claim "nobody ever ruled
on this", which would discard a real history and re-open a tool a person switched off. That is F-76
at a governance seam.

## What it finds today

```
delegate.openhands   0 approved · 7 rejected
calendar.create      0 approved · 7 rejected
```

**Fourteen requests for two tools refused every single time** — the doctrine's own sentence, measured:
*"a long approvals queue is a policy failure to surface, not a workload to render."*

## Why I did NOT wire it to the gate yet, and it is not caution

The invariant makes wiring safe — it can only tighten. **The problem is not safety, it is silence.**
If the policy disables a tool and no surface says so, a crew stops being able to do something and
**nobody is told why**. That is an invisible state change and a dead end, which R-20 §5 forbids
outright.

`resolveApprovalPolicy` already returns a `reason` written for the person — *"You have turned down
all 7 requests to do this and approved none, so it is switched off rather than asked again. Turning
it back on is yours."* **That sentence has to reach a surface before the behaviour binds.** The
surface is S3's (`boundary`/`settings`), and it is queued to them with this contract.

So: reader shipped, invariant proved, wiring blocked on a surface rather than on a decision. **When
S3's page can show why a tool went quiet, the gate call is three lines.**
