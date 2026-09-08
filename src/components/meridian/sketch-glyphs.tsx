import * as React from "react";

/**
 * ── HAND-DRAWN GLYPHS ─────────────────────────────────────────────────────
 *
 * Added to Meridian 2026-09-01. FOUNDER: *"can we add something like
 * handwritten glyphs so that it feels like a real human feeling or human
 * attention to detail ... take reference from Notion or Anthropic ... it would
 * be in brand colors so that it would be differentiated ... make that unique
 * USP touch point and make them feel a little extra special."*
 *
 * ── WHAT MAKES A LINE READ AS DRAWN, WHICH IS NOT "ADD WOBBLE" ────────────
 * A geometric icon and a sketch differ in four specific ways, and getting three
 * of them right and one wrong produces something that reads as a broken icon
 * rather than a drawing. All four are applied here:
 *
 *   1. NO PERFECT PRIMITIVES. There is not one `<circle>` or `<rect>` in this
 *      file. Every closed shape is a cubic path whose control points do not
 *      mirror, so no two quadrants share a curve. A `<circle>` with a filter
 *      over it still reads as a circle.
 *
 *   2. THE STROKE ENDS PAST THE CORNER. A hand does not stop exactly on the
 *      junction; it overshoots by a hair or stops a hair short. The open gaps
 *      here are deliberate and are the single strongest cue.
 *
 *   3. THE LINE IS NOT ONE WEIGHT. `stroke-linecap: round` plus a stroke width
 *      that is not a whole number (1.7) keeps the rasteriser from snapping the
 *      line to the pixel grid, which is what makes a 1px or 2px stroke read as
 *      machine-ruled at small sizes.
 *
 *   4. IT IS NOT AXIS-ALIGNED. Every glyph sits a degree or two off true. A
 *      drawing squared to the pixel grid looks like an icon that failed.
 *
 * ── WHY THEY ARE `aria-hidden` WITHOUT EXCEPTION ──────────────────────────
 * A sketch is a recognition aid beside a real label, never the label. A glyph
 * carrying a fact a sighted reader gets and a screen reader does not is an
 * accessibility defect wearing a design one's clothes. Every call site here
 * has the words next to it.
 *
 * ── COLOUR: INK BY DEFAULT, AND THE FOUNDER WAS RIGHT TO ASK ─────────────
 * These shipped in the mark's ember for about twenty minutes. FOUNDER: *"I
 * don't know if you should be using the ember color because now everything is
 * on orchid or the purple shade right now."*
 *
 * He is describing a real count. On the home screen at that moment the station
 * strip carried ORCHID notes ("89+ runs waiting on you"), the character mark
 * was AZURE, and four warm orange drawings made a THIRD hue -- on a system
 * whose founding rule is that hue means something. Orchid means a person is
 * required and azure means a machine is working; an orange that means "this is
 * a drawing" is a colour carrying no status, sitting between two that do.
 *
 * So `quiet` is the default and it inherits `currentColor`, which is the mark's
 * own muted ink. The drawing reads as craft rather than as a signal, and the
 * two hues that mean something keep the screen to themselves.
 *
 * `tone="brand"` stays for a surface with no status colour on it at all -- an
 * empty state, a sign-in, a full-page moment -- where the sketch IS the only
 * thing on screen and a warm line is the whole point. `--mrd-sketch`'s own
 * scope note in `meridian.css` still governs: stroke only, never a fill, never
 * a control, never a status.
 */

const HAND = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Sketch({
  size = 20,
  tone = "quiet",
  spin = 0,
  children,
}: {
  size?: number;
  /** `quiet` inherits the surrounding ink (the default). `brand` is the sketch
   *  ink, for a surface carrying no status colour of its own. */
  tone?: "brand" | "quiet";
  /** Degrees off true. Small, and never the same for two glyphs in a row. */
  spin?: number;
  children: React.ReactNode;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={{
        color: tone === "brand" ? "var(--mrd-sketch)" : undefined,
        transform: spin ? `rotate(${spin}deg)` : undefined,
        overflow: "visible",
      }}
      {...HAND}
    >
      {children}
    </svg>
  );
}

