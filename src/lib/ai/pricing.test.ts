import { describe, it, expect } from "bun:test";
import {
  CREDIT_COGS_USD,
  creditRateFor,
  creditsForCost,
  estimateCreditsForCall,
  actionCreditRange,
  estimateCostUsd,
  estimatePromptTokens,
  projectCallCredits,
  priceFor,
  MODEL_PRICING,
} from "./pricing";
import { MODELS } from "./models";

describe("CREDIT_COGS_USD", () => {
  it("is a positive, margin-bearing constant", () => {
    expect(CREDIT_COGS_USD).toBeGreaterThan(0);
    expect(Number.isFinite(CREDIT_COGS_USD)).toBe(true);
  });
});

describe("creditRateFor", () => {
  it("defaults to 1 for any model without an explicit rate", () => {
    expect(creditRateFor("openai/gpt-5")).toBe(1);
    expect(creditRateFor("totally-unknown-model")).toBe(1);
  });
});

describe("creditsForCost", () => {
  it("charges nothing for a zero, negative, or non-finite cost", () => {
    expect(creditsForCost(0, "openai/gpt-5")).toBe(0);
    expect(creditsForCost(-1, "openai/gpt-5")).toBe(0);
    expect(creditsForCost(Number.NaN, "openai/gpt-5")).toBe(0);
    expect(creditsForCost(Number.POSITIVE_INFINITY, "openai/gpt-5")).toBe(0);
  });

  it("never returns 0 for a billable (positive-cost) call", () => {
    // a cost far below one credit's COGS still rounds up to a whole credit
    expect(creditsForCost(CREDIT_COGS_USD / 1000, "openai/gpt-5")).toBe(1);
    expect(creditsForCost(CREDIT_COGS_USD, "openai/gpt-5")).toBe(1);
  });

  it("rounds up (margin-positive) and is deterministic", () => {
    const cost = CREDIT_COGS_USD * 2.4; // 2.4 credits' worth of COGS
    expect(creditsForCost(cost, "openai/gpt-5")).toBe(3);
    expect(creditsForCost(cost, "openai/gpt-5")).toBe(3);
  });

  it("returns whole credits and is monotonic in cost", () => {
    const cheap = creditsForCost(CREDIT_COGS_USD * 10, "openai/gpt-5");
    const dear = creditsForCost(CREDIT_COGS_USD * 100, "openai/gpt-5");
    expect(Number.isInteger(cheap)).toBe(true);
    expect(Number.isInteger(dear)).toBe(true);
    expect(dear).toBeGreaterThan(cheap);
  });
});

describe("estimateCreditsForCall", () => {
  it("composes the USD estimator (one source of truth)", () => {
    const model = "google/gemini-2.5-pro";
    const expected = creditsForCost(estimateCostUsd(model, 3000, 2000), model);
    expect(estimateCreditsForCall(model, 3000, 2000)).toBe(expected);
  });

  it("charges 0 for a no-token call", () => {
    expect(estimateCreditsForCall("openai/gpt-5", 0, 0)).toBe(0);
  });

  it("a premium model costs more credits than a cheap one for the same shape", () => {
    const premium = estimateCreditsForCall("anthropic/claude-opus-4", 3000, 2000);
    const cheap = estimateCreditsForCall("google/gemini-2.5-flash-lite", 3000, 2000);
    expect(premium).toBeGreaterThan(cheap);
    expect(cheap).toBeGreaterThanOrEqual(1); // still billable
  });

  it("a longer completion costs at least as many credits as a shorter one", () => {
    const model = "openai/gpt-5";
    const short = estimateCreditsForCall(model, 1000, 200);
    const long = estimateCreditsForCall(model, 1000, 2000);
    expect(long).toBeGreaterThanOrEqual(short);
  });

  it("an unknown model still produces a billable credit count (neutral fallback)", () => {
    expect(estimateCreditsForCall("some/unknown-model", 2000, 1000)).toBeGreaterThanOrEqual(1);
  });
});

