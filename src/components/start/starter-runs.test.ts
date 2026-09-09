import { describe, expect, test } from "bun:test";

import { boundWhy, starterLine, WHY_MAX } from "./StarterRuns";

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
    expect(line).toContain("put it in the box above");
  });

  test("still writing after a failed try says so, and that it is trying again", () => {
    const line = starterLine({ pending: true, runs: [], reason: "timed out" }, "Prism");
    expect(line).toBe("It could not write the first runs yet (timed out). Trying again.");
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

describe("a starter run's why is a reason, bounded the same wherever the row came from", () => {
  const long =
    "A monitor reboot after an over the air update reads exactly like a production outage in Relay: the same red tile, the same wording. Homeowners call support, support checks the fleet log, nothing is wrong. 31 calls in six weeks, and two of them escalated to a truck roll that was not needed.";

  test("a why inside the bound is untouched", () => {
    expect(boundWhy("Users re-enter an address they already gave at signup.")).toBe(
      "Users re-enter an address they already gave at signup.",
    );
  });

  test("a why past the bound ends at a sentence, never mid-sentence", () => {
    const out = boundWhy(long);
    expect(out.length).toBeLessThanOrEqual(WHY_MAX);
    expect(out.endsWith(".")).toBe(true);
    expect(long.startsWith(out)).toBe(true);
  });

  test("with no sentence end inside the bound it ends at a word, with an ellipsis", () => {
    const words = Array.from({ length: 60 }, (_, i) => `word${i}`).join(" ");
    const out = boundWhy(words);
    expect(out.length).toBeLessThanOrEqual(WHY_MAX + 1);
    expect(out.endsWith("…")).toBe(true);
    // The cut falls on a word boundary of the source: what precedes the
    // ellipsis is a prefix of the input and the next source character is a space.
    const kept = out.slice(0, -1);
    expect(words.startsWith(kept)).toBe(true);
    expect(words[kept.length]).toBe(" ");
  });
});
