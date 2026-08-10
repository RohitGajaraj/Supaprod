/**
 * THE SERVER'S OWN WORDS FOR A FAILURE, or null when there are none worth showing.
 *
 * WHY THIS EXISTS, AND WHY IT LIVES HERE NOW.
 *
 * Several server functions in this product refuse an action with a sentence
 * written for a person to read, and those sentences name real doors: a shipped
 * spec cannot be sent back, an already-draft spec has nothing to send back, a
 * boundary cannot be moved below its floor. They were written carefully and, for
 * a long time, no surface showed them.
 *
 * The failure mode this guards against was found live on 2026-08-10. The snooze
 * and send-back mutations were written `onError: (_e, ...)` -- the error object
 * deliberately discarded -- and toasted a fixed string saying the feature "turns
 * on with the next release". Both features had shipped weeks earlier. So the
 * copy had stopped being a placeholder and become two failures at once: it told
 * the operator something untrue about the product, and it threw away the one
 * message that would have told them what actually happened. A placeholder that
 * cannot notice the world changed under it is worse than no message, because it
 * fails silently and confidently.
 *
 * It was fixed inside MissionShell.tsx, and then MissionShell.tsx turned out to
 * be unreachable and was deleted with the rest of the retired mission tree. The
 * helper is the part worth keeping, so it moved here rather than dying with its
 * first caller.
 *
 * DELIBERATELY CONSERVATIVE ABOUT WHAT IT WILL SHOW. A refusal we authored is
 * worth surfacing verbatim. A stack frame, a bare "Error", a transport failure
 * or an HTML error page is not, and in those cases the caller's own sentence is
 * better than the machine's. So anything that does not look like prose written
 * for a person is rejected, and the caller falls back.
 *
 * Callers should read: `toast.error(serverMessage(e) ?? "Your own sentence.")`
 */
export function serverMessage(e: unknown): string | null {
  const raw =
    typeof e === "string"
      ? e
      : e instanceof Error
        ? e.message
        : typeof e === "object" && e !== null && "message" in e
          ? String((e as { message: unknown }).message)
          : null;
  if (!raw) return null;

  const msg = raw.trim();

  // Too short to be a sentence, or long enough to be a stack or a dump.
  if (msg.length < 8 || msg.length > 200) return null;

  // Transport and framework noise. None of these were written for an operator.
  if (/^(error|failed to fetch|network ?error|internal server error)$/i.test(msg)) return null;

  // An HTML or JSON body that reached us as a message.
  if (/^\s*[<{[]/.test(msg)) return null;

  // A stack frame, a file:line, or a bare URL. All leak the machine's shape.
  if (/\bat\s+\w+\s*\(|\.tsx?:\d+|https?:\/\//i.test(msg)) return null;

  return msg;
}
