import { describe, it, expect } from "bun:test";

/**
 * A LIVE RUN'S TOOL STREAM SHOWS WHAT THE DATABASE RECORDED, OR NOTHING.
 *
 * THIS FILE USED TO GUARD THREE FABRICATIONS ON `/runs/$missionId`'s OWN
 * MOUNT of `<ToolStream>`: a synthesized-row fallback, an invented "running"
 * state nothing in the write path can produce, and a bare `latency_ms` read
 * with no "no duration" case. That page is deleted (P-14, A-QUEUE.md, R-35: a
 * mission without a track is not a run), and its mount went with it, so those
 * three source-text guards on the route are retired rather than rehomed --
 * `ToolStream` is still fed real rows, by its two surviving callers
 * (`components/track/LiveWork.tsx`, `components/spine/TrackActivity.tsx`),
 * neither of which this file ever checked.
 *
 * WHAT SURVIVES is the one fact that was never about the route: `ToolStream`
 * printed its durations through `formatDuration`
 * (components/studio/run-return.ts:65-74), which floors to whole seconds
 * because it was built for a run's total span. Measured 2026-08-22 20:30:16
 * UTC over the two newest traces in `public.tool_calls`, the latencies are 68,
 * 27, 82, 386, 536, 1139 and 3531 ms -- five of the seven would have said
 * "0s". `callTook` in ToolStream.tsx replaced it; the test below is what
 * stops the whole-second formatter coming back, against the component
 * directly rather than through any one caller's mount.
 */

describe("the live tool stream renders recorded calls, never invented ones", () => {
  it("prints a sub-second call as a real figure, not as zero", async () => {
    const { render } = await import("@testing-library/react");
    const { ToolStream } = await import("@/components/meridian/ToolStream");
    const { createElement } = await import("react");

    const { container } = render(
      createElement(ToolStream, {
        rows: [
          {
            id: "a",
            tool: "workspace.search",
            at: Date.UTC(2026, 7, 22, 20, 0),
            state: "done" as const,
            durationMs: 386,
          },
          {
            id: "b",
            tool: "cluster.trigger",
            at: Date.UTC(2026, 7, 22, 20, 1),
            state: "done" as const,
            durationMs: 3531,
          },
          {
            id: "c",
            tool: "signals.list",
            at: Date.UTC(2026, 7, 22, 20, 2),
            state: "done" as const,
            durationMs: 0,
          },
        ],
      }),
    );

    /* `RunTook` is the span treatment; `RunClock` is a <time> with the same
       classes, so the element name is what separates a duration from an
       arrival instant. Reading textContent instead matched "0s" inside the
       clock's own "20:00", which is how this assertion first went green
       against the wrong thing. */
    const figures = [...container.querySelectorAll("span.tabular-nums.text-mrd-faint")].map(
      (n) => n.textContent,
    );
    expect(figures).toEqual(["386ms", "3.53s"]);
    // Two figures for three rows: a 0 is "under the clock's resolution", not a
    // call that took no time, so it draws nothing rather than "0ms" or "0s".
  });
});
