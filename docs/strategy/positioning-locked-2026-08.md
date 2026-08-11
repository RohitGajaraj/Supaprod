# Positioning, locked — 2026-08-10

> _Created: 2026-08-10 · Lane 0 · **Founder-approved.** Category test and ICP targeting approved 2026-08-10 17:46 IST; moat corrections approved 16:42 IST. Evidence: [`../research/lennys-corpus-sweep-2026-08.md`](../research/lennys-corpus-sweep-2026-08.md), the full read of all 679 archive documents (5,935,025 words) plus *How I AI* and the members-only community._

**This file is the answer to "what are we, who for, and what do we refuse."** It supersedes the positioning sections of [`v11-guiding-star.md`](./v11-guiding-star.md) where they disagree. v11 keeps its detailed reference role.

---

## 1. The category — under test, not yet swapped

**Current line, still live everywhere:** *"the agentic-first operating system for product teams."*

**Under test:** **"There is no GitHub for product decisions."**

**Why test rather than swap.** The current line has two evidenced problems. April Dunford (~200 B2B positioning engagements) warns that platform-class words read as meaningless to buyers. And across 5.9M words **nobody names a lifecycle or an operating system** — it is our word, not theirs. But a category line is the highest-blast-radius string we own, it appears on 20+ surfaces including `src/` and `public/`, and swapping it on evidence of *absence* rather than evidence of *preference* would be exactly the overreach this sweep was built to catch.

**Where the candidate comes from.** Pete Kazanjy, on sales: *"there is no GitHub for sales motions, and so it's in your brain, it's in your documents."* It names a category by the shape of its absence, borrows a reference every buyer already holds, and needs no jargon.

**How the test is judged.** Marketing surfaces only — no product code. Run both lines and compare on *qualified* signal, not clicks: beta applications that describe the judgment gap in their own words. **Ship it only if the new line brings people who can already name the pain.** A line that lifts traffic and lowers qualification is a loss.

**What does NOT change while the test runs:** the three layers, the seven stations in-product, and every `src/` string. This is a shop-window experiment.

---

## 2. The wedge ICP — same person, different targeting

**Unchanged:** the front door is the **individual PM or founding PM**. Confirmed repeatedly across the corpus — Arnovitz hand-built an adversarial multi-model Critic and said *"I haven't seen many people doing it"*; Webflow **mandates** PMs run pitches through an in-house exec-simulator; Gridley's grading GPT spread bottom-up through WHOOP.

**Changed, and this is the substantive move: target by AI-identity stance, not by role, seniority or company size.**

The 2026-07-07 annual sentiment survey is unambiguous. A person's stance toward AI predicts career optimism (β = +0.39) and whether they would recommend their field (β = +0.60) **more than role, level and company size combined** — effect size d ≈ 1.55, roughly three times the founder effect. Four clusters:

| cluster | share | posture |
| --- | --- | --- |
| **Energized** | **41%** | excited, curious, hopeful. Most optimistic, least burned out. **Primary target.** |
| **Conflicted** | **35%** | curious *and* overwhelmed *and* tired. Largest ambivalent group. **Primary target — they feel the judgment gap hardest.** |
| Disoriented | 12% | role shifting beneath them. Reachable later, not now. |
| **Resentful** | **12%** | defined by feeling **pressured** to use AI. Lowest optimism. **Will not buy. Do not target.** |

**Our addressable population is the Energized + Conflicted 76%.**

**Two operating rules that follow.**
1. **Never imply obligation.** "Pressured to use AI" is the Resentful cluster's defining trait, and pressure language repels them *and* the Conflicted 35% who are already at 55.7% burnout with *"expected to do more for the same pay"* as their top fear.
2. **Sell relief, never throughput.** 82% already report AI makes them measurably more productive. Nobody needs more output. Copy that promises speed is selling the thing that is hurting them.

**Buyer and expansion are unchanged:** product team, then the VP/Head of Product who wants the record. But note Bret Taylor's warning — PLG *"doesn't work well when your buyer and the user of the software are different"* — which is our shape. Expansion likely needs a sales motion, not a self-serve upgrade.

---

## 3. The one job we win

**We close the judgment gap.**

The name is a practitioner's, not ours. Community Wisdom 189, 2026-06-14, unprompted:

> *"AI can accelerate delivery fast enough that the bottleneck moves. The teams I've seen get into trouble post-AI aren't the ones with slow pipelines. They're the ones where **PMs got faster at shipping but didn't get better at defending why. The judgment gap got exposed.**"*

