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

## 0.5 · The defect, named by the founder 2026-08-26 — and it is not missing features

> *"Features and capability may be there, but structuring is not there. Connectivity is not there.
> Visually, it's not making sense for me. I'm not seeing this as one connected item. That is the main
> problem."*

**Take this literally. It outranks every backlog item in this repo.** We have 119 routes, 121 Meridian
components, seven stations, a brain, an engine room, four names for the boundary concept and seven
doors onto "what is happening". A person arriving at that does not see a product. They see an
inventory. **Nothing on the queue fixes this, because everything on the queue adds to it.**

### The rule that follows, and it binds all five sessions

**There are exactly three surfaces. Everything else is a view inside one of them, or it does not
exist.**

| Surface | What it is | Owner |
| --- | --- | --- |
| **The run** | One piece of work, from handover to verdict. The transcript on the left, the thing being made on the right, the mode and Stop in the footer | S1 |
| **The board** | Every piece of work at once — what is running, who has it, what changed, what needs you | S2 |
| **Settings** | Everything that is genuinely configuration, reached rarely | S3 |

A person is always in exactly one of these three and can always get to the other two. Brain, memory,
approvals, guardrails, govern, boundary, engine room, crew, agents, traces, fleet, swarm, cockpit,
observe, missions, today, discover, decide, define, design, ship, learn — **not one of those is a
destination.** Each is either a view inside the run, a column on the board, a section of settings, or
it is deleted. `THE-ONE-SCREEN.md` already ruled most of these individually; this states the general
law so nobody has to re-litigate them one at a time.

### Connectedness — the specific thing that is missing

Right now the objects are islands. A decision does not visibly come from a track; a spec does not
visibly come from a decision; a diff does not visibly come from a spec; a verdict does not visibly
land against the forecast that predicted it. **Each of those links exists in the data and appears on
no surface.**

**Every object shows, in place: what produced it, and what it feeds.** That is one line on each,
clickable, and it is what turns an inventory into one connected item. It is also nearly free —
`decisions`, `spine_tracks`, `changesets`, `deployments` and `agent_memory` already carry the lineage;
on real lineage, decide's largest inbound source is already learn (36 edges against 9 from
opportunities). **We built the graph and never drew it.**

### What every session does about it, starting now

- **Every unit either removes a surface, folds one into another, or draws a connection that already
  exists in the data.** A unit that adds a destination is rejected on review.
- **Before adding a route, component or page, say in your unit file which of the three surfaces it
  lives inside.** If the honest answer is "its own", the answer is no.
- **S0 arbitrates every fold and owns every deletion.** Propose in coordination/requests/, with the callers you
  found and where they redirect to. **A route folded without its callers redirected is a 404 in
  production.**
- **The measure of a good session is that the count went down.** Routes, components, doors, concepts.
  Adoption of what already exists goes up; inventory goes down. That is the whole shape of this phase.

---

## 0.6 · Where you MAY add — standing authority, and the gaps that are real

**Founder, 2026-08-26:** *"It's not only about structure. If there is genuinely some gap in features,
I authorise you to approve it, build it and fix it. What needs to be built for this platform to be
loved by millions of users?"*

§0.5 says stop adding destinations. **It does not say stop building.** Those are different
instructions and confusing them is how a team polishes an inventory. The rule is:

**Fold surfaces. Build capabilities.**

### The four-part test before you add anything

Answer all four in your unit file. Three out of four is a no.

1. **Which of the six verbs does it serve** — assign, manage, operate, value-audit, review, ship — and
   **what does the user do today instead?**
2. **Does it remove a step from the person, or add one?** If it adds one, it is not a capability, it is
   a chore with a nicer name.
3. **Can it be shown working in under thirty seconds, to someone told nothing?** If it can only be
   described, it is not finished.
4. **Which of the three surfaces does it live inside?** If the honest answer is "its own", the answer
   is no.

### The gaps that are real, ranked. These are authorised — build them.

Each is a genuine missing capability, not a structural fold. Each is named with its evidence so nobody
re-derives it.

