# Credit model, BYOK, and ambient-spend billing — competitor teardown + recommendation

> _Created: 2026-07-12 (founder session — the self-improvement spend model opened a broader monetization question; founder asked for a comprehensive, durable research record)._
> _Author: automated competitor teardown (8 platforms, primary-source-grounded) + a survey of every Cadence AI surface, synthesized into a decision-ready recommendation._

> **Status: RESEARCH + RECOMMENDATION (not yet ratified).** This doc holds the evidence and a recommended credit model. It does NOT override the canonical [`pricing-strategy.md`](./pricing-strategy.md) until the founder ratifies the calls in §6. Where this research CONFIRMS the existing canon it says so; where it PROPOSES A REVISION (notably enterprise per-seat → committed credits) it flags it as an open founder decision, never a silent change.

> **Cross-links:** strategy layer = [`pricing-strategy.md`](./pricing-strategy.md) (canonical WHY/tiers) · implementation = [`../planning/workspace-tenancy-and-monetization-plan.md`](../../planning/workspace-tenancy-and-monetization-plan.md) · technical rail = [`../features/billing.md`](../../features/billing.md) · decision log = [`session-decisions.md`](../session-decisions.md). Any call ratified from §6 must be recorded in `pricing-strategy.md` AND `session-decisions.md` in the same session.

---

## 0. Why this exists

The self-improvement engine (RPT-50) raised a concrete billing question: when Cadence tunes itself, who pays? That opened a broader one — the whole credit model, BYOK stance, enterprise pricing, and how to bill work that runs **without a click** (post-trial Auto, ambient foresight). The founder set the direction (one unified platform-credit line; Cadence absorbs platform self-improvement; no BYOK sprawl; enterprise volume not seat sprawl; explicit disclosure) and asked for the market evidence behind it before we build. This is that evidence plus a recommendation.

**Committed direction going in (founder, 2026-07-12), which the research tests rather than relitigates:**

- ONE unified platform-credit line. Avoid a second "bring-your-own-credits" wallet — it confuses users and muddies monetization.
- Cadence **absorbs** the cost of self-improving the platform. Customer-facing self-improvement is free on Scheduled + a 30-day Auto trial; post-trial Auto draws platform credits.
- Enterprise gets a compliance **off-switch** in the admin console.
- Everything explicit — no silent flip to billing, ever.

---

## 1. The recommendation in one screen

**One-line model:** One unified platform-credit line is the billing spine. A credit is drawn **only when an AI call produces the customer's takeaway work**; Cadence eats verification, self-diagnosis, and plumbing. BYOK survives as **model choice**, never as a parallel billing rail. Enterprise is priced on **committed credits with unlimited seats**. The single real risk is **spend that happens without a click**.

| #   | Decision                | Verdict                                                                                                                                                                                               |
| --- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Unified credits vs BYOK | **Confirm unified credits as the sole billing spine.** Keep BYOK only as model-choice, decoupled from billing, restricted to the commodity-inference layer. Reject bring-your-own-_credits_ entirely. |
| 2   | Enterprise pricing      | **Committed/volume credits + unlimited seats + custom contract. Not per-seat.** (This _revises_ the current canon — see §6.)                                                                          |
| 3   | Free-vs-charged line    | **Confirm the surface map (§4).** Charge when tokens create the customer's takeaway; free when tokens grade / verify / self-diagnose Cadence, or run plumbing.                                        |
| 4   | Auto-learning controls  | **Three distinct controls, correctly placed** (see §5): the _compliance off-switch_ is enterprise-admin-only; the _spend dial_ is universal; the _free learning baseline_ is always-on.               |
| 5   | Post-trial Auto billing | **Outcome-gated, cheap-routed, included-allowance-first, downgrade-to-free (not dead-stop), transparent ledger** — all inside the one credit line.                                                    |

