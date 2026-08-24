import type { ReactNode } from "react";

/*
 * THE KINDS OF WORK ON A SURFACE, AS MARKS.
 *
 * ── WHY THIS FILE EXISTS (REQ-016 item 3, ruled 2026-08-24) ─────────────
 * Today's phase two draws a prioritised feed whose rows each state a verb --
 * review a call, reply to something blocked on you, stop a live run, open a
 * finished one -- plus a glance strip of tiles. LANE 1 asked for real icons and
 * then did the right thing with the absence: it shipped GLYPH-FREE rather than
 * inventing page-local SVGs, and filed for the set instead.
 *
 * That instinct is the whole reason this is a system file. `station-glyphs.tsx`
 * records what happens otherwise: the seven station marks were declared twice,
 * character for character, in `crew/CrewChrome.tsx` and `shell/AppFrame.tsx`,
 * each under a comment claiming to be "the one place the two meet". Both were
 * right about the principle and wrong about being the place. **The cost is never
 * the duplicate, it is that copies drift and then a run is a spinner on one
 * surface and a triangle on another.**
 *
 * ── WHAT THIS IS NOT ────────────────────────────────────────────────────
 * NOT the stations. `station-glyphs.tsx` answers "which of the seven stations
 * is this", and it is keyed by station. This answers "what KIND of thing is this
 * row, and what does it want from me". A row has both: it sits at a station and
 * it is a call or a run. Two questions, two vocabularies, deliberately not fused.
 *
 * NOT the status ladder. `StatusChip` and the `--mrd-pass/fail/hold/agent/you`
 * family answer "how is it going". A `call` glyph on a row that has failed is
 * still a call. Kind is stable; status changes under it.
 *
 * ── IDENTITY IS SHAPE, NEVER HUE. Same law as the stations ──────────────
 * Colour carries STATUS in this product and nothing else. Five categorical hues
 * here would spend palette on category and make "this is orchid because it is a
 * call" indistinguishable from "this is orchid because it needs a person". The
 * glyph says WHAT it is; the colour it inherits says how it is doing. A caller
 * sets colour with the surrounding text's token and never per kind.
 *
 * ── WHY THESE FIVE SHAPES ───────────────────────────────────────────────
 * Each is the thing's own verb, and each avoids a shape that already means
 * something else in software -- the rule that made the stations redraw three of
 * seven:
 *
 *   call      a raised hand's stop-square inside a bracket: something is HELD
 *             pending your word. Not a bell (notification) and not a question
 *             mark (help).
 *   reply     an arrow turning back on itself into a line of text: the thing is
 *             waiting on WORDS from you, not a verdict. Not a speech bubble,
 *             which every chat product owns.
 *   run       three ascending bars, the shape the product already uses for work
 *             in flight in `LoadingState`'s cell grid. Deliberately borrowed
 *             from ourselves: an agent working should look the same everywhere.
 *             Not a spinner -- a spinner is a control's busy state.
 *   finished  a line completing into a terminal tick. Not a checkbox, which is
 *             a control, and not a bare check, which reads as "approved" and
 *             collides with the pass status.
 *   forecast  a horizon line with a mark above it at a point ahead: a claim
 *             placed in the future. Not a crystal ball, not a graph trending up
 *             -- both assert an OUTCOME, and a forecast is precisely the thing
 *             whose outcome is not yet known.
 */

export type WorkGlyphKind = "call" | "reply" | "run" | "finished" | "forecast";

export const WORK_GLYPHS: Record<WorkGlyphKind, ReactNode> = {
  /* Held pending your word: a stop-bar cradled by two brackets. */
  call: (
    <g>
      <path d="M7 4.5A4.5 4.5 0 0 0 4.5 8.5v7A4.5 4.5 0 0 0 7 19.5" />
      <path d="M17 4.5a4.5 4.5 0 0 1 2.5 4v7a4.5 4.5 0 0 1-2.5 4" />
      <path d="M12 8v8" />
    </g>
  ),
  /* Waiting on words: an arrow turning back, over a line of text. */
  reply: (
    <g>
      <path d="M10 5.5 5.5 10 10 14.5" />
      <path d="M5.5 10h8a5 5 0 0 1 5 5v.5" />
      <path d="M8 19h9" />
    </g>
  ),
  /* Work in flight. The ascending bars `LoadingState` already draws. */
  run: (
    <g>
      <path d="M6 15.5v3" />
      <path d="M12 9.5v9" />
      <path d="M18 5.5v13" />
    </g>
  ),
  /* A line completing into a terminal tick. */
  finished: (
    <g>
      <path d="M4 12.5h6" />
      <path d="M10 12.5 13 16l7-8" />
    </g>
  ),
  /* A claim placed ahead of a horizon. */
  forecast: (
    <g>
      <path d="M3.5 17.5h17" />
      <path d="M7 17.5v-3" />
      <path d="M12 17.5v-6" />
      <circle cx="17.5" cy="8" r="2.5" />
    </g>
  ),
};

/**
 * `size` DEFAULTS TO 13, WHICH IS `StationGlyph`'S DEFAULT AND NOT A COINCIDENCE.
 *
 * These two families appear on the same row -- a feed line carries its station
 * mark and its kind mark side by side -- and two glyph sets that disagree about
 * their own default size read as a rendering bug rather than a choice. So the
 * default is carried across rather than picked, the same way `BulkBar` carried
 * the retired row radius.
 *
 * A caller matching a specific type stop passes the number, because the glyph
 * should sit optically with the text beside it: `--mrd-t-nano` text takes a
 * smaller mark than `--mrd-t-lead` text. The stops are in `meridian.css` and the
 * caller reads the one it is already using; a `size="nano"` union here would be
 * a SECOND spelling of the type ladder, which is the rival-scale problem this
 * run spent itself removing.
 *
 * `aria-hidden`, always. Every one of these sits beside a word that already says
 * what it is -- "Review", "Stop", "came true" -- and a screen reader announcing
 * "call icon, Review" is reading the same fact twice. A glyph that is the ONLY
 * carrier of its meaning is a defect in the row, not a missing label here.
 */
export function WorkGlyph({
  kind,
  size = 13,
  className,
}: {
  kind: WorkGlyphKind;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {WORK_GLYPHS[kind]}
    </svg>
  );
}
