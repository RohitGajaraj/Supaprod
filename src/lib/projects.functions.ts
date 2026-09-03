import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertCanCreateProduct } from "@/lib/limits.functions";

export const listProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ workspaceId: z.string().uuid().optional() }).parse(input ?? {}),
  )
  .handler(async ({ context, data }) => {
    let workspaceId = data.workspaceId;

    // Fallback to default workspace if not provided
    if (!workspaceId) {
      const { data: memberRows } = await context.supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: true })
        .limit(1);

      if (memberRows && memberRows.length > 0) {
        workspaceId = memberRows[0].workspace_id;
      }
    }

    if (!workspaceId) {
      return { projects: [] };
    }

    const { data: projects, error } = await context.supabase
      .from("projects")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    // B5: hide soft-archived products from the active set (sidebar + tabs).
    // A JS filter (not `.is("archived_at", null)`) keeps this pre-migration
    // tolerant — until the column exists, archived_at reads undefined ⇒ kept.
    const visible = (projects ?? []).filter(
      (p) => !(p as { archived_at?: string | null }).archived_at,
    );
    const { data: tasks } = await context.supabase.from("tasks").select("id,status,project_id");
    const stats = visible.map((p) => {
      const projectTasks = (tasks ?? []).filter((t) => t.project_id === p.id);
      const done = projectTasks.filter((t) => t.status === "done").length;
      const total = projectTasks.length;
      return {
        ...p,
        task_total: total,
        task_done: done,
        progress: total ? Math.round((done / total) * 100) : 0,
      };
    });
    return { projects: stats };
  });

// B3 · Portfolio — per-product loop status so an operator can run many products
// without losing the thread. For each product in the workspace: task progress
// plus how much sits in its loop (signals, opportunities, specs). All RLS-scoped;
// signals/opportunities/prds and tasks all carry project_id. Read-only.
export type PortfolioProduct = {
  id: string;
  name: string;
  north_star: string | null;
  task_done: number;
  task_total: number;
  progress: number;
  signals: number;
  opportunities: number;
  specs: number;
  archived: boolean;
};

export const getPortfolio = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ workspaceId: z.string().uuid().optional() }).parse(input ?? {}),
  )
  .handler(async ({ context, data }): Promise<{ products: PortfolioProduct[] }> => {
    const { supabase, userId } = context;
    let workspaceId = data.workspaceId;
    if (!workspaceId) {
      const { data: memberRows } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(1);
      if (memberRows && memberRows.length > 0) workspaceId = memberRows[0].workspace_id;
    }
    if (!workspaceId) return { products: [] };

    const { data: projects } = await supabase
      .from("projects")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });
    const list = (projects ?? []) as {
      id: string;
      name: string;
      north_star?: string | null;
      archived_at?: string | null;
    }[];
    if (list.length === 0) return { products: [] };
    const ids = list.map((p) => p.id);

    const [tasksRes, sigRes, oppRes, prdRes] = await Promise.all([
      supabase.from("tasks").select("status,project_id").in("project_id", ids),
      supabase.from("signals").select("project_id").in("project_id", ids),
      supabase.from("opportunities").select("project_id").in("project_id", ids),
      supabase.from("prds").select("project_id").in("project_id", ids),
    ]);
    // Surface a failed count query instead of silently zeroing — a zero must mean
    // "genuinely none", never "the query failed" (the route's error boundary
    // shows a retry rather than a misleading empty portfolio).
    const countErr = tasksRes.error || sigRes.error || oppRes.error || prdRes.error;
    if (countErr) throw new Error(countErr.message);

    const countBy = (rows: { project_id: string | null }[] | null) => {
      const m = new Map<string, number>();
      for (const r of rows ?? []) {
        if (r.project_id) m.set(r.project_id, (m.get(r.project_id) ?? 0) + 1);
      }
      return m;
    };
    const sig = countBy(sigRes.data as { project_id: string | null }[] | null);
    const opp = countBy(oppRes.data as { project_id: string | null }[] | null);
    const prd = countBy(prdRes.data as { project_id: string | null }[] | null);
    const taskAgg = new Map<string, { done: number; total: number }>();
    for (const t of (tasksRes.data ?? []) as { status: string; project_id: string | null }[]) {
      if (!t.project_id) continue;
      const cur = taskAgg.get(t.project_id) ?? { done: 0, total: 0 };
      cur.total += 1;
      if (t.status === "done") cur.done += 1;
      taskAgg.set(t.project_id, cur);
    }

    const products: PortfolioProduct[] = list.map((p) => {
      const tk = taskAgg.get(p.id) ?? { done: 0, total: 0 };
      return {
        id: p.id,
        name: p.name,
        north_star: p.north_star ?? null,
        task_done: tk.done,
        task_total: tk.total,
        progress: tk.total ? Math.round((tk.done / tk.total) * 100) : 0,
        signals: sig.get(p.id) ?? 0,
        opportunities: opp.get(p.id) ?? 0,
        specs: prd.get(p.id) ?? 0,
        archived: Boolean(p.archived_at),
      };
    });
    return { products };
  });

