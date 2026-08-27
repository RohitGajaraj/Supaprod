import { describe, it, expect } from "bun:test";
import { stillHoldsWork } from "./still-holds-work";

describe("whether answering a call still releases anything", () => {
  it("says so when the work it held has finished", () => {
    // 22 of the 29 pending calls in the database are this case.
    const line = stillHoldsWork(false);
    expect(line).toContain("already finished");
    expect(line).toContain("releases nothing");
  });

  it("stays silent when the work is still going", () => {
    // The call's own consequence is the best available account, and a run
    // halted at a gate is precisely the run the approval exists to release.
    expect(stillHoldsWork(true)).toBeNull();
  });

  it("stays silent when we cannot say, which is not the same as finished", () => {
    /*
     * THE ONE THAT WOULD INVENT A HISTORY. Null means no mission on the gate,
     * no run for that mission, or a failed lookup. Seven `memory.promote` rows
     * are exactly that, and telling a person their work had ended would be a
     * falsehood in the other direction about something that never started.
     */
    expect(stillHoldsWork(null)).toBeNull();
    expect(stillHoldsWork(undefined)).toBeNull();
  });

  it("offers no instruction, because what to do with a stranded call is theirs", () => {
    // Same rule the failure lines follow: state what is true, never an action
    // that something rendered beside it could contradict.
    const line = stillHoldsWork(false)!;
    expect(line).not.toMatch(/\b(clear|dismiss|press|click|you can|try)\b/i);
  });
});
