import { expect, test, describe } from "bun:test";
import { completionEvidence } from "./verification";

describe("completionEvidence", () => {
  test("a row that hasn't claimed done yet carries no evidence badge", () => {
    expect(
      completionEvidence({
        claimsDone: false,
        kind: "build",
        changesetStatus: "merged",
        prUrl: "https://github.com/org/repo/pull/9",
      }),
    ).toBeNull();
  });

  test("a mission-kind orchestrator run has no changeset mechanism, even when claiming done", () => {
    expect(
      completionEvidence({ claimsDone: true, kind: "mission", changesetStatus: null, prUrl: null }),
    ).toBe("cannot-do-yet");
  });

  test("a build session that claims done with no changeset at all cannot be verified", () => {
    expect(
      completionEvidence({ claimsDone: true, kind: "build", changesetStatus: null, prUrl: null }),
    ).toBe("cannot-do-yet");
  });

  test("a merged changeset with a real PR link is verified", () => {
    expect(
      completionEvidence({
        claimsDone: true,
        kind: "build",
        changesetStatus: "merged",
        prUrl: "https://github.com/org/repo/pull/9",
      }),
    ).toBe("verified");
  });

  test("merged without a pr_url never fabricates verified -- falls back to needs-verification", () => {
    expect(
      completionEvidence({
        claimsDone: true,
        kind: "build",
        changesetStatus: "merged",
        prUrl: null,
      }),
    ).toBe("needs-verification");
  });

  test("staged, committed, and pr_open all claim done with no landed evidence yet", () => {
    for (const status of ["staged", "committed", "pr_open"] as const) {
      expect(
        completionEvidence({
          claimsDone: true,
          kind: "build",
          changesetStatus: status,
          prUrl: null,
        }),
      ).toBe("needs-verification");
    }
  });

  test("an abandoned changeset is never merged, so it stays needs-verification rather than a false positive", () => {
    expect(
      completionEvidence({
        claimsDone: true,
        kind: "build",
        changesetStatus: "abandoned",
        prUrl: null,
      }),
    ).toBe("needs-verification");
  });
});
