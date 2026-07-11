import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { callModel } from "@/lib/ai/runtime.server";
import { extractArrayField } from "@/lib/ai/json-shape";
import { clusterSignalsCore } from "@/lib/ai/cluster.server";
import { runCritic } from "@/lib/ai/critic.server";
import { recordLineage, recordLineageSafe } from "@/lib/lineage.functions";
import { recordStageEvent } from "@/lib/stage-events.server";
import { retrieve } from "@/lib/rag/retriever.server";
import { resolveGitHub } from "@/lib/connectors/providers/github.server";
import { prepareScaffoldSpeculative } from "@/lib/design-scaffold.functions";
import { gradeOutcomeContract } from "@/lib/outcome-contract-grade";
import type { SupabaseClient } from "@supabase/supabase-js";

// ---------- CRITIC (DEC-02 opportunities · DEF-03 specs) ----------
// DEC-02-LOOP: runCritic + CriticReview now live in src/lib/ai/critic.server.ts
// so the Critic is also callable from the agent loop as the `critic.evaluate`
// tool. Re-exported here because ~8 modules import the type from this module.
export type { CriticReview } from "@/lib/ai/critic.server";

/** Manual Critic re-run from the UI ("Re-run Critic" on the badge). */
export const runCriticReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        target_kind: z.enum(["opportunity", "prd"]),
        target_id: z.string().uuid(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const review = await runCritic(context.supabase, context.userId, {
      kind: data.target_kind,
      id: data.target_id,
    });
    if (!review) throw new Error("Critic review failed");
    return { review };
  });

// ---------- WEDGE (Critic-teardown first-run) ----------
//
// Engine-Room: the felt entry. The operator names a feature they believe in
// and gets an evidence-backed teardown in one call. The machinery (the judge
// model, the ICE scoring, the opportunities table) stays behind the outcome
// ("see why your idea might be wrong, with receipts"). It records the idea
// verbatim so the Critic judges exactly what the operator said, then red-teams
// it inline. No source connection or data setup is required, so a brand-new
// account reaches the first verdict in its first session.

/**
 * Record a feature idea as an opportunity (verbatim, neutral ICE) and run the
 * Critic against it in the same call. Returns the opportunity plus the verdict
 * for the first-run surface to render. The verdict may be `null` when the AI
 * gateway is unavailable (e.g. local dev with no key) — the idea is still saved
 * and the caller shows an honest fallback rather than a broken card.
 */
export const runWedgeTeardown = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        idea: z.string().trim().min(3).max(200),
        problem: z.string().trim().max(2000).optional(),
        target_user: z.string().trim().max(200).optional(),
        project_id: z.string().uuid().nullable().optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: opp, error } = await supabase
      .from("opportunities")
      .insert({
        user_id: userId,
        title: data.idea.slice(0, 200),
        problem: (data.problem ?? "").slice(0, 2000),
        target_user: data.target_user?.slice(0, 200) ?? null,
        // Neutral ICE: the operator hasn't scored the bet, so we don't fake a
        // score. The Critic judges the idea itself and surfaces what's undefined
        // through `missing_evidence` — which is most of the first-run value.
        impact: 5,
        confidence: 5,
        ease: 5,
        project_id: data.project_id ?? null,
      })
      .select()
      .single();
    if (error || !opp) throw new Error(error?.message ?? "Could not record the idea");

    // SEAM-1: stage history for the created opportunity.
    await recordStageEvent(supabase, {
      entityType: "opportunity",
      entityId: opp.id,
      from: null,
      to: opp.status ?? "backlog",
      actor: "human",
      workspaceId: opp.workspace_id,
      userId,
    });

    const review = await runCritic(supabase, userId, { kind: "opportunity", id: opp.id });
    return { opportunity: opp, review };
  });

// ---------- TASK GRAPH (M1: H1 — PRD → engineering plan) ----------

/** The Planner step: decompose an approved spec into a DEPENDENCY-ORDERED
 *  engineering task graph an agent team can execute. Replaces any prior
 *  generated graph for the PRD (rows with seq IS NOT NULL); manually-added
 *  tasks (seq NULL) are untouched. Pre-migration tolerant: if the graph columns
 *  aren't applied yet, falls back to a flat task list so the spec still yields
 *  executable tasks. */
export const generateTaskGraph = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ prd_id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: prd, error: pErr } = await supabase
      .from("prds")
      .select("id,title,body_md,workspace_id")
      .eq("id", data.prd_id)
      .single();
    if (pErr || !prd) throw new Error("Spec not found");

    const system = `You are the Planner agent. Turn an approved product SPEC into a DEPENDENCY-ORDERED engineering task graph an agent team can execute. Decompose into 4-12 concrete build tasks (not phases), ordered so dependencies come first. For each task give a 1-line detail, an hour estimate, an owner (agent for code/test/infra, human for decisions/design/external), any risk, and which earlier tasks it depends on (by their 1-based seq).
Return STRICT JSON only:
{"tasks":[{"seq":1,"title":"max 120 chars","detail":"max 200 chars","estimate_hours":<number>,"assignee":"agent|human","risk":"short or empty","depends_on":[<seq>...]}]}
Be concrete and buildable. Only tasks the spec actually implies - do not invent scope. depends_on must reference lower seq numbers only.`;

    let result;
    try {
      result = await callModel(supabase, userId, {
        surface: "prd",
        surface_ref: `taskgraph:${data.prd_id}`,
        model: "google/gemini-2.5-pro",
        fallbackModel: "google/gemini-2.5-flash",
        responseFormat: "json_object",
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: `SPEC\nTitle: ${prd.title}\nBody:\n${(prd.body_md ?? "").slice(0, 6000)}`,
          },
        ],
      });
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : "Planner failed");
    }

    const tasksRaw = extractArrayField(result.json, "tasks") ?? [];
    const tasks = tasksRaw.slice(0, 20).map((t, i) => {
      const o = (t ?? {}) as Record<string, unknown>;
      const seq = Number.isFinite(Number(o.seq)) ? Number(o.seq) : i + 1;
      return {
        seq,
        title: String(o.title ?? "Task").slice(0, 200),
        detail: String(o.detail ?? "").slice(0, 400),
        estimate_hours: Math.max(0, Math.min(200, Number(o.estimate_hours) || 0)),
        assignee: o.assignee === "human" ? "human" : "agent",
        risk: String(o.risk ?? "").slice(0, 200),
        depends_on: Array.isArray(o.depends_on)
          ? o.depends_on.map(Number).filter((n) => Number.isFinite(n) && n < seq)
          : [],
      };
    });
    if (tasks.length === 0) throw new Error("Planner returned no tasks");

    const baseRow = (t: (typeof tasks)[number]) => ({
      user_id: userId,
      workspace_id: prd.workspace_id ?? null,
      prd_id: prd.id,
      title: t.title,
      status: "todo",
      priority: "medium",
      assignee_kind: t.assignee,
      estimate_hours: t.estimate_hours || null,
    });
    const graphRow = (t: (typeof tasks)[number]) => ({
      ...baseRow(t),
      seq: t.seq,
      detail: t.detail || null,
      risk: t.risk || null,
      depends_on: t.depends_on,
    });

    try {
      // Replace the prior generated graph; keep manual tasks (seq NULL).
      await supabase.from("tasks").delete().eq("prd_id", prd.id).not("seq", "is", null);
      const { error } = await supabase.from("tasks").insert(tasks.map(graphRow) as never);
      if (error) throw error;
      return { count: tasks.length, graph: true };
    } catch (e) {
      const err = e as { code?: string; message?: string };
      if (
        err.code === "42703" ||
        err.code === "PGRST204" ||
        /column .* does not exist|could not find the .* column/i.test(err.message ?? "")
      ) {
        // Pre-migration: insert a flat task list (no graph edges) so tasks still land.
        const { error } = await supabase.from("tasks").insert(tasks.map(baseRow) as never);
        if (error) throw new Error(error.message);
        return { count: tasks.length, graph: false };
      }
      throw new Error(err.message ?? "Task graph insert failed");
    }
  });

