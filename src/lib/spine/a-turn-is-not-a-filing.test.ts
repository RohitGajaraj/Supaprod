/**
 * THE DEFECT: one screen said Design did it "3 times" and "12 times", both
 * true, 300px apart, and a stranger assumed one was broken.
 *
 *   the road      Design    1 prototype, 3 times     <- FILINGS of a drawing
 *   the hold card Design    said this 12 times       <- TURNS that filed none
 *
 * Worse than ambiguous: the card says Design "filed nothing" while the road
 * says Design filed a prototype, and the only thing separating them is a unit
 * neither sentence named.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

import { inTurns, filedTimes } from "./a-turn-is-not-a-filing";

describe("the two units", () => {
  it("turns are turns, which is the story's own word for a pass", () => {
    expect(inTurns(12)).toBe("12 turns");
    expect(inTurns(6)).toBe("6 turns");
    expect(inTurns(1)).toBe("1 turn");
  });

  it("filings keep 'times', because the road's node is twelve characters wide", () => {
    expect(filedTimes(3)).toBe("3 times");
    expect(filedTimes(67)).toBe("67 times");
  });

  it("and one filing is not worth saying out loud", () => {
    // "1 prototype, 1 time" is the machinery counting to one. Null so the
    // branch lives here rather than in each of the four callers.
    expect(filedTimes(1)).toBeNull();
    expect(filedTimes(0)).toBeNull();
  });
});

/**
 * ── THE CENSUS, AND WHY IT IS OVER A COLLECTION ──────────────────────────────
 *
 * Law 14: a defect that exists only BETWEEN elements is invisible to every gate
 * that examines one element. Each of these four sentences was individually
 * correct and individually defensible; the contradiction lived in the gap, and
 * no test of any single file could ever have seen it.
 *
 * Its precondition is met, which is what makes this a census and not a
 * classifier wearing one: the fact is NAMEABLE from the source -- a count of
 * agent passes goes through `inTurns`, a count of filings through `filedTimes`,
 * and a bare "${n} times" template in one of these files is neither.
 */
const SENTENCE_SOURCES = [
  // Counts TURNS.
  "src/lib/spine/what-it-keeps-saying.ts",
  "src/lib/spine/the-blocker-it-already-named.ts",
  "src/components/spine/TrackActivity.tsx",
  // Counts FILINGS.
  "src/components/track/run-journey.ts",
];

/** A source guard scoring the prose that explains it is the standing trap. */
const codeOnly = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

describe("no surface on the run screen counts in a bare 'times' again", () => {
  it.each(SENTENCE_SOURCES)("%s routes every count through the vocabulary", (path) => {
    const code = codeOnly(readFileSync(path, "utf8"));
    /*
     * A template that interpolates something and then says "times" is a count
     * whose unit was chosen locally. Both correct answers are function calls,
     * so a literal here is by construction the drift this module exists to
     * stop.
     */
    expect(code).not.toMatch(/\$\{[^}]*\}\s*times/);
  });

  it("and the guard would actually catch one", () => {
    // The mirror. Every assertion above passes by finding NOTHING, so a regex
    // that had quietly stopped matching would report four clean files.
    expect("`${n} times`").toMatch(/\$\{[^}]*\}\s*times/);
    expect("`${found.length} times`").toMatch(/\$\{[^}]*\}\s*times/);
    expect("`${inTurns(n)}`").not.toMatch(/\$\{[^}]*\}\s*times/);
  });

  it("and every listed file is real, so a rename cannot empty the census", () => {
    // A path that stopped existing would throw above; a path list that was
    // silently trimmed would not. This pins the size.
    expect(SENTENCE_SOURCES.length).toBe(4);
    for (const p of SENTENCE_SOURCES) expect(readFileSync(p, "utf8").length).toBeGreaterThan(500);
  });
});
