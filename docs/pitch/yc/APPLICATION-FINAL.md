# YC Fall 2026: the application, ready to paste

> _Created: 2026-08-11 · Last updated: 2026-08-13 · **This is the only file to paste from.** Every field below is final text. [`fall-2026-application.md`](./fall-2026-application.md) is the reasoning, the history and the audit trail behind it; this is the output. Where they differ, this file wins._

---

# §A. THE THREE TEXT SURFACES. PASTE THESE. (2026-08-13)

> **The portal leaves five surfaces open: Progress Update, Fundraising Update, Team Update, Founder Video, Demo Video.** Both videos are done. **These three carry everything else, and they are the only place the current truth reaches a partner** — §7 through §12 below are locked at whatever was live on 2026-07-23 and cannot be edited.
>
> **Numbers in this section, pulled 2026-08-13:** `git rev-list --count HEAD` = **5,131** · `ls supabase/migrations/*.sql | wc -l` = **532** · first real commit `2026-06-02`, so **ten weeks**. The first two move daily. **Re-run both the morning you paste.**
>
> **Written to three constraints.** Nothing volunteered twice. No em dash anywhere in a paste block. No present-tense claim of accumulated learning, because the honest form survives a query and the flattering one does not.

## What this version does differently, in one paragraph

The old text argued from volume: commits, a feature register, a decade of pain. Volume is the one argument every application makes. **This version argues from two things almost nobody can put on a form.** The first is a mechanism: a forecast frozen at the moment of the call, held immutable by the database itself. The second is a correction: three product numbers deleted because a self-audit found them to be demo data. A partner meets thousands of founders claiming a moat. Far fewer hand over the number that made them look worst.

---

## Surface 1 — Progress Update

### 1a. Product link

```
https://supaprod.ai
```

### 1b. Login credentials (single line)

```
explore@supaprod.ai / Supaprod!Explore2026 (private beta. The workspace has calls waiting on your judgment, each opening to the evidence behind it. To create your own account instead, invite code YC-COMPOUND-K7QR4V)
```

**Log in with these exact credentials, in incognito, before you save anything.** A dead login fails the whole application. Fallback if it breaks: `harbor@supaprod.ai / Supaprod!Harbor2026`, identical workspace, then fix.

### 1c. "How far along are you?" — the field that carries the application

```
Cadence is now Supaprod. Same company, same person, live at
https://supaprod.ai. The form will not let me rename it.

Where it stands: the product runs end to end. Signals arrive from the
tools a team already uses. The system clusters them, argues against the
weak bets before I see them, drafts the spec with its evidence attached,
and hands the build to coding agents. Nothing merges without a person.
5,131 commits and 532 database migrations in ten weeks.

The part I built since applying is the part a rival cannot lift from your
chat logs. At the moment you commit a decision, Supaprod takes three
things: what you expect to happen, how you will know, and by when. Those
fields freeze on write, and a database trigger blocks every later edit. A
prediction you can revise after the result is not a prediction. When the
date passes, the call gets graded against what actually shipped.

Two things I got wrong and corrected.

I had been saying a rival cannot rebuild your decision history. Most of it
survives in Slack and call recordings. Someone reconstructed a lost deal
from theirs using an agent built in two days. What does not survive is
what a team believed before the outcome landed, because almost nobody
writes that down. That is the gap I now close, and it is the only part of
this that cannot be backfilled.

The second one is sharper. Three product numbers I had been quoting turned
out to be my own demo data. The query separating samples from real work
matched on the shape of a workspace id, and sample workspaces get ordinary
ids. The real count was zero. I shipped a column so the two can never blur
again, and I would rather tell you than have you find it.

So the honest state, before you ask: the loop is wired end to end and
proven on a live database, and empty by design until someone runs real
work through it. I can show you that path running today.

A 2:22 film of the product working: https://supaprod.ai/film
The full brief: https://supaprod.ai/brief
Public launch: mid-September.
```

`[FOUNDER]` **If any outside person has used it by paste day, add one sentence with the true count, directly under the film link.** This is the first thing a partner looks for and nothing above substitutes for it. Never pad it. If the count is still zero, add nothing: the paragraph beginning *"So the honest state"* already answers it, and answering it twice draws attention to the gap.

