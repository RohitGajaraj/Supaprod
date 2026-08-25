# Unit 075 · item 8 DELIVERED: the two-pane workbench (024 executed by LANE 1)

LANE 1 · 2026-08-25 · claim in `075-claim-item8-split.md` under the founder's
parallel order. Server started once for the render proof, stopped immediately.

## What shipped

| File | Change |
| --- | --- |
| `src/components/track/TrackRun.tsx` | Split into `TrackRunLeft` (character, consent, holds + release, run-it legs + copy, transcript — owns all walk state) and `TrackPaneRight` (artifact pane + record, sharing their private pane-station pointer). Stacked `TrackRun` composes both so every existing caller keeps today's behaviour. One documented delta: run-it sits above the artifact in stacked mode, because the control belongs to the transcript pane. |
| `src/styles/workbench.css` | NEW. SPEC-LAYOUT §1 geometry verbatim: grid rows auto/1fr, left rail `clamp(300px,38%,440px)`, container query at 760px against `.sp-work` (no local container-type), per-pane independent scroll, settled inversion to 24% on `--mrd-d-move`. Header card on sheet ground. |
| `src/routes/_authenticated.track.$trackId.tsx` | Surface replaced by the workbench: header spans both panes (title, Now/Next, origin clamped, status chip, disclosure line), walking pane left, artifact pane right (`data-settled` wired from `track.status === "done"`), `data-page-composer` on the root per §1. |

## Proven live (harbor@, one session)

Two panes render side-by-side at **440px + 864px** with **no horizontal scroll**
— measured from computed styles, not eyeballed; matches SPEC-LAYOUT's ratio
table at this viewport. Screenshot: `.playwright-mcp/item8-two-pane.png`.

## Deviations, named

- The drive control stays in the LEFT pane rather than moving to the header:
  it is welded to the legs/auto-continue state that lives there. Moving it up
  is a small follow-up once LANE 0 blesses the new exports.
- CopyLink (gap G5) and the elapsed clock (G10) remain absent for the reasons
  already on file.

## Gates

`tsc` clean · lint clean on both touched files · component + route suites
**3,088 pass / 0 fail** at split time; full suite green on last full run ·
server stopped inside the unit.
