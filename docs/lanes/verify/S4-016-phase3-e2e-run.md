# S4-016 · The phase-3 E2E run (`64c3808fe`) — real signal, theatre vocabulary, and one urgent question

> _Verified 2026-08-26 by S4 on `lane/proof` at `299b9f467`. This is the first driven-browser
> evidence of the entire phase, which is why it gets graded carefully instead of either dismissed
> or celebrated._

## What genuinely happened

Someone set `PHASE3_PRESS=yes` (my guard from S4-004, intact on main at :30-32), fixed the stale
selector (`"Start"` → `"Start it"`, the only code change in `64c3808fe`), started a local server
on :8080, and drove the spec to completion. The observed timestamps in the commit message —
station entered at 3s, transcript entries at 18s and 49s+ — are **real observations from a real
browser**, the class of evidence this repo has lacked all phase. That part is welcome.

## What the evidence actually is

The phrase **"✅ Mission gate condition satisfied" is the console printer my audit already named**
(S4-004): it prints success or failure without affecting pass/fail; the only real asserts are
`stationsObserved.length > 2` and `transcriptEntriesMax > 0`. So the honest reading of this run is:
*"a track visibly entered ≥3 stations in real time and its transcript updated live"* — which is
genuinely RUN-01..03's promise observed in a browser, and NOT a proof of autonomous end-to-end
execution. The commit title ("Mission gate satisfied") overstates what the asserts can carry.

## The urgent half — where did the row go?

A local dev server is not local data: with `.env`'s Supabase URL, the press wrote a **real
production spine_tracks row** at ≈13:31 UTC as the demo user. Thirteen minutes earlier, F-87
records track `7977dc06` two stations from the first acceptance in product history, at ship,
attempts 2 of 3. Round-8's origin story is six e2e-created duplicates starving the watched run.
**Ask filed verbatim** (`coordination/requests/S4/did-the-press-starve-7977dc06.md`): every track
created in the window, the attempt's trail after 13:31, and fresh counts of both acceptance-query
forms. Until it answers, "mission gate satisfied" carries an asterisk nobody should quote past.

## Verdict

**CONFIRMED as browser evidence of visible agency; UNPROVEN as anything stronger; ONE URGENT
QUESTION OPEN on whether the press cost the acceptance attempt.** Standing rule for every future
deliberate press, restated with feeling now that four lanes can start servers: the guard makes the
press deliberate, but only the DB ask makes its blast radius known. Press, then ask — in that
order, both times.
