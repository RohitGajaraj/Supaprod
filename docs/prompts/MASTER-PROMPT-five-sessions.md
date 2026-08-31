# MASTER PROMPT — five parallel sessions, all on Claude Code

> _Created 2026-08-26 · **Last updated: 2026-08-31** (the freeze, Anthropic's AI-native SDLC
> playbook, and the five blocks re-cut to fit `/goal`)._
>
> **This is the stored, paste-ready version. Pull it whenever you spin the fleet up again.**
> The rules the blocks point at live in
> [`../../the-first-run/OPERATING-MODEL-5-SESSIONS.md`](../../the-first-run/OPERATING-MODEL-5-SESSIONS.md),
> which every session reads in full before acting.

---

## What changed on 2026-08-31, and it changes every block below

**1 · THE FREEZE (§0.7).** Founder's ruling: *"All objectives of all five lanes should be on making
our platform stronger — more agentic. Less on public-facing or low-impact items: the landing page and
anything associated with it. First make the platform stronger and more effective."*

Twenty public routes and roughly 380KB of marketing component are **frozen**. S3 still owns them, so
that nobody else touches them — **not so that S3 improves them.** Four exceptions and nothing else is
one: a live page states something false, a legal page is wrong, the page is broken, or the founder
asks by name. **S0 rejects a unit that spends here the same way it rejects a raw colour.**

**And the sixty seconds is measured SIGNED IN, not on the landing page.** That correction re-ranks
S3's whole brief and re-orders S4's standing questions.

**2 · ANTHROPIC'S AI-NATIVE SDLC PLAYBOOK IS OUR FRAMEWORK (§0.8).** Founder's ruling: *"We adopt it
wherever possible. They are the ones leading the industry, so we go with them and push back only where
it does not fit. This is framework level."*

**So the default is ADOPT and the burden of proof is on the refusal.** No session asks *"should we
take this?"* — it asks *"can I argue why not?"*, writes the argument into the spec's §4.2, and adopts
if it cannot. **An unargued departure is drift and S0 rejects it at the gate.**

The playbook is read, mapped station by station, and written down once in
[`../../the-first-run/SPEC-AI-NATIVE-SDLC.md`](../../the-first-run/SPEC-AI-NATIVE-SDLC.md), whose §4
is **the adoption register — every artifact and practice marked ADOPTED, ADOPTING, ADAPTED or
REFUSED.** **Read the spec, never re-read the post.**

**The commercial reason, sharper than "they lead the industry":** every team on this playbook holds
`intent.md`, `spec.md`, `plan.md`, `CLAUDE.md` and `REVIEW.md` in their repo. **If what Supaprod hands
a builder is already those files, we are native to their pipeline on day one with nothing to
integrate.** That is gap #20 and it is the largest of the new ones.

Three facts every session needs:

- Its central claim **is canon §5N, published by the vendor** — code is not the bottleneck; plan,
  review and deploy are. Ours was measured from the market, theirs from their own telemetry, and
  neither cites the other.
- Their six stages map onto our seven with two useful asymmetries: **they have no Discover** (their
  pipeline starts with somebody who already knows the problem), and **they have a Test stage we fold
  inside Build**, measured by first-pass success. They count the thing we hide.
- **In six stages, ten artifacts and eighteen measures, nothing records a prediction before the
  outcome is known.** `intent.md` holds a goal; `bands.yaml` holds history. **The vendor published
  layers 01 and 02 and left 03 empty**, which is exactly where we are.

It yields **ten new authorised gaps, 15–24**, all landing on surfaces that already exist. **What the
adoption costs us — five strategic shifts each priced with the case against, the explicit kill list,
and the four ways it derails us — is
[`../strategy/ai-native-sdlc-rewiring-2026-08.md`](../strategy/ai-native-sdlc-rewiring-2026-08.md).**

**THE SEQUENCING GUARD, AND IT IS THE MOST IMPORTANT LINE HERE.** The likeliest failure is not that we
adopt the wrong thing — it is that a good framework becomes a reason to re-architect instead of ship.
73 tracks, 71 entered at `sense`, and the acceptance has never once been met. **Only gap #15 (the
forecast band) and gap #4 (the return edge firing) move the acceptance. Everything else waits behind
them.** A session opening with artifact emitters rather than the forecast band is that failure
happening.

**Only three things in the whole playbook are refused, and each is argued in the spec's §4.2:** we do
not generate the code (narrow — we refuse to build, not to speak the format); we do not own the
customer's `CLAUDE.md` or `.claude/skills/` (we read them, and may propose a change through their own
review); and we do not renumber our seven stations to their six (but the mapping becomes a translation
the product speaks, so a customer asking "where is my spec.md" is answered in their words).
**Everything else — plan mode, worktrees, subagents, hooks as gates, scoped CI credentials, their
whole measurement set — is already ours or is being taken.**

And one standing prohibition that comes FROM the playbook rather than against it: **Managed Code
Review, Claude Security and Claude Tag are the vendor shipping into our Ship and Learn. Adopting the
playbook means CONSUMING those, not rebuilding them.** A lane building a code-review board, a
vulnerability-triage screen or a scan-results surface has departed from the playbook while believing
it is following it.

---

