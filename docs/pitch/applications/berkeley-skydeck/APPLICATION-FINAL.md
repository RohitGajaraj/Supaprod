# Berkeley SkyDeck, Batch 23 — the answers as filled, field by field

> _Created: 2026-08-13 · Last updated: 2026-08-13_

> Filled in the live F6S form, with every question read off the page rather than guessed.
>
> **Deadline 2026-08-21.** Applications opened 2026-07-20. Interviews 09-08 to 10-05. Orientation 2026-11-02. Program 2026-11-02 to 2027-04-15. Demo Day April 2027.
>
> **Terms, read off the F6S sidebar: $210,000 per team, 7.25% equity, 50 startups a year.** That is an implied ~$2.9M post. Berkeley SkyDeck states that roughly two thirds of selected companies were founded outside the US.
>
> **Form:** `https://www.f6s.com/skydeck-batch-23/apply` (F6S login required).
>
> ✅ **FILLED AND SAVED 2026-08-13.** Every answer below is live in the form and verified by re-fetching the page server-side. **Not submitted.** One field is unanswered and it is the founder's: Q16, *how did you hear about SkyDeck*.

## The thing that wasted an hour, and it will waste yours too

**F6S locks the entire question set behind a completed company page.** The Questions section renders with a padlock, no Submit button appears, and **nothing you type is saved** — network tracing showed telemetry beacons and zero writes. It looks exactly like a broken form. It is not.

**The order is forced, and it is three gates, not one:**

1. **A company page must exist and be substantially complete.** `f6s.com/<slug>`, reached from the yellow *"Let's get started → Create new"* panel on the programme page. **Check whether one already exists before creating** — the name field warns *"You're already on the X page"* and it is easy to read that as an error rather than as "you already have this."
2. **Basic Information must reach n of n complete.** It auto-populates from the company page: tagline becomes *short description*, description becomes *what do you do in detail*, plus markets, stage and location. **Fill the company page well and this section fills itself.**
3. **The Team section must reach 1 of 1.** The holdout is not obvious: it needs *Describe yourself*, *Your Skills*, **Location**, and at least one **Contact info** row. Miss any one and the questions stay locked.

**Only then do the questions unlock and start saving.**

> **Two traps inside the company page.**
>
> **F6S auto-adds parent categories to market tags, and some of them are wrong.** Picking *Agent Management* silently added **Human Resources**, because F6S reads "agent" as a call-centre agent. Picking *Product Management* silently added **Consulting**. Both misclassify a product company. **Re-read the tag list after every pick.**
>
> **Backspace deletes tags once the text box is empty.** Clearing a half-typed entry with a run of backspaces removed all seven committed tags. Dismiss uncommitted text by clicking away, never by holding backspace.
>
> This supersedes [`application.md`](./application.md), which was drafted against guessed questions before the form was opened. That file is kept for comparison, not for pasting.

---

## ✅ Every required field is filled. "Apply now" is live and the founder submits it.

Verified against a **reloaded** page, not the DOM that was typed into: no required field is empty, no validation error renders, and the blue **Apply now** button is enabled.

| Attachment | What is on the form |
| --- | --- |
| **Upload your deck** (required) | `Supaprod-Investor-Briefing.pdf`, classified **Investment** — the one-page link card, not the 16-page deck |
| **Product Video** | `youtube.com/embed/x9WgGn0FyYU` — the product film, public |
| **Team Video** | `youtube.com/embed/zBmtUtkTyBs` — the founder pitch, unlisted |
| **Company website** | `https://supaprod.ai` |

**The link card was attached rather than the 16-page PDF, and that is the founder's ruling.** The deck clips its own content on four slides; the card's button opens `/brief`, where the same material renders correctly and stays current. Swap it from [`../../shareables/`](../../shareables/README.md) if a reviewer ever asks for a file to read offline.

> ### Two F6S behaviours that cost time, both now settled
>
> **Optional money fields are left blank on purpose, and F6S enforces it anyway.** *Revenue last month*, *last 12 months*, *amount raising*, *target valuation* and *runway* are all optional and all empty. Founder ruling 2026-08-13: **leave an optional field blank rather than fill it, so nothing implies a number we do not have.** The platform agrees — its currency widget normalises `0` back to empty and refuses to store it, through synthetic events *and* through real keystrokes.
>
> **That applies to a required field too, and it looks like a bug.** *"How much have you raised from investors?"* is marked required and its own hint reads *"Just put 0 if you haven't raised yet"* — yet the same widget discards the `0`. The field reads empty on reload and **the form still validates and still offers Apply now.** Do not spend time fighting it; zero and empty are the same value here.

---

## ⚠️ REWRITTEN 2026-08-13 EVENING — the order was wrong, not the facts

