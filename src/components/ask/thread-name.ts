/**
 * WHAT TO CALL A THREAD NOBODY RENAMED.
 *
 * ── WHAT IS ON SCREEN ─────────────────────────────────────────────────────
 * `conversations.title` defaults to the literal string "New conversation", and
 * 24 of the 84 conversations in this database still carry it while HAVING
 * messages. So nearly a third of every list of threads is rows of identical
 * words, three days old, each one about something different.
 *
 * `AskSwitcher` already names the problem for its own control: "every thread
 * nobody renamed is already called that and the button would have worn the same
 * words as six rows under it, meaning something else." The button was fixed.
 * The rows were not.
 *
 * ── WHY THE WRITE PATH DOES NOT COVER IT ──────────────────────────────────
 * `routes/api/chat.ts` auto-titles from the first prompt when the title is
 * still the default, so a thread that goes through that endpoint gets named.
 * The 24 are the ones that did not: created another way, or the update did not
 * land. That path is S0's and worth fixing there too, but a surface that reads
 * a message and still calls the thread "New conversation" is choosing to
 * withhold something it is already holding.
 *
 * ── WHAT THIS IS AND IS NOT ───────────────────────────────────────────────
 * It is not a summary and it does not paraphrase. It is the opening of what was
 * actually asked, which is the same thing the write path would have stored, so
 * a thread does not change its name when the backfill eventually reaches it.
 *
 * A name a person CHOSE always wins. This only ever replaces the default and
 * the empty string, because renaming a thread is a person saying what it is
 * about and nothing derived should overrule that.
 */

/** The exact string `conversations.title` defaults to. */
const DEFAULT_TITLE = "New conversation";

/** How much of the first message reads as a name rather than a paragraph. */
const NAME_CHARS = 60;

/**
 * The name to show, or null when there is genuinely nothing to show yet.
 *
 * Null means a thread with no chosen name and no message: it really is new, and
 * the caller's own empty-state wording is better than anything derived.
 */
export function threadName(
  title: string | null | undefined,
  firstMessage: string | null | undefined,
): string | null {
  const chosen = typeof title === "string" ? title.trim() : "";
  if (chosen && chosen !== DEFAULT_TITLE) return chosen;

  const asked = typeof firstMessage === "string" ? firstMessage.trim().replace(/\s+/g, " ") : "";
  if (!asked) return null;

  if (asked.length <= NAME_CHARS) return asked;

  /*
   * Cut on a word so the name reads as a phrase rather than a severed one, and
   * only if there is a word boundary reasonably near the limit -- a single very
   * long token gets the hard cut rather than being thrown away.
   */
  const clipped = asked.slice(0, NAME_CHARS);
  const lastSpace = clipped.lastIndexOf(" ");
  return (lastSpace > NAME_CHARS - 20 ? clipped.slice(0, lastSpace) : clipped) + "…";
}
