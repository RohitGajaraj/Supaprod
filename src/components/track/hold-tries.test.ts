import { describe, expect, test } from "bun:test";

import { triesLine } from "./hold-tries";

describe("triesLine", () => {
  test("zero and unknown attempts claim nothing -- the row may predate the counter", () => {
    expect(triesLine(0, "Build")).toBeNull();
    expect(triesLine(null, "Build")).toBeNull();
    expect(triesLine(undefined, "Build")).toBeNull();
  });

  test("one failure reads as one try, in words a person uses", () => {
    expect(triesLine(1, "Build")).toBe("One try at Build has not cleared it.");
  });

  test("two failures say how close the run is to stopping", () => {
    expect(triesLine(2, "Design")).toBe("Two tries at Design have not cleared it.");
  });

  test("the ceiling is named once it is reached", () => {
    expect(triesLine(3, "Build")).toBe("All three tries at Build are spent.");
    // Beyond the cap cannot happen, but if the data ever says so it stays true.
    expect(triesLine(7, "Build")).toContain("are spent.");
  });
});
