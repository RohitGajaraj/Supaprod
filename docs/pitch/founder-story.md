# The founder story

> _Created: 2026-08-07 · Last updated: 2026-08-07_

**One story, three lengths.** 100 words for an About page, 250 for a Product Hunt first comment, 500 for an investor or accelerator narrative. All three are the same story cut to fit, never three different stories, because the same person will read two of them.

**Sourced, not composed.** Every fact below already exists in this repo and is cited in [Provenance](#provenance). The strongest existing telling is [`applications/betaworks-ai-camp/record-these.md`](./applications/betaworks-ai-camp/record-these.md), which the launch tracker records as "more honest than most founder pages", and this file reuses it rather than rewriting it. Biography comes from [`applications/answer-bank.md`](./applications/answer-bank.md) §2, which is the canonical version.

**Four rules that govern every word here.**

1. **No fabricated traction or biography.** Zero organic outside users, zero revenue. Where a real fact is needed and the repo does not hold it, this file says `[FOUNDER TO FILL: …]` rather than inventing one. Those are listed in [Placeholders](#placeholders) and must be resolved before any of this ships.
2. **The brain learns, then guides.** Never "remembers", "stores" or "logs" of the brain on any public surface. The ratified tagline ending in "and remember" is superseded, per [`../../README.md`](../../README.md).
3. **Exact wording on the employer.** "Intellect, a leading BFSI technology OEM". Never the full legal name. Education shows TUM.
4. **One vulnerability beat per artifact.** The honesty section below is the source. Take one item from it, not the whole list, unless the form asks for the whole list.

---

## The 100-word version, for an About page

> **104 words.** For `/about`, a press kit boilerplate, a directory profile, a conference bio.

```text
I spent close to a decade between product and engineering. Satellite communication
systems at ISRO, semiconductors at Infineon in Munich, then senior AI product
manager at Intellect, a leading BFSI technology OEM, on the platform 200 financial
institutions build on.

Three industries, one job underneath. Carry context across a dozen tools, then
answer why we decided something from memory, months later, with the evidence
buried.

Agents made building cheap, so deciding became the bottleneck. I built Supaprod.
It tells you what to build, builds it, ships it, and learns from what happened,
so next time it guides the call.

I am its first user.
```

**Byline note.** An About page normally carries a location. `[FOUNDER TO FILL: the city and country to show on the About byline. The repo records the company as US-primary and no entity incorporated, and it never states where the founder is.]`

---

## The 250-word version, for a Product Hunt first comment

> **247 words.** Post it within a minute of the listing going live. Product Hunt readers reward the paragraph most founders delete, which is the fourth one.

```text
Hi Product Hunt. I am Rohit. Supaprod is the thing I wanted for ten years and
never had.

I spent close to a decade as the person between product and engineering.
Satellite communication systems at ISRO, semiconductors at Infineon in Munich,
then the AI platform at Intellect that financial institutions across seventy
countries build on. Different industries, identical job underneath: carry context
across a dozen tools, and answer why we decided something from memory, months
later, with the evidence buried in a thread nobody can find.

Then agents got good enough to do the building, not just draft it. Code has a
compiler, so it commoditized fast. Product judgment has no compiler. Feedback on
a bet lands in weeks. So the expensive half of the job is the half nobody
automated.

Supaprod is one loop instead of fifteen tools. It reads your signals and ranks
what is worth doing, red teams the bet before you see it, writes the spec, builds
it, and opens a real pull request a human still has to merge. Then it settles
what actually happened against the decision that caused it, and that changes what
you get shown next.

What I will not claim: no outside users, no revenue. Billing is built and
switched off. I am user zero, my own workspace is the demo, and that is both
deliberate and the honest limit of what I can prove today.

I am in this thread all day. Tell me where it breaks.
```

**Do not add to this comment:** a discount code, an upvote ask, a founder photo collage, or a second comment restating the same thing. Product Hunt's most common removal cause is soliciting upvotes, and the ask is unnecessary because the comment already earns the reply.

---

## The 500-word version, for an investor or accelerator narrative

> **452 words as written, about 497 once the placeholder paragraph is filled with the two sentences it asks for.** For a written application, a fund's "why you" field, a warm-intro email, or the spoken version at a partner meeting. Cut the boundary paragraph first if you need 400.

```text
The observation came before the product, and it came three times.

At 21 I was building satellite communication systems at ISRO, India's national
space agency, for its Moon and Mars missions. Hardware launches once. There is no
patch release. Then semiconductors at Infineon in Munich, after an MBA at TUM.
Then senior AI product manager at Intellect, a leading BFSI technology OEM, on
the AI platform that 200 financial institutions across 70 countries use to build
their own AI products.

Three industries that share nothing. The same job every morning: what do we build
next, and can you justify it.

Every product manager I worked with answered it the same way. Best guess, then
defend the guess. Not because people are bad at the job, but because every reason
you ever had is scattered. A thread somewhere. A call nobody recorded. Someone
asks in October why you shipped that thing in March, you know there was a good
reason, and you cannot find it.

[FOUNDER TO FILL: one specific instance, naming the feature and roughly when, of
a decision you were asked to justify and could not reconstruct. Two sentences.
This paragraph is the one an investor repeats to a partner, and a real instance
beats the generic version above by a wide margin.]

Then two things became true at once. Agents got good enough to do the work rather
than draft it, so the cost of building collapsed. And code, it turns out, has a
fast oracle: it compiles in seconds, an agent can iterate against it, and that is
exactly why building commoditized. "What should we build, and was that right" has
no fast oracle. Feedback lands in weeks to quarters. So the expensive half of
product work is the half nobody automated, and it is the half a model release
cannot absorb. Teams now ship ten times more and get it wrong ten times faster.

Supaprod is one loop instead of fifteen tools. Seven stations that agents walk
inside boundaries a human sets in advance. It ranks what is worth doing, red
teams the candidate before you see it, writes the cited spec, builds it, and
opens a real pull request a human still has to merge. Then it settles what
actually happened against the decision that caused it, and that verdict re-ranks
what you are shown next.

I found where the human boundary belongs by getting it wrong. Early on I approved
everything my own agents did. It felt responsible. What it did was turn me into a
queue, approving pull requests at two in the morning that I had not really read,
which is worse than not checking, because now my name is on it. So the product
splits it. Policy is set in advance and does not block. Permission is asked in
the moment and does. Three things stay yours no matter how good the agents get.
Merge. Revert. Delegate.

I am building the tool I needed for ten years, and I am its first user.
```

---

## The specific problem observed

State it as an observation with a date and a job attached, never as a market trend. The trend version is what every other applicant writes.

| What was observed | Where |
| --- | --- |
| The same job under three unrelated industries: be the human glue across a dozen tools, and re-answer "why did we decide this" from memory months later. | [`applications/answer-bank.md`](./applications/answer-bank.md) §3 |
| Nobody is good at deciding what to build, and it is not a skill problem. Every reason you had is scattered across a thread, a call nobody recorded, a doc nobody linked. | [`applications/betaworks-ai-camp/record-these.md`](./applications/betaworks-ai-camp/record-these.md), Video 1 |
| Approving every agent action turns the human into a queue. The 2am approval story is the observation that produced the policy-versus-permission split. | Same file, Video 3 |
| Product people at named companies now hand-build this out of a coding agent plus connectors plus context files. One described 1,500 hours on her own setup. | [`applications/answer-bank.md`](./applications/answer-bank.md) §3 |

**The binding constraint on this section:** zero first-party discovery interviews have happened. Never say "we spoke to N customers", never imply an interview count. Dogfooding is first-party evidence and is fair game; hand-rollers at named companies are secondary evidence and are cited as such.

## Why now

Three things became true at once, and only recently.

1. **Agents got good enough to do the work, not draft it.** Until roughly eighteen months ago the build half of the loop was not possible, so the loop could not close, so nobody could own it.
2. **Code got a fast oracle and judgment did not.** Code compiles in seconds, so an agent iterates against it, so building commoditizes. "What should we build, and was that right" gets feedback in weeks to quarters. The expensive half of product work is the half nobody automated, and it is the half that does not commoditize.
3. **The pieces arrived in the wrong order for an incumbent to notice.** Issue trackers own tickets, doc tools own documents, code tools own repos. None had a reason to own the outcome.

**The window is one to two quarters and it is closing.** Notion shipped feedback-to-a-merged-PR copy in July 2026. Whoever holds the outcome-verification loop first accumulates a record nobody can backfill. Full argument: [`../strategy/moat.md`](../strategy/moat.md).

## What makes it defensible

Say all three layers, and concede two of them. Conceding is what makes the third claim credible, and it is the part that separates this from a pitch.

| Layer | Defensible alone | The line to say |
| --- | --- | --- |
| **01 The director**, tells you what to build | **No, and we say so** | "Ranking what to build is a capability, not an asset. A frontier model with the same inputs gets most of the way there and closer with every release. It is what earns the first ten minutes." |
| **02 The operating system**, runs the lifecycle | **Partly, and for a while** | "The loop, the gates and the track record are months of real engineering, and they are buildable. A funded incumbent with distribution can construct the same route. It buys a lead measured in quarters. Its real job is to be the precondition for the third." |
| **03 The brain**, learns then guides | **Yes, and it is the only one** | "It needs your decisions joined to your outcomes, labelled over time. That data cannot be bought, scraped or synthesised, because it is produced by running the loop. And it gets more valuable as models commoditize: when everyone reasons equally well, the differentiator is whose context is better." |

**The compounding claim in one sentence, and the only one to close on:** a settled outcome changes what you are shown next, so the system gets better at your judgment the longer you run it, and that is the part no vendor can copy and no model release can absorb.

**The sentence to never say:** "it remembers your decisions", "where the record lives", "searchable history". Each claims less than the product delivers and gives away the argument.

---

## What is not yet proven

**Read this before using any block above.** The launch tracker records that this candour is the strongest asset with YC-style readers, so it is written to be said out loud rather than buried. Take **one** item into any single artifact. Volunteering all five reads as a confession; volunteering one reads as calibration.

| # | The honest limit | Where to say it | Verify before saying |
| --- | --- | --- | --- |
| 1 | **Zero organic outside users. Eight accounts, all founder or internal. No revenue. Billing is built, tested and deliberately switched off.** Say the number, then stop. Do not attach the silver lining in the same breath; it lands ten times harder as an answer than as a defence. | Everywhere, including public surfaces | [`../planning/SOURCE-OF-TRUTH.md`](../planning/SOURCE-OF-TRUTH.md) §0 the morning of |
| 2 | **The memory layer is scoped to the user who wrote it, not the workspace.** A successor inherits the record and not the compounded recall. So the phrase is "the record travels", never "the memory travels". | Volunteer it unprompted in any technical or diligence room. This is the highest-credibility single move available. | Still open as of 2026-08-07 |
| 3 | **The demo runs on the founder's own data, deliberately.** A seeded demo would prove the UI works. This proves the loop works. It is also the exact limit of what can be proven with zero outside users. | Any demo, any listing | Standing |
| 4 | **The compounding path is built and thinly exercised.** As of 2026-08-07 the write that settles an outcome against its decision had not yet completed in production. **Check this before repeating it**: the tracker's own §0 was wrong about it once in each direction. If it has since run, say so with the number; if it has not, say the code is built and the proof is pending. | Diligence rooms only, and only if current | [`../planning/LAUNCH-EXECUTION-TRACKER.md`](../planning/LAUNCH-EXECUTION-TRACKER.md) header and §E, both dated 2026-08-07 |
| 5 | **Nine separately shipped features were found doing nothing in production on 2026-08-02.** All nine passed typecheck and the full suite, two had unit tests asserting the defect as the contract, and none was found by reading code. A detector now exists. This is a strength if you tell it: it is why claims about what is shipped can be trusted. | Offer it when asked "how do you know what works" | Standing |

**Two things to refuse rather than soften.** A revenue date, because it depends on which of the first cohort converts and that is unknown. And a user projection. "I will not give you a number I cannot defend" is a strong answer and costs nothing.

**And the failure condition, stated in advance, because being asked for it unprepared is worse than volunteering it:** if the first cohort uses the ranking half and ignores the outcome half, the thesis is wrong, not the product. That is the specific thing being watched for.

---

## Placeholders

**Neither the 100-word nor the 500-word block ships until these are filled.** Both are marked inline.

| # | Placeholder | Where | Why the repo cannot supply it |
| --- | --- | --- | --- |
| 1 | `[FOUNDER TO FILL: the city and country to show on the About byline…]` | 100-word version, byline note | The repo records the company as US-primary with no entity incorporated, and never states the founder's location. |
| 2 | `[FOUNDER TO FILL: one specific instance, naming the feature and roughly when, of a decision you were asked to justify and could not reconstruct…]` | 500-word version, paragraph 5 | The existing tellings use a deliberately generic example ("that thing back in March"). No real instance is recorded anywhere in the corpus, and inventing one would be fabricating an anecdote. |

---

## Provenance

Every claim above traces to one of these. When one of them changes, this file changes in the same session.

| Fact | Source |
| --- | --- |
| Role arc, education, prior ventures, the "four thrown-away versions" | [`applications/answer-bank.md`](./applications/answer-bank.md) §2 |
| Problem statement, earned insight, how I know people need it | [`applications/answer-bank.md`](./applications/answer-bank.md) §3 |
| Users, revenue, what is proven versus not | [`applications/answer-bank.md`](./applications/answer-bank.md) §4 and [`../../README.md`](../../README.md) |
| The 2am approval story, the policy-versus-permission split, "merge, revert, delegate" | [`applications/betaworks-ai-camp/record-these.md`](./applications/betaworks-ai-camp/record-these.md) |
| Why now, the three layers, the moat table | [`../../README.md`](../../README.md) and [`../strategy/moat.md`](../strategy/moat.md) |
| Posture, answer length, what to concede in which room | [`founder-answer-playbook.md`](./founder-answer-playbook.md) |
| Build start date 2026-06-03, and the rule that every duration is recomputed at paste time | [`applications/answer-bank.md`](./applications/answer-bank.md) §0 |

> **Durations rot, so this file states no duration in weeks.** The first commit is 2026-06-03. Any answer that says "N weeks" recomputes N on the day it is pasted, per the answer bank. A partner reading a three-week-stale number reads it as carelessness about numbers generally.

## Related

| You need | Go to |
| --- | --- |
| The seven-step procedure for a new application | [`README.md`](./README.md) |
| Spoken answers, postures, the numbers card | [`founder-answer-playbook.md`](./founder-answer-playbook.md) |
| Reusable written answers at every length | [`applications/answer-bank.md`](./applications/answer-bank.md) |
| Show HN and Product Hunt listing copy | [`launch-assets.md`](./launch-assets.md) |
| The **third-person** bio a journalist prints, at 50 and 120 words | [`../growth/press-kit.md`](../growth/press-kit.md) §4. Same facts and same sources as this file, different voice. Neither is merged into the other, and neither drifts from `answer-bank.md` §2. |
| Where to post this story and where not to | [`../growth/community-plan.md`](../growth/community-plan.md) |
| What the code can actually prove | [`../features/lifecycle-signal-to-learning.md`](../features/lifecycle-signal-to-learning.md) |
