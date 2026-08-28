/**
 * A CEILING NOBODY HAS EVER REACHED LOOKS EXACTLY LIKE ONE THAT WORKS.
 *
 * The boundary screen used to state the policy and nothing else. Measured on
 * the live database on 2026-08-27: all 21 workspaces carry the same $10.00
 * per-goal ceiling, the most expensive single run ever recorded spent $0.142,
 * the most expensive whole goal $0.4297, and `agent_runs.halted_reason` has
 * never once carried `mission_spend_cap` -- all-time. A person reading "$10.00.
 * A run that reaches it halts" had no way to tell that brake from a decoration.
 *
 * These are the four things the sentence beside it must never get wrong.
 */
import { describe, it, expect } from "bun:test";
import { ceilingReality, money, RUNS, TRACKS, type CeilingRun } from "../ceiling-reality";

const run = (spend: number | string | null, halted?: string | null): CeilingRun => ({
  spend_used_usd: spend,
  halted_reason: halted ?? null,
});

describe("a ceiling says what it costs to reach", () => {
  it("says nothing at all on an empty or unusable read", () => {
    // R-22: the reassuring answer arrived at by omission is the one forbidden.
    expect(ceilingReality([]).said).toBeNull();
    expect(ceilingReality(null).said).toBeNull();
    expect(ceilingReality(undefined).said).toBeNull();
    expect(ceilingReality([run(null), run("not a number")]).said).toBeNull();
  });

  it("names its population inside the sentence, never just in a tooltip", () => {
    const r = ceilingReality([run(0.05), run(0.01), run(0.02)]);
    expect(r.said).toContain("Your last 3 runs");
    expect(r.population).toBe(3);
  });

  it("reports the most expensive run, and says none stopped when none did", () => {
    const r = ceilingReality([run(0.0537), run(0.01)]);
    expect(r.said).toBe("Your last 2 runs cost $0.05 at the most, and none of them stopped here.");
    expect(r.stopped).toBe(0);
    expect(r.highest).toBeCloseTo(0.0537, 4);
  });

  /**
   * THE ONE THAT MATTERS MOST. `out_of_credit` is the platform running out of
   * money; it is not this policy binding. Counting it would tell a person their
   * ceiling works when it has never fired -- the reassuring direction, on the
   * screen whose whole job is to be believed about what agents may do.
   */
  it("counts only the spend gate, never another halt wearing the word", () => {
    const other = ceilingReality([run(0.05, "out_of_credit"), run(0.01)]);
    expect(other.stopped).toBe(0);
    expect(other.said).toContain("none of them stopped here");

    const sweeper = ceilingReality([
      run(0.02, "Stopped automatically: no progress for 4 hours. Nothing was lost."),
    ]);
    expect(sweeper.stopped).toBe(0);

    const real = ceilingReality([
      run(10, "mission_spend_cap: Mission spend cap reached ($10.0000/$10.0000)"),
      run(0.01),
    ]);
    expect(real.stopped).toBe(1);
    expect(real.said).toBe("Your last 2 runs cost $10.00 at the most, and one stopped here.");
  });

  it("reads as English about a single run", () => {
    expect(ceilingReality([run(0.42)]).said).toBe(
      "Your last run cost $0.42, and it did not stop here.",
    );
    expect(ceilingReality([run(3, "mission_spend_cap: reached")]).said).toBe(
      "Your last run cost $3.00, and it stopped here.",
    );
  });

  it("a run that spent nothing says so rather than showing $0.00", () => {
    const r = ceilingReality([run(0), run(0)]);
    expect(r.said).toBe("Your last 2 runs have not spent anything yet.");
    expect(r.highest).toBe(0);
  });

  it("never rounds a real cost down to free", () => {
    // $0.0053 is a real amount. "$0.01" overstates it and "$0.00" reads as free.
    expect(money(0.0053)).toBe("under $0.01");
    expect(money(0)).toBe("$0.00");
    expect(money(10)).toBe("$10.00");
    expect(ceilingReality([run(0.0053)]).said).toContain("under $0.01");
  });
});

/**
 * THE TRACK CEILING GOT THE SAME TREATMENT, AND ONE CLAUSE LESS.
 *
 * U-088 left "Dollars one piece of work may spend" without its other half
 * because no reader returned per-track spend. `spine_tracks` carries it:
 * measured 2026-08-27, 106 tracks all with a figure, the most expensive
 * $0.7255 against a $5.00 ceiling.
 *
 * But `spine_tracks` carries NO HALT COLUMN, where `agent_runs` carries
 * `halted_reason`. So the run line's "and none of them stopped here" would be
 * a claim made out of a field that does not exist -- true-sounding,
 * unfalsifiable, and the exact shape this module refuses everywhere else. A
 * population that cannot see halts says nothing about stopping.
 */
describe("a population that cannot see halts says nothing about stopping", () => {
  const tracks = [run(0.7255), run(0.12), run(0)];

  it("reports the cost and stops there", () => {
    expect(ceilingReality(tracks, TRACKS).said).toBe(
      "Your last 3 pieces of work cost $0.73 at the most.",
    );
  });

  it("never claims none of them stopped, because it cannot know", () => {
    const said = ceilingReality(tracks, TRACKS).said ?? "";
    expect(said).not.toContain("stopped here");
    expect(ceilingReality(tracks, TRACKS).stopped).toBe(0);
  });

  it("a halt reason in the rows is ignored rather than counted", () => {
    // If a track row ever grows one, the subject has to be updated deliberately
    // rather than the count changing under the copy.
    const withHalt = [run(1, "mission_spend_cap: reached"), run(0.5)];
    expect(ceilingReality(withHalt, TRACKS).stopped).toBe(0);
    expect(ceilingReality(withHalt, RUNS).stopped).toBe(1);
  });

  it("and the run population still says it, because it can", () => {
    expect(ceilingReality(tracks, RUNS).said).toContain("none of them stopped here");
  });

  it("names the thing correctly in the singular", () => {
    expect(ceilingReality([run(0.42)], TRACKS).said).toBe("Your last piece of work cost $0.42.");
  });
});
