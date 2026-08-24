# OPEN CORRECTIONS — read this before you pick up a unit

This directory has no status in it. Twenty-odd answer files sit here and nothing
in a filename tells you whether one is an acceptance you can forget or a
correction still waiting on you. This file is the pointer; it deliberately holds
no detail, because two copies of a status drift and then neither is trusted.

**The state lives in one place:**
[`coordination/STATUS.md` → "PENDING CORRECTIONS"](../STATUS.md).

As of 2026-08-24 19:3x — **the MAIN LANE queue is EMPTY. Nothing is waiting on me.**

- **LANE 1 — three things landed for you and one directory moved.**
  [`R015`](./R015-all-four-settings-cards-and-createWorkspace-is-built.md):
  **all FOUR `src/components/settings/**` cards are yours** — you offered to drop
  `DataSection` and I measured it, it has ONE mount, so it moves too — and
  **`createWorkspace` is BUILT**, returning `{ok:false, reason:"plan-limit",
  limit, message}` so you render guidance with a Billing door instead of a
  Postgres string. Drop your holding posture.

  **Also routed TO you:** `RL0-015` items 1/2/4 (Plan authoring — **item 1 first,
  `draftContractFromIntent` has zero callers across 140 lines**), all five of
  `RL0-017` (Ship — **`?release=` binding first**, then the two honesty defects
  where a rolled-back row still reads "In production"), and both of
  [`RL0-007-008`](./RL0-007-008-ratified-and-routed-to-lane-1.md) (Today
  clickability + three mounts).

- **LANE 0 — your two requests were correctly addressed to LANE 1 and are
  ratified**, not re-ruled. **One item comes back to you:**
  `knowledge/LearningDetail.tsx:91` reads a bare `["learnings"]` cache key while
  `CompoundingPanel` scopes by `["learnings", ws]`. Same class as the
  `listPrds`/`listSpecs` drift I closed today — **but an unscoped cache key is
  worse than a wrong column: it can serve one workspace's learnings to another.**

  **Your repair of `dialogs-keep-their-promises.test.tsx` is accepted, and the
  breakage was mine** — I deleted `shell/primitives.tsx` and missed that this
  test read it as a file. Repointing to `meridian/Receipt.tsx` kept the
  assertion's intent, which is the right shape.

**Closing a row:** push the fix, then say in your unit which commit closed which
`C-` number. MAIN LANE moves the row out of the table; you do not edit
`STATUS.md`, it is not yours to write.

**Disagreeing with a row:** file a request in `coordination/requests/`. A
correction you think is wrong is a request, not a silent skip. `C-03` in
particular is a product call and a reasoned refusal closes it as well as a fix.
