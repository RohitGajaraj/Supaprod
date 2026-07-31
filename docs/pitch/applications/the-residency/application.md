# The Residency — the answers, ready to paste

> _Form captured 2026-07-31. Questions verbatim. Cohort **7 Sept to 29 Nov 2026**. Deadline **2026-08-14**._
>
> ## ⛔ THE ONE RULE
> **"please don't include links except where we specifically ask."** No URLs in any prose answer. Only the six dedicated link fields get URLs. They are testing whether the writing stands alone.
>
> **"be concise" appears on five questions.** Short beats complete. Every answer below is deliberately trimmed.
>
> `[FOUNDER: …]` marks a slot only he can fill. Never submit a bracket.

---

## about you

**first name** `Rohit` · **last name** `Gajaraj` · **where do you live currently?** `Bangalore, India` · **gender** `male`
_(All four already filled on the form. Leave them.)_

### which residency locations are you open to? *
**KEEP the current five:** san francisco ca · new york ny · bangalore india · ithaca ny · munich germany

_More selections raise placement odds and cost nothing. The question asks what you are open to, not what you prefer._

### what are your 2-3 most important accomplishments, personally or professionally, over the past 3 years? (be concise) *

> _Note the window: **past 3 years only.** ISRO and Infineon are outside it and must not appear here._

```
1. I built a working AI operating system for product teams, alone, in eight
weeks. 4,264 commits. I did not write the code; I directed AI agents that
did, and I reviewed every line. It now runs its own roadmap, and its agents
open real pull requests against its own codebase behind a merge gate no agent
can cross.

2. At Intellect I shipped AI onboarding from zero to 100,000 end users across
50 financial institutions, $1.5M in the first eight months. Underneath it I
built the evaluation layer: 500 tests combining model-as-judge with
deterministic graders, six frontier models A/B tested in production, inference
cost cut 35% while holding 99.2% accuracy.

3. The one I actually care about: two years ago I could not have built any of
this myself. I was a product manager who wrote specs and waited on engineers.
Now I ship production software alone. That change is the accomplishment.
```

### what is one thing only you believe? *

> _The highest-signal question on this form. Most people waste it on something agreeable._

```
That everyone racing to automate software development is automating the half
that was never the bottleneck.

Writing code was the visible constraint, so that is what got solved first, and
it got solved fast. But nobody was ever short of things to build. They were
short of knowing which ones were worth building, and of any honest way to tell
afterward whether the call was right. That half has no compiler. Feedback
arrives in weeks, not seconds, so it cannot be trained away and it cannot be
demoed in a weekend, which is exactly why almost nobody is working on it.

I think it is the only part of this that will still be scarce in five years.
```

### do you have a cofounder? *
`no` _(already set)_

### are you looking for a cofounder? *
`yes` _(already set)_

### what's your #1 book recommendation / favorite book?

```
[FOUNDER: answer this honestly, it is a personality question and they are
assembling a house. Name the book you actually reread, not the impressive one.
One line on why is enough. A genuine odd choice beats a respectable one.]
```

---

## your work

### what's the ultimate vision you're building towards *

```
Every company is about to run on fleets of agents doing real work. When that
happens, the hard question stops being who did the work and becomes who
answers for it.

I am building the layer where a human still answers. Every decision recorded
with the evidence it was made on, checked afterward against what actually
happened, so the record gets sharper about your next call instead of just
sitting there. I started with product teams because that loop is tightest
there. It ends up as the record of how a company decides anything.
```

### describe what you're building or investigating in 50 characters or less *

```
Cursor for PMs, the whole product org.
```
_(38 characters. Alternative if you prefer plainer: `Agents that decide what to build, then build it.` = 47.)_

### add any details that we might be interested in that you couldn't fit in 50 characters *

```
It reads what a team already knows, their user feedback, product data,
competitors and market, and tells them what is worth building. It argues
against the weak bets before they commit. Then its agents write the spec,
build it, and open a real pull request that a human has to merge. Afterward it
checks what actually shipped against the decision that caused it and grades
whether the call was right.

That last step is the part nobody else does, and it is the only one that
compounds. Everyone stops at drafting or dispatching.

The thing I find most interesting to say out loud: I built it the way it works.
One person directing a fleet of agents, with a receipt for everything they did.
The product is the argument for itself.
```

### link to your work (if available)
```
https://supaprod.ai
```

### demo video (if available)
```
[FOUNDER: paste a link if you have one ready. Leave blank rather than pasting
the 4:51 cut, which is too long for a first impression. "n/a" is acceptable to
them and better than a bad video.]
```

### github profile (if available)
```
https://github.com/RohitGajaraj
```

### linkedin (if not available put n/a) *
```
https://linkedin.com/in/rohit-gajaraj
```

### x/twitter (if available)
```
https://x.com/rohit_gajaraj
```

### personal or project website (if available)
```
https://supaprod.ai/brief
```

---

## why this idea

### why did you pick this to work on? (be concise) *

```
Because I was the problem for about ten years and got tired of it.

Three industries, three product jobs, and the actual work underneath was
identical every time: carry the context between a dozen tools nobody had
connected, then re-answer why we decided something from memory, months later,
with the evidence long buried in a chat thread.

The last three of those years were spent putting AI into banking, where nobody
accepts "the model decided" as an answer and someone's name is attached to
every call. That is where it stopped looking like a productivity annoyance and
started looking like the thing worth building.
```

### how do you know the world needs what you're making? (be concise) *

