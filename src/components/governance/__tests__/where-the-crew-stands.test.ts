/**
 * THE ONE SETTING THAT DECIDES EVERYTHING ELSE ON THE BOUNDARY SCREEN.
 *
 * A person reads "your crew does 68 of 74 things without asking" and had no way
 * from that page to learn why, or that a dial exists. It is not the per-tool
 * settings: 16 of those 68 are SET to come to you first and run anyway. It is
 * the rung every agent sits on.
 *
 * Live database, 2026-08-27: `agent_autonomy` holds 93 rows, all `trusted`, 92
 * of them straight from the bootstrap rather than from any promotion.
 */
import { describe, it, expect } from "bun:test";
import { whereTheCrewStands } from "../where-the-crew-stands";

describe("where the crew stands", () => {
  it("names the whole crew when they all sit on one rung", () => {
    expect(whereTheCrewStands({ trusted: 12 }).said).toBe(
      "All 12 of your agents run alone except on the risky calls.",
    );
    expect(whereTheCrewStands({ observing: 3 }).said).toBe(
      "All 3 of your agents wait for you on everything.",
    );
  });

  it("reads as English about one agent", () => {
    expect(whereTheCrewStands({ ambient: 1 }).said).toBe("Your one agent runs alone, always.");
  });

  /**
   * Nine trusted agents and three that ask first is NOT "your agents run
   * alone". The loosest rung answers the question this screen exists for, so it
   * leads; the rest are counted rather than swallowed.
   */
  it("never describes a mixed crew by its loosest member", () => {
    const said = whereTheCrewStands({ observing: 2, proving: 1, trusted: 9 }).said;
    expect(said).toBe(
      "9 of your 12 agents run alone except on the risky calls. The other 3 are held tighter.",
    );
  });

  it("puts the loosest first even when it is the smallest group", () => {
    const said = whereTheCrewStands({ observing: 10, ambient: 1 }).said;
    expect(said).toBe("1 of your 11 agents runs alone, always. The other 10 are held tighter.");
  });

  /**
   * NO ROWS IS NOT NO AGENTS. `loadAgentArc` hands a run with no row `trusted`
   * anyway under SW-7, so an empty table means the default is in force for
   * everybody -- the opposite of the reassuring reading.
   */
  it("an empty table says the default is in force, never that nothing runs", () => {
    const r = whereTheCrewStands({});
    expect(r.total).toBe(0);
    expect(r.said).toContain("Nobody has set a level");
    expect(r.said).toContain("runs alone except on the risky calls");
    expect(r.said).toContain("Crew");
    expect(whereTheCrewStands(null).said).toBe(r.said);
  });

  /** §12: "arc" is the code's word for this and may not reach a surface. */
  it("never says arc", () => {
    for (const c of [{ trusted: 3 }, { observing: 1, ambient: 2 }, {}]) {
      expect((whereTheCrewStands(c).said ?? "").toLowerCase()).not.toContain("arc");
    }
  });
});
