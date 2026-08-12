import { describe, expect, test } from "bun:test";
import { forecastGroupLabel, lateness, deferredNote } from "./forecast-desk-words";
import { VERDICT_SAYS } from "./verdict-words";

describe("the two desk groups never read as synonyms (FC-01)", () => {
  /**
   * The forecast group and the spec-outcome group sit on one route. They answer
   * different questions, so the label has to say which question this group is
   * asking, or a reader takes the two for synonyms.
   */
  test("the forecast group names the question it answers", () => {
    expect(forecastGroupLabel(2)).toBe("Forecasts due (2)");
    expect(forecastGroupLabel(2)).not.toContain("Outcome");
    expect(forecastGroupLabel(2)).not.toContain("Bet");
  });

  test("the label survives a single item without reading as a plural", () => {
    expect(forecastGroupLabel(1)).toBe("Forecasts due (1)");
  });

  test("no verdict word from the outcome desk leaks into the forecast label", () => {
    for (const word of Object.values(VERDICT_SAYS)) {
      expect(forecastGroupLabel(3)).not.toContain(word);
    }
  });
});

describe("lateness reads off the frozen horizon (FC-01)", () => {
  test("today, one day, many days", () => {
    expect(lateness(0)).toBe("due today");
    expect(lateness(1)).toBe("due 1 day ago");
    expect(lateness(3)).toBe("due 3 days ago");
  });

  /**
   * A negative cannot happen through the queue, which only returns passed
   * horizons, but a clock skew must not render "due -1 days ago".
   */
  test("a horizon that has not passed still reads sensibly", () => {
    expect(lateness(-2)).toBe("due today");
  });
});

describe("deferredNote (FC-01)", () => {
  /**
   * The count is kept because it is signal: a forecast deferred four times is
   * one whose observable never resolved. Hiding it would be the opposite of why
   * the column exists.
   */
  test("says nothing when nobody has deferred it", () => {
    expect(deferredNote(0)).toBeNull();
  });

  test("surfaces the count once it exists", () => {
    expect(deferredNote(1)).toBe("given more time once");
    expect(deferredNote(4)).toBe("given more time 4 times");
  });
});
