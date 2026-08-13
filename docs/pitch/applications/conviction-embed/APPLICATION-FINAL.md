# Conviction Embed — every field, as filed

> _Created: 2026-08-14 · Last updated: 2026-08-14_

> 🚀 **SUBMITTED 2026-08-14 by the founder, to Conviction Embed Winter 2026.** Confirmation screen received. Every answer below was verified character-for-character against the live form before submission, so this is the filed text.
>
> **Application ID:** `73794e94-33a1-43c1-95a9-7b8fedd39d26`
>
> **🔗 ENDORSEMENT LINK, AND IT IS AN UNUSED LEVER:** `https://embed.conviction.com/endorse/73794e94-33a1-43c1-95a9-7b8fedd39d26`
> The confirmation invites mentors and advisors to endorse the application. **No other programme on this tracker has offered a third-party signal after submission.** For a solo founder whose weakest line is being unvouched-for, this is the single highest-leverage thing left. It costs nothing and it is not automatic — it only happens if someone is asked.
>
> **Form:** `https://embed.conviction.com/apply` · **Programme:** Embed, **Winter 2026** cohort
> **Terms: $250K on an uncapped, no-discount MFN SAFE**, plus $350K AWS, $350K Azure and $500K+ across OpenAI, Anthropic, Baseten, Pinecone, Vercel and Weights & Biases. Early access to Mistral models.
> **Shape:** remote-first. **One mandatory SF retreat, 11-13 September.** Demo day **12 November**.
> **No published deadline.** Applications close when the cohort fills, and the retreat is weeks away, so this is time-critical.

**Why this programme.** Solo founders are explicitly welcome. The terms are unusually founder-friendly for pre-seed, an uncapped no-discount MFN SAFE sets no price. And **$1.2M+ in credits against a ~$1,000/month burn is effectively unlimited runway.**

---

## The form's own mechanics, so the next person does not rediscover them

**28 fields: 8 text inputs, 11 textareas, 5 checkboxes, 3 file uploads, 1 submit.** No character limits on any field, and **no `maxLength` anywhere** — the answers can be as long as they earn.

**It is a React-controlled form and rejects programmatic values.** Setting `.value` with the native setter plus `input` and `change` events leaves the DOM looking right and the React state empty, so nothing submits. **Type for real.** Tab order follows the DOM exactly, including through checkboxes and file inputs, so tabbing between fields is reliable.

> ⚠️ **The four progress checkboxes are marked with an asterisk but are NOT required** — verified: `required=false` on all five checkboxes, and the form is not `novalidate`. **Leaving *Do you have users?* and *Do you have revenue?* unchecked does not block submission.** The asterisk is decorative.

> ⚠️ **Checking *"Are you currently fundraising?"* reveals a new required field, *"Tell us about your current fundraise."*** It is unchecked here deliberately: there is no entity, no SAFE, no target and no timeline, so there is nothing to put in that field. **The F6S answer said "raising, pre-seed" because that form asked about intent; this one asks about an active process and then demands the details.**

**Video limits are real and both of ours exceed them.** The founder video is **required, maximum two minutes**; ours runs **2:32**. The demo video is optional, same cap; ours runs **2:22** (142.1s). Both were attached over-length as a deliberate founder call.

| Upload | File | Size |
| --- | --- | --- |
| Founder video (required) | `Supaprod-Founder-Pitch.mp4` | 63 MB — **the founder must drag this in**, it exceeds the 10MB browser-automation cap |
| Demo video (optional) | `public/film/supaprod-film-720.mp4` | 9.0 MB — under the cap, uploadable |
| Pitch deck (optional) | `../../shareables/Supaprod-Investor-Briefing.pdf` | 314 KB — the one-page link card, not the 16-page deck |

---

## About You

### Name · Email · LinkedIn · Personal website · Github

```
Rohit Gajaraj
founder@supaprod.ai
https://www.linkedin.com/in/rohit-gajaraj/
https://supaprod.ai
https://github.com/RohitGajaraj
```

**Do you have any cofounders?** — unchecked.

### When did you start working on this? When were you full time?

```
Started in June 2026, ten weeks ago, and full time from the first day.

About a month of nights and weekends on the prototype before that. I am on
notice at my product role, so Supaprod has all of it now.
```

> **This answer was rewritten once, and the reason is the lesson.** It first read *"I am going full time on Supaprod regardless of how this application goes. That decision is already made."* **The question asks two factual things and got career defence nobody requested.** Founder ruling 2026-08-14: answer what was asked and stop. See [`../how-to-draft-the-next-one.md`](../how-to-draft-the-next-one.md) rule 0c.

### What have you done that's exceptional?

