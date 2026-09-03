# The run screen reads as a product

> _Created: 2026-09-03 · Last updated: 2026-09-03_
>
> **Mockups for P-37, to be walked before any code.** Four surfaces: the gate card, the seat's
> message, the transcript row, the hold card. A3 has the four state-and-copy items (P-43); this is
> the shape.

The founder, on the tablet track's run: _the gate card, the messages, the action items, the inside of
the card, the text and the information are dumped with no hierarchy; everything is true and nothing
is designed._

He is right, and the second half is the diagnosis. Every one of the seven things A1 saw is the same
defect: **a surface that reports rather than composes.** Nothing on that screen decides what matters
most, so everything arrives at one weight and the person does the sorting.

---

## The three vocabularies

One of each, and everything on the screen is one of them.

| | what it is | who speaks | how many per state |
|---|---|---|---|
| **A card** | something that asks, or reports a state that is not moving | the product | **one** |
| **A message** | a seat saying what it did or found | the seat, first person | one per moment |
| **An action** | a verb the person can press | the person's own | **one primary, ever** |

The rule that fixes shapes 1, 2 and 3 at once: **one state, one sentence, one door.** A screen in one
state may ask for exactly one thing. Everything else is quiet, folded, or gone.

---

## 1. The gate card

The order is the design. Question, risk, reason, default and date, two answers, **and nothing else**.

```
┌─────────────────────────────────────────────────────────┐
│  Merge the address change into main?          ← t-lead  │   the QUESTION, alone on its line
│                                                          │
│  This is irreversible and customers see it.   ← t-base  │   the RISK, one line, never a badge
│                                                          │
│  Build ran twice and the tests pass. The      ← t-small │   the REASON, folds after 2 lines
│  changeset touches three files.                 mute    │
│                                                          │
│  Waiting on you since 14:12. If nobody         ← t-data │   the DEFAULT and its DATE, mono,
│  answers, this merges at 18:00.                  mute   │   because it is a fact about a clock
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │   Merge it   │  │  Not yet     │            ← ACTION │   two answers, two registers
│  └──────────────┘  └──────────────┘                     │
│     primary            quiet                            │
└─────────────────────────────────────────────────────────┘
```

**What comes off.** The seat name, the token count, the elapsed timer, the station chip, the trace
id. Every one of them is true and none of them helps a person answer the question. They live in the
transcript row for this moment, which is where a person goes when they want to audit rather than
decide.

**Why the risk line is prose and not a badge.** A red `HIGH RISK` chip is a category; _"this is
irreversible and customers see it"_ is the actual consequence, and it is the thing that changes the
answer. A badge asks the person to know the taxonomy. A sentence does not.

**Why the default is mono and last.** It is a fact about a clock, and it is the one thing a person
needs when they are NOT going to answer now. Putting it above the answers would make the card read as
a countdown; putting it below makes it what it is, the consequence of walking away.

---

## 2. The seat's message

One moment, one speaker, one time. Shape 3 is the whole brief: the character said _"I've stopped, the
reason is on the hold line"_ directly above a card headed _"Why it stopped"_, and said _"I'm ready,
press run"_ after the person had already pressed.

```
  ◐  Scout                                        ← t-small, mute, weight 650
     I read 41 signals and none of them speak     ← t-prose, ink
     to the address step.
     14:12 · 41 signals read                      ← t-data, faint
```

**Rules.**

- **The seat speaks about its own work, never about the run's state.** "I stopped" is the product's
  line and belongs on the card. "I read 41 signals and found nothing" is the seat's.
- **Never in the imperative.** A seat does not tell the person to press anything. The action is the
  card's, and the card is the only thing with a button.
- **One message per moment.** If a card is already reporting the moment, the seat is silent.

---

## 3. The transcript row

Shape 6: seat name, verdict, duration, tokens, a paragraph, and a tool-call count, all at one weight.
Six facts with no rank is six facts nobody reads.

**Folded**, which is how it renders:

```
  ✓  Filed 2 findings                             ← VERDICT leads, t-base, ink
     Scout · 48s · 3 tools · 1.2k                 ← the meta, t-data, faint, one line
```

**Open**, when the row is pressed:

```
  ✓  Filed 2 findings
     Scout · 48s · 3 tools · 1.2k
     ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
     I searched the workspace for anything about   ← t-prose, body
     the address step and grouped what was there.
     signals.list · cluster.trigger · repo.read    ← t-data, faint
```

**The verdict leads because it is the only thing a person scanning a transcript is looking for.**
Everything else answers a question they have not asked yet.

### The disclosure, and why it does not feel like a toggle

A chevron that flips is a control reporting its own state. What we want is a row that **grew**.

| decision | value | why |
|---|---|---|
| the lead never moves | the verdict and meta line are outside the animated region | if the thing you clicked jumps, you clicked the wrong thing |
| height and opacity together | `--mrd-d-move` (140ms), `--mrd-ease` | the ramp is already out-quint, which is the curve this wants |
| the body rises 4px as it fades in | `transform: translateY(4px) -> 0` | matter that arrives from nowhere reads as a popup, not an unfolding |
| no chevron rotation | there is no chevron | the row's own height is the state; a second indicator of one state is shape 2 again |
| the whole row is the target | not a hit area on an icon | a 12px chevron on a tablet is a miss |
| closing is the same 140ms | symmetric here, deliberately | this is not an exit, it is the same object at another size |

Under `prefers-reduced-motion` the height still changes (it is layout, not decoration) and the 4px
rise and the fade are dropped.

---

## 4. The hold card

Shapes 1 and 5. Three asks in one breath, and the machinery's reason leading over the person's.

```
┌─────────────────────────────────────────────────────────┐
│  Nothing is pointed at a source.               ← t-lead │   the PERSON'S reason, first
│                                                          │
│  Discover has nothing to read, so the run      ← t-small│   what follows from it
│  is waiting rather than failing.                 mute   │
│                                                          │
│  ┌──────────────────┐                                   │
│  │  Connect a source │                          ← ACTION│   ONE door
│  └──────────────────┘                                   │
└─────────────────────────────────────────────────────────┘
```

**The machinery's reason goes to the transcript**, as a row like any other: _"this run of the loop ran
long."_ True, and it is an answer to a question about our scheduler, not about the person's work.

**One door.** _Finish it in Settings_, _Say what is unsettled_ and _Let Discover try again_ were three
doors for one state, and two of them could not clear the hold. The door that can is the only one that
renders; the others are reachable where they belong (Settings is Settings; the run's own composer
takes an unsettled note).

---

## What this needs from Meridian

Nothing forked, nothing local. In `meridian/**` with its reasoning:

1. **`Ask`** the one card vocabulary: a slot order (`question`, `risk`, `reason`, `default`,
   `answers`) that cannot be reordered by a caller, because the order IS the design.
2. **`SeatSays`** the message: mark, name, prose, meta. First person, no imperative, no button slot,
   so the "one door" rule is structural rather than remembered.
3. **`FoldingRow`** the transcript row: a lead that never moves, a folded body, the motion above.
4. The four already exist as scattered shapes in `ApprovalCard.tsx` (466 lines), `GateBanner.tsx` and
   `LiveWork.tsx`; this replaces their layout, not their wiring.

## The one rule to keep if everything else is cut

**A screen in one state asks for one thing.** Six of the seven shapes A1 saw are that rule broken in
six places.
