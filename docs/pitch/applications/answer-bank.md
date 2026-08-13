# The answer bank — every accelerator application, one source

> _Created 2026-07-31. This is the single reusable source for every accelerator, incubator, residency and grant application. Each program folder pulls from here and adds only what is program-specific. Never write a new answer from scratch; pull the closest block, trim to the word limit, and adjust the emphasis._

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
| Commits | **5,131** _(2026-08-13)_ | `git rev-list --count origin/main` ← **origin/main, not HEAD.** HEAD counts whichever lane branch you are on and drifts from the real total |
| Migrations | **532** _(2026-08-13)_ | `ls supabase/migrations/*.sql \| wc -l` |
| Build duration | **10 weeks** _(first commit 2026-06-02, derived from git)_ | `git log --reverse --format='%ad' --date=short \| sed -n 2p` then count to today. **11 weeks from 2026-08-18.** |
| ~~Feature register~~ | **DO NOT USE** | The register has not been maintained since `2026-08-04`, and `scripts/dashboard-tally.sh` **does not exist in the repo**. Volume claims are dropped outward; the demo login is the evidence. |
| Homepage counters (strict, public) | 83 missions run · 26 decisions recorded · 16 outcomes graded · 840 AI calls | render live on supaprod.ai |
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
Agents that know what to build, ship it, and remember.

### Under 50 characters — pick by audience, there is no single default

| Line | Chars | Use it for |
| --- | --- | --- |
| `Cursor for PMs, the whole product org.` | 38 | **Investors, VC-run accelerators, YC.** A partner thinks in categories and knows the PM budget exists, so the anchor does real work. |
| `Agents that know what to build, ship it, warn you` | 49 | **Builder audiences: hacker houses, residencies, engineer-heavy programs.** All three layers, the third one **guides** rather than stores, and it keeps the ratified tagline's structure. |
| `AI that knows what to build, ships it, warns you` | 48 | Same, with more headroom, if you prefer "AI" to "Agents". |
| `Decides what to build, builds it, learns.` | 41 | When the cap is tighter than 50, or the form wants blunt. |
| `Cursor for product managers.` | 28 | Anchor-only fallback when space is very tight and the reader is investor-side. |

> ⚠️ **Do not default to the Cursor line for builder audiences.** At YC it is the right anchor. At a house of young engineers, "product manager" is not an aspirational identity and for part of that room it names the person who slows them down, so it spends the 50 characters on the one word they may push back on.
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
```
Supaprod is the operating system a product team runs on when AI agents do the
work. The closest familiar thing is Cursor, but for the whole product lifecycle
instead of the code editor.

It reads the signals from your users and your market and tells you what is
worth building. It argues with you before you commit. Then it writes the spec,
plans the work, builds it, ships it behind gates you control, and checks what
actually happened.

The build lane is built in. Our own engine runs frontier models through one
runtime chokepoint and delivers spec-shaped pull requests behind a merge gate
no agent can cross, with an audit trail on every action and one-key rollback. Your
team runs no second coding tool for it, and when a better model ships, Supaprod
gets better the same day.

What makes it compound: every decision is recorded with its evidence, and every
outcome is checked and remembered. That record becomes the brain of your
product org. It answers "why did we decide this" in seconds, it gets sharper
about your next call with every outcome it records, and it warns you before you
repeat something that did not work.

Agents do the work. You answer for it. Supaprod is how you answer.
```

### The three layers (name and order them, always door then body then brain)
- **01 The director.** Tells you what to build.
- **02 The operating system.** Runs the whole lifecycle.
- **03 The brain.** Remembers, and it guides.

> The brain is never storage. Banned framing: "where the record lives." It compounds; next time it tells you what is right, and warns before you repeat what was wrong.

---

## 2. Founder

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
commits, solo. Beta is open, public launch September 2026. Zero paying users
yet; I built the system before opening the doors, deliberately.
```

### Users and revenue (the truthful answer, do not soften it)
```
No paying users and no revenue yet. The beta is live and anyone can sign up or
walk the product on a demo login today. I built the engine before opening the
doors, deliberately, and the public launch is mid-September 2026.
```

### What is genuinely proven, and what is not (keep this straight in interviews)

**Proven and demoable:**
- The autonomous loop is real: a cron engine advances product missions every minute through sense, decide, define, build, ship, learn.
- Agents open real pull requests behind a merge gate no agent can cross.
- Earned autonomy: agents graduate permissions from their track record, with non-overridable floors on merge, revert and delegate.
- One-key rollback on anything an agent produced.
- Recorded outcomes re-rank the next bets.
- The feature register survived an independent code audit.

**Not yet proven, do not claim:**
- External usage of any kind. Zero.
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

```
Nobody runs the whole loop. My real competitor is the stitched stack: Linear or
Jira for tracking, Notion for docs, ChatPRD for specs, a coding agent for the
build, and the product manager as the glue.