**Founder correction, and it is the most important note in this file.** The first draft led with the moat and never said what the product does. The canon orders it **door, then body, then brain**, and the door is the part nobody else sells.

> **Supaprod tells a product team what to build. Then it builds and ships it. Then it learns what happened and guides the next call.**
>
> **Nobody sells the first part.** Every tool on the market makes the work faster once somebody has already decided what the work is. Deciding is still one person, alone, guessing, then defending the guess. That is the wedge, and it must open every answer that describes the product.

**The moat still matters, but it is the third layer's mechanism, not the headline.** Lead with the forecast and a reader never learns what the product does.

**Five answers were reordered on this rule:** the 140-character differentiator, the one-sentence description, *what do you do in detail*, *what problem are you solving*, and *tell us about your competitors*.

**One more defect fixed in the same pass:** the seven-station walk appeared near-verbatim in three separate fields. It was cut from the traction answer, which owns *zero users*, not *how the product works*. That duplication is the same one caught in the YC application on 2026-08-13.

## The five rules every answer below was written against

Each was learned from a defect the founder caught in the YC application on 2026-08-13.

1. Write the product from the team's side, not the founder's. **"You" is banned in a product sentence**, because a reviewer reads it as themselves.
2. No word that exists only to fill space, and never make the plan sound small.
3. Describe the product by what a team feeds it and gets back, **never by the plumbing**. Under-describing is as much a defect as overclaiming and far harder to see.
4. **Never quantify the human gate on an autonomy story.** The gate is a feature as a principle and a liability as a count.
5. Show the agent at every step. **Never write the product as a form.**

And above all: **if a claim is heavy, check whether it is true before polishing it.**

**Numbers re-derived the day of filling:** 5,151 commits on `origin/main`, 532 migrations, first real commit `2026-06-02` (ten weeks). Written as `5,000+` and `530+`.

---

## Team Background

### 1. Why is your team uniquely qualified to build your startup?

```
Close to a decade of being the person who had to defend the call, and I now
ship the code as well.

I started on satellite communication systems at ISRO, where hardware launches
once and there is no patch release. Then semiconductors at Infineon, where a
decision locks years before anyone learns whether it was right. Most recently
senior AI product at Intellect, building the platform that 200+ financial
institutions across 70+ countries use to ship their own AI products, in a
domain where "the model decided" is not an answer a risk team accepts.

Three industries, one recurring problem. The reasoning behind a decision lived
in people's heads and meeting notes, and re-answering why we chose this six
months later was guesswork. Supaprod is what I built to stop doing that.

The second half is that I can build it now. Two years ago I could not ship
production software, so I taught myself by directing agents. Ten weeks solo on
Supaprod: 5,000+ commits, 530+ database migrations, and it runs end to end.
Before the version standing today I built and threw away four complete working
ones.
```

### 2. How many people would work full time? How many part-time at SkyDeck?

```
One full time today, which is me, and that has been the case for ten weeks. I
took a break from my product role to build Supaprod and my notice is in, so
there is no second commitment to unwind.

If accepted, two full time. The first hire is a founding engineer, made during
the batch. Nobody part-time.
```

**Founder decision, 2026-08-13:** me full time plus a first hire during the batch. This is the one answer that commits to spending the money on a person.

### 3. LinkedIn URLs for founders

```
https://www.linkedin.com/in/rohit-gajaraj/
```

### 4. Describe your startup in one sentence

```
Supaprod tells a product team what to build, runs the whole lifecycle with
agents to ship it, and grades every call against what the team predicted so the
next one is sharper.
```
Building got cheap inside eighteen months. Deciding what to build did not.

82% of product people report AI already makes them measurably more productive,
and over the same stretch burnout went from 44.7% to 55.7%, with the top fear
being expected to do more for the same pay. Speed is solved. Nobody needs more
output.

Every tool sold to a product team helps them do the work faster once somebody
has already decided what the work is. Nobody sells the deciding. That is still
one person, alone, guessing, and then defending the guess. A practitioner put it
better than I can: PMs got faster at shipping but did not get better at
defending why, and when delivery accelerates and clarity does not, AI
accelerates confusion.

Supaprod solves it in three layers, and each one is the precondition for the
next.

It tells a team what to build. Agents read everything the team already has:
product data, market and competitor intelligence, customer voice, product
feedback, analytics, and the team's own vision. They cluster it into what is
worth looking at, argue down the weak bets, and come back with an actual call
and the evidence behind it. Something a team can argue with, not a summary.

It builds and ships it. Write the spec with its evidence attached, plan and
design the work, build it, open the pull requests, ship, write the release
notes. A person approves and merges.