1. **Stations do not check their own output before handing on.** Replit verifies before you see it;
   Devin rereads its own error and reruns; Codex returns a PR that already passed checks. Ours advance
   regardless. **This is the mechanism behind the ~46-track `sense` graveyard and three months of the
   acceptance query returning 0.** — *S0, `src/lib/spine/**`.*
2. **Nothing reaches a person who left the page.** The whole frontier is async: submit and leave, the
   result comes to you. We require attendance and call it visible agency. **No notification, email,
   push or digest exists that carries a verdict to someone who closed the tab.** — *S3, with S0 for the
   trigger.*
3. **Three missing steps between Build and Ship, and no station crewed for any of them** — a commit, a
   merge, and a recorded preview deploy. `studio.commit` appears **0 times in `driver.ts`**; Build is
   briefed only on `studio.stage`, step one of six. `ship` has never written a track-member row while
   `deployments` holds 42 successful ones. **This blocks the acceptance directly.** (F-36) — *S0.*
4. **The return edge does not fire.** The due-forecast queue exists and has processed **zero
   workspaces in its life** (F-51). Notion's shape is the model: give it a job, set a schedule, it
   comes back. Until this runs, `learn` starves and the brain starves with it. — *S0.*
5. **You cannot steer without restarting, and you cannot undo a step.** Devin lets you intervene at any
   point. We offer Start and Stop, which makes this a batch job. — *S1.*
6. **You cannot take a step over by hand and hand it back.** The 40-point gap between the ~60% of work
   people use AI for and the 0–20% they can fully delegate is exactly this, and it is what we sell
   into. — *S1.*
7. **"Was it worth it" has no surface.** Spend and token caps live on `agent_runs`; nothing shows cost
   and elapsed time against what was promised at the outset. **Value audit is one of the six verbs and
   it is entirely unbuilt.** — *S1 for the surface, S0 for the numbers.*
8. **Many teammates working at once is invisible.** Specced 2026-08-26 in
   [`SPEC-MULTIPLAYER-PRESENCE.md`](./SPEC-MULTIPLAYER-PRESENCE.md). — *S2 for the layer, S0 for the
   derivation.*
9. **Evidence ingestion has never worked in production.** `scout_targets` is 0 in **21 of 21**
   workspaces, `scout_snapshots` is **0 rows ever**, `scout_runs` stopped 2026-07-25 after 98 runs that
   captured nothing — and `scout-tick.ts:78` returns `{ok: true, skipped: true}`, **a dormant pipeline
   reporting SUCCESS to `pg_cron`**, which is why a month passed unnoticed. Agents were told to gather
   evidence from a pipeline that has never delivered any, correctly reported there was none, and their
   honest reports hardened into 144 standing prohibitions. **Turning it on starts paid crawling against
   real sites, so S0 proposes it with the cost and the founder confirms the key — that one is money,
   and money stays his.** — *S0 to propose.*
10. **Search across work, and export.** Both untouched, both table stakes at the scale being aimed for.
    — *S3.*

**A gap you find that is not on this list is still authorised** if it passes the four-part test. Put it
in coordination/requests/, build it, and add it here with its evidence.

### The standard, stated so it can be failed

*"If OpenAI, Anthropic, Google, Perplexity, **Vercel** or **Linear** shipped this, how would it behave
on day one?"* The last two are the sharpest craft references available and the founder named them:
**Vercel** for surface craft, motion, empty states and the sandbox shape; **Linear** for speed,
keyboard-first density, and delegation-by-assignment done without inventing vocabulary. Not a mood —
these eight, and any one of them failing is a fail:

1. **It works the first time for someone who was told nothing.** No tour, no tooltip, no docs link.
2. **Work starts visibly in under a second.** Nothing blocks on a spinner past ~2s without saying, in
   plain words, what it is doing.
3. **No raw error ever reaches a person.** Every failure names the thing that failed and the next
   action. A refused station is not a failed station (R-26).
