/**
 * ── A WALL THAT CAME DOWN IS NOT A LOOP THAT WILL NOT CONVERGE ───────────────
 *
 * The pure half of the wallet repair: given what the record says about a
 * track, decide whether it may be released. No database, so every rule is
 * testable by running it.
 *
 * ── WHAT HAPPENED (Lane 1's measurement, 2026-09-10) ────────────────────────
 * `6cc7a010`: `ux-architect`, twelve runs, every one `halted` with
 * `halted_reason = out_of_credit`, averaging 612ms between 03:40 and 05:30 UTC
 * on 2026-09-04, against an account then holding 13 credits. The driver read
 * the SHAPE -- dispatched many times, moved never -- and recorded
 * `going-in-circles`, which is TERMINAL, so the sweep stopped giving the track
 * slots. That account holds 15,238 spendable credits today and the run has not
 * moved in six days.
 *
 * `c6cd66ebc` stops this happening again. This releases what already happened.
 */

/** The holds that take a track out of the sweep for good. Mirrors
 *  `TERMINAL_HOLDS` in correction.ts; passed in rather than imported so this
 *  file stays free of the driver's own graph. */
export type ReleaseInput = {
  /** `spine_tracks.status`. Only an open track can be released into anything. */
  status: string | null;
  /** `spine_tracks.last_hold`. Terminal or it would not need releasing. */
  lastHold: string | null;
  /** True when `lastHold` is one of the terminal holds. */
  holdIsTerminal: boolean;
  /**
   * The track's MOST RECENT run, whatever it was. Not "any wallet halt on the
   * track" -- see `newestRunIsAWalletHalt` below.
   */
  newestRun: { status: string | null; haltedReason: string | null; at: string } | null;
  /** `spine_tracks.wallet_released_at`, or null if never released. */
  releasedAt: string | null;
  /** `account_credits.balance_credits + topup_credits` for the WORKSPACE's
   *  account, read at release time. Null when it could not be read. */
  spendableCredits: number | null;
};

export type ReleaseVerdict = { release: true; because: string } | { release: false; why: string };

/**
 * THE DISCRIMINATOR IS THE NEWEST RUN, NOT ANY WALLET HALT ON THE TRACK.
 *
 * `going-in-circles` is a TRUE reading of a shape, and loops that really do go
 * in circles will reach the same word honestly. The two populations are told
 * apart by what the record says stopped the track LAST: if the most recent run
 * halted on the wallet, the hold was recorded from a wallet event. If anything
 * ran after that wallet halt and the track still gave up, the hold is about the
 * work and this must not touch it.
 *
 * Checked against production before it shipped. Of the six tracks carrying a
 * terminal hold with any halted run: `0c0db8e6` and `6cc7a010` have a wallet
 * halt as their newest run and are released; `a30238f5` has two wallet halts
 * but its newest run came fifteen hours AFTER them, so it is left alone;
 * `bb405f6c` has a terminal hold and no wallet halt at all and is left alone.
 * A rule that could not separate those is a rule that releases work nobody
 * stopped.
 */
export function newestRunIsAWalletHalt(input: ReleaseInput): boolean {
  const r = input.newestRun;
  return r != null && r.status === "halted" && r.haltedReason === "out_of_credit";
}

/** Whether this wall is newer than the last release, so one wall earns one
 *  release and a permanently empty account cannot become a permanent loop. */
export function wallIsNewerThanTheRelease(input: ReleaseInput): boolean {
  if (!input.newestRun) return false;
  if (!input.releasedAt) return true;
  const halt = Date.parse(input.newestRun.at);
  const released = Date.parse(input.releasedAt);
  return Number.isFinite(halt) && Number.isFinite(released) && halt > released;
}

/**
 * May this track be released?
 *
 * Every refusal carries its own sentence, because a repair that reports only a
 * count cannot be argued with, and the whole reason this exists is that a
 * count ("dispatched twelve times") was mistaken for a cause.
 */
export function mayRelease(input: ReleaseInput): ReleaseVerdict {
  if (input.status !== "open")
    return { release: false, why: `track is ${input.status ?? "unknown"}` };
  if (!input.holdIsTerminal)
    return { release: false, why: `hold ${input.lastHold ?? "none"} is not terminal` };
  if (!newestRunIsAWalletHalt(input)) {
    return {
      release: false,
      why: "the newest run is not a wallet halt, so the hold is about the work",
    };
  }
  if (!wallIsNewerThanTheRelease(input)) {
    return { release: false, why: "already released for this wall" };
  }
  /*
   * CREDIT IS CHECKED, NOT ASSUMED, and a read that failed is not an account
   * with money. Releasing on an unread balance would put the track straight
   * back into the wall it is being released from, and spend a sweep slot to
   * do it.
   */
  if (input.spendableCredits == null) {
    return { release: false, why: "the account's balance could not be read" };
  }
  if (input.spendableCredits <= 0) {
    return { release: false, why: `the account still holds ${input.spendableCredits} credits` };
  }
  return {
    release: true,
    because: `newest run halted out_of_credit at ${input.newestRun!.at}; the account now holds ${input.spendableCredits}`,
  };
}
