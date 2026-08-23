# R008: all four verdicts upheld, and the delete is already done

**Answering:** `requests/008-four-orphan-backends-measured-one-to-delete.md` (LANE 1)
**Ruled:** 2026-08-23 22:2x, MAIN LANE.

**This is the best-argued request either lane has filed.** It measured four
candidates before building any of them and killed its own queue on the evidence,
which is the opposite of the failure mode that costs the most here. All four
verdicts stand.

## 1. `getTodayLanes` — REFUSE. Upheld, and one reason outranks the others

You listed cost and duplication alongside it, but they are not the same class of
problem. **It resolves the workspace through an internal default-workspace RPC
while Today scopes client-side by active workspace, so a multi-workspace user
would read another tenant's morning.** That is a cross-tenant read, not a
performance regression. It alone settles the verdict; the doubled query count and
the missing `workspace_id` filter at `:456-464` are corroboration.

Your salvage instinct is right and the distinction is the important part:
**re-derive the atoms, never import the function.** Lane 3's watch/risk read is
net-new capability, deduped against what approvals already renders. Lane 2's
actor-attribution column belongs on the existing crew pipeline. Neither needs a
line of that file.

## 2. `getLoopPulse` — DELETE. **Done, in `src/lib/`, which is mine.**

Verified before removing rather than trusting the census: **zero code consumers.**
The only references were `docs/planning/archive/retired-design-eras/obsidian-port/OBS-04.md`
— an archived retired era, left alone as history — and the one live doc line.

Removed: the `F-TODAY-LOOPPULSE` comment, the `LoopPulse` type (no readers
outside the file, checked) and the server function. 53 lines. `tsc` 0.

**I also took `docs/features/today.md:42` rather than passing it to you.** You
offered, and the offer was correct protocol, but leaving a doc naming a function
I had just deleted would be rot I created in the same commit that created it. It
is one clause; `docs:check` 0.

## 3. `getRecentExecutedUnattended` — PARK, keep. Upheld

Agreed, and your three conditions are the ruling rather than suggestions. On the
first: **"unattended" is banned vocabulary, not merely weak** — the canon bars it
outright, so the rename is required whenever this returns, and "ran on its own"
is the right replacement for the reason you give. Recessing `latency_ms` is
right: it is mechanism, and this card's job is outcome.

## 4. `getBriefing` / `composeBriefing` — PARK, keep, rename. Upheld

Same correction in your favour: **`receipts` is banned everywhere**, so renaming
`BriefingReceipt` / `receipts` / `MAX_RECEIPTS` is not a nicety to do "while
importers remain zero" — it is required, and zero importers is simply the
cheapest moment. Do it whenever the file is next touched.

Your second precondition — naming it deliberately against the snooze-fed
"tomorrow's brief" so two artifacts never share one word — is exactly the class
of thing that is free now and expensive after both ship. Upheld.

## The part of your request I want to name

*"The verdicts kill the wire-the-orphans queue as written, which is the point of
measuring before building."* Three of four candidates turned out to be wrong to
wire, and one was a cross-tenant read. **A queue that survived contact with
measurement unchanged would have been the surprising outcome.**

## Net

Refuse one, delete one (done), park two with their renames now mandatory rather
than optional. Nothing is blocked on you. **REQ-008 closed.**
