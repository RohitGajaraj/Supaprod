# OPERATING MODEL — five sessions, five worktrees, one product

> _Written 2026-08-26 by MAIN under the founder's grant: full authority over design, features and
> architecture. Supersedes the three-lane split in `START-HERE.md` for session assignment only.
> `RULINGS.md` remains the tiebreaker on everything it covers._

**Every session reads this file first, then its own SESSION-N file. Nothing else, until you need it.**

**Five sessions: one Claude Code (S0), four OpenCode / OX Alpha (S1–S4).**

---

## 0 · The lens that outranks every other instruction in this repo

**You are not building for a founder, an investor or a reviewer. You are building for one person
who has a job to do and is already tired.** Before you write a line, and again before you commit,
answer these five out loud in your unit file. A unit that cannot answer them is not built, it is
deleted:

1. **What problem of mine does this kill?** Name the thing the user stops suffering. Not a capability
   — a suffering.
2. **What do I stop doing because this exists?** If the answer is "nothing, I do one more thing", it
   is a feature and features are the enemy here.
3. **How is this different from Linear + Notion + Cursor + a Slack channel, which I already pay for?**
   If the honest answer is "it is in one place", that is not a reason to switch.
4. **Could I understand this in ten seconds with nobody explaining it to me?** No tour, no tooltip, no
   docs link. If it needs explaining, the surface is the defect.
5. **Would I open it again tomorrow?** What specifically pulls me back.

**The user does not care that this platform has 119 routes, seven stations, a brain, or that it is
"agentic".** They care whether their day got easier. Buzzwords on a surface are a fail on the same
footing as a tenant leak. Never write "agentic", "autonomous", "AI-native", "orchestration" or
"intelligence" in product copy — show the behaviour instead and let them name it.

---

## 1 · What "truly agentic" means here, stated so it can be failed

Five properties. Each is falsifiable. A surface that has fewer than all five is a dashboard with a
chat box, which is what every competitor already ships.

1. **It starts without a form.** One sentence in. No project to create first, no connector to pick,
   no template, no settings visited. Antigravity required a project, measured it, and shipped the
   bypass. If your surface asks a question before it does anything, cut the question.
2. **It keeps going without you.** It holds a stated authority — a spend ceiling, a blast radius, a
   tool set, an expiry — and acts inside it without asking. `resolveApprovalPolicy` and
   `autonomy-policy.ts` already exist with **zero callers**. When it reaches the edge of that
   authority it asks **in place, once**, and the answer widens the authority for the whole class,
   never for the single instance. 90 queued approvals since July, zero ever answered, is what the
   other shape produces.
3. **You can see it think, and what you see is true.** Not a spinner and not a step label on a timer.
   The actual act, named in plain words, derived from a row that exists — `agent_runs`,
   the newest `tool_calls`, `spine_tracks.last_hold`. **A state the data cannot prove is a state you
   do not draw.** This repo has already failed a branch for a timer advancing step labels. Theatre is
   the one regression that ends a feature rather than fixing it.
4. **You can steer it without restarting it.** One instruction back into work that is still moving —
   *"the empty state is wrong"* — and it takes it. Undo a step, not the run. Take over a step by hand
   and hand it back. If the only controls are Start and Stop, it is a batch job.
5. **It comes back on its own.** The verdict arrives on the horizon date, unasked, and says what was
   predicted beside what happened. The person never goes looking for it.

**The parallel property, which is the new bet:** more than one piece of work is moving at once, and a
person can see, in one glance, what is running, who owns it, what changed in the last minute, and
where two efforts are about to collide. We are living that problem right now with four worktrees on
one repo. **Build the thing we wish we had while we build it.**

---

## 2 · The acceptance. Nothing else counts as done.

R-18, unchanged and unsoftened:

**One piece of work enters at `sense` and completes all seven stations — sense, decide, define,
design, build, ship, learn — driven entirely by agents, no human touching it mid-run, watched on one
screen, ending with a verdict that names what was predicted beside what happened.**

