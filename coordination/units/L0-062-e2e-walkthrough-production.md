# UNIT L0-062 — R-11 end-to-end pass, production: the watchable half is true; the engine still stops at Discover

**Lane:** LANE 0 · **R-18/R-11 end-to-end walkthrough** · **Date:** 2026-08-25
**Account:** voyage@ (burnable per RL0-022b) · **Against:** production deploy
· **No dev server started.**

## The walk, exactly as a person would do it

1. Signed in → opened `/start`. The page asked one question and showed open
   work with honest hold sentences on every card.
2. Typed ONE sentence — "Add a high-contrast mode to the installer checklist
   screen so field crews can read it in direct sunlight." — pressed Enter.
3. Landed on `/track/691351ee-70bf-498e-b462-ad3825675756` with no second
   question. Pressed "Run it now" once (see Deployment note below).
4. The walk ran its window and stopped; the surface said why in the driver's
   words ("This run of the loop ran long…"), offered release + rerun, and the
   pane said "Discover ran and filed no signal" beside the hold sentence.

## What is TRUE already (each seen on screen, screenshots saved)

- One sentence starts a run and lands you on it (criterion 4).
- The run says where it is, what it filed, why it stopped — in place, without
  navigation (criterion 3's visibility pieces).
- A hold renders the driver's words with the right tone and the right control,
  and never continues past a hold automatically.

## What is FALSE, and the two causes

**The route did not leave Discover.** Two independent legs each ended
`out-of-time`: the research seat consumes its whole 50-second window and files
nothing, so the track re-holds. This reproduces EVIDENCE §2's measured loop
with today's numbers.

1. **Engine (MAIN):** Discover cannot finish inside one foreground window on
   this workspace — window length vs the scout's step appetite is MAIN's
   dial (`FOREGROUND_WINDOW_MS` / seat budget / scout brief). No surface work
   changes this; the acceptance dies here until it is tuned.
2. **Deploy (MAIN):** production predates L0-050/052 — the composer did not
   pass `?start=true` (no auto-fire), no automatic legs chained, no Copy
   control. LANE 1 verified those behaviours on its dev server (unit 069);
   they are not live.

## Evidence

Screenshot: `e2e-discover-hold-out-of-time.png` (viewport: hold region, pane
sentence, transcript status). Track id: `691351ee-70bf-498e-b462-ad3825675756`
(voyage@ workspace). Query for MAIN:

```sql
SELECT station, status, last_hold, attempts, driven_at
FROM spine_tracks WHERE id = '691351ee-70bf-498e-b462-ad3825675756';
```

## Ask

MAIN: deploy current main (items 24/28/34 UI go live), then tune ONE of
window/seat-budget/scout-brief so Discover completes inside a foreground leg.
The moment both land, I re-run this exact walkthrough — the same sentence, one
press, no touch — and record the result in the experiment file's next round.