**⚠ The one risk that governs the design: spend without a click.** Post-trial Auto and ambient `sense` draw the customer's credits on background work they didn't trigger each cycle. This is the single most resentment-generating pattern in the whole competitive set (it _is_ Bolt's "hidden cost" reputation). Airtight ambient-spend governance — outcome-gating, hard caps, downgrade-to-free, a transparent ledger — is a **launch gate, not a polish item.**

---

## 2. Decision 1 — Unified credits vs BYOK

**Verdict: confirm unified credits as the sole billing spine. Keep BYOK as model-choice decoupled from billing, restricted to the commodity-inference layer. Reject bring-your-own-credits entirely.**

The market splits cleanly, and the split validates the call:

- **Closed-credit absorbers** (Lovable, v0, Bolt): no BYOK; the credit is a fixed-price abstraction that hides the model. That abstraction is exactly what lets them absorb model upgrades and platform maintenance silently.
- **BYOK-as-pressure-valve** (Copilot, Devin, Windsurf individual tiers): BYOK is offered but engineered so it is _never_ a billing bypass — the provider bills the user directly, those tokens go off the credit meter, but BYOK only covers commodity chat/agent inference, not the proprietary layer.
- **The Cursor lesson (steal this):** BYOK is offered on paper across 5 providers, but the high-value agentic surfaces (Tab, Agent, Composer — Cursor's _own_ trained models) stay locked to Cursor's metered rails. BYOK only drives plain chat. And at team/enterprise, even BYOK tokens carry a **$0.25/1M "Token Rate"** — Cursor still takes margin.

**Where BYOK-as-model-choice should survive (decoupled from billing):**

1. On the **charged commodity surfaces** (chat, copilot, PRD, discovery) — a user may point a frontier-model call at their own provider key; those raw-inference tokens bill to their provider, not to Cadence credits. Kills the cost objection, wins solo/cost-sensitive PMs.
2. For the AI **inside anything the customer BUILDS** (Build/studio-generated app runtime) — route to the user's key, provider-billed, on every tier. This is Replit's exact split: BYOK for _your app_, never for the _platform's own agent_.

**Where BYOK must NOT reach:** Cadence's proprietary decision/agentic orchestration and the judge/Critic/eval/self-improve layers. Those are the moat and are free anyway; letting a key run them off-platform would hollow out the differentiator.

**Margin-protection judgment call:** even on BYOK calls, keep a **thin platform credit** for Cadence's own orchestration/decision scaffolding around that call (the Cursor Token Rate move). BYOK decouples _who pays for the raw tokens_, not _Cadence works for free_. Otherwise heavy/enterprise users route their most expensive calls off-meter precisely where our value-add is highest.

---

## 3. Decision 2 — Enterprise pricing

**Verdict: committed/volume platform credits + unlimited seats + custom contract. NOT per-seat.**

The agent/builder-platform peers converge here; only the IDE-assistants stay per-seat, for a reason that doesn't apply to us:

- **Replit Enterprise:** "Unlimited seats: no per-seat costs," priced on a committed annual credit purchase ($10k–$200k/yr slider) or PAYG overage.
- **Lovable Enterprise:** volume-based committed credits, unlimited members, no daily grant — pure committed volume; effective per-credit rate falls with commitment.
- **Devin Enterprise:** committed ACUs at an order-form rate, seats effectively unlimited ("you're buying working time, not access licenses").
- **Cursor / Copilot stay per-seat** because their unit of value _is_ a developer in an editor. Copilot: $19/$39 per seat with a shared credit pool.

Cadence's unit of value is agent **work and deliverables**, and the product ethos is "invite the whole PM+eng+design org to collaborate." Per-seat taxes exactly the collaboration we want to encourage and adds seat-count friction on every expansion. Committed credits match the enterprise buyer's mental model (budget a spend envelope, not a license count) and make land-and-expand frictionless.

**Concrete recommendation:** annual credit commitment with a tiered per-credit rate that declines with commitment size; unlimited members; **org-pooled** usage (kills stranded per-user capacity); invoice/PO billing; and the governance layer — SSO/SCIM/audit **plus the compliance off-switch** — as the tier gate. Reserve BYOK _restrictions_ + governance for this tier (Windsurf's asymmetry: BYOK freely to individuals, withheld/governed at enterprise where margin and control live).

**Judgment call:** Copilot's per-seat+pool model is genuinely successful and simpler for seat-thinking procurement. Offer a seat-denominated floor **only as a fallback** when a customer's procurement demands it — not the default.

> **⚠ This CONFLICTS with the current canon.** [`pricing-strategy.md`](./pricing-strategy.md) §0 decision 4 records "Enterprise = platform fee + per-seat + API usage rates." The research recommends dropping per-seat for committed-credit + unlimited seats. See §6 — this is a founder decision, flagged, not silently changed.

---

## 4. Decision 3 — The free-vs-charged line (Cadence surface map)

**Verdict: confirm this line. It is Cadence's strongest structural asset.**

**The principle:** _You pay for output you keep; Cadence pays to keep that output honest, and eats the plumbing underneath._ A credit is deducted only when an AI call PRODUCES the customer's own work product. Cadence bears the cost when a call exists to GRADE, VERIFY, SCREEN, or SELF-DIAGNOSE its own output — because that is Cadence maintaining its own trustworthiness, not the customer's work — and when the call is trivial infrastructure. Charging users to verify quality would suppress the very trust mechanism (evals + Critic + self-improvement) that is the moat, so Cadence must eat it.

| Surface                 | What it is                                                                                                                                                                 | Recommendation                                                                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent`                 | Core agentic planning/execution loop — the customer's PM work end-to-end                                                                                                   | **CHARGE** — the autonomous execution they bought                                                                                                     |
| `studio` (Build)        | Code-gen / prototype driver                                                                                                                                                | **CHARGE** — heaviest COGS, most tangible deliverable                                                                                                 |
| `chat`                  | Streaming conversation surface                                                                                                                                             | **CHARGE** — customer-facing generation                                                                                                               |
| `copilot`               | Copilot assistance + surfaced brain-insights                                                                                                                               | **CHARGE** — customer-facing productive output                                                                                                        |
| `prd`                   | PRDs, flows, launch plans, design scaffolds, discovery→PRD lineage                                                                                                         | **CHARGE** — the customer's core written deliverables                                                                                                 |
| `discovery`             | Clusters raw feedback/signals into themes                                                                                                                                  | **CHARGE** — their labor, done for them                                                                                                               |
| `brief`                 | Daily brief + meeting summaries (already cost-routed)                                                                                                                      | **CHARGE (small)** — a deliverable, but cheap-routed                                                                                                  |
| `sense`                 | Proactive/ambient foresight, fired by crons not clicks                                                                                                                     | **CHARGE but GOVERNED** — real value, but spends without a click → same Auto/Scheduled/Off + hard-cap + cheap-flash governance as the spend dial (§5) |
| `decision`              | Decision-record rationale revision (reserved; no live call site yet)                                                                                                       | **CHARGE** — the moat deliverable, when it goes live                                                                                                  |
| `eval`                  | The eval-runner's subject call (model-under-test)                                                                                                                          | **FREE** — QA on Cadence's own output                                                                                                                 |
| `judge`                 | LLM-as-judge/scoring: eval grading, public Critic teardown, verify-green, contradiction-auditor, retro/house-rules, prompt-opt, outcome scoring, self-improve explanations | **FREE** — verification/self-diagnosis; the public Critic teardown is the acquisition wedge, especially want it free                                  |
| self-improvement engine | Cadence-on-Cadence quality fixing (runs on `judge`, cheap flash, grounded)                                                                                                 | **FREE** — the customer never pays for Cadence improving itself                                                                                       |
| guardrails (in/out)     | Deterministic rule eval, inline in the chokepoint                                                                                                                          | **FREE** — no marginal AI spend; safety is Cadence's duty                                                                                             |
| injection screening     | Deterministic quarantine of untrusted text                                                                                                                                 | **FREE** — platform safety control, no AI cost                                                                                                        |
| `embed`                 | RAG embeddings, high-volume, sub-cent                                                                                                                                      | **FREE** — metering sub-cent calls is pure friction                                                                                                   |
| `scheduler`             | Internal scheduling (reserved; no live call site yet)                                                                                                                      | **FREE** — orchestration plumbing                                                                                                                     |
| `test`                  | One-shot BYO-key connection validation                                                                                                                                     | **FREE** — charging to validate a credential is absurd friction                                                                                       |

**The one surface to watch — `sense`:** it produces genuine foresight value, so charging is right, but it fires on crons, not clicks — the Bolt failure mode ("why did my credits vanish on a project I barely touched"). It belongs in the same governed category as post-trial Auto: cheap-flash, Auto/Scheduled/Off dial, hard cap, transparent receipts, conservative default.

---

## 5. Decision 4 — Three controls, correctly placed (resolves the "off-switch" confusion)

The founder was at risk of bundling three different things under "off-switch." They are distinct and belong in different places:

1. **The free learning baseline (Scheduled).** Always on, free, no consumer off-switch — because it draws no credits and compounding it is the moat. Turning this off only starves the user's own engine, so we don't offer that to consumers. _(This is the founder's "no Off" call, and it stands — it applies to the FREE baseline.)_
2. **The spend dial (universal, every tier).** Control — Auto / Scheduled / Off + a user-set cap — over anything that draws **credits without a click**: post-trial Auto, and `sense`. This is a **budget** control, not a compliance one, and **every tier must have it**, or Auto silently draws a solo user's credits (the Bolt resentment trap). Default: _stop at budget, never silently overspend._
3. **The compliance off-switch (enterprise-admin-only).** Disabling Cadence's autonomous learning _entirely_ for governance/data-residency reasons. Correctly enterprise-admin-only — matches how Windsurf/Cursor withhold governance controls from individuals and reserve them for the tier where governance and margin live. No non-enterprise tier needs this.

**Net:** one control is always-on-and-free (baseline), one is universal (spend dial), one is enterprise-only (compliance). Keeping them distinct is the difference between a trust feature and a governance feature. **Do not gate the spend dial behind enterprise.**

---

## 6. Decision 5 — How post-trial Auto bills against platform credits

Reconcile first: the surface map's "self-improvement engine = FREE" is **Cadence-on-Cadence** (Cadence fixing its own quality flags — always free). **Post-trial Auto** is the _customer-facing_ autonomous cadence that continuously improves the customer's own workspace/agents/outputs — that produces customer value, so it bills. Two different engines.

**Recommended mechanics — all inside the one unified credit line, no separate rail:**

1. **Cheap-routed models.** Run Auto ticks on cost-routed flash (as `brief` and the self-improve engine already do) so per-tick cost is minimal and predictable.
2. **Included-allowance-first.** Draw against the monthly included credit grant before any overage or top-up (Copilot's base-then-flex pattern; the flex buffer also insulates us from model-cost swings without re-pricing users).
3. **Outcome-gated — the critical one.** Bill only when a tick produces a **kept** improvement. Diagnostic ticks that find nothing are zero-rated (Devin zero-rates waiting/idle; Replit meters "work done," not raw thinking). This makes Auto read as "pay for the improvement, not for the engine running," and pre-empts the "it charged me to look and found nothing" complaint.
4. **Governed + hard-capped.** The universal spend dial (§5) + a user-set monthly cap, conservative by default.
5. **Default-stop → graceful downgrade, not dead-stop.** When the Auto cap or credit balance is hit, Auto **downgrades to Scheduled** (the free floor) rather than shutting off value entirely. The customer never loses the free baseline; they only lose the ambient acceleration. Cleaner than v0/Copilot's hard pause because value continuity is preserved.
6. **Transparent ledger.** Every Auto tick shows what it produced and what it cost — receipts on screen, matching the pitch-room ethos and the "meter runs only on value delivered" trust move.

---

## 7. Competitor teardown (evidence)

Eight platforms, 2026-current, grounded on primary sources (pricing pages, billing docs, changelogs). Confidence + uncertainties noted per company; no pricing numbers were invented — anything from a secondary source is flagged as such in the underlying research.

### Comparison at a glance

| Platform              | Billing unit                                                                     | BYOK                                                                                                     | Enterprise                                                                               | Absorbs platform cost?                                                                     | Free-vs-charged line                                                                                      |
| --------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| **Lovable**           | Credits (fixed-price abstraction over the model), unlimited seats                | **None**, any tier                                                                                       | Volume/committed credits, unlimited members, no daily grant                              | Platform yes; your deployed app's runtime passed through                                   | AI work charged; **viewing + manual edits free**                                                          |
| **Cursor**            | Per-user subscription + usage-in-$ (two pools: own models vs third-party API)    | Offered (5 providers) but **chat only**; Tab/Agent/Composer stay metered; Token Rate on BYOK at team/ent | Per-seat + org-pooled usage + custom                                                     | Yes — own models bundled; only third-party tokens metered, $0.25/1M Token Rate             | Completions/own-models bundled; third-party frontier tokens metered past allowance                        |
| **Replit**            | Subscription + $-credits via **effort-based checkpoints**                        | **Yes for your app** (provider-billed, all tiers); **none for the Agent**                                | "Unlimited seats, no per-seat"; committed credits ($10k–$200k/yr slider)                 | Yes — platform folded into subscription; marginal compute metered                          | Ingress/dev-DBs/static-deploy free; agent effort + compute metered                                        |
| **v0 (Vercel)**       | Token-metered $-credits; per-seat on Team/Business                               | **None** for v0 generation (BYOK only in the separate AI Gateway product)                                | Per-seat base + committed shared credit pool + custom                                    | Yes (implied) — pure usage metering                                                        | Generation metered; pauses at zero rather than overbilling                                                |
| **Bolt.new**          | **Tokens** in a monthly allotment + per-seat multiplier (Teams)                  | **None**; model choice inside Claude family only, same meter                                             | Custom/sales; committed tokens+seats (inferred)                                          | Software yes; **meters its OWN file-sync/context overhead to the user** ← the anti-pattern | Only AI inference metered; hosting/manual edits free                                                      |
| **Devin (Cognition)** | Subscription + quota + PAYG credits (ACUs); per-seat only on Teams               | **Yes** (Cascade, Anthropic key), even free tier, provider-billed, zero credits                          | Committed ACUs at order-form rate; seats ~unlimited                                      | Largely yes; **zero-rates plumbing** (repo setup, waiting, idle, public PR review)         | "Active agent work past quota" charged; plumbing + seats free                                             |
| **Windsurf**          | Subscription + daily/weekly quotas; per-model multiplier; ACUs at enterprise     | **Individual-only** (Free/Pro), provider-billed; **withheld from Teams/Enterprise**                      | Custom, ACUs, per-seat + committed                                                       | Yes — own models (multiplier 0) free even past quota                                       | Own models + autocomplete + failed ops free; premium frontier metered                                     |
| **GitHub Copilot**    | Per-seat sub + included **AI Credits** (1 credit = $0.01), token-metered overage | **Yes**, broad (many providers), decoupled — off the credit meter; not for inline completions            | Per-seat ($19/$39) + **shared org credit pool**; overage $0.01/credit under admin budget | Partially — completions unlimited + **"flex allotment"** buffer absorbs model-cost swings  | Inline completions **always free/unlimited**; chat/agents/CLI metered; **default is stop, not overspend** |

### What to steal, per platform

- **Lovable** — price by consumption with unlimited seats; **never charge for viewing or manual edits**; the credit as a fixed-price abstraction is what lets you absorb model upgrades silently. The clean anti-BYOK reference.
- **Cursor** — you can be loudly model-agnostic AND fully monetize: BYOK on paper, but the valuable agentic surfaces stay on your own metered rails, and a thin Token Rate keeps margin even on BYOK. Keep the proprietary layer on a "first-party pool" generous enough that ~99% never feel a meter.
- **Replit** — charge for **outcomes** (effort checkpoints), not tokens; split BYOK by layer (your app = BYOK; the platform's own agent = always metered).
- **v0** — the deliberate inverse of BYOK, and commercially viable — which proves BYOK+model-agnosticism for the core agent is a genuine wedge a well-capitalized incumbent is choosing _not_ to give up. Copy its legible dollar-denominated credits + shared team pool.
- **Bolt** — the **cautionary tale**: it meters its own platform overhead (file-sync, context-loading) to the user's tokens → the "hidden cost" reputation. Do the inverse — absorb context/overhead, bill only intent.
- **Devin** — "sell the work, absorb the plumbing": unlimited/free seats, every non-productive moment zero-rated (repo setup, waiting, idle, public PR review). BYOK as a genuine decoupled pressure-valve.
- **Windsurf** — the BYOK **asymmetry**: hand BYOK to individuals (acquisition + cost relief), withhold at Teams/Enterprise (where margin/control live).
- **Copilot** — separate the always-on floor (completions unlimited) from marginal AI spend; carry a **"flex allotment"** buffer so model-cost swings don't force re-pricing; BYOK as a true off-meter pressure-valve; **default to stop-at-budget, never silent overspend**.

---

## 8. Reconciliation with the current canon

The canonical [`pricing-strategy.md`](./pricing-strategy.md) already settled several things (2026-06-26, 4-tier model + credit dropdown). This research:

**CONFIRMS (reinforces the canon):**

- Credits price **closed loops / outcomes, never tokens or seats** — the surface map and every disciplined incumbent agree.
- Account-level **pooled** credits (not per-seat) — matches Copilot/Cursor org-pooling and the "unlimited members" norm.
- Cadence **absorbs** platform self-maintenance / model upgrades into the managed tier — every disciplined incumbent does this; the surface map's "free the verification layer" is the sharpened version.
- Never charge for **viewing or manual edits** — Lovable's explicit line; extend it to Cadence.

**PROPOSES A REVISION (founder decision required):**

- **Enterprise pricing.** Canon §0 decision 4 = "platform fee + per-seat + API usage rates." Research recommends **committed/volume credits + unlimited seats** (per-seat only as a procurement fallback). The agent/builder peers (Replit, Lovable, Devin) all dropped per-seat for exactly Cadence's "value = agent work, invite the whole org" reason. **→ Founder call: keep per-seat, or move enterprise to committed-credit + unlimited seats?**

**ADDS (new, not previously specified):**

- The per-surface **free-vs-charged map** (§4) — the concrete implementation of "credits price closed loops."
- The **three-control model** (§5) — resolves the off-switch confusion.
- **Ambient-spend governance** (§6) as a launch gate — outcome-gating, downgrade-to-free, transparent ledger.
- BYOK as **model-choice-only, layer-restricted** (§2) — decoupled from billing, never on the moat surfaces, with a thin platform credit retained.

---

## 9. Open decisions for the founder

1. **Enterprise pricing** — keep the canon's per-seat, or adopt committed-credit + unlimited seats (research recommendation)? _(§3, §8)_
2. **BYOK scope** — confirm BYOK is model-choice-only, allowed on commodity surfaces + customer-built-app runtime, banned on the moat layers, with a thin platform credit retained on BYOK calls? _(§2)_
3. **The `sense` surface** — confirm it moves into the same governed/spend-dialed category as post-trial Auto (cheap-flash, capped, receipted, conservative default)? _(§4)_
4. **Free-vs-charged map** — ratify §4 as written (this becomes the billing spec)?
5. **Post-trial Auto mechanics** — ratify §6 (outcome-gated, downgrade-to-free, transparent ledger) as the billing behavior?

Once ratified, record each in `pricing-strategy.md` + `session-decisions.md`, and the free-vs-charged map flows into [`../features/billing.md`](../../features/billing.md) + [`../planning/workspace-tenancy-and-monetization-plan.md`](../../planning/workspace-tenancy-and-monetization-plan.md).

---

## 10. How this shapes the self-improvement build (RPT-50)

The current build (Auto/Scheduled/Off, cost absorption, visibility surface, Step B) updates to match:

- **Modes:** Scheduled (default, always free) + Auto. Auto is the credit-drawing, universal **spend dial** (§5.2), not a cost tier — with a hard cap and **downgrade-to-Scheduled** on cap/balance (§6.5), never a dead stop.
- **Cost routing:** Scheduled + in-trial Auto + all internal/Step B run on Cadence's key (free to the customer, including BYOK customers), cheap-flash. Only post-trial Auto draws credits, outcome-gated.
- **Compliance off-switch:** enterprise-admin-only, in the admin console (§5.3) — not a consumer control.
- **Visibility surface:** the reversible "how Cadence tuned itself" timeline doubles as the **transparent ledger** (§6.6) — what each tick produced and cost.
- **`sense` shares the harness:** the same governance the self-improve spend dial uses.
