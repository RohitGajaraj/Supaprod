import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { upsertBriefItemCore } from "@/lib/briefs.functions";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { getTrackSeed, type OnboardingTrack } from "@/lib/onboarding/track-seeds";
import { callModel } from "@/lib/ai/runtime.server";
import { resolveBestAgentModel } from "@/lib/ai/platform-keys.server";
import {
  parseStarterRuns,
  readStarterRunsRefusal,
  readStoredStarterRuns,
  STARTER_RUNS_SYSTEM,
  starterRunsPrompt,
  type StarterRun,
  STARTER_RUNS_CLAIM_MS,
  starterRunsState,
} from "@/lib/starter-runs";
import { ONBOARDING_MILESTONES, type ActivationMoment } from "@/lib/activation.functions";

/**
 * Record a moment from inside a server handler that already holds a verified
 * session. Lazy import for the same reason the funnel import always was: this
 * module is imported by a client component (FirstRun, and ObsidianOnboarding
 * before it), and the registry reaches the admin Supabase client.
 *
 * The moment is recorded server-side ON PURPOSE. The client fires the same
 * moments too, and both resolve to one row (the funnel ledger deduplicates in
 * the database, the stream deduplicates per user per name), but only this
 * side survives a browser that navigated away mid-request. On launch day that
 * is the difference between a drop-off you can see and one you cannot.
 */
async function noteMoment(
  moment: ActivationMoment,
  userId: string,
  workspaceId: string | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const { recordActivationMoment } = await import("@/lib/activation.functions");
  await recordActivationMoment({ moment, userId, workspaceId, metadata });
}

/**
 * Resolve the caller's default workspace, creating one (with an owner membership)
 * if none exists yet.
 *
 * WHY THIS EXISTS: post-tenancy-retrofit (migration 20260530120200_tenancy_c), the
 * write RLS on projects/signals/opportunities is `is_workspace_member(workspace_id)`,
 * and workspace_id only auto-fills from the `current_user_default_workspace()` column
 * default — which returns the caller's earliest workspace_members row. A brand-new
 * user reaches onboarding (the very first write they make) before they reliably have
 * that row: handle_new_user() runs ensure_default_workspace() inside a swallow-all
 * EXCEPTION block, that function isn't in our migrations (Lovable-managed, drift-prone),
 * and demo accounts skip it entirely. With no membership the default resolves to NULL,
 * so `is_workspace_member(NULL)` is false and the INSERT is rejected with
 * "new row violates row-level security policy for table projects".
 *
 * This makes the onboarding seed self-healing and matches the intended path documented
 * in migration C ("set workspace_id explicitly in server functions"). The user-scoped
 * client is permitted by RLS to create its own workspace (owner_id = auth.uid()) and
 * the owner membership row (the "owner manages members" policy).
 */
