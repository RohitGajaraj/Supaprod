/**
 * Aurora score card: drifting radial washes + Codystar numeral. The ONLY
 * sanctioned gradient. Score moments only (loop health, teardown confidence,
 * outcome scores). Max one per screen. The hue IS the state.
 */
export interface AuroraCardProps {
  /** Mono-caps label, e.g. "LOOP HEALTH" */
  label: string;
  /** The dotted-matrix numeral */
  score: string | number;
  /** Mono-caps footnote, e.g. "ON TRACK · +3.2 THIS WEEK" */
  note?: string;
  /** moss-forward healthy · ember-forward attention · madder-forward failing */
  state?: "healthy" | "attention" | "failing";
}
