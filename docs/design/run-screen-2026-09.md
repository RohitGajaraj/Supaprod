# The run screen reads as a product

> _Created: 2026-09-03 · Last updated: 2026-09-03_
>
> **Mockups for P-37.** Four surfaces: the gate card, the seat's message, the transcript row, the
> hold card. A3 has P-43 (a), (b) and (c); **the hold pane's order is (d) and is §4 here.**
>
> **Walked and approved by A1 with seven amendments, all folded in below** and each marked where it
> lands. The first of them corrected a real defect in this document rather than a preference, and it
> is called out in §1.

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
│  Builder ran it twice and the tests pass.     ← t-small │   the REASON, and its author named
│  The changeset touches three files.             mute    │   once, inside it. Folds after 2 lines
│                                                          │
│  Waiting on you since 14:12. Nothing merges    ← t-data │   the DECLARED DEFAULT and its date,
│  until you answer.                               mute   │   mono, a fact about a clock
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │   Merge it   │  │  Not yet     │            ← ACTION │   two answers, two registers
│  └──────────────┘  └──────────────┘                     │
│     primary            quiet                            │
└─────────────────────────────────────────────────────────┘
```

**What comes off.** The token count, the elapsed timer, the station chip, the trace id. Every one of
them is true and none of them helps a person answer the question. They live in the transcript row for
this moment, which is where a person goes when they want to audit rather than decide.

**The seat that asks is named ONCE, as the author of the reason, in the reason's own register**
(A1, amendment 2): _"Builder ran it twice and the tests pass."_ Not a header, not a chip, not a byline
above the question. Who is asking matters only as provenance for the reason, and provenance belongs
inside the sentence it qualifies.

**Why the risk line is prose and not a badge.** A red `HIGH RISK` chip is a category; _"this is
irreversible and customers see it"_ is the actual consequence, and it is the thing that changes the
answer. A badge asks the person to know the taxonomy. A sentence does not.

**Why the default is mono and last.** It is a fact about a clock, and it is the one thing a person
needs when they are NOT going to answer now. Putting it above the answers would make the card read as
a countdown; putting it below makes it what it is, the consequence of walking away.

**THE LINE STATES THE DECLARED DEFAULT, AND FOR AN IRREVERSIBLE GATE THAT DEFAULT IS ALWAYS THAT
NOTHING RUNS.** (A1, amendment 1.) The first draft of this mockup read _"If nobody answers, this
merges at 18:00"_, which describes **a card that merges by silence**. That is not a gate, it is a
delay, and on the one path in this product that customers see. It was wrong as copy and it would have
been worse as a component, because a slot that renders whatever default it is handed will eventually
be handed that one. The component takes the declared default and an irreversible gate may only
declare "nothing runs"; there is no argument that makes this card say otherwise.

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
- **THE CHARACTER STOPS SPEAKING ON THIS SCREEN AS A SEPARATE VOICE** (A1, amendment 6). Shape 3 was
  the character saying _"I've stopped, the reason is on the hold line"_ above a card headed _"Why it
  stopped"_, and _"I'm ready, press run"_ after the person had pressed. Those are the PRODUCT's
  sentences wearing a character's first person, and the fix is not better timing: the card is the
  product speaking, and a seat only ever reports its own work. Removing the second voice closes shape
  3 **structurally**, because there is no longer a speaker who COULD narrate the run's state.

---

## 3. The transcript row

Shape 6: seat name, verdict, duration, tokens, a paragraph, and a tool-call count, all at one weight.
Six facts with no rank is six facts nobody reads.

**Three marks, and only three** (A1, amendment 5). A row is one of: it **filed**, it **filed
nothing**, or it **was stopped**. Anything finer is a taxonomy the reader has to learn.

| mark | state | what leads |
|---|---|---|
| `✓` | filed | what it filed |
| `◦` | filed nothing | what it looked for |
| `⊘` | was stopped | **the consequence**, not the cause |

**Folded**, which is how it renders:

```
  ✓  Filed 2 findings                             ← VERDICT leads, t-base, ink
     Scout · 48s · 3 tools                        ← the meta, t-data, faint, one line
```

**A stopped row leads with the consequence** and not with what stopped it, because the consequence is
what the reader has to act on:

```
  ⊘  Nothing was built for this step              ← the CONSEQUENCE, t-base, ink
     Builder · 12s                                ← t-data, faint
```

**The token count is not on the folded line** (A1, amendment 7). Tokens and cost are an audit fact,
not a scanning fact, and they belong with the tool names in the open body.

**Open**, when the row is pressed:

```
  ✓  Filed 2 findings
     Scout · 48s · 3 tools · 1.2k
     ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
     I searched the workspace for anything about   ← t-prose, body
     the address step and grouped what was there.
     signals.list · cluster.trigger · repo.read    ← t-data, faint
     1.2k tokens · $0.004                          ← t-data, faint (amendment 7)
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

**One door, and its VERB comes from the state** (A1, amendment 3). "Connect a source" is wrong
whenever a connection already exists and is simply not pointed at this product, which is today's
case:

| the state | the door |
|---|---|
| a connection exists, unbound | **Point a source at Relay** |
| no connection at all | **Connect a source** |

A door that says "connect" to somebody who has already connected reads as the product not knowing
what it has, and sends them to do a thing they have done. (P-44 supplies the target name.)

**The card keeps one button, and the second promise lives in the composer** (A1, amendment 4). R-36's
sentence promises two ways out: add a source, or _say what you know_. Both are real, so the second is
not dropped, but it is not a second button either. It becomes the composer's placeholder in this
state:

> _Say what you know, and it carries on from that_

