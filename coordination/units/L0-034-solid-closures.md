# UNIT L0-034: solid pending closures

**Lane:** LANE 0
**Completed:** 2026-08-25T01:05+05:30
**Commits:** c8526488a (two silent-dead paths), 0644ba25b (carried-nothing fields)

## What this unit was

Founder: leave the editor as it stands, close anything solid pending,
keep everything pushed.

1. STEWARD-TICK'S CHECK 1 NEVER FIRED. It queried decisions.status =
   "active" - a value the vocabulary (pending/approved/rejected) has never
   contained - so the stale-decision nudge silently matched nothing for
   its whole life. Now queries "pending". Found by the Decide census's
   dead-code sweep; the fix is one word plus the comment saying why.
2. TRACK DOOR REPAIRED. /track/$trackId arrived red (Row/Field composed
   with children; neither takes children). Repointed to lead/sub.
3. FOUR CARRIED-NOTHING FIELDS TRIMMED: coverage's unread unclustered
   count, run detail's never-fetched model and unread step_index, both
   changeset reads' base_sha (readers live in the revert paths' own
   queries).
4. A stray agent stash ("superseded: duplicates startTrack", its own
   note) was popped by mistake during a verification; its three /api/
   tracks files resolved as deletions per that note and the stash was
   dropped. LANE 1's own two WIP stashes untouched.

## Handed forward

- The eleven nav-model failures on main are the other lane's in-flight
  /track restructure (thirteen destinations against their own twelve-
  test) - present on the clean tree, not ours to fix mid-flight.
- Forecast history visibility (reopen door + per-decision trail) filed
  rather than half-built: the desk already mounts agent-settled; the
  missing half is behavior-heavy. Belongs in a Decide/Learn route pass.
- Editor outcome: founder reviewed, not satisfied, left as-is for now.
  The five named defects are fixed; the deeper dissatisfaction is a
  design question for a fresh pass, not a bug list.
