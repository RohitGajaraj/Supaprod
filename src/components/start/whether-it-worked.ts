/**
 * WHETHER IT WORKED: the entry's one piece of evidence.
 *
 * ── THE COMPLAINT THIS ANSWERS, IN THE FOUNDER'S WORDS ────────────────────
 * *"I cannot feel the value and I cannot see any real connectivity."*
 *
 * Two structural passes went into the entry on 2026-09-09 and the gap survived
 * both, so it was measured rather than argued about. His workspace holds 67
 * decisions, 38 specs, 37 prototypes, 12 graded outcomes and 8 deployments. The
 * entry said two sentences about any of it, in the smallest type on the page,
 * both scoped to *since you last looked*, under a headline counting what he
 * owes the machine.
 *
 * So the defect was never the size of the debt or the size of the proof.
 * **Every value statement on the entry was a DELTA, and the complaint is about
 * the WHOLE.** Nothing on the landing page said the loop had ever closed.
 *
 * ── WHY THIS AND NOT A DASHBOARD ──────────────────────────────────────────
 * The obvious answer is a row of totals: 67 decisions, 12 outcomes, 8 releases.
 * That is precisely the *"dump of data and content"* he named, and it would
 * make the reader do the reading. Twelve is inventory. ONE outcome, with what
 * was committed to and what came back, is evidence.
 *
 * It is also the only place in the product where the machine is GRADED rather
 * than shown being busy, which is the whole positioning: agents that own
 * outcomes, not just output; *to know if you were right*. Every other surface
 * answers what is happening. This one answers whether it worked.
 *
 * ── A MISS LEADS AS READILY AS A WIN, AND THAT IS DELIBERATE ──────────────
 * The newest closed loop is shown whatever it says. A surface that only
 * surfaces its wins is marketing, and a person learns within two visits that it
 * is not to be trusted on the third. The founder's own outward register asks
 * for a verifiable mechanism and a self-correction rather than volume, and a
 * product willing to lead its landing page with *missed* is making a much
 * larger claim about itself than one leading with *validated*.
 *
 * ── THE GRADER'S SENTENCE IS NOT REWRITTEN ────────────────────────────────
 * `summary` already carries the commitment and the result in the form a person
 * reads them. Recomposing it here would make this the second surface describing
 * one verdict in its own words, which is how two screens come to disagree about
 * what happened. This module decides what is SAID AROUND it, never instead
 * of it.
 */
import type { ClosedLoop } from "@/lib/start/home-answers.functions";
import type { StatusWord } from "@/components/meridian/StatusChip";

/** What the entry draws, or null when it must draw nothing. */
export type WhetherItWorked = {
  /** The grader's word, as the reader sees it. */
  word: string;
  /** The hue that word carries. Law 3: colour carries status, never decorates. */
  status: StatusWord;
  /** What was decided, which is the subject the verdict is about. */
  subject: string | null;
  /** The grader's own sentence, verbatim. */
  summary: string;
  /** The re-score, already worded, or null when the record did not move. */
  rescored: string | null;
  /** Marked when the row is seed data, so it is never read as his own result. */
  isSample: boolean;
  at: string;
};

/**
 * The verdict's hue.
 *
 * Three grader words map onto the three outcome hues the system already owns,
 * whose token comments in `meridian.css` read "outcome: it worked" and "outcome:
 * it did not". Nothing new is introduced.
 *
 * AN UNKNOWN WORD IS `quiet`, NOT `fail`. A grader that starts writing a fourth
 * verdict must not have it painted as a failure on the landing page by a
 * default nobody chose; neutral is the honest colour for a word this map has
 * not been taught.
 */
export function hueOf(verdict: string): StatusWord {
  const v = verdict.trim().toLowerCase();
  if (v === "validated") return "pass";
  if (v === "missed") return "fail";
  if (v === "mixed") return "hold";
  return "quiet";
}

/**
 * How the re-score reads, or null.
 *
 * ── WHY IT IS A SENTENCE AND NOT AN ARROW ─────────────────────────────────
 * "58 -> 41" is a diff, and a diff asks the reader to work out both the
 * direction and what the numbers are. The direction IS the fact: the machine
 * changed its own mind about how good this bet was, in public, on the record.
 * That is the loop closing, and it deserves a verb.
 *
 * Rounded, because a confidence score carrying two decimals invites a precision
 * nothing about ICE supports.
 */
export function rescoreLine(prior: number | null, next: number | null): string | null {
  if (prior == null || next == null) return null;
  const a = Math.round(prior);
  const b = Math.round(next);
  if (a === b) return "The record held its score.";
  return b > a
    ? `The record was scored up, ${a} to ${b}.`
    : `The record was scored down, ${a} to ${b}.`;
}

/**
 * The entry's evidence, or null when there is none to give.
 *
 * `read` false means the look itself failed, and the region draws nothing:
 * a home that could not look must not reassure, which is the same rule the
 * three answers beside it hold to. A read that answered with no row is also
 * nothing to draw, because "the loop has never closed here" is a fact about a
 * new workspace and not a claim worth the largest region on the page.
 */
export function whetherItWorked(input: {
  closed: ClosedLoop | null;
  read: boolean;
}): WhetherItWorked | null {
  if (!input.read || !input.closed) return null;
  const c = input.closed;
  const summary = c.summary.trim();
  if (!summary) return null;
  return {
    word: c.verdict.trim(),
    status: hueOf(c.verdict),
    subject: c.decisionTitle?.trim() || null,
    summary,
    rescored: rescoreLine(c.priorIce, c.newIce),
    isSample: c.isSample,
    at: c.at,
  };
}
