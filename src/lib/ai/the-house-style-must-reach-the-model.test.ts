/**
 * A RULE THE PROMPT DOES NOT CARRY HAS NEVER BEEN GIVEN (2026-08-27).
 *
 * `PLAIN_PUNCTUATION_RULE` was written to stop the model producing em dashes. It
 * was imported into `loop.server.ts` and **referenced nowhere**, so it has never
 * reached a model.
 *
 * That is why dashes kept arriving in output while four separate sanitisers were
 * being built downstream to remove them: `humanizeText` at the chokepoint,
 * `humanizeToolArgs` at the extractors, `runOutput` at seven writes, and finally
 * a database trigger. **The rule that would have stopped them at the source
 * existed the whole time and was never in a prompt.**
 *
 * `PLAIN_NAMES_RULE` joins it for the same class. S2 read
 * `checkout_single_address` out of a review card on `/today`, in prose a person
 * reads. A sanitiser cannot fix that one — an em dash has a known replacement, a
 * column name does not, and only the writer knows whether it means "the
 * single-address checkout" or "the experiment that removed the second screen".
 * Rewriting it mechanically produces a sentence that is WRONG rather than one
 * that is merely machine-flavoured.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { PLAIN_NAMES_RULE, PLAIN_PUNCTUATION_RULE } from "./house-style";

const LOOP = readFileSync(fileURLToPath(new URL("./loop.server.ts", import.meta.url)), "utf8");

describe("both rules are in the prompt, not merely imported", () => {
  it("the fresh run carries them", () => {
    expect(LOOP).toContain("    PLAIN_PUNCTUATION_RULE,\n    PLAIN_NAMES_RULE,");
  });

  it("and so does the resumed run", () => {
    // A resumed run is the same agent writing for the same person. A voice that
    // changes when a run is picked up again is a voice nobody trusts.
    expect(LOOP).toContain("      PLAIN_PUNCTUATION_RULE,\n      PLAIN_NAMES_RULE,");
  });

  it("each appears in a system prompt array and not only in the import", () => {
    // The defect this file exists for: one mention, at the top, doing nothing.
    expect(LOOP.split("PLAIN_PUNCTUATION_RULE").length - 1).toBeGreaterThanOrEqual(3);
    expect(LOOP.split("PLAIN_NAMES_RULE").length - 1).toBeGreaterThanOrEqual(3);
  });
});

describe("what the rules actually say", () => {
  it("punctuation names the characters and the replacement", () => {
    expect(PLAIN_PUNCTUATION_RULE).toContain("em dash");
    expect(PLAIN_PUNCTUATION_RULE).toContain("en dash");
    expect(PLAIN_PUNCTUATION_RULE).toContain("1-6");
  });

  it("names gives examples from our own schema, so it is recognisable", () => {
    expect(PLAIN_NAMES_RULE).toContain("checkout_single_address");
    expect(PLAIN_NAMES_RULE).toContain("forecast_horizon_date");
  });

  it("and tells the writer what to do when it does not know the human name", () => {
    // Without this, "never paste the identifier" leaves it with nothing to say.
    expect(PLAIN_NAMES_RULE).toContain("describe what it does");
  });
});
