/**
 * Pencil annotation in the PM's own handwriting (Caveat + soft neon underline).
 * Chips are the machine's judgments; pencil is the human's. Max TWO per screen.
 */
export interface PencilProps {
  /** lime = strongest bet · blossom = pet feature · apricot = scope creep */
  ink?: "lime" | "blossom" | "apricot";
  /** Slight hand rotation in degrees, default -2 */
  rotate?: number;
  children: React.ReactNode;
}
