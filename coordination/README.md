# The two-lane protocol

Two sessions run at once and talk **only through git**. This directory is the channel.

| Lane | Runs | Owns | Cannot |
| --- | --- | --- | --- |
| **LANE 1** | opencode / OX Alpha, overnight | Building: surfaces, components, Meridian adoption | Reach the database, deploy, or call Mobbin |
| **MAIN LANE** | Claude Code | Verification, live database, deploys, Mobbin MCP, approvals | Build in parallel on the same files |

Prompts to paste: [`LANE-1-PROMPT.md`](./LANE-1-PROMPT.md) · [`MAIN-LANE-PROMPT.md`](./MAIN-LANE-PROMPT.md)

---

---

## FIRST PRINCIPLE: git IS the channel. Unpushed work does not exist.

There is no shared memory between these two sessions. No message bus, no filesystem either
can see, no way to shout across. **The other lane learns nothing until it is committed and
pushed, and you learn nothing until you pull.**

Which means the git cycle is not housekeeping at the end of a task. It *is* the
communication mechanism, and it has to run constantly:

```
git pull --rebase origin main     # before you start anything, and before every write
   ... do one unit of work ...
git add <the files you touched, by name>
git commit -F <message file>
git pull --rebase origin main     # again: the other lane may have pushed while you worked
git push origin main
```

**Rules that follow from this, and they are not negotiable:**

- **Push after every unit.** Never batch a night's work into one commit. An overnight
  session that dies with six hours unpushed has produced nothing, and unpushed work looks
  identical to work that was never done.
- **Pull before every unit, and again before every push.** The other lane has been writing
  the whole time you were working. A rebase that runs late is a conflict; one that runs
  early is a no-op.
- **Never `git add -A`.** Stage by name. Sweeping the tree picks up the other lane's
  half-finished edits — that is exactly how `main` broke here on 2026-08-22.
- **Never `git checkout --`** on anything. It has destroyed uncommitted work in this repo.
- Commit messages go in a file (`git commit -F`), never `-m`: zsh evaluates backticks in
  `-m` and silently deletes words.
- If a rebase conflicts inside `coordination/`, something has gone wrong with file
  ownership — two writers touched one file. Fix the ownership, not just the conflict.

**A message is only as fresh as your last pull.** If you have been heads-down for an hour,
you are an hour behind on answers, refutations and rulings. Pull first.

---

## The one rule that makes this work: every file has exactly one writer

```
coordination/
  requests/   LANE 1 writes.      MAIN LANE only reads.
  answers/    MAIN LANE writes.   LANE 1 only reads.
  units/      LANE 1 writes.      MAIN LANE only reads.
  STATUS.md   MAIN LANE writes.   LANE 1 only reads.
```

**Never a shared file, never an append to the other lane's file.** This is not fussiness.
Three sessions once closed within ten minutes on this repo and each silently overwrote the
others' handoff, because they all edited one file. One file per message cannot collide, so
`git pull --rebase` always merges cleanly and no message is ever lost.

## Filenames

- Request: `coordination/requests/<NNN>-<slug>.md` — `NNN` is a zero-padded counter,
  monotonically increasing. Never reuse a number.
- Answer: `coordination/answers/<NNN>-<slug>.md` — **same NNN and slug** as the request it
  answers. That is the whole linkage; there is no index to keep in sync.
- Unit: `coordination/units/<NNN>-<slug>.md`, its own counter.

## Request format

```markdown
# REQ-<NNN>: <one line, what you need>

**Kind:** db-fact | design-reference | meridian-gap | deploy | live-verify | approval
**Blocking:** no        <!-- "no" means you parked it and moved on. Prefer no. -->
**Raised:** <ISO timestamp>

## What I need
<Be specific enough to answer without a conversation. If you need a count, give the exact
query you would run. If you need a design reference, say what the surface has to do.>

## Why I cannot answer it myself
<One line.>

## What I assumed in the meantime
<If you proceeded on an assumption, state it. This is what MAIN LANE checks first, because
a wrong assumption already in the tree is worse than an unanswered question.>
```

## Answer format

```markdown
# ANS-<NNN>: <same title>

**Verdict:** confirmed | refuted | partial | approved | rejected
**Answered:** <ISO timestamp>

## The answer
<The fact, the reference, the ruling. If it is a measurement, INCLUDE THE QUERY. A number
without its query is not evidence and cannot be re-checked.>

## What this changes
<Explicitly: does LANE 1 need to undo something it already built on an assumption?>
```

## The loop

**LANE 1**, at the start of every unit:
1. `git pull --rebase origin main`
2. Read every file in `answers/` newer than your last check. Act on refutations FIRST — a
   refuted assumption may already be in the tree.
3. Do the unit. Gates. Commit. Write `units/<NNN>`. Push.

**MAIN LANE**, on a loop:
1. `git pull --rebase origin main`
2. Answer every unanswered `requests/`, oldest first. Prioritise `Blocking: yes`.
3. Verify the newest `units/` against the live database and the merged tree — **the whole
   suite, not the file that changed**.
4. Update `STATUS.md`. Commit. Push.

## Escalation

If LANE 1 raises the **same** request twice, or a request sits unanswered for more than an
hour of wall clock, MAIN LANE has stalled. LANE 1 should record that in its next unit file
and keep working; it must never stop the night waiting on a lane that is not answering.

## What MAIN LANE must never do

Edit a file LANE 1 is working on. Two writers on one file is how `main` broke on
2026-08-22: a commit staged by filename swept up a lane's half-finished deletion. MAIN LANE
verifies, answers and rules. If it must change product code, it does so only after LANE 1
has pushed and gone quiet, and it says so in `STATUS.md`.