// ---------- SIGNALS ----------

// F3 (per-product feed): when a product is active the client passes its id and
// the feed scopes to that product (`project_id`); with no product active the
// input is empty and the query is unscoped, exactly as before (back-compatible).
// Unassigned signals (no product, e.g. the workspace ingest webhook) live in the
// all-products view, so nothing is hidden, it just is not filed under a product.
export const listSignals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ productId: z.string().uuid().nullable().optional() }).parse(i ?? {}),
  )
  .handler(async ({ context, data }) => {
    let query = context.supabase
      .from("signals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    // A product-scoped view must still surface workspace-level signals with
    // no product of their own (connector ingest - github/slack/etc - never
    // assigns project_id, since a bound repo or channel isn't inherently
    // one product in a multi-product workspace). Without the OR, every
    // connector-sensed signal silently vanished the moment ANY product was
    // active, which in practice is always, since a product is the sticky
    // default context - "unassigned signals live in the all-products view"
    // was true in principle but unreachable for real users.
    if (data.productId) query = query.or(`project_id.eq.${data.productId},project_id.is.null`);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return { signals: rows ?? [] };
  });

export const createSignal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        content: z.string().min(2).max(8000),
        source: z.string().min(1).max(40).default("manual"),
        title: z.string().max(200).optional(),
        url: z.string().url().max(500).optional().or(z.literal("")),
        sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
        project_id: z.string().uuid().nullable().optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("signals")
      .insert({
        user_id: context.userId,
        content: data.content,
        source: data.source,
        title: data.title ?? null,
        url: data.url || null,
        sentiment: data.sentiment ?? null,
        project_id: data.project_id ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { signal: row };
  });

export const bulkImportSignals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        source: z.string().min(1).max(40).default("paste"),
        // newline-separated, one signal per line
        text: z.string().min(2).max(50_000),
        // F3: file the imported signals under the active product when one is set.
        project_id: z.string().uuid().nullable().optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const lines = data.text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length >= 4)
      .slice(0, 200);
    if (!lines.length) return { inserted: 0 };
    const rows = lines.map((content) => ({
      user_id: context.userId,
      content,
      source: data.source,
      project_id: data.project_id ?? null,
    }));
    const { error } = await context.supabase.from("signals").insert(rows);
    if (error) throw new Error(error.message);
    return { inserted: rows.length };
  });

export const deleteSignal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("signals").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- THEMES ----------

export const listThemes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ productId: z.string().uuid().nullable().optional() }).parse(i ?? {}),
  )
  .handler(async ({ context, data }) => {
    let query = context.supabase
      .from("themes")
      .select("*")
      .order("frequency", { ascending: false })
      .limit(300);
    // Same fix as listSignals: a theme clustered by the cron path (projectId
    // null - it clusters a whole workspace, not one product) must still show
    // inside a product-scoped view, not just the unreachable all-products one.
    if (data.productId) query = query.or(`project_id.eq.${data.productId},project_id.is.null`);
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return { themes: rows ?? [] };
  });

/** AI cluster: read unclustered signals, ask Gemini Pro for themes JSON, persist. */
export const clusterSignals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ productId: z.string().uuid().nullable().optional() }).parse(i ?? {}),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    // Delegates to the shared core (also driven by the cluster-tick cron). The
    // manual path is RLS-scoped to the caller, so workspaceId is null; productId
    // scopes to the active product (F3 per-product), exactly as before.
    return clusterSignalsCore(supabase, userId, null, data.productId ?? null);
  });

// ---------- F3: AUTO-CLUSTER OPT-IN (workspace owner) ----------
// The cluster-tick cron only processes workspaces where auto_cluster_enabled is
// true, so unattended SENSE is OFF by default and the owner turns it on
// explicitly (it commits recurring AI spend, so it stays founder/owner-gated).

export const getWorkspaceClusterSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    // RLS ("ws owner manage") scopes this to a workspace the caller owns.
    // If the column is not migrated yet, the select soft-fails and we report
    // not-owner so the toggle simply stays hidden.
    const { data: ws } = await supabase
      .from("workspaces")
      .select("auto_cluster_enabled, last_auto_cluster_at")
      .eq("owner_id", userId)
      .limit(1)
      .maybeSingle();
    return {
      is_owner: Boolean(ws),
      enabled: ws?.auto_cluster_enabled ?? false,
      last_run_at: ws?.last_auto_cluster_at ?? null,
    };
  });

export const toggleAutoCluster = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ enabled: z.boolean() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: ws } = await supabase
      .from("workspaces")
      .select("id")
      .eq("owner_id", userId)
      .limit(1)
      .maybeSingle();
    if (!ws) throw new Error("Only the workspace owner can change auto-cluster settings.");
    const { error } = await supabase
      .from("workspaces")
      .update({ auto_cluster_enabled: data.enabled })
      .eq("id", ws.id);
    if (error) throw new Error(error.message);
    return { ok: true, enabled: data.enabled };
  });

// ---------- OPPORTUNITIES ----------

export const listOpportunities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("opportunities")
      .select("*")
      .order("ice_score", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return { opportunities: data ?? [] };
  });

export const promoteThemeToOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ theme_id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: theme, error } = await supabase
      .from("themes")
      .select("*")
      .eq("id", data.theme_id)
      .single();
    if (error || !theme) throw new Error("Theme not found");
    const { data: opp, error: oErr } = await supabase
      .from("opportunities")
      .insert({
        user_id: userId,
        theme_id: theme.id,
        title: theme.title,
        problem: theme.summary,
        hypothesis: `If we address "${theme.title}", we expect to reduce reported pain and improve activation.`,
        impact: Math.min(10, theme.severity * 2),
        confidence: Math.round(theme.confidence * 10),
        ease: 5,
      })
      .select()
      .single();
    if (oErr) throw new Error(oErr.message);
    if (opp) {
      // SEAM-1: stage history for the created opportunity.
      await recordStageEvent(supabase, {
        entityType: "opportunity",
        entityId: opp.id,
        from: null,
        to: opp.status ?? "backlog",
        actor: "human",
        workspaceId: opp.workspace_id,
        userId,
      });
      // SW-5 chain audit: fail-soft, the opportunity already exists and a
      // lineage hiccup must not fail the promotion (a retry would duplicate it).
      await recordLineageSafe(supabase, userId, {
        parent_kind: "theme",
        parent_id: theme.id,
        child_kind: "opportunity",
        child_id: opp.id,
        rationale: "Promoted from theme",
        created_by_agent: "discovery-scout",
      });
      await runCritic(supabase, userId, { kind: "opportunity", id: opp.id });
    }
    return { opportunity: opp };
  });

