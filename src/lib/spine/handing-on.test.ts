/**
 * A station does not move work on until the next one can use what it filed.
 *
 * WHY THIS EXISTS. The driver advanced on `attached.length > 0`, which asks "did
 * this station file anything". The question that matters is "can the next station
 * work from what is now on the record", and the two come apart exactly when a
 * station does the WRONG job well.
 *
 * The live shape: Plan's crew is two seats, `prd-writer` filing a spec and
 * `sprint-planner` filing tasks. If the spec never lands and a task does,
 * `attached` is non-empty, the old rule advanced, and Design was handed nothing to
 * design against. Build then reported -- correctly -- that it had been given
 * nothing to build. That is the same "seven strangers given the same sentence"
 * failure the handoff was built to end, arriving through the last door open to it.
 *
 * WHAT THIS FILE IS REALLY FOR. A rule that blocks advancement is dangerous in the
 * other direction: too strict and it freezes work that was genuinely progressing.
 * So most of what follows asserts that every LEGITIMATE hand-on still passes,
 * station by station, using the real preconditions rather than a paraphrase.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "bun:test";

import { needIsMet, STATION_NEEDS, CORRECTABLE_HOLDS } from "./correction";
import { HOLD_LINE, type HoldReason } from "./driver";
import { TOOL_PRODUCTS, STATION_ARTIFACT } from "./attach";
import { fullRoute, nextStation } from "./route";
import { AGENT_STATION_ORDER, type AgentStation } from "@/lib/agent-vocabulary";

/** The advance rule, exactly as driveTrackOnce applies it. */
function canHandOn(from: AgentStation, filedNow: readonly string[]): boolean {
  const next = nextStation(fullRoute(), from);
  if (!next) return true; // the route is finished; nothing to be short of
  return needIsMet(STATION_NEEDS[next], filedNow);
}

/** Every artifact kind a station's own crew can file, from the tool map. */
function kindsAStationCanFile(station: AgentStation): string[] {
  return Object.values(TOOL_PRODUCTS)
    .filter(() => true)
    .map((p) => p.kind)
    .filter((k) => k === STATION_ARTIFACT[station]?.kind);
}

describe("the wrong artifact does not move work forward", () => {
  it("Plan filing only a task does not reach Design", () => {
    // THE DEFECT, stated exactly. A task is a real artifact and it is kept as a
    // member; what it is not is something Design can design against.
    expect(canHandOn("define", ["decision", "task"])).toBe(false);
  });

  it("Plan filing the spec does reach Design", () => {
    expect(canHandOn("define", ["decision", "prd"])).toBe(true);
  });

  it("Discover filing nothing usable does not reach Decide", () => {
    expect(canHandOn("sense", [])).toBe(false);
  });

  it("a station cannot hand on the artifact it inherited and nothing else", () => {
    // Plan arrives carrying a decision. If it files only another decision, Design
    // is still short of a spec, so the work must not move.
    expect(canHandOn("define", ["decision", "decision"])).toBe(false);
  });
});

describe("every legitimate hand-on still passes, station by station", () => {
  /**
   * THE SAFETY HALF, and the more important one. A rule that blocks advancement
   * freezes real work if it is even slightly too strict, so each row here is the
   * honest minimum a station produces on a healthy run.
   */
  const legitimate: Array<{ from: AgentStation; filed: string[]; why: string }> = [
    { from: "sense", filed: ["signal"], why: "Discover logged evidence" },
    {
      from: "sense",
      filed: ["theme"],
      why: "a clustering pass filed themes and no new signal, which is real work",
    },
    { from: "decide", filed: ["signal", "decision"], why: "Decide recorded the call" },
    { from: "define", filed: ["decision", "prd"], why: "Plan wrote the spec" },
    {
      from: "design",
      filed: ["prd", "prototype"],
      why: "Design drew a screen; Build needs the spec, which the track already carries",
    },
    {
      from: "design",
      filed: ["prd", "task"],
      why: "Design filed nothing of its own but Build has what it needs",
    },
    { from: "build", filed: ["prd", "changeset"], why: "Build staged a change" },
    {
      from: "ship",
      filed: ["changeset", "deployment"],
      why: "the deployment arrived through the gate harvest",
    },
    {
      from: "ship",
      filed: ["changeset"],
      why: "Learn can grade against a code change even with no deployment row",
    },
    { from: "learn", filed: ["learning"], why: "the route is finished, so nothing is owed" },
  ];

  for (const { from, filed, why } of legitimate) {
    it(`${from} hands on when ${why}`, () => {
      expect(canHandOn(from, filed), `${from} was blocked with ${filed.join(", ")}`).toBe(true);
    });
  }

  it("the last station always completes, whatever it filed", () => {
    // Nothing follows Learn, so there is no next station to be short of anything.
    // A rule that could block the final station would make completion impossible.
    const last = AGENT_STATION_ORDER[AGENT_STATION_ORDER.length - 1];
    expect(nextStation(fullRoute(), last)).toBeNull();
    expect(canHandOn(last, [])).toBe(true);
  });

  it("a station whose own artifact is not what comes next needs is not penalised", () => {
    // Design produces a `prototype`, and Build needs `prd` or `task`. So Design can
    // never satisfy the next station with its OWN output, and a rule written
    // against STATION_ARTIFACT rather than the next station's need would have
    // frozen Design on every healthy run. This is why the predicate is the next
    // station's need.
    const designProduces = STATION_ARTIFACT.design.kind;
    expect(STATION_NEEDS.build.kinds).not.toContain(designProduces);
    expect(canHandOn("design", ["prd", designProduces])).toBe(true);
    expect(kindsAStationCanFile("design")).toContain("prototype");
  });
});

