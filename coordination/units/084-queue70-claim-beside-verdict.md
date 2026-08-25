# Unit 084 · Queue 70: the claim beside the verdict (F-65's read half, route side)

**Lane:** LANE 1 · **2026-08-25** · no dev server needed (see Verification).
Claim `1672bf78e`; released with this commit.

## What shipped

`src/routes/_authenticated.learn.tsx` only, per the queue's file bound:

- **`ClaimBesideVerdict`** — a route-owned region under the outcome cards. For
  the newest eight learnings it fetches `getLearningGradeContext` (which
  resolves `learnings.decision_id` server-side — no list-select widening
  needed, so no MAIN ask) and renders one row per linked decision:
  **decision title · the claim as written at Decide · the horizon date · how
  it settled** (the forecast resolution when present, else the learning's own
  verdict word — never both claiming the same fact).
- **Absent is the honest shape:** the region renders NOTHING until at least
  one pairing exists. All 133 production learnings carry NULL `decision_id`
  (F-65's measurement), so /learn renders exactly today's page — zero visual
  delta, zero invented pairing. The first track to complete Learn on the new
  driver produces the first pairing, and this region is already live for it.
- Bounded at 8 reads (freshness serves the person; the table is not swept),
  contexts cached under `["learning-grade-context", id]` at 60s staleTime, and
  gated on the same workspace flag LearnedCards uses.

## What was tried first

`LearnedCards` → `InsightCards` has no per-card open affordance, and both are
LANE 0's / MAIN's paths — the queue says coordinate, don't cross. A per-card
open detail is the richer shape and needs a prop threaded through TWO files
neither of which is mine; filed to the INBOX as the follow-up shape rather
than blocking this one. The route-owned region delivers the pairing with
exactly one file touched.

## Verification state — honest

- `tsc` clean · route suite 466 pass / 0 fail · eslint clean on the file.
- **Today's required shape verified by construction:** with every
  `decision_id` NULL, every context returns `decision: null`, so the region
  renders null — the acceptance's "render exactly today's card" holds.
- **The populated shape is code-proven, not pixel-proven:** the live browser is
  credential-blocked (stale demo password, INBOX 14:0x), and no decision-linked
  learning exists yet to render. **Pre-written falsifier:** when the first
  F-65-linked learning lands (first track completing Learn on the new
  driver), open /learn — EXPECT a "The claim beside the verdict" region whose
  row shows the decision title, the forecast claim, the horizon date, and the
  resolution or verdict word. If a region appears over all-NULL rows, or a
  row invents a claim, this unit is wrong.
- Known limit, named: a context read that errors drops that row silently
  (absence, not a failure state). The page's primary reads own failure
  surfaces; if MAIN wants the pairing to fail loudly, that is a follow-up.

## Follow-up filed (INBOX)

Per-card open affordance: `onOpen` through `InsightCards` (MAIN) +
`LearnedCards` (L0) would let the pairing open INSIDE the card a person is
reading. This region sits beside the cards until then.
