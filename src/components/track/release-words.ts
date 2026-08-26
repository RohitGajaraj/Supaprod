/**
 * WHAT SHIP ACTUALLY DID, IN WORDS THAT DO NOT OVERSTATE IT.
 *
 * ── THE HOLE THIS FILLS ────────────────────────────────────────────────────
 * The run's right pane renders the thing each station made. Every kind has a
 * card except this one: `deployment` fell through the switch to `null`, so Ship,
 * alone among the seven, showed NOTHING for its own output. The columns were
 * already being fetched and handed to the component
 * (`track.functions.ts:1184`), and thrown away at the last step.
 *
 * ── THE ONE DISTINCTION THIS FILE EXISTS TO KEEP ───────────────────────────
 * `success` is the deploy provider reporting that a deploy happened.
 * **`claimed` is a person having typed a link.** `submitStationByHand` writes
 * `claimed` and never `success`, deliberately, because `release.publish` reads
 * `success` and a pasted address must never be able to satisfy the gate that
 * says this shipped. If those two ever read the same on screen, the surface has
 * undone the reason the constant exists, and the product's central claim rests
 * on a string somebody typed.
 *
 * ── AND AN UNKNOWN WORD IS PASSED THROUGH, NOT GUESSED ─────────────────────
 * `status` is a text column written by whichever provider ran. A value this
 * build has not seen comes out as itself in a quiet tone rather than being
 * sorted into the nearest bucket, which is the rule `holdTone` already runs on:
 * a confident wrong colour is worse than no colour.
 */

/** Meridian's outcome tones. `pass` is only ever allowed to report an outcome. */
export type ReleaseTone = "pass" | "agent" | "hold" | "fail" | "quiet";

export type ReleaseStanding = {
  /** The chip's word, in the product's voice rather than the column's. */
  word: string;
  tone: ReleaseTone;
  /** What the word does not say, when it needs saying. */
  note: string | null;
};

export function releaseStanding(status: string | null | undefined): ReleaseStanding {
  switch ((status ?? "").toLowerCase()) {
    case "success":
      return { word: "Went out", tone: "pass", note: null };

    case "claimed":
      return {
        word: "Told to us",
        // `hold`, not `pass`. Amber says stopped and not on you, which is the
        // truth here: nothing is wrong, and nothing has been checked either.
        tone: "hold",
        note: "Somebody typed this address in. Nothing here has checked it, so it cannot stand as proof that this shipped.",
      };

    case "failed":
    case "error":
      return { word: "Did not go out", tone: "fail", note: null };

    case "pending":
    case "queued":
    case "building":
    case "in_progress":
      return { word: "Going out", tone: "agent", note: null };

    default:
      // The provider's own word, unsorted. See the header.
      return { word: status && status.length > 0 ? status : "Not said", tone: "quiet", note: null };
  }
}

/**
 * A commit is identified by its first characters everywhere a person reads one,
 * and by all forty everywhere a machine does. Never truncated below seven: that
 * is where collisions start being realistic in a repository of any size.
 */
export function shortSha(sha: string | null | undefined): string | null {
  const s = (sha ?? "").trim();
  if (s.length < 7) return s.length > 0 ? s : null;
  return s.slice(0, 7);
}
