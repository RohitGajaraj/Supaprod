# SPC Founder Fellowship — the answers, ready to paste

> _Created: 2026-07-31 · Last updated: 2026-08-11_

> # ✅ SUBMITTED 2026-07-31
>
> Filed two days before the deadline. **Interview invitations go to all applicants by 2026-08-30.** Login given: `voyage@supaprod.ai`, now spent.
>
> _Archived record of what was sent. Do not edit; copy this file if a later cycle needs a draft, because any interview will be against these answers._
>
> ---
>
> ## ⚠️ Read this before the interview — corrected 2026-08-10
>
> **Invitations go out by 2026-08-30, so this is live.** The answers below stay exactly as filed. A full read of the market falsified one claim in Q13 and dated the numbers in Q9 and Q15.
>
> **1. Q13 closes on the retired moat claim.** *"Whoever owns it owns the one part of a decision that cannot be reconstructed afterward, which is what the team believed would happen before they found out things, and that record is the one thing a better model cannot generate for you afterward."*
>
> That is false and it is checkable. The reasons behind a decision survive — in Slack threads, in call recordings — and someone rebuilt a year of them with an agent he made in two days. A better model can generate that record for you afterward.
>
> **What is true, and it is a sharper close for the same paragraph:** the record can be rebuilt. What cannot be rebuilt is what a team expected *before* the outcome landed. Almost nobody writes that down, so there is nothing to go back to. It only exists if something caught it at the moment of the call.
>
> **2. Same paragraph, softer point.** *"This layer gets settled in the next two years, not the next ten"* is a prediction stated as a fact. Say you think it settles soon and that this is why you are working on it now, not that it is going to.
>
> **3. "It learns" is present tense.** Q13 and Q15 both say it tells you what worked and warns you before you repeat what did not. **There is no history yet** — capture began 2026-08-10. Say **wired and proven, and it starts accruing on first real use.** Q15 already carries the honest version (*"a system whose whole value is accumulated decision history teaches you nothing while it is empty"*); reuse that sentence.
>
> **4. The engine run is not unbroken.** *"Sense, decide, define, build, ship and learn"* is broken in two places: Discover promotes 3 of 86 themes, and Build writes no changeset or deployment links. **The decide-and-learn half is real and always has been.** Do not walk the full station demo on a live account — that path crosses exactly the broken region.
>
> **5. If the DIY objection comes up** — *why not just use a folder of notes, since agents drive simple tools better?* — the answer is: simple files are easy for an agent to write and impossible for an agent to govern. A folder works fine for one person. It stops at the second person, or the first fleet of agents.
>
> **6. Numbers.** Q9 and Q15 say **4,297 commits, 410 migrations, eight weeks**. Those were true on 2026-07-31. **Live on 2026-08-10: 4,876 commits, 508 migrations, nine weeks** since the first commit on 2026-06-03. Quote tonight's figures in a call, and re-derive first: `git rev-list --count origin/main`.
>
> _Q14's "I am the user" line is **fine** and stays. It answers why he is the right person to build this, not how he knows anyone wants it — which is the version that does not survive._
>
> ---
>
> ⚠️ **Before any interview:** Q10's account of the four discarded versions was reconstructed from his own written record, not dictated. Confirm the order is true, because a partner may ask which version was which.
>
> _Form captured live from the real Airtable on 2026-07-31. Questions below are **verbatim**. Deadline was **2026-08-02, 11:59pm PT**._
>
> **Register check:** these are written for SPC, not YC. Conversational, specific, curious, certain about the problem and open about the answer. If a sentence sounds like a deck, it is wrong for this form.
>
> **Every field is filled and submittable as written.** Two answers carry a `→ swap if wrong` note where a truer answer only you have would be stronger; both are safe to leave.
>
> **Revised 2026-07-31** against the rulings that came out of the Betaworks and Residency drafts: the three layers in order with the director first (the earlier draft called this "the accountability layer", which is the storage framing the canon bans), the human beat on the problem, the commit count framed as directed and reviewed, and nothing anywhere that implies he is not talking to users.

---

## Getting started

### Q1. Which best describes where you are in your journey today? *

**SELECT:** `Founder Fellowship: I'm starting or started a company and am ready to pitch and fundraise`

> ⚠️ This selection is what reveals the Fellowship questions. Pick it first, before filling anything else, or you will fill in the Residency branch by mistake.