/**
 * ── THE FOUR DRAWINGS ─────────────────────────────────────────────────────
 *
 * REDRAWN 2026-09-01, LOOSER. FOUNDER: *"the pattern whatever you used for the
 * illustration is not perfect -- it need not to be perfect, it can be little
 * abstract, it can be little out of the box thinking. See how Notion's and
 * Anthropic's illustrations look."*
 *
 * The first pass was a tidy icon with a wobble applied to it, which is the
 * commonest way to get this wrong: the SHAPE was still an icon's shape, so the
 * wobble read as a rendering fault rather than as a hand. What those references
 * actually do is different in kind, and three things carry it:
 *
 *   THE SHAPE IS A GESTURE, NOT A DIAGRAM. Their marks suggest the idea and
 *   decline to describe it. A page is three strokes, not a rectangle with a
 *   folded corner and ruled lines. Less information, more character.
 *
 *   THE LINE OVERSHOOTS AND DOUBLES BACK. A drawn stroke passes its junction
 *   and sometimes goes over itself. That is the single most recognisable thing
 *   about hand-drawn line art and no amount of jitter substitutes for it.
 *
 *   THERE IS ONE LOOSE MARK THAT CARRIES NO INFORMATION. A tick, a stray dot,
 *   a short second stroke beside the first. It is what stops the drawing
 *   looking like it was solved and makes it look like it was made.
 *
 * All four are drawn on one visual weight so the row reads as one hand.
 */

/** A PROBLEM WITH NO ANSWER YET. An open coil and a mark that asks -- not a
 *  question mark in a circle, which is a help icon and means something else. */
export function SketchProblem(props: { size?: number; tone?: "brand" | "quiet" }) {
  return (
    <Sketch {...props} spin={-3}>
      <path d="M7.4 8.6c.6-3 3.4-5.2 6.4-4.9 3.3.3 5.6 3.4 4.9 6.6-.5 2.3-2.4 3.2-3.7 4.3-1 .9-1.4 1.9-1.3 3.2" />
      <path d="M13.4 21.1c.4-.2.5-.5.2-.8" />
      <path d="M4.4 14.2c1.1.7 2.3 1.2 3.6 1.4" />
    </Sketch>
  );
}

/** SOMETHING PEOPLE LOOK AT. A frame sketched in one pass that overshoots its
 *  own corner, with a stand under it and a stray mark inside where the change
 *  lands. */
export function SketchScreen(props: { size?: number; tone?: "brand" | "quiet" }) {
  return (
    <Sketch {...props} spin={-1.5}>
      <path d="M3.4 5.6c5.8-.6 11.6-.6 17.4-.1.5 3.7.5 7.4.1 11.1-5.8.5-11.7.5-17.5.1-.4-3.6-.4-7.3 0-10.9Z" />
      <path d="M8.7 21.4c2.2-.4 4.5-.4 6.7-.1" />
      <path d="M11.9 16.9c0 1.4 0 2.9-.2 4.3" />
      <path d="M7.4 9.4c1.9-.3 3.9-.3 5.8-.1" />
    </Sketch>
  );
}

/** BROKEN, NOW. A crack rather than a lightning bolt: two strokes that pass
 *  each other instead of meeting, plus one short splinter. */
export function SketchBroken(props: { size?: number; tone?: "brand" | "quiet" }) {
  return (
    <Sketch {...props} spin={3}>
      <path d="M14.6 2.4c-2.8 3.3-5.4 6.8-7.8 10.4 1.9.3 3.8.4 5.7.3" />
      <path d="M11.6 12.6c-.7 2.9-1.3 5.9-1.7 8.9 3-3.5 5.8-7.2 8.3-11.1-1.8-.3-3.7-.4-5.6-.4" />
      <path d="M17.9 15.4c.9.6 1.7 1.3 2.4 2.1" />
    </Sketch>
  );
}
