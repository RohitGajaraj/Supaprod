# EF The Bridge Residency — the answers, ready to paste

> _Created: 2026-07-31 · Last updated: 2026-08-14_

> _Form captured 2026-07-31. Page 1 of 2, "Your Achievements". Questions verbatim._
> **Deadline 2026-08-30.** Reviewed on a rolling basis, so earlier is better. **Save for later** works, use it.

> ## ✅ Corrected 2026-08-10 — this is the only unsubmitted application in the folder
>
> The other three went out on 2026-07-31 and are frozen as archived records. **This one has not been sent, so it is corrected in place** rather than annotated. Three changes:
>
> 1. **Numbers re-derived, not copied.** Live tonight: **4,876 commits**, **508 migrations**, **nine weeks** since the first commit on 2026-06-03. The old drafts said 4,297 and eight weeks, which were true on 2026-07-31. Re-derive again the hour you submit: `git rev-list --count origin/main`.
> 2. **The "most important problem" answer now says the true thing about what cannot be rebuilt.** It used to lean on the record being hard to copy. That is false: the reasons behind a decision survive in Slack threads and call recordings, and someone rebuilt a year of them with an agent he made in two days. What nobody can rebuild is what a team expected *before* the outcome landed, because almost nobody writes that down.
> 3. **Nothing else moved.** EF is buying the person, not the company, so the product claims here are deliberately thin and stay that way.

> ## ⛔ Two constraints that shape everything
>
> **1. Every field is capped at 100 words.** The counter reads "100 of 100 left". Every answer below is counted and under. Verify the counter treats them as words, not characters, the first time you paste; if it is characters these all need rewriting and I will do it.
>
> **2. The video is a NEW video.** EF: _"Do not pitch an idea or a CV. Help us understand who you are."_ Your Betaworks founder video is a career-background piece, which is precisely what they are telling you not to send. Script at the bottom.

> ## The one thing this whole application turns on
>
> EF buys **talent before ideas**. This programme's own words are "pre-idea, pre-team, or just getting started", and you have a working product. So Supaprod never appears as the thing being funded. It appears as **evidence of the talent they are buying**. You are not asking them to back a company; you are demonstrating the exact thing their thesis bets on, that one person can now build what a team used to.

---

## Where did you learn what you know? *

> _"Let us know what university you attended, company you worked at, or mentor you worked with."_

```text
Mostly on the job, in places where being wrong was expensive. At ISRO, building satellite communication systems for its Moon and Mars missions, where hardware launches once and there is no patch release. Then an MBA at the Technical University of Munich, and semiconductors at Infineon. Then three years putting AI into banking at Intellect, where nobody accepts "the model decided".

The last two years I taught myself to build. I went from writing specs and waiting on engineers to shipping production software by directing agents. Self-taught, out of necessity, and the most useful thing I know.
```

## Please record a one-minute video introducing yourself *

> _"Do not pitch an idea or a CV. Help us understand who you are providing additional information to your application. Please share a public link we can access."_

```text
[Paste the link once recorded. Script at the bottom of this file. Unlisted YouTube or Drive set to anyone-with-link, and test it in incognito.]
```

## If you are technical: what's the most impressive technical product or project you've led/owned?

> _"What was your role and contribution? Why was it technically impressive?"_

```text
Supaprod, which I am building now. It tells a product team what to build, builds it, and grades whether the call was right. Nine weeks, alone, 4,876 commits directed and reviewed.

The interesting part is the governance layer. Every AI call routes through one runtime chokepoint carrying budget, guardrails, tracing and fallback, so the system is model-agnostic and every agent action lands in the audit trail by construction rather than by instrumentation. Agents earn autonomy from their own track record, with floors on merge, revert and delegate they never cross.

I designed it and directed the agents that wrote it.
```

## If you are technical: tell us more about things you've built before.

> _"For example apps you've built, models, open source contributions. Include URLs if possible."_

