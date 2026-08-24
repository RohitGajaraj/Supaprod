import { describe, expect, test } from "bun:test";
import {
  SOURCE_LABEL,
  OUTCOME_WORD,
  ageOf,
  hasSource,
  displayWho,
  forecastChip,
  forecastTitle,
  type DecisionRow,
} from "../decisions-shared";
import { DECISION_SOURCES } from "@/lib/decisions.functions";

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE_LABEL - Decision source to display label mapping
// ─────────────────────────────────────────────────────────────────────────────
describe("SOURCE_LABEL", () => {
  test("is a Record with all string values", () => {
    expect(typeof SOURCE_LABEL).toBe("object");
    Object.values(SOURCE_LABEL).forEach((val) => {
      expect(typeof val).toBe("string");
    });
  });

  test("maps 'mission' to 'Mission'", () => {
    expect(SOURCE_LABEL.mission).toBe("Mission");
  });

  test("maps 'prd' to 'Spec'", () => {
    expect(SOURCE_LABEL.prd).toBe("Spec");
  });

  test("maps 'meeting' to 'Meeting'", () => {
    expect(SOURCE_LABEL.meeting).toBe("Meeting");
  });

  test("maps 'manual' to 'Manual'", () => {
    expect(SOURCE_LABEL.manual).toBe("Manual");
  });

  /**
   * THIS TEST USED TO READ `expect(Object.keys(SOURCE_LABEL).length).toBe(4)`
   * and it was worse than no test at all.
   *
   * A count is not the claim. The claim is "every origin a decision can carry
   * has a label", and a hard-coded 4 asserts the opposite of that: it PINS the
   * map to a size the database had already outgrown by five values, so the
   * correct fix — adding the missing labels — would have turned this test red.
   * A guard that fails when the bug is fixed is a guard defending the bug.
   *
   * It is now the exhaustiveness check it was always trying to be. It reads the
   * origins from the same const the type is derived from, so it cannot be
   * satisfied by a stale literal and cannot go stale itself.
   */
  test("labels every origin a decision can actually carry", () => {
    const missing = DECISION_SOURCES.filter((s) => !SOURCE_LABEL[s]);
    expect(missing).toEqual([]);
    expect(Object.keys(SOURCE_LABEL).sort()).toEqual([...DECISION_SOURCES].sort());
  });

  test("all labels are capitalized", () => {
    Object.values(SOURCE_LABEL).forEach((label) => {
      expect(label[0]).toBe(label[0]?.toUpperCase());
    });
  });

  test("all values are non-empty strings", () => {
    Object.values(SOURCE_LABEL).forEach((label) => {
      expect(label.length).toBeGreaterThan(0);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// OUTCOME_WORD - what happened to a call, in plain words
//
// Replaced the retired STATUS_TONE / VerdictTone map, 2026-07-29. The chip it
// fed is gone. Green and red carry outcomes and own those two; a call nobody
// has settled yet is NOT an outcome, so it stays monochrome rather than
// wearing ember, which marks the human and is spent on Today where the
// deciding actually happens.
// ─────────────────────────────────────────────────────────────────────────────
describe("OUTCOME_WORD", () => {
  test("has exactly three statuses", () => {
    expect(Object.keys(OUTCOME_WORD).length).toBe(3);
  });

  test("approved reads as Kept, and green carries it", () => {
    expect(OUTCOME_WORD.approved.word).toBe("Kept");
    expect(OUTCOME_WORD.approved.tone).toBe("sp-pass");
  });

  test("rejected reads as Dropped, and red carries it", () => {
    expect(OUTCOME_WORD.rejected.word).toBe("Dropped");
    expect(OUTCOME_WORD.rejected.tone).toBe("sp-fail");
  });

  test("pending stays MONOCHROME and never wears ember", () => {
    expect(OUTCOME_WORD.pending.word).toBe("Not settled");
    expect(OUTCOME_WORD.pending.tone).toBe("");
  });

  test("every tone is an sp- class or empty, never a raw hue token", () => {
    Object.values(OUTCOME_WORD).forEach(({ tone }) => {
      expect(tone === "" || tone.startsWith("sp-")).toBe(true);
    });
  });

  test("colour is spent on settled outcomes only", () => {
    expect(Object.values(OUTCOME_WORD).filter((v) => v.tone !== "")).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ageOf - Format relative time for decision age
// ─────────────────────────────────────────────────────────────────────────────
describe("ageOf", () => {
  test("returns 'now' for very recent timestamp", () => {
    const now = new Date().toISOString();
    const age = ageOf(now);
    expect(age).toBe("now");
  });

  test("returns minute format for < 60 minutes", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    const age = ageOf(fiveMinutesAgo);
    expect(age).toMatch(/^\d+m ago$/);
  });

  test("returns hour format for < 24 hours", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60_000).toISOString();
    const age = ageOf(threeHoursAgo);
    expect(age).toMatch(/^\d+h ago$/);
  });

  test("returns day format for < 7 days", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60_000).toISOString();
    const age = ageOf(threeDaysAgo);
    expect(age).toMatch(/^\d+d ago$/);
  });

  test("returns short date for >= 7 days", () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60_000).toISOString();
    const age = ageOf(twoWeeksAgo);
    expect(age).toMatch(/\w{3} \d+/); // "Jul 12" format
  });

  test("returns empty string for malformed timestamp", () => {
    expect(ageOf("not-a-date")).toBe("");
    expect(ageOf("invalid-iso")).toBe("");
  });

  test("returns empty string for empty input", () => {
    expect(ageOf("")).toBe("");
  });

  test("handles edge case of exactly 60 minutes", () => {
    const exactlyOneHourAgo = new Date(Date.now() - 60 * 60_000).toISOString();
    const age = ageOf(exactlyOneHourAgo);
    expect(age).toMatch(/^\d+h ago$/);
  });

  test("handles edge case of exactly 24 hours", () => {
    const exactlyOneDayAgo = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
    const age = ageOf(exactlyOneDayAgo);
    expect(age).toMatch(/^\d+d ago$/);
  });

  test("handles edge case of exactly 7 days", () => {
    const exactlySevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60_000).toISOString();
    const age = ageOf(exactlySevenDaysAgo);
    expect(age).toMatch(/\w{3} \d+/);
  });

  test("floors values correctly (no decimals)", () => {
    const time = new Date(Date.now() - 90_500).toISOString();
    const age = ageOf(time);
    // Should show 1m, not 1.5m
    expect(age).toMatch(/^\d+[mhd] ago$/);
  });

  test("returns consistent format for future dates (same as now)", () => {
    const future = new Date(Date.now() + 1000).toISOString();
    const age = ageOf(future);
    expect(age).toBe("now");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// hasSource - Check if decision has a backing source
// ─────────────────────────────────────────────────────────────────────────────
describe("hasSource", () => {
  test("returns true when mission_id is set", () => {
    const d: DecisionRow = {
      id: "d1",
      mission_id: "m1",
      prd_id: null,
      meeting_id: null,
      status: "approved",
      created_at: "2026-07-12T00:00:00Z",
      agent_slug: null,
    };
    expect(hasSource(d)).toBe(true);
  });

  test("returns true when prd_id is set", () => {
    const d: DecisionRow = {
      id: "d1",
      mission_id: null,
      prd_id: "p1",
      meeting_id: null,
      status: "approved",
      created_at: "2026-07-12T00:00:00Z",
      agent_slug: null,
    };
    expect(hasSource(d)).toBe(true);
  });

  test("returns true when meeting_id is set", () => {
    const d: DecisionRow = {
      id: "d1",
      mission_id: null,
      prd_id: null,
      meeting_id: "mtg1",
      status: "approved",
      created_at: "2026-07-12T00:00:00Z",
      agent_slug: null,
    };
    expect(hasSource(d)).toBe(true);
  });

  test("returns true when multiple sources are set", () => {
    const d: DecisionRow = {
      id: "d1",
      mission_id: "m1",
      prd_id: "p1",
      meeting_id: "mtg1",
      status: "approved",
      created_at: "2026-07-12T00:00:00Z",
      agent_slug: null,
    };
    expect(hasSource(d)).toBe(true);
  });

  test("returns false when all sources are null", () => {
    const d: DecisionRow = {
      id: "d1",
      mission_id: null,
      prd_id: null,
      meeting_id: null,
      status: "approved",
      created_at: "2026-07-12T00:00:00Z",
      agent_slug: null,
    };
    expect(hasSource(d)).toBe(false);
  });

  test("returns false when all sources are undefined", () => {
    const d: DecisionRow = {
      id: "d1",
      mission_id: undefined,
      prd_id: undefined,
      meeting_id: undefined,
      status: "approved",
      created_at: "2026-07-12T00:00:00Z",
      agent_slug: null,
    };
    expect(hasSource(d)).toBe(false);
  });

  test("treats empty string as falsy (no source)", () => {
    const d: DecisionRow = {
      id: "d1",
      mission_id: "",
      prd_id: null,
      meeting_id: null,
      status: "approved",
      created_at: "2026-07-12T00:00:00Z",
      agent_slug: null,
    };
    expect(hasSource(d)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// displayWho - Format decision maker name
// ─────────────────────────────────────────────────────────────────────────────
describe("displayWho", () => {
  test("returns 'You' when slug is null", () => {
    expect(displayWho(null)).toBe("You");
  });

  test("returns 'You' when slug is empty string", () => {
    // Empty string is falsy, so displayWho should return "You" (the human's decision)
    expect(displayWho("")).toBe("You");
  });

  test("returns agent display name for known agent slug", () => {
    // This depends on the agentDisplayName implementation
    // Known agents include 'prd-writer', 'decision-maker', etc.
    const result = displayWho("prd-writer");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  test("resolves agent slug consistently", () => {
    const result1 = displayWho("prd-writer");
    const result2 = displayWho("prd-writer");
    expect(result1).toBe(result2);
  });

  test("returns 'You' for falsy slug", () => {
    expect(displayWho(null)).toBe("You");
  });

  test("handles unknown agent slug (fallback behavior)", () => {
    const result = displayWho("unknown-agent-slug");
    expect(typeof result).toBe("string");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// forecastChip - the forecast on a list row, and its colour rule
//
// Green and red carry outcomes; a hit and a miss ARE outcomes. Inconclusive
// did not settle and an unresolved forecast is waiting, so both stay
// monochrome (the system's "hold") rather than borrowing a colour.
// ─────────────────────────────────────────────────────────────────────────────
describe("forecastChip", () => {
  test("returns null when the decision carries no forecast claim", () => {
    expect(forecastChip({})).toBeNull();
    expect(forecastChip({ forecast_claim: null })).toBeNull();
    expect(forecastChip({ forecast_claim: "   " })).toBeNull();
  });

  test("a resolved hit reads in FORECAST_SAYS words, carried by green", () => {
    const chip = forecastChip({ forecast_claim: "Activation doubles.", forecast_resolution: "hit" });
    expect(chip?.word).toBe("you called it");
    expect(chip?.tone).toBe("sp-pass");
    expect(chip?.claim).toBe("Activation doubles.");
  });

  test("a resolved miss reads in FORECAST_SAYS words, carried by red", () => {
    const chip = forecastChip({
      forecast_claim: "Churn stays under 2%.",
      forecast_resolution: "miss",
    });
    expect(chip?.word).toBe("it went the other way");
    expect(chip?.tone).toBe("sp-fail");
  });

  test("inconclusive is muted, never a colour", () => {
    const chip = forecastChip({
      forecast_claim: "Trials convert.",
      forecast_resolution: "inconclusive",
    });
    expect(chip?.word).toBe("the evidence did not settle it");
    expect(chip?.tone).toBe("");
  });

  test("no resolution yet reads as a muted hold", () => {
    const chip = forecastChip({ forecast_claim: "Signups rise.", forecast_resolution: null });
    expect(chip?.word).toBe("hold");
    expect(chip?.tone).toBe("");
    // Also when the resolution key is absent entirely (pre-forecast rows).
    expect(forecastChip({ forecast_claim: "Signups rise." })?.tone).toBe("");
  });

  test("colour is spent on settled outcomes only, and every tone is an sp- class or empty", () => {
    const chips = ["hit", "miss", "inconclusive", null].map((r) =>
      forecastChip({ forecast_claim: "x", forecast_resolution: r }),
    );
    for (const chip of chips) {
      expect(chip!.tone === "" || chip!.tone.startsWith("sp-")).toBe(true);
    }
    expect(chips.filter((c) => c!.tone !== "")).toHaveLength(2);
  });

  test("trims the claim it returns", () => {
    expect(forecastChip({ forecast_claim: "  padded claim  " })?.claim).toBe("padded claim");
  });
});

describe("forecastTitle", () => {
  test("is undefined when there is nothing to say", () => {
    expect(forecastTitle({})).toBeUndefined();
    expect(forecastTitle({ forecast_how_we_will_know: null })).toBeUndefined();
    expect(forecastTitle({ forecast_how_we_will_know: "   " })).toBeUndefined();
  });

  test("carries the observable", () => {
    expect(forecastTitle({ forecast_how_we_will_know: "Weekly actives cross 40" })).toContain(
      "How you will know: Weekly actives cross 40",
    );
  });

  test("carries the horizon date", () => {
    const t = forecastTitle({ forecast_horizon_date: "2026-09-15T23:59:59Z" }) ?? "";
    expect(t).toMatch(/^By Sep 1[45], 2026$/); // local-tz day shift tolerated
    expect(t).toContain("By ");
  });

  test("joins both parts with the separator", () => {
    const t = forecastTitle({
      forecast_how_we_will_know: "Churn under 2%",
      forecast_horizon_date: "2026-10-01T00:00:00Z",
    })!;
    expect(t).toContain(" · ");
    expect(t.startsWith("How you will know:")).toBe(true);
  });

  test("ignores a malformed horizon rather than printing Invalid Date", () => {
    expect(forecastTitle({ forecast_horizon_date: "not-a-date" })).toBeUndefined();
  });
});
