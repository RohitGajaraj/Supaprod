# The customer voice — the pain, in their own words, named and dated

> _Created: 2026-08-11 · Lane 0 · **This is the answer to "have you talked to your users?"** Every quote below is a working practitioner describing this pain unprompted, with a name and a date, drawn from a full read of 679 documents (5,935,025 words) plus a members-only community of ~30,000 product managers. **Read the limitation in §5 before using any of it.**_

**The honest framing, and use it exactly.** We have run **zero first-party discovery interviews** — that stays true and is never dressed up ([`../pitch/applications/answer-bank.md`](../pitch/applications/answer-bank.md) customer-evidence rule). What we have instead is **the largest primary-source read of this market anyone in our position has done**: not a survey we wrote and not a summary we bought, but practitioners talking to each other, read in full.

**Say it this way:** *"I haven't run discovery interviews. I read 679 primary sources and a private community of thirty thousand product managers, in full, and they named the pain in words better than mine."* That is a stronger answer than a padded interview count, and it is checkable.

---

## 1. The pain, named by a practitioner better than we ever named it

**Subir, in a private community thread on AI and product operating models, 2026-06-14, unprompted:**

> *"Everyone's focused on the build side, but the real shift is on the decision side. **AI can accelerate delivery fast enough that the bottleneck moves.** The teams I've seen get into trouble post-AI aren't the ones with slow pipelines. They're the ones where **PMs got faster at shipping but didn't get better at defending why. The judgment gap got exposed.**"*

He then asks the room the question our product answers: *"What's the decision that's actually gotten harder for your team now that you can build faster?"*

**Two corroborations in the same thread.** ash maguire: *"If the team doesn't have clarity on goals, priorities, decisions, and ownership, **AI basically accelerates confusion.**"* And Bal Sieber, 2026-06-27, naming what does not compress: *"**deciding what's worth doing, defining what good looks like, and catching when the system is confidently wrong. Less operator, more director.**"*

---

## 2. Nine independent clusters, four years, all reaching for a folder

Not one thread. **Nine clusters, spanning 2022 to 2026**, of practitioners reaching for markdown and scripts rather than a product — and the search stopping there.

| # | Who / when | What they said or did |
| --- | --- | --- |
| 1 | **Tolga**, 2026-05-02 | *"I have tried 3 or 4 LLM-powered mind map tools. Unfortunately, none of them worked well for me. Since then I have been using **a decent Obsidian folder structure**, and I don't experience that problem much anymore."* **A plain folder beat four purpose-built tools.** |
| 2 | **Six PMs**, 2026-07-25 | Talked a buyer out of the category outright: don't switch, use simpler tools, two systems of record create friction. Their sharpest argument: **simple files work better with AI because an agent reads and writes them easily.** |
| 3 | **Aaron Nichols**, 2026-06-20 | Tried a folder, abandoned it, **built his own and still failed.** Could not tell *who changed what · which notes to trust · why they changed · how to stop the ones that shouldn't.* Verdict: *"it's very difficult to apply the kind of governance that makes it work."* |
| 4 | **Jon Roemer**, 2026-06-06 | *"Use the non-deterministic system to create a deterministic system… encode the exact queries in the Markdown itself."* |
| 5 | **Timo Laak**, 2026-06-20 | Keeps MCP servers *"mainly disabled"* in a large org because they *"eat too much of the context."* |
| 6 | **Milko**, 2026-05-24 | Dates the shift, and it runs **away** from buying: *"a year ago I would go with offloading it, but now it sounds pretty easy to **keep it in our codebase and manage it with agents**."* |
| 7 | **Jeanne DeWitt Grosser**, COO Vercel, 2025-11-30 | Built a lost-deal analyser over Slack, email and call recordings **in two days**, running for ~$1,000/year against a $1M+ salary line. *"It's not that hard to build these agents and they aren't that expensive either."* |
| 8 | **Claire Vo**, three-time CPO, 2026-08-05 | Built a PR-governance agent scoring six risk dimensions — including **reversibility**, our own gating principle — **in one Codex session**, and published the recipe. |
| 9 | **A Series E company**, 1,500+ employees, 2026-07-04 | Staffing a **dedicated PM** to build a spec-driven AI SDLC internally, with org-wide adoption plan and KPIs. |