4. **Keyboard-first.** Everything reachable without a mouse; accessibility is not deferred (R-19).
5. **It survives being left alone** — tab closed, laptop shut, network dropped, session resumed. The
   work continues and the result finds them.
6. **One visual system, no orphans.** Meridian, ported from beautifui.dev, which is the floor and not
   the ceiling.
7. **It is honest.** No fabricated progress, no invented number, no seeded memory presented as
   learning. **This is the one the frontier gets right and imitators get wrong**, and it is the only
   item on this list that deletes a feature rather than sending it back.
8. **It gets out of the way.** The fewest possible decisions between the person and the outcome. Count
   them; every one you remove is the feature.

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

## 3 · The five sessions and what each owns

Ownership is by path and it is absolute. **Two writers on one path is what broke `main` on
2026-08-22.** If you need a file outside your prefix, file a request file in coordination/requests/<you>/. Never reach in, not
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

**[`SURFACE-MAP.md`](./SURFACE-MAP.md) is the complete version of this table** — all 113 product
routes and all 50 component directories, each with an owner and a disposition (keep, fold, delete, or
audit-first). **Nothing is unassigned.** If a path is not in it, it was added after 2026-08-26 and
needs an owner before anyone writes in it.

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

## 4 · How five worktrees talk to each other — git, and only git

**Founder's ruling, 2026-08-26: "this communication needs to be established only through GIT, because
that is the only common channel for all of you."** An earlier draft of this section proposed a local
directory outside the repo as a fast side-channel. **That is retired.** It was invisible to anything
but this one Mac, it left no record, and a second channel is a second place to forget to look.

**Everything goes through git. All of it. And the design that makes that work is one writer per
path** — no two sessions ever write the same file, so there is never a merge, never a lock, and never
a lost write. A file three sessions write is a file three sessions lose; that already happened here,
three handoffs overwritten inside ten minutes.

| Path | Who writes it | What it is |
| --- | --- | --- |
| `docs/lanes/NOW-<S>.md` | that session only | **One line**, rewritten every unit. The merged view of the whole fleet is `cat docs/lanes/NOW-*.md` |
| `docs/lanes/log/<S>.md` | that session only | Append-only unit history. Merged view: `cat docs/lanes/log/*.md \| sort` |
| `docs/lanes/QUEUE-<S>.md` | **S0** only | The next items. That session reads, never writes |
| `coordination/requests/<S>/*.md` | that session only | Anything only S0 can do: a DB count, a deploy, a migration, a design reference, a ruling, a blocked path |
| `coordination/answers/<S>/*.md` | **S0** only | The answer, naming the committed path of anything it produced |
| `docs/lanes/verify/*.md` | **S4** only | Verdicts |
| `docs/lanes/BUILDLOG.md` | **S0** only | The rolled-up narrative. **No lane writes it any more** |
| `docs/design/reference-2026-08-26/**` | **S0** only | Mobbin pulls, committed so the lanes can see them |

### The cadence

**Before every unit** — not once at session start:

```bash
git fetch origin && git rebase origin/main
cat docs/lanes/NOW-*.md                 # what every other session is on, right now
cat coordination/answers/<you>/*.md     # anything S0 answered since your last pull
cat docs/lanes/QUEUE-<you>.md           # what is next
```

**If another session's NOW line names what you were about to start, do not start it.** Take the next
item and say why in your own NOW line. That is the entire purpose of the file.

**After every unit:** rewrite your `NOW-<S>.md`, append to `log/<S>.md`, commit explicit paths, push.
**Pushing is how you speak.** An unpushed commit is a thought nobody heard.

**S0, every unit:** read every `coordination/requests/*/`, answer within one unit, and keep every lane
holding at least two fully specified queued items. **A blocked lane is S0's failure, not the lane's.**

### Branches

Each lane lives on its own branch and pushes every commit: `git push -u origin HEAD`. **S0 is the only
session that merges into `main`** — Lovable deploys from `main`, so a lane pushing straight there
ships a half-finished surface to production. **Verify on the merged tree, never on your own:** five
worktrees means every session can report "clean" against a tree that exists nowhere.

