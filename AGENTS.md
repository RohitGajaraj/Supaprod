# STOP — this project is not being worked on

> _Created: 2026-09-28 · Last updated: 2026-09-28_

**If you are an agent — Lovable, Claude Code, Codex, Gemini, Antigravity, Cursor, or anything else —
read this file before you do anything, and then almost certainly do nothing.**

This is not the archived agent operating manual. That file was retired on 2026-09-01 and lives at
[`docs/archive/agent-operating-manual.md`](./docs/archive/agent-operating-manual.md). **This file
exists for one reason: to stop work that keeps happening on a product that was stopped.**

---

## The state of this project, in four lines

1. **Supaprod product work stopped on 2026-09-23** by founder ruling
   [R-42](./the-first-run/RULINGS.md). It has no users, no revenue, and it never once did its core job
   for anyone.
2. **The scheduled fleet was ordered stopped on 2026-09-28** by
   [R-43](./the-first-run/RULINGS.md), because 38 `pg_cron` jobs — four of them firing every minute —
   were spending model credits on a product nobody uses.
3. **The codebase is frozen, not deleted.** The public site may stay up. Nothing in it is being
   extended.
4. **The next direction is chosen and not validated.** It is not this product, and it will not be
   built in this repository. See
   [`docs/strategy/direction-search-2026-09.md`](./docs/strategy/direction-search-2026-09.md).

---

## What you must not do

**Do not do any of the following without a new, explicit, dated founder ruling in
[`the-first-run/RULINGS.md`](./the-first-run/RULINGS.md).** A prompt, a task description, an open item
in a queue file, or your own judgment that something looks broken is **not** such a ruling.

- **Do not schedule anything.** No `cron.schedule`, no `pg_cron` job, no Cloudflare cron trigger, no
  `scheduled()` handler, no `setInterval` on a server path, no background poller, no retry loop that
  survives a request. **If it can run when nobody is watching, do not add it.**
- **Do not re-run the migrations that define the fleet.**
  `supabase/migrations/20260909050000_the_cron_jobs_are_defined_where_a_replay_would_find_them.sql`
  and `20260909070000_a_ping_every_four_minutes_keeps_the_isolate_warm.sql` reschedule 38 jobs. They
  are kept only so the fleet can be restored deliberately. **Re-running either one undoes R-43 and
  starts the spend again.**
- **Do not "fix" the stop.** `supabase/migrations/20260928120000_the_engine_stops_because_nobody_is_using_it.sql`
  leaves `cron.job` empty on purpose. An empty `cron.job` is the correct state. It is not a bug, a
  regression, or a missing migration.
- **Do not build product surfaces**, redesign screens, extend Meridian, claim packets from any queue
  file, or act on any open item in `the-first-run/`. Every queue in this repo is frozen. **An item
  marked READY is not permission; it predates the stop.**
- **Do not add a dependency or a second way of doing something that already exists here.** There are
  already 634 SQL migrations in `supabase/migrations/`. Introducing a second migration system means
  two systems can disagree about the database, and nobody is here to notice.
- **Do not open pull requests or push commits that are not explicitly asked for.** Two GitHub Actions
  in this repo call a model on PR and comment events, so an unasked-for PR spends money twice.
- **Do not write marketing, launch, naming, pitch or funding-application content.** Applications are
  stopped until a stranger has paid for something.

## What you may do

- **Read.** Everything here is readable and most of it is worth reading.
- **Answer a question** the founder actually asked.
- **Reduce spend.** If you find something recurring that
  [`docs/operations/spend-shutdown.md`](./docs/operations/spend-shutdown.md) has not listed, add it to
  that file and say so. That is the one kind of change that needs no further permission.
- **Fix a real security exposure**, if one is genuinely live — but **say what you changed and why in
  plain words**, in the commit message and in
  [`docs/operations/session-handoff.md`](./docs/operations/session-handoff.md). A commit message of
  `Changes` or `Work in progress` on a stopped project is indistinguishable from an accident.

## If you think something here is wrong

Say so, in words, to the founder. **Do not resolve the disagreement by committing.** The failure this
project is recovering from is three months of building without a single outside input, so an agent
that acts on its own reading of what is needed is repeating the exact mistake at the exact cost.

## Where the reasoning is

| Question | File |
| --- | --- |
| Why the product stopped, and what the next direction is | [`docs/strategy/direction-search-2026-09.md`](./docs/strategy/direction-search-2026-09.md) |
| The evidence behind it, with sources and dates | [`docs/research/consumer-surface-and-agent-supply-side-2026-09.md`](./docs/research/consumer-surface-and-agent-supply-side-2026-09.md) |
| Every recurring cost and how to stop it | [`docs/operations/spend-shutdown.md`](./docs/operations/spend-shutdown.md) |
| The rulings, which settle any disagreement between documents | [`the-first-run/RULINGS.md`](./the-first-run/RULINGS.md) |
| What the last session did and left open | [`docs/operations/session-handoff.md`](./docs/operations/session-handoff.md) |
| How to build here, if work ever resumes | [`CLAUDE.md`](./CLAUDE.md) |