```text
Before this there were four complete versions of the same idea, each built and thrown away. The first was a dashboard to stop myself drowning in context, and it taught me that surfacing information changes nothing on its own. Each later one fixed the previous gap and exposed a new one: agents that could act but that I could not trust, then gates I could trust with nothing remembering whether the call had been right.

At Intellect I built a 500-test LLM evaluation suite and A/B tested six frontier models in production, cutting inference cost 35% at 99.2% accuracy.

supaprod.ai
```

## What's the most impressive commercial outcome you've driven or revenue you've earned? *

> _"What was your role and contribution?"_

```text
At Intellect I shipped AI digital onboarding from zero to 100,000 end users across 50 financial institutions: $1.5M revenue and $4.2M pipeline within eight months.

I owned it end to end, not one feature inside it: the customer profile, pricing tiers from $5K to $50K, the launch, the sales enablement. Across three AI modules I took to market, first-year revenue was $3.2M, retention moved from 80% to 94%, and contract value rose 22%.

The part I am proudest of is unglamorous: the evaluation layer underneath, because in banking a wrong answer lands on a real person.
```

## What are you obsessed about? How did you get into it? How do you sustain it and keep learning? *

> _"This can be a problem, a product, skill or hobby."_

```text
How people decide things, and why almost nobody keeps a record of it.

I got into it by being the person who could not answer. Ten years of product work, and every few months someone would ask why we shipped something, and I knew there had been a good reason and could not find it.

I sustain it by being my own most demanding user. My roadmap runs inside my own product, so every gap shows up in my week rather than in a document. And I read public failure postmortems the way other people read books.
```

## Have you participated in national or international competitions? *

> _"List any competitions/awards you have won, or papers you've published."_

```text
An earlier venture of mine was incubated at NSRCEL, the entrepreneurship centre at IIM Bangalore, and recognised under the Government of India's Startup India initiative.

My MBA thesis at the Technical University of Munich examined the creator and ownership economy in Web3.

I have not competed in programming contests or published papers, and I would rather say so than stretch. What I have instead is a shipping record: 401 features specced and 362 shipped in nine weeks, independently audited against the actual codebase.
```

## Have you ever started a business before? *

> _"Tell us about it: outcomes, learnings."_

```text
Yes, once, and it failed usefully. At IIM Bangalore I founded a food and beverage venture, one of the first attempts to bring bubble tea to the Indian market. I took it from recipe formulation through unit economics, user testing and supply chain. It was incubated at NSRCEL and recognised under Startup India, and I set it down to go build product full-time.

The learning that stuck: I validated that people liked the product and never validated that they would buy it at a price that worked. I test the price before the product now.
```

## What's a strong opinion you've held and acted on, even when smart people you respected told you were wrong? What happened? *

```text
That governance should not mean approval. Everyone I described this to, including people whose judgment I trust, said the safe design was a human approving each agent action. So I built that first.

It turned me into a queue. I was up at two in the morning approving things I had not really read, which is worse than not checking, because now my name was on it.

So I inverted it. Policy is set in advance and does not block; permission is asked in the moment and does. Almost everything should be policy. Three things stay human: merge, revert, delegate.
```

## Tell us about a time you got into a room you weren't invited to. *

> _"Why and how did you do it, and what did you do once you were inside?"_

```text
I wanted to move from hardware and communication engineering at ISRO into product, and I had neither the title nor an obvious path.

So instead of applying and waiting, I started doing the work before anyone gave me permission. I wrote requirements nobody had asked me for, took them to the teams that needed them, and made myself useful enough that the role became a formality.

Once inside I used it: I led product requirements across three satellite communication systems and twelve missions, coordinating with NASA, ESA and JAXA. I have repeated that move at every industry switch since.
```

## What do you think is the most undervalued commercial opportunity or most important problem to work on in the next 10 years? *

```text
Knowing what to build, and being able to defend the call afterwards.

Everyone is automating execution, because it demos well. But nobody was ever short of things to build. They were short of knowing which ones mattered. Agents will build anything you point them at, so teams ship ten times more and are wrong ten times faster.

It stays scarce because there is no fast feedback. Code has a compiler; product judgment does not. You find out in six weeks. And almost nobody writes down what they expected before then, so there is nothing to go back to.
```