## 5 · Sync first, then work safety. Both non-negotiable.

### The first command of every session, and of every unit inside it

```bash
git fetch origin && git rebase origin/main      # lanes, on your own branch
git pull --rebase origin main                   # S0, on main
```

**Founder's instruction, and it is binding: no session starts work without syncing to `main` first.**
A lane that does not pull is editing stale files, and its "clean" verification is measured against a
tree missing four other sessions' work. This is not a nicety — three worktrees each reported green
against a tree that did not exist anywhere.

Do it again **before every unit**, not once at session start. Five sessions push continuously; a
thirty-minute-old checkout is already behind. And a behind-count is measured against your branch's
configured upstream rather than against `main`, so fetch and rebase explicitly rather than trusting a
status line.

If the rebase conflicts inside your own prefix, resolve it. If it conflicts **outside** your prefix,
you have written where you should not have — stop, take yours out, and file an ask.

### Work safety

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

## 8 · Reporting — one line everyone can see, and no two sessions writing one file

The founder asked for a shared one-liner per lane so that every session, on its next fetch, can see
what the others are on and not duplicate it. **The design constraint is that a file three sessions
write is a file three sessions lose:** on 2026-08-25 three sessions closed within ten minutes and each
overwrote the others' handoff.

**So: one file per session, single writer, and the merged view is a `cat`.** Same law as section 4.

### `docs/lanes/NOW-<S>.md` — exactly one line, rewritten by its owner every unit

```
S2 · 13:40 IST · WORKING · runs board: folding cockpit+fleet+swarm into one board · src/components/runs/** · 83b2070ac
```

`<session> · <time> · WORKING|BLOCKED|DONE · what, in a few words · the paths you hold · last commit`.

**Read every other lane's line before you pick up anything**, which after a fetch is one command:

```bash
git fetch origin && git show origin/main:docs/lanes/NOW-S0.md origin/main:docs/lanes/NOW-S1.md ... 2>/dev/null
# or simply, after the rebase:  cat docs/lanes/NOW-*.md
```

**If another lane's line names what you were about to start, do not start it.** Take the next item
instead and say why in coordination/requests/. That is the whole point of the file.

Sub-minute latency lives on the local bus (`docs/lanes/NOW-<S>.md`), which does not need a
push to be visible. The `NOW-` file is the durable version that survives a fetch from any worktree.

### `docs/lanes/log/<S>.md` — your own append-only history

Append one block per unit. **Your own file, so it never conflicts.** The merged history is
`cat docs/lanes/log/*.md | sort`. S0 rolls the narrative up into `docs/lanes/BUILDLOG.md`; **no lane
writes BUILDLOG.md directly any more.**

```
### <S> · <ISO time> · <unit id> — <one line>
WHAT: what changed, with paths
WHY IT MATTERS TO A USER: the answer to §0 questions 1 and 2, in one sentence
CHECKED FIRST: the existing component or function considered, and why it did not serve
GATES: enterprise pass/fail · design pass/fail (name the failing one of the eight if any)
PROOF: the command run, the route opened, the screenshot path — or "not verified", said plainly
NEXT: the next unit
COMMIT: <sha>
```

**A number without its query is not evidence.** Record the SQL, the command, the `file:line`. Three
metrics that proved the product worked were all seed data, and nobody could re-check them because no
query was written down.

**Report honestly.** If a test fails, say so with the output. If a step was skipped, say that. Never
report progress as completion, and never describe the remaining distance as smaller than it is.

## 9 · What the frontier actually ships, and the three things it does that we do not

_Researched 2026-08-26. Ported as mechanics, per R-20 §7 — never as screenshots._