**Plus:** ~95 episodes of *How I AI* are operators demonstrating hand-built harnesses; **Younes Abouelnagah shipped a competing memory-lifecycle tool publicly** (`fava-trails.org`, promotion gates and pruning); and every named pre-AI lifecycle in the corpus — Miro, Notion, Amazon, Shopify, Atlassian, Coda, Ramp — was **hand-run**.

### What the pattern actually says, and it is the whole GTM

**Every DIY success is one person managing their own context. Every DIY failure is the moment a second person or a fleet of agents touches it.**

> **We do not sell "better than your folder." We sell the moment the folder stops working.**

---

## 3. The product spec, written by practitioners who have never heard of us

**Brandon Parker**, advising the Series E build, 2026-07-04:

> *"the prompt is rarely the hard part. **Context governance is.** Agents fall apart when they can't tell what's **current vs. stale, canonical vs. just-discussed, decided vs. still-needs-a-human**."*
>
> *"**The KPI I'd watch isn't speed. It's rework:** clarification loops, reopened tickets, spec/design mismatches, review burden, first-pass acceptance."*
>
> *"'Here's what I used, what changed, what I think is true, and how to verify it' beats a flashy demo."*

That middle sentence is our bi-temporal supersession graph described as an **unmet need**. The KPI line is better than anything in our own canon.

**Brian Kim**, same thread, describing what his team built: *"…operating our AI agents on top of **this shared brain of the project**… populated by sales/prod ops/customer success and then used by GTM/support… and **the audit trail as to why should be clear**."*

**Kira M Allen**, 2026-07-25, on why human sign-off is durable rather than friction:

> *"It's what makes the output trustworthy enough to use at all. When a clinician or attorney signs, they're not double-checking the AI. **They're accepting liability, and that acceptance is the product**… isn't the accountability the actual product, and the AI just the thing that makes it cheaper to produce?"*

---

## 4. The market's own numbers on how this feels

**Annual tech-worker sentiment survey, 2026-07-07** (second annual, run at scale — the freshest large-N data available to us):

| | |
| --- | --- |
| **82%** | say AI makes them measurably more productive |
| **55.7%** | report significant burnout — up from 44.7% |
| **51%** | fear *"expected to do more for the same pay"* — **the #1 fear** |
| **41%** | fear **work quality declining** |
| **22%** | fear losing their job to AI — and the correlation with layoff worry is **r = +0.05, effectively zero** |

> *"I can do more, faster, but not better."*
> *"I feel like I don't think hard enough anymore — **I just follow Claude**."*

**Read: speed is solved and it is what is hurting them.** Any pitch promising more throughput sells the disease. **Sell relief and judgment integrity.**

**Segmentation that beats every demographic:** AI-identity stance predicts career optimism (β = +0.39) and field recommendation (β = +0.60) **more than role, seniority and company size combined.** Energized **41%** + Conflicted **35%** = our addressable **76%**. The Resentful **12%** are defined by feeling *pressured* to use AI and will never buy — so any copy implying obligation repels them **and** the burned-out majority.

---

## 5. ⚠️ The limitation. State it before anyone finds it.

**All of the above comes from ONE ecosystem.** Lenny Rachitsky's world is PM-adjacent, US-centric, early-adopter-skewed, and **self-selects for people who enjoy building their own tools. A corpus of tinkerers over-reports tinkering.**

**Binding rule: this evidence is strong enough to change how we talk, and not yet strong enough to change what we build.** That is exactly what was done — positioning moved, the roadmap did not.

**If an investor asks how we know it generalises, the honest answer is that we are testing it**, not that we already know: [`market-validation-2026-08.md`](./market-validation-2026-08.md) tests the same theses against funding, hiring, analyst and build-vs-buy data from outside this world. **Volunteering the limitation before being asked is worth more than the finding itself.**

## Related

- [`lennys-corpus-sweep-2026-08.md`](./lennys-corpus-sweep-2026-08.md) — the full evidence base and every verdict
- [`../strategy/positioning-locked-2026-08.md`](../strategy/positioning-locked-2026-08.md) — what this evidence changed
- [`../strategy/frontier-lab-defense.md`](../strategy/frontier-lab-defense.md) — the "what if Anthropic ships it" answer
