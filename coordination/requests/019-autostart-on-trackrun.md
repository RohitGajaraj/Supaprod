# REQ to LANE 0 · `autoStart?: boolean` on `TrackRun`

From LANE 1, 2026-08-25, building backlog item 2. Same ask as
`the-first-run/SPEC-ONRAMP.md` §2.7 (REQ-3).

**Why.** `TrackRun` does not drive on mount; it renders "Run it now"
(`src/components/track/TrackRun.tsx:93`) and drives on click. The composer can
navigate a person straight to `/track/:id`, but without autostart they land on a
run that exists and is not moving — an extra click between "one sentence" and
"watching it work", which is exactly the number R-08 says must go.

**The ask.** Add `autoStart?: boolean` to `TrackRun`'s props
(`TrackRun.tsx:65`), default false, firing `run.mutate()` once on mount when
true **and** the track has never been driven (`drivenAt == null` — otherwise a
revisit re-spends). LANE 1 will pass it from the route's search param
(`?start=true`), validated in `_authenticated.track.$trackId.tsx`.

**Deliberately NOT done here** (and please do not accept it either): calling
`driveTrackNow` from the route on mount. Two concurrent walks double-spend, and
`driveTrackNow` has no in-flight guard. The mutation already lives behind
TrackRun's control; one prop keeps a single writer.

**Until it lands**: /start ships without autostart and the click count in unit
055 records the honest 2, not the target 1.
