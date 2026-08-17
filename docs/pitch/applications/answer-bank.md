# The answer bank — every accelerator application, one source

> _Created 2026-07-31._
> **Last verified against: `docs/pitch/applications/hub71/APPLICATION-FINAL.md` (2026-08-17).**
> _`bun run pitch:check` fails if a newer filing exists than that stamp. Bump it only after back-porting._

> **This file owns the facts. It does NOT own the voice.** Pull numbers, bios and dates from here. **Pull the register and the shape of an answer from the most recent filed application**, which is always newer than this file.

## ⚠️ Source precedence. Read this before pulling a single block.

**This file went stale once and misled a draft.** On 2026-08-17 the Hub71 draft was written from the blocks below and had to be thrown away: it used "you" in product sentences (retired 2026-08-13), it led with the forecast (retired 2026-08-11), and its competitor answer was a generic paragraph the filed version had already beaten. **The founder caught it, not a checker.** That is what this precedence table and `pitch:check` exist to prevent.

| Rank | Source | Owns |
| --- | --- | --- |
| **1** | **The most recent `APPLICATION-FINAL.md` or `FILL-SHEET-*.md`** | **The register, the structure, and the current positioning order.** Newest filing wins outright |
| **2** | [`baseline.yml`](./baseline.yml) | Live numbers with their derive commands, the standing rules, banned vocabulary |
| **3** | [`how-to-draft-the-next-one.md`](./how-to-draft-the-next-one.md) | The craft, and every founder correction |
| **4** | [`positioning-doctrine.md`](./positioning-doctrine.md) | The seven rules and the per-programme axis |
| **5** | **this file** | Facts, bios, dates, and reusable blocks **that have been back-ported from rank 1** |

**Where this file and a filed application disagree, the filed application wins and this file is stale. Fix it in the same sitting.**

## The process that keeps this file current

**The rule: a filing is not finished until what it taught is back in this file.** Applications are drafted every week and each one improves the material. Without a back-port step, every improvement dies inside one programme folder and the next drafter starts from older prose.

**After every submission, in the same session, before the folder is closed:**

1. **Back-port any answer that got better** into the matching section here, replacing the older block rather than adding a second one.
2. **Back-port any new founder correction** into `how-to-draft-the-next-one.md` Part 1.
3. **Re-derive the numbers** in §0 and in `baseline.yml`.
4. **Add the filing** to `baseline.yml` under `filed:`.
5. **Bump the `Last verified against` stamp** at the top of this file to the application just filed.
6. **Run `bun run pitch:check`.** It fails if any of the above was skipped.

**If a block here is superseded, delete it. Do not leave two versions.** Two live versions of an answer is how the 2026-08-17 failure happened.

---

## The register, and the five rules that produce it

> **Set by the founder 2026-08-13, each from a defect he caught. Back-ported from [`../yc/APPLICATION-FINAL.md`](../yc/APPLICATION-FINAL.md) §A on 2026-08-17.** These govern the voice of every block below. **Write it the way you would say it out loud to a partner across a table.**

| # | Rule |
| --- | --- |
| **1** | **Write the product from the team's side, never the founder's, and never use "you" in a product sentence**, because a reviewer reads it as themselves. Name the team. `I` survives only where the question is about him |
| **2** | **No word that exists only to fill space.** No runtimes, no file sizes, no invented vocabulary. And never make the plan sound small |
| **3** | **Describe the product by what a team feeds it and gets back, never by the plumbing.** Naming four integrations implies the set stops there. Under-describing is as much a defect as overclaiming, and far harder to see, because a narrow sentence still reads as true |
| **4** | **Never quantify the human gate on an autonomy story.** The gate is a feature as a principle and a liability as a count. A number is not automatically stronger than a sentence |
| **5** | **Show the agent at every step, and never write the product as a form.** Naming only the build step makes every other step read as manual |

**A sixth sits above all of them: if a claim is heavy, ask whether it is true today before polishing it.**

### ⚠️ The positioning order changed on 2026-08-11 and the old order is still in older blocks

**The application no longer LEADS with the forecast.** It leads with agents running the product work, and the forecast is the thing that makes that record uniquely useful, arriving third.

**Why, and it is the sharpest reason in the corpus:** corporate prediction markets at Google beat expert forecasts by up to a 25 percent reduction in mean squared error **and died anyway**, because the transparency ran counter to the interests of the people who could have kept them. **A pitch that opens with "we record what you predicted so it can be checked later" is selling accountability to the person who would be held accountable.** Source: `../../research/market-validation-2026-08.md` §8.5.

**Door, then body, then brain still holds.** The forecast is a mechanism inside the brain, not the door.

## The five laws (carried over from the YC application, they still govern)

1. **True on the day you hit submit, with zero outside users.** Plans appear as dated plans. Programs verify numbers.
2. **The honesty dial.** Candor goes where the form asks (users, revenue, stage), stated as fact plus what happens next. Never as apology, never volunteered in fields that do not ask. Exactly one vulnerability beat per application.
3. **Unconditional commitment.** No "if accepted, I will…" anywhere. The company is happening full-time regardless. The program changes the speed and the zip code, never the decision.
4. **Plain words.** No marketing-speak, no AI cadence, short sentences, exact numbers however small. **No em dashes in anything pasted into a form.**
5. **Lead with the delta, land the scope.** First sentence carries the whole answer. Numbers argue.

