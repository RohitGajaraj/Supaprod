/**
 * ── THE QUESTION `Ask` WILL ACCEPT ───────────────────────────────────────
 *
 * A1, reading the served approvals page on 2026-09-03: the Ask cards were right
 * and their questions read "...checkout completion rate from 67 ?" and "Ships a
 * merged changeset to production, where customers see it.?", because the caller
 * built them as `${title}?`. A title is not a question with its mark missing.
 *
 * The fix could have been a corrected call site and a comment asking the next
 * one to compose properly. It is a TYPE instead, for the reason this session
 * keeps re-learning: a rule written as prose is a request. `Ask` takes an
 * `AskQuestion`, `askQuestion` is the only thing that makes one, and it places
 * the mark itself after stripping whatever the subject arrived with. So
 * `${title}?` does not typecheck, anywhere, ever again.
 *
 * This lives in Meridian and knows nothing about approvals: the vocabulary owns
 * the shape of a question, and each surface composes its own subject.
 */

declare const ASK_QUESTION: unique symbol;

/** A question `Ask` accepts. Only `askQuestion` produces one. */
export type AskQuestion = string & { readonly [ASK_QUESTION]: true };

/** Terminal punctuation and space a subject may arrive with. The ellipsis is
 *  listed because truncated content ends in one. */
const TRAILING = /[\s.!?…]+$/u;

/** One mark, at the end, with a word before it and none inside. */
export function wellFormedQuestion(q: string): boolean {
  if (!q.endsWith("?")) return false;
  const before = q.slice(0, -1);
  if (before.length === 0) return false;
  if (TRAILING.test(before)) return false;
  return !before.includes("?");
}

/**
 * Compose a question from a verb and, optionally, a subject.
 *
 * The subject is stripped of its own terminal punctuation BEFORE the mark is
 * placed, which is the whole of the defect: "it." and "67 " both become clean
 * subjects and take exactly one mark.
 *
 * A blank subject falls back to the verb alone rather than producing a dangling
 * "Approve the design for ?" -- an empty title is a real possibility and a
 * question with nothing in it is worse than a general one.
 */
export function askQuestion(verb: string, subject?: string | null): AskQuestion {
  const v = (verb ?? "").replace(TRAILING, "").trim();
  const s = (subject ?? "").replace(TRAILING, "").trim();
  const body = v && s ? `${v} ${s}` : v || s;
  // Never returns a bare "?": a caller with neither is a bug, and this says so
  // on the screen rather than rendering a lone mark.
  return (body ? `${body}?` : "This needs an answer, and nothing said what?") as AskQuestion;
}
