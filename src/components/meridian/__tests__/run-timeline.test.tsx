/**
 * THE TIMELINE'S JOB IS THE SILENCES, so that is what most of this asserts.
 *
 * A run that worked for 28 minutes and a run that idled for 28 minutes waiting
 * on a person produce the SAME list of steps. Every other component in this
 * system would render them identically, and that is the whole reason this one
 * exists. So the tests that matter are not "does it list five things": they are
 * "does a gap become a row", "does the row say what was being waited on", and
 * "does it say it in words as well as in ink", because a hue alone fails a
 * greyscale reader and a screen reader at the same time.
 *
 * WHAT IS DELIBERATELY NOT ASSERTED: the rendered clock string. It comes from
 * `toLocaleTimeString`, so pinning it would pin the machine's locale and the
 * test would pass on a laptop and fail in CI. The `<time dateTime>` attribute is
 * the stable half and that is what is checked.
 */
import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";

import { RunTimeline, type TimelineEvent } from "../RunTimeline";

const T = Date.UTC(2026, 7, 19, 3, 0);
const MIN = 60_000;

function at(minutes: number): number {
  return T + minutes * MIN;
}

const CONTIGUOUS: TimelineEvent[] = [
  { id: "a", at: at(0), kind: "station", label: "Decide opened", state: "done" },
  { id: "b", at: at(1), kind: "tool", label: "Read the outage thread", state: "done" },
  { id: "c", at: at(2), kind: "handoff", label: "Handed to Challenge", state: "working" },
];

describe("a silence becomes a row, and a stretch of work does not", () => {
  it("draws no break between events a minute apart", () => {
    render(<RunTimeline events={CONTIGUOUS} />);
    expect(screen.queryByText(/waiting on you/)).toBeNull();
    expect(screen.queryByText(/before anything else happened/)).toBeNull();
  });

  it("draws a break, with its duration, once nothing happens for longer than the floor", () => {
    render(
      <RunTimeline
        events={[
          { id: "a", at: at(0), kind: "gate", label: "Asked whether to ship", state: "gate" },
          { id: "b", at: at(28), kind: "person", label: "You approved it", state: "done" },
        ]}
      />,
    );
    // 28 minutes, exact to the second, from the product's one duration formatter.
    expect(screen.getByText("28m 0s")).toBeTruthy();
  });

  it("names the wait after the state that was standing when it started", () => {
    const cases: [TimelineEvent["state"], string][] = [
      ["gate", "waiting on you"],
      ["held", "on hold"],
      ["working", "with nothing reported"],
      ["done", "before anything else happened"],
    ];

    for (const [state, word] of cases) {
      const { container, unmount } = render(
        <RunTimeline
          events={[
            { id: "a", at: at(0), kind: "station", label: "Something happened", state },
            { id: "b", at: at(30), kind: "station", label: "Something else did", state: "done" },
          ]}
        />,
      );
      /*
       * Scoped to the row carrying the duration rather than queried globally,
       * because a `gate` event's own row already says "waiting on you" and a
       * global query cannot tell the two apart. The silence is the row with the
       * figure on it.
       */
      const silence = [...container.querySelectorAll("li")].find((li) =>
        li.textContent?.includes("30m 0s"),
      );
      expect(silence, `a ${state} silence produced no row`).toBeTruthy();
      expect(silence?.textContent, `a ${state} silence is unnamed`).toContain(word);
      unmount();
    }
  });

  it("calls a silent machine silent rather than stalled", () => {
    /*
     * The record does not know that a quiet agent has stopped. It knows only
     * that nothing was filed. "Stalled" would be an outcome the timeline is not
     * entitled to report, which is the same rule that keeps red off an intent.
     */
    render(
      <RunTimeline
        events={[
          { id: "a", at: at(0), kind: "tool", label: "Started the build", state: "working" },
          { id: "b", at: at(45), kind: "tool", label: "Tests came back", state: "passed" },
        ]}
      />,
    );
    expect(screen.getByText("with nothing reported")).toBeTruthy();
    expect(screen.queryByText(/stalled/i)).toBeNull();
  });
});

describe("the state is a word, not only a hue", () => {
  it("says what every non-neutral state means in text", () => {
    render(
      <RunTimeline
        events={[
          { id: "a", at: at(0), kind: "gate", label: "Needs a call", state: "gate" },
          { id: "b", at: at(1), kind: "station", label: "Out of credit", state: "held" },
          { id: "c", at: at(2), kind: "tool", label: "Ran the checks", state: "failed" },
          { id: "d", at: at(3), kind: "tool", label: "Opened the pull request", state: "passed" },
        ]}
      />,
    );
    expect(screen.getByText("waiting on you")).toBeTruthy();
    expect(screen.getByText("on hold")).toBeTruthy();
    expect(screen.getByText("failed")).toBeTruthy();
    expect(screen.getByText("passed")).toBeTruthy();
  });

  it("stays silent on a finished step, because most rows of a healthy run are one", () => {
    render(
      <RunTimeline
        events={[{ id: "a", at: at(0), kind: "tool", label: "Read the spec", state: "done" }]}
      />,
    );
    expect(screen.queryByText("done")).toBeNull();
    expect(screen.getByText("Read the spec")).toBeTruthy();
  });
});

