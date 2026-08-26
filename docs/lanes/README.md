# docs/lanes/ — git-only coordination for five parallel sessions

> _Last updated: 2026-08-26_

> **Git is the only channel** (founder's ruling, 2026-08-26): *"this communication needs to be
> established only through GIT, because that is the only common channel for all of you."* The design
> that makes it work is **one writer per path** — no two sessions ever write the same file, so there
> is never a merge, never a lock and never a lost write. A file three sessions write is a file three
> sessions lose, and that has already happened here.
>
> Full protocol: [`OPERATING-MODEL-5-SESSIONS.md`](../../the-first-run/OPERATING-MODEL-5-SESSIONS.md) §4 and §8.

## See the whole fleet in one command

```bash
git fetch origin && git rebase origin/main
cat docs/lanes/NOW-*.md          # what every session is on, right now — one line each
cat docs/lanes/log/*.md | sort   # the merged unit history
```

**If another session's NOW line names what you were about to start, do not start it.** Take the next
item and say why in your own line. That is the entire purpose of the file.

## Who writes what

| Path | Writer | What it is |
| --- | --- | --- |
| [`NOW-S0.md`](./NOW-S0.md) · [`NOW-S1.md`](./NOW-S1.md) · [`NOW-S2.md`](./NOW-S2.md) · [`NOW-S3.md`](./NOW-S3.md) · [`NOW-S4.md`](./NOW-S4.md) | that session only | **One line**, rewritten every unit: `<session> · <time> · WORKING\|BLOCKED\|DONE\|DEVSERVER · what · paths held · last commit` |
| [`log/S0.md`](./log/S0.md) · [`log/S1.md`](./log/S1.md) · [`log/S2.md`](./log/S2.md) · [`log/S3.md`](./log/S3.md) · [`log/S4.md`](./log/S4.md) | that session only | Append-only unit history, one block per unit |
| [`QUEUE-S1.md`](./QUEUE-S1.md) · [`QUEUE-S2.md`](./QUEUE-S2.md) · [`QUEUE-S3.md`](./QUEUE-S3.md) · [`QUEUE-S4.md`](./QUEUE-S4.md) | **S0 only** | The next items, fully specified. That session reads, never writes |
| [`verify/`](./verify/) | **S4 only** | Verdicts. S4 writes no product code and cannot fix what it finds |
| [`BUILDLOG.md`](./BUILDLOG.md) | **S0 only** | The rolled-up narrative. No lane writes it any more |
| [`INBOX-MAIN.md`](./INBOX-MAIN.md) | lanes | Older ask channel; the current one is `coordination/requests/<S>/` |
| [`CLAIMS.md`](./CLAIMS.md) | lanes | File claims from the three-lane era |

**Asks go to `coordination/requests/<S>/`** and S0 answers in `coordination/answers/<S>/` within one
unit. Lanes have no database, no MCP and no deploy: every count, row, migration and deploy is a
question to S0. **A blocked lane is S0's failure, not the lane's.**

## S4's verdicts — read these before trusting a buildlog

**S4 is the adversary and its verdict outranks the builder's.** A unit S4 cannot reproduce is
reopened, whatever the buildlog says.

| Verdict | What it settles |
| --- | --- |
| [`S4-001-f76.md`](./verify/S4-001-f76.md) | F-76, the self-verifying spine, verified adversarially against S0's own claim |
| [`S4-002-sixty-seconds.md`](./verify/S4-002-sixty-seconds.md) | The stranger's path at 10s, 30s and 60s — the founder's second acceptance |
| [`S4-003-connector-counts.md`](./verify/S4-003-connector-counts.md) | The connector wiring number, and how fast it went stale |
| [`S4-004-e2e-evidence-audit.md`](./verify/S4-004-e2e-evidence-audit.md) | What `e2e/**` actually proves, and the unguarded track factory it found |
| [`S4-005-theatre-sweep.md`](./verify/S4-005-theatre-sweep.md) | The hunt for state no row can prove — **the finding that ends a feature rather than fixing it** |
| [`S4-006-s1-run01-07.md`](./verify/S4-006-s1-run01-07.md) | S1's first seven units, checked against what they claim |
| [`S4-007-s2-and-f84-test.md`](./verify/S4-007-s2-and-f84-test.md) | S2's board work, and F-84's parked-work claim put under test |
| [`S4-008-run08-and-handoff-counts.md`](./verify/S4-008-run08-and-handoff-counts.md) | S1's RUN-08 and the handoff counts, checked |
| [`S4-009-run09-11-attribution.md`](./verify/S4-009-run09-11-attribution.md) | RUN-09 to 11, and whether attribution holds |
| [`S4-010-s3-verdict-email.md`](./verify/S4-010-s3-verdict-email.md) | S3's verdict email, and the held-back half confirmed intentional |
| [`S4-011-gap2-server-half.md`](./verify/S4-011-gap2-server-half.md) | Gap #2's server half — the verdict dispatch, checked against S0's own claim |
| [`S4-012-premerge-run12-13-c2-004.md`](./verify/S4-012-premerge-run12-13-c2-004.md) | RUN-12/13 and C2-004, checked before the merge |
| [`S4-013-queue72-tone-comment.md`](./verify/S4-013-queue72-tone-comment.md) | Queue 72's tone, checked |
| [`S4-014-f86-metric-probe.md`](./verify/S4-014-f86-metric-probe.md) | F-86's metric probe — whether the type really makes the lie unrepresentable |
| [`S4-015-run14-15.md`](./verify/S4-015-run14-15.md) | RUN-14 and 15, checked |
| [`S4-016-phase3-e2e-run.md`](./verify/S4-016-phase3-e2e-run.md) | The phase-3 e2e run, and what it wrote to production |

## Superseded

[`QUEUE-LANE0.md`](./QUEUE-LANE0.md) and [`QUEUE-LANE1.md`](./QUEUE-LANE1.md) are the **three-lane
era's** queues, kept for their unit history. The five-session split replaces them; take work from
`QUEUE-S<n>.md`.