**Customer-evidence rule (binding).** Zero first-party discovery interviews have happened. Never claim interviews, discovery-call counts, or "we spoke to N customers." Cite named-company hand-rollers instead (PMs at OpenAI and DoorDash building their own rigs out of Claude Code plus MCP plus memory files; one describing 1,500 hours on her setup). Dogfooding is first-party evidence and is fair game.

---

## 0. Live numbers — RE-PULL BEFORE EVERY SUBMIT

| Figure | Value | How to re-pull |
| --- | --- | --- |
| Commits | **5,328** _(2026-08-17)_ · outward form **5,300+** | `git rev-list --count origin/main` ← **origin/main, not HEAD.** HEAD counts whichever lane branch you are on and drifts from the real total |
| Migrations | **545** _(2026-08-17)_ | `ls supabase/migrations/*.sql \| wc -l` |
| Build duration | **eleven weeks** _(first commit 2026-06-02, derived from git)_ | `git log --reverse --format='%ad' --date=short \| sed -n 2p` then count to today. **Twelve weeks from 2026-08-25.** |
| ~~Feature register~~ | **DO NOT USE** | The register has not been maintained since `2026-08-04`, and `scripts/dashboard-tally.sh` **does not exist in the repo**. Volume claims are dropped outward; the demo login is the evidence. |
| ~~Homepage counters~~ | **DO NOT USE IN AN APPLICATION** | They render live on supaprod.ai and they include seeded content. `baseline.yml` `never_claim` bans any product-usage number, because every one that ever existed was seed data. Quoting one is the exact failure that forced the YC rebuild. |
| External paying users | **0** | fact |
| Revenue | **$0** | fact |

> ### 🔢 Re-derive every number before it goes into an application. These aged 14% in ten days.
>
> On 2026-07-31 this card said **4,264 commits / 410 migrations**. On 2026-08-10 it was **4,878 / 508**, and on 2026-08-13 it is **5,131 / 532** — the commit count moved **4,872 → 4,876 → 4,878 in a single evening** as three lanes pushed. **A number in this card is a snapshot, never a fact.** The YC application shipped a 20% understatement of our own velocity because someone trusted a card instead of the command.
>
> ### ✅ Build duration is SETTLED, 2026-08-13. It was never contested; the claim that git could not answer it was wrong.
>
> This block previously read *"the history was rewritten during the orphan-main recovery, so every commit now carries a 2026-08-10 date and the true start is not derivable,"* and it routed the question to the founder as something only he could settle. **Both halves are false, and one command shows it.** Author dates and committer dates are intact and identical, and they distribute the way real work distributes:
>
> ```bash
> git log --format='%ad' --date=format:'%Y-%m' | sort | uniq -c   # 2490 in 06, 1810 in 07, 831 in 08
> git log --reverse --format='%ad %cd' --date=short | sed -n 2p    # 2026-06-02 2026-06-02
> ```
>
> **First real commit is `2026-06-02`**, giving **ten weeks** as of 2026-08-13. The single commit dated `2025-01-01` is template scaffold and is excluded, which is the only reason to take the second line rather than the first.
>
> **The generalisable error, worth more than the correction:** the rewrite changed **committer** dates on some ranges, and someone checked `%cd`, found the flattening, and concluded the start date was unrecoverable. **`%ad` was never touched and answers the question directly.** A rewrite that damages one date field is not a rewrite that damages both, and "not derivable" is a strong claim that needs the second command before anyone writes it down.
>
> _Counters render live on the site, so a reviewer can check them. Never quote the raw totals that include seeded content. **The duration ages**: restate it truthfully on every later submit rather than copying this line._

---

## 1. Identity, at every length

**Company:** Supaprod · **URL:** https://supaprod.ai · **Brief/deck:** https://supaprod.ai/brief

### 10 words
Agents that know what to build, ship it, and learn.

> ⚠️ **The old version closed on "and remember" and is retired.** "Remembers" is a banned verb of the brain on every surface, because it claims less than the product delivers: the third layer does not hold a record, it grades outcomes and guides the next call. **Never close a one-liner on "remember".**

### The one-liner rule. **Founder ruling 2026-08-17, and it governs every short field.**

> _"Say we have three layers: telling what to build, doing the entire product lifecycle built by agents, and the brain which learns and guides your next call. That's how it needs to be. As of now it's just one layer we are speaking about."_

**A one-liner that names one layer sells one third of the product.** Both of these were promoted on 2026-08-17 and both were wrong, for the same reason:

| Rejected | Why |
| --- | --- |
| `Product decisions with a forecast you cannot edit` | **Layer 03 only.** A mechanism with no product around it. It also opens on the forecast, which the 2026-08-11 positioning change moved out of the lead |
| `Agents run product work. You keep the judgment.` | **Layer 02 only.** Says who does the work and who is accountable, and never says the product decides what to build or learns from the result |

**The test, and it is not negotiable: every one-liner carries all three layers, in order.**