| Product | The mechanic that works | What we take |
| --- | --- | --- |
| **Claude Code** | The primary surface is a **transcript**, not a dashboard. Capability is layered — memory, hooks, skills, subagents, MCP — and each layer appears only at the moment it is needed; the user never meets a shelf of them. Permission mode is an **autonomy dial set once**, not a question asked per action | Confirms R-13: the left pane is the transcript. The footer is the dial. Connectors and skills are reached at the moment of need, never browsed first |
| **Codex in ChatGPT** | A command centre with **built-in worktrees**: queue many tasks, each in its own sandbox, results arrive as **separate reviewable pull requests**. Async by default — submit and leave, results come to you | S2's shape exactly. And the returned unit is reviewable — a diff, a decision, a spec — never "status changed to design" |
| **Cursor 2.0 / Composer 2** | Parallel tool calling: reads up to 15 files simultaneously before editing. The agent determines its own next steps without step-by-step prompting | Show the fan-out. When five things are being read at once, that is more convincing than any spinner — and it is true |
| **Replit Agent 4** | Parallel execution across isolated micro-VMs, and it **builds *and verifies* before letting you test**. Fewer round trips, longer first build, and the user prefers it | **The single most important one for us.** See below |
| **Devin** | A persistent environment you can watch live and **intervene in at any point** to redirect. A self-debugging loop: read the error output, reason about the cause, apply a fix, rerun | Steer without restart. And the self-debug loop is precisely what our stations lack — they stall at `MAX_STATION_ATTEMPTS` instead of reading their own failure |
| **Manus 1.6** | Chat Mode beside Agent Mode: **the user picks how much autonomy this particular task gets** | The footer mode becomes choosable, not just reported |
| **Linear** | You delegate by **assigning the issue to the agent** — the gesture people already know. Many in parallel, progress monitorable | Zero new vocabulary. Never teach a verb the user already has |
| **Notion 3.3 Custom Agents** | Give it a job, set a trigger or a schedule, it runs unattended | This is exactly the `learn` return edge: a scheduled agent that comes back when the horizon closes |
| **Amoeba** | "Many, coordinated" agents on one project with shared visibility, **collision detection**, clear ownership, Mission Control, and *guide / take over / spawn parallel help* | S2's brief, close to verbatim |

### The three things all of them do that Supaprod does not

1. **They verify before they hand over.** Replit builds and tests before you see it; Devin reruns until green; Codex returns a PR that passed checks. **Our stations produce and advance regardless of whether what they produced is any good** — which is the whole reason 46 tracks sit in a `sense` graveyard and the honest acceptance query has returned 0 for three months. A station that cannot check its own output is not autonomous, it is merely unattended.
2. **They let you leave.** Async is the default and the result comes to you. Gemini's line is the model: *"I'm on it — you can leave this page in the meantime."* Ours currently requires a person to sit and watch, and calls that "visible agency". Visible must not mean mandatory.
3. **They borrow a gesture the user already has.** Assign an issue. Review a diff. Merge a PR. We invented seven station names and put them on screen — which is exactly what R-01 forbids and R-13 replaced. **If a surface teaches vocabulary, it has already lost the sixty seconds.**

---

## 10 · Testing and validating is half the job, not the tail of it

The founder's instruction, and it is binding: **do not just build, add features and move on.** This
repo's characteristic failure is not bad code. It is confident claims about code that was never
driven. Three examples that each cost a week: a "Round 8 proven" claim whose two cited tracks were
`sense`/`abandoned`; a spec that detected stations with `pageContent.includes()` against a strip
rendering all seven names; three headline metrics proving the product worked that were all seed data,
unre-checkable because nobody wrote down the query.

**The rules, for every session:**

- **A unit is not done when it compiles. It is done when it has been driven.** Open the route, take
  the action a user would take, and record what happened. `bunx tsc --noEmit` and `bun run lint`
  passing is not a gate here — `bun test` holds the invariants, and even green tests are not a driven
  surface.
- **Watch a run; do not only read the code.** Three of five defects found in one night came from
  driving a real track. Code review had missed all three for weeks.
- **Assert on what your fix uniquely controls, across two cycles.** A fast empty tick looks identical
  whether your filter worked or the work was simply held.
