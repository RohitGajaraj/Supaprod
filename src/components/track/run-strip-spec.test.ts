import { describe, expect, it } from "bun:test";

import { runStripSpec } from "./run-strip-spec";

/**
 * The strip on a run screen is the run's own step list. These guard the two
 * things in the mapping that are judgment rather than transcription: which
 * chip is marked `next`, and that a settled run is never given one.
 */
function track(over: Record<string, unknown> = {}) {
  return {
    station: "build",
    status: "open",
    route: {
      path: ["sense", "decide", "define", "design", "build", "ship", "learn"],
      waived: [] as { station: string; reason: string }[],
    },
    holdReason: null,
    ...over,
  } as unknown as Parameters<typeof runStripSpec>[0];
}

const noop = () => undefined;

describe("the run's own strip", () => {
  it("covers nothing until the track has answered", () => {
    // `null` is what `usePublishRunStrip` reads as "do not cover the workspace
    // spine", so a run whose read is in flight shows the default rather than an
    // empty 97px band.
    expect(runStripSpec(null, false, null, noop)).toBeNull();
  });

  it("lights the station the run is standing on", () => {
    const spec = runStripSpec(track(), false, null, noop);
    expect(spec?.active).toBe("build");
  });

  it("marks exactly ONE station next, and it is the one after here", () => {
    // "What it is about to do" is a single answer. Marking every unreached
    // station `next` would mean nothing, which is why this is asserted as a
    // count and not just a flag.
    const spec = runStripSpec(track(), false, null, noop);
    const next = spec!.stages.filter((s) => s.state === "next");
    expect(next).toHaveLength(1);
    expect(next[0]!.station).toBe("ship");
  });

  it("gives a settled run NO next, because nothing further will happen", () => {
    const done = runStripSpec(track({ status: "done", station: "learn" }), false, null, noop);
    expect(done!.stages.some((s) => s.state === "next")).toBe(false);

    const dropped = runStripSpec(track({ status: "abandoned" }), false, null, noop);
    expect(dropped!.stages.some((s) => s.state === "next")).toBe(false);
  });

  it("keeps a waived station on the strip and says why, rather than hiding it", () => {
    // A waived station is a DECISION on the record. A gap where one used to be
    // reads as an omission -- `runPosition` unions the waivers in for this
    // reason and the note is where the reason surfaces.
    const spec = runStripSpec(
      track({
        route: {
          path: ["sense", "decide", "define", "build", "ship", "learn"],
          waived: [{ station: "design", reason: "no interface changes" }],
        },
      }),
      false,
      null,
      noop,
    );
    const design = spec!.stages.find((s) => s.station === "design");
    expect(design).toBeDefined();
    expect(design!.note).toContain("no interface changes");
  });

  it("supplies onSelect, which is what makes a chip a control at all", () => {
    // `RunStripSpec.onSelect`'s contract: a chip is a control if and only if
    // this is supplied. Inside a run it swaps the work region and never
    // navigates, which is the one station interaction R-01 permits.
    const spec = runStripSpec(track(), false, null, noop);
    expect(typeof spec?.onSelect).toBe("function");
    expect(spec?.mode).toBe("tab");
  });

  it("prefers the pane's selection over the run's position once a person picks", () => {
    const spec = runStripSpec(track(), false, "sense", noop);
    expect(spec?.active).toBe("sense");
  });
});
