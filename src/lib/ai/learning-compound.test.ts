import { describe, expect, test } from "bun:test";
import {
  asCompoundVerdict,
  groupKeyForLearning,
  groupSameShapedLearnings,
  shapeProposal,
  signalForLearning,
  titleStem,
  MIN_GROUP_SIZE,
  PROPOSAL_BODY_MAX,
  PROPOSAL_TITLE_MAX,
  type CompoundLearning,
} from "./learning-compound";

const learning = (over: Partial<CompoundLearning> & { id: string }): CompoundLearning => ({
  workspace_id: "ws-1",
  verdict: "validated",
  summary: `summary for ${over.id}`,
  theme_id: null,
  theme_title: null,
  opportunity_title: null,
  prd_title: null,
  ...over,
});

describe("asCompoundVerdict", () => {
  test("passes the learnings vocabulary through", () => {
    expect(asCompoundVerdict("validated")).toBe("validated");
    expect(asCompoundVerdict("missed")).toBe("missed");
    expect(asCompoundVerdict("mixed")).toBe("mixed");
  });

  test("rejects anything outside the CHECK-constraint vocabulary", () => {
    expect(asCompoundVerdict("confirmed")).toBeNull();
    expect(asCompoundVerdict("")).toBeNull();
    expect(asCompoundVerdict(null)).toBeNull();
    expect(asCompoundVerdict(7)).toBeNull();
  });
});

describe("titleStem", () => {
  test("normalizes case, punctuation, and whitespace, keeping the first four words", () => {
    expect(titleStem("Checkout drop-off on mobile Safari (EU)")).toBe("checkout drop off on");
    expect(titleStem("  Checkout   DROP-OFF on Mobile ")).toBe("checkout drop off on");
  });

  test("a stem is an exact key: same normalized head, same stem", () => {
    expect(titleStem("Onboarding email bounce spike v2")).toBe(
      titleStem("Onboarding email bounce spike, round two"),
    );
  });

  test("rejects titles too short to trust", () => {
    expect(titleStem("Checkout")).toBeNull();
    expect(titleStem("Fix checkout")).toBeNull();
    expect(titleStem("")).toBeNull();
    expect(titleStem(null)).toBeNull();
    expect(titleStem(undefined)).toBeNull();
  });

  test("three significant words is the minimum accepted", () => {
    expect(titleStem("Checkout latency spike")).toBe("checkout latency spike");
  });
});

describe("signalForLearning", () => {
  test("the theme link wins over any title", () => {
    const s = signalForLearning(
      learning({
        id: "a",
        theme_id: "t-9",
        theme_title: "Checkout friction",
        opportunity_title: "Some totally different opportunity title",
      }),
    );
    expect(s).toEqual({ key: "theme:t-9", label: "Checkout friction" });
  });

  test("a theme with no title still keys on the id, labeled honestly", () => {
    const s = signalForLearning(learning({ id: "a", theme_id: "t-9" }));
    expect(s?.key).toBe("theme:t-9");
    expect(s?.label).toBe("theme t-9");
  });

  test("falls back to the opportunity title stem, then the spec title stem", () => {
    expect(
      signalForLearning(learning({ id: "a", opportunity_title: "Checkout latency spike" }))?.key,
    ).toBe("stem:checkout latency spike");
    expect(signalForLearning(learning({ id: "a", prd_title: "Checkout latency spike" }))?.key).toBe(
      "stem:checkout latency spike",
    );
  });

  test("no usable signal means no grouping, never a guess", () => {
    expect(signalForLearning(learning({ id: "a" }))).toBeNull();
    expect(signalForLearning(learning({ id: "a", opportunity_title: "Checkout" }))).toBeNull();
  });
});

describe("groupKeyForLearning", () => {
  test("composes verdict and signal", () => {
    expect(groupKeyForLearning(learning({ id: "a", theme_id: "t-1" }))).toBe("validated|theme:t-1");
  });

  test("null when the verdict is outside the vocabulary or the signal is missing", () => {
    expect(groupKeyForLearning(learning({ id: "a", verdict: "win", theme_id: "t-1" }))).toBeNull();
    expect(groupKeyForLearning(learning({ id: "a" }))).toBeNull();
  });
});