Measured query, and only this one:

```sql
SELECT id, entry_station, station, waived, created_at
FROM spine_tracks
WHERE entry_station = 'sense' AND station = 'learn' AND waived = '[]';
```

It has returned **0 of 93 tracks in three months**. Never ask it through `workspaces.is_sample` —
F-42 repurposed that flag and the obvious form returns a false 1 (F-61/F-71). One track sits at
`learn`: it entered at `define` with sense and decide waived, carries no forecast, and proves the
machinery rather than the loop.

**Second acceptance, added by the founder 2026-08-26 and equal in weight:** a person who has never
seen this product opens it, and inside sixty seconds — without being told anything — knows what it
is doing for them and wants to come back. Judged by the founder on the running product, not on a
description of it.

---

## 3 · The four sessions and what each owns

Ownership is by path and it is absolute. **Two writers on one path is what broke `main` on
2026-08-22.** If you need a file outside your prefix, file an ask on the bus. Never reach in, not
even for a one-line fix, not even when you are certain.

| | Runs on | Worktree / branch | Owns (writes) |
| --- | --- | --- | --- |
| **S0 · CONDUCTOR** | Claude Code | `Supaprod` / `main` | `src/lib/**` · `src/routes/api/**` · `src/components/meridian/**` · `src/components/ui/**` · `supabase/**` · `docs/**` · `the-first-run/**` · `coordination/**` |
| **S1 · THE RUN** | OpenCode | `supaprod-run` / `lane/run` | `src/components/track/**` · `spine/**` · `presence/**` · `decisions/**` · `learn/**` · `ask/**` · `discover/**` · routes `track.$trackId` `start` `decide` `learn` `discover` |
| **S2 · MISSION CONTROL** | OpenCode | `supaprod-control` / `lane/control` | `src/components/shell/**` · `runs/**` · `today/**` · `observe/**` · `crew/**` · `agents/**` · `traces/**` · `mission/**` `missions/**` · routes `_authenticated.tsx` `today` `runs.*` `missions.*` `cockpit` `fleet` `swarm` `observe` `traces*` `agents` `crew` |
| **S3 · THE PLATFORM** | OpenCode | `supaprod-platform` / `lane/platform` | `src/components/onboarding/**` · `settings/**` · `billing/**` · `admin/**` · `system/**` · `governance/**` · `engine-room/**` · `connections/**` · `plg/**` · `public/**` · `landing/**` · `src/styles/**` except `meridian.css` · routes `settings` `onboarding` `admin.*` `integrations` `notifications` `boundary` `govern` `guardrails` `engine-room` `budgets` `approvals` `login` `signup` `forgot-password` `checkout*` |
| **S4 · THE PROVING GROUND** | OpenCode | `supaprod-proof` / `lane/proof` | `e2e/**` · `docs/lanes/verify/**` — **and nothing in `src/` at all** |

**Everything not listed is read-only to everyone but S0.** Read the whole repo freely; write only your
prefix.

**Why S4 writes no product code at all.** R-11: a lane never signs off its own work. Every session
has an incentive to believe its own unit shipped, and this repo has paid for that belief repeatedly —
a "Round 8 proven" claim whose two cited tracks were `sense`/`abandoned`, a spec that detected
stations with `pageContent.includes()` against a strip rendering all seven names, twelve tests naming
one surface that turned out to be one broken precondition. S4 exists to make claims expensive. It
cannot fix what it finds — it can only prove it, name it, and hand it back. **A session that could
patch what it found would stop looking.**

**Why the brain and the engine room are not their own session.** Both are answers to the question
"where does this concept live", and `THE-ONE-SCREEN.md` already ruled it: the brain is a line inside
the run before a decision, not a page — so it belongs to S1. The engine room is one sentence in the
footer and one settings page — so it belongs to S3. Measured 2026-08-25: 133 of 133 `learnings` rows
are seed, the four brain tools have zero calls across 2,652 agent runs, and `decisions.cited_by_count`
is 0 on all 355. **A fifth session building brain surfaces would be building rooms for furniture that
does not exist.** The brain earns its first pixel when the first real learning exists.

