/**
 * Model pricing (USD per 1M tokens). Kept conservative; tune as providers
 * update. Unknown models fall back to a neutral default so cost math never
 * crashes.
 */
export type Pricing = { in_per_mtok: number; out_per_mtok: number };

export const MODEL_PRICING: Record<string, Pricing> = {
  // Google Gemini (via Lovable AI Gateway)
  "google/gemini-3-flash-preview": { in_per_mtok: 0.075, out_per_mtok: 0.3 },
  "google/gemini-2.5-pro": { in_per_mtok: 1.25, out_per_mtok: 5.0 },
  "google/gemini-2.5-flash": { in_per_mtok: 0.15, out_per_mtok: 0.6 },
  "google/gemini-2.5-flash-lite": { in_per_mtok: 0.05, out_per_mtok: 0.2 },
  "google/gemini-3.5-flash": { in_per_mtok: 0.15, out_per_mtok: 0.6 },
  // OpenAI
  "openai/gpt-5": { in_per_mtok: 5.0, out_per_mtok: 15.0 },
  "openai/gpt-5-mini": { in_per_mtok: 0.5, out_per_mtok: 1.5 },
  "openai/gpt-5-nano": { in_per_mtok: 0.1, out_per_mtok: 0.4 },
  "openai/gpt-5.4": { in_per_mtok: 3.0, out_per_mtok: 12.0 },
  "openai/gpt-5.4-mini": { in_per_mtok: 0.4, out_per_mtok: 1.6 },
  "openai/gpt-5.5-pro": { in_per_mtok: 8.0, out_per_mtok: 24.0 },
  // Embeddings (input-only, out_per_mtok unused but required by type).
  //
  // These entries EARN their keep rather than merely completing the table. Before they
  // existed, `cohere/embed-v4.0` fell through to DEFAULT_PRICING ($0.50/1M in), which
  // priced a full month of live embedding (211,358 tokens over 1,630 calls,
  // 2026-07-02 to 2026-08-02) at $0.106 when the real figure is around a fifth of that.
  // The founder was deciding whether the Cohere spend was worth keeping off exactly
  // that number, so a 5x overstatement on the cheapest call in the system was not a
  // rounding error, it was a decision resting on a wrong premise.
  //
  // TO CONFIRM: the Cohere rate has NOT been read off the account. Check it against
  // https://cohere.com/pricing or the billing dashboard and correct it here. Left no
  // lower than expected on purpose, so while it stays unconfirmed the ledger errs
  // toward overstating embedding cost rather than understating it.
  "openai/text-embedding-3-small": { in_per_mtok: 0.02, out_per_mtok: 0.0 },
  "openai/text-embedding-3-large": { in_per_mtok: 0.13, out_per_mtok: 0.0 },
  "cohere/embed-v4.0": { in_per_mtok: 0.1, out_per_mtok: 0.0 },
  // Adapter-ready providers (platform env key or enterprise BYO). Conservative rates;
  // tune as providers update. Unlisted models fall back to DEFAULT_PRICING.
  "anthropic/claude-opus-4": { in_per_mtok: 15.0, out_per_mtok: 75.0 },
  "anthropic/claude-sonnet-4": { in_per_mtok: 3.0, out_per_mtok: 15.0 },
  "anthropic/claude-haiku-4": { in_per_mtok: 0.8, out_per_mtok: 4.0 },
  "deepseek/deepseek-v3": { in_per_mtok: 0.27, out_per_mtok: 1.1 },
  "xai/grok-4": { in_per_mtok: 5.0, out_per_mtok: 15.0 },
  "moonshot/kimi-k2": { in_per_mtok: 0.6, out_per_mtok: 2.5 },
  "qwen/qwen-2.5-max": { in_per_mtok: 1.6, out_per_mtok: 6.4 },
  "qwen/qwen-2.5-coder-32b": { in_per_mtok: 0.2, out_per_mtok: 0.6 },
  // Alibaba Model Studio, INTERNATIONAL (Singapore) list, which is the one that applies:
  // our endpoint is ap-southeast-1.maas.aliyuncs.com. The Mainland China list differs, so
  // do not substitute it. Source: alibabacloud.com/help/en/model-studio/model-pricing.
  //
  // WHY THESE MATTER MORE THAN THE REST OF THIS TABLE. qwen-plus was absent here and so
  // took the {0.5, 1.5} neutral default, and it is not a marginal model: it carries the
  // majority of all agent traffic (2,837 calls, 11.5M input tokens since 2026-07-05,
  // routed by AGENT_MODEL_PRIORITY in platform-keys.server.ts:95). Every credit debit on
  // the product's busiest path was therefore computed from a placeholder that overstated
  // input by 25% and output by 25%.
  //
  // TIERING, the one thing to watch. qwen-plus is priced by the input-token count of the
  // SINGLE request: $0.4/$1.2 up to 256K input, then $1.2/$3.6 above it. This table has
  // no way to express a tier, so the entry encodes the lower band. That is right today
  // (live average input is ~4,700 tokens, three orders of magnitude inside the band) and
  // becomes a 3x UNDER-estimate for any request that ever crosses 256K input. If long
  // documents start being embedded in a single agent prompt, this needs a tier-aware
  // price lookup rather than a constant.
  //
  // THE LIST RATE RUNS ~1.8x HOT AGAINST THE ACTUAL INVOICE, and that is recorded here
  // rather than corrected, deliberately. Measured against two real Alibaba bills:
  //   2026-07: 2,451,419 in + 147,686 out -> list predicts $1.16, invoice was $0.67
  //   2026-08 (to the 3rd): 9,139,828 in + 369,648 out -> predicts $4.10, invoice $2.21
  // Two independent months both land at ~0.55 of list, almost certainly Alibaba's
  // context caching: agent prompts carry long stable prefixes at ~4,700 tokens a call,
  // so cache hits bill at a steep discount.
  //
  // The LIST rate is kept anyway, for two reasons. The cache discount is not
  // contractual and evaporates the moment prompt prefixes change, and under-charging is
  // unrecoverable whereas over-charging is visible and refundable. But this must not be
  // mistaken for precision: the credit ledger currently debits Qwen work about 1.8x its
  // true cost. The real answer is to meter from provider-reported usage instead of
  // estimating from a rate table at all, at which point this entry stops mattering.
  "qwen/qwen-plus": { in_per_mtok: 0.4, out_per_mtok: 1.2 },
  "qwen/qwen-max-latest": { in_per_mtok: 1.6, out_per_mtok: 6.4 },
  "qwen/qwen-turbo-latest": { in_per_mtok: 0.05, out_per_mtok: 0.2 },
  "minimax/minimax-text-01": { in_per_mtok: 0.2, out_per_mtok: 1.1 },
  "mistral/mistral-large-latest": { in_per_mtok: 2.0, out_per_mtok: 6.0 },
  "groq/llama-3.3-70b-versatile": { in_per_mtok: 0.59, out_per_mtok: 0.79 },
  "openrouter/auto": { in_per_mtok: 1.0, out_per_mtok: 3.0 },
  "together/llama-3.3-70b": { in_per_mtok: 0.88, out_per_mtok: 0.88 },
  // Self-hosted via the customer's own hardware — no third-party API cost.
  "ollama/llama-3.3-70b": { in_per_mtok: 0.0, out_per_mtok: 0.0 },
};

