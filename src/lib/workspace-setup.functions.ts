/**
 * WHAT THIS WORKSPACE HAS CONNECTED, SO A STATION THAT FOUND NOTHING CAN SAY
 * WHETHER THERE WAS ANYWHERE TO LOOK.
 *
 * ── WHY IT EXISTS, MEASURED ───────────────────────────────────────────────
 * 23 workspaces on production. **0 scout targets, of any kind, enabled or
 * not.** 124 `sources.status` calls in the whole history of the product, and
 * 124 of them returned `{"active_scout_targets": 0}`. Three workspaces of the
 * 23 have a repository bound; the rest have none.
 *
 * On the run screen that reads as "Discover: nothing found" and "Build filed
 * nothing" -- true sentences that sound like findings about the work, when they
 * are facts about the setup. `nowhere-to-look-yet.ts` holds the decision and
 * refuses to speak without these facts, on purpose: workspaces DO hold signals
 * (1,524 of them, arriving by routes other than a scout), so "found nothing"
 * genuinely means "searched and found nothing" on some of them, and a surface
 * that guessed would be lying half the time.
 *
 * ── ASK THE WORKSPACE, NOT THE AGENT ──────────────────────────────────────
 * The alternative was to read the blocker out of the agent's prose -- "No
 * repository is connected for this workspace" is right there in
 * `agent_runs.output`. S1 named why that is a trap and they are right: pattern
 * matching an English sentence gives a door that vanishes the moment a model
 * rewords it, and an absent door looks exactly like a run that did not need
 * one. An invisible failure is the worst kind to ship.
 *
 * State cannot reword itself. And it generalises past the one case: the shape
 * is "the station is blocked and the thing that station needs is not
 * configured", which is Discover and a source, Build and a repository, Ship and
 * somewhere to release to.
 *
 * ── ONE ROUND OF HOPS ─────────────────────────────────────────────────────
 * Three `head: true` counts in one `Promise.all`, so this is one round trip's
 * latency rather than three. On this Worker a slow function is sequential hops
 * and never the query itself -- the repo has paid for that lesson repeatedly --
 * so the shape matters more than the tables.
 *
 * ── AND EVERY FIELD CAN BE NULL, WHICH IS NOT "NO" ────────────────────────
 * A read that failed and a workspace with nothing connected are different
 * answers, and the surface draws only on the second. `null` here means the
 * count did not come back, so `nowhere-to-look-yet` stays silent rather than
 * telling a person to connect something when we could not tell whether they
 * had. That is the rule `gatesLiveWork`'s docstring spends a paragraph on, and
 * this is the second place it has mattered this week.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { WorkspaceSetup } from "@/components/track/nowhere-to-look-yet";

/**
 * `connection_bindings.resource_kind` for a bound code repository.
 *
 * Read off the column rather than assumed: production holds `repo` (3 rows,
 * 3 workspaces), `channel` and `digest_channel`, so this is the word the
 * writers actually use.
 */
const REPO_KIND = "repo";

/** No deployment-target binding kind exists yet, so the answer is "we cannot say". */
const DEPLOY_TARGET_KIND: string | null = null;

export const getWorkspaceSetup = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ workspaceId: z.string().uuid() }).parse(i ?? {}))
  .handler(async ({ context, data }): Promise<WorkspaceSetup> => {
    const db = context.supabase as unknown as SupabaseClient;
    const w = data.workspaceId;

    const [sources, repos, deploy] = await Promise.all([
      db
        .from("scout_targets")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", w)
        .eq("enabled", true),
      db
        .from("connection_bindings")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", w)
        .eq("resource_kind", REPO_KIND),
      DEPLOY_TARGET_KIND === null
        ? Promise.resolve({ count: null, error: null })
        : db
            .from("connection_bindings")
            .select("id", { count: "exact", head: true })
            .eq("workspace_id", w)
            .eq("resource_kind", DEPLOY_TARGET_KIND),
    ]);

    /*
     * FAIL SOFT, PER FIELD. One count refusing must not take the other two
     * down: a person whose sources read failed can still be told their
     * repository is missing, and the field that failed goes null, which the
     * surface reads as "we did not look" and stays quiet about.
     *
     * `count` can also be null on a successful head request, which is the same
     * answer for this purpose -- we did not get a number -- so both paths
     * collapse to null rather than to `false`, which would be a claim.
     */
    const answer = (r: { count: number | null; error: unknown }): boolean | null =>
      r.error ? null : r.count === null ? null : r.count > 0;

    return {
      sources: answer(sources),
      repository: answer(repos),
      deployTarget: answer(deploy),
    };
  });
