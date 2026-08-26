# REQUEST · lineage payload for board objects (queue item 2)

**Filed by:** S2 · 2026-08-26 · per QUEUE-S2.md item 2: *"The lineage read is S0's — name exactly which edges you need on which object."* You answer within the unit; I build against this shape.

## §0.5's sentence, made concrete for MY surfaces

> "Every object shows, in place: what produced it, and what it feeds."

The board's objects are **runs (missions), their rows on Today and /runs, and the learning block**. Measured today, the payloads these rows already read carry almost none of the graph:

| Edge I need | Where it lives (verified) | Consumer |
| --- | --- | --- |
| `from_decision: {id, title} \| null` per mission | `decisions.mission_id` exists (`decisions` seed rows carry both columns); nothing reads it per-mission | One plain line under a run row: "From your call 'X'", clickable to the decision |
| `from_spec: {id, title} \| null` per mission | Spec-dispatched missions link through the prd→mission edge (see `missions.functions.ts:208-229` product-linkage query); not returned in any LIST payload | Line: "From the spec 'X'" |
| `feeds_pr: {url, title} \| null` per mission | `studio_changesets.prd_url/pr_number` by `mission_id` | Line on finished rows: "Opened 'title'" |
| `feeds_learning: {id, verdict, summary} \| null` per mission | `learnings.mission_id` exists in schema; `LearningRow.mission_id` is typed optional but **`listLearnings` does not select it** (outcome.functions.ts:2084 selects without it) | Finished row learns its verdict landed; learning block gains "from the run 'X'" |

## What each is for (data minimalism: consumer named)

Each field renders ONE plain sentence in a place that already exists — the run row's note slot (same slot `HandoverNote` uses) and the learning block's "About …" line. Absent edge ⇒ no line, never an empty row. No new destination, no new route, no new read beyond columns on reads that already run.

## Smallest shape that serves it

Either widen `listMissions`' existing queries (it already joins runs + mission_steps; four more scoped lookups keyed by the mission ids in hand), or a single `getLineageForMissions({ids})`. Your call on cost; the type I build against:

```ts
type MissionLineage = {
  missionId: string;
  from_decision: { id: string; title: string } | null;
  from_spec: { id: string; title: string } | null;
  feeds_pr: { url: string; title: string | null } | null;
  feeds_learning: { id: string; verdict: string } | null;
};
```

Plus one word from you: add `mission_id` to `listLearnings`' select (one column, back-compatible).

## Meanwhile

Nothing invented to fill gaps: until this lands, rows simply draw fewer lines, which is honest. TrackChain (CHECKED FIRST, as ordered): it serves ONE track's station artifacts inside the run — the right tool for S1's transcript, not for the board's cross-object lines; reused where a run row links through to its track (`MissionListRow.trackId` already carried).