export const updateOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        problem: z.string().max(2000).optional(),
        target_user: z.string().max(200).nullable().optional(),
        hypothesis: z.string().max(1000).nullable().optional(),
        impact: z.number().int().min(1).max(10).optional(),
        confidence: z.number().int().min(1).max(10).optional(),
        ease: z.number().int().min(1).max(10).optional(),
        status: z.enum(["backlog", "now", "next", "later", "shipped", "dropped"]).optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { id, ...rest } = data;

    // SEAM-1: capture the prior stage before a status-bearing update.
    let prior: { status: string | null; workspace_id: string | null; user_id: string } | null =
      null;
    if (rest.status) {
      const { data: p } = await context.supabase
        .from("opportunities")
        .select("status,workspace_id,user_id")
        .eq("id", id)
        .maybeSingle();
      prior = p ?? null;
    }

    const patch = { ...rest, updated_at: new Date().toISOString() };
    const { data: row, error } = await context.supabase
      .from("opportunities")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    if (rest.status) {
      await recordStageEvent(context.supabase, {
        entityType: "opportunity",
        entityId: id,
        from: prior?.status ?? null,
        to: rest.status,
        actor: "human",
        workspaceId: prior?.workspace_id ?? null,
        userId: prior?.user_id ?? context.userId,
      });
    }
    return { opportunity: row };
  });

export const deleteOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("opportunities").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- PRDs ----------

export const listPrds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("prds")
      .select("id,title,status,updated_at,opportunity_id,github_issue_url")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { prds: data ?? [] };
  });

/**
 * Specs table (Product · Specs, Ember Editorial port): PRD rows plus the
 * Critic verdict and citation payload the reference's State/Critic/Cites
 * columns render. Additive — `listPrds` keeps its narrow select for existing
 * consumers (roadmap, pickers).
 */
export const listSpecs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("prds")
      .select("id,title,status,updated_at,opportunity_id,github_issue_url,critic_review,citations")
      .order("updated_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return { prds: data ?? [] };
  });

export const getPrd = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("prds")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return { prd: row };
  });

// ---------- CNV-01: The Outcome Contract (typed dual projection) ----------
// v12 sec 7.4: a typed contract (JSONB sections) alongside body_md, backward
// compatible. body_md stays the human narrative; `contract` is the machine
// view an agent can consume directly instead of re-parsing prose. Clauses
// are individually supersedable using the same standing/superseded idiom
// FS-02's `assumptions.status` already uses (an edit never overwrites a
// clause in place; see supersedeContractClause below).

const ContractClauseSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1).max(2000),
  status: z.enum(["standing", "superseded"]),
  superseded_by: z.string().uuid().nullable(),
  // Filled in by CNV-02's requirement-to-oracle compiler; every clause starts
  // unclassified. oracle_ref points at the eval_case id ("eval"), the
  // assumption id ("unverifiable"), or an inline label/checklist text
  // ("ci"/"uat" — no separate row needed for those two kinds).
  oracle_kind: z.enum(["eval", "ci", "uat", "unverifiable"]).nullable(),
  oracle_ref: z.string().max(2000).nullable(),
  // "uat" clauses only: a real checklist item the human ticks off.
  uat_checked: z.boolean().optional(),
  uat_checked_at: z.string().nullable().optional(),
  created_at: z.string(),
});
export type ContractClause = z.infer<typeof ContractClauseSchema>;

export const OutcomeContractSchema = z.object({
  version: z.number().int().min(1),
  intent: z.string().max(2000),
  evidence_links: z
    .array(
      z.object({
        source_kind: z.string().max(40),
        source_id: z.string().max(100),
        title: z.string().max(200).nullable(),
      }),
    )
    .default([]),
  success_metrics: z.array(ContractClauseSchema).default([]),
  non_goals: z.array(ContractClauseSchema).default([]),
  budget: z
    .object({
      estimate: z.string().max(200).nullable(),
      blast_radius: z.string().max(500).nullable(),
    })
    .nullable(),
  ambiguity_policy: z.string().max(1000).nullable(),
  drafted_by: z.enum(["agent", "human"]),
  drafted_at: z.string(),
});
export type OutcomeContract = z.infer<typeof OutcomeContractSchema>;

const CONTRACT_DRAFT_SYSTEM = `You are the Cadence contract analyst. Given a spec's title and markdown body, extract a structured Outcome Contract from what it already says.
Rules:
- intent: one tight paragraph, the core bet in plain language.
- success_metrics: the acceptance criteria / success metrics as short, individually falsifiable statements (max 8, most load-bearing first).
- non_goals: what is explicitly out of scope, as short statements (max 6).
- budget_estimate and blast_radius: a rough cost/effort note and what breaks if this goes wrong, only if the text actually addresses them, else null.
- ambiguity_policy: one sentence on how to resolve ambiguity, only if the text states or clearly implies one, else null.
- Extract only what the text supports. Never invent a metric, non-goal, or policy it does not contain.
- Signal-first: state each item directly, no hedging.
- No em dashes, no en dashes, no AI cliches (delve, leverage, unlock, game-changer, crucial).
- Output ONLY valid JSON: {"intent": "...", "success_metrics": ["..."], "non_goals": ["..."], "budget_estimate": "..." or null, "blast_radius": "..." or null, "ambiguity_policy": "..." or null}`;

function draftedClause(text: string, nowIso: string): ContractClause {
  return {
    id: crypto.randomUUID(),
    text: text.slice(0, 2000),
    status: "standing",
    superseded_by: null,
    oracle_kind: null,
    oracle_ref: null,
    created_at: nowIso,
  };
}

function draftedStrings(v: unknown, max: number): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((s): s is string => typeof s === "string" && s.trim().length > 0)
    .slice(0, max)
    .map((s) => s.trim());
}

/**
 * Pure: mark one clause superseded and append its replacement as a new
 * standing clause. Never mutates a clause in place, so a machine reader can
 * always see what a requirement used to say and why it changed. Exported for
 * unit tests (same pattern as assumption-watch.server.ts's deriveWatchVerdict).
 */
export function supersedeClause(
  clauses: ContractClause[],
  clauseId: string,
  newText: string,
  nowIso: string,
): ContractClause[] {
  const idx = clauses.findIndex((c) => c.id === clauseId);
  if (idx === -1) throw new Error("Clause not found");
  if (clauses[idx].status === "superseded") throw new Error("That clause is already superseded");

  const next = draftedClause(newText, nowIso);
  const updated = [...clauses];
  updated[idx] = { ...updated[idx], status: "superseded", superseded_by: next.id };
  updated.push(next);
  return updated;
}

/**
 * AI: structure an existing PRD's narrative body into an Outcome Contract.
 * Returns a DRAFT only — nothing is persisted here. The lazy-migration flow
 * this backs (v12: "AI structures on open, human confirms") always ends with
 * the human reviewing the draft and calling savePrd({ id, contract }) to
 * apply it, same as any other spec edit.
 */