```
At 21, I was building satellite communication systems at ISRO, India's space
agency, for its Moon and Mars missions. A spacecraft already millions of
kilometres out, that nobody could reach and nobody could fix. Hardware launches
once. There is no patch release and no second attempt, so everything has to be
right before it leaves the ground. The systems I worked on flew.

The second one is more recent and much less glamorous. Two years ago I could
not ship production software at all. I learned to build by directing agents,
and Supaprod is what came out of that: ten weeks solo, 5,000+ commits, 530+
database migrations, running end to end.

Four complete working versions came before this one and I threw all four away.
Each of them ran. Each was built on an assumption about the problem that turned
out to be wrong, and I could only see it once the thing existed and I had to
live with it. Learning to kill my own working software took me most of a year,
and it is the skill I would least like to lose.
```

> **Two founder corrections landed here.** The first draft named **Chandrayaan-2 and Mangalyaan**, breaking the rule in [`../../yc/founder-profile-answers.md`](../../yc/founder-profile-answers.md) line 174 — *say Moon and Mars missions, never the mission names.* The second draft then dropped **the sentence that carries the whole image**: *"A spacecraft already millions of kilometres out, that nobody could reach and nobody could fix."* **That line does the work. Never cut it for length.**

### What's something weird or niche you were obsessed with? How much time did you spend on it?

```
Public postmortems. The ones where a company or an agency lays out exactly how
they got something wrong and what they changed because of it.

I started my career on satellite programmes, where the failure review is the
real literature and everyone reads it, and I never lost the habit. Space
agencies, airlines, infrastructure teams, cloud providers. Roughly a decade of
it, most weeks, with no use in mind at all.

It is a little funny in hindsight, because it turns out I am building a company
around exactly that: someone writing down what they decided, what they expected
to happen, and what they would do differently. The thing I read for fun became
the product.
```

**This is the strongest answer in the application** and it is the only one that arrives at the product sideways. The obsession is real, predates the company by a decade, and lands on the thesis without ever arguing for it.

### What other ideas did you consider working on?

```
This is the one, and the alternatives were all earlier drafts of it. Four
complete working versions came before this, each set aside once I could see it
was answering the wrong half of the question. The closest survivor was a
dashboard, and it became the layer that tells a team what to build.

Before this I founded a bubble tea venture, incubated at IIM Bangalore's NSRCEL
and recognised under Startup India. Different industry, same lesson: it was the
first time I owned a call with nobody above me to approve it, and the first time
I found out what a wrong one costs.

I have wanted this to exist for about ten years. Building it was less a decision
than finally having the tools to.
```

> **Cut from this answer: *"I did not shop for an idea."*** It rebuts an accusation nobody made. See rule 0b.

---

## About the Company

### Company name · Company website

```
Supaprod
https://supaprod.ai
```

### In a single phrase, what does your company do? (e.g. Uber for dogs)

```
Tells a product team what to build, ships it, then learns what worked and
guides the next call.
```

> **Rewritten on founder direction 2026-08-14.** It first read *"Agents that decide what to build, ship it, and grade the call."* — *"decide"* is not the claim. **The claim is that it TELLS a team what to build**, and that is the part nobody else sells. The phrase now runs door, body, brain in that order.
>
> ⛔ **"Cursor for product managers" was considered and must not be used.** It is **banned on any surface** ([`../../../research/claims-audit.md`](../../../research/claims-audit.md) line 125, and the investor never-list at `README.md:280`). It also under-claims: Cursor assists someone who has already decided, and the whole argument is that deciding is the hard part.

### What problem is your company solving?

```
Building got cheap inside eighteen months. Deciding what to build did not.

82% of product people report AI already makes them measurably more productive,
and over the same stretch burnout went from 44.7% to 55.7%, with the top fear
being expected to do more for the same pay. Speed is solved. Nobody needs more
output.

Every tool sold to a product team helps them do the work faster once somebody
has already decided what the work is. Nobody sells the deciding. That is still
one person, alone, guessing, and then defending the guess months later from
memory, because nothing anywhere holds what they expected to happen.

Now that agents will build whatever you point them at, that gap is the whole
game. You can ship ten times more and be wrong ten times faster.
```

### What is your company building to solve it? How did you decide on this product?

