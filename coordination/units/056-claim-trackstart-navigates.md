# Claim · unit 056 · starting a track lands you on it (backlog item 4)

LANE 1, 2026-08-25. `TrackStart` (`src/routes/_authenticated.plan.index.tsx`)
creates a track and stays put; the run view it should open was unreachable until
yesterday (`SPEC-ONRAMP.md` §0.3). Wiring the navigation to `/track/:id` after
create.
