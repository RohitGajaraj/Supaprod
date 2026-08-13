# Betaworks AI Camp — paste sheet, in form order

> **Form:** https://beta.works/newagenteconomy
> **Deadline:** 2026-07-31 (NYC time, so it runs to ~09:30 IST on 2026-08-01)
> **Questions:** analisa@betaworks.com
>
> Work top to bottom. Fields marked **YOU** need your input. Everything else is paste-ready.
> Videos are the last three fields; record after the text is in.

> ## ⚠️ Submitted 2026-07-31. Four claims below were falsified 2026-08-10.
>
> **This sheet is spent — it is the record of what was actually pasted into the form, so it stays as written.** The full interview briefing is in [`application.md`](./application.md); read that block, not this one, before a call. The short version:
>
> | Where | What is wrong | What to say instead |
> | --- | --- | --- |
> | **#6**, the thesis answer | *"the one asset a better model cannot generate for you"* — false of the record. Reasons survive in Slack and call recordings and have been rebuilt with a two-day agent. | The record can be rebuilt. **What a team expected before the outcome landed cannot**, because almost nobody writes it down. |
> | **#13**, competitors | *"cannot be bolted onto a tracker… cannot be copied quickly… only accumulates with time"* — same claim, most quotable form. | Same as above. And the real competitor is a folder of notes, not Linear or Notion: **simple files are easy for an agent to write and impossible for an agent to govern.** |
> | **#4**, the product | *"it tells you what worked last time and warns you"* — present tense, no history behind it. Capture began 2026-08-10. | **Wired and proven, and it starts accruing on first real use.** |
> | **#4** and **#12** | the run reads as one unbroken chain | It is broken twice: Discover promotes 3 of 86 themes, Build writes no changeset or deployment links. The **decide-and-learn half is real**; the rest began writing this week. |
>
> **If this sheet is copied for a later cycle, fix all four in the copy before pasting anything.**

---

## ⚡ Do these two things first

**1. Test the demo login in incognito.** Go to `https://supaprod.ai/login` and sign in as:

```
compass@supaprod.ai
Supaprod!Compass2026
```

Confirm it lands on a populated workspace **with live pending approvals**. If the queue is empty or expired, re-arm it before you paste (queues decay on their own; last re-armed 2026-07-28 with a 60-day runway, so it should hold, but check).

**2. Take 3 to 5 screenshots on that same `compass@` workspace**, so what they see matches the login they get. Order below in the screenshots field.

---

## 1. Company name

```
Supaprod
```

## 2. Website

```
https://supaprod.ai
```

## 3. One-liner

```
The operating system a product team runs on when AI agents do the work: it tells you what to build, ships it, and warns you before you repeat a mistake.
```

## 4. Describe your product

```
Building got cheap. Agents will build whatever you point them at. So the scarce thing is no longer building, it is knowing what to build and knowing afterward whether the call was right.

Supaprod does three things. It reads what a team already knows, their user feedback, product data, competitors and market, and tells them what is worth building, with the evidence attached. It runs the whole lifecycle from there: its agents write the spec, build it, and open real pull requests behind a merge gate no agent can cross. Then it checks what shipped against the decision that caused it and grades whether the call was right.

The third part is the one that compounds. The next time a similar call comes up, it tells you what worked last time and warns you before you repeat what did not. Product judgment stops living in one person's head.

The customer is the product organization, starting with the accountable individual inside it: the senior or founding product manager whose name is on the decision. That is the room I stood in for ten years and it is where the loop is tightest. It generalizes to any function where agents act and a human still answers for it.
```

## 5. What stage are you at?

```
SELECT: Live product
```

## 6. In one sentence, what is a truth about the future world that makes your company possible?

> **This is the question that decides the application.** It is their thesis question, answered in their own frame.

```
When intelligence becomes abundant, execution stops being the constraint and judgment becomes it: someone still has to decide what is worth building and answer for it afterward, and a system that learns which calls were right is the one asset a better model cannot generate for you.
```

