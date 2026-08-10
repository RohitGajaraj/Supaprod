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

Measured on production lineage, demo workspaces excluded: 36 real `learning → decision` edges, and Decide's single largest inbound source is Learn, by 4× over opportunities.

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

## 6. Routed to the lanes

**Lane 1 (function/gaps):** forecast capture at decision time is the priority build — it is the only un-backfillable asset and it is one feature. Then confidence grades on outcome labels (30–40% of lift-showing experiments show no long-term lift; a p<0.05 result is wrong ~1 in 4). Intervention logging is wired but starved and begins accruing now.

**Lane 2 (UI/UX):** the register split governs vocabulary — operator-native words in the shop window, our vocabulary inside the product. Empty states show a **worked example** ("example" is the highest-frequency term in the corpus at 712/M) and promise a **sharpened call**, never a handled one.

## Related

- [`../research/lennys-corpus-sweep-2026-08.md`](../research/lennys-corpus-sweep-2026-08.md) — the full evidence base
- [`../research/lennys-quote-verification.md`](../research/lennys-quote-verification.md) — quote audit, nine mis-filed archive files
- [`v11-guiding-star.md`](./v11-guiding-star.md) · [`moat.md`](./moat.md) — the canon this corrects