| | Layer | Must appear as |
| --- | --- | --- |
| **01** | the director | tells / knows / decides **what to build** |
| **02** | the operating system | **builds it, ships it** (agents do it) |
| **03** | the brain | **learns and guides the next call**, never "stores" and never "remembers" |

> **On the founder's phrase "company brain".** The concept is exactly right and it is the third layer. **The words are banned in outward copy** (`CLAUDE.md`, and it is YC's phrase, not our brand identity). Write the mechanism instead: *learns and guides the next call*. "Shared brain" is the kept alternative if a noun is needed.

### Under 50 characters — every line below passes the three-layer test

| Line | Chars | Notes |
| --- | --- | --- |
| **`Agents that know what to build, ship it, warn you`** | **49** | ⭐ **The default.** All three layers, names the actor, closes on the brain guiding rather than storing |
| `AI that knows what to build, ships it, warns you` | 48 | Same line if the reader prefers "AI" to "Agents" |
| `Decides what to build, builds it, guides the next` | 49 | Blunter, and "guides" is the sharpest statement of layer 03 |
| `Agents that know what to build, ship it, guide you` | 50 | Only where the cap is inclusive of 50. Verify the field accepts it |
| `Decides what to build, builds it, learns.` | 41 | When the cap is tighter than 50. Weakest of the set: "learns" does not say it guides |

### Under 100 characters

| Line | Chars | Notes |
| --- | --- | --- |
| **`Tells product teams what to build, builds it, then grades the call against what shipped.`** | **88** | ⭐ **Filed on Campus Founders 2026-08-16.** The strongest three-layer line in the corpus. `baseline.yml` carries it as `under_100_chars` |
| `Agents that decide what to build, ship it, and guide the next call.` | 67 | Closes on guiding rather than grading, if the field wants the forward-looking half |

> ### 🛑 `Cursor for PMs` is RETIRED on every surface. Do not reach for it.
>
> **All three readers killed it, and `baseline.yml` records the ruling.** It borrows the do-the-work-faster frame that the competitors answer then spends a whole paragraph disowning, so it argues against itself inside one application. It is still live on the filed YC form because that field is locked, which is the only reason it appears in that file.
>
> **The second reason, for builder audiences:** at a house of young engineers "product manager" is not an aspirational identity, and for part of that room it names the person who slows them down. It spends 50 characters on the one word they may push back on.
>
> **Never** use "agentic" or "AI-native" in a 50-character field. The vocabulary rules ban "agentic" from any first line, and builder audiences read category words as evasion.
>
> The full canon tagline, `Agents that know what to build, ship it, and remember.`, is **54 characters** and does not fit a 50 cap.
>
> ⚠️ **Always name the actor.** A standalone form field has no sentence around it, so `Knows what to build, ships it, warns you` reads as a fragment and the reader asks *what* knows. Start with "Agents" or "AI".
>
> ⚠️ **Never close on "remember".** It describes where data sits. The third layer **guides**: it warns you before you repeat what did not work. Close on "warn you", "learn", or "warns on repeats".

### One sentence
```
Supaprod is where product decisions live when agents do the work: it tells you
what to build from your signals, your market and your own decision history,
then builds it, ships it, checks what happened, and learns from it, so next
time it guides the call instead of waiting to be asked.
```

### Two sentences (the layman telling, use when a human asks "so what is it?")
```
Supaprod tells you what to build and gets it built: AI agents read everything
you already know, your user feedback, product data, competitors and market,
surface what is worth building, and once you approve, they build and ship it.
And it remembers: every decision is recorded with its evidence and outcome, so
the next time a similar call comes up, it shows you how you decided last time
and whether it worked.
```

### One paragraph (~100 words)
```
Code got cheap. Agents build whatever you point them at, fast, for almost
nothing. The scarce thing left is knowing what to build and whether the call
was right. Supaprod is the operating system a product team runs on when agents
do the work: it reads your user feedback, product data, competitors and market
and tells you what is worth building, argues against the weak bets before you
commit, writes the spec, builds it, ships it behind gates you control, then
checks what actually happened. Every decision is recorded with its evidence and
graded against the outcome, so your judgment compounds in the system instead of
living in someone's head.
```

### The full telling (~200 words, for "what does your company do")

> **⭐ THE CANONICAL BLOCK. Back-ported verbatim from the filed [`../yc/APPLICATION-FINAL.md`](../yc/APPLICATION-FINAL.md) §A 7f on 2026-08-17.** The version that stood here before was retired: it used "you" eleven times in product sentences, it led with the Cursor anchor, and it claimed compounding in the present tense. **Start every long product answer from this one.**

```
Supaprod runs product work when agents do the building.

A team points it at everything they already have. User feedback, product
analytics, sales and support conversations, market and competitor movement,
and the direction they have already decided they want to go.

From there agents run the work. They read all of it and cluster it into what is
worth looking at. A critic argues against the weak ideas before anyone commits.
Agents write the spec with the evidence attached, plan and design the work,
build it, open the pull requests, ship it and write the release notes. When the
result lands they grade what shipped against what the spec promised, and that
verdict feeds the ranking of what to build next.

A person approves and merges, and that is the only place a human is required.
It is the smallest gate that still makes the rest safe to let run.

What makes it a company is what gets kept. Every agent action is recorded, every
decision carries the evidence behind it, and every gate records who cleared it.
When agents do the work, being able to answer what was decided and on what stops
being paperwork. It is the thing that lets a team let them run at all.

One piece of it agents cannot produce, because it is not an artifact and they
cannot know it: what a team believes is going to happen. So the belief goes down
at the moment of the call. What they expect, how they will know, and by when. It
locks. The system carries it from there and brings it back the day it falls due,
settled against what actually shipped.

Building got cheap. What a company runs on now is the calls it makes and whether
they were right.
```

