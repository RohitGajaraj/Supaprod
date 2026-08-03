# Planning archive

> _Created: 2026-08-03 · Last updated: 2026-08-03_

**Everything here is history.** It is kept so decisions can be traced and research is not paid for twice. **Nothing here is a plan you can execute, a status you can trust, or a rule you must follow.**

For anything current:

| You want | Read |
| --- | --- |
| What is in flight and what is next | [`../SOURCE-OF-TRUTH.md`](../SOURCE-OF-TRUTH.md) §0 |
| Per-feature status | [`../feature-dashboard.md`](../feature-dashboard.md) |
| Open bugs and blockers | [`../known-issues.md`](../known-issues.md) |
| Cross-cutting gaps | [`cross-cutting-gaps.md`](../cross-cutting-gaps.md) |
| The design contract | [`../../design/DESIGN-SYSTEM.md`](../../design/DESIGN-SYSTEM.md) |
| The rules | [`../../../AGENTS.md`](../../../AGENTS.md) |

## What is in here

| Folder or file | What it holds |
| --- | --- |
| [`build-log.md`](./build-log.md) | The dated record of what was built and why, from 2026-06-03. Was `plan.md` at the repo root; 1.3 MB. Search it for *why* something is the way it is. |
| [`reports/`](./reports/README.md) | 30 session reports and audits that sat loose at the top of `docs/planning/`. Every one was an orphan that nothing linked to. |
| [`retired-design-eras/`](./retired-design-eras/README.md) | Sixty files of planning for three design systems that no longer exist: the Obsidian port, Loom v4, and the front-end reimagining. |
| [`rebuild-2026-07-18/`](./rebuild-2026-07-18/README.md) | The 2026-07-18 rebuild phase docs and the July waves, superseded by the 2026-07-28 rebuild-from-zero. |
| [`feature-backlog.md`](./feature-backlog.md) | The old per-feature acceptance-criteria register (F-IDs). |
| Loose files | Earlier audits, parallel-lane reports, and strategic task lists from the overnight-build era. |

## Why this archive is large, and why that is fine

This project ships with a swarm of agents, and agents write. Every session that finished a piece of work also wrote up what it had checked. That is genuinely useful evidence, and it is also how a `docs/planning/` folder reaches 180 files and 12.5 MB, at which point an agent told to "read the planning docs" burns a large amount of context to arrive at a picture that is weeks out of date.

**The fix is not to stop writing, it is to keep the live surface small.** Live docs stay at `docs/planning/` top level, and the moment something becomes a record of what happened rather than a plan for what is next, it moves in here with a line saying why. Twenty live files an agent can hold; a hundred and eighty it cannot.
