import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { forecastDueDate, metricSourcesForTrack } from "@/lib/spine/driver.server";
import {
  onlyAPersonCanGradeThis,
  whatLearnIsWaitingFor,
} from "@/lib/spine/what-learn-is-waiting-for";

/**
 * THE RELEASES THAT SHIPPED AND HAVE NO VERDICT YET, AND WHY (P-147).
 *
 * Outcomes is the door the landing page's fourth verb opens ("grades it,
 * guides the next call"). With one release shipped and graded on nothing, its
 * settle panel said "Nothing has shipped that needs a verdict", which was true
 * before the first release and a lie after it: a release has shipped, it
 * needs a verdict, and the reason it has none is that no source can produce
 * a number for its metric. The run page says so (P-144's composer); Outcomes,
 * the page a person opens to ask "did it work", said nothing.
 *
 * ONE COMPOSER, IMPORTED, NEVER A SECOND SENTENCE. `whatLearnIsWaitingFor` is
 * the sentence the run page's hold card draws, fed by the same two reads the
 * driver makes (`forecastDueDate`, `metricSourcesForTrack`), so Outcomes and
 * the run page cannot describe one release two ways. The two presses the run
 * page offers (connect a source, record a reading) are the surface's; this
 * carries the ids they need and the one fact that decides which to lead with.
 *
 * WHAT COUNTS AS "SHIPPED AND UNGRADED": an open track standing at Learn in
 * this workspace whose members carry a `deployment`. Learn has not returned
 * (the track is still open at Learn) and something went out (the member).
 * Workspace-scoped on the read, as every reader of a workspace table is.
 */
export type ReleaseAwaitingVerdict = {
  trackId: string;
  title: string;
  /** When the release went out, from the deployment member. */
  shippedAt: string | null;
  /** YYYY-MM-DD the forecast comes due, or null when no decision names one. */
  dueOn: string | null;
  /** P-144's sentence, verbatim from the one composer. */
  line: string;
  /** True when nothing connected can grade it, so "connect a source" leads. */
  onlyAPersonCanGrade: boolean;
  /** How the read of the metric sources went: null means it could not be read. */
  sourcesRead: boolean;
};

export const listReleasesAwaitingVerdict = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ workspaceId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ releases: ReleaseAwaitingVerdict[] }> => {
    const supabase = context.supabase as unknown as SupabaseClient;
    const { data: tracks, error } = await supabase
      .from("spine_tracks" as never)
      .select("id,title,updated_at")
      .eq("workspace_id", data.workspaceId)
      .eq("status", "open")
      .eq("station", "learn")
      .order("updated_at", { ascending: false })
      .limit(24);
    // A failed read is thrown, never an empty desk: "nothing has shipped that
    // needs a verdict" is a claim, and a refused read is not evidence for it.
    if (error)
      throw new Error(`The releases waiting on a verdict could not be read: ${error.message}`);
    const rows = (tracks ?? []) as Array<{ id: string; title: string | null }>;
    if (rows.length === 0) return { releases: [] };

    const { data: members, error: membersErr } = await supabase
      .from("spine_track_members" as never)
      .select("track_id,created_at")
      .in(
        "track_id",
        rows.map((r) => r.id),
      )
      .eq("artifact_kind", "deployment")
      .order("created_at", { ascending: true });
    if (membersErr) {
      throw new Error(`The releases waiting on a verdict could not be read: ${membersErr.message}`);
    }
    const shippedAt = new Map<string, string>();
    for (const m of (members ?? []) as Array<{ track_id: string; created_at: string }>) {
      if (!shippedAt.has(m.track_id)) shippedAt.set(m.track_id, m.created_at);
    }

    const releases: ReleaseAwaitingVerdict[] = [];
    for (const t of rows) {
      if (!shippedAt.has(t.id)) continue;
      const [dueIso, states] = await Promise.all([
        forecastDueDate(supabase, t.id),
        metricSourcesForTrack(supabase, t.id),
      ]);
      releases.push({
        trackId: t.id,
        title: t.title ?? "",
        shippedAt: shippedAt.get(t.id) ?? null,
        dueOn: dueIso ? dueIso.slice(0, 10) : null,
        line: dueIso
          ? whatLearnIsWaitingFor(dueIso, states)
          : "No forecast names a date, so Learn has nothing to grade this against until one does.",
        onlyAPersonCanGrade: onlyAPersonCanGradeThis(states),
        sourcesRead: states !== null,
      });
    }
    return { releases };
  });