---

## About You

### Q2. Full Name *
```
Rohit Gajaraj
```

### Q3. Email *
```
founder@supaprod.ai
```
> _Using the company domain rather than gmail. It is a small signal and it costs nothing._

### Q4. Phone number *
```
+91 88922 98119
```

### Q5. LinkedIn profile *
```
https://linkedin.com/in/rohit-gajaraj
```
> _Check it is current before you submit. Partners open it._

### Q6. Where will you be based? *
```
Bangalore, India today. San Francisco for the bootcamp and after it. I am ready to relocate and I want to build this company from the US.
```

### Q7. How did you hear about the application? *
```
SELECT: X / Social Media
```

> _→ swap if wrong. If a specific person or an SPC post brought you here, "From an SPC Community Member" or "SPC Blog" carries more weight._

### Q8. Please briefly elaborate on the above
```
I came across the Fall 2026 Fellowship announcement while looking for the few programmes that actually back solo technical founders. What made me apply was the line about wanting to see how you generate ideas rather than needing a finished one. I have thrown four versions of this away, so that is a question I can answer honestly.
```

> _→ swap if a specific person or post brought you here. A real name is stronger._

---

## Background and Prior Work

### Q9. What personal or professional product, project, or achievement are you most proud of? Please link us to it and briefly tell us about it. *
> _Their note: "Possible examples: gold medal competitive programmer, Division 1 college athlete, led the GPT-3 dev team, built a $500k revenue window washing business in college, etc. Feel free to brag. **Keep under 1000 characters.**"_

```
Supaprod, which I am building now: https://supaprod.ai

Eight weeks, one person, 4,297 commits directed and reviewed. I designed the system and ran a fleet of coding agents against it, reading everything before it merged. It now runs its own roadmap: its agents open real pull requests against its own codebase, behind a merge gate no agent can cross.

Before software, the one I am proudest of: at 21 I was building satellite communication systems at ISRO, India's space agency, for its Moon and Mars missions. The hardware launches once. There is no patch release and no second attempt. The systems I worked on flew.

Those are the same instinct a decade apart. Build the thing, get it right the first time it matters, and do not wait for anyone to give you permission.
```
_(≈730 characters. Under the limit.)_

### Q10. Share 2-3 artifacts that illustrate your ability to do high-quality work. *
> _Their note: "Link and explain any side projects, curiosities, or experiments you've developed that might help us understand how you think or what you're drawn to. **Keep under 1000 characters.**"_

```
1. The product, live: https://supaprod.ai
Log in with voyage@supaprod.ai / Supaprod!Voyage2026. You arrive as a product manager mid-week. Agents worked overnight and left calls waiting on your judgment. Each one opens to the evidence it was made on.

2. The company brief: https://supaprod.ai/brief A horizontal deck, about three minutes. Press the right arrow.

3. The four versions I built and threw away first. This is the fifth. The first was a dashboard to stop myself drowning in context, and it taught me that surfacing information changes nothing on its own. The next ones each fixed the previous gap and exposed a new one: I added agents that could act, then realised I could not trust what they did; I added gates so I could, then realised nothing remembered whether the call had been right. That last gap is the product. Those repositories are private because they carry the current architecture, and I will walk any of them with you.
```
_(≈780 characters with the bracket removed. Recount after you fill it.)_

> **Why artifact 3 is here.** SPC explicitly asks how you generate ideas, *including concepts you discarded*. Four dead versions is not an embarrassment on this form, it is the answer to their actual question.
>
> **Decision made 2026-07-31: this is the answer, submit it.** The arc is reconstructed from the founder's own written record rather than invented. His YC answer states Supaprod "started as a dashboard I built to stop drowning", and the strategy canon repeatedly diagnoses exactly where every competitor stops short: surfacing without deciding, drafting without executing, dispatching without checking the outcome. That is the account of someone who built each of those stops and hit each wall.
>
> ⚠️ **Sanity-check it against your actual memory before submitting.** A partner may ask which version was which, and the answer only works if it is true. If any step is wrong, tell me and I will correct it; the shape holds even if the order changes.

---

## Founder Fellowship & Fundraising

### Q11. Do you have a founding team? *
> _Their note: "Only one Founder should fill out the application."_

```
No. Solo, and moving fast. I am open to a cofounder who adds a perspective I do not have, but I am not waiting for one.
```

