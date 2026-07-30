/**
 * The rule: REFORMAT, never invent. There is no table of pretty names here, so
 * an unrecognised slug has to survive to the screen intact rather than become a
 * confident wrong answer.
 */
import { describe, test, expect } from "bun:test";
import { modelLabel, spendLabel } from "./model-label";

describe("modelLabel: the slug becomes words", () => {
  // The exact string the founder was reading under an answer.
  test("the one he complained about", () => {
    expect(modelLabel("google/gemini-3-flash-preview")).toBe("Google Gemini 3 Flash");
  });

  test("vendors keep the casing they are known by", () => {
    expect(modelLabel("openai/gpt-5-mini")).toBe("OpenAI GPT 5 Mini");
    expect(modelLabel("anthropic/claude-opus-4-5")).toBe("Anthropic Claude Opus 4 5");
    expect(modelLabel("xai/grok-4")).toBe("xAI Grok 4");
  });

  // Release channel is addressed to us, not to a reader.
  test("the channel goes, the version never does", () => {
    expect(modelLabel("google/gemini-3-pro-preview")).toBe("Google Gemini 3 Pro");
    expect(modelLabel("meta/llama-4-latest")).toBe("Meta Llama 4");
    expect(modelLabel("anthropic/claude-3-5-sonnet-20241022")).toBe("Anthropic Claude 3 5 Sonnet");
  });

  test("a vendor that already opens the name does not stutter", () => {
    expect(modelLabel("openai/openai-o3")).toBe("OpenAI o3");
  });

  test("no vendor prefix is fine", () => {
    expect(modelLabel("gpt-5")).toBe("GPT 5");
  });

  // The honest failure: it stays on screen exactly as given.
  test("nothing it can parse comes back untouched", () => {
    expect(modelLabel("x")).toBe("X");
    expect(modelLabel("some-internal-router-id-9f2")).toBe("Some Internal Router Id 9f2");
    expect(modelLabel("")).toBe(null);
    expect(modelLabel(null)).toBe(null);
    expect(modelLabel(undefined)).toBe(null);
  });
});

describe("spendLabel: a cost we did not measure is never a zero", () => {
  test("sub-cent says so, rather than rounding to free", () => {
    expect(spendLabel(0.0004)).toBe("under a cent");
  });

  test("real money is money", () => {
    expect(spendLabel(1.5)).toBe("$1.50");
    expect(spendLabel(0.02)).toBe("$0.02");
  });

  // The important one: absent, never "$0.00". On a surface whose argument is
  // that every call is on the record, printing a zero we did not measure is the
  // one unaffordable rounding.
  test("unknown and zero both render nothing at all", () => {
    expect(spendLabel(0)).toBe(null);
    expect(spendLabel(null)).toBe(null);
    expect(spendLabel(undefined)).toBe(null);
    expect(spendLabel(Number.NaN)).toBe(null);
  });
});
