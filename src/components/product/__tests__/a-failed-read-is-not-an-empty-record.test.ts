/**
 * FOUR PANELS TOLD A PERSON THE RECORD WAS EMPTY WHEN THE READ HAD FAILED.
 *
 * Each had a `useQuery` and no error arm, so a query that did not come back
 * fell straight through to the empty state:
 *
 *   RoadmapHistory          "No roadmap history yet."
 *   LaunchPlanPanel         "No launch plan yet."
 *   FlowDiagram             "No flow generated yet."
 *   ProductAnalyticsPanel   "No data yet. Click refresh to pull from PostHog."
 *
 * THE HARM IS THE ACTION EACH ONE INVITES. RoadmapHistory's popover is titled
 * "Why this is here", so its sentence tells a person the decision has no
 * recorded reason. FlowDiagram offers to generate a flow, so a reader who acts
 * on it regenerates work that may already exist. The analytics one offers a
 * refresh, which is the right move for a source with nothing and the wrong one
 * for a read that failed -- and the sentence cannot tell them apart.
 *
 * This is F-76's shape, which this repo has now found on a dozen surfaces: a
 * swallowed read producing a confident claim rather than an error.
 *
 * The guard is structural rather than textual. It finds every `useQuery` in
 * these directories and requires the file to handle `isError` somewhere,
 * because the specific sentence is not the thing worth pinning -- the missing
 * branch is.
 */
import { describe, it, expect } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const DIRS = [
  "src/components/product",
  "src/components/governance",
  "src/components/knowledge",
  "src/components/brain",
  "src/components/memory",
  "src/components/connections",
  "src/components/trust",
];

/**
 * Files whose query genuinely needs no error arm, each with the reason. Drawing
 * NOTHING on a failed read is correct when the component's whole job is to
 * appear conditionally: silence then claims nothing, which is the safe
 * direction. Drawing an EMPTY STATE is what this test exists to stop.
 */
const DRAWS_NOTHING: Record<string, string> = {
  "src/components/system/EverythingIsPausedBanner.tsx":
    "Only draws when paused. A failed read cannot establish paused, so silence is the honest answer.",
  "src/components/brain/RetentionLine.tsx":
    "Returns null unless the plan is free. A failed read leaves planTier null, which is not free, so it draws nothing.",
  "src/components/knowledge/GraphForceCanvas.tsx":
    "A renderer fed by its parent's read; the parent owns the failure arm.",
};

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) {
      out.push(...walk(p));
      continue;
    }
    if (p.endsWith(".tsx") && !p.includes(".test.")) out.push(p);
  }
  return out;
}

describe("a failed read is not an empty record", () => {
  it("every panel that reads also says when the read failed", () => {
    const silent: string[] = [];
    for (const dir of DIRS) {
      let files: string[] = [];
      try {
        files = walk(dir);
      } catch {
        continue;
      }
      for (const file of files) {
        if (file in DRAWS_NOTHING) continue;
        const src = readFileSync(file, "utf8");
        if (!/useQuery\(/.test(src)) continue;
        if (/isError/.test(src)) continue;
        silent.push(file);
      }
    }
    expect(silent.sort()).toEqual([]);
  });

  it("the four that were wrong now name what did not load", () => {
    for (const file of [
      "src/components/product/RoadmapHistory.tsx",
      "src/components/product/LaunchPlanPanel.tsx",
      "src/components/product/FlowDiagram.tsx",
      "src/components/product/ProductAnalyticsPanel.tsx",
    ]) {
      const src = readFileSync(file, "utf8");
      expect(src, `${file} has no error branch`).toMatch(/isError/);
      expect(src, `${file} does not say what failed`).toMatch(/did not (load|come back)/);
      expect(src, `${file} does not carry the reason`).toContain("readFailureMessage");
    }
  });

  /* An exemption with no reason is how the next one hides. */
  it("every file excused from the rule says why", () => {
    for (const [file, why] of Object.entries(DRAWS_NOTHING)) {
      expect(why.length, `${file} has no reason`).toBeGreaterThan(30);
    }
  });
});