### The three layers (name and order them, always door then body then brain)
- **01 The director.** Tells you what to build.
- **02 The operating system.** Runs the whole lifecycle.
- **03 The brain.** Remembers, and it guides.

> The brain is never storage. Banned framing: "where the record lives." It compounds; next time it tells you what is right, and warns before you repeat what was wrong.

---

## 2. Founder

### The record, verbatim — every education and work-history field, for any form

**Read off the live YC founder profile on 2026-08-13 and confirmed by the founder.** Every accelerator, incubator and investor form asks for some subset of this. **Copy from here rather than retyping from memory**, and if a form disagrees with this table, this table is what gets fixed.

**Education** — *the canon rules "education TUM only" on non-YC surfaces ([`../repositioning-2026-07-22.md`](../repositioning-2026-07-22.md)); list both wherever a form has room, because an empty education field reads worse than a second entry.*

| School | Degree | Dates |
| --- | --- | --- |
| **Technical University of Munich** | Master degree, Business Administration And Management, General | Oct 2019 - Nov 2022 |
| **Visvesvaraya Technological University** | BE, Mechatronics Engineering | Jan 2012 - Jan 2016 |

**Work history**, newest first. The one-line descriptions are the paste-ready versions from [`../yc/founder-profile-answers.md`](../yc/founder-profile-answers.md), which owns the reasoning behind each.

| Company | Title | Dates |
| --- | --- | --- |
| **Intellect Design Arena Ltd** | Senior AI Product Manager, Assistant Vice President | Jun 2023 - Sep 2026 |
| **Indian Institute of Management Bangalore** | Founder, Entrepreneurial Venture | Jan 2022 - Dec 2023 |
| **Technical University of Munich, TUM School of Management** | MBA, Business Administration and Management | Oct 2019 - Nov 2022 |
| **Infineon Technologies** | Product Manager | May 2021 - Oct 2022 |
| **Bosch Software and Digital Solutions** | Product Analyst | Apr 2021 - Oct 2021 |
| **ISRO - Indian Space Research Organisation** | Associate Product Manager | May 2017 - Sep 2019 |
| **ISRO - Indian Space Research Organisation** | Communications System Engineer - Space Objects | Sep 2016 - Apr 2017 |

> **The MBA appears in both sections on purpose, and the dates must match to the month.** Education carries the degree, Work History carries the nineteen-month gap it closes between ISRO ending Sep 2019 and Bosch starting Apr 2021. **If those two entries ever disagree by a single month, that is the one inconsistency a reviewer can catch without leaving the page.**
>
> **The overlaps are real, not errors.** Bosch and Infineon both run under the MBA; the IIM Bangalore venture runs under Infineon and Intellect. The MBA work-history description explains all of them in one line (*"a full-time job and a degree at the same time"*), which is why that entry is never the one cut for space.
>
> **Bosch stays even though it is six months and a junior title**, because it is on the LinkedIn every application links to. An omission a reviewer can spot reads far worse than a weak entry.

### One line
```
Rohit Gajaraj, solo founder and CEO. A decade as the human glue between product
and engineering, in rooms where being wrong is expensive; I removed the need for
the glue and built the replacement alone.
```

### Short bio (~60 words)
```
Rohit Gajaraj is the solo founder of Supaprod. He spent close to a decade in
product: satellite communication systems at ISRO, India's national space agency,
then semiconductors at Infineon in Munich, and most recently senior AI product
manager at Intellect, a BFSI technology OEM, on the AI platform that 200+
financial institutions across 70+ countries use to build their own AI products.
MBA from TUM School of Management; BE in Mechatronics.
```

### Long bio (~130 words)
```
Rohit Gajaraj is the solo founder and CEO of Supaprod. At 21 he was building
satellite communication systems at ISRO, India's national space agency, for its
Moon and Mars missions, where the hardware launches once and there is no patch
release. He then moved into product: semiconductors at Infineon in Munich, and
most recently senior AI product manager at Intellect, a BFSI technology OEM,
where he led product on the AI platform that 200+ financial institutions across
70+ countries use to build their own AI products.

In every one of those jobs the real work was the same: carry context across a
dozen tools, and answer "why did we decide this" from memory, months later,
with the evidence long buried. He built Supaprod to remove that job. He holds an
MBA from TUM School of Management and a BE in Mechatronics Engineering, and
earlier founded one of the first attempts to bring bubble tea to the Indian
market, incubated at IIM Bangalore's NSRCEL and recognized under Startup India.
```

