import { describe, expect, it } from "bun:test";
import { weWrote, whoWroteLine, type SignalOrigin } from "./how-much-of-this-we-wrote";

const s = (source?: string | null): SignalOrigin => ({ source });
/** The loop's own name in `signals.source`. */
const ours = () => s("agent");
/** Two of the 75 real source values on the table. */
const theirs = () => s("g2");
const alsoTheirs = () => s("intercom");

describe("counting what the loop wrote", () => {
  it("counts only the loop's own", () => {
    expect(weWrote([ours(), theirs(), ours(), alsoTheirs()])).toBe(2);
  });

  it("returns 0 when the record says none of them are ours", () => {
    // A COUNTED zero, which is a real answer and different from the next test.
    expect(weWrote([theirs(), alsoTheirs()])).toBe(0);
  });

  it("returns NULL when no signal carries a source at all", () => {
    /*
     * The day's law a fourth time: an absence is not a zero. Reporting "0 we
     * wrote" for a set whose origin was never read is the most flattering
     * possible reading of missing data, on the exact number this keeps honest.
     */
    expect(weWrote([s(undefined), s(null), s("")])).toBeNull();
    expect(weWrote([])).toBeNull();
  });

  it("counts the ones it CAN read and ignores the ones it cannot", () => {
    // Partial knowledge is still knowledge; it is only total absence that is null.
    expect(weWrote([ours(), s(null), theirs()])).toBe(1);
  });
});

describe("the line, and when it stays silent", () => {
  it("says nothing when the loop wrote none of them", () => {
    /*
     * The count already means what a reader thinks it means. "0 of these we
     * wrote" on every clean group is noise on the common case to flag the
     * uncommon one.
     */
    expect(whoWroteLine(10, 0)).toBeNull();
  });

  it("says nothing when we could not tell", () => {
    expect(whoWroteLine(10, null)).toBeNull();
  });

  it("names the proportion when some are ours", () => {
    expect(whoWroteLine(57, 38)).toBe("38 of these 57 we wrote ourselves.");
  });

  it("gives the ALL case its own sentence, because it is a different fact", () => {
    /*
     * 47dcbf3c renders 67 signals and the loop wrote all 67. A reader skimming
     * "67 · 67" would have to do the comparison themselves.
     */
    expect(whoWroteLine(67, 67)).toBe("We wrote all 67 of these ourselves.");
    expect(whoWroteLine(1, 1)).toBe("We wrote this one ourselves.");
  });

  it("never claims more than the total", () => {
    // Defensive: a miscount must not render "70 of these 67".
    expect(whoWroteLine(67, 70)).toBe("We wrote all 67 of these ourselves.");
  });
});

describe("the words themselves", () => {
  it("states a proportion and never accuses", () => {
    /*
     * S0's own finding on the door: the inflow already flipped on 2026-08-25 and
     * nothing drained the pool, so a self-authored majority is a BACKLOG rather
     * than a failure happening now -- "accurate about what it sees and wrong
     * about the tense". The line must not read as a fault.
     */
    const lines = [whoWroteLine(57, 38), whoWroteLine(67, 67), whoWroteLine(1, 1)];
    for (const line of lines) {
      expect(line).not.toMatch(/fail|broken|error|wrong|bad|only|just|merely/i);
    }
  });

  it("puts no schema word on a surface", () => {
    const lines = [whoWroteLine(57, 38), whoWroteLine(67, 67)];
    for (const line of lines) {
      expect(line).not.toMatch(/source|signals\.|agent'|source_kind|payload/i);
    }
  });
});
