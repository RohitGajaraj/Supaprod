/**
 * THREE OF THE FOUR COMPONENTS WITH NO IMPORTER WERE SOMEBODY'S FINISHED WORK.
 *
 * Scanning my own directories for components nothing imports found four:
 *
 *   AutoChip         32 lines   mounted in U-138
 *   OutcomeHistory  188 lines   mounted here
 *   AskInPlace      176 lines   S1's to mount, routed days ago
 *   LiveTicker       99 lines   "the top bar", S2's, and S2 is gone
 *
 * None was abandoned. Each carries a header explaining what it is for and where
 * it belongs, and `OutcomeHistory`'s names its host in the first line: "Brain >
 * Outcomes, mounted beside CompoundingPanel". It closed three gaps the founder
 * asked for and no person could reach it.
 *
 * Together with `BoundaryTool.chosen` shipping into nothing and
 * `MessageMetaFooter` losing its mount, that made unreachable-finished-work
 * the most common defect on these surfaces -- more common than wrong logic, and
 * invisible to every gate: it typechecks, it lints, it builds, and its tests
 * pass if it has any.
 *
 * `MessageMetaFooter` ITSELF IS NOW GONE (P-49, A-QUEUE.md), not merely
 * unmounted: `components/chat/MessageMeta.tsx` had zero non-test importers on
 * the tip -- confirmed live, not assumed from this comment -- so it was
 * deleted rather than left as a fourth instance of this defect. The live
 * chat surface (`AskDock` -> `AskPane` -> `AskTurn`) never used it; its own
 * `Provenance` component (model, cost, records-read, behind "View credits")
 * is the surface that actually reached a screen for that concern, built
 * independently under the founder's 2026-07-30 ruling. The type contract
 * `MessageMeta.tsx` also carried (`ChatMeta`, `parseChatMeta`, real callers
 * across every `ask-*` module) moved to `src/lib/chat-meta.ts` rather than
 * going with it -- see that file's own header for the split.
 *
 * This guard is the cheap half of the fix: it keeps the two I mounted mounted.
 */
import { describe, it, expect } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

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

/** Comments name these components to explain them, so prose is stripped first
 *  -- the mistake this repo's checks have now made four times. */
function code(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
}

function importersOf(name: string, ownFile: string): string[] {
  return walk("src").filter((f) => {
    if (f === ownFile) return false;
    if (f.includes("__tests__")) return false;
    return new RegExp(`\\b${name}\\b`).test(code(readFileSync(f, "utf8")));
  });
}

describe("finished work that never reached a screen", () => {
  it("OutcomeHistory is drawn by the surface its own header names", () => {
    const hosts = importersOf("OutcomeHistory", "src/components/brain/OutcomeHistory.tsx");
    // "_authenticated.brain.tsx" -> "_authenticated.outcomes.tsx" (P-14a):
    // the file this test names moved, taking the import with it. The stub
    // left at the old path redirects and mounts nothing.
    expect(hosts).toContain("src/routes/_authenticated.outcomes.tsx");
  });

  it("AutoChip is drawn where the auto marker is stripped", () => {
    const hosts = importersOf("AutoChip", "src/components/supaprod/AutoChip.tsx");
    expect(hosts).toContain("src/components/knowledge/DecisionsPanel.tsx");
  });

  /**
   * Mounting it had to cost nothing, and this is why it does: the read is
   * character-identical to CompoundingPanel's key, so the two share one cache
   * entry. A second key would have made a free mount into an extra request on
   * the tab a person opens most.
   */
  it("and it shares its host's cache key rather than adding a request", () => {
    const src = readFileSync("src/components/brain/OutcomeHistory.tsx", "utf8");
    const panel = readFileSync("src/components/knowledge/CompoundingPanel.tsx", "utf8");
    const key = /queryKey:\s*(\[[^\]]*\])/.exec(src)?.[1];
    expect(key, "OutcomeHistory has no queryKey").toBeTruthy();
    expect(panel).toContain(key!);
  });
});
