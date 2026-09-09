/**
 * ── LAW 19, CLOSED BY THE ONE CHANNEL NOBODY OWNED ────────────────────────
 *
 * The contract carried `you` and `stopped` as an open pair from 2026-09-09.
 * Measured on the served home, workspace A1 delete probe: Decide with three
 * runs waiting on an answer and Design with two that gave up came back
 * byte-identical, fill `oklch(0.28 0.14 315)`, ink `oklch(0.74 0.11 315)`.
 * Three runs waiting for a person and two that will never move again are the
 * same pixel.
 *
 * Every channel on the NODE has an owner -- the glyph is the station's (law 4),
 * the fill was spent closing `held`/`failed`, the dashed ring is `waived`,
 * label weight says which stop is current -- so the contract asked whoever took
 * it to say which channel was being taken and why.
 *
 * NONE OF THEM. The LINK between stops has carried no state of a station in its
 * life: it has two appearances, travelled or not, which is a fact about the
 * route. And it is the one channel that says what colour cannot, because the
 * difference between these two states is CONTINUATION -- `you` is a gate and
 * the road runs on the moment you press it; `stopped` is a loop that ran out of
 * road. A severed line is that sentence as a drawing.
 *
 * ── WHAT THIS PINS ────────────────────────────────────────────────────────
 * Not the gradient. Three claims: the cut follows the STATE and not the
 * station, it happens at full size and never at row size, and the link's
 * existing job -- saying how far the route has been travelled -- still works
 * underneath it.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SRC = readFileSync(join(import.meta.dir, "Journey.tsx"), "utf8");
const CSS = readFileSync(join(import.meta.dir, "..", "..", "styles", "meridian.css"), "utf8");

/** The `Link` component's body, bounded by the next top-level declaration. */
function linkBody(): string {
  const start = SRC.indexOf("function Link({");
  expect(start, "the Link component moved; re-point this test").toBeGreaterThan(-1);
  const next = SRC.indexOf("\nfunction ", start + 1);
  const body = SRC.slice(start, next === -1 ? SRC.length : next);
  /* THE MIRROR ON THE SLICE. Most assertions here pass by finding a string, but
     a bound that collapsed would fail them all for the wrong reason and a
     bound that ran long would pass them from a neighbour's code. */
  expect(body.length).toBeGreaterThan(500);
  expect(body).toContain("aria-hidden");
  return body;
}

describe("the road is cut where the road ended", () => {
  it("cuts the link leaving a stopped station, and nothing else", () => {
    const body = linkBody();
    expect(body).toContain('from.state === "stopped"');
    /* NOT `to`. The cut belongs to the station the road stopped AT, so it is
       the link leaving it. Cutting on arrival would put the break before the
       stop that owns it, one position early, every time. */
    expect({ cutsOnArrival: body.includes('to.state === "stopped"') }).toEqual({
      cutsOnArrival: false,
    });
  });

  it("cuts at full size only, because a 4px link has no room for a gap", () => {
    // The contract already ruled the row is not the same problem: `YourRuns`
    // draws a control naming the state and a sentence beside it, so the row
    // carries the distinction in structure rather than in a 6px dot.
    expect(linkBody()).toContain('size === "full" && from.state === "stopped"');
  });

  it("keeps the link's own job underneath the cut", () => {
    /*
     * The link says how far the route has been travelled, and that is a fact
     * about the ROUTE rather than any station's state. A cut that threw it
     * away would trade one lost distinction for another.
     */
    const body = linkBody();
    expect(body).toContain("const travelled =");
    expect(body).toContain("reached || travelled");
    /* The cut is drawn in the SAME colour the link would have been, so the two
       facts stack instead of competing. */
    expect(body).toContain("${track} 0 34%");
  });

  it("breaks the line rather than dashing it, because dashes belong to `waived`", () => {
    const body = linkBody();
    expect(body).toContain("transparent 34% 66%");
    /* COMMENTS STRIPPED, LITERALS KEPT. This file's own reasoning in `Link`
       explains why a dash would be wrong, and a guard reading that argues
       itself into failing. What it must read is the code. */
    const code = body.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    expect({ dashed: /dashed/.test(code) }).toEqual({ dashed: false });
  });
});

describe("the axis the cut is drawn on", () => {
  it("is a Meridian token, because the component cannot see the breakpoint", () => {
    // The road is horizontal on a desktop and vertical on a phone -- the same
    // drawing rotated -- and a gradient has to name an axis.
    expect(linkBody()).toContain("var(--mrd-road-axis");
    expect(CSS).toContain("--mrd-road-axis: to right;");
  });

  it("turns down the screen where the road does", () => {
    /*
     * THE ASSERTION THAT WOULD HAVE CAUGHT THE OBVIOUS BUG. Without the phone
     * rule the fallback runs the gradient across a 1px-wide element, where a
     * 32% gap is a third of a pixel and the cut is invisible on exactly the
     * viewport that has least room to say it in words.
     */
    const at = CSS.indexOf("--mrd-road-axis: to bottom;");
    expect(at, "the phone axis is missing; the cut cannot draw on a phone").toBeGreaterThan(-1);
    const rule = CSS.slice(CSS.lastIndexOf("@media", at), at);
    expect(rule).toContain("max-width: 639.98px");
  });
});