- **A test name says what it intended to reach, not what it reached.** When many tests naming one
  surface fail together, suspect one broken precondition, not many bugs.
- **Suspect the instrument when a known-good control fails as badly as the broken case.**
- **Never pipe a gate into `tail`** — it returns `tail`'s exit code and `main` has shipped red that
  way. **The 12 pre-existing test failures are known: do not claim them and do not silently fix them.**
- **S4 is the adversary and its verdict outranks the builder's.** A unit S4 cannot reproduce is
  reopened, whatever the buildlog says.

**If a credit, quota or auth limit stops you** — Lovable token expiry, an MCP that will not connect, a
model quota — **say so in one line in coordination/requests/ and switch tools rather than reporting a blocker.**
Playwright, chrome-devtools and the Chrome plugin are three separate paths to a browser. Only a
credential boundary is a real blocker, and for those the founder has granted standing authority to
re-authorize: file the ask, name exactly what you need, and keep working on everything that does not
depend on it.

---

## 11 · The persona, and the capability register — CORRECTED 2026-08-26

**Correction, and it is mine to own.** An earlier draft of this section said the six verbs *replace
the station names on screen*. **That was wrong and the founder rejected it.** The stations —
Discover, Decide, Plan, Design, Build, Ship, Learn — are how the work moves and they stay exactly as
they are. Nothing here renames or removes them.

### The persona

**Founder, 2026-08-26:** *"If I have to deliver my work and the entire thing is taken care of by AI
teammates, they have to assign, manage, operate, value-audit, review and ship."*

**The user is the person accountable for an outcome who is not doing the work — a delegator whose
team is AI teammates.** They do not walk a lifecycle. They run a team they do not want to
micromanage. That is a different person from the one the seven stations were drawn for, and both are
true at once: the stations are how the machine moves the work, the delegation is how the person
experiences it.

### What the founder was actually naming: the capability register

Those six are **things an AI teammate must be able to do**, not labels for anything. And the founder
was explicit that the list is not closed: *"there might be n number of other tasks which an agent
might want to do from our platform perspective."* So this is a register, it is open, and **every
session adds to it as it finds a capability the teammates need and do not have.**

| Capability | State today | Owner |
| --- | --- | --- |
| **Assign** — hand a piece of work to a teammate | Partial. `/start` takes a sentence; assignment from elsewhere does not exist | S1 |
| **Manage** — sequence, reprioritise, see what is stuck | Missing as a surface | S2 |
| **Operate** — act inside a stated authority without asking | Engine exists, **zero callers** (`resolveApprovalPolicy`, `autonomy-policy.ts`) | S3 |
| **Value-audit** — was it worth what it cost | **Entirely unbuilt.** Spend caps live on `agent_runs`; nothing shows cost against what was promised | S1 + S0 |
| **Review** — check what came back, respond in place | Partial. The right pane exists; approve / one-instruction-back / undo do not | S1 |
| **Ship** — let it out, gated by proof not a click | Blocked. Three missing steps between Build and Ship, no station crewed for any (F-36) | S0 |
| **Verify its own output before handing on** | **Missing, and it is gap #1.** Stations advance regardless | S0 |
| **Hand off with context** — pass to another teammate and say what was passed | Data exists, never drawn | S2 |
| **Sync** — see what another teammate already has, and not redo it | Missing. This is the collision case | S2 |
| **Ask** — escalate to a person, in place, once, answer covers the class | Partial. `TrackConsent` exists; 90 queued asks died detached from the work | S1 |
| **Refuse** — say the door is locked and which one, without retry theatre | Ruled (R-26), partly wired | S1 |
| **Recall** — check what was learned before deciding | Tools exist with **zero calls across 2,652 runs** | S0 |
| **Schedule** — come back when the window closes | Queue exists, has processed **zero workspaces** (F-51) | S0 |
| **Notify** — reach a person who left the page | **Missing entirely.** Gap #2 | S3 |
| **Hand back** — let a person take a step by hand and return it | Missing | S1 |
| **Undo** — revert a step without restarting the run | Missing | S1 |
| **Report cost** — what this spent, in money and time | Data exists, no surface | S1 |