export const draftContractFromPrd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: prd, error } = await supabase
      .from("prds")
      .select("id,title,body_md,workspace_id")
      .eq("id", data.id)
      .single();
    if (error || !prd) throw new Error(error?.message ?? "Spec not found");
    if (!(prd.body_md ?? "").trim()) throw new Error("This spec has no content to structure yet");

    const res = await callModel(supabase, userId, {
      surface: "prd",
      surface_ref: "contract_draft",
      model: "google/gemini-2.5-flash",
      workspaceId: prd.workspace_id,
      responseFormat: "json_object",
      messages: [
        { role: "system", content: CONTRACT_DRAFT_SYSTEM },
        {
          role: "user",
          content: `TITLE: ${prd.title}\n\nBODY:\n${(prd.body_md ?? "").slice(0, 12000)}`,
        },
      ],
    });
    const j = (res.json ?? {}) as {
      intent?: unknown;
      success_metrics?: unknown;
      non_goals?: unknown;
      budget_estimate?: unknown;
      blast_radius?: unknown;
      ambiguity_policy?: unknown;
    };

    const nowIso = new Date().toISOString();
    const intent = typeof j.intent === "string" ? j.intent.trim().slice(0, 2000) : "";
    if (!intent) throw new Error("Could not extract a clear intent from this spec's content");

    const budgetEstimate =
      typeof j.budget_estimate === "string" ? j.budget_estimate.trim().slice(0, 200) : null;
    const blastRadius =
      typeof j.blast_radius === "string" ? j.blast_radius.trim().slice(0, 500) : null;

    const contract: OutcomeContract = {
      version: 1,
      intent,
      evidence_links: [],
      success_metrics: draftedStrings(j.success_metrics, 8).map((t) => draftedClause(t, nowIso)),
      non_goals: draftedStrings(j.non_goals, 6).map((t) => draftedClause(t, nowIso)),
      budget:
        budgetEstimate || blastRadius
          ? { estimate: budgetEstimate, blast_radius: blastRadius }
          : null,
      ambiguity_policy:
        typeof j.ambiguity_policy === "string" ? j.ambiguity_policy.trim().slice(0, 1000) : null,
      drafted_by: "agent",
      drafted_at: nowIso,
    };
    return { contract };
  });

// ---------- CNV-04: agent-authored contracts (the friction killer) ----------

const CONTRACT_FROM_INTENT_SYSTEM = `You are the Cadence contract author. Given a one-line product intent plus standing workspace context and precedent (prior specs, docs, notes, meetings — numbered chunks you may draw from), draft a full Outcome Contract in seconds so the human edits deltas instead of writing from a blank page.
Rules:
- intent: restate the bet as one tight, sharpened paragraph (not the one-liner verbatim).
- success_metrics: up to 6 falsifiable acceptance criteria / success metrics, most load-bearing first.
- non_goals: up to 5 explicit out-of-scope statements.
- budget_estimate: a rough size/effort note (e.g. "Size M, roughly 2-3 days"). Null if nothing in the intent or context supports an estimate.
- blast_radius: what breaks or is at risk if this goes wrong. Null if genuinely unclear.
- ambiguity_policy: one sentence on how to resolve ambiguity while building this — default to the reversible interpretation, log the assumption, escalate only if irreversible or over budget.
- clarifying_questions: at most 5 questions, ONLY the ones that are genuinely load-bearing and cannot be inferred from the intent or context. Empty array if there is nothing that actually blocks starting.
- narrative: a short Markdown body (## Problem, ## Approach, ## Success Metrics, ## Non-Goals, ## Budget & Risk), under 400 words, restating the same content for human reading. Cite context chunks inline as [n] where you draw from them.
- Ground everything you can in the provided context. Where nothing supports a field, still fill intent/success_metrics/non_goals from the intent alone, but leave budget_estimate/blast_radius/ambiguity_policy null rather than inventing specifics.
- Signal-first: state each item directly, no hedging.
- No em dashes, no en dashes, no AI cliches (delve, leverage, unlock, game-changer, crucial).
- Output ONLY valid JSON: {"intent": "...", "success_metrics": ["..."], "non_goals": ["..."], "budget_estimate": "..." or null, "blast_radius": "..." or null, "ambiguity_policy": "...", "clarifying_questions": ["..."], "narrative": "..."}`;

/**
 * AI: draft a full Outcome Contract from a one-line intent — standing
 * context and precedent pulled from the same RAG index generatePrd already
 * uses (prior PRDs are indexed as source_kind "prd", so precedent is real,
 * not just workspace docs). Unlike draftContractFromPrd (which drafts a
 * PREVIEW for an existing spec the human must apply), this creates the spec
 * immediately: v12's "the agent authors the contract in seconds," so the
 * human's first touch is judging deltas on a real row, not confirming a
 * blank-page draft into existence.
 */
export const draftContractFromIntent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ intent: z.string().trim().min(3).max(400) }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    let chunks: Awaited<ReturnType<typeof retrieve>> = [];
    try {
      chunks = await retrieve(supabase, userId, { query: data.intent, k: 8, mmr: true });
    } catch {
      chunks = [];
    }
    const citations = chunks.map((c, i) => ({
      n: i + 1,
      source_kind: c.source_kind,
      source_id: c.source_id,
      title: c.title ?? null,
      snippet: c.content.slice(0, 280),
      score: Number((c.similarity ?? 0).toFixed(3)),
    }));
    const contextBlock =
      chunks.length === 0
        ? "\n\n(No standing context or precedent found for this intent — draft from the intent alone.)"
        : `\n\nSTANDING CONTEXT + PRECEDENT (cite as [n] in the narrative if you draw from it):\n${chunks
            .map(
              (c, i) =>
                `[${i + 1}] (${c.source_kind}${c.title ? ` · ${c.title.slice(0, 80)}` : ""}) ${c.content.slice(0, 600)}`,
            )
            .join("\n\n")}`;

    const res = await callModel(supabase, userId, {
      surface: "prd",
      surface_ref: "contract_from_intent",
      model: "google/gemini-2.5-pro",
      fallbackModel: "google/gemini-2.5-flash",
      responseFormat: "json_object",
      messages: [
        { role: "system", content: CONTRACT_FROM_INTENT_SYSTEM },
        { role: "user", content: `ONE-LINE INTENT: ${data.intent}${contextBlock}` },
      ],
    });
    const j = (res.json ?? {}) as {
      intent?: unknown;
      success_metrics?: unknown;
      non_goals?: unknown;
      budget_estimate?: unknown;
      blast_radius?: unknown;
      ambiguity_policy?: unknown;
      clarifying_questions?: unknown;
      narrative?: unknown;
    };

    const nowIso = new Date().toISOString();
    const intent =
      typeof j.intent === "string" && j.intent.trim()
        ? j.intent.trim().slice(0, 2000)
        : data.intent;
    const budgetEstimate =
      typeof j.budget_estimate === "string" ? j.budget_estimate.trim().slice(0, 200) : null;
    const blastRadius =
      typeof j.blast_radius === "string" ? j.blast_radius.trim().slice(0, 500) : null;
    const clarifyingQuestions = draftedStrings(j.clarifying_questions, 5).map((q) =>
      q.slice(0, 300),
    );

    const contract: OutcomeContract = {
      version: 1,
      intent,
      evidence_links: citations.map((c) => ({
        source_kind: c.source_kind,
        source_id: c.source_id ?? "",
        title: c.title,
      })),
      success_metrics: draftedStrings(j.success_metrics, 6).map((t) => draftedClause(t, nowIso)),
      non_goals: draftedStrings(j.non_goals, 5).map((t) => draftedClause(t, nowIso)),
      budget:
        budgetEstimate || blastRadius
          ? { estimate: budgetEstimate, blast_radius: blastRadius }
          : null,
      ambiguity_policy:
        typeof j.ambiguity_policy === "string" ? j.ambiguity_policy.trim().slice(0, 1000) : null,
      drafted_by: "agent",
      drafted_at: nowIso,
    };

    let narrative = typeof j.narrative === "string" ? j.narrative.trim() : "";
    if (!narrative) narrative = `## Intent\n${intent}`;
    if (clarifyingQuestions.length > 0) {
      narrative = `## Open questions for you\n${clarifyingQuestions.map((q) => `- ${q}`).join("\n")}\n\n${narrative}`;
    }
    narrative = narrative.slice(0, 8000);

    const title = data.intent.length <= 80 ? data.intent : `${data.intent.slice(0, 77)}…`;

    const { data: prd, error } = await supabase
      .from("prds")
      .insert({
        user_id: userId,
        title,
        body_md: narrative,
        model: "google/gemini-2.5-pro",
        citations,
        contract,
        contract_migrated_at: nowIso,
      })
      .select()
      .single();
    if (error || !prd) throw new Error(error?.message ?? "Could not create the spec");

    // SEAM-1: stage history for the created spec (DB default status is draft).
    await recordStageEvent(supabase, {
      entityType: "spec",
      entityId: prd.id,
      from: null,
      to: prd.status ?? "draft",
      actor: "human",
      workspaceId: prd.workspace_id,
      userId,
    });

    await runCritic(supabase, userId, { kind: "prd", id: prd.id });

    // AGT-03: while the human reviews this freshly drafted contract, pre-stage
    // a design scaffold in the background — fire-and-forget, never awaited,
    // never lets a prep failure affect this response.
    void prepareScaffoldSpeculative(supabase, userId, { prdId: prd.id, specBody: narrative }).catch(
      () => {},
    );

    // RPT-23: automatically compile contract oracles (the machine-checkable eval
    // twin) at creation time. Fire-and-forget: the human reviews the contract
    // while the eval suite and assumptions are prepared in the background, and a
    // prep failure never affects this response. Calls the core directly (not the
    // server-fn wrapper) so it runs with this handler's supabase/userId context.
    void compileContractOraclesCore(supabase, userId, prd.id, { guardConcurrentEdit: true }).catch(
      () => {},
    );

    return { prd, clarifying_questions: clarifyingQuestions };
  });

