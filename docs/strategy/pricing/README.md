# docs/strategy/pricing — the Pricing & Billing hub

> _Created: 2026-07-12. The single front door for everything about how Cadence prices, meters, and bills — credit model, BYOK, model access, tiers, and the technical rail. Every pricing/billing doc is listed here with its role; nothing pricing-related should live un-indexed._

> **START HERE:** [`pricing-architecture.md`](./pricing-architecture.md) is the finalized, end-to-end pricing architecture (the one system: credit model + BYOK + model access + metering + the 4-tier packaging). When it and any older pricing doc disagree, **pricing-architecture.md wins** once ratified. It is currently **PROPOSED — pending founder approval** (its §10); until then the 2026-06-26 calls in `pricing-strategy.md` still govern.

---

## The map (one source per need)

| If you need… | Pick this | Role |
|---|---|---|
| **THE finalized end-to-end pricing system** (credit model, BYOK, model access, metering, 4-tier packaging, worked economics) | [**pricing-architecture.md**](./pricing-architecture.md) ⭐ | the canonical finalized architecture (2026-07-12, PROPOSED). "Outcome Credits" (charge on delivery, no dollar-per-action, stop-free), platform-managed models default + enterprise-only BYOK with a thin margin-% fee, enterprise = committed credits + unlimited seats, tiers Free/Pro/Team/Enterprise |
| **WHY we price the way we do** (tier rationale, value matrix per tier, upgrade narrative, credit-pool architecture) | [**pricing-strategy.md**](./pricing-strategy.md) | the strategy layer (2026-06-26 4-tier decision + the full per-tier value matrix). Its enterprise-per-seat + flat-$0.25 BYOK calls are superseded by pricing-architecture.md on approval |
| **The market evidence** (8-platform competitor teardown + the per-surface free-vs-charged map) | [**credit-model-and-byok-research.md**](./credit-model-and-byok-research.md) | the research/evidence base behind the architecture (Lovable, Cursor, Replit, v0, Bolt, Devin, Windsurf, Copilot) |
| **The build tasks** (per-ID implementation of tenancy + monetization) | [**workspace-tenancy-and-monetization-plan.md**](../../planning/workspace-tenancy-and-monetization-plan.md) | the cross-tool implementation plan (board group G10); WM-M17 credit dropdown, WM-M19 enterprise usage |
| **The technical billing rail** (Stripe, checkout, webhooks, the pricing catalog) | [**billing.md**](../../features/billing.md) | how billing works at the code level; the free-vs-charged map + credit peg from pricing-architecture.md flow into here |
| **The credit engine** (debit / grant / top-up) | [**credits.md**](../../features/credits.md) | the credit debit/grant mechanics |
| **The decision log** (every pricing decision, dated) | [**session-decisions.md**](../session-decisions.md) | where each ratified pricing call is recorded, in the same session it's made |

## Standing rules
- **One source per need.** Strategy = `pricing-strategy.md`; finalized architecture = `pricing-architecture.md`; evidence = `credit-model-and-byok-research.md`; build tasks = the monetization plan; code rail = `billing.md`/`credits.md`. Do not duplicate across them.
- **Every pricing decision is recorded in `pricing-strategy.md` AND `session-decisions.md` in the same session** (the canon's maintainer rule).
- **New pricing/billing docs get added to this index** in the same commit — never orphaned.
- Parent entry points that route here: [`CLAUDE.md`](../../../CLAUDE.md), [`AGENTS.md`](../../../AGENTS.md), [`README.md`](../../../README.md), [`docs/README.md`](../../README.md), [`docs/strategy/README.md`](../README.md).