## 7. Link to a live product or demo

```
https://supaprod.ai

Demo login: compass@supaprod.ai / Supaprod!Compass2026
Or sign up with any email and you land in a seeded workspace in about a minute.

Worth clicking first: log in and open the approval queue. Agents worked overnight and left decisions waiting. Each one opens to the evidence it was made on, and where a similar call was made before, what happened that time.
```

## 8. Share screenshots of your product — **YOU** (attach 3 to 5)

Take on `compass@`, in this order:

1. The approval queue with live pending decisions
2. A single decision opened to its evidence and prior-outcome record
3. An agent run trace or evidence view
4. The roadmap or mission board
5. A real pull request opened by an agent behind the merge gate

## 9. Three videos — **YOU**, do last

Scripts: [`record-these.md`](./record-these.md). Paste the three links here once uploaded.

```
1. Founder background:
2. Product demo:
3. Thesis resonance:
```

**Test every link in incognito.** Their note: _"make sure we have permission to view or else we will not consider your application."_

## 10. Any other relevant link

```
The company brief: https://supaprod.ai/brief
A horizontal deck, about three minutes. Press the right arrow.

LinkedIn: https://linkedin.com/in/rohit-gajaraj
X: https://twitter.com/rohit_gajaraj
```

## 11. Do you have any interesting strategies for distribution or growth?

```
The wedge is a free teardown that needs no signup. You point it at a product idea and an agent argues against it, with the evidence attached. It is the most shareable thing the system does, because the output is something you want to send to your team, and it shows the judgment layer without asking anyone to migrate anything.

Beyond that, three things I am doing rather than planning:

Build in public on X. That is where the AI and product community actually argues about this problem, and where the people I am building for already spend their day. I am user zero: Supaprod's own roadmap runs inside Supaprod and its agents write its code, so every run, every gate an agent stopped at, and every call that turned out wrong is publishable. The build is the content and the proof at the same time, which is rare to have and cheap to keep doing.

Land where procurement is not. Solo founders and product managers on small teams feel this hardest and can start without a purchase order. The audit trail is what larger teams eventually budget for, so expansion comes later and from a different buyer than the landing.

Launch where the argument already happens. Public launch is September, on X, Hacker News and Product Hunt.
```

## 12. What's your technical stack?

> Their note asks specifically about "AI assisted coding strategies" and any distinguishing architectural choice. This is their second-most-important question and your background is unusually strong here.

```
The product. TypeScript end to end. TanStack Start (React 19) on the front, server functions in the same app, deployed to Cloudflare Workers at the edge. Supabase Postgres with row-level security, pgvector for retrieval, pg_cron driving the autonomous engine. PostHog and Sentry for product analytics and failure capture.

The architectural choice that matters most: every AI call goes through a single runtime chokepoint. Budget, cache, guardrails, tracing, fallback and feature gates all live at that one seam. Two consequences. The system is genuinely model-agnostic, so Claude, GPT, Gemini, DeepSeek or a local model plug in and a frontier release is a same-day drop-in at zero engineering cost. And every agent action and model call lands in the audit trail by construction rather than by instrumentation, which is what makes the accountability layer real instead of aspirational.

The agent loop is a planning loop with a tool registry, capped steps, and per-tool approval modes of auto, confirm or review. Agents earn autonomy from their own track record, graduating from review to confirm to auto, with hard floors they never cross no matter how good that record gets: merge, revert and delegate stay human. Anything an agent produces rolls back with one key.

How it gets built. I direct a fleet of coding agents rather than typing the code myself: Claude Code, Codex and Kimi write, HyperAgent runs the agentic workflows, and I run them in parallel lanes through Conductor with one model doing judgment and review over what the build models produce. Everything goes through typecheck, build and a review pass before merge. Eight weeks, 4,279 commits directed and reviewed, 410 database migrations, one person. I track every feature in a register, 401 specced and 362 shipped, and I had it independently audited against the actual code. It held.

Relevant background: at Intellect I built a 500-test evaluation suite combining LLM-as-judge with deterministic graders across factuality, safety, latency and cost, and A/B tested six frontier models in production, cutting inference cost 35% while holding 99.2% accuracy and reducing failure rate 28%. The evaluation and cost discipline in Supaprod comes directly from having had to do it where regulators were watching.
```

