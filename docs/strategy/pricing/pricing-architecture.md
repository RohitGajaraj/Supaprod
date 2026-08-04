# Supaprod pricing architecture — the FINALIZED end-to-end system

> _Created: 2026-07-12 (founder /goal: move from research to a finalized, implementation-ready pricing architecture — credit model, BYOK, model access, metering, billing, and the full 4-tier packaging as ONE coherent system). Finalized 2026-07-12 under the founder's explicit grant to finalize the what/how/why; the founder does not build from this — it is the spec agents build from._

> **Status: FINALIZED (structure/model) — this is the canonical pricing architecture.** The MODEL is locked (credit model, model-access, BYOK stance + fee structure, enterprise pricing, tier naming — §10). The only open values are the exact **numbers** the founder sets in Stripe/config (base prices, the exact margin %, the exact allowances) — those are configuration, not design, and do not block the build. When this and any older pricing doc disagree, THIS wins. The §8 tweaks are now folded into [`pricing-strategy.md`](./pricing-strategy.md); build tasks live in [`implementation-plan.md`](./implementation-plan.md).

> **Evidence base:** [`credit-model-and-byok-research.md`](./credit-model-and-byok-research.md) (8-platform teardown + surface map) + a 2026 inference-cost / platform-managed-model / fair-credit-model research pass, findings in §9 (primary-source, complete). Existing canon it builds on: [`pricing-strategy.md`](./pricing-strategy.md) (4-tier model, closed-loop credits, value matrix).

---

## 1. First principles (what this system must satisfy)

**What we're solving:** a PM is drowning in the coordination work around decisions. Supaprod does that PM work end-to-end and remembers what happened. The value event is a **closed decision loop** (decide → dispatch → ship → outcome recorded), not a token or a seat.

**Who we're building for:** the solo/indie PM (Free/Pro), the accountable PM team (Business), the governed org (Enterprise). Most are **not** technical and do not think in tokens or model names.

**How pricing must feel:** you pay for **finished work**, the way you'd pay a contractor for a deliverable — not for the engine thinking, and never a surprise. The model underneath is our problem, not the customer's.

**The five hard constraints (the test every decision below passes):**

1. **Fair** — you pay only for output you keep; verifying and self-improving that output is on us.
2. **Sustainable/profitable** — a credit's price always sits above its blended COGS, with a buffer against model-cost swings.
3. **Simple** — one wallet, one unit (a credit), presented as work-replaced, never token math.
4. **Hard to exploit** — charge on kept outcomes, not raw calls; cap ambient spend; never let a "bring your own model" path bypass the value we add around the call.
5. **Future-proof** — the credit is abstracted from any specific model, so new/cheaper/better models slot in without re-pricing users.

---

> ## ⛔ THE BAND PICKER IS RETIRED. Founder ruling 2026-08-03, verified in code 2026-08-04.
>
> **This document's credit model is superseded on its central mechanism.** It specifies a 100-to-10,000 credit **dropdown** whose selection scales the price linearly. That shipped, and then it was removed, because it produced two defects visible on the live public page:
>
> - **Pro's default was 100 credits for $20, against a Free tier granting 750.** The entry paid plan was 7.5x worse than free, and matching the free grant cost $160 a month.
> - **The top band rendered "$2000/mo"** for volume whose underlying cost is about $2.
>
> **The deeper error was conflating two axes.** A tier sells **seats and capability**; credits sell **capacity**. Making a solo user climb to a team plan to get volume charges them for collaboration they never asked for, which the pricing copy itself contradicts.
>
> **The shipped model, which is the authority:**
>
> | | Free | Pro | Max | Business (`team`) | Enterprise |
> | --- | --- | --- | --- | --- | --- |
> | Price | $0 | $20/mo | $99/mo | **$50 per seat**/mo | committed |
> | Credits/mo | **750** | **3,750** | **15,000** | **15,000 pooled** | committed |
> | Seats | 1 | 1 | 1 | **min 2** | unlimited |
>
> Price is **flat per tier**. Capacity is sold by **top-ups, capped at 2x the monthly grant** (`topUpCycleCap = grant x 2`), so a Pro user reaches 3x their allowance with no plan change. Annual is monthly x 10/12.
>
> **When this document and `src/routes/pricing.tsx` disagree, the code wins.** Everything here about outcome credits pricing a finished result, the free trust layer, stop-at-allowance, and never showing a dollar per action still stands.

