/**
 * `Pre`, `Grid` AND `Cell`: THE THREE THINGS A PAINT-ONLY PORT WOULD HAVE LOST.
 *
 * All three had half their contract in `src/styles/primitives.css` rather than in
 * the component, so a port read off the `.tsx` alone would have produced three
 * parts that render and do none of what they were for. This file pins the half
 * that was in the sheet:
 *
 *   the grid's COLUMN MEASURE, which was a custom property precisely so a caller
 *       could change it, and which two live callers do change
 *   the cell's TONE-COUPLED HOVER, whose whole reason for existing is that the
 *       tint and the hover can never disagree
 *   the box's OVERFLOW, and specifically its HEIGHT cap, which the retired sheet
 *       did not have and which is the defect `CodeBlock` was built to fix
 *
 * ── WHAT THIS CAN AND CANNOT ASSERT, SAID PLAINLY ───────────────────────
 * happy-dom carries no stylesheet, so `getComputedStyle` cannot answer what a
 * Tailwind utility paints. Reading a class name is therefore the honest limit,
 * and this file follows the precedent `Value` set in `surface-parts.tsx`: the
 * component DECLARES its state in a data attribute and the class only paints it,
 * so the assertions read the declaration and check that the paint is present and
 * COUPLED. The colours themselves are checked by looking at the gallery in both
 * grounds, which is what that route exists for.
 */
import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";

import { Cell, Grid, Pre, Value } from "../surface-parts";

describe("Pre: preformatted output nobody wrote for a reader", () => {
  it("prints what it is given, verbatim", () => {
    const log = 'error: could not choose a best candidate function for "match_memory"';
    const { container } = render(<Pre>{log}</Pre>);
    expect(container.querySelector("pre")?.textContent).toBe(log);
  });

  it("caps its own height, which the retired sheet did not", () => {
    /*
     * `.sp-pre` set `overflow-x: auto` and nothing else, so a 400-line log grew
     * the page to whatever the machine happened to write. That is the exact
     * defect found live at `traces.$traceId`, under a comment claiming the box
     * clipped and scrolled. The cap is the whole reason this is a component and
     * not a bare tag.
     */
    const { container } = render(<Pre>{"line\n".repeat(400)}</Pre>);
    const box = container.querySelector("pre")!;
    expect(box.style.maxHeight).toBe("320px");
    expect(box.className, "a capped box that does not scroll is a clipped box").toContain(
      "overflow-auto",
    );
  });

  it("lets a caller move the cap without reaching past the component", () => {
    const { container } = render(<Pre maxHeight={120}>short</Pre>);
    expect(container.querySelector("pre")?.style.maxHeight).toBe("120px");
  });

  it("is reachable by a keyboard, because it scrolls", () => {
    /* A region a mouse can scroll and a keyboard cannot is unreachable. */
    const { container } = render(<Pre>{"a\nb\nc"}</Pre>);
    expect(container.querySelector("pre")?.tabIndex).toBe(0);
  });

  it("carries data-mrd, which is the only thing that gives it a focus ring", () => {
    const { container } = render(<Pre>x</Pre>);
    expect(container.querySelector("pre")?.hasAttribute("data-mrd")).toBe(true);
  });

  it("does not wear the inset focus class, and that is deliberate", () => {
    /*
     * `CodeBlock`'s scroller does, because it sits flush inside a rounded card
     * that clips it and an outset ring there comes back sheared in half. This box
     * IS the outer element. The inset rule also only matches a DESCENDANT of a
     * `data-mrd` root, so on the root itself it would paint nothing and read as
     * though it did.
     */
    const { container } = render(<Pre>x</Pre>);
    expect(container.querySelector("pre")?.className).not.toContain("mrd-focus-inset");
  });

  it("sets no outer margin, so the space above it belongs to the composition", () => {
    /* `.sp-pre` baked in a `margin-top`, so the box decided the space above
       itself and a caller who wanted it elsewhere could not say so. Same call as
       `Actions`. */
    const { container } = render(<Pre>x</Pre>);
    const paint = container.querySelector("pre")?.className ?? "";
    expect(paint).not.toMatch(/\bmt-/);
    expect(paint).not.toMatch(/\bmy-/);
  });

  it("takes a toned child, so a failure printed verbatim keeps its voice", () => {
    /* `AnalyticsPanel` prints a failure inside this box. If the tone could not
       pass through, the one thing that call site is for would be lost, which is
       the fourth reason `CodeBlock` was refused here. */
    render(
      <Pre>
        <Value tone="fail">the checks came back red twice</Value>
      </Pre>,
    );
    expect(screen.getByText("the checks came back red twice").getAttribute("data-tone")).toBe(
      "fail",
    );
  });
});

