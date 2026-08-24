# M14: where the platform stands, and the five things actually left

**Written:** 2026-08-23 23:3x, MAIN LANE, at the founder's request. Every number
measured on the merged tree tonight, each with the command that produced it.
**Read this before picking the next wave.**

## What the run moved

| metric | run start (`2d6ed9b89`) | now | |
| --- | --- | --- | --- |
| Meridian ratchet | **3,170** / 222 files | **2,426** / 184 files | **−744, −23%**, 38 files fully cleared |
| Hard-coded type sizes (`M04`'s second metric) | **873** / 171 files | **40** / 23 files | **−95%** |
| Files importing `shell/primitives` | **137** (measured 2026-08-15) | **5** | the retired layer is nearly gone |
| Meridian components used in the product | — | **38 / 48** | 9 gallery-only, 1 used nowhere |

**The second row is the founder's number one complaint** — *"text dumped, no
visible difference between heading / body / subtext"* — and it is the one that
moved furthest. 873 hard-coded sizes fighting the scale is now 40, and **13 of
those 40 are inside `meridian/` itself**, so the surfaces are cleaner than the
system is.

Gates on the merged tree: `tsc` **0** · `bun test` **10,654 pass / 0 fail** across
632 files · `docs:check` **0** · ratchet **nothing rose, no new files admitted**.

Production is **current**: `--mrd-face-display` and `data-mrd-pinned-dark` both
confirmed in the live CSS bundle against two passing controls.

## The five things left, ranked by what they actually cost

### 1. `styles.css` is now 29% of ALL remaining debt, in one file

```
694  src/styles.css          <-- 29% of the 2,426
145  src/styles/primitives.css
120  src/styles/ink.css
---
959  = 40% of everything, in THREE files
```

**The proportion went UP, from 37% at run start to 40%.** That is not a failure;
it is the shape of what happened. The lanes cleared the *surfaces* and the three
files declaring **rival scales** are still standing. Every remaining port fights
them.

**This is the single biggest lever left and it is LANE 1's path.** It is also the
one thing that cannot be done surface-by-surface.

### 2. `shell/primitives.tsx` can be DELETED OUTRIGHT — it is five files away

35 exports, 92 ratchet markers, and **five importers left**. I checked what each
one actually needs, and **every symbol already has a verified home** in
`COMPONENTS.md`'s retired-name table:

| file | needs | owner |
| --- | --- | --- |
| `_authenticated.admin.routing.tsx` | Block, Button, Failed, Loading, Select | LANE 1 |
| `_authenticated.admin.ai-costs.tsx` | Block, Empty, Failed, Loading | LANE 1 |
| `_authenticated.admin.landing.tsx` | Block, Empty, Failed, Loading | LANE 1 |
| `_authenticated.admin.proof.tsx` | Block, Failed, Loading | LANE 1 |
| **`src/hooks/use-confirm.tsx`** | Button, Field, Input | **nobody — see 3** |

Four admin routes and one orphan. **Nothing needs designing; it is import swaps
against a table that already exists.** Two cautions, both already ruled:
`Loading → Reading` drops `working`/`agent` (all five sites pass children only,
so it is still a drop-in), and **`Field`'s `htmlFor` is required** where the
retired one's was optional — that is `use-confirm`'s one real edit.

Deleting the file takes 92 markers and 35 exports with it.

### 3. `src/hooks/use-confirm.tsx` is in NO lane's set

The ownership table covers `src/styles/**`, `src/components/**`, `src/routes/**`
and `src/lib/**`. **`src/hooks/**` is in none of them**, and it is one of the five
things standing between the product and a deleted retired layer.

**Assign it.** It is a UI concern consumed by routes, so LANE 1 is the natural
home; MAIN LANE takes it if LANE 1 is loaded. This is a one-line fix to the table
that unblocks item 2.

### 4. The duplicate-component problem is bigger than `shell/primitives`

Proven tonight: **`runs/run-parts.tsx`'s `PersonMark` is a duplicate of Meridian's
`YouMark`** — same `role="img"`, same `aria-label="You"`, same tokens, differing
only in circle size, and `run-parts` does not import Meridian's marks.

**`COMPONENTS.md`'s retired-name map covers `shell/primitives` only.** The same
"parts" pattern lives in `runs/run-parts.tsx`, `brain/record-parts.tsx` and
`discover/DetailKit.tsx` — and `brain/record-parts` is already proven to hold a
component (`RecordSpeaks`) that three surfaces needed and could not find.

**Mine to widen.** Until then, a lane that finds a duplicate should file it, not
sweep it: size-snapping `PersonMark` onto a stop would have preserved a duplicate
instead of removing one.

### 5. NINE Meridian components are exhibited rather than adopted

> **CORRECTED 2026-08-24 by [`R012`](./R012-five-deleted-one-held-for-the-founder-and-M14-corrected.md).
> Two of the eleven names below were wrong, and LANE 1 caught both.**
>
> **`Flowchart` is NOT gallery-only** — `meridian/RunMap.tsx:6` imports it and it
> reaches production through `PlanGate` → `AskPlanGate` → `AskTurn`.
> **`run-rows` is NOT "used nowhere at all"** — six production consumers
> (`AgentInbox`, `ToolStream`, `PlanCard`, `RunTimeline`, `source-marks`,
> `missions/mission-timeline`).
>
> **I took both claims from `design:adoption`'s own output, and the cause will
> bite again.** That script counts COMPONENTS; `run-rows` is a constants module
> (`RUN_GRID`, `RUN_ROW`, `RunGlyph`). It has no component to count, so it
> answered a question nobody meant to ask, and I repeated the answer as a
> finding. **A metric's blind spot reads exactly like a finding.**
>
> Ruled since: five deleted, `FineTuneCard` held for the founder, two parked.

`Chat`, `DiffTable`, `FineTuneCard`, `Flowchart`, `InsightCards`,
`PromotionCard`, `PromptBar`, `RecommendationCard`, `SelectionActions` are
gallery-only; **`run-rows` is used nowhere at all, not even the gallery.**

The adoption script's own line is the ruling: *"a component used nowhere but the
gallery has not been adopted, it has been exhibited."* **Each one is a wire-it or
delete-it decision, and `REQ-008` is the precedent for how to take it** — measure
whether it should exist before finding it a home. `CriticBrief` in
`components/today/` is in the same category and was found the same way.

## What is NOT a problem, recorded so it does not get re-raised

- **The retired-layer census is complete and every symbol has a home.** Eleven
  symbols across five files, zero unmapped. A census reading "no Meridian
  equivalent" has found a rename; check `COMPONENTS.md`'s second table first.
- **Shell-zero on LANE 0 paths is real.** Verified independently by attributing
  every remaining importer to its owning lane, not by re-reading the unit.
- **The migration ledger is in sync**, head `20260823010000` = repo head.
- **Nothing is waiting on MAIN LANE.** Every request from both lanes is ruled.
