/**
 * The entry's one piece of evidence, pinned.
 *
 * What these guard is not the wording but the four calls that make this a piece
 * of evidence rather than another count: a failed read draws nothing, a miss
 * leads as readily as a win, the grader's sentence is not rewritten on the way
 * to the screen, and a seed row says so in words.
 */
import { describe, expect, it, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { hueOf, rescoreLine, whetherItWorked } from "@/components/start/whether-it-worked";
import type { ClosedLoop } from "@/lib/start/home-answers.functions";

const LOOP: ClosedLoop = {
  verdict: "missed",
  summary:
    "Spec required <=5% abandonment on tablet address re-confirm screen within 7 days of full rollout. Actual outcome: tablet checkout completion is 67%, meaning ~33% abandonment, far above target.",
  decisionTitle:
    "Decline shipping of 'Improve onboarding flow based on user feedback signals' work",
  priorIce: 58,
  newIce: 41,
  at: "2026-09-03T12:00:06.248Z",
  isSample: false,
};

describe("a read that did not answer draws nothing", () => {
  it("says nothing when the look itself failed", () => {
    expect(whetherItWorked({ closed: LOOP, read: false })).toBeNull();
  });

  it("says nothing when the loop has never closed here", () => {
    // A new workspace is not a failure and is not worth the page's one
    // evidence region; it is simply nothing to show yet.
    expect(whetherItWorked({ closed: null, read: true })).toBeNull();
  });

  it("says nothing when the grader left no sentence", () => {
    expect(whetherItWorked({ closed: { ...LOOP, summary: "   " }, read: true })).toBeNull();
  });
});

describe("the verdict carries a hue and never invents one", () => {
  test("the three the grader writes map onto the three outcome hues", () => {
    expect(hueOf("validated")).toBe("pass");
    expect(hueOf("missed")).toBe("fail");
    expect(hueOf("mixed")).toBe("hold");
  });

  test("case and padding do not change the hue", () => {
    expect(hueOf("  Missed ")).toBe("fail");
  });

  test("a word this map has not been taught is neutral, NOT a failure", () => {
    // The point of the test: a grader that starts writing a fourth verdict must
    // not have it painted red on the landing page by a default nobody chose.
    expect(hueOf("partially-validated")).toBe("quiet");
    expect(hueOf("")).toBe("quiet");
  });
});

describe("the re-score is a sentence, not a diff", () => {
  it("names the direction with a verb, because the direction is the fact", () => {
    expect(rescoreLine(58, 41)).toBe("The record was scored down, 58 to 41.");
    expect(rescoreLine(64, 82)).toBe("The record was scored up, 64 to 82.");
  });

  it("says so when the score held rather than drawing an arrow to itself", () => {
    expect(rescoreLine(50, 50)).toBe("The record held its score.");
  });

  it("rounds, because ICE does not support two decimals", () => {
    expect(rescoreLine(57.6, 41.2)).toBe("The record was scored down, 58 to 41.");
  });

  it("draws nothing on half a re-score", () => {
    // "58 to null" is a sentence a reader has to decode.
    expect(rescoreLine(58, null)).toBeNull();
    expect(rescoreLine(null, 41)).toBeNull();
  });
});

describe("what reaches the screen", () => {
  it("leads with a miss as readily as with a win", () => {
    const out = whetherItWorked({ closed: LOOP, read: true });
    expect(out?.word).toBe("missed");
    expect(out?.status).toBe("fail");
    // Nothing filters or softens a bad verdict. A surface that only shows its
    // wins is marketing, and a reader learns that by the third visit.
    const win = whetherItWorked({ closed: { ...LOOP, verdict: "validated" }, read: true });
    expect(win?.status).toBe("pass");
  });

  it("passes the grader's sentence through UNCHANGED", () => {
    const out = whetherItWorked({ closed: LOOP, read: true });
    expect(out?.summary).toBe(LOOP.summary.trim());
  });

  it("marks a seed row so it is never read as the founder's own result", () => {
    const out = whetherItWorked({ closed: { ...LOOP, isSample: true }, read: true });
    expect(out?.isSample).toBe(true);
  });
});

describe("the region as it is drawn", () => {
  const SRC = readFileSync(join(import.meta.dir, "WhetherItWorked.tsx"), "utf8");

  it("says the sample in WORDS, never only in a colour", () => {
    // Styling a seed row more quietly still reads as a real result to anyone
    // who does not know the convention.
    expect(SRC).toContain("From the sample workspace");
  });

  it("puts no number in display type: the ladder here stops at base", () => {
    // The complaint this region answers is that the product reads as a dump of
    // data, and the cure is not a smaller dump.
    for (const big of ["text-mrd-h1", "text-mrd-h2", "text-mrd-h3", "sp-num"]) {
      expect({ big, used: SRC.includes(big) }).toEqual({ big, used: false });
    }
  });

  it("does not breathe: an outcome has already happened", () => {
    // Reads the CHIP, not the file. The first version of this grepped the
    // whole source for "pulse" and failed on the comment above the chip
    // explaining that it does not pulse: a guard on prose, not on the prop.
    const chip = SRC.match(/<StatusChip[\s\S]*?>/);
    expect(chip, "the chip moved; re-point this test").not.toBeNull();
    expect(chip![0]).not.toContain("pulse");
  });

  it("offers ONE door, and the same one the answer above it offers", () => {
    const doors = [...SRC.matchAll(/to="(\/[^"]*)"/g)].map((m) => m[1]);
    expect(doors).toEqual(["/outcomes"]);
  });
});

describe("the home mounts it, and pays for no extra read", () => {
  const ROUTE = readFileSync(
    join(import.meta.dir, "..", "..", "routes", "_authenticated.start.tsx"),
    "utf8",
  );

  it("is mounted", () => {
    expect(ROUTE).toContain("<WhetherItWorked");
  });

  it("reads the home-answers query and opens no second one", () => {
    // The home's largest read already ran four times on one arrival once
    // (F-216). A new region is not a reason for a new request.
    const call = ROUTE.match(/const itWorked = whetherItWorked\(\{[\s\S]*?\}\);/);
    expect(call, "the shape call moved; re-point this test").not.toBeNull();
    expect(call![0]).toContain("homeReads.data.closed");
    expect(call![0]).toContain("homeReads.data.closedRead");
  });

  it("stands BESIDE the work now, in the context column, and leads it", () => {
    /*
     * WHAT THIS USED TO ASSERT, AND WHY IT CHANGED (Lane 1, 2026-09-10).
     *
     * It read: `<WhetherItWorked>` comes AFTER `<HomeAnswers>` and BEFORE
     * `<CrewAtWork>`, on the reasoning that "the page reads as a sequence: what
     * needs you, hand something over, what came back, what is moving, your
     * list." That sequence was about ONE COLUMN, because one column was all the
     * home had: it never joined `.sp-inner`, so it could not have the context
     * column every other ported surface gets at >=1120px. Layer 3 was therefore
     * stacked under layer 2 and, measured on the served build at 1920px, sat
     * below the fold with 330px of dead field on either side of it.
     *
     * It is in the context column now, so the claim worth guarding is no longer
     * an index in a stack. It is: **this region is beside the work rather than
     * under it, and inside that column the VERDICT leads the deltas** — a fact
     * about one decision outranks three counts of what has changed since you
     * looked, which is the whole reason this region was built.
     */
    const ctx = ROUTE.indexOf("data-work-ctx");
    expect(ctx, "the context column moved; re-point this test").toBeGreaterThan(-1);
    expect(ROUTE.indexOf("<WhetherItWorked")).toBeGreaterThan(ctx);
    /* Its mutually exclusive sibling stays adjacent: exactly one of the two
       ever draws, and a reader must never meet them in different places. */
    expect(ROUTE.indexOf("<BetStillOpen")).toBeGreaterThan(ROUTE.indexOf("<WhetherItWorked"));
    expect(ROUTE.indexOf("<WhetherItWorked")).toBeLessThan(ROUTE.indexOf("<HomeAnswers"));
  });
});