**Why the two corrections stay in, at length.** They are the strongest paragraphs on the form. YC weights updating on evidence above being right first time, and each of these carries a mechanism, a root cause and a fix. The seed-data one also pre-empts the only diligence question that could have hurt: a partner who runs the query finds zero either way, and finding it after being told is a very different read from finding it cold.

### 1d. "How long have each of you been working on this?"

```
Ten weeks on this build, seven days a week. The repo shows 5,131 commits
and 532 database migrations across that stretch, plus about a month of
nights and weekends on the prototype it grew out of.

I am going full time on Supaprod regardless of the outcome here. That
decision is made. The batch changes where I sit and how fast I learn, not
whether I am in.
```

`[FOUNDER]` **Add one clause stating the literal employment position on paste day**, and keep it to one clause with no gray area: *"my notice is in, last day <date>"* or *"I am on a break from my product role"*. Rehearse the same words for the interview; this is the one line a partner will test against LinkedIn.

### 1e. "Are people using your product?" (radio)

**No**, unless an outside person has literally used it by paste day. Availability is not adoption, and 1c already says the product is open. Flip to **Yes** only with real users, and then state the true count in 1c.

### 1f. "When will you have a version people can use?"

```
It is usable now, through the login above or the invite code. The public
launch is mid-September, on Hacker News and Product Hunt.
```

### 1g. "What tech stack are you using?"

**Low churn on purpose.** The founder finalised this on 2026-08-03 against the repo and the live database, and it is still accurate. Two edits only: the vendor-neutral observability line stays honest, and the coding-agent list drops to what runs today.

```
Coding agents: Claude Code and Codex write the code, with Lovable and
Antigravity in the mix. I direct them and make every call.
AI models: model agnostic by design. Every AI call goes through one
runtime chokepoint handling budget, cache, guardrails, tracing, fallback
and feature gates, so Claude, GPT, Gemini, Qwen, DeepSeek or a local model
plug in as interchangeable parts. Running today: Qwen and Gemini carry the
agent loop, GPT-5 where reasoning depth earns its cost, Cohere embed-v4
for every retrieval vector.
Frontend: TanStack Start on React 19 and Vite, with Tailwind and shadcn.
Backend and data: TypeScript throughout, Supabase Postgres with row level
security, pgvector for retrieval, pg_cron driving the autonomous engine,
Bun for builds and packages.
Deployment: Cloudflare Workers.
Observability: the system writes its own telemetry, every agent action and
AI call landing in the audit trail, behind one vendor neutral facade so
PostHog and Sentry drop in without the product depending on either.
```

**Verify before paste:** the "running today" clause is a claim about live traffic. One query against `ai_events` over the last 14 days confirms or corrects the three model names. If the query cannot run, cut that sentence rather than paste it unchecked.

---

## Surface 2 — Fundraising Update

**File nothing.** No investment taken, not currently raising, nothing changed since 2026-07-23. The locked §10 already says this.

**Do not use this surface for narrative.** It exists to report a change in the cap table. Filling it with positioning reads as a founder padding a form, and the Progress Update already carries every word that belongs on this application.

---

## Surface 3 — Team Update

### 3a. "Who writes code, or does other technical work on your product?"

```
Everything is built in house by me with AI agents: design, development,
coding, testing, and the analysis of what people do with it. I direct the
work and make every call. The agents execute, primarily Claude Code and
Codex. No non founder has touched it.

The code does not go unchecked. A separate reviewer, independent of the
agents that write, audits the codebase for security and holds every change
against the test suite before it can merge.

Supaprod's own roadmap runs inside Supaprod, so every one of those calls
sits in the audit trail with the evidence behind it. That is how I know
the product works end to end before asking anyone else to trust it.
```

**Three deliberate removals from the filed version.** The build register is gone, because it was last maintained on 2026-08-04 and understates the work by roughly 450 commits; an accurate count from a stale source is a false claim with a correct number inside it. The Kimi and HyperAgent names are gone, because naming five tools where two do the work invites a question that buys nothing. And "one person directing a fleet of agents" is gone as a slogan, kept only as the plain fact in the first line.

### 3b. "Are you looking for a cofounder?"

**Keep unchanged.** It already reads secure, and rewriting a settled answer to sound better is how a confident line turns anxious.

