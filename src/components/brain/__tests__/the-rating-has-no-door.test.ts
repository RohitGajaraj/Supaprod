/**
 * NOTHING IN THE PRODUCT CAN RATE A RECALL, AND THE BRAIN IMPLIED OTHERWISE.
 *
 * The recall line says "77 of them rated, 70 helped, 7 contradicted by what
 * happened". A reader takes that as something that happens here, and wonders
 * why their own runs never appear in it.
 *
 * `submitFeedback` is the ONLY writer of `memory_recall_log.outcome`. Its only
 * caller USED TO BE `MessageMetaFooter` in `components/chat`, mounted nowhere
 * -- zero importers in `src/` outside its own file. P-49 (A-QUEUE.md) deleted
 * that file entirely (it was genuinely dead, not merely unmounted), so
 * `submitFeedback` now has ZERO callers anywhere, which is the same finding
 * one step further along rather than a different one: the door was missing
 * when a component nobody reached still held the only key, and it is still
 * missing with that component gone. The live chat surface (`AskDock` ->
 * `AskPane` -> `AskTurn`) never called it either -- its own `Provenance`
 * component covers cost and model, under a separate founder ruling
 * (2026-07-30), and was never asked to cover rating.
 *
 * Measured on the live database, 2026-08-28: all 77 rated recalls fall between
 * 29 June and 23 July, and the last one is 23 July. Nothing since, because
 * nothing can.
 *
 * THE FEATURE IS NOT BROKEN AND THE COPY DOES NOT SAY IT IS. The path is wired
 * end to end: a rating bumps `importance`, and importance is in the recall
 * RPC's own ORDER BY, so a rating really would move what the crew reads first.
 * What is missing is the control. Naming the missing half precisely is the
 * difference between a fact and a bug report.
 *
 * THIS GUARD IS WRITTEN TO GO RED WHEN SOMEBODY FIXES IT. If a control that
 * calls `submitFeedback` is ever mounted anywhere real, the sentence becomes
 * false and this test says so, which is the only way a line like it does not
 * quietly outlive its own reason.
 */
import { describe, it, expect } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { RATING_HAS_NO_DOOR } from "../standing-words";

/**
 * CODE ONLY. My own explanation of this finding names both symbols, in three
 * files, so the first version of this scan counted its own comments as callers
 * and reported four. That is the fourth time tonight a check in this repo has
 * been fooled by the prose written to explain it, and the third time by me.
 */
function code(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
}

/** Files that only NAME this symbol in copy or in a guard are not callers. */
const NOT_A_CALL_SITE = new Set([
  "src/components/brain/standing-words.ts",
  "src/components/brain/StandingRecord.tsx",
  "src/components/brain/__tests__/the-rating-has-no-door.test.ts",
]);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) {
      out.push(...walk(p));
      continue;
    }
    if ((p.endsWith(".ts") || p.endsWith(".tsx")) && !p.includes(".test.")) out.push(p);
  }
  return out;
}

describe("the rating has no door", () => {
  it("submitFeedback has no caller anywhere, not even an unmounted one", () => {
    const callers = walk("src").filter((f) => {
      if (f.endsWith("src/lib/feedback.functions.ts")) return false;
      if (f.endsWith("src/lib/ai/memory.server.ts")) return false; // names it in a comment
      if (NOT_A_CALL_SITE.has(f)) return false;
      return /\bsubmitFeedback\b/.test(code(readFileSync(f, "utf8")));
    });
    expect(callers).toEqual([]);
  });

  it("and the live chat surface's own answer register -- AskTurn's Provenance -- carries no rating control either", () => {
    // WHEN THIS FAILS, THE SENTENCE ON THE BRAIN IS WRONG AND MUST GO. That is
    // the point of asserting it against the live surface rather than trusting
    // a comment: Provenance is what actually reached a screen for this
    // register, and if it or anything beside it ever grows a feedback control,
    // the rating door has been built and this test should say so by breaking.
    const src = readFileSync("src/components/ask/AskTurn.tsx", "utf8");
    expect(code(src)).not.toMatch(/\bsubmitFeedback\b/);
  });

  /**
   * "UNRATED RATHER THAN UNHELPFUL" IS THE LOAD-BEARING CLAUSE, and it goes
   * FIRST. `outcome` is NOT NULL with a default of `ignored`, so 12,454 rows
   * assert a verdict nobody reached and the schema cannot say "unknown".
   * Anybody measuring whether the brain helps finds a 0.6% usefulness rate that
   * is not a measurement of the brain. A reader who takes only the first clause
   * must still have the true reading.
   */
  it("it says what those rows are not, before what is missing", () => {
    expect(RATING_HAS_NO_DOOR).toStartWith("The rest are unrated rather than unhelpful");
    const said = RATING_HAS_NO_DOOR;
    expect(said.indexOf("unrated")).toBeLessThan(said.indexOf("no surface"));
  });

  it("the sentence names the missing control, not a broken feature", () => {
    expect(RATING_HAS_NO_DOOR).toContain("no surface offers a rating today");
    const said = RATING_HAS_NO_DOOR.toLowerCase();
    expect(said).not.toContain("broken");
    expect(said).not.toContain("does not work");
    expect(said).not.toContain("failed");
  });

  it("and the brain draws it beside the count it explains", () => {
    const src = readFileSync("src/components/brain/StandingRecord.tsx", "utf8");
    expect(src).toContain("RATING_HAS_NO_DOOR");
  });
});
