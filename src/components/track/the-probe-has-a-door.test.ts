import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * THE PROBE IS REACHABLE FROM A SURFACE, AND SAYS WHAT THE PROBE SAID.
 *
 * ── WHY A GUARD AT ALL ─────────────────────────────────────────────────────
 * `metric-probe.server.ts` is the first of SPEC-BUILD-PATHS' five runnables and
 * it existed for weeks with ZERO importers repo-wide: its only reference was its
 * own test. It was not under-used, it was dead code, and nothing failed. This
 * repo's dominant defect is a capability with no door, and the only thing that
 * has ever caught it is somebody grepping by hand.
 *
 * So: the door is asserted. If a refactor drops the mount, this fails rather
 * than quietly returning the module to the state it spent its whole life in.
 */
describe("Decide's metric probe", () => {
  const SRC = readFileSync("src/components/track/ArtifactPane.tsx", "utf-8");

  it("is imported and actually rendered, not merely imported", () => {
    // Imported-but-unrendered is the exact shape TrackActivity and TrackChain
    // sat in for 24 days while the founder re-asked for them.
    expect(SRC).toContain("checkForecastObservable");
    expect(SRC).toContain("function ObservableProbe");
    expect(SRC).toContain("<ObservableProbe text={know} />");
  });

  it("asks while the field is still editable, which is the whole point", () => {
    // The probe takes the forecast's WORDS so it can answer before the row is
    // written. Mounting it against a saved decision id instead would move the
    // answer to after the promise, where it is a post-mortem.
    const mount = SRC.slice(SRC.indexOf("<ObservableProbe"));
    expect(mount.slice(0, 60)).toContain("text={know}");
    expect(mount.slice(0, 60)).not.toContain("decisionId");
  });

  it("renders the probe's own sentence and does not reword it", () => {
    /*
     * `because` already names the next action where there is one, and it is
     * written for the person the gate would have interrupted. S0 asserts the
     * passthrough on their side; this asserts it on mine, because a sentence
     * with two authors is a sentence with two versions.
     */
    const probe = SRC.slice(SRC.indexOf("function ObservableProbe"));
    expect(probe).toContain("{q.data.because}");
  });

  it("informs without disabling the press", () => {
    // A person may record a forecast this workspace cannot read yet: the source
    // may be connected next week. What they may not do is not know.
    const probe = SRC.slice(
      SRC.indexOf("function ObservableProbe"),
      SRC.indexOf("function ForecastForm"),
    );
    expect(probe).not.toContain("disabled");
  });
});