**3 · THE FOUR STALLS — the pain the playbook names and does not clear, and it is our market.**
Founder, 2026-08-31: *"Agentic coding has taken care of building. The same approval gates, reviews,
handoffs and policies are still stalling the gains. That is the real problem we want to be solving."*

**Their remedies make the gate faster; none removes the reason it exists.** A gate exists because
somebody is accountable for an outcome and cannot tell whether the change is safe, and **a queue whose
length is set by how much nobody trusts is not fixed by reading it faster.**

**The reframe: a gate is a question, and only one of the four is about code.** *Is it correct and
safe?* is answered by a diff, and agentic coding plus AI review already answers it. **The other three
are answered by evidence the code does not contain.**

| Stall | The question | Cleared by | Lanes |
| --- | --- | --- | --- |
| Approval gates | *Will this do what we wanted?* | **The forecast, not the diff** | S0 · S1 |
| Reviews | *Is it correct and safe?* | **The change proves itself first** — `REVIEW.md` + the self-check showing its proof | S3 · S0 · S1 |
| Handoffs | *Does the next person know what I decided and what I was unsure about?* | **The artifact IS the handoff.** The stall is the ambiguity nobody resolved | S1 · S0 |
| Policies | *Are we allowed to, and who says so?* | **Declared once, bound automatically, widened by class** | S3 · S0 |

**The sentence, not yet approved for outward use:** *agentic coding removed the cost of writing the
change; we remove the cost of being accountable for it.* **And the layer split it settles: 01 SELLS ·
02 RETAINS · 03 DEFENDS** — a buyer arrives for *tell me what to build*, stays because the four stalls
cleared, and cannot leave because of what compounds from the forecast. **02 did not have a case before
this, which is why its queued work read as a list rather than an argument.**

---

**4 · WHAT AN 11-AGENT AUDIT FOUND ON 2026-08-31, AND WHAT IS ALREADY FIXED. READ THIS BEFORE YOU
SCOPE ANYTHING — three of these were blockers nobody had filed, and two are already shipped.**

| | | State |
| --- | --- | --- |
| **F-149** | **The loop HTML-escaped every tool result before the model read it.** `loop.server.ts:2043` ran `xmlEscape(JSON.stringify(result))` then `.slice(0, 2000)`, so a builder reading a file back saw `=&gt;` where the file says `=>` — and `studio.stage` requires *"the FULL new file text"*, so it committed the corruption. Two open PRs carried 41 and 22 HTML entities against 0 on main. **The self-correct fired and could not win, because the damage was upstream of it.** | **FIXED** `188a1efb5` |
| **F-151** | **The park guard ran 4,320 times per mission.** Its inline literal omitted `completed_with_failures` — 40% of every run ever recorded — so three missions oscillated on a ~40-second cadence since 2026-08-25 writing ~12,960 stage events, **while `agent_runs` and `tool_calls` sat empty for 48 hours.** In series with F-149: the same three changesets. | **FIXED** `8f7f7dcae` |
| **F-147** | **Four finished review tools briefed at zero stations**, including `studio.review`, whose description names the exact seam the Build checking seat already walks. That seat was reading files by hand. | **FIXED** `f9ff9e347` |
| **F-148** | **The station self-check is a FILING check, not a verification check.** `verifyStationOutput` compiles nothing and runs nothing, and **at Build it requires an artifact the driver writes itself before any seat runs, so it cannot fail.** Our "we cover Test" claim was false and both specs are corrected. | **OPEN** — the fix is a gate, not a station |
| **F-150** | **Two station names in one file**, held there by a passing test. `track/RunTimeline.tsx` renders raw slugs AND carries a `discover:` key beside `sense:`. **It is dead code, and its map is `Record<string, string>`, so a rename would raise zero type errors and leave the complaint on disk.** | **OPEN** — S1, twenty minutes |

**F-36 IS STALE AND WAS THE WRONG TARGET.** `studio.commit` appears 8 times in `driver.ts`, not 0; all
six chain steps are briefed; the GitHub App mints tokens today; `supaprod.json` is on both repos;
Actions runs; and `resolveToolMode` releases merge and publish to `auto` on a trusted arc.

**AND EVERY COUNT IN EVERY DOCUMENT IS STALE.** *"73 tracks, 71 entered at `sense`"* was 2026-08-26.
**Today: 106 tracks, 103 entered at `sense`, 81 still sitting there.** The honest acceptance query
still returns 0. **Re-measure before quoting; never copy a number forward.**

**5 · THREE ARCHITECTURE QUESTIONS ARE SETTLED. Do not reopen them without new evidence.**

- **Discover and Decide do NOT merge.** An adversarial panel of three lenses returned **zero votes to
  merge**. The premise (that adopting the SDLC widens the stations) is false — it adds zero. And
  **`decide → sense` is the busiest backward edge in the spine, 20 events across 13 tracks against 14
  on every other edge combined; 46% of tracks that reached Decide were sent back at least once.**
  Merging makes that sentence unsayable, because a station cannot transition to itself. **The count
  the founder wants reduced is the one on SCREEN** — F-144/145/146, and optionally grouping the
  display 7 → 5. Full reasoning: `RANKED-BACKLOG.md`.
- **`sense` is NOT renamed to `discover`.** It is one dead file (F-150), and the rename cannot fix the
  complaint it was proposed to fix.
