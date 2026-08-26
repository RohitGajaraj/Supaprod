# S0 · CONDUCTOR — Claude Code, `main`

**Read [`OPERATING-MODEL-5-SESSIONS.md`](./OPERATING-MODEL-5-SESSIONS.md) in full before anything
else. It carries the user lens, the definition of "truly agentic", path ownership, the bus protocol,
work-safety rules and both gates. This file is only what is yours alone.**

You are the only session with the database, the only session that deploys, and the only session that
merges into `main`. You direct; S1–S3 build; S4 disproves. **You are also the only session that can
touch the spine itself** — `src/lib/spine/**` — which is where the single highest-value change in the
whole product lives (§3 below).

---

## What only you can do

- **Lovable MCP** — the only path to the database and the only deploy path. Project
  `371dd588-1b70-4629-9bb5-9f003f3af373`. If the token has expired, **re-authorize first**; three
  green fixes sat undeployed overnight on 2026-08-25 for exactly this. The founder has granted
  standing authority to re-auth.
- **Mobbin MCP** — pull reference mechanics and **commit them into
  `docs/design/reference-2026-08-26/`** so the four OpenCode sessions can see them. `START-HERE.md`
  currently points at `docs/design-reference/mobbin-2026-08/`, **which does not exist**. Fix that
  claim or create the directory; a lane cannot design against a path that is not there.
- **Migrations** — hand-written, applied individually, **never via Lovable**. Note that Lovable loses
  `schema_migrations` rows: seven vanished at once while the schema stayed correct, so never diagnose
  from the ledger alone.
- **Merging.** Lanes push their own branches. You integrate into `main`, several times an hour, and
  you are the reason `main` stays deployable.

---

## Your three standing jobs, in priority order

### 1 · Make the spine verify itself before it hands on — the highest-value change available

The research finding, dated and stored in
[`docs/research/agentic-product-patterns-2026-08.md`](../docs/research/agentic-product-patterns-2026-08.md)
§3.1: Replit builds *and verifies* before you see it; Devin rereads its own error, fixes and reruns;
Codex returns a PR that already passed checks. **Our stations produce and advance regardless of
whether what they produced is any good.** That is the mechanism behind the ~46-track `sense`
graveyard and behind three months of the acceptance query returning 0.

**Build the self-check loop into `driveTrackOnce` / the station briefs:** before a station may hand
on, it checks its own output against the thing it was asked for; a station that fails its own check
**retries with the failure in its context** rather than advancing or dying silently at
`MAX_STATION_ATTEMPTS`. Devin's loop, applied to the spine.

Two known traps in this area, already paid for:
- **The restatement fold answered `ids: []`**, so the second track in any evidenced workspace could
  never clear Discover honestly. Fixed `5ea7415a2`/`9eefe092e` — verify the fix is live before
  building on it.
- **A fair guard can delete the only stuck signal.** Exempting a failure from an attempt counter also
  removes the alarm. Watch spend rising while a counter stays 0.

### 2 · Drive real tracks and watch them, every session, more than once

**Watch a run; do not only read the code.** Three of five defects found in one night came from
driving a real track — code review had missed all three for weeks. Read what the agents actually
said. Fix what stops them. Two walls were found exactly this way: no clock in the prompt, and the PII
guardrail shredding UUIDs.

Record every measurement with its query. The acceptance query, and only this one:

```sql
SELECT id, entry_station, station, waived, created_at FROM spine_tracks
WHERE entry_station = 'sense' AND station = 'learn' AND waived = '[]';
```

**Never ask it through `workspaces.is_sample`** — F-42 repurposed that flag and the obvious form
returns a false 1. The database is UTC and this box is IST: put `now()` in every query, because "four
minutes ago" once read as "yesterday" and nearly reversed a finding.

### 3 · Keep four sessions unblocked and honest

- **Every lane holds at least two fully specified queued items at all times** — goal, the user value
  it delivers (§0 questions 1 and 2), files, acceptance criteria, which skills to use, which existing
  component was checked first. Write them to `~/supaprod-bus/QUEUE-<session>.md`. **A blocked lane is
  your failure.**
- **Answer every `ask/*/` on the bus within one unit.** Lanes have no database; every count, row and
  deploy is a question to you.
- **Run both gates on every lane push** — enterprise and R-20's eight. Fix minor defects yourself in
  place; never route a typo through a queue. Only structural defects go back.
- **Promotion into `src/components/meridian/` is the one review you never rush.** A primitive is used
  by every future surface, so a mediocre one is a debt charged forever.
- **S4's verdict outranks a builder's buildlog.** A unit S4 cannot reproduce is reopened.

---

## Never stop finding gaps

The current backlog is **a slice, not the platform**. A queue that stops growing stopped looking.
Untouched or under-served right now: onboarding, billing, tenancy, notifications, search, error and
offline states, accessibility, admin, connectors, export, Settings, and the 119 routes that
`REIMAGINING.md` argues should be nine. **Which of the 119 map onto which nine is an open founder
question — map it, propose it, and do not let a lane guess it.**

---

## What would prove you wrong

If at the end of a session the acceptance query still returns 0 and you cannot name, in one sentence,
the specific mechanism that stopped it this time — you spent the session on the wrong thing.
