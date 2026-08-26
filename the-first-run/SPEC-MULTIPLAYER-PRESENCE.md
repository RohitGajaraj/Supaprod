# SPEC-MULTIPLAYER-PRESENCE — many teammates, named and coloured, working in front of you

> _Written 2026-08-26 by MAIN, from the founder's direction the same day: "if two or three agents are
> operating, that cursor should be moving in parallel. Whatever is working, differentiate it with
> colours and a name on top of it… it should be there across all surfaces so we know what is
> happening. If some common code is being edited, what is being edited should be seen."_
>
> **Amends [`SPEC-PRESENCE.md`](./SPEC-PRESENCE.md), which ruled "the crew becomes ONE character".
> That ruling stands where it was aimed and is narrowed here. Read both.**

---

## 1 · The reconciliation, because these two rulings look like they conflict

`SPEC-PRESENCE.md` ruled one character because **fifteen seat slugs on screen are an org chart**, and a
person delegating work does not want to meet a roster. That is right, and it is about the *user's one
piece of work*.

The founder's new direction is about a different fact: **more than one teammate really is working at
the same time**, and today the product hides it. Hiding something true is not restraint, it is a
missing feature.

**Ruled: the character is a species, not an individual.**

- **One piece of work, one teammate acting → one character.** The run surface is unchanged. The user
  delegated one thing; they meet one worker.
- **More than one teammate genuinely acting at once → each one drawn, same body, its own colour and
  its own name.** Three at work read as three teammates of one kind, not three job titles. The
  identity is carried by **colour and name**, never by a different avatar per seat.
- **The roster is never a browsable list.** You see a teammate because it is doing something right
  now. When it stops, it goes. There is no directory of agents, ever — that is the org chart the
  original ruling refused, and it stays refused.

---

## 2 · The iron law, restated because this feature is the easiest place in the product to fake

**A cursor that moves when nothing is happening is theatre, and theatre is the one regression that
deletes a feature rather than fixing it.** This repo has already failed a branch for a timer
advancing step labels.

**Every cursor position is derived, never invented:**

- A teammate's cursor sits at **the on-screen anchor of the object its newest `tool_calls` row
  actually targeted** — the signal it just read, the spec section it just wrote, the file in the diff
  it just changed. It moves when a new row lands. It does not travel a path between them; it arrives,
  the way a real cursor does when someone jumps.
- A teammate is drawn **only while `agent_runs` shows it in flight.** No run, no cursor.
- If the read fails, the layer says it is out of touch. **It never shows a calm room on a dead feed** —
  optimistic health signals hid a month of failure here once already.
- **No random walk, no idle drift, no interpolation between two unrelated targets.** If you cannot
  name the row a position came from, do not draw the position.

**What would prove this feature wrong:** any cursor on screen whose position cannot be traced to a
specific row. If S4 finds one, the layer is removed, not patched.

---

## 2.5 · The objection that must be answered, and it is a good one

Raised publicly against exactly this kind of feature (a practitioner, `@ishpaul_777`, under a
multi-agent demo the founder circulated on 2026-08-26):

> *"Basically an agent will burn more tokens thinking about what other agent is doing than actually
> working on the task. Git worktrees is the right solution to the problem you are solving, not giving
> the agent more context which is task-unrelated."*

**He is right about agents and wrong about people, and the distinction is the whole design.**

| | Isolation | Visibility |
| --- | --- | --- |
| **For the agent** | **Yes.** A teammate works in its own sandbox and does **not** read another teammate's transcript. Cross-reading is context pollution and token burn, and it makes every run slower and dumber | **No** |
| **For the person** | No | **Yes.** The human is the one who needs all of it at once, and today gets none of it |

**So three hard constraints follow, and S4 checks them:**

1. **No teammate is ever fed another teammate's transcript, reasoning or output as context** in order
   to make this layer work. The layer is a **read of state for a human**, rendered from rows that
   already exist. It costs the agents nothing because they are not participants in it.
