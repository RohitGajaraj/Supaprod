import { describe, it, expect } from "bun:test";
import { sourceVerdict, sourceLine, offerToConnect } from "./discover-has-no-sources";

const at = (filedAnything: boolean, sourceCount: number | null) =>
  sourceVerdict({ filedAnything, sourceCount });

describe("whether Discover finding nothing is a source problem", () => {
  it("says nothing at all when the station produced", () => {
    /*
     * Checked first, and the order matters: offering to connect a source under
     * a list of findings would read as though the findings were not real.
     */
    expect(at(true, 0)).toEqual({ kind: "fine" });
    expect(at(true, 5)).toEqual({ kind: "fine" });
    expect(at(true, null)).toEqual({ kind: "fine" });
    expect(sourceLine(at(true, 0))).toBeNull();
    expect(offerToConnect(at(true, 0))).toBe(false);
  });

  it("asks only on a COUNTED zero", () => {
    /*
     * 47 of the 82 real tracks at Discover filed nothing, and scout_targets is
     * 0 in every workspace with scout_snapshots 0 rows ever. This is that case,
     * and it is the one the architecture ruled: "Discover finding nothing says
     * 'I have no sources for this. Connect one?' -- inline."
     */
    expect(at(false, 0)).toEqual({ kind: "no-sources" });
    expect(sourceLine(at(false, 0))).toBe(
      "Nothing is set up for me to read from, so there was nothing to find.",
    );
    expect(offerToConnect(at(false, 0))).toBe(true);
  });

  it("NEVER treats a failed count as zero, which is the whole risk here", () => {
    /*
     * A failed read reported as "you have no sources" sends a person off to
     * connect something they may already have connected. So the unread case
     * gets its own sentence and NO control -- offering a remedy for a problem
     * we have not established is worse than saying nothing, because the person
     * acts on it.
     */
    expect(at(false, null)).toEqual({ kind: "cannot-tell" });
    expect(sourceLine(at(false, null))).toBe(
      "I could not check what is connected, so I cannot say whether anything was there to read.",
    );
    expect(offerToConnect(at(false, null))).toBe(false);
    // And it must not be confusable with the counted zero.
    expect(sourceLine(at(false, null))).not.toBe(sourceLine(at(false, 0)));
  });

  it("stays quiet when sources exist and the station still filed nothing", () => {
    /*
     * A real problem and a DIFFERENT one: the sources may be empty, the query
     * may match nothing, or the station may have failed. This module cannot
     * tell which, and StationPanel already says the station filed nothing. A
     * second sentence guessing the cause would be the surface inventing a
     * diagnosis, which way-out.ts refuses for holds it cannot explain.
     */
    expect(at(false, 3)).toEqual({ kind: "sources-exist" });
    expect(sourceLine(at(false, 3))).toBeNull();
    expect(offerToConnect(at(false, 3))).toBe(false);
  });
});
