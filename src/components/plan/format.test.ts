import { describe, expect, test } from "bun:test";
import {
  stateChip,
  citesLabel,
  measureCaps,
  splitCitationMarkers,
  decisionOptionLabel,
  specRecommendation,
  stripAutoPrefix,
  isAutoTitle,
} from "./format";

describe("stateChip", () => {
  test("approved -> APPROVED moss", () => {
    expect(stateChip("approved")).toEqual({ label: "APPROVED", tone: "moss" });
  });
  test("shipped -> SHIPPED moss", () => {
    expect(stateChip("shipped")).toEqual({ label: "SHIPPED", tone: "moss" });
  });
  test("review -> CRITIC REVIEW marigold", () => {
    expect(stateChip("review")).toEqual({ label: "CRITIC REVIEW", tone: "marigold" });
  });
  test("draft -> DRAFTING glacier", () => {
    expect(stateChip("draft")).toEqual({ label: "DRAFTING", tone: "glacier" });
  });
  test("unrecognized status fails safe to DRAFTING glacier", () => {
    expect(stateChip("")).toEqual({ label: "DRAFTING", tone: "glacier" });
    expect(stateChip("unknown")).toEqual({ label: "DRAFTING", tone: "glacier" });
  });
});

describe("specRecommendation", () => {
  test("shipped -> watch the outcome", () => {
    expect(specRecommendation("shipped")).toBe(
      "Shipped. Watch the outcome and let Learn close the loop.",
    );
  });
  test("approved -> hand to Build", () => {
    expect(specRecommendation("approved")).toBe(
      "Hand it to Build to start a mission from this spec.",
    );
  });
  test("review -> approve or send back", () => {
    expect(specRecommendation("review")).toBe(
      "Approve to log the decision and unblock Build, or send it back to draft.",
    );
  });
  test("draft -> refine then Critic", () => {
    expect(specRecommendation("draft")).toBe(
      "Refine the spec, then send it to the Critic for review.",
    );
  });
  test("unrecognized status falls back to the draft guidance", () => {
    expect(specRecommendation("")).toBe("Refine the spec, then send it to the Critic for review.");
    expect(specRecommendation("weird")).toBe(
      "Refine the spec, then send it to the Critic for review.",
    );
  });
});

describe("citesLabel", () => {
  test("zero citations -> null", () => {
    expect(citesLabel([])).toBeNull();
    expect(citesLabel(null)).toBeNull();
    expect(citesLabel(undefined)).toBeNull();
    expect(citesLabel("not an array")).toBeNull();
  });
  test("singular", () => {
    expect(citesLabel([{ n: 1 }])).toBe("1 SOURCE");
  });
  test("plural", () => {
    expect(citesLabel([{ n: 1 }, { n: 2 }, { n: 3 }])).toBe("3 SOURCES");
  });
});

describe("measureCaps", () => {
  test("upcases verbatim", () => {
    expect(measureCaps("drop-off -20% by Aug 1")).toBe("DROP-OFF -20% BY AUG 1");
  });
  test("null/empty -> null", () => {
    expect(measureCaps(null)).toBeNull();
    expect(measureCaps("")).toBeNull();
    expect(measureCaps("   ")).toBeNull();
  });
});

describe("decisionOptionLabel", () => {
  test("strips the [auto] prefix at render", () => {
    expect(decisionOptionLabel("[auto] Investigate checkout drop-off")).toBe(
      "Investigate checkout drop-off",
    );
  });
  test("prefix strip is case-insensitive", () => {
    expect(decisionOptionLabel("[AUTO] Ship the fix")).toBe("Ship the fix");
  });
  test("short titles pass through untouched", () => {
    expect(decisionOptionLabel("Keep the pricing page")).toBe("Keep the pricing page");
  });
  test("long titles cut on a word boundary, never mid-word", () => {
    const long = `The slow checkout flow is costing us thousands every single week ${"and the team knows it well".repeat(3)}`;
    const out = decisionOptionLabel(long, 40);
    expect(out.endsWith("…")).toBe(true);
    const body = out.slice(0, -1);
    // the cut lands after a full word from the source string
    expect(long.startsWith(body)).toBe(true);
    expect(long.charAt(body.length)).toBe(" ");
  });
  test("a single unbroken token falls back to a hard cut", () => {
    const out = decisionOptionLabel("x".repeat(200), 40);
    expect(out.length).toBeLessThanOrEqual(41);
    expect(out.endsWith("…")).toBe(true);
  });
});

describe("splitCitationMarkers", () => {
  test("no markers returns the whole string as one text segment", () => {
    expect(splitCitationMarkers("plain text")).toEqual([{ type: "text", value: "plain text" }]);
  });
  test("single marker mid-string", () => {
    expect(splitCitationMarkers("evidence[1] supports this")).toEqual([
      { type: "text", value: "evidence" },
      { type: "citation", index: 1 },
      { type: "text", value: " supports this" },
    ]);
  });
  test("marker at the very start and end", () => {
    expect(splitCitationMarkers("[2]start end[3]")).toEqual([
      { type: "citation", index: 2 },
      { type: "text", value: "start end" },
      { type: "citation", index: 3 },
    ]);
  });
  test("multiple adjacent markers", () => {
    expect(splitCitationMarkers("claim[1][2]")).toEqual([
      { type: "text", value: "claim" },
      { type: "citation", index: 1 },
      { type: "citation", index: 2 },
    ]);
  });
  test("empty string", () => {
    expect(splitCitationMarkers("")).toEqual([]);
  });
});

// The `[auto]` marker is a dedup key for the sensing tick, never copy. It has
// leaked to the founder twice, most recently through Today's evidence bullet
// (`From [auto] Investigate the "Alert Fatigue..." cluster`), because
// `decisions.source_label` is derived from a raw mission title. These pin the
// helper that fix relies on, using the real titles that leaked.
describe("stripAutoPrefix", () => {
  test("strips the marker from a real leaked title", () => {
    expect(stripAutoPrefix('[auto] Investigate the "Alert Fatigue Leading to Feature Disengagement" cluster'))
      .toBe('Investigate the "Alert Fatigue Leading to Feature Disengagement" cluster');
  });

  test("leaves a human-authored title untouched", () => {
    expect(stripAutoPrefix("Build next: fix checkout before anything else on Relay"))
      .toBe("Build next: fix checkout before anything else on Relay");
  });

  test("is idempotent, so stripping twice cannot eat real text", () => {
    const once = stripAutoPrefix("[auto] Watch: review recent signals");
    expect(stripAutoPrefix(once)).toBe(once);
    expect(once).toBe("Watch: review recent signals");
  });

  test("only strips a LEADING marker, never one inside the sentence", () => {
    expect(stripAutoPrefix("Review the [auto] tagging rule")).toBe("Review the [auto] tagging rule");
  });

  test("isAutoTitle still recognises the origin after the text is cleaned", () => {
    const raw = '[auto] Investigate the "Redundant Data Entry" cluster';
    expect(isAutoTitle(raw)).toBe(true);
    // The provenance chip reads the RAW title; the visible text reads the clean one.
    expect(isAutoTitle(stripAutoPrefix(raw))).toBe(false);
  });
});