```
Three layers, and each one is what makes the next possible.

It tells a team what to build. Agents read everything the team already has,
wherever it sits: product data, market and competitor intelligence, customer
voice, analytics, and the team's own vision. They cluster it into what is worth
looking at, argue down the weak bets, and come back with a call and the evidence
behind it. Something a team can argue with, not a summary.

It builds and ships it. The spec is written with its evidence attached, then the
work is planned, designed, built, opened as pull requests, shipped, and written
up. A person approves and merges, and that is the only step where a human is
required.

It learns what happened and sharpens the next call. When a decision is
committed, the team's own expectation goes down with it: what they think will
happen, how they will know, and by when. Those three fields lock on write and
cannot be edited afterwards, not even by the person who wrote them. When the
date falls due, the call is graded against what actually shipped, and that
verdict re-ranks what the team sees next.

How I got here: four complete working versions came before this one, and each
taught me something the previous one had hidden.

The last one taught me the thing that matters. I had believed a competitor could
not rebuild a team's decision history, and I was wrong. Vercel's COO
reconstructed why a deal was lost out of Slack, email and call recordings, with
an agent built in two days. Causes survive. What does not survive is what a team
believed before it found out, because almost nobody writes that down. So that
became the product: capture the expectation at the moment of the call, and make
the capture a byproduct of doing the work rather than a form to fill in.
```

**This carries the single vulnerability beat for the whole application** — the moat falsification. Per the YC rule, there is exactly one, and a second admission would dilute it.

---

## About your Progress

### What have you built and shipped so far?

```
It runs end to end today, and a reviewer can open a login and walk the whole
loop.

Ten weeks solo: 5,000+ commits, 530+ database migrations, and 37 scheduled jobs
that move the system forward every minute without anyone starting them. That
last part is why one person can ship at this pace.

What is live: agents read the signals and cluster them, argue down the weak bets
and come back with a call and its evidence, write the spec, plan and design the
work, build it, open real pull requests behind a merge gate no agent can cross,
ship, and write the release notes. The team's expectation is captured when a
decision is committed and locks on write, and the half that grades it against
what shipped went live this week.

Supaprod is in private beta, invite-only. Signup closed on 7 August and entry is
by invite code. Public launch is mid-September.

I use it every day for my own product work, so its rough edges reach me first.
```

> **This is the field the never-volunteer-the-zero ruling governs**, and it opens on what works rather than what is missing. **It also had a killed claim removed:** *"Supaprod's own roadmap runs inside Supaprod"* was struck from the YC application under its rule 6 — it does not survive its own database, **344 missions against 27 completed** — and it was written into this draft anyway before being caught.

### Who are your competitors? Why will you win?

```
The real competitor is not a company, it is a stack. A PM runs discovery in one
tool, writes the spec in a second, designs in a third, hands code to agents in a
fourth, ships behind flags in a fifth, and reads the result in a sixth. Every
one of those is excellent at its step. None of them decides what the work should
be, and none tells a team afterwards whether they were right. The tax is the
seams: context gets re-entered at every handoff, and by the third one the
reasoning behind the call is gone.

The named ones are moving fast. Notion shipped Ship OS free in July. Atlassian
launched Product Collection in May, positioned around better decisions. Linear
hands issues to coding agents. ChatPRD drafts specs for 100k+ PMs. Cursor and
the labs generate the code. Each owns a step and is getting better at it.

The other real competitor is a folder of markdown files. Teams hand-roll this
and it holds up until a second person or a fleet of agents touches it. Every
do-it-yourself success I found is one operator in one context; every failure is
multi-person or multi-agent.

Why we win: none of them owns the path between the steps, and a feature does not
close that. Grading a decision needs the call and its outcome inside one system,
and a handoff is exactly where those two get separated. Owning the whole loop is
what makes the third layer available at all.

Where we deliberately do not compete: the code generator. That layer is a
capital fight and the models keep absorbing it. Supaprod decides what is worth
building, dispatches to whichever generator is best, and governs the result, so
a better model makes this better the same day.
```

> **Cut from this answer: *"Named, so this does not read as evasion."*** Pre-arguing with the reader mid-sentence. Name them and move on.

### Why now?

```
Two things had to be true at once, and they only both became true this year.

Agents got good enough to do the work. Eighteen months ago a coding agent was a
demo. Now it opens real pull requests against a real codebase and a person
merges them. That is what makes the middle layer possible at all.

And the org chart is changing underneath the tooling, which is what creates the
buyer. Instagram replaced its roughly thirteen-person canonical team with pods
of four to six engineers led by what Mosseri calls product staff, one person
absorbing design, data and research. One person now carries calls that used to
be split across five specialists, and that seat has no system of record. Every
tool they use was built for the shape of team being dissolved.

The timing matters more than usual for one reason. A team's expectation at the
moment of the call is the single part of a decision nobody can reconstruct
afterwards. Whoever is there as teams start handing real work to agents captures
it, and anyone arriving later inherits a gap they cannot backfill.
```

### What do you want to get done by the end of the batch?

