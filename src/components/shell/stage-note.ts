/**
 * WHAT ONE STATION CHIP SAYS, AND WHETHER ITS NUMBER IS A COUNT OR A FLOOR.
 *
 * ── WHY THIS IS ITS OWN FILE ───────────────────────────────────────────────
 * It was a ternary inside `useSpineStrip`, which meant the only way to check it
 * was to read the hook's source and match a string. That is exactly how the bug
 * below shipped: a test asserted the guard's SOURCE LINE, passed, and the guard
 * was wrong about the one case it existed for.
 *
 * ── THE BUG, MEASURED ON THE RENDERED STRIP ────────────────────────────────
 * `bounded` marks a chip whose figure came from `listStudioSessions`, which caps
 * three times. The first version excluded the Learn badge by comparing the note
 * against `learnExtra` - but `learnExtra` is the SUFFIX form (", 2 outcomes to
 * record") appended to a run count, while a Learn chip with no runs builds its
 * note from a different branch entirely. The strings never matched, so the
 * Learn chip carried "More are waiting than this counts" over a number that
 * came from `listPendingOutcomes` and `listDueForecastsHere` - neither bounded
 * by that flag. A caveat belonging to a read the chip never made.
 *
 * Four titles on the rendered strip where there should have been three.
 *
 * ── SO THE TWO ARE DECIDED TOGETHER, ONCE ──────────────────────────────────
 * `bounded` is now whatever the branch that produced the note says it is, which
 * removes the possibility of them disagreeing rather than fixing one instance
 * of them disagreeing.
 */

export interface StationTally {
  total: number;
  working: number;
  gate: number;
  held: number;
  failed: number;
}

export interface StageNote {
  /** The chip's second line. Empty when there is nothing true to say. */
  note: string;
  /** True only when `note` carries a figure from the capped sessions read. */
  bounded: boolean;
}

/**
 * ONE LINE, AND IT IS THE MOST URGENT TRUE THING.
 *
 * The order is the order a reader needs, not the order the enum happens to be
 * in: a gate outranks everything because it is the one waiting on a person, a
 * failure outranks running because a station that is both running something and
 * has broken something needs the breakage said out loud, and a plain count
 * comes last as the ambient case.
 */
export function stageNote(
  b: StationTally,
  opts: {
    /** True when the sessions read reported it hit one of its caps. */
    sessionsBounded: boolean;
    /** Outcomes and overdue verdicts. NOT from the sessions read. */
    learnCount: number;
    isLearn: boolean;
  },
): StageNote {
  const runWord = (n: number) => (n === 1 ? "run" : "runs");
  /* A "+" ON THE FIGURE, NOT "At least" IN FRONT OF THE SENTENCE. The words
     wrapped the Discover chip to two lines and grew the whole strip, measured
     on the running board where `bounded` comes back true - so that is the
     ordinary rendering, not an edge case. "+" is the convention the rail's own
     count already uses, and the chip carries the sentence in a `title`. */
  const floor = (n: number) => (opts.sessionsBounded ? `${n}+` : `${n}`);

  /* Appended to a run count rather than replacing it, so a Learn station that
     is BOTH running work and holding outcomes says both. */
  const learnExtra =
    opts.isLearn && opts.learnCount > 0
      ? `, ${opts.learnCount} ${opts.learnCount === 1 ? "outcome" : "outcomes"} to record`
      : "";

  /* EVERY BRANCH HERE READS THE SESSIONS TALLY, so every one of them is bounded
     when that read was. The Learn-only branch below does not, and is not. */
  const fromSessions = b.gate
    ? `${floor(b.gate)} ${runWord(b.gate)} waiting on you`
    : b.failed
      ? `${floor(b.failed)} failed`
      : b.working
        ? `${floor(b.working)} running`
        : b.held
          ? `${floor(b.held)} held`
          : b.total
            ? `${floor(b.total)} ${runWord(b.total)}${learnExtra}`
            : null;

  if (fromSessions !== null) return { note: fromSessions, bounded: opts.sessionsBounded };

  /* EMPTY, NOT "none". Founder, 2026-07-30: "why do we need to display 'none'
     when nothing is pending. if only something i need to act on, you can show,
     else cant it be empty?" On a normal workspace five or six chips carried the
     same dead word, so the eye had to read six lines to find the one that said
     something. The strip reserves the line's height in CSS, so removing the
     word does not make the region jump when a run starts or finishes. */
  if (opts.isLearn && opts.learnCount > 0) {
    return {
      note: `${opts.learnCount} ${opts.learnCount === 1 ? "outcome" : "outcomes"} to record`,
      bounded: false,
    };
  }
  return { note: "", bounded: false };
}
