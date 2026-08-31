import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * THE BOUNDARY PAGE NOW EXPLAINS THE LADDER, SO THE EXPLANATION IS PINNED TO THE
 * CODE THAT DECIDES.
 *
 * WHAT THIS EXISTS TO CATCH. `SPEC-AI-NATIVE-SDLC.md` §3 F asks S3 to explain
 * autonomy "by environment", after Anthropic's dev-freely / staging-intermediate
 * / production-gated. **We have no environment axis.** Traced 2026-08-31,
 * `axisDefault` in `src/lib/ai/approval-policy.ts` decides on exactly two
 * properties of the act:
 *
 *   toolConsequence(tool).reversible     reversible | partial | irreversible
 *   isExternalTool(tool)                 does it leave the workspace
 *
 * and the word "production" appears nowhere in it. `opsImpact` IS a live axis,
 * but a different one: `assessTool` scores five axes and takes the maximum, with
 * `OPS_SCORE.production = 2` at the top. So a deploy is the strictest case
 * because it is irreversible and customers see it, not because of its name.
 *
 * WHY THAT DISTINCTION IS WORTH A TEST RATHER THAN A COMMENT. A customer who
 * reads "production is gated" concludes staging is not, and we do not read the
 * environment name at all. The page now says so. If somebody later teaches
 * `axisDefault` an environment axis, or removes one of the two it has, the page
 * is describing a rule that no longer exists and nothing else would notice.
 *
 * THE ASYMMETRY IS DELIBERATE. This pins the page to the DECIDER's inputs, not
 * to its output wording: `axisDefault`'s per-tool sentences are rendered verbatim
 * elsewhere and may be reworded freely. Only the axes are load bearing here.
 */

const ROOT = join(import.meta.dir, "..", "..");
const PAGE = readFileSync(join(ROOT, "components/governance/BoundaryControls.tsx"), "utf8");
const POLICY = readFileSync(join(ROOT, "lib/ai/approval-policy.ts"), "utf8");

/** Only the decider, so a doc comment elsewhere in the file cannot satisfy this. */
const AXIS_DEFAULT = (() => {
  const start = POLICY.indexOf("function axisDefault(");
  expect(start).toBeGreaterThan(-1);
  const rest = POLICY.slice(start);
  const end = rest.indexOf("\n}\n");
  return end === -1 ? rest : rest.slice(0, end);
})();

/** The page's own copy, with comments stripped: this file's header quotes it. */
/* F-159 corollary: a JSX comment comes out WITH its braces. Stripping the
   block form alone leaves `{` and `}` behind, and a comment above a
   protected line then puts a brace between a `>` and the word a matcher
   wants. That silently disabled this lane's rename guard until a mutation
   test caught it, so every guard here strips the JSX form first. */
const PAGE_CODE = PAGE.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, " ")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

describe("the boundary page explains the ladder that actually decides", () => {
  it("renders the explanation at all", () => {
    expect(PAGE_CODE).toContain('title="How these three were decided"');
  });

  it("names both axes the decider actually reads", () => {
    expect(AXIS_DEFAULT).toContain("reversible");
    expect(AXIS_DEFAULT).toContain("isExternalTool");
    expect(PAGE_CODE).toContain("Can it be undone from inside the product");
    expect(PAGE_CODE).toContain("Does it leave your workspace");
  });

  /**
   * The claim that would be a lie the moment an environment axis appeared, and
   * equally a lie today if the page had simply copied Anthropic's sentence.
   */
  it("does not claim we gate on the environment's name, because the decider never reads it", () => {
    expect(AXIS_DEFAULT).not.toMatch(/\b(staging|production|environment)\b/i);
    expect(PAGE_CODE).toContain("not because of the word");
  });

  /**
   * A second ladder is the failure §3 F names in terms. The page may describe
   * the rungs; it may not introduce a promotion of its own.
   */
  it("introduces no second ladder", () => {
    const region = PAGE_CODE.slice(
      PAGE_CODE.indexOf('title="How these three were decided"'),
      PAGE_CODE.indexOf('{block(\n            "alone"'),
    );
    expect(region.length).toBeGreaterThan(0);
    for (const control of ["<Toggle", "<PolicyNumber", "<Picker", "mutate("]) {
      expect(region).not.toContain(control);
    }
  });
});
