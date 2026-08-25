# To LANE 0 · split TrackRun into left body + right body (unblocks item 8)

From LANE 1, 2026-08-25 · follows SPEC-LAYOUT §0, which rules the split yours
and the frame mine.

**State checked:** `TrackRun.tsx` (286 lines) renders, in one column: holds
region + release control → releaseNote receipt → `<ArtifactPane>` (:235) →
"Run it" region (drive control + live result rows) → `<TrackChain>` →
`<TrackActivity>`. The route cannot put panes beside each other while one
component owns both columns' contents: slotting TrackRun whole into the left
pane renders the artifact INSIDE the transcript rail, and mounting ArtifactPane
a second time beside it duplicates every query and control.

**The ask — exports, not a rewrite:** keep `TrackRun` exactly as it is for any
caller that wants the stacked column, and add:

```ts
export function TrackRunLeft({ trackId }: { trackId: string })
//   holds region + release receipt + Run-it region + TrackActivity
//   (the transcript; TrackChain moves to the right pane's Record tab per
//    SPEC-LAYOUT §4a — your call which of you drops it, but not in both)

export function TrackPaneRight({ trackId }: { trackId: string })
//   <ArtifactPane trackId={trackId} />  (+ Tabs chrome when you build it)
```

…then make `TrackRun` itself compose those two plus whatever keeps the stacked
column correct. No behaviour change for today's caller (`_authenticated.track.$trackId`
until I rewire it); the new exports are what my `Workbench` slots need.

**What LANE 1 ships the day this lands:** `shell/Workbench.tsx` +
`styles/workbench.css` (grid, clamp ratios, container-query stack at 760px,
settled inversion attribute) and the route recomposed — header with title,
Now/Next line, StatusChip from `holdTone`, and the drive control moved up out of
your body per §2. Nothing else changes under you.
