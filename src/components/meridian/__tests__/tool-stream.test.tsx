/**
 * THE PIN IS THE COMPONENT, so the pin is what most of this asserts.
 *
 * Every log that follows the newest row is either loved or hated for one
 * behaviour: what it does when the reader has scrolled up to read something.
 * Taking the viewport back is the failure, and it cannot be caught by looking at
 * a screenshot, because it only happens on the frame a row arrives.
 *
 * HOW THE LAYOUT IS FAKED, and why that is honest here. happy-dom lays nothing
 * out, so every element reports `scrollHeight` and `clientHeight` as 0 and the
 * scroller would always look like it fits. The two figures are therefore defined
 * on the node directly. That is the smallest possible fiction: the component's
 * decision is arithmetic over those three numbers, and the arithmetic is exactly
 * what is under test.
 */
import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { ToolStream, type ToolStreamRow } from "../ToolStream";

function call(n: number, state: ToolStreamRow["state"] = "done"): ToolStreamRow {
  return { id: `c${n}`, tool: "repo.read", argument: `src/file-${n}.ts`, state };
}

/** A scroller that believes it is 200px tall with 1000px of content in it. */
function fakeLayout(el: HTMLElement) {
  Object.defineProperty(el, "scrollHeight", { value: 1000, configurable: true });
  Object.defineProperty(el, "clientHeight", { value: 200, configurable: true });
}

describe("it follows the newest row, until the reader is reading something", () => {
  it("keeps the newest row visible when the reader is already at the bottom", () => {
    const { rerender } = render(<ToolStream rows={[call(1), call(2)]} />);
    const el = screen.getByRole("log");
    fakeLayout(el);

    rerender(<ToolStream rows={[call(1), call(2), call(3, "running")]} />);

    expect(el.scrollTop).toBe(1000);
  });

  it("does not move the viewport by a pixel once the reader has scrolled up", () => {
    const { rerender } = render(<ToolStream rows={[call(1), call(2)]} />);
    const el = screen.getByRole("log");
    fakeLayout(el);

    // Scrolled to the very top: 1000 - 0 - 200 is 800px of content below.
    el.scrollTop = 0;
    fireEvent.scroll(el);

    rerender(<ToolStream rows={[call(1), call(2), call(3, "running")]} />);

    expect(el.scrollTop, "the stream stole the viewport back").toBe(0);
  });

  it("offers a way back, and names how many arrived while they were away", () => {
    const { rerender } = render(<ToolStream rows={[call(1), call(2)]} />);
    const el = screen.getByRole("log");
    fakeLayout(el);

    expect(screen.queryByRole("button"), "a way back appeared with nowhere to go").toBeNull();

    el.scrollTop = 0;
    fireEvent.scroll(el);
    rerender(<ToolStream rows={[call(1), call(2), call(3), call(4)]} />);

    expect(screen.getByRole("button").textContent).toContain("2 more calls");
  });

  it("says it in the singular for one arrival", () => {
    const { rerender } = render(<ToolStream rows={[call(1)]} />);
    const el = screen.getByRole("log");
    fakeLayout(el);
    el.scrollTop = 0;
    fireEvent.scroll(el);
    rerender(<ToolStream rows={[call(1), call(2)]} />);

    expect(screen.getByRole("button").textContent).toContain("1 more call");
  });

  it("re-pins and jumps when the way back is pressed", () => {
    const { rerender } = render(<ToolStream rows={[call(1)]} />);
    const el = screen.getByRole("log");
    fakeLayout(el);
    el.scrollTop = 0;
    fireEvent.scroll(el);
    rerender(<ToolStream rows={[call(1), call(2)]} />);

    fireEvent.click(screen.getByRole("button"));

    expect(el.scrollTop).toBe(1000);
    expect(screen.queryByRole("button"), "the way back is still offered at the bottom").toBeNull();
  });

  it("stays pinned when a scroll lands within a pixel or two of the bottom", () => {
    /*
     * Fractional layout puts `scrollTop` at the true bottom a hair under the
     * arithmetic. An exact comparison would unpin a reader who never scrolled,
     * which is the same defect from the other direction.
     */
    const { rerender } = render(<ToolStream rows={[call(1)]} />);
    const el = screen.getByRole("log");
    fakeLayout(el);

    el.scrollTop = 798;
    fireEvent.scroll(el);
    rerender(<ToolStream rows={[call(1), call(2)]} />);

    expect(screen.queryByRole("button")).toBeNull();
    expect(el.scrollTop).toBe(1000);
  });
});

describe("the label names the outcome, never the mechanism", () => {
  it("resolves a registry name through the product's own vocabulary", () => {
    render(
      <ToolStream
        rows={[
          { id: "a", tool: "prd.draft", state: "done" },
          { id: "b", tool: "web.search", state: "running" },
        ]}
      />,
    );
    expect(screen.getByText("drafting a spec")).toBeTruthy();
    expect(screen.getByText("searching the web")).toBeTruthy();
    expect(screen.queryByText("prd.draft")).toBeNull();
  });

  it("falls back to the raw name when the vocabulary has no entry, rather than inventing one", () => {
    /*
     * Deliberately ugly. A missing vocabulary entry showing as `cluster.trigger`
     * is how somebody notices and adds one; a plausible invented sentence is how
     * it ships forever.
     */
    render(<ToolStream rows={[{ id: "a", tool: "quarry.excavate", state: "running" }]} />);
    expect(screen.getByText("quarry.excavate")).toBeTruthy();
  });

  it("lets a caller override, for the case the vocabulary cannot know", () => {
    render(
      <ToolStream rows={[{ id: "a", tool: "repo.read", label: "reading the spec", state: "done" }]} />,
    );
    expect(screen.getByText("reading the spec")).toBeTruthy();
  });
});

