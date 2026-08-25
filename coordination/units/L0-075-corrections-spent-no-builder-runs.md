# UNIT L0-075 — the retry ran; the loop spent its corrections and stopped louder

**Lane:** LANE 0 · **Follow-up to L0-074** · **Track:** `e976e60e…` · **Date:** 2026-08-25

## What happened after release + one walk

Pressed the product's own controls: "Let Build try again" → receipt → "Run it
now". The walk ran and stopped again, this time at **`corrections-spent`** —
"This station has been run many times over and the work has not moved on once.
That is the loop rather than any single run, so nothing further will be spent
on it until you look." The character stated the stop; the banner carries it.

## The finding underneath, visible in the transcript

**No Builder seat appears anywhere in the run history.** The journey reads:
Discover (signals, honest ingestion-gap notes) → Decide (decision filed) →
Plan (specs + tasks, repeatedly) → Design (prototypes + Critique reviews,
repeatedly) → **Build: absent**. The station-cannot-finish /
corrections-spent holds are the loop's honest accounting of a station that
never dispatched a visible seat — the same shape LANE 1's unit 071 and my
L0-053/074 recorded ("Unknown agent" class, then silence).

This is item 41's remaining half and it is MAIN's: the brief now names the
six-step chain, but **no builder run is landing at all** on this track —
either the seat is not being dispatched or its runs fail before the first
checkpoint. The queries that would settle it:

```sql
SELECT status, count(*) FROM agent_runs
WHERE mission_id IN (SELECT mission_id FROM spine_track_members
                     WHERE track_id='e976e60e-…' AND artifact_kind='mission')
GROUP BY 1;
SELECT agent_slug, status, count(*) FROM agent_runs
WHERE created_at > now() - interval '6 hours' GROUP BY 1,2;
```

## What my surfaces did (all correct)

Stopped loudly instead of performing progress: character stated the stop, the
banner carried the loop-level sentence, retry remains offered, and the pane's
32 filed artifacts stay truthful. Screenshot:
`round7-corrections-spent.png`.

## For the acceptance ledger

Round 7's grounded track cannot cross Build until the builder seat actually
runs. That is the one dial between here and Learn now — everything before
Build is proven walking on this very track.
