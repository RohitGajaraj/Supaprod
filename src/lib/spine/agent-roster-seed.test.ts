/**
 * The build gate on agent-roster reachability.
 *
 * WHAT MOVED, AND WHY. This file used to also assert that the tool-seed
 * migration granted every registered tool to every user. That check was right
 * against the wrong architecture: it proved every account got a row, when the
 * real fix was to stop needing rows. `src/lib/ai/tools/defaults.ts` is now the
 * platform policy, `agent_tools` holds only per-account deviations, and the gate
 * lives in `tools/defaults.test.ts` where both sides are the same language.
 *
 * The AGENT half stays here, because agents genuinely are per-account rows:
 * `agents` carries a user_id and is the target of a dozen foreign keys across
 * the demo seed, so it cannot collapse into a code-side registry the way tools
 * could. That makes the drift real for agents and worth pinning.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The same gate, one layer up: an agent the loop dispatches must have a row.
 *
 * `stationCrew` dispatches by slug and `loop.server.ts` looks that slug up in
 * the per-user `agents` table, so a catalog entry with no seeded row throws
 * "agent not found in your roster" at the station that needed it. That is the
 * same shape of defect as an unseeded tool, one level up, and it is how the
 * three new seats could have shipped looking complete and failing on contact.
 */
describe("agent roster seeding", () => {
  const ROSTER_SQL = join(
    process.cwd(),
    "supabase/migrations/20260801230000_three_missing_station_agents.sql",
  );

  function seededAgents(): string[] {
    const sql = readFileSync(ROSTER_SQL, "utf8");
    return [...sql.matchAll(/\(_user_id,\s*'([a-z0-9-]+)',\s*'/g)].map((m) => m[1]);
  }

  function catalogAgents(): string[] {
    const src = readFileSync(join(process.cwd(), "src/lib/agent-vocabulary.ts"), "utf8");
    const cat = src.slice(src.indexOf("SPECIALIST_CATALOG"));
    // Active cast only. Deprecated entries map history and are never dispatched;
    // crew entries are engine-only. Both are correctly absent from the roster.
    return [...cat.matchAll(/\{[^{}]*?slug:\s*"([^"]+)"[^{}]*?\}/gs)]
      .filter(
        (m) =>
          m[0].includes('tier: "cast"') &&
          m[0].includes('status: "active"') &&
          !m[0].includes("conductor: true"),
      )
      .map((m) => m[1]);
  }

  it("seeds a roster row for every agent the loop can dispatch", () => {
    const missing = catalogAgents().filter((s) => !seededAgents().includes(s));
    // If this fails: add the agent to seed_default_agents in the migration
    // above. A catalog entry with no roster row is an agent that exists on
    // every screen and throws the moment its station runs.
    expect(missing).toEqual([]);
  });
});
