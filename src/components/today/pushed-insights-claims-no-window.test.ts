import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * A HEADING MAY NOT NAME A PERIOD THIS PRODUCT CANNOT MEASURE.
 *
 * The panel read "What changed while you were away". That is a claim about a
 * window between two moments - when you last looked, and now - and the FIRST
 * of those does not exist. `when.ts` says so in as many words: there is no
 * per-user last-seen watermark in this database.
 *
 * The read has no time filter either. `getPushedInsights` selects
 * `status = 'open'` and `digest = false`, ordered by `pushed_at`. An insight
 * pushed three weeks ago that nobody answered is in that list, under a heading
 * saying it changed while you were away.
 *
 * Same defect as the board's "In the last 24 hours" subtitle, fixed the same
 * week on the same surface. The idea behind both is right and still
 * unbuildable: it is a column to add, not a claim to keep making loosely.
 */

const SRC = readFileSync("src/components/today/PushedInsights.tsx", "utf8");
/* Comments are stripped because this file's own header QUOTES the heading it
   replaced, to keep the record. A bare scan would find the past. */
const code = SRC.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
const READ = readFileSync("src/lib/brain-insights.functions.ts", "utf8");

describe("the heading", () => {
  it("NO LONGER CLAIMS A WINDOW", () => {
    expect(code).not.toContain("while you were away");
  });

  it("says what the read actually returns", () => {
    // `status = 'open'` is exactly "nobody has answered it".
    expect(code).toContain("Evidence you have not answered");
  });

  it("agrees with the count beside it", () => {
    expect(code).toContain("open");
  });

  it("uses the SAME heading on the failure branch", () => {
    // A panel that renames itself when its read fails is two panels.
    expect(code.split("Evidence you have not answered").length - 1).toBe(2);
  });
});

describe("the read it describes", () => {
  it("HAS NO TIME FILTER, which is why the window was unbackable", () => {
    // If this ever grows one, the heading may be revisited - but a `.gte` on
    // `pushed_at` still would not be "since you last looked".
    const at = READ.indexOf('.from("insights")');
    expect(at).toBeGreaterThan(-1);
    const q = READ.slice(at, at + 400);
    expect(q).toContain('.eq("status", "open")');
    expect(q).not.toContain(".gte(");
  });
});

describe("the subtitle", () => {
  it("DOES NOT OPEN WITH THE KICKER'S OWN WORDS", () => {
    // "New evidence" sat in the eyebrow and again as the first two words of the
    // sentence under it - the restatement this board spent the week removing.
    expect(code).toContain('className="today-kicker">New evidence<');
    expect(code).not.toContain("New evidence changed a standing call");
  });
});
