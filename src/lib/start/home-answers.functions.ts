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
  /**
   * How many of those actually MOVED THE RECORD (Lane 1, 2026-09-09).
   *
   * The answer's sentence asserted "and the record was re-scored" for every
   * graded decision, unconditionally. Measured on the founder's own workspace:
   * the one decision that came back this week carries `prior_ice` and `new_ice`
   * both null, so nothing was re-scored and the entry said it was. The new
   * evidence region under that line, showing the same decision with no
   * re-score, is what made the two disagree in one glance.
   *
   * Null = the read did not answer, and the clause is then withheld rather
   * than guessed at in either direction.
   */
  rescoredCount: number | null;
  /** Releases that reached production since the person last looked (P-126).
   *  Null = the read did not answer. */
  releases: ReleasedItem[] | null;
  /**
   * THE NEWEST PIECE OF WORK THAT WENT ALL THE WAY ROUND, with what was
   * committed to, what came back, and the verdict (Lane 1, 2026-09-09).
   *
   * Null = the read did not answer. `undefined` is not used: the shape must be
   * able to say "the loop has never closed here", which is a real and different
   * state from "we could not look", and an empty read says it by returning a
   * row-less answer rather than a null.
   */
  closed: ClosedLoop | null;
  /** False when the read answered and found nothing. Distinguishes "never
   *  closed" from "could not look", which `closed: null` alone cannot. */
  closedRead: boolean;
};

/**
 * One closed loop, as the entry states it.
 *
 * `summary` is the grader's own sentence and is NOT recomposed here. It already
 * carries the commitment and the result in the form a person reads them ("Spec
 * required <=5% abandonment ... Actual outcome: ... far above target"), and a
 * second rewriting of it on the way to the screen is how two surfaces end up
 * describing one verdict differently.
 */
export type ClosedLoop = {
  /** The grader's word. Mapped to a status hue by the shape, never here. */
  verdict: string;
  /** The grader's own sentence: what was committed to and what came back. */
  summary: string;
  /** What the run decided, which is the subject the verdict is about. */
  decisionTitle: string | null;
  /** The re-score, when the verdict moved the record. Both or neither. */
  priorIce: number | null;
  newIce: number | null;
  /** When the forecast resolved, not when the row was written. */
  at: string;
  /** Seed rows are marked so the entry never presents them as the founder's
   *  own results. This repo has already paid for that once: three metrics
   *  proving the product worked were all sample data. */
  isSample: boolean;
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
      return {
        arrivingCount: null,
        lastLookedAt: null,
        learnedCount: null,
        rescoredCount: null,
        releases: null,
        /* `closedRead: false` and not true: without a workspace nothing was
           looked at, so this is "could not look", never "never closed". */
        closed: null,
        closedRead: false,
      };
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
     * The re-score lives on `learnings`, not on `decisions`, so it is its own
     * head count rather than a field on the one above. A row counts only when
     * BOTH scores are present: half a re-score is not a movement, which is the
     * same rule the evidence region's own line holds to.
     */
    const rescored = await supabase
      .from("learnings")
      .select("id", head)
      .eq("workspace_id", wid)
      .not("prior_ice", "is", null)
      .not("new_ice", "is", null)
      .gte("created_at", weekAgo);

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

    /*
     * ── WHETHER IT WORKED, WHICH THE ENTRY COULD NOT SAY ────────────────────
     * Added 2026-09-09. The home stated what is waiting and what arrived, and
     * nothing anywhere on it said the loop had ever closed. Measured on the
     * founder's own workspace: 67 decisions, 38 specs, 37 prototypes and 12
     * graded outcomes, and the entry surfaced two sentences about any of it.
     *
     * ORDERED BY WHEN THE FORECAST RESOLVED, not by when the row was written.
     * A learning row is written when the grader runs; the fact a person cares
     * about is when the answer came back. The two differ by days here.
     *
     * ITS OWN READ AND ITS OWN NULL, like the three above it. A refused
     * learnings table must not blank the arriving count.
     */
    const closedQ = await supabase
      .from("learnings")
      .select(
        "verdict,summary,prior_ice,new_ice,is_sample,created_at,decisions(title,forecast_resolved_at)",
      )
      .eq("workspace_id", wid)
      .not("verdict", "is", null)
      .not("summary", "is", null)
      .order("created_at", { ascending: false })
      .limit(1);
    const closedRow = (closedQ.data ?? [])[0] as
      | {
          verdict: string | null;
          summary: string | null;
          prior_ice: number | null;
          new_ice: number | null;
          is_sample: boolean | null;
          created_at: string;
          decisions: { title: string | null; forecast_resolved_at: string | null } | null;
        }
      | undefined;

    return {
      /*
       * A count is only usable when we know what it counted FROM. With the
       * last-look read failed we cannot tell "since you looked" from "ever", so
       * the count is withheld rather than shown against the wrong baseline.
       */
      arrivingCount: arriving.error || seenFailed ? null : (arriving.count ?? 0),
      lastLookedAt,
      learnedCount: learned.error ? null : (learned.count ?? 0),
      rescoredCount: rescored.error ? null : (rescored.count ?? 0),
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
      closedRead: !closedQ.error,
      closed:
        closedQ.error || !closedRow || !closedRow.verdict || !closedRow.summary
          ? null
          : {
              verdict: closedRow.verdict,
              summary: closedRow.summary,
              decisionTitle: closedRow.decisions?.title ?? null,
              /* Both or neither: half a re-score is not a movement, and
                 "58 to null" is the kind of sentence a reader has to decode. */
              priorIce:
                closedRow.prior_ice != null && closedRow.new_ice != null
                  ? Number(closedRow.prior_ice)
                  : null,
              newIce:
                closedRow.prior_ice != null && closedRow.new_ice != null
                  ? Number(closedRow.new_ice)
                  : null,
              at: closedRow.decisions?.forecast_resolved_at ?? closedRow.created_at,
              isSample: closedRow.is_sample === true,
            },
    };
  });
