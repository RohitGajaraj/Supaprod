import { describe, expect, it } from "bun:test";

import { FORECAST_SAYS } from "@/components/learn/forecast-words";
import { VERDICT_SAYS } from "@/components/learn/verdict-words";

describe("one word for a forecast, on every surface", () => {
  it("has a plain sentence for each of the three, and none is the column's word", () => {
    /*
     * The run screen printed `hit`, `miss` and `inconclusive` straight from the
     * column while /learn said these. 91 of the 176 forecasts are resolved, so
     * the two surfaces disagreed about the common case.
     */
    for (const [key, says] of Object.entries(FORECAST_SAYS)) {
      expect(says.toLowerCase()).not.toContain(key);
      expect(says.split(" ").length).toBeGreaterThan(2);
    }
  });

  it("keeps the three keys the database constrains, and no fourth", () => {
    expect(Object.keys(FORECAST_SAYS).sort()).toEqual(["hit", "inconclusive", "miss"]);
  });

  it("never shares a word with the spec-outcome verdicts, which are orthogonal", () => {
    /*
     * `forecast-words.ts` is emphatic that these must never be mapped onto each
     * other: a forecast can be a HIT while the spec outcome is MISSED, both
     * correct at once. Identical wording would invite exactly that mapping.
     */
    const forecast = Object.values(FORECAST_SAYS);
    const outcome = Object.values(VERDICT_SAYS);
    for (const f of forecast) expect(outcome).not.toContain(f);
  });
});
