# Hub71 Access Programme, Cohort 20 — the complete fill sheet, all 26 fields

> _Created 2026-08-17. **This is the paste source.** Every question below was read off the live form at <https://www.hub71.com/program/access-programme/apply> on 2026-08-17, so these are the real questions, not inferred ones._
>
> **Deadline 21 August 2026. Programme runs 12 months from February 2027.**
>
> Register and structure pulled from [`../../yc/APPLICATION-FINAL.md`](../../yc/APPLICATION-FINAL.md) §A, which supersedes `answer-bank.md` on facts and voice, and from [`../campus-founders/FILL-SHEET-38-FIELDS.md`](../campus-founders/FILL-SHEET-38-FIELDS.md), the most recent filing.
>
> Numbers re-derived 2026-08-17: **5,328 commits · 545 migrations · first commit 2026-06-02 · eleven weeks**.
>
> **The founder submits. Never an agent.**

## What one filing buys

| | |
| --- | --- |
| Cash | **AED 250,000** for equity on a SAFE |
| In kind | **AED 250,000** (office, housing, health insurance, legal, marketing) |
| Top up | a further **AED 250,000** for high performers committed to Abu Dhabi |
| Term | 12 months, Cohort 20, starts **February 2027** |
| Stage band | pre-seed to Series A |
| Selection | team strength, market opportunity, growth plans |
| Only founder-side condition | at least one founder commits to relocating long term and building a team out of Abu Dhabi |

**Hub71+ AI is not a second form.** It is the `building_ai_solutions` radio inside this one, at Q7.

## Two corrections to the record, both verified on the live page

1. **The ADGM entity blocker is false.** `../README.md` lines 41 and 226 still carry *"needs an ADGM entity and physical presence"*. The live form has no entity field at all. It asks **"Which country is your HQ based in?"**, a fact about today. `../sweep/board-corrections.md` caught this on 2026-08-14 and the README was never fixed.
2. **The programme starts February 2027**, quoted: *"The current deadline is 21 August 2026, and the programme starts in February 2027."* Clear of the Campus Founders cohort start (30 September) and the EF Bridge Fall 26 window.

## The Abu Dhabi card, and it does not travel

Correction 13 says find the thing true for this geography and nobody else's. For Heilbronn it was the EU AI Act. For Abu Dhabi it is this, all published by the government itself:

- Abu Dhabi has committed to becoming **the world's first fully AI-native government by 2027**, on an **AED 13 billion** Digital Strategy 2025 to 2027.
- It has already deployed **over 100 AI use cases across more than 40 government entities**.
- It has newly established **Chief Data and AI Officer roles across all government entities**.

**The third line is the application.** Abu Dhabi is creating by mandate, inside every government entity, a named person who answers for what AI systems decided, across a hundred-plus live use cases, against a 2027 deadline that is the year Cohort 20 runs. That seat has no system of record. **The second leg is ADGM**, where the FSRA runs a sandbox for testing autonomous AI under supervision, and where the founder's decade in regulated finance stops being biography and becomes qualification.

---

# The 26 answers

## 1. Startup Name
```
Supaprod
```

## 2. Company Domain (Startup Website)
```
https://supaprod.ai
```

## 3. Which sector best describes your startup?
**`Artificial Intelligence`**

> Full 32-option dropdown scrolled per correction 9. Near misses were `RegTech`, `IT` and `Data Science`. `Artificial Intelligence` is honest and it reads consistently with Q7.

## 4. Please attach your pitch deck (PDF format)
✅ **BUILT AND VERIFIED 2026-08-17.** Upload:
```
docs/pitch/shareables/Supaprod-Hub71-Deck.pdf
```
_18 pages, 1.69MB against a 10MB cap, 4 link annotations intact._ Rebuild with `python3 scripts/build-hub71-deck.py` then the Chrome render command it prints.

**Why a new variant rather than an existing asset.** Hub71 enumerates nine required contents. `Supaprod-Brief.pdf` is a one-page link card and cannot carry them. The frozen 16-page investor deck covers seven of the nine and carries framing that cannot go to a programme: its cover read **"Pre-seed briefing · August 2026 · Confidential"** and its close read **"Investor relations · investors@supaprod.ai"**. That is the exact defect that retired `Supaprod-Investor-Briefing.pdf` for Campus Founders.

