/**
 * P-90: the route says where it is, not just where it was. Before this
 * packet `RunMap.tsx` carried no `aria-live` anywhere -- a screen-reader
 * user watching a run poll had to re-walk the whole `<ol>` to notice the
 * "here" station moved. `AGENT_STATIONS[here.station].name` is announced
 * once the station is set, silent when none is `here` yet (the zero-route
 * case and the not-yet-started case both draw nothing to announce).
 */
import * as React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, afterEach } from "bun:test";
import { RunMap, type RunMapStation } from "./RunMap";
import { AGENT_STATIONS } from "@/lib/agent-vocabulary";

afterEach(cleanup);

const stop = (over: Partial<RunMapStation> = {}): RunMapStation => ({
  station: "sense",
  state: "done",
  ...over,
});

describe("RunMap: the current station is a live region, not only a visible tag", () => {
  it("carries exactly one role=status aria-live=polite region", () => {
    render(<RunMap stops={[stop()]} />);
    const regions = screen.getAllByRole("status");
    expect(regions).toHaveLength(1);
    expect(regions[0]?.getAttribute("aria-live")).toBe("polite");
  });

  it("names the station that is here", () => {
    render(
      <RunMap
        stops={[
          stop({ station: "sense", state: "done" }),
          stop({ station: "define", state: "here" }),
        ]}
      />,
    );
    expect(screen.getByRole("status").textContent).toBe(`Now at ${AGENT_STATIONS.define.name}`);
  });

  it("stays silent when nothing is here yet", () => {
    render(
      <RunMap
        stops={[
          stop({ station: "sense", state: "pending" }),
          stop({ station: "define", state: "done" }),
        ]}
      />,
    );
    expect(screen.getByRole("status").textContent).toBe("");
  });

  it("is visually hidden, not a second visible tag (the station glyph's own TAG already draws it)", () => {
    render(<RunMap stops={[stop({ state: "here" })]} />);
    expect(screen.getByRole("status").className).toContain("sr-only");
  });

  it("draws nothing to announce on the zero-route case either", () => {
    render(<RunMap stops={[]} />);
    // The empty-route branch is a wholly separate return with no live
    // region at all -- there is no "here" to announce when there is no
    // route yet, so this asserts the branch does not crash rather than
    // asserting an empty string that would not exist.
    expect(screen.queryByRole("status")).toBeNull();
  });
});