---

## 4 · How four worktrees actually talk to each other

Conductor gives each session an isolated git worktree of this repo on **one Mac**. That gives us two
channels, and they do different jobs. Using the wrong one is how the last three weeks lost work.

### Channel A — git. Durable, reviewable, survives everything.

- Each lane lives on its own branch and **pushes every single commit**: `git push -u origin HEAD`.
- **S0 is the only session that merges into `main`.** Lanes never push to `main`. Lovable deploys from
  `main`, so a lane pushing straight there ships a half-finished surface to production.
- Start of every unit, without exception: `git fetch origin && git merge --no-edit origin/main`.
  A behind-count is measured against your branch's configured upstream, not against `main` — so fetch
  and merge explicitly rather than trusting a status line.
- **Verify on the merged tree, never on your own.** Three worktrees each report "clean" against a tree
  missing the other two lanes' work. Merge `origin/main` before you claim anything is green.

### Channel B — the local bus. Fast, and conflict-free by construction.

A directory **outside every worktree**, so it is never in a diff and never merges:

```
/Users/rohitgajaraj/supaprod-bus/
  heartbeat/<session>.json          # ONLY that session writes it
  claims/<session>.jsonl            # append-only: paths this session is touching right now
  ask/<session>/NNN-slug.md         # session -> S0: a DB query, a deploy, a ruling, a blocked path
  answer/<session>/NNN-slug.md      # S0 -> session
  broadcast/<session>/<ts>-slug.md  # anything every session should see
  QUEUE-<session>.md                # S0 writes, that session reads only
```

**The one rule that makes this work: you write only files that carry your own name, and you read
everyone's.** No two sessions ever write the same file, so there is no merge, no lock, and no lost
write. A shared handoff file written by three lanes at once is how three sessions overwrote each
other inside ten minutes on 2026-08-25.

Cadence:
- **Every session, every unit:** rewrite your `heartbeat/<session>.json` — current item, last commit
  sha, ISO timestamp, and whether a dev server is alive. Append to `claims/<session>.jsonl` the paths
  you are about to touch, and append a `release` line when you commit.
- **Before you touch a path,** grep every other session's `claims/*.jsonl` for it. If it is claimed and
  not released, file an ask instead of writing.
- **Every session, between units:** read `QUEUE-<you>.md`, `answer/<you>/`, and everyone's
  `broadcast/`. Newest first.
- **S0, every unit:** read all `ask/*/`, answer within one unit, and keep every lane holding at least
  two fully specified queued items. **A blocked lane is S0's failure, not the lane's.**

If the bus directory does not exist, create it. It is intentionally not in git; the durable record of
anything that mattered goes into a commit.

---

## 5 · Work safety. Non-negotiable, because the laptop closes.

The founder closes the laptop mid-session and nothing may be lost.

- **Commit after every logical unit, and never work longer than ~45 minutes without one.**
- `git commit -F <message-file>`, **never** `-m`. zsh evaluates backticks in `-m` and has silently
  deleted words from commit messages here.
- **`git add -A` is banned.** Stage explicit paths only. The index may already hold changes you did
  not stage — 25 film masters nearly shipped inside a component port that way.
- **Push on every commit.** An unpushed local commit looks exactly like shipped work and is not.
- **Commit before you start any long gate** (`bun test`, `bunx tsc --noEmit`, a build). A validated
  edit set was reset away mid-typecheck by another session.
- On start, and after any interruption: `git status` first, resume from uncommitted work, never from
  zero. Read your own `heartbeat` and your last three commits before deciding anything.
- **The dev server stays off (R-21).** Start it only for a browser check, stop it the moment that check
  is done. Check nothing is already listening first. Three servers on this laptop has frozen it and
  forced a restart. A unit is not finished while a server it started is alive.

---

## 6 · The two gates every unit passes before it is called done

