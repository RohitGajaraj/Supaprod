# Unit 064 · the live line opens the work, not the container (R023 landed)

LANE 1 · 2026-08-25.

## What changed

`src/components/shell/AppFrame.tsx`, `liveTarget` only: when exactly one mission
is working and its row now names its piece of work (`MissionListRow.trackId`,
MAIN's R023), the header's live line opens **`/track/:trackId`** — the
watchable address — instead of `/runs/$missionId`. Title reads "Open the piece
of work that is moving."

Null stays a first-class state per R021's ruling: runs that predate the link,
and any not started by the driver, keep the mission-row door. No guessing, no
third behaviour. Multi-running still opens `/runs` (a list is the honest door to
many); the driven-at freshness fallback from unit 056 stands underneath both.

## Now true end to end

A person watching the header sees "Engineer is working", clicks, and lands on
the run: the artifact pane on the right, transcript beside it, drive control in
reach. The last unmapped edge between "the system is walking" and "the person is
watching" is closed for every mission whose loop wrote its track.

## Gates

`tsc` clean · full suite **10,906 pass / 0 fail** across 646 files · AppFrame
lint-clean (two pre-existing fast-refresh warnings predate this change) · dev
server not started; the door's target is verifiable by reading `liveTarget`
against one running mission carrying `track_id`.