describe("Grid: a catalog is scanned across", () => {
  it("lays out on the retired sheet's own column measure by default", () => {
    const { container } = render(
      <Grid>
        <Cell lead="Linear" />
      </Grid>,
    );
    expect(container.firstElementChild).toHaveProperty("style.gridTemplateColumns");
    expect((container.firstElementChild as HTMLElement).style.gridTemplateColumns).toBe(
      "repeat(auto-fill, minmax(196px, 1fr))",
    );
  });

  it("lets a caller narrow the measure, which is why it was a knob at all", () => {
    /* `EvalScoreChips` sets 132px: a score is four characters, and the 196px
       default leaves half of every cell empty. */
    const { container } = render(
      <Grid cellMin={132}>
        <Cell lead="0.82" />
      </Grid>,
    );
    expect((container.firstElementChild as HTMLElement).style.gridTemplateColumns).toBe(
      "repeat(auto-fill, minmax(132px, 1fr))",
    );
  });

  it("takes a fixed column count, which the retired grid could not say", () => {
    /* `DetailKit` wanted equal columns and had to re-declare
       `gridTemplateColumns` inline over the class, which is exactly the drift the
       custom property existed to prevent. */
    const { container } = render(
      <Grid columns={3}>
        <Cell lead="one" />
      </Grid>,
    );
    expect((container.firstElementChild as HTMLElement).style.gridTemplateColumns).toBe(
      "repeat(3, minmax(0, 1fr))",
    );
  });

  it("lets the fixed count win when both are passed", () => {
    const { container } = render(
      <Grid columns={2} cellMin={132}>
        <Cell lead="one" />
      </Grid>,
    );
    expect((container.firstElementChild as HTMLElement).style.gridTemplateColumns).toBe(
      "repeat(2, minmax(0, 1fr))",
    );
  });

  it("carries data-mrd", () => {
    const { container } = render(
      <Grid>
        <Cell lead="one" />
      </Grid>,
    );
    expect(container.firstElementChild?.hasAttribute("data-mrd")).toBe(true);
  });
});

describe("Cell is a real button when it does something, and a div when it does not", () => {
  it("renders a button, typed, when it has somewhere to go", () => {
    render(<Cell lead="Linear" sub="Read issues and cycles" onClick={() => {}} />);
    const control = screen.getByRole("button", { name: /Linear/ });
    expect(control.tagName).toBe("BUTTON");
    expect(control.getAttribute("type"), "an untyped button in a form submits it").toBe("button");
  });

  it("renders no button at all when nothing happens on click", () => {
    /* An affordance is a promise. A cell that does nothing must not be tabbable
       and must not light up under the cursor. */
    const { container } = render(<Cell lead="0.82" sub="helpfulness" />);
    expect(container.querySelector("button")).toBeNull();
    expect(container.firstElementChild?.tagName).toBe("DIV");
  });

  it("aligns its text to the leading edge, which a button does not do by default", () => {
    /* A `<button>` centres its label. A two-line cell whose lead and sub start on
       different pixels is the most visible tell in the set. */
    render(<Cell lead="Linear" sub="Read issues and cycles" onClick={() => {}} />);
    expect(screen.getByRole("button", { name: /Linear/ }).className).toContain("text-left");
  });

  it("carries data-mrd on both branches, or the clickable one loses its ring", () => {
    const clickable = render(<Cell lead="a" onClick={() => {}} />);
    expect(clickable.container.firstElementChild?.hasAttribute("data-mrd")).toBe(true);
    clickable.unmount();

    const inert = render(<Cell lead="a" />);
    expect(inert.container.firstElementChild?.hasAttribute("data-mrd")).toBe(true);
  });

  it("truncates both lines unconditionally, with no prop to turn it off", () => {
    /* Founder ruling: one or two lines, and depth is a click away. A row can opt
       out through `tight` because a detail view sometimes should wrap. A cell in a
       grid never should: it would take its whole row of the grid with it. */
    render(
      <Cell
        lead="A ninety character label that a real connector catalog will absolutely hand this cell one day"
        sub="And a second fact underneath it that is also far too long to sit on one line"
      />,
    );
    for (const text of [/A ninety character label/, /And a second fact/]) {
      expect(screen.getByText(text).className).toContain("truncate");
    }
  });
});

