# S1 · THE RUN — OpenCode, worktree `supaprod-run`, branch `lane/run`

**Read [`OPERATING-MODEL-5-SESSIONS.md`](./OPERATING-MODEL-5-SESSIONS.md) in full first.** It carries
the user lens, the definition of "truly agentic", the git-only coordination protocol, work-safety
rules and both gates. Then read [`SURFACE-MAP.md`](./SURFACE-MAP.md) for every route you own and what
happens to it.

**You own the screen the whole product is judged on.** If a person cannot hand over a piece of work,
watch it get done, review what came back and be told whether it worked — on one surface, without
navigating and without being taught anything — nothing the other four sessions build matters.

---

## What you own (write nothing else)

`src/components/track/**` · `spine/**` · `presence/**` · `decisions/**` · `learn/**` · `ask/**` ·
`discover/**`
Routes: `_authenticated.track.$trackId.tsx` · `_authenticated.start.tsx` ·
`_authenticated.decide.tsx` · `_authenticated.learn.tsx` · `_authenticated.discover.tsx`

You have **no database**. Every count, row, query and deploy is a request file in coordination/requests/<you>/. You have
Playwright, every skill and plugin in your session, and the whole repo to read.

---

## The shape, already ruled — do not redesign it, finish it

`THE-ONE-SCREEN.md` is the architecture and `RULINGS.md` R-13 settled the left pane.

```
┌────────────────────────────────┬──────────────────────────────────────┐
│  LEFT — the transcript         │  RIGHT — the thing that exists NOW   │
│  what it just did, in order    │  rendered as itself, not as a list   │
│  what it produced, inline      │  every control that changes it       │
│  the one question, in place    │  sits ON it                          │
│  [ the composer ]              │  [ version · export · share ]        │
└────────────────────────────────┴──────────────────────────────────────┘
   footer:  what it may do right now  ·  Stop
```

Left is append-only and moves; newest last, the live entry still ticking. **A transcript, not a
progress bar** — a route that waives and reopens stations cannot honestly be drawn as a bar. The
footer carries **mode, not position**: *"Working on its own · will ask before it ships"*, never
"step 3 of 7". **Station names stay off-surface.**

Right pane, per station — what appears and what the person can do to it:
**Discover** signals arriving as cards with their real text and source, then **visibly grouping into
themes as clustering runs** — keep/discard a signal, rename a theme. *The grouping animating is the
single most convincing thing in the product, because it is the machine finding a pattern in front of
you.*
**Decide** the call, what it rests on, what was weighed against it, and **the forecast as a live
editable field** — the claim, the observable, the date. This is the commitment moment and the one
thing no competitor can reconstruct later, so it is the one moment the run deliberately slows down.
**Define** the spec section by section as it is written, non-goals with equal weight.
**Design** the surface brief, and where a prototype exists **the prototype in a frame**, not a link.
**Build** the diff file by file, checks below it each with its own state and clock.
**Ship** deploy steps with a live clock, then what went out and where.
**Learn** *"You said abandonment would drop below 22%. It is 24.1%. You were wrong."* — beside it,
what the system now believes differently. **It arrives on its own; the person does not go looking.**

---

## The five things that make this truly agentic, and your first five units

Numbered so you can take them in order. Each is one unit: build it, drive it, commit it, push it.

1. **Assign in one sentence, and it is already working before the first paint settles.** `/start`
   takes a sentence and the run opens with the character already picking it up. No project, no
   config, no connector chosen first. Antigravity required a project, measured it, and shipped the
   bypass.
2. **"I'm on it — you can leave this page."** The run must be watchable *and leavable*. Visible
   agency must not mean mandatory attendance; async is the default everywhere on the frontier. Say it
   in the product's own plain voice and make leaving safe.
3. **Steer without restarting.** One instruction back into work that is still moving —
   *"the empty state is wrong"* — taken mid-flight. Undo a step, not the run. Take a step over by
   hand and hand it back. If the only controls are Start and Stop, this is a batch job.
4. **The ask happens in place, once, and the answer covers the class.** 90 approval requests were
   raised for one internal tool since July: 42 cancelled, 38 expired, 10 pending, **zero ever
   approved** — because they went to `/approvals`, detached from the work they blocked. `TrackConsent`
   exists; make it the only place consent is ever asked.
5. **A run that stops says so, where the person is looking.** Every live track once died at the
   attempt ceiling and nothing anywhere surfaced it. A refused station is not a failed station
   (R-26): say which door is locked, and offer the next action. **No dead end, ever.**

---

## The right pane, and what runs inside it

[`SPEC-BUILD-PATHS.md`](./SPEC-BUILD-PATHS.md) §2 is yours to build the surface of. **Five of the seven
stations need something to RUN before a person can judge it**, and the ranking is by value rather than
station order: Decide's metric probe (proving the forecast's observable is readable today — without it
the verdict can never land), the Design prototype (clickable, in a frame, because the expensive mistake
here is building the wrong thing correctly), Ship's preview deploy, Discover's connector dry-run,
Learn's live verdict query, and only then Build.

