import { describe, expect, it } from "bun:test";

import { releaseStanding, shortSha } from "./release-words";

describe("what Ship did, said honestly", () => {
  /*
   * THE TEST THIS FILE EXISTS FOR. submitStationByHand writes `claimed` and
   * never `success`, because release.publish reads `success` and a pasted
   * address must never satisfy the gate that says this shipped. If the two ever
   * read the same on screen, the surface has undone the constant.
   */
  it("never lets a claimed deploy read like a verified one", () => {
    const claimed = releaseStanding("claimed");
    const verified = releaseStanding("success");

    expect(claimed.word).not.toBe(verified.word);
    expect(claimed.tone).not.toBe("pass");
    expect(verified.tone).toBe("pass");
    // And it says what is missing, rather than only being a different colour.
    expect(claimed.note).toContain("Nothing here has checked it");
  });

  it("keeps green for an outcome and amber for an unchecked claim", () => {
    expect(releaseStanding("success").tone).toBe("pass");
    expect(releaseStanding("failed").tone).toBe("fail");
    expect(releaseStanding("pending").tone).toBe("agent");
  });

  /*
   * P-39 (A-QUEUE.md). "failure" -- not "failed" -- is the literal word
   * ci-poll-tick.ts and DeploymentResult.status actually write on a failed
   * deploy. Its absence here was a real bug: every real deploy failure read
   * as the unfamiliar-word default (quiet tone, no red chip) rather than
   * the "fail" tone this file already drew for "failed"/"error".
   */
  it("reads the deploy pipeline's own word for a failure, not just 'failed'", () => {
    const failure = releaseStanding("failure");
    expect(failure.tone).toBe("fail");
    expect(failure.word).toBe(releaseStanding("failed").word);
  });

  it("passes an unfamiliar provider word through instead of guessing", () => {
    // A confident wrong colour is worse than none: holdTone's rule.
    const odd = releaseStanding("rolled_back_by_operator");
    expect(odd.word).toBe("rolled_back_by_operator");
    expect(odd.tone).toBe("quiet");
    expect(odd.note).toBeNull();
  });

  it("says nothing rather than inventing a status", () => {
    expect(releaseStanding(null).word).toBe("Not said");
    expect(releaseStanding("").word).toBe("Not said");
  });

  it("carries no em dash on any branch", () => {
    for (const s of ["success", "claimed", "failed", "pending", null, "weird"]) {
      const r = releaseStanding(s);
      expect(`${r.word} ${r.note ?? ""}`).not.toMatch(/[—–]/);
    }
  });
});

describe("the commit a person reads", () => {
  it("shows seven characters, never fewer", () => {
    expect(shortSha("a1b2c3d4e5f6")).toBe("a1b2c3d");
    expect(shortSha("a1b2c3d")).toBe("a1b2c3d");
  });

  it("does not pad or invent when there is nothing", () => {
    expect(shortSha(null)).toBeNull();
    expect(shortSha("")).toBeNull();
    expect(shortSha("abc")).toBe("abc");
  });
});
