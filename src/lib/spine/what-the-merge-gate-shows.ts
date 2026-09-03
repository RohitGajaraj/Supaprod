/**
 * ── R-40: THE MERGE GATE SHOWS WHAT THE CHANGE IS (P-72) ─────────────────
 *
 * The tablet track's pull request was merged on a gate whose only evidence was
 * a green check. What it actually contained was 90 lines of CSS for
 * `.address-summary` selectors and one line in `AddressStep.tsx`, in a repo with
 * no address summary component, after the Build seat had written that the work
 * belongs elsewhere and the Design critic had said the spec's premise
 * contradicts the brief.
 *
 * Every one of those facts existed in the record at the moment of the press.
 * None of them was on the card.
 *
 * ── A GREEN CHECK IS NOT EVIDENCE THAT THE RIGHT THING WAS BUILT ─────────
 *
 * It is evidence that what was built compiles and its tests pass. Those are
 * different claims, and the gap between them is exactly where this change went
 * through. So the check stays, LAST, and three facts a person can judge come
 * first: what the change touches, what the seat concluded, what the critic said.
 *
 * PURE. The reads are in the server function; these are the sentences, so they
 * can be tested against real shapes without a database.
 */

/** One file in the change, with how much of it moved. */
export type ChangedFile = { path: string; added: number; removed: number };

export type MergeGateEvidence = {
  files: ChangedFile[];
  /** The seat's own conclusion, when it halted. Null when it did not. */
  buildHalt: string | null;
  /** The design critic's verdict and its sharpest finding, when there is one. */
  designVerdict: { verdict: string; finding: string | null } | null;
  /** False when a read failed: the card then says so rather than showing zero. */
  known: boolean;
};

/** Lines added and removed between two versions of a file. A count, not a diff:
 *  the card needs the SIZE of the change, and a diff belongs behind the link. */
export function countLines(
  base: string | null,
  next: string | null,
): {
  added: number;
  removed: number;
} {
  const b = base ? base.split("\n").length : 0;
  const n = next ? next.split("\n").length : 0;
  /*
   * A rewrite of the same length reads as 0 added and 0 removed here, and that
   * is the honest limit of a line COUNT. The card says "touches N files" beside
   * it so a person is never told nothing changed; the exact diff is one click
   * away and this is not trying to be it.
   */
  return { added: Math.max(0, n - b), removed: Math.max(0, b - n) };
}

/**
 * The sentence naming what the change touches.
 *
 * Files first, because "one file in a checkout module" and "ninety lines of CSS
 * in a stylesheet nothing imports" are the same green check and different
 * decisions.
 */
export function filesLine(files: readonly ChangedFile[]): string {
  if (files.length === 0) return "This change touches no files, which cannot be right.";
  const added = files.reduce((t, f) => t + f.added, 0);
  const removed = files.reduce((t, f) => t + f.removed, 0);
  const names = files
    .slice(0, 3)
    .map((f) => f.path)
    .join(", ");
  const rest = files.length > 3 ? `, and ${files.length - 3} more` : "";
  const size = added || removed ? ` (+${added} / -${removed})` : " (rewritten, same length)";
  return `Touches ${files.length} ${files.length === 1 ? "file" : "files"}${size}: ${names}${rest}.`;
}

/** What the Build seat concluded, when it concluded something worth reading. */
export function buildLine(halt: string | null): string | null {
  if (!halt) return null;
  return `Build halted and said: ${halt.trim().replace(/\s+/g, " ")}`;
}

/** What Design said, when it said anything. */
export function designLine(v: MergeGateEvidence["designVerdict"]): string | null {
  if (!v) return null;
  const said = (v.finding ?? "").trim().replace(/\s+/g, " ");
  return said
    ? `Design's verdict was ${v.verdict}: ${said}`
    : `Design's verdict on this was ${v.verdict}.`;
}

/**
 * The card's evidence lines, in the order a person needs them.
 *
 * What it touches, what the seat concluded, what the critic said. The check is
 * NOT here: it is drawn by the card that already draws it, after these, because
 * the whole finding is that it was standing in for all three.
 */
export function mergeGateLines(e: MergeGateEvidence): string[] {
  if (!e.known) {
    return [
      "What this change contains could not be read, so nothing here describes it. Open the pull request before answering.",
    ];
  }
  return [filesLine(e.files), buildLine(e.buildHalt), designLine(e.designVerdict)].filter(
    (l): l is string => !!l,
  );
}

/**
 * May the gate draw its approve control?
 *
 * NO when the seat halted, and that is the packet's second half: a person
 * should not be offered a one-press merge of a change the seat that wrote it
 * said should not exist. The gate still renders, with the reason, and declining
 * is still one press: what goes is the affirmative.
 */
export function mayDrawApprove(e: MergeGateEvidence): boolean {
  return !e.buildHalt;
}
