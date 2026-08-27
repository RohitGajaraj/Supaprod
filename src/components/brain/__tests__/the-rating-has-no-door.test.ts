/**
 * NOTHING IN THE PRODUCT CAN RATE A RECALL, AND THE BRAIN IMPLIED OTHERWISE.
 *
 * The recall line says "77 of them rated, 70 helped, 7 contradicted by what
 * happened". A reader takes that as something that happens here, and wonders
 * why their own runs never appear in it.
 *
 * `submitFeedback` is the ONLY writer of `memory_recall_log.outcome`. Its only
 * caller is `MessageMetaFooter` in components/chat, and that component is
 * mounted NOWHERE -- zero importers in src/ outside its own file.
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
 * THIS GUARD IS WRITTEN TO GO RED WHEN SOMEBODY FIXES IT. If the control is
 * ever mounted, the sentence becomes false and this test says so, which is the
 * only way a line like it does not quietly outlive its own reason.
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

/** Files that only NAME these symbols in copy or in a guard are not callers. */
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
  it("submitFeedback still has exactly one caller", () => {
    const callers = walk("src").filter((f) => {
      if (f.endsWith("src/lib/feedback.functions.ts")) return false;
      if (f.endsWith("src/lib/ai/memory.server.ts")) return false; // names it in a comment
      if (NOT_A_CALL_SITE.has(f)) return false;
      return /\bsubmitFeedback\b/.test(code(readFileSync(f, "utf8")));
    });
    expect(callers).toEqual(["src/components/chat/MessageMeta.tsx"]);
  });

  it("and that caller's rating control is mounted nowhere", () => {
    const importers = walk("src").filter((f) => {
      if (f.endsWith("src/components/chat/MessageMeta.tsx")) return false;
      if (NOT_A_CALL_SITE.has(f)) return false;
      return /\bMessageMetaFooter\b/.test(code(readFileSync(f, "utf8")));
    });
    /* WHEN THIS FAILS, THE SENTENCE ON THE BRAIN IS WRONG AND MUST GO. That is
       the point of asserting it here rather than trusting a comment. */
    expect(importers).toEqual([]);
  });

  it("the sentence names the missing control, not a broken feature", () => {
    expect(RATING_HAS_NO_DOOR).toContain("No surface offers this today");
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
