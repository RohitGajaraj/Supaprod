import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * "STANDING LIMITS" NAMED A CEILING THAT HAS NEVER EXISTED.
 *
 * THE DEFECT. The Controls panel rendered, under a Region headed *Standing
 * limits*: **"Missions at once — New goals queue when the mesh is at capacity.
 * 5"**. The 5 came from `MISSION_CONCURRENCY_CAP` in `governance.functions.ts`,
 * which had exactly two references in the repository: its own definition, and
 * that `<Num>`. **Nothing read it**, so nothing queued and nothing was ever at
 * capacity.
 *
 * MEASURED, BECAUSE A GREP PROVES ONLY THAT I DID NOT FIND IT. Live database,
 * 2026-08-31: **330 of 397 missions are open right now**, and the peak in a
 * single workspace is **94** concurrent, taking `created_at` to
 * `coalesce(completed_at, archived_at)` as the window. A cap of five cannot have
 * been in force while ninety-four ran. That is craft-bar standard #7's "invented
 * number", and #7 is the one bar that deletes a claim rather than sending it
 * back.
 *
 * IT IS ALSO R-23 INVERTED. That ruling is about a function that lands with no
 * door; this is a number on a door with no function behind it. Same repository,
 * same week, same root cause: something shipped and nothing connected it.
 *
 * WHY THE ROW SURVIVED AND ONLY THE NUMBER WENT. This Region is what a company
 * reads to decide whether to put real work through the product, which is §0.7's
 * rank 5. The ABSENCE of a concurrency ceiling is a fact they need; deleting the
 * row would have hidden it. And it is not written as "unlimited", because R-22's
 * rule is that an absence must never be dressed as a deliberate choice, and
 * nobody chose this.
 *
 * ── WHAT THIS TEST PINS, AND WHY IT IS THE MECHANISM AND NOT THE WORDS ────
 * SESSION-3's trap list: *"Pin the claim, not the spelling. A guard on a literal
 * string fails when copy improves and passes when meaning breaks. Found six
 * times in one day."* So this does not assert the new sentence. It asserts the
 * two-way relationship: while the constant has no consumer, the panel may not
 * print a cap; and if somebody wires the constant up, this test fails and tells
 * them the copy is now understating the product.
 */

const ROOT = join(import.meta.dir, "..", "..");
const PANEL = readFileSync(join(ROOT, "components/governance/ControlsPanel.tsx"), "utf8");
/** Comments quote the retired copy and the constant's name; assertions read code. */
/* F-159 corollary: a JSX comment comes out WITH its braces. Stripping the
   block form alone leaves `{` and `}` behind, and a comment above a
   protected line then puts a brace between a `>` and the word a matcher
   wants. That silently disabled this lane's rename guard until a mutation
   test caught it, so every guard here strips the JSX form first. */
const CODE = PANEL.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, " ")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

/** Every source file, so "who consumes this" is answered over the tree rather
 *  than over the handful of directories I happened to think of. */
function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

/**
 * COMMENTS ARE STRIPPED BEFORE COUNTING, and the first run of this test is why.
 *
 * It failed naming `ControlsPanel.tsx` as a consumer, correctly by its own
 * reading and wrongly in fact: the only remaining mention there is the comment
 * explaining this very finding, which has to name the constant to be worth
 * reading. A guard that forbids describing a defect makes the codebase worse at
 * the thing it is trying to protect.
 */
function codeOnly(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

const CONSUMERS = sourceFiles(ROOT).filter((f) => {
  if (f.endsWith("lib/governance.functions.ts")) return false; // its own definition
  return codeOnly(readFileSync(f, "utf8")).includes("MISSION_CONCURRENCY_CAP");
});

describe("the panel does not name a limit nothing enforces", () => {
  it("the constant still has no consumer anywhere in src", () => {
    /*
     * If this fails, somebody wired it up, and that is GOOD NEWS that makes the
     * copy wrong in the other direction: the panel is now understating a real
     * ceiling. Put the number back, say what it does, and delete this test.
     */
    expect(CONSUMERS).toEqual([]);
  });

  it("so the row states the absence instead of printing a number", () => {
    const region = CODE.slice(CODE.indexOf('title="Standing limits"'));
    const row = region.slice(region.indexOf('label="Missions at once"'));
    const untilNextLine = row.slice(0, row.indexOf("<Line", 10));
    expect(untilNextLine).not.toContain("<Num>");
    expect(untilNextLine).not.toContain("MISSION_CONCURRENCY_CAP");
  });

  it("and the row is still there, because the absence is the fact a buyer needs", () => {
    expect(CODE).toContain('label="Missions at once"');
  });

  /**
   * R-22: an absence must never be dressed as a deliberate choice. "Unlimited"
   * would claim somebody decided this, and nobody did.
   */
  it("does not call it unlimited", () => {
    const region = CODE.slice(CODE.indexOf('title="Standing limits"'));
    expect(region.toLowerCase()).not.toContain("unlimited");
    expect(region.toLowerCase()).not.toContain("no limit,");
  });

  /**
   * The other two constants this sweep checked. Both ARE enforced
   * (`workspace-claim.functions.ts` writes `expiresAt` and `graceUntil` from
   * them), so their copy is true and stays. Pinned so that unwiring one makes
   * the claim false silently.
   */
  it("the claim-window numbers the billing card prints are ones the server writes", () => {
    const fns = readFileSync(join(ROOT, "lib/workspace-claim.functions.ts"), "utf8");
    expect(fns).toContain("CLAIM_OFFER_TTL_DAYS");
    expect(fns).toContain("CLAIM_RELEASE_GRACE_DAYS");
  });
});
