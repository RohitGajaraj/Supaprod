# Running two lanes overnight

> _Created: 2026-08-23 · Last updated: 2026-08-23_

**The procedure for running a building lane and a verifying lane at the same time.** The
live channel is [`../../coordination/`](../../coordination/README.md); this page explains
why it is shaped that way, so a future session can change it without relearning the
failures it was built around.

---

## The shape

Two sessions, one repository, communicating only through git.

| Lane | Runs on | Owns | Cannot |
| --- | --- | --- | --- |
| **LANE 1** | opencode / OX Alpha | Building surfaces, components, design-system adoption | Database, deploys, Mobbin |
| **MAIN LANE** | Claude Code | Verification, live database, deploys, Mobbin MCP, rulings | Build on files LANE 1 holds |

Paste-ready prompts live at [`../../coordination/LANE-1-PROMPT.md`](../../coordination/LANE-1-PROMPT.md)
and [`../../coordination/MAIN-LANE-PROMPT.md`](../../coordination/MAIN-LANE-PROMPT.md).

## Why one file per message

Every message is its own file and every directory has exactly one writer. That is the
whole design, and it exists because of a measured failure: three sessions closed within
ten minutes on 2026-08-22 and each silently overwrote the others' handoff, because all
three edited one shared file. One file per message cannot collide, so `git pull --rebase`
always merges cleanly and no message can be lost.

The same rule is why MAIN LANE never edits product code LANE 1 is holding. On 2026-08-22 a
commit staged by filename swept up another lane's half-finished deletion and broke `main`.

## Why LANE 1 must not block

An overnight lane that waits on an answer wastes the night. It files a request, parks that
item, and continues. It picks answers up at the start of the next unit. A request
unanswered for an hour is MAIN LANE's failure to fix, not a reason for LANE 1 to stop.

## Why MAIN LANE verifies rather than trusts

Not because LANE 1 is unreliable, but because everyone is. On 2026-08-22, five briefs
written by the main session were factually wrong and every lane that checked caught one.
The verification that matters is: the whole suite on the merged tree, the ratchet moving
DOWN, every quoted number re-measured, and a grep for fabricated data. A mount is not a
render.

## The metric for the run

`src/__tests__/meridian-ratchet.baseline.json` — **3,170 occurrences across 222 files** at
the start of 2026-08-23. It may only ever go down. When it drops, the baseline is ratcheted
down with it in the same commit; a gain that is not locked in is a gain that gets lost.