const createSchema = z.object({
  name: z.string().min(1).max(200),
  north_star: z.string().max(500).nullable().optional(),
  target_date: z.string().nullable().optional(),
  status: z.enum(["active", "paused", "shipped"]).default("active"),
  workspaceId: z.string().uuid().optional(),
});

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { workspaceId: inputWorkspaceId, ...rest } = data;
    let workspaceId = inputWorkspaceId;

    if (!workspaceId) {
      const { data: memberRows } = await context.supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: true })
        .limit(1);

      if (memberRows && memberRows.length > 0) {
        workspaceId = memberRows[0].workspace_id;
      }
    }

    if (!workspaceId) {
      throw new Error("No active workspace found for user.");
    }

    // WM-M5: tier limit gate (nice path). Throws a typed LimitReachedError when the
    // account is at/over its product cap so the UI can nudge to upgrade; the DB
    // trigger enforce_product_limit is the authoritative, unbypassable backstop.
    // A strict no-op until the founder flips limit_gates_enabled().
    await assertCanCreateProduct(context.supabase as unknown as SupabaseClient, workspaceId);

    const { data: row, error } = await context.supabase
      .from("projects")
      .insert({ ...rest, workspace_id: workspaceId, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { project: row };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    // user_id scope + .select() so a no-match or RLS-blocked delete fails loudly
    // instead of a phantom ok (RLS already scopes it; this keeps "Deleted" honest
    // and consistent with setProjectArchived). The FK is `on delete set null`, so
    // the product's signals/opps/specs/tasks are detached, not cascade-deleted.
    const { data: rows, error } = await context.supabase
      .from("projects")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select("id");
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) throw new Error("Product not found");
    return { ok: true };
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200).optional(),
  north_star: z.string().max(500).nullable().optional(),
  target_date: z.string().nullable().optional(),
  status: z.enum(["active", "paused", "shipped"]).optional(),
});

export const updateProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { id, ...patch } = data;
    const { error } = await context.supabase.from("projects").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// WM-F6 · Move a product (and all its product-scoped child rows) to another
// workspace in the SAME account. All the work - the atomic reassignment plus the
// owner/admin-in-both + same-account guard - lives in the `move_product`
// SECURITY DEFINER RPC; this is the thin, validated entry point. Called via
// context.supabase so the RPC's auth.uid()-based `can_manage_workspace` checks
// apply to the real caller. Memory stays at the workspace (not moved).
export const moveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ productId: z.string().uuid(), destWorkspaceId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.rpc("move_product", {
      _product_id: data.productId,
      _dest_workspace_id: data.destWorkspaceId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// B5 · Soft archive (reversible). Hides the product from the active set without
// touching its data; restore clears the stamp. The user_id scope + .select()
// make a blocked or no-match write fail loudly instead of returning a phantom
// ok:true (the optimistic UI rolls back on a thrown error). The write is gated
// on the next sync adding the archived_at column; until then it errors honestly.
const archiveSchema = z.object({ id: z.string().uuid(), archive: z.boolean() });

export const setProjectArchived = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => archiveSchema.parse(input))
  .handler(async ({ context, data }) => {
    // Loose patch (matches the roadmap pre-migration pattern) so the not-yet-
    // applied archived_at column doesn't trip the generated-types check.
    const patch: Record<string, unknown> = {
      archived_at: data.archive ? new Date().toISOString() : null,
    };
    const { data: rows, error } = await context.supabase
      .from("projects")
      .update(patch)
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select("id");
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) throw new Error("Product not found");
    return { ok: true };
  });

