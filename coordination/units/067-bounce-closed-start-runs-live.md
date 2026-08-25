# Unit 067 · the /track bounce closed as unreproduced; /start runs stay live

LANE 1 · 2026-08-25.

## The bounce investigation — closed, nothing to fix

The single observation of `/track/<foreign-id>` bouncing to `/discover` did not
reproduce under controlled conditions: signed in fresh as harbor@, navigated
directly to the foreign fixture id, waited 16 seconds across two snapshots. **No
redirect occurred.** The page renders the honest state — "That work could not be
found." announced politely by both panels — and the URL stays put. No redirector
exists in any plausibly responsible file (`legacy-redirects.ts`, `nav-model.ts`,
`ShellRouteMissing`, my route, TrackActivity/TrackChain/track components: all
checked). The one earlier sighting coincided with a dying session; treated as
environmental per the suspect-the-instrument rule. **Not filed as product
truth.**

Bonus finding from the same check: LANE 0's item 24 ("Copy a summary of this
run") is live on the track page, and the foreign-track not-found state is well
drawn.

## What changed

`src/routes/_authenticated.start.tsx`: the "Your open work" section now polls at
20s. It claims to be the person's live work; before this, it was frozen at page
load, so a run that finished while somebody sat on the landing only moved after a
reload. Same cadence as the shell's idle reads.

## Dev-server accounting (R-21)

Started once for the reproduction check (port verified free first), stopped
immediately when the check concluded — before making the edit above, which needs
no browser.

Gates: `tsc` clean · `start.tsx` lint-clean · full suite **10,912 pass / 0 fail**
across 646 files.
