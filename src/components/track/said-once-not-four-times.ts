/**
 * ONE REASON THAT TOOK FOUR STATIONS OFF THE ROUTE IS SAID ONCE.
 *
 * ── WHAT IS ABOUT TO LAND, AND WHY THIS IS NOT SPECULATIVE ────────────────
 * S0 fixed F-174 today: a "do not build" call can now complete its route. The
 * fix waives four stations in one loop (`driver.server.ts:2793`):
 *
 *   for (const skipped of ["define", "design", "build", "ship"])
 *     onwardRoute = waive(onwardRoute, skipped, {
 *       by: "policy",
 *       reason: "The call was not to build, so there is nothing to specify or ship.",
 *     });
 *
 * **All four carry the SAME reason string**, and `TrackChain` renders each
 * stop's `waivedReason` as its own sub-line. So a declined route draws that one
 * sentence **four times, stacked**, which is the three-copies-of-one-fact defect
 * `run-status.ts` records this lane paying for repeatedly.
 *
 * ── I CHECKED WHETHER IT WOULD EVER RENDER BEFORE BUILDING IT ─────────────
 * Measured 2026-08-31, and this is the gate three other candidates failed today
 * (the challenge renderer, the brain's line, the `ship` fold — all refused for
 * having no live rows):
 *
 * | | |
 * | --- | --- |
 * | tracks whose LATEST unsuperseded decision is `declined` | **1** |
 * | of those, real rather than a sample fixture | **1** — `d2263583` |
 * | its station / decided | `decide` / **today** |
 * | routes already carrying the four waivers | 0 |
 *
 * `decisionWasRefusal` reads only the latest unsuperseded decision member, so
 * `d2263583` — the live acceptance candidate — returns true on its next sweep
 * drive and produces exactly this. **The producer shipped hours ago and one real
 * track is queued behind it.** That is the difference between building early and
 * building furniture, and it is the whole reason this one passed.
 *
 * ── WHY THE STOPS ARE NOT COLLAPSED INTO ONE ROW ──────────────────────────
 * `run-position.ts` states the founder ruling it shares with `buildChain`: a
 * station taken off the route **still appears, as the decision it was**, because
 * *"a gap where a station used to be reads as an omission"*. So all four stay on
 * screen. **Only the repetition goes.**
 */

/** The one field this needs. Both `ChainStop` and `RunMapStation` supply it. */
export type WaivedLike = { waivedReason: string | null };

export type WaiverVoice =
  /** Not waived. The caller's ordinary sub-line rules apply. */
  | { kind: "not-waived" }
  /** The first stop of a run of waivers sharing one reason. It speaks. */
  | { kind: "says"; reason: string; covers: number }
  /**
   * Waived, and the stop above already gave this reason.
   *
   * **A DISTINCT VALUE RATHER THAN A NULL REASON, AND THE DISTINCTION IS LOAD
   * BEARING.** `TrackChain` composes `sub = stop.waivedReason ?? stop.gap`, and
   * a waived stop CAN carry a gap — `chain.ts:313` sets one whenever the stop
   * has no members, which every waived station has. So suppressing by handing
   * back a null reason would fall through the `??` and print the GAP instead:
   * "where this artifact usually comes from", on a station deliberately taken
   * off the route. That is worse than the repetition it replaced, and it is the
   * exact thing `TrackChain`'s own comment says the waiver outranks.
   */
  | { kind: "already-said" };

/**
 * One voice per stop, aligned by index.
 *
 * ── CONSECUTIVE AND IDENTICAL, AND BOTH HALVES ARE DELIBERATE ─────────────
 * **Consecutive**, because two waivers separated by a station that ran are two
 * decisions that happen to be worded alike, and folding them would claim a
 * relationship the route does not record.
 *
 * **Identical**, by exact string, with no normalising. A waiver's reason is
 * either policy text the driver wrote or **a person's own words** (`by: "user"`),
 * and trimming or lower-casing before comparing would let two genuinely
 * different sentences be reported as one call. On a screen whose job is to say
 * what happened, a false merge costs more than a true repeat.
 */
export function waiverVoices(stops: readonly WaivedLike[]): WaiverVoice[] {
  const out: WaiverVoice[] = [];
  let i = 0;
  while (i < stops.length) {
    const reason = stops[i].waivedReason;
    if (reason === null) {
      out.push({ kind: "not-waived" });
      i += 1;
      continue;
    }
    let end = i + 1;
    while (end < stops.length && stops[end].waivedReason === reason) end += 1;
    const covers = end - i;
    out.push({ kind: "says", reason, covers });
    for (let k = i + 1; k < end; k += 1) out.push({ kind: "already-said" });
    i = end;
  }
  return out;
}

/**
 * The sub-line for a waived stop, or null when the stop has nothing to add.
 *
 * ── WHY IT COUNTS THE STATIONS AND DOES NOT NAME THE CALL ─────────────────
 * The obvious sentence is *"one call took 4 stations off the route"*, and **the
 * record cannot support it.** A waiver stores `by`, `reason` and `reopensWhen`
 * and **no identifier of the decision that made it**, so "one call" would be an
 * inference from two adjacent strings matching. What is actually known is that
 * the same reason was given for a run of stations, and that is what this says.
 *
 * Same discipline as `discover-has-no-sources.ts` refusing to call a failed read
 * a zero: the surface may only claim what it counted.
 */
export function waiverLine(v: WaiverVoice): string | null {
  if (v.kind !== "says") return null;
  if (v.covers === 1) return v.reason;
  /*
   * "TAKEN OFF THE ROUTE" IS THE SETTLED WORDING AND IS REUSED RATHER THAN
   * RE-COINED. `TrackRun.tsx:304` already says "N taken off the route" and
   * `station-file.ts:197` writes "This station was taken off the route." One
   * idea, one word, which is §12 and the rule F-150 was filed for.
   *
   * The count here is NOT a second copy of TrackRun's. That one is the run's
   * total across every waiver; this is the span of ONE reason, and the two
   * differ the moment a route carries two separate waivers.
   */
  return `${v.reason} The same reason took ${v.covers} stations off the route.`;
}
