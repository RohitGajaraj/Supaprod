# S1 → S0: value audit metrics — four measures from spine_track_members timestamps

> Filed 2026-08-31 by S1, UNIT 7 (gap #17).

## The ask

**Four queries (or server functions) that measure how well a track executed against its plan.** S1 brief says "never invent a number; ask S0 for each" — so this is the ask.

Every measure in Anthropic's playbook is the gap between two committed artifact timestamps. All four are derivable from columns already in `spine_track_members`:

| Measure | Definition | Source |
| --- | --- | --- |
| **Time to first artifact** | Seconds from `spine_tracks.created_at` to first `spine_track_members` row (entry at `sense`) | `spine_tracks.created_at` + first member's timestamp |
| **Share reaching Ship at `attempts = 1`** | Fraction of tracks where `spine_track_members WHERE station='ship'` has count = 1 (first pass, no retry) | Count `station='ship' AND attempts=1` / total tracks |
| **Stations passing check without retry** | Fraction of `(track, station)` pairs where `studio.checks.run` fired once and passed | Join `studio_changesets` / `tool_calls` / success check |
| **Rework sum per track** | Total `attempts` across all stations, minus 7 (the base: one pass through seven stations) | `SUM(attempts) - 7` per track |

## What I measured first, because it argues for the queries

Measured live before filing:

- Total tracks **reaching Learn or beyond**: 0 (acceptance still returns 0)
- Tracks **reaching Ship**: 4
- Tracks **reaching exactly Ship and stopping** (implying Learn not yet graded): Unclear — need clause

**Of the 4 reaching Ship**, can you check `attempts` sum? If any == 7, that's first-pass. If any > 7, that's rework.

## Where to put the reader

**Not sure where this surface lives yet.** Three options:

1. **Per-track, in Learn station** — show "was this run worth it?" after grading
2. **Aggregate surface, new route** — show "how is the team doing?" — `/value-audit`
3. **Both** — track view + workspace dashboard

The phrasing in SESSION-1 brief suggests both make sense, but I want your read before I propose architecture.

## Why this is not blocking, and what I'll do meanwhile

Unit 6's missing dependency (handoff-payload reader) is still blocking. Unit 7 is independent; I can design the component surface while waiting for your answer, then wire it the moment the functions land.

## Suggested function signature (if not a raw query)

```ts
getTrackValueMetrics({ trackId, workspaceId? }): {
  timeToFirstArtifactMs: number;
  successOnFirstPass: boolean; // attempts === 7 across all stations
  stationsWithoutRetry: number; // count
  totalReworkAttempts: number; // sum(attempts) - 7
}
```

Or aggregate:

```ts
getWorkspaceValueMetrics({ workspaceId }) -> {
  avgTimeToFirstMs: number;
  shareReachingShipFirstPass: number; // 0..1
  avgStationsPassedWithoutRetry: number;
  avgReworkAttemptsPerTrack: number;
}
```
