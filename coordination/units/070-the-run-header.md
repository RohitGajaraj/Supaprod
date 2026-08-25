# Unit 070 · the run header: the work named, its state honest (SPEC-LAYOUT §2 slice)

LANE 1 · 2026-08-25 · dependency-free slice of item 8 — the header half of
`shell/Workbench.tsx`, shipped in the route now because nothing about it waits
on the pane split.

## What changed

`src/routes/_authenticated.track.$trackId.tsx`:

- **The page names the work.** The generic "This piece of work" heading is gone;
  the h1 is `track.title` — the opening sentence a person recognises.
- **Now / Next, in passing.** One meta line reads "Now: Design. Next: Build."
  from `AGENT_STATIONS`' display map and `nextStation(route, station)`; when no
  station remains it says "Nothing further on this route." Names appear only as
  facts about this run (R-13) — never a menu.
- **The status chip is derived, not guessed.** `holdTone(track.holdReason)` —
  the same set answer the driver enforces — picks you/hold/pass/agent, with the
  override words "Waiting on you" / "On hold" / "Finished" / "Abandoned" /
  "Running", pulse only where something is live or wanted. Second line is the
  hold sentence verbatim from the row. "Finished" overrides pass's default word
  deliberately: completion is not a graded outcome, and the product has never
  graded one.
- **The origin sentence** renders quiet under Now/Next when it exists.
- **Foreign/garbage ids get an honest heading** ("That work could not be
  found.") instead of pretending to load — matching the panels' own words below.

**Deliberately absent:** the elapsed clock. SPEC-LAYOUT G10 flags that every
`driven_at` write looks like seat-END, so a clock built on it would measure the
wrong interval — worse than none. It arrives when MAIN answers G10 or LANE 0's
walk-age approach covers it.

**Also absent:** the drive control and CopyLink in the header. Drive stays in
TrackRun until request 024's split lands (moving it now would orphan the
auto-continue legs logic LANE 0 just shipped); CopyLink is Meridian gap G5.

## Proven live (harbor@, one session, stopped after)

Held-state screenshot: `.playwright-mcp/verify-run-header-held.png` — title,
"Now: Design. Next: Build.", origin paragraph, On-hold chip with the driver's
sentence, disclosure line beneath, TrackRun's own hold region agreeing with the
chip.

Gates: `tsc` clean · lint clean · full suite **10,912 pass / 0 fail** across 646
files.
