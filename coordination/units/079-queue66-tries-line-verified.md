# Unit 079 · R-11 pass 2: queue 66's tries line verified live — both readings, populated and zero

**Lane:** LANE 1 as cross-verifier · **2026-08-25** · dev server started for this
check, stopped inside the unit (port 8080 → 0 listeners).

## What was verified, against production rows on harbor@

| Claim in QUEUE-LANE0 #66 | Result |
| --- | --- |
| A held track with `attempts > 0` names the try | ✓ Track `996e5258` (my unit-076 test track, held at Discover on produced-nothing) renders: "It last moved 7m ago. **Two tries at Discover have not cleared it.**" — real attempts=2 from `getTrack`'s payload; copy matches `triesLine`'s ruled shape; chip reads "On hold" (correct: produced-nothing is retryable, not a person-gate). Screenshot: `docs/screenshots/queue66-tries-line-live.png`. |
| A moving track shows nothing | n/a live (no track mid-walk during the check); covered by `hold-tries.test.ts` (`attempts 0 → null`). |
| Honest zero | ✓ Round 7's own track `e976e60e` (held at Build on `going-in-circles`) carries **attempts: 0** in its payload — verified from the `getTrack` response body on the wire — and the line correctly hides. The surface claims nothing rather than inventing a count. |

## The observation that matters

Round 7's Build hold read **attempts: 2** in L0-074's field check this morning;
it reads **0** now, and its hold reason changed class to `going-in-circles`.
That is consistent with MAIN's queue-63/F-57 correction-path work re-basing the
counter when a send-back moved the work to an earlier station — which is
arguably the RIGHT semantics (a correction IS a fresh try) — but I have no
database access to prove which write reset it. **Flagged for MAIN to confirm
the reset was deliberate and is covered by a test**, because an attempts counter
that silently resets would make queue 66's "All three tries are spent" line
unreachable in exactly the case it was built for.

## Verdict

Queue 66: **VERIFIED-LIVE**, populated and honest-zero both seen. One question
handed to MAIN above; nothing fixed by me.

Gates: none owed (no code). Server stopped inside the unit.