The space is moving. Samepage raised a $4.85M seed to surface signals for
product leaders. Brief captures decision context for agents. Productboard
shipped Spark. Notion launched Ship OS, which promises customer feedback to a
merged pull request.

What I understand that they do not: every one of them stops one step short. They
surface, draft, remember, or dispatch. None of them checks the shipped outcome
against the decision that caused it and feeds that back.

But the real competitor is not another product. It is the folder. Six product
managers talked a buyer out of this category in a private thread last month:
don't switch tools, use simpler ones, two systems of record create friction.
One had tried four purpose-built tools and gone back to a plain Obsidian
folder. Their sharpest argument was that lower-level tools are more AI-friendly,
because agents drive them better.

They are right about the premise and wrong about the conclusion. An agent can
write into a Notion page or a GitHub issue. It cannot write a decision carrying
its evidence, its author, a verdict slot and a human gate into either.
Low-level tools are agent-writable but not agent-governable. That seam opens
the moment a second person or a fleet of agents touches the work, and it is
where we sell.
```

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
| Founder email | founder@supaprod.ai |
| Investor email | investors@supaprod.ai |
| LinkedIn | https://linkedin.com/in/rohit-gajaraj |
| X | https://twitter.com/rohit_gajaraj |
| GitHub | https://github.com/RohitGajaraj |
| Demo video | 4:51 cut, wedge front-loaded (see `docs/pitch/yc/video-scripts.md`) |
| Founder video | 2:53 (needs a ≤1:00 re-cut for programs that cap it) |
| Investor deck | `docs/pitch/investor-deck/supaprod-pre-seed-investor-deck.html` (frozen v19) |

### Demo login allocation — ONE PER PROGRAM, never reuse

Approving a pending gate is a **write**. Two programs on one login means the second reviewer opens an empty approval queue and sees a dead room, which is the exact beat the demo is built around.

| Login | Password | Allocated to | Status |
| --- | --- | --- | --- |
| `explore@supaprod.ai` | `Supaprod!Explore2026` | **Y Combinator** (already filed) | LOCKED, do not reuse |
| `voyage@supaprod.ai` | `Supaprod!Voyage2026` | **South Park Commons** (2026-07-31, submitted) | SPENT |
| `compass@supaprod.ai` | `Supaprod!Compass2026` | **Betaworks AI Camp** (2026-07-31, submitted) | SPENT |
| `meridian@supaprod.ai` | `Supaprod!Meridian2026` | _(assign)_ | free |
| `lantern@supaprod.ai` | `Supaprod!Lantern2026` | _(assign)_ | free |
| `harbor@supaprod.ai` | `Supaprod!Harbor2026` | founder rehearsal only | NEVER send |

> ⚠️ **Four free logins.** If more than four programs need a login, clone additional workspaces first (`supabase/migrations/20260725140000_clone_helio_to_investor_workspaces.sql` is the pattern). For lower-priority programs, give the signup link instead of a login: `https://supaprod.ai`, sign up with any email, you land in a seeded workspace in about a minute.
>
> ⏳ **Approval queues decay.** Each seeded workspace ships five pending approvals with short `expires_at`. Re-arm before any review window. Last re-arm 2026-07-28 with a 60-day runway, so it holds to late September.

---

## 12. Banned language (check every paste against this)

Never write: leverage, utilize, robust, seamless, cutting-edge, revolutionize, game-changer, unlock, empower, supercharge, "in today's fast-paced world", "it's not just X, it's Y", "delve", "tapestry", "testament to".

Never use: em dashes or en dashes in pasted copy. No invisible Unicode.

Product-name rules: the product is **Supaprod**, never "SupaProd". `Cadence` is the retired name and must not appear.

Positioning rules: "company brain" is YC's phrase, quoted and attributed, never our brand identity. Our owned words are the track record, the decision brain, evidence.