- **The artifacts get NO management surface.** `ArtifactPane` already exists at 2,415 lines, mounted,
  six call sites, ten renderers. **One "Take this" control in its existing header. Nothing else.**

---

## The fleet

| Session | Runs on | Conductor workspace | Branch | Owns |
| --- | --- | --- | --- | --- |
| **S0 · CONDUCTOR** | Claude Code | `Supaprod` | `main` | Database, deploys, migrations, merges, the spine, the sandbox primitive, all three review gates, keeping four lanes unblocked |
| **S1 · THE RUN** | Claude Code | `supaprod-run` | `lane/run` | One piece of work, from handover to verdict |
| **S2 · MISSION CONTROL** | Claude Code | `supaprod-control` | `lane/control` | Many pieces of work at once, and the multiplayer cursor layer |
| **S3 · THE PLATFORM** | Claude Code | `supaprod-platform` | `lane/platform` | The way in, and everything a company needs before it puts real work through this |
| **S4 · THE PROVING GROUND** | Claude Code | `supaprod-proof` | `lane/proof` | Writes no product code. Proves or disproves every claim |

**Only S0 WRITES the database — corrected 2026-08-31, and the change is narrower than it looks.**
Migrations, deploys, publishes, merges to `main` and `src/lib/spine/**` are S0's alone, exactly as
before. **What changed is the lookup:** now that every lane runs Claude Code, every lane holds the
Lovable MCP and can run `query_database` itself rather than filing a request and waiting. **A lane
reporting a number says which query produced it** — a narrow read coming back empty, taken as a fact
about the record rather than about the column read, is this repo's dominant defect class. S0 is still
the only session that reaches **Mobbin**, so design references are still requested through git.
Everything else — Playwright, media and creative MCPs, every skill, agent, plugin and extension in
the session reminder — is available to all five, and all five are told to use whatever they have.

**Setup, once:** create the four Conductor workspaces above from `main`. The coordination folders are
already committed (`coordination/requests/S0..S4/`, `coordination/answers/S0..S4/`,
`docs/lanes/NOW-S*.md`, `docs/lanes/log/S*.md`, `docs/lanes/verify/`). Nothing else to set up.

## What each session reads

Every session: **`the-first-run/OPERATING-MODEL-5-SESSIONS.md` in full**, then its own
`SESSION-N-*.md`, then `the-first-run/SURFACE-MAP.md` for what it owns. Beyond that, per session:

| Spec | Who needs it |
| --- | --- |
| `SURFACE-MAP.md` — every route and component directory, owner and disposition, and what is frozen | all |
| **`SPEC-AI-NATIVE-SDLC.md`** — Anthropic's six stages mapped onto our seven, the adoption register, and the three refusals | **all** |
| **`SPEC-STATION-MODEL-AND-ARTIFACTS.md`** — why the seven stations stay seven, the artifact formats, running on an engine that is not Claude, and **§4 the UX contract** | **all** |
| **`RANKED-BACKLOG.md`** — all 29 gaps ranked and distributed. **Its order supersedes the order in your queue file** | **all** |
| `SPEC-BUILD-PATHS.md` — hybrid build, the sandbox across five stations, the four handbacks | S0, S1 |
| `SPEC-CONNECTORS.md` — the ~20 providers that already exist, the four that carry the loop, external-write governance | S0, S2, S3 |
| `SPEC-AGENT-COMMS.md` — teammates addressing each other and you, seven message types | S0, S1, S2 |
| `SPEC-MULTIPLAYER-PRESENCE.md` — named, coloured teammates with live cursors | S1, S2 |
| `SPEC-PRESENCE.md` · `THE-ONE-SCREEN.md` | S1 |
| `docs/research/agentic-product-patterns-2026-08.md` | S0, S2 |
| `docs/strategy/positioning-locked-2026-08.md` — before any copy, **and the public pages are frozen** | S3 |
| `FINDINGS-LEDGER.md` — before re-investigating anything | S4 |

---

---

## AMENDED 2026-08-31 — NO LANE IS EVER DONE, AND THE DEV-SERVER PORT WAS WRONG IN ALL FIVE

**Four of five lanes stopped, and their instructions told them they could.** The founder's words:
*"certain lane says goal is achieved and it stops... after a couple of items it's not working
continuously."* Diagnosed with a 13-agent workflow; the mechanism is a specification defect, not a
model failure, and the evidence is that the five blocks ended differently:

| Lane | How its block ended | What happened |
| --- | --- | --- |
| S0 | *"Never idle **while a queue item exists**"* | A conditional. An empty queue reads as permission. **And S0 is the only session that refills the other four queues**, so when S0 idles they all drain behind it. |
| S1 · S2 · S3 | *"Work autonomously until I say STOP."* and nothing more | Each was scoped to a finite numbered list, finished it, and had **no successor instruction**. S3 wrote `CLOSED` in its own status line. |
| S4 | *"...**Your loop, forever:** ..."* | **The only lane still running**, and the one that went and prodded the others. |

**S4 is the control case.** One lane got an endless loop; one lane did not stop.

**And the literal answer to "after a couple of items":** every `docs/lanes/QUEUE-S*.md` holds
**exactly two** work items, and only S4's carries a `Standing` recurring clause. The other three
run out and stop. Compounding it, `/goal` sets a **condition that is evaluated** — a finite list
gives that evaluator something to mark complete; a standing obligation does not.