**What the variant changes**, all of it in a script so it is reproducible:

| | Was | Now |
| --- | --- | --- |
| Cover eyebrow | Pre-seed briefing · August 2026 · Confidential | **Company brief · Hub71 Access Programme · Cohort 20** |
| Close contact | Investor relations · investors@supaprod.ai | **Rohit Gajaraj · founder@supaprod.ai** |
| Slide 13 | — | **Fundraising**, the eighth required content |
| Slide 14 | — | **Abu Dhabi and Hub71**, the ninth |

**It also fixes real clipping the README had recorded wrongly.** The README names slides 3, 6, 15 and 16. Read against the rendered artifact, what actually clipped was the **field slide**, which lost the end of a sentence mid-word and hid an entire closing line (*"A frontier lab ships capability. The accountability layer across your tools is what it will not own."*), and the **team slide**, which lost its bottom card. Both now render complete.

**Verified after render:** zero occurrences of "investor", "Confidential" or "Pre-seed" in the binary.

**Never send `Supaprod-Investor-Briefing.pdf` or the raw 16-page deck.**

## 5. Describe in 280 characters what problem you are solving and how
> **Hard cap enforced by the browser (`maxlength="280"`). Anything longer is silently truncated on paste.**
> **Carries all three layers, per the founder ruling 2026-08-17: tells what to build, builds it, then learns and guides the next call.** _226 characters._
```
Building got cheap. Deciding what to build did not. Supaprod tells a product team what to build, runs the build through agents behind a gate they cannot cross, then grades the call against what shipped and guides the next one.
```

## 6. What are you building and how is it different than what is already out there?
> _200 words. **Opens on all three layers in one sentence, in order**, per the founder ruling 2026-08-17. The door is the layer nobody else sells and it opens every answer that describes the product. Carries the one self-correction. Does not lead with the forecast, per the 2026-08-11 positioning change._
```
Supaprod tells a product team what to build, gets it built by agents, then grades
the call against what shipped and guides the next one. Three layers, in that
order. The first is the one nobody else sells.

A team points it at everything they already have: user feedback, product
analytics, sales and support conversations, market and competitor movement, and
the direction they have already chosen. Agents read all of it and cluster it into
what is worth looking at. A critic argues against the weak ideas before anyone
commits.

From there agents run the work. They write the spec with the evidence attached,
plan and design it, build it, open the pull requests, ship, and write the release
notes. A person approves and merges. That is the only place a human is required.

Then they grade what shipped against what the spec promised, and that verdict
ranks what to build next.

Notion, Atlassian, Linear and ChatPRD all make the work faster. None of them
records whether the call was right.

I had the defensible part wrong at first. I was telling people a competitor could
not rebuild a decision history. They can. Vercel's COO rebuilt why a deal was
lost out of Slack, email and call recordings with an agent built in two days.
What nobody can rebuild is what a team believed before it found out. Now
something does, and it locks on write.
```

## 7. Is your startup utilizing or building AI solutions as part of its core product offering?
**`AI-Driven Solutions and Platforms`**

> Option two: *"Leveraging AI to enhance services, automate processes, or develop industry-specific applications and infrastructure."*
>
> **This is the answer that places the application in Hub71+ AI.** `Advanced AI Development` would claim we build core AI technologies and large language models. We do not, we deliberately do not, and the claim is checkable. Under-describing is a defect too, which is why `Non-AI Focus` is absurd here: AI is not a feature inside Supaprod, it is the workforce, and a person keeps the judgment.

## 8. What makes your team special and how are you best positioned to solve this problem?
> _200 words. Leads with the person, per Rule 4. Shows the behaviour, never names the trait._
```
Close to a decade in product, in rooms where being wrong is expensive.

At 21 I was building satellite communication systems at ISRO, India's national
space agency, for its Moon and Mars missions. Hardware launches once. There is no
patch release, no rollback, no second attempt, and every decision has to survive
review by people who will not accept "it should be fine". Both missions flew.
Then semiconductors at Infineon in Munich. Most recently senior AI product
manager at Intellect, on the AI platform that 200+ financial institutions across
70+ countries build their own AI products on. That is AI governance inside
regulated finance as a day job, which is the thing Abu Dhabi is standing up right
now, and it is why ADGM is not a new world to me.

The job underneath all three was the same. Hold the context across a dozen tools
and a dozen people, then re-answer "why did we decide this" from memory months
later, usually badly.

Before this version I built and threw away four complete working ones, each
rebuilt from scratch when the shape turned out to be wrong. Two years ago I could
not ship production software. I learned to build by directing agents.
```