### The most impressive thing built or achieved (outside this startup)
```
At 21 I was building satellite communication systems at ISRO, India's space
agency, for its Moon and Mars missions, where the hardware launches once and
there is no patch release and no second attempt. The systems I worked on flew.
```

### Things built before
```
Most of what I have built shipped inside companies, where the product goes live
but the repository is not mine to show. The largest is the AI platform at
Intellect that 200+ financial institutions across 70+ countries use to build
their own AI products. I own the product, not the code, and it runs in regulated
banking production. Before it, semiconductors at Infineon in Munich, and before
that the satellite communication systems I started out on at India's national
space agency.

The one I took end to end myself was outside software: one of the first attempts
to bring bubble tea to the Indian market, from recipe formulation and unit
economics through user testing and supply chain.

Before the version of Supaprod that stands today, I built and threw away four
complete working versions of it. Those repositories are private because they
carry the current architecture, and I am glad to walk any of them with you.
```

### Hacking a non-computer system
```
I wanted to move from hardware and communication engineering at ISRO into
product, but I didn't have the title or the obvious path. So instead of applying
and waiting, I started doing the work before anyone gave me permission, and used
that proof to talk my way into the role. I've repeated the same move every time
I switched industries since: build the evidence first, then ask.
```

### Awards, education, recognition
```
MBA from TUM School of Management, where my thesis explored the creator and
ownership economy in Web3. BE in Mechatronics Engineering. An earlier venture of
mine was incubated at IIM Bangalore's NSRCEL and recognized under the Government
of India's Startup India initiative.
```

### Why solo, and are you looking for a cofounder
```
Solo, and moving fast. Open to a cofounder who shares the vision and energy and
adds a fresh perspective I do not have. For now, solo, and it is the reason the
product exists: ten weeks of one person directing a fleet of agents produced
4,878 commits and a working end-to-end system. The thesis of the company is that
this is now possible, and I am the proof of it.
```

### The "can you actually build it" defense
```
I direct all of it and agents write it. I read and review every line, everything
goes through typecheck, build and a review pass before merge, and no non-founder
has touched this codebase. A separate reviewer, independent of the agents that
build, audits it for security and verifies the work against my build register.
```

---

## 3. The problem and the insight

### The problem (short)
```
Engineers got agents and shipping became ten times cheaper. Product decisions
became the bottleneck, and the product side got chatbots that draft and wait.
Meanwhile nobody can answer "why did we decide this" without excavating a Slack
thread from four months ago.
```

### The earned insight (the one that took a decade to get)
```
Code has a compiler. Product judgment does not. That is why codegen commoditized
in eighteen months and deciding what to build did not, and it is why the layer
that records decisions and grades them against outcomes is the one that
compounds instead of collapsing. Feedback on a product bet arrives in weeks, not
seconds. A layer with no fast oracle cannot be absorbed by a model release.
```

### How I know people need it
```
I lived it for close to a decade, in three industries, and the job underneath
was identical every time: be the glue across a dozen tools, and re-answer why we
decided something from memory.

I am not alone in it. Product people at companies like OpenAI and DoorDash are
now hand-building their own versions of this out of Claude Code, MCP connectors
and memory files; one described spending 1,500 hours on her setup. People do not
do that for a mild annoyance.

And I remain the most demanding user I have. I run my company on it every day.
```

---

## 4. Progress and traction (the honest version)

### How far along (long form)
```
The journey: a decade of living this problem as a PM, a month of nights and
weekends on a prototype, then ten weeks of building it for real, 5,000+ commits
and counting. In that time it went from an early spine to running end to end.
It is almost there, not finished; I am shaping the last stretch with users, not
assumptions.

The strongest proof of progress: I am user zero. Supaprod's roadmap runs inside
Supaprod, its agents write real code and open real pull requests behind a merge
gate no agent can cross, and every call along the way is on the record with its
evidence.

Where I stand today: the beta is live, and building and listening run in
parallel. Public launch in September 2026.
```

### How far along (short form, under 50 words)
```
Working end to end and live at supaprod.ai. Ten weeks of building, 5,000+
commits, solo. In private beta by invite, public launch mid-September 2026.
I run my own company on it daily.
```

### Where the product stands — USE THIS, and read the ruling below first

> ⚠️ **Founder ruling 2026-08-13. The two blocks that used to sit here opened on *"zero paying users"* and *"no paying users and no revenue yet"*. Both are RETIRED.** Full reasoning: [`how-to-draft-the-next-one.md`](./how-to-draft-the-next-one.md) rule 0. **Never volunteer a deficit** — no form asks for one, it read as candour to us and as weakness to a reader, and the Berkeley SkyDeck application is the last one that will carry it.

```
Supaprod is in private beta, invite-only. Signup closed on 2026-08-07 and entry
is by invite code. Public launch is mid-September 2026.

The product runs end to end today and a reviewer can open a login and walk the
whole loop: agents read the signals, argue down the weak bets, come back with a
call and its evidence, write the spec, build it, open the pull request, and a
person merges.

I am user zero and I mean it literally. Supaprod's own roadmap runs inside
Supaprod, so every call I have made building it is on the record with the
evidence behind it.
```