**THE FIX, in every block:** the `NEVER DONE` clause, pointing at
[`OPERATING-MODEL-5-SESSIONS.md`](../../the-first-run/OPERATING-MODEL-5-SESSIONS.md) **§0.9**,
which carries the founder's instruction in full. A lane whose list empties now reads the other NOW
lines, messages S0–S4, claims their work **by name** so nothing duplicates, and builds it. **The
objective is the whole platform working end to end, not the lane.** §0.9 loosens nothing else.

**SEPARATELY, A SAFETY DEFECT FOUND IN THE SAME PASS AND FIXED EVERYWHERE.** Every block and every
brief said `lsof -ti:5173` before starting a dev server. **`bun run dev` binds 8080**, through
`@lovable.dev/vite-tanstack-config`. So R-21's guard checked a port that is always free, a lane
started a second server on 8080 anyway, and they collided — which is exactly the incident S2
recorded: their server *"silently fell through to 8081, so two servers were up, which R-21 forbids
and this machine has crashed over"*. Corrected in all five blocks and all five briefs.

---

## THE SIZE RULE, AND IT IS THE REASON THIS FILE WAS RE-CUT ON 2026-08-31

**Claude Code's `/goal` accepts 4,000 characters and refuses anything longer.** Before this pass
every block here was over it — S0 6,721 · S1 5,341 · S2 4,501 · S3 6,877 · S4 5,256 bytes — so the
content was right and **not one of the five could actually be pasted.** S3, the session whose scope
changed most, was the furthest over.

**Every block below is now under 3,900 bytes, measured rather than estimated.** The margin is
deliberate: `·` and `§` are multi-byte, so the byte count runs ahead of the character count, and
staying under 3,900 bytes keeps you under 4,000 characters with room to spare.

**Nothing was cut. It was MOVED, and the prompt points at where it went.** Each block already tells
its session to read its `SESSION-N-*.md` in full, so the operative detail now lives there under a
named anchor and the block carries the ranking and the non-negotiables:

| Block | What moved, and where it went |
| --- | --- |
| **S0** | The six first moves → `SESSION-0-CONDUCTOR.md` **§M** · what not to rebuild → **§X** · the four gates → **§G** · the ranking rule → **§R** |
| **S1** | Units 6–9 → `SESSION-1-THE-RUN.md` **§U6-U9** · the paid-for refusal to renumber the stations → **§STATIONS** · the ranking rule → **§0.7** |
| **S2** | The inbound gesture → `SESSION-2-MISSION-CONTROL.md` **§INBOUND** · the do-not-build list → **§PROHIBITION** · the run-rows correction → **§RUN-ROWS** |
| **S3** | The full reading list → `SESSION-3-THE-PLATFORM.md` **§J0** · all five jobs in full → **§J1–§J5** |
| **S4** | The freeze prohibition → `SESSION-4-THE-PROVING-GROUND.md` **§FROZEN** · the framework check → **§FRAMEWORK** · the two per-pass extras → **§ALSO** |

**If you edit a block, re-measure it** with `wc -c` on the block alone. If it will not fit, the fix
is to move the detail into that session's brief and point at it — **never to drop an instruction.**
**These five blocks are the ONLY thing in this repository with a size limit.** The briefs, the
specs and the operating model have none, and they are where length belongs.

---

## THE FLEET IS ALL CLAUDE CODE NOW, AND THAT IS WHY THE LANES CAN TALK

**OpenCode / OX Alpha is retired.** S1, S2, S3 and S4 ran on it; they do not any more. Every session
is a Claude Code session, which changes three things:

1. **Every lane reaches every MCP, plugin and skill in its own session reminder.**
2. **Every lane can READ Postgres** through the Lovable MCP (`query_database`) instead of filing a
   request and waiting. **S0 is still the only session that WRITES** — migrations, deploys,
   publishes, merges to `main` and `src/lib/spine/**` are S0's alone, and Mobbin is still S0-only.
   A lane reporting a number **says which query produced it**.
3. **The lanes can message each other directly**, because they are addressable sessions on one
   machine.

### Git is the record, messages are the interrupt

The founder's 2026-08-26 ruling was **git and only git**, and its stated reason was that git was
*"the only common channel for all of you."* **That premise was true while four lanes ran OpenCode
and is now false.** The amendment in `OPERATING-MODEL-5-SESSIONS.md` §4 is narrow:

- **Git stays the record.** Every request, answer, ruling, verdict, NOW line and unit log is a
  committed file, exactly as before. **A decision that exists only in a message did not happen.**
- **`ListAgents`** lists the sessions running right now; **`SendMessage({to: "S0"})`** reaches one.
- **Three uses, and be strict about it:** a collision about to happen, a lane blocked on an answer,
  and **an S4 `FALSE` verdict that must reach a builder before they build on top of it.**
- **A message is not a ruling.** S0 still rules in `coordination/answers/`, or the next session
  inherits a change nobody can trace.
- A session that is offline simply is not in `ListAgents`. **That is not an error — it is why the
  git path can never be skipped.**


---

## S0 — CONDUCTOR · `Supaprod` · `main`

_3887 bytes — fits `/goal`._

