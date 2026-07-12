# Cadence pricing architecture — the finalized end-to-end system (PROPOSED)

> _Created: 2026-07-12 (founder /goal: move from research to a finalized, implementation-ready pricing architecture — credit model, BYOK, model access, metering, billing, and the full 4-tier packaging as ONE coherent system)._

> **Status: PROPOSED — pending founder approval.** This doc is the single finalized architecture the founder asked to "close end to end." On approval it becomes canonical and the tweaks in §8 fold into [`pricing-strategy.md`](./pricing-strategy.md); the numbers flow into [`../features/billing.md`](./../features/billing.md) + [`../planning/workspace-tenancy-and-monetization-plan.md`](../planning/workspace-tenancy-and-monetization-plan.md). Nothing here is built until approved.

> **Evidence base:** [`credit-model-and-byok-research.md`](./credit-model-and-byok-research.md) (8-platform teardown + surface map) + a 2026 inference-cost / platform-managed-model / fair-credit-model research pass, findings in §9 (primary-source, complete). Existing canon it builds on: [`pricing-strategy.md`](./pricing-strategy.md) (4-tier model, closed-loop credits, value matrix).

---

## 1. First principles (what this system must satisfy)

**What we're solving:** a PM is drowning in the coordination work around decisions. Cadence does that PM work end-to-end and remembers what happened. The value event is a **closed decision loop** (decide → dispatch → ship → outcome recorded), not a token or a seat.

**Who we're building for:** the solo/indie PM (Free/Pro), the accountable PM team (Business), the governed org (Enterprise). Most are **not** technical and do not think in tokens or model names.

**How pricing must feel:** you pay for **finished work**, the way you'd pay a contractor for a deliverable — not for the engine thinking, and never a surprise. The model underneath is our problem, not the customer's.

**The five hard constraints (the test every decision below passes):**
1. **Fair** — you pay only for output you keep; verifying and self-improving that output is on us.
2. **Sustainable/profitable** — a credit's price always sits above its blended COGS, with a buffer against model-cost swings.
3. **Simple** — one wallet, one unit (a credit), presented as work-replaced, never token math.
4. **Hard to exploit** — charge on kept outcomes, not raw calls; cap ambient spend; never let a "bring your own model" path bypass the value we add around the call.
5. **Future-proof** — the credit is abstracted from any specific model, so new/cheaper/better models slot in without re-pricing users.

---

## 2. The credit model — "Outcome Credits" (CONFIRM + sharpen the canon)

The canon already made the right core call: **a credit prices a finished result / closed loop, never a token or a seat**, shown as per-artifact ranges against the work it replaces ("a spec→PR mission ≈ 150–400 credits — an afternoon of coordination"). This research **confirms** it (Replit's effort-checkpoints, Devin's ACUs, Intercom Fin's per-resolution, Sierra's "tokens aren't correlated with value" — all converge). We keep it, and sharpen it into a named, coherent model with four rules:

**Rule 1 — Charge for the takeaway, free the trust layer.** A credit is drawn only when an AI call PRODUCES the customer's own work product (agent, Build, chat, copilot, PRD, discovery, brief, decision, governed foresight). Cadence **bears** the cost of everything that grades, verifies, screens, or self-diagnoses its own output (evals, judge/Critic, self-improvement, guardrails, injection screening) and of plumbing (embeddings, scheduling, connection tests). *Charging users to verify our quality would suppress the exact trust mechanism that is the moat — so we eat it.* (The full per-surface map is §4 of the research doc; it becomes the billing spec.)