Corroborated in the same thread: *"If the team doesn't have clarity on goals, priorities, decisions, and ownership, **AI basically accelerates confusion.**"*

**The job in one sentence:** when building gets cheap, the cost of a wrong call goes up and the ability to defend a call does not improve on its own. **We are what stops the acceleration from becoming confusion.**

---

## 4. The sharpest one-line claim

**The forecast captured at decision time.**

Not the record — the record is backfillable and was backfilled twice on the record (2023, and Vercel's COO in 2025 with an agent built in two days for ~$1,000/year). Not the outcome label — largely derivable once outcomes land. **The forecast: what a team believed would happen, recorded before the outcome was known.** It is not an artifact. It leaves no trace unless something captured it at the moment of the call.

**And the proof line, because it survives being queried:**

> **The arrow that appears nowhere in 5.9M words of the market's own writing, we built — and it already carries more real traffic than the link it competes with.**

⚠️ **RETRACTED 2026-08-11.** This sentence read *"Measured on production lineage, demo workspaces excluded: 36 real `learning → decision` edges"*. **The exclusion did not work.** It matched on the shape of a workspace id, and the sample-workspace function issues ordinary ids, so seeded rows counted as production. All 71 such edges are seeded; **zero have `seeded = false`**. Any conclusion below that rests on this number is unsupported until requeried.

**Binding honesty constraints on both claims** (see the sweep doc §2 and §4):
- The arrow moves **learnings, not outcomes** — `agent_memory` holds zero `kind='outcome'` rows. Say *"informed by what we learned from earlier decisions,"* never *"informed by measured outcomes."*
- **No present-tense claim of accumulated learning.** The honest and stronger form: *the loop is wired and proven, and it begins accruing on first real use.*
- **No implication of an unbroken signal→shipped→learned chain.** It is broken in two places: Discover promotes 3 of 86 themes, and Build writes zero changeset and zero deployment edges.

---

## 5. What we refuse to build, and what we stop saying

**Stop saying — all falsified, all swept from documents as of 2026-08-10:**
- ❌ *"The outcome ledger cannot be backfilled"* → the **forecast** cannot be
- ❌ *"90–95% agentic"* → graduated autonomy with gates, which is what we built and what the field actually wants
- ❌ *"The labs decline this vertical"* → Willison's security mechanism: they could have built it and could not do so **securely** across someone else's tools; an independent third party has no such restriction
- ❌ *"Single-suite incumbents cannot be neutral"* → absent from 5.9M words. The threat operators name is **DIY**
- ❌ *"Legacy the day it ships"* → softened; inevitability language is how the web3 class of call went wrong
- ❌ The receipts/ledger/audit-trail vocabulary **on marketing surfaces** (it stays in-product — see the register split in the sweep doc §1C)

**Refuse to build:**
- **A seven-station route diagram as the front door.** The stations are real and predate agents at ~15 named companies, so they are a commodity; and a heavily-diagrammed staged lifecycle is the visual signature of SAFe, which this buyer is ripping out.
- **A Critic that renders a verdict on the user's pet feature.** Automated code review lost for exactly this reason — *"a thing roasts your code and tells you how terrible of a developer you are"* — and a feature-team PM who red-teams *"gradually depletes their social capital."* Build co-produced evidence the user gets credit for. Flag, never gate.
- **Anything that promises to take the judgment over.** The survey's own words: *"I feel like I don't think hard enough anymore — I just follow Claude."* Compounding that is the Snyk absolution effect and it destroys the buyer we want.
- **Throughput features as the headline.** 82% already have the speed. Speed is the disease.

---

## 5B. Added 2026-08-10 from the private community — four things that outrank what we had

1. **"Context governance" is the operator's name for our category.** Brandon Parker, advising an enterprise building this internally: *"the prompt is rarely the hard part. **Context governance is.**"* For the in-product register this beats every term in the vocabulary table.
2. **Our most differentiated built asset, described as an unmet need.** Same source: agents fail when they cannot tell *"**current vs. stale, canonical vs. just-discussed, decided vs. still-needs-a-human**."* That is our bi-temporal supersession graph in plain English. Lead with it.
3. **The metric is rework, not speed.** *"The KPI I'd watch isn't speed. It's rework: clarification loops, reopened tickets, spec/design mismatches, review burden, first-pass acceptance."* Better than anything in our canon, measurable from data we already hold, and it directly answers the survey's top fear — **rework is unpaid work**, so reducing it is relief rather than more throughput.
4. **A four-part output contract for every agent artifact:** *"Here's what I used, what changed, what I think is true, and how to verify it."*

**And one open structural question, flagged not decided.** An agent-led studio operator: *"You stop forecasting what's worth building and start **deciding what's worth keeping after you've watched it run**… Planning didn't disappear, it just **moved downstream of the evidence** instead of upstream of it." ***If build cost collapses, Learn stops being station 07 and becomes the front of the loop.*** The reconciliation that preserves §4: the forecast does not vanish, it shortens — from *"will this quarter's bet pay off"* to *"what do I expect this prototype to prove"*, which resolves in days instead of quarters and is therefore **easier** to capture. Recommended treatment: two legitimate entry points (Discover for new problems, Build/Learn for cheap-to-test ones). **This touches the station model and is the founder's call.**

## 5C. The answer to the hardest objection arrived the same day (2026-08-10, late)

**The objection**, from six PMs in the private community, and the one we had no answer to: *"lower-level tools are more AI-friendly"* — dumb tools win because agents drive them better, so why add a layer?

**The answer, now true rather than aspirational.** Lane 1 reports the outward **agent write surface is live**: `record_decision`, `draft_spec`, `settle_outcome` beside `ingest_signal`, each scope-gated, with the write gate on — **nothing an agent writes lands finished.**

So the counter is not *"our tool is better than your spreadsheet."* It is: **we are the agent-writable substrate that a spreadsheet cannot be.** An agent can write into a Notion page or a GitHub issue, but it cannot write a *decision with its evidence, its author, a verdict slot and a human gate* into either. **The low-level tools are agent-writable but not agent-governable.** That is the seam, and it is exactly what the Series E customer in §1C is staffing a PM to build by hand.

**Use this framing wherever the DIY objection appears.** It concedes their premise (agents do prefer simple, manipulable surfaces) and then names what simple surfaces structurally cannot carry.

## 5D. Instrument status — what is real today, stated honestly

**The rework KPI is a real instrument, not a claim — four of five components, with the fifth named as absent.**

| component | status |
| --- | --- |
| **first-pass acceptance** | ✅ **live per agent from 2026-08-10** (`human_gate_events` + `summarizeGateSignals`, approved/total, with rejection/edit/override counted as corrections) |
| review burden | ✅ derivable from the same stream |
| reopened items | ◐ partial — send-back returns a spec to draft and records the reason |
| spec/design mismatches | ◐ queryable via `design_gate_status` vs spec state |
| **clarification loops** | ❌ **unmeasured. Declare it, never draw a zero.** |

**Binding:** capture began 2026-08-10, so **the metric has no history.** Any rework figure shown before real usage is a number about demo data. Same present-tense discipline as §4.

**⚠️ Demo constraint — do not demo the full station walk on a real account.** Three lineage hops were never written by any code until 2026-08-10: `mission → changeset`, `changeset → deployment`, `prd → learning`. The ~35 production edges of those shapes are **demo seed stamped with plausible agent names**. All three now write, but they accrue only after deploy. **The Discover → Decide → Learn half is real and always has been** — demo that. A "watch it flow to shipped" walk traverses precisely the broken region.

**And it strengthens §5B's station-order question:** measured on real throughput, **Decide's largest single inbound source is already Learn** — 36 real edges, 4× what opportunities contribute. Reordering the loop would be *describing what our own lineage already does*, which is a far easier change to defend than a repositioning.

## 5E. The station-order ruling — founder, 2026-08-10 19:19 IST

**Level 2 (the diagram and the story): APPROVED and in flight.** The loop is drawn as a **cycle with two front doors** — Discover for genuinely new problems, Build → Learn for anything cheap to test. No code. This makes the picture match the database, where Decide's largest inbound is already Learn at 36 real edges against 9 from opportunities, and it sheds the SAFe visual signature this buyer is actively removing.

**Level 3 was two changes, not one, and they separate cleanly.** The founder pushed on the deferral and was right to — the honest answer is that half of it should ship immediately and half should not.

### 3a — Forecast capture at decision time: **BUILD NOW. P0.**

Un-backfillable, one feature, and the whole §4 moat rests on it. Evidence is strong and independent: Duke's First Round instrument, the backfill falsification, and Lane 1's own correction that a *cause* is recoverable from artifacts while a *forecast* is not. **This was already the top routed directive and it does not depend on any routing change.** No reason to wait.

### 3b — Changing the DEFAULT entry point for new missions: **DO NOT. Instrument instead.**

Make Build → Learn a **first-class selectable route now** (cheap, reversible). Do **not** make it the default.

**Why, stated as risk rather than preference:**

1. **A default is a claim about what is normal, and we have zero external users.** Setting it from one operator's anecdote means encoding a guess into every new user's first experience — and we would have no baseline to detect that it was wrong.
2. **The counter-evidence is not weak.** In the *same thread*, two operators hold that strategic planning remains critical and is *"the critical opportunity to get the cross-functional alignment"*; a third names an enterprise constraint — *"the velocity of product changes isn't just about what you can ship, it's also about what your customers are willing to uptake."* From the 2022 baseline: *"if you jump stages, you're hosed"* and *"you need to do it all the way. You can't adopt the process halfway."*
3. **The asymmetry decides it.** Making Build-first *available* is cheap to reverse. Making it the *default* and being wrong mis-routes every new user by construction, silently. When one direction is cheap to undo and the other is not, the cheap one wins on thinner evidence.
4. **We can already measure this.** Our lineage instrumentation proves it — that is how we know Learn already outfeeds opportunities 4:1.

**The trigger, so this is a scheduled decision and not a dropped one:** review after the first **four weeks of real external usage**. **If ≥50% of missions are manually routed Build-first, flip the default.** If it sits below that, the current default was right and we saved ourselves a silent mis-route. Either way the answer comes from our users rather than from one studio.

**Net effect: nothing of value is deferred.** The moat feature ships now; the capability ships now; only the *guess about what is normal* waits for data we will have in a month.

## 5F. The wedge, sharpened by the full community sweep (2026-08-10, final)

All ~15 Community Wisdom editions are read. **The tool-rejection pattern is the dominant one, not an outlier** — nine clusters across ten editions, all pointing the same way: operators feel the pain acutely, reach for a folder or a Markdown file, and **the search stops there.** A plain Obsidian folder beat four purpose-built tools for one operator. Every satisfied structured system was self-built. Evidence in [`../research/lennys-corpus-sweep-2026-08.md`](../research/lennys-corpus-sweep-2026-08.md) §1C.

**But the same sweep contains our product specified as four unmet needs**, by an operator who tried Obsidian, abandoned it, built his own, and concluded *"it's very difficult to apply the kind of governance that makes it work"*: know who changed what · know what is trustworthy vs polluted · know why they changed it · prevent certain files from changing.

**The reconciliation sets the GTM.** Every DIY *success* in the corpus is **single-operator, single-context**. Every DIY *failure* is **multi-person or multi-agent governance**.

> ### The wedge is not "better than your folder." It is the point at which the folder stops working — the second person, or the first fleet of agents.

Three independent routes reach this: the community sweep, *How I AI* (every workflow single-operator, dies with its author), and the pre-AI baseline (the write-back arrow absent from every named lifecycle). **Do not sell to the operator whose folder works. Sell at the transition.**

**Two consequences for §2's ICP:** the individual-PM front door still acquires, but **the moment of willingness-to-pay is the team-under-agents transition**, not first use. And the strongest line the community produced is a candidate for §4 — Bal Sieber: *"What doesn't compress is deciding what's worth doing, defining what good looks like, and catching when the system is confidently wrong. **Less operator, more director.**"* Three unautomatable jobs, which are stations 02, 03 and 07, and *director* maps to our layer 01.

**And the trap to design against, from the same operator:** *"'building systems' becomes its own busywork fast. You end up with elaborate workflows that feel productive and move nothing."*

## 5G. The messaging kit — what to actually say, and where

**Is there a strategy shift? No pivot. One repositioning and four retirements.** The product is right; the corpus confirms the thesis in practitioners' own words. What changes is **how we describe it, who we aim at, and when we expect them to pay.**

### The spine — three beats, entirely in operator language

> **1.** The half of the job that was doing the reps is going to agents.
> **2.** What doesn't compress: **deciding what's worth doing, defining what good looks like, and catching when the system is confidently wrong.**
> **3.** Supaprod runs those three — and keeps what you believed *before* you found out.

Beat 2 is verbatim from an operator (Bal Sieber, 2026-06-27). Those three jobs **are** stations 02, 03 and 07. Beat 3 is the forecast claim, which is the only un-backfillable part.

**The felt promise, one line:** **"Less operator, more director."** _(His words. It also maps exactly onto our layer 01, the director.)_

**Category line, under test:** *"There is no GitHub for product decisions."*

### Where each claim is allowed to appear

> ⚠️ **The Register column below is RETIRED.** The public/private split it encodes was replaced on 2026-08-11 by the founder ruling in §5J: **practitioner language everywhere, in-product as well as public.** The row that mattered is the one this table got wrong, and it was steering work for a day: it lists **audit trail** under *Never* for public surfaces, and **audit trail is on the keep list** because practitioners say it unprompted. It also splits *receipts* from *receipt*, when both are dropped everywhere.
>
> **What survives from this table** is the Surface and the Never columns read as one list, minus that error: never a present-tense compounding claim to an investor, and never deck vocabulary in a practitioner room. **For what to say, use `AGENTS.md` rule 3**, which is the single current source and carries the measured rates.

| Surface | ~~Register~~ *(retired)* | Use | Never |
| --- | --- | --- | --- |
| **Landing page, brief, listings** | ~~public~~ | the three beats · *less operator, more director* · evidence · history · track record · ready/review/stuck | receipts · ledger · audit trail · company brain · operating system · unattended |
| **In-product** | ~~private~~ | context governance · drift · gate · memory life cycle · audit trail · current-vs-stale | receipt · unattended (dead in both registers) |
| **VC / accelerator** | analytical | the five below | any present-tense compounding claim |
| **Community / Slack** | practitioner | plain problem language only | all deck vocabulary — *"'cracked' is VC BS"* was said twice in one thread |

### For investors, accelerators and incubators — five things, in this order

1. **Why now, with a number.** Build cost collapsed; the bottleneck moved. Not our claim — a practitioner's: *"AI can accelerate delivery fast enough that the bottleneck moves… PMs got faster at shipping but didn't get better at defending why. **The judgment gap got exposed.**"* And 82% of the market reports AI already makes them measurably more productive, while burnout rose 44.7% → 55.7% and the #1 fear is *"expected to do more for the same pay."* **Speed is solved. Judgment is not.**
2. **The wedge, and why it is not "a better folder."** Every DIY success in the corpus is single-operator. Every DIY failure is multi-person or multi-agent governance. **We sell at the transition** — the second person, or the first fleet of agents. Proof: an operator who tried Obsidian, abandoned it, built his own, and still could not solve *who changed what · what is trustworthy vs polluted · why they changed it · preventing changes.*
3. **The moat, stated so it survives a query.** Not the record — that is backfillable and was backfilled twice on the record. **The forecast captured at decision time**: what a team believed would happen, recorded before the outcome was known. It is not an artifact; it leaves no trace unless something captured it at the moment of the call.
4. **The proof line.** *The arrow that appears nowhere in 5.9M words of the market's own writing, we built, and it runs on a live path.* **⚠️ Corrected 2026-08-11: the parenthetical that used to sit here, "36 real `learning → decision` edges", was seed data.** All 71 such edges are seeded, none has `seeded = false`, and the `prd → learning` writer had never fired. **Never restore a count to this beat.** The proof is that the arrow exists and is wired, and it begins accruing on first real use. See [`../pitch/verified-numbers.md`](../pitch/verified-numbers.md).
5. **The metric, which is also the answer to "is this vitamin or painkiller."** **Rework, not speed** — clarification loops, reopened tickets, first-pass acceptance. **Rework is unpaid work**, so cutting it is relief, not more throughput.

**The honest beat, said before they ask:** the loop is **wired and proven, and empty by design until used.** First-pass acceptance began capturing 2026-08-10. *"Wired, proven, accrues on first real use"* survives diligence; *"we learn from your corrections"* does not survive one query.

### The four retirements

❌ *"the agentic-first operating system for product teams"* as the lead — platform words read as meaningless, and nobody in 5.9M words names an operating system · ❌ *"that compounding is the moat"* — the compounding record is backfillable; **the forecast is the moat** · ❌ *"90–95% agentic"* · ❌ the seven-station diagram as the front door.

## 5H. The product definition in under 50 words — and the rule for every application

### The definition (recommended, 44 words)

> **Supaprod is where product decisions live when agents do the work. Agents run the reps; you direct. It records what you expected before the outcome landed — the one part of a decision nobody can reconstruct afterwards — and uses it to sharpen the next call.**

**Why this shape.** It opens with a **noun a stranger can hold** (*where product decisions live*) rather than a platform word. It names the **felt promise** in three words (*agents run the reps; you direct*). It states **the moat as the differentiator**, not as an afterthought. And it ends on the benefit rather than the mechanism.

**Note the deliberate concession:** *"where decisions live"* is storage-shaped language, which our own doctrine has resisted. That is intentional and evidence-backed — the community describes this problem **entirely in nouns of storage and correctness** (*context, source of truth, drift, invisible states*). We **meet them at the problem in their nouns and deliver governance in the next sentence.** What stays banned is the *verb* form: the brain never "remembers", "stores" or "logs".

**Alternate (job-first, 38 words)** — use where the audience already feels the pain, e.g. a practitioner conversation or the community:

> **Agents do the reps now. What doesn't compress: deciding what's worth doing, defining what good looks like, and catching when the system is confidently wrong. Supaprod runs those three, and records what you expected before you found out.**

**Where the retired line still belongs.** *"The agentic-first operating system for product teams"* stays as the **internal definition** and on **machine-readable surfaces** (`llms.txt`, `agents.txt`, the A2A card). An answer engine wants a precise categorical definition; a human buyer hears a platform word. **Same register split as the vocabulary rule** — it is not wrong, it is wrong for humans.

### Binding rule for every outward application, from 2026-08-10 forward

**Every accelerator, incubator, VC and grant application speaks in the five beats of §5G, in that order:** why now with a number · the wedge and why it is not "a better folder" · the moat stated so it survives a query · the proof line · the metric (rework, not speed). **And the honest beat before they ask it:** wired and proven, empty by design until used.

**Three hard prohibitions in any application:**
1. **No present-tense accumulated-learning claim.** *"Wired and proven, begins accruing on first real use"* survives diligence; *"we learn from your corrections"* does not survive one query against `agent_memory`.
2. **No unbroken signal → shipped → learned chain.** It is broken in two places.
3. **No "90–95% agentic", no "cannot be backfilled", no inevitability language.** The most credentialed post of its era called web3 *"risky and inevitable"* and pointed readers at FTX.

### What to change in the submitted YC application

**Highest leverage is the Progress Update** — one of the five surfaces the portal leaves editable, and the only place the current truth reaches a partner. Suggested content, in the five-beat order and true as of 2026-08-10:

> Since applying I ran a full read of the market rather than guessing at it — 679 documents, 5.9M words of operator interviews and a members-only PM community. It falsified three of my own moat claims, and I corrected them in public in the repo rather than defending them. The record is backfillable; the **forecast** — what a team believed before the outcome landed — is not, and that is now the product's core. Practitioners name the pain in their own words: *"PMs got faster at shipping but didn't get better at defending why. The judgment gap got exposed."* The loop is wired and proven end to end, and empty by design until real usage accrues; first-pass acceptance began capturing this week.

**If 9a/9b/9c are editable** (the file records them as locked; the founder reports otherwise — verify in the portal): **9c already has a paste-ready correction** at its section, replacing the spliced Mosseri/Lemkin arithmetic. For **9b (competitors)**, the current answer aims at incumbent suites; the corpus says the real objection is **DIY and "simpler tools are more AI-friendly"** — the answer is §5C: *low-level tools are agent-writable but not agent-governable*.

**Interview prep is already updated** — brutal question #13 in [`../pitch/yc/interview-prep.md`](../pitch/yc/interview-prep.md) covers the spliced claim if a partner quotes the locked text back.

## 5I. Graduated autonomy is proven in production — at exactly one station (2026-08-10, late)

**Measured by Lane 1 against production, demo workspaces excluded.** This is the best autonomy evidence we have and it must be scoped precisely or it becomes an overclaim.

**What is true and strong: Learn already auto-settles 32% of outcomes.** 38 of 119 learnings carry `recorded_by_agent_slug` — settled by an agent through `decideSettlement`, an **evidence-and-stakes model measured against a per-workspace bar**. It is live, it works, and it has been doing a third of Learn's judgment quietly.

**What is true and limiting: it is wired into exactly one station out of seven.** `autonomy-progression.ts` has **zero callers**. `trust-ladder.ts` is imported only by display components. `trust_graduation_proposals` has **never had one accepted**. So the graduated-autonomy pattern our positioning leans on is **proven in production and applied once.**

**Why this is a better story than the one we were telling.** Every operator in the corpus says agents need human gates — Block at 60% first-pass, *"Copilot is a copilot, it is not a pilot"*, 74–75% naming reliability as the top blocker. Against that, *"we have graduated autonomy"* is a claim everyone makes. **"We ship the gate, and a measured path off it — one station is already 32% autonomous on an evidence-and-stakes model"* is a claim nobody else in 5.9M words can make.

**Binding scope, and say it exactly this way:** *one station, 32%, on the evidence model that got it there.* **Do not claim it platform-wide until the generalization lands** — six of seven stations have no path off the gate today. The correction-rate corpus that would let it graduate further **began filling 2026-08-10 and has no history**, so §5D's present-tense discipline applies here too.

**This also answers the founder's own objection** — why an agentic-first product hands a human 172 pending decisions and 50 tool gates. The honest answer is that the mechanism to reduce them exists, is proven, and is plumbed into one station. That is a roadmap item with evidence behind it, not a defect.

## 5J. Four corrections to this document, 2026-08-11 — founder challenge

The founder pushed on the evidence rather than accepting it. Three of the four challenges landed.

### ① One lab, not two. I overstated it.

**Krieger holds and is the whole argument.** Anthropic's CPO, 2025-06-05, verbatim: *"I started the year by writing a doc that was effectively how do we do product today and where is Claude not showing up yet that it should? And I think that **upstream part is the next one to go**… **Can Claude be a partner in figuring out what to build? What the market size is…? What the user needs are…?**"* He names our layer, calls it next, and mentions ChatPRD in the same breath.

**Embiricos does NOT hold.** His actual words are that Codex *"participates early on in the ideation and planning phases **of writing software**."* That is the **software-engineering** lifecycle, upstream of code rather than upstream of product decisions. §2 compressed this into "both labs, on record", which is **wrong**. Corrected: **one lab**. The conclusion survives on Krieger alone, but the evidence is thinner than first stated and anyone repeating it should say one, not two.

### ② The DIY finding is nine clusters, not six PMs — and it has a real ceiling

The six-PM thread is one cluster of nine spanning four years: Tolga (four tools → folder) · Roemer · Laak · Milko (dated shift *away* from buying) · Nichols (built his own, failed on governance) · Abouelnagah (shipped a competing memory-lifecycle tool) · Grosser · Vo · a Series E staffing a PM to build it — plus ~95 *How I AI* episodes and every pre-AI lifecycle being hand-run.

**But the ceiling is real and must be stated whenever this finding is used: it is all ONE ecosystem.** Lenny's world is PM-adjacent, US-centric, early-adopter-skewed, and self-selects for people who enjoy building their own tools. **A corpus of tinkerers over-reports tinkering.**

**Standing rule: this finding is strong enough to change how we talk, not yet strong enough to change what we build.** That is exactly what was done — positioning moved, the roadmap did not. Validating it properly needs a second independent source (analyst data, competitor traction, job postings) and five conversations with buyers outside that community.

### ③ OKF was overstated as strategy. It is optionality.

**Nobody is on OKF** — it shipped in July 2026. The real move is **"read whatever they already have"**: Notion, Google Docs, Slack, Confluence, markdown in repos, which we already have connectors for. Onboarding a non-OKF team is not a problem to solve, it is the normal path — *point us at your existing mess, we read it, we add governance on top; nothing to migrate.*

**OKF is one more importer, worth supporting because being compatible with a forming standard beats fighting it.** For a team already on it, we can ingest losslessly **and export back**, which makes us additive rather than lock-in — and that directly answers the DIY objection.

### ④ The register split is retired. Practitioner language everywhere.

**Founder ruling: use what practitioners say on every surface, in-product as well as public.** Drop what we invented (*receipts · ledger · company brain · decision layer · unattended · first run · provenance*). Keep what they say (*audit trail · shared brain · evidence · history · track record · drift · gate · context governance*).

**The audit's headline finding inverts the assumption the register split rested on:** we drifted worst on **public** surfaces, not in-product — 4 public files gave 31 changes from 15 surfaces, while **305 in-product surfaces gave 26**. The invented vocabulary concentrated exactly where we were trying hardest to sound differentiated. Exact strings: [`../growth/vocabulary-change-list-2026-08.md`](../growth/vocabulary-change-list-2026-08.md).

## 6. Routed to the lanes

**Lane 1 (function/gaps):** forecast capture at decision time is the priority build — it is the only un-backfillable asset and it is one feature. Then confidence grades on outcome labels (30–40% of lift-showing experiments show no long-term lift; a p<0.05 result is wrong ~1 in 4). Intervention logging is wired but starved and begins accruing now.

**Lane 2 (UI/UX):** the register split governs vocabulary — operator-native words in the shop window, our vocabulary inside the product. Empty states show a **worked example** ("example" is the highest-frequency term in the corpus at 712/M) and promise a **sharpened call**, never a handled one.

## Related

- [`../research/lennys-corpus-sweep-2026-08.md`](../research/lennys-corpus-sweep-2026-08.md) — the full evidence base
- [`../research/lennys-quote-verification.md`](../research/lennys-quote-verification.md) — quote audit, nine mis-filed archive files
- [`v11-guiding-star.md`](./v11-guiding-star.md) · [`moat.md`](./moat.md) — the canon this corrects


---

## §5K. Two founder rulings, 2026-08-11, after the outside-evidence test

Both came out of [`../research/market-validation-2026-08.md`](../research/market-validation-2026-08.md) §8, the lane that tested the category question outside Lenny's ecosystem.

### 1. Stop leading with the forecast. Lead with the governed record.

**The forecast stays as the moat. It stops being the opening line.**

**Lead with:** the governed record of agentic product work. When agents do the work, answering *"why did we decide this, on what evidence, and who signed off"* stops being a nicety and becomes the control that lets you let them run at all. That is a **recognised buying requirement with a named market**: AI governance platforms took an inaugural Gartner Magic Quadrant on 2026-06-16, a Forrester Wave in Q3 2025 and an IDC MarketScape in 2025-2026, and Gartner forecasts **$492M in 2026 growing 45.3% a year**.

**Then the forecast**, as what makes that record uniquely ours and cannot be rebuilt from chat logs.

**Why the order matters, and it is not cosmetic.** Corporate prediction markets at Google, Ford and a third firm were relatively efficient and beat expert forecasts by **up to a 25% reduction in mean-squared error** (Cowgill & Zitzewitz, *Review of Economic Studies*, 2015). **Google's markets died anyway.** The post-mortem (*Asterisk*, November 2024) records a Waymo VP saying cross-division metric transparency *"was counter to his division's goal to restrict information like this"*, and supply-chain managers who valued accuracy but did not personally benefit from it.

> **The mechanism works and gets rejected. A pitch that leads with *"we record what you predicted so it can be checked later"* is selling accountability to the person who would be held accountable.**

**So the surviving shape is:** the forecast is a **byproduct of doing the work**, not a submission to a scoreboard, and **its first consumer is the agent doing the next piece of work**, not a reviewing executive. Any surface that inverts that is reintroducing the Google failure.

### 2. Adopt "context graph" as the industry name for layer 03.

**ThoughtWorks Technology Radar Vol. 34, April 2026, techniques quadrant, Assess ring.** Its description: decisions, policies, exceptions, precedents, evidence and outcomes modelled as first-class connected nodes in a graph structured for AI consumption, where systems of record capture *what* happened and a context graph captures *why*, turning reasoning buried in chat threads and approval chains into a queryable structure.

**Where to use it and where not.**

| Surface | Use it |
| --- | --- |
| Docs, `AGENTS.md`, technical writing | **Yes.** It is the precise term and it is independent of the ecosystem all our other evidence came from. |
| A technical buyer, a CTO, an engineering-led evaluation | **Yes, and it is worth more there than any category we could invent.** "The layer we built is what ThoughtWorks named at Assess in April 2026" is a checkable, third-party sentence. |
| The hero, the 50-character line, a cold conversation | **No.** The hero's job is to be understood by a PM in four seconds, and this is a term that must be taught before it helps. |
| An accelerator or investor answer | **Sparingly**, as third-party validation of the layer, never as our category claim. |

**Two things it buys us and one it costs.** It gives the layer a name someone else coined, at a credible ring, recently enough that we are not late. It is outside the corpus this positioning was built from, which answers the generalisation question. **And it omits forecasts from its own enumeration**, which is either the gap we occupy or evidence nobody wants that part; §8.5 of the market validation argues the former, and the Google record is the reason to hold the claim carefully.

**What we do NOT do: claim "decision intelligence".** It is a real Gartner category with an inaugural Magic Quadrant in January 2026, and its Leaders are FICO, SAS, IBM, Quantexa, ACTICO and Aera, selling automated high-volume operational decisioning to credit-risk, fraud, pricing and supply-chain buyers. Claiming the name puts us in a bake-off on decision throughput and latency against companies that do nothing else. **That is worse than having no category.**
