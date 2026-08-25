import { describe, expect, test } from "bun:test";

import { summaryText } from "./run-summary";

const base = {
  title: "Checklist steps vanish when the crew drops signal in a basement",
  stationName: "Build",
  hold: null,
  url: "https://supaprod.ai/track/x",
};

describe("summaryText", () => {
  test("a station that re-filed the same thing five times reads as one fact", () => {
    const text = summaryText({
      ...base,
      stops: [
        {
          label: "Design",
          state: "done",
          nouns: Array(5).fill("Atlas Offline Checklist Sync Resilience Surface"),
        },
      ],
    });
    expect(text).toContain("Atlas Offline Checklist Sync Resilience Surface (5 filings)");
    // The repeated title must appear exactly once in the whole summary.
    expect(text.split("Atlas Offline Checklist Sync Resilience Surface").length - 1).toBe(1);
  });

  test("distinct things stay distinct and uncounted ones carry no tally", () => {
    const text = summaryText({
      ...base,
      stops: [{ label: "Plan", state: "done", nouns: ["A spec", "A spec", "Another task"] }],
    });
    expect(text).toContain("- Plan: A spec (2 filings), Another task");
  });

  test("a body that leaked into the title is bounded, not pasted whole", () => {
    const leaked = `${"x".repeat(400)} 1. **Offline Indicator (Top Bar)**`;
    const text = summaryText({
      ...base,
      stops: [{ label: "Design", state: "done", nouns: [leaked] }],
    });
    expect(text).not.toContain("**Offline Indicator");
    expect(text.length - base.title.length - base.url.length).toBeLessThan(400);
  });

  test("the hold sentence rides along when there is one", () => {
    const text = summaryText({ ...base, hold: "Waiting on a person.", stops: [] });
    expect(text).toContain("Why it is stopped: Waiting on a person.");
  });
});
