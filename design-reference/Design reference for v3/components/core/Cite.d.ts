/**
 * Superscript blossom citation chip. Evidence is verbatim: the hover pop shows
 * the exact quote with its named source, never a summary.
 */
export interface CiteProps {
  /** Citation index shown in the chip */
  n: number;
  /** Verbatim quote revealed on hover */
  quote?: string;
  /** Source name in mono caps, e.g. "GONG", "INTERCOM" */
  source?: string;
}
