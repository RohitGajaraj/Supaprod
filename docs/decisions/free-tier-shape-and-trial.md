# Decision: the shape of Free, and whether to time-bound it

> _Last updated: 2026-08-04_

**The question (founder, 2026-08-04):** should Free be a **time-bound full-platform trial** (14 or 30 days, 750 credits, everything unlocked) instead of a permanently-capped tier?

**The decision: no, not as a replacement. Do both, layered.** Keep Free permanent and capped, and add a **14-day full-access trial that degrades into Free** rather than into a wall.

---

## Why not a pure time-bound trial

Three arguments. The first is specific to this product and I think it is decisive.

### 1. A 14 or 30-day window cannot demonstrate the moat

The claim is that Supaprod **learns from what actually happened, so next time it guides the call**. A shipped outcome takes **weeks to land**. That is not an implementation detail; it is the entire reason the decision layer has no fast oracle and therefore does not commoditize.

So inside a two-to-four week window a user experiences:

| | Layer | Visible in 14 days? |
| --- | --- | --- |
| 01 | the director | **Yes.** Signals in, ranked bets out. |
| 02 | the operating system | **Yes.** The loop runs, code ships. |
| 03 | the brain | **No.** There are no settled outcomes yet to learn from. |

**A trial would showcase exactly the two layers that are copyable, and expire before the one that is defensible could appear.** The prospect would evaluate us against Cursor and Linear on speed, which is the comparison we lose, instead of on compounding judgment, which is the one we win.

### 2. It converts a distribution asset into churn

Free users **share decisions by link, and the reader needs no account or seat**. That is a live viral surface: every shared decision is a landing page authored by a user. A hard wall at day 30 turns a permanent distribution surface into a churned account and a dead link.

### 3. The conversion trigger already exists, and it is better than a wall

**`FREE_MEMORY_RETENTION_DAYS = 30`.** Free memory already fades at thirty days.

That is a far stronger mechanic than an access wall, because it is **product-native**: the user watches the record begin to compound and then watches it fade, and the upgrade is literally *"stop it fading."* It tests the exact value proposition rather than manufacturing urgency around it. An access wall says "your time is up"; a fading record says "look what you are about to lose", and only one of those is an argument.

---

## Where the founder's instinct is right

**A capped Free may undersell, and that concern is real.** Three read-only connectors never shows **write-back**, and an agent opening the Linear issue and pushing the branch is the moment people actually believe this. A prospect who only ever sees ingestion has not seen the product.

## So: a trial that degrades, not a trial that expires

**14 days of full access at signup, then fall back to permanent Free.**

| Day | What they have |
| --- | --- |
| 0 to 14 | **Everything.** Unlimited connectors, write-back, no memory decay. Enough to see an agent act in their own tools. |
| 15 onward | **Free, permanently.** 750 credits, 3 read-only connectors, memory rolling 30 days. Not a wall. |
| The nudge | Around day 25 the earliest memory starts to fade. That is the conversion moment, and it is the real one. |

This is the standard modern pattern (Linear, Vercel, Notion all degrade rather than lock), and it resolves the tension: full power up front, no cliff, and the moat gets a chance to prove itself on a timescale it can actually be proved on.

**Half of it is already wired.** `TIER_PRESERVING_STATUSES` in `src/lib/billing-tier.ts` already treats Stripe's `trialing` as a paid state that mints credits, so a Stripe-managed trial needs no new billing logic.

---

## What is built and what is not

| | State |
| --- | --- |
| Free reads, capped at 3 connectors | **Shipped 2026-08-04.** `connectorTier: "read"`, `connectorLimit: 3`, enforced by `assertConnectorSlotAvailable`, 7 tests including one proven by planting the defect. |
| Memory fading at 30 days on Free | **Shipped.** `FREE_MEMORY_RETENTION_DAYS = 30`. |
| Stripe `trialing` preserving entitlements | **Shipped.** |
| **The 14-day full-access trial itself** | **Not built.** Needs: trial state on the account, an expiry job, the degrade-to-Free transition, and the in-product nudge. Tracked in [`../planning/SOURCE-OF-TRUTH.md`](../planning/SOURCE-OF-TRUTH.md). |

## If the founder still wants a hard time-bound Free

Then the honest version is **30 days, not 14**, and the reason is the same one as above: at 14 days no outcome has landed, so the product demos as a fast builder rather than as a compounding brain. Thirty days is the minimum where a first verdict can plausibly be settled and the loop visibly closes once. Below that we are selling the wrong two layers.

## Related

- [`../strategy/pricing/pricing-architecture.md`](../strategy/pricing/pricing-architecture.md), the tier matrix and credit model
- [`../../README.md`](../../README.md), the connector ladder and how it makes money
- [`../planning/SOURCE-OF-TRUTH.md`](../planning/SOURCE-OF-TRUTH.md), open findings
