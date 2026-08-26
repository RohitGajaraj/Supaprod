/**
 * WORK THAT CANNOT MOVE MUST SAY SO (S4-041, 2026-08-27).
 *
 * Eight of the nine real open tracks are held on a reason the sweep will never
 * revisit. `track-tick` excludes `TERMINAL_HOLDS` from selection and
 * `decideDrive` refuses them again, so those eight had not been driven since
 * 2026-08-25 while live tracks were driven seconds before the measurement.
 *
 * They sit at `status = 'open'`, so **every open-work count in the product
 * includes eight pieces of work that cannot move**. A person reading "nine
 * open" is told nine things are in flight when one is.
 *
 * ── THE DECISION, RECORDED BECAUSE IT WAS MINE TO MAKE ─────────────────────
 * Not a bulk release: that spends a full crew on eight tracks that have each
 * already failed three or more attempts, one across 316 drives, with no new
 * information since. That is spending to learn nothing.
 *
 * Not an abandon: that closes real filed work to make a count tidy, which fixes
 * the number by deleting the thing it measures.
 *
 * The defect is the silence, so the fix is to say the true thing and leave the
 * choice with the person, one track at a time.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = readFileSync(fileURLToPath(new URL("./track.functions.ts", import.meta.url)), "utf8");
const FN = SRC.slice(SRC.indexOf("export const getParkedWork"));

describe("it reports parked work without moving it", () => {
  it("selects on the same TERMINAL_HOLDS the sweep excludes", () => {
    // One source for "cannot move", or the surface and the sweep disagree.
    expect(FN).toContain("TERMINAL_HOLDS");
  });

  it("is a reader and writes nothing", () => {
    // A surface that reports parked work must not also unpark it unasked.
    expect(FN).not.toContain(".update(");
    expect(FN).not.toContain(".insert(");
    expect(FN).not.toContain(".delete(");
  });

  it("uses the product's own hold sentence rather than inventing one", () => {
    expect(FN).toContain("holdLine(");
    expect(FN).toContain("HOLD_LINE[");
  });
});

describe("THE F-76 SHAPE, refused: a failed read is not an empty board", () => {
  it("does not return an empty list when the read fails", () => {
    // `parked: []` with `openTotal: 0` would tell a person nothing is stuck at
    // the exact moment the product cannot see, and the silence would look like
    // good news.
    expect(FN).toContain("openTotal: -1");
    expect(FN).toContain("A FAILED READ IS NOT AN EMPTY BOARD");
  });
});

describe("the longest-parked is the one a person needs first", () => {
  it("sorts oldest-first, not newest-first", () => {
    // The same defect S2 found on the waiting lane: a newest-first list buries
    // the item that has been waiting since Monday.
    expect(FN).toContain('(x.stoppedAt ?? "").localeCompare(y.stoppedAt ?? "")');
  });
});
