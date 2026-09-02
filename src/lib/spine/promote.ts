/**
 * When a cluster of evidence becomes a piece of work, without anyone clicking.
 *
 * FOUNDER RULING 2026-08-01: "nothing turns a cluster into work. That is a very
 * bad sign. Please make sure that is most important."
 *
 * THE GAP THIS CLOSES, measured on the live database: 308 signals across 26
 * sources, 307 of them clustered into 181 themes, and ONE track. `startTrack`
 * had exactly one caller, a button in `TrackStart.tsx`. So the loop drove itself
 * beautifully once started and nothing ever started it. The driver was built
 * because "a station transition was a navigate() call, which means it required a
 * person to click, which means the loop stopped the moment nobody was watching";
 * the ENTRANCE to the loop still had exactly that shape.
 *
 * WHY A BAR AND NOT A QUEUE FOR SOMEBODY TO APPROVE. GOVERNANCE-PRINCIPLE.md:
 * policy is set in advance and does not block, permission is asked in the moment
 * and does. A person approving each promotion is 181 approvals, which is not
 * automation, it is a queue. So the person sets the bar once and the platform
 * acts on it, which is the same trade the whole product is built on.
 *
 * THE BAR IS EVIDENCE, NOT ENTHUSIASM. Three numbers the clustering already
 * computes, and all three must clear:
 *
 *   frequency  - how many signals say it. One complaint is not a theme.
 *   severity   - how much it hurts the people who said it.
 *   confidence - how sure the clustering is that these belong together.
 *
 * A theme that clears all three has more evidence behind it than most things a
 * person starts by hand. Requiring all three rather than a weighted score is
 * deliberate: a score lets one huge number carry two weak ones, so forty
 * low-severity mentions of something trivial would open work, and "it came up a
 * lot" is exactly the failure mode a product team is prone to without help.
 *
 * CALIBRATED AGAINST THE REAL DISTRIBUTION rather than picked. Across 181 live
 * themes: mean frequency 5.2 to 16.3 by status, mean severity 2.5 to 5.0, mean
 * confidence 0.68 to 0.91. The bar below selects roughly the top tenth, which is
 * the right order of magnitude for something that spends money unattended.
 *
 * Pure and dependency-free, so the rule is tested without a database.
 */

/** What the clustering knows about one cluster of evidence. */
export type ThemeLike = {
  id: string;
  title: string | null;
  summary: string | null;
  frequency: number | null;
  severity: number | null;
  confidence: number | null;
  status: string | null;
  /**
   * What already HAPPENED when this evidence was acted on: validated bets minus
   * missed ones, from `outcomeSupportFromCounts`, so this file and /decide read
   * one rule rather than two copies of it.
   *
   * Optional, and absent means zero, which is why a workspace that has settled
   * nothing behaves exactly as it did before this term existed. The counts come
   * from `learnings` and the join lives with the caller, keeping this file pure.
   */
  outcomeSupport?: number | null;
};

/** The bar a cluster must clear before it becomes work on its own. */
export type PromotionBar = {
  minFrequency: number;
  minSeverity: number;
  minConfidence: number;
};

/**
 * The platform default, and it is deliberately conservative.
 *
 * This is the one rule in the product that spends money with nobody watching, so
 * the default errs toward starting too little rather than too much: a theme that
 * should have been promoted and was not is a person clicking a button, while a
 * theme promoted wrongly is a full loop of agent time against the track cap.
 * Those two mistakes are not symmetric and the number reflects it.
 */
export const DEFAULT_PROMOTION_BAR: PromotionBar = {
  // Above the mean of every status. Fewer than eight independent signals is a
  // hunch worth a person's judgment, not an autonomous build.
  minFrequency: 8,
  // 4 of 5. Real pain for the people who reported it, not an annoyance.
  minSeverity: 4,
  // The clustering has to actually believe these belong together, or the work
  // starts from a brief that is three unrelated complaints in a trenchcoat.
  minConfidence: 0.75,
};