/**
 * Supersede one contract clause: the prior clause is marked superseded and
 * points at its replacement, a new standing clause is appended. Never
 * mutates a clause in place, so a machine reader can always see what a
 * requirement used to say and why it changed.
 */
export const supersedeContractClause = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        section: z.enum(["success_metrics", "non_goals"]),
        clause_id: z.string().uuid(),
        new_text: z.string().min(1).max(2000),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: prd, error } = await supabase
      .from("prds")
      .select("contract")
      .eq("id", data.id)
      .single();
    if (error || !prd) throw new Error(error?.message ?? "Spec not found");

    let contract: z.infer<ReturnType<typeof OutcomeContractSchema.partial>>;
    try {
      contract = OutcomeContractSchema.partial().parse(prd.contract ?? {});
    } catch {
      throw new Error("This spec's contract is in an unexpected shape and cannot be edited here");
    }
    const nowIso = new Date().toISOString();
    const clauses = supersedeClause(
      contract[data.section] ?? [],
      data.clause_id,
      data.new_text,
      nowIso,
    );

    const updatedContract = { ...contract, [data.section]: clauses };
    const { data: updated, error: upErr } = await supabase
      .from("prds")
      .update({ contract: updatedContract, updated_at: nowIso })
      .eq("id", data.id)
      .select("id")
      .maybeSingle();
    if (upErr) throw new Error(upErr.message);
    if (!updated) throw new Error("Spec not found");
    return { contract: updatedContract };
  });

// ---------- CNV-02: the requirement-to-oracle compiler ----------
// v12 sec 7.2: "a requirement without an oracle is an assumption, and
// assumptions get watched, not asserted." Compiles each success-metric
// clause into whichever real oracle already exists for its kind: an eval
// case (evals engine, LLM-judged), the standard CI gate (inline label, no
// new artifact — Cadence cannot mint a GitHub check per clause), a UAT
// checklist item (inline, human-ticked), or — when a clause is not
// falsifiable as written — a watched assumption (FS-02), so it is tracked
// against contradicting signals instead of silently asserted.

const ORACLE_CLASSIFY_SYSTEM = `You are the Cadence oracle compiler. For each acceptance-criteria clause from a spec's Outcome Contract, classify how it can be verified.
Rules:
- "eval": a qualitative or behavioral claim an LLM judge can grade against the spec's intent. Most product claims land here.
- "ci": already covered by the standard CI gate (type-check, lint, automated tests) with no new artifact needed. Use ONLY for claims that are inherently about code correctness or build health, not product behavior.
- "uat": requires a human to manually verify (visual or design judgment, external system state, anything an LLM cannot check from text alone).
- "unverifiable": not falsifiable as written — vague, unmeasurable, or opinion, and cannot become a real oracle without rewriting the clause itself.
- Exactly one classification per clause, indexed to match the input.
- No em dashes, no en dashes, no AI cliches (delve, leverage, unlock, game-changer, crucial).
- Output ONLY valid JSON: {"classifications": [{"index": 0, "oracle_kind": "eval" | "ci" | "uat" | "unverifiable", "rationale": "max 140 chars"}]}`;

type OracleKind = "eval" | "ci" | "uat" | "unverifiable";

/**
 * Pure: turn the model's raw classification JSON into a validated
 * index -> oracle_kind map. An out-of-range or malformed entry is dropped
 * rather than trusted. Exported for unit tests (same pattern as
 * assumption-watch.server.ts's deriveWatchVerdict).
 */
export function deriveOracleClassifications(
  raw: unknown[],
  count: number,
): Map<number, OracleKind> {
  const kindByIndex = new Map<number, OracleKind>();
  for (const r of raw) {
    const o = (r ?? {}) as Record<string, unknown>;
    const idx = Number(o.index);
    const kind = o.oracle_kind;
    if (
      Number.isInteger(idx) &&
      idx >= 0 &&
      idx < count &&
      (kind === "eval" || kind === "ci" || kind === "uat" || kind === "unverifiable")
    ) {
      kindByIndex.set(idx, kind);
    }
  }
  return kindByIndex;
}

/**
 * Compile every unclassified success-metric clause on a spec's contract into
 * a real oracle. Idempotent per clause: already-classified clauses are
 * skipped, so re-running after adding new metrics only compiles the new
 * ones. Best-effort on the assumption-filing half (a failed insert still
 * leaves the clause correctly classified "unverifiable"; only the pointer
 * back to the assumption row is missing).
 */
export const compileContractOracles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(({ context, data }) =>
    compileContractOraclesCore(context.supabase, context.userId, data.id),
  );

/**
 * CNV-02 oracle-compilation core, callable with an explicit (supabase, userId).
 * Runs both from the server-fn wrapper AND fire-and-forget at spec creation,
 * where there is no request context to run the auth middleware. Compiling the
 * machine-checkable eval twin automatically at creation is the RPT-23
 * "attached at creation" half; the savePrd approve gate is the enforcement half.
 */