> ### The line that does not move, and it protects the founder
>
> **The ruling changes what we volunteer. It never changes what we assert.**
>
> - **Never state or imply a user count, revenue figure, paying customer or discovery interview that does not exist.** Programmes verify; YC's form says stated numbers may be checked.
> - **If a form asks for a number, answer it truthfully.** The ruling governs prose, not numeric fields. A **required** field gets the true figure; an **optional** one stays blank.
> - **Never answer *"Are people using your product?"* with yes.**

### What is genuinely proven, and what is not (keep this straight in interviews)

**Proven and demoable:**
- The autonomous loop is real: a cron engine advances product missions every minute through sense, decide, define, build, ship, learn.
- Agents open real pull requests behind a merge gate no agent can cross.
- Earned autonomy: agents graduate permissions from their track record, with non-overridable floors on merge, revert and delegate.
- One-key rollback on anything an agent produced.
- Recorded outcomes re-rank the next bets.
- The feature register survived an independent code audit.

**Not yet proven — never claim these, and never volunteer them either:**
- External usage of any kind. *(State it only if a form asks directly. Do not raise it.)*
- Revenue or pricing validation.
- "Supaprod builds Supaprod entirely on its own." The engine's real PRs live on a test repo; the honest claim is: I am user zero, the roadmap runs inside the product, agents write real code and open real PRs behind a human merge gate.

---

## 5. Market

### The sizing ladder (this supersedes every older number, never quote $8B or $18B)
```
TAM: $300B+ per year. This is the product-management work budget, not a
software line item: roughly 2.6M product managers at about $115K loaded cost.
The work is paid for today as headcount.

SAM: $2B growing to $12B per year, from launch pricing to value pricing, across
two motions. Transform: 650K existing product teams. Create: 500K new
agent-native organizations by 2030.

SOM: about $47M ARR, the agent-native tenth at launch pricing.
```

### The tailwind
```
Building got commoditized faster than anyone modeled. Devin went from $37M to
$492M ARR in twelve months; Cursor is at $2B. As that happens, the ratio of
product people to engineers inverts and one person ends up directing a fleet.
Coinbase already runs one-person teams managing fleets of agents. The scarce
resource stops being the building and becomes deciding what to build, and being
able to prove the call was right.
```

---

## 6. Competition

> **⭐ THE CANONICAL BLOCK. Back-ported verbatim from the filed [`../yc/APPLICATION-FINAL.md`](../yc/APPLICATION-FINAL.md) §A 9b on 2026-08-17.** The retired version opened on the stitched stack and buried the folder in paragraph four. **The folder goes first: it is the answer a reviewer has not heard before, and leading with it proves we have done the work.** The stitched stack is still true and still used where a form asks specifically about tool sprawl.

```
The one I actually fear is not a company. It is a folder.

Teams hand-roll this in markdown and scripts, and it works. Every do-it-yourself
success I found is one person in one context. Every failure is a second person or
a fleet of agents. That transition is where we sell, and it is the honest read:
on engineering forums the reflex is "just commit your agent files".

The named ones are real and getting closer. Notion shipped Ship OS free in July.
Atlassian launched Product Collection in May, positioned around better decisions.
Linear hands issues to coding agents. ChatPRD drafts specs for over 100,000 PMs.
All of them make doing the work faster.

None of them records whether the call was right, and none catches what a team
expected before it found out.

The other objection I get is that simpler tools are easier for agents to drive,
so why add a layer. That is true and it is not enough. An agent can write into a
Notion page or a GitHub issue. It cannot write a decision with its evidence, its
author, a slot for the verdict and a human gate into either. Simple tools are
agent-writable. They are not agent-governable.

I deliberately do not build the code generator. That fight is expensive and the
models keep absorbing it.
```

**Never write "we have no competitors".** It is the most common red flag in that exact question, it is not true, and it claims without a mechanism.

---

## 7. The moat, in one breath

```
The decision-and-outcome record. Four reasons it holds:

No fast oracle. Product judgment cannot be compile-tested, so it does not
commoditize the way code generation did.

The forecast cannot be backfilled. A competitor with every byte of your raw
data can reconstruct what happened, because causes survive in Slack, email and
call recordings. What no volume of data reconstructs is what your team believed
would happen, recorded before the outcome was known. A forecast leaves no trace
unless something captured it at the moment of the call. Time is an ingredient no
model release shortcuts.

The neutral seat. No frontier lab inside its own chat app, and no suite vendor
like Atlassian or Notion, can be the honest judge across its competitors' tools,
or publish its own miss record.

The engine is ours; the models are interchangeable parts. One runtime
chokepoint, so a better model is a same-day drop-in at zero engineering cost. We
do not race the models. We put them to work.
```

---

## 8. Business model

```
Free tier runs the full loop on a small credit budget. Paid plans are a
workspace subscription plus usage credits for agent runs, so revenue grows with
how much work the agents do rather than with headcount.

Land: solo founders and product managers on small teams, who feel this hardest
and can start without procurement. Expand: teams and enterprises, where the
audit trail is the thing they actually budget for. That budget already exists
today, split across a tracker, a docs tool, a spec tool, a coding agent, and
status meetings.

Pricing gets its first real test in the beta.
```

---

## 9. Risk (the one vulnerability beat, use once per application)

