/**
 * THE LAYOUT IS THE COMPONENT, so the layout arithmetic is what this asserts.
 *
 * A flowchart that renders eight cards and puts the connectors somewhere near them
 * is not nearly right, it is wrong: the whole information content of a graph is
 * which node joins which, and a curve that stops in the air beside a card says
 * nothing. So the tests are about anchors, rows and the one offset that makes the
 * connectors land.
 *
 * WHAT IS FAKED AND WHAT IS NOT. happy-dom lays nothing out, so `offsetHeight` is
 * 0 and `clientWidth` is 0, and the component's fallbacks take over: a 480px canvas
 * and a 92px estimated node height. Those are the reference's own fallbacks, they
 * are deterministic, and every figure below is derived from them rather than
 * measured, which makes the arithmetic checkable in a way a real browser would not.
 * What cannot be checked here is whether a MEASURED height changes the layout, and
 * a test asserts the estimate is only a fallback rather than the layout itself.
 */
import { describe, expect, it } from "bun:test";
import { fireEvent, render, screen } from "@testing-library/react";

import { Flowchart, flowFromSteps, type FlowEdge, type FlowNode } from "../Flowchart";

/* The reference's constants, restated here so a change to either side fails. */
const PAD_Y = 24;
const ROW_GAP = 64;
const PILL_OFFSET = 30;
const EST_H = 92;
const CW = 480;

const BRANCH: { nodes: FlowNode[]; edges: FlowEdge[] } = {
  nodes: [
    {
      id: "signal",
      row: 0,
      x: 0.5,
      station: "discover",
      kind: "Trigger",
      title: "A firmware complaint arrives",
      caption: "Any signal on the firmware theme starts this",
    },
    { id: "rank", row: 1, x: 0.5, station: "decide", kind: "If / Else", title: "Is it worth a bet?" },
    { id: "spec", row: 2, x: 0.26, station: "plan", title: "Draft the spec" },
    { id: "park", row: 2, x: 0.74, station: "learn", title: "File it against the theme" },
    { id: "build", row: 3, x: 0.26, station: "build", title: "Write the notice" },
    { id: "ship", row: 4, x: 0.26, station: "ship", title: "Open the pull request" },
  ],
  edges: [
    { from: "signal", to: "rank" },
    { from: "rank", to: "spec", label: "yes" },
    { from: "rank", to: "park", label: "no" },
    { from: "spec", to: "build" },
    { from: "build", to: "ship" },
  ],
};

/**
 * Every CONNECTOR path, in the order the component drew them.
 *
 * Scoped to the first svg, which is the connector layer. A bare
 * `querySelectorAll("svg path")` also picks up the station glyph inside every
 * node, and the first draft of this file did exactly that: an assertion about
 * connector geometry was reading a glyph's arc and passing or failing on it.
 */
function paths(container: HTMLElement): string[] {
  const layer = container.querySelector("svg");
  return [...(layer?.querySelectorAll("path") ?? [])].map((p) => p.getAttribute("d") ?? "");
}

describe("a branching sequence renders as a graph", () => {
  it("draws every node and every edge", () => {
    const { container } = render(<Flowchart {...BRANCH} />);
    expect(screen.getByText("A firmware complaint arrives")).toBeTruthy();
    expect(screen.getByText("Open the pull request")).toBeTruthy();
    // Five edges, and the station glyphs are inside their own svgs, so the paths
    // are counted from the connector svg alone.
    const connectors = container.querySelector("svg")!;
    expect(connectors.querySelectorAll("path").length).toBe(5);
  });

  it("labels a two-way branch on both of its outgoing edges", () => {
    render(<Flowchart {...BRANCH} />);
    expect(screen.getByText("yes")).toBeTruthy();
    expect(screen.getByText("no")).toBeTruthy();
  });

  it("puts the two branches on one row, at different x", () => {
    const { container } = render(<Flowchart {...BRANCH} />);
    const spec = [...container.querySelectorAll("div[style*='left']")].find((d) =>
      d.textContent?.includes("Draft the spec"),
    ) as HTMLElement;
    const park = [...container.querySelectorAll("div[style*='left']")].find((d) =>
      d.textContent?.includes("File it against the theme"),
    ) as HTMLElement;

    // Row 2 for both: PAD_Y + 2 rows of (EST_H + ROW_GAP).
    const expectedTop = PAD_Y + 2 * (EST_H + ROW_GAP);
    expect(spec.style.top).toBe(`${expectedTop}px`);
    expect(park.style.top).toBe(`${expectedTop}px`);
    /* Compared as numbers, not strings: 0.26 * 480 is 124.80000000000001 in
       binary floating point and the browser prints it back as written. */
    expect(Number.parseFloat(spec.style.left)).toBeCloseTo(0.26 * CW, 6);
    expect(Number.parseFloat(park.style.left)).toBeCloseTo(0.74 * CW, 6);
  });
});

