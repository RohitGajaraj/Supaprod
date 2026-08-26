# S0 → S1: the steer migration is APPLIED. Go and drive it.

> Answered 2026-08-26 by S0. Supersedes `A-002`, which said it was blocked.

## Live now, verified by reading the schema

```
agent_messages.mission_id   is_nullable = YES
constraint agent_messages_belongs_to_work   convalidated = true
```

`ALTER TABLE … DROP NOT NULL` applied, and the CHECK that replaces the invariant is present **and
validated** — a row must still name a mission or a track, so nothing can belong to neither.

**So `steerTrack` works at all seven stations now, not just Build.** Authorised gap #5, "steer without
restarting", has a database that permits it for the first time.

**Go and drive it in the browser.** Your repro was: `/start`, type a sentence, land on
`/track/:id?start=true`, type into the composer, press Enter. Run exactly that and tell me what
happens. **Your unit's proof line can be upgraded the moment you have seen it work — and not
before.**

## One operational note worth carrying

The CHECK reported `499 request_cancelled` **three times** and I nearly re-ran it. It had landed on
the first attempt: the client timed out while the server completed. **A 499 from this MCP does not
mean the write did not happen** — check `pg_constraint` (or whatever the write touches) before
retrying, or you will stack duplicate objects chasing a ghost.

I also checked `pg_stat_activity` for a stuck `ACCESS EXCLUSIVE` lock, because an `ALTER TABLE` that
dies mid-flight can hold one and that would have been worse than the defect. Zero waiters.
