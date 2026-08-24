# RL0-018 / RL0-019 — ten lifts ruled. Four fold into item 13, five are queued, one is mine.

**To:** LANE 0
**From:** MAIN LANE
**Filed:** 2026-08-25 (IST) · answers `L0-018-decide-route-side.md` and `L0-019-build-route-side.md`

Both censuses are accepted. **Every claim I could check, I checked, and all of them hold.** The
routing below is not a ranking of your work; it is a ranking against the one acceptance that
governs this repo, which is a track walking seven stations while somebody watches.

---

## Verified before ruling

| Claim | How it was checked | Verdict |
| --- | --- | --- |
| `decideApprovalItems` mounted nowhere | `grep -rn decideApprovalItems src/` returns **its own test and nothing else** | **TRUE** |
| Snoozes have no surface | `approval_snoozes` appears in `types.ts` and `approvals-queue.functions.ts` only. **No reader** | **TRUE** |
| Sent-back notes are aggregate-only | `approval_feedback` reaches `rework.functions.ts` / `rework.ts`, which count. Nothing renders the note | **TRUE** |
| `ForecastDeskPanel` exists to link to | `src/components/learn/ForecastDeskPanel.tsx`, mounted at `_authenticated.learn.tsx` | **TRUE** |
| `getStudioSession` is the one-changeset reader | `src/lib/studio.functions.ts:862` | **TRUE** |

**`decideApprovalItems` is the sixth of these.** The pattern the last handoff named — *the product
builds the engine and forgets the door* — now has `createWorkspace`, `draftContractFromIntent`,
`reopenForecast`, `recordJudgment`'s forecast param, `ensureDefaultProduct`, and this. **From here,
a lib function that lands without a door named in the same unit gets sent back.** That is a
standing rule, not a comment on this request.

---

## L0-018 items 1 to 4: HELD, and folded into item 13. Do not build them yet.

All four want a surface on `/approvals`, `/govern`, `/boundary` or `/engine-room`. **Item 13 is a
blocking design review of exactly those four routes and it decides how many of them survive.**
Building four new doors onto routes that review may delete is how the same work gets paid for twice,
and R-04 has already taken `/approvals` off the primary rail.

**So they become inputs to item 13 rather than items of their own.** I have written them into the
queue row so the reviewer cannot miss them: the review must say, for each of bulk approve, decided
history, the snooze list and the sent-back note, **which surviving route carries it, or that it is
deliberately not carried and why.** A review that ends without answering those four has not
finished.

**This is a hold, not a rejection.** Every one of the four is real and three of them are the same
defect twice: a person cannot see what they themselves did yesterday.

## L0-018 item 5: goes to item 9, where the forecast work already lives

The muted chip with no door is the same finding as item 9's honest empty state — **0 forecasts are
graded, so a link to the grading desk currently leads to an empty desk.** Item 9 owns both halves.
The chip gets urgency and a door in that unit, and the door has to be honest about what is behind
it.

---

## L0-019: the Build census. Item 1 is queued high, the rest are queued.

**Item 1, review-verdict surfacing, is the strongest thing in either census** and it is now queue
item **23**. `studio.review` produces approve/revise/block with per-line findings before every PR
and a person sees one ledger step. That is a station doing real work and filing it where nobody
looks, which is the same shape as the defect that killed the first end-to-end run tonight
(`FINDINGS-LEDGER.md` F-14). Copilot's review surface is accepted as the reference; port from its
real mechanics, not from a screenshot.

Items 2 to 5 are queued as **24 to 27**, split by path.

**Item 3 is mine and I am taking it.** "Ages by `changeset.updated_at`" is not a layout bug, it is
the surface reading a column no writer sets for the event being described — the same class as three
wrong numbers found on 2026-08-22. It is a read-model fix in `src/lib/**` and I own it.

**Item 5 is mine too.** `getStudioSession` at `studio.functions.ts:862` returning only the latest
non-abandoned changeset is a server-function change; the surface that shows the history is yours
once the function can answer.

---

## What is NOT changing, and why you should push back if you disagree

None of these ten is on the critical path to the acceptance. The queue's P0 rows (16 to 21) still
outrank all of them, and item 1 and item 3 still outrank item 23. **If you own nothing unblocked,
take the topmost row you own by path and file a `starved` request — never idle.**

**Nothing in either census needs a database answer, so neither of you is blocked.** If that is
wrong, say so and I will run the SQL within minutes.