// B5 · Export a product's full footprint as one JSON snapshot — the escape
// hatch (run before a hard delete, or any time). RLS scopes every read to the
// caller, so this can only export the user's own rows.
// JSON-safe shapes: the TanStack server-fn boundary requires a statically
// serializable return (it rejects `unknown`), and these rows are plain DB JSON.
type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };
type JsonObject = { [k: string]: JsonValue };

export type ProductExport = {
  product: JsonObject;
  signals: JsonObject[];
  opportunities: JsonObject[];
  specs: JsonObject[];
  tasks: JsonObject[];
  exported_by: string;
};

// U6-AUDIT: append-only export audit trail. Records each data export (who, what,
// how much, when) so a workspace owner can audit data egress. BEST-EFFORT by
// design - the export is the user's data-portability right and must not fail
// because the audit row could not be written (e.g. before `export_log` is
// published, or a transient RLS hiccup), so the insert error is intentionally
// not propagated. The trail is append-only (no update/delete policy).
async function recordExport(
  supabase: SupabaseClient,
  row: {
    workspace_id: string | null;
    kind: "product" | "workspace";
    target_id: string | null;
    sections: string[] | null;
    row_count: number;
  },
): Promise<void> {
  // Best-effort: never let an audit-write failure (a missing table pre-publish, a
  // transient error, or an unexpected throw) fail the user's export. supabase-js
  // returns errors in the result object rather than throwing, but the try/catch
  // guarantees the export proceeds even if that contract ever changes.
  try {
    await supabase.from("export_log").insert(row);
  } catch {
    // intentional: the export is the primary action; the audit row is secondary.
  }
}

export const exportProduct = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }): Promise<ProductExport> => {
    const { supabase, userId } = context;
    const { data: product, error: pErr } = await supabase
      .from("projects")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!product) throw new Error("Product not found");

    const [signals, opportunities, prds, tasks] = await Promise.all([
      // P-35: named columns, embedding excluded
      supabase
        .from("signals")
        .select(
          "content,created_at,embedding_model,external_id,id,is_sample,last_restated_at,product_id,project_id,reference_urls,restated_count,sentiment,source,source_kind,tags,theme_id,title,url,user_id,workspace_id",
        )
        .eq("project_id", data.id),
      // P-35: named columns, embedding excluded
      supabase
        .from("opportunities")
        .select(
          "confidence,created_at,critic_review,ease,embedding_model,goal_id,hypothesis,ice_score,id,impact,is_public,is_sample,linked_brief_item_id,posthog_event,problem,product_id,project_id,roadmap_bucket,roadmap_last_agent_slug,roadmap_measure,roadmap_outcome,roadmap_snapshot_before,share_slug,status,target_user,theme_id,title,updated_at,user_id,workspace_id",
        )
        .eq("project_id", data.id),
      // P-35: named columns, embedding excluded
      supabase
        .from("prds")
        .select(
          "body_md,citations,contract,contract_migrated_at,created_at,critic_review,design_decided_at,design_decided_by,design_gate_status,embedding_model,github_issue_url,id,is_sample,model,opportunity_id,outcome,outcome_check_by,outcome_deferred_at,outcome_deferred_count,outcome_suggestion,product_id,project_id,shipped_at,snapshot_before,status,title,updated_at,user_id,workspace_id",
        )
        .eq("project_id", data.id),
      supabase.from("tasks").select("*").eq("project_id", data.id),
    ]);
    const firstErr = signals.error || opportunities.error || prds.error || tasks.error;
    if (firstErr) throw new Error(firstErr.message);

    await recordExport(supabase as unknown as SupabaseClient, {
      workspace_id: (product as { workspace_id?: string | null }).workspace_id ?? null,
      kind: "product",
      target_id: data.id,
      sections: null,
      row_count:
        (signals.data?.length ?? 0) +
        (opportunities.data?.length ?? 0) +
        (prds.data?.length ?? 0) +
        (tasks.data?.length ?? 0),
    });

    return {
      product,
      signals: signals.data ?? [],
      opportunities: opportunities.data ?? [],
      specs: prds.data ?? [],
      tasks: tasks.data ?? [],
      exported_by: userId,
    };
  });