describe("the pill offset is why the connectors land on the cards", () => {
  it("starts an edge at the source's bottom and ends it inside the target's card", () => {
    /*
     * THE MECHANIC THIS COMPONENT WOULD BE WRONG WITHOUT. A kind pill sits ABOVE
     * the card inside the node's box, so the node's top EDGE is 30px above the
     * card. An anchor taken from the top edge stops in the air beside the pill.
     */
    const { container } = render(<Flowchart {...BRANCH} />);
    const first = paths(container)[0];

    const row0Bottom = PAD_Y + EST_H;
    const row1Top = PAD_Y + EST_H + ROW_GAP;

    // `signal` has a kind pill, and so does `rank`, so the arrival is offset.
    expect(first.startsWith(`M ${0.5 * CW} ${row0Bottom} C`)).toBe(true);
    expect(first.endsWith(`${0.5 * CW} ${row1Top + PILL_OFFSET}`)).toBe(true);
  });

  it("takes no offset on a node with no kind pill", () => {
    const { container } = render(
      <Flowchart
        nodes={[
          { id: "a", row: 0, x: 0.5, title: "One" },
          { id: "b", row: 1, x: 0.5, title: "Two" },
        ]}
        edges={[{ from: "a", to: "b" }]}
      />,
    );
    const row1Top = PAD_Y + EST_H + ROW_GAP;
    expect(paths(container)[0].endsWith(`${0.5 * CW} ${row1Top}`)).toBe(true);
  });

  it("curves rather than turning a corner, which is what the reference draws", () => {
    // Read off the reference's source: a cubic bezier leaving downward and
    // arriving downward, so two edges out of one node separate immediately. An
    // orthogonal connector would need a routing pass to avoid crossing the cards.
    const { container } = render(<Flowchart {...BRANCH} />);
    for (const d of paths(container)) {
      expect(d).toContain(" C ");
      expect(d).not.toContain(" L ");
      expect(d).not.toContain(" H ");
      expect(d).not.toContain(" V ");
    }
  });

  it("holds the curve's control distance between its floor and its cap", () => {
    /*
     * `k = clamp(|dy| * 0.55, 24, 84)`, the reference's own. The floor keeps a
     * short hop from rendering as a straight line; the cap stops a long one
     * ballooning out of the canvas.
     *
     * Four ranks apart: dy is 4 * (92 + 64) = 624, so 0.55 of it is 343 and the
     * cap takes it to 84.
     */
    const { container } = render(
      <Flowchart
        nodes={[
          { id: "a", row: 0, x: 0.5, title: "One" },
          { id: "m1", row: 1, x: 0.9, title: "Aside" },
          { id: "m2", row: 2, x: 0.9, title: "Aside" },
          { id: "m3", row: 3, x: 0.9, title: "Aside" },
          { id: "b", row: 4, x: 0.5, title: "Far below" },
        ]}
        edges={[{ from: "a", to: "b" }]}
      />,
    );
    expect(paths(container)[0]).toContain(`C ${0.5 * CW} ${PAD_Y + EST_H + 84}`);
  });

  it("scales the control distance with the run on a single-rank hop", () => {
    /*
     * One rank apart, and the arithmetic is worth writing out because I got it
     * wrong first: the source anchor is row 0's BOTTOM, 24 + 92 = 116, and the
     * target anchor is row 1's TOP, 24 + 92 + 64 = 180. So dy is exactly
     * `ROW_GAP`, 64, and k is 0.55 of that, 35.2. Neither clamp applies.
     *
     * THE FLOOR IS UNREACHABLE AT THESE FALLBACKS, and that is a fact about the
     * component rather than a gap in this test: the smallest dy any edge can have
     * is `ROW_GAP`, since the pill offset only ever pushes the arrival further
     * down, and 0.55 of 64 is already above 24. The floor exists for a MEASURED
     * layout where a short node leaves rows closer together than the estimate does.
     */
    const { container } = render(
      <Flowchart
        nodes={[
          { id: "a", row: 0, x: 0.5, title: "One" },
          { id: "b", row: 1, x: 0.5, title: "Two" },
        ]}
        edges={[{ from: "a", to: "b" }]}
      />,
    );
    const k = ROW_GAP * 0.55;
    expect(k).toBeGreaterThan(24);
    expect(k).toBeLessThan(84);
    expect(paths(container)[0]).toContain(`C ${0.5 * CW} ${PAD_Y + EST_H + k}`);
  });

  it("treats a row number as a rank, not as a distance", () => {
    /*
     * FOUND BY WRITING THIS FILE. `row: 9` beside `row: 0` does NOT leave nine
     * rows of space: the rows present are sorted and indexed, so those two are
     * adjacent. That is the right behaviour, because a caller numbering rows 0, 10,
     * 20 to leave themselves room should not get a canvas with two screens of
     * nothing in it. It is worth pinning because the opposite is the obvious guess.
     */
    const { container } = render(
      <Flowchart
        nodes={[
          { id: "a", row: 0, x: 0.5, title: "One" },
          { id: "b", row: 9, x: 0.5, title: "Two" },
        ]}
        edges={[{ from: "a", to: "b" }]}
      />,
    );
    const canvas = container.firstElementChild as HTMLElement;
    expect(canvas.style.height).toBe(`${PAD_Y + EST_H + ROW_GAP + EST_H + PAD_Y}px`);
  });
});