**S0 builds the primitive and every probe; you build the frame, the states and the actions on the
artifact.** Two stations show the customer's own builder instead of ours — Build shows their PR and its
checks. **A sandbox is never a substitute for a designed pane**: the five stations that need nothing to
run must be as good as the ones that do.

## The transcript is a channel, not a log

[`SPEC-AGENT-COMMS.md`](./SPEC-AGENT-COMMS.md) is mostly yours. **The transcript R-13 already ruled
becomes two-way and addressed** — it adds no surface. Seven message types and no eighth: handoff, ask,
claim, challenge, escalate, broadcast.

Build in this order: **handoff made visible** (the ruling requested twice and mounted zero times — the
station transition already IS a handoff and nothing says what was handed over) · **ask to a person**,
folded into `TrackConsent` which is already shipped, not rebuilt beside it · **`@` from the composer**
with autocomplete of who is actually on this work, which is *steer without restarting* · then
**challenge**, the highest-value type, rendered quiet rather than alarming and always naming the next
action.

**It renders as a transcript entry with from- and to-chips in the teammates' colours and the artifact
inline — never a chat bubble, never an avatar row, never a timestamp gutter.** This is a record of
work and it should read like one. **Only a message addressed to the person changes the footer**, which
carries mode rather than position.

## Presence — the character, and the iron law

`SPEC-PRESENCE.md` governs. The crew becomes **one character** (working name `Supa`,
`CHARACTER_NAME` in `src/lib/presence/character.ts` — S0 owns that file, you own the component).
Fifteen seat slugs are an org chart; the user meets one worker that speaks in first person, works in
front of you, asks in place, and hands you the result.

**Presence is read, never staged.** Every visible state derives from a row that exists — `agent_runs`
in flight, the newest `tool_calls` row, `spine_tracks.last_hold`. **No timers. No scripted sequences.
No invented verbs.** This repo has already failed a branch for a timer advancing step labels. If the
reads fail, the character says it is out of touch — it never smiles on a dead feed. **A state the
data cannot prove is a state you do not draw, and a feature caught staging one is deleted rather than
fixed.**

Format is layered SVG animated on Meridian tokens — never GIF or video: a GIF cannot flip with the
theme, and it loops whether or not anything is true.

---

## Before you build anything

**Name in your unit file which existing component you checked first and why it did not serve.**
`TrackActivity` and `TrackChain` were built to a founder ruling asking for exactly "show visually
which agent is working, the handoff, the outcome, like Claude Code" — and sat with **zero importers
for 24 days** while the founder re-requested the same thing, unaware they existed. `run-rows.tsx` is
22.8KB of run vocabulary ported from beautifului.dev that nothing imports, while three surfaces each
invented their own. **The default move is always: wire what exists.**

`TrackRun.tsx` is stacked drive-control + `TrackChain` + `TrackActivity`. **Replace the layout, keep
the parts.**

**When more than one teammate is genuinely acting at once, each is drawn — same body, its own
colour and name.** The character is a species, not an individual:
[`SPEC-MULTIPLAYER-PRESENCE.md`](./SPEC-MULTIPLAYER-PRESENCE.md). The cursor layer itself is S2's;
yours is the in-run character and the single-teammate case.

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

## The craft bar

**OpenAI, Anthropic, Google, Perplexity, Vercel and Linear.** For your surfaces specifically:
Vercel for surface craft and motion, Linear for speed and keyboard-first density. **Only S0 reaches Mobbin**, so file `coordination/requests/<you>/design-<surface>.md` and S0
commits the reference into `docs/design/reference-2026-08-26/` — see `SURFACE-MAP.md`. **Never
eyeball a design; port the mechanics from a real source** (R-20 §7).

## Plain words, on every surface you touch

Operating model §12 is a law, not a copy preference: **if a person would not say the word out loud to
a colleague, it does not go on a surface.** Engine Room, guardrails, govern, boundary, cockpit,
fleet, swarm, artifacts, signals, trust ledger — all out, with the rename map in §12. The station
names (Discover, Decide, Plan, Design, Build, Ship, Learn) **stay as they are**; they are already
plain. Apply the map inside your prefix and file an ask for anything outside it. **A word renamed in
one place and left stale in another has made the problem worse.**

## Research, when you hit something you do not know

Operating model §14. **At the moment of need, by you, time-boxed to the decision you actually face —
and written down once.** Look first: `docs/research/` for market, product or design;
`docs/research/integrations/<tool>.md` for an API; `FINDINGS-LEDGER.md` before re-investigating any
defect. **If a file answers it, read it and stop.**

Need access to a tool? One line naming three things — the tool, the exact scope, what it unblocks — in
`coordination/requests/<you>/access-<tool>.md`. **S0 answers or escalates within the unit. Keep
building while you wait**, and say in your NOW line what you are waiting on.

**And whether something already exists here is not a research question — it is a grep, and it takes
thirty seconds.** About twenty connector providers, 121 Meridian components and a full MCP server are
already in this repo.

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

Put someone in front of this who has never seen it. If after watching one full walk they cannot say
*who* did the work, *what it is waiting for*, and *whether it did what it said it would* — you have
built a status panel, and a status panel does not ship.
