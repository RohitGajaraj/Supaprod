/**
 * A VERDICT MUST GRADE THE BET THAT WAS MADE (S4-052, 2026-08-27).
 *
 * The pairing this product sells is a verdict measured against a forecast
 * recorded before the outcome was known. **It has never once happened.**
 *
 * `learning.record` has fired exactly twice in the product's life. Those two are
 * the first rows ever to carry `decision_id` at all — 133 learnings before them,
 * NULL on every one. Both graded decision `663c7376`:
 *
 *   forecast   "The PRD will be approved and design gate cleared within 3 business days"
 *   read by    "prd.get will return status='approved' and design_gate_status='cleared'"
 *   due        2026-08-29
 *   verdicts   both written 2026-08-25 19:40, four days early, both grading
 *              tablet checkout abandonment instead
 *
 * The rows were joined by a foreign key and nothing checked they were about the
 * same thing. A foreign key cannot carry a semantic pairing.
 *
 * ── WHY THIS FILE EXISTS RATHER THAN A BETTER PARAGRAPH ────────────────────
 * The tool's description already named this failure, in good prose: *"If the
 * evidence is not in yet, DO NOT CALL THIS TOOL AT ALL ... a wrong confident
 * verdict is not a wrong row, it is wrong advice for months."* It was the only
 * thing standing between a model and a wrong verdict, it was tested twice, and
 * it failed twice. The guard was prose where it needed to be a predicate.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = readFileSync(
  fileURLToPath(new URL("./tools/registry.server.ts", import.meta.url)),
  "utf8",
);
const GUARD = SRC.slice(SRC.indexOf("THE GUARD THAT WAS PROSE, MADE A PREDICATE"));

describe("1 · it will not grade a bet before its horizon", () => {
  it("compares the horizon against now", () => {
    expect(GUARD).toContain("forecast_horizon_date");
    expect(GUARD).toContain("Date.parse(due) > Date.now()");
  });

  it("and refuses rather than warning", () => {
    expect(GUARD).toContain("ok: false");
    expect(GUARD).toContain("no outcome to grade yet");
  });

  it("naming the date, so the refusal says when to come back", () => {
    expect(GUARD).toContain("due.slice(0, 10)");
  });
});

describe("2 · it will not grade a claim the forecast did not make", () => {
  it("reads the observable the forecast named", () => {
    expect(GUARD).toContain("forecast_how_we_will_know");
  });

  it("refuses only on ZERO overlap, which is the calibration", () => {
    /*
     * The weakest test that catches the measured failure. A process-speed
     * forecast graded with a checkout metric shares no significant word; the
     * same fact worded differently shares several. Anything stricter would
     * police wording, which is not this tool's business.
     */
    expect(GUARD).toContain("want.size > 0 && !shared");
  });

  it("and quotes the bet back, so the refusal is actionable", () => {
    expect(GUARD).toContain("The bet was");
    expect(GUARD).toContain("re-ranks the bet behind it");
  });
});

describe("THE CALIBRATION, checked on the real strings that failed", () => {
  const STOPWORDS = new Set(
    (SRC.match(/const FORECAST_STOPWORDS = new Set\(\[([\s\S]*?)\]\)/)?.[1] ?? "")
      .split(",")
      .map((w) => w.trim().replace(/^"|"$/g, ""))
      .filter(Boolean),
  );
  const significant = (t: string) =>
    new Set((t.toLowerCase().match(/[a-z_][a-z0-9_]{3,}/g) ?? []).filter((w) => !STOPWORDS.has(w)));
  const overlaps = (observable: string, summary: string) => {
    const want = significant(observable);
    const got = significant(summary);
    return [...want].some((w) => got.has(w));
  };

  const REAL_OBSERVABLE = "prd.get will return status='approved' and design_gate_status='cleared'";

  it("REFUSES the verdict that actually shipped", () => {
    const shipped =
      "Spec required <=5% abandonment on tablet address re-confirm screen within 7 days of full rollout. Actual outcome: tablet checkout completion is 67%, ~33% abandonment.";
    expect(overlaps(REAL_OBSERVABLE, shipped)).toBe(false);
  });

  it("ALLOWS an honest verdict on the same bet, worded differently", () => {
    // The guard must not police wording. This grades the thing predicted.
    const honest =
      "The spec reached approved and the design gate cleared on the second day, inside the window.";
    expect(overlaps(REAL_OBSERVABLE, honest)).toBe(true);
  });
});