Pick exactly one of these per application. Never volunteer more.

**Option A, pricing:**
```
The honest open question is pricing. Charging for closed decision loops rather
than seats is the right shape for a product where agents do the work, but I have
not yet tested what a team will actually pay for one. That is what the beta is
for, and it is the number I most want to be wrong about early.
```

**Option B, distribution:**
```
The honest risk is distribution, not the product. I built the engine before
opening the doors, which was the right call for a solo founder and the wrong
call for learning fast. September is when that inverts.
```

---

## 10. Why now

```
Two curves crossed this year. Agents got good enough to do the work, and the
cost of building collapsed. That means every company is about to run on fleets
of agents, and someone has to build the layer where a human still answers for
the work. That layer gets decided in the next two years, not the next ten. The
window on this specific seat is one or two quarters before it is crowded.
```

---

## 11. Assets and links

| Asset | Value |
| --- | --- |
| Product | https://supaprod.ai |
| Company brief / deck (one page) | https://supaprod.ai/brief (also /investors) |
| **PDF to attach when a form asks for a deck** | **`docs/pitch/shareables/Supaprod-Brief.pdf`** — founder ruling 2026-08-16, see the note below |
| **Video to attach when a form asks for a product video** | **`docs/pitch/shareables/Supaprod-Product-Film.mp4`** — 97.6MB, under the common 100MB cap |
| Founder pitch video (team intro / founder video fields) | https://youtu.be/zBmtUtkTyBs (unlisted, 2:32) |
| Product film (public link) | https://youtu.be/x9WgGn0FyYU (2:23) |
| Founder email | founder@supaprod.ai |
| Investor email | investors@supaprod.ai |
| LinkedIn | https://linkedin.com/in/rohit-gajaraj |
| X | https://twitter.com/rohit_gajaraj |
| GitHub | https://github.com/RohitGajaraj |
| Demo video | 4:51 cut, wedge front-loaded (see `docs/pitch/yc/video-scripts.md`) |
| Founder video | 2:53 (needs a ≤1:00 re-cut for programs that cap it) |
| Investor deck | `docs/pitch/investor-deck/supaprod-pre-seed-investor-deck.html` (frozen v19) |

> ### 📎 The attachment rulings, 2026-08-16. **Do not re-litigate these on the next application.**
>
> **PDF: send `Supaprod-Brief.pdf`. Always.** Founder ruling: the 16-page `supaprod-pre-seed-deck-16pp.pdf` **renders badly** (slides 3, 6, 15 and 16 clip; slide 15 loses three lines) and a malformed artifact costs more than a thin one. A recommendation to send the 16pp deck was made and overruled, correctly.
>
> **Why `Supaprod-Brief.pdf` and not the old `Supaprod-Investor-Briefing.pdf`.** The filename was the smallest problem. The old one-pager's own content read **"Pre-Seed Briefing · Confidential"** with **`investors@supaprod.ai`** in the footer. To an accelerator reviewer that reads as being handed a fundraising document by mistake, and as being treated as a step toward a raise rather than as the programme itself. The variant changes three things: title → `Supaprod · Brief`, eyebrow → `Company Brief`, contact → `founder@supaprod.ai`. **The original is preserved and is still correct for real investor conversations.**
>
> **The name matches the canonical `supaprod.ai/brief` URL**, so the file, the link and the button inside it all carry one word.
>
> **No date in the eyebrow.** A first cut said "August 2026" and was corrected before render, per the shareables rule *"no dates, no counts, nothing that decays."*
>
> **Verify after any re-render:** 4 link annotations, zero occurrences of "investor" in the binary. The command is in [`../shareables/README.md`](../shareables/README.md).
>
> **Video: `Supaprod-Product-Film.mp4`, 97.6MB.** Copied byte-identical from `videos/supaprod-film/renders/supaprod-film-final-1080.mp4`. **Do not grab `video-v15.mp4` instead** — it sits in the same folder, is dated within a minute, has a higher version number, and is **the final SILENT picture with no audio track**. Version numbers across the two naming series are not comparable. **Probe for an audio stream before sending any render.**

### Demo login allocation — ONE PER PROGRAM, never reuse

Approving a pending gate is a **write**. Two programs on one login means the second reviewer opens an empty approval queue and sees a dead room, which is the exact beat the demo is built around.

| Login | Password | Allocated to | Status |
| --- | --- | --- | --- |
| `explore@supaprod.ai` | `Supaprod!Explore2026` | **Y Combinator** (already filed) | LOCKED, do not reuse |
| `voyage@supaprod.ai` | `Supaprod!Voyage2026` | ~~South Park Commons~~ → **REUSABLE** (founder ruling 2026-08-14) | free, re-arm before sending |
| `compass@supaprod.ai` | `Supaprod!Compass2026` | **Betaworks AI Camp** (2026-07-31, submitted) | held, never opened |
| `meridian@supaprod.ai` | `Supaprod!Meridian2026` | **ikigai Launchpad** (drafted 2026-08-16, not yet sent) | reserved, re-arm before sending |
| `lantern@supaprod.ai` | `Supaprod!Lantern2026` | **Campus Founders, CF Accelerator Batch #9** (SUBMITTED 2026-08-16) | **SENT. Verified working 2026-08-16 11:25 IST** — see the attribution note below |
| `harbor@supaprod.ai` | `Supaprod!Harbor2026` | founder rehearsal only | NEVER send |