## 9. Who is responsible for building your product?
> _200 words._ **Rule 6: the commit count must never share a field with "agents write the code", or the number reads as measuring the agents. It lives at Q15 instead.**
```
I do, directing agents. No non-founder has touched any of it. Design,
development, testing and the analysis of what people do with it, all in house.

I make every call and review every change. A separate reviewer, independent of
the agents that write, audits for security and holds every change against the
test suite before it can merge.

Every model call goes through one runtime chokepoint that handles budget, cache,
guardrails, tracing, fallback and feature gates, so models are interchangeable
parts rather than a dependency. Retrieval vectors run on Cohere embed-v4, the
agent loop on Qwen-plus and Gemini 2.5 Flash, and GPT-5 where reasoning depth
earns its cost. A better model is a same-day drop-in at no engineering cost.

Frontend is TanStack Start on React 19 with TypeScript, deployed to Cloudflare
Workers. Data is Supabase Postgres with row level security, pgvector for
retrieval, and pg_cron driving an engine that advances product missions on its
own every minute. Agent-written code runs in E2B sandboxes with secret redaction
on every output stream, so a token cannot reach a log.

I deliberately do not build the code generator. The models keep absorbing that
layer.
```

## 10. Who are the (co-)founders and what are their roles? Please add all of their LinkedIn URLs.
```
Rohit Gajaraj, Founder and CEO. Indian national.
https://linkedin.com/in/rohit-gajaraj

Solo. Open to a cofounder who shares the vision and adds a perspective I do not
have, and not waiting on one to build.
```

## 11. What is the 'Why Now' for your business?
> _200 words. The question has two halves: why now for the business, **and** why Abu Dhabi and MENA. Both get answered. **This is the field that makes the application specific to Hub71 and it is the one that would be wrong anywhere else.**_
```
Two curves crossed this year. Agents got good enough to do the work and the cost
of building collapsed. Devin went from $37M to $492M ARR in twelve months and
Cursor is at $2B. When building stops being the constraint, deciding what to
build becomes the constraint, and someone still has to answer for the call. That
seat gets decided in the next two years, not the next ten.

Abu Dhabi is where that question is being asked first, at scale, and against a
published deadline. The emirate has committed to becoming the world's first fully
AI-native government by 2027 on an AED 13 billion digital strategy. It has
already put more than 100 AI use cases into service across more than 40
government entities. And it has created a Chief Data and AI Officer inside every
one of them. That is a named person, in every entity, who now answers for what
the AI decided, in the year Cohort 20 runs. That seat has no system of record.

The same question is live on the ADGM side, where the FSRA runs a sandbox so
autonomous AI can be tested under supervision. Regulated finance is where I come
from.
```

## 12. What product stage are you at?
**`Post-launch and Pre-revenue`**

> Correction 6: *"Prototype as a stage is too modest."* The product runs end to end and a reviewer can walk the whole loop. `Building MVP` understates it and is the wrong answer.

## 13. When did you launch your MVP and started monetizing?
**⚠️ FOUNDER INPUT NEEDED.** Conditional date field, renders only for some stage selections.

> Use the date the private beta actually went live. `baseline.yml` records **signup closed 2026-08-07** but not the open date. Do not guess a date onto a form that also asks three revenue questions.

## 14. What was the last round of funding you closed?
**`We are bootstrapped`**