**Add a row when you find one.** A capability a teammate needs and does not have is a real gap under
§0.6 and is authorised — it does not need a new destination, so it does not conflict with §0.5.

Full derivation, with sources and the nine-product teardown it came from:
[`docs/research/agentic-product-patterns-2026-08.md`](../docs/research/agentic-product-patterns-2026-08.md).
**Read it before any "make it more agentic" work.** It exists so nobody pays for that sweep twice.

---

## 12 · Plain words. The naming law, and it is cross-surface

**Founder, 2026-08-26:** *"At the platform level — Engine Room, safety and other things — those look
like rattling words. It's not to the point. How can I make it simple so people literally understand,
rather than rattling it? Use the words that are commonly understood, across every surface, not just
one section."*

**The law: if a person would not use the word out loud to a colleague, it does not go on a surface.**
Not in a nav item, not in a heading, not in a button, not in an empty state, not in a toast. This is
not a copy pass on one page — **it is cross-surface, and a session that renames a thing in its own
prefix and leaves it stale elsewhere has made the problem worse.** Grep the claim, not the spelling:
one word travels under seven wordings and escaped six sweeps in a day.

### The stations keep their names, because they are already plain

Discover · Decide · Plan · Design · Build · Ship · Learn. Those are ordinary words and everyone knows
them. The internal slugs (`sense`, `define`) never appear on a surface; the surface names above do.
**This section is not about them.**

### The rename map — jargon out, plain words in

Proposed by MAIN under the founder's grant. **S0 rules on each row and owns the sweep; a lane applies
it inside its own prefix and files an ask for anything outside.** Never change a word in one place
only.

| Today, on a surface | Plain word | Why |
| --- | --- | --- |
| Engine Room · Guardrails · Govern · Boundary · Safety | **What it's allowed to do** | Four routes and a mood for one idea: the spend ceiling, the blast radius, the tool set, the expiry. Say the idea |
| Approvals | **Waiting for you** | Names who is blocked and on what. "Approvals" names a queue, which is why 90 of them died in one |
| Crew · Agents · Fleet · Swarm | **Your team** | Four words for the same people |
| Cockpit · Mission Control · Observe · Today | **Work** | The board. One name |
| Missions · Tracks · Runs | **a piece of work** | Three nouns for one object. Pick the one a person would say |
| Brain · Memory · Knowledge | **What we've learned** | And it stays honestly empty until a real learning exists (R-06, F-70) |
| Trust ledger | **Track record** | `ledger` is banned outright by the vocabulary canon |
| Signals | **What we found** | Or *evidence*. A practitioner does not say "signals" |
| Artifacts | **What was made** | Or just the thing: the spec, the diff, the design |
| Forecast | **What we expect** | Keep *forecast* internally; on screen, say the expectation |
| Verdict | **What actually happened** | Beside the expectation. That pairing is the product |
| Traces | **Activity** | |
| Evals · eval-health | **Quality** | |
| Budgets | **Spending** | |
| Delegate | **Assign** | Linear's gesture, and the word people already use |
| Drift · Impact · Stakeholder | *fold, then delete* | None survives the "would you say it out loud" test, and none is a destination under §0.5 |

**The banned list from the positioning canon still binds and is not up for renegotiation:** never
*receipts · ledger · company brain · decision layer · unattended · first run · provenance*, on any
surface. **Audit trail** and **shared brain** stay. **Approve** only where a click *unblocks*
something; **review** where it only shows you something. **Never claim accumulated learning in the
present tense.** And never write *agentic · autonomous · AI-native · orchestration · intelligence* in
product copy — show the behaviour and let the person name it. Canon:
`docs/strategy/positioning-locked-2026-08.md`, exact strings in
`docs/growth/vocabulary-change-list-2026-08.md`.

### The test, before any word ships

Read the surface out loud to someone who does not work here. **If they ask what a word means, the
word is wrong** — not their understanding.
