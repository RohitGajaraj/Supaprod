# docs/strategy: which document to pick

> _Created: 2026-06-03 · Last updated: 2026-09-23_

**This file is the arbiter.** When two strategy documents disagree, this table decides. One source per question, and exactly one thing is current per question.

If you only need the product's positioning and the current claim, that is in [`../../README.md`](../../README.md) and you do not need this folder. Come here for the reasoning underneath it.

---

> **2026-09-23 — strategy reset, awaiting the founder's ruling.** The founder asked for an adversarial
> review of whether Supaprod should exist. [**strategy-reset-2026-09.md**](./strategy-reset-2026-09.md)
> recommends **stopping the product** and testing, for two weeks and with no product code, a pivot
> to independent validation of AI agents in regulated financial services. Until he rules, read it
> before starting any product work: every document below this line argues for a product it
> recommends stopping. His words the same day: *"Stop everything and build something new."*

## Three rulings that sit on top of everything below

Any document in this folder that contradicts one of these is wrong, whatever its version number.

**1. It learns and guides (2026-08-02).** Supaprod tells you what to build, builds it, ships it, checks what actually happened, and **learns from it, so next time it guides the call**. It does not "remember". Remembering describes storage and is not defensible; learning compounds because it needs the customer's own outcomes labelled over time. Banned framing: "where the record lives", "stores your decisions", "searchable history". Vocabulary table: [`../../README.md`](../../README.md).

**2. Governance is policy, not permission (2026-07-29).** Policy is set in advance and does not block; permission is asked in the moment and does. The human sets the boundaries and judges the few things that cross them. The gate is the exception, not the loop. His test: *"every approval, if it passes to a human, then what is the purpose of agents?"* **Where any document below assumes per-item human approval, this ruling wins.** Canonical: [`../planning/rebuild-2026-07/GOVERNANCE-PRINCIPLE.md`](../planning/rebuild-2026-07/GOVERNANCE-PRINCIPLE.md).

**3. The AI-native SDLC playbook is our framework (2026-08-31).** Anthropic published the standard shape of the pipeline we sit on, and the founder ruled we adopt it by default: *"they are the ones leading the industry, so we go with them and push back only where it does not fit."* **The burden of proof is on the refusal, and an unargued departure is drift.** What it does to us — strategically, tactically, and what it costs — is [**ai-native-sdlc-rewiring-2026-08.md**](./ai-native-sdlc-rewiring-2026-08.md); the item-by-item adoption register is [`../../the-first-run/SPEC-AI-NATIVE-SDLC.md`](../../the-first-run/SPEC-AI-NATIVE-SDLC.md). **The finding that matters: in six stages, ten artifacts and eighteen measures, nothing records a prediction before the outcome is known — the vendor published layers 01 and 02 and left 03 empty.**

**4. Six-month-forward (2026-08-01).** Design for where the industry will be six months out, and also close the pain the user carried from the past. Anything one frontier release could absorb is not a moat. Canonical: [`../../AGENTS.md`](../archive/agent-operating-manual.md).

---

## The role map

