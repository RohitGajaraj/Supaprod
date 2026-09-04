# docs/strategy/pricing — the Pricing & Billing hub

> _Created: 2026-07-12. The single front door for everything about how Supaprod prices, meters, and bills — credit model, BYOK, model access, tiers, and the technical rail. Every pricing/billing doc is listed here with its role; nothing pricing-related should live un-indexed._

> **START HERE:** [`pricing-architecture.md`](./pricing-architecture.md) is the finalized, end-to-end pricing architecture (the one system: credit model + BYOK + model access + metering + the 4-tier packaging). When it and any older pricing doc disagree, **pricing-architecture.md wins** once ratified. It is currently **PROPOSED — pending founder approval** (its §10); until then the 2026-06-26 calls in `pricing-strategy.md` still govern.

---

## The map (one source per need)

| If you need… | Pick this | Role |
| --- | --- | --- |
| **THE finalized end-to-end pricing system** (credit model, BYOK, model access, metering, 4-tier packaging, worked economics) | [**pricing-architecture.md**](./pricing-architecture.md) ⭐ | the canonical finalized architecture (2026-07-12, PROPOSED). "Outcome Credits" (charge on delivery, no dollar-per-action, stop-free), platform-managed models default + enterprise-only BYOK with a thin margin-% fee, enterprise = committed credits + unlimited seats, tiers Free/Pro/Business/Enterprise |
| **WHY we price the way we do** (tier rationale, value matrix per tier, upgrade narrative, credit-pool architecture) | [**pricing-strategy.md**](./pricing-strategy.md) | the strategy layer (2026-06-26 4-tier decision + the full per-tier value matrix). Its enterprise-per-seat + flat-$0.25 BYOK calls are superseded by pricing-architecture.md on approval |
| **How the MEMORY layer is packaged across the ladder** (per-tier promise, what is enforced today vs roadmap, the open founder calls) | [**memory-tier-ladder.md**](./memory-tier-ladder.md) | the packaging spec for the compounding-memory layer (2026-08-02, updated the same evening): own memory on free/pro/max where sharing is a no-op not a paywall, workspace-shared memory with attribution on team/Business as the upgrade trigger, **the workspace claim as the departure motion and the reason the upgrade exists** (two-sided consent, inventory before consent, 14-day offer expiry, 7-day claimant release window, admin trail, and a hard tier gate on Business/Enterprise), the enterprise org-brain governance layer as roadmap, the gaps that constrain pricing-page wording (including the claim's audit trail cascading on workspace deletion), and the unresolved conflict that `crossWorkspaceMemory` already ships to every paid tier. Its commercial narrative lives in the Pitch Room: [`../../pitch/compounding-memory-narrative.md`](../../pitch/compounding-memory-narrative.md) |
| **What we sell once a workspace holds more than one product** (the multi-product ruling, why there is no per-product price, and where isolation sits on the ladder) | [**multi-product-and-isolation.md**](./multi-product-and-isolation.md) | DECIDED 2026-08-19, not built. **Products are free; isolation and governance are what we sell**, because a second product's marginal cost is consumption and consumption is already metered. Grounded in the measurement that **11 of 17 workspaces already hold more than one product**. Adds no pricing axis: it extends the locked "the higher base buys governance, not capacity" principle to the boundary that appears with a second product. Also records two conflicts in the existing canon it found: the seats-free-versus-per-seat contradiction between `pricing-architecture.md` §6b and the README, and an unverified credit-to-COGS calibration |
| **The market evidence** (8-platform competitor teardown + the per-surface free-vs-charged map) | [**credit-model-and-byok-research.md**](./credit-model-and-byok-research.md) | the research/evidence base behind the architecture (Lovable, Cursor, Replit, v0, Bolt, Devin, Windsurf, Copilot) |
| **The build spec** (per-task WHAT/WHY/INCLUDES any agent can pick up) | [**implementation-plan.md**](./implementation-plan.md) | the agent-pickup-able build plan (Groups A–E, PR-A1…PR-E2) for the finalized architecture; not built here, and not yet on the dashboard until greenlit |
| **The build tasks** (per-ID implementation of tenancy + monetization) | [**workspace-tenancy-and-monetization-plan.md**](../../planning/initiatives/workspace-tenancy-and-monetization-plan.md) | the cross-tool implementation plan (board group G10); WM-M17 credit dropdown, WM-M19 enterprise usage |
| **The technical billing rail** (Stripe, checkout, webhooks, the pricing catalog) | [**billing.md**](../../features/billing.md) | how billing works at the code level; the free-vs-charged map + credit peg from pricing-architecture.md flow into here |
| **The credit engine** (debit / grant / top-up) | [**credits.md**](../../features/credits.md) | the credit debit/grant mechanics |
| **The decision log** (every pricing decision, dated) | [**session-decisions.md**](../session-decisions.md) | where each ratified pricing call is recorded, in the same session it's made |

## The reasoning chain — how we got here, why, and the downsides (read this to understand the "why")

Nothing in this folder is a bare conclusion; every decision traces to evidence and carries its trade-off. The chain, in order:

1. **Groundwork / the evidence** → [`credit-model-and-byok-research.md`](./credit-model-and-byok-research.md): an 8-platform competitor teardown (Lovable, Cursor, Replit, v0, Bolt, Devin, Windsurf, Copilot — primary-source-grounded, with confidence flags) + a per-surface free-vs-charged map for Supaprod. **This is the raw research; do not delete or shortcut it — it is why the recommendations are defensible, not opinion.**
2. **The market realities we priced against** → [`pricing-architecture.md`](./pricing-architecture.md) §9: 2026 inference costs + the trend (why the flat $0.25/1M BYOK fee is now structurally broken), how the Perplexity-style "include the models, no BYOK" players meter, and the fair-vs-gameable analysis of non-token credit models.
3. **The first principles + the decision** → `pricing-architecture.md` §1 (what problem / who for / how it should feel) → §2–§6 (the credit model, model access, BYOK, enterprise pricing, the 4-tier packaging).
4. **The downsides / risks we accepted** → `pricing-architecture.md` §9d (the Forbes/Parloa "outcome-based pricing myth" — efficiency capture, attribution debates, definition-gaming) + the "⚠ strongest risk" section in the research doc (spend-without-a-click, the Bolt "hidden cost" trap) + the friction traps the founder surfaced (per-action dollar anxiety, stopped-work billing, BYOK dual-metering) and how §2/§4 defuse each.
5. **The rationale for each tier** → [`pricing-strategy.md`](./pricing-strategy.md) §3 (the value matrix + upgrade narrative — the felt reason to move Free→Pro→Business→Enterprise).

So the honest answer to "why did we choose this, and what does it cost us?" lives in the docs, interlinked — not just the "what."

## Standing rules

- **One source per need.** Strategy = `pricing-strategy.md`; finalized architecture = `pricing-architecture.md`; evidence = `credit-model-and-byok-research.md`; build tasks = the monetization plan; code rail = `billing.md`/`credits.md`. Do not duplicate across them.
- **Every pricing decision is recorded in `pricing-strategy.md` AND `session-decisions.md` in the same session** (the canon's maintainer rule).
- **New pricing/billing docs get added to this index** in the same commit — never orphaned.
- Parent entry points that route here: [`CLAUDE.md`](../../../CLAUDE.md), [`AGENTS.md`](../../archive/agent-operating-manual.md), [`README.md`](../../../README.md), [`README.md`](../../README.md), [`README.md`](../README.md).