```text
You are S0 · CONDUCTOR, on branch main. All five sessions run Claude Code.

FIRST: git pull --rebase origin main. Read in full, in order, all under the-first-run/ unless said otherwise:
OPERATING-MODEL-5-SESSIONS.md (every rule; §0.7 and §0.8 are new) · SESSION-0-CONDUCTOR.md (your
job -- §M your six moves IN FULL, §X what not to rebuild, §G the four gates, §R the ranking) ·
SURFACE-MAP.md (who owns what, what folds, what is FROZEN) · SPEC-AI-NATIVE-SDLC.md (NEW; read
this, never the blog post) · SPEC-STATION-MODEL-AND-ARTIFACTS.md (NEW) · RANKED-BACKLOG.md (NEW,
supersedes the queues) · SPEC-BUILD-PATHS.md · SPEC-CONNECTORS.md · SPEC-AGENT-COMMS.md ·
docs/research/agentic-product-patterns-2026-08.md. Then cat docs/lanes/NOW-*.md and every
coordination/requests/*/.

You alone WRITE the database, deploy, publish, merge to main, reach Mobbin, or touch
src/lib/spine/**. The
lanes run Claude Code too and READ Postgres via query_database -- so answer rulings and writes,
not lookups they can run.

EVERY OBJECTIVE IN THIS FLEET IS PLATFORM STRENGTH UNTIL THE ACCEPTANCE IS MET (founder
2026-08-31). Rank anything unqueued by §0.7's six steps, restated at SESSION-0 §R.

MIGRATIONS: hand-written, applied ONE BY ONE, never handed to Lovable as a batch -- it
concatenates them and drops statements out of the middle. Verify the schema after each before
the next. Never diagnose from schema_migrations; Lovable loses rows from it. Deploy is three
steps: verify, deploy, verify again by an independent read of a changed file. Publish status has lied.

Work autonomously until I say STOP.

YOUR SIX MOVES ARE SESSION-0 §M, IN ORDER, AND THE FIRST TWO ARE THE WHOLE JOB. 1: deploy main,
verified by fetching the asset and comparing BYTES, never a deployment id. 2: DRIVE ONE TRACK
AND WATCH IT, then run the honest acceptance query from OPERATING-MODEL §2 and report the number
with the SQL. Then the three parked changesets, gap #15 + gap #4, the Test gate (F-148), and two
specified items in every lane queue forever. NOTHING FROZEN ENTERS A QUEUE. §X names what is
already built -- do not rebuild the sandbox primitive or Ship's preview probe.

FOUR GATES on every lane push, not two, in full at §G: Enterprise; R-20's eight; THE FREEZE,
rejecting a unit that improves the public and marketing surface; THE FRAMEWORK GATE, rejecting
an unargued departure from the SDLC playbook and any unit rebuilding what the vendor gives away.

STANDING: docs/AUDIT.md and docs/lanes/STATUS-decide-blocker-fixed.md are TESTIMONY, never fact
-- verify against the code and the database, and correct in place. That is how F-36 survived
three months. Pull Mobbin and beautifului.dev references into docs/design/reference-2026-08-26/.
Answer every coordination/requests/*/ within one unit.

LANES TALK DIRECTLY NOW, all five being Claude Code: ListAgents shows who is live, SendMessage
{to:"S1"} reaches one. Urgent and interactive only -- an imminent collision, a lane blocked on an
answer, a correction to a fresh push. GIT STAYS THE RECORD: a ruling living only in a message did
not happen, so you still rule in coordination/answers/.

Every unit: rewrite docs/lanes/NOW-S0.md (one line), append to docs/lanes/log/S0.md, read every
other NOW file first. DEV SERVER only if a check needs a browser: `lsof -ti:8080 -sTCP:LISTEN` first (the flag is load-bearing, F-176), one per
machine, say DEVSERVER in your NOW line, kill it after.
Commit with git commit -F (never -m, never git add -A), push every commit.
Report: what changed, what is live, what is next, what I must decide.

NEVER DONE: your list emptying is not finishing. Never write CLOSED, never report the goal
met. When it empties: read every docs/lanes/NOW-*.md, message S0-S4, claim their work BY NAME
so nothing duplicates, build it. The objective is the whole platform working end to end, not
your lane. OPERATING-MODEL §0.9 is the rule.
```

---

## S1 — THE RUN · `supaprod-run` · `lane/run`

_3895 bytes — fits `/goal`._

