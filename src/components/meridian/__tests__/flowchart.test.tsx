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
import { readFileSync } from "node:fs";
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
    {
      id: "rank",
      row: 1,
      x: 0.5,
      station: "decide",
      kind: "If / Else",
      title: "Is it worth a bet?",
    },
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
    const long =
      "Rewrote the firmware reboot notice so a homeowner can tell a restart from an outage";
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
    const { container } = render(<Flowchart {...BRANCH} selectedId="rank" onSelect={() => {}} />);
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

/**
 * ── DRAGGING, ADDED FOR K-85 ─────────────────────────────────────────────
 *
 * Every figure below is derived from the same two fallbacks the rest of this file
 * uses, so the arithmetic is checkable rather than measured. With CW 480 and a
 * 300px node at x 0.5, a card's home is cx 240; five rows of 92 at PAD_Y 24 and
 * ROW_GAP 64 put the canvas at 764 tall. The clamps therefore sit at cx 158 and
 * 322 (half a card plus the 8px inset) and top 8 and 664.
 *
 * WHAT happy-dom CANNOT DO, and how each test works around it: there is no
 * pointer capture and no hit testing, so `setPointerCapture` is called
 * optionally in the component and the events are dispatched straight at the
 * wrapper. That is exactly what a captured pointer does in a browser, which is
 * why the substitution is honest rather than convenient.
 */
const CANVAS_H = 764;
const HOME_CX = 240;
const HOME_TOP = PAD_Y;

/** The element carrying the drag handlers: the node's absolute wrapper. */
function card(title: string): HTMLElement {
  const el = screen.getByText(title).closest('[class*="cursor-grab"]');
  if (!el) throw new Error(`no draggable wrapper around "${title}"`);
  return el as HTMLElement;
}

const at = (el: HTMLElement) => ({ left: el.style.left, top: el.style.top, z: el.style.zIndex });

/** One whole gesture: press, travel, release. */
function dragBy(el: HTMLElement, dx: number, dy: number) {
  fireEvent.pointerDown(el, { pointerId: 1, clientX: 100, clientY: 100 });
  fireEvent.pointerMove(el, { pointerId: 1, clientX: 100 + dx, clientY: 100 + dy });
  fireEvent.pointerUp(el, { pointerId: 1, clientX: 100 + dx, clientY: 100 + dy });
}

describe("a reader can untangle the graph, and the connectors keep up", () => {
  it("moves the card it was given and leaves every other one alone", () => {
    render(<Flowchart {...BRANCH} />);
    const moved = card("A firmware complaint arrives");
    const untouched = card("Is it worth a bet?");
    dragBy(moved, 50, 30);
    expect(at(moved).left).toBe(`${HOME_CX + 50}px`);
    expect(at(moved).top).toBe(`${HOME_TOP + 30}px`);
    // The second row's home, unchanged: 24 + 92 + 64.
    expect(at(untouched).top).toBe(`${PAD_Y + EST_H + ROW_GAP}px`);
    expect(at(untouched).left).toBe(`${HOME_CX}px`);
  });

  it("re-routes the connector onto the card's new anchor", () => {
    // THE POINT OF THE WHOLE ITEM. A graph whose edges detach on the first move
    // is worse than one that cannot move at all.
    const { container } = render(<Flowchart {...BRANCH} />);
    const before = paths(container)[0];
    expect(before.startsWith(`M ${HOME_CX} ${HOME_TOP + EST_H}`)).toBe(true);
    dragBy(card("A firmware complaint arrives"), 50, 30);
    const after = paths(container)[0];
    // The bottom anchor is the card's top plus its measured height, so both
    // numbers move with it.
    expect(after.startsWith(`M ${HOME_CX + 50} ${HOME_TOP + 30 + EST_H}`)).toBe(true);
    expect(after).not.toBe(before);
  });

  it("keeps the incoming connector on the pill offset when the target moves", () => {
    // `rank` carries a kind, so its top anchor is PILL_OFFSET below its edge.
    // Dragging it must carry that offset along or the curve lands beside the pill.
    const { container } = render(<Flowchart {...BRANCH} />);
    dragBy(card("Is it worth a bet?"), 0, 40);
    const arriving = paths(container)[0];
    const y = PAD_Y + EST_H + ROW_GAP + 40 + PILL_OFFSET;
    expect(arriving.endsWith(`${HOME_CX} ${y}`)).toBe(true);
  });

  it("continues a second drag from where the first one stopped", () => {
    render(<Flowchart {...BRANCH} />);
    const el = card("A firmware complaint arrives");
    dragBy(el, 40, 20);
    dragBy(el, 20, 10);
    expect(at(el).left).toBe(`${HOME_CX + 60}px`);
    expect(at(el).top).toBe(`${HOME_TOP + 30}px`);
  });

  it("will not let a card leave the canvas in any direction", () => {
    render(<Flowchart {...BRANCH} />);
    const up = card("A firmware complaint arrives");
    dragBy(up, -1000, -1000);
    // Half a 300px card plus the 8px inset; and the inset alone, vertically.
    expect(at(up).left).toBe("158px");
    expect(at(up).top).toBe("8px");

    render(<Flowchart {...BRANCH} />);
    const down = screen
      .getAllByText("A firmware complaint arrives")[1]
      .closest('[class*="cursor-grab"]') as HTMLElement;
    dragBy(down, 1000, 1000);
    expect(at(down).left).toBe("322px");
    expect(at(down).top).toBe(`${CANVAS_H - EST_H - 8}px`);
  });
});