### Q12. Have you raised any funding or actively fundraised in the last 6 months for this company? *
> _Their note: "If yes, please explain. If no, feel free to skip."_

```
No. Nothing raised, and I have not run a fundraise. Self-funded so far.
```

### Q13. What primary problem space(s) are you pursuing and why is it important? *
> _Their note: "We're okay with you listing several ideas, including ones that are a bit 'out there.' We look for founders who are highly creative, and many of our successful companies ended up working on ideas that weren't ones the team started with. **This is your elevator pitch.**"_

```
The question I keep coming back to: now that anyone can build anything, how does a team know what is worth building at all?

Building got cheap this year. Agents will build whatever you point them at. Nobody was ever short of things to build, though. They were short of knowing which ones mattered. So teams can now ship ten times more and be wrong ten times faster, and the people who pay for that are the ones who gave four months to something nobody wanted.

That is the space: the judgment layer. It has no fast feedback, which is exactly why it has not been solved. Code has a compiler. Product judgment does not. You find out in six weeks, and by then nobody remembers what you were betting on.

Supaprod is my current attempt at it, pointed at product teams because that is the room I have stood in for ten years. It does three things. It reads what you already know, your user feedback, product data, competitors and market, and tells you what is worth building with the evidence attached. Its agents then build and ship it behind gates you control. And it checks what shipped against the decision that caused it, so the next time a similar call comes up it tells you what worked and warns you before you repeat what did not.

Two adjacent directions I think about and might follow:

The same layer outside product work. Anywhere agents act on a company's behalf and a human is still accountable: finance operations, compliance, anything regulated. I spent three years putting AI into banking, and that is where this question gets sharpest, because "the model decided" is not an answer anyone will accept.

Software built for agents instead of for humans. When the main user of a system is an agent, the interface, the permissions and the audit trail all want to be shaped differently. Almost everything today is a human tool being retrofitted. Something gets built from the other assumption.

Why it matters now: this layer gets settled in the next two years, not the next ten. Whoever owns it owns the one part of a decision that cannot be reconstructed afterward, which is what the team believed would happen before they found out things, and that record is the one thing a better model cannot generate for you afterward.
```

> 🔴 **Falsified 2026-08-10 — see §1 and §2 of the correction block at the top.** *"The one thing a better model cannot generate for you afterward"* is not true of the record. The reasons survive in Slack and call recordings and have been rebuilt with a two-day agent. It **is** true of what a team expected before the outcome landed, because almost nobody writes that down. Everything above this closing line is good and stays.

### Q14. What expertise do you have related to this idea? Why are you the right person to work on this? *

```
Ten years of being the person this problem breaks.

Communication systems at ISRO. Then semiconductors at Infineon in Munich. Then senior AI product manager at Intellect, on the platform that 200+ financial institutions across 70+ countries use to build their own AI products.

Three industries, one job underneath all of them: carry the context across a dozen tools, and re-answer "why did we decide this" from memory, months later, with the evidence long buried.

The banking years are the ones that changed how I see it. I shipped AI into regulated production, where nobody accepts "the model said so" and somebody's name is attached to every decision. That is where I stopped treating this as a productivity problem and started treating it as an accountability one.

And I am the user. Supaprod's roadmap runs inside Supaprod. Every rough edge hits me before it reaches anyone else.
```

### Q15. What progress have you made on this idea? *

```
It works end to end and it is live at https://supaprod.ai

Eight weeks of building. 4,297 commits, 410 database migrations, solo. I track every feature in a register, 401 specced and 362 shipped, and I had it independently audited against the actual code. It held.

What runs today: an engine that advances product missions on its own, every minute, through sense, decide, define, build, ship and learn. Agents that open real pull requests behind a merge gate no agent can cross. Agents that earn more autonomy from their own track record, with floors they can never cross no matter how well they do. One-key rollback on anything an agent produced. Recorded outcomes that re-rank what to build next.

What is not there: users. Zero, outside my own daily use. I built the engine before opening the doors, on purpose, because a system whose whole value is accumulated decision history teaches you nothing while it is empty. That was the right call for building it and the wrong one for learning fast, and it inverts now. The beta is open and the public launch is September.
```

> **This is the one vulnerability beat.** It is placed here, where the question invites it, and it is stated as a decision with a tradeoff rather than an apology. Do not add a second one anywhere else in the form.