describe("the clock is a real instant", () => {
  it("carries a machine-readable time on every event", () => {
    const { container } = render(<RunTimeline events={CONTIGUOUS} />);
    const stamps = [...container.querySelectorAll("time")].map((n) => n.getAttribute("dateTime"));
    expect(stamps).toEqual([
      new Date(at(0)).toISOString(),
      new Date(at(1)).toISOString(),
      new Date(at(2)).toISOString(),
    ]);
  });
});

describe("live mode ticks and never implies a proportion", () => {
  it("adds a tail that reports the state and an elapsed figure", () => {
    render(<RunTimeline events={CONTIGUOUS} now={at(3)} />);
    const tail = screen.getByRole("status");
    expect(tail.textContent).toContain("a machine is working");
    expect(tail.textContent).toContain("so far");
  });

  it("draws no tail on a run that has settled", () => {
    render(
      <RunTimeline
        events={[{ id: "a", at: at(0), kind: "tool", label: "Merged", state: "passed" }]}
        now={at(1)}
      />,
    );
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("reports a held run as held rather than as a machine working", () => {
    render(
      <RunTimeline
        events={[
          { id: "a", at: at(0), kind: "station", label: "No source is connected", state: "held" },
        ]}
        now={at(4)}
      />,
    );
    expect(screen.getByRole("status").textContent).toContain("on hold");
  });

  it("has no progressbar, no percentage and no meter anywhere", () => {
    /*
     * The one assertion that would have caught the defect this component was
     * written to avoid. A coding agent cannot know how long it will take, so any
     * proportion drawn here is invented.
     */
    const { container } = render(<RunTimeline events={CONTIGUOUS} now={at(3)} />);
    expect(container.querySelector('[role="progressbar"]')).toBeNull();
    expect(container.querySelector("progress")).toBeNull();
    expect(container.querySelector('[aria-valuenow]')).toBeNull();
    expect(container.textContent).not.toContain("%");
  });

  it("closes the axis with a trailing silence on a run nobody has touched since", () => {
    render(
      <RunTimeline
        events={[{ id: "a", at: at(0), kind: "tool", label: "Merged", state: "done" }]}
        now={at(40)}
      />,
    );
    expect(screen.getByText("40m 0s")).toBeTruthy();
    expect(screen.getByText("before anything else happened")).toBeTruthy();
  });
});

describe("the empty state is composed, because it is the state most workspaces are in", () => {
  it("says what will appear rather than that there is nothing", () => {
    render(<RunTimeline events={[]} />);
    expect(screen.getByText("Nothing has happened here yet.")).toBeTruthy();
    expect(screen.getByText(/against the clock it happened on/)).toBeTruthy();
  });

  it("carries data-mrd on the early return", () => {
    /*
     * The defect this pins has shipped four times in this system: a component
     * whose main return wears the attribute and whose early return does not, so
     * the one state a reader meets first is the one state not wearing the design
     * system and its controls fall back to the legacy focus ring.
     */
    const { container } = render(<RunTimeline events={[]} />);
    expect(container.firstElementChild?.getAttribute("data-mrd")).toBe("");
  });
});

describe("length does not break the column", () => {
  const many: TimelineEvent[] = Array.from({ length: 200 }, (_, i) => ({
    id: `e${i}`,
    at: at(i * 0.1),
    kind: "tool" as const,
    label: `Read src/components/meridian/a-file-with-a-genuinely-long-name-${i}.tsx`,
    state: "done" as const,
  }));

  it("renders 200 events", () => {
    const { container } = render(<RunTimeline events={many} />);
    expect(container.querySelectorAll("li").length).toBe(200);
  });

  it("puts nothing in the row that can be wider than the row", () => {
    /*
     * A 200-row column pushing the page sideways is the failure this guards.
     * The body cell must be able to shrink, which `min-w-0` is what grants, and
     * a long label must be given somewhere to go.
     */
    const { container } = render(<RunTimeline events={many} />);
    const body = container.querySelector("li > span.min-w-0");
    expect(body, "the body cell lost min-w-0 and can no longer shrink").toBeTruthy();
    expect(body?.className).toContain("flex-1");
  });

  it("keeps the scroller on the class that carries the fade reasoning", () => {
    const { container } = render(<RunTimeline events={many} />);
    expect(container.querySelector(".mrd-fade-scroll")).toBeTruthy();
  });
});
