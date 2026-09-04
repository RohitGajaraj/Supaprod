# The demo story — one character, one pain, the product as her prop

> _Created: 2026-07-25 · Last updated: 2026-08-11_

> _Created 2026-07-25 (founder ruling, the YC session): **the demo tells a story. It does not tour features.**_
>
> _Governing source: **Pete Koomen (Y Combinator), "The secret to better product demos"** ([youtube.com/shorts/rNPJKpmp3TM](https://www.youtube.com/shorts/rNPJKpmp3TM)). His thesis, in his words: great demos focus on the user, not the product. A bad demo is a tour, "this is the login page, this is the dashboard," and the audience's eyes glaze over. A great demo is like a great book or movie: it tells a story, that story starts with a main character, and **your most important job is to get the audience to connect with that character and understand her pain.** The product is **just a prop she uses to solve a problem**. His closing instruction: don't show me your product, tell me a story about your user._
>
> This is YC's own advice, published by YC, and the application is going to YC. Following it is not optional.
>
> Companion docs: [`demo-script.md`](./demo-script.md) is beat timing, [`yc/video-scripts.md`](./yc/video-scripts.md) is recorded wording. **This file is the spine both serve.** When they disagree on what story is being told, this file wins.

---

## The single rule

Every sentence in the demo is either **the character**, **her pain**, or **the prop she picks up**. Nothing else is allowed in.

If a beat cannot be phrased as something happening to a person, it gets cut, however good the feature is.

| Koomen's bad demo | What that sounds like here | What we say instead |
| --- | --- | --- |
| "This is the dashboard." | "This is Mission Control." | "This is the first thing Maya sees on Monday." |
| "We have a critic agent." | "The critic red-teams your bets." | "Something argued with her. It had a reason." |
| "We track outcomes." | "Here's the outcomes view." | "Six weeks later, she found out she was half right." |

**Never name a surface. Never name an agent as a feature.** Name what happened to Maya.

---

## The main character

**Maya Ruiz, the product manager on Relay.**

Relay is a consumer app: 41,000 active users, a checkout flow, notification complaints, App Store reviews, a funnel that leaks. Maya has owned it for fourteen months.

Her company, Helio Labs, happens to sell home solar monitors, and it has three surfaces: Atlas for installers, Relay for homeowners, Beacon for billing. **Say that once and move on.**

### Lead with the job, not the industry

The single most common way this demo goes wrong is opening with "a solar company." The viewer is a product manager at a software company, and the moment they hear solar hardware they spend a beat deciding whether this applies to them. That beat is the whole budget.

So do not open with the industry. Open with the job:

> _"This is Maya. She runs a consumer app. Forty-one thousand users, checkout conversion, too many notifications, the usual. Her company happens to make solar hardware, but her week is every product manager's week."_

One sentence and the distance closes. Everything that follows, the abandoned checkouts, the App Store reviews, the funnel drop, the spec, the pull request, is ordinary software product work.

**The industry is doing useful work in the background, and it is deliberate:** Helio is obviously not a competitor to anyone watching, so nobody spends the demo arguing with the example instead of watching the product. Set dressing should be specific enough to be believable and neutral enough to be invisible.

_(The name is a placeholder the founder can swap. What cannot be swapped is that there IS one named person, the audience meets them in the first ten seconds, and they are introduced by what they DO.)_

### Her pain, which is the audience's pain

This is the part that has to land before a single pixel of product is shown. Koomen is explicit: connection with the character is what makes it possible to blow their minds later.

> **Maya is accountable for everything and can prove almost none of it.**

Concretely, and every PM watching has lived all three:

1. Someone senior asks **"why did we decide this?"** about something shipped last quarter. The honest answer is buried in a Slack thread, a call nobody recorded, and a Notion page that stopped being true in March. So she spends a morning on archaeology and still answers with a shrug.
2. The evidence that would have told her what to build is **scattered across four places she does not have time to read** on any given Tuesday.
3. When something she shipped underperforms, **nothing in her stack notices.** The bet stays ranked where it was. The next PM makes the same call.

That is the pain. The product does not appear until the audience is nodding.

---

## The story: one month on Relay, in two minutes

### Beat 0 — meet Maya, and feel the question (0:00 to 0:15)

Open on the person and the question, not the app, and not the industry.

> _"This is Maya. She runs a consumer app: forty-one thousand users, checkout conversion, too many notifications. Last month her VP asked her why they built the thing they shipped in March. She spent a morning digging and still could not really answer. Every product person watching this has had that morning."_

If the industry needs saying at all, it goes in a subordinate clause later, never in the opening sentence.

Then, and only then, she types the question into the thing she now uses.

The answer comes back in seconds: the decision, the evidence it was made on, who made it, and what happened after.

> _"That is the whole reason she kept using it."_

**Prop picked up:** the record, answerable in natural language.

### Beat 1 — the thing she would never have caught (0:15 to 0:40)

Nine pieces of evidence, none conclusive alone, none in the same place: three support tickets, two App Store reviews, a funnel report showing a 34 percent drop, two customer interviews.

Maya read none of them. She was in planning all week.

They were clustered overnight into one theme, and it was waiting for her on Monday with the agent that did it signed against each line.

> _"She did not find this. She was told about it, with the evidence."_

**Prop picked up:** connected sources, ambient clustering, agent bylines.

### Beat 2 — something argued with her, and it was right (0:40 to 1:05)

Everyone on the team assumed the payment step was broken. Maya assumed it too.

The evidence said otherwise: homeowners were abandoning at a **redundant address re-confirm**, for an address they had already given.

And when the exciting bet came up, one-tap crypto checkout for add-ons, it got red-teamed against precedent and **killed**. Scored a 4. The reasoning and the alternatives are on the record permanently.

> _"This is the part that is not a chatbot. It disagreed with her, it showed its work, and the disagreement is still there six weeks later."_

**Prop picked up:** the critic, scoring, decision records with alternatives considered.

### Beat 3 — she decided, and then she stayed in charge (1:05 to 1:30)

She approves the reshaped bet. From that one click: the spec writes itself from the record, goes through design, and a real pull request opens with CI running green.

Then it stops, and waits for her.

> _"Agents wrote it. Maya still owns the merge, and nothing can reach past her to press it."_

**Prop picked up:** spec generation, the design stage, the build engine, PR and CI, the human merge gate, the full trace.

### Beat 4 — she was right, and she was also wrong (1:30 to 1:50)

Completed checkouts went from **59 percent to 78 percent**.

And tablet users saw a noticeably smaller lift than mobile. That is on the record as **mixed**. Not rounded up. Not spun.

> _"Ask the last AI tool you bought to show you its misses."_

**This is the most persuasive twenty seconds in the video.** Skeptics judge the error path. A demo that only wins looks like a demo. Never cut this beat.

**Prop picked up:** outcome tracking, honest reporting, one-key rollback.

### Beat 5 — and this is the part that compounds (1:50 to 2:10)

Because that outcome landed, **four other bets re-ranked themselves.** Nobody asked. One earlier prediction resolved wrong and is sitting there with its score against it.

Next time anyone at Helio proposes a flow change, that precedent surfaces before they start.

> _"Maya's replacement will not have to learn this the hard way. That is the part that gets more valuable every month, and it is the part nobody else is building."_

**Prop picked up:** the outcome-to-bet loop, the lineage graph, memory recall, a published error rate.

### The close

> _"Agents do the work. She answers for it. Supaprod is how she answers. And it gets smarter about her product with every outcome it records."_

---

## Why this order works

The three layers land without ever being named, because Maya needs them in this sequence:

| Beats | Layer proved | What the viewer concludes on their own |
| --- | --- | --- |
| 1 and 2 | **01 the director** | "it tells her what to build, and it pushes back" |
| 3 | **02 the operating system** | "it actually ships, and she stays in control" |
| 4 and 5 | **03 the brain** | "and it remembers, so it compounds" |

**Never open on the brain.** It is meaningless until the audience has watched Maya make one decision and live with the result. It is the crescendo, not the intro.

---

## What the seed must make true

The story only works if every beat is **clickable, not asserted**. Koomen's warning applies in reverse here: the moment the founder has to describe something the screen cannot show, it becomes a tour again.

| Beat | Must be visible | Backing data |
| --- | --- | --- |
| 0 | An answer carrying its evidence chain | `decisions` + `artifact_lineage` |
| 1 | Nine scattered signals, one theme, agent bylines | `signals` (4 sources), `themes`, `agent_runs` |
| 2 | A red-team with precedent, and a killed bet | `opportunities.critic_review`, the killed bet at ICE 4 |
| 3 | Spec, design, PR, green CI, a gate that waits | `prds`, `missions` + `mission_steps`, `studio_changesets`, **pending** `agent_approvals` |
| 4 | A win and an honest mixed result | `learnings` (validated + mixed), `deployments` |
| 5 | Bets re-ranked because an outcome landed | `ice_adjustments`, `artifact_lineage`, `memory_recall_log`, `insights.brier_score` |

### Maya has to exist in the data

A story needs its character present on screen, not just in the voiceover:

- the demo account's `profiles.display_name` reads as a person, not "Supaprod Demo"
- decisions she made are attributed to her, and agent-made ones are attributed to the agent
- at least one meeting has her as the stakeholder, with the decision it produced linked
- the approval queue is addressed to her

**Failure mode to avoid:** the founder says "Maya" and the screen says "Supaprod Demo". That breaks the fiction instantly.

---

## Do we have to cover the whole lifecycle? No. (founder question, 2026-07-25)

Walking the Spine 01 to 07 **is** the tour Koomen warns about. "This is Discover, this is Decide, this is Plan" is "this is the login page, this is the dashboard" wearing better nouns. Seven stops, glazed eyes, and it spends 60 seconds the demo does not have: partners give a demo 60 to 90 seconds of attention before they decide.

The loop still cannot be dropped, because the loop closing IS the thesis. Both are resolved by one fact:

> **The Spine displays all seven stages permanently, without a single click.** It draws `signal -> shipped -> remembered` on the product itself before a word is spoken. Lifecycle coverage happens **passively**, while the story follows ONE bet through it.

Stages are the **setting the story moves through**, never destinations to visit. Maya's checkout bet has to pass through discovery, judgment, build and outcome to be a story at all, so the coverage happens whether or not anyone points at it.

| Stage | Screen time | Why |
| --- | --- | --- |
| 01 Discover | ~25s | Earns it: the scattered evidence is the hook |
| 02 Decide | ~25s | Earns it: something arguing back is the differentiator |
| 03 Plan · 04 Design · 05 Build · 06 Ship | ~25s **combined** | ONE continuous motion, not four stops. Design is a passing frame, roughly three seconds |
| 07 Learn | ~20s | Earns it: the miss is the most persuasive moment available |
| The compounding | ~20s | Earns it: this is the part nobody else has |

Four stages carry weight; three compress into a single breath. The design stage is real and must be acknowledged (the lifecycle genuinely runs plan -> design -> build -> ship), but a stage that does not change the story does not get a beat.

**Verify seven, film one.** The WO-E smoke checklist ("Spine 1-7 walks every face with real data, no bounce") is a **pre-record QA pass** confirming nothing is broken or empty on camera. It is not the shot list. Do not confuse the two.

**The test for any beat:** can it be phrased as something that happened to Maya? If it comes out as "and this stage does X", cut it.

## Don'ts

- Never say "and over here we have…". There is no over here. There is only what happened to Maya next.
- Never name a surface, a route, or an agent as a feature.
- Never show an empty panel. An empty panel says this company is not real.
- Never skip Beat 4.
- Never claim the self-improvement loop beyond what is wired. Workspace-level learning is the claimable line.
- If something breaks live: that is Beat 4 happening for real. Roll it back on camera, show the evidence, keep going.