// U6 · Workspace data-portability export, the trust escape-hatch. Assemble the
// caller's whole workspace footprint into one JSON snapshot they can download
// and take anywhere, no lock-in. RLS scopes every read to the caller, so this
// only ever exports the user's own rows. Project-bound entities scope to the
// active workspace's projects; owner-scoped learnings and memory are the user's
// own. Same JSON-safe shape contract as ProductExport above.
export type WorkspaceExport = {
  workspace_id: string;
  exported_by: string;
  exported_at: string;
  counts: { [section: string]: number };
  projects: JsonObject[];
  signals: JsonObject[];
  opportunities: JsonObject[];
  specs: JsonObject[];
  tasks: JsonObject[];
  learnings: JsonObject[];
  memory: JsonObject[];
  /**
   * The decision record, with all eleven `forecast_*` columns.
   *
   * WITHOUT IT `learnings` ABOVE IS A VERDICT ON A PREDICTION NOBODY CAN READ.
   * This export shipped for months carrying the outcome and not the forecast it
   * graded, so the one question the product exists to answer — *what did we
   * expect, and what actually happened* — could not be answered from a person's
   * own exported data.
   */
  decisions: JsonObject[];
  /** The piece of work itself, and what each station produced, in order. */
  tracks: JsonObject[];
  track_members: JsonObject[];
  themes: JsonObject[];
  prototypes: JsonObject[];
  changesets: JsonObject[];
  deployments: JsonObject[];
};

