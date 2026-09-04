/**
 * NEITHER ANSWER MAY LEAVE THE CHOICE STANDING.
 *
 * ── WHAT A1'S FIFTH PROBE MEASURED, 2026-09-04 ───────────────────────────
 * The person pressed "Build it on your word" on track `a30d6b62`. Everything
 * about the record was right: the decision row carried their claim as the
 * forecast, their typed sentence as the observable, and `decided_by_agent_slug`
 * NULL. And then:
 *
 *   03:50:25.732  the decision row lands
 *   03:50:25.811  the hold is cleared
 *   03:50:26.849  a drive runs Decide again
 *   03:50:28.513  R-39 refuses again; `the-call-is-yours` is back
 *
 * Two point eight seconds from answered to asked again -- and now
 * `driven_at > updated_at`, which is P-71d's sweep skip, so the track was
 * parked on that question for good. The person answered and the product did
 * not hear.
 *
 * Clearing the hold could never have been enough. The track is `carried`, which
 * P-71c made durable on purpose, so `seatMayDecide` refuses every machine
 * decision on it forever. A track left standing at Decide is a track scheduled
 * to be refused again.
 *
 * ── AND THE OTHER DOOR RECORDED NOTHING AT ALL ───────────────────────────
 * "Point a source first" was a `navigate()` to the settings page. It looked
 * like navigation, so nobody measured it as an answer -- and it left the same
 * hold standing, reaching the same permanent skip by a quieter route.
 *
 * These hold the rule rather than either bug: whatever the person answers, the
 * Choice is not still on the row afterwards.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const SRC = readFileSync("src/lib/spine/track.functions.ts", "utf8");
/* Comments stripped first: this defect's explanation necessarily quotes the
   hold it forbids leaving in place (F-188). */
const code = SRC.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

/** One handler's body, bounded by the next `export const`, never by end-of-file. */
function handler(name: string): string {
  const start = code.indexOf(`export const ${name} =`);
  expect(start, `${name} is gone; re-point this guard`).toBeGreaterThan(-1);
  const next = code.indexOf("\nexport const ", start + 1);
  return next === -1 ? code.slice(start) : code.slice(start, next);
}

describe("both answers to R-39's Choice clear the hold that asked it", () => {
  for (const name of ["buildOnYourWord", "pointASourceFirst"]) {
    it(`${name} writes the row and moves updated_at`, () => {
      const fn = handler(name);
      expect(fn).toContain("last_hold");
      /*
       * P-71d's skip is `driven_at > updated_at`. An answer that writes a hold
       * without moving this column leaves the track out of the sweep for good,
       * which is the shape both of these arrived in.
       */
      expect(fn).toContain("updated_at: new Date().toISOString()");
    });

    it(`${name} never leaves the-call-is-yours on the row`, () => {
      expect(handler(name)).not.toContain('"the-call-is-yours"');
    });

    it(`${name} reports a write that did not land`, () => {
      // Returning ok while the row is unchanged tells a person their answer was
      // heard when the track is still asking. Both paths check now.
      expect(handler(name)).toMatch(/if\s*\(\s*\w*[Ee]rr\w*\s*\)/);
    });
  }

  it("building on your word leaves Decide, because Decide can never finish on a carried track", () => {
    const fn = handler("buildOnYourWord");
    expect(fn).toContain("nextStation(route, here)");
    expect(fn).toContain("station: movesOn");
    // Only from Decide. Answering from anywhere else records the call and moves
    // nothing, which is the honest reading of a question that has moved on.
    expect(fn).toContain('here === "decide"');
  });

  it("the person's call is filed as what Decide produced", () => {
    // Otherwise the map shows Decide filing nothing and Define is handed no
    // artifact, so the station that ran is the one that looks empty.
    expect(handler("buildOnYourWord")).toContain("attachPersonsDecision(");
  });

  it("pointing at a source records no decision, because none was made", () => {
    const fn = handler("pointASourceFirst");
    expect(fn).not.toContain('from("decisions")');
    expect(fn).toContain('"needs-evidence"');
  });
});