describe("a drag is not a click, and a click is not a drag", () => {
  it("still selects when the pointer barely moved", () => {
    // Two pixels is a hand on a mouse button, not a gesture. The card must not
    // shift and the press must still land.
    let picked: string | null = "untouched";
    render(<Flowchart {...BRANCH} selectedId={null} onSelect={(id) => (picked = id)} />);
    const el = card("Is it worth a bet?");
    dragBy(el, 2, 1);
    fireEvent.click(screen.getByRole("button", { name: /Is it worth a bet/ }));
    expect(picked).toBe("rank");
    expect(at(el).top).toBe(`${PAD_Y + EST_H + ROW_GAP}px`);
  });

  it("does not select at the end of a real drag", () => {
    let picked: string | null = "untouched";
    render(<Flowchart {...BRANCH} selectedId={null} onSelect={(id) => (picked = id)} />);
    dragBy(card("Is it worth a bet?"), 60, 0);
    fireEvent.click(screen.getByRole("button", { name: /Is it worth a bet/ }));
    expect(picked).toBe("untouched");
  });

  it("selects again on the press after a drag", () => {
    // The suppression lasts one tick, not forever. A card you have moved must
    // still be openable.
    let picked: string | null = null;
    render(<Flowchart {...BRANCH} selectedId={null} onSelect={(id) => (picked = id)} />);
    const el = card("Is it worth a bet?");
    dragBy(el, 60, 0);
    fireEvent.click(screen.getByRole("button", { name: /Is it worth a bet/ }));
    expect(picked).toBe(null);
    return new Promise<void>((done) => {
      setTimeout(() => {
        fireEvent.click(screen.getByRole("button", { name: /Is it worth a bet/ }));
        expect(picked).toBe("rank");
        done();
      }, 0);
    });
  });
});

