# Multi-product, isolation, and what we actually sell

> _Created: 2026-08-19 · Last updated: 2026-08-19_

> **Status: DECIDED, not built.** The commercial ruling for what happens when one workspace holds more than one product. Founder asked for the decision and its reasoning to be recorded now, and for implementation to wait. Nothing here is scheduled.
>
> Extends [`pricing-architecture.md`](./pricing-architecture.md), which remains the locked system. **This adds no pricing axis.** It answers a boundary question that did not exist when that document was written.

---

## The decision, in one line

**Products are free. Isolation and governance are what we sell.**

A second product costs more **credits**, and credits are already the meter. Charging separately for the product would bill the same thing twice.

---

## Why this question exists now

**Multi-product is already the majority state, not a future case.** Measured 2026-08-19:

| | |
| --- | --- |
| Workspaces with more than one product | **11 of 17** |
| Workspaces with four products | **7** |

And the schema is already asymmetric about it:

| Carries `product_id` | Does **not** |
| --- | --- |
| `signals` · `themes` · `opportunities` · `decisions` · `prds` · `rag_chunks` · `connection_bindings` · **`credit_ledger`** | `learnings` · `agent_memory` · `house_rules` · `agent_autonomy` |

**Evidence carries a product. Everything learned from it drops one.** The product ruling for that is [`../../planning/initiatives/agent-first-platform.md`](../../planning/initiatives/agent-first-platform.md) §2.3. This document is the commercial half.

---

## Why not charge per product

**Because it double-charges, and this company has already made that exact mistake once.**

The retired credit-band picker priced capacity twice and produced two visible defects on the live page: Pro defaulting to 100 credits against a Free tier granting 750, and a top band rendering **"$2000/mo" for volume whose underlying cost is about $2**. `pricing-architecture.md` records the correction — price is flat per tier, and capacity moved to top-ups where it belongs.

A per-product fee is the same error in a different dimension:

- **The marginal cost of a second product is consumption**, and consumption is metered. A team running three products runs more missions, spends more credits, and buys a bigger pool. That is the model working.
- **A product is not a cost centre, it is a folder.** There is no per-product infrastructure, no per-product model call, no per-product storage tier. Charging for one would be charging for a row.
- **It taxes exactly the behaviour we want.** A PM who brings their second and third product into Supaprod is the expansion motion. A per-product fee makes them consolidate three products into one to avoid the charge, which corrupts the evidence boundary and makes the director worse.

> **The measured unit economics support this.** Total AI spend across the product's life is **$16.55 over 56,813 model calls** — **$0.338 per completed mission** against a planning assumption of $0.50, and **$0.0097 per agent run**. Consumption is the cost, it is small per unit, and it already scales with product count on its own.

---

## What we sell instead

The principle is already locked and this only extends it. `pricing-architecture.md` §6b: *"the higher base buys the governance/collaboration layer, not capacity."* **Multi-product isolation is governance.** It arrives at the boundary that appears the moment a workspace holds a second product.

| Tier | What multi-product buys | Why it sits here |
| --- | --- | --- |
| **Free / Pro** | Unlimited products, each with its own evidence boundary. Evidence never crosses | Safety is not a paid feature. A solo PM with three side products must not have them contaminate each other |
| **Business** | **Cross-product governance.** Who may promote a lesson from one product to the whole workspace; per-product connector binding; per-product spend visibility | This is collaboration and control, which is exactly what the Business base already buys |
| **Enterprise** | **Provable isolation.** A cross-product audit showing nothing crossed, per-product connector credentials, and admin control over which products may share a brain at all | An agency or a regulated multi-product org needs the guarantee in writing, not the behaviour by default |

### The three things that make this real rather than a slide

1. **Evidence never crosses, at any tier, including Free.** A measurement in product A is not true of product B. This is correctness, not packaging, and pricing it would be selling a bug fix.
2. **Method crosses only by a deliberate, recorded act.** A lesson graduating from one product to the workspace goes through `memory_candidates → house_rules`, which already carries a `pending → approved` flow. **Who may approve that is the Business feature.**
3. **Provable is different from actual.** Business gets the boundary. Enterprise gets the **audit that demonstrates the boundary held**, which is a different product and a genuinely harder one.

