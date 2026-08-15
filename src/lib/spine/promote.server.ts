/**
 * Turning qualifying clusters into work, on a sweep, with nobody watching.
 *
 * The rule itself is pure and tested in ./promote.ts; this is the I/O around it.
 * The split matters here more than usual, because the rule decides what the
 * platform spends money on unattended and that has to be assertable without a
 * database.
 *
 * WHAT KEEPS THIS SAFE, in the order the failures would actually happen:
 *
 *   1. It only ever considers clusters with no track. `spine_tracks.theme_id`
 *      carries a partial UNIQUE index, so even two overlapping sweeps cannot
 *      both promote one cluster: the second insert is refused by the database
 *      rather than by a check that raced.
 *   2. It is bounded per sweep (MAX_PROMOTIONS_PER_SWEEP), so the first run
 *      against a backlog of 181 themes opens two pieces of work and not 181.
 *   3. Everything it starts is bounded downstream by the track spend ceiling,
 *      which already exists and already fails closed.
 *   4. It never re-promotes something a person settled. A dismissed or merged
 *      theme has had human judgment applied, and no bar may overrule that.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { startTrackCore } from "@/lib/spine/track.functions";
import {
  DEFAULT_PROMOTION_BAR,
  originFor,
  qualifies,
  rankForPromotion,
  type PromotionBar,
  type ThemeLike,
} from "@/lib/spine/promote";
// The SAME rule /decide and /today fold outcomes with. A second copy of this
// arithmetic here would let the promotion bar and the ranking disagree about what
// a theme's history is, which is the one thing this term exists to prevent.
import { outcomeSupportFromCounts } from "@/components/discover/ranking";

export type PromotionOutcome = {
  themeId: string;
  title: string;
  trackId: string | null;
  why: string;
};

/**
 * What one sweep did, in a shape that can tell three different zeroes apart.
 *
 * WHY THIS IS NOT JUST AN ARRAY, and it is the whole reason promotion could not
 * be verified after it shipped. Three completely different things all used to
 * return an empty list:
 *
 *   1. Nothing cleared the bar. The common, correct, healthy outcome.
 *   2. The link column does not exist yet, because the migration is committed
 *      and not applied. Nothing can ever be promoted, and nothing says so.
 *   3. The themes read failed outright.
 *
 * The founder's verification query is `select ... from spine_tracks where
 * theme_id is not null`, and it returns zero rows in ALL THREE cases, so no
 * amount of looking at the database can distinguish "working and nothing
 * qualified" from "structurally dead". That is the same defect this codebase
 * keeps deleting under a different name: the driver advancing on silence, a
 * station that filed nothing looking identical to one that did its job.
 *
 * So the sweep now states which zero it is, and `cron.cluster-tick` returns it
 * in its response body. One authenticated POST to the hook answers the question
 * that no SQL query against the result table can.
 */
export type PromotionSweep = {
  /** One entry per theme it actually tried. */
  outcomes: PromotionOutcome[];
  /**
   * Why the sweep could not run at all, in plain words. Null when it ran, even
   * if it ran and promoted nothing. This is the difference between "no" and
   * "we never got to ask".
   */
  blocked: string | null;
  /** How many themes cleared the bar, before the per-sweep bound was applied. */
  qualified: number;
  /** How many clusters have already become work, so a zero can be read. */
  alreadyPromoted: number;
  /**
   * How many settled outcomes informed this sweep's ordering and its bar.
   *
   * Reported rather than inferred, because zero is the honest and CURRENT answer
   * for most workspaces and it has to be distinguishable from "we could not read
   * them". Null means the read failed and the sweep ran on evidence alone.
   */
  learnedFrom: number | null;
};

/**
 * What acting on each cluster has already taught this workspace.
 *
 * A learning attaches to a bet (`learnings.opportunity_id`) and a bet carries the
 * cluster it came from (`opportunities.theme_id`), so the theme a verdict is
 * about is two hops away. This is the same join `brain/push-insights.server.ts`
 * already makes for the /today lane, deliberately, so the two paths cannot
 * disagree about what a theme's history is.
 *
 * FAILS OPEN AND SAYS SO. On any read error every theme gets support 0, which is
 * exactly the behaviour this sweep had before the term existed, and `learnedFrom`
 * comes back null so the caller can tell an unread history from an empty one. A
 * promotion sweep must not stop because a secondary read failed; it must also not
 * claim it consulted history it never saw.
 */