describe("the drag says what it is doing, and stops when it is told to", () => {
  it("raises the card it is carrying above its neighbours", () => {
    render(<Flowchart {...BRANCH} />);
    const el = card("A firmware complaint arrives");
    expect(at(el).z).toBe("1");
    fireEvent.pointerDown(el, { pointerId: 1, clientX: 100, clientY: 100 });
    expect(at(el).z).toBe("2");
    expect(el.className).toContain("cursor-grabbing");
    fireEvent.pointerUp(el, { pointerId: 1, clientX: 100, clientY: 100 });
    expect(at(el).z).toBe("1");
    expect(el.className).toContain("cursor-grab");
  });

  it("lets go when the browser takes the pointer away", () => {
    // A system swipe or a lost capture ends the gesture. Without this the card
    // keeps the grabbing cursor and its raised stacking until the next press.
    render(<Flowchart {...BRANCH} />);
    const el = card("A firmware complaint arrives");
    fireEvent.pointerDown(el, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerCancel(el, { pointerId: 1 });
    expect(at(el).z).toBe("1");
    expect(el.className).not.toContain("cursor-grabbing");
  });

  it("never animates its position, so reduced motion has nothing to suppress", () => {
    // `meridian.css`'s reduced-motion block stills keyframe ANIMATIONS and does
    // not touch transitions, so a transition on left or top would have run for
    // everyone. A dragged card must sit under the pointer, not ease toward it.
    render(<Flowchart {...BRANCH} />);
    const el = card("A firmware complaint arrives");
    expect(el.className).not.toMatch(/transition-(all|\[?(left|top)])/);
    expect(el.getAttribute("style") ?? "").not.toContain("transition");
  });

  it("takes a finger rather than the page underneath it", () => {
    render(<Flowchart {...BRANCH} />);
    expect(card("A firmware complaint arrives").className).toContain("touch-none");
  });
});

describe("the canvas ground carries a colour, and it is not a status", () => {
  const CSS = readFileSync("src/styles/meridian.css", "utf8");
  const oklch = (token: string) =>
    [
      ...CSS.matchAll(
        new RegExp(`--mrd-${token}:\\s*oklch\\(([\\d.]+) ([\\d.]+) ([\\d.]+)\\)`, "g"),
      ),
    ].map((m) => ({ L: Number(m[1]), C: Number(m[2]), H: Number(m[3]) }));

  it("paints the canvas with the map token rather than the neutral recess", () => {
    const { container } = render(<Flowchart {...BRANCH} />);
    expect((container.firstElementChild as HTMLElement).className).toContain("bg-mrd-map");
  });

  it("plates an edge label in the same colour as the ground it sits on", () => {
    // These were one colour until the ground took its cast. A plate one step off
    // its ground reads as a grey halo around the word.
    const { container } = render(<Flowchart {...BRANCH} />);
    const label = [...container.querySelectorAll("text")].find((t) => t.textContent === "yes");
    expect(label?.getAttribute("stroke")).toBe("var(--mrd-map)");
  });

  it("is declared in both grounds", () => {
    expect(oklch("map").length).toBe(2);
  });

  it("sits at its own ground's recess lightness, so the dots cannot lose contrast", () => {
    // THE SAFETY, ASSERTED RATHER THAN DESCRIBED. The dot pattern is a
    // semi-transparent neutral over this ground, so its contrast is a function of
    // lightness alone. Equal lightness means the wash is free.
    const map = oklch("map");
    const sink = oklch("sink");
    expect(sink.length).toBe(2);
    map.forEach((m, i) => expect(m.L).toBe(sink[i].L));
  });

  it("is violet in both grounds, at the hue the reference measured", () => {
    // #9a5cff, the reference's own node-kind purple, is oklch(0.627 0.230 297).
    for (const m of oklch("map")) expect(m.H).toBe(297);
  });

  it("carries far too little chroma to be read as a status", () => {
    // Every status token runs 0.105 to 0.195, always as a saturated mark on a
    // neutral field. Measured, this ground is a quarter of the weakest on dark
    // and a fifteenth of it on paper. Dark is the near case on purpose: a dark
    // ground needs about four times the chroma to carry the same faint cast.
    const weakest = Math.min(
      ...["you", "agent", "pass", "fail", "hold", "stop"].flatMap((t) => oklch(t).map((v) => v.C)),
    );
    expect(weakest).toBe(0.105);
    for (const m of oklch("map")) {
      expect(weakest / m.C).toBeGreaterThan(3.5);
    }
  });

  it("holds the two chromas that were matched by eye, at their measured ratio", () => {
    // PINNED BECAUSE THE ARITHMETIC GOT THIS WRONG ONCE. Solving for an equal
    // OKLab step from each ground's neutral gave 0.018 and 0.012, and rendered
    // side by side that was a near-invisible tint beside a lavender panel:
    // one idea expressed two ways. These are the corrected pair, and the ratio
    // is the perceptual fact behind them rather than a preference.
    const [dark, paper] = oklch("map");
    expect(dark.C).toBe(0.026);
    expect(paper.C).toBe(0.007);
    expect(+(dark.C / paper.C).toFixed(1)).toBe(3.7);
  });

  it("is not the orchid, and the test can tell the difference", () => {
    const you = oklch("you");
    expect(you.length).toBeGreaterThan(0);
    for (const v of you) expect(v.H).toBe(315);
    for (const m of oklch("map")) expect(m.H).not.toBe(315);
  });
});
