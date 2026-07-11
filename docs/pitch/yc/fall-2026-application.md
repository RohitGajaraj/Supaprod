# The YC application — Fall 2026 (previous vs new, field by field)

> _Created: 2026-07-10. Deadline: **July 27, 2026, 8pm PT** (verified). Reviews are rolling — the 10-minute interview can land any time once the application is read, so interview-ready means ready the day you submit (YC's posted outer bound: decisions by Aug 28, batch Oct–Dec in San Francisco, $500K standard deal)._
>
> **How to use this file:** each field shows the PREVIOUS answer (from the rolled-over application), the NEW answer in a copy-paste block, and one line on why. Anything in `[square brackets]` is a slot you fill or confirm on submit day — never submit a bracket. The evidence behind every choice: [`research-findings.md`](./research-findings.md). Interview prep: [`interview-prep.md`](./interview-prep.md). Videos: [`video-scripts.md`](./video-scripts.md).

## The five laws this application is written under

1. **True on the day you hit submit, with zero outside users.** Plans appear as dated plans. Nothing depends on August going well. YC verifies numbers ("if you state numbers in the interview we may ask for verification").
2. **The honesty dial (founder calibration, 2026-07-10).** Truthful is not the same as self-deprecating. Candor goes where the form asks (users, revenue, stage) and is stated as fact plus what happens next — never as apology, never volunteered in fields that don't ask. Exactly one vulnerability beat in the whole application (pricing, framed as the experiment it is). Everywhere else: PG's formidability bar, "justifiably confident."
3. **Unconditional commitment (founder calibration, 2026-07-10).** No "if accepted, I'll…" framing anywhere. The company is happening full-time regardless; YC changes the speed and the zip code, never the decision. (This is also Close's seventh deadly sin inverted: neediness and contingency read as weakness.)
4. **Plain words.** No marketing-speak (PG: "We're immune to marketing-speak; to us it's just noise"), no AI cadence, short sentences, exact numbers however small. Full banned-words list at the bottom.
5. **Lead with the delta, land the scope.** YC's FAQ: progress since a prior application "is a strong signal" — make it impossible to miss in a 90-second skim. And "Cursor for product managers" is the door, not the room: the answers escalate to what this actually is, the operating system a whole product org runs on.

**What a partner is scanning for, in order:** (1) do I get what this is in one sentence, (2) is there an earned insight, (3) is this founder formidable, (4) is anything real and live. Every answer below serves one of those four.

---

## 1. Founders — Role

| Field                          | Previous | New                                                                   |
| ------------------------------ | -------- | --------------------------------------------------------------------- |
| Title                          | CEO      | **KEEP**                                                              |
| Equity %                       | 100      | **KEEP**                                                              |
| At least 10% equity            | yes      | **KEEP**                                                              |
| Technical founder              | no       | **KEEP** (honest; the "who writes code" answer carries this — see §4) |
| Currently in school            | no       | **KEEP**                                                              |
| Commit exclusively if accepted | yes      | **KEEP**                                                              |

## 2. Founders — Background / Social

| Field                       | Previous                                   | New                                                                                                                                                      |
| --------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LinkedIn / Education / Work | filled                                     | **KEEP** (make sure LinkedIn is current before submit — partners open it)                                                                                |
| Personal website            | github.com/RohitGajaraj/Project-Cadence-v2 | **CHANGE** → `https://cadence-flow-beta.lovable.app` (the live product beats a stale repo; the v2 repo stays linked in "things you've built" as history) |
| X URL                       | twitter.com/rohit_gajaraj                  | **KEEP**                                                                                                                                                 |
| GitHub URL                  | github.com/RohitGajaraj                    | **KEEP**                                                                                                                                                 |

## 3. Founders — Accomplishments

### 3a. "Please tell us about a time you most successfully hacked some (non-computer) system to your advantage."

**Previous:** the ISRO story — did the product work before having the title, used the proof to talk his way into the role; "build the evidence first, then ask."

**New: KEEP, one word-level trim.** It is specific, true, and the pattern (evidence first, then ask) is literally what this application does. Final text:

```
I wanted to move from hardware and communication engineering at ISRO into product,
but I didn't have the title or the obvious path. So instead of applying and waiting,
I started doing the work before anyone gave me permission, and used that proof to
talk my way into the role. I've repeated the same move every time I switched
industries since: build the evidence first, then ask.
```

### 3b. "The most impressive thing other than this startup that you have built or achieved." — WAS UNANSWERED. Must fill.

PG calls this the most important question on the application. One concrete thing, not a list.

```
At 21 I was building communication systems at ISRO, India's space agency, for
missions where a mistake is unrecoverable. The systems I worked on flew.
```

### 3c. "Tell us about things you've built before. Include URLs if possible." — WAS UNANSWERED. Must fill.

```
- Cadence itself is the third build of this idea. The first version was a side
  project I hacked together on Lovable to run my own work:
  https://github.com/RohitGajaraj/Project-Cadence-v2. It kept growing until I
  rebuilt it properly as what you see today.
- At Intellect (my current employer) I led product on the AI platform that 200+
  financial institutions across 70+ countries use to build their own AI products.
  I didn't write that code; I shipped the product.
- [FILL: your IIM Bangalore venture: name + one line on what it did + URL if any.
  It's on your LinkedIn, so partners will see it either way; better to own it here.]
```

### 3d. "List any competitions/awards you have won, or papers you've published."

**Previous:** MBA from TUM ("one of Europe's top-ranked programs"), NSRCEL incubation, Startup India recognition.

**New: KEEP, drop the ranking adjective** (adjectives doing evidence's job):

```
MBA from TUM School of Management, where my thesis explored the creator and
ownership economy in Web3. An earlier venture of mine was incubated at IIM
Bangalore's NSRCEL and recognized under the Government of India's Startup India
initiative.
```

## 4. "Who writes code, or does other technical work on your product? Was any of it done by a non-founder?"

**Previous:** good honest answer (AI tools write, I steer, no non-founder touched it).

**New — same story, now with receipts.** YC said out loud this cycle that they evaluate exactly this: Garry Tan — "you can upload a transcript of your Codex or Claude Code making a feature… You can tell a lot about whether someone can build just from how they prompt the agents." Harj Taggar: "The Parker Conrad of today is just in Claude Code."

```
I direct all of it; AI agents write the code. I run parallel Claude Code lanes
with one model doing judgment and review over what the build models produce.
Every change goes through typecheck, build, and a review pass before merge.
Seven weeks in this codebase that has produced about [3,400] commits and [320]
database migrations, and when I had an outside AI code auditor review the
codebase and my build register, the register held up. No non-founder has
touched it. Building this way is also the whole point of Cadence: one person
directing a fleet of agents, with receipts for everything they did.
```

_[Update the commit/migration counts on submit day: `git rev-list --count HEAD` and `ls supabase/migrations | wc -l`.]_

## 5. "Are you looking for a cofounder?"

**Previous:** "Solo, and moving fast. Open to a cofounder who shares the vision and energy and adds a fresh perspective I do not have. For now, solo."

**New: KEEP.** It is honest and reads secure. Do not add more words.

## 6. Founder Video

**Previous:** 2:54. **Over the limit — YC's rule is 1 minute,** "nothing except the founders talking," and "do not recite a written script: use bullet points instead." Re-record. Bullet card + direction: [`video-scripts.md`](./video-scripts.md) Part 1. One take, webcam, look at the lens, energy over polish. YC: "Statistically we're much more likely to interview people who submit a video."

## 7. Company

### 7a. Company name

`Cadence` — **KEEP.**

### 7b. "Describe what your company does in 50 characters or less."

**Previous:** `Cursor for PMs, the whole product org.` (39 chars)

**New (recommended — KEEP the previous):**

```
Cursor for PMs, the whole product org.
```

Why: it does both jobs in one line — the instant anchor a tired reader gets in a second (the accepted pattern: Dendron's "Superhuman for note taking") plus the scope escalation ("the whole product org") that signals this is bigger than a PM copilot. Anchor-only fallback if ever needed: `Cursor for product managers.` (28 chars).

### 7c. Company URL

**Previous:** unanswered. **New:** `https://cadence-flow-beta.lovable.app` _(swap to the custom domain if it lands before July 27)._

### 7d. Demo video

**Previous:** 11:46. **Far too long — partners watch 60–90 seconds.** Re-record at ~2:15 max using the shot-by-shot script in [`video-scripts.md`](./video-scripts.md) Part 2: real screen recording, your voice, product doing something impressive inside the first 30 seconds, "dense, factual, fast," one take, no editing polish.

### 7e. "Please provide a link to the product, if any."

```
https://cadence-flow-beta.lovable.app

Demo login: demo2@redcadence.app / Cadence!Demo2026 (or sign up with your own
account; you get a seeded workspace with two sample products to explore.)
```

_[Before submit: log in with these exact credentials yourself, re-seed the demo workspace, and check the credit balance — see checklist.]_

### 7f. "What is your company going to make? Please describe your product and what it does or will do."

**Previous:** solid but long; some claims ahead of wiring; buries the receipts idea.

**New (~185 words — the anchor opens it, the real scope closes it):**

```
Cadence is where a product org runs when AI agents do the work. The shortest
way to say it: Cursor for product managers, but it's one system for the whole
lifecycle, not a copilot bolted onto one step. You connect the tools where
your product signals live and the agents take it from there: they read the
signals, cluster them into opportunities, argue against the weak bets before
you commit, write the spec with the evidence attached, plan the work, and
hand builds to coding agents. You approve the calls that matter.

The part that makes it a company: every agent action leaves a receipt, and
every decision gets checked later against what actually happened. Cadence
answers "why did we decide this" in seconds, learns which calls were right,
and gets smarter about your product with every outcome it records. Agents
earn autonomy from their track record, the way a new hire earns trust, and
anything they produce rolls back with one key.

AI made building cheap. What a company runs on now is decisions and whether
they were right. That's the layer I own. Agents do the work. You answer for
it. Cadence is how you answer.
```

### 7g. "Where do you live now, and where would the company be based after YC?" + location explanation

**Previous:** "Bangalore, India / San Francisco, USA" + relocation paragraph. **KEEP both** (trim "access to capital" if you want it one line shorter; it reads fine as is).

## 8. Progress

### 8a. "How far along are you?"

**Previous:** honest but stale ("started three weeks ago… core pieces coming together in early form").

**New — the field where the rollover pays.** Everything below is true today; refresh numbers on submit day:

```
The product works end to end today; the login above is live. In seven weeks,
solo: an engine that advances product missions on its own every minute (live
database right now: [133] missions run, [129] agent runs, [72] decisions
recorded); agents that open real pull requests behind a merge gate no agent can
cross; permissions that agents earn from their track record; one-key rollback
on anything they produce; and decisions that get re-checked against outcomes,
which then re-rank what to build next.

I track the build in a public-style register: [385] features specced, [293]
shipped. I had an outside AI code auditor review the codebase against that
register, and it held.

Everything until now was building the machine. Now I'm putting people in it:
the beta is opening with the PMs and founders from my discovery calls, and
the public launch follows in weeks, not months.
```

_(Note the register: zero users is stated once, in 8e, where the form asks — not volunteered here as "the gap." Law 2.)_

### 8b. "How long have each of you been working on this? How much of that has been full-time?"

**Previous:** "Three weeks… around 35 to 40 hours a week."

**New:**

```
Forty-five days on this build at roughly sixteen hours a day, seven days a week;
the repo shows about [3,400] commits over that stretch. Before that, about a
month of nights and weekends on the prototype that became Cadence. I'm going
full-time on Cadence regardless of anything. That decision is made. The batch
changes where I sit, not whether I'm in.
```

_[CONFIRM before submit: your one-line answer about your current role at Intellect, for the interview. It must match your LinkedIn ("Jun 2023 – Present"). Suggested honest line if asked: "I'm serving out my transition at [status]; Cadence gets 16 hours a day and my resignation is planned for [date] / already submitted." Decide the true version and rehearse it — do not improvise this one.]_

### 8c. "What tech stack are you using… Include AI models and AI coding tools you use."

**Previous:** good. **New — same, updated and one line more honest about how it's built:**

```
Built almost entirely with Claude Code, plus Lovable, Cursor, and Antigravity.
Frontend: TanStack Start (React 19, Vite), Tailwind, shadcn. Data: Supabase
Postgres with row-level security, pgvector, pg_cron driving the autonomous
engine. Deployed on Cloudflare Workers. Model-agnostic by design: every AI call
goes through one runtime chokepoint (budget, cache, guardrails, tracing,
fallback), so Claude, GPT, Gemini, DeepSeek, or local models plug in, and users
can bring their own keys.
```

### 8d. "Optional: attach a coding agent session you're particularly proud of."

**KEEP the habit, upgrade the pick.** YC now reads these as evidence a founder can build (Tan/Taggar quotes in §4). Choose a transcript that shows judgment, not just prompting: one where you scope a feature, catch an agent's wrong turn, and drive it to a merged PR. _[Pick the session and export it fresh before submit.]_

### 8e. "Are people using your product?"

**Previous:** "No."

**New — two variants; submit whichever is TRUE on July 26:**

Variant A (beta users exist):

```
Yes, since [date]: [N] beta users from [M] discovery calls. Too early for
patterns; the first thing they reach for is asking "why did we decide X" and
getting the receipt back. I use it daily myself to run Cadence's own roadmap.
```

Variant B (not yet):

```
The first beta users are getting access now, from the [N] discovery
conversations I've run with PMs and founders this month. Until they're in,
the daily user is me: Cadence runs its own roadmap, and its agents built
most of it.
```

### 8f. "When will you have a version people can use?"

**Previous:** "roughly 6 weeks… full platform over about three months."

**New:**

```
It's usable now: the link and demo login above. Self-serve signup is already
on; the public launch is weeks away, not months.
```

### 8g. "Do you have revenue?"

`No.` — **KEEP.**

### 8h. "If you are applying with the same idea as a previous batch, did anything change?"

**Previous:** "First time applying with Cadence."

**New — this is now the single most valuable field on the form.** YC's FAQ: progress since the last application is "a strong signal."

```
Same idea, one batch later. I submitted this application late in the previous
cycle and it rolled forward. Since then the product went from an early spine to
working end to end: the autonomous engine is live ([133] missions, [129] agent
runs), agents open real pull requests behind human gates, every decision now
gets an outcome check that re-ranks what to build next, an outside AI code
audit of the build register held up, beta is opening, and the public launch
is weeks away. Roughly ten times the product in five weeks. That pace is the
pitch.
```

### 8i. Incubator / accelerator

**Previous:** "No. Cadence has not been part of any program. This would be the first." — **KEEP.**

## 9. Idea

### 9a. "Why did you pick this idea? Do you have domain expertise? How do you know people need what you're making?"

**Previous:** dashboard origin + Perplexity/Comet + RFS mention + decade in product. Good bones; re-balanced so the decade comes first and YC's RFS is confirmation, not origin:

```
I've spent close to a decade in product: communication systems at ISRO, then
product roles at Infineon and Bosch, and most recently the AI platform that
200+ financial institutions use to build their own AI products. In every one of
those jobs the real work was being the glue across a dozen tools and a dozen
stakeholders, and re-answering "why did we decide this" from memory.

Cadence started as a dashboard I built for myself to stop drowning in that. It
kept growing. Then I noticed YC kept describing the same gap from the outside:
an RFS essay asked for a "Cursor for product managers," and the current RFS
asks for a "Company Brain" and an "AI operating system for companies." That
told me the itch I was scratching wasn't just mine.

How I know people need it: I've spent the last month talking to PMs and
founders and reading how they hand-roll this today: [N] discovery
conversations so far. The most upvoted thread I found in a PM community was
literally someone asking how to answer "why did we decide X." And I need it
myself, every single day.
```

_[The `[N]` is the one number that most upgrades this application. See checklist item 1.]_

### 9b. "Who are your competitors? What do you understand about your business that they don't?"

**Previous:** honest stitched-stack answer + frontier-labs paragraph. **New — keeps that shape, now names the real neighbors (including YC's own portfolio) and states the structural difference in one breath:**

```
Nobody runs the whole loop today; my real competitor is the stitched stack:
Linear or Jira for tracking, Notion for docs, ChatPRD for specs (100k+ PMs,
genuinely impressive), a coding agent for the build, and the PM as the glue.
The space is moving toward me: Linear now lets teams hand issues to Cursor and
Devin, and YC has funded planning layers for coding agents from the engineering
side (Scott AI, Fission). All of them make doing the work faster.

What I understand that they don't: none of them records whether the call was
right. Decisions, the evidence behind them, what shipped, and what happened
after live in five different tools, so nothing learns. That connected record is
the product. It can't be bolted onto a tracker, because it needs the whole loop
under one roof, and it can't be copied quickly, because it only accumulates
with time.

I also deliberately don't build the code generator. Cursor and Devin are in a
capital knife fight there, and the models keep absorbing that layer. Cadence
decides what's worth building, dispatches to whichever generator wins, and
keeps the receipts. And if a frontier lab ships a "PM agent," it ships
capability; the accountability layer across your tools is the part they
structurally won't own.
```

### 9c. "How do or will you make money? How much could you make?"

**Previous:** per-seat plus usage; land solo founders, expand to enterprise; pricing unvalidated.

**New — matches how the product actually charges today (credits), keeps the honesty:**

```
Free tier runs the full loop on a small credit budget; paid plans are a
workspace subscription plus usage credits for agent runs, so revenue grows
with how much work the agents do, not with headcount. Land: solo founders and
PMs on small teams, who feel this hardest and can start without procurement.
Expand: teams and enterprises, where the audit trail is the thing they
actually budget for. The budget already exists. Today it's split across
Linear, Notion, a spec tool, a coding agent, and status meetings.

How big: every company that builds software is becoming a product org run
this way: a few accountable people directing fleets. Cadence is the
operating system that org runs on, and the system of record for its
decisions. Systems of record are the biggest outcomes in software. Pricing
gets its first real test in beta this month.
```

### 9d. "If you had any other ideas you considered applying with, please list them."

**Previous:** "This is the one. The closest was the earlier dashboard version that became Cadence. I am building what I kept wishing existed." — **KEEP.**

## 10. Equity

| Field                 | Previous                                                       | New                                                    |
| --------------------- | -------------------------------------------------------------- | ------------------------------------------------------ |
| Legal entity formed   | no                                                             | **KEEP** _(if you incorporate before July 27, update)_ |
| Planned ownership     | Rohit 100%, meaningful equity for right cofounder, option pool | **KEEP**                                               |
| Investment taken      | no                                                             | **KEEP**                                               |
| Currently fundraising | no                                                             | **KEEP**                                               |

## 11. Curious

### 11a. "What convinced you to apply to Y Combinator? Did someone encourage you to apply?"

**Previous:** "Followed YC for a long time… I have friends in a current batch and have watched their journey closely. I have not been to a YC event yet."

**New — the friends get named (verifiable beats vague):**

```
Friends of mine just went through YC: Asendia AI. Badis and I overlapped at
TUM and later worked on the same team at the same company, and I watched their
batch up close, from application to Demo Day. That settled it. Add that YC's
own RFS keeps describing the company I'm building, and this felt like the
right moment, not just a good idea. I haven't been to a YC event yet.
```

_[Checklist: message Badis BEFORE submitting — heads-up + ask about an alumni recommendation. If anything feels lukewarm, revert to the previous unnamed line.]_

### 11b. "How did you hear about Y Combinator?"

**Previous:** "I have been following Y Combinator on socials for a very long time. That is how." — **KEEP.**

## 12. Batch Preference

**Previous:** current. **New:** `Fall 2026` (the current open batch — confirm the exact dropdown label).

---

## The pre-submit checklist (now → July 27, 8pm PT)

**This week (July 10–14):**

1. **Start discovery calls — the one thing that most changes this application's odds.** Target 20–30 real conversations from the prospect list before July 25 (Lago got in pre-product on "100+ growth leaders interviewed"). Log each: name, role, the quote, would-they-use. The true count fills `[N]` in 9a and 8e. Never inflate; YC verifies.
2. Message Badis (heads-up + alumni recommendation ask).
3. Decide the employment one-liner (8b bracket) and rehearse it.
4. [FILL] the IIM Bangalore venture line in 3c.

**Launch week (July 15–21):** 5. Ship the beta per the campaign plan; first outside users in. 6. Re-record the founder video (≤1:00, bullet card, one take) — [`video-scripts.md`](./video-scripts.md) Part 1. 7. Re-record the demo video (~2:15, script Part 2). Re-seed the demo workspace first; verify demo-account credit balance.

**Submit window (July 22–26 — do NOT wait for the 27th):** 8. Refresh every `[bracketed]` number: commits, migrations, missions, agent runs, register counts, users, dates. 9. Choose 8e Variant A or B by what is literally true that day. 10. Log in with the demo credentials in an incognito window; click the first three surfaces. 11. Read every answer ALOUD once (the AI-cadence and jargon check); red-pen pass (PG: cross out every word you don't need). Then two final scans: **the retell test** — have one friend read the application and retell it back as a story (who you are, what exists today, who wants it); if they can't, rewrite the unclear field (Dalton's stated reading method). And **the neediness scan** — nothing anywhere may read as "I need YC to make it" (the seventh deadly sin); the posture is "this is happening; YC makes it faster." 12. Verify links: product URL, LinkedIn (current), X, GitHub. Personal-website field → product URL. 13. Attach the chosen Claude Code session transcript (8d). 14. Submit by July 26 evening IST at the latest. Earlier is genuinely better — YC: "applying early is strongly encouraged."

## Banned words (never in any answer)

revolutionize · disrupt · transform · cutting-edge · bleeding-edge · leverage · seamless · empower · unlock · game-changing · AI-powered platform · world-class · massive opportunity · delve · landscape · testament · realm · embark · navigate · "not just X but Y" · mission-statement openers · any adjective doing a number's job

## One honest note on odds

Roughly 7% of applications get interviews and under 2% get in; nobody can make that "100%." What this rewrite does is remove every self-inflicted rejection reason the record shows (vagueness, buzzwords, walls of text, stale videos, unanswered fields, hidden weaknesses) and stack every controllable signal YC itself says it rewards: a working product they can click, visible slope since the last application, an earned insight in plain words, named verifiable specifics, and real user contact by the deadline. The rest is the interview — [`interview-prep.md`](./interview-prep.md).