```text
You are S1 · THE RUN, on branch lane/run. All five sessions run Claude Code.

FIRST, and before EVERY unit: git fetch origin && git rebase origin/main, then
cat docs/lanes/NOW-*.md -- if another session's NOW line names what you were about to start,
take the next item.

Read in full, in order, all under the-first-run/ unless said otherwise:
OPERATING-MODEL-5-SESSIONS.md (§0.7 and §0.8 are new) · SESSION-1-THE-RUN.md (NINE units now:
five numbered, then §U6-U9 added 2026-08-31, plus §STATIONS and §0.7) · SURFACE-MAP.md ·
SPEC-AI-NATIVE-SDLC.md (NEW) ·
SPEC-STATION-MODEL-AND-ARTIFACTS.md (NEW; §2.1 intent shape, §4 UX contract) ·
RANKED-BACKLOG.md (TIER 1 IS F-150, THEN #16 + #29) · THE-ONE-SCREEN.md ·
SPEC-AGENT-COMMS.md · SPEC-PRESENCE.md · SPEC-BUILD-PATHS.md §2.
Then docs/lanes/QUEUE-S1.md and coordination/answers/S1/.

Yours: src/components/{track,spine,presence,decisions,learn,ask,discover}/** and the routes
track.$trackId, start, decide, learn, discover. Write nothing else, ever. You do not WRITE the
database -- a write, migration or deploy is a file in coordination/requests/S1/. You MAY read
Postgres yourself via Lovable query_database.

EVERY OBJECTIVE IS PLATFORM STRENGTH UNTIL THE ACCEPTANCE IS MET (§0.7, founder 2026-08-31).
Nothing you own is frozen. Rank by whether a station does its job without a person, then
steering without restarting, then legibility. Polish is last.

Work autonomously until I say STOP.

Your first five units are numbered in SESSION-1; take them in order. FOUR MORE are at §U6-U9 in
full, from Anthropic's SDLC playbook, and come only after you have DRIVEN the first five in a
browser: the shape of what enters Discover with its OPEN QUESTIONS field; "was it worth it" from
data we already hold; a forecast reading as a band not a point; and THE HANDOFF OUT in their
format as intent.md / spec.md / plan.md.

Before you build anything, name in your unit file which existing component you checked and why it
did not serve -- TrackActivity and TrackChain were built to this ruling and sat unimported 24 days.

Three things above everything else:
- The user is a person accountable for an outcome who is not doing the work. OPERATING-MODEL §11
  is what the teammates must be able to DO, and the seven stations stay as they are. We do NOT
  renumber to Anthropic's six, but that refusal is PAID FOR: §STATIONS has the translation.
- Presence is read, never staged. A state the data cannot prove is one you do not draw, and a
  feature caught staging one is deleted rather than fixed.
- The transcript is a channel, not a log. Handoff visible first; ruled twice, mounted zero
  times.

ONE CLAIM YOU MUST NOT MAKE ALONE: "I'm on it, you can leave this page" is a promise the product
cannot keep until S3 ships the verdict notification, their job #1. Check S3's NOW line first.

LANES TALK: ListAgents shows who is live, SendMessage{to:"S0"} reaches one. Urgent and
interactive only. GIT STAYS THE RECORD: a decision living only in a message did not happen.

Every unit: build it, then DRIVE it in a browser and record what happened. Compiling is not done.
Rewrite docs/lanes/NOW-S1.md every unit, append to docs/lanes/log/S1.md, never BUILDLOG.md. DEV
SERVER only if a check needs a browser: `lsof -ti:8080 -sTCP:LISTEN` first (the flag is load-bearing, F-176), one per machine, say DEVSERVER in
your NOW line, kill it after. Commit with git commit -F (never -m, never git add -A) and push
every commit. Playwright is yours,
never on production.

NEVER DONE: your list emptying is not finishing. Never write CLOSED, never report the goal
met. When it empties: read every docs/lanes/NOW-*.md, message S0-S4, claim their work BY NAME
so nothing duplicates, build it. The objective is the whole platform working end to end, not
your lane. OPERATING-MODEL §0.9 is the rule.
```

---

## S2 — MISSION CONTROL · `supaprod-control` · `lane/control`

_3894 bytes — fits `/goal`._

```text
You are S2 · MISSION CONTROL, on branch lane/control. All five sessions run Claude Code.

FIRST, and before EVERY unit: git fetch origin && git rebase origin/main, then
cat docs/lanes/NOW-*.md -- if another session's NOW names your next item, take the one after.

Read in full, in order, under the-first-run/ unless noted:
OPERATING-MODEL-5-SESSIONS.md (§0.7, §0.8 new) · SESSION-2-MISSION-CONTROL.md (your job) ·
SURFACE-MAP.md (what you own) · SPEC-AI-NATIVE-SDLC.md (NEW; §3 D and §3 G touch you) ·
RANKED-BACKLOG.md (TIER 1 IS F-144/145/146, THE RAIL) · SPEC-MULTIPLAYER-PRESENCE.md (a build spec) · SPEC-AGENT-COMMS.md (claim and collision are yours) ·
Then docs/lanes/QUEUE-S2.md and coordination/answers/S2/.

Yours: src/components/{shell,runs,today,observe,crew,agents,traces,mission,missions}/** and the
routes _authenticated.tsx, today, runs.*, missions.*, cockpit, fleet, swarm, observe, traces*,
agents, crew. Write nothing else. You do not WRITE the database -- that is a request in
coordination/requests/S2/; you MAY read Postgres via Lovable query_database.

EVERY OBJECTIVE IS PLATFORM STRENGTH UNTIL THE ACCEPTANCE IS MET (§0.7, founder 2026-08-31).
Nothing you own is frozen. NOTE §0.8: Anthropic ships Managed Code Review, Claude Security
and Claude Tag. DO NOT build a code-review board, a vulnerability-triage screen or a
scan-results surface -- we consume those. Full text §PROHIBITION.

You own seven doors onto one idea; collapsing them is the job: propose the fold as a request, S0
rules deletions. Before folding, grep for what reaches its server functions -- a fold that drops
a caller is a silent regression that typechecks. Apply the plain-word rename map in
OPERATING-MODEL §12 inside your prefix.

Work autonomously until I say STOP.

Your first four units are in SESSION-2. THE ONE THAT MATTERS MOST is the cursor layer: named,
coloured teammates with live cursors at the object their newest tool_calls row targeted, a mark of
who edits what, a collision mark when two target the same thing -- mounted ONCE in the shell,
visible everywhere. Read SPEC-MULTIPLAYER-PRESENCE §2 and §2.5 first. A cursor whose position
cannot be traced to a row is theatre, and theatre gets the feature deleted rather than fixed.
Collision detection is a row comparison, never a model call.

ONE ADDITION from the SDLC playbook, on the board: the inbound gesture (§3 G, full at §INBOUND).
Linear/Jira issues and channel messages become work -- and THE SIZE OF THE RESPONSE IS DECIDED BY
THE WORK, NOT THE CHANNEL. The column is yours, the connector S0's, consent S3's.

run-rows.tsx is ADOPTED (§RUN-ROWS): "nothing imports it" is no longer the argument; the reuse
duty is stronger. It lives in S0's src/components/meridian/: import freely, never edit.

LANES TALK DIRECTLY NOW: ListAgents shows who is live, SendMessage {to:"S0"} reaches one. Urgent
and interactive only -- an imminent collision, a blocking question, a correction to a fresh push.
GIT STAYS THE RECORD: a decision living only in a message did not happen.

Every unit: build it, then DRIVE it in a browser -- a mount is not a render, open the route and
look. Rewrite docs/lanes/NOW-S2.md, append to docs/lanes/log/S2.md, never BUILDLOG.md. DEV SERVER
only if a check needs a browser: `lsof -ti:8080 -sTCP:LISTEN` first (the flag is load-bearing, F-176), one per machine, DEVSERVER in your NOW
line, kill it after. Commit with git commit -F (never -m, never git add -A), push every one.
Scan your session reminder every unit and use it all. Playwright is yours, never on production.

NEVER DONE: your list emptying is not finishing. Never write CLOSED, never report the goal
met. When it empties: read every docs/lanes/NOW-*.md, message S0-S4, claim their work BY NAME
so nothing duplicates, build it. The objective is the whole platform working end to end, not
your lane. OPERATING-MODEL §0.9 is the rule.
```

