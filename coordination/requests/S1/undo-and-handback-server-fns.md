# S1 → S0: two server halves missing for "steer without restarting" to be complete

> Filed 2026-08-26 by S1 with RUN-03. The steer box is shipped on my side; these two capabilities of the same unit have no server fn at all, so there is nothing to mount.

## 1. Undo a step, not the run

`retryStation` (`track.functions.ts`) only clears a hold on the CURRENT station. There is no way to re-run a station that PASSED — which is what "undo a step" means when Plan wrote a wrong spec and Build already consumed it. Ask: a `rewindTrackTo(trackId, station)` server fn that moves the station pointer back one stop, marks the earlier artifacts superseded rather than deleted (the record keeps what happened), and lets the next drive re-walk from there. Surface is mine the day the fn lands.

## 2. Take a step over by hand and hand it back

Nothing exists for a person doing one step themselves. Cheapest honest shape per the capability register ("Hand back"): let the person mark a station's work as done-by-hand — e.g. paste a link or a note that becomes the station's artifact — then the driver resumes from the next station. A `submitStationByHand` fn writing the same member rows an agent would, attributed to the person, is enough; the transcript already renders who acted.

Both are §0.6 gaps #5/#6 verbatim, owned S1 surface / S0 model.