---

## The agency case, which is the one that decides it

One workspace, three **clients'** products, signals arriving from the same Intercom and the same PostHog.

If evidence crosses products here, it is not noise — **it is one client's data informing another client's roadmap**, which is a confidentiality breach and a contract problem. That single scenario is why the default is product-scoped rather than workspace-scoped, and why "provable isolation" is a real Enterprise line rather than a manufactured one.

It is also a segment worth naming: agencies and consultancies are multi-product by construction, they already pay for tooling per client, and they are the buyer for whom the audit is the product.

---

## What this changes commercially

**Nothing about the four tiers, the credit meter, or the prices.** What it changes:

- **Expansion stops being seat-shaped and becomes product-shaped.** The natural growth path is a PM bringing a second product in, which raises consumption without a plan change, and eventually needs governance — which is the Business upgrade trigger. That is a healthier motion than counting people.
- **There is a nameable Enterprise trigger that is not headcount.** "We need to prove product A's evidence never reached product B" is a procurement-legible requirement.
- **Per-product cost reporting becomes sellable, and it is nearly free to build.** `credit_ledger` **already has `product_id`** — and **0 of 13,788 entries populate it.** Stamping that column answers *"what does product B cost us"* from data we are already writing. Today that question cannot be answered at all.

---

## What has to be built, and what it depends on

Not scheduled. Recorded so the work is known when it is picked up.

| # | Work | Kind | Note |
| --- | --- | --- | --- |
| 1 | Stamp `product_id` on `credit_ledger` writes | small | The column exists and is never populated. Unlocks per-product cost |
| 2 | `product_id` on `learnings` and `agent_memory` | migration | Without it, evidence cannot be scoped at all |
| 3 | `resolveMemoryScope` | pure logic | Queue item **K-73** |
| 4 | Product-scoped retrieval in Ask | client | Queue item **K-74**. `retrievalProductId` exists and the pane never sets it |
| 5 | The promotion surface | component | Queue item **K-75** |
| 6 | `workspace_id` on `agent_autonomy` | migration | Autonomy is keyed per user, so a graduated agent arrives untrusted for the next person |
| 7 | Cross-product audit | Enterprise feature | The provable half. Needs 1, 2 and 5 first |
| 8 | Entitlement for who may promote | billing | The Business control. Needs 5 |

---

## Two conflicts in the existing canon, found while writing this

Recorded rather than resolved, because both need the founder.

**1. Seats: the canon contradicts itself.**
[`pricing-architecture.md`](./pricing-architecture.md) §6b is marked **LOCKED 2026-07-12**: *"One meter: credits. **Seats are never a price lever, at any tier**"*, with **unlimited members** at Business. [`../../../README.md`](../../../README.md), updated 2026-08-10 and therefore newer, states Business is **"$50 per seat/mo, minimum 2 seats"** and explains why it is per seat. **Both are current documents and they cannot both be right.** Anyone quoting pricing outward is currently choosing between them by accident.

**2. The credit-to-COGS calibration is unverified.**
`pricing-architecture.md` §6c assumes internal COGS of **~$0.05 per credit**. Measured across all history: **87,482 credits debited against $16.55 of AI spend.** Those do not reconcile, and the gap is large enough that it is a measurement problem rather than a rounding one — credits are debited for things beyond model calls, and no one has calibrated the two against each other. **The per-mission figure does hold** ($0.338 measured against $0.50 assumed), so the tier sizing is safe; the per-credit figure should not be quoted until it is re-derived.

---

## Related

- [`pricing-architecture.md`](./pricing-architecture.md) — the locked system this extends
- [`pricing-strategy.md`](./pricing-strategy.md) — the value matrix per tier
- [`memory-tier-ladder.md`](./memory-tier-ladder.md) — how memory differs by tier
- [`../../planning/initiatives/agent-first-platform.md`](../../planning/initiatives/agent-first-platform.md) §2.3 — the product ruling this prices
- [`../../operations/kiro-queue.md`](../../operations/kiro-queue.md) Group K — the buildable half