The composer is already on the screen and already takes a sentence. Putting the promise where the
typing happens keeps the card at one door and makes the offer at the moment it can be accepted, which
a button would only announce.

**What the three doors were.** _Finish it in Settings_, _Say what is unsettled_ and _Let Discover try
again_, for one state, and two of them could not clear the hold. Settings stays in Settings; the
unsettled note is the composer, above.

---

## 5. The Ask panel's gate cards

**A fourth card dialect, found on the served build** (A1, 21:35 IST). An answer in the Ask panel
lists the pending design gates as cards of the panel's own making:

```
  ┌──────────────────────────────────────────────────┐
  │  ● Waiting on you                                │   ← the chip the run's card just lost
  │  Approve the mockup for the address step?        │
  │  The generated mockup is waiting on your call    │
  │  before this spec can dispatch to Build          │
  │                                                   │
  │  [ Approve ]  [ Send it back ]      [ Not now ]  │   ← three answers
  └──────────────────────────────────────────────────┘
```

Everything on it is true. It is the same defect as §1 in a second place: a surface composing its own
card because there was no shared one to reach for. **There is now**, so this is `Ask`.

### The ruling on the third answer

This card has **three genuine verdicts** and the doc allows two registers, so the question is real
rather than cosmetic: `approve`, `reject` and `snooze` are three different things a person can do,
and none is a duplicate of another.

**They are not three ANSWERS.** Two of them answer the question and one of them declines to:

| | what it is | where it belongs |
|---|---|---|
| **Approve** | the answer | the primary |
| **Send it back** | the other answer, in the other register | the quiet answer |
| **Not now** | **what silence already does**, made pressable | the default line's own action |

_Not now_ writes a snooze, and a snooze is the declared default arriving early. The card already
says what happens if nobody answers; pressing _Not now_ is choosing that outcome deliberately rather
than by walking away. Rendering it as a third button puts a non-answer in the row where the answers
are, and it is the reason a person reading this card has to decide between three things when only
two of them are decisions.

So it renders **on the default line, as that line's own quiet action**:

```
  Approve the mockup for the address step?              ← question, t-lead

  Discovery Scout could not proceed without it.         ← reason, the seat's

  Waiting on you since 09:14. Nothing dispatches         ← the DECLARED DEFAULT, mono
  until you answer.                        [ Not now ]  ← and its own action, quiet

  ┌───────────┐  ┌────────────────┐
  │  Approve  │  │  Send it back  │                     ← two answers, two registers
  └───────────┘  └────────────────┘
```

**The chip goes**, for the reason the run's gate card lost the same one: a card that is asking IS the
waiting, and the line below says since when.

**This is a rule about the component, not about this card**, so it is written into `Ask` rather than
into the panel: a slot for the default's own action, and no fourth answer slot to put it in.

## 6. A Choice: one question, N named options

**Found under `Gate`, not designed** (P-50's survey, five call sites). `Ask` has exactly one answer
and one decline, and that constraint is the point of it. A four-way choice is a different question
and forcing it through `Ask` would either lose options or put a fourth control beside the answers,
which is the defect P-50 just closed.

```
  Which source should it read first?              ← the question, t-lead

  Discover reads one at a time and starts with    ← why the order matters, t-small
  whichever you pick.                               mute

  ┌──────────────────────────────────────────┐
  │  Intercom          2,140 conversations    │   ← each option carries the ONE
  ├──────────────────────────────────────────┤     fact that decides between them
  │  Zendesk             318 tickets          │
  ├──────────────────────────────────────────┤
  │  Slack            #support, 90 days       │
  └──────────────────────────────────────────┘

  Nothing is read until you pick one.             ← the default, mono
```

**Every option carries the one fact that distinguishes it**, and the same fact for every option. A
list of names with nothing to choose between them is a menu, not a choice: the person picks the
first, or the one they recognise, which is the product deciding by ordering rather than the person
deciding on evidence.

**No option is the default and none is pre-selected.** This is the rule that separates a `Choice`
from an `Ask`: an `Ask` has a primary because one answer is the expected one and the card can say so
honestly. In a `Choice` the whole point is that the product does not know which is right, so a
pre-selected option would be the product pretending it does, and a person confirming a pick they did
not make reads as consent.

**The default line says what happens if nobody picks, and it is always that nothing does.** A choice
that resolves itself by timing out is not a choice; it is a delay with extra steps, and it is the
same defect the gate card's declared default was corrected for in §1.

## 7. A Quiet: an empty queue is a state, not a question

**Four call sites are an empty queue wearing the asking card's clothes**, complete with a question
mark on a sentence that is a report: *"Nothing is waiting on a call."*, *"Nothing needs your
verdict."*, *"What will come here to ship?"*

An empty queue is **good news**. It is the ordinary state of a healthy workspace, and drawing it as a
card that asks makes an absence of work look like an item of work.

```
  Nothing is waiting on a call.                   ← t-base, mute, NOT t-lead

  What will appear here: a call the crew cannot   ← t-small, faint
  make alone, with what it needs from you.
```

**No border, no card, no chip, no action.** The three things this must not do, each because a
surface here has already done it: it must not draw a bordered container, because a card is what this
product uses for something that needs answering; it must not carry a question mark, because it is
not asking; and it must not offer a control, because there is nothing to do and a button here is a
door onto an empty room.

**It says what WILL appear, not that nothing has.** That is the difference between a zero state and
an apology, and it is the same rule the arrival document settled for an empty workspace: *"0 findings
this week"* over a product nobody has given anything to read is a reproach rather than a fact.

**Where the queue is empty because something is wrong**, that is not this. A read that failed is a
different state with a different sentence, and collapsing the two is how a broken surface comes to
look calm.

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
