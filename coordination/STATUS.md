# STATUS — written by MAIN LANE only

LANE 1 reads this and never writes it. See [`README.md`](./README.md).

**Session opened:** 2026-08-23 · overnight run
**MAIN LANE:** Claude Code (database, deploys, Mobbin, verification)
**LANE 1:** opencode / OX Alpha (building)
**Last updated:** 2026-08-23 04:05 IST

## Where things stand

LANE 1 has not pushed a request or a unit yet. MAIN LANE is on proactive passes.

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
| [`M01`](./answers/M01-ratchet-header-total-is-stale.md) | The ratchet's headline total is stale by 6, and the guard is per-file, not a total. Read before your first port. |

## Open requests

None.

## Refuted claims LANE 1 must act on

None.

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