const DEFAULT_PRICING: Pricing = { in_per_mtok: 0.5, out_per_mtok: 1.5 };

export function priceFor(model: string): Pricing {
  return MODEL_PRICING[model] ?? DEFAULT_PRICING;
}

export function estimateCostUsd(model: string, inTokens: number, outTokens: number): number {
  const p = priceFor(model);
  return (inTokens * p.in_per_mtok + outTokens * p.out_per_mtok) / 1_000_000;
}

// ---------------------------------------------------------------------------
// WM-M10: credit unit + cost-to-credit conversion + the calm legibility layer.
//
// A credit is a stable, user-facing unit that abstracts blended managed COGS
// (inference + infra). The user never sees a raw provider cost; margin lives in
// grant-sizing (entitlements.creditMonthlyBase), NOT in the per-credit price, so
// the meter stays calm and abundant. The numbers here are founder-tunable
// placeholders (plan §7); the conversion MECHANISM is final. The whole credit
// engine stays dormant behind credits_enabled() until the founder flips it.
// ---------------------------------------------------------------------------

/**
 * USD of blended COGS that one credit represents. Founder-tunable (plan §7).
 * Placeholder: 1 credit ~= $0.0002 of COGS (so $1 of COGS ~= 5,000 credits),
 * which keeps the user-facing unit abundant rather than a raw provider cost.
 */
export const CREDIT_COGS_USD = 0.0002;

/**
 * Optional per-model credit-rate multiplier applied on top of raw COGS. Lets a
 * premium reasoning model be dialed above its raw cost ratio (or a loss-leader
 * below it) without touching the conversion. Empty by default = pure COGS
 * pass-through (rate 1) for every model; founder-tunable (plan §7).
 */
export const MODEL_CREDIT_RATE: Record<string, number> = {};

/** The credit-rate multiplier for a model. Falls back to 1 for any unset/invalid rate. */
export function creditRateFor(model: string): number {
  const r = MODEL_CREDIT_RATE[model];
  return typeof r === "number" && Number.isFinite(r) && r > 0 ? r : 1;
}

/**
 * Convert a measured USD cost into credits. A billable call (cost > 0) always
 * costs at least 1 credit; a zero / negative / non-finite cost costs 0 (no
 * charge). Deterministic and margin-positive (rounds up).
 */
export function creditsForCost(estCostUsd: number, model: string): number {
  if (!Number.isFinite(estCostUsd) || estCostUsd <= 0) return 0;
  const credits = Math.ceil((estCostUsd / CREDIT_COGS_USD) * creditRateFor(model));
  return Math.max(1, credits);
}

/**
 * Project the credits a call will cost from its token shape. Composes the
 * existing USD estimator so the projection and the real (post-call) debit share
 * one source of truth.
 */
