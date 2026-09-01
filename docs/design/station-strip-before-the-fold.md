# The station strip, as it stood before the fold

> _Created: 2026-09-02 · The reference point for what was removed_

**This is a preservation record, not a specification.** It captures the horizontal seven-station
strip exactly as it rendered on 2026-09-02, immediately before it was taken off workspace screens.
Founder's instruction, 2026-09-02: _"just take a screenshot of our existing screen and store it
somewhere or document it somewhere ... in the future, if you have to bring this reference point, it
would be a good reference point for us."_

**The images are not in git.** `docs/screenshots/` is gitignored and this repo does not commit
screenshots, so two captures were written locally and will not survive a fresh clone:

    docs/screenshots/strip-reference-workspace-2026-09-02.png
    docs/screenshots/strip-reference-run-2026-09-02.png

Everything needed to rebuild the strip is therefore written down below rather than photographed.
If it is ever wanted back, this file is enough to reconstruct it without archaeology.

---

## What it was

A 95px band directly under the app header, spanning the full app width, on **every signed-in
surface**. Seven chips, one per station, each carrying a two-digit marker, the station name, an
optional note, and a state mark.

It had two modes:

| Mode | Where | Source |
| --- | --- | --- |
| **Workspace spine** | every signed-in screen with no run published | `WorkspaceSpine` in `AppFrame.tsx` |
| **Run strip** | `/track/:id`, published by `usePublishRunStrip` | `RunStripSpec` in `run-strip-spec.ts` |

## What it measured, on the running product

Captured signed in as Maya Ruiz, workspace Helio Labs / Prism, viewport 1440x900.

| | Workspace screens | Inside a run |
| --- | --- | --- |
| Height | **94.5px**, 10.6% of a 900px viewport | same |
| Chips carrying a fact beyond the name | **3 of 7** | **0 of 7** |
| The notes | `89+ runs waiting on you`, `6+ runs waiting on you`, `6 outcomes to record` | none |
| Element | `<div class="sp-stage">` | `<button class="sp-stage">` |
| Clickable | no | yes, swaps the work pane |
| Keyboard reachable | no (`tabIndex: -1`) | yes |

**The two counts disagreed with the header.** The header read _"68 decisions are ready for you"_
while the Discover chip read _"89+ runs waiting on you"_ -- two different counts of
things-waiting-on-you, 150px apart, with nothing on screen explaining the difference.

## The markup

```html
<div class="sp-strip" role="group" aria-label="The seven stages, and where the work is">
  <div class="sp-stage" data-state="gate" data-on="true">
    <span class="sp-stage-n">01</span>
    <span class="sp-stage-name">Discover</span>
    <span class="sp-stage-state" title="More are waiting than this counts">
      89+ runs waiting on you
    </span>
    <span class="sp-stage-mark">
      <span class="sp-stage-dot" data-kind="gate" data-moving="true" aria-hidden="true"></span>
      <svg width="12" height="12" ...>...</svg>
    </span>
  </div>
  <!-- 02 Decide ... 07 Learn -->
</div>
```

On a run the wrapper was `aria-label="The seven stages of this run, and where it is"` and each chip
was a `<button>` carrying `data-state` of `done | held | next | quiet`.

## The CSS, and the two arguments worth keeping

Both live in `src/styles/shell.css` and both were founder-reported defects with measured fixes.
They are recorded here because they are the non-obvious parts, and a rebuild that skips them
reintroduces the bugs.

```css
.sp-strip {
  display: flex;
  gap: 0;
  background: var(--mrd-sheet);
  border-bottom: 1px solid var(--mrd-line);
  padding: 12px 18px;
  flex: none;
  overflow-x: auto;              /* was `clip` */
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  scroll-snap-type: x proximity;
  container-type: inline-size;
  container-name: spinestrip;
}
.sp-stage {
  flex: 1;
  min-width: 108px;              /* was 0 */
  scroll-snap-align: start;
  padding: 4px 14px 4px 0;
  text-align: left;
  background: none;
  border: 0;
  border-radius: var(--mrd-r-xs);
  font: inherit;
  display: block;
  transition: background var(--mrd-d-press) var(--mrd-ease);
}
```

**`overflow-x: auto` and `min-width: 108px` are a pair, and neither works alone.** Founder,
2026-09-01: _"The seventh strip is not visible."_ With `overflow-x: clip` and `min-width: 0` the
seven chips divide whatever space exists however small, so below roughly 950px they compress past
legibility and the tail is cut off the right edge with no scrollbar, no fade and no way to reach
it -- and Learn, the station carrying the verdict, is the one that disappears, because it is last.
108px is measured: the longest name plus its marker and glyph, nothing truncated.