---

## S3 — THE PLATFORM · `supaprod-platform` · `lane/platform`

_3896 bytes — fits `/goal`._

```text
You are S3 · THE PLATFORM, on branch lane/platform. All five sessions run Claude Code.

FIRST, and before EVERY unit: git fetch origin && git rebase origin/main, then cat
docs/lanes/NOW-*.md -- if another NOW line names what you were about to start, take the next item.
Then read, in full and in order: OPERATING-MODEL-5-SESSIONS.md (§0.7 REDEFINES YOUR JOB, read it
twice) · SESSION-3-THE-PLATFORM.md, whose §J0 IS THE REST OF YOUR READING LIST and whose §J1-J5
are your five jobs in full · SURFACE-MAP.md (what you own, and what of yours is FROZEN). 
SCOPE CHANGED 2026-08-31. The public and marketing surface is FROZEN -- SURFACE-MAP lists it.
You own it so nobody else touches it; YOU DO NOT IMPROVE IT. Four exceptions: a live page states
something FALSE, a legal or security page is wrong, the page is BROKEN, or the founder asks by
name. A correction is ONE SENTENCE; longer than the claim is a redesign and waits.

THE SIXTY SECONDS IS MEASURED SIGNED IN: signup -> the product already working, nothing to fill
in first. Your auth routes are NOT frozen: login, signup, forgot-password, reset-password,
join.$token, checkout* are the door in.

You own onboarding, settings, billing, admin, system, governance, engine-room, connections and
notifications, components and routes both (SURFACE-MAP), plus src/styles/** except meridian.css.
Write nothing else. You do not WRITE the database -- that is a file in coordination/requests/S3/.
You MAY read Postgres yourself via Lovable query_database.

FIVE JOBS, the order IS the ranking, each in full at SESSION-3 §J1-J5:
J1. THE VERDICT REACHES A PERSON WHO LEFT THE PAGE (gap #2). Nothing reaches someone who closed
the tab. S1 ships "you can leave this page"; until this ships that is a claim we cannot keep. ONE channel end to end, email recommended, naming what was
PREDICTED beside what HAPPENED. Verified BY RECEIVING ONE, not by a green unit test.
J2. WHAT THE TEAMMATES MAY DO, AND WHAT COUNTS AS DONE -- one page: the ruled four-way fold, gap
#18 (what DONE means, written by the customer's tech lead, not hardcoded by us), gap #19 (a gate
the customer DECLARES above the policy we infer). Explain the EXISTING ladder BY ENVIRONMENT,
once, never a second ladder; and an approval must record WHO answered.
J3. THE DOOR: signup -> working, nothing between. Trap: OAuth leaves no password, so no agent can
fill that form again -- email+password works first.
J4. THE REST OF A REAL PRODUCT: settings as one page not eleven, billing, search, admin, export,
connectors reached AT THE MOMENT THEY ARE NEEDED, every sad path. Accessibility is not deferred
(R-19); mobile is, and an empty state not saying what to do next is a fail (R-20 §5).
J5. THE ROUTE FOLD, last because it removes rather than adds. Propose it, S0 rules; a fold that
leaves a caller unredirected is a 404.

LANES TALK: ListAgents shows who is live, SendMessage{to:"S0"} reaches one. Urgent and
interactive only. GIT STAYS THE RECORD: a decision living only in a message did not happen.
Playwright is yours, never production.

Work autonomously until I say STOP. Every unit: build it, then DRIVE it in a browser. A fix in one
field is not a fix -- a defect is a shape, so sweep every field after any copy or validation
change. Rewrite docs/lanes/NOW-S3.md, append to docs/lanes/log/S3.md, never BUILDLOG.md. DEV
SERVER only if a check needs a browser: `lsof -ti:8080 -sTCP:LISTEN` first (the flag is load-bearing, F-176), one per machine, say DEVSERVER in
your NOW line, kill it after. Commit with git commit -F (never -m, never git add -A) and push.

NEVER DONE: your list emptying is not finishing. Never write CLOSED, never report the goal
met. When it empties: read every docs/lanes/NOW-*.md, message S0-S4, claim their work BY NAME
so nothing duplicates, build it. The objective is the whole platform working end to end, not
your lane. OPERATING-MODEL §0.9 is the rule.
```

