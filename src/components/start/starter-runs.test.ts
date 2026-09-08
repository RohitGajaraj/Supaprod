import { describe, expect, test } from "bun:test";

import { starterLine } from "./StarterRuns";

describe("the first three runs say what is happening at every state", () => {
  test("while the answer is being written, the line names the work and its object", () => {
    expect(starterLine({ pending: true, runs: [], reason: null }, "Prism")).toBe(
      "Reading what you said about Prism, and writing three runs it could start with.",
    );
  });

  test("when they land, the line says what a press does: read it above, then Enter", () => {
    const line = starterLine(
      {
        pending: false,
        runs: [{ sentence: "Cut sign-up to four fields", why: "w" }],
        reason: null,
      },
      "Prism",
    );
    expect(line).toContain("Prism could start with");
    expect(line).toContain("then Enter");
  });

  test("a refusal says so and hands the first sentence back to the person", () => {
    const line = starterLine(
      { pending: false, runs: [], reason: "The model declined the request." },
      "Prism",
    );
    expect(line).toContain("could not write the first runs");
    expect(line).toContain("The model declined the request.");
  });

  test("unread, or empty with no reason, draws nothing rather than a blank card row", () => {
    expect(starterLine(undefined, "Prism")).toBeNull();
    expect(starterLine({ pending: false, runs: [], reason: null }, "Prism")).toBeNull();
  });
});
