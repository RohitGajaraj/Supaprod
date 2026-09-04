# The agent, governance and trust surfaces

> _Created: 2026-08-14 · Last updated: 2026-08-14_

> _Audit pass, 2026-08-14. Raw output, saved as it finished._

**The verdict, stated first: the line between machine and human is drawn beautifully in prose and breaks at exactly three seams.**

This codebase knows its thesis better than most products know anything. `/boundary` separates policy-set-in-advance from permission-asked-in-the-moment and refuses on principle to show a queue, because "the moment it did it would become the thing it exists to shrink". `/crew` names both halves of every agent's reach and insists a capability with no named catcher "is the shape of every autonomy incident". `/runs` prints, in the product, **"It stopped and cannot go on until a person answers."** Those are not comments. They render.

Then they break in three places.

## Seam 1 — the machine's request is honoured; the human's decision is not (P0)

Inside a single file, `/crew` gives the *agent's* graduation request a full Gate, an age on every queued row, an error arm, and a Receipt naming verb and consequence: *"You gave it the room / Engineer runs open-a-PR unattended from now on."*

The *human's* four privilege writes get a control that flips and nothing else.

| Control | Confirm | Success feedback |
| --- | --- | --- |
| Agent on/off for the whole workspace | none | none |
| Autonomy dial (asks first → decides alone) | none | none |
| Tool-reach cap | none | none |
| Per-tool mode | none | none |

All four are `onSuccess: onChanged`, which is a refetch. The file imports no toast at all. So a person moving an agent from "asks first" to "decides alone" gets no acknowledgement that they decided anything.

**This is a regression rather than a house style, and the proof is in the sibling.** `/boundary` sets the same class of policy and does it properly: a confirm dialog before turning a tool off for everyone, a receipt with verb and real consequence on every success, an `onError` receipt on every one, and a translation layer so an RLS refusal reads as a sentence. Its own comment records that a *missing* error handler on a spend ceiling was treated as a defect worth naming.

`/crew`'s header quotes the doctrine it violates: *"judgment leaves a mark instead of vanishing into a toast"* — honoured for the agent's request, violated for the human's.

Minor, same cluster: the autonomy dial mutates on a `Select` `onChange`, so a keyboard user arrowing through the options writes every intermediate value to the server. Four privilege writes to reach "unattended".

## Seam 2 — the halt is named on the surface you leave, not the one you land on (P0)

`/runs` says the thesis out loud: *"{title} is waiting on you"*, with the consequence spelled out, and where there are no itemised calls, **"It stopped and cannot go on until a person answers."**

It then hands the user to `/approvals` with a button reading **"Settle all N runs"**.

`/approvals` deletes every word of it. A pending approval renders as `title` plus `agentName · kind`. Nothing names the run, the blocked work, or the consequence of the item sitting there. The only consequence shown is the consequence of *approving* ("Approve · runs the action"), never of not deciding.

**And the age is already in the payload.** `approvals-queue.functions.ts` sets `timestamp: created_at` on all eight kinds. The surface never reads it: no `ago(`, no relative time, no ordering by it. So an 86-hour-old approval and one raised four seconds ago render identically, and the `Row` primitive already has a `time` slot that `/crew` uses on its own queue.

Worse, the headline is *deliberately* de-escalated. The copy is *"N decisions are ready for you"*, with a comment reasoning that **"'Ready for you' over 'needs you' is also the more honest verb: nothing here has happened yet, so nothing is owed."** That reasoning is wrong on this surface: nothing has happened *because the loop stopped*. "Ready for you" is the register of an inbox you may ignore, applied to twelve halted pieces of work.

There is also no bulk decide and no multi-select. The entire affordance is `j`/`k` to move and `a`/`d` to settle. A user with 200 pending presses `a` 200 times.

## Seam 3 — no surface owns the queue (P1)

Four surfaces render pending approvals and three different destinations are named for the one act:

- `/runs` sends you to `/approvals`
- Record → approvals says *"Approvals are answered on Today"*
- Settings sends you to `/approvals`
- The nav rail gives the gates badge to **`/today`**, which owns the approvals paths

**`/approvals` has no door in the nav rail at all.** It is reachable only from a button on `/runs` or a panel in Settings. When a product cannot say where a human decides, the reader concludes nothing is waiting on them — which, given seam 2, is exactly the wrong conclusion.

## Two structural bugs, both cheap

**`/track-record` and `/trust-ledger` land one tab away from the thing they name.** Both redirect with `{room:"record"}` and no `view`. Both the room detail and the engine room normalise an absent view to `tabs[0]`, which is `verify` ("Verification cockpit"); `receipts` is index 1. So every external link, bookmark and outbound share of the audit trail lands on the wrong tab — **with a 301, so the browser caches it.** Three separate comments assert the opposite behaviour, and `RecordRoom`'s fallthrough branch handling unknown ids is dead code, because the view is normalised before it ever arrives.

**`/fleet` redirects to a feature that was never built.** It sends users to `/build?view=agent` promising "the by-agent lens is now the 'By Agent' view-mode tab on Build". `build.index.tsx` has **no `validateSearch`** and no view-mode tabs; nothing reads `view`. The user is told by the redirect that a lens exists and lands on Build's default list with a dead query param.

## What is genuinely excellent, so nobody rebuilds it

- **`/boundary` is the reference implementation** for any surface writing policy. It also documents that its headline count was *under-reporting* the crew's autonomous reach (because the loop demotes low-risk `confirm` tools to `auto`) and corrects it client-side, reasoning explicitly that "an over-report would be merely alarming; an under-report is the direction that gets someone hurt." That is the right instinct on the right number.
- **`/crew`'s empty state turns day one into the product's argument**: *"All 13 run without asking you. Nothing has been narrowed here yet."*
- **`/runs` uses `!sessions.data && !sessions.isError` rather than `isLoading`**, with a comment explaining that a fetch state is the wrong question — the same class of bug found on Today.
- **The engine room refuses to let a room that failed to read wear a healthy verdict's clothes**, and gives an *unset* room its own clause rather than letting it read as clear.

## Findings

**P0** · `/crew`'s four privilege writes have no confirmation and no receipt, while the agent's request in the same file has both · `/approvals` shows no age despite having the timestamp, and no bulk decide · the halt sentence dies at the destination `/runs` sends you to.

**P1** · `/track-record` and `/trust-ledger` land on the wrong tab behind a cached 301 · `/fleet` promises a lens that does not exist · no surface owns the approvals queue and `/approvals` has no nav door · four surfaces render the same queue.

**P2** · autonomy dial writes every intermediate value on keyboard navigation · `/boundary`'s "N calls waiting on you" line has no way to reach them · the "N more in your other workspaces" count has no link and no error arm · `/agents` redirects to a roster while its comment says the user should meet agents in motion rather than as a managed roster.
