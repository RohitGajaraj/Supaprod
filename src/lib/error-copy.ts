/**
 * WHAT A PERSON MAY READ WHEN SOMETHING FAILS.
 *
 * ── THE DEFECT, MEASURED ACROSS THIS PREFIX ───────────────────────────────
 * 30 sites render an error's `message` straight into the surface. On /learn
 * that produced *"The record did not load. Unauthorized: Invalid token"*: one
 * sentence in the product's voice followed by a string meant for a log.
 *
 * ── AND WHY DELETING THEM ALL WOULD BE WORSE ──────────────────────────────
 * The server functions in this repo deliberately return SENTENCES WRITTEN FOR
 * PEOPLE. `rewindTrackTo` answers *"That step is ahead of this work, and undo
 * only goes back."*; `submitStationByHand` answers *"This work is closed, so
 * there is no station to hand back to."* Those are the best copy on the
 * surface and they arrive through exactly the same channel as the junk. A rule
 * that strips every message would throw away the good half and leave the person
 * with less than they have now.
 *
 * So the question is not whether to show a message. It is whether THIS message
 * was written for a person, and that is decidable from its shape.
 *
 * ── THE TEST, AND IT IS DELIBERATELY CONSERVATIVE ─────────────────────────
 * A sentence written for a person reads like one: it has several words and ends
 * like prose. A transport error announces itself: it carries a code, a
 * protocol word, a stack fragment, or the grammar of a database. When in doubt
 * this returns null, because the cost of hiding one good sentence is a person
 * reading one line less, and the cost of showing one bad one is the product
 * looking broken and leaking its internals.
 */

/** Fragments that mean the string came from a machine talking to a machine. */
const MACHINE = [
  "unauthorized",
  "forbidden",
  "jwt",
  "pgrst",
  "sqlstate",
  "violates",
  "constraint",
  "null value in column",
  "failed to fetch",
  "networkerror",
  "econnrefused",
  "etimedout",
  "enotfound",
  "socket",
  "unexpected token",
  "syntaxerror",
  "typeerror",
  "referenceerror",
  "undefined is not",
  "cannot read propert",
  "500",
  "502",
  "503",
  "504",
  "http",
  "status code",
  "stack",
  "at async",
];

/**
 * THE ONE FAILURE A PERSON CAN FIX THEMSELVES, so it outranks silence.
 *
 * S3 found this while converting their own sites and they are right: an ended
 * session is the most common failure on this list, and `messageForPerson`
 * answers it with null because "Unauthorized: Invalid token" is machine-shaped
 * in every way the test looks at. Null is correct about the string and wrong
 * about the moment. The reader is one click from fixing it, and nothing else on
 * the surface will tell them so.
 *
 * These stay a fingerprint list rather than a shape test on purpose. A shape
 * test asks "was this written for a person" and the answer here is no; this
 * asks "do we recognise this specific machine string well enough to replace it
 * with something better", which only a list can answer. The seven strings
 * auth-middleware actually throws are what it matches.
 */
const SESSION_ENDED = [
  /^unauthorized\b/i,
  /\binvalid token\b/i,
  /\bno token provided\b/i,
  /\bjwt (?:expired|malformed|invalid)\b/i,
  /\bsession(?: has)? expired\b/i,
  /\bnot authenticated\b/i,
  /\bauth session missing\b/i,
];

/**
 * The message text out of whatever was thrown.
 *
 * A REGRESSION I INTRODUCED AND S2 CAUGHT. S3's original read `{ message }` off
 * a plain object as well as off an Error, and I dropped that when merging their
 * `sessionEndedMessage` in. A fetch rejection and several server helpers throw
 * exactly that shape, so both functions here had quietly started returning null
 * for the commonest failure of all -- which is the same family of silent
 * failure this whole file exists to close.
 */
function textOf(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : ((err as { message?: unknown } | null | undefined)?.message ?? "");
  return typeof raw === "string" ? raw.trim() : "";
}

/** The sign-in sentence when the error says the session ended, else null. */
export function sessionEndedMessage(err: unknown): string | null {
  const text = textOf(err);
  if (!text) return null;
  return SESSION_ENDED.some((re) => re.test(text))
    ? "Your session ended. Sign in again and this will load."
    : null;
}