```
Demo day is 12 November, so this is a thirteen-week window, and I want four
things out of it.

Teams running their real product work inside it, with the roadmap driven by what
they hit rather than what I predict. Public launch is mid-September, right as
the batch gets going.

The first graded calls. Every expectation captured today comes due on its own
horizon, and by demo day the earliest ones will have resolved. That is when the
calibration record stops being a mechanism I describe and becomes a number I can
show. It is the most valuable thing that can happen in this window, and it is
the one thing that cannot be pulled forward by working harder.

Pricing tested against real usage. The model is a workspace subscription plus
usage credits for agent runs, so revenue tracks how much work the agents do
rather than headcount. It is the number I most want to be wrong about early.

And the first hire, a founding engineer. Taste and judgment are the two things I
cannot hand to an agent.
```

**The second paragraph is the strongest argument in the application for this programme specifically**, because it names something that becomes true *during* the batch and cannot be accelerated by effort. It gives the reader a reason the timing is theirs.

### The four progress checkboxes

| Question | Answer | Why |
| --- | --- | --- |
| Do you have users? | **unchecked** | True, and it answers structurally so no prose has to |
| Do you have revenue? | **unchecked** | Same |
| Have you already raised capital? | **unchecked** | Nothing raised, no notes or SAFEs outstanding |
| Are you currently fundraising? | **unchecked** | **Checking it opens a required "tell us about your current fundraise" field** and there is no round, target or timeline to describe |

### Anything else?

```
Two links that show more than a form can: the product film at
https://youtu.be/x9WgGn0FyYU, and the briefing at https://supaprod.ai/brief.
The deck is attached above.

Why Embed specifically. I have built the thing I spent ten years wishing
existed, and I built almost all of it alone. What I am short of is not more
building time. It is proximity, both to people who have watched this stage go
wrong before and to teams who will actually put it to work. A remote cohort with
a real weekend in the room is aimed at exactly that.

Solo today, and open to a cofounder who shares the thesis.
```

> **The cofounder line was cut down twice.** It read *"On cofounders I answered no… and not looking for one out of anxiety about the box."* **The checkbox already answered it, and restating a form answer in prose tells a reader you think they missed it — then the defence attached to it looks necessary.** One light line does more.

---

## Filed. What is owed now.

1. 🔗 **Send the endorsement link. This is the live action and it has a shelf life.** `https://embed.conviction.com/endorse/73794e94-33a1-43c1-95a9-7b8fedd39d26` — an endorsement is worth most while the application is still being read, so this is a this-week job, not a someday one. Candidates are people who have watched the work directly rather than the most senior names available.
2. ⏳ **Rolling admissions, which changes the urgency of point 1.** Their own wording is *"rolling admissions over the month"* — decisions come continuously rather than on a cutoff date, **so an endorsement that arrives after the file has been read is worth nothing.** Send it in days, not weeks.
3. **Duration: plan on roughly two months, September to mid-November, and do not quote a figure back to them.** Their site publishes no length. The two dates it does publish, retreat **11-13 September** and demo day **12 November**, span **nine weeks**, while a secondary source describes Embed as an **eight-week** programme. The conflict is unresolved, so the honest form is *about two months*.
4. **No interview process is published.** No stages, no timeline, nothing on what follows submission. **Do not assume an interview stage exists.** They state selectivity as *"<1% selection in first batches"*.
5. ⚠️ **Both videos went in over the stated two-minute cap** — founder 2:32, demo 2:22. If the programme comes back on length, a 2:00 cut of either is a small job.
6. **Numbers in the filed text are frozen at 2026-08-14**: 5,000+ commits, 530+ migrations, 37 scheduled jobs, ten weeks. **Re-derive rather than re-quote** in the next application.
7. **Log the outcome** in [`../README.md`](../README.md) and on the [Notion Application Board](https://app.notion.com/p/4014ff9cb1c240c9a3b761e790852970), with the decision date and their exact words. **Record what they actually say, never a paraphrase** — South Park Commons was written up as *"not the right fit"* when no reason had been given at all.

## Related

- [`../how-to-draft-the-next-one.md`](../how-to-draft-the-next-one.md) — **read first.** Every correction that shaped this application
- [`../answer-bank.md`](../answer-bank.md) — the facts and the founder record with dates
- [`../positioning-doctrine.md`](../positioning-doctrine.md) — the seven rules
- [`../../yc/APPLICATION-FINAL.md`](../../yc/APPLICATION-FINAL.md) — its five craft rules and the sixth above them bind every application
- [`../berkeley-skydeck/APPLICATION-FINAL.md`](../berkeley-skydeck/APPLICATION-FINAL.md) — filed 2026-08-13
- [`../../shareables/README.md`](../../shareables/README.md) — the deck, the link card, the videos
