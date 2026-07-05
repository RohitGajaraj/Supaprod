/**
 * Mono-caps verdict chip with 12% tinted fill and a soft glow. The machine's
 * judgment; the PM's own notes use Pencil instead.
 */
export interface VerdictChipProps {
  /** VALIDATED/SHIP/KEPT moss · MISSED/KILL madder · REVISE ember ·
   *  BY AGENT glacier · EVIDENCE THIN blossom · IN REVIEW marigold */
  verdict: string;
  /** Force a tone when the verdict text is custom */
  tone?: "moss" | "madder" | "ember" | "glacier" | "blossom" | "marigold";
}