```
Solo, and moving fast. Open to a cofounder who shares the vision and the
energy and adds a perspective I do not have. For now, solo.
```

---

## Paste-day order

1. Incognito login on `explore@supaprod.ai`. Land on a populated workspace. Fail here and stop.
2. Re-run the two moving numbers. Update 1c and 1d together, or they will disagree.
3. Fill the two `[FOUNDER]` slots: the user count in 1c, the employment clause in 1d.
4. Paste Surface 1. Set the radio truthfully. Save.
5. Paste Surface 3. Save.
6. Leave Surface 2 empty.
7. Read every pasted field aloud once. Anything you would not say to a person, cut.

---

## What is deliberately NOT in these three surfaces

| Left out | Reason |
| --- | --- |
| Feature or register counts | The register is stale by ~450 commits and understates the build. Do not cite it. |
| Any product usage number | Every one that existed was seed data. A smaller honest number is still zero. |
| "Cursor for PMs" | It is allowed on YC surfaces and it is in the locked 7f already. Repeating it in an update spends a line on something the partner has read. |
| The seven-station diagram, "operating system", "agentic-first" | All retired. Platform words read as meaningless, and nobody in the market's own writing uses them. |
| Named competitors | The locked 9b handles them. An update surface repeating locked content wastes the read. |
| Present tense compounding | "Wired and proven, begins accruing on first real use" survives diligence. "It learns from your corrections" does not survive one query. |

---

# §B. The locked application, and the record behind it

> **§7 through §12 below are LOCKED on the form.** They are here as the interview script: a partner may quote any of it back. The 2026-08-11 founder objections and their resolutions follow, then every locked field.

> # 🛑 FOUNDER REVIEW, 2026-08-11. The objections below are RESOLVED in §A above.
>
> **Objection 1 ("putting people in it") and objection 2 (the build register) are removed from every paste block in §A.** Objection 3 (the AI-built framing) is settled the way the review recommended: the tech-stack field answers the question plainly because YC asks it directly, and no other field claims it.
>
> **His objections are below in his words, kept as the record of what was corrected and why.** The two outright false claims were removed on the day, because a false claim does not wait for a meeting.
>
> | # | His objection | Status |
> | --- | --- | --- |
> | **1** | *"'Now I'm putting people in it.' What are you putting people in? I do not have any people to put work on it."* | **REMOVED.** It was false. 8a now carries a `[FOUNDER]` placeholder instead of a claim, because what comes next is his call, not mine. |
> | **2** | *"The 370 register features shipped, those things are very outdated... we lost track of maintaining the features. Now I assume we would have built double the size of that till now."* | **REMOVED, and he is right.** Last touched `2026-08-04`, roughly 450 commits ago, so it **understates** the build and cannot be defended if a partner asks how it is kept current. **Correction to my own wording:** I first called it *abandoned*. He corrected that, and the distinction matters. It was **deliberately deprioritised** because maintaining the documentation cost more than it returned, so the team went straight to building. That is a trade-off, not a lapse, and describing it the other way would have been unfair in exactly the way I have been asking others not to be. |
> | **3** | *"I don't want to say everything was built by AI."* | **PARTLY ACTED ON, needs his ruling.** I removed *"its agents built most of it"* from 8e, which was the strongest form and also the least supportable given the loop's real state. **What remains is 8c, which is unavoidable**: YC's question explicitly asks which AI models and AI coding tools you use, and answering it evasively is worse than answering it plainly. **Open question for the review: how far do you want the AI-built framing pulled back elsewhere?** My view is that 8c stays exactly as it is and every *other* mention goes, because the tech-stack field is the one place it is asked for and the one place it cannot be read as a boast. |
> | **4** | *"Everything needs to be detailed and thought through."* | **Open.** Read as: the rebuild moved too fast over fields that needed his judgment rather than my inference. The `[YOU]` markers are the ones I already knew about; objections 1 and 2 were ones I should have caught and did not. |
>
> **What I got wrong, plainly.** I checked every *number* against the database and did not check every *sentence* against his situation. "Now I'm putting people in it" is not a data error, it is a claim about the world that I inherited from an older draft and carried forward without asking whether it was true. The register number is worse: I verified the count was accurate and never asked whether the source was still maintained. **An accurate count from an abandoned register is a false claim with a correct number in it**, which is exactly the failure mode this rebuild was supposed to end.
>
> **Still unresolved and worth deciding at the review:** with the register gone, the only build-size evidence left is commits and migrations. That is honest but thin, and "4,900 commits" invites *"commits are not a unit of work."* Options are to leave it thin, to re-derive a defensible feature count from the codebase rather than the register, or to drop volume claims and let the working product carry it. **My recommendation is the third**, because the demo login is stronger evidence than any count and it cannot be argued with.