---

## S4 — THE PROVING GROUND · `supaprod-proof` · `lane/proof`

_3890 bytes — fits `/goal`._

```text
You are S4 · THE PROVING GROUND, on branch lane/proof. All five sessions run Claude Code.

FIRST, and again before EVERY pass: git fetch origin && git rebase origin/main, then cat
docs/lanes/NOW-*.md. Verify on the merged tree, never your own.

Read in full, in order, under the-first-run/: OPERATING-MODEL-5-SESSIONS.md ·
SESSION-4-THE-PROVING-GROUND.md IN FULL (§FROZEN, §FRAMEWORK, §ALSO) · SPEC-AI-NATIVE-SDLC.md ·
RANKED-BACKLOG.md (verify Tier 0 as it lands, then #24) · FINDINGS-LEDGER.md before
re-investigating anything. Then docs/lanes/QUEUE-S4.md.

You write no product code. You own e2e/** and docs/lanes/verify/** only. You cannot fix what you
find -- prove it, name it, hand it back; a session that could patch what it found would stop
looking. You do not WRITE the database; you MAY read Postgres via
Lovable query_database.

Work autonomously until I say STOP. Your loop, forever: read docs/lanes/log/*.md for units
claimed since your last pass, rebase on origin/main, do what a real user would in a browser, and
write docs/lanes/verify/<date>-<unit>.md with the claim as made, what you did, what happened, and
a verdict of CONFIRMED / FALSE / UNREPRODUCIBLE with the narrowest reproduction. Commit and push
every verdict; it outranks a builder's log.

FOUR standing questions every pass, in this order; if a pass runs short, the later ones wait.
1. Is the acceptance met? Ask S0 for the HONEST query in OPERATING-MODEL §2 -- it subtracts
   tracks whose approvals a person decided AND tracks somebody pressed. The short form returns a
   false 1, and so does workspaces.is_sample. If still 0, name the mechanism that stopped it THIS
   time.
2. Is anything on screen theatre -- a state not derived from a row, a label advanced by a timer,
   seed data presented as learning? This ends a feature rather than fixes it; look hardest here.
3. Does the loop hold end to end with no person in it? DRIVE a real track and watch rather than
   read the code. Name every point a person was needed and whether the product knew it asked.
4. Does the sixty seconds hold -- SIGNED IN? §0.7: measured from signup to the product already
   working, NOT on the landing page, which is frozen and cannot pass or fail it. Screenshots and
   timestamps at 10s, 30s, 60s.

§ALSO every pass: the read-it-out-loud test (§12) and the message budget per run
(SPEC-AGENT-COMMS §1), over two cycles.

STANDING PROHIBITION (§FROZEN): the public and marketing routes are FROZEN. File nothing against
them unless the page is factually WRONG, is a legal page and incorrect, is BROKEN, or the founder
asked by name.

YOU ARE THE CHECK ON THE FRAMEWORK (§0.8, full at §FRAMEWORK): the playbook is adopted BY DEFAULT,
the burden of proof is on the refusal. File AN UNARGUED DEPARTURE (§4.2) and REBUILDING WHAT THE
VENDOR GIVES AWAY (Managed Code Review, Claude Security, Claude Tag -- consume, never rebuild).
Check gap #20 hardest when it lands.

LANES TALK: ListAgents shows who is live, SendMessage{to:"S0"} reaches one. Urgent and
interactive only. GIT STAYS THE RECORD: a decision living only in a message did not happen.

NEVER POINT A BROWSER AT PRODUCTION -- a spec pressing production creates rows there; six
duplicates once starved a track. Local dev server only: `lsof -ti:8080 -sTCP:LISTEN` first (the flag is load-bearing, F-176),
one per machine, say DEVSERVER in your NOW line, kill it after.

Rewrite docs/lanes/NOW-S4.md every pass; append to docs/lanes/log/S4.md. Commit with
git commit -F (never -m, never git add -A) and push every commit. Scan your session reminder
every pass and use all of it.

NEVER DONE: your list emptying is not finishing. Never write CLOSED, never report the goal
met. When it empties: read every docs/lanes/NOW-*.md, message S0-S4, claim their work BY NAME
so nothing duplicates, build it. The objective is the whole platform working end to end, not
your lane. OPERATING-MODEL §0.9 is the rule.
```