async function compileContractOraclesCore(
  supabase: SupabaseClient,
  userId: string,
  prdId: string,
  opts: { guardConcurrentEdit?: boolean } = {},
) {
  const { data: prd, error } = await supabase
    .from("prds")
    .select("id,title,workspace_id,contract,updated_at")
    .eq("id", prdId)
    .single();
  if (error || !prd) throw new Error(error?.message ?? "Spec not found");
  const readUpdatedAt = (prd as { updated_at?: string | null }).updated_at ?? null;

  const contract = OutcomeContractSchema.partial().parse(prd.contract ?? {});
  const metrics = contract.success_metrics ?? [];
  const uncompiled = metrics.filter((c) => c.status === "standing" && !c.oracle_kind);
  if (uncompiled.length === 0) {
    return { contract, eval_cases_created: 0, ci_count: 0, uat_count: 0, assumptions_filed: 0 };
  }

  const res = await callModel(supabase, userId, {
    surface: "prd",
    surface_ref: "oracle_compile",
    model: "google/gemini-2.5-flash",
    workspaceId: prd.workspace_id,
    responseFormat: "json_object",
    messages: [
      { role: "system", content: ORACLE_CLASSIFY_SYSTEM },
      { role: "user", content: uncompiled.map((c, i) => `[${i}] ${c.text}`).join("\n") },
    ],
  });
  const raw = extractArrayField(res.json, "classifications") ?? [];
  const kindByIndex = deriveOracleClassifications(raw, uncompiled.length);
  const kindFor = (clauseId: string): OracleKind => {
    const idx = uncompiled.findIndex((u) => u.id === clauseId);
    return idx === -1 ? "unverifiable" : (kindByIndex.get(idx) ?? "unverifiable");
  };

  const evalTargets = uncompiled.filter((c) => kindFor(c.id) === "eval");
  const oracleRefByClauseId = new Map<string, string>();
  let evalCasesCreated = 0;

  if (evalTargets.length > 0) {
    const { data: existingSuite } = await supabase
      .from("eval_suites")
      .select("id")
      .eq("prd_id", prdId)
      .maybeSingle();
    let suiteId = (existingSuite?.id as string | undefined) ?? null;
    if (!suiteId) {
      const { data: newSuite, error: suiteErr } = await supabase
        .from("eval_suites")
        .insert({
          user_id: userId,
          name: `Spec acceptance: ${prd.title}`.slice(0, 200),
          description: "Compiled from this spec's Outcome Contract success metrics (CNV-02).",
          surface: "prd-acceptance",
          prompt_key: `prd:${prdId}`,
          prd_id: prdId,
        })
        .select("id")
        .single();
      if (suiteErr || !newSuite) {
        throw new Error(suiteErr?.message ?? "Could not create the eval suite");
      }
      suiteId = newSuite.id;
    }

    const { data: newCases, error: caseErr } = await supabase
      .from("eval_cases")
      .insert(
        evalTargets.map((c) => ({
          user_id: userId,
          suite_id: suiteId,
          name: c.text.slice(0, 200),
          input:
            `Spec: ${prd.title}\n\nDoes the implementation satisfy this acceptance criterion?\n${c.text}`.slice(
              0,
              20000,
            ),
          rubric: c.text.slice(0, 4000),
        })),
      )
      // A single multi-row INSERT's RETURNING preserves the VALUES order,
      // so zipping by index against evalTargets is safe here.
      .select("id");
    if (caseErr || !newCases) throw new Error(caseErr?.message ?? "Could not create eval cases");
    evalTargets.forEach((c, i) => {
      const row = newCases[i];
      if (row) oracleRefByClauseId.set(c.id, row.id);
    });
    evalCasesCreated = newCases.length;
  }

  const unverifiableTargets = uncompiled.filter((c) => kindFor(c.id) === "unverifiable");
  let assumptionsFiled = 0;
  if (unverifiableTargets.length > 0) {
    const { data: newAssumptions, error: aErr } = await supabase
      .from("assumptions")
      .insert(
        unverifiableTargets.map((c) => ({
          user_id: userId,
          workspace_id: prd.workspace_id,
          prd_id: prdId,
          statement: c.text.slice(0, 500),
        })),
      )
      .select("id");
    if (!aErr && newAssumptions) {
      unverifiableTargets.forEach((c, i) => {
        const row = newAssumptions[i];
        if (row) oracleRefByClauseId.set(c.id, row.id);
      });
      assumptionsFiled = newAssumptions.length;
    }
  }

  let ciCount = 0;
  let uatCount = 0;
  const updatedMetrics = metrics.map((c) => {
    if (c.status !== "standing" || c.oracle_kind) return c;
    const kind = kindFor(c.id);
    if (kind === "ci") {
      ciCount++;
      return {
        ...c,
        oracle_kind: "ci" as const,
        oracle_ref: "Covered by the standard CI gate (type-check, lint, automated tests).",
      };
    }
    if (kind === "uat") {
      uatCount++;
      return { ...c, oracle_kind: "uat" as const, oracle_ref: c.text, uat_checked: false };
    }
    return { ...c, oracle_kind: kind, oracle_ref: oracleRefByClauseId.get(c.id) ?? null };
  });

  const updatedContract = { ...contract, success_metrics: updatedMetrics };
  let updateQuery = supabase
    .from("prds")
    .update({ contract: updatedContract, updated_at: new Date().toISOString() })
    .eq("id", prdId);
  // Optimistic concurrency for the fire-and-forget creation path: this compile
  // read the contract seconds ago and did a multi-second AI round-trip, so a
  // full-column write here could clobber a concurrent user edit (supersede /
  // save / UAT toggle) made in that window. Guard on the read-time updated_at so
  // a compile that lost the race no-ops instead of silently overwriting the edit.
  // The user-initiated "Compile" button (no guard) keeps its unconditional write,
  // since the user's own click is the latest intent.
  if (opts.guardConcurrentEdit && readUpdatedAt) {
    updateQuery = updateQuery.eq("updated_at", readUpdatedAt);
  }
  const { error: upErr } = await updateQuery;
  if (upErr) throw new Error(upErr.message);

  return {
    contract: updatedContract,
    eval_cases_created: evalCasesCreated,
    ci_count: ciCount,
    uat_count: uatCount,
    assumptions_filed: assumptionsFiled,
  };
}

/** Tick or untick a "uat" clause's manual checklist item. */
export const toggleUatChecklistItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({ id: z.string().uuid(), clause_id: z.string().uuid(), checked: z.boolean() })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: prd, error } = await supabase
      .from("prds")
      .select("contract")
      .eq("id", data.id)
      .single();
    if (error || !prd) throw new Error(error?.message ?? "Spec not found");

    const contract = OutcomeContractSchema.partial().parse(prd.contract ?? {});
    const metrics = contract.success_metrics ?? [];
    const idx = metrics.findIndex((c) => c.id === data.clause_id);
    if (idx === -1) throw new Error("Clause not found");
    if (metrics[idx].oracle_kind !== "uat") throw new Error("Not a UAT checklist clause");

    const nowIso = new Date().toISOString();
    const updatedMetrics = [...metrics];
    updatedMetrics[idx] = {
      ...updatedMetrics[idx],
      uat_checked: data.checked,
      uat_checked_at: data.checked ? nowIso : null,
    };

    const updatedContract = { ...contract, success_metrics: updatedMetrics };
    const { data: updated, error: upErr } = await supabase
      .from("prds")
      .update({ contract: updatedContract, updated_at: nowIso })
      .eq("id", data.id)
      .select("id")
      .maybeSingle();
    if (upErr) throw new Error(upErr.message);
    if (!updated) throw new Error("Spec not found");
    return { contract: updatedContract };
  });

