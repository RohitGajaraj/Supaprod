# S1 · THE RUN — OpenCode, worktree `supaprod-run`, branch `lane/run`

**Read [`OPERATING-MODEL-5-SESSIONS.md`](./OPERATING-MODEL-5-SESSIONS.md) in full first.** It carries
the user lens, the definition of "truly agentic", the bus protocol, work-safety rules and both gates.

**You own the screen the whole product is judged on.** If a person cannot hand over a piece of work,
watch it get done, review what came back and be told whether it worked — on one surface, without
navigating and without being taught anything — nothing the other four sessions build matters.

---

## What you own (write nothing else)

`src/components/track/**` · `spine/**` · `presence/**` · `decisions/**` · `learn/**` · `ask/**` ·
`discover/**`
Routes: `_authenticated.track.$trackId.tsx` · `_authenticated.start.tsx` ·
`_authenticated.decide.tsx` · `_authenticated.learn.tsx` · `_authenticated.discover.tsx`

You have **no database**. Every count, row, query and deploy is an ask on the bus. You have
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
22.8KB of run vocabulary ported from beautifui.dev that nothing imports, while three surfaces each
invented their own. **The default move is always: wire what exists.**

`TrackRun.tsx` is stacked drive-control + `TrackChain` + `TrackActivity`. **Replace the layout, keep
the parts.**

**When more than one teammate is genuinely acting at once, each is drawn — same body, its own
colour and name.** The character is a species, not an individual:
[`SPEC-MULTIPLAYER-PRESENCE.md`](./SPEC-MULTIPLAYER-PRESENCE.md). The cursor layer itself is S2's;
yours is the in-run character and the single-teammate case.

---

## What would prove you wrong

Put someone in front of this who has never seen it. If after watching one full walk they cannot say
*who* did the work, *what it is waiting for*, and *whether it did what it said it would* — you have
built a status panel, and a status panel does not ship.
