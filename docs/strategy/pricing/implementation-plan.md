# Pricing architecture — implementation plan (build spec, per task)

> _Created: 2026-07-12. The precise, agent-pickup-able build plan for the FINALIZED pricing architecture ([`pricing-architecture.md`](./pricing-architecture.md)). This is the WHAT/WHY/INCLUDES for each build task — any agent can pick one up and know exactly what to build and why, without re-reading the whole conversation. It does NOT build anything; it specifies the build._

> **Read first:** [`pricing-architecture.md`](./pricing-architecture.md) (the finalized design + the reasoning) and [`pricing-strategy.md`](./pricing-strategy.md) §3 (the per-tier value matrix, unchanged). Existing implementation context: [`../../features/billing.md`](../../features/billing.md) (Stripe rail), [`../../features/credits.md`](../../features/credits.md) (debit/grant engine), [`../../planning/workspace-tenancy-and-monetization-plan.md`](../../planning/workspace-tenancy-and-monetization-plan.md) (WM-M17/M18/M19 — the existing monetization build). Much of the tier/credit scaffolding already exists (entitlements, credit dropdown, Stripe catalog, credit_caps); these tasks are the **deltas** to reach the finalized model.

> **Status: build-ready spec. NOT YET on the feature dashboard as claimed rows** — add a group (suggested `G-PRICE`) when the founder greenlights the build. The exact numbers (prices, allowances, the BYOK %) are founder-config, set in Stripe/admin; they do not block any task below.

---

## How to hand this to a coding agent (founder guide)

To have another agent build this without you re-explaining anything, give it a prompt like:

> _"Build the Cadence pricing architecture. The finalized design is `docs/strategy/pricing/pricing-architecture.md` (read it + `credit-model-and-byok-research.md` for the WHY — do NOT change the design, it's finalized). The per-task build plan is `docs/strategy/pricing/implementation-plan.md` — work the tasks in the build order (PR-A1 first). For each task: implement it, gate it (tsc + build + tests), commit with a WHY, and push. The exact numbers (prices, allowances, the BYOK %) are config I set in Stripe/admin — leave TODOs, don't block on them. Claim each task on the feature dashboard (group G-PRICE) before starting so parallel lanes don't collide."_

The agent has everything it needs from those two files: **what** to build (the task cards), **why** (the reasoning chain in the architecture doc), and the **order**. The tasks are self-contained (each lists its `touches`/`depends`), so an agent can pick up any unblocked task cold. See the `G-PRICE` rows in [`../../planning/feature-dashboard.md`](../../planning/feature-dashboard.md) once greenlit — those are the claimable units.

## The build, in one line
Turn the finalized architecture into product: **seats-free credits** metered **only on delivered artifacts** (never a per-action dollar), **platform-managed models** for everyone with **enterprise-only BYOK**, the **Free/Pro/Business/Enterprise** packaging, and the **top-ups + PAYG + guardrails** that keep it fair — reusing the existing credit/billing/entitlements engine wherever possible.

---

## Group A — Credit metering (the core: charge-on-delivery, no dollar exposure)

### PR-A1 — Charge only on delivered artifacts; stop/abandon = free
- **What:** move the credit DEBIT from "AI call issued" to "artifact delivered." A mission/PRD/build/deep-research that is stopped, abandoned, retried, or fails is **not** debited; only a completed, delivered artifact debits.
- **Why:** the founder's friction test — "it burned an hour then charged me for nothing" is the #1 resentment (Bolt/Replit). Nothing is spent until something is delivered (pricing-architecture §2 Rule 2).
- **Includes:** debit hooks fire on the deliverable-complete event, not per AI call; a stopped run rolls back / never holds; the cheap-routed COGS of abandoned runs is absorbed (not billed). Idempotent (one artifact = one debit, no double-charge on retry).
- **Touches:** `src/lib/credits.functions.ts` (debit path), the agent loop completion (`src/lib/ai/loop.server.ts`), the mission/artifact completion events.
- **Depends:** none (foundational).

### PR-A2 — The free-vs-charged surface map
- **What:** classify every `CallSurface` as CHARGED (agent, studio/Build, chat, copilot, prd, discovery, brief, decision, sense) or FREE (eval, judge/Critic, self-improve, guardrails, injection screening, embed, scheduler, test), enforced at the chokepoint.
- **Why:** "pay for output you keep; Cadence pays to keep it honest." Charging for the verification layer would suppress the moat (pricing-architecture §4 map).
- **Includes:** a `chargeable: boolean` (or surface→policy map) consulted by the debit path; FREE surfaces never debit; `sense` is CHARGED-but-GOVERNED (see PR-D2).
- **Touches:** `src/lib/ai/runtime.server.ts` (the `CallSurface` chokepoint), `credits.functions.ts`.
- **Depends:** PR-A1.

