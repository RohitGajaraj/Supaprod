/**
 * Cadence button. Label is one or two plain human words (Approve, Send back,
 * Build this, Start, Challenge). Consequence goes in `helper`, never in the label.
 * @startingPoint section="Core" subtitle="Plain-words actions with consequence helper text" viewport="700x160"
 */
export interface ButtonProps {
  /** "primary" = the ONE ember CTA per screen · "secondary" · "quiet" */
  variant?: "primary" | "secondary" | "quiet";
  size?: "md" | "sm";
  /** Consequence in plain words, e.g. "Opens the PR · nothing ships without you" */
  helper?: string;
  onClick?: () => void;
  children: React.ReactNode;
}
