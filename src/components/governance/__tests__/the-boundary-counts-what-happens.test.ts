/**
 * THE BOUNDARY SCREEN COUNTED WHAT WAS STORED, NOT WHAT HAPPENS.
 *
 * "Your crew does N of M things without asking" is the sentence the founder
 * asked this screen for. It was built from `agent_tools` seeds, and the loop
 * does not run seeds: `resolveToolMode` composes the seed with the agent's
 * trust arc and then the safety floors. Over the 74 registered tools those two
 * answers are not close, and the stored one is the LOOSER-looking of the pair
 * in the direction that hurts: it under-reports reach.
 *
 * Measured by executing the real resolver, not by reading it:
 *
 *   stored        52 auto · 21 confirm · 1 review
 *   trusted arc   68 auto ·  4 confirm · 2 review
 *
 * All 93 `agent_autonomy` rows are `trusted` and `loadAgentArc` defaults the
 * rest to trusted, so `trusted` is what this database actually runs on.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { resolveToolAccess } from "@/lib/ai/tools/defaults";
import { resolveToolMode } from "@/lib/ai/loop.server";

function prose(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
}

/**
 * TWO `ToolMode` TYPES, AND THEY DIFFER BY THE ONE VALUE THAT MATTERS.
 *
 *   src/lib/ai/tools/defaults.ts   "auto" | "confirm" | "review" | "off"
 *   src/lib/ai/trust.server.ts     "auto" | "confirm" | "review"
 *
 * `resolveToolAccess` returns the first. `resolveToolMode` takes the second.
 * This file passed one into the other and NOBODY COULD SEE IT: tsconfig.json
 * excludes `src/**\/*.test.ts`, so no test file in this repo has ever been
 * typechecked. S4 found the same hole in e2e/ and proved it with a deliberate
 * bad annotation that tsc reported zero times.
 *
 * IT IS NOT A LIVE DEFECT and it is worth knowing why, because the reason is
 * upstream of the type. `resolveToolAccess` DROPS an off tool from its list
 * entirely (`if (mode === "off") return []`), so the loop never hands
 * `resolveToolMode` an off tool and the narrower union is satisfied in
 * practice. `getBoundary` guards it explicitly for the same reason.
 *
 * BUT THE NARROWER FUNCTION WOULD MISHANDLE ONE IF IT ARRIVED. On `observing`,
 * `resolveApprovalMode` returns "review" for anything that is not already
 * "review" -- so an "off" tool handed to it comes back REVIEW-GATED rather
 * than off, which is a disabled tool switched back on. The only thing standing
 * between that and a person is a filter two calls upstream.
 *
 * Filed for whoever owns `src/lib/ai`: these should be one type. Until then
 * this file narrows explicitly rather than leaning on the filter, so the guard
 * says what it means and typechecks.
 */
const RESOLVABLE = ["auto", "confirm", "review"] as const;
type ResolvableMode = (typeof RESOLVABLE)[number];

/** The seeds `resolveToolMode` can actually be asked about. An off tool is not
 *  one of them, and this is where that is stated rather than assumed. */
function resolvable(mode: string): mode is ResolvableMode {
  return (RESOLVABLE as readonly string[]).includes(mode);
}

describe("the boundary counts what happens", () => {
  it("the arc moves enough tools that reading the seed is a wrong answer", async () => {
    const { TOOL_REGISTRY } = await import("@/lib/ai/tools/registry.server");
    const seeded = resolveToolAccess(Object.keys(TOOL_REGISTRY), []);

    const storedAuto = seeded.filter((t) => t.mode === "auto").length;
    const runsAuto = seeded.filter(
      (t) =>
        resolvable(t.mode) && resolveToolMode(t.tool_name, t.mode, "trusted", false) === "auto",
    ).length;

    // The gap is the bug. If a future change closed it honestly this assertion
    // is what would say so, and it should be read rather than deleted.
    expect(runsAuto).toBeGreaterThan(storedAuto);
    expect(runsAuto - storedAuto).toBeGreaterThanOrEqual(10);
  });

  it("and it moves the ones that matter, not a tail of harmless reads", async () => {
    const { TOOL_REGISTRY } = await import("@/lib/ai/tools/registry.server");
    const seeded = new Map(
      resolveToolAccess(Object.keys(TOOL_REGISTRY), []).map((t) => [t.tool_name, t.mode]),
    );
    for (const tool of ["studio.commit", "studio.revert", "release.publish", "github.pr.open"]) {
      const seed = seeded.get(tool);
      expect(seed, `${tool} is not registered`).toBeDefined();
      expect(seed, `${tool} no longer seeds to confirm`).toBe("confirm");
      expect(resolveToolMode(tool, "confirm", "trusted", false), `${tool} still asks`).toBe("auto");
    }
  });

  it("a tighter arc is reported too, so this is a reading and not a rubber stamp", () => {
    expect(resolveToolMode("studio.commit", "confirm", "observing", false)).toBe("review");
    expect(resolveToolMode("studio.commit", "confirm", "proving", false)).toBe("confirm");
  });

  /**
   * The whole point of moving this to the server. Two components used to carry
   * `runsAloneDespiteAsking`, a copy of ONE branch of the composition, which is
   * how they came to report 52 where the loop runs 68. A copy that is only
   * slightly wrong is worse than none, because it looks like it was checked.
   */
  it("neither surface restates the composition any more", () => {
    for (const path of [
      "src/components/governance/BoundaryControls.tsx",
      "src/components/governance/BoundaryStatement.tsx",
    ]) {
      const said = prose(readFileSync(path, "utf8"));
      expect(said, `${path} still names toolRisk`).not.toContain("toolRisk");
      expect(said, `${path} still has the old predicate`).not.toContain("runsAloneDespiteAsking");
    }

    /* And each reads the server's answer in the shape that suits it.
       BoundaryControls needs the field itself, to say on a row where the set
       value and the running one disagree. BoundaryStatement needs only the
       BUCKETS, which the server now fills from `runsAs`, so naming the field
       there would be a third thing to keep in step for no gain. */
    const controls = prose(readFileSync("src/components/governance/BoundaryControls.tsx", "utf8"));
    expect(controls).toContain("t.runsAs");
    const statement = prose(
      readFileSync("src/components/governance/BoundaryStatement.tsx", "utf8"),
    );
    expect(statement).toContain("bd?.alone");
  });
});
