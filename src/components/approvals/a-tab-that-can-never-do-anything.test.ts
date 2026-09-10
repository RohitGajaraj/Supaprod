import { describe, expect, it } from "bun:test";

import { filtersWorthDrawing } from "@/routes/_authenticated.inbox";
import type { ApprovalFilter } from "@/lib/approvals-queue.functions";

/**
 * The queue as it stands today, counted by S2 on the running board:
 * All 52, Proposals 37, Gates 10, Memory 5, and Spend 0 because no spend-gate
 * read exists in the codebase for anything to route into.
 */
const TODAY: Record<ApprovalFilter, number> = {
  all: 52,
  proposals: 37,
  gates: 10,
  memory: 5,
  spend: 0,
};

const ids = (counts: Record<ApprovalFilter, number>, active: ApprovalFilter = "all") =>
  filtersWorthDrawing(counts, active).map((f) => f.id);

describe("a tab that can never do anything is not drawn", () => {
  it("leaves Spend out while nothing can route into it", () => {
    expect(ids(TODAY)).toEqual(["all", "proposals", "gates", "memory"]);
  });

  it("draws Spend the day a spend gate lands, with no change here", () => {
    expect(ids({ ...TODAY, spend: 1 })).toContain("spend");
  });

  it("keeps the order of the vocabulary rather than sorting by size", () => {
    /* Memory is the smallest and stays last; a row that reorders itself as
       calls are settled is a row a person cannot learn. */
    expect(ids({ all: 3, proposals: 1, gates: 1, memory: 1, spend: 0 })).toEqual([
      "all",
      "proposals",
      "gates",
      "memory",
    ]);
  });

  it("draws nothing when every call is in one bucket", () => {
    /* `All 5  Memory 5` is two controls that do the same thing. */
    expect(ids({ all: 5, proposals: 0, gates: 0, memory: 5, spend: 0 })).toEqual([]);
  });

  it("draws nothing for an empty queue", () => {
    expect(ids({ all: 0, proposals: 0, gates: 0, memory: 0, spend: 0 })).toEqual([]);
  });

  it("keeps the tab you are standing on after you empty it", () => {
    /*
     * Settling the last gate while filtered to Gates must not delete the
     * control under the pointer. Without this the row silently widens back to
     * everything and the page reads as having lost your place.
     */
    expect(ids({ all: 42, proposals: 37, gates: 0, memory: 5, spend: 0 }, "gates")).toContain(
      "gates",
    );
  });
});