---

## Read this before you paste, it is four lines

1. **Every number here reproduces from a command or a query.** They are listed in §0 with how to re-run them. Two move daily. **Re-run those two on the morning you submit.**
2. **Three claims were removed because they were false, not because they were weak.** What replaced them is in §0.
3. **Nothing here claims accumulated learning in the present tense.** The loop is wired and proven; it begins accruing on first real use. That is both the honest form and the stronger one.
4. **Three fields need something only you have**, marked `[YOU]`: the discovery-call count, the demo video, and what actually comes next in 8a.

> ⚠️ **§7 to §12 below are LOCKED on the live form and cannot be pasted.** They are the interview script. **The paste source is [§A](#a-the-three-text-surfaces-paste-these-2026-08-13) at the top of this file.**

---

## §0. What changed from the version on the form, and why

**Three things were being claimed that are not true. This is the whole reason for the rebuild.**

| Was on the form | Why it is gone | What it says now |
| --- | --- | --- |
| *"119 lessons recorded, 38 where it decided the verdict itself, 36 times a new decision was made using a lesson from an older one"* | **All seed data.** Every `learnings` row in the database sits in a seeded or fixture workspace. 37 of them are dated before the repo's first commit; the earliest is 2025-12-05, six months before the product existed. The lineage edge written when a shipped spec gets its verdict has **never fired**. | The mechanism, plus an admission. A partner who runs the query finds zero, and finding it yourself is worth more than the number was. |
| *"13 months"* of building, in six fields | **The repo's first commit is 2026-06-02 and the earliest mission in the database is 2026-06-04.** Ten weeks. | Ten weeks in this codebase, and about a month of nights and weekends on the prototype before it. |
| *"it cannot be bolted onto a tracker, and it cannot be copied quickly, because it only accumulates with time"* | **Falsified 2026-08-10.** Vercel's COO reconstructed a lost deal's true cause from Slack, email and call recordings with an agent built in two days that runs for about $1,000 a year. The record is rebuildable. | The forecast. Everything else about a decision survives in chat logs and can be rebuilt; what a team believed *before* the outcome leaves no trace unless something caught it at the moment of the call. |

**Positioning change applied, 2026-08-11.** The application no longer **leads** with the forecast. It leads with the governed record of agentic product work and lets the forecast be the thing that makes that record uniquely useful. The reason is in `market-validation-2026-08.md` §8.5: corporate prediction markets at Google beat expert forecasts by up to a 25 percent reduction in mean squared error **and died anyway**, because the transparency ran counter to the interests of the people who could have kept them. A pitch that leads with *"we record what you predicted so it can be checked later"* is selling accountability to the person who would be held accountable.

### The numbers in this application, and how to re-run them

| Number | Value | How |
| --- | --- | --- |
| Commits | **5,131** _(2026-08-13)_ ← *moves daily* | `git rev-list --count HEAD` |
| Migrations | **532** _(2026-08-13)_ ← *moves* | `ls supabase/migrations/*.sql \| wc -l` |
| Weeks | **ten** | First real commit `2026-06-02`. One template commit dated 2025-01-01 is scaffold, not work. **Eleven weeks from 2026-08-18.** |
| ~~Build register~~ | **DO NOT USE** | **Not abandoned, deliberately deprioritised** (founder, 2026-08-11): keeping it current cost more than it returned, so the team went straight to building. It is accurate up to `2026-08-04` and carries nothing from the last two to three weeks, roughly 450 commits. So it **understates** the build. Do not cite it, and do not describe it as neglected; the reason it is stale is a defensible trade-off, not a lapse. |
| Outside users | **zero** | Stated once, in 8e, where the form asks. |
| Revenue | **none** | |

**Do not add a product-usage number to this application.** Every one that existed was seeded. Full detail: [`../verified-numbers.md`](../verified-numbers.md).

---

## §0b. The sentence-by-sentence pass, run 2026-08-11

**Every load-bearing claim in this application, the thing that would make it true, and the result of running it.** This is the pass that was missing when the rebuild was written, and it is the reason two claims below changed after the founder's review rather than before it.

| Claim | Checked against | Verdict |
| --- | --- | --- |
| "advances product missions on its own every minute" | `cron.job`: `resume-runs` is `* * * * *`, active, and imports `advanceMissionCore` | ✅ **True.** 37 cron jobs active. I nearly flagged this as false by reading `loop-tick` (`*/10`) and stopping |
| "agents that open real pull requests" | `studio_changesets` **44**, `deployments` **42**, `mission→changeset` lineage **21**, `changeset→deployment` **14** | ✅ **True** |
| "behind a merge gate no agent can cross" | `agent_approvals` **289 rows**; `approvals-tick` cron active every minute | ✅ **True.** The gate has fired 289 times |
| "one-key rollback on anything they produce" | `src/components/prds/RewindButton.tsx`, `src/lib/studio-rollbacks.ts` | ✅ **True** |
| **"permissions agents earn from their track record"** | `src/lib/ai/trust-ramp.ts` exists and is careful: it *proposes* graduation, a human accepts, and an agent with a recent missed outcome gets no proposals. **But `capability_changes` = 0.** | ⚠️ **CHANGED.** The mechanism is real and has **never fired.** No agent has earned anything. Reworded to the mechanism, not the history |
| **"connect the tools where your product signals already live"** | `src/lib/connectors/providers/index.server.ts`: **11 providers are `stubAdapter`**, including **Linear, Notion, Jira, Figma, Gmail, Google Docs** | ⚠️ **CHANGED.** Real: Slack, Intercom, Zendesk, Canny, Productboard, Salesforce, HubSpot, Stripe, GitHub, GitLab. **The named ones are now named, because a PM reading "the tools where your signals live" assumes Linear and Jira, and those are stubs** |
| "a shipped spec gets checked against what happened" | `prd → learning` writer at `outcome.functions.ts:632` | ✅ **Exists**, and has **never fired** (0 rows). Already stated that way |
| "argue against the weak bets before you see them" | `src/lib/ai/persona-critic.ts` | ✅ **True** |
| "5,063 commits, 519 migrations, ten weeks" | `git rev-list --count HEAD`, `ls supabase/migrations/*.sql`, first commit `2026-06-02` | ✅ **True and reproducible** |
| "Notion shipped Ship OS free in July" / "Atlassian launched Product Collection in May" | `market-validation-2026-08.md` §3.2 and §8.4, both dated and sourced | ✅ **True** |
| Zero outside users, no revenue | `production_workspace_ids()`: **6 workspaces, all founder or test accounts** | ✅ **True.** There is no customer data at all |

> **The rule this pass exists to enforce:** a phrase sweep catches a retired claim in any wording and misses a number carrying the same claim; a mechanism sweep catches a missing writer and misses prose asserting the mechanism exists. **Anything that appears only as a sentence is invisible to both.** So the third pass is: take each load-bearing sentence, find the code or query that would make it true, and run it. Not "is this worded right", not "does this mechanism exist", but **"is this specific sentence true right now."**

**The distinction that did the most work here, and it is worth carrying into the interview:** *a writer that exists and has not run is a product waiting for a user; a hop with no writer is a hole.* Two claims in this application are the first kind, and both now say so plainly. **That is a much better answer to "is it actually built" than any number**, because it is checkable in the code rather than in a database that is honestly still empty.

---

## 7. Company

### 7a. Company name
```
Supaprod
```

### 7b. Describe what your company does in 50 characters or less.
```
Cursor for PMs, the whole product org.
```
_38 characters. Anchor plus scope escalation in one line._

### 7c. Company URL
```
https://supaprod.ai
```

### 7d. Demo video
`[YOU]` **Under 2 minutes 15 seconds.** Real screen recording, your voice, the product doing something visible in the first 30 seconds. Shot list: [`video-scripts.md`](./video-scripts.md) Part 2. The 11:46 version on the form now is far too long; partners watch 60 to 90 seconds.

### 7e. Please provide a link to the product, if any.
```
https://supaprod.ai

Demo login: explore@supaprod.ai / Supaprod!Explore2026
The workspace has real calls waiting on your judgment, each one showing the
evidence behind it. Or sign up with invite code YC-COMPOUND-K7QR4V.
```
_Signup closed 2026-08-07; the invite code is the way in and is reserved for YC. **Log in with these exact credentials yourself before you submit.**_

### 7f. What is your company going to make?
```
Supaprod is where a product org runs when AI agents do the work. The shortest
way to say it: Cursor for product managers, but it is one system for the whole
lifecycle rather than a copilot bolted onto one step. You connect the places
your product signals already live, Slack, Intercom, Zendesk, Canny,
Productboard, Salesforce, HubSpot, Stripe and GitHub today, and the agents
take it from there.
They read the signals, cluster them into opportunities, argue against the weak
bets before you see them, write the spec with the evidence attached, plan the
work, and hand builds to coding agents. You approve the calls that matter.

The part that makes it a company is the governed record underneath. Every
agent action lands in an audit trail, every decision carries the evidence it
was made on, and nothing irreversible happens without a person. When agents
are doing the work, being able to answer "why did we decide this, on what,
and who signed off" stops being a nicety and becomes the control that lets
you let them run at all.

And there is one thing in that record nobody can reconstruct afterwards. You
can rebuild most of a decision from chat logs and call recordings; an agent
can do it in an afternoon. What you cannot rebuild is what the team believed
would happen before they found out. Supaprod captures that at the moment of
the call, as a byproduct of doing the work, and uses it to rank what to build
next.

AI made building cheap. What a company runs on now is decisions and whether
they were right. That is the layer I own.
```
_197 words. Governed record first, forecast third, no present-tense compounding claim._

### 7g. Where do you live now, and where would the company be based after YC?
```
Bangalore, India. San Francisco after YC.
```
_Keep your existing relocation paragraph; it reads fine._

---

## 8. Progress

### 8a. How far along are you?
```
The product works end to end today and the login above is live. Ten weeks,
solo: an engine that advances product missions on its own every minute; agents
that open real pull requests behind a merge gate no agent can cross;
a trust ramp that proposes graduating an agent's permissions after a run of
clean approvals, and blocks proposals entirely for an agent with a recent
missed outcome, though no agent has earned a graduation yet;
one-key rollback on anything they produce; and a decision record where a
shipped spec gets checked against what actually happened, and that verdict
re-ranks what to build next.

I also found something in my own numbers this month that is worth telling you.
I had been reporting how many decisions the system had made from earlier
lessons. Re-verifying it, the query that separated my demo data from real data
was matching on the shape of a workspace id, and the function that creates
sample workspaces gives them ordinary ids. The real count was zero. The
machine is built and proven on a live path; the record it accrues starts when
someone runs real work through it. That is where I am, exactly.

[FOUNDER: this field needs your call on what comes next. The previous draft
said "now I'm putting people in it", which is not true; there is nobody in it
yet. Say what is actually next, in one sentence.]
```
_The admission is the strongest paragraph in the application. YC weights updating on evidence more heavily than being right the first time, and this one has a mechanism, a root cause and a fix._

### 8b. How long have each of you been working on this?
```
Ten weeks on this build, seven days a week, roughly sixteen hours a day; the
repo shows 5,063 commits and 519 database migrations over that
stretch. Before that, about a month of nights and weekends on the prototype
that became Supaprod. I am going full-time on Supaprod regardless of anything.
That decision is made. The batch changes where I sit, not whether I am in.
```
_Interview one-liner, rehearse verbatim: **"I'm a Senior AI Product Manager at Intellect, building an AI platform for the banking and finance domain. Supaprod gets sixteen hours a day; I'm serving out my transition and going full-time, resignation planned."** Matches LinkedIn. Do not improvise this one._

### 8c. What tech stack are you using?
```
Built almost entirely with Claude Code, plus Lovable and Antigravity.

Frontend: TanStack Start (React 19, Vite), Tailwind, shadcn.
Data: Supabase Postgres with row-level security, pgvector, and pg_cron driving
the autonomous engine.
Deploy: Cloudflare Workers.
Models: model-agnostic by design. Every AI call goes through one runtime
chokepoint that handles budget, cache, guardrails, tracing and fallback, so
Claude, GPT, Gemini or a local model plug in as interchangeable parts.
```
_Do not add "users can bring their own keys." The question asks what **we** use._

### 8d. Optional: attach a coding agent session you're proud of.
`[YOU]` Pick one that shows **judgment, not prompting**: you scope a feature, catch the agent's wrong turn, and drive it to a merged PR. YC reads these as evidence a founder can build.

### 8e. Are people using your product?
```
Not outside users yet. I am opening the first access now, to the PMs and
founders from my discovery calls. The daily user is me: I run Supaprod's own
roadmap inside Supaprod. That proves the
product functions end to end before I ask anyone to trust it, which is
different from proving anyone wants it, and I am not going to blur the two.
Anyone can try it today through the demo login above.
```
_This is the version that survives the obvious partner question, "if you're the user, who pays you?" It claims function, not demand._

### 8f. When will you have a version people can use?
```
It is usable now: the link and demo login above. The public launch is in
September.
```

### 8g. Do you have revenue?
```
No.
```

### 8h. If you are applying with the same idea as a previous batch, did anything change?
```
Same idea, one batch later. Since the last application the product went from
an early spine to working end to end: the autonomous engine runs, agents open
real pull requests behind human gates, a shipped spec now gets checked against
what happened and that verdict re-ranks what to build next, an outside AI code
audit of the codebase held up, and the public launch is set for September. 5,063 commits and 519 migrations in ten weeks.

I also corrected two things I had been claiming. I had said a competitor
cannot rebuild your decision history. That is not true; you can reconstruct
most of it from Slack and call recordings, and someone did it in two days for
about a thousand dollars a year. What cannot be reconstructed is what a team
expected before it found out. And I had been quoting product numbers that
turned out to be my own demo data. Both are fixed, and finding them was worth
more than the claims were.
```
_YC's own FAQ calls progress since the last application a strong signal. This field is doing double duty: pace, and a founder who audits himself._

### 8i. Incubator / accelerator
```
No. Supaprod has not been part of any program. This would be the first.
```

---

## 9. Idea

### 9a. Why did you pick this idea? Do you have domain expertise?
```
I have spent close to a decade in product: communication systems at ISRO, then
product roles at Infineon and Bosch, and most recently the AI platform that
200+ financial institutions use to build their own AI products. In every one of
those jobs the real work was being the glue across a dozen tools and a dozen
stakeholders, and re-answering "why did we decide this" from memory.

Supaprod started as a dashboard I built for myself to stop drowning in that,
and it kept growing. Then I noticed YC describing the same gap from the
outside: an RFS essay asked for a Cursor for product managers, and the current
RFS asks for a Company Brain and an AI operating system for companies.

How I know people need it: I read 679 primary sources and a private community
of about thirty thousand product managers, in full, and they name this pain in
better words than mine. One put it as "PMs got faster at shipping but didn't
get better at defending why. The judgment gap got exposed." Another described
the unmet need exactly: agents fall apart when they cannot tell what is
current versus stale, canonical versus just-discussed, decided versus still
needs a human. I have also had [N] conversations with PMs and founders. I
have not run formal discovery interviews and I am not going to pretend I have.
```
`[YOU]` **Replace `[N]` with the true count, or delete that sentence.** Never inflate it; YC verifies. The research read is doing the work either way, and it is checkable.

### 9b. Who are your competitors? What do you understand that they don't?
```
My real competitor is not a company, it is a folder. Teams hand-roll this in
markdown and scripts, and it works until a second person or a fleet of agents
touches it. That is the moment we sell into, and it is the honest read: on
engineering forums the reflex is "just commit your agent files," and the
largest organisation I found solving this at scale built the whole thing
in-house rather than buying.

The named neighbours are real and getting closer. Notion shipped Ship OS free
in July with near-identical framing. Atlassian launched Product Collection in
May, positioned as "built for better decisions, in the AI era." Linear hands
issues to coding agents. ChatPRD drafts specs for 100k+ PMs. Every one of them
makes doing the work faster.

What I understand that they don't: none of them records whether the call was
right, and none of them captures what the team expected before it found out.
Atlassian links feedback to decisions to shipped work, retrospectively. That
gap is still open, and it is the one thing a competitor cannot backfill,
because everything else about a decision survives in chat logs and an agent
can rebuild it in an afternoon.

I also deliberately do not build the code generator. Cursor and Devin are in a
capital knife fight there and the models keep absorbing that layer. Supaprod
decides what is worth building, dispatches to whichever generator wins, and
governs the result.
```
_Concedes the strongest counter-argument, then names what it does not reach. Notion and Atlassian are 2026 facts a partner may already know; naming them first is better than being told._

### 9c. How do or will you make money? How much could you make?
```
Free tier runs the full loop on a small credit budget. Paid is a workspace
subscription plus usage credits for agent runs, so revenue grows with how much
work the agents do rather than with headcount. Land: solo founders and PMs on
small teams, who feel this hardest and can start without procurement. Expand:
teams and enterprises, where the audit trail is the thing they actually
budget for. That budget already exists; today it is split across a tracker,
a docs tool, a spec tool, a coding agent and status meetings.

How big: every company that builds software is converging on one shape.
Instagram replaced its roughly 13-person canonical team with pods of four to
six engineers led by a new role it calls product staff, a PM who absorbs
design, data and research (Mosseri, July 2026). That seat is our buyer. One
person is now accountable for calls that used to be split across five
specialists, and that seat has no system of record. Systems of record are the
biggest outcomes in software. Pricing gets its first real test in beta.
```
> **The old version of this field spliced two sources into a sentence neither said** ("one PM directing 20 agents across a 4 to 6 person pod"). Mosseri never says "agents"; the other figure could not be found anywhere in 679 documents. **This is the corrected paragraph.** If a partner quotes the old text back: [`../../research/lennys-quote-verification.md`](../../research/lennys-quote-verification.md).

### 9d. Other ideas you considered?
```
This is the one. The closest was the earlier dashboard version that became
Supaprod. I am building what I kept wishing existed.
```

---

## 10. Equity

| Field | Answer |
| --- | --- |
| Legal entity formed | No _(update if you incorporate first)_ |
| Planned ownership | Rohit 100%, meaningful equity for the right cofounder, option pool |
| Investment taken | No |
| Currently fundraising | No |

---

## 11. Curious

### 11a. What convinced you to apply to Y Combinator?
```
Friends of mine just went through YC: Asendia AI. Badis and I overlapped at
TUM and later worked on the same team at the same company, and I watched their
batch up close, from application to Demo Day. That settled it. Add that YC's
own RFS keeps describing the company I am building, and this felt like the
right moment rather than just a good idea. I have not been to a YC event yet.
```
`[YOU]` **Message Badis before you submit**: heads-up plus an alumni recommendation ask. If it feels lukewarm, drop the names and say "friends of mine just went through YC."

### 11b. How did you hear about Y Combinator?
```
I have been following Y Combinator on socials for a very long time. That is how.
```

---

## 12. Batch
```
Fall 2026
```

---

## The founder profile fields

### 3a. A time you hacked a non-computer system to your advantage.
Keep your existing answer.

### 3b. The most impressive thing other than this startup you have built or achieved.
`[YOU]` **This was unanswered and it should not be.** The strongest available material is ISRO: you worked on communication systems for a national space programme. Write four plain sentences: what the system did, what your part was, what constraint made it hard, and what happened. No adjectives.

### 3c. Things you've built before.
`[YOU]` **Also unanswered.** List them with URLs where they exist. The dashboard that became Supaprod belongs here.

### 3d. Competitions, awards, papers.
Keep your existing answer.

---

## Before you hit submit

1. **Re-run the two moving numbers** (commits, migrations) and update 8b and 8h.
2. **Log in with the demo credentials yourself.** If they fail, the whole application fails with them.
3. **Fill or delete `[N]`** in 9a. Never inflate.
4. **Record the demo video** at under 2:15.
5. **Fill 3b and 3c.** Two blank fields on a founder profile read as incuriosity.
6. **Message Badis.**
7. **Read every answer aloud.** Anything you would not say to a person, cut.

## Related

- [`fall-2026-application.md`](./fall-2026-application.md) — the reasoning, the audit history, and every superseded draft
- [`../verified-numbers.md`](../verified-numbers.md) — every number with its query
- [`interview-prep.md`](./interview-prep.md) — what to say when a partner pulls on any of this
- [`../../research/market-validation-2026-08.md`](../../research/market-validation-2026-08.md) — the evidence behind the positioning change in §0