## 2. The credit model — "Outcome Credits" (CONFIRM + sharpen the canon)

The canon already made the right core call: **a credit prices a finished result / closed loop, never a token or a seat**, shown as per-artifact ranges against the work it replaces ("a spec→PR mission ≈ 150–400 credits — an afternoon of coordination"). This research **confirms** it (Replit's effort-checkpoints, Devin's ACUs, Intercom Fin's per-resolution, Sierra's "tokens aren't correlated with value" — all converge). We keep it, and sharpen it into a named, coherent model with four rules:

**Rule 1 — Charge for the takeaway, free the trust layer.** A credit is drawn only when an AI call PRODUCES the customer's own work product (agent, Build, chat, copilot, PRD, discovery, brief, decision, governed foresight). Supaprod **bears** the cost of everything that grades, verifies, screens, or self-diagnoses its own output (evals, judge/Critic, self-improvement, guardrails, injection screening) and of plumbing (embeddings, scheduling, connection tests). _Charging users to verify our quality would suppress the exact trust mechanism that is the moat — so we eat it._ (The full per-surface map is §4 of the research doc; it becomes the billing spec.)

**Rule 2 — Charge only on DELIVERY, and only for substantial work. Stop it early and it is free.** A credit is spent when Supaprod hands you a finished deliverable you can point at (a PRD, a completed mission, a build, a deep-research brief) — never mid-run, never on a stopped/abandoned run, never on a retry or a failed attempt. Stop a mission after it has churned for an hour but before it delivers, and you are NOT charged; Supaprod eats that (cheap-routed) cost. This kills the "it burned an hour then charged me for nothing" resentment (Bolt/Replit's exact failure) and dissolves the "what happens to the tokens I already spent if I stop?" anxiety: nothing is spent until something is delivered. It is NOT a self-scored "was this good?" outcome (the Intercom/Zendesk trust-war, §9d) — the trigger is the simple, observable fact that an artifact was produced.

**Rule 2b — Everyday work feels unlimited; only heavy deliverables touch the meter.** The high-frequency, cheap actions — chat, viewing, the Critic teardown, briefs, discovery, manual edits — are effectively free and never visibly metered (Copilot makes completions unlimited; Perplexity makes chat unlimited). Only substantial, expensive deliverables (missions, builds, deep research) draw from the monthly allowance. So for typical use the meter is invisible; it only becomes real for a power user running many missions.

**Rule 3 — The user NEVER sees a dollar cost per action, and is NEVER asked to approve a cost mid-flow.** The meter is an abstract, generous monthly allowance, shown at most as a simple "120 of your 300 this month" bar — never "$0.38 for this spec." Per-action dollars invite the "I could paste this into ChatGPT for 5 cents" comparison and make the PM second-guess every click; that is pure friction and we refuse it. The dollar/model economics stay entirely INTERNAL (our routing + margin). The credit is a stable allowance unit abstracted from any model price; a flex buffer (Copilot's move) absorbs model-cost swings so the allowance never re-prices.

**Rule 4 — Never a surprise bill. Soft cap, gentle nudge, graceful downgrade.** Default is stop-at-allowance, never silent overspend (Copilot). Near the limit, a quiet "you're running low," not a wall. Overage is opt-in only, capped, at a bounded rate (Zapier's 1.25x-to-3x hard stop). Ambient/autonomous work downgrades to the free floor (Scheduled) at the cap rather than dead-stopping — you keep the baseline, you only lose the acceleration.

**Why this is the low-friction answer (the founder's test):** the PM never sees a dollar per action (no comparison trap, no second-guessing), never loses the allowance to a stopped run (no "charged for nothing"), never manages a key or reconciles two meters (no BYOK confusion — §4), and for normal use never feels a meter at all. It is simple (one abstract allowance), fair (pay only for delivered substantial work), hard to game (the trigger is a produced artifact, not a self-scored outcome or a raw call), model-proof (abstracted + buffered), and sustainable (the heavy deliverables that cost us real money are exactly the ones that draw the meter). This is the closed-loop-credit spine the canon chose, re-cut around the friction test.

---

## 3. Model access — platform-managed by default (the Perplexity call)

**Decision: default to platform-managed models for EVERY tier. The model is abstracted behind the credit. BYOK is an _option_, not the primary experience.**

The founder's instinct is right and the market backs it: Perplexity, Lovable, v0, and Bolt all bundle frontier models into the subscription with **no BYOK** and succeed — because a non-technical user should never manage a key or reason about a second wallet. For Supaprod specifically, the value is the decision engine, not raw model access, so abstracting the model is honest, not hiding.

**How model choice works without BYOK:**

- **Default (all tiers):** Supaprod picks the model. Cost-routed — cheap flash for briefs/foresight/verification, frontier for the hard reasoning. The user just spends credits on outcomes.
- **Optional model menu (Pro+):** for users who _want_ to choose, a small curated menu ("Balanced / Deep / Fast") maps to model classes, each with a credit-burn rate — an in-product dial, exactly like v0/Bolt, **not** a billing bypass. Model choice changes how fast you spend credits, never who bills you.
- **Cheap is effectively free; frontier costs credits (the Poe/Abacus "credits school," §9c — pick this over pure "unlimited").** Because a credit prices rated model spend, routine/ambient work on cost-routed flash burns almost nothing (it _feels_ unlimited), while a frontier-grade reasoning pass on a hard decision costs more. This internalizes the ~100x flash-to-frontier gap and caps margin exposure — without Perplexity's "quietly-tightened unlimited" that generates backlash.
- We stay genuinely **model-agnostic on our side** (the `runtime.server.ts` chokepoint already routes provider-agnostically), so adding a new model is an internal config change, invisible to pricing.

This kills the confusion the founder was worried about (platform credits vs bring-your-own) for 99% of users, while keeping true model-agnosticism as an internal capability + an enterprise option (§5).

---

## 4. BYOK — an enterprise/advanced option, metered and governed (with a platform fee)

**Decision: BYOK is NOT part of the primary experience. It exists as an option, primarily for Enterprise (and optionally Business-advanced), always routed through Supaprod so we still meter, govern, secure, and orchestrate — with a thin platform fee so it never becomes a value bypass.**

**Why BYOK survives at all (not everything can be on us):**

- **Compliance / data residency:** an enterprise may require inference on their own tenant/keys (their Azure OpenAI, AWS Bedrock, private endpoint).
- **Their own fine-tuned / private models:** an enterprise with a domain model wants Supaprod to orchestrate it.
- **Cost control at extreme scale:** a very heavy account may prefer its own negotiated provider rate.

**BYOK is NEVER a live dual-meter (the founder's confusion point).** The regular customer never sees BYOK at all — models are included, one allowance, one wallet. Even for the enterprise that uses it, BYOK is a **contract term, not a real-time reconciliation**: their provider bills them for tokens on their own key (as they already do), and Supaprod's thin platform fee is a **single line on the committed invoice**, not a per-call meter the admin watches tick alongside a credit balance. So there is never "your tokens billed here + my credits billed there" to map in the moment — the two are separated cleanly: raw inference is their provider's bill (invisible to Supaprod's UI), platform value is one contract line. That is the whole reason BYOK stays enterprise-only: the moment it becomes a self-serve dual-meter, it creates exactly the friction the founder flagged.

**How BYOK works (the architecture) — see §5.**

**The platform fee on BYOK (the Cursor move) — and is $0.25/1M still right?**
Even on a BYOK call, Supaprod still does the expensive, valuable part: the decision orchestration, memory, Critic, guardrails, routing. So BYOK decouples _who pays for the raw tokens_, not _Supaprod works for free_. We keep a **thin platform fee** on BYOK usage so heavy/enterprise users can't route their most valuable calls entirely off our meter.

**The finalized answer (grounded in §9): keep the margin, drop the flat $0.25/1M — it is now the wrong structure.** At 2026 prices a flat $0.25/1M is **1.8–5x the entire input cost** of the cheap models customers actually route high volume to (Gemini Flash-Lite $0.10, DeepSeek $0.14, Llama-8B $0.05) — you'd charge more for the wrapper than the model — while being an invisible <1% on frontier. And because the cheap floor deflates ~3–10x/yr against a static fee, its share of spend *grows* over time exactly on the tiers you want to encourage. So $0.25/1M is not "a bit high," it is structurally broken and gets worse every quarter.

**The fee, expressed cleanly inside our own credit model:** a BYOK call costs the **orchestration-margin portion of the normal credit price** — the customer's key covers the raw model tokens; Supaprod still charges for the decision/memory/Critic/guardrail/routing work around the call. This is the Cursor "we still take a margin" intent, done right:

- It is a **% of the equivalent-managed value** (the margin already baked into a credit), so it **auto-deflates** with the market and can never invert to cost more than the model.
- It scales fairly across a 100x flash-to-frontier spread (a % is proportional; a flat per-token fee is not).
- It reads honestly to the customer: _"you cover the tokens on your key; you pay for the Supaprod work that wraps them."_

**Provisional number: a THIN ~10–20% of the call's rated pass-through spend** (the research's recommendation) — NOT the full managed product margin. A full-margin fee would make BYOK cost the same as managed (just splitting the bill) and kill the reason to use it. The customer's key covers the raw tokens; we take a small orchestration cut on top. So BYOK stays genuinely _cheaper_ for the customer (they keep the model markup + get compliance) while we capture margin on work we'd otherwise not touch. Founder sets the exact % inside the 10–20% band; the _structure_ (a % of pass-through, not a flat per-1M) is the locked recommendation. A tiered flat-per-1M by model band is the fallback only if enterprise procurement demands a fixed number — banded so it is always a fraction of, never a multiple of, the model price. Worked dollars in §11.

---

## 5. Enterprise private-model / provider architecture

**Decision: enterprise plugs in their own provider or private model; Supaprod remains the control plane — we meter, govern, secure, and orchestrate every call. They bring the _inference_; they never bypass the _platform_.**

The seam already exists: [`resolveProviderAuth`](../../src/lib/connectors) (workspace binding → user connection → env fallback) and the model-agnostic `runtime.server.ts` chokepoint. Enterprise BYOK extends that:

1. **Connect:** an admin binds a provider at the workspace/org level (Anthropic key, Azure OpenAI, AWS Bedrock, a private/OpenAI-compatible endpoint, or a fine-tuned model). Keys are encrypted (AES-256-GCM, service-role vault) — the existing connector security model.
2. **Route:** the chokepoint routes eligible surfaces to the bound provider. The moat surfaces (decision, Critic, eval, self-improve) still run on Supaprod's own managed models by default unless the enterprise explicitly approves a model for them ("approved-model lists," already in the canon's Enterprise row).
3. **Meter + govern:** every call still flows through Supaprod — so guardrails, injection screening, the Trust Ledger, per-user caps, audit export, and the platform fee all still apply. BYOK changes the _inference bill_, not the _governance_.
4. **Orchestrate:** the agent loop, memory, handoff, and Critic are unchanged — Supaprod orchestrates the enterprise's model exactly as it orchestrates ours.

This is the honest answer to "should they just plug in their providers while we meter/govern/secure/orchestrate?" — **yes**, and the architecture already supports it; enterprise BYOK is a governance + billing policy on top of the existing provider-resolution chain, not a new pipeline.

---

## 6. The finalized 4-tier packaging

The canon's value matrix ([`pricing-strategy.md`](./pricing-strategy.md) §3) stands — memory, connectors (read on Pro / write on Business), collaboration/governance, workspaces, support, security are **confirmed as written**. This section locks the **prices**, the **new model/BYOK dimensions**, and the **enterprise pricing revision**, and consolidates everything into one table the pricing page renders from.

| Dimension | **Free** | **Pro** (Tier 1 paid) | **Business** (Tier 2) | **Enterprise** (Tier 3) |
| --- | --- | --- | --- | --- |
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

### 6a. Tier naming — DECIDED: Free / Pro / Business / Enterprise (founder, 2026-07-12; corrected 2026-07-13)

> **⚠️ NOT YET IMPLEMENTED (verified in code 2026-08-04).** This naming is locked as a decision and absent from the build. `src/lib/entitlements.ts` ships `PLAN_TIERS = ["free", "pro", "max", "team", "enterprise"]`, five tiers on the old slugs, and `'business'` appears **zero times** in the billing code. The database catalog matches the code, not this section. **So this is the target state, not the current one**, and anyone quoting tiers outward should say four while knowing the app says five. Tracked in [`../../planning/SOURCE-OF-TRUTH.md`](../../planning/SOURCE-OF-TRUTH.md) open findings.

Keep the clear, self-explaining names, **as originally named: Free / Pro / Business / Enterprise.** A same-day 2026-07-12 proposal to rename the middle tier to "Team" was reverted by founder correction on 2026-07-13 — the DB slug stays `team` either way (zero-migration display name), but the customer-facing name is **Business**, not Team.

Reasoning (why clear names, not a clever theme):

- **Clarity converts.** The pricing page is decoded in seconds by a buyer under time pressure; a clever tier name makes them work at the exact moment of purchase. Every strong comparable — Perplexity (Pro/Max), Cursor, Copilot (Pro/Business/Enterprise), Lovable, Linear, Notion — uses boring-clear tier names.
- **We already learned this.** Supaprod retired thematic names (Constellation / Galaxy / Cosmos) precisely because they added cognitive load (canon §10). Reintroducing cleverness would re-make a fixed mistake.
- **Reverted 2026-07-13.** The original rationale for "Team over Business" (reads more human, describes the solo→team jump) was sound in isolation, but the founder corrected this the same day: keep **Business**, the originally-decided name. Not applied.

Personality lives in the brand voice, the product moments, and feature names — not the tier selector.

### 6b. The billing model — seats-free credits (LOCKED 2026-07-12; resolves the "credits + seats" back-and-forth)

**One meter: credits. Seats are never a price lever, at any tier.** You pay for _work delivered_ (credits, pooled at the account), not for headcount.

- **Free:** $0 + a small monthly grant (30-day decay).
- **Pro:** flat monthly subscription including a credit allowance (credit dropdown to size up), 1 user.
- **Business:** a higher flat subscription (the higher base buys the governance/collaboration layer — RBAC, approval lanes, write-back connectors, audit) + a **shared credit pool** (dropdown) + **unlimited members** + admin per-user caps.
- **Enterprise:** a **committed annual credit envelope** at a volume rate (per-credit declines with commitment) + **unlimited seats** + custom contract + optional BYOK (contract term).
- **Every paid tier:** capped **top-ups + true pay-as-you-go** (reuse the existing add-credits feature) — add credits anytime, user-set cap.

**Why seats-free is the resolution:** COGS lives entirely in _consumption_ (a mission costs real money; a person in the workspace costs nothing). A shared credit pool already bounds cost, so unlimited members is free to offer — more people just draw the pool faster and buy a bigger pool. Per-seat would tax the cross-functional collaboration we want; every value-compounds-with-usage platform (Anthropic, OpenAI, Vercel, Replit) pools at the account. Enterprise's committed-credits + unlimited-seats (§3) is this same principle at contract scale.

### 6c. Recommended numbers (founder delegated; unit-economics-backed, tunable)

From §9 COGS (mission ≈ $0.50 cached; small artifacts ≈ pennies; everyday actions free):

- **Credit sizing (coarse + legible):** mission ≈ **~10 credits**, build ≈ **~20–30**, everyday actions **0**. Internal COGS ≈ **$0.05/credit**. _(Fixes the canon's "150–400 credits/mission" inconsistency; the existing 100→10,000 dropdown works at ~10 cr/mission.)_
- **Free** $0. **The daily-active hook is the free everyday features** (unlimited chat, the Critic teardown wedge, briefs — all 0-credit), so a free user has a reason to come back _every day_ without spending a credit. On top of that, a **daily credit trickle that accrues, capped monthly** (recommended **~5 credits/day, cap ~50/mo** — the Lovable pattern) so they can save up over a few days to run a real mission. Daily refresh drives DAU; the monthly cap bounds our COGS; accrual means a mission (~10 cr) is reachable in ~2 days. _(A flat monthly 50 is the simpler fallback, but the daily trickle is the better habit-former for a Chief-of-Staff product.)_
- **Pro** $20/mo / **~200 credits** (~20 missions, generous for solo). **Business** ~$50/mo base / **~400 pooled credits** (~40 missions). **Enterprise** committed at ~$0.08–0.10/credit volume vs ~$0.12–0.15 self-serve/PAYG.
- **Margin holds via breakage:** the average PM uses well under the allowance (blended ~4–5x COGS) even though a maxed power user is ~2x. Generous _and_ profitable.
- These are recommendations; the founder sets final Stripe numbers. The one hard rule: keep the sizing self-consistent (base allowance must cover real missions).

---

## 7. How it all works as one system

1. **One wallet.** Every customer has a single platform-credit balance. There is no second "bring-your-own-credits" wallet, ever.
2. **The model is ours to manage** (all tiers, default) — cost-routed, flex-buffered, invisible. New models slot in without re-pricing.
3. **Credits price kept outcomes** — model-abstracted, outcome-gated, stop-at-budget. The trust layer + plumbing are free.
4. **BYOK is an enterprise/advanced escape valve** — for compliance / private models / extreme scale — that still flows through Supaprod (metered, governed, orchestrated) with a thin platform fee, so it never bypasses the value.
5. **Enterprise is bought as a committed credit envelope with unlimited seats** — value = agent work, not license count.
6. **Ambient spend is governed by the three controls** — free baseline (always on), universal spend dial (outcome-gated + capped + downgrade-to-free), enterprise compliance off-switch.

---

## 8. Tweaks to the existing canon (with justification)

On approval, these fold into [`pricing-strategy.md`](./pricing-strategy.md) + [`session-decisions.md`](../session-decisions.md):

1. **Enterprise pricing: per-seat → committed credits + unlimited seats.** Canon §8 = "platform fee + per-seat + metered usage." Revise to committed-credit envelope + unlimited seats (per-seat only as a procurement fallback). _Justification:_ Supaprod's value is agent work, not licenses; per-seat taxes the cross-functional collaboration we want; Replit/Lovable/Devin all dropped per-seat for exactly this reason. (Founder ratified 2026-07-12.)
2. **Add the model-access + BYOK strategy** (canon only mentioned BYOK as enterprise option (d)): platform-managed default for all; BYOK enterprise/advanced-only, metered + governed + platform fee. _Justification:_ Perplexity-style abstraction removes key/wallet confusion for non-technical PMs; §3–5.
3. **Add the per-surface free-vs-charged map** as the billing spec (research §4). _Justification:_ it's the concrete implementation of "credits price closed loops," and freeing the verification layer protects the moat.
4. **Add the flex buffer + outcome-gating + stop-at-budget-downgrade** to the credit engine spec. _Justification:_ fairness + model-cost insulation + the anti-"hidden cost" guarantee.
5. **Replace the flat $0.25/1M BYOK fee with a margin-slice %** (§4). *Justification:* at 2026 prices a flat $0.25/1M is 1.8–5x the cheap models' entire input cost and inverts further each quarter as the floor deflates; a %-of-managed-value fee auto-deflates and never inverts (§9a).
6. **Add the credit unit peg** — 1 credit = $0.01 of rated model spend, with caching + tokenizer inflation modeled into COGS before pricing (§9b). _Justification:_ deflation-proof, efficiency flows to the customer, margin stays a clean multiplier.

---

## 9. Grounding research findings (2026-07-12, primary-source)

### 9a. Inference costs today, and the trend

Per-1M-token API prices (2026, primary pages): Anthropic Opus 4.8 $5/$25, Sonnet 5 $2/$10 (intro), Haiku 4.5 $1/$5, Fable 5 $10/$50; OpenAI flagship-std $2.50/$15, mini $0.75/$4.50, nano $0.20/$1.25; Google Gemini 2.5 Flash $0.30/$2.50, Flash-Lite $0.10/$0.40; cheap floor (DeepSeek/Llama) $0.05–0.14 input. Caching cuts input ~10x (0.1x reads); newest Anthropic models emit ~1.3x tokens (tokenizer), so effective $/word ~1.3x nominal.

**Trend:** cost for a _fixed capability_ falls ~3–10x/yr at the mid/flash tier (GPT-4-class 2023 quality now matched by $0.05–0.14 models — a 100–600x input drop). The *frontier ceiling* is flat-to-down (Opus cut ~3x from $15/$75 → $5/$25; Sonnet 5 launched ~33% under 4.6) but reprices *up* as new top models (Fable 5, GPT-5.5-pro $30/$180) slot above. So: the tier you route a stable task to roughly halves every 6–12 months; the ceiling stays near today's band or rises.

### 9b. Credit unit economics (locks §2)

- **Peg a credit to USD of rated spend, not a token count.** 1 credit = **$0.01 of rated model spend** (mirrors Anthropic's Consumption Unit, 100 CCU = $1). Deflation-proof: the same task costs _fewer credits_ as models get cheaper, so efficiency flows to the customer (avoids the Parloa "efficiency capture" trap), and our margin stays a clean multiplier over a shrinking COGS.
- **COGS anchors (primary, for backing into bundles):** a 1-hour Opus coding session (50k in / 15k out) ≈ **$0.53 with caching** ($0.71 without); a Haiku support ticket ≈ **$0.0037**. Model caching into COGS _before_ pricing — assuming no cache over-charges 1.5–10x on repetitive agentic loops.
- **Retail:** usage-based AI resells credits at ~2–4x COGS; or folds credits into a seat plan with near-pass-through token cost so monetization sits on the decision layer, not token arbitrage.

### 9c. Platform-managed-model bundles (validates §3)

Platform-managed-default + enterprise-only-BYOK is the **industry norm**: Perplexity, Poe, You.com, Abacus ChatLLM offer **no consumer BYOK** (model fully abstracted); only T3 Chat exposes it as an optional power-user toggle on top of a managed default. Perplexity bundles GPT + Claude + Gemini + Grok + o-series + its own Sonar for $20/$200, no keys.
**Key refinement for §3:** use the **credits school (Poe/Abacus), not pure "unlimited" (Perplexity/You.com).** Credits internalize the frontier-vs-cheap cost differential (an Opus call costs ~100x a flash call), let cheap models be effectively unlimited, and cap margin exposure — _without ever asking for a key_. Perplexity's "unlimited" only holds via quietly-tightened fair-use caps, which have generated public Pro-user backlash.

### 9d. Fair, hard-to-exploit credit models (corrects §2's framing)

Assessed on legible / gameable / absorbs-model-swings:

- **Effort/compute units (Replit checkpoints, Devin ACUs) are the WORST** — they abstract the token name but pass variance straight through → the surprise-bill backlash (Replit: $180/mo → $1,000/week after Agent 3's subagent fan-out; no cap was the fatal gap).
- **Interpreted outcomes (Intercom Fin / Zendesk "per-resolution") read fair per-unit but the total is unpredictable and the definition is the exploit surface** ("assumed resolution" bills you when a user just leaves). The Forbes/Parloa "outcome-based pricing myth": efficiency capture, permanent risk premiums, attribution debates, budget instability, definition-gaming. **→ Do NOT price on a system-self-scored outcome.**
- **Flat credit per discrete, user-visible unit of work (Salesforce Agentforce $0.10/action, Zapier per-task) is the fairest + hardest to game** — the user can see and predict it, and we absorb model volatility inside the flat price. Zapier's guardrail to copy: **bounded overage (1.25x up to a 3x hard stop) + a hard cap/pre-approval before overage** — the single missing feature that sank Replit and Devin.

**Net correction to §2:** Supaprod charges per **discrete, PM-visible unit of delivered work** (an artifact produced / an action taken — a PRD, a mission, a decision, a merged PR), NOT per a self-scored "kept improvement." "Per-artifact credit ranges" (already the canon) IS this model. Add the two guardrails (hard cap + pre-approval; bounded overage) as launch-gating.

Full evidence with sources: this session's research outputs + [`credit-model-and-byok-research.md`](./credit-model-and-byok-research.md).

---

## 10. The finalized decisions (LOCKED 2026-07-12)

These are the design decisions, now finalized. The only remaining inputs are the exact **numbers** (marked "founder-config") — configuration set in Stripe/admin, not design, and not build blockers.

1. **Credit model (§2) — LOCKED.** A credit prices a **discrete, PM-visible delivered artifact** (a PRD, a mission, a build, a deep-research brief), model-abstracted, with a flex buffer. **Charge only on delivery** (stop early = free), everyday actions feel unlimited, **no per-action dollar ever shown**, no per-action approval, hard cap + pre-approval before overage, bounded overage rate, ambient downgrades to free. (Corrects the earlier "outcome-gated" framing — never a self-scored outcome; §9d.)
2. **Model access (§3) — LOCKED.** Platform-managed models default for **all** tiers; optional Balanced/Deep/Fast menu on Pro+; credits-school (cheap ≈ free, frontier costs more); **no consumer BYOK**.
3. **BYOK fee (§4) — LOCKED (structure).** Drop the flat $0.25/1M; charge a **thin % of pass-through spend, auto-deflating**. _Founder-config:_ the exact % (research band ~10–20%).
4. **Enterprise pricing (§6, §8.1) — LOCKED.** Committed credits + unlimited seats; no default per-seat (seat-floor only as a procurement fallback).
5. **Tier naming (§6a) — LOCKED (corrected 2026-07-13).** Free / Pro / Business / Enterprise. A same-day proposal to rename Business to Team was reverted by founder correction.
6. **Prices (§6) — founder-config.** Base $0 / $20 / $50 + the dropdown ladder are placeholders; the founder sets final Stripe numbers. The credit calibration must be self-consistent (§11b) so the base allowance covers real missions.

The design is locked; the build spec is [`implementation-plan.md`](./implementation-plan.md). Decisions recorded in [`session-decisions.md`](../session-decisions.md).

---

## 11. Worked economics (INTERNAL — the customer never sees these numbers)

> Everything here is our own cost/margin/routing math. Per Rule 3, none of it is ever shown to the customer as a per-action dollar. It exists to size the allowances and prove the margin.

### 11a. COGS per deliverable (from §9 anchors, cost-routed)

| Deliverable | Rough COGS (blended, cached) | Note |
| --- | --- | --- |
| Chat turn / brief / view | ~$0.001–0.01 | cheap flash; treated as free (Rule 2b) |
| Critic teardown | ~$0.05–0.10 | one focused judge pass; free (it's the wedge, §4 research) |
| Discovery synthesis | ~$0.03–0.10 | a few flash calls |
| Decision record | ~$0.02–0.08 | one mid call |
| **Spec→PR mission** | **~$0.30–0.80** | multi-step agent loop; ~1 hr Opus-equiv = $0.53 cached (§9b) |
| **Build (code-gen)** | **~$1–3+** | heaviest COGS |

### 11b. The credit calibration — and a canon inconsistency to fix

**⚠ The canon is internally inconsistent:** `pricing-strategy.md` quotes a mission at "150–400 credits" but sets Pro's base at "100 credits" — so Pro couldn't run a single mission. That must be resolved. Recommended coherent scale (legible, Rule-3-compatible):

- **1 credit ≈ one substantial deliverable's worth**, coarse enough to be legible: a **mission ≈ 5–10 credits**, a **build ≈ 10–30 credits**, everyday actions **0 credits** (free). Not "150–400."
- **Pro base ~150–300 credits/mo** → ~20–40 missions or a handful of builds — a real power-PM allowance (vs the canon's unworkable 100).
- Retail: at Pro $20 / ~200 credits, a credit sells at ~$0.10; a mission (5–10 cr) = $0.50–1.00 retail against ~$0.50 COGS → **~1.5–3x margin on the heavy work**, with everyday free work carried by the plan.
- **Present it as a simple allowance ("200 runs/mo"), never as credits-with-dollar-tags.** The internal $0.01-rated-spend peg (§9b) is for COGS accounting; the customer-facing unit is a coarse, legible "run/credit."

_(Final numbers are the founder's to set in Stripe; the point here is a self-consistent scale where the base allowance comfortably covers real missions.)_

### 11c. BYOK worked dollars (enterprise) — why it's cheaper for them, still margin for us

Sample heavy team, 500M input + 150M output tokens/month, Sonnet-5-class ($2/$10 per 1M):

- **Rated model spend = $2,500/mo.**
- **BYOK:** their key pays the $2,500 to their provider directly. Supaprod platform fee at **15% of pass-through = $375/mo** (one invoice line). Their total ≈ **$2,875**.
- **Managed equivalent** (credits at ~2.5x COGS): ≈ **$6,250/mo**.
- **So BYOK saves them ~$3,375/mo** (they keep the model markup) *and* gives them compliance/their-own-model — while Supaprod still nets **~$375/mo** of orchestration margin on work it would otherwise not touch.

This is the concrete proof that the thin ~10–20% fee (not a full-margin slice, not a flat $0.25/1M) is the right structure: BYOK is genuinely valuable to the enterprise, and still profitable for us.
