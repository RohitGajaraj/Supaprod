/**
 * THE LAST THREE STATIONS WERE PAST THE EDGE ON THE FIRST RUN THAT SHIPPED.
 *
 * 2026-09-04, 1512px: all seven cells in the DOM, the last three at x 1450,
 * 1622 and 1794, overflow visible, no wrap. A person looking at the product's
 * first end-to-end run could not see that it had ended.
 *
 * Guarded at real widths rather than by reading a class string, because the
 * claim is arithmetic -- seven shares of a width cannot exceed it -- and
 * arithmetic can be checked without a browser.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import {
  columnsAt,
  MIN_STOP_PX,
  overflowsAt,
  ROUTE_GRID_TEMPLATE,
  ROUTE_STATIONS,
  rowsAt,
  STOP_GAP_PX,
} from "@/components/meridian/the-route-fits-the-pane";

/** The three A1 named, plus the rail the run screen actually gives the map. */
const WIDE = 1512;
const PANE = 812;
const RAIL = 300;

describe("the route fits, at every width anyone has measured", () => {
  it("nothing overflows at 1512, 812 or 300", () => {
    for (const w of [WIDE, PANE, RAIL]) {
      expect(overflowsAt(w), `${w}px must not overflow`).toBe(false);
    }
  });

  it("nothing overflows at any width from 200 to 2000", () => {
    // The assertion is the shape of the rule, not three lucky numbers.
    for (let w = 200; w <= 2000; w += 4) {
      expect(overflowsAt(w), `${w}px overflowed`).toBe(false);
    }
  });

  it("all seven share one row once there is room for them", () => {
    const needed = ROUTE_STATIONS * MIN_STOP_PX + (ROUTE_STATIONS - 1) * STOP_GAP_PX;
    expect(columnsAt(needed)).toBe(ROUTE_STATIONS);
    expect(rowsAt(needed)).toBe(1);
    expect(rowsAt(WIDE)).toBe(1);
  });

  it("below that it wraps to two rows rather than scrolling or clipping", () => {
    /*
     * The pane's own minimum. `clamp(300px, 38%, 440px)` is the run rail, and a
     * seven-station route has never fitted one -- which is what the fixed-width
     * spine was scrolling to avoid, and what this wraps to avoid instead.
     */
    expect(columnsAt(RAIL)).toBeLessThan(ROUTE_STATIONS);
    expect(rowsAt(RAIL)).toBeGreaterThan(1);
    expect(overflowsAt(RAIL)).toBe(false);
  });

  it("never fewer than one column, however narrow", () => {
    // What a browser does rather than clip: the share goes under its floor and
    // the label truncates. The row still ends where the box ends.
    expect(columnsAt(40)).toBe(1);
    expect(overflowsAt(40)).toBe(false);
  });

  it("the old geometry would have failed this", () => {
    /*
     * Seven fixed 168px cells needed 1176px and took it regardless. Held as a
     * live calculation rather than a memory, so the guard demonstrates the
     * defect instead of asserting that someone once saw it.
     */
    const OLD_STOP = 168;
    const needed = ROUTE_STATIONS * OLD_STOP + (ROUTE_STATIONS - 1) * STOP_GAP_PX;
    expect(needed).toBeGreaterThan(RAIL);
    expect(needed).toBeGreaterThan(PANE);
  });
});

describe("the component uses these numbers and keeps nothing of its own", () => {
  const SRC = readFileSync("src/components/meridian/RunMap.tsx", "utf8")
    /* Comments first: this fix's explanation quotes the geometry it removed. */
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");

  it("no fixed stop width survives", () => {
    expect(SRC).not.toContain("width: 168");
    /*
     * Scoped to the STOP. `shrink-0` is still right, and still present, on the
     * fixed-size children inside a stop -- the glyph, the chevron, the chip --
     * which must keep their size while the row around them shrinks. The first
     * draft of this forbade the class outright and failed on three correct
     * uses, which is a guard asserting a spelling instead of a rule.
     */
    const li = SRC.slice(SRC.indexOf("<li className="), SRC.indexOf("<li className=") + 120);
    expect(li).not.toContain("shrink-0");
    expect(li).toContain("min-w-0");
  });

  it("the spine no longer scrolls sideways", () => {
    expect(SRC).not.toContain("overflow-x-auto");
  });

  it("the grid template comes from the one definition", () => {
    expect(SRC).toContain("gridTemplateColumns: ROUTE_GRID_TEMPLATE");
    expect(ROUTE_GRID_TEMPLATE).toBe(`repeat(auto-fit,minmax(${MIN_STOP_PX}px,1fr))`);
  });

  it("a stop may shrink below its content, so the label truncates first", () => {
    // `min-w-0` is the whole reason a grid track can go under its content's
    // natural width. Without it the row grows and we are back where we started.
    expect(SRC).toContain('className="flex w-full min-w-0 flex-col"');
    expect(SRC).toContain("truncate");
  });
});