## 15. What success metrics do you measure, and where are you with each of them?
> _No stated limit. Carries the one vulnerability beat, placed where the form invites it. The commit number lives here and nowhere near Q9._
```
Supaprod is in private beta, invite only. Signup closed on 7 August 2026 and
entry is by invite code. Public launch is mid-September 2026.

Build metrics, both reproducible from a single command: 5,300+ commits and 545
database migrations since 2 June 2026, directed and reviewed by one person in
eleven weeks. A security review run separately from the agents that write the
code held up. I quote these because a reader can check them in thirty seconds,
not because volume is the point.

The product metric that decides this company is forecast accuracy. Every decision
carries what the team expects, how they will know, and by when, captured at the
moment of the call. Those fields are made immutable by a BEFORE UPDATE trigger in
Postgres rather than a check in application code, so the rule holds for every
caller including our own agents. The system brings each forecast back the day it
falls due, drafts the verdict from what actually shipped, and files it against
the decision that caused it. The loop is wired and proven end to end. It begins
accruing on first real use, and every outcome in it today is my own.

From mid-September the numbers I will be held to are activation, retention, and
graded decisions per workspace from teams that are not me.

The honest open question is pricing. Charging for closed decision loops rather
than per seat is the right shape for a product where agents do the work, but I
have not tested what a team will pay for one. That is what the beta is for, and
it is the number I most want to be wrong about early.
```

## 16. Total revenue generated over the past 12 months (USD)
```
0
```

## 17. Total revenue generated last month (USD)
```
0
```

## 18. Accumulative revenue since you launched (USD)
```
0
```

> Required numeric fields get the true figure. The never-volunteer-the-zero ruling governs prose, not numbers, and a caught overstatement costs more than a weak answer ever did.

## 19. How much runway do you have left?
**`0–6 months`** — founder-confirmed 2026-08-17.

> **Answer it straight and do not dress it up.** It is checkable in diligence and the honest answer is the only one available.
>
> ### ⚠️ This answer has a strategic consequence bigger than the field
>
> **Hub71 Cohort 20 does not start until February 2027, which is roughly six months away.** A reviewer reading `0–6 months` next to a February start will ask how the company survives to the start line. **This does not weaken the application** and it is not something to hide or hedge in a text field. It does mean **Hub71 cannot be the plan for near-term cash**, and the sequencing has to reflect that. See [`../what-to-apply-for-next.md`](../what-to-apply-for-next.md).
>
> **What actually answers it, and it is already true:** he is going full time regardless, the company is happening either way, and the near-term programmes on the queue pay out well before February. Nothing in this application needs to argue that. The field is a number.

## 20. How much have you raised to date? (USD)
```
0
```

## 21. Who are some notable investors?
```
None. Supaprod is self-funded, I hold it outright, and I am not currently
raising.
```

## 22. How did you hear about Hub71
**`Social Media`** — founder-confirmed 2026-08-17.

> **A conditional "Please specify how you heard about us" textarea may appear after selecting this.** If it does, name the platform plainly and stop. One line, no pitch:
```
LinkedIn.
```
> Correction 0c: answer the question that was asked, and stop. This field is not an opportunity.

## 23. Have you gone through any incubator or accelerator program(s), if so which one(s)?
> **Correction 15: read the verb. "GONE THROUGH" is not "applied to".** Do not list pending applications: it answers a question nobody asked, it invites *"and how did those go?"*, and applications are free so they signal nothing. There is one true answer and it belongs here.
```
Not with Supaprod. An earlier venture of mine was incubated at NSRCEL, the
startup hub at the Indian Institute of Management Bangalore, and was recognised
under the Government of India's Startup India initiative.
```

## 24. What are your plans for Abu Dhabi and Hub71 specifically?
> _200 words. The question asks what gets achieved in the **first 3 months** and **how**. Modelled on the Campus Founders milestone answer: every line carries a number he can be held to._
```
Four milestones for the first three months, each with a number I can be held to.

One. I move to Abu Dhabi for the start of the programme and set the company up
locally, with an ADGM licence as the intended route because that is where the
buyers sit. A move, not a visit.

Two. Fifteen design-partner conversations by week six, and I know who with. More
than 100 AI use cases are live across more than 40 Abu Dhabi government entities,
each with a Chief Data and AI Officer who answers for what the AI decided and has
nothing built for the job. Hub71's government and corporate partners are the
introduction I cannot make from Bangalore. In parallel, ADGM-licensed financial
institutions, where I know the buying process from the inside.

Three. Three paying pilots by week twelve, one government entity and two in
financial services, each running real product decisions through the loop rather
than a trial sitting idle.

Four. Two hundred graded decisions from teams that are not me. This is the one
that matters most, because the third layer only begins compounding on real
outcomes, and every outcome in it today is mine.

The customer here is being created by policy, on a published deadline, in this
city. I would rather sit next to that than sell into it from elsewhere.
```

