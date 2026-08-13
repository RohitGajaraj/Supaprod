# Berkeley SkyDeck, Batch 23 — the answers, ready to paste

> _Created: 2026-08-13 · **Deadline 2026-08-21, 11:59pm PT** · Apply at `https://www.f6s.com/skydeck-batch-23/apply`_
>
> ⚠️ **These answers are drafted against the fields F6S typically requests for SkyDeck.** Check the actual form and adjust field order as needed. Do not compose fresh; pull from [`../answer-bank.md`](../answer-bank.md) and trim to the form's limits.
>
> **Numbers, pulled 2026-08-13: 5,000+ commits, 530+ migrations, ten weeks (exact: 5,131 / 532).** Re-run `git rev-list --count origin/main` and `ls supabase/migrations/*.sql | wc -l` the hour you submit.
>
> **No em dash appears in any block below.** Nothing sends without the founder's approval.

---

## Company

```
Supaprod
```

## URL

```
https://supaprod.ai
```

## One-line description

```
The operating system a product org runs on when agents do the work. Agents read your signals and tell you what to build; you decide; they build and ship. Every call is recorded and graded against the outcome.
```

---

## 1. What are you building?

```
Supaprod is the operating system a product team runs on when AI agents do the
work. The closest thing to explain it: Cursor, but for the whole product
lifecycle instead of the code editor.

It reads your user feedback, product data, competitors and market and tells you
what to build. It argues against weak bets before you commit. Then it writes the
spec, plans the work, directs the build, ships behind gates you control, and
checks what actually happened.

Three layers, in order: the director tells you what to build. The operating
system runs the whole lifecycle. The brain remembers and guides: it records
every decision with its evidence, grades it against the outcome, and re-ranks
the next bets based on what worked.

What makes it durably useful: the forecast. At the moment a team commits to a
decision, we freeze what they expect to happen, how they will know, and by
when. A database trigger blocks every later edit. When the date passes, the
call is graded against what shipped. That record cannot be backfilled and it
cannot be faked. A competitor could copy the first two layers in a month; they
cannot speed up time.
```

_~250 words. Trim from the top if the form has a tighter cap._

## 2. Why now?

```
Two curves crossed this year. Agents got capable enough to do the work. The
cost of building collapsed, and now every company is about to run on fleets of
agents.

But agents magnified the old problem instead of solving it. Engineers got faster.
Product decisions became the bottleneck. And now a human answers for work they
did not type and often did not fully direct.

82% of product managers already measure productivity gains from AI. But they
report they got faster at shipping without getting better at defending why.
Burnout rose from 44.7% to 55.7% in the same window, with the top fear being
expected to do more for the same pay.

Speed is solved. Judgment is not. And this specific infrastructure layer gets
decided in the next two quarters, not the next two years. After that, every AI
company will have chosen whether judgment lives in Slack threads or in a system
that can grade it, learn from it and warn before repeating what was wrong.
```

_~160 words._

## 3. Why are you the person to build it?

```
I spent close to a decade being the person who had to defend the call. Satellite
communication systems at ISRO, where hardware launches once and there is no
second release. Then product at Infineon, where supply chains run on margins.
Most recently senior AI product at Intellect, a BFSI technology OEM. That
company's platform is used by 200+ financial institutions across 70+ countries,
in a domain where the question "the model decided" terminates every
conversation.

In every one of those roles the real work was being the glue across a dozen
tools and a dozen stakeholders, and re-answering the same question from memory:
why did we decide this.

I did not write a proposal for this company. I built it to stop doing that work.
And then I shipped it solo, which is the other proof the thesis is sound.

Ten weeks. 5,000+ commits directed and reviewed. 530+ database migrations. No
non-founder has touched the codebase. Every line goes through typecheck, build,
and a review pass before merge. An independent reviewer audits it for security
and against the register.

Supaprod's own roadmap runs inside Supaprod. The product itself is the proof that
what it claims to do is possible. A founder can say they started a company. That
founder can point to a shipped system. Showing that the thesis of the product
is true about the founder is not common.
```

_~280 words. Trim from the bottom if needed._

## 4. What is your market size?

```
TAM: $300B+ per year. Roughly 2.6M product managers globally at $115K loaded
cost. The work is paid for today as headcount.

SAM: $2B to $12B per year across two motions. Transform: 650K existing product
teams. Create: 500K new agent-native organizations by 2030, who will not hire
headcount for product work.

SOM at launch: about $47M ARR from the agent-native tenth at launch pricing.

The tailwind is real. Building commoditized faster than anyone modeled. As the
cost of building collapses, the ratio of product people to engineers inverts
and one person ends up directing a fleet. That shift is structural, not cyclical,
and it is happening now. Coinbase already runs single-person teams on agent
fleets. More will follow.
```