export function estimateCreditsForCall(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  return creditsForCost(estimateCostUsd(model, promptTokens, completionTokens), model);
}

/** An approximate, display-only credit range for a user-facing action. */
export type CreditRange = { min: number; max: number };

type ActionShape = {
  model: string;
  /** [low, high] prompt tokens for a typical instance of this action. */
  prompt: [number, number];
  /** [low, high] completion tokens for a typical instance of this action. */
  completion: [number, number];
};

/**
 * Representative token shapes per user-facing action. Placeholders calibrated to
 * typical calls; WM-M16 can refine them from historical ai_events averages. They
 * feed the SAME conversion as the real meter, so the displayed range never
 * contradicts what actually gets debited.
 */
const ACTION_SHAPES: Record<string, ActionShape> = {
  chat_reply: { model: "google/gemini-2.5-flash", prompt: [800, 2500], completion: [300, 1200] },
  research: { model: "google/gemini-2.5-pro", prompt: [4000, 12000], completion: [1500, 5000] },
  prd_draft: { model: "google/gemini-2.5-pro", prompt: [3000, 8000], completion: [2000, 6000] },
  mission_step: { model: "google/gemini-2.5-flash", prompt: [1500, 6000], completion: [500, 2500] },
  embedding: { model: "google/gemini-2.5-flash-lite", prompt: [200, 1500], completion: [0, 0] },
};

/** A safe, non-alarming default range for an unknown action kind. */
const DEFAULT_ACTION_RANGE: CreditRange = { min: 1, max: 10 };

/**
 * Approximate credit range for a user-facing action, for calm UI display only
 * ("a PRD draft is about N to M credits"). Returns {min,max} (min <= max, both
 * >= 1 for known kinds); unknown kinds get a conservative default. The real
 * debit is always metered from the actual call cost, never this range, so this
 * must never be rendered as a flat per-action charge.
 */
export function actionCreditRange(actionKind: string): CreditRange {
  const shape = ACTION_SHAPES[actionKind];
  if (!shape) return { ...DEFAULT_ACTION_RANGE };
  const low = estimateCreditsForCall(shape.model, shape.prompt[0], shape.completion[0]);
  const high = estimateCreditsForCall(shape.model, shape.prompt[1], shape.completion[1]);
  const min = Math.max(1, Math.min(low, high));
  const max = Math.max(min, low, high);
  return { min, max };
}

// --- Pre-call projection (WM-M12) ------------------------------------------
// The credit-debit seam projects a call's cost BEFORE making it, to halt cleanly
// when the account pool cannot cover it. The real debit is exact (from the actual
// post-call est_cost_usd); this projection is a conservative guard only.

/**
 * Default completion-token budget assumed for the pre-call projection.
 *
 * CALIBRATED FROM LIVE DATA 2026-08-03, down from 1200. Over the previous 30 days,
 * 6,524 successful calls: p50 122, p90 247, p95 337, p99 1,415, max 4,566, mean 158.
 * The old 1200 sat around the 98th percentile, so it overestimated the typical call
 * by roughly ten times.
 *
 * WHY THAT WAS NOT MERELY CONSERVATIVE, IT WAS HARMFUL. This projection exists to
 * refuse a call the account cannot pay for. Overshooting it does not make the guard
 * safer, it makes the guard refuse work the account CAN pay for. Live proof: an
 * account holding 16 credits was blocked with "balance 16 below projected 19" for
 * work whose actual debit was 12. It could afford the call three times over. Those
 * are false refusals, and they were being counted as credit exhaustion.
 *
 * 400 is p95 plus about 19 percent headroom, so it still covers the overwhelming
 * majority of calls while cutting the overshoot from ~7.6x the mean to ~2.5x. The
 * asymmetry is deliberate: the real debit is always metered exactly after the call,
 * so under-projecting risks a small recoverable overdraft, whereas over-projecting
 * silently blocks legitimate work and looks identical to a genuinely empty account.
 *
 * A flat constant is still the wrong SHAPE, and this only makes it less wrong.
 * Completion length varies by surface (reflection steps average ~115 tokens against
 * ~170 for main agent calls) and the p99 of 1,415 shows a real long tail. The right
 * fix is a per-surface or per-model budget derived from history rather than one
 * number for every call in the product.
 */
export const ASSUMED_COMPLETION_TOKENS = 400;

/** Rough prompt-token estimate from message text (~4 chars per token). Pure. */
export function estimatePromptTokens(messages: { content?: string | null }[]): number {
  const chars = messages.reduce((n, m) => n + (m.content?.length ?? 0), 0);
  return Math.ceil(chars / 4);
}

/**
 * Conservative pre-call credit projection: estimated prompt tokens plus a default
 * completion budget, run through the SAME converter the post-call debit uses, so the
 * guard and the real meter agree on the unit. Pure.
 */
export function projectCallCredits(model: string, messages: { content?: string | null }[]): number {
  return estimateCreditsForCall(model, estimatePromptTokens(messages), ASSUMED_COMPLETION_TOKENS);
}