**The container query is deliberate and its old justification was false.** The comment claimed the
strip narrows with the rail. It does not: `.sp-strip` is a sibling of `.sp-mid`, so it spans the
full app width in every rail state. It stays a container query because it measures the element it
reasons about, which keeps it correct if the strip ever moves inside the work area.

## Why it came off the workspace screens

Recorded so the decision is not re-litigated from memory. Founder decision, 2026-09-02, after
reviewing the measurements above.

1. **Four of seven chips carried nothing.** A two-digit number and a word. That is the
   value-identical-on-every-row defect this whole pass removed elsewhere, laid out horizontally.
2. **Its three real facts had better homes that already existed** -- the rail counts approvals, and
   outcomes-to-record belongs on the Insights door.
3. **It contradicted the positioning.** `README.md`: _"never lead with the seven stations ... a
   workflow tool is compared on features; three layers is a position."_ A permanent seven-station
   band on every screen leads with stations on every screen.
4. **F-146 already prescribed exactly this and it was never finished.** The finding, founder-reported
   2026-08-31, records the remedy in its own words: _"the fold: when the rail carries one primary
   door and stations appear only as the step list inside a run, the ambiguity has nowhere left to
   live."_

## The history that led here, in order

| Commit | What it did |
| --- | --- |
| `a0b6124f5` | Removed station navigation. Verified before: seven `<button class="sp-stage">` with chords `g d`/`g e`/`g p`..., and clicking Plan went `/today` to `/plan`. Removed under R-01 and F-146. |
| `bd678bc61` | Removed the leftover affordance. After the doors went, `cursor: pointer` and a hover ground were still on all seven chips with `tabIndex: -1` -- pointer on seven, clickable on none. Also gave the run screen its own published strip, so the band on `/track/:id` finally described that run instead of the workspace. |
| `commit below` | The fold. Removed from workspace screens entirely by gating the render on `strip.mode === "tab"`; kept inside a run and shrunk from 91px to 74px by collapsing four stacked lines to two. |

## What the fold actually changed, measured

| | Before | After |
| --- | --- | --- |
| Workspace screens | 94.5px band on every one | **nothing**; the work area starts at y=56 instead of y=151 |
| Inside a run | 91px, four stacked lines per chip | **74px**, number and state mark on the name's line |
| `.sp-stage` floor | 108px, measured for a stacked chip | 124px, measured for the one-line chip |

**The four publishers were left alone.** `WorkspaceSpine` plus `DiscoverSurface`,
`InboxSurface` and `Board` all still publish a `nav` strip, because a surface saying what it is
doing is not the defect -- rendering a permanent band from it was. The whole fold rests on one
condition in `AppFrame.tsx`, which is why `the-strip-is-a-runs-step-list.test.ts` exists: gating on
`strip` alone would put the band back on every screen with nothing to notice.

## What is still not done, and it is the half the founder asked for

**"It should do more."** The strip inside a run still says the station name and a state mark, and
nothing about what each stage produced. That is not an oversight in the layout -- it is a field
that was designed and never filled. `RunMapStation.outcome` is documented as _"WHAT CAME OF THIS
STATION, in outcome words a reader would use ... 'Read Intercom and PostHog for verify-step
drop-off'"_, and `run-position.ts` never sets it. `noteFor` in `run-strip-spec.ts` therefore
returns the waived reason or an empty string, which is why zero of seven chips carry a fact.

Filling it is a data question, not a layout one: per-station artifacts exist in `agent_runs` and
`tool_calls` and would need a server function to summarise them. Until then the note line stays
reserved and empty, which is deliberate -- a founder ruling from 2026-07-30 keeps that height so
the band does not nudge the page as stages change.

**And the run screen showed the seven stations FOUR times, not three.** Corrected 2026-09-02 by a
read-only audit: the shell strip, the route in the left pane, the "What it has made" tab row, and
`TrackChain`'s own station rows -- which is the biggest of the four at 2,706px -- plus a fifth
statement in prose, "Now: Build. Next: Ship." Two of them were `role=tablist` over the SAME
`paneStation` pointer.

The tab row was removed in `34b3f06d9`, leaving one tablist and one control. What remains, and is
NOT resolved: the strip and the left pane's route now print the identical produced-sentence
("Discover filed 1 finding.") 400px apart, because both read it from the same chain. Which of the
two keeps it is a design call that has not been taken.

## If it is ever wanted back

The ban is on stations as **navigation** (R-01, re-affirmed by R-13), not on stations as
**information**. Restoring the workspace band is a ruling change, and the argument against it is
F-146: a rail door and a station chip that look alike and behave differently is the ambiguity the
founder reported. The in-run strip is R-01-compliant because selecting a stage swaps the work
region and never leaves the run -- `RunStripSpec.onSelect` states that contract at the type.