Neither is advisory. Correct-and-cheap-looking is rejected exactly as beautiful-and-leaking is.

**ENTERPRISE.** Tenant isolation (`workspace_id` on every read and write). Permission checked, not
assumed. An audit trail for anything that changes state. A failure that names what failed and what to
do about it. No secret, no PII, in a log or a URL.

**DESIGN — R-20's eight, and a reviewer must be able to point at the one that failed:**
restraint (count the accents; more than one live signal is a fail) · rhythm (one spacing scale, one
grid, optical edges aligned) · type (Meridian scale only; a hardcoded size is a fail) · motion that
reports rather than decorates (a raw duration is a fail; use `--mrd-ease` / `--mrd-d-*`) · a designed
sad path (empty, loading, failed, held, permission-denied; an empty state that does not say what to do
next is a fail) · no dead end (every surface offers the next action) · ported not eyeballed
(beautifui.dev is the **floor**, mechanics from its real source, never from a screenshot) · density
that earns its space.

**And the Meridian duty:** per region, ask *which Meridian component serves this?* A bespoke div where
a primitive exists is a fail. 121 components, 95 adopted, 17 built with no importer — including
`run-rows.tsx`, 22.8KB of run vocabulary that three surfaces each reinvented around. **Adoption must go
up.** If no `--mrd-*` token fits, that is a gap in Meridian: file an ask, do not invent a token.

**Before you add a component, name in your unit file which existing one you checked first and why it
did not serve.** A unit that cannot answer that is rejected. `TrackActivity` and `TrackChain` were
built to a founder ruling, sat with zero importers for 24 days, and the founder re-requested the same
thing unaware it existed. **The default move is always: wire what exists.**

---

## 7 · Tools. Use all of them, aggressively.

Scan the session reminder for every available skill, agent, plugin, MCP and extension **before** each
piece of work, and pick the best fit regardless of namespace. Never invoke from memory. Specific ones
that matter here:

- **Subagents:** parallelise every audit, sweep and multi-file read. If a task is "look at N things",
  spawn N readers rather than reading them yourself.
- **Playwright MCP** (all sessions): drive the real UI. Note that a spec pressing production creates
  production rows — six duplicate tracks once starved the very run we were watching. **Point Playwright
  at a local dev server you start and stop, or at a guarded workspace S0 names. Never at production.**
- **Mobbin MCP** (S0 certainly; try it in OpenCode, and if it is not there say so and file an ask):
  600k screens from teams who ship world-class product. Pull patterns for agent presence, live
  progress, parallel work, onboarding, empty states. **Port mechanics, never screenshots.** S0 commits
  what it pulls into `docs/design/reference-2026-08-26/` so the lanes have it.
- **Lovable MCP — S0 only.** It is the only path to the database and the only deploy path. Lanes have
  no database. Anything needing a row, a count, a migration or a deploy is an ask.
- **Model policy, and say which you are using:** framing, audits, architecture and product calls →
  the strongest reasoning model you have. Multi-file implementation, refactors, hard debugging → your
  main coding model. Mechanical edits, docs, config, tests → the cheap fast one.

---

## 8 · Reporting

Every unit appends to `docs/lanes/BUILDLOG.md` — **append, never replace**, three lanes write it —
in this shape:

```
### <session> · <ISO time> · <unit id> — <one line>
WHAT: what changed, with paths
WHY IT MATTERS TO A USER: the answer to §0 questions 1 and 2, in one sentence
CHECKED FIRST: the existing component/function considered and why it did not serve
GATES: enterprise pass/fail · design pass/fail (name the failing one of the eight if any)
PROOF: the command run, the route opened, the screenshot path — or "not verified" said plainly
NEXT: the next unit
COMMIT: <sha>
```

**A number without its query is not evidence.** Record the SQL, the command, the file:line. Three
metrics that proved the product worked were all seed data and nobody could re-check them because no
query was written down.

**Report honestly.** If a test fails, say so with the output. If a step was skipped, say that. Never
report progress as completion, and never describe the remaining distance as smaller than it is.
