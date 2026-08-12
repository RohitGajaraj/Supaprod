import { describe, expect, test } from "bun:test";
import { FORECAST_SAYS } from "./forecast-words";
import { VERDICT_SAYS } from "./verdict-words";

describe("forecast words stay apart from verdict words (FC-01)", () => {
  test("every resolution has a plain phrase", () => {
    expect(FORECAST_SAYS.hit).toBe("you called it");
    expect(FORECAST_SAYS.miss).toBe("it went the other way");
    expect(FORECAST_SAYS.inconclusive).toBe("the evidence did not settle it");
  });

  /**
   * The two vocabularies answer different questions and a single event can take
   * different values in each: forecast "this will not move activation", it does
   * not move, and the forecast is a hit while the spec outcome is missed. A
   * shared key set would invite a mapping function, and a mapping function
   * cannot express that, so it would silently pick a winner.
   */
  test("the key sets are disjoint, so no mapping can be written", () => {
    const forecastKeys = Object.keys(FORECAST_SAYS);
    const verdictKeys = Object.keys(VERDICT_SAYS);
    expect(forecastKeys.filter((k) => verdictKeys.includes(k))).toEqual([]);
  });

  test("no phrase claims the product made the call", () => {
    for (const phrase of Object.values(FORECAST_SAYS)) {
      expect(phrase).not.toContain("Supaprod");
    }
  });

  /**
   * "too early" is a check date, not a verdict, and verdict-words.ts says the
   * same of its own three. A fourth key here would be somebody trying to record
   * a deferral as a kind of outcome.
   */
  test("there are exactly three, and no fourth for a deferral", () => {
    expect(Object.keys(FORECAST_SAYS).sort()).toEqual(["hit", "inconclusive", "miss"]);
  });
});