/**
 * How badly a theme's own history has to have gone before a person, rather than
 * the bar, decides whether to try again.
 *
 * -2 means at least two more missed bets than validated ones on this same
 * evidence. ONE miss is deliberately not enough: a first attempt failing is the
 * normal cost of doing product work, and a platform that abandoned a real problem
 * after a single bad swing would be worse at this than the person using it. Two,
 * with nothing validated against them, is a pattern rather than an accident.
 *
 * AND IT WITHHOLDS AUTONOMY, IT DOES NOT CLOSE THE DOOR. A theme past this line
 * stays fully promotable by hand at the Gate, and `qualifies` says why in a
 * sentence the sweep reports. That is the governance rule as written: policy is
 * set in advance and does not block, and the exception is what reaches a person.
 * Refusing outright would be the platform overruling a person, which no bar here
 * is allowed to do.
 */
export const AUTO_PROMOTE_STOPS_AT_SUPPORT = -2;

/**
 * Statuses that are not eligible however strong the numbers.
 *
 * A theme somebody has dismissed or already merged away has had a HUMAN
 * judgment applied to it, and re-promoting it would be the platform overruling a
 * person, which no bar is allowed to do.
 */
/**
 * `promoted` is here because a cluster that already became a bet must not become
 * a second one. It was absent while nothing wrote it, so the autonomous sweep
 * and the manual Gate could each mint a bet for the same theme -- 10 themes and
 * 50 opportunities deep on the live database before anyone noticed.
 */
export const INELIGIBLE_STATUSES: readonly string[] = [
  "dismissed",
  "merged",
  "archived",
  "done",
  "promoted",
];

/** Whether this cluster clears the bar, and the sentence explaining why. */
export function qualifies(
  theme: ThemeLike,
  bar: PromotionBar = DEFAULT_PROMOTION_BAR,
): { ok: boolean; why: string } {
  const status = (theme.status ?? "").toLowerCase();
  if (INELIGIBLE_STATUSES.includes(status)) {
    return { ok: false, why: `somebody already settled this one (${status})` };
  }
  // A cluster with no title cannot become a track a person can recognise on a
  // board, and naming it ourselves would be inventing the work's identity.
  if (!theme.title?.trim()) return { ok: false, why: "it has no name yet" };

  const freq = theme.frequency ?? 0;
  const sev = theme.severity ?? 0;
  const conf = theme.confidence ?? 0;

  if (freq < bar.minFrequency) {
    return { ok: false, why: `only ${freq} signals say it, and the bar is ${bar.minFrequency}` };
  }
  if (sev < bar.minSeverity) {
    return { ok: false, why: `it is not severe enough (${sev} against ${bar.minSeverity})` };
  }
  if (conf < bar.minConfidence) {
    return {
      ok: false,
      why: `the cluster is not confident enough (${conf} against ${bar.minConfidence})`,
    };
  }

  /**
   * WHAT HAPPENED LAST TIME, which until now this rule could not see.
   *
   * This is the one rule in the product that spends money with nobody watching,
   * and it read three numbers the clustering computed and nothing about whether
   * acting on this evidence had ever worked. So a theme whose bets had missed
   * twice cleared the same bar as one whose bets had been validated twice, and
   * kept clearing it, forever. The loop could not learn the thing it is for.
   *
   * Checked LAST, after the three evidence numbers, on purpose: the evidence is
   * why the work is worth doing and history only decides who gets to say go.
   */
  const support = theme.outcomeSupport ?? 0;
  if (support <= AUTO_PROMOTE_STOPS_AT_SUPPORT) {
    return {
      ok: false,
      why: `bets on this evidence have missed more than they have landed (${support}), so this one is worth a person deciding rather than starting on its own`,
    };
  }

  const evidence = `${freq} signals say it, severity ${sev}, and the cluster is ${Math.round(conf * 100)}% confident these belong together`;
  return {
    ok: true,
    // Says what it learned only when it learned something. A "(0)" on every
    // origin sentence would be noise on the majority of tracks, which have no
    // settled outcomes behind them at all.
    why:
      support > 0
        ? `${evidence}, and earlier bets on this evidence were validated (${support})`
        : evidence,
  };
}