_~120 words._

## 5. What is your traction?

```
No outside users and no revenue yet. I built the engine before opening the
doors, which was the right call for solo and the wrong call for learning fast.
The public launch is mid-September.

What exists instead is a working end-to-end system that you can test today. I am
user zero. Supaprod's own roadmap runs inside Supaprod. Its agents plan the work,
write real code, and open real pull requests behind a merge gate no agent can
cross. Every call along the way sits in the audit trail with its evidence.

That proves the product functions end to end before I ask anyone to trust it. It
is a different claim from proving anyone wants it, and I do not blur them.

Ten weeks of build: 5,000+ commits and 530+ database migrations. A public walkthrough
at https://supaprod.ai/film. Demo login on request.

One correction worth volunteering early. I was quoting product numbers I was
proud of. Re-checking them, the query separating my demo data from real work
matched on the shape of a workspace id, and demo workspaces get ordinary ids. The
real count was zero. I shipped a column so the two can never blur again. A
competitor can copy features. They cannot speed up the moment I found the bug and
fixed it.
```

_~220 words. The self-correction stays; it is credibility insurance._

## 6. Who is on the team?

```
Solo. Me. Everything designed, built, shipped, tested, and analyzed by me with
AI agents as a tool, not as an excuse. I read and review every line. Every
change goes through typecheck, build, and review before merge.

I direct all of it. No agent makes a call without evidence and a human approval
gate. No non-founder has touched the codebase.

I am open to a cofounder who adds a perspective I do not have and moves at this
speed. For now, solo, and it is the reason the company exists. The thesis is
that this is possible. I am the proof.
```

_~90 words._

## 7. Why Berkeley SkyDeck?

```
You count founders who ship proofs, not proposals. I shipped a proof.

You embed engineering rigor with product thinking. This company is both: BFSI
infrastructure experience built the agentic operating system that every product
team will need.

You invest in the infrastructure layer. SkyDeck picks the system that everyone
will build on. This is the system that decides what to build, runs the lifecycle,
and learns from the outcome. Every AI-first company will need to choose whether
this layer lives in their own codebase or in a system they adopt. That layer is
being decided now.

And you support founders who move fast. I built this alone in ten weeks. The
next ten weeks are the next tenfold. A program that gets out of the way and
connects instead of slowing down is exactly right.
```

_~140 words._

## 8. How big can this get?

```
Large. Not in the way most software scales, where you hit a ceiling when you
need to hire people. This one inverts that. The bigger your team of agents, the
more you need a system where judgment is recorded and outcome-checked.

The moat is the decision-and-outcome record that cannot be backfilled. A
competitor can copy the first two layers: tell you what to build, and build it.
They cannot speed up time to capture the forecasts and grade them against
outcomes.

I am moving slowly on pricing. The early bet is that this lands first at small
teams and founders who run on AI-first fleets. It expands into teams and
enterprises once they feel the governance burn from unrecorded decisions.

Enterprise TAM exists today, split across a tracker, a docs tool, a spec tool, a
coding agent, and status meetings. That budget moves to a system that unifies
it.
```

_~130 words._

---

## Access for a reviewer

**No login needed to see it work:** https://supaprod.ai/film (2:22), then https://supaprod.ai/p/teardown (one agent critiquing a real product decision, 20 seconds). **Do not describe the teardown as evidence of the full loop.** It is a single model call with a forced output schema; it shows the quality bar of one agent's judgment, nothing more. It is in the product because product teams asked for it.

**To see the full operating system, request a demo login.** Supaprod's roadmap runs inside the product. You can watch decisions being made, approved, sent to the build queue, graded on outcome, and re-ranked.

## Before submitting

1. Re-run both numbers. The commit count and migration count drift. Run the commands the hour you submit.
2. Open the F6S form and verify the field order and character limits. Cut these blocks from the bottom up.
3. Read every answer aloud. Delete any sentence that stays true if you swap in a competitor's name.
4. Record the submission in [`../README.md`](../README.md).
5. Nothing sends without the founder's approval.

## Related

- [`positioning.md`](./positioning.md) — what SkyDeck selects for and the angle in
- [`../answer-bank.md`](../answer-bank.md) · [`../positioning-doctrine.md`](../positioning-doctrine.md)