It learns what actually happened, and guides the next call. At the moment a
decision is committed, Supaprod takes what the team expects to happen, how they
will know, and by when. Those three fields freeze on write and a database
trigger blocks every later edit. When the date falls due, the call is graded
against what actually shipped, and that verdict re-ranks what the team is shown
next.

The third layer is the one nobody else can copy quickly. Causes survive in chat
logs and call recordings, and an agent can rebuild them in an afternoon. A
prediction made before the outcome was known leaves no trace at all unless
something captured it at the time. That is the only part of a decision that
cannot be reconstructed after the fact, and it is what turns a tool that ships
work into one that gets better at choosing it.
```
Roughly 2.6M product managers worldwide, plus the founders and engineering
leads doing the same job without the title. That is the buyer.

Two ways to size it, and I would rather give both than pick the flattering one.
The work itself is already paid for as headcount, at about $115K loaded per
seat. The software budget we actually compete for is smaller and real today: it
is split across a tracker, a docs tool, a spec tool, a coding agent and status
meetings, all of which teams already pay per seat for.

The reachable slice is narrower than either. It is product teams that have
started handing real work to coding agents, plus the agent-native orgs forming
now. Instagram replaced its roughly thirteen-person canonical team with pods of
four to six engineers led by what Mosseri calls product staff, one person
absorbing design, data and research. One person now carries calls that used to
be split across five specialists, and that seat has no system of record. That
is the wedge, and it is being created this year.

Pricing is a workspace subscription plus usage credits for agent runs, so
revenue tracks how much work the agents do rather than headcount. It gets its
first real test in beta.
```

**Why both sizings are given.** Quoting only the $299B labour pool would be the flattering number and the one a partner discounts on sight. Naming the smaller real budget first is what makes the larger number survive being read.

---

## Competition

### 7. Tell us about your competitors and why you are dramatically better

```
Every one of them makes doing the work faster. Not one of them decides what the
work should be, and not one tells you afterwards whether you were right. That is
the whole gap, and it is where Supaprod sits.

Notion shipped Ship OS free in July. Atlassian launched Product Collection in
May, positioned around better decisions. Linear hands issues to coding agents.
ChatPRD drafts specs for 100k+ PMs. Cursor and the labs generate the code. Each
one is excellent at its step. A team still has to pick the step, sequence the
steps, and carry the reasoning between them, which is what the PM actually does
all day.

The real competitor is not any of them. It is a folder. Teams hand-roll this in
markdown files and scripts, and it works until a second person or a fleet of
agents touches it. Every do-it-yourself success I found is a single operator in
a single context. Every failure is multi-person or multi-agent.

Supaprod is dramatically better on one axis and honest about the rest: it owns
the whole loop rather than a step. It tells a team what to build, it builds and
ships it, and it grades the call afterwards so the next one is sharper. Nobody
else spans all three, and the third is what makes the first two compound instead
of just repeating.

The mechanism, not an adjective. At the moment a decision is committed, Supaprod
takes what the team expects to happen, how they will know, and by when. Those
fields freeze on write and a database trigger blocks every later edit, including
by the person who wrote them. When the date falls due the call is graded against
what shipped, and that verdict re-ranks what the team sees next.

I had this wrong at first and it is worth saying. I used to argue a competitor
could not rebuild your decision history. They can. Vercel's COO rebuilt why a
deal was lost out of Slack, email and call recordings, using an agent built in
two days. Causes survive. What nobody can rebuild is what a team believed before
it found out, because almost nobody writes it down.

I also do not build the code generator. That layer is a capital fight and the
models keep absorbing it. Supaprod decides what is worth building, dispatches to
whichever generator wins, and governs the result.
```
Zero revenue and zero outside users. I would rather lead with that than have it
found in paragraph four.

Public launch is mid-September. What exists today is a working product rather
than a market. It runs end to end, all three layers, and a reviewer can open a
login and use it.

What I can show in place of traction is the build. Ten weeks solo, 5,000+
commits, 530+ database migrations, and 37 scheduled jobs that advance the system
every minute without me starting anything. A film of it working:
https://youtu.be/x9WgGn0FyYU

One thing I will not overstate. The third layer is wired and proven end to end,
and it begins accruing on first real use. There is no history in it yet, because
nobody has used it yet.

The honest gap is not that there are no users. It is that I have had almost no
contact with them, and that is the thing to fix rather than more product.
Closing it is the entire next quarter, and it is the specific reason I am
applying to a program built around customer introductions rather than one that
only writes a cheque.
```
Roughly $1,000 a month, varying between about $500 and $1,500 with how much
agent work runs that month. That is AI model spend, infrastructure and tooling.
No salary drawn, no payroll, no office and no contractors.
```

### 10. How much money have you raised, from whom, at what valuation?

