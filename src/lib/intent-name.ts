/**
 * nameFromIntent - turns a free-text sentence into a short project name.
 *
 * Rescued from the retired TodayCommandBlock (founder keep-list, 2026-07-18):
 * the sentence box that used to sit on Today folded into Ask's "Start a
 * project from this" action (AskPanel.tsx). Logic unchanged; moved here so
 * both the old call site's history and the new one share one implementation.
 */

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "for",
  "to",
  "of",
  "and",
  "my",
  "our",
  "with",
  "that",
  "build",
  "make",
  "create",
  "design",
  "plan",
  "write",
  "add",
  "ship",
]);

/**
 * First few meaningful words of the sentence, title-cased, as the name.
 * Callers must pass a non-empty, already-trimmed sentence (both call sites
 * guard on `intent.trim()` before calling) - an empty string is not a
 * supported input.
 */
export function nameFromIntent(intent: string): string {
  const words = intent
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w.toLowerCase()));
  const picked = (words.length ? words : intent.split(/\s+/)).slice(0, 3);
  const name = picked
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ")
    .slice(0, 60);
  return name || "New project";
}
