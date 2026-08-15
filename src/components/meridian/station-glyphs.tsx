import type { ReactNode } from "react";

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
 *   decide    two paths converging into one
 *   plan      lines of decreasing length, a list being drawn up
 *   design    a frame with its first division
 *   build     angle brackets around a slash: code
 *   ship      something leaving upward through a door
 *   learn     a loop turning back on itself
 */

export type StationGlyphKind =
  "discover" | "decide" | "plan" | "design" | "build" | "ship" | "learn";

export const STATION_GLYPHS: Record<StationGlyphKind, ReactNode> = {
  discover: (
    <g>
      <circle cx="12" cy="12" r="2" />
      <path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 15.5a5 5 0 0 0 0-7" />
      <path d="M5.5 5.5a9 9 0 0 0 0 13M18.5 18.5a9 9 0 0 0 0-13" />
    </g>
  ),
  decide: (
    <g>
      <path d="M12 21v-9" />
      <path d="M12 12L6 4M12 12l6-8" />
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
  ship: (
    <g>
      <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
      <path d="M12 3v12M8 7l4-4 4 4" />
    </g>
  ),
  learn: (
    <g>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" />
      <path d="M20.5 3.5v5h-5" />
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