/**
 * ONE ENDED SESSION ACROSS A WHOLE PAGE'S READS.
 *
 * A surface with several reads answers for each of them separately, and when a
 * session ends they all fail for the same reason. Nothing is in a position to
 * notice it is the same reason, so /learn drew the sign-in sentence three times
 * with three doors, /discover three, /decide and /design two each. Every copy
 * correct; the page wrong, because the reader needs one fact and one door and
 * the third copy teaches them the screen is not thinking.
 *
 * This is the DECISION only, deliberately. It does not render anything, because
 * what is still true differs on every surface and is the whole value of the
 * card: on the record that nothing you have learned is lost, on a permissions
 * page that nothing moved while you were away. A component that guessed that
 * sentence would be worse than the copies it replaced. Each page writes its own
 * and calls this to know whether to.
 *
 * ONE ENDED READ MEANS ALL OF THEM. A session is a property of the tab, not of
 * a query, so the first match is enough and there is no counting to do.
 */
export function endedSessionOn(...errors: unknown[]): string | null {
  for (const e of errors) {
    const ended = sessionEndedMessage(e);
    if (ended) return ended;
  }
  return null;
}

/**
 * The message if it was written for a person, otherwise null.
 *
 * Callers render their own sentence and append this only when it is non-null,
 * which is what keeps the product's voice first and the machine's absent.
 */
export function messageForPerson(err: unknown): string | null {
  const text = textOf(err);
  if (!text) return null;

  const low = text.toLowerCase();
  if (MACHINE.some((m) => low.includes(m))) return null;

  // A person's sentence has words. Codes and identifiers do not.
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 4) return null;

  // A stray identifier is the other tell: uuids, snake_case columns, camelCase
  // symbols. One is enough to mean this was not written to be read.
  if (/[0-9a-f]{8}-[0-9a-f]{4}-/i.test(text)) return null;
  if (/\b[a-z]+_[a-z_]+\b/.test(text)) return null;
  if (/\b[a-z]+[A-Z][a-zA-Z]*\(/.test(text)) return null;

  // Written prose ends like prose. A truncated dump usually does not.
  if (!/[.!?]$/.test(text)) return null;

  /*
   * THREE THINGS THAT LOOK LIKE PROSE AND ARE NOT, found by S2 while adopting
   * this across their prefix. Each of their examples passed every test above:
   * enough words, no uuid, no snake_case, ending in a full stop.
   *
   * A LENGTH CAP, because there is no upper bound on a truncated body and a
   * 900-character JSON blob that happens to end in a stop was reaching a
   * person. Nothing written FOR a person as a failure line runs past 200
   * characters; past that it is a paragraph, or it is a dump. The number
   * matches `serverMessage` in the shell, deliberately, so the two can be
   * consolidated without a behaviour change.
   */
  if (text.length > 200) return null;

  /* A body rather than a sentence. JSON and XML announce themselves in the
   * first character, and no sentence begins with one. */
  if (/^\s*[<{[]/.test(text)) return null;

  /*
   * A STACK FRAME OR A URL. "at handler (src/lib/x.ts:214)" reads as ordinary
   * prose to every rule above -- S2's exact example, and it leaked. The MACHINE
   * list catches "http" and therefore any absolute URL, but not a bare host or
   * path, which is the half that still gets through.
   */
  if (/\bat\s+\w+\s*\(|\.[jt]sx?:\d+|\/\/[\w.-]+\.\w{2,}/i.test(text)) return null;
  if (/\b[\w-]+\.(?:com|net|org|io|dev|ai|co)\b/i.test(text)) return null;

  return text;
}

/**
 * One line to render when a thing a person pressed did not happen.
 *
 * Takes the surface's own sentence and appends the server's only when the
 * server wrote one for a person. Never returns an empty string, because a
 * failure with nothing said is the silence this whole sweep is about.
 */
/**
 * THE REASON ONLY, for a line rendered INSIDE something that already answers an
 * ended session.
 *
 * `ReadFailed` and `ReadFailedLine` call `wayOut`, which replaces their detail
 * with the sign-in sentence and turns their control into a door. A child that
 * ALSO called `failureLine` therefore printed "Your session ended. Sign in again
 * and this will load." twice in one box, once in the sentence and once under it.
 * Nine sites did, the moment `error` was passed at every call site -- a defect
 * created by two correct layers meeting, which is this file's recurring theme.
 *
 * So: `failureLine` where the line stands alone and nothing else will say it,
 * `reasonLine` where a wrapper will. Both keep the server's own sentence.
 */
export function reasonLine(ownSentence: string, err: unknown): string {
  const extra = messageForPerson(err);
  return extra ? `${ownSentence} ${extra}` : ownSentence;
}

export function failureLine(ownSentence: string, err: unknown): string {
  // Strongest claim first, which is the rule the receipts already follow: an
  // action the reader can take, then a sentence written for a person, then the
  // surface's own honest floor on its own.
  const extra = sessionEndedMessage(err) ?? messageForPerson(err);
  return extra ? `${ownSentence} ${extra}` : ownSentence;
}
