/**
 * The three reads behind Start's home answers (P-62).
 *
 * ── EACH ONE FAILS ON ITS OWN ────────────────────────────────────────────
 *
 * Three independent reads, three independent nulls. One failing must not blank
 * the other two, and none may degrade to zero: `null` means "we could not find
 * out" and the shapes in `three-answers-above-your-runs.ts` draw nothing for
 * it. A single try/catch around all three would turn one refused table into a
 * home that reassures a person about two things it never looked at.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { changelogTitleFor } from "@/lib/changelog";
import type { ReleasedItem } from "@/components/start/three-answers-above-your-runs";

const Scope = z.object({ workspaceId: z.string().uuid().nullable().optional() });

export type HomeAnswerReads = {
  /** Themes that arrived since the person last looked, or on the record at all
   *  when they never have. Null = the read did not answer. */
  arrivingCount: number | null;
  /** The person's own last read of the arriving surface. Null = never, or
   *  unknown; `arrivingCount` is withheld when it is unknown. */
  lastLookedAt: string | null;
  /** Calls graded in the last seven days. */
  learnedCount: number | null;
  /** Releases that reached production since the person last looked (P-126).
   *  Null = the read did not answer. */
  releases: ReleasedItem[] | null;
};

export const readHomeAnswers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => Scope.parse(i ?? {}))
  .handler(async ({ context, data }): Promise<HomeAnswerReads> => {
    const { supabase, userId } = context;

    let workspaceId = data?.workspaceId ?? null;
    if (!workspaceId) {
      const { data: def } = await supabase.rpc("current_user_default_workspace");
      workspaceId = (def as string | null) ?? null;
    }
    // Without a workspace there is nothing to count and nothing honest to say.
    // Unread, never zero: the same rule the three shapes hold to.
    if (!workspaceId) {
      return { arrivingCount: null, lastLookedAt: null, learnedCount: null, releases: null };
    }
    const wid = workspaceId;

    /*
     * THE LAST LOOK IS READ FIRST AND SEPARATELY, because the count depends on
     * it and a failed lookup here must not become "you have never looked" --
     * that would tell a returning person that everything on the record is new.
     */
    const seen = await supabase
      .from("brain_last_seen")
      .select("seen_at")
      .eq("user_id", userId)
      .eq("workspace_id", wid)
      .maybeSingle();
    const seenFailed = Boolean(seen.error);
    const lastLookedAt = seenFailed
      ? null
      : ((seen.data as { seen_at?: string | null } | null)?.seen_at ?? null);

    const head = { count: "exact" as const, head: true };

    let arrivingQ = supabase.from("themes").select("id", head).eq("workspace_id", wid);
    if (lastLookedAt) arrivingQ = arrivingQ.gt("created_at", lastLookedAt);
    const arriving = await arrivingQ;

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const learned = await supabase
      .from("decisions")
      .select("id", head)
      .eq("workspace_id", wid)
      .not("forecast_resolved_at", "is", null)
      .gte("forecast_resolved_at", weekAgo);

    /*
     * WHAT WENT LIVE SINCE YOU LAST LOOKED (P-126). `changelog_entries` HAS NO
     * `production_url` COLUMN OF ITS OWN -- `listChangelog` (changelog.functions.ts)
     * resolves it with a SEPARATE `deployments` read and assigns it onto the
     * row in application code, and this reader follows the same two-query
     * shape rather than inventing a column the live schema does not have.
     * `shouldPublishChangelog` (changelog.ts) already requires a merge with
     * release notes for a `changelog_entries` row to exist at all, but
     * promotion to production is a separate, later act (Ship's own promote
     * flow), so a released row can still have no address -- which is why the
     * production read is what decides "went live", not the changelog read
     * alone.
     *
     * `body` IS SELECTED SO THE TITLE IS RECOMPUTED, NOT TRUSTED (P-124's own
     * incident, one packet up this file's neighbour). `changelog_entries.title`
     * is written once by a DB trigger this reader never runs; reading `body`
     * and recomputing through the one composer is what kept the first live
     * release from reading "Shipped an update" here too.
     */
    let releasedQ = supabase
      .from("changelog_entries")
      .select("title,body,changeset_id,released_at")
      .eq("workspace_id", wid)
      .order("released_at", { ascending: false })
      .limit(20);
    if (lastLookedAt) releasedQ = releasedQ.gt("released_at", lastLookedAt);
    const released = await releasedQ;
    const releasedRows = (released.data ?? []) as Array<{
      title: string;
      body: string | null;
      changeset_id: string | null;
      released_at: string;
    }>;
    const releaseChangesetIds = releasedRows
      .map((r) => r.changeset_id)
      .filter((id): id is string => !!id);
    let releasedUrlByChangeset = new Map<string, string>();
    let releasedDeploysErrored = false;
    if (releaseChangesetIds.length > 0) {
      const { data: deploys, error: deploysErr } = await supabase
        .from("deployments")
        .select("changeset_id,deploy_url")
        .eq("workspace_id", wid)
        .eq("environment", "production")
        .eq("status", "success")
        .in("changeset_id", releaseChangesetIds);
      releasedDeploysErrored = Boolean(deploysErr);
      releasedUrlByChangeset = new Map(
        ((deploys ?? []) as Array<{ changeset_id: string | null; deploy_url: string | null }>)
          .filter((d) => d.changeset_id && d.deploy_url)
          .map((d) => [d.changeset_id as string, d.deploy_url as string]),
      );
    }

    return {
      /*
       * A count is only usable when we know what it counted FROM. With the
       * last-look read failed we cannot tell "since you looked" from "ever", so
       * the count is withheld rather than shown against the wrong baseline.
       */
      arrivingCount: arriving.error || seenFailed ? null : (arriving.count ?? 0),
      lastLookedAt,
      learnedCount: learned.error ? null : (learned.count ?? 0),
      // Same rule as arrivingCount: a released list read against the wrong
      // (or unknown) baseline, or a production-address read that itself
      // failed, is worse than withheld.
      releases:
        released.error || seenFailed || releasedDeploysErrored
          ? null
          : releasedRows
              .map((r) => {
                const url = r.changeset_id ? releasedUrlByChangeset.get(r.changeset_id) : null;
                if (!url) return null;
                return {
                  title: changelogTitleFor({ release_notes: r.body, title: r.title }),
                  url,
                  releasedAt: r.released_at,
                };
              })
              .filter((r): r is ReleasedItem => r !== null),
    };
  });