## 13. Who are your competitors and what makes you different?

```
Nobody runs the whole loop. The real competitor is the stitched stack: Linear or Jira for tracking, Notion for docs, ChatPRD for specs, a coding agent for the build, and the product manager as the glue between them.

The space is moving fast. Samepage raised a $4.85M seed to surface signals for product leaders. Brief captures decision context for agents. Productboard shipped Spark. Notion launched Ship OS, which promises customer feedback to a merged pull request.

What I understand that they do not: every one of them stops one step short. They surface, draft, remember, or dispatch. None checks the shipped outcome against the decision that caused it and feeds that back into the next recommendation. That is the difference between a tool that remembers and one that learns, and it is the only step that compounds. And the part a competitor cannot rebuild is what you believed would happen before you found out: everything else about a decision survives in chat logs and call recordings, and an agent can reconstruct it in an afternoon. A forecast leaves no trace unless something captured it at the moment of the call.

I also do not compete on code generation. That layer is a knife fight and the models keep absorbing it. I own the harness instead: the loop, the gates, the evidence, the rollback, the outcome feed. The best model plugs into every job in the lifecycle, and when a better one ships, Supaprod gets better the same day.
```

## 14. What is another startup or founder that you admire? — **YOU** (taste question)

> **Founder's pick, 2026-07-31.** A stronger choice than a competitor would have been: naming Cursor says what you compete with, naming Wispr Flow says what you value. The answer does not stop at praise; it lands on the lesson he actually applies, which is that the best systems are invisible until the moment they matter. That is his own governance thesis restated through someone else's product, which is what this question is really fishing for.

```
Wispr Flow.

I use it every day, all day, and what I admire is how little it asks of me. It does one thing. It does not care which app I am in, what domain I work in, or what I am trying to say. It is almost weightless, and it has changed how I interact with a computer more than anything else I have picked up in years.

Two things in that I keep coming back to.

It won by being a layer, not a destination. There is no Wispr app I go to and work inside. It just exists wherever I already am. Most products fight for a place on your screen and measure themselves by how long you stay. That one refused to compete for attention, and ended up everywhere instead.

And it disappears until the exact moment it is useful. That is the hardest thing to build and the easiest to underrate, because when you get it right nobody notices you did anything at all.

The second one is the bar I hold my own work against. Supaprod is a governance layer, and the failure mode of governance is making itself felt constantly: asking permission, adding queues, reminding you it is there. The version worth building is the one you forget about until an agent is genuinely about to cross a line. Wispr Flow is the clearest proof I have in daily use that invisible is achievable rather than just aspirational.
```

## 15. Are you implementing any research we could familiarize ourselves with?

```
Nothing proprietary, but two lines of work shape the design.

The evaluation literature on LLM-as-judge and its failure modes, because the outcome-grading layer is only trustworthy if the grader is calibrated and knows when to abstain. I built a 500-test eval suite on those principles in my last role.

And the agent-governance question that has no settled answer yet: how autonomy should be earned and bounded rather than granted. Supaprod's implementation is a trust ramp where agents graduate permissions from their own track record, with non-overridable floors. I would genuinely like to be argued with about where those floors belong. That is one of the reasons I want to be in this Camp specifically.
```

## 16. Inception Date

```
2026-06-03
```

## 17. Prior funding

```
None. No investment, no grants, no angels. Self-funded, and I have not run a fundraise.
```

