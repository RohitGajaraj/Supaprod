/**
 * A HANDBACK CANNOT MANUFACTURE PROOF (gaps #6 and #12, 2026-08-26).
 *
 * ── THE MOST EXPENSIVE THING THIS FUNCTION COULD DO ────────────────────────
 * `release.publish` requires a `deployments` row with `status = 'success'`, and
 * R-27 gates the production deploy on **proof rather than a click**. F-36 is the
 * standing finding that the loop cannot produce that row.
 *
 * `submitStationByHand` writes a `deployments` row. **If it wrote `success`, a
 * person's pasted URL would become the evidence R-27 exists to demand** — and it
 * would look like a feature while doing it. Every value in that table today is
 * `success`, so the wrong constant was one keystroke away.
 *
 * It writes `claimed`, which cannot satisfy `release.publish`. That is the
 * design, not a shortfall: F-36's missing member row gets written, the proof does
 * not.
 *
 * The same rule one table over: a handed-back PR is `pr_open`, never `merged`.
 * We were told a pull request exists. Nobody checked whether it landed, and
 * `merged` is what promotion reads.
 *
 * ── AND THE TRACE GOES FIRST ───────────────────────────────────────────────
 * `recordTrackDrive(via: "press")` runs before any write can fail. R-18 forbids
 * counting a run a person touched as unattended, and F-79 caught a false
 * acceptance that survived precisely because a human act left no trace. If the
 * writes below it fail, the record still says somebody reached in — the safe
 * direction to be wrong in.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = readFileSync(fileURLToPath(new URL("./track.functions.ts", import.meta.url)), "utf8");
const FN = SRC.slice(SRC.indexOf("export const submitStationByHand"));

describe("it never writes the row release.publish reads as proof", () => {
  it("the deployment status is 'claimed', not 'success'", () => {
    expect(FN).toContain('status: "claimed"');
    // The whole point, stated as an assertion: nowhere in this function.
    expect(FN).not.toContain('status: "success"');
  });

  it("the handed-back PR is pr_open, never merged", () => {
    expect(FN).toContain('status: "pr_open"');
    expect(FN).not.toContain('status: "merged"');
  });

  it("it is attributed as a handback rather than a machine trigger", () => {
    // `triggered_by` already carries ci-poll-tick | promote | release, all of
    // them machine. A person's claim must not borrow one of those.
    expect(FN).toContain('triggered_by: "handback"');
  });
});

describe("the track loses its unattended claim, before anything else happens", () => {
  it("records the press", () => {
    expect(FN).toContain('via: "press"');
  });

  it("and records it BEFORE the artifact writes", () => {
    const press = FN.indexOf('via: "press"');
    const deploymentWrite = FN.indexOf('from("deployments"');
    const changesetWrite = FN.indexOf('from("studio_changesets"');
    expect(press).toBeGreaterThan(-1);
    expect(press).toBeLessThan(deploymentWrite);
    expect(press).toBeLessThan(changesetWrite);
  });

  it("and before the hold is cleared, so a failed write cannot leave a silent release", () => {
    const press = FN.indexOf('via: "press"');
    const clear = FN.indexOf("last_hold: null");
    expect(press).toBeLessThan(clear);
  });
});

describe("it refuses what a link cannot stand in for", () => {
  it("only Build and Ship accept a pasted link", () => {
    expect(FN).toContain('station !== "build" && station !== "ship"');
  });

  it("and the refusal says what to do instead, rather than filing an empty row", () => {
    // The other five produce a spec, a decision, a prototype — things a URL is
    // not. Accepting one would put an empty artifact where real work belongs.
    expect(FN).toContain("produces something a link cannot");
  });
});
