# S0 · CONDUCTOR — Claude Code, `main`

**Read [`OPERATING-MODEL-5-SESSIONS.md`](./OPERATING-MODEL-5-SESSIONS.md) in full before anything
else. It carries the user lens, the definition of "truly agentic", path ownership, the git-only
coordination protocol,
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
- **Migrations — hand-written, applied ONE BY ONE, never handed to Lovable as a batch.** Founder's
  instruction, and it is binding: Lovable concatenates migrations and drops statements out of the
  middle. **Apply each migration on its own, verify the schema after each one, and only then apply the
  next.** Lovable also loses `schema_migrations` rows — seven vanished at once while the schema itself
  stayed correct — so **never diagnose from the ledger; read the schema.**
- **Deploy and publish are yours alone, and they are a three-step act: verify, deploy, verify again.**
  No other session can do it and none may claim it happened. Publish status has lied more than once —
  three times in one night — so confirm with an independent read of a changed file, not with the
  publish response. Lovable's GitHub sync has stalled for 24 minutes; an empty commit unsticks the
  webhook. **Unpushed local work looks identical to shipped work**: check ahead-of-origin before you
  check the code.
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

### 1b · The sandbox primitive, and the two probes that matter more than the prototype

[`SPEC-BUILD-PATHS.md`](./SPEC-BUILD-PATHS.md) §2 and §5 are yours. **One isolated-execution service
with six callers, scope-limited, ephemeral, and never touching production** — building six previews
instead is the expensive mistake.

Build the probes in value order, not station order:

1. **Decide's metric probe.** Prove the observable a forecast names can be read today, returning a
   number. **Without this the verdict can never land**, and the grader has processed zero workspaces in
   its life (F-51). It is cheap and it makes the moat mechanically sound.
2. **Ship's preview deploy.** R-27 gates the production deploy on **proof, not a click** — the preview
   deploy IS that proof, and `release.publish` already requires a `deployments` row with
   `status='success'` that the loop cannot produce (F-36). **This is the missing mechanism.**
3. Then the Design prototype runtime, Discover's connector dry-run, Learn's live verdict query, Build.

**And the handback** (§3): paste-it-back first because it needs no integration, then the repository app
reporting four events and nothing more, then the outcome signal — one named metric per forecast, read
on the horizon date, which is the one that closes the moat.

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
  component was checked first. Write them to coordination/.md`. **A blocked lane is
  your failure.**
- **Answer every `ask/*/` in coordination/requests/ within one unit.** Lanes have no database; every count, row and
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

## Before anything, every session and every unit

```bash
git fetch origin && git rebase origin/main
cat docs/lanes/NOW-*.md          # what every other session is on, right now
```

**Never start work on a stale checkout.** Five sessions push continuously; a thirty-minute-old
worktree is already behind, and a "clean" verification measured against it is measured against a tree
that exists nowhere. **If another session's NOW line names what you were about to start, do not start
it** — take the next item and say why in coordination/requests/.

Then rewrite your own one-line `docs/lanes/NOW-<you>.md`, and append your unit block to
`docs/lanes/log/<you>.md` when you commit. **Those two files are yours alone — never write another
session's, and never write `docs/lanes/BUILDLOG.md`, which S0 rolls up.**

## Plain words, on every surface you touch

Operating model §12 is a law, not a copy preference: **if a person would not say the word out loud to
a colleague, it does not go on a surface.** Engine Room, guardrails, govern, boundary, cockpit,
fleet, swarm, artifacts, signals, trust ledger — all out, with the rename map in §12. The station
names (Discover, Decide, Plan, Design, Build, Ship, Learn) **stay as they are**; they are already
plain. Apply the map inside your prefix and file an ask for anything outside it. **A word renamed in
one place and left stale in another has made the problem worse.**

## The dev server. Read this one twice.

**Founder's instruction, repeated across sessions and now binding on all five:** *"Do not start the
dev server until it is required. Once your job is done, close it, because of RAM. When too many dev
servers are open the system hangs."*

**Five sessions on one laptop means five times the risk, and this machine has already been driven to a
restart by it** — while the founder was asleep. R-21, and it is a gate, not housekeeping:

```bash
lsof -ti:5173 || true          # BEFORE you start one. If anything is listening, do not start another.
bun run dev                     # only for a check that genuinely needs a browser
kill $(lsof -ti:5173)           # THE MOMENT the check is done. Not at unit end. Not at session end.
```

- **One dev server on this machine at a time.** If the port is busy, another session holds it — read
  the `NOW-*.md` files, use their server if the check is in their prefix, or file a request.
- **Say so in your NOW line while you hold one** (`DEVSERVER` in the status field), and clear it the
  moment you stop it. That is the only way five sessions can see each other's load.
- **A unit is not finished while a server it started is still alive**, and a unit claiming a browser
  check without recording that it stopped the server is rejected on review.
- Kill orphans before you start: a server from a crashed session looks exactly like a live one.

---

## What would prove you wrong

If at the end of a session the acceptance query still returns 0 and you cannot name, in one sentence,
the specific mechanism that stopped it this time — you spent the session on the wrong thing.
