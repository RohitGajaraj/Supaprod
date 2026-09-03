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
    if (!workspaceId) return { arrivingCount: null, lastLookedAt: null, learnedCount: null };
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

    return {
      /*
       * A count is only usable when we know what it counted FROM. With the
       * last-look read failed we cannot tell "since you looked" from "ever", so
       * the count is withheld rather than shown against the wrong baseline.
       */
      arrivingCount: arriving.error || seenFailed ? null : (arriving.count ?? 0),
      lastLookedAt,
      learnedCount: learned.error ? null : (learned.count ?? 0),
    };
  });