2. **Collision detection is a cheap deterministic check, never a reasoning step.** Two teammates
   targeting the same object is a row comparison — same id, same path, same file — not an agent asking
   another agent what it is doing. **The moment collision detection needs a model call, it is wrong.**
3. **What a teammate genuinely needs from another is the artifact, not the narrative.** The handoff
   passes the spec, the diff, the signals — a finished thing with a name. It never passes "here is what
   the other one has been thinking".

**This is also why our own five worktrees are the right shape**: isolation for the workers, one `cat`
of five one-line files for the human. **The product should work the same way**, and if it ever does not
— if a teammate is spending tokens reading about other teammates — this feature caused a regression
and comes out.

---

## 3 · What is drawn

### 3.1 The cursor layer — every surface

A label-and-caret pair per active teammate, Figma-style: the caret at the anchor, the name on a chip in
that teammate's colour. It rides above the surface and never blocks a click.

- **Colour** comes from a fixed palette of Meridian accent tokens, assigned deterministically from the
  teammate's id so the same teammate is the same colour on every surface and across reloads. **Never
  the brand ember** — ember stays in the logo and is not an interaction state.
- **The name** is the teammate's name, not its seat slug. `discovery-scout` is a job, not a person.
- **The chip carries the verb**, in plain words, from the tool-slug verb map: *"reading your
  signals"*, *"writing the spec"*, *"opening a pull request"*. The verb map keys on tool slugs so a
  renamed tool fails loudly rather than silently.
- **`prefers-reduced-motion` removes the movement and keeps the position.** The information is the
  position, not the animation.

### 3.2 What is being edited — the shared-object indicator

On any object a teammate is currently acting on — a signal card, a spec section, a file in a diff, a
decision — a small persistent mark in that teammate's colour: **who has it, and what they are doing to
it.** This is the founder's *"if some common code is being edited, what is being edited should be
seen."*

It stays after the cursor leaves, briefly, as a "changed just now" trace, so a person who looked away
for ten seconds can still see what moved.

### 3.3 Collision — two teammates on one thing

When two teammates target the same object, **say so on the object**, both colours, once. Amoeba's
claim is the value line: coordinated agents **split** duplicate work instead of repeating it. A
collision surfaced is the product working; a collision hidden is the ~46-track graveyard, where honest
signals folded into nothing and only rewording got past.

### 3.4 The rail, everywhere

The persistent rail carries a stack of the active teammates' marks — one glance, on any surface,
answers *how many are working and on what*. Click one, go to what it is doing. Nothing running: the
rail is the door to `/start`.

---

## 4 · Ownership

| Piece | Owner | Notes |
| --- | --- | --- |
| Derivation — active teammates, their colours, their anchors, the verb map, `src/lib/presence/**` | **S0** | Pure functions + tests. A teammate's colour and identity are assigned here, once, so every surface agrees |
| The cursor layer + shared-object indicator + collision mark, mounted app-wide in the shell | **S2** | Cross-surface, so it lives with the shell. One implementation, never per-route |
| The in-run character and its states | **S1** | `SPEC-PRESENCE.md` §Anatomy is unchanged for the single-teammate case |
| Reduced-motion, contrast and focus behaviour of the layer | **S3** | Accessibility is not deferred (R-19) |
| Proving no cursor exists that cannot be traced to a row | **S4** | §2. This is a standing check, not a one-off |

**v1 needs no new tables and no new writes.** `agent_runs`, `tool_calls` and `spine_tracks` already
carry everything above. If polling proves too coarse for the verb line, S0 builds the read model —
nobody else.

---

## 5 · The two personas this serves, and they are different

- **The human user** — the person accountable for the outcome, who is not doing the work. For them
  this layer answers *is anything happening, and does anything need me*, without opening anything.
  **They must never have to learn a name to use the product.**
- **The AI teammates themselves** — a span of agents that are also users of this surface. They need to
  know what another teammate already has, so they do not redo it. That is what §3.3 is for, and it is
  the same mechanism serving both readers.

**The test for both:** after watching for ten seconds, can you say how many teammates are working,
what each is touching, and whether any two are about to do the same thing? If not, the layer has not
earned the pixels it costs.
