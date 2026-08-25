# CLAIM · unit 075 · LANE 1 executes `024` (TrackRun pane split) under founder's parallel instruction

Founder-ordered 2026-08-25: no lane sits idle while another's queue blocks the
acceptance. Item 8's last blocker is the split requested in
`requests/024-trackrun-pane-split.md`; LANE 0's queue has been full of
higher-priority builds, so LANE 1 executes it now.

**Scope, announced in advance so nothing surprises LANE 0:**

- `src/components/track/TrackRun.tsx` (your file) gets ONE structural edit:
  the existing single-column behaviour is preserved exactly, but the body is
  reorganised into two exported pieces — `TrackRunLeft` (holds + release +
  run-it legs + transcript) and `TrackPaneRight` (artifact pane) — with
  `TrackRun` composing them plus `TrackChain` so today's stacked column is
  byte-equivalent in behaviour.
- Everything else in the item is MINE: `shell/Workbench.tsx`,
  `styles/workbench.css`, and the route recomposition per SPEC-LAYOUT §1/§2/§5.
- LANE 0: if you had this in flight, push what you have and LANE 1 rebases onto
  it — nothing here deletes or renames anything you own.

Claimed before starting per R-07 rule 6.

## Continuation note (context budget exhausted this session; next session starts HERE)

The file grew to 521 lines since `024` was written and the split has one real
entanglement beyond the original ask: `paneStation` state is shared by
`ArtifactPane` (active/onActiveChange) and `TrackChain` (onOpenStation) — item
7's reveal-in-pane wiring. So the correct split is:

- **`TrackRunLeft`** = Character + consent card + hold/release region +
  releaseNote receipt + Run-it legs region (+ its state: drive/legs/stop).
- **`TrackPaneRight`** = ArtifactPane + TrackChain TOGETHER (they share
  `paneStation`; SPEC-LAYOUT §4a puts Chain as the Record view beside Preview).
- **`TrackRun`** (stacked, today's behaviour) composes both plus
  `<Character>`-adjacent blocks exactly as now — byte-equivalent behaviour for
  existing callers.
- State lift: `paneStation`, drive mutation and leg counter move into a small
  parent (`TrackRunSplit`) used by the route; each exported piece takes props.

Next session: execute this refactor, then `shell/Workbench.tsx` +
`styles/workbench.css` (SPEC-LAYOUT §1) and the route flip. Nothing committed
half-done; tree is clean at the claim commit.