/**
 * The reason string written onto the track, in the founder's plain-words voice.
 *
 * THIS IS NOT DECORATION. `validateRoute` refuses a track that entered below
 * Discover with no stated reason, and Learn grades the outcome against what the
 * work was for. A promotion with no origin would produce a track that cannot be
 * routed and cannot be graded, so the sentence is load-bearing twice over.
 */
/**
 * The clause that marks an origin as the SWEEP's rather than a person's.
 *
 * One writer, one line below, and no model anywhere near it: `originFor` is the
 * only thing in the product that composes this sentence, so an exact match on it
 * is a sentinel rather than the prose-parsing the surfaces are forbidden. The
 * alternative would be a boolean column duplicating a fact the sentence already
 * carries, and the sentence is the thing worth keeping, because it records what
 * the loop believed at the moment it decided.
 */
export const PROMOTED_BECAUSE = "This became work on its own because";

export function originFor(theme: ThemeLike, bar: PromotionBar = DEFAULT_PROMOTION_BAR): string {
  const verdict = qualifies(theme, bar);
  const body = theme.summary?.trim() || theme.title?.trim() || "A cluster of evidence";
  return `${body} ${PROMOTED_BECAUSE} ${verdict.why}.`;
}

/**
 * Did the loop start this track on its own, or did a person type it?
 *
 * READ FROM `spine_tracks.origin`, which is the only column that separates them.
 * `theme_id` cannot: a Discover seat that clusters evidence files themes on a
 * track a person typed, so a theme on the record proves clustering happened and
 * not that clustering STARTED anything.
 */
export function becameWorkOnItsOwn(origin: string | null | undefined): boolean {
  return typeof origin === "string" && origin.includes(PROMOTED_BECAUSE);
}

/**
 * How many clusters may become work in one sweep, PER WORKSPACE OWNER.
 *
 * There are 181 themes today. Without a bound, the first run of this would open
 * every qualifying one at once and every one of them would start spending, which
 * is the single worst thing this feature could do on the day it ships. Two per
 * sweep, strongest first, so the backlog drains at a pace a person can watch and
 * stop.
 *
 * READ THE SCOPE CAREFULLY BEFORE USING THIS NUMBER TO JUDGE A LIVE TICK.
 * `promoteClustersOnce` is called once per workspace, and `cron.cluster-tick`
 * processes up to FIVE workspaces per invocation, so one tick of the ten-minute
 * cron can legitimately open up to TEN tracks: five workspaces times this bound.
 * An operator who expects two and sees six across three workspaces is looking at
 * correct behaviour. The number to check against is
 * `MAX_PROMOTIONS_PER_SWEEP x (distinct workspaces in that tick)`, and the
 * tick's own response body reports the per-workspace figure so the arithmetic
 * never has to be guessed.
 */
export const MAX_PROMOTIONS_PER_SWEEP = 2;

/** Strongest evidence first, so the bounded few are the ones most worth doing. */
export function rankForPromotion(themes: ThemeLike[], bar: PromotionBar = DEFAULT_PROMOTION_BAR) {
  return themes
    .filter((t) => qualifies(t, bar).ok)
    .sort((a, b) => {
      // Severity leads, because a small number of people in real pain outranks a
      // large number mildly inconvenienced, and frequency alone is the metric a
      // product team over-trusts without help.
      const sev = (b.severity ?? 0) - (a.severity ?? 0);
      if (sev !== 0) return sev;
      // WHAT ACTUALLY HAPPENED, above raw volume and below severity. Same
      // placement /decide gives it: under the primary priority signal, over the
      // count of people who said it, because what a bet DID beats how loud the
      // evidence was. Zero for every theme in a workspace that has settled
      // nothing, so this is a no-op until the loop has taught it something.
      const support = (b.outcomeSupport ?? 0) - (a.outcomeSupport ?? 0);
      if (support !== 0) return support;
      const freq = (b.frequency ?? 0) - (a.frequency ?? 0);
      if (freq !== 0) return freq;
      return (b.confidence ?? 0) - (a.confidence ?? 0);
    })
    .slice(0, MAX_PROMOTIONS_PER_SWEEP);
}