async function outcomeSupportByTheme(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ support: Map<string, number>; learnedFrom: number | null }> {
  const { data, error } = await supabase
    .from("learnings")
    .select("verdict,prd_id,opportunity:opportunities(theme_id)")
    .eq("user_id", userId)
    .in("verdict", ["validated", "missed"]);

  if (error || !data) return { support: new Map(), learnedFrom: null };

  const rows = data as unknown as Array<{
    verdict: string | null;
    prd_id: string | null;
    opportunity: { theme_id: string | null } | null;
  }>;

  /**
   * AND THE SECOND ROUTE TO A THEME, WITHOUT WHICH THIS TERM WOULD NEVER FIRE ON
   * THE PATH IT WAS BUILT FOR.
   *
   * The bet route above is the human one. On the autonomous route there IS no bet:
   * `prd.draft`'s own description says "nothing in this toolset creates an
   * opportunity ... pass brief instead", so a driver-run Plan writes a spec with
   * `opportunity_id` null, and a verdict against that spec reaches no theme however
   * correctly it was attached. The sweep would have read a history that was
   * structurally always empty and reported a confident zero.
   *
   * The lineage is already on the record, one hop across instead of down: the
   * driver files the spec as a track member, and the track carries the cluster it
   * was promoted from. So spec -> track -> theme resolves what bet -> theme cannot,
   * with no schema change and no invented link.
   *
   * Two bounded reads, only for the learnings the first route could not place, and
   * a failure here simply leaves those unattributed rather than discarding the ones
   * that did resolve.
   */
  const orphanSpecIds = [
    ...new Set(
      rows.filter((r) => !r.opportunity?.theme_id && r.prd_id).map((r) => r.prd_id as string),
    ),
  ];
  const themeBySpec = new Map<string, string>();
  if (orphanSpecIds.length > 0) {
    const { data: memberRows } = await supabase
      .from("spine_track_members" as never)
      .select("artifact_id,track_id")
      .eq("artifact_kind", "prd")
      .in("artifact_id", orphanSpecIds);
    const trackBySpec = new Map<string, string>();
    for (const m of (memberRows ?? []) as unknown as Array<{
      artifact_id: string;
      track_id: string;
    }>) {
      trackBySpec.set(m.artifact_id, m.track_id);
    }
    const trackIds = [...new Set(trackBySpec.values())];
    if (trackIds.length > 0) {
      const { data: trackRows } = await supabase
        .from("spine_tracks" as never)
        .select("id,theme_id")
        .in("id", trackIds);
      const themeByTrack = new Map<string, string>();
      for (const t of (trackRows ?? []) as unknown as Array<{
        id: string;
        theme_id: string | null;
      }>) {
        if (t.theme_id) themeByTrack.set(t.id, t.theme_id);
      }
      for (const [specId, trackId] of trackBySpec) {
        const themeId = themeByTrack.get(trackId);
        if (themeId) themeBySpec.set(specId, themeId);
      }
    }
  }

  const counts = new Map<string, { validated: number; missed: number }>();
  for (const row of rows) {
    // The bet's theme first, so the human route's answer always wins where it has
    // one, and the track is consulted only where it does not.
    const themeId =
      row.opportunity?.theme_id ?? (row.prd_id ? themeBySpec.get(row.prd_id) : null) ?? null;
    if (!themeId) continue;
    const seen = counts.get(themeId) ?? { validated: 0, missed: 0 };
    if (row.verdict === "validated") seen.validated += 1;
    else if (row.verdict === "missed") seen.missed += 1;
    counts.set(themeId, seen);
  }

  const support = new Map<string, number>();
  let attributed = 0;
  for (const [themeId, c] of counts) {
    support.set(themeId, outcomeSupportFromCounts(c.validated, c.missed));
    // Counts the outcomes that could be ATTRIBUTED to a cluster, not every row
    // read: a verdict with no bet behind it taught this sweep nothing.
    attributed += c.validated + c.missed;
  }
  return { support, learnedFrom: attributed };
}