## 25. Which country is your HQ based in?
**`India`**

> Answer the question actually asked. It asks where the HQ is today, not where the company is registered and not where it will be. This is the field the retired "ADGM blocker" note was invented around.

## 26. Will at least one of the co-founders live in / relocate to Abu Dhabi?
**`Yes`**

> Founder standing ruling 2026-08-14: *"I am ready to move in. I'm quitting the job, and I'm ready to move in."* Relocation is a feature at Hub71, not a cost. It is the only founder-side condition Hub71 states, and `No` makes the filing pointless.

## Contact block
| Field | Value |
| --- | --- |
| Primary Contact Name | `Rohit Gajaraj` |
| Primary Contact Email | `founder@supaprod.ai` (the page asks for a company email) |
| Primary Contact Number | **⚠️ FOUNDER INPUT NEEDED.** Country code prefills to `India +91` |
| Other emails to copy | leave blank, nothing true is carried by it |
| Marketing updates checkbox | founder's call, no application consequence |

---

## Would I fund this, reading it cold?

**Where it is strong.** The build story is checkable in thirty seconds and almost nobody else's is. The founder is the existence proof of his own thesis, which converts solo from a weakness into the argument. The self-correction at Q6 is the single most persuasive paragraph in the application, because a founder who names what refuted his own moat reads as someone who checks. And Q11 could not have been written by anyone applying to a US programme, which is the tailoring test passing.

**Where a reviewer will push.** No users, no revenue, solo, no entity. Every one of those is answered somewhere in the pack rather than dodged, and none is volunteered where the form does not ask. The weakest real answer is Q15, because the metrics that matter start in September. That is why the vulnerability beat sits there: naming pricing as the open question is stronger than pretending the traction section is full.

**The bet a reviewer is being asked to make** is that one person who has shipped this much this fast, from inside regulated finance, moving to Abu Dhabi in the year the emirate has staked a public deadline on AI-native government, will find the first ten customers faster there than anywhere else. That is a bet Hub71 exists to make.

## Four things needed from the founder

1. **MVP launch date** (Q13, conditional)
2. **Runway band** (Q19)
3. **How you heard about Hub71** (Q22)
4. **Contact phone number**

## The deck is built

✅ `docs/pitch/shareables/Supaprod-Hub71-Deck.pdf`, 18 pages, verified. See Q4 above. The frozen investor deck was not touched.

## Demo login

**The form has no field for one.** All 26 questions were read off the live page and none asks for product access. Do not burn a login here. If a reviewer asks later, allocate `voyage@` (the only free one), re-arm its approval queue, sign in to verify, and **record the timestamp** so any later sign-in is attributable to Hub71.

## Pre-submit checklist

- [ ] **Re-pull numbers** on the morning of submission: `git rev-list --count origin/main`, `ls supabase/migrations/*.sql | wc -l`
- [ ] **Q5 is under 280 characters** after any edit. The browser truncates silently
- [ ] **Deck uploaded** and the upload shows a filename
- [ ] **Phone country code is +91**
- [ ] **Em-dash sweep** on every pasted block. No em dashes, no en dashes, no invisible Unicode
- [ ] **Banned-word sweep**: leverage, utilize, robust, seamless, cutting-edge, revolutionize, game-changer, unlock, empower, supercharge, delve, testament to
- [ ] **Vocabulary sweep**: no receipts, ledger, company brain, decision layer, unattended, first run, provenance
- [ ] **Brain-verb sweep**: no "remembers", "stores", "logs" as verbs of the brain
- [ ] **Exactly one vulnerability beat** (Q15, pricing) and **exactly one self-correction** (Q6, the moat falsification)
- [ ] **No "you" in any product sentence.** A reviewer reads it as themselves
- [ ] **Read every answer aloud.** Delete any sentence that stays true with a competitor's name swapped in
- [ ] **The founder submits.** Never an agent

## After it is filed

- [ ] Record the filed text back into this file
- [ ] Log in `../README.md`, `../what-to-apply-for-next.md`, and the Notion Application Board
- [ ] **Fix `../README.md` lines 41 and 226**, which still carry the retired ADGM hard-blocker claim
- [ ] Update `baseline.yml` `filed:` with programme, date, deadline and terms
