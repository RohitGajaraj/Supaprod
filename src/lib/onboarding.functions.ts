import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { getTrackSeed, type OnboardingTrack } from "@/lib/onboarding/track-seeds";
import { callModel } from "@/lib/ai/runtime.server";
import { resolveBestAgentModel } from "@/lib/ai/platform-keys.server";
import {
  parseStarterRuns,
  readStoredStarterRuns,
  STARTER_RUNS_SYSTEM,
  starterRunsPrompt,
  type StarterRun,
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
 * Seed a workspace with per-track sample data
 *
 * Creates:
 * - One starter project (if not already present)
 * - Several signals (market feedback, user feedback, etc.)
 * - Several opportunities (prioritized ideas)
 *
 * Runs during onboarding, after the user selects a track. The onboarded flag
 * is NOT set here; completeOnboarding sets it at the finish step, so an
 * interrupted onboarding resumes instead of silently skipping its later steps
 * (SW-6). Re-entry is safe: the alreadySeeded guard fast-forwards.
 * All data is scoped to the authenticated user.
 */
export const seedWorkspaceForTrack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        track: z.enum(["solo", "founding", "tech"]),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const track = data.track as OnboardingTrack;
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
  });

/**
 * Export OnboardingTrack type so it can be imported by TrackSelector
 */
export type { OnboardingTrack };

/**
 * Mark onboarding as complete (fallback if user skips seeding)
 * This routes them from /onboarding to the main app (/).
 *
 * Validates that the update actually modified a row (RLS safety check).
 */
export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ productId: z.string().uuid().optional() }).parse(i ?? {}),
  )
  .handler(async ({ context, data: input }) => {
    const { supabase, userId } = context;

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
     * THE MACHINE'S FIRST VISIBLE WORK. The product's three starter runs are
     * generated here, once, so the home a person lands on next has them (or
     * shows the wait as work in progress and reads them on its next poll).
     * Bounded, because onboarding must finish whether or not a model answers
     * in time; on a timeout or a refusal the row stays NULL and the home's
     * own read generates on its miss. The product is the one FirstRun named,
     * else the workspace's newest.
     */
    const productId =
      input.productId ??
      (await newestProjectId(
        supabase as unknown as SupabaseClient,
        (workspaceId as string | null) ?? null,
      ));
    if (productId) {
      await Promise.race([
        generateStarterRunsForProduct(
          supabase as unknown as SupabaseClient,
          userId,
          productId,
        ).catch((e: unknown) => {
          console.error(
            `[completeOnboarding] starter runs: ${e instanceof Error ? e.message : String(e)}`,
          );
          return null;
        }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), STARTER_RUNS_WAIT_MS)),
      ]);
    }

    return { success: true };
  });

/** How long onboarding waits for the starter runs before handing the wait to the home. */
const STARTER_RUNS_WAIT_MS = 12_000;

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
      { role: "user", content: starterRunsPrompt({ name: row.name, northStar: row.north_star }) },
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
 * miss it generates once, bounded, and says `pending: true` when the answer
 * has not landed yet so the home can show the wait as the agent's first
 * visible work rather than a blank. `reason` names a refusal in words.
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
        .select("id,starter_runs")
        .eq("id", data.productId)
        .maybeSingle();
      if (error) throw new Error(`The product could not be read: ${error.message}`);
      const stored = readStoredStarterRuns(
        (project as { starter_runs?: unknown } | null)?.starter_runs,
      );
      if (stored) return { pending: false, runs: stored, reason: null };
      if (!project)
        return { pending: false, runs: [], reason: "That product is not one you can read." };
      try {
        const generated = await Promise.race([
          generateStarterRunsForProduct(db, context.userId, data.productId),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), STARTER_RUNS_WAIT_MS)),
        ]);
        if (generated) return { pending: false, runs: generated, reason: null };
        return { pending: true, runs: [], reason: null };
      } catch (e) {
        return {
          pending: true,
          runs: [],
          reason: e instanceof Error ? e.message : String(e),
        };
      }
    },
  );

/**
 * PC-02: the client's report of an onboarding milestone.
 *
 * The private onboarding-to-funnel map that used to live here is gone: it was
 * the second of three vocabularies for the same five moments, and every one of
 * them now resolves in ONE registry (src/lib/activation.functions.ts), which is
 * also what decides which of the two tables the row belongs in. The behaviour it
 * encoded is preserved there exactly (data_connected resolves to the funnel
 * stage `connected`, critic_completed to `first_teardown`, signup to `signup`),
 * including the 2026-07-11 fix it was written for: the raw onboarding stage must
 * never reach funnel_milestones, whose CHECK rejects it and whose error is
 * swallowed, which is how `connected` and `first_teardown` stayed empty for a
 * month.
 *
 * WHAT CHANGES: product_named and onboarding_completed are no longer dropped.
 * They have no funnel stage, so they land in activation_events, which has no
 * CHECK and can hold them. "Nothing to record" was never true; it meant nobody
 * could see the two steps between connecting data and finishing.
 *
 * This stays a client-callable path because the client sees moments the server
 * does not (product_named happens in a form). The moments the server does see
 * are ALSO fired server-side now, and the two resolve to one row.
 */
export const recordOnboardingMilestone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        workspaceId: z.string().uuid(),
        stage: z.enum(ONBOARDING_MILESTONES),
        metadata: z.record(z.unknown()).optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { userId } = context;

    try {
      const { recordActivationMoment } = await import("@/lib/activation.functions");
      const result = await recordActivationMoment({
        moment: data.stage,
        userId,
        workspaceId: data.workspaceId,
        metadata: data.metadata,
      });
      // The caller learns where the moment went and whether this call is the
      // one that recorded it. `success` keeps its old meaning (the call did not
      // fail); a duplicate is a success, not a failure.
      return {
        success: result.reason !== "write_failed",
        sink: result.sink,
        name: result.name,
        recorded: result.recorded,
      };
    } catch (e) {
      console.error("[PC-02] recordOnboardingMilestone failed:", e);
      // Fail gracefully - funnel tracking is non-critical
      return { success: false, sink: null, name: data.stage, recorded: false };
    }
  });

/**
 * Set agent enabled status (called by the onboarding flow "Meet your staff" step).
 *
 * Keyed by agent id (the row PK), which is what the only caller — OnboardingFlow —
 * passes. The earlier slug-based contract never matched that payload, so every
 * toggle silently failed Zod validation; this aligns the server to the call site.
 */
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