### PR-A3 — Coarse, legible credit sizing (mission ≈ ~10 credits)
- **What:** set the per-artifact credit cost to the coarse scale (mission ≈ 10, build ≈ 20–30, everyday ≈ 0), replacing any fine-grained/token-derived sizing. Internal COGS peg ≈ $0.05/credit.
- **Why:** fixes the canon's "150–400 credits/mission" inconsistency (made Pro's base unrunnable); coarse credits are legible (pricing-architecture §11b, §6c).
- **Includes:** an artifact-type → credit-cost table (config-driven so the founder tunes it); the existing 100→10,000 dropdown works unchanged at this scale.
- **Touches:** `credits.functions.ts` (cost table), `src/lib/billing-tier.ts`.
- **Depends:** PR-A1, PR-A2. **Founder-config:** the exact per-artifact credit costs.

### PR-A4 — No dollar per action; quiet usage indicator
- **What:** the UI shows a simple non-dollar usage indicator ("120 of 300 this month"); it NEVER shows a per-action dollar or credit-cost popup, and NEVER asks to approve a cost mid-flow.
- **Why:** per-action dollars invite the "I'd paste this in ChatGPT for 5 cents" comparison + second-guessing = pure friction (pricing-architecture §2 Rule 3).
- **Includes:** a usage meter component (bar + "X of Y"); remove/never-add any per-action cost display or mid-flow cost confirmation; the dollar/COGS math stays server-internal.
- **Touches:** the app shell usage indicator, billing tab, mission UI.
- **Depends:** PR-A3.

---

## Group B — Model access (platform-managed default, enterprise-only BYOK)

### PR-B1 — Platform-managed routing is the default for all tiers
- **What:** confirm/ensure all charged surfaces route through Cadence's managed models via the cost-router (cheap flash for routine/verification, frontier for hard reasoning); the customer never sees a model price.
- **Why:** Perplexity-style abstraction; the value is the decision engine, not raw model access (pricing-architecture §3). Cheap ≈ free, frontier costs more (credits-school).
- **Includes:** the existing `COST_ROUTABLE_SURFACES` + `runtime.server.ts` routing is the base; ensure every charged surface has a routing policy; frontier calls cost proportionally more credits.
- **Touches:** `src/lib/ai/runtime.server.ts`, the routing/cost tables.
- **Depends:** PR-A2.

### PR-B2 — Optional model menu (Pro+): Balanced / Deep / Fast
- **What:** a small curated menu mapping to model classes, each with a credit-burn rate; an in-product dial, not a billing bypass.
- **Why:** gives users who want choice a lever without exposing keys or a second wallet (pricing-architecture §3).
- **Includes:** 3 named tiers → model classes; the selection changes credit-burn, shown as the usage indicator (not dollars); gated to Pro+.
- **Touches:** model-selector UI, `runtime.server.ts` routing, `entitlements.ts` (gate).
- **Depends:** PR-B1. **Founder-config:** which models map to Balanced/Deep/Fast.

---

## Group C — BYOK (enterprise-only, never a live dual-meter)

### PR-C1 — Enterprise BYOK connect + governed routing
- **What:** an enterprise admin binds their own provider (Anthropic key / Azure OpenAI / Bedrock / private OpenAI-compatible endpoint / fine-tuned model) at workspace/org level; the chokepoint routes eligible surfaces to it; moat surfaces (decision/Critic/eval/self-improve) stay on Cadence's models unless explicitly approved-model-listed.
- **Why:** compliance / data residency / private models — the only real reasons for BYOK (pricing-architecture §5). The seam already exists (`resolveProviderAuth`).
- **Includes:** enterprise-tier gating; encrypted key vault (existing AES-256-GCM); every BYOK call still flows through Cadence (guardrails, injection screen, Trust Ledger, caps, audit all still apply).
- **Touches:** `src/lib/connectors/` (`resolveProviderAuth`), `runtime.server.ts`, `entitlements.ts` (enterprise gate).
- **Depends:** PR-B1.

### PR-C2 — BYOK platform fee (thin % of pass-through, contract-line)
- **What:** meter a thin % of the rated pass-through spend on BYOK calls as the platform fee — a single contract/invoice line, **never a live per-call dual-meter** the admin watches.
- **Why:** we still do the orchestration; a % auto-deflates (the flat $0.25/1M is now broken). Keeps BYOK cheaper for the customer while we hold margin (pricing-architecture §4, §11c).
- **Includes:** compute rated-equivalent spend per BYOK call → accrue the % to an invoice line; the % is config (set at contract time); no consumer-facing dual meter.
- **Touches:** `runtime.server.ts` (rated-spend calc on BYOK), billing accrual.
- **Depends:** PR-C1. **Founder-config:** the exact % (research band ~10–20%), set at enterprise-contract time.

---

## Group D — Billing model, guardrails, and PAYG