export const savePrd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        body_md: z.string().max(50_000).optional(),
        status: z.enum(["draft", "review", "approved", "shipped"]).optional(),
        // CNV-01: the human's confirm step for a drafted/edited Outcome Contract.
        // savePrd is the one write path for both projections (narrative + typed),
        // so status-transition and history logic below never has to special-case it.
        contract: OutcomeContractSchema.optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { id, ...rest } = data;
    const { supabase, userId } = context;

    // Capture prior status so we can detect a draft/review → approved transition
    // and write a Decisions log entry exactly once. `contract` is read too so the
    // RPT-23 verifiability gate can grade the effective contract on approval.
    const { data: prior } = await supabase
      .from("prds")
      .select("status,workspace_id,title,body_md,contract")
      .eq("id", id)
      .maybeSingle();

    // RPT-23: an Outcome Contract that can never be checked on outcome day must
    // not be signed off. On a first approve transition, grade the effective
    // contract (the one being saved, else the one already on the spec); if it
    // has metrics but none are verifiable ("hazy"), refuse the approval and tell
    // the owner exactly what to fix. A spec with no contract at all is exempt so
    // legacy specs still approve. This is the "receipts are the test suite of
    // decision work, enforced at creation" gate.
    if (rest.status === "approved" && (prior?.status ?? null) !== "approved") {
      const rawContract =
        rest.contract ?? (prior as { contract?: unknown } | null)?.contract ?? null;
      const parsed = OutcomeContractSchema.partial().safeParse(rawContract ?? {});
      if (parsed.success && (parsed.data.intent ?? "").trim()) {
        const grade = gradeOutcomeContract({ success_metrics: parsed.data.success_metrics ?? [] });
        if (grade.blocksApproval) {
          throw new Error(`Can't approve this spec yet. ${grade.reason}`);
        }
      }
    }

    const patch: Record<string, unknown> = { ...rest, updated_at: new Date().toISOString() };
    if (rest.contract && rest.contract.intent.trim()) {
      patch.contract_migrated_at = new Date().toISOString();
    }

    const { data: row, error } = await supabase
      .from("prds")
      .update(patch)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);

    // SEAM-1: stage history for a status-bearing spec save (helper skips no-ops).
    if (rest.status) {
      await recordStageEvent(supabase, {
        entityType: "spec",
        entityId: id,
        from: prior?.status ?? null,
        to: rest.status,
        actor: "human",
        workspaceId: prior?.workspace_id ?? null,
        userId,
      });
    }

    // F-DECISIONS-CAPTURE: spec approval is a logged decision. Idempotent on prd_id.
    if (prior && rest.status === "approved" && prior.status !== "approved") {
      const { count } = await supabase
        .from("decisions")
        .select("id", { count: "exact", head: true })
        .eq("prd_id", id);
      if ((count ?? 0) === 0) {
        const title = (rest.title ?? prior.title ?? "Untitled spec").slice(0, 240);
        const rationale = (prior.body_md ?? "").slice(0, 500) || "Spec approved.";
        const { data: decision } = await supabase
          .from("decisions")
          .insert({
            user_id: userId,
            workspace_id: prior.workspace_id,
            title: `Spec approved: ${title}`,
            rationale,
            status: "approved",
            prd_id: id,
            source_kind: "prd",
          })
          .select("id")
          .single();
        if (decision) {
          // SEAM-1: stage history for the captured decision.
          await recordStageEvent(supabase, {
            entityType: "decision",
            entityId: decision.id,
            from: null,
            to: "approved",
            actor: "human",
            workspaceId: prior.workspace_id,
            userId,
          });
        }
      }
    }

    return { prd: row };
  });

export const deletePrd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("prds").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Create a GitHub issue from a PRD and link it back on the PRD row.
 * One-click bridge between Build → PRDs and the Build Console: once an issue
 * exists, the "Send to Builder" button on the PRD detail page lights up.
 * Idempotent on the PRD: if github_issue_url is already set, returns it.
 */
export const createGithubIssueForPrd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: prd, error: prdErr } = await supabase
      .from("prds")
      .select("id,title,body_md,github_issue_url,workspace_id")
      .eq("id", data.id)
      .single();
    if (prdErr) throw new Error(prdErr.message);
    if (prd.github_issue_url) {
      return { url: prd.github_issue_url, cached: true };
    }

    const gh = await resolveGitHub({
      userId,
      workspaceId: prd.workspace_id,
      userClient: supabase as unknown as SupabaseClient,
    });

    const body = `${(prd.body_md ?? "").slice(0, 55_000)}\n\n---\n_Opened from Cadence PRD ${prd.id}_`;
    const res = await fetch(`https://api.github.com/repos/${gh.repo}/issues`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${gh.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "cadence-agent",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title: prd.title.slice(0, 250), body, labels: ["cadence", "prd"] }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`GitHub ${res.status}: ${txt.slice(0, 400)}`);
    }
    const json = (await res.json()) as { number: number; html_url: string };

    const { error: upErr } = await supabase
      .from("prds")
      .update({ github_issue_url: json.html_url, updated_at: new Date().toISOString() })
      .eq("id", prd.id);
    if (upErr) throw new Error(upErr.message);

    return { url: json.html_url, number: json.number, cached: false };
  });

