import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { AGENT_IMPERATIVES, forTheSeat, splitInstruction } from "./self-check-words";

describe("a sentence for the person and a sentence for the seat", () => {
  it("splits the live case at the first sentence that opens with a seat verb", () => {
    expect(
      splitInstruction(
        "The checks were never run on this change. Call studio.checks.run and read its verdict before handing this on.",
      ),
    ).toEqual({
      why: "The checks were never run on this change.",
      instruction: "Call studio.checks.run and read its verdict before handing this on.",
    });
  });

  it("a fact with no instruction is all why", () => {
    expect(splitInstruction("No signals were filed")).toEqual({
      why: "No signals were filed",
      instruction: null,
    });
  });

  it("a text that is nothing but an instruction stays a why, never an empty line", () => {
    expect(splitInstruction("Call studio.commit, then studio.pr.open.")).toEqual({
      why: "Call studio.commit, then studio.pr.open.",
      instruction: null,
    });
  });

  it("a fact whose sentence merely contains a verb is not split on it", () => {
    // "Read" mid-sentence, and "Fix" as a noun: neither opens a sentence.
    expect(
      splitInstruction("The reviewer could not read the diff. The fix loop has not run yet."),
    ).toEqual({
      why: "The reviewer could not read the diff. The fix loop has not run yet.",
      instruction: null,
    });
  });

  it("everything after the first instruction belongs to the seat", () => {
    expect(
      splitInstruction("The spec has no acceptance lines. Re-read the spec. Do not file it twice."),
    ).toEqual({
      why: "The spec has no acceptance lines.",
      instruction: "Re-read the spec. Do not file it twice.",
    });
  });

  it("empty and null are empty", () => {
    expect(splitInstruction(null)).toEqual({ why: null, instruction: null });
    expect(splitInstruction("   ")).toEqual({ why: null, instruction: null });
  });

  it("the seat gets both halves, or whichever exists", () => {
    expect(forTheSeat("A fact.", "Call a tool.")).toBe("A fact. Call a tool.");
    expect(forTheSeat("A fact.", null)).toBe("A fact.");
    expect(forTheSeat(null, null)).toBeNull();
  });

  it("every imperative the driver actually writes is in the list", () => {
    /*
     * The list is the rule. A driver sentence that opens with a verb not here
     * is shown to the person as a fact, so the list has to keep up with the
     * driver: this reads every string literal the driver writes and checks the
     * second sentence of any that carry a seat verb.
     */
    // Code lines only: the driver's comments quote tool refusals as examples.
    const src = readFileSync("src/lib/spine/driver.server.ts", "utf8")
      .split("\n")
      .filter((line) => !/^\s*(\*|\/\/|\/\*)/.test(line))
      .join("\n");
    const joined = src.match(
      /"[^"\n]*\. (Call|Re-run|Read|Fix|File|Hand|Use|Stage|Commit|Open|Merge|Record|Draft|Run|Judge|Do not) [^"\n]*"/g,
    );
    // None left: every one was split at the writer, so the reader's rule is for
    // rows written before the split.
    expect(joined ?? []).toEqual([]);
    for (const verb of ["Call", "Re-read", "Do not"]) expect(AGENT_IMPERATIVES).toContain(verb);
  });
});
