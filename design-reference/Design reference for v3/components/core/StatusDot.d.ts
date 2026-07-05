/**
 * Status dot with its word. Seven states, each with its own hue, glow, and
 * motion: working pulses glacier, thinking breathes blossom, waiting-on-you
 * flares ember, review holds marigold, shipped moss, blocked madder, queued matte.
 */
export interface StatusDotProps {
  status?: "working" | "thinking" | "waiting" | "review" | "shipped" | "blocked" | "queued";
  /** Override the default mono-caps word */
  label?: string;
  /** Keep true: meaning must survive without color */
  showLabel?: boolean;
}
