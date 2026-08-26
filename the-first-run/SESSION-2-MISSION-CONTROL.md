# S2 · MISSION CONTROL — OpenCode, worktree `supaprod-control`, branch `lane/control`

**Read [`OPERATING-MODEL-5-SESSIONS.md`](./OPERATING-MODEL-5-SESSIONS.md) in full first.** It carries
the user lens, the definition of "truly agentic", the bus protocol, work-safety rules and both gates.

**You own the answer to "what is my team doing right now."** S1 owns one piece of work. You own many —
several pieces of work moving at once, several AI teammates inside each, **syncing between themselves**,
and one person who has to stay on top of all of it without opening anything.

---

## What you own (write nothing else)

`src/components/shell/**` · `runs/**` · `today/**` · `observe/**` · `crew/**` · `agents/**` ·
`traces/**` · `mission/**` · `missions/**`
Routes: `_authenticated.tsx` (the shell) · `today` · `runs.*` · `missions.*` · `cockpit` · `fleet` ·
`swarm` · `observe` · `traces*` · `agents` · `crew`

You have **no database**. Every count, row and query is an ask on the bus. You have Playwright, every
skill and plugin in your session, and the whole repo to read.

**Note how many routes you own that are four names for one idea.** `cockpit`, `fleet`, `swarm`,
`observe`, `runs`, `missions`, `today` — seven doors onto "what is happening". **Your job includes
collapsing them.** Propose the fold on the bus; S0 rules on deletions.

---

## The bet: agents working in parallel, and syncing between themselves, made visible

This is the new-age property the founder is asking for, and it is not decoration — it is the reason
someone picks this over a chat box. Four things a person must get **in one glance, without clicking**:

1. **What is running.** Every piece of work in flight, what each one is doing *right now* in plain
   words, and how long it has been doing it.
2. **Who owns it.** Which teammate holds it, and which one it just came from. **The handoff is the
   event worth drawing** — a founder ruling asked for exactly this: *"show visually which agent is
   working, the handoff, the outcome, like Claude Code."* `TrackChain` was built to it and had zero
   importers for 24 days.
3. **What changed in the last minute.** Not a feed of everything — the deltas a person would have
   wanted to be interrupted for.
4. **Where two efforts are about to collide.** Amoeba's collision detection is the bar: two pieces of
   work touching the same thing, or two teammates about to redo each other's output. Their claim is
   the value line — coordinated agents **split** duplicate work instead of repeating it. **We are
   living this problem right now with five worktrees on one repo. Build the thing we wish we had.**

**And the sync itself must be legible.** When one teammate hands to the next, the person should see
what was handed over — the artifact, not the status change. When two teammates are reading the same
evidence, show that they are, once, not twice. A handoff drawn as "station changed to design" is a
status panel; a handoff drawn as *"the researcher passed 14 signals to the namer"* is the product.

---

## The mechanics to port, and where each comes from

Ported as mechanics per R-20 §7 — never from a screenshot. Full teardown with sources:
[`docs/research/agentic-product-patterns-2026-08.md`](../docs/research/agentic-product-patterns-2026-08.md).

| From | Take |
| --- | --- |
| **Codex in ChatGPT** | Queue many pieces of work, each isolated, and **results arrive as separate reviewable units** — a diff, a decision, a spec — never as a status change to acknowledge. Async by default: submit and leave |
| **Amoeba** | Shared visibility, collision detection, explicit ownership, and *guide / take over / spawn parallel help* as three controls on a running piece of work |
| **Linear** | Delegation **is assignment**. Reuse the gesture; invent no vocabulary. Many in parallel, progress monitorable from the list |
| **Cursor 2.0** | Show the fan-out. Five things being read at once is more convincing than any spinner — and unlike a spinner, it is true |
| **Claude Code** | The list is a transcript of what happened, not a grid of statuses |

---

## Your first four units

1. **One board that replaces the seven doors.** Every piece of work in flight, its live verb line, its
   owner, its elapsed clock, its next action. Sorted by what needs a person soonest. `run-rows.tsx` is
   22.8KB of run vocabulary already ported from beautifui.dev with **zero importers** — start there,
   and say in your unit file why anything you add is not already in it.
2. **The rail miniature, on every surface.** A 24px character with its live state: one glance answers
   *is it working*, one click goes to the run. When nothing is running it is the door to `/start`.
   `src/components/shell/rail-presence.ts` and `run-strip.tsx` exist — wire them, do not rebuild them.
3. **The handoff, drawn.** When work moves between teammates, show what was handed over. This is the
   ruling that has been re-requested twice and built twice and mounted zero times.
4. **Collision and duplication surfacing.** Two pieces of work touching the same thing, or a teammate
   about to redo work another already did. A dedupe screen that returns nothing is worse than none:
   the restatement fold answered `ids: []` and quietly produced a ~46-track graveyard where honest
   work read as producing nothing. **Whatever you build here must make its reasoning visible.**

---

## The traps in your area, already paid for

- **A mount is not a render.** `<Thing />` in the route tree proves the element is reached, not that
  the feature exists. `GlobalComposer` returns `AskDock` and the palette is unreachable. **Open the
  route in a browser and look.**
- **A quiet job is not a fixed job.** A fast empty tick looks identical whether your filter worked or
  the work was simply held. Assert on what your fix uniquely controls, over two cycles.
- **Measure what writes, not what looks right.** Three wrong numbers in one day came from reading a
  column no writer sets, or inferring state from the shape of an id.
- **A number without its query is not evidence.** You have no database — so every number you display
  comes from a payload; name the field and the writer in your unit file.

## The cursor layer is yours

[`SPEC-MULTIPLAYER-PRESENCE.md`](./SPEC-MULTIPLAYER-PRESENCE.md) is a build spec, not a suggestion:
named, coloured teammates with live cursors at the object their newest `tool_calls` row targeted, a
shared-object indicator saying who is editing what, and a collision mark when two target the same
thing — mounted once in the shell, on every surface. **Read §2 before writing a line of it: a cursor
whose position cannot be traced to a row is theatre, and theatre deletes the feature rather than
fixing it.**

---

## What would prove you wrong

If a person has three pieces of work running and still has to open each one to find out whether any of
them needs them — this surface has failed, however good it looks.
