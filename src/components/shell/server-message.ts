import { messageForPerson } from "@/lib/error-copy";

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
  /*
   * ── ONE JUDGEMENT, TWO NAMES (2026-08-27) ─────────────────────────────────
   * This used to carry its own rules and `messageForPerson` in
   * `@/lib/error-copy` carried a different set. They were COMPLEMENTARY rather
   * than redundant, which is the worst version of a duplicate: each rejected
   * things the other let through, so which one a surface happened to call
   * decided what a person saw. I found it by adopting the other one across my
   * prefix without noticing this existed.
   *
   * S1 folded this file's three extra rules into `messageForPerson` (the 200
   * character cap, markup bodies, stack frames and URLs) and matched the cap
   * exactly so this became a behaviour-preserving delegation rather than a
   * change. Two implementations of "is this fit to show a person" is precisely
   * the drift that a single judgement exists to prevent.
   *
   * THE NAME SURVIVES because its caller reads well with it and re-pointing a
   * working call site buys nothing. What must not survive is a second set of
   * rules behind it.
   *
   * THE ONE THING DELEGATION WOULD HAVE LOST, kept here on purpose:
   * `messageForPerson` takes an `Error` or a `string`. This has always also
   * accepted a bare `{ message }` object, which is what a fetch rejection and
   * several server helpers actually throw. Normalising first keeps that caller
   * working; handing the object straight through would have silently started
   * returning null for it.
   */
  const raw =
    typeof e === "string"
      ? e
      : e instanceof Error
        ? e.message
        : typeof e === "object" && e !== null && "message" in e
          ? String((e as { message: unknown }).message)
          : null;
  return raw === null ? null : messageForPerson(raw);
}
