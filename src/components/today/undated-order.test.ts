import { describe, expect, it } from "bun:test";

import { undatedCount, undatedNote } from "./undated-order";
import type { ApprovalQueueItem } from "@/lib/approvals-queue.functions";

/** Only the field this module reads. The rest of the item is irrelevant here. */
const call = (timestamp: string | null) => ({ timestamp }) as unknown as ApprovalQueueItem;

const DATED = call("2026-07-09T10:00:00.000Z");

describe("undatedCount", () => {
  it("counts what the order cannot place", () => {
    expect(undatedCount([DATED, call(null), DATED, call(null)])).toBe(2);
  });

  it("treats an unparseable stamp as unknown, not as an age", () => {
    // `waitingSince` returns null for garbage. A row whose timestamp is
    // "not a date" is exactly as unplaceable as one with no timestamp, and
    // Date.parse would otherwise hand the comparator a NaN.
    expect(undatedCount([call("not a date")])).toBe(1);
  });

  it("is zero on a queue where every call carries an age", () => {
    expect(undatedCount([DATED, DATED])).toBe(0);
    expect(undatedCount(undefined)).toBe(0);
  });
});

describe("undatedNote", () => {
  it("SAYS NOTHING when every call carries an age, which is every day today", () => {
    // Measured on the rendered board 2026-08-27: all 52 calls printed an age.
    // A note that draws on an empty condition is furniture (R-20 section 8).
    expect(undatedNote([DATED, DATED])).toBeNull();
    expect(undatedNote([])).toBeNull();
  });

  it("CORRECTS THE MISREADING, not just reports the gap", () => {
    // The reader's error is positional: the bottom of an oldest-first list
    // reads as "newest". Naming the gap without correcting that leaves the
    // wrong conclusion standing.
    const note = undatedNote([DATED, call(null), call(null)]);
    expect(note).toBe(
      "2 calls carry no start time. They sit last because the order cannot place them, not because they are newest.",
    );
  });

  it("agrees with itself about one", () => {
    expect(undatedNote([DATED, call(null)])).toBe(
      "One call carries no start time. It sits last because the order cannot place it, not because it is newest.",
    );
  });
});