describe("tone drives the hover, which is the entire reason tone exists", () => {
  it("declares the tone in the markup rather than only in the paint", () => {
    /* The rule `Value` set in this file: a component that encodes its meaning
       ONLY in a colour class has put the meaning back in the paint, where no
       guard can read it without rendering. */
    const raised = render(<Cell lead="a" />);
    expect(raised.container.firstElementChild?.getAttribute("data-tone")).toBe("raised");
    raised.unmount();

    const recessed = render(<Cell lead="a" tone="recessed" />);
    expect(recessed.container.firstElementChild?.getAttribute("data-tone")).toBe("recessed");
  });

  it("moves the ground and its hover together, so the two can never disagree", () => {
    /*
     * The defect this replaces, reported by a lane on the retired component: an
     * inline background silently outranks a class hover, so their cells faked
     * hover with `onMouseEnter` state and lost the focus state with it. Both
     * halves come out of one table here, so changing the tint changes the hover
     * with it.
     */
    const raised = render(<Cell lead="a" onClick={() => {}} />);
    const raisedPaint = screen.getByRole("button").className;
    expect(raisedPaint).toContain("bg-mrd-lift");
    expect(raisedPaint).toContain("hover:bg-mrd-lift-hover");
    raised.unmount();

    const recessed = render(<Cell lead="a" tone="recessed" onClick={() => {}} />);
    const recessedPaint = screen.getByRole("button").className;
    expect(recessedPaint).toContain("bg-mrd-sink");
    expect(recessedPaint).toContain("hover:bg-mrd-lift");
    expect(
      recessedPaint,
      "a recessed cell kept the raised ground's hover, so the pair had come apart",
    ).not.toContain("hover:bg-mrd-lift-hover");
  });

  it("gates the hover on `enabled:`, so a dead cell never promises anything", () => {
    render(<Cell lead="a" onClick={() => {}} />);
    expect(screen.getByRole("button").className).toContain("enabled:hover:");
  });

  it("spends no status hue on either tone, so tone is not a sixth status word", () => {
    /* Meridian has five status words. `raised` and `recessed` name a place on the
       SURFACE ladder, and anything a cell reports about an outcome goes in its
       `sub` as a `Value`. */
    for (const tone of ["raised", "recessed"] as const) {
      const { container, unmount } = render(<Cell lead="a" tone={tone} onClick={() => {}} />);
      const paint = container.firstElementChild?.getAttribute("class") ?? "";
      for (const word of ["you", "agent", "pass", "fail", "hold", "stop"]) {
        expect(paint, `tone="${tone}" wore --mrd-${word}`).not.toContain(`mrd-${word}`);
      }
      unmount();
    }
  });
});