| If you need | Pick | Role |
| --- | --- | --- |
| **"Should Supaprod exist, and what instead?"** | [**strategy-reset-2026-09.md**](./strategy-reset-2026-09.md) | **The 2026-09-23 reset.** First principles, the adversarial questions, continue/narrow/pivot/stop on evidence, the YC rejection read carefully, five directions with the full field set, a validation plan with kill criteria and locked predictions, and what happens to the codebase. Research behind it: [`../research/README.md`](../research/README.md), "The strategy reset" |
| **Where we are, what is next** | [`../planning/SOURCE-OF-TRUTH.md`](../planning/SOURCE-OF-TRUTH.md) §0 | The live cursor. **No document in this folder tells you what to build next.** That is the SSOT's job, and mistaking a strategy doc for a queue is what produced the mess described at the bottom of this file. |
| **"Anthropic published an SDLC playbook — what does it do to us?"** | [**ai-native-sdlc-rewiring-2026-08.md**](./ai-native-sdlc-rewiring-2026-08.md) | **The strategic and tactical rewiring, with the case against.** Five shifts each priced with what they cost, ten tactical changes indexed to their gap numbers, an explicit kill list, and four ways this derails us — the likeliest being that a good framework becomes a reason to re-architect instead of ship. Also the industry-standard check: eight of nine gaps are already owned, and the one new item is A2A. **Read with [`../../the-first-run/SPEC-AI-NATIVE-SDLC.md`](../../the-first-run/SPEC-AI-NATIVE-SDLC.md), which is the register it indexes.** |
| **"What if Anthropic ships this tomorrow?"** | [**frontier-lab-defense.md**](./frontier-lab-defense.md) | **The single question most likely to end an investor conversation badly.** The old answer ("the labs decline this vertical") is falsified: Anthropic's CPO said on record he wants it. Carries the replacement, led by the fourteen months since he said it in which no product-decision system shipped, plus a dated tracker that expires the argument the day either lab moves. |
| **Category, ICP, the one job, what we refuse** | [**positioning-locked-2026-08.md**](./positioning-locked-2026-08.md) | **Founder-approved 2026-08-10, grounded in the full 679-document corpus read.** Supersedes v11's positioning sections where they disagree. Carries the category test, the AI-stance ICP targeting, the forecast claim, and the kill list. **Read before any outward copy.** |
| **Direction, moat, the core-user lens, market** | [**v11 Guiding Star**](./v11-guiding-star.md) | The standing direction canon (2026-06-23). Supersedes v7 to v10. **Three of its four moat asymmetries were falsified 2026-08-10 and are corrected in place.** |
| **The learning loop, foresight, the memory OS, design capability, journey coverage** | [**v12 Self-Improving OS**](./v12-self-improving-os.md) | The depth layer under v11 (2026-07-02, audit-grounded). v11 still wins direction. |
| **The moat, competitors, objection answers** | [**moat.md**](./moat.md) | Decision-layer thesis, the integrate/absorb/race/ignore map, the investor Q&A. |
| **Build, buy, or integrate a capability** | [**build-buy-integrate.md**](./build-buy-integrate.md) | The BBI gate. Operative summary: [`../../AGENTS.md`](../archive/agent-operating-manual.md) §1.5. |
| **What to build vs source, per capability cluster** | [**sourcing-map.md**](./sourcing-map.md) | 11 clusters, and the named provider behind each obviated item. |
| **Forward bets not yet queued** | [**horizon-bets.md**](./horizon-bets.md) | Links [`../features/decision-brain.md`](../features/decision-brain.md) and [`../features/command-canvas.md`](../features/command-canvas.md). |
| **Whether serving existing products is a repositioning** | [**brownfield-positioning-evaluation.md**](./brownfield-positioning-evaluation.md) | Answer: no. Brownfield is the shipped position (2026-08-07 ruling, tested against code and the live database). Holds the verified connector inventory: which providers are real, which are `stubAdapter`, and which of the three tier gates actually enforces. |
| **The BYO repo model and managed runtime** | [**byo-build-and-supaprod-cloud.md**](./byo-build-and-supaprod-cloud.md) | Provider-agnostic repos, autonomous Build to Ship. |
| **Who actually writes the code** | [**build-driver-and-dispatch.md**](./build-driver-and-dispatch.md) | The `BuildDriver` seam. Read with the 2026-07-22 **own-engine ruling**: the harness is ours and models plug in as commodities. Never say we dispatch work to Cursor, Lovable or Devin. |
| **Pricing, billing, credits, BYOK** | [**pricing/**](./pricing/README.md) | Start at `pricing-architecture.md`. |
| **Why a decision was made** | [**session-decisions.md**](./session-decisions.md) | The decision log. |
| **The raw reasoning, and the fundraising narrative** | [**strategic-inputs-log.md**](./strategic-inputs-log.md) | Source reasoning behind the canon, preserved in original form. |
| **How this project is run, philosophically** | [**founding-constitution.md**](./founding-constitution.md) | The co-founder posture and mandates. Context, not rules; rules are in `AGENTS.md`. |
| **Pitching, demoing, applying** | [**../pitch/**](../pitch/README.md) | The Pitch Room. Outward-facing content is updated there in place, never copied. |
| **Market and competitor evidence** | [**../research/**](../research/) | Dated primary sources. Cite artifacts and companies, never gurus. |
| **The agent roster, faces, and how agents are shown** | [**../features/agent-experience.md**](../features/agent-experience.md) | Resolves the historical 19-agent mesh into the shipped cast. |

---

## Archived, and why

Everything in [`archive/`](./archive/) is history. It is kept so a decision can be traced, never as authority.

| Archived | Was | Why it went |
| --- | --- | --- |
| [`archive/v13-proof-campaign.md`](./archive/v13-proof-campaign.md) | The Proof Campaign, 2026-07-10 | **Its schedule expired.** It told every reader to ship publicly in **under 25 days** counted from 2026-07-10, with the YC application after launch. The public launch date is now **September 2026**. Its honest-state read and its frontier-lab defense are still worth reading; its dates are actively misleading. The research beneath it survives in [`../research/launch-research-briefs.md`](../research/launch-research-briefs.md). Its execution plan moved to [`../planning/archive/v13-proof-campaign-plan.md`](../planning/archive/v13-proof-campaign-plan.md). |
| [`archive/v10-master-blueprint.md`](./archive/v10-master-blueprint.md) | Screen-by-screen blueprint and the build pick-list | v11 for direction, the SSOT for what to build, and the **2026-07-28 rebuild-from-zero**, which revoked every surface it specified. Its plan moved to [`../planning/archive/v10-implementation-plan.md`](../planning/archive/v10-implementation-plan.md). |
| [`archive/v9-decision-wedge-and-build-next.md`](./archive/v9-decision-wedge-and-build-next.md) | The Critic-teardown wedge, competitor posture | v11 and [`moat.md`](./moat.md), which carry both forward. |
| [`archive/v8-calm-front-deep-engine.md`](./archive/v8-calm-front-deep-engine.md) | Structure, IA, the hybrid Build spine | The **seven-station route model** (2026-08-01) replaced its five-surface IA, and [`../design/DESIGN-SYSTEM.md`](../design/DESIGN-SYSTEM.md) replaced its surface map. Its Engine-Room doctrine survived and lives in [`../conventions/engine-room-doctrine.md`](../conventions/engine-room-doctrine.md). |
| [`archive/v7-agentic-product-os.md`](./archive/v7-agentic-product-os.md) | Positioning and market detail | v11, and the current claim in [`../../README.md`](../../README.md). |
| `v1` to `v6`, `v4-stress-test`, `v5-chief-of-staff` | Earlier positioning, the wedge UX, the adversarial review | v11. |
| [`archive/v4-feature-map.md`](./archive/v4-feature-map.md) | The engine and agent-mesh map | Superseded for positioning, but it is still **the fullest description of the agent mesh, the handoff contract and the HITL gate matrix**. Read it for that alone. |
| [`layer-2-build-question-2026-08.md`](./layer-2-build-question-2026-08.md) | **Should Supaprod generate the code too, like Lovable and Replit?** (2026-08-26, proposal, founder ruling pending). The answer is no to codegen — that market is over $48B and our neutrality is what makes layers 1 and 3 valuable — **yes to owning the handoff**, which is what Build already is and has never finished, and one exception that is not optional: a sandboxed first-party build path so a run can close and a stranger can see a full loop with zero setup. Ends with the single ruling being asked for. |

---

## The lesson this folder is now organised around

Until today this README declared **seven documents simultaneously current**: v7 (positioning), v8 (structure), v9 (decision lens), v10 (blueprint), v11 (direction), v12 (depth), v13 (campaign). Each was marked with a star, and each carried its own precedence note explaining which of the others it did and did not beat.

To know whether one sentence applied, a reader had to hold five precedence rules in their head at once. In practice nobody did, so an agent picked whichever document it happened to open, and stale instructions kept getting executed. The 25-day launch in v13 was still being read as current three weeks after it lapsed.

**A version number is not a decision, and a star is not a hierarchy.** So:

- **Do not open a v14.** New strategic thinking updates [`v11-guiding-star.md`](./v11-guiding-star.md) in place, or lands in [`session-decisions.md`](./session-decisions.md) and [`strategic-inputs-log.md`](./strategic-inputs-log.md).
- **One current document per question**, as in the table above. If you find yourself writing "this wins on X but that still wins on Y", you are building the same trap again. Merge them instead.
- **Anything with a schedule in it decays.** Put dates in the SSOT, which is maintained, not in a strategy doc, which is not.

## The standing rules for this folder

- **Never orphaned.** A new strategic input is captured in `strategic-inputs-log.md`, distilled into the canon it changes, and logged in `session-decisions.md`, all in the same session.
- **The ripple review.** When positioning or the moat shifts, re-check pricing and gating, feature priority, IA and messaging, and the tests in the same session. A reposition is never a one-time patch. Checklist: [`moat.md`](./moat.md) §11.
- **Carry the reasoning, not just the conclusion**, so an investor question can be answered by reference.
- **Outward-facing content routes to [`../pitch/`](../pitch/README.md)** in the same session, updated in place, with `PROVEN` / `WIRING` / `ROADMAP` tags on claims.