async function ensureDefaultWorkspace(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string> {
  // 1. Fast path: the membership-backed default resolver (same value the column default uses).
  const { data: existing } = await supabase.rpc("current_user_default_workspace");
  if (existing) return existing as string;

  // 2. The user may already OWN a workspace whose membership row never got created
  //    (partial signup provisioning). Reuse it rather than spawning a duplicate.
  const { data: owned, error: ownedError } = await supabase
    .from("workspaces")
    .select("id")
    .eq("owner_id", userId)
    .order("created_at")
    .limit(1);
  if (ownedError) throw ownedError;

  let workspaceId: string;
  if (owned && owned.length > 0) {
    workspaceId = owned[0].id;
  } else {
    const { data: created, error: createWsError } = await supabase
      .from("workspaces")
      // account_id is auto-filled by the trg_set_workspace_account DB trigger.
      .insert([{ owner_id: userId, name: "My Workspace" } as never])
      .select("id")
      .single();
    if (createWsError) throw createWsError;
    if (!created) throw new Error("Workspace creation returned no data");
    workspaceId = created.id;
  }

  // 3. Ensure the owner membership row exists — this is what every table's RLS keys on.
  const { error: memberError } = await supabase
    .from("workspace_members")
    .upsert([{ workspace_id: workspaceId, user_id: userId, role: "owner" }], {
      onConflict: "workspace_id,user_id",
      ignoreDuplicates: true,
    });
  if (memberError) throw memberError;

  return workspaceId;
}

/**
 * SEAM-1: stage history for seeded opportunities (creation into "backlog",
 * actor "system"). One bulk insert, same row shape as recordStageEvent, and
 * fail-safe by the same contract — a history write must never abort a seed.
 * stage_events is newer than the generated types, hence the structural cast.
 */
async function recordSeedOpportunityStageEvents(
  supabase: SupabaseClient<Database>,
  opportunityIds: string[],
  workspaceId: string,
  userId: string,
): Promise<void> {
  if (opportunityIds.length === 0) return;
  try {
    const { error } = await (
      supabase as unknown as {
        from(table: string): {
          insert(
            values: Record<string, unknown>[],
          ): PromiseLike<{ error: { message: string } | null }>;
        };
      }
    )
      .from("stage_events")
      .insert(
        opportunityIds.map((id) => ({
          entity_type: "opportunity",
          entity_id: id,
          from_stage: null,
          to_stage: "backlog",
          actor: "system",
          workspace_id: workspaceId,
          user_id: userId,
        })),
      );
    if (error) console.error(`stage_events seed write failed: ${error.message}`);
  } catch (e) {
    console.error(`stage_events seed write threw: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/**
 * THE SEED, as a plain function: `openFirstRun` runs it with the rest of the
 * door's work on the request's own client instead of as one of seven
 * nested server-function hops (Lane 1's fourth review, 2026-09-09).
 */
export async function seedWorkspaceCore(
  supabase: SupabaseClient<Database>,
  userId: string,
  track: OnboardingTrack,
): Promise<{
  success: boolean;
  alreadySeeded: boolean;
  workspaceId: string | null;
  projectId: string | null;
  signalsCount: number;
  opportunitiesCount: number;
}> {
  {
    const seed = getTrackSeed(track);

    try {
      // 1. Guard: already seeded? Return success (not an error) so a user
      //    resuming an interrupted onboarding flows straight to the next step.
      //
      //    SW-6 fixes two audit findings here: (a) the old guard read `data`
      //    from a head:true count query, but head queries return the count in
      //    `count` and `data` is always empty, so the guard could never fire;
      //    (b) it counted SIGNALS, but with auto-sensing on by default the
      //    sense-tick demo top-up can insert signals into a brand-new
      //    workspace BEFORE the user picks a track, which would falsely trip
      //    the guard. Opportunities are only created by seeding (or later by
      //    the user), so they are the honest "did the track seed run" marker.
      const { count: existingOpps, error: countError } = await supabase
        .from("opportunities")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

      if (countError) throw countError;
      if ((existingOpps ?? 0) > 0) {
        // The workspace id travels back even on the fast-forward, for the same
        // reason it does on a genuine seed (see the return below): the client
        // has no workspace of its own to name yet. Read-only and best-effort on
        // purpose - this branch's whole job is to be the cheap path, so it
        // resolves an EXISTING default and never creates one.
        const { data: resumedWorkspaceId } = await supabase.rpc("current_user_default_workspace");
        return {
          success: true,
          alreadySeeded: true,
          workspaceId: (resumedWorkspaceId as string | null) ?? null,
          projectId: null,
          signalsCount: 0,
          opportunitiesCount: 0,
        };
      }

      // 2. Resolve (or create) the caller's default workspace. Every insert below is
      //    scoped to it explicitly — the membership-keyed RLS requires workspace_id to
      //    name a workspace the caller belongs to, and a brand-new user may not yet have
      //    one provisioned. See ensureDefaultWorkspace() above.
      const workspaceId = await ensureDefaultWorkspace(supabase, userId);

      // 3. Get or create the active project
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id")
        .eq("user_id", userId)
        .limit(1);

      if (projectsError) throw projectsError;

      let projectId: string;
      if (!projects || projects.length === 0) {
        /*
         * NAMED AFTER THE WORKSPACE, NOT AFTER AN EXAMPLE.
         *
         * This used `seed.projectName` -- "Example: Mobile App Roadmap",
         * "Example: Startup MVP", "Example: Developer Platform". That name was
         * honest while the seed put four example signals and four example bets
         * inside it. With those gone (see the block below) it labels an EMPTY
         * container as an example of nothing, which promises more than the old
         * version did and delivers less.
         *
         * `ensureDefaultProduct` already names a project after its workspace,
         * and that is the product's own convention for the same object. Reusing
         * it means one naming rule rather than two.
         */
        const { data: ws } = await supabase
          .from("workspaces")
          .select("name")
          .eq("id", workspaceId)
          .maybeSingle();
        const projectName = ((ws as { name?: string } | null)?.name ?? "").trim() || "My product";
        const { data: newProject, error: createError } = await supabase
          .from("projects")
          .insert([{ user_id: userId, workspace_id: workspaceId, name: projectName }])
          .select("id")
          .single();

        if (createError) throw createError;
        if (!newProject) throw new Error("Project creation returned no data");
        projectId = newProject.id;
      } else {
        projectId = projects[0].id;
      }

      /*
       * ── 4 & 5. THE INVENTED ROWS ARE GONE (P-33, founder's ruling via A1,
       *    2026-09-03) ─────────────────────────────────────────────────────
       *
       * This inserted four signals and their opportunities into the person's
       * REAL workspace at step 1 of onboarding. They were invented: "90% of
       * sign-ups drop after day 1", "Competitor just launched push
       * notifications", "Premium tier at 8% conversion". Specific, alarming,
       * numeric, and about a product the reader has told us nothing about.
       *
       * ── WHAT WAS TRIED FIRST, AND WHY IT WAS NOT ENOUGH ─────────────────
       * On 2026-08-05 they were marked `is_sample` and labelled, because the
       * comment that stood here had already reached the right diagnosis: "for a
       * product whose whole claim is that its judgement is grounded in YOUR
       * record, that reads as a faked demo." Labelling answers a smaller
       * question than the one that was asked. A label says "this is an example";
       * it does not stop Decide from opening on four bets nobody made, and it
       * does not stop those rows being real enough for the loop to pick up and
       * spend money on.
       *
       * P-33's rule is flat: no placeholder that looks like data, and no number
       * the workspace does not have. Four fabricated percentages in a real
       * workspace are both.
       *
       * ── AND THERE IS ALREADY AN HONEST DOOR ────────────────────────────
       * A full record IS worth showing somebody on their first day. That is what
       * the sample workspace is for, and it is honest because it is somebody
       * else's workspace and says so. Borrowing its shape into the person's own
       * is the part that was never true.
       *
       * A real workspace now starts empty, which is the state P-33 exists to
       * design rather than to paper over.
       */
      // 6. Deliberately NOT marking the profile onboarded here (SW-6 audit
      //    fix): this runs at STEP 1 of 4, and flipping the flag this early
      //    meant any interruption (notably the GitHub full-page install
      //    redirect) permanently skipped the connect/critic/coach steps. The
      //    flag is now written only by completeOnboarding at the finish step;
      //    an interrupted user is routed back here and the alreadySeeded
      //    guard above fast-forwards them.

      // 7. The funnel's "data arrived" moment, fired from the server that did
      //    the arriving. The sample-track seed is one of the three ways this
      //    product's onboarding puts data in a workspace, and the client
      //    already counted it as one (afterConnected runs on this path), so
      //    this changes who reports it, not what is claimed. `path` keeps the
      //    three ways tellable apart instead of flattening them.
      //
      //    Only on a genuine first seed. The alreadySeeded branch above returns
      //    early on purpose: recording "connected" now for a workspace that
      //    connected last week would date the milestone to today and quietly
      //    bend the cohort it lands in.
      await noteMoment("data_connected", userId, workspaceId, {
        path: "track_seed",
        track,
        /* Zero, and stated rather than dropped. The seed no longer writes
           signals or bets, and reporting `seed.signals.length` here would put a
           count of rows that do not exist into the funnel -- the same class of
           claim P-33 removed them for. */
        signals: 0,
        opportunities: 0,
      });

      // WHY THE WORKSPACE ID COMES BACK.
      //
      // This call is the moment a brand-new account first HAS a workspace:
      // ensureDefaultWorkspace above creates it. The client had no way to learn
      // that id except by waiting for its own ["workspaces"] query to refetch,
      // so everything onboarding does in the seconds right after this - the
      // funnel milestones, the demo-seed action - read `activeWorkspace?.id`,
      // found null, and silently did nothing. `product_named` was dropped for
      // essentially every real signup that way. Returning the id makes the
      // caller's next step deterministic instead of a race.
      return {
        success: true,
        alreadySeeded: false,
        workspaceId,
        projectId,
        signalsCount: 0,
        opportunitiesCount: 0,
      };
    } catch (error) {
      console.error("Error seeding workspace:", error);
      // Map schema-drift Postgres errors to a clear, actionable message so the
      // user sees "the backend is behind" instead of "column foo does not exist".
      // Codes: 42703 undefined_column, 42883 undefined_function, 42P01 undefined_table.
      const pgCode = (error as { code?: string })?.code;
      if (pgCode === "42703" || pgCode === "42883" || pgCode === "42P01") {
        throw new Error(
          "Workspace setup is temporarily unavailable while the backend updates. Please retry in a minute or contact support.",
        );
      }
      throw error;
    }
  }
}

/**
 * Export OnboardingTrack type so it can be imported by TrackSelector
 */
export type { OnboardingTrack };

/** The end of the funnel as a plain function; `openFirstRun` runs it last. */
export async function completeOnboardingCore(
  supabase: SupabaseClient<Database>,
  userId: string,
  productIdIn: string | null,
): Promise<{ success: boolean }> {
  {
    const input = { productId: productIdIn ?? undefined };
    const { error, data } = await supabase
      .from("profiles")
      .update({ onboarded: true })
      .eq("id", userId)
      .select("id");

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error("Failed to complete onboarding (profile not found or RLS denied)");
    }

    // The end of the funnel, recorded by the function that ends it. There is no
    // funnel_milestones stage for "finished onboarding" (the CHECK admits five
    // values and none of them is this), so the stream is its home. Until now it
    // was accepted from the client and then dropped, which is exactly the step
    // where a launch-day visitor is most likely to stop.
    const { data: workspaceId } = await supabase.rpc("current_user_default_workspace");
    await noteMoment("onboarding_completed", userId, (workspaceId as string | null) ?? null, {
      path: "complete_onboarding",
    });

    /*
     * THE MACHINE'S FIRST VISIBLE WORK, AND NOBODY IS HELD FOR IT. The
     * product's three starter runs are generated once, from what the person
     * just said. This used to await that generation (bounded at twelve
     * seconds), which held a new person on a disabled "Open Supaprod" while
     * the machine wrote, invisibly (Lane 1's third review, 2026-09-08). The
     * home's own read shows the wait as work in progress ("Reading what you
     * said about X", a live dot), which is the visible version of this wait,
     * so the response goes out now and the generation goes on behind it.
     *
     * A Worker may cancel a promise once its response is out, so the kick
     * here is best effort and the resume-runs minute sweep is the guarantee:
     * a fresh product with nothing stored and no live claim is generated
     * there. The claim (`starter_runs_at`, honoured for STARTER_RUNS_CLAIM_MS)
     * is what keeps the two from writing the same row twice.
     */
    const db = supabase as unknown as SupabaseClient;
    const productId =
      input.productId ?? (await newestProjectId(db, (workspaceId as string | null) ?? null));
    if (productId && (await claimStarterRuns(db, productId, new Date().toISOString()))) {
      void keepStarterRuns(db, userId, productId);
    }

    return { success: true };
  }
}

/**
 * Take the claim on a product's starter runs: one writer per
 * STARTER_RUNS_CLAIM_MS. False when the runs are already stored or someone
 * holds a live claim, so the caller generates nothing.
 */
export async function claimStarterRuns(
  db: SupabaseClient,
  productId: string,
  nowIso: string,
): Promise<boolean> {
  const staleIso = new Date(Date.parse(nowIso) - STARTER_RUNS_CLAIM_MS).toISOString();
  const { data, error } = await db
    .from("projects")
    .update({ starter_runs_at: nowIso })
    .eq("id", productId)
    .is("starter_runs", null)
    .or(`starter_runs_at.is.null,starter_runs_at.lt.${staleIso}`)
    .select("id");
  if (error) {
    console.error(`[starter runs] claim on ${productId} failed: ${error.message}`);
    return false;
  }
  return (data?.length ?? 0) > 0;
}

/**
 * Generate and keep a product's starter runs, and keep the refusal when the
 * model says no (final until the row is cleared; see `starterRunsState`).
 * Never throws: every caller runs this behind a response or inside a sweep,
 * where a throw would be a lost reason.
 */
export async function keepStarterRuns(
  db: SupabaseClient,
  userId: string,
  productId: string,
): Promise<StarterRun[] | null> {
  let runs: StarterRun[] | null;
  try {
    runs = await generateStarterRunsForProduct(db, userId, productId);
  } catch (e) {
    /*
     * A THROW IS NOT A REFUSAL (Lane 1's fourth review, 2026-09-09). The
     * first version of this wrote every throw, a transient provider error
     * included, as a refusal, which `starterRunsState` calls final: the
     * home printed the raw runtime error and nothing ever retried, because
     * the sweep and the claim take only rows with nothing stored. So a throw
     * leaves `starter_runs` NULL and re-stamps the claim, which gives the
     * STARTER_RUNS_CLAIM_MS backoff and hands the row to the sweep. The
     * reason goes to the log, where a runtime error belongs.
     */
    const message = e instanceof Error ? e.message : String(e);
    console.error(`[starter runs] generation for ${productId} failed, will retry: ${message}`);
    const { error: stampErr } = await db
      .from("projects")
      .update({ starter_runs_at: new Date().toISOString() })
      .eq("id", productId)
      .is("starter_runs", null);
    if (stampErr) console.error(`[starter runs] backoff not stamped: ${stampErr.message}`);
    return null;
  }
  if (runs) return runs;
  /*
   * THE MODEL ANSWERED AND HAD NOTHING USABLE TO SAY: the one genuine refusal,
   * kept on the row as final in words written for the person, since asking
   * the same model the same question again would answer the same way until
   * the product says more about itself.
   */
  const reason =
    "The model could not describe this product from what it has so far. Add a sentence about who it is for and what it does, and the first runs will be written from that.";
  const at = new Date().toISOString();
  const { error: markErr } = await db
    .from("projects")
    .update({ starter_runs: { runs: [], refused: { reason, at } }, starter_runs_at: at })
    .eq("id", productId);
  if (markErr) console.error(`[starter runs] refusal not kept: ${markErr.message}`);
  return null;
}

async function newestProjectId(
  db: SupabaseClient,
  workspaceId: string | null,
): Promise<string | null> {
  if (!workspaceId) return null;
  const { data } = await db
    .from("projects")
    .select("id")
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as { id?: string } | null)?.id ?? null;
}

/**
 * Generate and store a product's starter runs. One model call on the product's
 * name and north star, read strictly, written to the row with its time.
 * Returns the runs, or null when the model returned nothing usable (the row is
 * left NULL so the next read tries again rather than serving an empty set as
 * a finished one).
 */
export async function generateStarterRunsForProduct(
  db: SupabaseClient,
  userId: string,
  productId: string,
): Promise<StarterRun[] | null> {
  const { data: project, error } = await db
    .from("projects")
    .select("id,name,north_star,workspace_id")
    .eq("id", productId)
    .maybeSingle();
  if (error) throw new Error(`The product could not be read: ${error.message}`);
  const row = project as {
    id: string;
    name: string;
    north_star: string | null;
    workspace_id: string;
  } | null;
  if (!row) return null;

  /*
   * The positioning line FirstRun wrote (Lane 1, 6995c805f): who it is for
   * and what it does, kept on the brief and never in the goal field. Read
   * beside the north star so a fresh product with no goal yet still gets its
   * three sentences from what the person said. `standing` is the brief's
   * word for its current version.
   */
  const { data: brief } = await db
    .from("brief_items")
    .select("body")
    .eq("workspace_id", row.workspace_id)
    .eq("kind", "positioning")
    .eq("status", "standing")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const positioning = (brief as { body?: string | null } | null)?.body ?? null;

  const result = await callModel(db, userId, {
    surface: "agent",
    surface_ref: `starter-runs:${row.id}`,
    workspaceId: row.workspace_id,
    // The model this deployment can actually run: production held one
    // platform key on 2026-09-08 (Qwen), and a hardcoded Gemini id would have
    // been a refused call on every new product.
    model: resolveBestAgentModel(),
    fallbackModel: resolveBestAgentModel(),
    responseFormat: "json_object",
    messages: [
      { role: "system", content: STARTER_RUNS_SYSTEM },
      {
        role: "user",
        content: starterRunsPrompt({ name: row.name, northStar: row.north_star, positioning }),
      },
    ],
  });
  const runs = parseStarterRuns(result.json);
  if (runs.length === 0) return null;
  const { error: writeErr } = await db
    .from("projects")
    .update({ starter_runs: { runs }, starter_runs_at: new Date().toISOString() })
    .eq("id", row.id);
  if (writeErr) throw new Error(`The starter runs could not be kept: ${writeErr.message}`);
  return runs;
}

/**
 * THE HOME'S READ (Lane 1's item 3). A row read when the runs exist; on a
 * miss it takes the claim and starts the generation, and says `pending: true`
 * at once so the home can show the wait as the agent's first visible work
 * rather than a blank. It never holds the response for the model: the home
 * polls while pending, and the sweep finishes a generation a cancelled
 * Worker dropped. `reason` names a refusal in words.
 */
export const listStarterRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ productId: z.string().uuid() }).parse(i))
  .handler(
    async ({
      context,
      data,
    }): Promise<{ pending: boolean; runs: StarterRun[]; reason: string | null }> => {
      const db = context.supabase as unknown as SupabaseClient;
      const { data: project, error } = await db
        .from("projects")
        .select("id,starter_runs,starter_runs_at")
        .eq("id", data.productId)
        .maybeSingle();
      if (error) throw new Error(`The product could not be read: ${error.message}`);
      if (!project)
        return { pending: false, runs: [], reason: "That product is not one you can read." };
      const row = project as { starter_runs: unknown; starter_runs_at: string | null };
      /*
       * A REFUSAL IS FINAL, A CLAIM IS A WAIT, AND NOTHING HERE HOLDS THE
       * RESPONSE (Lane 1, 2026-09-08, twice). A refusal kept on the row is
       * answered as what it is, and the model is not asked again until the
       * row is cleared. A live claim means a generation is in flight
       * somewhere (this Worker, another, the sweep): pending. No claim: take
       * it, start the generation behind the response, answer pending now.
       */
      switch (starterRunsState(row, Date.now())) {
        case "ready":
          return {
            pending: false,
            runs: readStoredStarterRuns(row.starter_runs) ?? [],
            reason: null,
          };
        case "refused":
          return {
            pending: false,
            runs: [],
            reason: readStarterRunsRefusal(row.starter_runs)?.reason ?? "The model refused.",
          };
        case "in-flight":
          return { pending: true, runs: [], reason: null };
        case "unclaimed":
          if (await claimStarterRuns(db, data.productId, new Date().toISOString())) {
            void keepStarterRuns(db, context.userId, data.productId);
          }
          return { pending: true, runs: [], reason: null };
      }
    },
  );

export const setAgentEnabled = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        agentId: z.string().uuid(),
        enabled: z.boolean(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    const { error, data: rows } = await supabase
      .from("agents")
      .update({ enabled: data.enabled })
      .eq("user_id", userId)
      .eq("id", data.agentId)
      .select("id");

    if (error) throw error;
    if (!rows || rows.length === 0) {
      throw new Error(`Agent "${data.agentId}" not found for this workspace, or RLS denied access`);
    }

    return { success: true };
  });

// ─── WM-S3: Onboarding Concierge ────────────────────────────────────────────

export const conciergeContextSchema = z.object({
  productName: z.string().min(1).max(120),
  whatItDoes: z.string().min(10).max(600),
  targetUsers: z.string().min(3).max(300),
  yourRole: z.string().min(2).max(120),
  keyChallenge: z.string().min(5).max(400),
  keyMetric: z.string().min(2).max(200),
});

export type ConciergeContext = z.infer<typeof conciergeContextSchema>;

type ConciergeSignal = { title: string; content: string; source: string };
type ConciergeOpportunity = {
  title: string;
  problem: string;
  target_user: string;
  impact: number;
  confidence: number;
  ease: number;
};
type ConciergeAIOutput = {
  projectName: string;
  signals: ConciergeSignal[];
  opportunities: ConciergeOpportunity[];
};

/**
 * WM-S3: Onboarding Concierge agent.
 *
 * Takes real product context from the user and generates a personalized
 * workspace seed -- signals, opportunities, and a starter project -- that
 * reflects their actual situation. Runs instead of the static track seeds
 * when the user opts into the Concierge path.
 */
export const seedWorkspaceFromContext = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => conciergeContextSchema.parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    // Guard: already seeded
    const { data: existing } = await supabase
      .from("signals")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if (existing && existing.length > 0) {
      throw new Error("Workspace already seeded. Reset in Settings to re-seed.");
    }

    const system = `You are the Supaprod Onboarding Concierge. Generate a personalized product workspace seed from the user's real context.

Return JSON matching this exact schema (no markdown fences, no prose outside JSON):
{
  "projectName": "short descriptive name for their product focus (< 60 chars)",
  "signals": [
    { "title": "< 80 chars", "content": "150-250 word realistic signal body -- a user interview excerpt, analytics finding, competitor move, or market data point credible for their context", "source": "user_feedback|analytics|competitive_research|market_research|internal_decision|business_metrics" }
  ],
  "opportunities": [
    { "title": "< 80 chars", "problem": "< 200 chars -- why it matters", "target_user": "< 60 chars", "impact": 1-10, "confidence": 1-10, "ease": 1-10 }
  ]
}

Rules:
- Generate exactly 5 signals and 4 opportunities.
- Signals must feel real and grounded in their stated context -- no generic placeholders.
- Opportunity 1 should be the highest-leverage thing they mentioned.
- ICE scores must be calibrated to their situation, not maxed out.
- No em-dashes, en-dashes, or AI-cliche phrases.
- Return only the JSON object.`;

    const userMsg = `Product: ${data.productName}
What it does: ${data.whatItDoes}
Target users: ${data.targetUsers}
My role: ${data.yourRole}
Key challenge right now: ${data.keyChallenge}
Key metric I care about: ${data.keyMetric}`;

    const result = await callModel(supabase, userId, {
      surface: "agent",
      surface_ref: `concierge:onboarding:${userId}`,
      model: "google/gemini-2.5-flash",
      fallbackModel: "google/gemini-2.5-flash",
      responseFormat: "json_object",
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
    });

    const parsed = result.json as ConciergeAIOutput | null;
    if (!parsed || !parsed.signals || !parsed.opportunities) {
      throw new Error("Concierge returned an unexpected format. Please retry.");
    }

    const workspaceId = await ensureDefaultWorkspace(supabase, userId);

    // Get or create project
    const { data: projects } = await supabase
      .from("projects")
      .select("id")
      .eq("user_id", userId)
      .limit(1);

    let projectId: string;
    if (!projects || projects.length === 0) {
      const { data: newProject, error: createErr } = await supabase
        .from("projects")
        .insert([{ user_id: userId, workspace_id: workspaceId, name: parsed.projectName }])
        .select("id")
        .single();
      if (createErr) throw createErr;
      if (!newProject) throw new Error("Project creation returned no data");
      projectId = newProject.id;
    } else {
      projectId = projects[0].id;
    }

    // Insert signals
    const signalRows = parsed.signals.slice(0, 6).map((s) => ({
      user_id: userId,
      workspace_id: workspaceId,
      project_id: projectId,
      source: s.source,
      title: s.title,
      content: s.content,
    }));
    const { error: sigErr } = await supabase.from("signals").insert(signalRows);
    if (sigErr) throw sigErr;

    // Insert opportunities
    const oppRows = parsed.opportunities.slice(0, 5).map((o) => ({
      user_id: userId,
      workspace_id: workspaceId,
      project_id: projectId,
      title: o.title,
      problem: o.problem,
      target_user: o.target_user ?? null,
      impact: Math.min(10, Math.max(1, o.impact)),
      confidence: Math.min(10, Math.max(1, o.confidence)),
      ease: Math.min(10, Math.max(1, o.ease)),
      status: "backlog",
    }));
    const { data: insertedOpps, error: oppErr } = await supabase
      .from("opportunities")
      .insert(oppRows)
      .select("id");
    if (oppErr) throw oppErr;

    await recordSeedOpportunityStageEvents(
      supabase,
      (insertedOpps ?? []).map((o) => o.id),
      workspaceId,
      userId,
    );

    // Mark onboarded
    const { error: profErr, data: profData } = await supabase
      .from("profiles")
      .update({ onboarded: true })
      .eq("id", userId)
      .select("id");
    if (profErr) throw profErr;
    if (!profData || profData.length === 0) {
      throw new Error("Failed to mark profile as onboarded (RLS denied or profile not found)");
    }

    // The Concierge is the third way data arrives, and the only path that also
    // finishes onboarding in the same call, so it reports both moments. Same
    // registry, same two rows anyone else would produce; `path` is what keeps
    // "generated from their own context" distinguishable from a track seed.
    await noteMoment("data_connected", userId, workspaceId, {
      path: "concierge",
      signals: signalRows.length,
      opportunities: oppRows.length,
    });
    await noteMoment("onboarding_completed", userId, workspaceId, { path: "concierge" });

    return {
      success: true,
      projectId,
      projectName: parsed.projectName,
      signalsCount: signalRows.length,
      opportunitiesCount: oppRows.length,
    };
  });

/**
 * ── THE DOOR, IN ONE ROUND TRIP (Lane 1's fourth review, 2026-09-09) ────────
 *
 * "Open Supaprod" on FirstRun ran seven authenticated server functions one
 * after another (the name, the seed, the workspace's name, the milestone, the
 * product's name, the positioning line, the completion), each a Worker
 * round trip of 275 to 550 ms on this deployment (F-212), so the first press
 * in the product sat disabled for seconds. This is the same work on the
 * request's own client: the name and the seed leave together; everything
 * keyed on the seed leaves together; then the completion, which claims the
 * starter runs and returns at once (F-214). The non-fatal steps stay
 * non-fatal: a person who wrote a line is not stopped at the door because
 * the brief write failed; the home asks again where it is used.
 */
export const openFirstRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        productName: z.string().trim().min(1).max(120),
        oneLine: z.string().trim().max(2000).optional(),
        /** The person's name, when the profile had none. */
        name: z.string().trim().min(1).max(200).optional(),
        track: z.enum(["solo", "founding", "tech"]).default("solo"),
      })
      .parse(i),
  )
  .handler(
    async ({
      context,
      data,
    }): Promise<{
      workspaceId: string | null;
      projectId: string | null;
      productId: string | null;
      alreadySeeded: boolean;
    }> => {
      const { supabase, userId } = context;
      const [seeded] = await Promise.all([
        seedWorkspaceCore(supabase, userId, data.track as OnboardingTrack),
        data.name
          ? Promise.resolve(
              supabase
                .from("profiles")
                .update({
                  display_name: data.name.split(/\s+/)[0] ?? data.name,
                  full_name: data.name,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", userId),
            ).then(({ error }) => {
              if (error) throw new Error(error.message);
            })
          : Promise.resolve(),
      ]);
      const workspaceId = seeded.workspaceId ?? null;
      const projectId = seeded.projectId ?? null;
      const swallow = (what: string) => (e: unknown) => {
        console.error(`[openFirstRun] ${what}: ${e instanceof Error ? e.message : String(e)}`);
      };
      await Promise.all([
        workspaceId
          ? Promise.resolve(
              supabase.from("workspaces").update({ name: data.productName }).eq("id", workspaceId),
            ).then(({ error }) => {
              if (error) throw new Error(error.message);
            })
          : Promise.resolve(),
        workspaceId
          ? import("@/lib/activation.functions")
              .then(({ recordActivationMoment }) =>
                recordActivationMoment({
                  moment: "product_named",
                  userId,
                  workspaceId,
                  metadata: { productName: data.productName },
                }),
              )
              .then(() => undefined)
              .catch(swallow("milestone"))
          : Promise.resolve(),
        projectId
          ? Promise.resolve(
              supabase.from("projects").update({ name: data.productName }).eq("id", projectId),
            )
              .then(() => undefined)
              .catch(swallow("product name"))
          : Promise.resolve(),
        workspaceId && data.oneLine
          ? upsertBriefItemCore(supabase, userId, {
              workspaceId,
              kind: "positioning",
              title: data.productName,
              body: data.oneLine,
              supersedesId: null,
            })
              .then(() => undefined)
              .catch(swallow("positioning line"))
          : Promise.resolve(),
      ]);
      await completeOnboardingCore(supabase, userId, projectId);
      return { workspaceId, projectId, productId: projectId, alreadySeeded: seeded.alreadySeeded };
    },
  );