describe("the states a cell can be in", () => {
  it("announces a picked cell as a toggle, and only when it is one of a set", () => {
    const picked = render(<Cell lead="a" onClick={() => {}} selected />);
    const control = screen.getByRole("button");
    expect(control.getAttribute("aria-pressed")).toBe("true");
    expect(control.getAttribute("data-selected")).toBe("true");
    picked.unmount();

    /* A cell that OPENS or CONNECTS something is not a toggle, so it must not
       claim to be one. */
    render(<Cell lead="a" onClick={() => {}} />);
    expect(screen.getByRole("button").hasAttribute("aria-pressed")).toBe(false);
  });

  it("draws the selection as a ring overlay rather than a shadow or a border", () => {
    /*
     * Two ports of one mechanic. An inset `box-shadow` is the obvious drawing and
     * is quietly broken here: the app-wide focus rule is UNLAYERED and sets
     * `box-shadow: none`, and Meridian's own focus rule sets it too, so the ring
     * would vanish at the moment a keyboard reader arrived on the cell that has
     * it. A real border would move every cell in the grid by a pixel.
     */
    render(<Cell lead="a" onClick={() => {}} selected />);
    const paint = screen.getByRole("button").className;
    expect(paint).toContain("before:border-mrd-ink");
    expect(paint).toContain("before:inset-0");
    expect(paint, "the overlay must not eat the click it sits on top of").toContain(
      "before:pointer-events-none",
    );
    expect(paint).not.toMatch(/shadow-\[inset/);
  });

  it("draws no ring when nothing is picked", () => {
    render(<Cell lead="a" onClick={() => {}} />);
    expect(screen.getByRole("button").className).not.toContain("before:border-mrd-ink");
  });

  it("really disables a disabled button, rather than dimming it and taking the click", () => {
    let clicks = 0;
    render(<Cell lead="a" disabled onClick={() => clicks++} />);
    const control = screen.getByRole("button") as HTMLButtonElement;
    expect(control.disabled).toBe(true);
    control.click();
    expect(clicks).toBe(0);
  });

  it("says a non-interactive cell is unavailable, since there is no disabled state to read", () => {
    /* `AccountConnectionsSection` renders exactly this: a connector nobody can
       set up yet dims and carries no click. `disabled` is not a DOM state on a
       div, so the fact has to be stated. */
    const { container } = render(<Cell lead="Amplitude" sub="Waiting on an admin" disabled />);
    const box = container.firstElementChild!;
    expect(box.getAttribute("aria-disabled")).toBe("true");
    expect(box.getAttribute("data-disabled")).toBe("true");
    expect(box.className).toContain("opacity-45");
  });

  it("keeps a disabled cell pointer-reachable so its title can say what would unlock it", () => {
    render(<Cell lead="Amplitude" disabled title="An admin has to connect this first" />);
    expect(screen.getByTitle("An admin has to connect this first")).toBeTruthy();
  });
});

describe("a cell and a row are one rhythm, because they are one information model", () => {
  it("puts the lead and the sub on the same two stops a Row uses", () => {
    /*
     * A grid of cells and a list of rows are two arrangements of a mark, a lead
     * and a different fact underneath, and they shipped at two type scales with
     * no argument anywhere for either. `rows.tsx` sets 14px ink over 13px mute at
     * `leading-[1.4]`; this reads the same figures off the cell so the two cannot
     * drift apart again silently.
     */
    render(<Cell lead="Linear" sub="Read issues and cycles" />);
    const lead = screen.getByText("Linear").className;
    expect(lead).toContain("text-[14px]");
    expect(lead).toContain("leading-[1.4]");
    expect(lead).toContain("text-mrd-ink");

    const sub = screen.getByText("Read issues and cycles").className;
    expect(sub).toContain("text-[13px]");
    expect(sub).toContain("leading-[1.4]");
    expect(sub).toContain("text-mrd-mute");
  });

  it("stands on the same 44px floor whether or not it has a door", () => {
    /* `min-h-11` is two rulings at once: a row carrying a decision earns the
       height, and 44px is the smallest square a finger reliably hits. A cell must
       not resize when it gains a click. */
    const inert = render(<Cell lead="a" />);
    expect(inert.container.firstElementChild?.className).toContain("min-h-11");
    inert.unmount();

    render(<Cell lead="a" onClick={() => {}} />);
    expect(screen.getByRole("button").className).toContain("min-h-11");
  });

  it("holds the mark against a long lead instead of letting flex squeeze it", () => {
    /* One of the sizes nobody draws: a 90-character label beside an 18px mark. */
    const { container } = render(
      <Cell
        mark={<span data-testid="mark">L</span>}
        lead="A ninety character label that a real connector catalog will absolutely hand this cell"
      />,
    );
    expect(container.querySelector("[data-testid='mark']")?.parentElement?.className).toContain(
      "shrink-0",
    );
  });

  it("draws no mark slot at all for a thing nobody acts as", () => {
    /* A fixed slot is right for a Row, where text has to start on one line down a
       list. In a 196px tile it would spend a tenth of the width on nothing. */
    const { container } = render(<Cell lead="0.82" sub="helpfulness" />);
    expect(container.firstElementChild?.children.length).toBe(1);
  });
});
