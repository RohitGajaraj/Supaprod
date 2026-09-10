# The entry is one piece of work, told whole

> _Created: 2026-09-10 · Lane 1 · The design direction for the entry, the through-line and the
> two laws that follow from it. **Published before the build so the other lane is not blocked.**_

---

## What the founder said, and what the last answer got wrong

> *"A user lands on home and it is not appealing, carries no message, shows no journey. I cannot
> feel the value and I cannot see any real connectivity. Nothing joins up. Layers 1, 2 and 3 do not
> stitch together, and it reads as a dump of data and content."* — founder, 2026-09-10

The previous pass read *"shows no journey"* as **the drawing of the journey is not visible enough**,
and moved the seven-station road from eighth position to first. Measured on the served home this
morning, that is exactly what shipped: `JourneyMap` leads, at the top of the column, captioned
*"Seven stations take one sentence from evidence to shipped, and grade whether it worked."*

**The founder looked at that and said it again.** So the placement was not the defect.

**A journey is not a diagram of stages. A journey is one thing moving through time.** The road at
the top is a *generic* picture — it renders identically for every workspace that happens to hold the
same counts, and what it draws is the machine's own self-portrait. It is layer 2, the layer we
explicitly rent rather than own, given the largest region on the most important screen.

The journey a person cannot see is the one that runs **evidence → decision → build → verdict**, for
one specific thing they care about. That is layers 1, 2 and 3 stitched, and it cannot be drawn as
an abstraction because the stitching is the content.

---

## The measurements this direction rests on

All taken on the served build at `supaprod.ai`, 2026-09-10, signed in, workspace *A1 delete probe*.

| what | measured |
| --- | --- |
| **The entry is the one surface outside the shell's own layout** | It hand-rolls `mx-auto flex w-full max-w-[62rem]` instead of `.sp-inner`. `shell.css`'s own comment names it: *"Every surface in the product inherited that except `/start`."* |
| **660px of 1652px wasted, while the page scrolls** | Work region 1652px wide, content column 992px, 330px of dead field each side. Content height 1168px against 880px of pane. The reader scrolls for information that would fit if the layout used the screen. |
| **The context column exists and the entry does not use it** | `.sp-inner:has(.sp-ctx)` gives two tracks at ≥1120px. `/inbox` uses it. The entry cannot, because it never joined `.sp-inner`. |
| **8 runs, 3 distinct sentences** | The middle column of *Your runs* — the column whose whole purpose is to discriminate — printed 3 byte-identical copies of *"Build has a spec or the tasks to build from, has been corrected 2 times, and still cannot finish."*, 3 of *"Nothing on the record bears on this, so the call is yours."* and 2 of *"Graded on 2026-10-03."* |
| **12 conditional regions, most absent on any given visit** | The route's own comments describe a sequence — *"what needs you, hand something over, here is what came of the last time, here is what is moving, here is your list"* — but each region draws only under its own condition, so no two visits share a shape and the sequence exists only in the comments. |
| **A native `<select>` in the primary flow** | `The work is [Something we have not built before] · it enters at Discover and walks all seven stations`. A mad-lib that asks the person to classify their own sentence before the product has read it. |
| **Five tracked-out ALL-CAPS labels on one screen** | `WHERE YOUR WORK STANDS`, `A1 DELETE PROBE`, `WHAT IT IS BETTING ON`, `YOUR RUNS`, plus the workspace eyebrow. 79 uses of `mrd-eyebrow` across 31 files. |
| **The headline is absent on first paint** | The hero waits on the composite read; the slot holds 7.5rem of nothing until it resolves. A screenshot taken on arrival shows a void where the message is. |

---

## The direction

### 1. The entry leads with ONE piece of work, told whole

Not the seven-station road as an abstraction. **The single piece of work that matters most right
now, drawn along its entire arc**, with the call answerable in place:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Show the installer arrival window on the order page                        │
│                                                                             │
│  ●────────●────────●────────◉╌╌╌╌╌╌╌╌╌○────────○────────○                   │
│  Discover  Decide   Plan     Design    Build    Ship     Learn              │
│  7 signals 6 Sep    16 tasks  ← you    stopped                              │
│                                                                             │
│  It came from 7 signals in your support inbox.                              │
│  Design has waited on you 6 days. Nothing runs until you answer.            │
│  If you approve, it says homeowner confusion drops. You will know by 24 Sep.│
│                                                                             │
│  [ Approve ]   [ Decline ]   [ Open the run ]                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

Read left to right that is **layer 1** (the call), **layer 2** (the road, made specific), **layer 3**
(what it will prove) on one object, with the action in place. The value stops being a claim: seven
signals became a decision became a build became a dated, measurable promise, and you can see the
whole chain without leaving the screen.

**The generic band goes.** Once the road is drawn around a real thing, a second road drawn around
nothing is the duplication law again, one region higher.

### 2. Fixed skeleton, variable content

Twelve conditional regions is why the page has no shape. **Four movements, always in the same
place, drawing even when empty**, because a movement that vanishes is why a person cannot learn a
screen:

1. **The one that matters** — the lead above. Full width.
2. **The board** — every other run, each on its own full-width road. Main column.
3. **Hand something over** — the composer. Main column, and it is the *only* prompt on the screen.
4. **What came of it** — layer 3. Context column, always present, and when nothing has been graded
   it says so in those words rather than disappearing.

An empty movement says what is true. It does not vanish, and it does not print a zero it has not
measured.

### 3. The agent classifies; the person does not

The `<select>` goes. A person types a sentence; the product reads it and shows what it decided —
*"reads as a change to something people see; it enters at Design"* — as a correctable mark, not a
question asked before the product has done any work. **Anticipate, do not interrogate.**

### 4. The entry joins `.sp-inner`

No surface hand-rolls its own measure. This reclaims 660px, and it is what makes the context
column available to the entry at all.

---

## The two laws, and they apply to every surface

### LAW 31 — A surface's heading is the reader's situation, not the surface's name

Measured: `/evidence` opens with four typographic layers before any content —
`DISCOVER` / **Evidence** / *"What came in, and what it is becoming."* / **"Nothing has come in
yet."** `/outcomes` does the same: `LEARN` / **Outcomes** / *"Every decision, what it expected, and
what happened."* / **"The crew has read this record before acting."**

The surface's name is already in the rail, highlighted, and in the browser tab. Printing it a third
time spends the largest type on the page telling the reader something they used to get here.

**One heading per surface, and it is a sentence about what is true for this reader right now.**
`PageHeading.title` takes the situation. The second headline does not exist. The tagline is teaching
content with a life-cycle, not chrome that runs forever.

### LAW 32 — A movement keeps its place when it is empty

A region that renders only under its own condition cannot be learned. Every movement on a surface
draws in the same position on every visit; when it has nothing, it says what is true — *"nothing has
been graded yet"* — and never a zero it did not measure, and never silence, which is
indistinguishable from a broken read.

---

## What this does not change

Meridian's palette, its colour law, its faces and its ramp. The problem measured on these screens
is composition and hierarchy, not tokens. The one gap found so far is that the ramp is bunched —
seven stops between 10px and 13px, and thin between 14px and 32px, which is the typographic
signature of a surface that prints everything at the same weight. That is used, not replaced.

---

## Related

- [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md) — the contract
- [`../conventions/the-bar.md`](../conventions/the-bar.md) — the standard
- [`arrival-2026-09.md`](./arrival-2026-09.md) — what an empty workspace says