/** AI: generate a PRD from an opportunity (or from a freeform brief). */
export const generatePrd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        opportunity_id: z.string().uuid().optional(),
        brief: z.string().max(4000).optional(),
        model: z.string().max(80).default("google/gemini-2.5-pro"),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    let source = data.brief ?? "";
    let oppId: string | null = null;
    let title = "";

    if (data.opportunity_id) {
      const { data: opp, error } = await supabase
        .from("opportunities")
        .select("*")
        .eq("id", data.opportunity_id)
        .single();
      if (error || !opp) throw new Error("Opportunity not found");
      title = opp.title;
      oppId = opp.id;
      source = `Title: ${opp.title}
Problem: ${opp.problem}
Target user: ${opp.target_user ?? "Not specified"}
Hypothesis: ${opp.hypothesis ?? ""}
ICE — Impact:${opp.impact} Confidence:${opp.confidence} Ease:${opp.ease}`;
    }
    if (!source.trim()) throw new Error("Provide an opportunity or a brief.");

    // Derive a concise title from the brief when there's no opportunity.
    if (!title) {
      try {
        const titleResult = await callModel(supabase, userId, {
          surface: "prd",
          surface_ref: "title",
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "Return a single concise spec title (max 70 chars, Title Case, no quotes, no trailing punctuation). Only the title, nothing else.",
            },
            { role: "user", content: source.slice(0, 2000) },
          ],
        });
        title = (titleResult.output || "")
          .trim()
          .replace(/^["'`]+|["'`]+$/g, "")
          .split("\n")[0]
          .slice(0, 120);
      } catch {
        // fall through to heuristic
      }
      if (!title) {
        const firstLine = source.trim().split(/[\n.!?]/)[0] ?? "";
        title = firstLine.slice(0, 80).trim() || "Untitled spec";
      }
    }

    const system = `You are a senior product manager writing a crisp, opinionated spec in Markdown.
Sections (use ## headings, in this exact order):
## Problem
## Target Users
## Hypothesis
## Success Metrics
## Scope (MVP)
## Out of Scope
## Risks & Open Questions
## Milestones

Be concrete, terse, and useful. Use tight bullets. No filler.

When the user message contains a CONTEXT block with numbered chunks (e.g. [1], [2]), cite them inline using those numbers wherever you draw from them. Do not invent citation numbers.`;

    // RAG: retrieve workspace evidence (signals, docs, meetings, notes) and
    // expose it as numbered chunks the model can cite as [n]. Citations are
    // persisted on the PRD row so the UI can deep-link back to each source.
    const ragQuery = `${title}\n${source}`.slice(0, 1200);
    let chunks: Awaited<ReturnType<typeof retrieve>> = [];
    try {
      chunks = await retrieve(supabase, userId, { query: ragQuery, k: 8, mmr: true });
    } catch {
      chunks = [];
    }
    const citations = chunks.map((c, i) => ({
      n: i + 1,
      source_kind: c.source_kind,
      source_id: c.source_id,
      title: c.title ?? null,
      snippet: c.content.slice(0, 280),
      score: Number((c.similarity ?? 0).toFixed(3)),
    }));
    const contextBlock =
      chunks.length === 0
        ? ""
        : `\n\nCONTEXT (cite as [n]):\n${chunks
            .map(
              (c, i) =>
                `[${i + 1}] (${c.source_kind}${c.title ? ` · ${c.title.slice(0, 80)}` : ""}) ${c.content.slice(0, 600)}`,
            )
            .join("\n\n")}`;

    const result = await callModel(supabase, userId, {
      surface: "prd",
      surface_ref: oppId ? `opp:${oppId}` : "brief",
      model: data.model,
      fallbackModel: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: system },
        { role: "user", content: source + contextBlock },
      ],
    });
    const body_md = result.output;
    if (!body_md.trim()) throw new Error("AI returned an empty spec");

    // Mission 3.3: the draft flow leads with the contract. Structure the
    // freshly generated narrative into an agent-authored Outcome Contract
    // (same extraction prompt as draftContractFromPrd, same build shape as
    // draftContractFromIntent) so the spec is born contract-first, with
    // body_md kept as the secondary prose projection.
    const contractRes = await callModel(supabase, userId, {
      surface: "prd",
      surface_ref: "contract_from_generate",
      model: "google/gemini-2.5-flash",
      responseFormat: "json_object",
      messages: [
        { role: "system", content: CONTRACT_DRAFT_SYSTEM },
        { role: "user", content: `TITLE: ${title}\n\nBODY:\n${body_md.slice(0, 12000)}` },
      ],
    });
    const cj = (contractRes.json ?? {}) as {
      intent?: unknown;
      success_metrics?: unknown;
      non_goals?: unknown;
      budget_estimate?: unknown;
      blast_radius?: unknown;
      ambiguity_policy?: unknown;
    };
    const nowIso = new Date().toISOString();
    const contractIntent =
      typeof cj.intent === "string" && cj.intent.trim()
        ? cj.intent.trim().slice(0, 2000)
        : source.trim().slice(0, 2000);
    const budgetEstimate =
      typeof cj.budget_estimate === "string" ? cj.budget_estimate.trim().slice(0, 200) : null;
    const blastRadius =
      typeof cj.blast_radius === "string" ? cj.blast_radius.trim().slice(0, 500) : null;
    const contract: OutcomeContract = {
      version: 1,
      intent: contractIntent,
      evidence_links: citations.map((c) => ({
        source_kind: c.source_kind,
        source_id: c.source_id ?? "",
        title: c.title,
      })),
      success_metrics: draftedStrings(cj.success_metrics, 8).map((t) => draftedClause(t, nowIso)),
      non_goals: draftedStrings(cj.non_goals, 6).map((t) => draftedClause(t, nowIso)),
      budget:
        budgetEstimate || blastRadius
          ? { estimate: budgetEstimate, blast_radius: blastRadius }
          : null,
      ambiguity_policy:
        typeof cj.ambiguity_policy === "string" ? cj.ambiguity_policy.trim().slice(0, 1000) : null,
      drafted_by: "agent",
      drafted_at: nowIso,
    };

    const { data: prd, error: pErr } = await supabase
      .from("prds")
      .insert({
        user_id: userId,
        opportunity_id: oppId,
        title,
        body_md,
        model: data.model,
        citations,
        contract,
        contract_migrated_at: nowIso,
      })
      .select()
      .single();
    if (pErr) throw new Error(pErr.message);
    if (prd) {
      // SEAM-1: stage history for the created spec (DB default status is draft).
      await recordStageEvent(supabase, {
        entityType: "spec",
        entityId: prd.id,
        from: null,
        to: prd.status ?? "draft",
        actor: "human",
        workspaceId: prd.workspace_id,
        userId,
      });
    }
    if (prd && oppId) {
      await recordLineage(supabase, userId, {
        parent_kind: "opportunity",
        parent_id: oppId,
        child_kind: "prd",
        child_id: prd.id,
        rationale: "Generated spec from opportunity",
        created_by_agent: "prd-writer",
      });
    }
    if (prd) {
      await runCritic(supabase, userId, { kind: "prd", id: prd.id });
    }
    return { prd };
  });

/** AI: rewrite/expand/critique a selection within a PRD. */
export const prdAssist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        action: z.enum(["rewrite", "expand", "critique", "shorten"]),
        selection: z.string().min(2).max(8000),
        context: z.string().max(8000).optional(),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const verb: Record<typeof data.action, string> = {
      rewrite:
        "Rewrite the selection to be sharper, more concrete, and easier to scan. Keep meaning.",
      expand: "Expand the selection with helpful detail, examples, and edge cases. Stay terse.",
      critique:
        "Critique the selection: assumptions, missing risks, weak metrics. Return as bullets.",
      shorten: "Shorten the selection by ~50% without losing meaning.",
    };
    const result = await callModel(supabase, userId, {
      surface: "prd",
      surface_ref: `assist:${data.action}`,
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You are a senior PM editor. Return Markdown only." },
        {
          role: "user",
          content: `${verb[data.action]}\n\n---\n${data.selection}\n---\n\nSurrounding context (optional):\n${data.context ?? ""}`,
        },
      ],
    });
    return { text: result.output };
  });

/** AI: promote a single signal directly into an opportunity (skips the theme step). */
export const promoteSignalToOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ signal_id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: signal, error } = await supabase
      .from("signals")
      .select("id, content, source, project_id")
      .eq("id", data.signal_id)
      .single();
    if (error || !signal) throw new Error("Signal not found");

    const system = `You convert a single user signal into a sharp product opportunity.
Return STRICT JSON only:
{"title":"...max 80 chars...","problem":"...1-2 sentences...","target_user":"...","hypothesis":"If we ... then ... measured by ...","impact":1-10,"confidence":1-10,"ease":1-10}`;

    const result = await callModel(supabase, userId, {
      surface: "discovery",
      surface_ref: `promote_signal:${signal.id}`,
      model: "google/gemini-2.5-flash",
      fallbackModel: "google/gemini-2.5-flash-lite",
      responseFormat: "json_object",
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Signal (${signal.source}): ${signal.content}` },
      ],
    });
    const parsed = (result.json ?? {}) as {
      title?: string;
      problem?: string;
      target_user?: string;
      hypothesis?: string;
      impact?: number;
      confidence?: number;
      ease?: number;
    };
    if (!parsed.title) throw new Error("AI returned no opportunity");
    const clamp = (n: unknown, fb: number) => {
      const v = Math.round(Number(n));
      return Number.isFinite(v) ? Math.min(10, Math.max(1, v)) : fb;
    };
    const { data: opp, error: oErr } = await supabase
      .from("opportunities")
      .insert({
        user_id: userId,
        title: parsed.title.slice(0, 200),
        problem: (parsed.problem ?? signal.content).slice(0, 2000),
        target_user: parsed.target_user?.slice(0, 200) ?? null,
        hypothesis: parsed.hypothesis?.slice(0, 1000) ?? null,
        impact: clamp(parsed.impact, 5),
        confidence: clamp(parsed.confidence, 5),
        ease: clamp(parsed.ease, 5),
        project_id: signal.project_id ?? null,
      })
      .select()
      .single();
    if (oErr) throw new Error(oErr.message);
    if (opp) {
      // SEAM-1: stage history for the created opportunity.
      await recordStageEvent(supabase, {
        entityType: "opportunity",
        entityId: opp.id,
        from: null,
        to: opp.status ?? "backlog",
        actor: "human",
        workspaceId: opp.workspace_id,
        userId,
      });
      // SW-5 chain audit: fail-soft, same reasoning as promoteThemeToOpportunity.
      await recordLineageSafe(supabase, userId, {
        parent_kind: "signal",
        parent_id: signal.id,
        child_kind: "opportunity",
        child_id: opp.id,
        rationale: "Promoted directly from signal",
        created_by_agent: "discovery-scout",
      });
      await runCritic(supabase, userId, { kind: "opportunity", id: opp.id });
    }
    return { opportunity: opp };
  });