describe("only a running call moves", () => {
  it("animates an arrival and leaves the rows that were already there alone", () => {
    const { container, rerender } = render(<ToolStream rows={[call(1), call(2), call(3)]} />);

    const before = [...container.querySelectorAll("li")].map((n) => n.getAttribute("style"));
    expect(before.every((s) => !s?.includes("mrd-fade-up")), "rows present at mount animated").toBe(
      true,
    );

    rerender(<ToolStream rows={[call(1), call(2), call(3), call(4, "running")]} />);

    const after = [...container.querySelectorAll("li")].map((n) => n.getAttribute("style") ?? "");
    expect(after[3]).toContain("mrd-fade-up");
    expect(after.slice(0, 3).every((s) => !s.includes("mrd-fade-up"))).toBe(true);
  });

  it("declares the spinner inline, so reduced motion can reach it", () => {
    /*
     * meridian.css's reduced-motion block matches on the style attribute. An
     * animation declared in a utility class keeps running for somebody who asked
     * it not to, which is a defect this repo has already paid for.
     */
    const { container } = render(<ToolStream rows={[call(1, "running")]} />);
    const spinning = [...container.querySelectorAll("[style]")].filter((n) =>
      (n.getAttribute("style") ?? "").includes("mrd-spin"),
    );
    expect(spinning.length).toBe(1);
  });

  it("gives a settled call no animation at all", () => {
    const { container } = render(<ToolStream rows={[call(1, "done"), call(2, "failed")]} />);
    expect(container.innerHTML).not.toContain("mrd-spin");
  });
});

describe("a failed call says what broke", () => {
  it("renders the reason on its own line", () => {
    render(
      <ToolStream
        rows={[
          {
            id: "a",
            tool: "repo.read",
            argument: "src/lib/spine/driver.ts",
            state: "failed",
            error: "The path is outside the touch list this run declared.",
          },
        ]}
      />,
    );
    expect(screen.getByText("failed")).toBeTruthy();
    expect(
      screen.getByText("The path is outside the touch list this run declared."),
    ).toBeTruthy();
  });

  it("says nothing on a settled call, because most rows of a healthy run are one", () => {
    render(<ToolStream rows={[call(1, "done")]} />);
    expect(screen.queryByText("done")).toBeNull();
  });
});

describe("the empty state uses ToolChips' own words", () => {
  it("tells a live run and a finished one apart", () => {
    const { rerender } = render(<ToolStream rows={[]} working />);
    expect(screen.getByText("Nothing called yet.")).toBeTruthy();

    rerender(<ToolStream rows={[]} />);
    expect(screen.getByText("This run called no tools.")).toBeTruthy();
  });

  it("carries data-mrd on the early return", () => {
    const { container } = render(<ToolStream rows={[]} />);
    expect(container.firstElementChild?.getAttribute("data-mrd")).toBe("");
  });
});

describe("length and width cannot break the column", () => {
  it("renders 500 rows", () => {
    const many = Array.from({ length: 500 }, (_, i) => call(i));
    const { container } = render(<ToolStream rows={many} />);
    expect(container.querySelectorAll("li").length).toBe(500);
  });

  it("animates none of 500 rows present at mount", () => {
    /*
     * The acceptance criterion says 500 appended rows must not degrade
     * scrolling, and the way this component would fail it is 500 simultaneous
     * entrance animations, each of which is a compositor layer.
     */
    const many = Array.from({ length: 500 }, (_, i) => call(i));
    const { container } = render(<ToolStream rows={many} />);
    expect(container.innerHTML).not.toContain("mrd-fade-up");
  });

  it("breaks a very long argument instead of widening the row", () => {
    const long = "src/components/meridian/" + "a-very-long-segment/".repeat(20) + "file.tsx";
    const { container } = render(
      <ToolStream rows={[{ id: "a", tool: "repo.read", argument: long, state: "done" }]} />,
    );

    const arg = [...container.querySelectorAll("span")].find((n) => n.textContent === long);
    expect(arg, "the argument is gone").toBeTruthy();
    expect(arg?.className).toContain("break-all");
    expect(container.innerHTML).not.toContain("whitespace-nowrap");
  });
});

describe("a row is a control only when a caller can act on it", () => {
  it("renders plain list items with no tab stop by default", () => {
    const { container } = render(<ToolStream rows={[call(1), call(2)]} />);
    expect(container.querySelectorAll("button").length).toBe(0);
  });

  it("becomes a button once there is somewhere to go", () => {
    const picked: string[] = [];
    render(<ToolStream rows={[call(1), call(2)]} onSelectRow={(r) => picked.push(r.id)} />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(picked).toEqual(["c1"]);
  });
});