describe("the hold says what is missing, and is correctable", () => {
  it("is its own reason rather than another shade of produced-nothing", () => {
    // "Filed nothing" and "filed the wrong thing" have different causes and
    // different fixes. A record that flattens them hands a person a word instead
    // of an answer.
    const hold: HoldReason = "nothing-to-hand-on";
    expect(HOLD_LINE[hold]).toBeTruthy();
    expect(HOLD_LINE[hold]).not.toBe(HOLD_LINE["produced-nothing"]);
  });

  it("names what is missing rather than what arrived", () => {
    // The stray artifact is not the problem; the next station being short is.
    // Worded without the word "station" itself (P-13, A-QUEUE.md,
    // 2026-09-02): this reason is not in STATION_SPECIFIC, so holdLine never
    // substitutes a display name into it, and the raw text would otherwise
    // reach a signed-in person verbatim.
    const line = HOLD_LINE["nothing-to-hand-on"];
    expect(line).toContain("not what the next one needs");
    expect(line.toLowerCase()).not.toContain("station");
    expect(line).not.toMatch(/[\u2013\u2014]/);
  });

  it("is handled by the correction loop, like its sibling", () => {
    // A station that keeps filing the wrong thing may need an earlier station
    // fixed, which is exactly what decideCorrection is for.
    expect(CORRECTABLE_HOLDS.has("nothing-to-hand-on")).toBe(true);
  });

  it("every station's missing phrase reads as a thing, so the line makes sense", () => {
    // The hold line interpolates `STATION_NEEDS[next].missing` on the driver's
    // side, so a phrase written as a sentence would produce nonsense.
    for (const station of AGENT_STATION_ORDER) {
      const missing = STATION_NEEDS[station].missing;
      expect(missing.length).toBeGreaterThan(3);
      expect(missing[0]).toBe(missing[0].toLowerCase());
      expect(missing.endsWith(".")).toBe(false);
    }
  });
});

describe("the driver actually applies the rule", () => {
  /**
   * Everything above tests the RULE. None of it would notice if the driver stopped
   * consulting the rule, which is the failure that would actually return the
   * defect. `driveTrackOnce` does real IO on every path and has no mock harness in
   * this repo, so the guard is a source scan -- the same shape retry-station.test.ts
   * uses, and weaker than a behavioural test in the ways source scans always are.
   *
   * `expect(body).toContain(x)` dumps two thousand lines on failure, so these read
   * as booleans with a sentence attached.
   */
  const body = readFileSync(new URL("./driver.server.ts", import.meta.url), "utf8");
  const has = (needle: string) => body.includes(needle);

  it("asks the next station's need before it moves a track", () => {
    /*
     * MATCHED ON THE PREDICATE, NOT ON THE ARGUMENT SPELLING (F-174).
     *
     * This asserted the literal `needIsMet(STATION_NEEDS[arrivedAt]` and broke
     * when the argument became a variable — a true claim failing because the
     * call was refactored, which is the third time a source-text assertion has
     * cost this repo a false red in one day. The predicate is what the rule is
     * about; which expression is handed to it is not.
     */
    expect(has("needIsMet(need, filedNow)"), "the advance predicate is gone").toBe(true);
    // And the ordinary path still asks the STATION's own need, so the decline
    // arm below cannot have quietly become the only branch.
    expect(has("STATION_NEEDS[arrivedAt]"), "the station's own need is no longer read").toBe(true);
  });

  it("lets a DECLINED route finish, and only a declined one (F-174)", () => {
    /*
     * A "do not build" waives define/design/build/ship, so `nextStation` returns
     * `learn` — and `STATION_NEEDS.learn` wants a prd, changeset or deployment,
     * none of which a track that was correctly never built can ever hold. The
     * decline path therefore could not complete. The arm is scoped to
     * `routeDeclined` so a track that WAS built still has to arrive at Learn
     * with something built.
     */
    expect(has('routeDeclined && arrivedAt === "learn"'), "the decline arm is gone").toBe(true);
    expect(has("routeDeclined = declined"), "the decline flag is never set").toBe(true);
  });

  it("writes the hold rather than advancing", () => {
    expect(has('last_hold: "nothing-to-hand-on"'), "the hold is never recorded").toBe(true);
  });

  it("checks BEFORE the write that moves the station", () => {
    // Order is the whole point. Checking after the update would record the move and
    // then object to it, leaving the track at a station it was never handed.
    const check = body.indexOf("needIsMet(need, filedNow)");
    const move = body.indexOf("station: arrivedAt");
    expect(check).toBeGreaterThan(-1);
    expect(move).toBeGreaterThan(-1);
    expect(check, "the advance check runs after the track has already moved").toBeLessThan(move);
  });

  it("judges the station on what the record holds now, not what it inherited", () => {
    // `filed` is computed before the crew runs. Using it alone would blame a station
    // for the state it arrived in and block every first pass.
    expect(has("...filed, ...attached.map("), "the check ignores what this tick filed").toBe(true);
  });
});