**Rule 2 — Charge per a discrete, PM-visible unit of delivered work — NOT a self-scored outcome.** The unit is a countable thing the PM can point at and audit: a PRD generated, a mission run, a decision recorded, a merged PR. Zero-rate the non-work: a diagnostic pass that finds nothing, a retry, a waiting VM, a failed op (Devin/Replit zero-rate these; Bolt's failure to is *the* "hidden cost" complaint). **Critically, do NOT bill on an interpreted "was this a kept improvement?" that the system self-scores** — that is the Intercom/Zendesk "what counts as a resolution" trust war and the Forbes/Parloa efficiency-capture trap (§9d). A visible artifact is legible, forecastable, and hard for either side to fabricate; a self-scored outcome is none of those.

**Rule 2b — Two guardrails, launch-gating (the feature whose absence sank Replit + Devin).** (a) A **hard spend cap + pre-approval before any overage** — credits never silently overspend; the customer opts into overage. (b) A **bounded overage rate** (Zapier's 1.25x-up-to-a-3x-hard-stop is the model). Ambient/autonomous work additionally *downgrades to the free floor* at the cap rather than dead-stopping (Rule 4).

**Rule 3 — Model-abstracted, with a flex buffer.** The customer never sees a model price. We route each call to the cheapest adequate model (the `COST_ROUTABLE_SURFACES` mechanism already exists), and we carry a **flex buffer** on top of the included grant (Copilot's move) so a model-cost swing never re-prices the user. The credit is a stable, dollar-anchored unit; the model economics sit behind it.

**Rule 4 — Stop at budget, downgrade don't die.** Default is **never silently overspend** (Copilot). When the included grant + any user-set cap is hit, ambient/autonomous work **downgrades to the free floor** (Scheduled) rather than dead-stopping value. The customer always keeps the baseline; they only lose the acceleration.

**Why this beats a raw token meter or a pure per-seat model:** it is legible (work-replaced ranges), fair (only kept outcomes), hard to game (no per-call farming), model-proof (abstraction + buffer), and it prices exactly Cadence's value event. It is not a random mix — it's the closed-loop-credit spine the canon already chose, hardened with outcome-gating + a flex buffer + the free-trust-layer, each borrowed from the incumbent that proved it.

---

## 3. Model access — platform-managed by default (the Perplexity call)

**Decision: default to platform-managed models for EVERY tier. The model is abstracted behind the credit. BYOK is an *option*, not the primary experience.**

The founder's instinct is right and the market backs it: Perplexity, Lovable, v0, and Bolt all bundle frontier models into the subscription with **no BYOK** and succeed — because a non-technical user should never manage a key or reason about a second wallet. For Cadence specifically, the value is the decision engine, not raw model access, so abstracting the model is honest, not hiding.

**How model choice works without BYOK:**
- **Default (all tiers):** Cadence picks the model. Cost-routed — cheap flash for briefs/foresight/verification, frontier for the hard reasoning. The user just spends credits on outcomes.
- **Optional model menu (Pro+):** for users who *want* to choose, a small curated menu ("Balanced / Deep / Fast") maps to model classes, each with a credit-burn rate — an in-product dial, exactly like v0/Bolt, **not** a billing bypass. Model choice changes how fast you spend credits, never who bills you.
- **Cheap is effectively free; frontier costs credits (the Poe/Abacus "credits school," §9c — pick this over pure "unlimited").** Because a credit prices rated model spend, routine/ambient work on cost-routed flash burns almost nothing (it *feels* unlimited), while a frontier-grade reasoning pass on a hard decision costs more. This internalizes the ~100x flash-to-frontier gap and caps margin exposure — without Perplexity's "quietly-tightened unlimited" that generates backlash.
- We stay genuinely **model-agnostic on our side** (the `runtime.server.ts` chokepoint already routes provider-agnostically), so adding a new model is an internal config change, invisible to pricing.

This kills the confusion the founder was worried about (platform credits vs bring-your-own) for 99% of users, while keeping true model-agnosticism as an internal capability + an enterprise option (§5).

---

## 4. BYOK — an enterprise/advanced option, metered and governed (with a platform fee)

**Decision: BYOK is NOT part of the primary experience. It exists as an option, primarily for Enterprise (and optionally Business-advanced), always routed through Cadence so we still meter, govern, secure, and orchestrate — with a thin platform fee so it never becomes a value bypass.**

**Why BYOK survives at all (not everything can be on us):**
- **Compliance / data residency:** an enterprise may require inference on their own tenant/keys (their Azure OpenAI, AWS Bedrock, private endpoint).
- **Their own fine-tuned / private models:** an enterprise with a domain model wants Cadence to orchestrate it.
- **Cost control at extreme scale:** a very heavy account may prefer its own negotiated provider rate.

**How BYOK works (the architecture) — see §5.**

**The platform fee on BYOK (the Cursor move) — and is $0.25/1M still right?**
Even on a BYOK call, Cadence still does the expensive, valuable part: the decision orchestration, memory, Critic, guardrails, routing. So BYOK decouples *who pays for the raw tokens*, not *Cadence works for free*. We keep a **thin platform fee** on BYOK usage so heavy/enterprise users can't route their most valuable calls entirely off our meter.

**The finalized answer (grounded in §9): keep the margin, drop the flat $0.25/1M — it is now the wrong structure.** At 2026 prices a flat $0.25/1M is **1.8–5x the entire input cost** of the cheap models customers actually route high volume to (Gemini Flash-Lite $0.10, DeepSeek $0.14, Llama-8B $0.05) — you'd charge more for the wrapper than the model — while being an invisible <1% on frontier. And because the cheap floor deflates ~3–10x/yr against a static fee, its share of spend *grows* over time exactly on the tiers you want to encourage. So $0.25/1M is not "a bit high," it is structurally broken and gets worse every quarter.

**The fee, expressed cleanly inside our own credit model:** a BYOK call costs the **orchestration-margin portion of the normal credit price** — the customer's key covers the raw model tokens; Cadence still charges for the decision/memory/Critic/guardrail/routing work around the call. This is the Cursor "we still take a margin" intent, done right:
- It is a **% of the equivalent-managed value** (the margin already baked into a credit), so it **auto-deflates** with the market and can never invert to cost more than the model.
- It scales fairly across a 100x flash-to-frontier spread (a % is proportional; a flat per-token fee is not).
- It reads honestly to the customer: *"you cover the tokens on your key; you pay for the Cadence work that wraps them."*

**Provisional number:** set it equal to Cadence's standard credit **gross margin** (the same margin a managed credit carries over COGS — e.g. if managed credits sell at ~2–3x COGS, the BYOK fee is that ~50–65% margin slice, applied to the call's rated-equivalent cost). Founder sets the exact margin target; the *structure* (a % / margin-slice, not a flat per-1M) is the locked recommendation. A tiered flat-per-1M by model band is the fallback only if enterprise procurement demands a fixed number — and even then, banded so it is always a fraction of, never a multiple of, the model price.

---

## 5. Enterprise private-model / provider architecture

**Decision: enterprise plugs in their own provider or private model; Cadence remains the control plane — we meter, govern, secure, and orchestrate every call. They bring the *inference*; they never bypass the *platform*.**

The seam already exists: [`resolveProviderAuth`](../../src/lib/connectors) (workspace binding → user connection → env fallback) and the model-agnostic `runtime.server.ts` chokepoint. Enterprise BYOK extends that:

1. **Connect:** an admin binds a provider at the workspace/org level (Anthropic key, Azure OpenAI, AWS Bedrock, a private/OpenAI-compatible endpoint, or a fine-tuned model). Keys are encrypted (AES-256-GCM, service-role vault) — the existing connector security model.
2. **Route:** the chokepoint routes eligible surfaces to the bound provider. The moat surfaces (decision, Critic, eval, self-improve) still run on Cadence's own managed models by default unless the enterprise explicitly approves a model for them ("approved-model lists," already in the canon's Enterprise row).
3. **Meter + govern:** every call still flows through Cadence — so guardrails, injection screening, the Trust Ledger, per-user caps, audit export, and the platform fee all still apply. BYOK changes the *inference bill*, not the *governance*.
4. **Orchestrate:** the agent loop, memory, handoff, and Critic are unchanged — Cadence orchestrates the enterprise's model exactly as it orchestrates ours.

This is the honest answer to "should they just plug in their providers while we meter/govern/secure/orchestrate?" — **yes**, and the architecture already supports it; enterprise BYOK is a governance + billing policy on top of the existing provider-resolution chain, not a new pipeline.

---

## 6. The finalized 4-tier packaging

The canon's value matrix ([`pricing-strategy.md`](./pricing-strategy.md) §3) stands — memory, connectors (read on Pro / write on Business), collaboration/governance, workspaces, support, security are **confirmed as written**. This section locks the **prices**, the **new model/BYOK dimensions**, and the **enterprise pricing revision**, and consolidates everything into one table the pricing page renders from.

| Dimension | **Free** | **Pro** (Tier 1 paid) | **Business** (Tier 2) | **Enterprise** (Tier 3) |
|-----------|----------|----------------------|----------------------|------------------------|
| **Target customer** | Solo PM trying the loop | Power individual PM | Accountable PM team | Governed org (procurement/compliance) |
| **Monthly price** | $0 | $20 (100 cr base) + credit dropdown | $50 (100 cr base, pooled) + dropdown | Committed-credit contract (contact sales) |
| **Annual** | — | ~17% off | ~17% off | Negotiated |
| **Included credits** | 50/mo (30-day decay) | 100–10,000 (dropdown) | 100–10,000 pooled + per-user caps | Committed annual pool |
| **Credit model** | Closed-loop / outcome credits, model-abstracted, flex-buffered, stop-at-budget (§2) | same | same, account-pooled | same, committed pool |
| **Supported models** | Platform-managed (cost-routed) | Platform-managed + optional Balanced/Deep/Fast menu | same | Platform-managed + **approved-model lists** |
| **BYOK** | No | No (platform-managed is the point) | **Optional (advanced)** — metered + governed + platform fee | **Yes** — own provider/private model, metered + governed + platform fee (§4–5) |
| **Enterprise pricing model** | — | — | — | **Committed credits + UNLIMITED seats + custom contract** (revises canon §8's per-seat — see §8) |
| **Memory / Critic / connectors / collab / governance / security** | per canon §3 (Critic teardown is IN Free; memory decays; manual connectors) | per canon §3 (persistent memory, read connectors, Critic-everywhere) | per canon §3 (pooled memory, write-back connectors, RBAC, approval lanes, per-user caps) | per canon §3 (SSO/SCIM/DPA, org-wide memory, custom retention, compliance export, off-switch) |
| **Ambient / self-improvement** | Scheduled (free, always on) | Scheduled free + Auto (spend dial, outcome-gated) | same + admin spend caps | same + **compliance off-switch** (admin-only) |
| **The three controls** (research §5) | free baseline on; spend dial present | free baseline on; spend dial | free baseline; spend dial + admin caps | free baseline; spend dial; **compliance off-switch** |

> **Base prices ($20 Pro / $50 Business / $0 Free) are the canon's placeholders — the founder sets the final Stripe numbers.** The dropdown ladder (linear, no volume discount; annual ~17% off) is unchanged from canon §2.

### 6a. Tier naming — recommendation: keep the clear names

**Recommendation: keep Free / Pro / Business / Enterprise.** Reasoning:
- **Clarity converts.** The pricing page is decoded in seconds by a buyer under time pressure; a clever tier name makes them work at the exact moment of purchase. Every strong comparable — Perplexity (Pro/Max), Cursor, Copilot (Pro/Business/Enterprise), Lovable, Linear, Notion — uses boring-clear tier names for this reason.
- **We already learned this.** Cadence retired thematic names (Constellation / Galaxy / Cosmos) precisely because they added cognitive load (canon §10). Reintroducing cleverness would re-make a mistake we already fixed.
- **The DB keys on slugs anyway** (`free` / `pro` / `team` / `enterprise`), so display names are a one-file skin — this is reversible if we ever want to test one.

**Where the personality belongs instead:** the brand voice, the credit/feature names, the product moments — not the tier selector. If we *do* want an on-brand thematic layer someday, the only candidate that still telegraphs scale is a music metaphor (Cadence is a musical term): e.g. **Solo → Studio → Ensemble → Orchestra**. But it costs a decode step, "Solo-Pro" (paid individual) reads awkward, and I would not ship it as the default. **Founder call in §10; my strong lean is keep the clear names.**

---

## 7. How it all works as one system

1. **One wallet.** Every customer has a single platform-credit balance. There is no second "bring-your-own-credits" wallet, ever.
2. **The model is ours to manage** (all tiers, default) — cost-routed, flex-buffered, invisible. New models slot in without re-pricing.
3. **Credits price kept outcomes** — model-abstracted, outcome-gated, stop-at-budget. The trust layer + plumbing are free.
4. **BYOK is an enterprise/advanced escape valve** — for compliance / private models / extreme scale — that still flows through Cadence (metered, governed, orchestrated) with a thin platform fee, so it never bypasses the value.
5. **Enterprise is bought as a committed credit envelope with unlimited seats** — value = agent work, not license count.
6. **Ambient spend is governed by the three controls** — free baseline (always on), universal spend dial (outcome-gated + capped + downgrade-to-free), enterprise compliance off-switch.

---

## 8. Tweaks to the existing canon (with justification)

On approval, these fold into [`pricing-strategy.md`](./pricing-strategy.md) + [`session-decisions.md`](./session-decisions.md):

1. **Enterprise pricing: per-seat → committed credits + unlimited seats.** Canon §8 = "platform fee + per-seat + metered usage." Revise to committed-credit envelope + unlimited seats (per-seat only as a procurement fallback). *Justification:* Cadence's value is agent work, not licenses; per-seat taxes the cross-functional collaboration we want; Replit/Lovable/Devin all dropped per-seat for exactly this reason. (Founder ratified 2026-07-12.)
2. **Add the model-access + BYOK strategy** (canon only mentioned BYOK as enterprise option (d)): platform-managed default for all; BYOK enterprise/advanced-only, metered + governed + platform fee. *Justification:* Perplexity-style abstraction removes key/wallet confusion for non-technical PMs; §3–5.
3. **Add the per-surface free-vs-charged map** as the billing spec (research §4). *Justification:* it's the concrete implementation of "credits price closed loops," and freeing the verification layer protects the moat.
4. **Add the flex buffer + outcome-gating + stop-at-budget-downgrade** to the credit engine spec. *Justification:* fairness + model-cost insulation + the anti-"hidden cost" guarantee.
5. **Replace the flat $0.25/1M BYOK fee with a margin-slice %** (§4). *Justification:* at 2026 prices a flat $0.25/1M is 1.8–5x the cheap models' entire input cost and inverts further each quarter as the floor deflates; a %-of-managed-value fee auto-deflates and never inverts (§9a).
6. **Add the credit unit peg** — 1 credit = $0.01 of rated model spend, with caching + tokenizer inflation modeled into COGS before pricing (§9b). *Justification:* deflation-proof, efficiency flows to the customer, margin stays a clean multiplier.

---

## 9. Grounding research findings (2026-07-12, primary-source)

### 9a. Inference costs today, and the trend

Per-1M-token API prices (2026, primary pages): Anthropic Opus 4.8 $5/$25, Sonnet 5 $2/$10 (intro), Haiku 4.5 $1/$5, Fable 5 $10/$50; OpenAI flagship-std $2.50/$15, mini $0.75/$4.50, nano $0.20/$1.25; Google Gemini 2.5 Flash $0.30/$2.50, Flash-Lite $0.10/$0.40; cheap floor (DeepSeek/Llama) $0.05–0.14 input. Caching cuts input ~10x (0.1x reads); newest Anthropic models emit ~1.3x tokens (tokenizer), so effective $/word ~1.3x nominal.

**Trend:** cost for a *fixed capability* falls ~3–10x/yr at the mid/flash tier (GPT-4-class 2023 quality now matched by $0.05–0.14 models — a 100–600x input drop). The *frontier ceiling* is flat-to-down (Opus cut ~3x from $15/$75 → $5/$25; Sonnet 5 launched ~33% under 4.6) but reprices *up* as new top models (Fable 5, GPT-5.5-pro $30/$180) slot above. So: the tier you route a stable task to roughly halves every 6–12 months; the ceiling stays near today's band or rises.

### 9b. Credit unit economics (locks §2)

- **Peg a credit to USD of rated spend, not a token count.** 1 credit = **$0.01 of rated model spend** (mirrors Anthropic's Consumption Unit, 100 CCU = $1). Deflation-proof: the same task costs *fewer credits* as models get cheaper, so efficiency flows to the customer (avoids the Parloa "efficiency capture" trap), and our margin stays a clean multiplier over a shrinking COGS.
- **COGS anchors (primary, for backing into bundles):** a 1-hour Opus coding session (50k in / 15k out) ≈ **$0.53 with caching** ($0.71 without); a Haiku support ticket ≈ **$0.0037**. Model caching into COGS *before* pricing — assuming no cache over-charges 1.5–10x on repetitive agentic loops.
- **Retail:** usage-based AI resells credits at ~2–4x COGS; or folds credits into a seat plan with near-pass-through token cost so monetization sits on the decision layer, not token arbitrage.

### 9c. Platform-managed-model bundles (validates §3)

Platform-managed-default + enterprise-only-BYOK is the **industry norm**: Perplexity, Poe, You.com, Abacus ChatLLM offer **no consumer BYOK** (model fully abstracted); only T3 Chat exposes it as an optional power-user toggle on top of a managed default. Perplexity bundles GPT + Claude + Gemini + Grok + o-series + its own Sonar for $20/$200, no keys.
**Key refinement for §3:** use the **credits school (Poe/Abacus), not pure "unlimited" (Perplexity/You.com).** Credits internalize the frontier-vs-cheap cost differential (an Opus call costs ~100x a flash call), let cheap models be effectively unlimited, and cap margin exposure — *without ever asking for a key*. Perplexity's "unlimited" only holds via quietly-tightened fair-use caps, which have generated public Pro-user backlash.

### 9d. Fair, hard-to-exploit credit models (corrects §2's framing)

Assessed on legible / gameable / absorbs-model-swings:
- **Effort/compute units (Replit checkpoints, Devin ACUs) are the WORST** — they abstract the token name but pass variance straight through → the surprise-bill backlash (Replit: $180/mo → $1,000/week after Agent 3's subagent fan-out; no cap was the fatal gap).
- **Interpreted outcomes (Intercom Fin / Zendesk "per-resolution") read fair per-unit but the total is unpredictable and the definition is the exploit surface** ("assumed resolution" bills you when a user just leaves). The Forbes/Parloa "outcome-based pricing myth": efficiency capture, permanent risk premiums, attribution debates, budget instability, definition-gaming. **→ Do NOT price on a system-self-scored outcome.**
- **Flat credit per discrete, user-visible unit of work (Salesforce Agentforce $0.10/action, Zapier per-task) is the fairest + hardest to game** — the user can see and predict it, and we absorb model volatility inside the flat price. Zapier's guardrail to copy: **bounded overage (1.25x up to a 3x hard stop) + a hard cap/pre-approval before overage** — the single missing feature that sank Replit and Devin.

**Net correction to §2:** Cadence charges per **discrete, PM-visible unit of delivered work** (an artifact produced / an action taken — a PRD, a mission, a decision, a merged PR), NOT per a self-scored "kept improvement." "Per-artifact credit ranges" (already the canon) IS this model. Add the two guardrails (hard cap + pre-approval; bounded overage) as launch-gating.

Full evidence with sources: this session's research outputs + [`credit-model-and-byok-research.md`](./credit-model-and-byok-research.md).

---

## 10. Open items for founder approval

1. **Credit model (§2)** — ratify: a credit prices a **discrete, PM-visible unit of delivered work** (per-artifact ranges), model-abstracted, with a flex buffer, a hard cap + pre-approval before overage, and a bounded overage rate. (This *corrects* the earlier "outcome-gated" idea — we bill on a visible artifact, never a self-scored outcome; §9d.)
2. **Model access (§3)** — ratify platform-managed default for **all** tiers + optional Balanced/Deep/Fast menu on Pro+, credits-school (cheap ≈ free, frontier costs more), no consumer BYOK.
3. **BYOK fee (§4)** — ratify: **drop the flat $0.25/1M** (now structurally broken), charge the **orchestration-margin slice of a credit (a %), auto-deflating**. Founder sets the exact margin % (= Cadence's standard credit gross margin).
4. **Enterprise pricing (§6, §8.1)** — committed credits + unlimited seats (ratified 2026-07-12); confirm no default per-seat.
5. **Tier naming (§6a)** — keep Free / Pro / Business / Enterprise (my strong lean), or explore the music-metaphor thematic set?
6. **Prices (§6)** — keep $0 / $20 / $50 base + the dropdown ladder, or adjust?

Once you make these calls, I fold the tweaks into `pricing-strategy.md` + `session-decisions.md`, the free-vs-charged map + credit economics into `billing.md`, and it's ready to build.
