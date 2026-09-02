/**
 * ONE STATION DISPLAY ON THE RUN SCREEN, AND IT IS THE STRIP.
 *
 * ── WHAT WAS THERE, COUNTED BY A1 ON 2026-09-02 ───────────────────────────
 * Four displays of one run's seven stations, on one screen, at one time:
 *
 *   the shell strip          the band above the header, `mode: "tab"`, whose
 *                            chips already drive the artifact pane's contents.
 *   `ArtifactPane`'s tabs    its own row of seven, driving the same state.
 *                            Removed 2026-09-02, before this packet.
 *   `RunRouteHeader`         a `StepMeter` reading "Station 5 of 7", a `RunMap`
 *                            of the route and a clock, at the top of the LEFT
 *                            pane. Removed by P-01.
 *   `TrackChain`             2,706px of the same facts in the right pane, with
 *                            rows that opened a station. Removed by P-01.
 *
 * ── WHY "STATION 5 OF 7" IS THE WORST OF THEM AND NOT MERELY THE FOURTH ───
 * It is a POSITION. R-13 refused positions and `footer-mode.ts` states the same
 * rule for the bar under both panes: *"mode, not position. Never 'step 3 of
 * 7'."* A route that waives and reopens stations has no honest fraction, so the
 * meter and the footer contradicted each other on every run that had one.
 *
 * ── WHY THIS GUARD READS SOURCE, AND WHAT THAT COSTS ──────────────────────
 * A rendering test would be the stronger form and it cannot be written honestly
 * here: the run screen is a route composing two panes, each of which opens four
 * server functions through `useServerFn`, so standing it up means mocking the
 * whole read layer, and a guard whose scaffolding is bigger than its subject is
 * a guard nobody maintains. `the-strip-is-a-runs-step-list.test.ts` reads
 * `AppFrame.tsx` as text for exactly this reason and says so.
 *
 * So the reach is named rather than overstated: this proves no file that draws
 * the run screen declares a tablist or mounts a station meter or map. It cannot
 * prove that a component three imports deep does not, and the ONE tablist it
 * asserts positively -- the shell strip -- is checked in the file that owns it.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

/** Comments stripped: this file's neighbours quote the old code while explaining
 *  it, and a guard that counted those would push the next author to delete the
 *  explanation. */
const strip = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/** Every file that draws something on `/track/$trackId`. */
const SURFACE: Record<string, string> = {
  "the route": read("../../routes/_authenticated.track.$trackId.tsx"),
  TrackRun: read("./TrackRun.tsx"),
  ArtifactPane: read("./ArtifactPane.tsx"),
  TrackActivity: read("../spine/TrackActivity.tsx"),
  GotYou: read("./GotYou.tsx"),
  Verdict: read("./Verdict.tsx"),
  RunFooter: read("./RunFooter.tsx"),
};

const APPFRAME = strip(read("../shell/AppFrame.tsx"));

describe("the strip is the only tab list on the run screen", () => {
  it("is declared by the shell, once, and only for a run's own stages", () => {
    // `mode === "tab"` is a run publishing its seven stages; the workspace spine
    // publishes `nav` and must not become a tablist, because picking a chip
    // there navigates and a tablist promises you never leave.
    expect(APPFRAME).toContain('{strip && strip.mode === "tab" ? (');
    expect(APPFRAME).toContain('role={(strip.mode ?? "tab") === "tab" ? "tablist" : "group"}');
  });

  it("is not competed with by anything the run screen draws itself", () => {
    for (const [name, src] of Object.entries(SURFACE)) {
      expect(`${name}: ${strip(src).includes('role="tablist"')}`).toBe(`${name}: false`);
    }
  });
});

describe("no station meter, and no second route drawing", () => {
  it("mounts no StepMeter and no RunMap anywhere on the run screen", () => {
    for (const [name, src] of Object.entries(SURFACE)) {
      const code = strip(src);
      expect(`${name} StepMeter: ${code.includes("<StepMeter")}`).toBe(`${name} StepMeter: false`);
      expect(`${name} RunMap: ${code.includes("<RunMap")}`).toBe(`${name} RunMap: false`);
    }
  });

  it("mounts no TrackChain, which was the fourth drawing of one route", () => {
    for (const [name, src] of Object.entries(SURFACE)) {
      expect(`${name}: ${strip(src).includes("<TrackChain")}`).toBe(`${name}: false`);
    }
  });

  it("prints no `Station N of M`, in any of the three ways it could", () => {
    /*
     * Three, because the string is assembled rather than written. `StepMeter`
     * builds `${noun} ${at + 1} of ${total}` from a `noun` prop, so the literal
     * never appears in source: the guard has to cover the prop that produces it,
     * the template that could rebuild it by hand, and the literal itself.
     */
    for (const [name, src] of Object.entries(SURFACE)) {
      const code = strip(src);
      expect(`${name} noun: ${code.includes('noun="Station"')}`).toBe(`${name} noun: false`);
      expect(`${name} literal: ${/Station\s+\d+\s+of\s+\d+/.test(code)}`).toBe(
        `${name} literal: false`,
      );
      expect(`${name} template: ${/Station \$\{[^}]+\} of/.test(code)}`).toBe(
        `${name} template: false`,
      );
    }
  });
});

describe("what came off the run screen and where its fact went", () => {
  /*
   * A removal that loses a fact is a regression wearing a tidy-up, so each of
   * these pins the DESTINATION rather than only the deletion.
   */
  it("moved the tool calls under the seat that made them", () => {
    // `LiveWork` is no longer a block in the right pane.
    expect(strip(SURFACE["TrackRun"]).includes("<LiveWork")).toBe(false);
    // And the transcript hangs them off each turn instead.
    expect(SURFACE["TrackActivity"]).toContain("<SeatCalls");
    expect(SURFACE["TrackActivity"]).toContain("getTrackToolCalls");
  });

  it("moved the clock and the bill into the footer", () => {
    expect(strip(SURFACE["TrackRun"]).includes("<RunCost")).toBe(false);
    expect(SURFACE["RunFooter"]).toContain("elapsed");
    expect(SURFACE["RunFooter"]).toContain("cost");
    expect(SURFACE["the route"]).toContain("useRunTally");
  });

  it("kept one control for starting and stopping, in one place", () => {
    // The boxed region is gone from the left pane...
    expect(strip(SURFACE["TrackRun"]).includes('title="Run it"')).toBe(false);
    // ...and the footer draws exactly one of the two, never both.
    expect(SURFACE["RunFooter"]).toContain("mode.canStop ? (");
    expect(SURFACE["RunFooter"]).toContain("mode.canRun ? (");
  });
});