/**
 * Postgres and PostgREST for "that column is not there".
 *
 * The pre-migration window is real and expected in this project: migrations are
 * committed here and applied by Lovable on publish, so any code that reads a
 * freshly added column must be able to name that state rather than crash or,
 * worse, shrug.
 */
function isMissingColumn(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  if (code === "42703" || code === "PGRST204" || code === "42P01") return true;
  const message = (error as { message?: string } | null)?.message ?? "";
  return /column .* does not exist|could not find the .* column/i.test(message);
}

/**
 * Promote what qualifies, for one user, once.
 *
 * Returns what it did rather than throwing, because this runs inside a cron
 * sweep where one user's failure must never stop the rest.
 *
 * `bar` is the workspace's own bar when it has stated one, and it defaults to
 * the platform bar so a caller that passes nothing gets exactly the behaviour
 * this function had before the argument existed. The reason it is an argument
 * rather than a read inside here: the canon's fourth floor makes the three
 * numbers the workspace's policy rather than ours, and resolving policy is the
 * caller's job in this codebase (the tick already knows which workspace it is
 * sweeping; this function only knows an owner).
 */
export async function promoteClustersOnce(
  supabase: SupabaseClient,
  userId: string,
  bar: PromotionBar = DEFAULT_PROMOTION_BAR,
): Promise<PromotionSweep> {
  const nothing = { outcomes: [], qualified: 0, alreadyPromoted: 0, learnedFrom: null };

  // Only clusters that have never become work. Reading the tracks first and
  // excluding by id keeps this to two queries rather than one per theme.
  const { data: taken, error: takenErr } = await supabase
    .from("spine_tracks" as never)
    .select("theme_id")
    .eq("user_id", userId)
    .not("theme_id", "is", null);

  // THIS READ USED TO IGNORE ITS ERROR, and that single ignored error is what
  // made the feature unverifiable. Without `theme_id` the read fails, `already`
  // becomes empty, the sweep proceeds as if no cluster had ever been promoted,
  // and then every insert fails on the same missing column. The result was a
  // silent, permanent zero that looked exactly like a quiet, healthy workspace.
  if (takenErr) {
    return {
      ...nothing,
      blocked: isMissingColumn(takenErr)
        ? "spine_tracks.theme_id does not exist yet, so no cluster can become work. Apply migration 20260802020000_promote_clusters_to_work.sql."
        : `Could not read which clusters are already promoted: ${takenErr.message}`,
    };
  }

  const already = new Set(
    ((taken ?? []) as unknown as Array<{ theme_id: string }>).map((r) => r.theme_id),
  );

  const { data: rows, error } = await supabase
    .from("themes")
    .select("id,title,summary,frequency,severity,confidence,status,workspace_id,product_id")
    .eq("user_id", userId)
    // Cheap pre-filter on the strongest single condition so the bar below reads
    // a small set. The real gate is `qualifies`, which checks all three.
    .gte("severity", bar.minSeverity)
    // ORDERED, and the order matters more than it looks. `limit` without an
    // `order by` returns an ARBITRARY 200 rows: Postgres makes no promise, and
    // the set it picks can change between two calls with no data change. So the
    // moment a workspace holds more than 200 themes at this severity, an
    // unordered window would hand `rankForPromotion` a random subset, the
    // strongest theme in the workspace could sit outside it, and the sweep would
    // quietly promote the second-best while reporting nothing unusual. Worse,
    // the failure is indistinguishable from "nothing qualified", which is the
    // most common honest outcome, so it would never be noticed.
    //
    // This is the same order `rankForPromotion` applies, so the window and the
    // ranking agree and the 200 rows read here are provably the 200 that could
    // win. It is not a substitute for the pure ranking, which still decides.
    .order("severity", { ascending: false })
    .order("frequency", { ascending: false })
    .order("confidence", { ascending: false })
    .limit(200);
  if (error || !rows) {
    return {
      ...nothing,
      alreadyPromoted: already.size,
      blocked: `Could not read the clusters: ${error?.message ?? "the themes read returned nothing"}`,
    };
  }

  // WHAT HAPPENED LAST TIME, read once for the whole sweep rather than per theme.
  const learned = await outcomeSupportByTheme(supabase, userId);

  const candidates = (
    rows as unknown as Array<ThemeLike & { workspace_id: string | null; product_id: string | null }>
  )
    .filter((t) => !already.has(t.id))
    // Stamped onto the candidate so the PURE rule decides. The alternative was a
    // second filter here, which would put half the promotion policy in a file
    // that cannot be tested without a database.
    .map((t) => ({ ...t, outcomeSupport: learned.support.get(t.id) ?? 0 }));

  // Counted BEFORE the per-sweep bound, so the sweep can say "nine cleared the
  // bar and I took the two strongest" rather than only ever reporting two. A
  // reader needs the backlog to know whether the bound is doing any work.
  const qualified = candidates.filter((t) => qualifies(t, bar).ok).length;
  const picked = rankForPromotion(candidates, bar);
  const done: PromotionOutcome[] = [];

  for (const theme of picked) {
    const full = candidates.find((c) => c.id === theme.id);
    const result = await startTrackCore(supabase, userId, {
      title: theme.title!.trim(),
      // THE SHAPE IS NOT KNOWN YET, and that is the honest position: what to
      // build about a cluster of complaints is precisely what Decide exists to
      // work out. `new-capability` is chosen for its ROUTE, not its label: it
      // is the only shape that enters at Discover with nothing waived, so the
      // work walks the whole loop and every station that exists to test whether
      // this is worth doing actually runs. Entering lower would waive exactly
      // those stations on a guess nobody made.
      shape: "new-capability",
      origin: originFor(theme, bar),
      productId: full?.product_id ?? null,
      workspaceId: full?.workspace_id ?? null,
      themeId: theme.id,
    });
    /**
     * SAY SO ON THE THEME. The autonomous path used to leave no mark on the row
     * it acted upon.
     *
     * `startTrackCore` writes `spine_tracks.theme_id` and nothing else, and this
     * function never touched `themes.status`. The manual Gate does
     * (`discovery.functions.ts`), so the product had TWO promotion paths writing
     * TWO different records of the same event: 2 themes carrying
     * `status = 'promoted'` from the Gate, and 42 promoted by this sweep
     * carrying no mark at all.
     *
     * ANYONE ASKING THE OBVIOUS QUESTION GOT THE WRONG ANSWER. "Was this theme
     * promoted?" reads `themes.status`, and for everything this sweep did the
     * answer was no. That has now produced the same false alarm twice on the
     * same day: first "the promotion bar is mathematically unreachable", then
     * "seven themes clear the bar and sit unpromoted". Both were investigated as
     * defects. Both were the sweep working correctly and saying nothing. The gap
     * was already known and written down in `brain/insights.functions.ts`, which
     * is the part worth noticing: a documented gap is not a closed one.
     *
     * Fail-soft and after the fact, matching the Gate: the track is the real
     * outcome and a status write must never fail a promotion that succeeded.
     * Only on a track that actually started, because a refusal is not a
     * promotion.
     *
     * THE EXISTING 42 ARE DELIBERATELY NOT BACKFILLED. Most sit in `active`,
     * `at_risk` or `confirmed` — Discover's own escalation states — and
     * overwriting those destroys a signal a person put there to answer a
     * different question. Forward-only is the honest fix; the historical rows
     * are readable through `spine_tracks.theme_id`, which is where they were
     * recorded at the time.
     */
    if (result.track) {
      const { error: statusErr } = await supabase
        .from("themes")
        .update({ status: "promoted" })
        .eq("id", theme.id);
      if (statusErr) {
        console.error(
          `[promote] track ${result.track.id} started but theme ${theme.id} status not marked: ${statusErr.message}`,
        );
      }
    }
    done.push({
      themeId: theme.id,
      title: theme.title ?? "",
      trackId: result.track?.id ?? null,
      why: result.track ? "started" : (result.problems[0] ?? "refused"),
    });
  }

  // A theme that cleared the bar and whose insert was refused for the SAME
  // structural reason is still a blocked sweep, not a quiet one. Without this,
  // `theme_id` missing on the write side alone (the read having somehow
  // succeeded) would report "two attempted, none started" with no cause.
  const structural = done.every((d) => d.trackId === null) && done.length > 0;
  return {
    outcomes: done,
    qualified,
    alreadyPromoted: already.size,
    learnedFrom: learned.learnedFrom,
    blocked: structural ? `Nothing could be started: ${done[0].why}` : null,
  };
}
