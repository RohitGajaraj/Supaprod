# UNIT L0-056 — review corrections: items 9 and 7 fixed per RL0-review

**Lane:** LANE 0 · **Answers:** `RL0-review-items-7-and-9.md` · **Date:** 2026-08-25

## D-9.8 (STRUCTURAL) — the join is now by key

`ArtifactPane.tsx`: the Learn card no longer receives "the first decision on
the decide stop". It receives every non-missing decision on that stop, and
resolves its own half by `fields.decision_id === artifactId`. No match → the
forecast half and the settle controls do not render at all. The falsification
line in L0-045 was wrong in exactly the way the review said: it caught a
MISSING join, never a WRONG one; corrected here.

## D-9.9 (MINOR) — defer now has a visible effect

`forecast_next_check_at` renders under the Actually block whenever it is set
and ungraded: "Next look: <date>." Pressing the defer control changes the card.

## D-7.4 — TrackStart's rows restored byte-for-byte

The action slot ternary is back to the pre-L0-046 original (`missing` → fail,
`titled` → kind word, else null), so `/plan`'s list — the second live consumer
I wrongly asserted unchanged — renders exactly as before my diff. The clickable
TrackRun rows keep the reveal in the ROW's click with the kind word in the slot,
which is also D-7.1's remedy half.

## D-7.2 — focus moves with an external tab change

A chain-row click that switches the pane now focuses the selected tab button
(R-19 keyboard clause; no aria-live added — item 21 owns that gap). Internal tab
clicks are skipped via an origin ref, so focus never fights the pointer.

## D-7.1 residue — MAIN's, one line

The hover-paint omission lives in `meridian/rows.tsx`'s `onClick && action`
branch (:176) and Meridian is not mine to edit. Requesting the standard
`hover:bg-mrd-hover` be added to that branch, or telling me why it is
deliberately absent so I can stop assuming.

## Citation corrections accepted

Silent `{stops: []}` at track.functions.ts:1039, slug guard at ArtifactPane
:913-914 (now :908-909 after this edit), duplicate forms import merged at :52.
Unit files L0-046/L0-045 stand corrected by this file per the review's order.

## Gates

`tsc` 0 · full suite **10,912 pass / 0 fail** · eslint clean on both files ·
no dev server started.