### PR-D1 — Seats-free billing: Team shared pool + unlimited members + per-user caps
- **What:** confirm Team = flat sub + account-pooled credits + unlimited members + admin per-user spend caps; no per-seat billing anywhere. Enterprise = committed annual credit envelope + unlimited seats.
- **Why:** COGS is in consumption, not seats; per-seat taxes collaboration (pricing-architecture §6b). Mostly exists (account-level pool + `credit_caps`); this task confirms + closes gaps.
- **Includes:** verify no per-seat charge in checkout/webhook; unlimited members on Team; `credit_caps` per-user enforcement at debit; enterprise committed-pool grant path.
- **Touches:** `src/lib/payments.functions.ts`, the Stripe webhook, `credits.functions.ts`, `entitlements.ts`.
- **Depends:** PR-A1.

### PR-D2 — Guardrails: hard cap + pre-approval before overage; bounded overage; ambient downgrade-to-free
- **What:** default stop-at-allowance (never silent overspend); overage is opt-in + capped + bounded-rate (Zapier's 1.25x→3x); ambient/autonomous work (sense, self-improve Auto) downgrades to the free floor at the cap rather than dead-stopping.
- **Why:** the missing feature that sank Replit/Devin; the anti-surprise-bill guarantee (pricing-architecture §2 Rule 4, §5).
- **Includes:** a per-account monthly cap + per-user caps; a "you're running low" nudge near limit; overage requires explicit opt-in; ambient surfaces check the cap and downshift.
- **Touches:** `credits.functions.ts` (cap enforcement), the ambient ticks (`sense`, self-improve), usage UI.
- **Depends:** PR-A1, PR-D1.

### PR-D3 — Top-ups + true pay-as-you-go (reuse the existing add-credits feature)
- **What:** let a user add credits anytime (capped by their setting) at the PAYG rate; reuse the existing add-credits/top-up mechanism.
- **Why:** founder directive (option C) — capped top-ups AND pay-as-you-go, reusing what's built.
- **Includes:** the add-credits flow wired to the PAYG price; user-set cap respected; PAYG priced slightly above plan-bundled rate (so committing to a plan wins).
- **Touches:** the existing add-credits feature, `payments.functions.ts`, Stripe catalog.
- **Depends:** PR-D1. **Founder-config:** the PAYG per-credit price (~$0.12–0.15 recommended).

---

## Group E — Packaging + surfaces

### PR-E1 — Keep tier name Business (no rename); the 4-tier packaging surfaces
- **What:** display name `team` slug stays "Business" (founder correction, 2026-07-13: an earlier rename to "Team" was reverted; the DB slug `team` is unchanged either way). Ensure the pricing page + billing tab render Free/Pro/Business/Enterprise with the finalized value matrix + the new model/BYOK dimensions.
- **Why:** founder correction 2026-07-13 supersedes the original naming call in pricing-architecture §6a; the packaging must still reflect the model, under the Business name.
- **Includes:** `planPresentation("team")` displays "Business"; pricing page rows for supported-models + BYOK-availability per tier; the credit dropdown (exists) on Pro + Business.
- **Touches:** `src/lib/entitlements.ts`, `src/routes/pricing.tsx`, `src/routes/_authenticated.settings.tsx` (billing tab).
- **Depends:** PR-A3, PR-B2, PR-C1.

### PR-E2 — Pricing page + in-app copy: credits, no dollar-per-action, work-replaced framing
- **What:** the pricing page + in-app meter lead with credits + a quiet usage indicator + the labor-anchor framing ("a mission ≈ N credits — an afternoon of coordination"), never token math or per-action dollars.
- **Why:** the low-friction presentation (pricing-architecture §2 Rule 3; pricing-strategy §1 value-metric).
- **Includes:** pricing-page credit dropdown + tier cards; the usage indicator; the labor-anchor copy; the "everyday actions are free" message.
- **Touches:** `src/routes/pricing.tsx`, the usage indicator component.
- **Depends:** PR-A4, PR-E1.

---

## Suggested build order
PR-A1 → PR-A2 → PR-A3 → PR-A4 (the metering core) → PR-D1 → PR-D2 → PR-D3 (billing + guardrails) → PR-B1 → PR-B2 (model access) → PR-E1 → PR-E2 (surfaces) → PR-C1 → PR-C2 (enterprise BYOK, last — enterprise-gated, lowest urgency). Groups A + D are launch-critical; C can trail.

## Cross-links
- Design + reasoning: [`pricing-architecture.md`](./pricing-architecture.md) · evidence: [`credit-model-and-byok-research.md`](./credit-model-and-byok-research.md) · tier value matrix: [`pricing-strategy.md`](./pricing-strategy.md) · Stripe rail: [`../../features/billing.md`](../../features/billing.md) · credit engine: [`../../features/credits.md`](../../features/credits.md) · existing monetization build: [`../../planning/workspace-tenancy-and-monetization-plan.md`](../../planning/workspace-tenancy-and-monetization-plan.md) · live status board (add `G-PRICE` group on greenlight): [`../../planning/feature-dashboard.md`](../../planning/feature-dashboard.md).
