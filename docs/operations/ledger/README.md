# The shared ledger

> _Created: 2026-08-19 · Last updated: 2026-08-19_

**Two coding agents build this repo at once and this folder is how they talk.** Git is the transport; these files are the protocol.

The work list is [`../kiro-queue.md`](../kiro-queue.md). **This folder is not the work list — it is the record of what happened to it.**

---

## The one rule that makes it work

**Every file here has exactly one writer.**

| File | Written by | Read by |
| --- | --- | --- |
| [`kiro-log.md`](./kiro-log.md) | **Kiro only** | Claude, and the founder |
| [`claude-log.md`](./claude-log.md) | **Claude only** | Kiro, and the founder |

**A file with one writer cannot conflict.** Both agents append to their own file and read the other's, so git merges the two without ever asking a person to resolve anything. That is the entire design, and it is why status does **not** live in the queue file where both would have to edit it.

**Append only. Never edit or delete a past entry, including your own.** A correction is a new entry that names the one it corrects. The log is a record of what was believed at the time, and rewriting it destroys the only evidence of how a wrong call was made.

---

## An item's status is derived, not stored

There is no status field to fight over. **The current state of any item is whatever the most recent entry mentioning it says**, across both logs.

> **"Most recent" means further down the file, not the later timestamp.** The
> timestamps in these headings are written by the agents, not measured, and they
> have already drifted badly: checked against commit times on 2026-08-20, Kiro's
> stamps were accurate for five entries and then ran monotonically fast, ending
> **+247 minutes ahead**, with one entry stamped for a time that had not yet
> happened. Because those stamps now sort after every verdict in `claude-log.md`,
> **ordering the two logs by timestamp reports verified items as unverified** —
> which happened, to five items at once, at 06:00 that morning.
>
> Both files are append-only with a single writer, so **position in the file is
> the reliable order**, and `git log` is the reliable clock. Better still, ask
> the question without a clock at all: an item is waiting on a verdict when it
> has been built more times than it has been judged. That is what
> `scripts/lane-sync.sh` counts, and it is why that script gave the right answer
> in the same minute a timestamp-ordered read gave the wrong one.

```
  K-04 STARTED   (kiro-log)     → in progress
  K-04 BUILT     (kiro-log)     → waiting on verification
  K-04 VERIFIED  (claude-log)   → done
  K-04 REJECTED  (claude-log)   → back in the queue, reason in the entry
```

To find what is open: read the tail of both logs. To find one item's history: grep its id across both.

---

## Entry format

Both logs use the same shape. **The id and the verb are the first line**, so a grep for `K-04` returns something readable.

```markdown
## K-04 · BUILT · 2026-08-20 14:22

**Did.** Two or three sentences on what actually changed.

**Unsure.** Anything guessed at, and any decision that could reasonably have gone
the other way. This is the most valuable field, because it aims the verification.

**Noticed.** Anything true that is not in the item. A nearby defect, a stale
comment, a count that did not match, a file that surprised you.

**Gates.** tsc clean · 9,412 pass · build ok
```

**Verbs Kiro may write:** `STARTED` · `BUILT` · `BLOCKED` · `QUESTION`
**Verbs Claude may write:** `VERIFIED` · `REJECTED` · `RULED` · `LANDED`

`QUESTION` and `RULED` are the conversation: Kiro asks in its log, Claude answers in its own, both naming the item.

---

## The handoff

**Kiro** works on `main`. When an item's three gates are green it commits and **pushes to `main`**, with its `BUILT` entry in the same commit as the code. The entry and the change must never be separated, or the log describes work that is not there.

**Claude** works in a worktree on its own lane. It pulls `main`, verifies against **production and the running app** rather than against the diff, and pushes its verdict.

**A `REJECTED` item goes back to the queue** and Kiro picks it up again from the reason in the entry.

---

## What each agent can actually do

The split is **access, not seniority**, and it moved on 2026-08-19: **Kiro can write documentation and can search the web.** What it cannot reach is the database, the MCP servers, and the live app.

| | Kiro | Claude |
| --- | --- | --- |
| Write code, run `tsc` / `test` / `build` | yes | yes |
| **Write documentation** | **yes** | yes |
| **Search the web, research a reference product** | **yes** | yes |
| Query the database | **no** | yes |
| MCP servers and tool access | **no** | yes |
| Verify against production | **no** | yes |
| Apply a migration | **no** | yes |

**So anything provable from the repo, the web, or a local test run is Kiro's.** Anything whose truth lives in the database is Claude's. That is the whole line, and it is why a green test suite is where Kiro's confidence ends and Claude's work starts.
