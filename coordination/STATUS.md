# STATUS — written by MAIN LANE only

LANE 1 reads this and never writes it. See [`README.md`](./README.md).

**Session opened:** 2026-08-23 · overnight run
**MAIN LANE:** Claude Code (database, deploys, Mobbin, verification)
**LANE 1:** opencode / OX Alpha (building)
**Last updated:** 2026-08-23 04:45 IST

## Where things stand

**LANE 1 has still pushed nothing** as of 04:45, roughly an hour after the run opened.
`requests/` and `units/` hold only their `.gitkeep`. That is either a lane that has not been
started or one that is heads-down before its first commit. Either is fine; the protocol says
MAIN LANE never idles waiting, so this session has been on proactive passes throughout and
will keep going.

Three findings are filed and none of them needs LANE 1 to undo anything, because there is
nothing built yet. Two of them change what it should build.

**Instruments checked and working**, so none of these is a surprise at 3am:

| Instrument | State |
| --- | --- |
| Lovable database MCP | live. `spine_tracks` returns 59 rows. Two transient `499 request_cancelled` on first call, then fine. Retry once before believing it is down. |
| Lovable project + deploy | project `371dd588` is `ready`, published at `supaprod.lovable.app`, `latest_commit_sha` = `2d6ed9b89` = local `main`. In sync. |
| Mobbin MCP | authenticated, returning screens. |
| `git` through the RTK hook | **piped `git` output is unreliable here.** `git show <sha>:<path> \| python3` returned empty; the same command redirected to a file returned all 24,745 bytes. Redirect to a file, then read the file. |

## Answer files with no request: the `M<NN>` range

Proactive findings are written as `answers/M<NN>-<slug>.md`. They answer no request, so they
are kept out of the `<NNN>` range and can never collide with the answer to a request LANE 1
files. Read them like any other answer.

| File | What it says |
| --- | --- |
| [`M01`](./answers/M01-ratchet-header-total-is-stale.md) | The ratchet's headline total is stale by 6, and the guard is per-file, not a total. **Read before your first port.** |
| [`M02`](./answers/M02-the-loop-is-alive-and-blocked-on-evidence.md) | The loop is alive but no real track has ever passed Decide. 63.6% of signals are agent-authored with no source link, and the critic is correctly rejecting them. **Do not build a surface that shows a signal count as evidence strength.** |
| [`M03`](./answers/M03-migrations-verified-and-two-dead-artifacts.md) | All seven unrecorded migrations verified applied. Two artifacts describe themselves wrongly: the sink's restatement comment and `agent_runs.attempt`. **Trust the live database over any comment or count.** |

## Open requests

None.

## Refuted claims LANE 1 must act on

None. LANE 1 has claimed nothing yet.

**Two claims MAIN LANE refuted against itself**, recorded so neither gets raised again:

- *"The `design` station has been starved for 34 hours."* False. All six tracks there are in
  sample workspaces and are excluded from the tick on purpose. Real open work is five tracks,
  all driven within the last 45 minutes.
- *"The de-duplication fold is broken, 656 duplicate signals."* False. 654 of the 656 predate
  the fold landing at 2026-08-22 16:42Z, and the five hours since show zero new duplicates.
  The fold works in production. The historical rows remain and still inflate cited counts.

## For MAIN LANE to fix once LANE 1 has pushed and gone quiet

Product code, so it waits on the protocol rather than racing LANE 1 for the file:

- `src/lib/sources/sink.server.ts:275` claims `restated_count` does not exist and the counter
  is inert. Both are false now; the column, the RPC and seven non-zero counts are live.
- `agent_runs.attempt` is set on 6 rows of 2,225 and nothing has written it in two days.
  Either it gets a writer or it should stop being offered to readers.
- 654 historical duplicate signal rows still inflate the counts agents cite. Folding them is
  irreversible, so it is a founder call, not mine.

## Gates, last run by MAIN LANE on the merged tree

At `2d6ed9b89`, each gate its own command, nothing piped.

| Gate | Result | When |
| --- | --- | --- |
| `bunx tsc --noEmit` | exit 0 | 2026-08-23 03:55 |
| `bun test` | 10,626 pass / 0 fail · 10,709 across 627 files · exit 0 | 2026-08-23 03:57 |
| `bun run docs:check` | exit 0 | 2026-08-23 04:05 |
| Meridian ratchet | **3,170** occurrences / 222 files | 2026-08-23 03:58 |

**The ratchet is the headline metric for this run, and it must only ever go down.** Two
corrections to how it was stated when this file was opened, both detailed in
[`M01`](./answers/M01-ratchet-header-total-is-stale.md):

- **The number is 3,170, not 3,176.** The baseline's own `totalOccurrences` header says
  3,176 and disagrees with its own `files` block, which sums to 3,170. The header was left
  behind by a hand-edit in `f07d39c33`. The guard is unaffected and the header self-corrects
  the first time anyone runs `bun run design:ratchet`.
- **The guard is per-file and per-marker, not a total.** Debt cannot be traded between
  files: a change that drops 40 in one file and adds 3 in another fails, even though the
  total fell. And *reducing* debt turns the suite red on purpose until the baseline is
  re-frozen with `bun run design:ratchet` in the same commit as the port.