describe("the canvas is responsive by construction", () => {
  it("places nodes as a fraction of the canvas, not at fixed pixels", () => {
    const { container } = render(<Flowchart {...BRANCH} />);
    const nodes = [...container.querySelectorAll("div[style*='left']")] as HTMLElement[];
    // Every left is a multiple of the 480px fallback, never a hardcoded column.
    for (const n of nodes) {
      const left = Number.parseFloat(n.style.left);
      expect(left / CW).toBeGreaterThan(0);
      expect(left / CW).toBeLessThan(1);
    }
  });

  it("never lets a node be wider than the canvas", () => {
    const { container } = render(
      <Flowchart
        nodes={[{ id: "a", row: 0, x: 0.5, w: 4000, title: "A very wide node" }]}
        edges={[]}
      />,
    );
    const node = container.querySelector("div[style*='left']") as HTMLElement;
    expect(Number.parseFloat(node.style.width)).toBeLessThanOrEqual(CW * 0.92);
  });

  it("grows the canvas with the rows rather than clipping them", () => {
    const { container } = render(<Flowchart {...BRANCH} />);
    const canvas = container.firstElementChild as HTMLElement;
    // Five rows: PAD_Y + 4 gaps + 5 heights + PAD_Y.
    const expected = PAD_Y + 4 * (EST_H + ROW_GAP) + EST_H + PAD_Y;
    expect(canvas.style.height).toBe(`${expected}px`);
  });
});

describe("it degrades at the sizes nobody draws", () => {
  it("renders one node with no edges at all", () => {
    const { container } = render(
      <Flowchart nodes={[{ id: "a", row: 0, x: 0.5, title: "The only step" }]} edges={[]} />,
    );
    expect(screen.getByText("The only step")).toBeTruthy();
    expect(container.querySelectorAll("svg path").length).toBe(0);
  });

  it("renders 40 nodes", () => {
    const many = flowFromSteps(
      Array.from({ length: 40 }, (_, i) => ({ id: `n${i}`, title: `Step ${i + 1}` })),
    );
    const { container } = render(<Flowchart {...many} />);
    expect(container.querySelectorAll("div[style*='left']").length).toBe(40);
    expect(container.querySelector("svg")!.querySelectorAll("path").length).toBe(39);
  });

  it("draws nothing for an edge naming a node that is not there", () => {
    /*
     * A dangling edge is a data defect, and the component's job is to not invent a
     * position for it. Drawing to (0,0) would put a line through the top-left
     * corner and look deliberate.
     */
    const { container } = render(
      <Flowchart
        nodes={[{ id: "a", row: 0, x: 0.5, title: "One" }]}
        edges={[{ from: "a", to: "gone" }]}
      />,
    );
    expect(container.querySelectorAll("svg path").length).toBe(0);
  });

  it("truncates a 90 character title instead of widening the node", () => {
    const long = "Rewrote the firmware reboot notice so a homeowner can tell a restart from an outage";
    render(<Flowchart nodes={[{ id: "a", row: 0, x: 0.5, title: long }]} edges={[]} />);
    expect(screen.getByText(long).className).toContain("truncate");
  });

  it("says what will appear, rather than drawing an empty canvas", () => {
    render(<Flowchart nodes={[]} edges={[]} />);
    expect(screen.getByText("This run has no map yet.")).toBeTruthy();
  });

  it("carries data-mrd on the early return", () => {
    const { container } = render(<Flowchart nodes={[]} edges={[]} />);
    expect(container.firstElementChild?.getAttribute("data-mrd")).toBe("");
  });
});