```
N/A. Nothing raised. No outside capital, no notes or SAFEs outstanding, and no
entity incorporated yet. Self-funded to date and I hold 100%.
```

---

## Additional Information

| # | Question | Answer |
| --- | --- | --- |
| 11 | Industry | **Enterprise** |
| 12 | Affiliation | **Global Founder** |
| 13 | Other UC campus | **N/A** |
| 14 | UC-affiliated status | **N/A** |
| 16 | How did you hear about SkyDeck | **LinkedIn.** No X/Twitter option exists. The advisor and alumni options were refused: both claim a warm connection and the advisor one asks *which advisor* |
| 17 | Former Pad-13 / IPP | **No, I am not a former SkyDeck Pad-13 or IPP startup** |
| 19 | Ethnic background (optional) | **Asian American / Asian** ticked. Optional and self-identified; clear it if unwanted |
| 20 | Female founders (optional) | **None** |

### 15. If a global founder, in what country is your company located?

```
India, Bangalore, today. No entity is incorporated anywhere yet, and that is
deliberate rather than pending: incorporation will be a Delaware C-corp, not an
Indian entity, so there is nothing to restructure later. I would relocate to
Berkeley for the batch, and being US-based is the plan regardless of the
outcome here.
```

**The question asks for a country and gets a paragraph on purpose.** A one-word answer of "India" leaves a reviewer with two silent doubts, whether there is an Indian entity to unwind and whether the founder will actually move. Both are answered before they are asked. The no-Indian-entity position is the standing doctrine: flipping an Indian Pvt Ltd to a Delaware parent later runs through FEMA and RBI share-swap rules and costs more than it saves.

### 18. If you previously applied, what has changed?

```
N/A. This is my first application to SkyDeck.
```

---

## 21. Overcoming an obstacle (optional, and answered)

```
For most of my career I could describe what needed building and could not build
it. I wrote the spec, handed it over, and waited. When the result came back
wrong I could not tell whether the idea had been wrong or the execution had,
and I had no standing to argue either way.

Two years ago I decided that had to stop. No computer science degree and no
spare time, so I learned by directing agents and shipping real things badly
until they stopped being bad. Before the version of Supaprod that stands today
I built and threw away four complete working ones. Each of them ran. Each was
built on an assumption about the problem that turned out to be wrong, and I
could not see it until the thing existed and I had to use it myself.

The harder one came earlier. Leaving ISRO is not a normal move in India. It is
the national space agency, people spend years trying to get in, and it is not a
job people walk away from. I left with nothing lined up on the other side,
moved to Germany for an MBA, and worked full time through the last eighteen
months of it.

What both taught me is the thing Supaprod is built around. I was wrong four
times in a row and only found out by shipping. The expensive part was never
being wrong. It was that nothing anywhere held what I had expected beforehand,
so each time I reconstructed my own reasoning from memory and mostly flattered
myself doing it. That is why the product freezes what a team predicts at the
moment of the call and grades it later, whether or not anyone wants to look.
```

**Optional fields left blank read as nothing to say.** This one earns its place by ending where the product starts: the obstacle is not decoration, it is the origin of the mechanism in answers 5 and 7. **No trait is ever named.** Persistence is four thrown-away versions; diligence is a full-time job alongside a degree. The reader supplies the word, which is the only way it survives.

---

## Before this submits

1. ~~Answer Q16.~~ **Done — `LinkedIn`.** *Heard from SkyDeck Advisor* and *founder/alumni* were both refused: each claims a warm connection we do not have, and the advisor option asks *which advisor*. There is no X/Twitter option.
2. **Re-derive both numbers** the hour of submission: `git rev-list --count origin/main` and `ls supabase/migrations/*.sql | wc -l`. They appear in answers 1 and 8 and must agree.
3. **Allocate a demo login.** `meridian@supaprod.ai` or `lantern@supaprod.ai` are the two free ones; record it on the Notion board. Answer 8 promises a reviewer can open a login, so that promise has to be real.
4. **Re-arm the approval queues.** Last armed 2026-07-28 on a 60-day runway, so they hold to late September. Interviews run 09-08 to 10-05, which is **past that**.
5. **Read every answer aloud.** Delete any sentence that stays true with a competitor's name swapped in.
6. Log the submission here, on the Notion board, and in [`../README.md`](../README.md).

## Related

- [`positioning.md`](./positioning.md) — what SkyDeck selects for
- [`application.md`](./application.md) — the superseded draft, written against guessed questions
- [`../answer-bank.md`](../answer-bank.md) · [`../positioning-doctrine.md`](../positioning-doctrine.md)
- [`../../yc/APPLICATION-FINAL.md`](../../yc/APPLICATION-FINAL.md) — supersedes all other sources on facts and numbers
