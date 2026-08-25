/**
 * `out-of-time` is the loop's own clock, and treating it as a hold killed the
 * watched walk.
 *
 * TWO BOUNDS THAT LOOK LIKE ONE. `FOREGROUND_WINDOW_MS` (50s) belongs to
 * `driveTrackNow` — the walk a person is watching. `TICK_DEADLINE_MS` (45s)
 * belongs INSIDE `driveTrackOnce` and stops the crew between seats. A crew that
 * exceeds 45s returns `hold: "out-of-time"`, and **nothing is waiting on
 * anybody** — the loop ran out of its own turn.
 *
 * `driveTrackNow` treated every hold alike: `stopped = "held"`, `break`. So
 * `more` computed `false` (it is true only for `out-of-window`, or a stalled
 * walk at the seat ceiling), and **item 34's auto-continue never fired, because
 * the driver never emitted the one value it waits for.**
 *
 * IT IS NOT AN EDGE CASE, and this is what turns a tidy fix into a necessary
 * one. Measured over **167 track-attached agent runs in 48h** — mean seat
 * **25.4s**, max **89.3s**, **9.6% over 45s** — the per-crew sums are:
 *
 *   sense   discovery-scout 24.7 + researcher 27.0 + customer-insights 17.9 = 69.6s
 *   decide  strategist 50.5 + critic 22.8                                    = 73.3s
 *   plan    prd-writer 23.3 + sprint-planner 33.0                            = 56.3s
 *   design  ux-architect 26.3 + design-critic 13.7                           = 40.0s
 *   build   builder 12.7 + qa 15.3                                           = 28.0s
 *
 * **Three of the five populated stations structurally cannot finish a crew
 * inside the inner deadline.** `strategist` alone averages 50.5s with 10 of 18
 * runs over 45s, which is F-14's "every strategist run exceeded the 45s deadline
 * by itself" measured again a fortnight later. So `out-of-window` was close to
 * unreachable on the watched path.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

import { holdTone } from "./driver";

const SRC = readFileSync(fileURLToPath(new URL("./track.functions.ts", import.meta.url)), "utf8");
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("the clock is reported as the clock", () => {
  it("maps out-of-time to out-of-window, not to held", () => {
    expect(CODE).toContain('if (outcome.hold === "out-of-time") {');
    expect(CODE).toMatch(/out-of-time"\) \{\s*\n\s*stopped = "out-of-window";/);
  });

  /**
   * ORDER IS THE WHOLE FIX. The specific check must precede the general one, or
   * `if (outcome.hold)` swallows it again and nothing changes.
   */
  it("checks it BEFORE the general hold branch", () => {
    const specific = CODE.indexOf('outcome.hold === "out-of-time"');
    const general = CODE.indexOf("if (outcome.hold) {");
    expect(specific).toBeGreaterThan(-1);
    expect(general).toBeGreaterThan(-1);
    expect(specific).toBeLessThan(general);
  });

  it("still reports every other hold as held", () => {
    expect(CODE).toContain('stopped = "held";');
  });
});

describe("what it unlocks", () => {
  /**
   * `more` is what item 34's auto-continue waits on, and it is true only for
   * `out-of-window` or a stalled walk at the seat ceiling. Before this, a
   * three-seat station could never produce either.
   */
  it("keeps more computing from out-of-window", () => {
    expect(CODE).toContain('stopped === "out-of-window"');
  });
});

describe("the surface is not misled either way", () => {
  /**
   * If an `out-of-time` ever does reach a surface, it must still read as a
   * pause rather than as something asking for a person — amber, not orchid.
   * The fix changes what the WALK does, not what the word means.
   */
  it("leaves out-of-time as a condition, never as a person's job", () => {
    expect(holdTone("out-of-time")).toBe("hold");
    expect(holdTone("out-of-time")).not.toBe("you");
  });
});

describe("the measurement stays with the fix", () => {
  it("records why this was structural rather than rare", () => {
    const prose = SRC.replace(/\n\s*\* ?/g, " ").replace(/\s+/g, " ");
    expect(prose).toContain("167 track-attached runs");
    expect(prose).toContain("69.6s");
    expect(prose).toContain("73.3s");
  });
});
