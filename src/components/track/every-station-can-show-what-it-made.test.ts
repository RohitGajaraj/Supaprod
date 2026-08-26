import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

import { STATION_ARTIFACT } from "@/lib/spine/attach";
import { AGENT_STATION_ORDER } from "@/lib/agent-vocabulary";

/**
 * EVERY STATION'S OWN OUTPUT HAS SOMETHING TO RENDER.
 *
 * ── THE HOLE THIS CLOSES, WHICH SHIPPED AND SAT THERE ─────────────────────
 * The right pane exists to show the thing each station made. `deployment` had
 * no case in the switch, so it fell to `default: return null` and **Ship, alone
 * among the seven, rendered nothing for its own artifact** while the columns it
 * needed were already fetched and passed in. The data arrived at the component
 * and was dropped on the last line, which is this repo's dominant defect in its
 * smallest possible form.
 *
 * ── WHY IT CHECKS THE STATION'S EXPECTED KIND, NOT EVERY KIND ─────────────
 * `task` and `mission` are deliberately NOT in that switch: no station expects
 * them, and they render through their own paths (an ordered step list, and a
 * mission card). Asserting on all of `KIND_WORD` would fail on those two
 * forever and get suppressed, and a suppressed guard is worse than none. What
 * must hold is narrower and is exactly what broke: whatever a station is
 * expected to FILE, this pane can draw.
 */
describe("the right pane", () => {
  const SRC = readFileSync("src/components/track/ArtifactPane.tsx", "utf-8");

  it("has a body for every artifact a station is expected to file", () => {
    const missing: string[] = [];
    for (const station of AGENT_STATION_ORDER) {
      const expects = STATION_ARTIFACT[station];
      if (!expects?.kind) continue;
      if (!SRC.includes(`case "${expects.kind}":`)) missing.push(`${station} files ${expects.kind}`);
    }
    expect(missing).toEqual([]);
  });

  it("reads a pane that actually has a switch, so a rename cannot make this vacuous", () => {
    // If `bodyFor` is refactored away, every `includes` above would pass by
    // finding nothing to disagree with. This is the tripwire on the tripwire.
    expect(SRC).toContain("const bodyFor = (item: ArtifactView)");
    expect(SRC.match(/case "[a-z]+":/g)?.length ?? 0).toBeGreaterThanOrEqual(7);
  });
});
