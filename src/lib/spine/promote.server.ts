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
  rankForPromotion,
  type ThemeLike,
} from "@/lib/spine/promote";

export type PromotionOutcome = {
  themeId: string;
  title: string;
  trackId: string | null;
  why: string;
};

/**
 * Promote what qualifies, for one user, once.
 *
 * Returns what it did rather than throwing, because this runs inside a cron
 * sweep where one user's failure must never stop the rest.
 */
export async function promoteClustersOnce(
  supabase: SupabaseClient,
  userId: string,
): Promise<PromotionOutcome[]> {
  // Only clusters that have never become work. Reading the tracks first and
  // excluding by id keeps this to two queries rather than one per theme.
  const { data: taken } = await supabase
    .from("spine_tracks" as never)
    .select("theme_id")
    .eq("user_id", userId)
    .not("theme_id", "is", null);

  const already = new Set(
    ((taken ?? []) as unknown as Array<{ theme_id: string }>).map((r) => r.theme_id),
  );

  const { data: rows, error } = await supabase
    .from("themes")
    .select("id,title,summary,frequency,severity,confidence,status,workspace_id,product_id")
    .eq("user_id", userId)
    // Cheap pre-filter on the strongest single condition so the bar below reads
    // a small set. The real gate is `qualifies`, which checks all three.
    .gte("severity", DEFAULT_PROMOTION_BAR.minSeverity)
    .limit(200);
  if (error || !rows) return [];

  const candidates = (
    rows as unknown as Array<ThemeLike & { workspace_id: string | null; product_id: string | null }>
  ).filter((t) => !already.has(t.id));

  const picked = rankForPromotion(candidates);
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
      origin: originFor(theme),
      productId: full?.product_id ?? null,
      workspaceId: full?.workspace_id ?? null,
      themeId: theme.id,
    });
    done.push({
      themeId: theme.id,
      title: theme.title ?? "",
      trackId: result.track?.id ?? null,
      why: result.track ? "started" : (result.problems[0] ?? "refused"),
    });
  }

  return done;
}
