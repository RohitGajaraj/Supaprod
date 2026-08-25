# Unit 062 · item 8 state: the frame is sequenced, the split requested

LANE 1 · 2026-08-25 · no product code in this unit; request `024` filed.

## Why item 8 did not ship tonight

`TrackRun.tsx` (LANE 0) owns BOTH columns' contents in one column: holds +
release, ArtifactPane (:235), Run-it drive region, TrackChain, TrackActivity.
SPEC-LAYOUT §0 rules the pane bodies LANE 0's and the frame mine, with the
route passing them as slots. Slotting is impossible while one component holds
both: whole-TrackRun-in-left renders the artifact inside the transcript rail;
double-mounting ArtifactPane duplicates its queries and controls. A two-pane
grid with a fake second column would be a lying layout — the exact defect this
mission exists to end.

**The unblock is one export pair on LANE 0's file** (request 024): keep the
stacked `TrackRun` intact for today, add `TrackRunLeft` + `TrackPaneRight`.
The day it lands: `shell/Workbench.tsx` + `styles/workbench.css` (grid verbatim
from SPEC-LAYOUT §1 — clamp(300px,38%,440px)/1fr, container query at 760px
against `.sp-work`, settled inversion at §5) and the route recomposed with the
header owning title / Now–Next / StatusChip via `holdTone` / the drive control.

## What this session shipped overall (running tally)

| Unit | Item | Delivered |
| --- | --- | --- |
| 055 | 2 | `/start` landing: gate off, composer + 4 job cards, open runs live |
| 056 | 10 | Header sees mission-less walks; live line opens `/track/:id` of the run that moved |
| 057 | 12 | Today reviewed (R-12 five answers); promotion bundle specified |
| 058 | 13 | Engine Room route review: 2 surfaces survive, boundary folds, stubs stay |
| 059 | 14 | Brain + Settings reviewed; R-06 verified by mechanical sweep |
| 060 | — | Swapped onto Meridian `PickCard`/`Composer`; local copies deleted; leading regression recorded |
| 061 | standing | Route census: 96 files dispositioned for item 6 |

Open asks filed by me, awaiting their owners: 017/018 (MAIN), 019+020+022 (LANE 0),
023+024 (MAIN/LANE 0). Verify requests out: verify-start-landing,
verify-rail-leads-to-run (MAIN supplied the live-data half; browser half with
LANE 0).

Dev server: never started this session. All pushed units carried green tsc +
full bun test + lint-clean-on-my-files.