describe("actionCreditRange (legibility layer)", () => {
  it("returns an ordered, billable, whole-credit range for a known action", () => {
    const r = actionCreditRange("prd_draft");
    expect(Number.isInteger(r.min)).toBe(true);
    expect(Number.isInteger(r.max)).toBe(true);
    expect(r.min).toBeGreaterThanOrEqual(1);
    expect(r.max).toBeGreaterThanOrEqual(r.min);
  });

  it("a research action is heavier than a single chat reply", () => {
    const chat = actionCreditRange("chat_reply");
    const research = actionCreditRange("research");
    expect(research.max).toBeGreaterThan(chat.max);
  });

  it("falls back to a safe, non-alarming default for an unknown kind", () => {
    const r = actionCreditRange("not-a-real-action");
    expect(r.min).toBeGreaterThanOrEqual(1);
    expect(r.max).toBeGreaterThanOrEqual(r.min);
  });

  it("the low end derives from the SAME conversion as the real meter", () => {
    // prd_draft's low shape (3000 prompt / 2000 completion on gemini-2.5-pro) must
    // equal the direct estimate, proving the range is not an independent number.
    const direct = estimateCreditsForCall("google/gemini-2.5-pro", 3000, 2000);
    expect(actionCreditRange("prd_draft").min).toBe(direct);
  });
});

describe("MODEL_PRICING — opened (model-agnostic) catalog", () => {
  /**
   * EVERY shippable model must be priced, and this is checked against the registry
   * rather than a hand-written list.
   *
   * WHY THIS REPLACED A SPOT CHECK. The previous version of this test asserted the
   * same property against six ids typed out by hand. It passed continuously while
   * `qwen/qwen-plus` went unpriced, because a hand-maintained list cannot know about
   * a model added after it was written, and qwen-plus was added later. It then
   * silently took the {0.5, 1.5} neutral default and went on to carry the majority of
   * all agent traffic on it (2,837 calls, 11.5M input tokens), so every credit debit
   * for the product's busiest path was computed from a placeholder. Five accounts
   * drained. A test that enumerates its own subjects cannot catch the thing it was
   * written to catch, so this one enumerates MODELS instead.
   *
   * DEFAULT_PRICING stays as the crash-proof floor for a genuinely unknown BYO model
   * id (asserted below); it is not acceptable for a model WE ship in the picker.
   *
   * IT ASSERTS MEMBERSHIP, NOT VALUE, and that distinction is load-bearing. The first
   * version of this test asked "does priceFor() return something other than {0.5, 1.5}",
   * which flagged `openai/gpt-5-mini` even though it is correctly priced, because its
   * real rate happens to BE $0.5/$1.5. Comparing against the default's value cannot
   * distinguish a deliberate price that coincides with the default from a silent
   * fallback. Only the presence of the key can.
   */
  it("prices every model in the registry explicitly, never the neutral default", () => {
    const unpriced = MODELS.filter(
      (m) => !Object.prototype.hasOwnProperty.call(MODEL_PRICING, m.id),
    ).map((m) => `${m.id} (provider ${m.provider}, live=${m.live})`);

    expect(unpriced).toEqual([]);
  });

  it("self-hosted Ollama has zero third-party API cost", () => {
    expect(priceFor("ollama/llama-3.3-70b")).toEqual({ in_per_mtok: 0, out_per_mtok: 0 });
    expect(estimateCostUsd("ollama/llama-3.3-70b", 100_000, 100_000)).toBe(0);
  });

  it("a truly unknown custom model degrades safely to the neutral default (never crashes)", () => {
    expect(priceFor("acme/unlisted-model")).toEqual({ in_per_mtok: 0.5, out_per_mtok: 1.5 });
    expect(estimateCostUsd("acme/unlisted-model", 1000, 1000)).toBeGreaterThan(0);
  });
});

describe("estimatePromptTokens (WM-M12 pre-call projection)", () => {
  it("is zero for empty input and scales ~4 chars per token", () => {
    expect(estimatePromptTokens([])).toBe(0);
    expect(estimatePromptTokens([{ content: "" }])).toBe(0);
    expect(estimatePromptTokens([{ content: "a".repeat(40) }])).toBe(10);
    expect(estimatePromptTokens([{ content: "a".repeat(20) }, { content: "b".repeat(20) }])).toBe(
      10,
    );
  });

  it("tolerates null / undefined content", () => {
    expect(estimatePromptTokens([{ content: null }, { content: undefined }])).toBe(0);
  });
});

describe("projectCallCredits (WM-M12 pre-call projection)", () => {
  it("is a positive, whole-credit projection for a real prompt", () => {
    const credits = projectCallCredits("google/gemini-2.5-pro", [{ content: "x".repeat(8000) }]);
    expect(Number.isInteger(credits)).toBe(true);
    expect(credits).toBeGreaterThanOrEqual(1);
  });

  it("a premium model projects more than a cheap one for the same prompt", () => {
    const msgs = [{ content: "y".repeat(4000) }];
    expect(projectCallCredits("anthropic/claude-opus-4", msgs)).toBeGreaterThan(
      projectCallCredits("google/gemini-2.5-flash-lite", msgs),
    );
  });
});
