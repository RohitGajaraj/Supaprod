/**
 * ── GROUPING IS NOT PROMOTION ────────────────────────────────────────────────
 *
 * Lane 1's fifth review, 2026-09-09: the receipt for letting Findings read on
 * its own says "Nothing is promoted without you", and the flag it flips
 * (`auto_cluster_enabled`) is the one this tick reads before it promotes. One
 * press was being asked to carry two different consents: grouping signals,
 * which costs nothing and shows a person more, and promoting a cluster, which
 * starts a track and spends.
 *
 * The mechanism keeps them apart and this pins that it does: promotion runs
 * against the bar the WORKSPACE set on Boundary, loaded per workspace, never a
 * constant chosen here. So the true sentence for that receipt is that grouping
 * happens on its own and promotion happens only when a cluster clears the bar
 * the person set, which is what Lane 2 now says on the surface. If this guard
 * ever fails, the receipt became a promise the code does not keep.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const TICK = readFileSync("src/routes/api/public/hooks/cluster-tick.ts", "utf8");

describe("grouping is not promotion", () => {
  it("promotion reads the workspace's own bar, not a constant", () => {
    expect(TICK).toContain("loadAutonomyPolicy(routinesDb, ws.id)");
    expect(TICK).toContain("promotionBarFor(policy)");
    const at = TICK.indexOf("promoteClustersOnce(");
    expect(at).toBeGreaterThan(-1);
    // The bar is what is handed to the sweep, so a workspace that set nothing
    // gets the platform floor and one that set a bar gets its own.
    expect(TICK.slice(at, at + 120)).toContain("bar");
  });

  it("a blocked promotion is reported rather than passing for a quiet day", () => {
    expect(TICK).toContain("cluster-tick: promotion blocked for");
  });

  it("the tick only touches workspaces that opted into reading at all", () => {
    expect(TICK).toContain('.eq("auto_cluster_enabled", true)');
    expect(TICK).toContain('.eq("is_sample", false)');
  });
});