## 18. Origin story & bios

```
I spent ten years as the person this problem breaks.


> ⚠️ **Breaks the Moon-and-Mars naming rule** ([`../yc/founder-profile-answers.md`](../yc/founder-profile-answers.md) line 174: *say Moon and Mars missions, never the mission names*). This is filed text and stays as the record of what was sent. **Do not copy it into a new application.**

Satellite communication systems at ISRO from 2016 to 2019, on Chandrayaan-2, Mangalyaan and GSAT-19, across twelve-plus missions, coordinating with NASA, ESA and JAXA. Then an MBA at the Technical University of Munich, and product management at Infineon, a $50M consumer audio portfolio shipping into Samsung, Apple and Xiaomi flagships. Then, since 2023, senior AI product manager at Intellect, on the enterprise AI platform that 200+ financial institutions across 70+ countries use to build their own AI products, where I shipped 0-to-1 AI onboarding to 100K+ end users and built the evaluation and cost infrastructure behind it.

Three industries, one job underneath all of them: carry the context across a dozen tools, and re-answer "why did we decide this" from memory, months later, with the evidence long buried.

Supaprod started as a system I built to run my own work. Then it kept growing. I built and threw away four complete working versions before the one that stands today, each killed by something I could only learn by shipping it. The current one is eight weeks old and it runs its own roadmap.

Team of one.
```

## 19. Why are you the team to solve this problem?

```
Three reasons, and the third is the one that matters.

I have the domain. Ten years of product work in rooms where being wrong is expensive: hardware that launches once with no patch release, and AI shipped into regulated banking where nobody accepts "the model decided" as an answer. That second one is where I stopped seeing this as a productivity problem and started seeing it as a judgment problem.

I have the technical range. I built a 500-test LLM evaluation suite, A/B tested six frontier models in production, and cut inference cost 35% at 99.2% accuracy. I am not a product manager who needs an engineer to explain what a guardrail is.

And I am the existence proof of my own claim. Supaprod says one person directing a fleet of agents can do what a team used to do. I built it that way: eight weeks, alone, behind gates I designed. If the thesis were wrong there would be no product to show you. The product is the argument.
```

## 20. Team Size

```
1
```

## 21. Team location

```
Bangalore, India. Solo. Ready to relocate to New York for the full 12 weeks and to base the company in the US after it.
```

## 22. Team Member 1 — Name / Email / LinkedIn

```
Rohit Gajaraj
```
```
founder@supaprod.ai
```
```
https://linkedin.com/in/rohit-gajaraj
```

## 23. How did you hear about Camp? — **YOU**

```
[The true answer. If you found them through their own writing, name the post: their
"Camp: The New Agentic Economy" piece is the obvious one.]
```

## 24. Do you know anyone in the Betaworks network? — **YOU**

```
[Leave blank if not. Their note: "warm intros go a long way, this is your chance to drop
a name so we could do a reference check." Only name someone who would actually vouch.]
```

## 25. Primary phone number (must receive SMS)

```
+91 88922 98119
```

---

## Before you submit

1. All three video links pasted and **tested in incognito**.
2. Screenshots attached, taken on `compass@`.
3. No square brackets anywhere in the form.
4. Numbers current: **4,279 commits**, **410 migrations**, **401 specced / 362 shipped**. Re-pull with `git rev-list --count HEAD` if the day has turned.
   > _Those were the figures on 2026-07-31, the day this was filed. **Live on 2026-08-10: 4,876 commits, 508 migrations, nine weeks** since the first commit on 2026-06-03. Re-derive with `git rev-list --count origin/main` and `ls supabase/migrations/*.sql | wc -l` — the migration count in particular had drifted by nearly a hundred and no checklist was catching it._
5. Record in [`answer-bank.md`](../answer-bank.md) that `compass@` is now spent on Betaworks.
6. Update Notion: **My status** to `Submitted`, fill **Date applied**.