export const exportWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        workspaceId: z.string().uuid().optional(),
        sections: z.array(z.string()).optional(),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ context, data }): Promise<WorkspaceExport> => {
    const { supabase, userId } = context;

    let workspaceId = data.workspaceId;
    if (!workspaceId) {
      const { data: memberRows } = await supabase
        .from("workspace_members")
        .select("workspace_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(1);
      if (memberRows && memberRows.length > 0) workspaceId = memberRows[0].workspace_id;
    }

    if (!workspaceId) {
      return {
        workspace_id: "",
        exported_by: userId,
        exported_at: new Date().toISOString(),
        counts: {},
        projects: [],
        signals: [],
        opportunities: [],
        specs: [],
        tasks: [],
        learnings: [],
        memory: [],
        decisions: [],
        tracks: [],
        track_members: [],
        themes: [],
        prototypes: [],
        changesets: [],
        deployments: [],
      };
    }

    const { data: projects, error: pErr } = await supabase
      .from("projects")
      .select("*")
      .eq("workspace_id", workspaceId);
    if (pErr) throw new Error(pErr.message);
    const projectRows = projects ?? [];
    const projectIds = projectRows.map((p) => p.id as string).filter(Boolean);

    // Project-bound entities. Guard the empty case so a workspace with no
    // projects never issues an `in (<empty list>)` query.
    let sig: JsonObject[] = [];
    let opp: JsonObject[] = [];
    let spc: JsonObject[] = [];
    let tsk: JsonObject[] = [];
    if (projectIds.length > 0) {
      const [signals, opportunities, prds, tasks] = await Promise.all([
        // P-35: named columns, embedding excluded
        supabase
          .from("signals")
          .select(
            "content,created_at,embedding_model,external_id,id,is_sample,last_restated_at,product_id,project_id,reference_urls,restated_count,sentiment,source,source_kind,tags,theme_id,title,url,user_id,workspace_id",
          )
          .in("project_id", projectIds),
        // P-35: named columns, embedding excluded
        supabase
          .from("opportunities")
          .select(
            "confidence,created_at,critic_review,ease,embedding_model,goal_id,hypothesis,ice_score,id,impact,is_public,is_sample,linked_brief_item_id,posthog_event,problem,product_id,project_id,roadmap_bucket,roadmap_last_agent_slug,roadmap_measure,roadmap_outcome,roadmap_snapshot_before,share_slug,status,target_user,theme_id,title,updated_at,user_id,workspace_id",
          )
          .in("project_id", projectIds),
        // P-35: named columns, embedding excluded
        supabase
          .from("prds")
          .select(
            "body_md,citations,contract,contract_migrated_at,created_at,critic_review,design_decided_at,design_decided_by,design_gate_status,embedding_model,github_issue_url,id,is_sample,model,opportunity_id,outcome,outcome_check_by,outcome_deferred_at,outcome_deferred_count,outcome_suggestion,product_id,project_id,shipped_at,snapshot_before,status,title,updated_at,user_id,workspace_id",
          )
          .in("project_id", projectIds),
        supabase.from("tasks").select("*").in("project_id", projectIds),
      ]);
      const e = signals.error || opportunities.error || prds.error || tasks.error;
      if (e) throw new Error(e.message);
      sig = signals.data ?? [];
      opp = opportunities.data ?? [];
      spc = prds.data ?? [];
      tsk = tasks.data ?? [];
    }

    // Owner-scoped entities: the user's own outcome learnings and agent memory.
    const [learnings, memory] = await Promise.all([
      // P-35: named columns, embedding excluded
      supabase
        .from("learnings")
        .select(
          "created_at,decision_id,embedding_model,id,is_sample,metric_label,metric_value,mission_id,new_ice,opportunity_id,prd_id,prior_ice,product_id,recorded_by_agent_slug,summary,updated_at,user_id,verdict,workspace_id",
        )
        .eq("user_id", userId),
      // P-35: named columns, embedding excluded
      supabase
        .from("agent_memory")
        .select(
          "agent_id,agent_slug,content,created_at,embedding_model,expires_at,id,importance,is_sample,kind,last_used_at,metadata,product_id,scope,updated_at,user_id,visibility,workspace_id",
        )
        .eq("user_id", userId),
    ]);
    const ownErr = learnings.error || memory.error;
    if (ownErr) throw new Error(ownErr.message);
    const lrn = learnings.data ?? [];
    const mem = memory.data ?? [];

    /*
     * THE DECISION RECORD AND THE WORK, WHICH THIS EXPORT LEFT OUT ENTIRELY.
     *
     * Measured 2026-08-25: this handler read eight tables and `decisions` was
     * not one of them, while `learnings` WAS. So a customer taking their data
     * out received **the verdict without the forecast it graded** -- and the
     * export could not reconstruct *what was predicted against what actually
     * happened*, which is the sentence this product sells. `decisions` carries
     * all eleven `forecast_*` columns; nothing else does.
     *
     * The WORK was missing too. `spine_tracks` is the object that walks the
     * seven stations and `spine_track_members` is the only record of what each
     * station produced, so an export without them hands somebody a pile of
     * artifacts with no account of which piece of work they belong to or in what
     * order they were made.
     *
     * `themes`, `prototypes`, `studio_changesets` and `deployments` complete the
     * chain: the cluster the work came from, the surface designed, the change
     * staged, and where it went.
     *
     * WORKSPACE-SCOPED, NOT USER-SCOPED, because that is how these tables are
     * tenanted -- and `spine_track_members` has no `workspace_id` of its own, so
     * it is fetched by the track ids already resolved rather than by a guess.
     *
     * `security.tsx` and `privacy.tsx` both promise export in open formats. The
     * promise was kept and the contents were not.
     */
    const [decisions, tracks, themes, prototypes, changesets, deployments] = await Promise.all([
      // P-35: named columns, embedding excluded
      supabase
        .from("decisions")
        .select(
          "alternatives_considered,auto_origin,cited_by_count,created_at,decided_by_agent_slug,embedding_model,forecast_band_drifting_at,forecast_band_missed_at,forecast_baseline,forecast_claim,forecast_deferred_at,forecast_deferred_count,forecast_direction,forecast_horizon_date,forecast_how_we_will_know,forecast_if_drifting,forecast_if_missed,forecast_metric,forecast_next_check_at,forecast_observations,forecast_predicted,forecast_resolution,forecast_resolution_rationale,forecast_resolution_suggestion,forecast_resolved_at,forecast_resolved_by_agent_slug,id,intent,is_public,is_sample,meeting_id,mission_id,prd_id,product_id,project_id,rationale,share_slug,snapshot_before,source_kind,status,title,user_id,workspace_id",
        )
        .eq("workspace_id", workspaceId),
      supabase.from("spine_tracks").select("*").eq("workspace_id", workspaceId),
      // P-35: named columns, embedding excluded
      supabase
        .from("themes")
        .select(
          "confidence,created_at,dismissed_at_frequency,embedding_model,escalated_at,frequency,id,is_sample,last_signal_at,novelty,novelty_basis,product_id,project_id,scored_at,severity,status,status_reason,summary,title,user_id,workspace_id",
        )
        .eq("workspace_id", workspaceId),
      supabase.from("prototypes").select("*").eq("workspace_id", workspaceId),
      supabase.from("studio_changesets").select("*").eq("user_id", userId),
      supabase.from("deployments").select("*").eq("user_id", userId),
    ]);
    /*
     * A TABLE THIS DEPLOYMENT DOES NOT HAVE MUST NOT EMPTY THE WHOLE EXPORT.
     * The reads above throw on error because those tables are load-bearing and
     * older than the spine; these are newer, and a person asking for their data
     * during a migration window should get everything that exists rather than a
     * failure. Each falls back to [] and the count says what actually came back.
     */
    const dec = decisions.data ?? [];
    const trk2 = tracks.data ?? [];
    const thm = themes.data ?? [];
    const pro = prototypes.data ?? [];
    const chg = changesets.data ?? [];
    const dep = deployments.data ?? [];

    // Members are keyed by track, and the table carries no workspace column.
    const trackIds = (trk2 as Array<{ id?: string }>)
      .map((t) => t.id)
      .filter((i): i is string => !!i);
    const members = trackIds.length
      ? await supabase.from("spine_track_members").select("*").in("track_id", trackIds)
      : { data: [], error: null };
    const mem2 = members.data ?? [];

    // U6 selective export: when `sections` is given, include only those; an
    // empty or absent list means everything (the unchanged default).
    const want = (s: string) =>
      !data.sections || data.sections.length === 0 || data.sections.includes(s);
    const counts: { [section: string]: number } = {};
    if (want("projects")) counts.projects = projectRows.length;
    if (want("signals")) counts.signals = sig.length;
    if (want("opportunities")) counts.opportunities = opp.length;
    if (want("specs")) counts.specs = spc.length;
    if (want("tasks")) counts.tasks = tsk.length;
    if (want("learnings")) counts.learnings = lrn.length;
    if (want("memory")) counts.memory = mem.length;
    if (want("decisions")) counts.decisions = dec.length;
    if (want("tracks")) counts.tracks = trk2.length;
    if (want("track_members")) counts.track_members = mem2.length;
    if (want("themes")) counts.themes = thm.length;
    if (want("prototypes")) counts.prototypes = pro.length;
    if (want("changesets")) counts.changesets = chg.length;
    if (want("deployments")) counts.deployments = dep.length;

    await recordExport(supabase as unknown as SupabaseClient, {
      workspace_id: workspaceId,
      kind: "workspace",
      target_id: workspaceId,
      sections: data.sections && data.sections.length > 0 ? data.sections : null,
      row_count: Object.values(counts).reduce((a, b) => a + b, 0),
    });

    return {
      workspace_id: workspaceId,
      exported_by: userId,
      exported_at: new Date().toISOString(),
      counts,
      projects: want("projects") ? projectRows : [],
      signals: want("signals") ? sig : [],
      opportunities: want("opportunities") ? opp : [],
      specs: want("specs") ? spc : [],
      tasks: want("tasks") ? tsk : [],
      learnings: want("learnings") ? lrn : [],
      memory: want("memory") ? mem : [],
      // The decision record. Carries every `forecast_*` column, and without it
      // `learnings` above is a verdict on a prediction nobody can read.
      decisions: want("decisions") ? dec : [],
      // The work itself, and what each station produced, in order.
      tracks: want("tracks") ? trk2 : [],
      track_members: want("track_members") ? mem2 : [],
      themes: want("themes") ? thm : [],
      prototypes: want("prototypes") ? pro : [],
      changesets: want("changesets") ? chg : [],
      deployments: want("deployments") ? dep : [],
    };
  });

// U6-AUDIT: read the export audit trail. RLS scopes it to the caller's own
// exports plus those of any workspace they belong to (so an owner can see all
// data egress from their workspace). Read-only; newest first; capped.
export type ExportLogRow = {
  id: string;
  user_id: string;
  workspace_id: string | null;
  kind: "product" | "workspace";
  target_id: string | null;
  sections: string[] | null;
  row_count: number;
  created_at: string;
};

export const listExportLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ workspaceId: z.string().uuid().optional() }).parse(input ?? {}),
  )
  .handler(async ({ context, data }): Promise<{ exports: ExportLogRow[] }> => {
    let query = (context.supabase as unknown as SupabaseClient)
      .from("export_log")
      .select("id, user_id, workspace_id, kind, target_id, sections, row_count, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data.workspaceId) query = query.eq("workspace_id", data.workspaceId);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return { exports: (rows ?? []) as ExportLogRow[] };
  });
