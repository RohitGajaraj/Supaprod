/**
 * HOW THIS WORK MOVED, COUNTED RATHER THAN CHARACTERISED.
 *
 * -- WHY THE RUN SCREEN NEEDS THIS AT ALL ----------------------------------
 * The product's claim is that work walks the route on its own. The record can
 * answer that and no surface asks it: `stage_events.driven_via` is stamped on
 * every move, `sweep` for the loop, `press` for a person acting, and
 * `continuation` for the client walking on from a leg whose window closed
 * (F-55, queue 64). It reaches the browser already, on every transition
 * `TrackActivity` draws, and nothing has ever read it as a whole.
 *
 * Measured over the 106 tracks: 20 have any drive recorded at all, 19 of those
 * carry at least one human drive, and exactly ONE was moved only by the loop.
 *
 * -- THE TRAP THIS FILE EXISTS TO NOT FALL INTO ----------------------------
 * That one track is `d1168015`. It entered at `sense`, sits at `learn`, waives
 * nothing, and every one of its 19 drives was the sweep. Read from the drive
 * record alone it is the acceptance: seven stations, no human, on the record.
 *
 * It is not. A person answered THREE calls on it mid-run, which is what F-79
 * found and what R-18 disqualifies, and not one of those answers is a move, so
 * nothing in this data can see them.
 *
 * So this file counts moves and says so, and never says "unattended", "nobody
 * touched it", or anything a reader could reasonably shorten to that. The
 * sentence carries its own scope, because the whole reason CLAUDE.md has three
 * paragraphs warning against a number that looks like the acceptance is that
 * the caveat lived in somebody's memory instead of next to the figure.
 *
 * Whether an acceptance is met is S4's to prove and R-18's to define. This is
 * the screen's job, which is to stop hiding the inputs.
 *
 * -- AND AN UNRECORDED MOVE IS NOT A MOVE BY THE LOOP ----------------------
 * `getTrackActivity` states the rule in its own contract: `foreground` appears
 * only on rows written before the split and NULL on rows older than the
 * question, and "a surface must claim nothing about a person for either." They
 * are counted apart and named as unrecorded. Folding them into `sweep` would
 * turn every track that predates the question into a clean run.
 */

/** What a transition records about who asked for it. */
export type TransitionVia = "sweep" | "press" | "continuation" | "foreground" | null;

/** The tally, kept separate from the wording so both can be tested. */
export type DriveTally = {
  sweep: number;
  press: number;
  continuation: number;
  /** `foreground` and null together: moved, by somebody nothing recorded. */
  unrecorded: number;
  total: number;
};

/** Count the moves by what asked for them. */
export function tallyDrives(vias: readonly TransitionVia[]): DriveTally {
  const t: DriveTally = { sweep: 0, press: 0, continuation: 0, unrecorded: 0, total: 0 };
  for (const v of vias) {
    t.total += 1;
    if (v === "sweep") t.sweep += 1;
    else if (v === "press") t.press += 1;
    else if (v === "continuation") t.continuation += 1;
    else t.unrecorded += 1;
  }
  return t;
}

const moves = (n: number) => (n === 1 ? "1 move" : `${n} moves`);
const calls = (n: number) => (n === 1 ? "one call" : `${n} calls`);

/**
 * What to say about how this ran, or null when there is nothing to say.
 *
 * Null on an empty route is the loading and never-moved contract the rest of
 * this screen follows: a line that cannot know its counts says nothing rather
 * than reporting zero, because zero moves and no record of moves read the same
 * and are not the same.
 */
export function howThisRan(
  vias: readonly TransitionVia[] | null | undefined,
  /**
   * Calls a person decided on this track, or null when that is not known.
   *
   * NULL AND ZERO ARE DIFFERENT ANSWERS AND THE DIFFERENCE IS THE POINT. Zero
   * is "we looked and nobody answered anything", which is worth saying on a
   * route the loop moved end to end because it is the other half of the
   * acceptance. Null is "the read failed, or has not landed", and it must
   * never be drawn as zero: that would turn a slow query into a claim of
   * autonomy, on the one screen where that claim is the product.
   */
  answeredCalls: number | null = null,
): string | null {
  if (!vias || vias.length === 0) return null;
  const t = tallyDrives(vias);

  /*
   * NOTHING RECORDED AT ALL. Every move predates the question, so the honest
   * account is that the record does not say, and the count is still worth
   * giving because it is the part that IS known.
   */
  if (t.unrecorded === t.total) {
    return `${moves(t.total)} on this route, made before the record kept who asked for them.`;
  }

  const parts: string[] = [];
  if (t.sweep) parts.push(`${t.sweep} by the loop on its own`);
  if (t.press) parts.push(`${t.press} after somebody pressed Run it now`);
  if (t.continuation) parts.push(`${t.continuation} carried on by itself`);
  if (t.unrecorded) parts.push(`${t.unrecorded} before the record kept who asked`);

  const list =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;

  /*
   * THE SCOPE TRAVELS WITH THE SENTENCE, and only where it could be misread.
   * A route the loop moved end to end is the one line somebody will quote as
   * the acceptance, and answering a call is not a move, so nothing here can
   * see it. On a mixed route the reader is already being told a person acted
   * and the caveat would be noise.
   */
  if (t.sweep === t.total) {
    const opening =
      t.total === 1
        ? "The only move on this route was made by the loop on its own."
        : `All ${t.total} moves on this route were made by the loop on its own.`;

    /*
     * THE CAVEAT IS REPLACED BY THE FACT AS SOON AS THERE IS ONE. While the
     * answered-call count is unknown this line has to warn that it cannot see
     * them; once it can, warning about a blind spot it no longer has would be
     * its own small dishonesty.
     */
    if (answeredCalls === null) {
      return `${opening} Moves are all this counts, and a call answered along the way is not one.`;
    }
    if (answeredCalls === 0) {
      return `${opening} Nobody answered a call along the way either.`;
    }
    return `${opening} A person answered ${calls(answeredCalls)} along the way.`;
  }

  /*
   * ON A MIXED ROUTE A PERSON IS ALREADY NAMED, so an answered call is an
   * addition rather than a correction, and zero is not worth a sentence: the
   * reader has not been offered an autonomy claim to qualify.
   */
  const base = `${moves(t.total)} on this route: ${list}.`;
  return answeredCalls && answeredCalls > 0
    ? `${base} A person also answered ${calls(answeredCalls)}.`
    : base;
}
