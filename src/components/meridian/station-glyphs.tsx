import type { ReactNode } from "react";

import type { AgentStation } from "@/lib/agent-vocabulary";

/*
 * THE SEVEN STATIONS, AS MARKS.
 *
 * ── WHY THIS FILE EXISTS ────────────────────────────────────────────────
 * These glyphs were written for Meridian's SidebarNav and are now also drawn
 * on the app shell's horizontal station strip. Two renderings of the same seven
 * things must not own two copies of the drawing: the failure is not that one
 * looks wrong, it is that Discover is a target in one place and a spiral in the
 * other, and a reader who learns one has to learn the other. That is the same
 * argument `run-state.ts` makes for one status vocabulary, held one layer up.
 *
 * ── IDENTITY IS SHAPE HERE, NEVER HUE ───────────────────────────────────
 * The founder asked on 2026-08-15 whether each station could take its own
 * colour. It cannot, and the reason is the rule that makes the rest of the
 * system legible: colour carries STATUS in this product — waiting on you,
 * running, held, failed — and nothing else. Seven categorical hues would spend
 * the whole palette on category, and a reader could no longer tell "Plan is
 * amber because it is Plan" from "Plan is amber because something is stuck
 * there". It is also the specific look he rejected in the first place: a
 * rainbow of stages is what every generated dashboard reaches for.
 *
 * Shape does the job better anyway. At 13px, seven hues at the same lightness
 * are genuinely hard to tell apart and impossible for the commonest colour
 * vision deficiencies; seven silhouettes are not. So the station says which
 * station it is with its mark, and the dot beside it says how it is doing.
 *
 * ── WHY THESE SHAPES ────────────────────────────────────────────────────
 * Each is the station's verb, not a decoration:
 *   discover  a signal spreading outward from a source
 *   decide    a flowchart decision diamond, with the chosen branch leaving it
 *   plan      lines of decreasing length, a list being drawn up
 *   design    a frame with its first division
 *   build     angle brackets around a slash: code
 *   ship      a sealed parcel: the release artefact
 *   learn     an open book: what the station leaves for next time
 *
 * THREE OF THESE WERE REDRAWN ON 2026-08-15, and the reason is the same each
 * time: a mark that already means something else in software is not available,
 * however apt it feels. Decide was a Y (read as a keyboard shortcut), Ship was
 * the platform share icon, Learn was the refresh arrow. A station glyph sits
 * beside real controls; it may not borrow one of their shapes.
 */

export type StationGlyphKind =
  "discover" | "decide" | "plan" | "design" | "build" | "ship" | "learn";

/**
 * THE ONE PLACE THE PRODUCT'S STATION IDS AND MERIDIAN'S GLYPH KINDS MEET.
 *
 * Two vocabularies, both load bearing, neither renameable. `AgentStation` is
 * what the database stores and what every server function speaks
 * (`sense`, `define`); `StationGlyphKind` is what the drawings are keyed by
 * (`discover`, `plan`). They disagree on two of the seven, which is exactly the
 * kind of near-miss that gets papered over locally.
 *
 * IT WAS DECLARED TWICE BEFORE THIS, character for character: `GLYPH_FOR_STATION`
 * in `crew/CrewChrome.tsx` and `STATION_MARK` in `shell/AppFrame.tsx`. Both
 * carried a comment explaining that it was "the one place the two meet", and
 * both were right about the principle and wrong about being the place. A third
 * copy was about to be written here for `RunMap`, which is the point the repo's
 * own lesson applies: seven copies of `initialsFrom`, four status normalisers
 * that disagree. The cost is never the duplicate, it is that copies drift and
 * then a station is a spiral on one surface and a target on another.
 *
 * `Record<AgentStation, …>` rather than a partial, which is `AppFrame`'s own
 * argument and worth keeping: an eighth station fails the build HERE, until
 * somebody draws it, rather than shipping a chip with an empty corner.
 */
export const GLYPH_FOR_STATION: Record<AgentStation, StationGlyphKind> = {
  sense: "discover",
  decide: "decide",
  define: "plan",
  design: "design",
  build: "build",
  ship: "ship",
  learn: "learn",
};

export const STATION_GLYPHS: Record<StationGlyphKind, ReactNode> = {
  discover: (
    <g>
      <circle cx="12" cy="12" r="2" />
      <path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 15.5a5 5 0 0 0 0-7" />
      <path d="M5.5 5.5a9 9 0 0 0 0 13M18.5 18.5a9 9 0 0 0 0-13" />
    </g>
  ),
  decide:
    (
      /*
       * A FLOWCHART DECISION DIAMOND with the chosen branch leaving it.
       *
       * This was two lines converging into one stem, and at 13px that is a
       * capital Y — founder, 2026-08-15: people read it as a keyboard shortcut
       * sitting where a shortcut would sit. The diamond is the one shape that
       * means "a decision" to essentially everyone who has read a flowchart, and
       * it cannot be mistaken for a letter.
       */
      <g>
        <path d="M12 3l7 7-7 7-7-7z" />
        <path d="M19 10h2M12 17v4" />
      </g>
    ),
  plan: <path d="M4 6h16M4 12h10M4 18h13" />,
  design: (
    <g>
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <path d="M3 9.5h18M9.5 21V9.5" />
    </g>
  ),
  build: <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 4l-4 16" />,
  ship:
    (
      /*
       * A SEALED PARCEL, not an upward arrow out of a tray.
       *
       * The old drawing was, character for character, the platform share icon —
       * a box with an arrow rising out of it. Founder caught it: on a station
       * chip, next to real controls, that reads as "share this" rather than "this
       * shipped". A parcel with its seam and band is the release ARTEFACT, which
       * is the thing this station actually produces, and it collides with nothing
       * else in the product.
       */
      <g>
        <path d="M3.5 7.5l8.5-4.5 8.5 4.5v9L12 21l-8.5-4.5z" />
        <path d="M3.5 7.5L12 12l8.5-4.5M12 12v9" />
      </g>
    ),
  learn:
    (
      /*
       * AN OPEN BOOK, not a circular arrow.
       *
       * The loop-back arrow was semantically right — Learn closes the loop — and
       * visually wrong: a circular arrow with a head on it is the universal
       * REFRESH/RETRY glyph, and this station sits in a strip beside states that
       * genuinely offer a retry. Founder asked whether something better existed.
       * A book is what the station leaves behind: the thing you consult next time.
       */
      <g>
        <path d="M12 6.5C10.5 5 8.4 4.3 4 4.3v13c4.4 0 6.5.7 8 2.2 1.5-1.5 3.6-2.2 8-2.2v-13c-4.4 0-6.5.7-8 2.2z" />
        <path d="M12 6.5v13" />
      </g>
    ),
};

/**
 * `aria-hidden` always. Every place this is drawn already names its station in
 * text beside it, so announcing the mark would read the station twice.
 */
export function StationGlyph({
  kind,
  size = 13,
  className,
}: {
  kind: StationGlyphKind;
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
      {STATION_GLYPHS[kind]}
    </svg>
  );
}