> **Changed 2026-08-10, and this is the one answer that needed it.** The old close was _"Which is exactly why almost nobody is working on it"_ — true, but it left the hard question unanswered: if this is so valuable, why can't someone catch up fast? The old answer elsewhere in the folder was that the record is slow to accumulate and hard to copy. **That is false and a partner who tests it will find it false.** The reasons behind a decision survive in Slack threads and call recordings, and someone rebuilt a year of them with an agent he made in two days. The thing that genuinely does not survive is what a team expected *before* the outcome landed — almost nobody writes that down, so there is nothing to mine later. The new close says exactly that in plain words and makes no claim about copying, accumulating or being bolted on.
>
> **98 words**, verified against the 100-word cap. If you edit it, recount.

## Do you have domain expertise or unusually high access / network to a field? *

> _"What do you know about this space that few others know or believe? How do you know it?"_
> **This is EF's edge question, the one their co-founder says most applicants fumble by describing what they plan to learn. Every line below is something already done.**

```text
Three things I know from doing rather than reading.

What it is actually like to be the single human in the loop. Nine weeks directing an agent fleet against a production codebase, including the failure: I approved everything until I became the bottleneck I built the system to remove. Very few people have run that experiment on themselves yet.

How AI behaves in regulated production, from three years shipping it into banking where a name sits on every outcome.

And why surfacing does not change behaviour, because I built the dashboard version first and watched it fail.
```

## Who would be the 2 best references we should call that could speak to your strengths? *

> _"These should be people who know you personally, who've seen you excel in a work capacity, ideally one (if not both) is senior to you."_

```text
[FOUNDER: two real names, and this one only you can fill.

What EF wants: name, role, company, relationship to you, and ideally a line on
what they saw you do. One should be senior to you.

The obvious candidates:
  1. Your reporting manager or a business head at Intellect, who saw the AI
     onboarding platform go from zero to 100,000 users.
  2. A lead or programme manager from ISRO who saw you move from engineering
     into product on your own initiative, since that story is also your
     "room you weren't invited to" answer and a reference who can confirm it
     is worth more than one who cannot.

Message them before you submit. A reference who is expecting the call performs
very differently from one who is surprised by it.]
```

## Who is the most impressive person you know who should start a technology company and apply? *(optional)*

> _"We're particularly keen to hear about people from groups that are underrepresented in tech."_

```text
[FOUNDER: optional, and worth doing. It costs you nothing, it signals you are
plugged into good people, and EF explicitly values it. A name plus their
LinkedIn. Leave blank rather than naming someone weak.]
```

---

# The one-minute video

> **This is a different video from every other one you have recorded.** EF is explicit: _"Do not pitch an idea or a CV."_ No company, no product, no career walkthrough. They want to know who you are.
>
> **~125 words, about 1:00 at your recorded 129 wpm.** One take, webcam, look at the lens.

```text
Hi, I'm Rohit.

The thing you should probably know about me is that I have started over more times than is comfortable. I moved from engineering into product with no title and no permission. I moved countries for a degree I paid for myself. And two years ago, at an age where most people stop retraining, I taught myself to actually build the things I used to write specs for.

I have also thrown away four working versions of the thing I am building now. That is the part people find strange. I find it obvious. If it is answering the wrong question, it does not matter that it works.

I am at my best in rooms where somebody tells me I am wrong. That is mostly why I am applying.
```

**Delivery notes**
- Do not perform it. This is the one video where being underplayed is the whole point.
- "That is the part people find strange. I find it obvious." — small pause between those two sentences.
- The last line is why you are applying. Say it plainly and stop.
- **No product name, no metrics, no career chronology.** If you mention Supaprod you have made it a CV video and missed what they asked for.

---

## Pre-submit checklist

1. **Check whether the counter is words or characters** the first time you paste. Every answer is written to 100 words. If it is characters, tell me and I will rewrite all fourteen.
2. Record the one-minute video, upload unlisted, **test in incognito**.
3. Fill the two references, and message them first.
4. Optionally name someone for the last question.
5. Use **Save for later** freely, the deadline is 2026-08-30 but review is rolling, so submit early.
6. Page 2 is "Your Details". Screenshot it and I will draft that too.