```
Because people are already building it badly, by hand, for themselves.

Product people at companies like OpenAI and DoorDash are assembling private
versions of this out of coding agents, connectors and memory files. One
described spending fifteen hundred hours on her own setup. Nobody spends
fifteen hundred hours on a mild annoyance.

And I am the most demanding user I have. I run my company on it every day and
hit every rough edge before anyone else does.
```

---

## progress

### key traction metrics, use bullet points (be concise) *

> _Honest. No external users. The build metrics are real and verifiable._

```
- 8 weeks of building, solo. 4,264 commits, 410 database migrations.
- 401 features specced, 362 shipped, tracked in a register I had
  independently audited against the actual code. It held.
- An engine that advances product missions on its own every minute, through
  sense, decide, define, build, ship, learn.
- Agents opening real pull requests behind a merge gate no agent can cross.
- Agents earning autonomy from their own track record, with floors they can
  never cross regardless of how good that record is.
- Zero outside users. Zero revenue. The beta is open and the public launch is
  September.
```

### how long have you been working on this, and how much has been full-time, if any? *

```
Eight weeks on this build, seven days a week, plus about a month of nights and
weekends on the prototype before it. Completely full-time now: I am on a break
from my product role, and leaving it is already decided rather than contingent
on anything.

[FOUNDER: state whatever is literally true on the day you submit, in one
clause. "On a break", "on sabbatical", or "my notice is in, last day is X".
No gray area.]
```

### are people using what you're building? *
`no`

> _Keep it honest. The beta being open is availability, not adoption, and the next answer already carries that._

### do you have revenue? *
`no`

### what are your goals for the next 6 months (in general, doesn't only have to be numerical goals)? *

```
Launch publicly in September and stop guessing. Right now every judgment about
what matters is mine, and I have been building for eight weeks with nobody
telling me I am wrong. That needs to end.

Concretely: get the first real users on it, find out what they actually do
with it versus what I assumed, and find out what a team will pay for a closed
decision loop, which is the number I most want to be wrong about early.

Less concretely: stop being the only person who understands the system. I want
one or two people around me with taste and judgment, because those are the two
things I cannot hand to an agent.
```

---

## similar work

### who are your main competitors? *

```
Honestly, my real competitor is the stitched stack most teams already run:
Linear or Jira for tracking, Notion for docs, a spec tool, a coding agent for
the build, and a product manager acting as the glue between them.

Named ones, and the space is moving fast: Samepage raised a seed to surface
signals for product leaders. Brief captures decision context for agents.
Productboard shipped Spark. Notion launched Ship OS, which promises customer
feedback all the way to a merged pull request.
```

### what do you understand that they don't? *

```
Every one of them stops one step short. They surface, draft, remember, or
dispatch. Not one checks the shipped outcome against the decision that caused
it and feeds that back into what gets ranked next.

That last step is the only one that compounds, and it is unpleasant to build
because it is slow and it makes you publish your own misses. It also cannot be
bolted onto a tracker afterward, and it cannot be copied quickly, because it
only accumulates with time.

The other thing: I do not compete on generating code. That layer is a knife
fight and the models keep absorbing it. I own the harness instead, the gates
and the receipts and the rollback, and plug the best model into it. When a
better model ships, this gets better the same day and I do nothing.
```

---

## equity

### have you formed any legal entity yet? *
`no`

### have you taken any investment? *
`no`

### are you currently fundraising? *
`no`

> _True: no formal raise is running. Applying to programmes is not fundraising. If a raise opens before you submit, flip it._

---

## past programs

### have you participated in any incubators, accelerators, or pre-accelerators? if so which ones? *

```
Not for this company. An earlier venture of mine, a food and beverage
business, was incubated at NSRCEL at IIM Bangalore and recognised under
India's Startup India initiative.

This cycle I have an application in with Y Combinator, and I am applying to a
handful of others.
```

### have you had roommates besides your family before? *
```
[FOUNDER: yes or no, honestly. This is a real question, not filler, because
they are assembling a house you will live in for twelve weeks. If yes, your
MBA years in Munich are the obvious answer.]
```

### have you applied to the residency before? *
`no`

---

## how you found us

### how did you hear about the residency? *
```
[FOUNDER: pick the true option from the dropdown.]
```

### who or what inspired you to apply? *

```
[FOUNDER: name the real person or thing. If nothing specific, the honest
version below works, but a specific name is stronger.]

I have been building alone for eight weeks and it is the fastest I have ever
worked and the least I have ever been argued with. Those are the same fact. I
want to be somewhere I get contradicted daily by people who are also building,
and living in the same house as them is a blunter way to get that than any
programme I could apply to.
```

### were you referred by an alumni? *
`no` _(already set)_

---

## Pre-submit checklist

1. **Scan every prose answer for a URL and delete it.** Only the six dedicated link fields get links. This is the rule they said they are grading.
2. Fill the five founder slots: favourite book, demo video or blank, employment clause, roommates, how you heard, who inspired you.
3. Re-pull the commit count the day you submit: `git rev-list --count HEAD`. It was 4,264 on 2026-07-31 and appears in two answers.
4. Read the "be concise" answers aloud. If one runs past about eight lines, cut it.
5. No em dashes anywhere.
6. Note the collision before accepting anything: the cohort runs **7 Sept to 29 Nov**, which overlaps the September launch and the South Park Commons bootcamp. Applying costs nothing; only the acceptance forces a choice.
7. Submit before **2026-08-14**.
