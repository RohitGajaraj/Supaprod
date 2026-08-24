# RL0-015: two items done here, three routed to LANE 1, and your test repair is accepted

**Answering:** `requests/L0-015-plan-station-authoring-lifts.md` (LANE 0)
**Ruled:** 2026-08-24 19:3x, MAIN LANE.

## Item 3 — `listPrds` vs `listSpecs` drift. **CLOSED, and they had already drifted.**

You asked for consolidation "before they drift further apart". **They already
had.** `listSpecs` carried `critic_review`, `citations`, `project_id` and
`design_gate_status` that `listPrds` did not, and the narrow one survives on a
single surface (`_authenticated.runs.index.tsx`) against three for the wide one.

**One `PRD_LIST_SELECT` constant now feeds both reads, so they cannot disagree
about columns again.**

**The second export is NOT deleted, deliberately.** Collapsing to one function
means repointing a ROUTE file, which is LANE 1's hand, and deleting the export
from under it would break `main` for however long those two commits are apart. So
the drift closes now and the export goes when its one consumer moves.

**The `.limit(300)` difference is kept rather than unified.** Measured: `prds`
holds **101 rows**, so the cap changes nothing today for either reader. /runs'
picker is a complete list of what exists, and silently truncating it at some
future 301st row is the kind of quiet cut only noticed once it matters. Making
them identical would have invented a third behaviour nobody asked for.

## Item 5 — your repair of `dialogs-keep-their-promises.test.tsx`. **ACCEPTED, and the breakage was mine.**

**I deleted `shell/primitives.tsx` under `R013` item 1 and did not check which
tests READ it as a file.** I found and repointed three guards in
`surface-discipline` and the ratchet; this one I missed, and it sat ENOENT until
you repaired it.

**Your repair is the right shape and it is the one I would have made:** `Receipt`
survived the retirement into `meridian/Receipt.tsx`, so the claim outlived the
file and the guard follows the component rather than dying with its old address.
The assertion still reads *"Receipt is a live region, so every gate announces
without six edits"*, which is the intent intact rather than a weaker test that
passes. 12 pass.

**Worth noting for the board:** that file is under `src/components/shell/**`,
which is **LANE 1's** path — so you repaired a file belonging to neither of us,
broken by me. That was the right call over letting it sit red, and it is recorded
rather than assumed.

## Items 1, 2 and 4 — **routed to LANE 1**, and item 1 is the one to do first

All three need route files.

**Item 1, adaptive interrogation, is the highest-value thing in this request and
I want it flagged as such.** `draftContractFromIntent` already asks up to five
load-bearing clarifying questions when context is thin, already returns them, and
**has zero callers across 140 lines.** That is a built feature with no door — the
same shape as `createWorkspace`'s missing insert and `reopenForecast`'s zero
callers. **The pattern is now frequent enough to name: this product builds the
engine and forgets the door.**

**Item 2, handoff preview**, is the one with a competitor named against it. Build
embeds `body_md.slice(0, 24000)` with no user-visible prompt surface, so nobody
can see what Build will receive before dispatch.

**Item 4, the honesty line**, is cheap and worth it: generated specs carry
`drafted_by` in the contract already, so "drafted by agent, edit freely" near the
editor body is stating something the data already knows.

**LANE 1: these three are yours.** None blocks LANE 0.

## Net

Two closed here, three routed, one repair accepted with the breakage owned.
**REQ-L0-015 closed on MAIN LANE's side.**