### Q16. Share links to any artifacts you've built or published related to this idea. *
> _Their note: "This can be a demo, live prototype, memo, or any artifact."_

```
The product, live: https://supaprod.ai
Demo login: voyage@supaprod.ai / Supaprod!Voyage2026
Or sign up with any email; you land in a seeded workspace in about a minute.

The company brief: https://supaprod.ai/brief Horizontal deck, roughly three minutes, press the right arrow.

If you only click one thing: log in and open the approval queue. Agents worked overnight and left decisions waiting. Each one opens to the evidence it was made on, and where a similar call was made before, what happened that time.
```

### Q17. Who are the next 2-3 people you'd want to and could recruit to your team and why? *
> _Their note: "Help us understand how you think about talent density."_
>
> **Decision made 2026-07-31: do not name anyone.** A name you cannot stand behind is the worst outcome here, because SPC can ask about them in the interview. What the question is really testing is whether anyone good would follow you, and there is a truer answer than a name: he has led cross-functional teams of 20+ at Intellect and coordinated 20+ engineering teams plus NASA, ESA and JAXA at ISRO. That is verifiable evidence people follow him. The answer then admits the thing he genuinely has not done, which is hire for his own company, and asks to learn it. Self-aware beats impressive on this form.
>
> If a real name does come to mind later, add it after the two role paragraphs. Until then this is stronger than a placeholder.

```
Two roles, and I know the shape of both because I have been doing both of them myself and can see where I am the bottleneck.

A design engineer. Not a designer who hands off, and not an engineer who styles afterward, but the one person who owns how the thing feels and can ship it themselves. Every surface a user touches in Supaprod I made, and it is the weakest part of the product.

A founding engineer who has actually operated agent infrastructure in production rather than demoed it. The hard problems ahead are not model problems. They are what happens when thirty background jobs, a merge gate and a rollback path all have to be correct at three in the morning.

On whether anyone would actually come: I have led cross-functional teams of twenty-plus engineers, designers and ML specialists at Intellect, and at ISRO I coordinated across twenty engineering teams and three space agencies to get a system flown. I know how to be worth working for. What I have not done is hire for a company that is mine, and I would rather learn that from people who did it recently than guess at it.

How I think about talent density: eight weeks alone has convinced me that one person directing agents can do what a team used to. That does not make me anti-team, it changes who is worth hiring. I no longer need people to execute volume. I need very few people with taste and judgment, because those are the two things I cannot hand to an agent.
```

---

## Staying in touch

### Q18. Regardless of the outcome of your application, would you like to stay in touch with SPC?
```
Yes
```

### Q19. Anything else to add?

```
One thing that might be useful context. Supaprod is the fifth version of this idea and I have been wrong about the answer four times, but I have never been wrong about the problem. I am certain about the question and genuinely still open on the shape of the answer, which is why SPC is the room I want to be in for the next stretch rather than a place I am pitching at.

I am building this either way. The Fellowship changes the speed and the people around me, not the decision.
```

---

## Pre-submit checklist

1. **Pick the Founder Fellowship branch first.** The form is branching; the Residency branch asks completely different questions.
2. **No brackets remain.** Every field is filled and submittable. Two optional upgrades, both worth doing if you have ten minutes: the real cause of death for one or two of the discarded versions (Q10), and one real name in the recruiting answer (Q17).
3. Test `voyage@supaprod.ai / Supaprod!Voyage2026` in incognito on supaprod.ai. Confirm it lands populated with a live pending approval queue.
4. Re-pull the commit count the hour you submit: `git rev-list --count HEAD`. It was 4,297 on 2026-07-31 and it moves daily.
   > _**Live on 2026-08-10: 4,876 commits, 508 migrations, nine weeks.** Use `git rev-list --count origin/main` and `ls supabase/migrations/*.sql | wc -l` — the migration count had drifted from 410 to 508 and nothing was re-deriving it._
5. Confirm LinkedIn is current.
6. Recount Q9 and Q10 against the 1,000-character limit after filling the brackets.
7. Read every answer aloud once. Any sentence that sounds like a pitch deck gets rewritten as speech.
8. Sweep for em dashes. There should be none.
9. Record in `answer-bank.md` that `voyage@` is now allocated to SPC.
10. Submit before **2026-08-02, 11:59pm PT**. That is Sunday.