describe("groupSameShapedLearnings", () => {
  test("a shape must repeat MIN_GROUP_SIZE times before it groups", () => {
    const two = [learning({ id: "a", theme_id: "t-1" }), learning({ id: "b", theme_id: "t-1" })];
    expect(groupSameShapedLearnings(two)).toEqual([]);
    const three = [...two, learning({ id: "c", theme_id: "t-1" })];
    const groups = groupSameShapedLearnings(three);
    expect(groups).toHaveLength(1);
    expect(groups[0].groupKey).toBe("validated|theme:t-1");
    expect(groups[0].learnings.map((l) => l.id)).toEqual(["a", "b", "c"]);
    expect(MIN_GROUP_SIZE).toBe(3);
  });

  test("different verdicts on the same theme never merge", () => {
    const rows = [
      learning({ id: "a", theme_id: "t-1", verdict: "validated" }),
      learning({ id: "b", theme_id: "t-1", verdict: "validated" }),
      learning({ id: "c", theme_id: "t-1", verdict: "missed" }),
      learning({ id: "d", theme_id: "t-1", verdict: "validated" }),
    ];
    const groups = groupSameShapedLearnings(rows);
    expect(groups).toHaveLength(1);
    expect(groups[0].verdict).toBe("validated");
    expect(groups[0].learnings.map((l) => l.id)).toEqual(["a", "b", "d"]);
  });

  test("workspaces never merge, even on the identical shape", () => {
    const rows = [
      learning({ id: "a", theme_id: "t-1", workspace_id: "ws-1" }),
      learning({ id: "b", theme_id: "t-1", workspace_id: "ws-1" }),
      learning({ id: "c", theme_id: "t-1", workspace_id: "ws-2" }),
      learning({ id: "d", theme_id: "t-1", workspace_id: "ws-1" }),
    ];
    const groups = groupSameShapedLearnings(rows);
    expect(groups).toHaveLength(1);
    expect(groups[0].workspaceId).toBe("ws-1");
  });

  test("theme groups and stem groups stay separate shapes", () => {
    const rows = [
      learning({ id: "a", theme_id: "t-1" }),
      learning({ id: "b", theme_id: "t-1" }),
      learning({ id: "c", theme_id: "t-1" }),
      learning({ id: "d", opportunity_title: "Checkout latency spike fix" }),
      learning({ id: "e", opportunity_title: "Checkout latency spike fix, round two" }),
      learning({ id: "f", prd_title: "Checkout latency spike fix (again)" }),
    ];
    const groups = groupSameShapedLearnings(rows);
    expect(groups.map((g) => g.groupKey).sort()).toEqual([
      "validated|stem:checkout latency spike fix",
      "validated|theme:t-1",
    ]);
  });

  test("junk rows (blank summary, bad verdict, no signal, duplicate id) are dropped, not guessed at", () => {
    const rows = [
      learning({ id: "a", theme_id: "t-1" }),
      learning({ id: "a", theme_id: "t-1" }),
      learning({ id: "b", theme_id: "t-1", summary: "   " }),
      learning({ id: "c", theme_id: "t-1", verdict: "achieved" }),
      learning({ id: "d" }),
      learning({ id: "e", theme_id: "t-1" }),
    ];
    expect(groupSameShapedLearnings(rows)).toEqual([]);
  });

  test("largest group first, then deterministic key order", () => {
    const rows = [
      learning({ id: "a", theme_id: "t-1" }),
      learning({ id: "b", theme_id: "t-1" }),
      learning({ id: "c", theme_id: "t-1" }),
      learning({ id: "d", theme_id: "t-2" }),
      learning({ id: "e", theme_id: "t-2" }),
      learning({ id: "f", theme_id: "t-2" }),
      learning({ id: "g", theme_id: "t-2" }),
    ];
    const groups = groupSameShapedLearnings(rows);
    expect(groups.map((g) => g.groupKey)).toEqual(["validated|theme:t-2", "validated|theme:t-1"]);
  });
});

describe("shapeProposal", () => {
  const group = () =>
    groupSameShapedLearnings([
      learning({
        id: "a",
        theme_id: "t-1",
        theme_title: "Checkout friction",
        summary: "Shipping the one-page checkout lifted conversion 12%",
      }),
      learning({
        id: "b",
        theme_id: "t-1",
        theme_title: "Checkout friction",
        summary: "Removing the coupon field cut drop-off at payment",
      }),
      learning({
        id: "c",
        theme_id: "t-1",
        theme_title: "Checkout friction",
        summary: "Guest checkout beat forced signup in the A/B test",
      }),
    ])[0];

  test("title and body quote real data only: verdict, signal label, and the summaries verbatim", () => {
    const draft = shapeProposal(group());
    expect(draft.title).toBe("Proposed playbook: 3 validated learnings on Checkout friction");
    expect(draft.body).toContain('verdict "validated"');
    expect(draft.body).toContain("Checkout friction");
    expect(draft.body).toContain('"Shipping the one-page checkout lifted conversion 12%"');
    expect(draft.body).toContain('"Removing the coupon field cut drop-off at payment"');
    expect(draft.body).toContain('"Guest checkout beat forced signup in the A/B test"');
  });

  test("provenance carries the exact learning ids and the idempotency key", () => {
    const draft = shapeProposal(group());
    expect(draft.sourceLearningIds).toEqual(["a", "b", "c"]);
    expect(draft.groupKey).toBe("validated|theme:t-1");
    expect(draft.workspaceId).toBe("ws-1");
  });

  test("caps stay honest on oversized groups and summaries", () => {
    const rows = Array.from({ length: 8 }, (_, i) =>
      learning({ id: `l-${i}`, theme_id: "t-1", summary: "x".repeat(500) }),
    );
    const draft = shapeProposal(groupSameShapedLearnings(rows)[0]);
    expect(draft.title.length).toBeLessThanOrEqual(PROPOSAL_TITLE_MAX);
    expect(draft.body.length).toBeLessThanOrEqual(PROPOSAL_BODY_MAX);
    // 5 quoted, the remaining 3 counted, all 8 in provenance.
    expect(draft.body).toContain("(3 more with the same shape");
    expect(draft.sourceLearningIds).toHaveLength(8);
  });

  test("the scaffolding text carries no em or en dashes", () => {
    const draft = shapeProposal(group());
    expect(/[–—]/.test(draft.title)).toBe(false);
    expect(/[–—]/.test(draft.body)).toBe(false);
  });
});
