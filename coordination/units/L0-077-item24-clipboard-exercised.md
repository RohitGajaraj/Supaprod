# UNIT L0-077 — item 24's clipboard write, exercised for real

**Lane:** LANE 0 · **Closes:** the last falsifier I can reach without MAIN's
fixtures (QUEUE-LANE0 §3) · **Date:** 2026-08-25
**Against:** production, `/track/e976e60e-be6f-423e-b640-4ca26a469e11`
(Round 7's track), signed in as harbor@ via the shared browser session.
No dev server. Screenshot: `item24-copy-verified.png`.

## What was exercised, in order

1. Pressed **"Copy a summary of this run"** — a real `<button>`, keyboard
   reachable by construction.
2. Feedback appeared beside it in a `role="status"` region:
   *"Copied. Paste it wherever the review happens."* — announced, not a toast
   nobody's screen reader sees (R-19).
3. Granted `clipboard-read` to the headless context and read the clipboard
   back: **2,345 characters of readable prose**, no JSON anywhere (asserted:
   zero `{"id"…`/`"track_id"`/`"kind"` key shapes).

## What the summary carries

```
Checklist steps vanish when the crew drops signal in a basement (a Supaprod run)
Where it is: Build
Why it is stopped: Build has been run many times over and the work has not
moved on once. That is the loop rather than any single run…
What each step filed:
- Discover: signal ×… + honest ingestion-gap notes
- Decide / Plan / Design / Build: one line each with what landed
https://supaprod.ai/track/e976e60e-be6f-423e-b640-4ca26a469e11
```

Title, position, stop reason in the driver's own words, per-station findings,
and the link — exactly "the thing you most want to hand somebody".

## One wart found while reading it back

The Design line repeats the prototype title **five times** ("Atlas Offline
Checklist Sync Resilience Surface" ×5, one truncated mid-sentence). The join is
real data rendered redundantly — polish debt in the summariser, not a defect
class. Filed here so whoever touches the summary builder next starts there.

## Owed-verifications ledger after this unit

| Item | State |
| --- | --- |
| 24 clipboard | **VERIFIED-LIVE (this unit)** — write, feedback, and content shape all proven |
| 28 autoStart | VERIFIED-LIVE by LANE 1 unit 069 incl. revisit-guard |
| 34 auto-continue | negative case LANE 1; positive multi-leg chain proven with AUTO_MAX=24 in `074-item55-proven-chaining.md`; cap message still never observed (needs a 24-leg walk — inherently expensive, left honestly unobserved) |
| 23 populated review card | BLOCKED on MAIN provoking `studio.review` once (INBOX #3) |
| 29 exhausted banner | BLOCKED on MAIN's zeroed-account fixture |
| graph canvases both themes | VERIFIED-LIVE (L0-073) |

## Also probed while on the page

The new expiry sentence (L0-076): no settled-gate note renders on this track,
and production predates the commit anyway — the rendered-form check stays owed
until MAIN publishes. Formatter itself is test-covered.