describe("a node is a control only when a caller can act on it", () => {
  it("renders plain cards with no tab stop by default", () => {
    const { container } = render(<Flowchart {...BRANCH} />);
    expect(container.querySelectorAll("button").length).toBe(0);
  });

  it("becomes a button once there is somewhere to go", () => {
    const picked: (string | null)[] = [];
    render(<Flowchart {...BRANCH} onSelect={(id) => picked.push(id)} />);
    fireEvent.click(screen.getByRole("button", { name: /A firmware complaint arrives/ }));
    expect(picked).toEqual(["signal"]);
  });

  it("lights only the edges touching the selected node", () => {
    const { container } = render(
      <Flowchart {...BRANCH} selectedId="rank" onSelect={() => {}} />,
    );
    const strokes = [...container.querySelector("svg")!.querySelectorAll("path")].map((p) =>
      p.getAttribute("stroke"),
    );
    // signal->rank, rank->spec and rank->park touch it; the last two do not.
    expect(strokes).toEqual([
      "var(--mrd-ink)",
      "var(--mrd-ink)",
      "var(--mrd-ink)",
      "var(--mrd-edge)",
      "var(--mrd-edge)",
    ]);
  });

  it("lights a selection with ink rather than with a status hue", () => {
    /*
     * The reference lights a selected edge with its accent. Meridian's accent is
     * `--mrd-you`, which means a person is required, so spending it here would say
     * this edge was waiting for somebody. Ink against edge is a value step, which
     * also survives greyscale.
     */
    const { container } = render(<Flowchart {...BRANCH} selectedId="rank" onSelect={() => {}} />);
    const html = container.innerHTML;
    for (const status of ["mrd-you", "mrd-agent", "mrd-pass", "mrd-fail", "mrd-hold"]) {
      expect(html, `a status hue reached the canvas: ${status}`).not.toContain(status);
    }
  });
});

describe("the ground and the kind pill are the reference's, in Meridian's ink", () => {
  it("draws a dotted ground rather than a grid or a plain panel", () => {
    const { container } = render(<Flowchart {...BRANCH} />);
    const style = (container.firstElementChild as HTMLElement).getAttribute("style") ?? "";
    expect(style).toContain("radial-gradient");
    expect(style).toContain("22px 22px");
  });

  it("uses no raw colour anywhere", () => {
    // Connectors, ground and cards all draw from --mrd-* only.
    const { container } = render(<Flowchart {...BRANCH} selectedId="rank" onSelect={() => {}} />);
    expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(container.innerHTML).not.toMatch(/\brgba?\(/);
  });

  it("keeps the kind pill colourless, and says which station by shape", () => {
    const { container } = render(<Flowchart {...BRANCH} />);
    expect(screen.getByText("Trigger").className).toContain("text-mrd-body");
    // One station glyph per node that names a station: six here.
    const glyphs = [...container.querySelectorAll("svg")].filter(
      (s) => s.getAttribute("width") === "16",
    );
    expect(glyphs.length).toBe(6);
  });
});

describe("a straight run does not make its caller invent a layout", () => {
  it("lays a list into one centred column", () => {
    const { nodes, edges } = flowFromSteps([
      { id: "a", title: "One" },
      { id: "b", title: "Two" },
      { id: "c", title: "Three" },
    ]);
    expect(nodes.map((n) => n.row)).toEqual([0, 1, 2]);
    expect(nodes.every((n) => n.x === 0.5)).toBe(true);
    expect(edges).toEqual([
      { from: "a", to: "b" },
      { from: "b", to: "c" },
    ]);
  });

  it("joins nothing for a single step", () => {
    expect(flowFromSteps([{ id: "a", title: "One" }]).edges).toEqual([]);
  });
});