> ### ✅ A demo login was finally verified end to end, 2026-08-16 11:25 IST. **It worked.**
>
> **`lantern@` was signed into before the Campus Founders application went out**, and it landed on a live workspace: **Helio Labs / Relay, 11 decisions ready for review, 2 runs waiting at Build**, all seven stations present. **The queue was armed and nothing had decayed.** Nothing was approved, so the reviewer's queue is intact.
>
> **This is the first time any demo login has been confirmed to work**, and it matters because the traction answer invites a reviewer to "walk the whole loop in about ten minutes". That sentence was previously a hope.
>
> **The cost, and how it is neutralised.** Signing in stamps `last_sign_in_at`, which is exactly what made `explore@` unattributable for YC. **The fix is the timestamp: we signed in at ~11:25 IST on 2026-08-16, so any later sign-in on `lantern@` is Campus Founders.** Record the timestamp every time a login is verified, and the attribution problem disappears.
>
> **Standing rule from this: verify the login before the application goes out, and write down when you did.** An unverified login behind a "walk the whole loop" claim is a worse risk than a stamped `last_sign_in_at`.

> ### 🔍 Measured 2026-08-14, and it changes what we assumed. **No reviewer has ever signed in.**
>
> ```sql
> select email, created_at, last_sign_in_at from auth.users
> where email like '%@supaprod.ai' order by last_sign_in_at desc nulls last;
> ```
>
> | Account | `last_sign_in_at` | What that means |
> | --- | --- | --- |
> | `voyage@` (South Park Commons) | **NULL** | **Never signed into, once, ever** |
> | `compass@` (Betaworks) | **NULL** | **Never signed into, once, ever** |
> | `meridian@` · `lantern@` | NULL | Never used, as expected |
> | `explore@` (YC) | 2026-08-13 08:12 UTC | Signed in at least once. **Not attributable** — see below |
> | `harbor@` (rehearsal) | 2026-08-14 07:55 UTC | Founder rehearsal, as designed |
>
> **`explore@` cannot be attributed to YC and must not be reported as engagement.** `auth.audit_log_entries` holds **0 rows** in this project, so there is no per-event history to read — only a single last-sign-in timestamp. 2026-08-13 is the day the SkyDeck application was being drafted and logins were being tested in incognito, which is the likelier explanation. **Say "signed into at least once, unattributable", never "YC opened it".**
>
> ### The strategic fact underneath, and it is bigger than the allocation question
>
> **South Park Commons rejected us without ever opening the product.** The login sat in two answers of a filed application and was never used. So the demo login is **not** doing the persuading we assumed it does at the screening stage — the form alone carried that decision, and lost it.
>
> **This does not mean stop sending logins.** It means the written answers must survive on their own, and a login is what converts an *interested* reader, not what creates one. Weight the drafting hours accordingly.

> ⚠️ **Three free logins now** (`voyage@` recovered, `meridian@`, `lantern@`). If more programs need one, clone additional workspaces first (`supabase/migrations/20260725140000_clone_helio_to_investor_workspaces.sql` is the pattern). For lower-priority programs, give the signup link instead of a login: `https://supaprod.ai`, sign up with any email, you land in a seeded workspace in about a minute.
>
> **Do not pre-create logins and let them sit.** The scarce thing is not the workspace, it is the approval queue, which decays on its own. Create on demand, and **arm the queue at send time, not at create time.**
>
> ⏳ **Approval queues decay.** Each seeded workspace ships five pending approvals with short `expires_at`. Re-arm before any review window. Last re-arm 2026-07-28 with a 60-day runway, so it holds to late September.

---

## 12. Banned language (check every paste against this)

> **Synced with `CLAUDE.md` and `baseline.yml` on 2026-08-17. The register split is retired: these apply on EVERY surface, product and outward alike.** The audit that killed the split found we drifted worst in the shop window, not in the product.

**Filler, never write:** leverage, utilize, robust, seamless, cutting-edge, revolutionize, game-changer, unlock, empower, supercharge, delve, tapestry, testament to, "in today's fast-paced world", "it's not just X, it's Y".

**Vocabulary, banned everywhere:** receipts · ledger · company brain · decision layer · unattended · first run · provenance. They score at or near zero in the market's own writing, measured across 5.9M words.

**Verbs of the brain, banned everywhere:** remembers · stores · logs. They claim less than the product delivers. **Say "learns, then guides".**

**Kept, everywhere:** audit trail · shared brain. A practitioner reached for the first of those unprompted, which is the whole test.

**"Approve" versus "review":** settled by what the control does, not by word frequency. Use **approve** only where a click UNBLOCKS something. Use **review** where it only shows you something.

**Never claim accumulated learning in the present tense.** The honest form is *the loop is wired and proven, and it begins accruing on first real use.*

**Punctuation:** no em dashes, no en dashes, no invisible Unicode in anything pasted into a form.

**Product name:** the product is **Supaprod**, never "SupaProd". `Cadence` is the retired name and must not appear.
